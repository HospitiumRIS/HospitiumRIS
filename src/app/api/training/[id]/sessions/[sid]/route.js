import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auditTraining } from '@/lib/training-audit';
import { recomputeAttendancePercent, sessionHasAttendance } from '@/lib/training-attendance-server';
import { notifyTrainingParticipants } from '@/lib/training-notify';
import { validateSessionInput } from '@/lib/training-sessions';
import {
  requireSessionAdmin,
  sessionAuditSnapshot,
  serializeSession,
  trainingModuleIds,
} from '@/lib/training-sessions-server';

async function loadSession(trainingId, sid) {
  const session = await prisma.trainingSession.findUnique({ where: { id: sid } });
  return session && session.trainingId === trainingId ? session : null;
}

/**
 * PUT /api/training/[id]/sessions/[sid]
 * Update a session (partial body allowed). Training admin only.
 */
export async function PUT(request, { params }) {
  try {
    const { id, sid } = await params;
    const access = await requireSessionAdmin(request, id);
    if (access.error) return access.error;
    const { user, training } = access;

    const existing = await loadSession(id, sid);
    if (!existing) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const body = await request.json().catch(() => null);
    const moduleIds = await trainingModuleIds(id);
    const validation = validateSessionInput(body, training, { existing, moduleIds });
    if (!validation.ok) {
      return NextResponse.json({ error: validation.errors[0], errors: validation.errors }, { status: 400 });
    }

    const session = await prisma.trainingSession.update({
      where: { id: sid },
      data: validation.data,
      include: { module: { select: { id: true, title: true } } },
    });

    // Tell participants about a cancelled session that hasn't happened yet.
    if (existing.status !== 'CANCELLED' && session.status === 'CANCELLED' && new Date(session.endsAt) > new Date()) {
      await notifyTrainingParticipants('SESSION_CANCELLED', {
        trainingId: id,
        sessionId: sid,
        dedupeKey: `session-cancelled:${sid}`,
        extra: { reason: typeof body?.reason === 'string' ? body.reason.slice(0, 500) : null },
      });
    }

    // Cancelling, restoring, moving or making a session optional changes everyone's %.
    if (
      existing.status !== session.status
      || existing.isAttendanceRequired !== session.isAttendanceRequired
      || +existing.startsAt !== +session.startsAt
    ) {
      await recomputeAttendancePercent(id);
    }

    await auditTraining({
      trainingId: id,
      actorId: user.id,
      action: existing.status !== session.status
        ? (session.status === 'CANCELLED' ? 'SESSION_CANCELLED' : 'SESSION_RESTORED')
        : 'SESSION_UPDATED',
      entityType: 'TrainingSession',
      entityId: sid,
      before: sessionAuditSnapshot(existing),
      after: sessionAuditSnapshot(session),
    });

    return NextResponse.json({ success: true, session: serializeSession(session, training, { canSeeLink: true }) });
  } catch (error) {
    console.error('Error updating training session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/training/[id]/sessions/[sid]
 * Delete a session. Training admin only. A training keeps at least one session.
 */
export async function DELETE(request, { params }) {
  try {
    const { id, sid } = await params;
    const access = await requireSessionAdmin(request, id);
    if (access.error) return access.error;
    const { user } = access;

    const existing = await loadSession(id, sid);
    if (!existing) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    // Attendance is recorded against sessions: keep it, cancel the session instead (#92).
    if (await sessionHasAttendance(sid)) {
      return NextResponse.json(
        { error: 'Attendance has been taken for this session. Cancel it instead of deleting it.' },
        { status: 400 }
      );
    }

    const remaining = await prisma.trainingSession.count({ where: { trainingId: id, id: { not: sid } } });
    if (remaining === 0) {
      return NextResponse.json(
        { error: 'A training needs at least one session. Edit this one or add another first.' },
        { status: 400 }
      );
    }

    await prisma.trainingSession.delete({ where: { id: sid } });

    await auditTraining({
      trainingId: id,
      actorId: user.id,
      action: 'SESSION_DELETED',
      entityType: 'TrainingSession',
      entityId: sid,
      before: sessionAuditSnapshot(existing),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting training session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
