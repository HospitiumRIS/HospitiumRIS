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
      proposals,
      grantors,
      grantOpportunities,
      approvedProposals,
      totalProposals
    ] = await Promise.all([
      prisma.proposal.findMany({
        where: {
          totalBudgetAmount: {
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
          totalBudgetAmount: true,
          fundingSource: true,
          fundingInstitution: true,
          grantNumber: true,
          grantStartDate: true,
          grantEndDate: true,
          researchAreas: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          totalBudgetAmount: 'desc'
        }
      }),

      prisma.grantor.findMany({
        include: {
          opportunities: {
            where: {
              status: 'open',
              deadline: {
                gte: new Date()
              }
            }
          },
          _count: {
            select: {
              opportunities: true
            }
          }
        }
      }),

      prisma.grantOpportunity.findMany({
        where: {
          status: 'open',
          deadline: {
            gte: new Date()
          }
        },
        include: {
          grantor: {
            select: {
              name: true,
              type: true,
              country: true
            }
          }
        },
        orderBy: {
          deadline: 'asc'
        }
      }),

      prisma.proposal.findMany({
        where: {
          status: 'APPROVED',
          totalBudgetAmount: {
            not: null
          },
          ...dateFilter
        },
        select: {
          totalBudgetAmount: true,
          fundingSource: true,
          departments: true,
          researchAreas: true
        }
      }),

      prisma.proposal.count({
        where: {
          totalBudgetAmount: {
            not: null
          },
          ...dateFilter
        }
      })
    ]);

    const totalFundingRequested = proposals.reduce((sum, p) => {
      return sum + (parseFloat(p.totalBudgetAmount) || 0);
    }, 0);

    const totalFundingApproved = approvedProposals.reduce((sum, p) => {
      return sum + (parseFloat(p.totalBudgetAmount) || 0);
    }, 0);

    const totalGrantOpportunities = grantOpportunities.reduce((sum, g) => {
      return sum + (parseFloat(g.amount) || 0);
    }, 0);

    const proposalsByStatus = proposals.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});

    const fundingBySource = approvedProposals.reduce((acc, p) => {
      const source = p.fundingSource || 'Unknown';
      if (!acc[source]) {
        acc[source] = {
          source,
          count: 0,
          totalAmount: 0
        };
      }
      acc[source].count += 1;
      acc[source].totalAmount += parseFloat(p.totalBudgetAmount) || 0;
      return acc;
    }, {});

    const fundingByDepartment = approvedProposals.reduce((acc, p) => {
      const dept = p.departments?.[0] || 'Unknown';
      if (!acc[dept]) {
        acc[dept] = {
          department: dept,
          count: 0,
          totalAmount: 0
        };
      }
      acc[dept].count += 1;
      acc[dept].totalAmount += parseFloat(p.totalBudgetAmount) || 0;
      return acc;
    }, {});

    const fundingByResearchArea = approvedProposals.reduce((acc, p) => {
      (p.researchAreas || []).forEach(area => {
        if (!acc[area]) {
          acc[area] = {
            area,
            count: 0,
            totalAmount: 0
          };
        }
        acc[area].count += 1;
        acc[area].totalAmount += parseFloat(p.totalBudgetAmount) || 0;
      });
      return acc;
    }, {});

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyFundingData = await prisma.proposal.findMany({
      where: {
        status: 'APPROVED',
        totalBudgetAmount: {
          not: null
        },
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      select: {
        totalBudgetAmount: true,
        createdAt: true
      }
    });

    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      
      const monthlyAmount = monthlyFundingData
        .filter(p => {
          const pDate = new Date(p.createdAt);
          return pDate.getMonth() === date.getMonth() && pDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum, p) => sum + (parseFloat(p.totalBudgetAmount) || 0), 0);

      monthlyTrends.push({
        month: monthStr,
        amount: monthlyAmount,
        count: monthlyFundingData.filter(p => {
          const pDate = new Date(p.createdAt);
          return pDate.getMonth() === date.getMonth() && pDate.getFullYear() === date.getFullYear();
        }).length
      });
    }

    const grantorsByType = grantors.reduce((acc, g) => {
      acc[g.type] = (acc[g.type] || 0) + 1;
      return acc;
    }, {});

    const upcomingDeadlines = grantOpportunities
      .slice(0, 10)
      .map(opp => ({
        id: opp.id,
        title: opp.title,
        grantorName: opp.grantor.name,
        grantorType: opp.grantor.type,
        amount: parseFloat(opp.amount),
        deadline: opp.deadline,
        category: opp.category,
        eligibility: opp.eligibility,
        country: opp.grantor.country
      }));

    const topProposals = proposals
      .slice(0, 15)
      .map(p => ({
        id: p.id,
        title: p.title,
        principalInvestigator: p.principalInvestigator,
        department: p.departments?.[0] || 'Unknown',
        status: p.status,
        budgetAmount: parseFloat(p.totalBudgetAmount) || 0,
        fundingSource: p.fundingSource,
        fundingInstitution: p.fundingInstitution,
        grantNumber: p.grantNumber,
        startDate: p.grantStartDate,
        endDate: p.grantEndDate,
        researchAreas: p.researchAreas,
        createdAt: p.createdAt
      }));

    const successRate = totalProposals > 0 
      ? ((proposalsByStatus.APPROVED || 0) / totalProposals * 100).toFixed(1)
      : 0;

    const avgProposalAmount = totalProposals > 0
      ? (totalFundingRequested / totalProposals).toFixed(2)
      : 0;

    const analyticsData = {
      overview: {
        totalFundingRequested,
        totalFundingApproved,
        totalGrantOpportunities,
        totalProposals,
        approvedProposals: proposalsByStatus.APPROVED || 0,
        pendingProposals: (proposalsByStatus.SUBMITTED || 0) + (proposalsByStatus.UNDER_REVIEW || 0),
        rejectedProposals: proposalsByStatus.REJECTED || 0,
        successRate: parseFloat(successRate),
        avgProposalAmount: parseFloat(avgProposalAmount),
        activeGrantors: grantors.filter(g => g.status === 'active').length,
        openOpportunities: grantOpportunities.length
      },
      fundingBySource: Object.values(fundingBySource).sort((a, b) => b.totalAmount - a.totalAmount),
      fundingByDepartment: Object.values(fundingByDepartment).sort((a, b) => b.totalAmount - a.totalAmount),
      fundingByResearchArea: Object.values(fundingByResearchArea).sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 10),
      monthlyTrends,
      grantorsByType: Object.entries(grantorsByType).map(([type, count]) => ({ type, count })),
      upcomingDeadlines,
      topProposals,
      grantors: grantors.map(g => ({
        id: g.id,
        name: g.name,
        type: g.type,
        country: g.country,
        focus: g.focus,
        status: g.status,
        activeOpportunities: g.opportunities.length,
        totalOpportunities: g._count.opportunities,
        contactPerson: g.contactPerson,
        email: g.email
      }))
    };

    return NextResponse.json(analyticsData);

  } catch (error) {
    console.error('Error fetching funding analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch funding analytics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
