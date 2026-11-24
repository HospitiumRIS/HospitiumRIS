import prisma from '@/lib/prisma';
import { auditActionLabel } from '@/lib/training-automation';
import { feedbackFigures } from '@/lib/training-analytics';
import { loadEffectiveForm } from '@/lib/training-feedback-server';
import { evaluateRegistration, loadTrainingFacts } from '@/lib/training-progress-server';
import { nextSession, participantTimeline, setupChecklist, workspaceStats } from '@/lib/training-workspace';

const fullName = (u) => `${u?.givenName || ''} ${u?.familyName || ''}`.trim() || u?.email || 'Someone';

async function actorNames(ids) {
  const list = [...new Set(ids.filter(Boolean))];
  if (!list.length) return new Map();
  const users = await prisma.user.findMany({ where: { id: { in: list } }, select: { id: true, givenName: true, familyName: true, email: true } });
  return new Map(users.map((u) => [u.id, fullName(u)]));
}

/**
 * Overview of one training for its admins: phase, setup checklist, figures, next session
 * and recent activity.
 */
export async function loadTrainingOverview(training, now = new Date()) {
  const trainingId = training.id;
  const [sessions, modules, materials, assessments, facilitators, registrations, responses, needsGrading, recent, effective] = await Promise.all([
    prisma.trainingSession.findMany({
      where: { trainingId },
      select: {
        id: true, title: true, status: true, startsAt: true, endsAt: true, venue: true, onlineLink: true, deliveryMode: true,
        checkInOpensMinutesBefore: true, checkInClosesMinutesAfter: true,
        _count: { select: { attendance: true } },
      },
      orderBy: { startsAt: 'asc' },
    }),
    prisma.trainingModule.findMany({ where: { trainingId }, select: { id: true, status: true } }),
    prisma.trainingMaterial.count({ where: { trainingId } }),
    prisma.trainingAssessment.findMany({ where: { trainingId }, select: { id: true, isPublished: true, isRequiredForCompletion: true } }),
    prisma.trainingFacilitator.count({ where: { trainingId } }),
    prisma.trainingRegistration.findMany({
      where: { trainingId },
      select: { status: true, attendancePercent: true, certificate: { select: { status: true } } },
    }),
    prisma.trainingFeedbackResponse.findMany({ where: { trainingId }, select: { trainingId: true, formId: true, answers: true } }),
    prisma.trainingAssessmentAttempt.count({ where: { status: 'NEEDS_GRADING', assessment: { trainingId } } }),
    prisma.trainingAuditLog.findMany({ where: { trainingId }, orderBy: { createdAt: 'desc' }, take: 6 }),
    loadEffectiveForm(training),
  ]);

  const formIds = [...new Set(responses.map((r) => r.formId))];
  const forms = formIds.length ? await prisma.trainingFeedbackForm.findMany({ where: { id: { in: formIds } }, select: { id: true, questions: true } }) : [];
  const feedback = feedbackFigures(forms, responses);
  const stats = workspaceStats({ training, registrations, feedback });
  const hasRules = Boolean(training.minAttendancePercent) || training.requireAllModules || training.requireAssessmentPass || training.requireFeedback;
  const ended = training.endDate && new Date(training.endDate) < now;
  const checklist = setupChecklist({
    training,
    sessions: sessions.map((s) => ({ ...s, attendanceCount: s._count.attendance })),
    modules,
    materials,
    assessments,
    feedbackForm: Boolean(effective.form),
    facilitators,
    stats,
    needsGrading,
    undecided: ended && hasRules ? registrations.filter((r) => r.status === 'REGISTERED').length : 0,
  }, now);

  const names = await actorNames(recent.map((r) => r.actorId));
  const next = nextSession(sessions, now);
  const unmarked = sessions.filter((x) => x.status === 'SCHEDULED' && new Date(x.endsAt) < now && !x._count.attendance).length;
  return {
    // Badges for the section nav: things to act on in each section.
    alerts: {
      registrations: stats.pending,
      attendance: unmarked,
      assessments: needsGrading,
      completion: ended && hasRules ? registrations.filter((r) => r.status === 'REGISTERED').length : 0,
      certificates: ended ? stats.certificatesDue : 0,
    },
    checklist,
    stats,
    nextSession: next ? { ...next, _count: undefined } : null,
    sessionsTotal: sessions.filter((s) => s.status === 'SCHEDULED').length,
    recentActivity: recent.map((l) => ({
      id: l.id,
      at: l.createdAt,
      label: auditActionLabel(l.action),
      actor: l.actorId ? names.get(l.actorId) || 'Former user' : 'System',
      reason: l.reason,
    })),
  };
}

/**
 * Everything about one participant of a training, for the admin's person panel:
 * registration, attendance per session, modules, assessments, feedback, certificate,
 * completion checklist and a timeline.
 * @returns {object|null} null when the registration is not part of this training
 */
export async function loadParticipant(trainingId, registrationId, now = new Date()) {
  const reg = await prisma.trainingRegistration.findUnique({
    where: { id: registrationId },
    select: {
      id: true, trainingId: true, status: true, source: true, registeredAt: true, approvedAt: true, cancelledAt: true, cancelReason: true,
      rejectedReason: true, dueDate: true, assignedAt: true, completedAt: true, completionOverride: true, attendancePercent: true,
      user: { select: { id: true, givenName: true, familyName: true, email: true, researchProfile: { select: { department: true } } } },
      attendance: { select: { sessionId: true, status: true, method: true, checkedInAt: true, note: true } },
      moduleProgress: { select: { moduleId: true, status: true, completedAt: true } },
      assessmentAttempts: {
        select: { id: true, assessmentId: true, attemptNumber: true, status: true, submittedAt: true, percent: true, passed: true, assessment: { select: { title: true, passMark: true } } },
        orderBy: { createdAt: 'asc' },
      },
      feedbackResponse: { select: { id: true, submittedAt: true } },
      certificate: { select: { id: true, status: true, certificateNumber: true, issuedAt: true, expiresAt: true, revokedAt: true, revokedReason: true, certificateUrl: true, source: true } },
      complianceExemptions: { select: { reason: true }, take: 1 },
    },
  });
  if (!reg || reg.trainingId !== trainingId) return null;

  const facts = await loadTrainingFacts(trainingId);
  const { attendance, progress, evaluation } = evaluateRegistration(facts, reg, now);
  const [sessionRows, audit] = await Promise.all([
    prisma.trainingSession.findMany({
      where: { trainingId, status: { not: 'CANCELLED' } },
      select: { id: true, title: true, startsAt: true, endsAt: true, isAttendanceRequired: true },
      orderBy: { startsAt: 'asc' },
    }),
    prisma.trainingAuditLog.findMany({
      where: {
        trainingId,
        entityId: { in: [reg.id, ...reg.assessmentAttempts.map((a) => a.id), ...(reg.certificate ? [reg.certificate.id] : [])] },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
  ]);
  const byAttendance = new Map(reg.attendance.map((a) => [a.sessionId, a]));
  const names = await actorNames(audit.map((a) => a.actorId));

  return {
    registration: {
      id: reg.id,
      status: reg.status,
      source: reg.source,
      registeredAt: reg.registeredAt,
      approvedAt: reg.approvedAt,
      dueDate: reg.dueDate,
      completedAt: reg.completedAt,
      override: reg.completionOverride || null,
      cancelReason: reg.cancelReason,
      rejectedReason: reg.rejectedReason,
      exemptReason: reg.complianceExemptions[0]?.reason || null,
    },
    person: { id: reg.user.id, name: fullName(reg.user), email: reg.user.email, department: reg.user.researchProfile?.department || null },
    attendance: {
      percent: attendance.percent,
      sessions: sessionRows.map((s) => {
        const a = byAttendance.get(s.id);
        return { id: s.id, title: s.title, startsAt: s.startsAt, endsAt: s.endsAt, held: new Date(s.endsAt) < now, required: s.isAttendanceRequired, status: a?.status || null, method: a?.method || null, checkedInAt: a?.checkedInAt || null, note: a?.note || null };
      }),
    },
    modules: facts.modules.map((m) => ({ id: m.id, title: m.title, required: m.isRequired !== false, status: progress.get(m.id) || 'PENDING' })),
    assessments: reg.assessmentAttempts.map((a) => ({ id: a.id, assessmentId: a.assessmentId, title: a.assessment.title, passMark: a.assessment.passMark, attemptNumber: a.attemptNumber, status: a.status, submittedAt: a.submittedAt, percent: a.percent, passed: a.passed })),
    feedbackSubmittedAt: reg.feedbackResponse?.submittedAt || null,
    certificate: reg.certificate,
    evaluation,
    timeline: participantTimeline({
      registration: reg,
      attempts: reg.assessmentAttempts.map((a) => ({ ...a, assessmentTitle: a.assessment.title })),
      certificate: reg.certificate,
      feedbackAt: reg.feedbackResponse?.submittedAt,
      audit: audit.map((l) => ({ createdAt: l.createdAt, label: auditActionLabel(l.action), actor: l.actorId ? names.get(l.actorId) || 'Former user' : null, reason: l.reason })),
    }).slice(0, 40),
  };
}
