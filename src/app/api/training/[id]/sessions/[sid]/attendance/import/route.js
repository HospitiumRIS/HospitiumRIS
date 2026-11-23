import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auditTraining } from '@/lib/training-audit';
import { ACTIVE_REGISTRATION_STATUSES } from '@/lib/training-scope';
import { recomputeAttendancePercent } from '@/lib/training-attendance-server';
import { requireSessionStaff } from '@/lib/training-sessions-server';
import {
  defaultMinMinutes,
  parseAttendanceReport,
  planVirtualImport,
} from '@/lib/training-virtual-attendance';

const MAX_TEXT = 2 * 1024 * 1024;

/**
 * POST /api/training/[id]/sessions/[sid]/attendance/import
 * Import a Zoom or Teams attendance report for one session (#94). Training admin only.
 *
 * Body: { text, offsetMinutes, minMinutes?, overwrite?, commit? }
 *   text           report contents (the browser decodes UTF-16/UTF-8)
 *   offsetMinutes  Date#getTimezoneOffset of the zone the report's times are in
 *   minMinutes     minutes in the meeting needed to count as attended (default: half the session)
 *   overwrite      replace existing Present/Late/Excused marks (default false)
 *   commit         false = preview only (default), true = write
 */
export async function POST(request, { params }) {
  try {
    const { id, sid } = await params;
    const access = await requireSessionStaff(request, id, sid);
    if (access.error) return access.error;
    const { user } = access;

    const session = await prisma.trainingSession.findUnique({ where: { id: sid } });
    if (!session || session.trainingId !== id) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    if (session.status === 'CANCELLED') {
      return NextResponse.json({ error: 'This session is cancelled.' }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    const text = typeof body?.text === 'string' ? body.text : '';
    if (!text.trim()) return NextResponse.json({ error: 'Upload a report file' }, { status: 400 });
    if (text.length > MAX_TEXT) return NextResponse.json({ error: 'The report is too large (2 MB max)' }, { status: 400 });

    const offset = Number(body?.offsetMinutes);
    const offsetMinutes = Number.isFinite(offset) && Math.abs(offset) <= 14 * 60 ? offset : 0;
    const parsed = parseAttendanceReport(text, { offsetMinutes });
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const requested = Number(body?.minMinutes);
    const minMinutes = Number.isFinite(requested) && requested >= 0 && requested <= 24 * 60
      ? requested
      : defaultMinMinutes(session);

    const registrations = await prisma.trainingRegistration.findMany({
      where: { trainingId: id, status: { in: ACTIVE_REGISTRATION_STATUSES } },
      select: {
        id: true,
        user: { select: { email: true, givenName: true, familyName: true } },
        attendance: { where: { sessionId: sid }, select: { status: true } },
      },
    });
    const participants = registrations.map((r) => ({
      registrationId: r.id,
      email: r.user?.email,
      name: [r.user?.givenName, r.user?.familyName].filter(Boolean).join(' '),
      existingStatus: r.attendance[0]?.status || null,
    }));

    const plan = planVirtualImport(parsed.rows, participants, session, {
      minMinutes,
      overwrite: body?.overwrite === true,
    });

    const summary = {
      source: parsed.source,
      minMinutes,
      rows: parsed.rows.length,
      skippedRows: parsed.skipped,
      toSet: plan.matched.filter((m) => m.action === 'set').length,
      kept: plan.matched.filter((m) => m.action === 'keep').length,
      unchanged: plan.matched.filter((m) => m.action === 'same').length,
      unmatched: plan.unmatched.length,
      notInReport: plan.notInReport.length,
    };

    if (body?.commit !== true) {
      return NextResponse.json({
        success: true,
        preview: true,
        summary,
        matched: plan.matched,
        unmatched: plan.unmatched.map(({ email, name, minutes }) => ({ email, name, minutes })),
        notInReport: plan.notInReport.map(({ registrationId, email, name }) => ({ registrationId, email, name })),
      });
    }

    const writes = plan.matched.filter((m) => m.action === 'set');
    await prisma.$transaction(async (tx) => {
      for (const row of writes) {
        const data = {
          status: row.status,
          method: 'IMPORT',
          durationMinutes: Math.round(row.minutes),
          checkedInAt: row.firstJoin ? new Date(row.firstJoin) : null,
          checkedOutAt: row.lastLeave ? new Date(row.lastLeave) : null,
          markedBy: user.id,
        };
        await tx.trainingAttendance.upsert({
          where: { sessionId_registrationId: { sessionId: sid, registrationId: row.registrationId } },
          update: data,
          create: { ...data, sessionId: sid, registrationId: row.registrationId },
        });
      }
    });

    if (writes.length) await recomputeAttendancePercent(id, writes.map((w) => w.registrationId));
    await auditTraining({
      trainingId: id,
      actorId: user.id,
      action: 'ATTENDANCE_IMPORTED',
      entityType: 'TrainingSession',
      entityId: sid,
      after: { ...summary, written: writes.length },
    });

    return NextResponse.json({ success: true, preview: false, summary, written: writes.length });
  } catch (error) {
    console.error('Error importing attendance report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
