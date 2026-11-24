/**
 * Training workspace overview (admin detail page): where a training is in its life,
 * what is still missing, headline figures and the next session. Pure: no database.
 */

const MIN = 60 * 1000;
const SEATED = new Set(['REGISTERED', 'COMPLETED', 'NOT_COMPLETED']);

/** draft | upcoming | running | ended | cancelled */
export function trainingPhase(training, now = new Date()) {
  if (!training) return 'draft';
  if (training.status === 'CANCELLED') return 'cancelled';
  if (training.status === 'DRAFT') return 'draft';
  if (training.status === 'COMPLETED') return 'ended';
  if (training.endDate && new Date(training.endDate) < now) return 'ended';
  if (training.startDate && new Date(training.startDate) <= now) return 'running';
  return 'upcoming';
}

export const PHASE_LABELS = {
  draft: 'Draft: not visible to staff',
  upcoming: 'Open for enrolment',
  running: 'Running now',
  ended: 'Ended: wrap up',
  cancelled: 'Cancelled',
};

/**
 * Headline figures.
 * @param {{ training, registrations: [{ status, attendancePercent, certificate? }], feedback?: { responses, averageRating } }} input
 */
export function workspaceStats({ training, registrations = [], feedback = null }) {
  const count = (s) => registrations.filter((r) => r.status === s).length;
  const seated = registrations.filter((r) => SEATED.has(r.status)).length;
  const completed = count('COMPLETED');
  const notCompleted = count('NOT_COMPLETED');
  const att = registrations.filter((r) => SEATED.has(r.status) && Number.isFinite(r.attendancePercent)).map((r) => r.attendancePercent);
  const capacity = training?.maxParticipants || 0;
  const issued = registrations.filter((r) => r.certificate && r.certificate.status !== 'REVOKED').length;
  return {
    seated,
    capacity,
    fillRate: capacity ? Math.round((seated / capacity) * 100) : null,
    waitlisted: count('WAITLISTED'),
    pending: count('PENDING_APPROVAL'),
    attendance: att.length ? Math.round(att.reduce((a, b) => a + b, 0) / att.length) : null,
    completed,
    notCompleted,
    completionRate: completed + notCompleted ? Math.round((completed / (completed + notCompleted)) * 100) : null,
    certificates: issued,
    certificatesDue: registrations.filter((r) => r.status === 'COMPLETED' && (!r.certificate || r.certificate.status === 'REVOKED')).length,
    feedbackResponses: feedback?.responses ?? 0,
    rating: feedback?.averageRating ?? null,
  };
}

/** The next (or current) scheduled session, with how soon it is. */
export function nextSession(sessions = [], now = new Date()) {
  const s = sessions
    .filter((x) => x.status === 'SCHEDULED' && new Date(x.endsAt) >= now)
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))[0];
  if (!s) return null;
  const starts = new Date(s.startsAt);
  const minutes = Math.round((starts - now) / MIN);
  const sameDay = starts.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
  const opens = new Date(starts.getTime() - (s.checkInOpensMinutesBefore ?? 30) * MIN);
  const closes = new Date(starts.getTime() + (s.checkInClosesMinutesAfter ?? 30) * MIN);
  return {
    ...s,
    state: minutes <= 0 ? 'live' : sameDay ? 'today' : 'upcoming',
    minutesUntil: Math.max(0, minutes),
    checkInOpen: now >= opens && now <= closes,
    index: sessions.filter((x) => x.status === 'SCHEDULED').sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt)).findIndex((x) => x.id === s.id) + 1,
  };
}

/** "in 3 days", "in 2 h 15 min", "now". */
export function untilLabel(minutes) {
  if (minutes <= 0) return 'now';
  if (minutes < 60) return `in ${minutes} min`;
  if (minutes < 48 * 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `in ${h} h${m ? ` ${m} min` : ''}`;
  }
  return `in ${Math.round(minutes / (24 * 60))} days`;
}

/**
 * What is done and what is missing, in the order it matters for the phase.
 * @param {object} facts
 *   training      { status, description, startDate, endDate, minAttendancePercent, requireAllModules,
 *                   requireAssessmentPass, requireFeedback, certificateMode, cpdHours, cpdPoints }
 *   sessions      [{ status, startsAt, endsAt, attendanceCount }]
 *   modules       [{ status }]
 *   materials     number
 *   assessments   [{ isPublished, isRequiredForCompletion }]
 *   feedbackForm  boolean (own form or the institution default)
 *   facilitators  number
 *   stats         workspaceStats()
 *   needsGrading  number
 *   undecided     number (still REGISTERED after the training ended, with rules)
 * @returns {{ phase, items: [{ key, label, done, detail, tab, optional? }], done, total, percent, next }}
 */
export function setupChecklist(facts, now = new Date()) {
  const t = facts.training || {};
  const phase = trainingPhase(t, now);
  const scheduled = (facts.sessions || []).filter((s) => s.status === 'SCHEDULED');
  const activeModules = (facts.modules || []).filter((m) => m.status !== 'INACTIVE');
  const hasRules = Boolean(t.minAttendancePercent) || t.requireAllModules || t.requireAssessmentPass || t.requireFeedback;
  const required = (facts.assessments || []).filter((a) => a.isRequiredForCompletion);
  const stats = facts.stats || {};
  const items = [];
  const add = (item) => items.push(item);

  add({ key: 'description', label: 'Describe the training', done: Boolean(t.description && t.description.trim().length >= 40), detail: t.description ? 'Add a little more so staff know what it covers' : 'Staff see this before enrolling', tab: 'details' });
  add({ key: 'sessions', label: 'Schedule the sessions', done: scheduled.length > 0, detail: scheduled.length ? `${scheduled.length} scheduled` : 'Dates, times and venue for each session', tab: 'schedule' });
  add({ key: 'modules', label: 'Build the curriculum', done: activeModules.length > 0, detail: activeModules.length ? `${activeModules.length} modules, ${facts.materials || 0} materials` : 'Modules and learning materials', tab: 'curriculum' });
  add({ key: 'facilitators', label: 'Add facilitators', done: (facts.facilitators || 0) > 0, detail: facts.facilitators ? `${facts.facilitators} assigned` : 'Who runs the sessions and takes attendance', tab: 'schedule', optional: true });
  add({ key: 'rules', label: 'Set completion rules', done: hasRules, detail: hasRules ? 'Rules decide completion automatically' : 'Without rules you decide completion by hand', tab: 'completion' });
  if (t.requireAssessmentPass || required.length) {
    const live = required.filter((a) => a.isPublished).length;
    add({ key: 'assessment', label: 'Publish the required assessment', done: required.length > 0 && live === required.length, detail: required.length ? `${live} of ${required.length} published` : 'The rules need a passed assessment but none is set up', tab: 'assessments' });
  }
  add({ key: 'feedback', label: 'Feedback form', done: Boolean(facts.feedbackForm), detail: facts.feedbackForm ? 'Participants are asked after it ends' : 'Set one up here or an institution default', tab: 'feedback', optional: !t.requireFeedback });
  add({ key: 'publish', label: 'Publish', done: t.status !== 'DRAFT', detail: t.status === 'DRAFT' ? 'Staff cannot see or enrol yet' : 'Visible to staff', tab: 'publish' });

  if (phase !== 'draft' && phase !== 'cancelled') {
    add({ key: 'enrolment', label: 'Get participants', done: (stats.seated || 0) > 0 && !(stats.pending > 0), detail: stats.pending ? `${stats.pending} waiting for approval` : stats.seated ? `${stats.seated} of ${stats.capacity} places taken` : 'Nobody enrolled yet: assign people or share it', tab: 'registrations' });
  }
  if (phase === 'running' || phase === 'ended') {
    const held = (facts.sessions || []).filter((s) => s.status === 'SCHEDULED' && new Date(s.endsAt) < now);
    const unmarked = held.filter((s) => !s.attendanceCount).length;
    add({ key: 'attendance', label: 'Take attendance', done: unmarked === 0, detail: unmarked ? `${unmarked} held session(s) with no attendance` : held.length ? 'Recorded for every held session' : 'No session held yet', tab: 'attendance' });
  }
  if (facts.needsGrading) {
    add({ key: 'grading', label: 'Grade submitted answers', done: false, detail: `${facts.needsGrading} attempt(s) need grading`, tab: 'assessments' });
  }
  if (phase === 'ended') {
    add({ key: 'completion', label: 'Decide completion', done: !facts.undecided, detail: facts.undecided ? `${facts.undecided} not decided yet` : 'Decided for everyone', tab: 'completion' });
    add({ key: 'certificates', label: 'Issue certificates', done: !stats.certificatesDue, detail: stats.certificatesDue ? `${stats.certificatesDue} completed without a certificate` : `${stats.certificates || 0} issued`, tab: 'certificates' });
  }

  const counted = items.filter((i) => !i.optional || i.done);
  const done = counted.filter((i) => i.done).length;
  return {
    phase,
    items,
    done,
    total: counted.length,
    percent: counted.length ? Math.round((done / counted.length) * 100) : 100,
    next: items.find((i) => !i.done && !i.optional) || null,
  };
}

/** Group a participant's history into a short timeline (newest first). */
export function participantTimeline({ registration, attempts = [], certificate = null, feedbackAt = null, audit = [] }) {
  const out = [];
  const push = (at, label, tone = 'default') => { if (at) out.push({ at: new Date(at), label, tone }); };
  push(registration.registeredAt, registration.source === 'ASSIGNED' ? 'Assigned' : 'Registered');
  push(registration.approvedAt, 'Approved');
  push(registration.cancelledAt, `Cancelled${registration.cancelReason ? `: ${registration.cancelReason}` : ''}`, 'bad');
  for (const a of attempts) push(a.submittedAt, `${a.assessmentTitle}: attempt ${a.attemptNumber}${a.passed === true ? ' passed' : a.passed === false ? ' not passed' : ' submitted'}${Number.isFinite(a.percent) ? ` (${Math.round(a.percent)}%)` : ''}`, a.passed ? 'good' : a.passed === false ? 'bad' : 'default');
  push(feedbackAt, 'Feedback submitted', 'good');
  push(registration.completedAt, registration.status === 'COMPLETED' ? 'Completed' : 'Marked not completed', registration.status === 'COMPLETED' ? 'good' : 'bad');
  if (certificate) {
    push(certificate.issuedAt, `Certificate ${certificate.certificateNumber || ''} issued`.replace('  ', ' '), 'good');
    push(certificate.revokedAt, 'Certificate revoked', 'bad');
  }
  for (const a of audit) push(a.createdAt, `${a.label}${a.actor ? ` by ${a.actor}` : ''}${a.reason ? `: ${a.reason}` : ''}`);
  // Audit entries repeat some of the events above at the same minute: keep the first.
  const seen = new Set();
  return out
    .sort((a, b) => b.at - a.at)
    .filter((e) => {
      const key = `${e.at.toISOString().slice(0, 16)}|${e.label.split(' ')[0]}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
