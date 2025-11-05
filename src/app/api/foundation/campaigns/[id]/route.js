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

    // Fetch specific campaign with detailed information
    const campaign = await prisma.campaign.findUnique({
      where: { id },
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
          }
        },
        _count: {
          select: {
            donations: true,
            activities: true
          }
        }
      }
    });

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Calculate actual raised amount from donations
    const actualRaisedAmount = campaign.donations.reduce((sum, donation) => 
      sum + Number(donation.amount), 0
    );

    // Get unique donor count and details
    const donorMap = new Map();
    campaign.donations.forEach(donation => {
      const donorKey = donation.donorEmail || donation.donorName || `anonymous-${donation.id}`;
      if (!donorMap.has(donorKey)) {
        donorMap.set(donorKey, {
          name: donation.donorName,
          email: donation.donorEmail,
          donationCount: 1,
          totalAmount: Number(donation.amount),
          firstDonation: donation.donationDate,
          lastDonation: donation.donationDate
        });
      } else {
        const existing = donorMap.get(donorKey);
        existing.donationCount++;
        existing.totalAmount += Number(donation.amount);
        if (donation.donationDate > existing.lastDonation) {
          existing.lastDonation = donation.donationDate;
        }
        if (donation.donationDate < existing.firstDonation) {
          existing.firstDonation = donation.donationDate;
        }
      }
    });

    // Process campaign with detailed analytics
    const processedCampaign = {
      ...campaign,
      raisedAmount: actualRaisedAmount,
      donorCount: donorMap.size,
      donationCount: campaign._count.donations,
      activityCount: campaign._count.activities,
      preActivities: campaign.activities.filter(a => a.phase === 'Pre-Campaign').length,
      postActivities: campaign.activities.filter(a => a.phase === 'Post-Campaign').length,
      completedActivities: campaign.activities.filter(a => a.status === 'Completed').length,
      plannedActivities: campaign.activities.filter(a => a.status === 'Planned').length,
      inProgressActivities: campaign.activities.filter(a => a.status === 'In Progress').length,
      
      // Progress percentage
      progressPercentage: campaign.targetAmount && Number(campaign.targetAmount) > 0 
        ? Math.round((actualRaisedAmount / Number(campaign.targetAmount)) * 100) 
        : 0,
        
      // Average donation
      averageDonation: campaign.donations.length > 0 
        ? actualRaisedAmount / campaign.donations.length 
        : 0,
        
      // Donation analytics
      donationAnalytics: {
        totalAmount: actualRaisedAmount,
        totalCount: campaign.donations.length,
        averageAmount: campaign.donations.length > 0 ? actualRaisedAmount / campaign.donations.length : 0,
        uniqueDonors: donorMap.size,
        largestDonation: campaign.donations.length > 0 
          ? Math.max(...campaign.donations.map(d => Number(d.amount))) 
          : 0,
        smallestDonation: campaign.donations.length > 0 
          ? Math.min(...campaign.donations.map(d => Number(d.amount))) 
          : 0,
        
        // Donation distribution
        donationDistribution: {
          under100: campaign.donations.filter(d => Number(d.amount) < 100).length,
          between100and500: campaign.donations.filter(d => Number(d.amount) >= 100 && Number(d.amount) < 500).length,
          between500and1000: campaign.donations.filter(d => Number(d.amount) >= 500 && Number(d.amount) < 1000).length,
          above1000: campaign.donations.filter(d => Number(d.amount) >= 1000).length
        },
        
        // Payment method breakdown
        paymentMethods: campaign.donations.reduce((acc, donation) => {
          const method = donation.paymentMethod || 'Unknown';
          acc[method] = (acc[method] || 0) + 1;
          return acc;
        }, {}),
        
        // Recent trends (last 30 days)
        recentTrends: {
          last30Days: campaign.donations.filter(d => 
            new Date(d.donationDate) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          ).length,
          last7Days: campaign.donations.filter(d => 
            new Date(d.donationDate) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          ).length,
        }
      },
      
      // Top donors
      topDonors: Array.from(donorMap.entries())
        .map(([key, data]) => ({ id: key, ...data }))
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 10),
        
      // Activity analytics
      activityAnalytics: {
        byPhase: {
          preCampaign: campaign.activities.filter(a => a.phase === 'Pre-Campaign').length,
          postCampaign: campaign.activities.filter(a => a.phase === 'Post-Campaign').length
        },
        byStatus: {
          planned: campaign.activities.filter(a => a.status === 'Planned').length,
          inProgress: campaign.activities.filter(a => a.status === 'In Progress').length,
          completed: campaign.activities.filter(a => a.status === 'Completed').length,
          cancelled: campaign.activities.filter(a => a.status === 'Cancelled').length
        },
        byType: campaign.activities.reduce((acc, activity) => {
          acc[activity.type] = (acc[activity.type] || 0) + 1;
          return acc;
        }, {}),
        completionRate: campaign.activities.length > 0 
          ? Math.round((campaign.activities.filter(a => a.status === 'Completed').length / campaign.activities.length) * 100)
          : 0
      }
    };

    return NextResponse.json({
      success: true,
      data: processedCampaign
    });

  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch campaign' },
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

    // Only allow foundation admins to update campaigns
    if (currentUser.accountType !== 'FOUNDATION_ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id } = params;

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
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Campaign name is required' },
        { status: 400 }
      );
    }

    // Check if campaign exists
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id }
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Validate category exists if provided
    if (categoryId && categoryId !== existingCampaign.categoryId) {
      const category = await prisma.campaignCategory.findUnique({
        where: { id: categoryId }
      });

      if (!category) {
        return NextResponse.json(
          { success: false, error: 'Category not found' },
          { status: 404 }
        );
      }
    }

    // Check if new name conflicts with another campaign in the same category
    const finalCategoryId = categoryId || existingCampaign.categoryId;
    const conflictingCampaign = await prisma.campaign.findFirst({
      where: {
        categoryId: finalCategoryId,
        name: {
          equals: name,
          mode: 'insensitive'
        },
        id: {
          not: id
        }
      }
    });

    if (conflictingCampaign) {
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

    // Update campaign
    const updatedCampaign = await prisma.campaign.update({
      where: { id },
      data: {
        categoryId: categoryId || existingCampaign.categoryId,
        name: name.trim(),
        description: description?.trim() || null,
        targetAmount: targetAmount ? parseFloat(targetAmount) : existingCampaign.targetAmount,
        startDate: startDate ? new Date(startDate) : existingCampaign.startDate,
        endDate: endDate ? new Date(endDate) : existingCampaign.endDate,
        status: status || existingCampaign.status
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

    // Calculate actual raised amount
    const actualRaisedAmount = updatedCampaign.donations.reduce((sum, donation) => 
      sum + Number(donation.amount), 0
    );

    return NextResponse.json({
      success: true,
      data: {
        ...updatedCampaign,
        raisedAmount: actualRaisedAmount,
        donorCount: new Set(updatedCampaign.donations.map(d => d.donorEmail || d.donorName || `anonymous-${d.id}`)).size,
        donationCount: updatedCampaign._count.donations,
        activityCount: updatedCampaign._count.activities,
        progressPercentage: updatedCampaign.targetAmount && Number(updatedCampaign.targetAmount) > 0 
          ? Math.round((actualRaisedAmount / Number(updatedCampaign.targetAmount)) * 100) 
          : 0
      },
      message: 'Campaign updated successfully'
    });

  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update campaign' },
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

    // Only allow foundation admins to delete campaigns
    if (currentUser.accountType !== 'FOUNDATION_ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id } = params;

    // Check if campaign exists and has donations or activities
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            donations: true,
            activities: true
          }
        }
      }
    });

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Prevent deletion if campaign has donations or activities
    if (campaign._count.donations > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete campaign with ${campaign._count.donations} donation(s). Please remove donations first or consider archiving the campaign.` 
        },
        { status: 409 }
      );
    }

    if (campaign._count.activities > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete campaign with ${campaign._count.activities} activit(ies). Please remove activities first or consider archiving the campaign.` 
        },
        { status: 409 }
      );
    }

    // Delete campaign (this will cascade delete activities due to the schema)
    await prisma.campaign.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Campaign deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}
