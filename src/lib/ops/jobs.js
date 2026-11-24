/**
 * Background jobs shown on the Operations > Jobs tab.
 *
 * Each job can be triggered by an external scheduler (cron hitting
 * /api/cron/<route> with `Authorization: Bearer $CRON_SECRET`) or run on
 * demand by a global admin. Every run is written to the audit trail
 * (category SYSTEM, action JOB_RUN) so we can show last run / overdue state.
 */
import prisma from '@/lib/prisma';
import { anonymizeExpiredDeletedUsers, ANONYMIZE_AFTER_DAYS } from '@/lib/user-lifecycle';
import { recordJobRun } from '@/lib/ops/audit';

const DAY_MS = 24 * 60 * 60 * 1000;

export function retentionSettings() {
  const num = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  };
  return {
    usageDays: num(process.env.OPS_USAGE_RETENTION_DAYS, 365),
    authDays: num(process.env.OPS_AUTH_RETENTION_DAYS, 730),
    adminDays: num(process.env.OPS_ADMIN_RETENTION_DAYS, 2555), // ~7 years
  };
}

async function runOpsRetention() {
  const { usageDays, authDays, adminDays } = retentionSettings();
  const now = Date.now();
  const [usage, auth, admin, sessions] = await Promise.all([
    prisma.usageEvent.deleteMany({ where: { createdAt: { lt: new Date(now - usageDays * DAY_MS) } } }),
    prisma.auditEvent.deleteMany({
      where: { category: 'AUTH', createdAt: { lt: new Date(now - authDays * DAY_MS) } },
    }),
    prisma.auditEvent.deleteMany({
      where: { category: { in: ['ADMIN', 'SYSTEM'] }, createdAt: { lt: new Date(now - adminDays * DAY_MS) } },
    }),
    // Sessions past their absolute expiry, or idle longer than the longest
    // idle limit (24 h), can never be used again.
    prisma.session.deleteMany({
      where: { OR: [{ expiresAt: { lt: new Date(now) } }, { lastSeenAt: { lt: new Date(now - DAY_MS) } }] },
    }),
  ]);
  return {
    summary: `Removed ${usage.count} usage, ${auth.count} sign-in and ${admin.count} admin/system events past retention, and ${sessions.count} expired sessions`,
    metadata: { usageDeleted: usage.count, authDeleted: auth.count, adminDeleted: admin.count, sessionsDeleted: sessions.count, usageDays, authDays, adminDays },
  };
}

async function runAnonymizeDeletedUsers() {
  const anonymized = await anonymizeExpiredDeletedUsers();
  return {
    summary: `Anonymised ${anonymized.length} account(s) deleted more than ${ANONYMIZE_AFTER_DAYS} days ago`,
    metadata: { anonymized: anonymized.length },
  };
}

async function runTrainingCompletion() {
  // Imported lazily: keeps the ops module light for the other jobs.
  const { refreshTrainingProgress, trainingsDueForCompletion } = await import('@/lib/training-progress-server');
  const trainings = await trainingsDueForCompletion();
  const totals = { trainings: trainings.length, evaluated: 0, completed: 0, notCompleted: 0, reopened: 0 };
  for (const { id } of trainings) {
    const r = await refreshTrainingProgress(id);
    totals.evaluated += r.evaluated;
    totals.completed += r.completed;
    totals.notCompleted += r.notCompleted;
    totals.reopened += r.reopened;
  }
  return {
    summary: `Checked ${totals.trainings} training(s): ${totals.completed} completed, ${totals.notCompleted} not completed`,
    metadata: totals,
  };
}

async function runTrainingAutomationJob() {
  const { runTrainingAutomation } = await import('@/lib/training-automation-server');
  const r = await runTrainingAutomation();
  if (r.busy) return { summary: 'Already running', metadata: r };
  return {
    summary: `${r.sessionNotices} session notice(s), ${r.reminders} reminder(s), ${r.feedbackRequests} feedback request(s); ${r.closed} training(s) closed; ${r.completed} completed`,
    metadata: r,
  };
}

async function runTrainingReminders() {
  const { sendComplianceReminders } = await import('@/lib/training-assignment-server');
  const r = await sendComplianceReminders();
  // Feedback requests for trainings that ended in the last 14 days (#106).
  const { sendFeedbackRequests } = await import('@/lib/training-feedback-server');
  const f = await sendFeedbackRequests();
  return {
    summary: `Checked ${r.checked} registration(s): ${r.sent} reminder(s), ${f.sent} feedback request(s) sent`,
    metadata: { ...r, feedbackRequests: f.sent },
  };
}

export const OPS_JOBS = {
  ops_retention: {
    key: 'ops_retention',
    label: 'Audit & usage retention',
    description: 'Deletes usage events and audit entries older than their retention period.',
    cronPath: '/api/cron/ops-retention',
    expectedEveryHours: 24,
    run: runOpsRetention,
  },
  training_automation: {
    key: 'training_automation',
    label: 'Training automation',
    description: 'Hourly: 24h and 1h session reminders, check-in open notices, closes ended trainings, decides completion, due / overdue / certificate expiry notices and feedback requests. Safe to repeat.',
    cronPath: '/api/cron/training',
    expectedEveryHours: 1,
    run: runTrainingAutomationJob,
  },
  training_completion: {
    key: 'training_completion',
    label: 'Training completion',
    description: 'Marks participants of ended trainings with completion rules as completed, or not completed once the grace period is over.',
    cronPath: '/api/cron/training-completion',
    expectedEveryHours: 1,
    run: runTrainingCompletion,
  },
  training_reminders: {
    key: 'training_reminders',
    label: 'Training reminders',
    description: 'Due-soon and overdue reminders for assigned trainings, certificate expiring / re-training due notices, and feedback requests after a training ends.',
    cronPath: '/api/cron/training-reminders',
    expectedEveryHours: 24,
    run: runTrainingReminders,
  },
  anonymize_deleted_users: {
    key: 'anonymize_deleted_users',
    label: 'Anonymise deleted accounts',
    description: `Scrubs personal data from accounts deleted more than ${ANONYMIZE_AFTER_DAYS} days ago.`,
    cronPath: '/api/cron/anonymize-deleted-users',
    expectedEveryHours: 24,
    run: runAnonymizeDeletedUsers,
  },
};

/**
 * Run a job and record the outcome. Returns { ok, summary, metadata }.
 */
export async function runOpsJob(key, { actor = null, request = null } = {}) {
  const job = OPS_JOBS[key];
  if (!job) throw new Error(`Unknown job: ${key}`);
  const started = Date.now();
  try {
    const result = await job.run();
    await recordJobRun({
      job: key,
      summary: result.summary,
      metadata: { ...result.metadata, durationMs: Date.now() - started },
      actor,
      request,
    });
    return { ok: true, ...result };
  } catch (error) {
    await recordJobRun({
      job: key,
      outcome: 'FAILURE',
      summary: `${job.label} failed: ${String(error?.message || error).slice(0, 200)}`,
      metadata: { durationMs: Date.now() - started },
      actor,
      request,
    });
    return { ok: false, summary: error?.message || 'Job failed' };
  }
}

export function isCronAuthorized(request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization') || '';
  return Boolean(secret) && auth === `Bearer ${secret}`;
}
