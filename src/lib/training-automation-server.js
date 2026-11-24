import prisma from '@/lib/prisma';
import { auditTraining } from '@/lib/training-audit';
import { notifyTraining } from '@/lib/training-notify';
import { deliverOnce, sessionNotices, trainingsToClose } from '@/lib/training-automation';

/**
 * The hourly training job (#110). Every step is safe to repeat:
 *   1. published trainings past their end date become COMPLETED (only if still PUBLISHED)
 *   2. completion is decided for trainings that ended (attendance, modules, …)
 *   3. 24h / 1h session reminders and "check-in open" notices (dedupe keys)
 *   4. due / overdue / certificate expiring / re-training notices (#103, dedupe keys)
 *   5. feedback requests for trainings that ended in the last 14 days (#106, dedupe keys)
 *   6. the monthly analytics email to admins who opted in (#138, once per month)
 * A run in progress makes a second start in the same process wait for nothing: it
 * returns { busy: true }.
 */
let running = null;
let lastRunAt = 0;

export async function runTrainingAutomation({ now = new Date() } = {}) {
  if (running) return { busy: true };
  running = (async () => {
    const totals = { closed: 0, completionTrainings: 0, completed: 0, notCompleted: 0, sessionNotices: 0, reminders: 0, feedbackRequests: 0, monthlyReports: 0 };

    // 1. Close trainings that have ended.
    const open = await prisma.training.findMany({ where: { status: 'PUBLISHED', endDate: { lt: now } }, select: { id: true, status: true, endDate: true } });
    for (const t of trainingsToClose(open, now)) {
      const changed = await prisma.training.updateMany({ where: { id: t.id, status: 'PUBLISHED' }, data: { status: 'COMPLETED' } });
      if (changed.count) {
        totals.closed += 1;
        await auditTraining({
          trainingId: t.id,
          actorId: null,
          action: 'TRAINING_STATUS_AUTO',
          entityType: 'Training',
          entityId: t.id,
          before: { status: 'PUBLISHED' },
          after: { status: 'COMPLETED' },
          reason: 'End date passed',
        });
      }
    }

    // 2. Decide completion.
    const { refreshTrainingProgress, trainingsDueForCompletion } = await import('@/lib/training-progress-server');
    for (const { id } of await trainingsDueForCompletion(now)) {
      const r = await refreshTrainingProgress(id, null, { now });
      totals.completionTrainings += 1;
      totals.completed += r.completed;
      totals.notCompleted += r.notCompleted;
    }

    // 3. Session reminders and check-in notices.
    const sessions = await prisma.trainingSession.findMany({
      where: {
        status: 'SCHEDULED',
        startsAt: { gte: new Date(now.getTime() - 3 * 60 * 60 * 1000), lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) },
        training: { status: 'PUBLISHED' },
      },
      select: {
        id: true, trainingId: true, status: true, startsAt: true, endsAt: true, deliveryMode: true,
        checkInOpensMinutesBefore: true, checkInClosesMinutesAfter: true,
        training: { select: { status: true, deliveryMode: true } },
      },
    });
    const recipients = new Map();
    const recipientsOf = async ({ trainingId }) => {
      if (!recipients.has(trainingId)) {
        const regs = await prisma.trainingRegistration.findMany({ where: { trainingId, status: 'REGISTERED' }, select: { userId: true } });
        recipients.set(trainingId, regs.map((r) => r.userId));
      }
      return recipients.get(trainingId);
    };
    const sendOnce = async ({ kind, userId, trainingId, sessionId, dedupeKey, extra }) => {
      const r = await notifyTraining(kind, { userId, trainingId, sessionId, dedupeKey, extra });
      return r?.notified ? { sent: true } : { skipped: r?.skipped || 'not sent' };
    };
    totals.sessionNotices = (await deliverOnce(sessionNotices(sessions, now), recipientsOf, sendOnce)).sent;

    // 4–5. Compliance and feedback (their own dedupe keys).
    const { sendComplianceReminders } = await import('@/lib/training-assignment-server');
    totals.reminders = (await sendComplianceReminders({ now })).sent;
    const { sendFeedbackRequests } = await import('@/lib/training-feedback-server');
    totals.feedbackRequests = (await sendFeedbackRequests({ now })).sent;

    // 6. Monthly analytics email to admins who opted in (#138), once per month each.
    const { sendMonthlyAnalyticsReports } = await import('@/lib/training-analytics-server');
    totals.monthlyReports = (await sendMonthlyAnalyticsReports({ now })).sent;

    lastRunAt = Date.now();
    return totals;
  })();
  try {
    return await running;
  } finally {
    running = null;
  }
}

/**
 * Run the job in the background if it hasn't run in this process for 15 minutes. Called
 * from busy training pages, so automation keeps working even without a scheduler.
 */
export function maybeRunTrainingAutomation() {
  if (running || Date.now() - lastRunAt < 15 * 60 * 1000) return;
  lastRunAt = Date.now(); // claim the slot before the async work starts
  runTrainingAutomation().catch((err) => console.error('Training automation failed:', err));
}
