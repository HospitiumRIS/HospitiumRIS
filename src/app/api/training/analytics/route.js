import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { isTrainingAdmin, resolveTrainingScopeContext } from '@/lib/training-admin-server';
import { analyticsSheets, computeAnalytics } from '@/lib/training-analytics';

const SEAT = ['REGISTERED', 'COMPLETED', 'NOT_COMPLETED'];

function parseDate(value, endOfDay = false) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
function toCsv(rows) {
  if (!rows.length) return '';
  const head = Object.keys(rows[0]);
  return [head.map(csvCell).join(','), ...rows.map((r) => head.map((k) => csvCell(r[k])).join(','))].join('\n');
}

/**
 * GET /api/training/analytics?from=YYYY-MM-DD&to=YYYY-MM-DD&department=&targetGroup=[&format=xlsx|csv]
 * Training KPIs and breakdowns for the admin's own institution (#109). Defaults to the
 * last 12 months. Only aggregates and per-training figures, no participant names.
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
    const filters = {
      from,
      to,
      department: params.get('department') || null,
      targetGroup: params.get('targetGroup') || null,
    };

    // Options for the filters come from every training of the institution.
    const [trainings, optionsSource] = await Promise.all([
      prisma.training.findMany({
        where: { institutionId, startDate: { gte: from, lte: to }, status: { notIn: ['DRAFT', 'CANCELLED'] } },
        select: {
          id: true, title: true, code: true, department: true, targetGroup: true, category: true, status: true, startDate: true, cpdHours: true,
          sessions: { select: { id: true, status: true, startsAt: true } },
          registrations: {
            where: { status: { in: SEAT } },
            select: {
              id: true, status: true, source: true, dueDate: true,
              certificate: { select: { status: true, expiresAt: true } },
              attendance: { select: { sessionId: true, status: true } },
            },
          },
        },
      }),
      prisma.training.findMany({ where: { institutionId }, select: { department: true, targetGroup: true } }),
    ]);
    const ids = trainings.map((t) => t.id);
    const [forms, responses, assessments] = ids.length
      ? await Promise.all([
          prisma.trainingFeedbackForm.findMany({ where: { institutionId }, select: { id: true, questions: true } }),
          prisma.trainingFeedbackResponse.findMany({ where: { trainingId: { in: ids } }, select: { trainingId: true, formId: true, answers: true } }),
          prisma.trainingAssessment.findMany({
            where: { trainingId: { in: ids }, isPublished: true },
            select: {
              id: true, title: true, type: true, trainingId: true, training: { select: { title: true } },
              attempts: { select: { registrationId: true, status: true, passed: true, percent: true } },
            },
          }),
        ])
      : [[], [], []];

    const report = computeAnalytics({
      trainings,
      forms,
      responses,
      assessments: assessments.map((a) => ({ ...a, trainingTitle: a.training.title })),
      filters,
    });
    const options = computeAnalytics({ trainings: optionsSource.map((t, i) => ({ ...t, id: `o${i}`, status: 'PUBLISHED', startDate: from })) }).options;
    report.options = options;
    report.period = { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };

    const format = params.get('format');
    if (format === 'xlsx' || format === 'csv') {
      const sheets = analyticsSheets(report);
      const stamp = `${report.period.from}_${report.period.to}`;
      if (format === 'csv') {
        const section = params.get('sheet') && sheets[params.get('sheet')] ? params.get('sheet') : 'Trainings';
        return new NextResponse(`﻿${toCsv(sheets[section])}`, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="training-${section.toLowerCase().replace(/\s+/g, '-')}-${stamp}.csv"`,
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
