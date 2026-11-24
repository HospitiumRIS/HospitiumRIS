import prisma from '@/lib/prisma';
import { auditTraining } from '@/lib/training-audit';
import { notifyTraining } from '@/lib/training-notify';
import { assignTraining, complianceReport, institutionMembersWhere } from '@/lib/training-assignment-server';
import { buildMatrix, complianceTrend, planAutoAssign, requirementAttention, validateRequirement } from '@/lib/training-requirements';

const SEAT_OR_WAITING = ['REGISTERED', 'COMPLETED', 'NOT_COMPLETED', 'PENDING_APPROVAL', 'WAITLISTED'];

/**
 * Everything the compliance page needs (compliance v2): requirement matrix, trend,
 * departments, needs attention, and the per-training list of assigned people (#103).
 */
export async function loadCompliance(institutionId, now = new Date()) {
  const [requirements, members, legacy, trainingOptions] = await Promise.all([
    prisma.trainingRequirement.findMany({
      where: { institutionId },
      include: {
        trainings: {
          select: {
            id: true, title: true, status: true, startDate: true, endDate: true, maxParticipants: true,
            _count: { select: { registrations: { where: { status: { in: ['REGISTERED', 'COMPLETED', 'NOT_COMPLETED', 'PENDING_APPROVAL'] } } } } },
          },
          orderBy: { startDate: 'asc' },
        },
      },
      orderBy: { title: 'asc' },
    }),
    prisma.user.findMany({
      where: institutionMembersWhere(institutionId),
      select: { id: true, givenName: true, familyName: true, email: true, researchProfile: { select: { department: true } } },
      orderBy: [{ givenName: 'asc' }, { familyName: 'asc' }],
    }),
    complianceReport(institutionId, now),
    // For linking cohorts to requirements and "Assign to cohort": the institution's trainings
    // from the last two years that are not cancelled.
    prisma.training.findMany({
      where: { institutionId, status: { not: 'CANCELLED' }, endDate: { gte: new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000) } },
      select: { id: true, title: true, status: true, startDate: true, endDate: true, requirementId: true },
      orderBy: { startDate: 'desc' },
      take: 300,
    }),
  ]);
  const active = requirements.filter((r) => r.isActive);
  const people = members.map((u) => ({
    id: u.id,
    name: `${u.givenName || ''} ${u.familyName || ''}`.trim() || u.email,
    email: u.email,
    department: u.researchProfile?.department || null,
  }));

  const linkedIds = active.flatMap((r) => r.trainings.map((t) => t.id));
  const reqByTraining = new Map(active.flatMap((r) => r.trainings.map((t) => [t.id, r.id])));
  const [regs, exemptions] = await Promise.all([
    linkedIds.length
      ? prisma.trainingRegistration.findMany({
          where: { trainingId: { in: linkedIds }, status: { in: SEAT_OR_WAITING } },
          select: {
            id: true, userId: true, status: true, completedAt: true, dueDate: true, trainingId: true,
            training: { select: { title: true, startDate: true, endDate: true } },
            certificate: { select: { status: true, expiresAt: true } },
          },
        })
      : [],
    prisma.trainingComplianceExemption.findMany({
      where: { institutionId, requirementId: { not: null } },
      select: { id: true, userId: true, requirementId: true, reason: true, createdAt: true },
    }),
  ]);
  const regsByUserReq = new Map();
  for (const r of regs) {
    const key = `${r.userId}|${reqByTraining.get(r.trainingId)}`;
    regsByUserReq.set(key, [...(regsByUserReq.get(key) || []), r]);
  }
  const exemptMap = new Map(exemptions.map((e) => [`${e.userId}|${e.requirementId}`, e]));

  const input = { requirements: active, people, regsByUserReq, exemptions: exemptMap };
  const matrix = buildMatrix(input, now);
  const trend = complianceTrend(input, 12, now);
  const cohortsByRequirement = new Map(active.map((r) => [r.id, r.trainings]));

  return {
    requirements: requirements.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      departments: r.departments,
      validityMonths: r.validityMonths,
      dueWithinDays: r.dueWithinDays,
      autoAssign: r.autoAssign,
      isActive: r.isActive,
      cohorts: r.trainings.map((t) => ({ id: t.id, title: t.title, status: t.status, startDate: t.startDate, endDate: t.endDate, places: t.maxParticipants, taken: t._count.registrations })),
    })),
    matrix: {
      rows: matrix.rows.map((row) => ({ ...row, cells: Object.fromEntries(Object.entries(row.cells).map(([k, c]) => [k, { ...c, exemptId: exemptMap.get(`${row.id}|${k}`)?.id || null }])) })),
      byRequirement: matrix.byRequirement,
      byDepartment: matrix.byDepartment,
      totals: matrix.totals,
    },
    trend: trend.map(({ date: _d, ...t }) => t),
    previousPercent: trend.length > 1 ? trend[trend.length - 2].percent : null,
    attention: requirementAttention({ byRequirement: matrix.byRequirement, cohortsByRequirement }, now),
    assigned: legacy,
    trainingOptions: trainingOptions.map((t) => ({ ...t, open: t.status !== 'COMPLETED' && new Date(t.endDate) >= now })),
  };
}

/**
 * Enrol people who need a requirement into its next cohort (compliance v2). Safe to repeat:
 * only people who are not compliant and not enrolled are planned.
 * @returns {{ assigned: number, noCohort: number, requirements: number }}
 */
export async function applyRequirements({ institutionId = null, requirementId = null, actor = null, now = new Date() } = {}) {
  const where = { isActive: true, ...(requirementId ? { id: requirementId } : { autoAssign: true }), ...(institutionId ? { institutionId } : {}) };
  const requirements = await prisma.trainingRequirement.findMany({ where, select: { id: true, institutionId: true } });
  let assigned = 0;
  let noCohort = 0;
  const byInstitution = new Map();
  for (const r of requirements) byInstitution.set(r.institutionId, [...(byInstitution.get(r.institutionId) || []), r.id]);
  for (const [instId, ids] of byInstitution) {
    const data = await loadCompliance(instId, now);
    for (const reqId of ids) {
      const req = data.requirements.find((r) => r.id === reqId);
      if (!req) continue;
      const cohorts = req.cohorts.map((c) => ({ ...c, maxParticipants: c.places }));
      const plan = planAutoAssign({ requirement: req, rows: data.matrix.rows, cohorts }, now);
      noCohort += plan.noCohort.length;
      // One assign call per cohort and due date.
      const groups = new Map();
      for (const a of plan.assign) {
        const key = `${a.trainingId}|${a.dueDate.toISOString().slice(0, 10)}`;
        groups.set(key, [...(groups.get(key) || []), a]);
      }
      for (const list of groups.values()) {
        const training = await prisma.training.findUnique({ where: { id: list[0].trainingId } });
        if (!training || training.institutionId !== instId) continue;
        const result = await assignTraining(training, actor || { id: null }, {
          userIds: list.map((a) => a.userId),
          departments: [],
          allMembers: false,
          dueDate: list[0].dueDate,
          allowOverCapacity: false,
          note: `Required: ${req.title}`,
        });
        assigned += result.created + result.updated;
      }
    }
  }
  return { requirements: requirements.length, assigned, noCohort };
}

/**
 * Act on people from the compliance page (compliance v2). Everything is checked against
 * the admin's institution.
 * @param {{ action: 'remind'|'extend'|'exempt'|'unexempt'|'assign', registrationIds?, cells?, userIds?, dueDate?, reason?, trainingId?, requirementId? }} input
 */
export async function complianceAction(institutionId, actor, input) {
  const now = new Date();
  const regIds = Array.isArray(input.registrationIds) ? input.registrationIds.filter((x) => typeof x === 'string').slice(0, 1000) : [];
  const regs = regIds.length
    ? await prisma.trainingRegistration.findMany({
        where: { id: { in: regIds }, training: { institutionId } },
        select: { id: true, userId: true, trainingId: true, dueDate: true, status: true },
      })
    : [];

  switch (input.action) {
    case 'remind': {
      let sent = 0;
      const day = now.toISOString().slice(0, 10);
      for (const r of regs) {
        if (!['REGISTERED', 'PENDING_APPROVAL', 'WAITLISTED', 'NOT_COMPLETED'].includes(r.status)) continue;
        const overdue = r.dueDate && new Date(r.dueDate) < now;
        // At most one manual reminder per person and training per day.
        const res = await notifyTraining(overdue ? 'TRAINING_OVERDUE' : 'TRAINING_DUE', {
          userId: r.userId,
          trainingId: r.trainingId,
          dedupeKey: `manual-reminder:${r.id}:${day}`,
          extra: { dueDate: r.dueDate },
        });
        if (res?.notified) sent += 1;
      }
      return { ok: true, message: `${sent} reminder(s) sent${sent < regs.length ? `; ${regs.length - sent} skipped (already reminded today, or nothing to do)` : ''}.` };
    }
    case 'extend': {
      const due = input.dueDate ? new Date(input.dueDate) : null;
      if (!due || Number.isNaN(due.getTime()) || due < now) return { ok: false, error: 'Choose a new due date in the future' };
      for (const r of regs) {
        await prisma.trainingRegistration.update({ where: { id: r.id }, data: { dueDate: due } });
        await auditTraining({ trainingId: r.trainingId, actorId: actor.id, action: 'DUE_DATE_CHANGED', entityType: 'TrainingRegistration', entityId: r.id, before: { dueDate: r.dueDate }, after: { dueDate: due }, reason: input.reason || 'Extended from the compliance page' });
      }
      return { ok: true, message: `Due date moved for ${regs.length} person(s).` };
    }
    case 'exempt': {
      const reason = typeof input.reason === 'string' ? input.reason.trim().slice(0, 500) : '';
      if (!reason) return { ok: false, error: 'Give a reason for the exemption' };
      let made = 0;
      for (const r of regs) {
        const exists = await prisma.trainingComplianceExemption.findFirst({ where: { registrationId: r.id } });
        if (exists) continue;
        await prisma.trainingComplianceExemption.create({ data: { institutionId, userId: r.userId, registrationId: r.id, reason, createdBy: actor.id } });
        await auditTraining({ trainingId: r.trainingId, actorId: actor.id, action: 'COMPLIANCE_EXEMPTED', entityType: 'TrainingRegistration', entityId: r.id, reason });
        made += 1;
      }
      const cells = Array.isArray(input.cells) ? input.cells.slice(0, 1000) : [];
      if (cells.length) {
        const reqIds = [...new Set(cells.map((c) => c.requirementId))];
        const own = await prisma.trainingRequirement.findMany({ where: { id: { in: reqIds }, institutionId }, select: { id: true } });
        const ownSet = new Set(own.map((r) => r.id));
        const members = new Set((await prisma.user.findMany({ where: { id: { in: cells.map((c) => c.userId) }, ...institutionMembersWhere(institutionId) }, select: { id: true } })).map((u) => u.id));
        for (const c of cells) {
          if (!ownSet.has(c.requirementId) || !members.has(c.userId)) continue;
          const exists = await prisma.trainingComplianceExemption.findFirst({ where: { userId: c.userId, requirementId: c.requirementId } });
          if (exists) continue;
          await prisma.trainingComplianceExemption.create({ data: { institutionId, userId: c.userId, requirementId: c.requirementId, reason, createdBy: actor.id } });
          made += 1;
        }
      }
      return { ok: true, message: `${made} exemption(s) recorded.` };
    }
    case 'unexempt': {
      const ids = Array.isArray(input.exemptionIds) ? input.exemptionIds.filter((x) => typeof x === 'string') : [];
      const r1 = ids.length ? await prisma.trainingComplianceExemption.deleteMany({ where: { id: { in: ids }, institutionId } }) : { count: 0 };
      const r2 = regs.length ? await prisma.trainingComplianceExemption.deleteMany({ where: { registrationId: { in: regs.map((r) => r.id) }, institutionId } }) : { count: 0 };
      return { ok: true, message: `${r1.count + r2.count} exemption(s) removed.` };
    }
    case 'assign': {
      const training = input.trainingId ? await prisma.training.findUnique({ where: { id: input.trainingId } }) : null;
      if (!training || training.institutionId !== institutionId) return { ok: false, error: 'Choose a training of your institution' };
      if (training.status === 'CANCELLED' || training.status === 'COMPLETED') return { ok: false, error: 'That training is closed' };
      const userIds = [...new Set([...(Array.isArray(input.userIds) ? input.userIds : []), ...regs.map((r) => r.userId)])].filter((x) => typeof x === 'string').slice(0, 1000);
      if (!userIds.length) return { ok: false, error: 'Select people first' };
      const due = input.dueDate ? new Date(input.dueDate) : null;
      const result = await assignTraining(training, actor, {
        userIds, departments: [], allMembers: false,
        dueDate: due && !Number.isNaN(due.getTime()) ? due : null,
        allowOverCapacity: input.allowOverCapacity === true,
        note: typeof input.reason === 'string' ? input.reason.slice(0, 500) : null,
      });
      return { ok: true, message: `${result.created + result.updated} assigned to ${training.title}${result.skipped.length ? `; ${result.skipped.length} skipped (${[...new Set(result.skipped.map((s) => s.reason))].join('; ')})` : ''}.` };
    }
    default:
      return { ok: false, error: 'Unknown action' };
  }
}

/**
 * Create (rid = null) or update a requirement, including which cohorts satisfy it (#140).
 * body.trainingIds: the full list of linked trainings; only the institution's own are linked.
 */
export async function saveRequirement(institutionId, actor, rid, body) {
  const v = validateRequirement(body);
  if (!v.ok) return { ok: false, error: v.error };
  if (rid) {
    const found = await prisma.trainingRequirement.findFirst({ where: { id: rid, institutionId }, select: { id: true } });
    if (!found) return { ok: false, error: 'Not found', status: 404 };
  }
  const wanted = Array.isArray(body.trainingIds) ? body.trainingIds.filter((x) => typeof x === 'string').slice(0, 200) : null;
  const requirement = await prisma.$transaction(async (tx) => {
    const saved = rid
      ? await tx.trainingRequirement.update({ where: { id: rid }, data: v.data })
      : await tx.trainingRequirement.create({ data: { ...v.data, institutionId, createdBy: actor.id } });
    if (wanted) {
      await tx.training.updateMany({ where: { requirementId: saved.id, institutionId, id: { notIn: wanted } }, data: { requirementId: null } });
      if (wanted.length) await tx.training.updateMany({ where: { id: { in: wanted }, institutionId }, data: { requirementId: saved.id } });
    }
    return saved;
  });
  return { ok: true, requirement };
}
