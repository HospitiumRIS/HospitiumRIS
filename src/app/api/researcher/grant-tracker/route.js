import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';
import {
  colleaguesWhere,
  listGrantTrackerProposals,
  serializeFollowUpUser,
} from '@/lib/grant-tracker';

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [proposals, colleagues] = await Promise.all([
      listGrantTrackerProposals(user),
      prisma.user.findMany({
        where: colleaguesWhere(user),
        select: {
          id: true,
          givenName: true,
          familyName: true,
          email: true,
          accountType: true,
        },
        orderBy: [{ familyName: 'asc' }, { givenName: 'asc' }],
        take: 200,
      }),
    ]);

    const stats = {
      total: proposals.length,
      notApplied: proposals.filter((p) => p.grantTrackingStatus === 'NOT_APPLIED').length,
      applied: proposals.filter((p) => p.grantTrackingStatus === 'APPLIED').length,
      awarded: proposals.filter((p) => p.grantTrackingStatus === 'AWARDED').length,
      rejected: proposals.filter((p) => p.grantTrackingStatus === 'REJECTED').length,
      cancelled: proposals.filter((p) => p.grantTrackingStatus === 'CANCELLED').length,
    };

    return NextResponse.json({
      success: true,
      proposals,
      colleagues: colleagues.map(serializeFollowUpUser),
      stats,
    });
  } catch (error) {
    console.error('Error fetching grant tracker:', error);
    return NextResponse.json({ error: 'Failed to load grant tracker' }, { status: 500 });
  }
}
