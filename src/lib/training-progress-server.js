import prisma from '@/lib/prisma';
import { auditTraining } from '@/lib/training-audit';
import { notifyTraining } from '@/lib/training-notify';
import { autoIssueCertificates } from '@/lib/training-certificates-server';
import { ACTIVE_REGISTRATION_STATUSES } from '@/lib/training-scope';
import { computeAttendance } from '@/lib/training-attendance';
import {
  decideCompletionStatus,
  evaluateCompletion,
  hasCompletionRules,
  modulesCompletedByAttendance,
} from '@/lib/training-completion';
import { assessmentCompletionFacts, modulesCompletedByAssessment } from '@/lib/training-assessment';
import { loadEffectiveForm } from '@/lib/training-feedback-server';

const TRAINING_FIELDS = {
  id: true,
  endDate: true,
  excludeExcusedSessions: true,
  minAttendancePercent: true,
  requireAllModules: true,
  requireAssessmentPass: true,
  requireFeedback: true,
  completionGraceDays: true,
  institutionId: true,
};

async function loadTrainingFacts(trainingId) {
  const [training, sessions, modules, assessments] = await Promise.all([
    prisma.training.findUnique({ where: { id: trainingId }, select: TRAINING_FIELDS }),
    prisma.trainingSession.findMany({
      where: { trainingId },
      select: { id: true, moduleId: true, status: true, isAttendanceRequired: true, startsAt: true },
    }),
    prisma.trainingModule.findMany({
      where: { trainingId },
      select: { id: true, title: true, status: true, isRequired: true, completionMode: true, order: true },
      orderBy: { order: 'asc' },
    }),
    prisma.trainingAssessment.findMany({
      where: { trainingId },
      select: { id: true, moduleId: true, isPublished: true, isRequiredForCompletion: true },
    }),
  ]);
  // Feedback (#106): is there a form to submit?
  const feedbackAvailable = training ? Boolean((await loadEffectiveForm(training)).form) : false;
  return { training, sessions, modules, assessments, feedbackAvailable };
}

/** Evaluate one registration from already-loaded facts (no writes). */
export function evaluateRegistration({ training, sessions, modules, assessments = [], feedbackAvailable = false }, registration, now = new Date()) {
  const attendance = computeAttendance(sessions, registration.attendance || [], {
    excludeExcused: training.excludeExcusedSessions !== false,
    now,
  });
  const progress = new Map((registration.moduleProgress || []).map((p) => [p.moduleId, p.status]));
  // Passed assessments (#105): required ones count for completion, and modules set to
  // ON_ASSESSMENT_PASS complete once every linked assessment is passed.
  const passedIds = [...new Set((registration.assessmentAttempts || []).filter((a) => a.passed).map((a) => a.assessmentId))];
  const autoModules = [...new Set([
    ...modulesCompletedByAttendance(modules, sessions, registration.attendance || [], now),
    ...modulesCompletedByAssessment(modules, assessments, passedIds),
  ])].filter((id) => progress.get(id) !== 'COMPLETED');
  for (const id of autoModules) progress.set(id, 'COMPLETED');

  const evaluation = evaluateCompletion(training, {
    attendancePercent: attendance.percent,
    modules,
    progress,
    assessments: assessmentCompletionFacts(assessments, passedIds),
    feedbackAvailable,
    feedbackSubmitted: Boolean(registration.feedbackResponse),
  });
  return { attendance, progress, autoModules, evaluation };
}

/**
 * Recompute everything derived from a registration's activity (#92, #96):
 * cached attendance %, modules completed by attendance, and, once the training has
 * ended and it has completion rules, the registration's COMPLETED / NOT_COMPLETED status.
 *
 * @param {string} trainingId
 * @param {string[]|null} [registrationIds]  default: every active registration
 * @param {{ actorId?: string|null, now?: Date }} [options]
 */
export async function refreshTrainingProgress(trainingId, registrationIds = null, { actorId = null, now = new Date() } = {}) {
  const facts = await loadTrainingFacts(trainingId);
  if (!facts.training) return { evaluated: 0, completed: 0, notCompleted: 0, reopened: 0 };

  const registrations = await prisma.trainingRegistration.findMany({
    where: {
      trainingId,
      ...(registrationIds ? { id: { in: registrationIds } } : {}),
      status: { in: ACTIVE_REGISTRATION_STATUSES },
    },
    select: {
      id: true,
      userId: true,
      status: true,
      attendancePercent: true,
      completionOverride: true,
      attendance: { select: { sessionId: true, status: true } },
      moduleProgress: { select: { moduleId: true, status: true } },
      assessmentAttempts: { where: { passed: true }, select: { assessmentId: true, passed: true } },
      feedbackResponse: { select: { id: true } },
    },
  });

  const summary = { evaluated: registrations.length, completed: 0, notCompleted: 0, reopened: 0 };
  const newlyCompleted = [];
  const rules = hasCompletionRules(facts.training);

  for (const registration of registrations) {
    const { attendance, autoModules, evaluation } = evaluateRegistration(facts, registration, now);

    for (const moduleId of autoModules) {
      await prisma.trainingModuleProgress.upsert({
        where: { registrationId_moduleId: { registrationId: registration.id, moduleId } },
        update: { status: 'COMPLETED', completedAt: now },
        create: { registrationId: registration.id, moduleId, status: 'COMPLETED', completedAt: now },
      });
    }

    const data = {};
    if (attendance.percent !== registration.attendancePercent) data.attendancePercent = attendance.percent;

    const next = rules ? decideCompletionStatus(facts.training, registration, evaluation, now) : null;
    if (next) {
      data.status = next;
      data.completedAt = next === 'COMPLETED' ? now : null;
      if (next === 'COMPLETED') {
        summary.completed += 1;
        newlyCompleted.push(registration.id);
      }
      else if (next === 'NOT_COMPLETED') summary.notCompleted += 1;
      else summary.reopened += 1;
    }

    if (Object.keys(data).length) {
      await prisma.trainingRegistration.update({ where: { id: registration.id }, data });
    }
    if (next === 'COMPLETED' || next === 'NOT_COMPLETED') {
      await notifyTraining(next === 'COMPLETED' ? 'TRAINING_COMPLETED' : 'TRAINING_NOT_COMPLETED', {
        userId: registration.userId,
        trainingId,
        dedupeKey: `${next === 'COMPLETED' ? 'completed' : 'not-completed'}:${registration.id}`,
        extra: { checks: evaluation.checks },
      });
    }
    if (next) {
      await auditTraining({
        trainingId,
        actorId,
        action: 'COMPLETION_EVALUATED',
        entityType: 'TrainingRegistration',
        entityId: registration.id,
        before: { status: registration.status },
        after: { status: next, checks: evaluation.checks.map(({ rule, met, detail }) => ({ rule, met, detail })) },
      });
    }
  }
  // Trainings set to issue certificates automatically (#99).
  if (newlyCompleted.length) await autoIssueCertificates(trainingId, newlyCompleted);
  return summary;
}

/** Completion report for the admin: every active registration with its checklist. */
export async function loadCompletionReport(trainingId, now = new Date()) {
  const facts = await loadTrainingFacts(trainingId);
  if (!facts.training) return null;
  const registrations = await prisma.trainingRegistration.findMany({
    where: { trainingId, status: { in: ACTIVE_REGISTRATION_STATUSES } },
    orderBy: { registeredAt: 'asc' },
    select: {
      id: true,
      status: true,
      completedAt: true,
      completionOverride: true,
      user: { select: { id: true, givenName: true, familyName: true, email: true } },
      attendance: { select: { sessionId: true, status: true } },
      moduleProgress: { select: { moduleId: true, status: true } },
      assessmentAttempts: { where: { passed: true }, select: { assessmentId: true, passed: true } },
      feedbackResponse: { select: { id: true } },
    },
  });
  return {
    rules: {
      minAttendancePercent: facts.training.minAttendancePercent,
      requireAllModules: facts.training.requireAllModules,
      requireAssessmentPass: facts.training.requireAssessmentPass,
      requireFeedback: facts.training.requireFeedback,
      completionGraceDays: facts.training.completionGraceDays,
      hasRules: hasCompletionRules(facts.training),
    },
    ended: facts.training.endDate ? new Date(facts.training.endDate) <= now : false,
    participants: registrations.map((r) => {
      const { attendance, evaluation } = evaluateRegistration(facts, r, now);
      return {
        registrationId: r.id,
        status: r.status,
        completedAt: r.completedAt,
        override: r.completionOverride || null,
        user: r.user,
        attendancePercent: attendance.percent,
        evaluation,
      };
    }),
  };
}

/** The caller's own checklist, for the researcher view. */
export async function loadOwnCompletion(trainingId, registrationId, now = new Date()) {
  const facts = await loadTrainingFacts(trainingId);
  if (!facts.training) return null;
  const registration = await prisma.trainingRegistration.findUnique({
    where: { id: registrationId },
    select: {
      id: true,
      status: true,
      attendance: { select: { sessionId: true, status: true } },
      moduleProgress: { select: { moduleId: true, status: true } },
      assessmentAttempts: { where: { passed: true }, select: { assessmentId: true, passed: true } },
      feedbackResponse: { select: { id: true } },
    },
  });
  if (!registration) return null;
  return evaluateRegistration(facts, registration, now).evaluation;
}

/**
 * Trainings the scheduled job should look at: completion rules on, ended, and not
 * longer ago than their grace period plus a margin.
 */
export async function trainingsDueForCompletion(now = new Date()) {
  const horizon = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);
  return prisma.training.findMany({
    where: {
      endDate: { lte: now, gte: horizon },
      status: { not: 'CANCELLED' },
      OR: [
        { minAttendancePercent: { gt: 0 } },
        { requireAllModules: true },
        { requireAssessmentPass: true },
        { requireFeedback: true },
      ],
    },
    select: { id: true },
  });
}
