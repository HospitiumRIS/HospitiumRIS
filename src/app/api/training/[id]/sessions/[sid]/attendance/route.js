import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auditTraining } from '@/lib/training-audit';
import { ACTIVE_REGISTRATION_STATUSES } from '@/lib/training-scope';
import { bulkMarkRecords, validateAttendanceUpdate } from '@/lib/training-attendance';
import { recomputeAttendancePercent } from '@/lib/training-attendance-server';
import { requireSessionStaff } from '@/lib/training-sessions-server';

/**
 * PUT /api/training/[id]/sessions/[sid]/attendance
 * Mark attendance for one session (training admin, or a facilitator of this session #104; #92).
 *
 * Body, either:
 *   { records: [{ registrationId, status: PRESENT|LATE|ABSENT|EXCUSED|null, note? }] }
 *     (status null clears the mark)
 *   { action: 'all-present' | 'remaining-absent' }
 */
export async function PUT(request, { params }) {
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
      return NextResponse.json({ error: 'This session is cancelled. Restore it before taking attendance.' }, { status: 400 });
    }

    const active = await prisma.trainingRegistration.findMany({
      where: { trainingId: id, status: { in: ACTIVE_REGISTRATION_STATUSES } },
      select: { id: true },
    });
    const activeIds = active.map((r) => r.id);

    let body = await request.json().catch(() => null);
    if (body?.action) {
      const existing = await prisma.trainingAttendance.findMany({
        where: { sessionId: sid },
        select: { registrationId: true, status: true },
      });
      const existingMap = new Map(existing.map((e) => [e.registrationId, e.status]));
      const records = bulkMarkRecords(body.action, activeIds, existingMap);
      if (!['all-present', 'remaining-absent'].includes(body.action)) {
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
      }
      if (records.length === 0) {
        return NextResponse.json({ success: true, updated: 0 });
      }
      body = { records };
    }

    const validation = validateAttendanceUpdate(body, new Set(activeIds));
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const { upserts, clears } = validation;

    const before = await prisma.trainingAttendance.findMany({
      where: { sessionId: sid, registrationId: { in: [...upserts.map((u) => u.registrationId), ...clears] } },
      select: { registrationId: true, status: true },
    });

    const now = new Date();
    await prisma.$transaction(async (tx) => {
      for (const { registrationId, status, note } of upserts) {
        await tx.trainingAttendance.upsert({
          where: { sessionId_registrationId: { sessionId: sid, registrationId } },
          update: {
            status,
            markedBy: user.id,
            ...(note !== undefined ? { note } : {}),
          },
          create: {
            sessionId: sid,
            registrationId,
            status,
            method: 'MANUAL',
            markedBy: user.id,
            checkedInAt: status === 'PRESENT' || status === 'LATE' ? now : null,
            note: note ?? null,
          },
        });
      }
      if (clears.length) {
        await tx.trainingAttendance.deleteMany({ where: { sessionId: sid, registrationId: { in: clears } } });
      }
    });

    const changed = [...upserts.map((u) => u.registrationId), ...clears];
    await recomputeAttendancePercent(id, changed);

    await auditTraining({
      trainingId: id,
      actorId: user.id,
      action: 'ATTENDANCE_MARKED',
      entityType: 'TrainingSession',
      entityId: sid,
      before: { records: before },
      after: {
        records: upserts.map(({ registrationId, status }) => ({ registrationId, status })),
        cleared: clears,
      },
    });

    return NextResponse.json({ success: true, updated: upserts.length, cleared: clears.length });
  } catch (error) {
    console.error('Error marking attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
