import { NextResponse } from 'next/server';
import prisma, { ensurePrismaConnected } from '@/lib/prisma';
import {
  requireInstitutionPortalAccess,
  withDateFilter,
  getInstitutionProposalScope,
} from '@/lib/institution-scope';

function emptyProposalWhere() {
  return { id: { equals: '__none__' } };
}

export async function GET(request) {
  try {
    await ensurePrismaConnected();

    const access = await requireInstitutionPortalAccess();
    if (access.error) return access.error;

    const { institution, memberIds, memberWhere, verifiedDomains } = access;
    const proposalIds = await getInstitutionProposalScope(institution, memberIds);
    const proposalScopeWhere = proposalIds.length ? { id: { in: proposalIds } } : emptyProposalWhere();

    const researcherWhere = withDateFilter(
      { AND: [memberWhere, { accountType: 'RESEARCHER' }] },
      {}
    );
    const manuscriptWhere = (dateFilter) =>
      withDateFilter(
        memberIds.length ? { createdBy: { in: memberIds } } : { id: { equals: '__none__' } },
        dateFilter
      );
    const publicationWhere = (dateFilter) =>
      withDateFilter(
        memberIds.length
          ? { authorRelations: { some: { userId: { in: memberIds } } } }
          : { id: { equals: '__none__' } },
        dateFilter
      );
    const proposalWhere = (dateFilter) => withDateFilter(proposalScopeWhere, dateFilter);

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [
      totalUsers,
      totalManuscripts,
      totalProposals,
      draftProposals,
      submittedProposals,
      underReviewProposals,
      approvedProposals,
      rejectedProposals,
      revisionRequestedProposals,
      totalPublications,
      manuscriptsWithCollaborators,
      proposalsWithDetails,
      recentActivity,
      departmentStats,
    ] = await Promise.all([
      prisma.user.count({ where: withDateFilter(researcherWhere, dateFilter) }),
      prisma.manuscript.count({ where: manuscriptWhere(dateFilter) }),
      prisma.proposal.count({ where: proposalWhere(dateFilter) }),
      prisma.proposal.count({ where: withDateFilter({ ...proposalScopeWhere, status: 'DRAFT' }, dateFilter) }),
      prisma.proposal.count({ where: withDateFilter({ ...proposalScopeWhere, status: 'SUBMITTED' }, dateFilter) }),
      prisma.proposal.count({ where: withDateFilter({ ...proposalScopeWhere, status: 'UNDER_REVIEW' }, dateFilter) }),
      prisma.proposal.count({ where: withDateFilter({ ...proposalScopeWhere, status: 'APPROVED' }, dateFilter) }),
      prisma.proposal.count({ where: withDateFilter({ ...proposalScopeWhere, status: 'REJECTED' }, dateFilter) }),
      prisma.proposal.count({ where: withDateFilter({ ...proposalScopeWhere, status: 'REVISION_REQUESTED' }, dateFilter) }),
      prisma.publication.count({ where: publicationWhere(dateFilter) }),
      prisma.manuscript.findMany({
        take: 10,
        orderBy: { updatedAt: 'desc' },
        where: manuscriptWhere(dateFilter),
        include: {
          creator: {
            select: {
              id: true,
              givenName: true,
              familyName: true,
              email: true,
              primaryInstitution: true,
            },
          },
          collaborators: {
            include: {
              user: {
                select: {
                  id: true,
                  givenName: true,
                  familyName: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      prisma.proposal.findMany({
        take: 15,
        orderBy: { createdAt: 'desc' },
        where: proposalWhere(dateFilter),
        select: {
          id: true,
          title: true,
          principalInvestigator: true,
          departments: true,
          status: true,
          totalBudgetAmount: true,
          startDate: true,
          endDate: true,
          abstract: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      Promise.all([
        prisma.manuscript.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          where: manuscriptWhere(dateFilter),
          select: {
            id: true,
            title: true,
            createdAt: true,
            status: true,
            creator: {
              select: {
                givenName: true,
                familyName: true,
              },
            },
          },
        }),
        prisma.proposal.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          where: proposalWhere(dateFilter),
          select: {
            id: true,
            title: true,
            createdAt: true,
            status: true,
            principalInvestigator: true,
          },
        }),
      ]),
      prisma.user.groupBy({
        by: ['primaryInstitution'],
        where: withDateFilter(
          {
            AND: [
              memberWhere,
              { accountType: 'RESEARCHER' },
              { primaryInstitution: { not: null } },
            ],
          },
          dateFilter
        ),
        _count: { id: true },
      }),
    ]);

    const [recentManuscripts, recentProposals] = recentActivity;
    const combinedActivity = [
      ...recentManuscripts.map((entry) => ({
        ...entry,
        type: 'manuscript',
        author: entry.creator
          ? `${entry.creator.givenName} ${entry.creator.familyName}`
          : 'Unknown',
      })),
      ...recentProposals.map((entry) => ({
        ...entry,
        type: 'proposal',
        author: entry.principalInvestigator || 'Unknown',
      })),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [monthlyManuscripts, monthlyProposals] = await Promise.all([
      prisma.manuscript.findMany({
        where: {
          ...manuscriptWhere({}),
          createdAt: { gte: sixMonthsAgo },
        },
        select: { createdAt: true },
      }),
      prisma.proposal.findMany({
        where: {
          ...proposalScopeWhere,
          createdAt: { gte: sixMonthsAgo },
        },
        select: { createdAt: true },
      }),
    ]);

    const monthlyTrends = [];
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

      const manuscriptCount = monthlyManuscripts.filter((entry) => {
        const entryDate = new Date(entry.createdAt);
        return entryDate.getMonth() === date.getMonth() && entryDate.getFullYear() === date.getFullYear();
      }).length;

      const proposalCount = monthlyProposals.filter((entry) => {
        const entryDate = new Date(entry.createdAt);
        return entryDate.getMonth() === date.getMonth() && entryDate.getFullYear() === date.getFullYear();
      }).length;

      monthlyTrends.push({
        month: monthStr,
        manuscripts: manuscriptCount,
        proposals: proposalCount,
        total: manuscriptCount + proposalCount,
      });
    }

    const totalOutput = totalManuscripts + totalProposals + totalPublications;
    const proposalSuccessRate =
      totalProposals > 0 ? ((approvedProposals / totalProposals) * 100).toFixed(1) : 0;

    const researcherOutput = await prisma.user.findMany({
      where: withDateFilter(
        { AND: [memberWhere, { accountType: 'RESEARCHER' }] },
        dateFilter
      ),
      select: {
        id: true,
        givenName: true,
        familyName: true,
        email: true,
        primaryInstitution: true,
        manuscripts: { select: { id: true } },
        publications: { select: { id: true } },
      },
    });

    const proposalCountsByInvestigator = proposalsWithDetails.reduce((acc, proposal) => {
      const key = (proposal.principalInvestigator || '').trim().toLowerCase();
      if (key) acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const topResearchers = researcherOutput
      .map((researcher) => {
        const fullName = `${researcher.givenName} ${researcher.familyName}`.trim();
        return {
          ...researcher,
          name: fullName,
          department: researcher.primaryInstitution || institution.name,
          totalOutput: researcher.manuscripts.length + researcher.publications.length,
          manuscriptCount: researcher.manuscripts.length,
          proposalCount: proposalCountsByInvestigator[fullName.toLowerCase()] || 0,
          publicationCount: researcher.publications.length,
        };
      })
      .sort((a, b) => b.totalOutput - a.totalOutput)
      .slice(0, 10);

    let enhancedDepartmentStats = [];
    try {
      enhancedDepartmentStats = await Promise.all(
        departmentStats.slice(0, 6).map(async (dept) => {
          const deptName = dept.primaryInstitution || 'Unspecified';

          const deptResearchers = await prisma.user.findMany({
            where: {
              AND: [memberWhere, { accountType: 'RESEARCHER' }, { primaryInstitution: deptName }],
            },
            include: {
              manuscripts: { select: { id: true } },
              publications: { select: { id: true } },
            },
          });

          const deptProposals = proposalsWithDetails.filter(
            (proposal) =>
              proposal.departments?.includes(deptName) ||
              proposal.principalInvestigator?.includes(deptName)
          );

          const approvedDeptProposals = deptProposals.filter((entry) => entry.status === 'APPROVED').length;
          const totalDeptProposals = deptProposals.length;

          return {
            name: deptName,
            researcherCount: dept._count.id,
            publicationCount: deptResearchers.reduce((sum, entry) => sum + entry.publications.length, 0),
            manuscriptCount: deptResearchers.reduce((sum, entry) => sum + entry.manuscripts.length, 0),
            proposalCount: totalDeptProposals,
            successRate:
              totalDeptProposals > 0
                ? Math.round((approvedDeptProposals / totalDeptProposals) * 100)
                : 0,
          };
        })
      );
    } catch (statsError) {
      console.error('Error calculating department stats:', statsError);
      enhancedDepartmentStats = departmentStats.slice(0, 6).map((dept) => ({
        name: dept.primaryInstitution || 'Unknown',
        researcherCount: dept._count.id,
        publicationCount: 0,
        manuscriptCount: 0,
        proposalCount: 0,
        successRate: 0,
      }));
    }

    let totalCitations = 0;
    let averageHIndex = 0;
    let activeCollaborations = 0;
    let totalFunding = { _sum: { totalBudgetAmount: 0 } };

    try {
      const institutionResearchers = await prisma.user.findMany({
        where: { AND: [memberWhere, { accountType: 'RESEARCHER' }] },
        select: {
          researchProfile: {
            select: {
              hIndex: true,
              citationCount: true,
            },
          },
        },
      });

      totalCitations = institutionResearchers.reduce(
        (sum, entry) => sum + (entry.researchProfile?.citationCount || 0),
        0
      );
      averageHIndex =
        institutionResearchers.length > 0
          ? Math.round(
              institutionResearchers.reduce(
                (sum, entry) => sum + (entry.researchProfile?.hIndex || 0),
                0
              ) / institutionResearchers.length
            )
          : 0;
    } catch (researcherError) {
      console.error('Error calculating researcher metrics:', researcherError);
    }

    try {
      activeCollaborations = await prisma.manuscript.count({
        where: {
          AND: [
            manuscriptWhere({}),
            { collaborators: { some: {} } },
          ],
        },
      });
    } catch (collabError) {
      console.error('Error counting collaborations:', collabError);
    }

    try {
      totalFunding = await prisma.proposal.aggregate({
        where: withDateFilter({ ...proposalScopeWhere, status: 'APPROVED' }, dateFilter),
        _sum: { totalBudgetAmount: true },
      });
    } catch (fundingError) {
      console.error('Error calculating funding:', fundingError);
    }

    return NextResponse.json({
      institution: {
        id: institution.id,
        name: institution.name,
        verifiedDomains,
      },
      overview: {
        totalResearchers: totalUsers,
        totalManuscripts,
        totalProposals,
        totalPublications,
        totalOutput,
        draftProposals,
        submittedProposals,
        underReviewProposals,
        approvedProposals,
        rejectedProposals,
        revisionRequestedProposals,
        proposalSuccessRate: parseFloat(proposalSuccessRate),
        avgOutputPerResearcher: totalUsers > 0 ? (totalOutput / totalUsers).toFixed(1) : 0,
      },
      monthlyTrends,
      departmentStats: enhancedDepartmentStats,
      impactMetrics: {
        totalCitations,
        averageHIndex,
        activeCollaborations,
        totalFunding: totalFunding._sum.totalBudgetAmount || 0,
      },
      proposalStatus: {
        draft: draftProposals,
        submitted: submittedProposals,
        underReview: underReviewProposals,
        approved: approvedProposals,
        rejected: rejectedProposals,
        revisionRequested: revisionRequestedProposals,
      },
      recentManuscripts: manuscriptsWithCollaborators.map((manuscript) => ({
        id: manuscript.id,
        title: manuscript.title,
        author: manuscript.creator
          ? `${manuscript.creator.givenName} ${manuscript.creator.familyName}`
          : 'Unknown',
        department: manuscript.creator?.primaryInstitution || institution.name,
        status: manuscript.status,
        collaboratorCount: manuscript.collaborators?.length || 0,
        createdAt: manuscript.createdAt,
        updatedAt: manuscript.updatedAt,
        abstract: manuscript.description,
      })),
      recentProposals: proposalsWithDetails.map((proposal) => ({
        id: proposal.id,
        title: proposal.title,
        author: proposal.principalInvestigator || 'Unknown',
        department: proposal.departments?.[0] || institution.name,
        status: proposal.status,
        budget: proposal.totalBudgetAmount,
        startDate: proposal.startDate,
        endDate: proposal.endDate,
        createdAt: proposal.createdAt,
        summary: proposal.abstract,
      })),
      topResearchers,
      recentActivity: combinedActivity,
    });
  } catch (error) {
    console.error('Error fetching institutional analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch institutional analytics' },
      { status: 500 }
    );
  }
}
