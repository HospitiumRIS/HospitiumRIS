import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, getSessionToken } from '@/lib/auth-server';
import { hashToken, idleLimitMs, revokeUserSessions } from '@/lib/sessions';
import { recordAuthEvent } from '@/lib/ops/audit';

export const dynamic = 'force-dynamic';

/** How many other devices are signed in to this account. */
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const now = Date.now();
  const idleCutoff = new Date(now - (await idleLimitMs(user.accountType)));
  const otherSessions = await prisma.session.count({
    where: {
      userId: user.id,
      tokenHash: { not: hashToken(await getSessionToken()) },
      expiresAt: { gt: new Date(now) },
      lastSeenAt: { gt: idleCutoff },
    },
  });

  return NextResponse.json({ success: true, otherSessions }, { headers: { 'Cache-Control': 'private, no-store' } });
}

/** Sign out everywhere else: end every session except the current one. */
export async function DELETE(request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const ended = await revokeUserSessions(user.id, { exceptToken: await getSessionToken() });
  await recordAuthEvent(request, {
    action: 'SESSIONS_REVOKED',
    user,
    summary: `Signed out of ${ended} other ${ended === 1 ? 'session' : 'sessions'}`,
  }).catch(() => {});

  return NextResponse.json({ success: true, ended });
}
