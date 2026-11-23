import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { requireSessionAdmin } from '@/lib/training-sessions-server';
import { loadAttendanceMatrix } from '@/lib/training-attendance-server';
import { SHEET_COLUMNS, buildAttendanceRows } from '@/lib/training-attendance-sheet';
import { sanitizeFileName } from '@/lib/sanitize-file-name';

function validTimeZone(tz) {
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return tz;
  } catch {
    return 'Africa/Nairobi';
  }
}

/**
 * GET /api/training/[id]/attendance/export?format=xlsx|csv&sessionId=&tz=
 * Attendance as a spreadsheet (#95): one row per participant per session. The same
 * file is the import template: fill in Status (and Note) and upload it back.
 * Training admin only.
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireSessionAdmin(request, id);
    if (access.error) return access.error;

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') === 'csv' ? 'csv' : 'xlsx';
    const sessionId = searchParams.get('sessionId') || null;
    const timeZone = validTimeZone(searchParams.get('tz') || 'Africa/Nairobi');

    const matrix = await loadAttendanceMatrix(id);
    if (sessionId && !matrix.sessions.some((s) => s.id === sessionId)) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    const rows = buildAttendanceRows(matrix, { timeZone, sessionId });

    const sheet = XLSX.utils.json_to_sheet(rows, { header: SHEET_COLUMNS });
    sheet['!cols'] = [28, 28, 12, 8, 26, 30, 11, 12, 17, 9, 30].map((wch) => ({ wch }));
    const base = sanitizeFileName(`${access.training.title}-attendance${sessionId ? '-session' : ''}`).replace(/\.+$/, '') || 'attendance';

    if (format === 'csv') {
      const csv = `﻿${XLSX.utils.sheet_to_csv(sheet)}`;
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${base}.csv"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, 'Attendance');
    const help = XLSX.utils.aoa_to_sheet([
      ['How to use this file'],
      ['Fill in the Status column with Present, Late, Absent or Excused (or P / L / A / E).'],
      ['Leave Status empty to leave a mark unchanged. Notes are optional.'],
      ['Keep the Session ID and Email columns; then upload the file under Attendance → Import.'],
      [`Times are in ${timeZone}.`],
    ]);
    XLSX.utils.book_append_sheet(book, help, 'Instructions');
    const buffer = XLSX.write(book, { type: 'buffer', bookType: 'xlsx' });
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${base}.xlsx"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error exporting attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
