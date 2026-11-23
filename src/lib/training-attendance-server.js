import prisma from '@/lib/prisma';
import { ACTIVE_REGISTRATION_STATUSES } from '@/lib/training-scope';
import { computeAttendance, sessionAttendanceSummary } from '@/lib/training-attendance';
import { refreshTrainingProgress } from '@/lib/training-progress-server';

const SESSION_FIELDS = {
  id: true,
  title: true,
  startsAt: true,
  endsAt: true,
  status: true,
  isAttendanceRequired: true,
  deliveryMode: true,
  order: true,
};

/**
 * Recompute everything derived from attendance for these registrations: cached
 * attendance %, modules completed by attendance and completion status (#92, #96).
 * Kept under this name for the attendance routes; see refreshTrainingProgress.
 */
export async function recomputeAttendancePercent(trainingId, registrationIds = null, options = {}) {
  return refreshTrainingProgress(trainingId, registrationIds, options);
}

/** The register: sessions × active participants, with per-row and per-column totals. */
export async function loadAttendanceMatrix(trainingId) {
  const training = await prisma.training.findUnique({
    where: { id: trainingId },
    select: { id: true, excludeExcusedSessions: true },
  });
  const [sessions, registrations] = await Promise.all([
    prisma.trainingSession.findMany({
      where: { trainingId },
      orderBy: [{ startsAt: 'asc' }, { order: 'asc' }],
      select: SESSION_FIELDS,
    }),
    prisma.trainingRegistration.findMany({
      where: { trainingId, status: { in: ACTIVE_REGISTRATION_STATUSES } },
      orderBy: { registeredAt: 'asc' },
      select: {
        id: true,
        status: true,
        user: { select: { id: true, givenName: true, familyName: true, email: true } },
        attendance: {
          select: { sessionId: true, status: true, method: true, note: true, checkedInAt: true, markedBy: true, updatedAt: true },
        },
      },
    }),
  ]);

  const now = new Date();
  const records = registrations.flatMap((r) => r.attendance.map((a) => ({ ...a, registrationId: r.id })));
  const participants = registrations.map((r) => ({
    registrationId: r.id,
    status: r.status,
    user: r.user,
    summary: computeAttendance(sessions, r.attendance, { excludeExcused: training?.excludeExcusedSessions !== false, now }),
  }));

  return {
    excludeExcusedSessions: training?.excludeExcusedSessions !== false,
    sessions: sessions.map((session) => ({
      ...session,
      held: new Date(session.startsAt) <= now,
      summary: sessionAttendanceSummary(session, records, registrations.length),
    })),
    participants,
    records,
  };
}

export async function sessionHasAttendance(sessionIds) {
  const ids = Array.isArray(sessionIds) ? sessionIds : [sessionIds];
  if (!ids.length) return false;
  const count = await prisma.trainingAttendance.count({ where: { sessionId: { in: ids } } });
  return count > 0;
}
