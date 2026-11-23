import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import prisma from '@/lib/prisma';
import { auditTraining } from '@/lib/training-audit';
import { requireSessionAdmin } from '@/lib/training-sessions-server';
import { loadAttendanceMatrix, recomputeAttendancePercent } from '@/lib/training-attendance-server';
import { planSheetImport } from '@/lib/training-attendance-sheet';

const MAX_BYTES = 5 * 1024 * 1024;

function validTimeZone(tz) {
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return tz;
  } catch {
    return 'Africa/Nairobi';
  }
}

/**
 * POST /api/training/[id]/attendance/import
 * Import a filled-in attendance sheet (#95): the layout of the export (CSV or XLSX).
 * multipart/form-data: file, tz, commit ("true" to write; otherwise preview only).
 * Training admin only.
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireSessionAdmin(request, id);
    if (access.error) return access.error;
    const { user } = access;

    const form = await request.formData().catch(() => null);
    const file = form?.get('file');
    if (!file || typeof file === 'string' || !file.size) {
      return NextResponse.json({ error: 'Upload a CSV or Excel file' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'The file is too large (5 MB max)' }, { status: 400 });
    }
    const name = String(file.name || '').toLowerCase();
    if (!/\.(csv|xlsx|xls)$/.test(name)) {
      return NextResponse.json({ error: 'Use a .csv or .xlsx file' }, { status: 400 });
    }
    const timeZone = validTimeZone(String(form.get('tz') || 'Africa/Nairobi'));
    const commit = String(form.get('commit')) === 'true';

    let rows;
    try {
      const book = XLSX.read(Buffer.from(await file.arrayBuffer()), { type: 'buffer', raw: true, cellDates: false });
      const sheet = book.Sheets.Attendance || book.Sheets[book.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
    } catch {
      return NextResponse.json({ error: 'Could not read the file. Save it as .xlsx or .csv and try again.' }, { status: 400 });
    }

    const matrix = await loadAttendanceMatrix(id);
    const plan = planSheetImport(rows, matrix, { timeZone });
    if (!plan.ok) return NextResponse.json({ error: plan.error }, { status: 400 });

    const errors = plan.results.filter((r) => r.result === 'error').slice(0, 200);
    if (!commit) {
      return NextResponse.json({
        success: true,
        preview: true,
        counts: plan.counts,
        changes: plan.results.filter((r) => r.result === 'set').slice(0, 500),
        errors,
      });
    }

    const now = new Date();
    await prisma.$transaction(async (tx) => {
      for (const change of plan.changes) {
        await tx.trainingAttendance.upsert({
          where: { sessionId_registrationId: { sessionId: change.sessionId, registrationId: change.registrationId } },
          update: {
            status: change.status,
            markedBy: user.id,
            ...(change.note !== undefined ? { note: change.note } : {}),
          },
          create: {
            sessionId: change.sessionId,
            registrationId: change.registrationId,
            status: change.status,
            method: 'IMPORT',
            markedBy: user.id,
            checkedInAt: change.status === 'PRESENT' || change.status === 'LATE' ? now : null,
            note: change.note ?? null,
          },
        });
      }
    }, { timeout: 60000 });

    if (plan.changes.length) {
      await recomputeAttendancePercent(id, [...new Set(plan.changes.map((c) => c.registrationId))]);
    }
    await auditTraining({
      trainingId: id,
      actorId: user.id,
      action: 'ATTENDANCE_SHEET_IMPORTED',
      entityType: 'Training',
      entityId: id,
      after: { file: file.name, ...plan.counts },
    });

    return NextResponse.json({ success: true, preview: false, counts: plan.counts, written: plan.changes.length, errors });
  } catch (error) {
    console.error('Error importing attendance sheet:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
