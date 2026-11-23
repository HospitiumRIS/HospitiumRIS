import prisma from '@/lib/prisma';

/**
 * Append an entry to the training activity log (#90). Never throws: a failed audit
 * write is logged and must not break the user's action.
 *
 * @param {object} entry
 * @param {string} entry.trainingId
 * @param {string|null} entry.actorId
 * @param {string} entry.action        e.g. REGISTRATION_STATUS_CHANGED, CERTIFICATE_UPLOADED
 * @param {string} entry.entityType    e.g. TrainingRegistration
 * @param {string} entry.entityId
 * @param {object} [entry.before]
 * @param {object} [entry.after]
 * @param {string} [entry.reason]
 * @param {object} [db]                prisma client. Call it after a transaction commits, not
 *                                     inside one: a swallowed error would abort the transaction.
 */
export async function auditTraining(entry, db = prisma) {
  try {
    await db.trainingAuditLog.create({
      data: {
        trainingId: entry.trainingId,
        actorId: entry.actorId || null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        before: entry.before ?? undefined,
        after: entry.after ?? undefined,
        reason: entry.reason || null,
      },
    });
  } catch (error) {
    console.error('Training audit write failed:', error?.message || error);
  }
}
