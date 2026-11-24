import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { isTrainingAdmin, resolveTrainingScopeContext } from '@/lib/training-admin-server';
import * as XLSX from 'xlsx';
import prisma from '@/lib/prisma';
import { sendComplianceReminders } from '@/lib/training-assignment-server';
import { loadCompliance } from '@/lib/training-compliance-server';
import { renderCompliancePdf } from '@/lib/training-compliance-pdf';
import { complianceSheets } from '@/lib/training-requirements';

const csvCell = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = (rows) => {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  return [cols.map(csvCell).join(','), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(','))].join('\n');
};

async function adminInstitution(request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (!isTrainingAdmin(user)) return { error: NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 }) };
  const { institutionId } = await resolveTrainingScopeContext(user);
  if (!institutionId) return { error: NextResponse.json({ error: 'No institution linked to your account' }, { status: 400 }) };
  return { user, institutionId };
}

/**
 * GET /api/training/compliance[?format=xlsx|csv|pdf[&sheet=]]: compliance for the admin's
 * institution: requirement matrix, departments, trend, needs attention (#140) and the
 * assigned-training list (#103, kept at the top level: trainings, people, totals).
 */
export async function GET(request) {
  try {
    const ctx = await adminInstitution(request);
    if (ctx.error) return ctx.error;
    const data = await loadCompliance(ctx.institutionId);
    const format = new URL(request.url).searchParams.get('format');
    const stamp = new Date().toISOString().slice(0, 10);
    if (format === 'pdf') {
      const institution = await prisma.institution.findUnique({ where: { id: ctx.institutionId }, select: { name: true } });
      return new NextResponse(renderCompliancePdf({ data, institution: institution?.name }), {
        headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="training-compliance-${stamp}.pdf"` },
      });
    }
    if (format === 'xlsx' || format === 'csv') {
      const sheets = complianceSheets(data);
      if (format === 'csv') {
        const name = sheets[new URL(request.url).searchParams.get('sheet')] ? new URL(request.url).searchParams.get('sheet') : 'People';
        return new NextResponse(`\uFEFF${toCsv(sheets[name])}`, {
          headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="compliance-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${stamp}.csv"` },
        });
      }
      const book = XLSX.utils.book_new();
      for (const [name, rows] of Object.entries(sheets)) {
        XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(rows.length ? rows : [{ Note: 'No data' }]), name.slice(0, 31));
      }
      return new NextResponse(XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }), {
        headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="training-compliance-${stamp}.xlsx"` },
      });
    }
    // The monthly email (#138) carries the compliance report too.
    const subscription = await prisma.trainingReportSubscription.findUnique({ where: { userId: ctx.user.id }, select: { lastSentPeriod: true } });
    return NextResponse.json({ success: true, ...data.assigned, ...data, monthlyEmail: { enabled: Boolean(subscription) } });
  } catch (error) {
    console.error('Compliance report failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** POST /api/training/compliance: send due / overdue / re-training reminders now (each only once). */
export async function POST(request) {
  try {
    const ctx = await adminInstitution(request);
    if (ctx.error) return ctx.error;
    const result = await sendComplianceReminders({ institutionId: ctx.institutionId });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Sending reminders failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
