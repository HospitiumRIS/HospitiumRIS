import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { isTrainingAdmin, resolveTrainingScopeContext } from '@/lib/training-admin-server';
import { trainingAdminListWhere } from '@/lib/training-scope';
import { exportRows, filterRows, sortRows } from '@/lib/training-manage';
import { bulkTrainingAction, loadManageList } from '@/lib/training-manage-server';
import { maybeRunTrainingAutomation } from '@/lib/training-automation-server';

async function admin(request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (!isTrainingAdmin(user)) return { error: NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 }) };
  const ctx = await resolveTrainingScopeContext(user);
  return { user, where: trainingAdminListWhere(user, ctx) };
}

/**
 * GET /api/training/manage[?format=xlsx|csv&tab&search&department&category]
 * The admin's trainings with figures, alerts, stats, needs attention and this week's
 * sessions (#144). Export applies the same filters as the page.
 */
export async function GET(request) {
  try {
    const ctx = await admin(request);
    if (ctx.error) return ctx.error;
    maybeRunTrainingAutomation();
    const data = await loadManageList(ctx.where);
    const p = new URL(request.url).searchParams;
    const format = p.get('format');
    if (format === 'xlsx' || format === 'csv') {
      const tab = p.get('tab') || 'all';
      const rows = exportRows(sortRows(filterRows(data.rows, { tab, search: p.get('search') || '', department: p.get('department') || 'all', category: p.get('category') || 'all' }), tab));
      const stamp = new Date().toISOString().slice(0, 10);
      if (format === 'csv') {
        const cols = rows.length ? Object.keys(rows[0]) : ['Training'];
        const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const csv = [cols.map(esc).join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
        return new NextResponse(`﻿${csv}`, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="trainings-${stamp}.csv"` } });
      }
      const book = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(rows.length ? rows : [{ Note: 'No trainings match these filters' }]), 'Trainings');
      return new NextResponse(XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }), {
        headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="trainings-${stamp}.xlsx"` },
      });
    }
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error('Loading manage trainings failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** POST /api/training/manage { action: publish|cancel|delete, ids, reason? } (#144) */
export async function POST(request) {
  try {
    const ctx = await admin(request);
    if (ctx.error) return ctx.error;
    const body = await request.json().catch(() => ({}));
    const ids = Array.isArray(body.ids) ? body.ids.filter((x) => typeof x === 'string') : [];
    if (!ids.length) return NextResponse.json({ error: 'Select trainings first' }, { status: 400 });
    const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 500) || null : null;
    const result = await bulkTrainingAction(ctx.where, ctx.user, { action: body.action, ids, reason });
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Bulk training action failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
