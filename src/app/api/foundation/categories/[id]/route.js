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

    // Fetch specific category with campaigns and activities
    const category = await prisma.campaignCategory.findUnique({
      where: { id },
      include: {
        campaigns: {
          include: {
            activities: {
              orderBy: {
                date: 'asc'
              }
            },
            donations: {
              orderBy: {
                donationDate: 'desc'
              },
              take: 10 // Get latest 10 donations
            },
            _count: {
              select: {
                donations: true,
                activities: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            campaigns: true
          }
        }
      }
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Process category with aggregated data
    const processedCategory = {
      ...category,
      campaignCount: category._count.campaigns,
      totalRaised: category.campaigns.reduce((sum, campaign) => sum + Number(campaign.raisedAmount), 0),
      totalTarget: category.campaigns.reduce((sum, campaign) => sum + Number(campaign.targetAmount || 0), 0),
      activeCampaigns: category.campaigns.filter(c => c.status === 'Active').length,
      totalDonations: category.campaigns.reduce((sum, campaign) => sum + campaign._count.donations, 0),
      totalActivities: category.campaigns.reduce((sum, campaign) => sum + campaign._count.activities, 0),
    };

    return NextResponse.json({
      success: true,
      data: processedCategory
    });

  } catch (error) {
    console.error('Error fetching campaign category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch campaign category' },
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

    // Only allow foundation admins to update categories
    if (currentUser.accountType !== 'FOUNDATION_ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id } = params;

    // Parse request body
    const body = await request.json();
    const { name, description, icon, color } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }

    // Check if category exists
    const existingCategory = await prisma.campaignCategory.findUnique({
      where: { id }
    });

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if new name conflicts with another category
    const conflictingCategory = await prisma.campaignCategory.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        },
        id: {
          not: id
        }
      }
    });

    if (conflictingCategory) {
      return NextResponse.json(
        { success: false, error: 'A category with this name already exists' },
        { status: 409 }
      );
    }

    // Update category
    const updatedCategory = await prisma.campaignCategory.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        icon: icon || existingCategory.icon,
        color: color || existingCategory.color
      },
      include: {
        campaigns: true,
        _count: {
          select: {
            campaigns: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updatedCategory,
        campaignCount: updatedCategory._count.campaigns,
        totalRaised: updatedCategory.campaigns.reduce((sum, campaign) => sum + Number(campaign.raisedAmount), 0),
        totalTarget: updatedCategory.campaigns.reduce((sum, campaign) => sum + Number(campaign.targetAmount || 0), 0),
        activeCampaigns: updatedCategory.campaigns.filter(c => c.status === 'Active').length,
        totalDonations: updatedCategory.campaigns.reduce((sum, campaign) => sum + campaign.donationCount, 0),
      },
      message: 'Campaign category updated successfully'
    });

  } catch (error) {
    console.error('Error updating campaign category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update campaign category' },
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

    // Only allow foundation admins to delete categories
    if (currentUser.accountType !== 'FOUNDATION_ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id } = params;

    // Check if category exists and has campaigns
    const category = await prisma.campaignCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            campaigns: true
          }
        }
      }
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Prevent deletion if category has campaigns
    if (category._count.campaigns > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete category with ${category._count.campaigns} campaign(s). Please move or delete all campaigns first.` 
        },
        { status: 409 }
      );
    }

    // Delete category
    await prisma.campaignCategory.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Campaign category deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting campaign category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete campaign category' },
      { status: 500 }
    );
  }
}
