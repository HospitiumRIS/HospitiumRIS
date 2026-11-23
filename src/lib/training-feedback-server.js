import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { isTrainingAdmin, requireTrainingAdminAccess } from '@/lib/training-admin-server';
import { notifyTraining } from '@/lib/training-notify';
import { ACTIVE_REGISTRATION_STATUSES } from '@/lib/training-scope';
import { effectiveForm, feedbackUnlocked } from '@/lib/training-feedback';

/** The institution's default form (trainingId null), if any. */
export function institutionDefaultForm(institutionId) {
  return prisma.trainingFeedbackForm.findFirst({ where: { institutionId, trainingId: null }, orderBy: { createdAt: 'asc' } });
}

/** The form that applies to a training (#106): its own, else the institution default. */
export async function loadEffectiveForm(training) {
  const [own, fallback] = await Promise.all([
    prisma.trainingFeedbackForm.findUnique({ where: { trainingId: training.id } }),
    institutionDefaultForm(training.institutionId),
  ]);
  return { ...effectiveForm(own, fallback), own, fallback };
}

/**
 * Who may read a training's feedback results: its admins (with names) and its
 * facilitators (without names when the form is anonymous).
 * @returns {{ user, training, role: 'admin'|'facilitator' } | { error }}
 */
export async function requireFeedbackViewer(request, trainingId) {
  const user = await getAuthenticatedUser(request);
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const training = await prisma.training.findUnique({ where: { id: trainingId } });
  if (!training) return { error: NextResponse.json({ error: 'Training not found' }, { status: 404 }) };
  if (isTrainingAdmin(user)) {
    const access = await requireTrainingAdminAccess(user, training);
    if (!access.error) return { user, training, role: 'admin' };
  }
  const facilitator = await prisma.trainingFacilitator.findFirst({ where: { trainingId, userId: user.id }, select: { id: true } });
  if (facilitator) return { user, training, role: 'facilitator' };
  return { error: NextResponse.json({ error: 'Training not found' }, { status: 404 }) };
}

/**
 * Ask participants of recently ended trainings for feedback (#106), once each.
 * Scope with trainingId (admin button) or leave empty (daily job: ended in the last 14 days).
 */
export async function sendFeedbackRequests({ trainingId = null, institutionId = null, now = new Date() } = {}) {
  const since = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const trainings = await prisma.training.findMany({
    where: trainingId
      ? { id: trainingId }
      : { endDate: { lte: now, gte: since }, status: { not: 'CANCELLED' }, ...(institutionId ? { institutionId } : {}) },
    select: { id: true, institutionId: true, endDate: true, minAttendancePercent: true },
  });
  let sent = 0;
  for (const training of trainings) {
    const { form } = await loadEffectiveForm(training);
    if (!form) continue;
    const registrations = await prisma.trainingRegistration.findMany({
      where: { trainingId: training.id, status: { in: ACTIVE_REGISTRATION_STATUSES }, feedbackResponse: { is: null } },
      select: { id: true, userId: true, status: true, attendancePercent: true },
    });
    for (const r of registrations) {
      if (!feedbackUnlocked(training, r, now).unlocked) continue;
      const result = await notifyTraining('FEEDBACK_REQUESTED', { userId: r.userId, trainingId: training.id, dedupeKey: `feedback:${r.id}` });
      if (result?.notified) sent += 1;
    }
  }
  return { trainings: trainings.length, sent };
}
