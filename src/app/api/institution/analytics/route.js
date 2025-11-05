import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build date filter if provided
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Execute queries in parallel for better performance
    const [
      totalUsers,
      totalManuscripts,
      totalProposals,
      submittedProposals,
      underReviewProposals,
      approvedProposals,
      rejectedProposals,
      totalPublications,
      manuscriptsWithCollaborators,
      proposalsWithDetails,
      recentActivity,
      departmentStats
    ] = await Promise.all([
      // Total researchers (users with researcher account type)
      prisma.user.count({
        where: {
          accountType: 'RESEARCHER',
          ...dateFilter
        }
      }),

      // Total manuscripts
      prisma.manuscript.count({
        where: dateFilter
      }),

      // Total proposals
      prisma.proposal.count({
        where: dateFilter
      }),

      // Proposals by status
      prisma.proposal.count({
        where: {
          status: 'SUBMITTED',
          ...dateFilter
        }
      }),

      prisma.proposal.count({
        where: {
          status: 'UNDER_REVIEW',
          ...dateFilter
        }
      }),

      prisma.proposal.count({
        where: {
          status: 'APPROVED',
          ...dateFilter
        }
      }),

      prisma.proposal.count({
        where: {
          status: 'REJECTED',
          ...dateFilter
        }
      }),

      // Total publications (from researcher publications)
      prisma.publication.count({
        where: dateFilter
      }),

      // Recent manuscripts with collaborator details
      prisma.manuscript.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              givenName: true,
              familyName: true,
              email: true,
              primaryInstitution: true
            }
          },
          collaborators: {
            include: {
              user: {
                select: {
                  id: true,
                  givenName: true,
                  familyName: true,
                  email: true
                }
              }
            }
          }
        },
        where: dateFilter
      }),

      // Recent proposals with details
      prisma.proposal.findMany({
        take: 15,
        orderBy: { createdAt: 'desc' },
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
          updatedAt: true
        },
        where: dateFilter
      }),

      // Recent activity (manuscripts and proposals combined)
      Promise.all([
        prisma.manuscript.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            createdAt: true,
            status: true,
            creator: {
              select: { 
                givenName: true,
                familyName: true 
              }
            }
          },
          where: dateFilter
        }),
        prisma.proposal.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            createdAt: true,
            status: true,
            principalInvestigator: true
          },
          where: dateFilter
        })
      ]),

      // Department statistics
      prisma.user.groupBy({
        by: ['primaryInstitution'],
        where: {
          accountType: 'RESEARCHER',
          primaryInstitution: {
            not: null
          },
          ...dateFilter
        },
        _count: {
          id: true
        }
      })
    ]);

    // Process recent activity
    const [recentManuscripts, recentProposals] = recentActivity;
    const combinedActivity = [
      ...recentManuscripts.map(m => ({
        ...m,
        type: 'manuscript',
        author: m.creator ? `${m.creator.givenName} ${m.creator.familyName}` : 'Unknown'
      })),
      ...recentProposals.map(p => ({
        ...p,
        type: 'proposal',
        author: p.principalInvestigator || 'Unknown'
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);

    // Calculate monthly trends for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyManuscripts = await prisma.manuscript.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      _count: {
        id: true
      }
    });

    const monthlyProposals = await prisma.proposal.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      _count: {
        id: true
      }
    });

    // Process monthly data into chart format
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      
      const manuscriptCount = monthlyManuscripts.filter(m => {
        const mDate = new Date(m.createdAt);
        return mDate.getMonth() === date.getMonth() && mDate.getFullYear() === date.getFullYear();
      }).reduce((sum, item) => sum + item._count.id, 0);

      const proposalCount = monthlyProposals.filter(p => {
        const pDate = new Date(p.createdAt);
        return pDate.getMonth() === date.getMonth() && pDate.getFullYear() === date.getFullYear();
      }).reduce((sum, item) => sum + item._count.id, 0);

      monthlyTrends.push({
        month: monthStr,
        manuscripts: manuscriptCount,
        proposals: proposalCount,
        total: manuscriptCount + proposalCount
      });
    }

    // Calculate performance metrics
    const totalOutput = totalManuscripts + totalProposals + totalPublications;
    const proposalSuccessRate = totalProposals > 0 ? 
      ((approvedProposals / totalProposals) * 100).toFixed(1) : 0;

    // Top researchers by output (Note: proposals not linked to users yet)
    const researcherOutput = await prisma.user.findMany({
      where: {
        accountType: 'RESEARCHER'
      },
      select: {
        id: true,
        givenName: true,
        familyName: true,
        email: true,
        primaryInstitution: true,
        manuscripts: {
          select: { id: true }
        },
        publications: {
          select: { id: true }
        }
      }
    });

    const topResearchers = researcherOutput
      .map(researcher => ({
        ...researcher,
        name: `${researcher.givenName} ${researcher.familyName}`,
        department: researcher.primaryInstitution || 'Unknown',
        totalOutput: researcher.manuscripts.length + researcher.publications.length,
        manuscriptCount: researcher.manuscripts.length,
        proposalCount: 0, // Proposals not linked to users yet
        publicationCount: researcher.publications.length
      }))
      .sort((a, b) => b.totalOutput - a.totalOutput)
      .slice(0, 10);

    const analyticsData = {
      overview: {
        totalResearchers: totalUsers,
        totalManuscripts,
        totalProposals,
        totalPublications,
        totalOutput,
        submittedProposals,
        underReviewProposals,
        approvedProposals,
        rejectedProposals,
        proposalSuccessRate: parseFloat(proposalSuccessRate),
        avgOutputPerResearcher: totalUsers > 0 ? (totalOutput / totalUsers).toFixed(1) : 0
      },
      monthlyTrends,
      departmentStats: departmentStats.map(dept => ({
        department: dept.primaryInstitution || 'Unspecified',
        researcherCount: dept._count.id
      })),
      proposalStatus: {
        submitted: submittedProposals,
        underReview: underReviewProposals,
        approved: approvedProposals,
        rejected: rejectedProposals
      },
      recentManuscripts: manuscriptsWithCollaborators.map(manuscript => ({
        id: manuscript.id,
        title: manuscript.title,
        author: manuscript.creator ? `${manuscript.creator.givenName} ${manuscript.creator.familyName}` : 'Unknown',
        department: manuscript.creator?.primaryInstitution || 'Unknown',
        status: manuscript.status,
        collaboratorCount: manuscript.collaborators?.length || 0,
        createdAt: manuscript.createdAt,
        abstract: manuscript.description
      })),
      recentProposals: proposalsWithDetails.map(proposal => ({
        id: proposal.id,
        title: proposal.title,
        author: proposal.principalInvestigator || 'Unknown',
        department: proposal.departments?.[0] || 'Unknown',
        status: proposal.status,
        budget: proposal.totalBudgetAmount,
        startDate: proposal.startDate,
        endDate: proposal.endDate,
        createdAt: proposal.createdAt,
        summary: proposal.abstract
      })),
      topResearchers,
      recentActivity: combinedActivity
    };

    return NextResponse.json(analyticsData);

  } catch (error) {
    console.error('Error fetching institutional analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch institutional analytics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
