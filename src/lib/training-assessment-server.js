import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { auditTraining } from '@/lib/training-audit';
import { ACTIVE_REGISTRATION_STATUSES } from '@/lib/training-scope';
import { refreshTrainingProgress } from '@/lib/training-progress-server';
import {
  attemptDeadline,
  attemptExpired,
  bestAttempt,
  buildAttemptLayout,
  canStartAttempt,
  gradeAttempt,
  isPass,
  publicQuestion,
  resultView,
  sanitizeAnswers,
} from '@/lib/training-assessment';

export const QUESTION_ORDER = { orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] };

/**
 * The caller as a participant of the training: signed in and holding an active
 * registration. Assessments are never shown to anyone else through these routes.
 * @returns {{ user, registration } | { error: NextResponse }}
 */
export async function requireParticipant(request, trainingId) {
  const user = await getAuthenticatedUser(request);
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const registration = await prisma.trainingRegistration.findUnique({
    where: { trainingId_userId: { trainingId, userId: user.id } },
    select: { id: true, status: true, trainingId: true, userId: true },
  });
  if (!registration || !ACTIVE_REGISTRATION_STATUSES.includes(registration.status)) {
    return { error: NextResponse.json({ error: 'Register for this training to take its assessments' }, { status: 403 }) };
  }
  return { user, registration };
}

/** Load an assessment of the training, or a 404. */
export async function loadAssessment(trainingId, assessmentId, { withQuestions = false } = {}) {
  const assessment = await prisma.trainingAssessment.findUnique({
    where: { id: assessmentId },
    include: withQuestions ? { questions: QUESTION_ORDER } : undefined,
  });
  if (!assessment || assessment.trainingId !== trainingId) {
    return { error: NextResponse.json({ error: 'Assessment not found' }, { status: 404 }) };
  }
  return { assessment };
}

/**
 * Grade and close an attempt (on submit, or when its time ran out). Short-text answers
 * that need a person make it NEEDS_GRADING; otherwise it is GRADED with pass/fail.
 * Passing refreshes the participant's progress (modules, completion).
 */
export async function finaliseAttempt(attempt, assessment, questions, { answers = null, actorId = null, now = new Date() } = {}) {
  const finalAnswers = sanitizeAnswers(questions, answers ?? attempt.answers ?? {});
  const grade = gradeAttempt(questions, finalAnswers);
  const status = grade.needsGrading ? 'NEEDS_GRADING' : 'GRADED';
  const passed = grade.needsGrading ? null : isPass(grade.percent, assessment.passMark);
  // Only update if still in progress (a double submit must not grade twice).
  const updated = await prisma.trainingAssessmentAttempt.updateMany({
    where: { id: attempt.id, status: 'IN_PROGRESS' },
    data: {
      answers: finalAnswers,
      status,
      submittedAt: now,
      score: grade.score,
      maxScore: grade.maxScore,
      percent: grade.percent,
      passed,
      feedback: { perQuestion: grade.perQuestion, manualScores: {}, comments: {} },
      ...(status === 'GRADED' ? { gradedAt: now } : {}),
    },
  });
  const fresh = await prisma.trainingAssessmentAttempt.findUnique({ where: { id: attempt.id } });
  if (updated.count) {
    await auditTraining({
      trainingId: assessment.trainingId,
      actorId: actorId || attempt.userId,
      action: 'ASSESSMENT_SUBMITTED',
      entityType: 'TrainingAssessmentAttempt',
      entityId: attempt.id,
      after: { assessmentId: assessment.id, attemptNumber: attempt.attemptNumber, status, percent: grade.percent, passed },
    });
    if (passed) await refreshTrainingProgress(assessment.trainingId, [attempt.registrationId], { actorId });
  }
  return fresh;
}

/** Close any of this registration's attempts whose time ran out. */
export async function closeExpiredAttempts(registrationId, assessments, now = new Date()) {
  const open = await prisma.trainingAssessmentAttempt.findMany({ where: { registrationId, status: 'IN_PROGRESS', deadlineAt: { not: null } } });
  for (const attempt of open) {
    if (!attemptExpired(attempt, now)) continue;
    const assessment = assessments.find((a) => a.id === attempt.assessmentId)
      || await prisma.trainingAssessment.findUnique({ where: { id: attempt.assessmentId }, include: { questions: QUESTION_ORDER } });
    if (assessment) await finaliseAttempt(attempt, assessment, assessment.questions || [], { now });
  }
}

/** An in-progress attempt as the participant sees it (no answers revealed). */
export function attemptForParticipant(attempt, assessment, questions) {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const layout = Array.isArray(attempt.layout) && attempt.layout.length
    ? attempt.layout
    : questions.map((q) => ({ questionId: q.id, optionIds: (q.options || []).map((o) => o.id) }));
  return {
    id: attempt.id,
    attemptNumber: attempt.attemptNumber,
    status: attempt.status,
    startedAt: attempt.startedAt,
    deadlineAt: attempt.deadlineAt,
    answers: attempt.answers || {},
    assessment: { id: assessment.id, title: assessment.title, description: assessment.description, type: assessment.type, passMark: assessment.passMark, timeLimitMinutes: assessment.timeLimitMinutes },
    questions: layout.filter((l) => byId.has(l.questionId)).map((l) => publicQuestion(byId.get(l.questionId), l.optionIds)),
  };
}

/** Start a new attempt, or resume the open one. */
export async function startOrResumeAttempt(assessment, registration, now = new Date()) {
  const attempts = await prisma.trainingAssessmentAttempt.findMany({
    where: { assessmentId: assessment.id, registrationId: registration.id },
    orderBy: { attemptNumber: 'asc' },
  });
  const decision = canStartAttempt(assessment, attempts, now);
  if (!decision.ok) return { error: decision.error };
  if (decision.resume) return { attempt: decision.resume };
  if (!assessment.questions?.length) return { error: 'This assessment has no questions yet' };

  try {
    const attempt = await prisma.trainingAssessmentAttempt.create({
      data: {
        assessmentId: assessment.id,
        registrationId: registration.id,
        userId: registration.userId,
        attemptNumber: decision.nextNumber,
        layout: buildAttemptLayout(assessment.questions, assessment, `${registration.id}:${decision.nextNumber}`),
        answers: {},
        startedAt: now,
        deadlineAt: attemptDeadline(assessment, now),
      },
    });
    return { attempt };
  } catch (err) {
    // Two tabs starting at once: the unique attempt number wins once; resume it.
    if (err?.code === 'P2002') {
      const again = await prisma.trainingAssessmentAttempt.findFirst({ where: { assessmentId: assessment.id, registrationId: registration.id, status: 'IN_PROGRESS' } });
      if (again) return { attempt: again };
    }
    throw err;
  }
}

/** The participant's assessments for a training, with their attempts and what they may do. */
export async function participantAssessments(trainingId, registration, now = new Date()) {
  const assessments = await prisma.trainingAssessment.findMany({
    where: { trainingId, isPublished: true },
    include: { questions: QUESTION_ORDER, module: { select: { id: true, title: true } } },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  });
  await closeExpiredAttempts(registration.id, assessments, now);
  const attempts = await prisma.trainingAssessmentAttempt.findMany({
    where: { registrationId: registration.id, assessmentId: { in: assessments.map((a) => a.id) } },
    orderBy: { attemptNumber: 'asc' },
  });
  return assessments.map((a) => {
    const mine = attempts.filter((t) => t.assessmentId === a.id);
    const decision = canStartAttempt(a, mine, now);
    const best = bestAttempt(mine);
    return {
      id: a.id,
      title: a.title,
      description: a.description,
      type: a.type,
      module: a.module,
      passMark: a.passMark,
      maxAttempts: a.maxAttempts,
      timeLimitMinutes: a.timeLimitMinutes,
      availableFrom: a.availableFrom,
      availableUntil: a.availableUntil,
      isRequiredForCompletion: a.isRequiredForCompletion,
      questionCount: a.questions.length,
      totalPoints: a.questions.reduce((s, q) => s + (Number(q.points) || 0), 0),
      attemptsUsed: mine.length,
      attemptsLeft: decision.attemptsLeft,
      canStart: decision.ok,
      blockedReason: decision.ok ? null : decision.error,
      openAttemptId: decision.resume?.id || null,
      passed: mine.some((t) => t.passed === true),
      awaitingGrading: mine.some((t) => t.status === 'NEEDS_GRADING'),
      best: best ? { percent: best.percent, passed: best.passed } : null,
      attempts: mine.map((t) => ({ id: t.id, attemptNumber: t.attemptNumber, status: t.status, percent: t.percent, passed: t.passed, submittedAt: t.submittedAt })),
    };
  });
}

export { resultView };
