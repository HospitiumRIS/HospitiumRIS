/**
 * Aggregations behind Global Admin > Operations and the institution
 * activity page. Everything here is counts and timestamps - no record
 * content is ever read from the modules themselves.
 */
import os from 'os';
import prisma from '@/lib/prisma';
import { institutionMemberWhere } from '@/lib/institution-admin';
import { getInstitutionVerifiedDomains } from '@/lib/institution-domain';
import { normalizeEnabledModules } from '@/lib/institution-modules';
import { OPS_MODULES, moduleLabel } from '@/lib/ops/modules';
import { OPS_JOBS, retentionSettings } from '@/lib/ops/jobs';
import { readRecentErrors } from '@/lib/ops/errors';

const DAY_MS = 24 * 60 * 60 * 1000;

export function clampDays(value, fallback = 30) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, 1), 365);
}

const toNumber = (value) => (typeof value === 'bigint' ? Number(value) : Number(value || 0));

async function memberScope(institution) {
  const domains = await getInstitutionVerifiedDomains(prisma, institution.id);
  return institutionMemberWhere(institution, domains);
}

function activeAccountWhere(memberWhere) {
  return { AND: [memberWhere, { status: 'ACTIVE' }, { deletedAt: null }] };
}

async function systemSnapshot() {
  const total = os.totalmem();
  const used = total - os.freemem();
  let database = { status: 'healthy', latencyMs: null };
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    database.latencyMs = Date.now() - started;
    if (database.latencyMs > 500) database.status = 'warning';
  } catch (error) {
    database = { status: 'error', latencyMs: null, error: error?.message?.slice(0, 200) };
  }
  return {
    memoryUsagePct: Math.round((used / total) * 1000) / 10,
    processUptimeSeconds: Math.round(process.uptime()),
    hostUptimeSeconds: Math.round(os.uptime()),
    nodeVersion: process.version,
    database,
  };
}

async function jobStatuses() {
  const now = Date.now();
  return Promise.all(
    Object.values(OPS_JOBS).map(async (job) => {
      const [last, lastSuccess] = await Promise.all([
        prisma.auditEvent.findFirst({
          where: { category: 'SYSTEM', action: 'JOB_RUN', targetId: job.key },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.auditEvent.findFirst({
          where: { category: 'SYSTEM', action: 'JOB_RUN', targetId: job.key, outcome: 'SUCCESS' },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        }),
      ]);
      let status = 'ok';
      if (!last) status = 'never_run';
      else if (last.outcome === 'FAILURE') status = 'failed';
      else if (now - last.createdAt.getTime() > job.expectedEveryHours * 1.5 * 60 * 60 * 1000) status = 'overdue';
      return {
        key: job.key,
        label: job.label,
        description: job.description,
        cronPath: job.cronPath,
        expectedEveryHours: job.expectedEveryHours,
        status,
        lastRunAt: last?.createdAt || null,
        lastOutcome: last?.outcome || null,
        lastSummary: last?.summary || null,
        lastTriggeredBy: last?.metadata?.triggeredBy || null,
        lastSuccessAt: lastSuccess?.createdAt || null,
      };
    })
  );
}

/**
 * Platform-wide overview for the Operations page.
 */
export async function getOperationsOverview({ days = 30 } = {}) {
  const now = Date.now();
  const since = new Date(now - days * DAY_MS);
  const last24h = new Date(now - DAY_MS);
  const lastHour = new Date(now - 60 * 60 * 1000);

  const institutions = await prisma.institution.findMany({
    select: { id: true, name: true, slug: true, type: true, country: true, enabledModules: true, userId: true },
    orderBy: { name: 'asc' },
  });

  const [
    system,
    jobs,
    errors,
    activeAccounts,
    signedInUsers,
    failedSignIns24h,
    storageAgg,
    stuckUploads,
    usageByInstitutionModule,
    activeUsersByInstitution,
    authByInstitution,
    lastSignInByInstitution,
    storageByTenant,
    moduleTotals,
    moduleReach,
    bruteForceIps,
    bruteForceAccounts,
    usageEventsToday,
  ] = await Promise.all([
    systemSnapshot(),
    jobStatuses(),
    readRecentErrors({ hours: 24, limit: 50 }),
    prisma.user.count({ where: { status: 'ACTIVE', deletedAt: null, accountType: { not: 'GLOBAL_ADMIN' } } }),
    prisma.user.count({ where: { lastLoginAt: { gte: since }, accountType: { not: 'GLOBAL_ADMIN' } } }),
    prisma.auditEvent.count({ where: { action: 'LOGIN_FAILED', createdAt: { gte: last24h } } }),
    prisma.storedFile.aggregate({ where: { status: 'AVAILABLE' }, _sum: { sizeBytes: true }, _count: { _all: true } }),
    prisma.storedFile.count({ where: { status: 'PENDING', createdAt: { lt: new Date(now - 60 * 60 * 1000) } } }),
    prisma.usageEvent.groupBy({
      by: ['institutionId', 'module'],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.$queryRaw`
      SELECT "institutionId", COUNT(DISTINCT "userId")::int AS users
      FROM "usage_events" WHERE "createdAt" >= ${since}
      GROUP BY "institutionId"`,
    prisma.auditEvent.groupBy({
      by: ['institutionId', 'action'],
      where: { category: 'AUTH', action: { in: ['LOGIN_SUCCESS', 'LOGIN_FAILED'] }, createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.auditEvent.groupBy({
      by: ['institutionId'],
      where: { action: 'LOGIN_SUCCESS' },
      _max: { createdAt: true },
    }),
    prisma.storedFile.groupBy({
      by: ['tenantId'],
      where: { status: 'AVAILABLE' },
      _sum: { sizeBytes: true },
      _count: { _all: true },
    }),
    prisma.usageEvent.groupBy({
      by: ['module', 'kind'],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.$queryRaw`
      SELECT "module",
             COUNT(DISTINCT "userId")::int AS users,
             COUNT(DISTINCT "institutionId")::int AS institutions,
             MAX("createdAt") AS "lastUsedAt"
      FROM "usage_events" WHERE "createdAt" >= ${since}
      GROUP BY "module"`,
    prisma.auditEvent.groupBy({
      by: ['ipAddress'],
      where: { action: 'LOGIN_FAILED', createdAt: { gte: lastHour }, ipAddress: { not: null } },
      _count: { _all: true },
      having: { ipAddress: { _count: { gte: 10 } } },
    }),
    prisma.auditEvent.groupBy({
      by: ['actorEmail'],
      where: { action: 'LOGIN_FAILED', createdAt: { gte: last24h }, actorEmail: { not: null } },
      _count: { _all: true },
      having: { actorEmail: { _count: { gte: 5 } } },
    }),
    prisma.usageEvent.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
  ]);

  // ---- per-institution table -------------------------------------------
  const usageMap = new Map();
  for (const row of usageByInstitutionModule) {
    const key = row.institutionId || '_none';
    if (!usageMap.has(key)) usageMap.set(key, {});
    usageMap.get(key)[row.module] = (usageMap.get(key)[row.module] || 0) + row._count._all;
  }
  const activeUsersMap = new Map(activeUsersByInstitution.map((r) => [r.institutionId, toNumber(r.users)]));
  const authMap = new Map();
  for (const row of authByInstitution) {
    const key = row.institutionId || '_none';
    if (!authMap.has(key)) authMap.set(key, { LOGIN_SUCCESS: 0, LOGIN_FAILED: 0 });
    authMap.get(key)[row.action] = row._count._all;
  }
  const lastSignInMap = new Map(lastSignInByInstitution.map((r) => [r.institutionId, r._max.createdAt]));
  const storageMap = new Map(storageByTenant.map((r) => [r.tenantId, { bytes: toNumber(r._sum.sizeBytes), files: r._count._all }]));

  const institutionRows = await Promise.all(
    institutions.map(async (institution) => {
      const memberWhere = await memberScope(institution);
      const [accounts, lastLogin] = await Promise.all([
        prisma.user.count({ where: activeAccountWhere(memberWhere) }),
        prisma.user.aggregate({ where: memberWhere, _max: { lastLoginAt: true } }),
      ]);
      const modules = usageMap.get(institution.id) || {};
      const topModules = Object.entries(modules)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([key, count]) => ({ key, label: moduleLabel(key), count }));
      const auth = authMap.get(institution.id) || { LOGIN_SUCCESS: 0, LOGIN_FAILED: 0 };
      const lastSignInCandidates = [lastSignInMap.get(institution.id), lastLogin._max.lastLoginAt].filter(Boolean);
      const storage = storageMap.get(institution.id) || { bytes: 0, files: 0 };
      return {
        id: institution.id,
        name: institution.name,
        type: institution.type,
        country: institution.country,
        enabledModules: normalizeEnabledModules(institution.enabledModules),
        accounts,
        activeUsers: activeUsersMap.get(institution.id) || 0,
        signIns: auth.LOGIN_SUCCESS,
        failedSignIns: auth.LOGIN_FAILED,
        events: Object.values(modules).reduce((sum, n) => sum + n, 0),
        topModules,
        storageBytes: storage.bytes,
        files: storage.files,
        lastSignInAt: lastSignInCandidates.length
          ? new Date(Math.max(...lastSignInCandidates.map((d) => new Date(d).getTime())))
          : null,
      };
    })
  );

  // ---- module usage across the platform ----------------------------------
  const reachMap = new Map(moduleReach.map((r) => [r.module, r]));
  const moduleRows = OPS_MODULES.map((m) => {
    const views = moduleTotals.find((r) => r.module === m.key && r.kind === 'VIEW')?._count._all || 0;
    const actions = moduleTotals.find((r) => r.module === m.key && r.kind === 'ACTION')?._count._all || 0;
    const reach = reachMap.get(m.key);
    const enabledAt = m.enablementKey
      ? institutions.filter((i) => normalizeEnabledModules(i.enabledModules).includes(m.enablementKey)).length
      : null;
    return {
      key: m.key,
      label: m.label,
      views,
      actions,
      users: toNumber(reach?.users),
      institutions: toNumber(reach?.institutions),
      enabledAt,
      lastUsedAt: reach?.lastUsedAt || null,
    };
  }).filter((row) => row.views || row.actions || row.enabledAt);

  // ---- needs attention ----------------------------------------------------
  const attention = [];
  if (system.database.status === 'error') {
    attention.push({ severity: 'error', code: 'database_down', message: 'Database is not responding', tab: 'health' });
  } else if (system.database.status === 'warning') {
    attention.push({ severity: 'warning', code: 'database_slow', message: `Database is slow to respond (${system.database.latencyMs} ms)`, tab: 'health' });
  }
  if (system.memoryUsagePct >= 90) {
    attention.push({ severity: 'warning', code: 'memory_high', message: `Server memory is ${system.memoryUsagePct}% used`, tab: 'health' });
  }
  for (const job of jobs) {
    if (job.status === 'failed') attention.push({ severity: 'error', code: 'job_failed', message: `Background job "${job.label}" failed on its last run`, tab: 'jobs' });
    if (job.status === 'overdue') attention.push({ severity: 'warning', code: 'job_overdue', message: `Background job "${job.label}" has not run in over ${job.expectedEveryHours} hours`, tab: 'jobs' });
    if (job.status === 'never_run') attention.push({ severity: 'info', code: 'job_never_run', message: `Background job "${job.label}" has never run - schedule ${job.cronPath}`, tab: 'jobs' });
  }
  if (bruteForceIps.length) {
    attention.push({
      severity: 'error',
      code: 'brute_force_ip',
      message: `${bruteForceIps.length} IP address(es) with 10+ failed sign-ins in the last hour`,
      tab: 'audit',
      detail: bruteForceIps.map((r) => ({ ip: r.ipAddress, count: r._count._all })),
    });
  }
  if (bruteForceAccounts.length) {
    attention.push({
      severity: 'warning',
      code: 'brute_force_account',
      message: `${bruteForceAccounts.length} account(s) with 5+ failed sign-ins in the last 24 hours`,
      tab: 'audit',
    });
  }
  if (stuckUploads > 0) {
    attention.push({ severity: 'warning', code: 'uploads_stuck', message: `${stuckUploads} file upload(s) stuck in "pending" for over an hour`, tab: 'health' });
  }
  if (errors.total > 0) {
    attention.push({ severity: 'warning', code: 'app_errors', message: `${errors.total} application error(s) in the last 24 hours`, tab: 'errors' });
  }
  const dormant = institutionRows.filter((row) => row.accounts > 0 && row.signIns === 0 && row.activeUsers === 0);
  if (dormant.length) {
    attention.push({
      severity: 'info',
      code: 'dormant_institutions',
      message: `${dormant.length} institution(s) with no sign-ins or activity in the last ${days} days`,
      tab: 'usage',
    });
  }

  return {
    generatedAt: new Date(),
    days,
    retention: retentionSettings(),
    attention,
    kpis: {
      institutions: institutions.length,
      activeAccounts,
      signedInUsers,
      failedSignIns24h,
      storageBytes: toNumber(storageAgg._sum.sizeBytes),
      files: storageAgg._count._all,
      usageEventsToday,
      errors24h: errors.total,
    },
    system,
    jobs,
    errors: errors.errors,
    institutions: institutionRows,
    modules: moduleRows,
  };
}

function fillDays(days, since) {
  const out = [];
  const start = new Date(since);
  start.setUTCHours(0, 0, 0, 0);
  for (let i = 0; i <= days; i += 1) {
    const d = new Date(start.getTime() + i * DAY_MS);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

/**
 * Activity for one institution. Counts only - nothing is read from the
 * institution's records themselves.
 */
export async function getInstitutionActivity(institutionId, { days = 30 } = {}) {
  const institution = await prisma.institution.findUnique({
    where: { id: institutionId },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      country: true,
      website: true,
      enabledModules: true,
      userId: true,
      createdAt: true,
    },
  });
  if (!institution) return null;

  const now = Date.now();
  const since = new Date(now - days * DAY_MS);
  const memberWhere = await memberScope(institution);
  const enabled = normalizeEnabledModules(institution.enabledModules);

  const [
    accountsByType,
    accountsByStatus,
    newAccounts,
    lastLogin,
    authCounts,
    usageByModuleKind,
    moduleReach,
    activeUsersRow,
    dailyUsage,
    dailyAuth,
    topUsers,
    recentAuth,
    recentAdmin,
    failedByIp,
    storage,
    storageByModule,
  ] = await Promise.all([
    prisma.user.groupBy({ by: ['accountType'], where: { AND: [memberWhere, { deletedAt: null }] }, _count: { _all: true } }),
    prisma.user.groupBy({ by: ['status'], where: memberWhere, _count: { _all: true } }),
    prisma.user.count({ where: { AND: [memberWhere, { createdAt: { gte: since } }] } }),
    prisma.user.aggregate({ where: memberWhere, _max: { lastLoginAt: true } }),
    prisma.auditEvent.groupBy({
      by: ['action'],
      where: { institutionId, category: 'AUTH', createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.usageEvent.groupBy({
      by: ['module', 'kind'],
      where: { institutionId, createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.$queryRaw`
      SELECT "module", COUNT(DISTINCT "userId")::int AS users, MAX("createdAt") AS "lastUsedAt"
      FROM "usage_events"
      WHERE "institutionId" = ${institutionId} AND "createdAt" >= ${since}
      GROUP BY "module"`,
    prisma.$queryRaw`
      SELECT COUNT(DISTINCT u)::int AS users FROM (
        SELECT "userId" AS u FROM "usage_events" WHERE "institutionId" = ${institutionId} AND "createdAt" >= ${since}
        UNION
        SELECT "actorUserId" AS u FROM "audit_events"
        WHERE "institutionId" = ${institutionId} AND "action" = 'LOGIN_SUCCESS' AND "createdAt" >= ${since}
      ) t WHERE u IS NOT NULL`,
    prisma.$queryRaw`
      SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day, "kind", COUNT(*)::int AS n,
             COUNT(DISTINCT "userId")::int AS users
      FROM "usage_events"
      WHERE "institutionId" = ${institutionId} AND "createdAt" >= ${since}
      GROUP BY 1, 2`,
    prisma.$queryRaw`
      SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day, "action", COUNT(*)::int AS n
      FROM "audit_events"
      WHERE "institutionId" = ${institutionId} AND "category" = 'AUTH'
        AND "action" IN ('LOGIN_SUCCESS', 'LOGIN_FAILED') AND "createdAt" >= ${since}
      GROUP BY 1, 2`,
    prisma.$queryRaw`
      SELECT "userId",
             COUNT(*) FILTER (WHERE "kind" = 'VIEW')::int AS views,
             COUNT(*) FILTER (WHERE "kind" = 'ACTION')::int AS actions,
             COUNT(DISTINCT "module")::int AS modules,
             MAX("createdAt") AS "lastActiveAt"
      FROM "usage_events"
      WHERE "institutionId" = ${institutionId} AND "createdAt" >= ${since}
      GROUP BY "userId"
      ORDER BY COUNT(*) DESC
      LIMIT 10`,
    prisma.auditEvent.findMany({
      where: { institutionId, category: 'AUTH' },
      orderBy: { createdAt: 'desc' },
      take: 25,
    }),
    prisma.auditEvent.findMany({
      where: { institutionId, category: 'ADMIN' },
      orderBy: { createdAt: 'desc' },
      take: 25,
    }),
    prisma.auditEvent.groupBy({
      by: ['ipAddress'],
      where: { institutionId, action: 'LOGIN_FAILED', createdAt: { gte: since }, ipAddress: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { ipAddress: 'desc' } },
      take: 5,
    }),
    prisma.storedFile.aggregate({
      where: { tenantId: institutionId, status: 'AVAILABLE' },
      _sum: { sizeBytes: true },
      _count: { _all: true },
    }),
    prisma.storedFile.groupBy({
      by: ['module'],
      where: { tenantId: institutionId, status: 'AVAILABLE' },
      _sum: { sizeBytes: true },
      _count: { _all: true },
    }),
  ]);

  const authCount = (action) => authCounts.find((r) => r.action === action)?._count._all || 0;
  const usageCount = (moduleKey, kind) =>
    usageByModuleKind
      .filter((r) => (!moduleKey || r.module === moduleKey) && (!kind || r.kind === kind))
      .reduce((sum, r) => sum + r._count._all, 0);

  // Module breakdown: every module used, plus enabled modules nobody used.
  const reachMap = new Map(moduleReach.map((r) => [r.module, r]));
  const modules = OPS_MODULES.map((m) => {
    const views = usageCount(m.key, 'VIEW');
    const actions = usageCount(m.key, 'ACTION');
    const isEnabled = m.enablementKey ? enabled.includes(m.enablementKey) : null;
    const reach = reachMap.get(m.key);
    return {
      key: m.key,
      label: m.label,
      enabled: isEnabled,
      views,
      actions,
      users: toNumber(reach?.users),
      lastUsedAt: reach?.lastUsedAt || null,
    };
  })
    .filter((row) => row.views || row.actions || row.enabled)
    .sort((a, b) => b.views + b.actions - (a.views + a.actions));

  // Daily trend
  const trend = fillDays(days, since).map((day) => ({ day, views: 0, actions: 0, activeUsers: 0, signIns: 0, failedSignIns: 0 }));
  const trendMap = new Map(trend.map((row) => [row.day, row]));
  for (const row of dailyUsage) {
    const t = trendMap.get(row.day);
    if (!t) continue;
    if (row.kind === 'VIEW') t.views += toNumber(row.n);
    else t.actions += toNumber(row.n);
    t.activeUsers = Math.max(t.activeUsers, toNumber(row.users));
  }
  for (const row of dailyAuth) {
    const t = trendMap.get(row.day);
    if (!t) continue;
    if (row.action === 'LOGIN_SUCCESS') t.signIns += toNumber(row.n);
    else t.failedSignIns += toNumber(row.n);
  }

  // Top users - names + counts only
  const topUserIds = topUsers.map((r) => r.userId);
  const [users, signInsByUser] = topUserIds.length
    ? await Promise.all([
        prisma.user.findMany({
          where: { id: { in: topUserIds } },
          select: { id: true, givenName: true, familyName: true, accountType: true, lastLoginAt: true, anonymizedAt: true },
        }),
        prisma.auditEvent.groupBy({
          by: ['actorUserId'],
          where: { actorUserId: { in: topUserIds }, action: 'LOGIN_SUCCESS', createdAt: { gte: since } },
          _count: { _all: true },
        }),
      ])
    : [[], []];
  const userMap = new Map(users.map((u) => [u.id, u]));
  const signInMap = new Map(signInsByUser.map((r) => [r.actorUserId, r._count._all]));

  const serializeEvent = (e) => ({
    id: e.id,
    createdAt: e.createdAt,
    action: e.action,
    outcome: e.outcome,
    reason: e.reason,
    summary: e.summary,
    actorName: e.actorName,
    actorEmail: e.actorEmail,
    actorAccountType: e.actorAccountType,
    ipAddress: e.ipAddress,
    userAgent: e.userAgent,
    metadata: e.metadata,
  });

  const lastSignInEvent = recentAuth.find((e) => e.action === 'LOGIN_SUCCESS');
  const lastSignInCandidates = [lastSignInEvent?.createdAt, lastLogin._max.lastLoginAt].filter(Boolean);

  return {
    days,
    generatedAt: new Date(),
    institution: {
      ...institution,
      enabledModules: enabled,
    },
    kpis: {
      accounts: accountsByStatus.filter((r) => r.status === 'ACTIVE').reduce((s, r) => s + r._count._all, 0),
      totalAccounts: accountsByStatus.reduce((s, r) => s + r._count._all, 0),
      newAccounts,
      activeUsers: toNumber(activeUsersRow?.[0]?.users),
      signIns: authCount('LOGIN_SUCCESS'),
      failedSignIns: authCount('LOGIN_FAILED'),
      views: usageCount(null, 'VIEW'),
      actions: usageCount(null, 'ACTION'),
      storageBytes: toNumber(storage._sum.sizeBytes),
      files: storage._count._all,
      lastSignInAt: lastSignInCandidates.length
        ? new Date(Math.max(...lastSignInCandidates.map((d) => new Date(d).getTime())))
        : null,
    },
    accountsByType: accountsByType.map((r) => ({ accountType: r.accountType, count: r._count._all })),
    accountsByStatus: accountsByStatus.map((r) => ({ status: r.status, count: r._count._all })),
    modules,
    trend,
    topUsers: topUsers.map((r) => {
      const u = userMap.get(r.userId);
      return {
        userId: r.userId,
        name: u ? (u.anonymizedAt ? 'Deleted user' : `${u.givenName} ${u.familyName}`.trim()) : 'Unknown user',
        accountType: u?.accountType || null,
        views: toNumber(r.views),
        actions: toNumber(r.actions),
        modules: toNumber(r.modules),
        signIns: signInMap.get(r.userId) || 0,
        lastActiveAt: r.lastActiveAt,
      };
    }),
    failedSignInSources: failedByIp.map((r) => ({ ipAddress: r.ipAddress, count: r._count._all })),
    storageByModule: storageByModule.map((r) => ({ module: r.module, bytes: toNumber(r._sum.sizeBytes), files: r._count._all })),
    recentSignIns: recentAuth.map(serializeEvent),
    recentAdminChanges: recentAdmin.map(serializeEvent),
  };
}
