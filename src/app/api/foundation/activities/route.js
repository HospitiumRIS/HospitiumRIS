import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

export async function GET(request) {
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

    // Only allow foundation admins to access this endpoint
    if (currentUser.accountType !== 'FOUNDATION_ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Parse query parameters for filtering and pagination
    const url = new URL(request.url);
    const campaignId = url.searchParams.get('campaignId');
    const categoryId = url.searchParams.get('categoryId');
    const status = url.searchParams.get('status');
    const phase = url.searchParams.get('phase');
    const type = url.searchParams.get('type');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const sortBy = url.searchParams.get('sortBy') || 'date';
    const sortOrder = url.searchParams.get('sortOrder') || 'asc';

    // Build where clause for filtering
    const whereClause = {};
    if (campaignId) whereClause.campaignId = campaignId;
    if (status) whereClause.status = status;
    if (phase) whereClause.phase = phase;
    if (type) whereClause.type = type;
    
    // Date range filtering
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(startDate);
      if (endDate) whereClause.date.lte = new Date(endDate);
    }

    // Category filtering (requires join through campaign)
    if (categoryId) {
      whereClause.campaign = {
        categoryId: categoryId
      };
    }

    // Build order by clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    // Fetch activities with related data
    const activities = await prisma.campaignActivity.findMany({
      where: whereClause,
      include: {
        campaign: {
          include: {
            category: true,
            _count: {
              select: {
                donations: true
              }
            }
          }
        }
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit
    });

    // Get total count for pagination
    const totalCount = await prisma.campaignActivity.count({
      where: whereClause
    });

    // Process activities with additional computed fields
    const processedActivities = activities.map(activity => ({
      ...activity,
      // Add computed fields
      campaignName: activity.campaign.name,
      categoryName: activity.campaign.category.name,
      categoryColor: activity.campaign.category.color,
      campaignStatus: activity.campaign.status,
      // Date helpers
      isPast: new Date(activity.date) < new Date(),
      isToday: new Date(activity.date).toDateString() === new Date().toDateString(),
      isUpcoming: new Date(activity.date) > new Date(),
      // Days calculation
      daysFromNow: Math.ceil((new Date(activity.date) - new Date()) / (1000 * 60 * 60 * 24))
    }));

    return NextResponse.json({
      success: true,
      data: processedActivities,
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
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activities' },
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

    // Only allow foundation admins to create activities
    if (currentUser.accountType !== 'FOUNDATION_ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { 
      campaignId,
      type,
      title,
      description,
      date,
      time,
      location,
      attendees,
      notes,
      status,
      phase
    } = body;

    // Validate required fields
    if (!campaignId || !type || !title || !date) {
      return NextResponse.json(
        { success: false, error: 'Campaign ID, type, title, and date are required' },
        { status: 400 }
      );
    }

    // Validate campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        category: true
      }
    });

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Validate date is valid
    const activityDate = new Date(date);
    if (isNaN(activityDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Check for duplicate activities on the same date/time for the same campaign
    const existingActivity = await prisma.campaignActivity.findFirst({
      where: {
        campaignId,
        title: {
          equals: title,
          mode: 'insensitive'
        },
        date: activityDate
      }
    });

    if (existingActivity) {
      return NextResponse.json(
        { success: false, error: 'An activity with this title already exists on this date for this campaign' },
        { status: 409 }
      );
    }

    // Create new activity
    const newActivity = await prisma.campaignActivity.create({
      data: {
        campaignId,
        type,
        title: title.trim(),
        description: description?.trim() || null,
        date: activityDate,
        time: time || null,
        location: location?.trim() || null,
        attendees: attendees?.trim() || null,
        notes: notes?.trim() || null,
        status: status || 'Planned',
        phase: phase || 'Pre-Campaign'
      },
      include: {
        campaign: {
          include: {
            category: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...newActivity,
        campaignName: newActivity.campaign.name,
        categoryName: newActivity.campaign.category.name,
        categoryColor: newActivity.campaign.category.color,
        campaignStatus: newActivity.campaign.status,
        isPast: false,
        isToday: new Date(newActivity.date).toDateString() === new Date().toDateString(),
        isUpcoming: new Date(newActivity.date) > new Date(),
        daysFromNow: Math.ceil((new Date(newActivity.date) - new Date()) / (1000 * 60 * 60 * 24))
      },
      message: 'Activity created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create activity' },
      { status: 500 }
    );
  }
}
