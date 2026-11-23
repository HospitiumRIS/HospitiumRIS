import prisma from '@/lib/prisma';
import { sendBrandedEmail } from '@/lib/email';
import { buildTrainingEmail, shouldDeliver } from '@/lib/training-email';
import { effectiveSessionDelivery } from '@/lib/training-sessions';

function appBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
}

/**
 * Notify one person about a training event (#97): an in-app notification and the
 * branded email, following their notification preferences. Never throws; the email
 * is sent in the background so the request isn't held up by SMTP.
 *
 * @param {string} kind     see TRAINING_EMAIL_KINDS
 * @param {object} args
 * @param {string} args.userId
 * @param {string} args.trainingId
 * @param {string} [args.sessionId]
 * @param {string} [args.dedupeKey]  skip if this person already has a notification with this key
 * @param {object} [args.extra]      reason, dueDate, reminder, waitlistPosition, certificate, checks
 */
export async function notifyTraining(kind, { userId, trainingId, sessionId = null, dedupeKey = null, extra = {} }) {
  try {
    if (dedupeKey) {
      const existing = await prisma.notification.findFirst({
        where: { userId, trainingId, data: { path: ['dedupeKey'], equals: dedupeKey } },
        select: { id: true },
      });
      if (existing) return { skipped: 'duplicate' };
    }

    const [user, training, session] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, givenName: true, familyName: true, status: true, notificationPreferences: true },
      }),
      prisma.training.findUnique({
        where: { id: trainingId },
        select: { id: true, title: true, startDate: true, endDate: true, venue: true, deliveryMode: true, onlineLink: true },
      }),
      sessionId ? prisma.trainingSession.findUnique({ where: { id: sessionId } }) : null,
    ]);
    if (!user || !training) return { skipped: 'missing' };

    const prefs = user.notificationPreferences || null;
    const sessionData = session
      ? { ...session, venue: effectiveSessionDelivery(session, training).venue }
      : null;
    const email = buildTrainingEmail(kind, {
      ...extra,
      baseUrl: appBaseUrl(),
      recipient: user,
      training,
      session: sessionData,
    });

    const wantsInApp = shouldDeliver(prefs, 'inApp');
    const wantsEmail = shouldDeliver(prefs, 'email') && Boolean(user.email) && user.status !== 'DELETED';

    let notification = null;
    if (wantsInApp || dedupeKey) {
      // With a dedupe key the row is also the record that this was sent, so it is
      // stored (archived) even when the person turned in-app notifications off.
      notification = await prisma.notification.create({
        data: {
          userId,
          trainingId,
          type: email.notification.type,
          title: email.notification.title,
          message: email.notification.message,
          priority: email.notification.priority,
          category: 'TRAINING',
          actionUrl: email.notification.actionUrl,
          actionLabel: email.notification.actionLabel,
          data: { kind, ...(dedupeKey ? { dedupeKey } : {}), ...(sessionId ? { sessionId } : {}) },
          ...(wantsInApp ? {} : { isArchived: true, archivedAt: new Date() }),
        },
        select: { id: true },
      });
    }

    if (wantsEmail) {
      sendBrandedEmail({ to: user.email, subject: email.subject, html: email.html, text: email.text })
        .then(async (result) => {
          if (result.success && notification) {
            await prisma.notification.update({
              where: { id: notification.id },
              data: { sentViaEmail: true, emailSentAt: new Date() },
            }).catch(() => {});
          }
        })
        .catch((error) => console.error('Training email failed:', error?.message || error));
    }
    return { notified: true, inApp: wantsInApp, email: wantsEmail };
  } catch (error) {
    console.error(`Training notification ${kind} failed:`, error?.message || error);
    return { error: true };
  }
}

/** Notify every active participant of a training (e.g. a cancelled session). */
export async function notifyTrainingParticipants(kind, { trainingId, sessionId = null, dedupeKey = null, extra = {} }) {
  const registrations = await prisma.trainingRegistration.findMany({
    where: { trainingId, status: { in: ['REGISTERED', 'COMPLETED', 'NOT_COMPLETED'] } },
    select: { userId: true },
  });
  let count = 0;
  for (const { userId } of registrations) {
    const r = await notifyTraining(kind, { userId, trainingId, sessionId, dedupeKey, extra });
    if (r?.notified) count += 1;
  }
  return count;
}
