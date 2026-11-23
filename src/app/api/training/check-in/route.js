import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { auditTraining } from '@/lib/training-audit';
import { ACTIVE_REGISTRATION_STATUSES } from '@/lib/training-scope';
import { recomputeAttendancePercent } from '@/lib/training-attendance-server';
import { rateLimit } from '@/lib/simple-rate-limit';
import {
  checkInSecret,
  codesMatch,
  evaluateCheckIn,
  normalizeCode,
  verifyCheckInToken,
} from '@/lib/training-checkin';

const ATTEMPTS = { limit: 20, windowMs: 10 * 60 * 1000 };

function clientInfo(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = (forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip'))?.trim() || null;
  const userAgent = request.headers.get('user-agent')?.slice(0, 500) || null;
  return { ip, userAgent };
}

function fail(error, status = 400, extra = {}) {
  return NextResponse.json({ success: false, error, ...extra }, { status });
}

/** Sessions the user could be checking in to with a code right now. */
async function findSessionByCode(userId, code, now) {
  const registrations = await prisma.trainingRegistration.findMany({
    where: { userId, status: { in: ACTIVE_REGISTRATION_STATUSES } },
    select: { trainingId: true },
  });
  if (!registrations.length) return null;
  const dayMs = 24 * 60 * 60 * 1000;
  const candidates = await prisma.trainingSession.findMany({
    where: {
      trainingId: { in: registrations.map((r) => r.trainingId) },
      status: 'SCHEDULED',
      checkInCode: { not: null },
      startsAt: { gte: new Date(now.getTime() - dayMs), lte: new Date(now.getTime() + dayMs) },
    },
  });
  return candidates.find((s) => codesMatch(s.checkInCode, code) && evaluateCheckIn(s, now).ok)
    || candidates.find((s) => codesMatch(s.checkInCode, code))
    || null;
}

/**
 * POST /api/training/check-in
 * Self check-in (#93). Body: { sessionId, token } from the QR code, or { code } (6 digits,
 * optionally with sessionId). The caller must be signed in, hold an active registration
 * for the session's training, and be inside the session's check-in window.
 */
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return fail('Sign in to check in', 401, { reason: 'login_required' });

    const limited = rateLimit(`training-checkin:${user.id}`, ATTEMPTS);
    if (!limited.allowed) {
      return fail('Too many check-in attempts. Wait a few minutes and try again.', 429, {
        reason: 'rate_limited',
        retryAfterSeconds: Math.ceil(limited.retryAfterMs / 1000),
      });
    }

    const body = await request.json().catch(() => null);
    const now = new Date();
    const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : null;
    const token = typeof body?.token === 'string' ? body.token : null;
    const code = normalizeCode(body?.code);

    let session = null;
    let method = null;
    if (sessionId && token) {
      session = await prisma.trainingSession.findUnique({ where: { id: sessionId } });
      if (!session) return fail('Session not found', 404, { reason: 'not_found' });
      if (!verifyCheckInToken(session.id, token, checkInSecret(), now)) {
        return fail('This QR code has expired. Scan the code on screen again, or enter the 6-digit code.', 400, { reason: 'token_expired' });
      }
      method = 'QR';
    } else if (code.length === 6) {
      session = sessionId
        ? await prisma.trainingSession.findUnique({ where: { id: sessionId } })
        : await findSessionByCode(user.id, code, now);
      if (!session || !codesMatch(session.checkInCode, code)) {
        return fail('That code does not match a session you are registered for.', 400, { reason: 'bad_code' });
      }
      method = 'CODE';
    } else {
      return fail('Scan the QR code or enter the 6-digit code', 400, { reason: 'missing' });
    }

    const registration = await prisma.trainingRegistration.findUnique({
      where: { trainingId_userId: { trainingId: session.trainingId, userId: user.id } },
      include: { training: { select: { id: true, title: true } } },
    });
    if (!registration || !ACTIVE_REGISTRATION_STATUSES.includes(registration.status)) {
      return fail('You are not registered for this training.', 403, { reason: 'not_registered' });
    }

    const sessionInfo = { id: session.id, title: session.title, startsAt: session.startsAt, endsAt: session.endsAt };
    const trainingInfo = registration.training;

    const existing = await prisma.trainingAttendance.findUnique({
      where: { sessionId_registrationId: { sessionId: session.id, registrationId: registration.id } },
    });
    if (existing && (existing.status === 'PRESENT' || existing.status === 'LATE')) {
      return NextResponse.json({
        success: true,
        alreadyCheckedIn: true,
        status: existing.status,
        checkedInAt: existing.checkedInAt,
        session: sessionInfo,
        training: trainingInfo,
      });
    }

    const state = evaluateCheckIn(session, now);
    if (!state.ok) {
      return fail(state.reason === 'not_open'
        ? `Check-in opens ${session.checkInOpensMinutesBefore} minutes before the session starts.`
        : state.error, 400, { reason: state.reason, opensAt: state.opensAt, session: sessionInfo, training: trainingInfo });
    }

    const { ip, userAgent } = clientInfo(request);
    await prisma.trainingAttendance.upsert({
      where: { sessionId_registrationId: { sessionId: session.id, registrationId: registration.id } },
      update: { status: state.status, method, checkedInAt: now, markedBy: null, ip, userAgent },
      create: {
        sessionId: session.id,
        registrationId: registration.id,
        status: state.status,
        method,
        checkedInAt: now,
        ip,
        userAgent,
      },
    });

    await recomputeAttendancePercent(session.trainingId, [registration.id]);
    await auditTraining({
      trainingId: session.trainingId,
      actorId: user.id,
      action: 'SELF_CHECKED_IN',
      entityType: 'TrainingSession',
      entityId: session.id,
      before: existing ? { status: existing.status } : null,
      after: { registrationId: registration.id, status: state.status, method },
    });

    return NextResponse.json({
      success: true,
      status: state.status,
      checkedInAt: now,
      session: sessionInfo,
      training: trainingInfo,
    });
  } catch (error) {
    console.error('Error during training check-in:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
