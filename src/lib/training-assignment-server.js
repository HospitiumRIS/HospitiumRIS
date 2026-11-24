import prisma from '@/lib/prisma';
import { auditTraining } from '@/lib/training-audit';
import { notifyTraining } from '@/lib/training-notify';
import { seatCount } from '@/lib/training-enrolment-server';
import {
  actionTakesSeat,
  assignmentAction,
  complianceState,
  matchAssignees,
  reminderFor,
  summarizeCompliance,
} from '@/lib/training-assignment';

const MEMBER_SELECT = {
  id: true,
  givenName: true,
  familyName: true,
  email: true,
  researchProfile: { select: { department: true } },
};

/** Where clause for the active members of an institution (verified members and its owner). */
export function institutionMembersWhere(institutionId) {
  return {
    status: 'ACTIVE',
    deletedAt: null,
    OR: [{ secondaryInstitutionId: institutionId }, { institution: { is: { id: institutionId } } }],
  };
}

const flatten = (u) => ({ id: u.id, givenName: u.givenName, familyName: u.familyName, email: u.email, department: u.researchProfile?.department || null });

/** Active members of the institution, optionally searched by name/email (for pickers). */
export async function listInstitutionMembers(institutionId, { search = '', take = 50 } = {}) {
  const q = search.trim();
  const where = institutionMembersWhere(institutionId);
  if (q) {
    where.AND = [{
      OR: [
        { givenName: { contains: q, mode: 'insensitive' } },
        { familyName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ],
    }];
  }
  const users = await prisma.user.findMany({ where, select: MEMBER_SELECT, orderBy: [{ givenName: 'asc' }, { familyName: 'asc' }], take });
  return users.map(flatten);
}

/** Distinct departments on the institution members' profiles (for the picker). */
export async function institutionDepartments(institutionId) {
  const rows = await prisma.researchProfile.findMany({
    where: { department: { not: null }, user: institutionMembersWhere(institutionId) },
    select: { department: true },
    distinct: ['department'],
  });
  return rows.map((r) => r.department.trim()).filter(Boolean).sort((a, b) => a.localeCompare(b));
}

/**
 * Assign a training to people of its own institution (#103). Each person gets a place
 * (subject to capacity unless allowOverCapacity), is marked ASSIGNED with the due date,
 * and is told by email. Returns counts and the people skipped, with why.
 */
export async function assignTraining(training, actor, input) {
  const members = (await prisma.user.findMany({ where: institutionMembersWhere(training.institutionId), select: MEMBER_SELECT })).map(flatten);
  const { assignees, outOfScope } = matchAssignees(members, input);
  const skipped = outOfScope.map((userId) => ({ userId, name: null, reason: 'Not a member of this institution' }));
  const done = { created: 0, updated: 0 };
  const now = new Date();
  const changed = [];

  for (const person of assignees) {
    const outcome = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "trainings" WHERE "id" = ${training.id} FOR UPDATE`;
      const existing = await tx.trainingRegistration.findUnique({ where: { trainingId_userId: { trainingId: training.id, userId: person.id } } });
      const action = assignmentAction(existing);
      if (action === 'skip-completed') return { skip: 'Already completed this training' };

      let status = existing?.status || 'REGISTERED';
      if (actionTakesSeat(action)) {
        const taken = await seatCount(training.id, tx, existing?.id || null);
        if (taken < (training.maxParticipants || 0) || input.allowOverCapacity) status = 'REGISTERED';
        else if (training.waitlistEnabled) status = 'WAITLISTED';
        else return { skip: 'Training is full' };
      }

      const data = {
        status,
        source: 'ASSIGNED',
        assignedBy: actor.id,
        assignedAt: now,
        dueDate: input.dueDate,
        ...(action === 'reinstate' || action === 'create' ? { registeredAt: now, cancelledAt: null, cancelReason: null, rejectedReason: null } : {}),
        ...(status === 'REGISTERED' && action !== 'update' ? { approvedBy: actor.id, approvedAt: now } : {}),
      };
      const registration = existing
        ? await tx.trainingRegistration.update({ where: { id: existing.id }, data })
        : await tx.trainingRegistration.create({ data: { ...data, trainingId: training.id, userId: person.id } });
      return { registration, before: existing?.status || null, action };
    });

    if (outcome.skip) {
      skipped.push({ userId: person.id, name: `${person.givenName} ${person.familyName}`.trim(), reason: outcome.skip });
      continue;
    }
    if (outcome.action === 'update') done.updated += 1;
    else done.created += 1;
    changed.push({ registrationId: outcome.registration.id, userId: person.id, before: outcome.before, after: outcome.registration.status });

    await notifyTraining('TRAINING_ASSIGNED', {
      userId: person.id,
      trainingId: training.id,
      dedupeKey: `assigned:${outcome.registration.id}:${input.dueDate ? input.dueDate.toISOString().slice(0, 10) : 'none'}`,
      extra: { dueDate: input.dueDate, reason: input.note },
    });
  }

  await auditTraining({
    trainingId: training.id,
    actorId: actor.id,
    action: 'TRAINING_ASSIGNED',
    entityType: 'Training',
    entityId: training.id,
    after: {
      dueDate: input.dueDate,
      departments: input.departments,
      allMembers: input.allMembers,
      people: changed.length,
      changes: changed.slice(0, 200),
    },
    reason: input.note,
  });

  return { ...done, skipped };
}

const REMINDER_INCLUDE = {
  certificate: { select: { id: true, status: true, expiresAt: true, certificateNumber: true } },
};

/**
 * Send due, overdue, expiring and re-training reminders (#103). Safe to run as often as
 * you like: each reminder has a dedupe key. Scope with userId (a person opening their
 * trainings) or leave empty (the daily job).
 */
export async function sendComplianceReminders({ userId = null, institutionId = null, now = new Date() } = {}) {
  const soon = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);
  const registrations = await prisma.trainingRegistration.findMany({
    where: {
      ...(userId ? { userId } : {}),
      ...(institutionId ? { training: { institutionId } } : {}),
      OR: [
        { source: 'ASSIGNED', dueDate: { not: null, lte: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000) }, status: { in: ['REGISTERED', 'NOT_COMPLETED', 'PENDING_APPROVAL', 'WAITLISTED'] } },
        { status: 'COMPLETED', certificate: { is: { status: 'ISSUED', expiresAt: { not: null, lte: soon } } } },
      ],
    },
    include: REMINDER_INCLUDE,
  });
  let sent = 0;
  for (const r of registrations) {
    const reminder = reminderFor(r, now);
    if (!reminder) continue;
    const result = await notifyTraining(reminder.kind, {
      userId: r.userId,
      trainingId: r.trainingId,
      dedupeKey: reminder.dedupeKey,
      extra: {
        dueDate: r.dueDate,
        expiresAt: r.certificate?.expiresAt,
        certificate: r.certificate ? { number: r.certificate.certificateNumber } : null,
      },
    });
    if (result?.notified) sent += 1;
  }
  return { checked: registrations.length, sent };
}

/**
 * Compliance view for an institution (#103): mandatory trainings, and any training
 * with assigned people or certificates that expire. One row per person.
 */
export async function complianceReport(institutionId, now = new Date()) {
  const trainings = await prisma.training.findMany({
    where: {
      institutionId,
      OR: [
        { isMandatory: true },
        { registrations: { some: { source: 'ASSIGNED' } } },
        { certificateValidityMonths: { not: null } },
      ],
    },
    select: {
      id: true,
      title: true,
      code: true,
      isMandatory: true,
      startDate: true,
      endDate: true,
      status: true,
      certificateValidityMonths: true,
      registrations: {
        where: { OR: [{ source: 'ASSIGNED' }, { status: 'COMPLETED' }] },
        select: {
          id: true,
          status: true,
          source: true,
          dueDate: true,
          assignedAt: true,
          completedAt: true,
          user: { select: { id: true, givenName: true, familyName: true, email: true, researchProfile: { select: { department: true } } } },
          certificate: { select: { id: true, status: true, expiresAt: true, certificateNumber: true } },
          complianceExemptions: { select: { reason: true }, take: 1 },
        },
      },
    },
    orderBy: { startDate: 'desc' },
  });
  // Exempted registrations (compliance v2) are shown as Exempt and left out of totals.
  for (const t of trainings) for (const r of t.registrations) r.exempt = r.complianceExemptions.length > 0;

  const people = [];
  const rows = trainings.map((t) => {
    const regs = t.registrations;
    for (const r of regs) {
      const { state, daysLeft } = complianceState(r, now);
      people.push({
        registrationId: r.id,
        userId: r.user.id,
        exemptReason: r.complianceExemptions[0]?.reason || null,
        trainingId: t.id,
        trainingTitle: t.title,
        name: `${r.user.givenName} ${r.user.familyName}`.trim(),
        email: r.user.email,
        department: r.user.researchProfile?.department || null,
        source: r.source,
        status: r.status,
        dueDate: r.dueDate,
        completedAt: r.completedAt,
        certificateExpiresAt: r.certificate?.status === 'ISSUED' ? r.certificate.expiresAt : null,
        state,
        daysLeft,
      });
    }
    return {
      id: t.id,
      title: t.title,
      code: t.code,
      isMandatory: t.isMandatory,
      startDate: t.startDate,
      endDate: t.endDate,
      status: t.status,
      ...summarizeCompliance(regs, now),
    };
  });
  return { trainings: rows, people, totals: summarizeCompliance(trainings.flatMap((t) => t.registrations), now) };
}
