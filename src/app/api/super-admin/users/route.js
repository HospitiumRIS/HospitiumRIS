import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';

// Helper function to check Super Admin access
async function checkSuperAdminAccess(request) {
  try {
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return { authorized: false, error: 'Unauthorized' };
    }

    if (user.accountType !== 'SUPER_ADMIN') {
      return { authorized: false, error: 'Insufficient privileges' };
    }

    return { authorized: true, user };
  } catch (error) {
    return { authorized: false, error: 'Authentication error' };
  }
}

export async function GET(request) {
  try {
    // Check Super Admin access
    const { authorized, error } = await checkSuperAdminAccess(request);
    if (!authorized) {
      return NextResponse.json(
        { success: false, message: error },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const accountType = searchParams.get('accountType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const where = {};
    
    if (search) {
      where.OR = [
        { givenName: { contains: search, mode: 'insensitive' } },
        { familyName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { orcidId: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    if (accountType) {
      where.accountType = accountType;
    }

    // Get total count
    const total = await prisma.user.count({ where });

    // Fetch users with relations
    const users = await prisma.user.findMany({
      where,
      include: {
        institution: true,
        foundation: true,
        researchProfile: true,
        _count: {
          select: {
            manuscripts: true,
            publications: true,
            sentInvitations: true,
            receivedInvitations: true,
            notifications: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip: (page - 1) * limit,
      take: limit
    });

    // Remove sensitive data
    const sanitizedUsers = users.map(user => {
      const { passwordHash, emailVerifyToken, ...safeUser } = user;
      return safeUser;
    });

    // Get statistics
    const stats = await Promise.all([
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { status: 'INACTIVE' } }),
      prisma.user.count({ where: { status: 'SUSPENDED' } }),
      prisma.user.count({ where: { accountType: 'RESEARCHER' } }),
      prisma.user.count({ where: { accountType: 'RESEARCH_ADMIN' } }),
      prisma.user.count({ where: { accountType: 'FOUNDATION_ADMIN' } }),
      prisma.user.count({ where: { accountType: 'SUPER_ADMIN' } })
    ]);

    return NextResponse.json({
      success: true,
      users: sanitizedUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        byStatus: {
          active: stats[0],
          pending: stats[1],
          inactive: stats[2],
          suspended: stats[3]
        },
        byAccountType: {
          researcher: stats[4],
          researchAdmin: stats[5],
          foundationAdmin: stats[6],
          superAdmin: stats[7]
        }
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch users', error: error.message },
      { status: 500 }
    );
  }
}

