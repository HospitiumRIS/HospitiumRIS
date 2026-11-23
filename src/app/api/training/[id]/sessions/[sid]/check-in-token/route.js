import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auditTraining } from '@/lib/training-audit';
import { ACTIVE_REGISTRATION_STATUSES } from '@/lib/training-scope';
import { requireSessionAdmin } from '@/lib/training-sessions-server';
import {
  TOKEN_WINDOW_SECONDS,
  checkInSecret,
  checkInUrl,
  checkInWindow,
  currentCheckInToken,
  evaluateCheckIn,
  generateCheckInCode,
} from '@/lib/training-checkin';

function appBaseUrl(request) {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || new URL(request.url).origin;
}

async function loadSession(trainingId, sid) {
  const session = await prisma.trainingSession.findUnique({ where: { id: sid } });
  return session && session.trainingId === trainingId ? session : null;
}

async function presentPayload(request, training, session) {
  const now = new Date();
  const { token, rotatesAt } = currentCheckInToken(session.id, checkInSecret(), now);
  const window = checkInWindow(session);
  const state = evaluateCheckIn(session, now);

  const [registered, checkedIn] = await Promise.all([
    prisma.trainingRegistration.count({
      where: { trainingId: training.id, status: { in: ACTIVE_REGISTRATION_STATUSES } },
    }),
    prisma.trainingAttendance.findMany({
      where: { sessionId: session.id, status: { in: ['PRESENT', 'LATE'] } },
      orderBy: { checkedInAt: 'desc' },
      select: {
        status: true,
        method: true,
        checkedInAt: true,
        registration: { select: { user: { select: { givenName: true, familyName: true } } } },
      },
    }),
  ]);

  return {
    training: { id: training.id, title: training.title },
    session: {
      id: session.id,
      title: session.title,
      startsAt: session.startsAt,
      endsAt: session.endsAt,
      status: session.status,
    },
    token,
    rotatesAt,
    windowSeconds: TOKEN_WINDOW_SECONDS,
    url: checkInUrl(appBaseUrl(request), session.id, token),
    code: session.checkInCode,
    checkIn: {
      opensAt: window.opensAt,
      closesAt: window.closesAt,
      lateAt: window.lateAt,
      isOpen: state.ok,
      state: state.ok ? 'open' : state.reason,
    },
    counts: { registered, checkedIn: checkedIn.length },
    recent: checkedIn.slice(0, 10).map((row) => ({
      name: [row.registration.user?.givenName, row.registration.user?.familyName?.[0] ? `${row.registration.user.familyName[0]}.` : null].filter(Boolean).join(' ') || 'Participant',
      status: row.status,
      method: row.method,
      at: row.checkedInAt,
    })),
  };
}

/**
 * GET /api/training/[id]/sessions/[sid]/check-in-token
 * Current rotating QR token, 6-digit code and live counts for the Present view.
 * Training admin only (#93). Polled every few seconds.
 */
export async function GET(request, { params }) {
  try {
    const { id, sid } = await params;
    const access = await requireSessionAdmin(request, id);
    if (access.error) return access.error;

    let session = await loadSession(id, sid);
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    if (!session.checkInCode) {
      session = await prisma.trainingSession.update({
        where: { id: sid },
        data: { checkInCode: generateCheckInCode() },
      });
    }

    const payload = await presentPayload(request, access.training, session);
    return NextResponse.json(
      { success: true, ...payload },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Error building check-in token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/training/[id]/sessions/[sid]/check-in-token
 * Body: { action: 'regenerate-code' } issues a new 6-digit code (e.g. if it was shared).
 */
export async function POST(request, { params }) {
  try {
    const { id, sid } = await params;
    const access = await requireSessionAdmin(request, id);
    if (access.error) return access.error;

    const body = await request.json().catch(() => null);
    if (body?.action !== 'regenerate-code') {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
    const existing = await loadSession(id, sid);
    if (!existing) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const session = await prisma.trainingSession.update({
      where: { id: sid },
      data: { checkInCode: generateCheckInCode() },
    });

    await auditTraining({
      trainingId: id,
      actorId: access.user.id,
      action: 'CHECKIN_CODE_REGENERATED',
      entityType: 'TrainingSession',
      entityId: sid,
    });

    const payload = await presentPayload(request, access.training, session);
    return NextResponse.json({ success: true, ...payload });
  } catch (error) {
    console.error('Error regenerating check-in code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
