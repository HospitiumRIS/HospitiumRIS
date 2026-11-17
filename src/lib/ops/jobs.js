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
  const [usage, auth, admin] = await Promise.all([
    prisma.usageEvent.deleteMany({ where: { createdAt: { lt: new Date(now - usageDays * DAY_MS) } } }),
    prisma.auditEvent.deleteMany({
      where: { category: 'AUTH', createdAt: { lt: new Date(now - authDays * DAY_MS) } },
    }),
    prisma.auditEvent.deleteMany({
      where: { category: { in: ['ADMIN', 'SYSTEM'] }, createdAt: { lt: new Date(now - adminDays * DAY_MS) } },
    }),
  ]);
  return {
    summary: `Removed ${usage.count} usage, ${auth.count} sign-in and ${admin.count} admin/system events past retention`,
    metadata: { usageDeleted: usage.count, authDeleted: auth.count, adminDeleted: admin.count, usageDays, authDays, adminDays },
  };
}

async function runAnonymizeDeletedUsers() {
  const anonymized = await anonymizeExpiredDeletedUsers();
  return {
    summary: `Anonymised ${anonymized.length} account(s) deleted more than ${ANONYMIZE_AFTER_DAYS} days ago`,
    metadata: { anonymized: anonymized.length },
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
