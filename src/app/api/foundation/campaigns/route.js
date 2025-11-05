import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    // Development bypass for authentication
    let currentUser = null;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Development mode: Bypassing authentication for campaigns API');
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

    // Parse query parameters for filtering and pagination
    const url = new URL(request.url);
    const categoryId = url.searchParams.get('categoryId');
    const status = url.searchParams.get('status');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    // Build where clause for filtering
    const whereClause = {};
    if (categoryId) whereClause.categoryId = categoryId;
    if (status) whereClause.status = status;

    // Build order by clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    // Fetch campaigns with related data
    const campaigns = await prisma.campaign.findMany({
      where: whereClause,
      include: {
        category: true,
        activities: {
          orderBy: {
            date: 'asc'
          }
        },
        donations: {
          orderBy: {
            donationDate: 'desc'
          },
          take: 5 // Latest 5 donations for preview
        },
        _count: {
          select: {
            donations: true,
            activities: true
          }
        }
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit
    });

    // Get total count for pagination
    const totalCount = await prisma.campaign.count({
      where: whereClause
    });

    // Process campaigns with calculated fields
    const processedCampaigns = campaigns.map(campaign => {
      // Calculate actual raised amount from donations
      const actualRaisedAmount = campaign.donations.reduce((sum, donation) => 
        sum + Number(donation.amount), 0
      );

      // Get unique donor count
      const uniqueDonors = new Set(
        campaign.donations.map(d => d.donorEmail || d.donorName || `anonymous-${d.id}`)
      ).size;

      return {
        ...campaign,
        raisedAmount: actualRaisedAmount, // Use calculated amount
        donorCount: uniqueDonors,
        donationCount: campaign._count.donations,
        activityCount: campaign._count.activities,
        preActivities: campaign.activities.filter(a => a.phase === 'Pre-Campaign').length,
        postActivities: campaign.activities.filter(a => a.phase === 'Post-Campaign').length,
        completedActivities: campaign.activities.filter(a => a.status === 'Completed').length,
        // Calculate progress percentage
        progressPercentage: campaign.targetAmount && Number(campaign.targetAmount) > 0 
          ? Math.round((actualRaisedAmount / Number(campaign.targetAmount)) * 100) 
          : 0,
        // Recent donations (limit to 5 for performance)
        recentDonations: campaign.donations.slice(0, 5)
      };
    });

    return NextResponse.json({
      success: true,
      data: processedCampaigns,
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
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch campaigns' },
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

    // Only allow foundation admins to create campaigns
    if (currentUser.accountType !== 'FOUNDATION_ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { 
      categoryId, 
      name, 
      description, 
      targetAmount, 
      startDate, 
      endDate, 
      status 
    } = body;

    // Validate required fields
    if (!categoryId || !name) {
      return NextResponse.json(
        { success: false, error: 'Category ID and campaign name are required' },
        { status: 400 }
      );
    }

    // Validate category exists
    const category = await prisma.campaignCategory.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if campaign name already exists in this category
    const existingCampaign = await prisma.campaign.findFirst({
      where: {
        categoryId,
        name: {
          equals: name,
          mode: 'insensitive'
        }
      }
    });

    if (existingCampaign) {
      return NextResponse.json(
        { success: false, error: 'A campaign with this name already exists in this category' },
        { status: 409 }
      );
    }

    // Validate dates
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      return NextResponse.json(
        { success: false, error: 'Start date must be before end date' },
        { status: 400 }
      );
    }

    // Create new campaign
    const newCampaign = await prisma.campaign.create({
      data: {
        categoryId,
        name: name.trim(),
        description: description?.trim() || null,
        targetAmount: targetAmount ? parseFloat(targetAmount) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: status || 'Planning'
      },
      include: {
        category: true,
        activities: true,
        donations: true,
        _count: {
          select: {
            donations: true,
            activities: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...newCampaign,
        raisedAmount: 0,
        donorCount: 0,
        donationCount: 0,
        activityCount: 0,
        preActivities: 0,
        postActivities: 0,
        completedActivities: 0,
        progressPercentage: 0,
        recentDonations: []
      },
      message: 'Campaign created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}
