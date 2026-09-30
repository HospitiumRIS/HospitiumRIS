import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  requireInstitutionAdmin,
  getOwnedInstitution,
  resolveInstitutionMemberScope,
  getInstitutionMemberIds,
} from '@/lib/institution-admin';

function getPeriodStart(period) {
  const now = new Date();
  const startDate = new Date(now);

  switch (period) {
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case '3months':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case '6months':
      startDate.setMonth(now.getMonth() - 6);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    case 'week':
    default:
      startDate.setDate(now.getDate() - 7);
      break;
  }

  return startDate;
}

export async function GET(request) {
  try {
    const { user, error } = await requireInstitutionAdmin();
    if (error) return error;

    const institution = await getOwnedInstitution(user);
    if (!institution) {
      return NextResponse.json({ error: 'No institution found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week';
    const startDate = getPeriodStart(period);
    const { memberWhere: userScope, verifiedDomains } = await resolveInstitutionMemberScope(institution);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers,
      pendingUsers,
      newUsersToday,
      newUsersInPeriod,
      verifiedDomainsCount,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count({
        where: {
          AND: [userScope, { accountType: { not: 'GLOBAL_ADMIN' } }],
        },
      }),
      prisma.user.count({
        where: {
          AND: [userScope, { status: 'ACTIVE' }, { accountType: { not: 'GLOBAL_ADMIN' } }],
        },
      }),
      prisma.user.count({
        where: {
          AND: [userScope, { status: 'PENDING' }, { accountType: { not: 'GLOBAL_ADMIN' } }],
        },
      }),
      prisma.user.count({
        where: {
          AND: [userScope, { createdAt: { gte: today } }, { accountType: { not: 'GLOBAL_ADMIN' } }],
        },
      }),
      prisma.user.count({
        where: {
          AND: [userScope, { createdAt: { gte: startDate } }, { accountType: { not: 'GLOBAL_ADMIN' } }],
        },
      }),
      prisma.verifiedDomain.count({
        where: { institutionId: institution.id },
      }),
      prisma.user.findMany({
        where: {
          AND: [
            userScope,
            { createdAt: { gte: startDate } },
            { accountType: { not: 'GLOBAL_ADMIN' } },
          ],
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          givenName: true,
          familyName: true,
          email: true,
          accountType: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    const userIds = await getInstitutionMemberIds(institution, { memberWhere: userScope, verifiedDomains });
    let totalManuscripts = 0;
    let activeManuscripts = 0;

    if (userIds.length > 0) {
      [totalManuscripts, activeManuscripts] = await Promise.all([
        prisma.manuscript.count({
          where: { createdBy: { in: userIds } },
        }),
        prisma.manuscript.count({
          where: {
            createdBy: { in: userIds },
            status: { in: ['DRAFT', 'IN_REVIEW', 'UNDER_REVISION'] },
          },
        }),
      ]);
    }

    const profileComplete = Boolean(
      institution.name?.trim()
      && institution.country?.trim()
      && institution.logo?.trim()
    );

    const formattedRecentUsers = recentUsers.map((entry) => ({
      id: entry.id,
      name: `${entry.givenName || ''} ${entry.familyName || ''}`.trim() || entry.email,
      email: entry.email,
      accountType: entry.accountType,
      status: entry.status,
      createdAt: entry.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      institution: {
        id: institution.id,
        name: institution.name,
        profileComplete,
      },
      stats: {
        totalUsers,
        activeUsers,
        pendingUsers,
        newUsersToday,
        newUsersInPeriod,
        verifiedDomainsCount,
        totalManuscripts,
        activeManuscripts,
      },
      recentUsers: formattedRecentUsers,
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
