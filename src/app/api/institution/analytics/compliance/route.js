import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const [
      allProposals,
      proposalsWithEthics,
      approvedEthics,
      pendingEthics,
      rejectedEthics,
      proposalsWithDataPlan,
      proposalsWithConsent
    ] = await Promise.all([
      prisma.proposal.count({
        where: dateFilter
      }),

      prisma.proposal.findMany({
        where: {
          ethicsApprovalStatus: {
            not: null
          },
          ...dateFilter
        },
        select: {
          id: true,
          title: true,
          principalInvestigator: true,
          departments: true,
          status: true,
          ethicsApprovalStatus: true,
          ethicsApprovalReference: true,
          ethicsCommittee: true,
          approvalDate: true,
          ethicalConsiderationsOverview: true,
          consentProcedures: true,
          dataSecurityMeasures: true,
          ethicsDocuments: true,
          dataManagementPlan: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          updatedAt: 'desc'
        }
      }),

      prisma.proposal.count({
        where: {
          ethicsApprovalStatus: 'Approved',
          ...dateFilter
        }
      }),

      prisma.proposal.count({
        where: {
          ethicsApprovalStatus: 'Pending',
          ...dateFilter
        }
      }),

      prisma.proposal.count({
        where: {
          ethicsApprovalStatus: 'Rejected',
          ...dateFilter
        }
      }),

      prisma.proposal.count({
        where: {
          dataManagementPlan: {
            isEmpty: false
          },
          ...dateFilter
        }
      }),

      prisma.proposal.count({
        where: {
          consentProcedures: {
            not: null
          },
          ...dateFilter
        }
      })
    ]);

    const ethicsCommittees = proposalsWithEthics.reduce((acc, p) => {
      const committee = p.ethicsCommittee || 'Unknown';
      if (!acc[committee]) {
        acc[committee] = {
          committee,
          totalProposals: 0,
          approved: 0,
          pending: 0,
          rejected: 0
        };
      }
      acc[committee].totalProposals += 1;
      if (p.ethicsApprovalStatus === 'Approved') acc[committee].approved += 1;
      if (p.ethicsApprovalStatus === 'Pending') acc[committee].pending += 1;
      if (p.ethicsApprovalStatus === 'Rejected') acc[committee].rejected += 1;
      return acc;
    }, {});

    const complianceByDepartment = proposalsWithEthics.reduce((acc, p) => {
      const dept = p.departments?.[0] || 'Unknown';
      if (!acc[dept]) {
        acc[dept] = {
          department: dept,
          totalProposals: 0,
          withEthicsApproval: 0,
          withDataPlan: 0,
          withConsent: 0,
          complianceRate: 0
        };
      }
      acc[dept].totalProposals += 1;
      if (p.ethicsApprovalStatus) acc[dept].withEthicsApproval += 1;
      if (p.dataManagementPlan && p.dataManagementPlan.length > 0) acc[dept].withDataPlan += 1;
      if (p.consentProcedures) acc[dept].withConsent += 1;
      return acc;
    }, {});

    Object.values(complianceByDepartment).forEach(dept => {
      const complianceScore = (
        (dept.withEthicsApproval + dept.withDataPlan + dept.withConsent) / 
        (dept.totalProposals * 3)
      ) * 100;
      dept.complianceRate = parseFloat(complianceScore.toFixed(1));
    });

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyEthicsData = await prisma.proposal.findMany({
      where: {
        ethicsApprovalStatus: {
          not: null
        },
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      select: {
        ethicsApprovalStatus: true,
        createdAt: true
      }
    });

    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      
      const monthData = monthlyEthicsData.filter(p => {
        const pDate = new Date(p.createdAt);
        return pDate.getMonth() === date.getMonth() && pDate.getFullYear() === date.getFullYear();
      });

      monthlyTrends.push({
        month: monthStr,
        approved: monthData.filter(p => p.ethicsApprovalStatus === 'Approved').length,
        pending: monthData.filter(p => p.ethicsApprovalStatus === 'Pending').length,
        rejected: monthData.filter(p => p.ethicsApprovalStatus === 'Rejected').length,
        total: monthData.length
      });
    }

    const recentApprovals = proposalsWithEthics
      .filter(p => p.ethicsApprovalStatus === 'Approved' && p.approvalDate)
      .sort((a, b) => new Date(b.approvalDate) - new Date(a.approvalDate))
      .slice(0, 10)
      .map(p => ({
        id: p.id,
        title: p.title,
        principalInvestigator: p.principalInvestigator,
        department: p.departments?.[0] || 'Unknown',
        ethicsCommittee: p.ethicsCommittee,
        approvalDate: p.approvalDate,
        approvalReference: p.ethicsApprovalReference,
        hasDataPlan: p.dataManagementPlan && p.dataManagementPlan.length > 0,
        hasConsent: !!p.consentProcedures
      }));

    const pendingReviews = proposalsWithEthics
      .filter(p => p.ethicsApprovalStatus === 'Pending')
      .map(p => ({
        id: p.id,
        title: p.title,
        principalInvestigator: p.principalInvestigator,
        department: p.departments?.[0] || 'Unknown',
        ethicsCommittee: p.ethicsCommittee,
        submittedDate: p.createdAt,
        hasDataPlan: p.dataManagementPlan && p.dataManagementPlan.length > 0,
        hasConsent: !!p.consentProcedures,
        hasEthicsOverview: !!p.ethicalConsiderationsOverview
      }));

    const complianceRate = allProposals > 0 
      ? ((proposalsWithEthics.length / allProposals) * 100).toFixed(1)
      : 0;

    const approvalRate = proposalsWithEthics.length > 0
      ? ((approvedEthics / proposalsWithEthics.length) * 100).toFixed(1)
      : 0;

    const dataComplianceRate = allProposals > 0
      ? ((proposalsWithDataPlan / allProposals) * 100).toFixed(1)
      : 0;

    const consentComplianceRate = allProposals > 0
      ? ((proposalsWithConsent / allProposals) * 100).toFixed(1)
      : 0;

    // Calculate documentation compliance
    const proposalsWithDocumentation = proposalsWithEthics.filter(p => 
      p.ethicsDocuments && p.ethicsDocuments.length > 0
    ).length;
    const documentationRate = proposalsWithEthics.length > 0
      ? ((proposalsWithDocumentation / proposalsWithEthics.length) * 100).toFixed(1)
      : 0;

    // Calculate review timeline metrics
    const approvedWithDates = proposalsWithEthics.filter(p => 
      p.ethicsApprovalStatus === 'Approved' && p.approvalDate && p.createdAt
    );
    
    let averageReviewTime = 0;
    let fastestReview = 0;
    if (approvedWithDates.length > 0) {
      const reviewTimes = approvedWithDates.map(p => {
        const created = new Date(p.createdAt);
        const approved = new Date(p.approvalDate);
        return Math.floor((approved - created) / (1000 * 60 * 60 * 24)); // days
      });
      averageReviewTime = Math.round(reviewTimes.reduce((sum, time) => sum + time, 0) / reviewTimes.length);
      fastestReview = Math.min(...reviewTimes);
    }

    // Calculate overdue reviews (pending for more than 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const overdueReviews = proposalsWithEthics.filter(p => 
      p.ethicsApprovalStatus === 'Pending' && new Date(p.createdAt) < thirtyDaysAgo
    ).length;

    const analyticsData = {
      overview: {
        totalProposals: allProposals,
        proposalsWithEthics: proposalsWithEthics.length,
        approvedEthics,
        pendingEthics,
        rejectedEthics,
        proposalsWithDataPlan,
        proposalsWithConsent,
        complianceRate: parseFloat(complianceRate),
        approvalRate: parseFloat(approvalRate),
        dataComplianceRate: parseFloat(dataComplianceRate),
        consentComplianceRate: parseFloat(consentComplianceRate)
      },
      complianceRequirements: {
        ethicsApproval: parseFloat(((approvedEthics / allProposals) * 100).toFixed(1)),
        dataManagement: parseFloat(dataComplianceRate),
        informedConsent: parseFloat(consentComplianceRate),
        consentCount: proposalsWithConsent,
        documentation: parseFloat(documentationRate)
      },
      reviewMetrics: {
        averageReviewTime,
        fastestReview,
        overdueReviews
      },
      ethicsCommittees: Object.values(ethicsCommittees).sort((a, b) => b.totalProposals - a.totalProposals),
      complianceByDepartment: Object.values(complianceByDepartment).sort((a, b) => b.complianceRate - a.complianceRate),
      monthlyTrends,
      recentApprovals,
      pendingReviews,
      proposalsWithEthics: proposalsWithEthics.map(p => ({
        id: p.id,
        title: p.title,
        principalInvestigator: p.principalInvestigator,
        department: p.departments?.[0] || 'Unknown',
        status: p.status,
        ethicsApprovalStatus: p.ethicsApprovalStatus,
        ethicsCommittee: p.ethicsCommittee,
        approvalDate: p.approvalDate,
        approvalReference: p.ethicsApprovalReference,
        hasDataPlan: p.dataManagementPlan && p.dataManagementPlan.length > 0,
        hasConsent: !!p.consentProcedures,
        hasDataSecurity: !!p.dataSecurityMeasures,
        ethicsDocumentCount: p.ethicsDocuments ? p.ethicsDocuments.length : 0,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      }))
    };

    return NextResponse.json(analyticsData);

  } catch (error) {
    console.error('Error fetching compliance analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance analytics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
