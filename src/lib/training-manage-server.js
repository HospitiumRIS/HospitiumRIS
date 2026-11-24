import prisma from '@/lib/prisma';
import { auditTraining } from '@/lib/training-audit';
import { effectiveForm } from '@/lib/training-feedback';
import { notifyTraining } from '@/lib/training-notify';
import { manageAttention, manageRow, manageStats, tabCounts, upcomingSessions } from '@/lib/training-manage';

const TRAINING_SELECT = {
  id: true, title: true, code: true, category: true, description: true, department: true, targetGroup: true,
  deliveryMode: true, venue: true, location: true, startDate: true, endDate: true, maxParticipants: true,
  status: true, isMandatory: true, institutionId: true,
  minAttendancePercent: true, requireAllModules: true, requireAssessmentPass: true, requireFeedback: true,
};

const groupCount = (list, key) => {
  const m = new Map();
  for (const x of list) m.set(x[key], (m.get(x[key]) || 0) + 1);
  return m;
};
const bucket = (list, key) => {
  const m = new Map();
  for (const x of list) m.set(x[key], [...(m.get(x[key]) || []), x]);
  return m;
};

/**
 * The manage-trainings list for an admin (#144): rows with figures and alerts, tab counts,
 * stats, needs attention and sessions in the next 7 days. Batched: a fixed number of
 * queries whatever the number of trainings.
 * @param {object} where  Prisma where for the trainings the admin manages
 */
export async function loadManageList(where, now = new Date()) {
  const trainings = await prisma.training.findMany({ where, select: TRAINING_SELECT, orderBy: { startDate: 'desc' } });
  const ids = trainings.map((t) => t.id);
  if (!ids.length) {
    return { rows: [], counts: tabCounts([]), stats: manageStats([], now), attention: [], weekSessions: [], sessions: [] };
  }
  const institutionIds = [...new Set(trainings.map((t) => t.institutionId))];
  const [sessions, modules, materials, assessments, facilitators, registrations, grading, forms] = await Promise.all([
    prisma.trainingSession.findMany({
      where: { trainingId: { in: ids } },
      select: { id: true, trainingId: true, title: true, status: true, startsAt: true, endsAt: true, venue: true, deliveryMode: true, _count: { select: { attendance: true } } },
      orderBy: { startsAt: 'asc' },
    }),
    prisma.trainingModule.findMany({ where: { trainingId: { in: ids } }, select: { trainingId: true, status: true } }),
    prisma.trainingMaterial.findMany({ where: { trainingId: { in: ids } }, select: { trainingId: true } }),
    prisma.trainingAssessment.findMany({ where: { trainingId: { in: ids } }, select: { trainingId: true, isPublished: true, isRequiredForCompletion: true } }),
    prisma.trainingFacilitator.findMany({ where: { trainingId: { in: ids } }, select: { trainingId: true } }),
    prisma.trainingRegistration.findMany({
      where: { trainingId: { in: ids } },
      select: { trainingId: true, status: true, attendancePercent: true, certificate: { select: { status: true } } },
    }),
    prisma.trainingAssessmentAttempt.findMany({ where: { status: 'NEEDS_GRADING', assessment: { trainingId: { in: ids } } }, select: { assessment: { select: { trainingId: true } } } }),
    prisma.trainingFeedbackForm.findMany({
      where: { OR: [{ trainingId: { in: ids } }, { trainingId: null, institutionId: { in: institutionIds } }] },
      select: { trainingId: true, institutionId: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const sessionsBy = bucket(sessions.map((s) => ({ ...s, attendanceCount: s._count.attendance })), 'trainingId');
  const modulesBy = bucket(modules, 'trainingId');
  const materialsBy = groupCount(materials, 'trainingId');
  const assessmentsBy = bucket(assessments, 'trainingId');
  const facilitatorsBy = groupCount(facilitators, 'trainingId');
  const registrationsBy = bucket(registrations, 'trainingId');
  const gradingBy = groupCount(grading.map((g) => ({ trainingId: g.assessment.trainingId })), 'trainingId');
  const ownForm = new Map(forms.filter((f) => f.trainingId).map((f) => [f.trainingId, f]));
  const defaultForm = new Map();
  for (const f of forms) if (!f.trainingId && !defaultForm.has(f.institutionId)) defaultForm.set(f.institutionId, f);

  const rows = trainings.map((t) => manageRow(t, {
    sessions: sessionsBy.get(t.id) || [],
    modules: modulesBy.get(t.id) || [],
    materials: materialsBy.get(t.id) || 0,
    assessments: assessmentsBy.get(t.id) || [],
    facilitators: facilitatorsBy.get(t.id) || 0,
    registrations: registrationsBy.get(t.id) || [],
    needsGrading: gradingBy.get(t.id) || 0,
    feedbackForm: Boolean(effectiveForm(ownForm.get(t.id), defaultForm.get(t.institutionId)).form),
  }, now));
  const byId = new Map(rows.map((r) => [r.id, r]));

  return {
    rows,
    counts: tabCounts(rows),
    stats: manageStats(rows, now),
    attention: manageAttention(rows, now),
    weekSessions: upcomingSessions(sessions, byId, now, 7).map(({ _count, attendanceCount, ...s }) => s),
    // For the calendar view: every scheduled session of these trainings.
    sessions: sessions.filter((s) => s.status === 'SCHEDULED').map((s) => ({ id: s.id, trainingId: s.trainingId, title: s.title, startsAt: s.startsAt, endsAt: s.endsAt })),
  };
}

const NOTIFY_ON_CANCEL = ['REGISTERED', 'PENDING_APPROVAL', 'WAITLISTED'];

/**
 * Publish, cancel or delete several trainings at once (#144). Each training is checked
 * against `where` (the admin's scope); ones that cannot take the action are skipped with
 * a reason.
 * @returns {{ done: string[], skipped: [{ id, title, reason }] }}
 */
export async function bulkTrainingAction(where, actor, { action, ids = [], reason = null }) {
  const list = await prisma.training.findMany({
    where: { AND: [where, { id: { in: ids.slice(0, 200) } }] },
    select: { id: true, title: true, status: true, endDate: true, registrations: { select: { status: true } } },
  });
  const done = [];
  const skipped = [];
  const found = new Set(list.map((t) => t.id));
  for (const id of ids) if (!found.has(id)) skipped.push({ id, title: null, reason: 'Not found' });

  for (const t of list) {
    if (action === 'publish') {
      if (t.status !== 'DRAFT') { skipped.push({ id: t.id, title: t.title, reason: 'Not a draft' }); continue; }
      await prisma.training.update({ where: { id: t.id }, data: { status: 'PUBLISHED' } });
      await auditTraining({ trainingId: t.id, actorId: actor.id, action: 'TRAINING_UPDATED', entityType: 'Training', entityId: t.id, before: { status: t.status }, after: { status: 'PUBLISHED' }, reason: 'Published from the trainings list' });
      done.push(t.id);
    } else if (action === 'cancel') {
      if (t.status === 'CANCELLED' || t.status === 'COMPLETED' || new Date(t.endDate) < new Date()) { skipped.push({ id: t.id, title: t.title, reason: 'Already ended or cancelled' }); continue; }
      await prisma.training.update({ where: { id: t.id }, data: { status: 'CANCELLED' } });
      await auditTraining({ trainingId: t.id, actorId: actor.id, action: 'TRAINING_UPDATED', entityType: 'Training', entityId: t.id, before: { status: t.status }, after: { status: 'CANCELLED' }, reason: reason || 'Cancelled from the trainings list' });
      // Tell everyone holding or waiting for a place (once per person).
      const people = await prisma.trainingRegistration.findMany({ where: { trainingId: t.id, status: { in: NOTIFY_ON_CANCEL } }, select: { userId: true } });
      for (const p of people) await notifyTraining('TRAINING_CANCELLED', { userId: p.userId, trainingId: t.id, dedupeKey: `training-cancelled:${t.id}`, extra: { reason } });
      done.push(t.id);
    } else if (action === 'delete') {
      if (t.status !== 'DRAFT') { skipped.push({ id: t.id, title: t.title, reason: 'Only drafts can be deleted here; cancel published trainings instead' }); continue; }
      if (t.registrations.some((r) => NOTIFY_ON_CANCEL.includes(r.status) || r.status === 'COMPLETED')) { skipped.push({ id: t.id, title: t.title, reason: 'Has registrations' }); continue; }
      await prisma.training.delete({ where: { id: t.id } });
      done.push(t.id);
    } else {
      return { done: [], skipped: [], error: 'Unknown action' };
    }
  }
  return { done, skipped };
}

/**
 * A new draft cohort of the same course (#144): details, settings, modules and materials
 * are copied; sessions, people, assessments and certificates are not.
 */
export async function duplicateTraining(source, actor) {
  const { id: _id, createdAt: _c, updatedAt: _u, status: _s, createdBy: _b, ...fields } = source;
  const [modules, materials] = await Promise.all([
    prisma.trainingModule.findMany({ where: { trainingId: source.id }, orderBy: { order: 'asc' } }),
    prisma.trainingMaterial.findMany({ where: { trainingId: source.id } }),
  ]);
  const copy = await prisma.$transaction(async (tx) => {
    const created = await tx.training.create({ data: { ...fields, status: 'DRAFT', createdBy: actor.id } });
    const moduleMap = new Map();
    for (const m of modules) {
      const { id, trainingId: _t, createdAt: _mc, updatedAt: _mu, ...rest } = m;
      const made = await tx.trainingModule.create({ data: { ...rest, trainingId: created.id } });
      moduleMap.set(id, made.id);
    }
    for (const m of materials) {
      const { id: _mid, trainingId: _t, createdAt: _mc, updatedAt: _mu, moduleId, ...rest } = m;
      await tx.trainingMaterial.create({ data: { ...rest, trainingId: created.id, moduleId: moduleId ? moduleMap.get(moduleId) || null : null } });
    }
    return created;
  });
  await auditTraining({ trainingId: copy.id, actorId: actor.id, action: 'TRAINING_CREATED', entityType: 'Training', entityId: copy.id, after: { copiedFrom: source.id, modules: modules.length, materials: materials.length }, reason: `New cohort of "${source.title}"` });
  return { training: copy, modules: modules.length, materials: materials.length };
}
