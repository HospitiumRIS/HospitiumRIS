/**
 * Completion engine (#96). Pure: no database access.
 *
 * A training can switch on any of these rules:
 *   minAttendancePercent  attendance % (lib/training-attendance.js) must reach this
 *   requireAllModules     every required, active module completed
 *   requireAssessmentPass every assessment marked required passed (#105)
 *   requireFeedback       the feedback form submitted (#106)
 *
 * With no rules switched on, completion stays manual (today's behaviour).
 *
 * Outcome while the training runs: eligible / on track / not yet. A registration is
 * only finalised after the training has ended:
 *   ended + eligible                      -> COMPLETED
 *   ended + grace period over + not met   -> NOT_COMPLETED
 * An admin override (force complete / incomplete) always wins.
 */

export const MODULE_COMPLETION_MODES = ['ADMIN', 'SELF', 'ON_SESSION_ATTENDANCE', 'ON_ASSESSMENT_PASS'];

export const MODULE_COMPLETION_LABELS = {
  ADMIN: 'Marked by an admin',
  SELF: 'Participant marks it done',
  ON_SESSION_ATTENDANCE: 'Attending its linked sessions',
  ON_ASSESSMENT_PASS: 'Passing its assessment',
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function hasCompletionRules(training) {
  return Boolean(
    (training?.minAttendancePercent !== null && training?.minAttendancePercent !== undefined && training.minAttendancePercent > 0)
    || training?.requireAllModules
    || training?.requireAssessmentPass
    || training?.requireFeedback
  );
}

/**
 * @param {object} training   rule fields + endDate + completionGraceDays
 * @param {object} facts
 *   attendancePercent  number|null   (null: no session held yet)
 *   modules            [{ id, title, isRequired, status }]   training modules
 *   progress           Map|object moduleId -> status
 *   assessments        { required: number, passed: number }  (optional)
 *   feedbackSubmitted  boolean (optional)
 *   feedbackAvailable  boolean (optional) whether a feedback form exists (default false)
 * @returns {{ hasRules, eligible, checks: [{ rule, label, met, detail }] }}
 */
export function evaluateCompletion(training, facts = {}) {
  const checks = [];

  const min = Number(training?.minAttendancePercent);
  if (Number.isFinite(min) && min > 0) {
    const pct = facts.attendancePercent;
    checks.push({
      rule: 'attendance',
      label: `Attend at least ${min}% of sessions`,
      met: pct !== null && pct !== undefined && pct >= min,
      detail: pct === null || pct === undefined ? 'No session held yet' : `${pct}% so far`,
    });
  }

  if (training?.requireAllModules) {
    const progress = facts.progress instanceof Map ? facts.progress : new Map(Object.entries(facts.progress || {}));
    const required = (facts.modules || []).filter((m) => m.status !== 'INACTIVE' && m.isRequired !== false);
    const done = required.filter((m) => progress.get(m.id) === 'COMPLETED');
    checks.push({
      rule: 'modules',
      label: 'Complete all required modules',
      met: done.length === required.length,
      detail: `${done.length} of ${required.length} completed`,
      missing: required.filter((m) => progress.get(m.id) !== 'COMPLETED').map((m) => m.title),
    });
  }

  if (training?.requireAssessmentPass) {
    const required = facts.assessments?.required ?? 0;
    const passed = facts.assessments?.passed ?? 0;
    checks.push({
      rule: 'assessment',
      label: 'Pass the required assessment',
      met: required === 0 || passed >= required,
      detail: required === 0 ? 'No required assessment set up' : `${passed} of ${required} passed`,
    });
  }

  if (training?.requireFeedback) {
    const available = facts.feedbackAvailable === true; // no form, nothing to submit (#106)
    checks.push({
      rule: 'feedback',
      label: 'Submit the feedback form',
      met: !available || Boolean(facts.feedbackSubmitted),
      detail: !available ? 'No feedback form set up' : facts.feedbackSubmitted ? 'Submitted' : 'Not submitted yet',
    });
  }

  const hasRules = checks.length > 0;
  return { hasRules, eligible: hasRules && checks.every((c) => c.met), checks };
}

/**
 * What the registration's status should become, given an evaluation.
 * @returns {'COMPLETED'|'NOT_COMPLETED'|null} null = leave it as it is
 */
export function decideCompletionStatus(training, registration, evaluation, now = new Date()) {
  if (!evaluation?.hasRules) return null;
  if (registration?.completionOverride) return null;
  if (!['REGISTERED', 'COMPLETED', 'NOT_COMPLETED'].includes(registration?.status)) return null;

  const end = training?.endDate ? new Date(training.endDate) : null;
  if (!end || now < end) return null; // only finalise after the training has ended

  if (evaluation.eligible) return registration.status === 'COMPLETED' ? null : 'COMPLETED';

  const grace = Number.isFinite(Number(training.completionGraceDays)) ? Number(training.completionGraceDays) : 7;
  const graceOver = now >= new Date(end.getTime() + grace * DAY_MS);
  if (registration.status === 'COMPLETED') return graceOver ? null : 'REGISTERED'; // e.g. attendance corrected
  if (graceOver && registration.status === 'REGISTERED') return 'NOT_COMPLETED';
  return null;
}

/**
 * Modules completed automatically by attendance: an ON_SESSION_ATTENDANCE module is done
 * once every held, scheduled session linked to it was attended (Present or Late), and at
 * least one linked session was held.
 * @returns {string[]} module ids to mark COMPLETED
 */
export function modulesCompletedByAttendance(modules, sessions, attendance, now = new Date()) {
  const attended = new Set((attendance || []).filter((a) => a.status === 'PRESENT' || a.status === 'LATE').map((a) => a.sessionId));
  const out = [];
  for (const mod of modules || []) {
    if (mod.completionMode !== 'ON_SESSION_ATTENDANCE') continue;
    const linked = (sessions || []).filter((s) => s.moduleId === mod.id && s.status === 'SCHEDULED' && new Date(s.startsAt) <= now);
    if (linked.length && linked.every((s) => attended.has(s.id))) out.push(mod.id);
  }
  return out;
}

/** Validate the rule fields of a training update. */
export function validateCompletionRules(body) {
  const data = {};
  const errors = [];
  if (body.minAttendancePercent !== undefined) {
    if (body.minAttendancePercent === null || body.minAttendancePercent === '') data.minAttendancePercent = null;
    else {
      const n = Number(body.minAttendancePercent);
      if (!Number.isInteger(n) || n < 1 || n > 100) errors.push('Minimum attendance must be a whole number from 1 to 100');
      else data.minAttendancePercent = n;
    }
  }
  for (const key of ['requireAllModules', 'requireAssessmentPass', 'requireFeedback']) {
    if (body[key] !== undefined) data[key] = body[key] === true;
  }
  if (body.completionGraceDays !== undefined) {
    const n = Number(body.completionGraceDays);
    if (!Number.isInteger(n) || n < 0 || n > 90) errors.push('Grace period must be 0 to 90 days');
    else data.completionGraceDays = n;
  }
  return errors.length ? { ok: false, error: errors[0] } : { ok: true, data };
}
