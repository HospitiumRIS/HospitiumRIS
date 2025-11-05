import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
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

    const { id } = params;

    // Fetch specific activity with campaign and category information
    const activity = await prisma.campaignActivity.findUnique({
      where: { id },
      include: {
        campaign: {
          include: {
            category: true,
            activities: {
              where: {
                id: {
                  not: id
                }
              },
              orderBy: {
                date: 'asc'
              },
              take: 10 // Related activities for context
            },
            donations: {
              orderBy: {
                donationDate: 'desc'
              },
              take: 5 // Recent donations for context
            },
            _count: {
              select: {
                donations: true,
                activities: true
              }
            }
          }
        }
      }
    });

    if (!activity) {
      return NextResponse.json(
        { success: false, error: 'Activity not found' },
        { status: 404 }
      );
    }

    // Process activity with additional computed fields and context
    const processedActivity = {
      ...activity,
      // Campaign context
      campaignName: activity.campaign.name,
      categoryName: activity.campaign.category.name,
      categoryColor: activity.campaign.category.color,
      campaignStatus: activity.campaign.status,
      campaignTargetAmount: activity.campaign.targetAmount,
      campaignRaisedAmount: activity.campaign.raisedAmount,
      
      // Date calculations
      isPast: new Date(activity.date) < new Date(),
      isToday: new Date(activity.date).toDateString() === new Date().toDateString(),
      isUpcoming: new Date(activity.date) > new Date(),
      daysFromNow: Math.ceil((new Date(activity.date) - new Date()) / (1000 * 60 * 60 * 24)),
      
      // Campaign statistics for context
      campaignStats: {
        totalActivities: activity.campaign._count.activities,
        totalDonations: activity.campaign._count.donations,
        preActivities: activity.campaign.activities.filter(a => a.phase === 'Pre-Campaign').length + (activity.phase === 'Pre-Campaign' ? 1 : 0),
        postActivities: activity.campaign.activities.filter(a => a.phase === 'Post-Campaign').length + (activity.phase === 'Post-Campaign' ? 1 : 0),
        completedActivities: activity.campaign.activities.filter(a => a.status === 'Completed').length + (activity.status === 'Completed' ? 1 : 0)
      },
      
      // Related activities (same campaign, different from current)
      relatedActivities: activity.campaign.activities.map(relatedActivity => ({
        id: relatedActivity.id,
        title: relatedActivity.title,
        type: relatedActivity.type,
        date: relatedActivity.date,
        status: relatedActivity.status,
        phase: relatedActivity.phase,
        isPast: new Date(relatedActivity.date) < new Date(),
        isToday: new Date(relatedActivity.date).toDateString() === new Date().toDateString(),
        isUpcoming: new Date(relatedActivity.date) > new Date()
      })),
      
      // Recent donations context
      recentDonations: activity.campaign.donations.slice(0, 5)
    };

    return NextResponse.json({
      success: true,
      data: processedActivity
    });

  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
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

    // Only allow foundation admins to update activities
    if (currentUser.accountType !== 'FOUNDATION_ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id } = params;

    // Parse request body
    const body = await request.json();
    const { 
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
    if (!type || !title || !date) {
      return NextResponse.json(
        { success: false, error: 'Type, title, and date are required' },
        { status: 400 }
      );
    }

    // Check if activity exists
    const existingActivity = await prisma.campaignActivity.findUnique({
      where: { id },
      include: {
        campaign: true
      }
    });

    if (!existingActivity) {
      return NextResponse.json(
        { success: false, error: 'Activity not found' },
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

    // Check for conflicts with other activities (if title or date changed)
    if (title !== existingActivity.title || activityDate.getTime() !== existingActivity.date.getTime()) {
      const conflictingActivity = await prisma.campaignActivity.findFirst({
        where: {
          campaignId: existingActivity.campaignId,
          title: {
            equals: title,
            mode: 'insensitive'
          },
          date: activityDate,
          id: {
            not: id
          }
        }
      });

      if (conflictingActivity) {
        return NextResponse.json(
          { success: false, error: 'An activity with this title already exists on this date for this campaign' },
          { status: 409 }
        );
      }
    }

    // Update activity
    const updatedActivity = await prisma.campaignActivity.update({
      where: { id },
      data: {
        type,
        title: title.trim(),
        description: description?.trim() || null,
        date: activityDate,
        time: time || null,
        location: location?.trim() || null,
        attendees: attendees?.trim() || null,
        notes: notes?.trim() || null,
        status: status || existingActivity.status,
        phase: phase || existingActivity.phase
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
        ...updatedActivity,
        campaignName: updatedActivity.campaign.name,
        categoryName: updatedActivity.campaign.category.name,
        categoryColor: updatedActivity.campaign.category.color,
        campaignStatus: updatedActivity.campaign.status,
        isPast: new Date(updatedActivity.date) < new Date(),
        isToday: new Date(updatedActivity.date).toDateString() === new Date().toDateString(),
        isUpcoming: new Date(updatedActivity.date) > new Date(),
        daysFromNow: Math.ceil((new Date(updatedActivity.date) - new Date()) / (1000 * 60 * 60 * 24))
      },
      message: 'Activity updated successfully'
    });

  } catch (error) {
    console.error('Error updating activity:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update activity' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
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

    // Only allow foundation admins to delete activities
    if (currentUser.accountType !== 'FOUNDATION_ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id } = params;

    // Check if activity exists
    const activity = await prisma.campaignActivity.findUnique({
      where: { id },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    });

    if (!activity) {
      return NextResponse.json(
        { success: false, error: 'Activity not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of completed activities in active campaigns (optional business rule)
    if (activity.status === 'Completed' && activity.campaign.status === 'Active') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete completed activities from active campaigns. Consider updating the status instead.' 
        },
        { status: 409 }
      );
    }

    // Delete activity
    await prisma.campaignActivity.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Activity deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting activity:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete activity' },
      { status: 500 }
    );
  }
}
