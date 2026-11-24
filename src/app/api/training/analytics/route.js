import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { isTrainingAdmin, resolveTrainingScopeContext } from '@/lib/training-admin-server';
import { analyticsSheets } from '@/lib/training-analytics';
import { renderAnalyticsPdf } from '@/lib/training-analytics-pdf';
import { filtersLabel, loadTrainingAnalytics } from '@/lib/training-analytics-server';

function parseDate(value, endOfDay = false) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
function toCsv(rows) {
  if (!rows.length) return '';
  const head = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  return [head.map(csvCell).join(','), ...rows.map((r) => head.map((k) => csvCell(r[k])).join(','))].join('\n');
}

/**
 * GET /api/training/analytics?from&to&department&targetGroup&category&deliveryMode[&format=xlsx|csv|pdf[&sheet=]]
 * Training analytics for the admin's own institution (#109, #138): KPIs with the previous
 * period, breakdowns, capacity, facilitators, pre/post gain and needs attention. Defaults
 * to the last 12 months. Aggregates only, no participant names.
 */
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isTrainingAdmin(user)) return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    const { institutionId } = await resolveTrainingScopeContext(user);
    if (!institutionId) return NextResponse.json({ error: 'No institution linked to your account' }, { status: 400 });

    const params = new URL(request.url).searchParams;
    const to = parseDate(params.get('to'), true) || new Date();
    const from = parseDate(params.get('from')) || new Date(Date.UTC(to.getUTCFullYear() - 1, to.getUTCMonth(), to.getUTCDate()));
    if (from > to) return NextResponse.json({ error: '"From" must be before "to"' }, { status: 400 });
    if (to - from > 5 * 366 * 24 * 60 * 60 * 1000) return NextResponse.json({ error: 'Choose a period of at most 5 years' }, { status: 400 });
    const filters = {
      department: params.get('department') || null,
      targetGroup: params.get('targetGroup') || null,
      category: params.get('category') || null,
      deliveryMode: params.get('deliveryMode') || null,
    };

    const report = await loadTrainingAnalytics({ institutionId, from, to, ...filters });
    const subscription = await prisma.trainingReportSubscription.findUnique({ where: { userId: user.id }, select: { lastSentPeriod: true } });
    report.monthlyEmail = { enabled: Boolean(subscription), lastSentPeriod: subscription?.lastSentPeriod || null };

    const format = params.get('format');
    const stamp = `${report.period.from}_${report.period.to}`;
    if (format === 'pdf') {
      const institution = await prisma.institution.findUnique({ where: { id: institutionId }, select: { name: true } });
      const pdf = renderAnalyticsPdf({ report, institution: institution?.name, filtersLabel: filtersLabel(filters) });
      return new NextResponse(pdf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="training-analytics-${stamp}.pdf"`,
          'Cache-Control': 'no-store',
        },
      });
    }
    if (format === 'xlsx' || format === 'csv') {
      const sheets = analyticsSheets(report);
      if (format === 'csv') {
        const section = params.get('sheet') && sheets[params.get('sheet')] ? params.get('sheet') : 'Trainings';
        return new NextResponse(`﻿${toCsv(sheets[section])}`, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="training-${section.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${stamp}.csv"`,
            'Cache-Control': 'no-store',
          },
        });
      }
      const book = XLSX.utils.book_new();
      for (const [name, rows] of Object.entries(sheets)) {
        XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(rows.length ? rows : [{ Note: 'No data for this period' }]), name.slice(0, 31));
      }
      const buffer = XLSX.write(book, { type: 'buffer', bookType: 'xlsx' });
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="training-analytics-${stamp}.xlsx"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    return NextResponse.json({ success: true, ...report });
  } catch (error) {
    console.error('Training analytics failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** PUT /api/training/analytics  { monthlyEmail: boolean }: opt in or out of the monthly report email. */
export async function PUT(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isTrainingAdmin(user)) return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    const { institutionId } = await resolveTrainingScopeContext(user);
    if (!institutionId) return NextResponse.json({ error: 'No institution linked to your account' }, { status: 400 });
    const body = await request.json().catch(() => ({}));
    if (body.monthlyEmail === true) {
      // Start from this month: the first email covers the month that is running now.
      const current = new Date().toISOString().slice(0, 7);
      const prevMonth = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - 1, 1)).toISOString().slice(0, 7);
      await prisma.trainingReportSubscription.upsert({
        where: { userId: user.id },
        update: { institutionId },
        create: { userId: user.id, institutionId, lastSentPeriod: prevMonth },
      });
      return NextResponse.json({ success: true, monthlyEmail: { enabled: true, firstReport: current } });
    }
    await prisma.trainingReportSubscription.deleteMany({ where: { userId: user.id } });
    return NextResponse.json({ success: true, monthlyEmail: { enabled: false } });
  } catch (error) {
    console.error('Updating monthly training report failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
