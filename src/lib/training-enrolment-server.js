import prisma from '@/lib/prisma';
import { auditTraining } from '@/lib/training-audit';
import { notifyTraining } from '@/lib/training-notify';
import { SEAT_STATUSES, checkEligibility, pickPromotions, promotionTarget, waitlistPositions } from '@/lib/training-enrolment';

/** Places taken (pending requests included), optionally inside a transaction. */
export async function seatCount(trainingId, db = prisma, excludeRegistrationId = null) {
  return db.trainingRegistration.count({
    where: {
      trainingId,
      status: { in: SEAT_STATUSES },
      ...(excludeRegistrationId ? { id: { not: excludeRegistrationId } } : {}),
    },
  });
}

/**
 * Move people up from the waiting list into free places (#102), under a row lock so
 * two cancellations can't promote into the same place. Promoted people are told.
 * @returns {Promise<string[]>} promoted registration ids
 */
export async function promoteWaitlist(trainingId, { actorId = null } = {}) {
  const { promoted, target } = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "trainings" WHERE "id" = ${trainingId} FOR UPDATE`;
    const training = await tx.training.findUnique({
      where: { id: trainingId },
      select: { id: true, maxParticipants: true, requiresApproval: true, waitlistEnabled: true, status: true, startDate: true },
    });
    if (!training || training.status === 'CANCELLED' || (training.startDate && new Date(training.startDate) <= new Date())) {
      return { promoted: [], target: null };
    }
    const registrations = await tx.trainingRegistration.findMany({
      where: { trainingId, status: { in: [...SEAT_STATUSES, 'WAITLISTED'] } },
      select: { id: true, status: true, registeredAt: true },
    });
    const ids = pickPromotions(registrations, training.maxParticipants);
    const status = promotionTarget(training);
    for (const id of ids) {
      await tx.trainingRegistration.update({ where: { id }, data: { status } });
    }
    return { promoted: ids, target: status };
  });

  if (promoted.length) {
    const rows = await prisma.trainingRegistration.findMany({ where: { id: { in: promoted } }, select: { id: true, userId: true } });
    for (const row of rows) {
      await notifyTraining('PROMOTED_FROM_WAITLIST', {
        userId: row.userId,
        trainingId,
        dedupeKey: `promoted:${row.id}:${Date.now()}`,
        extra: { awaitingApproval: target === 'PENDING_APPROVAL' },
      });
      await auditTraining({
        trainingId,
        actorId,
        action: 'WAITLIST_PROMOTED',
        entityType: 'TrainingRegistration',
        entityId: row.id,
        before: { status: 'WAITLISTED' },
        after: { status: target },
      });
    }
  }
  return promoted;
}

/**
 * Eligibility of one user for many trainings: one query for their completed trainings
 * and one for prerequisite titles.
 * @returns {Map<string, { ok, reasons }>} by training id
 */
export async function eligibilityFor(user, trainings) {
  const prereqIds = [...new Set(trainings.flatMap((t) => t.prerequisiteTrainingIds || []))];
  const [completed, titles, profile] = await Promise.all([
    prereqIds.length
      ? prisma.trainingRegistration.findMany({
          where: { userId: user.id, status: 'COMPLETED', trainingId: { in: prereqIds } },
          select: { trainingId: true },
        })
      : [],
    prereqIds.length ? prisma.training.findMany({ where: { id: { in: prereqIds } }, select: { id: true, title: true } }) : [],
    user.department !== undefined ? null : prisma.user.findUnique({ where: { id: user.id }, select: { department: true } }),
  ]);
  const facts = {
    completedTrainingIds: completed.map((c) => c.trainingId),
    prerequisiteTitles: Object.fromEntries(titles.map((t) => [t.id, t.title])),
  };
  const person = { department: user.department ?? profile?.department ?? null };
  return new Map(trainings.map((t) => [t.id, checkEligibility(t, person, facts)]));
}

/** Seat and waiting-list numbers for a training's registrations (for list/detail views). */
export function enrolmentSummary(training, registrations, userId) {
  const seats = registrations.filter((r) => SEAT_STATUSES.includes(r.status)).length;
  const positions = waitlistPositions(registrations);
  const mine = registrations.find((r) => r.userId === userId) || null;
  return {
    seatsTaken: seats,
    remainingSlots: Math.max(0, (training.maxParticipants || 0) - seats),
    waitlistCount: positions.size,
    myWaitlistPosition: mine ? positions.get(mine.id) || null : null,
  };
}
