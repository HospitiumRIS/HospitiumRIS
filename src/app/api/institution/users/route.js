import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  requireInstitutionPortalAccess,
  assertInstitutionMember,
} from '@/lib/institution-scope';

/**
 * GET /api/institution/users
 * Fetch users belonging to the logged-in user's institution
 */
export async function GET(request) {
  try {
    const access = await requireInstitutionPortalAccess();
    if (access.error) return access.error;

    const { institution, memberWhere, verifiedDomains } = access;
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const accountType = searchParams.get('accountType');

    const where = {
      AND: [memberWhere],
    };

    if (search) {
      where.AND.push({
        OR: [
          { givenName: { contains: search, mode: 'insensitive' } },
          { familyName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { orcidId: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (status) {
      where.AND.push({ status });
    }

    if (accountType) {
      where.AND.push({ accountType });
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
            notifications: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const sanitizedUsers = users.map((entry) => {
      const { passwordHash, emailVerifyToken, ...safeUser } = entry;
      return {
        ...safeUser,
        fullName: `${safeUser.givenName} ${safeUser.familyName}`.trim(),
      };
    });

    const statsBase = { AND: [memberWhere] };
    const stats = await Promise.all([
      prisma.user.count({ where: { AND: [...statsBase.AND, { status: 'ACTIVE' }] } }),
      prisma.user.count({ where: { AND: [...statsBase.AND, { status: 'PENDING' }] } }),
      prisma.user.count({ where: { AND: [...statsBase.AND, { status: 'INACTIVE' }] } }),
      prisma.user.count({ where: { AND: [...statsBase.AND, { status: 'SUSPENDED' }] } }),
      prisma.user.count({ where: { AND: [...statsBase.AND, { accountType: 'RESEARCHER' }] } }),
      prisma.user.count({ where: { AND: [...statsBase.AND, { accountType: 'RESEARCH_ADMIN' }] } }),
      prisma.user.count({ where: { AND: [...statsBase.AND, { accountType: 'INSTITUTION_ADMIN' }] } }),
    ]);

    return NextResponse.json({
      success: true,
      institution: { id: institution.id, name: institution.name, verifiedDomains },
      users: sanitizedUsers,
      stats: {
        byStatus: {
          active: stats[0],
          pending: stats[1],
          inactive: stats[2],
          suspended: stats[3],
        },
        byAccountType: {
          researcher: stats[4],
          researchAdmin: stats[5],
          institutionAdmin: stats[6],
        },
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/institution/users
 * Update user status or account type (institution members only)
 */
export async function PATCH(request) {
  try {
    const access = await requireInstitutionPortalAccess();
    if (access.error) return access.error;

    const { institution } = access;
    const body = await request.json();
    const { userId, status, accountType } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const member = await assertInstitutionMember(userId, institution);
    if (!member) {
      return NextResponse.json({ error: 'User not found in this institution' }, { status: 404 });
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
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
