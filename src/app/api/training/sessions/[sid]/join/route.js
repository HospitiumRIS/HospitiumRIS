import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { auditTraining } from '@/lib/training-audit';
import { ACTIVE_REGISTRATION_STATUSES } from '@/lib/training-scope';
import { effectiveSessionDelivery } from '@/lib/training-sessions';
import { recomputeAttendancePercent } from '@/lib/training-attendance-server';
import { isJoinWindowOpen, statusForJoin } from '@/lib/training-virtual-attendance';

function backToTraining(request, trainingId, reason) {
  const url = new URL('/researcher/training', request.url);
  if (trainingId) url.searchParams.set('training', trainingId);
  if (reason) url.searchParams.set('join', reason);
  return NextResponse.redirect(url, 303);
}

/**
 * GET /api/training/sessions/[sid]/join
 * The "Join session" link for online and hybrid sessions (#94). Records a VIRTUAL_JOIN
 * check-in for active registrants while the session is live, then redirects to the
 * meeting. The meeting link itself is never sent to anyone else.
 */
export async function GET(request, { params }) {
  try {
    const { sid } = await params;
    const user = await getAuthenticatedUser(request);
    if (!user) {
      const login = new URL('/login', request.url);
      login.searchParams.set('redirect', `/api/training/sessions/${sid}/join`);
      return NextResponse.redirect(login, 303);
    }

    const session = await prisma.trainingSession.findUnique({
      where: { id: sid },
      include: { training: { select: { id: true, deliveryMode: true, venue: true, onlineLink: true } } },
    });
    if (!session) return backToTraining(request, null, 'not_found');

    const registration = await prisma.trainingRegistration.findUnique({
      where: { trainingId_userId: { trainingId: session.trainingId, userId: user.id } },
    });
    if (!registration || !ACTIVE_REGISTRATION_STATUSES.includes(registration.status)) {
      return backToTraining(request, session.trainingId, 'not_registered');
    }

    const { onlineLink } = effectiveSessionDelivery(session, session.training);
    if (!onlineLink) return backToTraining(request, session.trainingId, 'no_link');

    const now = new Date();
    if (isJoinWindowOpen(session, now)) {
      const existing = await prisma.trainingAttendance.findUnique({
        where: { sessionId_registrationId: { sessionId: sid, registrationId: registration.id } },
      });
      // First join wins: a rejoin never turns PRESENT into LATE.
      if (!existing || !['PRESENT', 'LATE'].includes(existing.status)) {
        const status = statusForJoin(session, now);
        await prisma.trainingAttendance.upsert({
          where: { sessionId_registrationId: { sessionId: sid, registrationId: registration.id } },
          update: { status, method: 'VIRTUAL_JOIN', checkedInAt: now, markedBy: null },
          create: { sessionId: sid, registrationId: registration.id, status, method: 'VIRTUAL_JOIN', checkedInAt: now },
        });
        await recomputeAttendancePercent(session.trainingId, [registration.id]);
        await auditTraining({
          trainingId: session.trainingId,
          actorId: user.id,
          action: 'VIRTUAL_JOINED',
          entityType: 'TrainingSession',
          entityId: sid,
          before: existing ? { status: existing.status } : null,
          after: { registrationId: registration.id, status },
        });
      }
    }

    return NextResponse.redirect(onlineLink, 303);
  } catch (error) {
    console.error('Error joining training session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
