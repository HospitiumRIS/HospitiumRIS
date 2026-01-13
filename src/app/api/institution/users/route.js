import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../lib/auth-server';

/**
 * GET /api/institution/users
 * Fetch all users for institution management
 */
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (user.accountType !== 'RESEARCH_ADMIN' && user.accountType !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient privileges' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const accountType = searchParams.get('accountType');

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
            notifications: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const sanitizedUsers = users.map(user => {
      const { passwordHash, emailVerifyToken, ...safeUser } = user;
      return {
        ...safeUser,
        fullName: `${safeUser.givenName} ${safeUser.familyName}`.trim()
      };
    });

    const stats = await Promise.all([
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { status: 'INACTIVE' } }),
      prisma.user.count({ where: { status: 'SUSPENDED' } }),
      prisma.user.count({ where: { accountType: 'RESEARCHER' } }),
      prisma.user.count({ where: { accountType: 'RESEARCH_ADMIN' } }),
      prisma.user.count({ where: { accountType: 'FOUNDATION_ADMIN' } })
    ]);

    return NextResponse.json({
      success: true,
      users: sanitizedUsers,
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
          foundationAdmin: stats[6]
        }
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/institution/users
 * Update user status or account type
 */
export async function PATCH(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (user.accountType !== 'RESEARCH_ADMIN' && user.accountType !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient privileges' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, status, accountType } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (accountType) updateData.accountType = accountType;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        givenName: true,
        familyName: true,
        status: true,
        accountType: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
