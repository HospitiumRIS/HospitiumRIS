import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    // Development bypass for authentication
    let currentUser = null;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Development mode: Bypassing authentication for donations API');
      // Create a mock user for development
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

      // Verify user exists and is active
      currentUser = await prisma.user.findUnique({
        where: { id: sessionCookie.value },
      });

      if (!currentUser || currentUser.status !== 'ACTIVE' || !currentUser.emailVerified) {
        return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
      }

      // Only allow foundation admins to access this endpoint
      if (currentUser.accountType !== 'FOUNDATION_ADMIN') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Parse query parameters for filtering and pagination
    const url = new URL(request.url);
    const campaignId = url.searchParams.get('campaignId');
    const donorEmail = url.searchParams.get('donorEmail');
    const status = url.searchParams.get('status');
    const paymentMethod = url.searchParams.get('paymentMethod');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const minAmount = url.searchParams.get('minAmount');
    const maxAmount = url.searchParams.get('maxAmount');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const sortBy = url.searchParams.get('sortBy') || 'donationDate';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    const stats = url.searchParams.get('stats') === 'true';

    // Build where clause for filtering
    const whereClause = {};
    if (campaignId) whereClause.campaignId = campaignId;
    if (donorEmail) whereClause.donorEmail = { contains: donorEmail, mode: 'insensitive' };
    if (status) whereClause.status = status;
    if (paymentMethod) whereClause.paymentMethod = paymentMethod;
    
    // Date range filtering
    if (startDate || endDate) {
      whereClause.donationDate = {};
      if (startDate) whereClause.donationDate.gte = new Date(startDate);
      if (endDate) whereClause.donationDate.lte = new Date(endDate);
    }

    // Amount range filtering
    if (minAmount || maxAmount) {
      whereClause.amount = {};
      if (minAmount) whereClause.amount.gte = parseFloat(minAmount);
      if (maxAmount) whereClause.amount.lte = parseFloat(maxAmount);
    }

    // If stats are requested, return aggregated data
    if (stats) {
      const [
        totalDonations,
        totalAmount,
        averageAmount,
        donorCount,
        paymentMethodStats,
        statusStats,
        monthlyStats,
        amountRangeStats
      ] = await Promise.all([
        // Total donations count
        prisma.donation.count({ where: whereClause }),
        
        // Total amount
        prisma.donation.aggregate({
          where: whereClause,
          _sum: { amount: true }
        }),
        
        // Average amount
        prisma.donation.aggregate({
          where: whereClause,
          _avg: { amount: true }
        }),
        
        // Unique donor count
        prisma.donation.groupBy({
          by: ['donorEmail'],
          where: whereClause,
          _count: { _all: true }
        }),
        
        // Payment method breakdown
        prisma.donation.groupBy({
          by: ['paymentMethod'],
          where: whereClause,
          _count: { _all: true },
          _sum: { amount: true }
        }),
        
        // Status breakdown
        prisma.donation.groupBy({
          by: ['status'],
          where: whereClause,
          _count: { _all: true },
          _sum: { amount: true }
        }),
        
        // Monthly stats for the last 12 months
        prisma.$queryRaw`
          SELECT 
            DATE_TRUNC('month', "donationDate") as month,
            COUNT(*)::int as count,
            SUM("amount")::float as total
          FROM "donations" 
          WHERE "donationDate" >= NOW() - INTERVAL '12 months'
          ${campaignId ? `AND "campaignId" = ${campaignId}` : ''}
          GROUP BY DATE_TRUNC('month', "donationDate")
          ORDER BY month DESC
        `,
        
        // Amount range statistics
        prisma.$queryRaw`
          SELECT 
            CASE 
              WHEN "amount" < 100 THEN 'under_100'
              WHEN "amount" >= 100 AND "amount" < 500 THEN '100_to_500'
              WHEN "amount" >= 500 AND "amount" < 1000 THEN '500_to_1000'
              ELSE 'over_1000'
            END as range,
            COUNT(*)::int as count,
            SUM("amount")::float as total
          FROM "donations"
          ${campaignId ? 'WHERE "campaignId" = $1' : 'WHERE 1=1'}
          GROUP BY range
        `
      ]);

      return NextResponse.json({
        success: true,
        stats: {
          totalDonations: totalDonations,
          totalAmount: Number(totalAmount._sum.amount || 0),
          averageAmount: Number(averageAmount._avg.amount || 0),
          uniqueDonors: donorCount.length,
          paymentMethods: paymentMethodStats.reduce((acc, stat) => {
            acc[stat.paymentMethod || 'Unknown'] = {
              count: stat._count._all,
              total: Number(stat._sum.amount || 0)
            };
            return acc;
          }, {}),
          statuses: statusStats.reduce((acc, stat) => {
            acc[stat.status] = {
              count: stat._count._all,
              total: Number(stat._sum.amount || 0)
            };
            return acc;
          }, {}),
          monthlyTrends: monthlyStats,
          amountRanges: amountRangeStats.reduce((acc, stat) => {
            acc[stat.range] = {
              count: stat.count,
              total: stat.total
            };
            return acc;
          }, {})
        }
      });
    }

    // Build order by clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    // Fetch donations with related data
    const donations = await prisma.donation.findMany({
      where: whereClause,
      include: {
        campaign: {
          include: {
            category: true
          }
        }
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit
    });

    // Get total count for pagination
    const totalCount = await prisma.donation.count({
      where: whereClause
    });

    // Process donations with additional computed fields
    const processedDonations = donations.map(donation => ({
      ...donation,
      // Convert Decimal to number for JSON serialization
      amount: Number(donation.amount),
      // Add campaign context if available
      campaignName: donation.campaign?.name || null,
      categoryName: donation.campaign?.category?.name || null,
      categoryColor: donation.campaign?.category?.color || null,
      // Date helpers
      formattedDate: donation.donationDate.toLocaleDateString(),
      formattedAmount: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(Number(donation.amount)),
      // Donor anonymity
      displayName: donation.isAnonymous ? 'Anonymous Donor' : donation.donorName
    }));

    return NextResponse.json({
      success: true,
      donations: processedDonations,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching donations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch donations' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('hospitium_session');
    
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify user exists and is active
    const currentUser = await prisma.user.findUnique({
      where: { id: sessionCookie.value },
    });

    if (!currentUser || currentUser.status !== 'ACTIVE' || !currentUser.emailVerified) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Only allow foundation admins to create donations
    if (currentUser.accountType !== 'FOUNDATION_ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { 
      campaignId,
      donorName,
      donorEmail,
      donorPhone,
      donorType,
      amount,
      donationDate,
      paymentMethod,
      transactionId,
      status,
      message,
      isAnonymous,
      taxDeductible
    } = body;

    // Validate required fields
    if (!donorName || !amount) {
      return NextResponse.json(
        { success: false, error: 'Donor name and amount are required' },
        { status: 400 }
      );
    }

    // Validate amount is positive
    const donationAmount = parseFloat(amount);
    if (isNaN(donationAmount) || donationAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    // Validate campaign exists if provided
    if (campaignId) {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId }
      });

      if (!campaign) {
        return NextResponse.json(
          { success: false, error: 'Campaign not found' },
          { status: 404 }
        );
      }
    }

    // Validate email format if provided
    if (donorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorEmail)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Create donation using transaction to update campaign totals
    const result = await prisma.$transaction(async (tx) => {
      // Create the donation
      const newDonation = await tx.donation.create({
        data: {
          campaignId: campaignId || null,
          donorName: donorName.trim(),
          donorEmail: donorEmail?.trim() || null,
          donorPhone: donorPhone?.trim() || null,
          donorType: donorType || 'Individual',
          amount: donationAmount,
          donationDate: donationDate ? new Date(donationDate) : new Date(),
          paymentMethod: paymentMethod || 'Credit Card',
          transactionId: transactionId?.trim() || null,
          status: status || 'Completed',
          message: message?.trim() || null,
          isAnonymous: Boolean(isAnonymous),
          taxDeductible: Boolean(taxDeductible ?? true)
        },
        include: {
          campaign: {
            include: {
              category: true
            }
          }
        }
      });

      // Update campaign totals if campaign is specified and donation is completed
      if (campaignId && (status || 'Completed') === 'Completed') {
        // Get current campaign stats
        const campaignStats = await tx.donation.aggregate({
          where: {
            campaignId,
            status: 'Completed'
          },
          _sum: { amount: true },
          _count: { _all: true }
        });

        // Get unique donor count for this campaign
        const uniqueDonors = await tx.donation.groupBy({
          by: ['donorEmail', 'donorName'],
          where: {
            campaignId,
            status: 'Completed'
          },
          _count: { _all: true }
        });

        // Update campaign with new totals
        await tx.campaign.update({
          where: { id: campaignId },
          data: {
            raisedAmount: Number(campaignStats._sum.amount || 0),
            donationCount: campaignStats._count || 0,
            donorCount: uniqueDonors.length
          }
        });
      }

      return newDonation;
    });

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        amount: Number(result.amount),
        campaignName: result.campaign?.name || null,
        categoryName: result.campaign?.category?.name || null,
        categoryColor: result.campaign?.category?.color || null,
        formattedDate: result.donationDate.toLocaleDateString(),
        formattedAmount: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(Number(result.amount)),
        displayName: result.isAnonymous ? 'Anonymous Donor' : result.donorName
      },
      message: 'Donation created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating donation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create donation' },
      { status: 500 }
    );
  }
}
