import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { auditTraining } from '@/lib/training-audit';
import { requireSessionAdmin } from '@/lib/training-sessions-server';
import { refreshTrainingProgress } from '@/lib/training-progress-server';
import { notifyTraining } from '@/lib/training-notify';

/**
 * POST /api/training/[id]/registrations/[regId]/override
 * Body: { type: 'COMPLETE' | 'INCOMPLETE' | 'CLEAR', reason }
 * Force a completion outcome regardless of the rules, or hand it back to the rules (#96).
 * A reason is required to force. Training admin only; audited.
 */
export async function POST(request, { params }) {
  try {
    const { id, regId } = await params;
    const access = await requireSessionAdmin(request, id);
    if (access.error) return access.error;
    const { user } = access;

    const registration = await prisma.trainingRegistration.findUnique({ where: { id: regId } });
    if (!registration || registration.trainingId !== id) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }
    if (registration.status === 'CANCELLED') {
      return NextResponse.json({ error: 'This registration is cancelled' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const type = body?.type;
    const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 500) : '';
    if (!['COMPLETE', 'INCOMPLETE', 'CLEAR'].includes(type)) {
      return NextResponse.json({ error: 'type must be COMPLETE, INCOMPLETE or CLEAR' }, { status: 400 });
    }
    if (type !== 'CLEAR' && !reason) {
      return NextResponse.json({ error: 'Give a reason for the override' }, { status: 400 });
    }

    const before = { status: registration.status, override: registration.completionOverride };
    if (type === 'CLEAR') {
      await prisma.trainingRegistration.update({
        where: { id: regId },
        data: {
          completionOverride: Prisma.DbNull,
          // Back to the rules: start from REGISTERED and let the engine decide.
          ...(registration.status !== 'REGISTERED' ? { status: 'REGISTERED', completedAt: null } : {}),
        },
      });
      await refreshTrainingProgress(id, [regId], { actorId: user.id });
    } else {
      const now = new Date();
      await prisma.trainingRegistration.update({
        where: { id: regId },
        data: {
          status: type === 'COMPLETE' ? 'COMPLETED' : 'NOT_COMPLETED',
          completedAt: type === 'COMPLETE' ? now : null,
          completionOverride: { type, reason, by: user.id, at: now.toISOString() },
        },
      });
    }

    const after = await prisma.trainingRegistration.findUnique({
      where: { id: regId },
      select: { id: true, status: true, completedAt: true, completionOverride: true },
    });

    if (type !== 'CLEAR' && after.status !== before.status) {
      await notifyTraining(type === 'COMPLETE' ? 'TRAINING_COMPLETED' : 'TRAINING_NOT_COMPLETED', {
        userId: registration.userId,
        trainingId: id,
        dedupeKey: `${type === 'COMPLETE' ? 'completed' : 'not-completed'}:${regId}`,
      });
    }

    await auditTraining({
      trainingId: id,
      actorId: user.id,
      action: type === 'CLEAR' ? 'COMPLETION_OVERRIDE_CLEARED' : 'COMPLETION_OVERRIDDEN',
      entityType: 'TrainingRegistration',
      entityId: regId,
      before,
      after: { status: after.status, override: after.completionOverride },
      reason: reason || null,
    });

    return NextResponse.json({ success: true, registration: after });
  } catch (error) {
    console.error('Error overriding completion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
