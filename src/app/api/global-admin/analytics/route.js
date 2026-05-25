import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthenticatedUser } from '@/lib/auth-server';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    // Check authentication and authorization
    const currentUser = await getAuthenticatedUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (currentUser.accountType !== 'GLOBAL_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Global Admin access required' },
        { status: 403 }
      );
    }

    // Get analytics data
    const [
      totalUsers,
      totalInstitutions,
      totalPublications,
      totalProposals,
      totalTrainings,
      totalManuscripts,
      activeUsers,
      recentUsers,
      usersByType,
      institutionsByType,
      publicationsByMonth,
      proposalsByStatus
    ] = await Promise.all([
      // Total counts
      prisma.user.count(),
      prisma.institution.count(),
      prisma.publication.count(),
      prisma.proposal.count(),
      prisma.training.count(),
      prisma.manuscript.count(),
      
      // Active users (logged in last 30 days)
      prisma.user.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Recent users (created last 30 days)
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Users by account type
      prisma.user.groupBy({
        by: ['accountType'],
        _count: true
      }),
      
      // Institutions by type
      prisma.institution.groupBy({
        by: ['type'],
        _count: true
      }),
      
      // Publications by month (last 6 months)
      prisma.publication.groupBy({
        by: ['createdAt'],
        _count: true,
        where: {
          createdAt: {
            gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Proposals by status
      prisma.proposal.groupBy({
        by: ['status'],
        _count: true
      })
    ]);

    // Process publications by month
    const monthlyPublications = {};
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyPublications[monthKey] = 0;
      last6Months.push({
        month: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
        count: 0
      });
    }

    publicationsByMonth.forEach(pub => {
      const date = new Date(pub.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyPublications[monthKey] !== undefined) {
        const monthIndex = last6Months.findIndex(m => {
          const mDate = new Date(pub.createdAt);
          return m.month === mDate.toLocaleString('default', { month: 'short', year: 'numeric' });
        });
        if (monthIndex !== -1) {
          last6Months[monthIndex].count += pub._count;
        }
      }
    });

    // Format user types
    const userTypeData = usersByType.map(item => ({
      type: item.accountType || 'Unknown',
      count: item._count
    }));

    // Format institution types
    const institutionTypeData = institutionsByType.map(item => ({
      type: item.type || 'Unknown',
      count: item._count
    }));

    // Format proposal status
    const proposalStatusData = proposalsByStatus.map(item => ({
      status: item.status || 'Unknown',
      count: item._count
    }));

    // Calculate growth rates (comparing to previous 30 days)
    const previousPeriodStart = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const previousPeriodEnd = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const previousUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: previousPeriodStart,
          lt: previousPeriodEnd
        }
      }
    });

    const userGrowthRate = previousUsers > 0 
      ? ((recentUsers - previousUsers) / previousUsers * 100).toFixed(1)
      : 100;

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalInstitutions,
          totalPublications,
          totalProposals,
          totalTrainings,
          totalManuscripts,
          activeUsers,
          recentUsers,
          userGrowthRate: parseFloat(userGrowthRate)
        },
        usersByType: userTypeData,
        institutionsByType: institutionTypeData,
        publicationTrend: last6Months,
        proposalsByStatus: proposalStatusData
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
