import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { auditTraining } from '@/lib/training-audit';
import { notifyTraining } from '@/lib/training-notify';
import { checkRegistrationTransition, transitionFreesSeat, transitionTakesSeat } from '@/lib/training-registration-state';
import { promoteWaitlist, seatCount } from '@/lib/training-enrolment-server';
import { refreshTrainingProgress } from '@/lib/training-progress-server';
import { autoIssueCertificates } from '@/lib/training-certificates-server';

const NOTIFY = {
  // [from-status pattern, to-status] -> kind
  approve: 'REGISTRATION_APPROVED',
  reject: 'REGISTRATION_REJECTED',
  cancel: 'REGISTRATION_CANCELLED',
  confirm: 'REGISTRATION_CONFIRMED',
  promoted: 'PROMOTED_FROM_WAITLIST',
};

/**
 * Change one registration's status as an admin (#90, #96, #102): validates the
 * transition, checks capacity under a row lock when the change takes a place, records
 * who approved/rejected/cancelled and why, then tells the participant, refreshes
 * progress, promotes the waiting list when a place frees up, and issues certificates
 * for AUTO trainings on completion.
 *
 * @param {object} registration  with .training
 * @param {string} status
 * @param {{ actor: object, reason?: string|null }} options
 * @returns {Promise<{ ok: true, changed: boolean } | { ok: false, error: string }>}
 */
export async function applyRegistrationStatus(registration, status, { actor, reason = null }) {
  const transition = checkRegistrationTransition(registration.status, status, { actor: 'admin' });
  if (!transition.ok) return { ok: false, error: transition.error };
  if (transition.noop) return { ok: true, changed: false };

  const from = registration.status;
  const trainingId = registration.trainingId;
  const note = typeof reason === 'string' && reason.trim() ? reason.trim().slice(0, 500) : null;
  const now = new Date();

  const outcome = await prisma.$transaction(async (tx) => {
    if (transitionTakesSeat(from, status)) {
      await tx.$queryRaw`SELECT "id" FROM "trainings" WHERE "id" = ${trainingId} FOR UPDATE`;
      const taken = await seatCount(trainingId, tx, registration.id);
      if (taken >= (registration.training.maxParticipants || 0)) {
        return { error: 'Training is full. Increase the number of places first.' };
      }
    }

    const data = { status };
    if (status === 'COMPLETED' || status === 'NOT_COMPLETED') {
      // Completing or failing someone by hand is an override (#96).
      data.completionOverride = { type: status === 'COMPLETED' ? 'COMPLETE' : 'INCOMPLETE', reason: note || 'Set manually', by: actor.id, at: now.toISOString() };
      data.completedAt = status === 'COMPLETED' ? now : null;
    } else if (status === 'REGISTERED') {
      data.completionOverride = Prisma.DbNull;
      data.completedAt = null;
      if (from === 'PENDING_APPROVAL' || from === 'WAITLISTED' || from === 'REJECTED') {
        data.approvedBy = actor.id;
        data.approvedAt = now;
      }
    }
    if (status === 'REJECTED') data.rejectedReason = note;
    if (status === 'CANCELLED') {
      data.cancelledAt = now;
      data.cancelReason = note || 'Cancelled by the training team';
    }
    await tx.trainingRegistration.update({ where: { id: registration.id }, data });
    return {};
  });
  if (outcome.error) return { ok: false, error: outcome.error };

  await refreshTrainingProgress(trainingId, [registration.id], { actorId: actor.id });

  let kind = null;
  if (status === 'CANCELLED') kind = NOTIFY.cancel;
  else if (status === 'REJECTED') kind = NOTIFY.reject;
  else if (status === 'REGISTERED' && from === 'PENDING_APPROVAL') kind = NOTIFY.approve;
  else if (status === 'REGISTERED' && from === 'WAITLISTED') kind = NOTIFY.promoted;
  else if (status === 'PENDING_APPROVAL' && from === 'WAITLISTED') kind = NOTIFY.promoted;
  else if (status === 'REGISTERED' && (from === 'CANCELLED' || from === 'REJECTED')) kind = NOTIFY.confirm;
  if (kind) {
    await notifyTraining(kind, {
      userId: registration.userId,
      trainingId,
      extra: { reason: note, awaitingApproval: status === 'PENDING_APPROVAL' },
    });
  }
  if (status === 'COMPLETED') {
    await notifyTraining('TRAINING_COMPLETED', { userId: registration.userId, trainingId, dedupeKey: `completed:${registration.id}` });
    await autoIssueCertificates(trainingId, [registration.id]);
  } else if (status === 'NOT_COMPLETED') {
    await notifyTraining('TRAINING_NOT_COMPLETED', { userId: registration.userId, trainingId, dedupeKey: `not-completed:${registration.id}` });
  }

  await auditTraining({
    trainingId,
    actorId: actor.id,
    action: 'REGISTRATION_STATUS_CHANGED',
    entityType: 'TrainingRegistration',
    entityId: registration.id,
    before: { status: from },
    after: { status },
    reason: note,
  });

  if (transitionFreesSeat(from, status)) await promoteWaitlist(trainingId, { actorId: actor.id });
  return { ok: true, changed: true };
}
