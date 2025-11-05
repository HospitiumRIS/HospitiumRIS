import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    // Development bypass for authentication
    let currentUser = null;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Development mode: Bypassing authentication for categories API');
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

    // Fetch all campaign categories with campaign counts
    const categories = await prisma.campaignCategory.findMany({
      include: {
        campaigns: {
          include: {
            _count: {
              select: {
                donations: true,
                activities: true
              }
            }
          }
        },
        _count: {
          select: {
            campaigns: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Process categories with aggregated data
    const processedCategories = categories.map(category => ({
      ...category,
      campaignCount: category._count.campaigns,
      totalRaised: category.campaigns.reduce((sum, campaign) => sum + Number(campaign.raisedAmount), 0),
      totalTarget: category.campaigns.reduce((sum, campaign) => sum + Number(campaign.targetAmount || 0), 0),
      activeCampaigns: category.campaigns.filter(c => c.status === 'Active').length,
      totalDonations: category.campaigns.reduce((sum, campaign) => sum + campaign.donationCount, 0),
      totalActivities: category.campaigns.reduce((sum, campaign) => sum + campaign._count.activities, 0),
    }));

    return NextResponse.json({
      success: true,
      data: processedCategories,
      count: processedCategories.length
    });

  } catch (error) {
    console.error('Error fetching campaign categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch campaign categories' },
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

    // Only allow foundation admins to create categories
    if (currentUser.accountType !== 'FOUNDATION_ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

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

    // Check if category name already exists
    const existingCategory = await prisma.campaignCategory.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        }
      }
    });

    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'A category with this name already exists' },
        { status: 409 }
      );
    }

    // Create new category
    const newCategory = await prisma.campaignCategory.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        icon: icon || 'General',
        color: color || '#8b6cbc'
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
        ...newCategory,
        campaignCount: newCategory._count.campaigns,
        totalRaised: 0,
        totalTarget: 0,
        activeCampaigns: 0,
        totalDonations: 0,
        totalActivities: 0,
      },
      message: 'Campaign category created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating campaign category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create campaign category' },
      { status: 500 }
    );
  }
}
