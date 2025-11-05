import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    // Development bypass for authentication
    let currentUser = null;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Development mode: Bypassing authentication for analytics API');
      currentUser = {
        id: 'dev-user',
        accountType: 'FOUNDATION_ADMIN',
        status: 'ACTIVE',
        emailVerified: true
      };
    } else {
      // Production authentication
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get('hospitium_session');
      
      if (!sessionCookie?.value) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }

      currentUser = await prisma.user.findUnique({
        where: { id: sessionCookie.value },
      });

      if (!currentUser || currentUser.status !== 'ACTIVE' || !currentUser.emailVerified) {
        return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
      }

      if (currentUser.accountType !== 'FOUNDATION_ADMIN') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Parse query parameters for filtering
    const url = new URL(request.url);
    const campaignId = url.searchParams.get('campaignId');
    const categoryId = url.searchParams.get('categoryId');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Build where clause for filtering
    const donationWhere = {};
    if (campaignId) donationWhere.campaignId = campaignId;
    if (startDate || endDate) {
      donationWhere.donationDate = {};
      if (startDate) donationWhere.donationDate.gte = new Date(startDate);
      if (endDate) donationWhere.donationDate.lte = new Date(endDate);
    }

    // Add category filter if specified
    if (categoryId) {
      donationWhere.campaign = {
        categoryId: categoryId
      };
    }

    console.log('Analytics API - Where clause:', JSON.stringify(donationWhere, null, 2));

    // Execute all queries in parallel for maximum performance
    const [
      // Basic donation statistics
      donationStats,
      totalAmount,
      avgAmount,
      
      // Donor analysis
      donorDonations,
      donorTypeStatsGroupBy,
      
      // Campaign and category performance
      campaignStats,
      categoryStats,
      
      // Time-based analysis
      monthlyTrends,
      
      // Payment method analysis
      paymentMethodStats,
      
      // Top performers
      topDonors,
      topCampaigns
    ] = await Promise.all([
      // Total donations count
      prisma.donation.count({ where: donationWhere }),
      
      // Total amount
      prisma.donation.aggregate({
        where: donationWhere,
        _sum: { amount: true }
      }),
      
      // Average amount
      prisma.donation.aggregate({
        where: donationWhere,
        _avg: { amount: true }
      }),
      
      // Get all donations for donor count calculation (filtered)
      prisma.donation.findMany({
        where: donationWhere,
        select: {
          donorEmail: true,
          donorName: true,
          isAnonymous: true,
          id: true
        }
      }),
      
      // Donor type breakdown
      prisma.donation.groupBy({
        by: ['donorType'],
        where: donationWhere,
        _count: { _all: true },
        _sum: { amount: true }
      }),
      
      // Campaign performance (limit to top 20 for performance)
      prisma.campaign.findMany({
        where: categoryId ? { categoryId } : {},
        include: {
          category: true,
          donations: {
            where: {
              ...(startDate || endDate ? {
                donationDate: {
                  ...(startDate && { gte: new Date(startDate) }),
                  ...(endDate && { lte: new Date(endDate) })
                }
              } : {})
            }
          }
        },
        take: 20
      }),
      
      // Category performance
      prisma.campaignCategory.findMany({
        include: {
          campaigns: {
            include: {
              donations: {
                where: {
                  ...(startDate || endDate ? {
                    donationDate: {
                      ...(startDate && { gte: new Date(startDate) }),
                      ...(endDate && { lte: new Date(endDate) })
                    }
                  } : {})
                }
              }
            }
          }
        }
      }),
      
      // Monthly trends for last 12 months
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "donationDate") as month,
          COUNT(*)::int as count,
          SUM("amount")::float as total,
          COUNT(DISTINCT 
            CASE 
              WHEN "isAnonymous" = true THEN CONCAT('anonymous-', id::text)
              ELSE COALESCE("donorEmail", "donorName")
            END
          )::int as donors
        FROM "donations" 
        WHERE "donationDate" >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', "donationDate")
        ORDER BY month DESC
        LIMIT 12
      `,
      
      // Payment method breakdown
      prisma.donation.groupBy({
        by: ['paymentMethod'],
        where: donationWhere,
        _count: { _all: true },
        _sum: { amount: true }
      }),
      
      // Top 20 donors by total amount
      prisma.$queryRaw`
        SELECT 
          "donorName",
          "donorEmail", 
          "donorType",
          "isAnonymous",
          COUNT(*)::int as donation_count,
          SUM("amount")::float as total_amount,
          AVG("amount")::float as avg_amount,
          MIN("donationDate") as first_donation,
          MAX("donationDate") as last_donation,
          COUNT(DISTINCT "campaignId")::int as campaigns
        FROM "donations"
        WHERE 1=1
        GROUP BY "donorName", "donorEmail", "donorType", "isAnonymous"
        ORDER BY total_amount DESC
        LIMIT 20
      `,
      
      // Top campaigns by raised amount
      prisma.$queryRaw`
        SELECT 
          c.id,
          c.name,
          c."targetAmount"::float as target_amount,
          c.status,
          c."startDate" as start_date,
          c."endDate" as end_date,
          cat.name as category_name,
          cat.color as category_color,
          COALESCE(SUM(d.amount), 0)::float as raised,
          COUNT(d.id)::int as donation_count,
          COUNT(DISTINCT 
            CASE 
              WHEN d."isAnonymous" = true THEN CONCAT('anonymous-', d.id::text)
              ELSE COALESCE(d."donorEmail", d."donorName")
            END
          )::int as donor_count
        FROM campaigns c
        LEFT JOIN "campaign_categories" cat ON c."categoryId" = cat.id
        LEFT JOIN donations d ON c.id = d."campaignId"
        GROUP BY c.id, c.name, c."targetAmount", c.status, c."startDate", c."endDate", cat.name, cat.color
        ORDER BY raised DESC
        LIMIT 15
      `
    ]);

    // Process campaign performance data
    const processedCampaigns = campaignStats.map(campaign => {
      const campaignDonations = campaign.donations || [];
      const raised = campaignDonations.reduce((sum, d) => sum + Number(d.amount), 0);
      const donorCount = new Set(
        campaignDonations.map(d => d.isAnonymous ? `anonymous-${d.id}` : d.donorEmail || d.donorName)
      ).size;
      
      return {
        id: campaign.id,
        name: campaign.name,
        raised,
        donorCount,
        donationCount: campaignDonations.length,
        avgDonation: campaignDonations.length > 0 ? raised / campaignDonations.length : 0,
        targetAmount: Number(campaign.targetAmount || 0),
        completionPercentage: campaign.targetAmount ? (raised / Number(campaign.targetAmount)) * 100 : 0,
        categoryName: campaign.category?.name || 'Unknown',
        categoryColor: campaign.category?.color || '#8b6cbc',
        status: campaign.status,
        startDate: campaign.startDate,
        endDate: campaign.endDate
      };
    });

    // Process category performance data
    const processedCategories = categoryStats.map(category => {
      const categoryDonations = category.campaigns.flatMap(c => c.donations || []);
      const raised = categoryDonations.reduce((sum, d) => sum + Number(d.amount), 0);
      const donorCount = new Set(
        categoryDonations.map(d => d.isAnonymous ? `anonymous-${d.id}` : d.donorEmail || d.donorName)
      ).size;
      
      return {
        id: category.id,
        name: category.name,
        color: category.color || '#8b6cbc',
        raised,
        donorCount,
        donationCount: categoryDonations.length,
        campaignCount: category.campaigns.length,
        avgDonationPerCampaign: category.campaigns.length > 0 ? raised / category.campaigns.length : 0
      };
    });

    // Calculate unique donor count from the filtered donations
    const uniqueDonorCount = new Set(
      donorDonations.map(d => d.isAnonymous ? `anonymous-${d.id}` : d.donorEmail || d.donorName)
    ).size;

    // Filter donor data based on date range since raw SQL doesn't filter properly
    let filteredDonors = topDonors;
    if (startDate || endDate) {
      filteredDonors = topDonors.filter(donor => {
        const firstDonation = new Date(donor.first_donation);
        const lastDonation = new Date(donor.last_donation);
        
        if (startDate && endDate) {
          return firstDonation >= new Date(startDate) || lastDonation >= new Date(startDate);
        } else if (startDate) {
          return lastDonation >= new Date(startDate);
        } else if (endDate) {
          return firstDonation <= new Date(endDate);
        }
        return true;
      });
    }

    // Calculate retention metrics
    const oneTimeDonors = filteredDonors.filter(d => d.donation_count === 1).length;
    const returningDonors = filteredDonors.filter(d => d.donation_count > 1 && d.donation_count < 5).length;
    const loyalDonors = filteredDonors.filter(d => d.donation_count >= 5).length;
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const newDonors = filteredDonors.filter(d => new Date(d.first_donation) > sixMonthsAgo).length;

    // Build comprehensive response
    const analyticsData = {
      overview: {
        totalDonations: donationStats,
        totalAmount: Number(totalAmount._sum.amount || 0),
        uniqueDonors: uniqueDonorCount,
        avgDonation: Number(avgAmount._avg.amount || 0),
        categories: categoryStats.length,
        campaigns: campaignStats.length,
        retentionRate: filteredDonors.length > 0 ? ((filteredDonors.length - oneTimeDonors) / filteredDonors.length) * 100 : 0,
        averageDonorValue: uniqueDonorCount > 0 ? Number(totalAmount._sum.amount || 0) / uniqueDonorCount : 0
      },
      
      campaignPerformance: processedCampaigns.sort((a, b) => b.raised - a.raised),
      
      categoryPerformance: processedCategories.sort((a, b) => b.raised - a.raised),
      
      monthlyTrends: monthlyTrends.map(trend => ({
        month: new Date(trend.month).toISOString().substring(0, 7), // YYYY-MM format
        monthName: new Date(trend.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        amount: Number(trend.total || 0),
        count: trend.count || 0,
        donors: trend.donors || 0,
        avgDonation: trend.count > 0 ? Number(trend.total || 0) / trend.count : 0
      })),
      
      topDonors: filteredDonors.slice(0, 20).map(donor => ({
        name: donor.isAnonymous ? 'Anonymous Donor' : donor.donorName,
        email: donor.donorEmail,
        type: donor.donorType,
        isAnonymous: donor.isAnonymous,
        totalAmount: Number(donor.total_amount || 0),
        donationCount: donor.donation_count || 0,
        averageAmount: Number(donor.avg_amount || 0),
        campaigns: donor.campaigns || 0,
        firstDonation: donor.first_donation,
        lastDonation: donor.last_donation,
        donationFrequency: donor.first_donation && donor.last_donation ? 
          (donor.donation_count || 0) / Math.max(1, Math.ceil((new Date(donor.last_donation) - new Date(donor.first_donation)) / (30 * 24 * 60 * 60 * 1000))) : 0
      })),
      
      paymentMethods: paymentMethodStats.reduce((acc, stat) => {
        acc[stat.paymentMethod || 'Unknown'] = {
          count: stat._count._all,
          amount: Number(stat._sum.amount || 0)
        };
        return acc;
      }, {}),
      
      donorTypes: donorTypeStatsGroupBy.reduce((acc, stat) => {
        acc[stat.donorType || 'Unknown'] = {
          count: stat._count._all,
          amount: Number(stat._sum.amount || 0)
        };
        return acc;
      }, {}),
      
      donorTypeAnalysis: donorTypeStatsGroupBy.reduce((acc, stat) => {
        acc[stat.donorType || 'Unknown'] = {
          count: stat._count._all,
          amount: Number(stat._sum.amount || 0),
          uniqueDonors: stat._count._all // This is approximate, could be more accurate with additional query
        };
        return acc;
      }, {}),
      
      retentionAnalysis: {
        newDonors,
        returningDonors,
        loyalDonors,
        oneTimeDonors
      },
      
      // Include essential raw data for modals (limited for performance)
      rawData: {
        donations: [], // Don't include all donations for performance
        categories: categoryStats.map(c => ({ id: c.id, name: c.name, color: c.color })),
        campaigns: campaignStats.map(c => ({ 
          id: c.id, 
          name: c.name, 
          categoryId: c.categoryId,
          targetAmount: c.targetAmount,
          status: c.status 
        }))
      }
    };

    return NextResponse.json({
      success: true,
      data: analyticsData,
      generatedAt: new Date().toISOString(),
      filters: {
        campaignId,
        categoryId,
        startDate,
        endDate
      }
    });

  } catch (error) {
    console.error('Error generating analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate analytics data' },
      { status: 500 }
    );
  }
}
