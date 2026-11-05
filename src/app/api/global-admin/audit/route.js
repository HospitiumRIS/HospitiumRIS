import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireGlobalAdmin } from '@/lib/require-global-admin';
import { recordAuditEvent, actorFields } from '@/lib/ops/audit';
import { moduleLabel } from '@/lib/ops/modules';
import { retentionSettings } from '@/lib/ops/jobs';

export const dynamic = 'force-dynamic';

const CSV_LIMIT = 10000;

function parseDate(value, endOfDay = false) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value)) d.setUTCHours(23, 59, 59, 999);
  return d;
}

function csvCell(value) {
  if (value == null) return '';
  const text = value instanceof Date ? value.toISOString() : String(value);
  // Neutralise spreadsheet formula injection.
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

function toCsv(header, rows) {
  return [header.map(csvCell).join(','), ...rows.map((r) => r.map(csvCell).join(','))].join('\n');
}

async function institutionNames(ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return new Map();
  const rows = await prisma.institution.findMany({ where: { id: { in: unique } }, select: { id: true, name: true } });
  return new Map(rows.map((r) => [r.id, r.name]));
}

function buildAuditWhere(sp) {
  const and = [];
  const category = sp.get('category');
  if (category && ['AUTH', 'ADMIN', 'SYSTEM'].includes(category)) and.push({ category });
  const action = sp.get('action');
  if (action) and.push({ action });
  const outcome = sp.get('outcome');
  if (outcome === 'SUCCESS' || outcome === 'FAILURE') and.push({ outcome });
  const institutionId = sp.get('institutionId');
  if (institutionId === 'platform') and.push({ institutionId: null });
  else if (institutionId) and.push({ institutionId });
  const actorUserId = sp.get('actorUserId');
  if (actorUserId) and.push({ actorUserId });
  const ip = sp.get('ip');
  if (ip) and.push({ ipAddress: ip });
  const from = parseDate(sp.get('from'));
  const to = parseDate(sp.get('to'), true);
  if (from || to) and.push({ createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } });
  const q = sp.get('q')?.trim();
  if (q) {
    and.push({
      OR: [
        { actorEmail: { contains: q, mode: 'insensitive' } },
        { actorName: { contains: q, mode: 'insensitive' } },
        { summary: { contains: q, mode: 'insensitive' } },
        { ipAddress: { contains: q } },
      ],
    });
  }
  return and.length ? { AND: and } : {};
}

async function buildUsageWhere(sp) {
  const and = [];
  const moduleKey = sp.get('module');
  if (moduleKey) and.push({ module: moduleKey });
  const kind = sp.get('kind');
  if (kind === 'VIEW' || kind === 'ACTION') and.push({ kind });
  const action = sp.get('action');
  if (action) and.push({ action });
  const institutionId = sp.get('institutionId');
  if (institutionId === 'platform') and.push({ institutionId: null });
  else if (institutionId) and.push({ institutionId });
  const userId = sp.get('actorUserId');
  if (userId) and.push({ userId });
  const from = parseDate(sp.get('from'));
  const to = parseDate(sp.get('to'), true);
  if (from || to) and.push({ createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } });
  const q = sp.get('q')?.trim();
  if (q) {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { givenName: { contains: q, mode: 'insensitive' } },
          { familyName: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true },
      take: 200,
    });
    and.push({ OR: [{ userId: { in: users.map((u) => u.id) } }, { route: { contains: q, mode: 'insensitive' } }] });
  }
  return and.length ? { AND: and } : {};
}

async function handleUsage(sp, page, pageSize, csv) {
  const where = await buildUsageWhere(sp);
  const [total, rows] = await Promise.all([
    csv ? Promise.resolve(null) : prisma.usageEvent.count({ where }),
    prisma.usageEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: csv ? 0 : (page - 1) * pageSize,
      take: csv ? CSV_LIMIT : pageSize,
    }),
  ]);
  const userIds = [...new Set(rows.map((r) => r.userId))];
  const [users, names] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, givenName: true, familyName: true, email: true, anonymizedAt: true },
    }),
    institutionNames(rows.map((r) => r.institutionId)),
  ]);
  const userMap = new Map(users.map((u) => [u.id, u]));
  const events = rows.map((r) => {
    const u = userMap.get(r.userId);
    return {
      id: r.id,
      createdAt: r.createdAt,
      userId: r.userId,
      userName: u ? (u.anonymizedAt ? 'Deleted user' : `${u.givenName} ${u.familyName}`.trim()) : 'Unknown user',
      userEmail: u && !u.anonymizedAt ? u.email : null,
      accountType: r.accountType,
      module: r.module,
      moduleLabel: moduleLabel(r.module),
      kind: r.kind,
      action: r.action,
      route: r.route,
      statusCode: r.statusCode,
      institutionId: r.institutionId,
      institutionName: r.institutionId ? names.get(r.institutionId) || 'Unknown institution' : 'No institution',
    };
  });
  return { total, events };
}

async function handleAudit(sp, page, pageSize, csv) {
  const where = buildAuditWhere(sp);
  const [total, rows, actions] = await Promise.all([
    csv ? Promise.resolve(null) : prisma.auditEvent.count({ where }),
    prisma.auditEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: csv ? 0 : (page - 1) * pageSize,
      take: csv ? CSV_LIMIT : pageSize,
    }),
    csv
      ? Promise.resolve([])
      : prisma.auditEvent.groupBy({
          by: ['category', 'action'],
          _count: { _all: true },
          orderBy: { action: 'asc' },
        }),
  ]);
  const names = await institutionNames(rows.map((r) => r.institutionId));
  const events = rows.map((r) => ({
    ...r,
    institutionName: r.institutionId ? names.get(r.institutionId) || 'Unknown institution' : 'Platform-wide',
  }));
  return {
    total,
    events,
    actions: actions.map((a) => ({ category: a.category, action: a.action, count: a._count._all })),
  };
}

export async function GET(request) {
  const { user, error } = await requireGlobalAdmin();
  if (error) return error;

  try {
    const sp = new URL(request.url).searchParams;
    const category = sp.get('category') || '';
    const csv = sp.get('format') === 'csv';
    const page = Math.max(Number.parseInt(sp.get('page'), 10) || 1, 1);
    const pageSize = Math.min(Math.max(Number.parseInt(sp.get('pageSize'), 10) || 50, 1), 100);
    const isUsage = category === 'USAGE';

    const result = isUsage ? await handleUsage(sp, page, pageSize, csv) : await handleAudit(sp, page, pageSize, csv);

    if (csv) {
      await recordAuditEvent(
        {
          category: 'ADMIN',
          action: 'AUDIT_EXPORTED',
          ...actorFields(user),
          institutionId: null,
          summary: `Exported ${result.events.length} ${isUsage ? 'activity' : 'audit'} entries to CSV`,
          metadata: { filters: Object.fromEntries([...sp.entries()].filter(([k]) => k !== 'format')) },
        },
        request
      );

      const body = isUsage
        ? toCsv(
            ['When', 'User', 'Email', 'Account type', 'Institution', 'Module', 'Kind', 'Action', 'Route', 'Status'],
            result.events.map((e) => [e.createdAt, e.userName, e.userEmail, e.accountType, e.institutionName, e.moduleLabel, e.kind, e.action, e.route, e.statusCode])
          )
        : toCsv(
            ['When', 'Category', 'Action', 'Outcome', 'Reason', 'Done by', 'Email', 'Account type', 'Institution', 'What happened', 'Target type', 'Target id', 'IP address', 'User agent'],
            result.events.map((e) => [e.createdAt, e.category, e.action, e.outcome, e.reason, e.actorName, e.actorEmail, e.actorAccountType, e.institutionName, e.summary, e.targetType, e.targetId, e.ipAddress, e.userAgent])
          );
      const stamp = new Date().toISOString().slice(0, 10);
      return new NextResponse(body, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="hospitium-${isUsage ? 'activity' : 'audit'}-${stamp}.csv"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        page,
        pageSize,
        retention: retentionSettings(),
      },
    });
  } catch (err) {
    console.error('Audit log query failed:', err);
    return NextResponse.json({ success: false, error: 'Failed to load audit log' }, { status: 500 });
  }
}
