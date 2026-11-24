import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireSessionAdmin } from '@/lib/training-sessions-server';
import { auditActionLabel, auditChanges } from '@/lib/training-automation';

const PAGE = 50;

function dayBound(value, end) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return new Date(`${value}T${end ? '23:59:59.999' : '00:00:00.000'}Z`);
}

/**
 * GET /api/training/[id]/activity?action=&actor=me|system|<userId>&from=&to=&q=&page=[&format=csv]
 * The training's activity log (#110), newest first, for its admins.
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireSessionAdmin(request, id);
    if (access.error) return access.error;
    const p = new URL(request.url).searchParams;

    const where = { trainingId: id };
    if (p.get('action')) where.action = p.get('action');
    const actor = p.get('actor');
    if (actor === 'system') where.actorId = null;
    else if (actor === 'me') where.actorId = access.user.id;
    else if (actor) where.actorId = actor;
    const from = dayBound(p.get('from'), false);
    const to = dayBound(p.get('to'), true);
    if (from || to) where.createdAt = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
    const q = (p.get('q') || '').trim();
    if (q) where.OR = [{ entityId: { contains: q } }, { reason: { contains: q, mode: 'insensitive' } }];

    const csv = p.get('format') === 'csv';
    const page = Math.max(1, Number(p.get('page')) || 1);
    const [total, logs, actions] = await Promise.all([
      prisma.trainingAuditLog.count({ where }),
      prisma.trainingAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...(csv ? { take: 10000 } : { skip: (page - 1) * PAGE, take: PAGE }),
      }),
      prisma.trainingAuditLog.groupBy({ by: ['action'], where: { trainingId: id }, _count: { _all: true } }),
    ]);

    const actorIds = [...new Set(logs.map((l) => l.actorId).filter(Boolean))];
    const actors = actorIds.length
      ? await prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, givenName: true, familyName: true, email: true } })
      : [];
    const actorName = new Map(actors.map((u) => [u.id, `${u.givenName || ''} ${u.familyName || ''}`.trim() || u.email]));

    const rows = logs.map((l) => ({
      id: l.id,
      createdAt: l.createdAt,
      action: l.action,
      label: auditActionLabel(l.action),
      actor: l.actorId ? actorName.get(l.actorId) || 'Former user' : 'System',
      actorId: l.actorId,
      entityType: l.entityType,
      entityId: l.entityId,
      reason: l.reason,
      changes: auditChanges(l.before, l.after),
    }));

    if (csv) {
      const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const lines = [['When (UTC)', 'Action', 'By', 'Record', 'Record id', 'Changes', 'Reason'].map(esc).join(',')];
      for (const r of rows) {
        lines.push([
          new Date(r.createdAt).toISOString(), r.label, r.actor, r.entityType, r.entityId,
          r.changes.map((c) => `${c.field}: ${c.from} → ${c.to}`).join('; '), r.reason,
        ].map(esc).join(','));
      }
      return new NextResponse(`﻿${lines.join('\n')}`, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="training-activity-${id}.csv"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    return NextResponse.json({
      success: true,
      total,
      page,
      pageSize: PAGE,
      rows,
      actions: actions.map((a) => ({ action: a.action, label: auditActionLabel(a.action), count: a._count._all })).sort((a, b) => a.label.localeCompare(b.label)),
    });
  } catch (error) {
    console.error('Loading training activity failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
