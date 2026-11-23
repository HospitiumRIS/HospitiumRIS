/**
 * Enrolment controls (#102). Pure: no database access.
 *
 * Seats: REGISTERED, COMPLETED, NOT_COMPLETED and PENDING_APPROVAL hold a place, so
 * approving a request can never overbook. WAITLISTED, REJECTED and CANCELLED don't.
 * Approval is by the training admin only (decision D2).
 */

export const SEAT_STATUSES = ['PENDING_APPROVAL', 'REGISTERED', 'COMPLETED', 'NOT_COMPLETED'];
export const ELIGIBILITY_MODES = ['OPEN', 'DEPARTMENT_ONLY'];
export const ELIGIBILITY_LABELS = {
  OPEN: 'Anyone who can see the training',
  DEPARTMENT_ONLY: "Only staff in the training's departments",
};

const norm = (s) => String(s || '').trim().toLowerCase();

export function trainingDepartments(training) {
  return String(training?.department || '').split(',').map(norm).filter(Boolean);
}

/**
 * Can this person register? Visibility (#88) is checked separately.
 * @param {object} training  eligibilityMode, department, prerequisiteTrainingIds
 * @param {object} user      { department }
 * @param {{ completedTrainingIds?: string[], prerequisiteTitles?: Record<string,string> }} [facts]
 * @returns {{ ok: boolean, reasons: string[] }}
 */
export function checkEligibility(training, user, facts = {}) {
  const reasons = [];
  if (training?.eligibilityMode === 'DEPARTMENT_ONLY') {
    const departments = trainingDepartments(training);
    if (departments.length && !departments.includes(norm(user?.department))) {
      reasons.push(user?.department
        ? `Open to ${training.department} only (your profile says ${user.department})`
        : `Open to ${training.department} only; add your department to your profile`);
    }
  }
  const done = new Set(facts.completedTrainingIds || []);
  const missing = (training?.prerequisiteTrainingIds || []).filter((id) => !done.has(id));
  if (missing.length) {
    const titles = missing.map((id) => facts.prerequisiteTitles?.[id] || 'a required training');
    reasons.push(`Complete first: ${titles.join(', ')}`);
  }
  return { ok: reasons.length === 0, reasons };
}

/**
 * The status a new registration gets.
 * @returns {{ status: 'REGISTERED'|'PENDING_APPROVAL'|'WAITLISTED' } | { error: string }}
 */
export function decideRegistration(training, seatCount) {
  const max = Number(training?.maxParticipants) || 0;
  if (seatCount >= max) {
    return training?.waitlistEnabled ? { status: 'WAITLISTED' } : { error: 'Training is full' };
  }
  return { status: training?.requiresApproval ? 'PENDING_APPROVAL' : 'REGISTERED' };
}

/** Status for someone promoted off the waitlist. */
export function promotionTarget(training) {
  return training?.requiresApproval ? 'PENDING_APPROVAL' : 'REGISTERED';
}

/**
 * Can the participant cancel their own registration now?
 * Confirmed places: until the cancellation deadline (default: the start).
 * Waiting list / pending requests: until the start.
 */
export function checkSelfCancel(training, registration, now = new Date()) {
  if (!registration) return { ok: false, error: 'Registration not found' };
  if (!['REGISTERED', 'PENDING_APPROVAL', 'WAITLISTED'].includes(registration.status)) {
    return { ok: false, error: 'This registration cannot be cancelled' };
  }
  if (registration.source === 'ASSIGNED') {
    return { ok: false, error: 'This training was assigned to you. Contact the training team to change it.' };
  }
  const start = training?.startDate ? new Date(training.startDate) : null;
  if (start && now >= start) return { ok: false, error: 'Cannot cancel registration - training has already started' };
  if (registration.status === 'REGISTERED' && training?.cancellationDeadline && now > new Date(training.cancellationDeadline)) {
    return { ok: false, error: 'The cancellation deadline has passed. Contact the training team.' };
  }
  return { ok: true };
}

/** Waitlist positions (1 = next) by registration time. */
export function waitlistPositions(registrations) {
  const waiting = (registrations || [])
    .filter((r) => r.status === 'WAITLISTED')
    .sort((a, b) => new Date(a.registeredAt) - new Date(b.registeredAt) || String(a.id).localeCompare(String(b.id)));
  return new Map(waiting.map((r, i) => [r.id, i + 1]));
}

/**
 * Who moves up when places free up: the first `free` people on the waiting list.
 */
export function pickPromotions(registrations, maxParticipants) {
  const seats = (registrations || []).filter((r) => SEAT_STATUSES.includes(r.status)).length;
  const free = Math.max(0, (Number(maxParticipants) || 0) - seats);
  if (!free) return [];
  const positions = waitlistPositions(registrations);
  return [...positions.entries()].sort((a, b) => a[1] - b[1]).slice(0, free).map(([id]) => id);
}

function toDate(v) {
  if (v === null || v === '' || v === undefined) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Validate enrolment settings in a training update. */
export function validateEnrolmentSettings(body, existing = {}) {
  const b = body || {};
  const data = {};
  for (const key of ['registrationOpensAt', 'registrationClosesAt', 'cancellationDeadline']) {
    if (b[key] === undefined) continue;
    const d = toDate(b[key]);
    if (d === undefined) return { ok: false, error: `${key} is not a valid date` };
    data[key] = d;
  }
  const opens = data.registrationOpensAt !== undefined ? data.registrationOpensAt : existing.registrationOpensAt;
  const closes = data.registrationClosesAt !== undefined ? data.registrationClosesAt : existing.registrationClosesAt;
  if (opens && closes && new Date(closes) <= new Date(opens)) {
    return { ok: false, error: 'Registration must close after it opens' };
  }
  for (const key of ['requiresApproval', 'waitlistEnabled', 'isMandatory']) {
    if (b[key] !== undefined) data[key] = b[key] === true;
  }
  if (b.eligibilityMode !== undefined) {
    if (!ELIGIBILITY_MODES.includes(b.eligibilityMode)) return { ok: false, error: 'Unknown eligibility mode' };
    data.eligibilityMode = b.eligibilityMode;
  }
  if (b.prerequisiteTrainingIds !== undefined) {
    if (!Array.isArray(b.prerequisiteTrainingIds) || b.prerequisiteTrainingIds.length > 10) {
      return { ok: false, error: 'Up to 10 prerequisite trainings' };
    }
    const ids = [...new Set(b.prerequisiteTrainingIds.filter((x) => typeof x === 'string' && x))];
    if (existing.id && ids.includes(existing.id)) return { ok: false, error: 'A training cannot be its own prerequisite' };
    data.prerequisiteTrainingIds = ids;
  }
  return { ok: true, data };
}
