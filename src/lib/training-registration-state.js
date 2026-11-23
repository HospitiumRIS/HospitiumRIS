/**
 * Training registration state machine and registration-window rules (#90).
 * Pure: no database access.
 */

export const REGISTRATION_STATUSES = ['PENDING_APPROVAL', 'WAITLISTED', 'REGISTERED', 'COMPLETED', 'NOT_COMPLETED', 'REJECTED', 'CANCELLED'];
export const MODULE_PROGRESS_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];

/** Allowed admin transitions: from -> [to]. */
const ADMIN_TRANSITIONS = {
  PENDING_APPROVAL: ['REGISTERED', 'REJECTED', 'CANCELLED'], // approve / reject (#102)
  WAITLISTED: ['REGISTERED', 'PENDING_APPROVAL', 'CANCELLED'], // promote (capacity checked)
  REGISTERED: ['COMPLETED', 'NOT_COMPLETED', 'CANCELLED'],
  COMPLETED: ['REGISTERED', 'NOT_COMPLETED'], // reopen, e.g. completion marked by mistake
  NOT_COMPLETED: ['COMPLETED', 'REGISTERED'], // #96
  REJECTED: ['REGISTERED', 'PENDING_APPROVAL'], // reconsider (capacity checked)
  CANCELLED: ['REGISTERED'], // reinstate (capacity is checked by the caller)
};

/** Allowed participant (self-service) transitions. */
const SELF_TRANSITIONS = {
  REGISTERED: ['CANCELLED'],
  PENDING_APPROVAL: ['CANCELLED'],
  WAITLISTED: ['CANCELLED'],
  CANCELLED: ['REGISTERED', 'PENDING_APPROVAL', 'WAITLISTED'], // re-apply through the register flow
};

export function isValidRegistrationStatus(status) {
  return REGISTRATION_STATUSES.includes(status);
}

export function isValidModuleProgressStatus(status) {
  return MODULE_PROGRESS_STATUSES.includes(status);
}

/**
 * Check a status change.
 * @returns {{ ok: true, noop?: boolean } | { ok: false, error: string }}
 */
export function checkRegistrationTransition(from, to, { actor = 'admin' } = {}) {
  if (!isValidRegistrationStatus(to)) {
    return { ok: false, error: `Invalid status "${to}". Allowed: ${REGISTRATION_STATUSES.join(', ')}` };
  }
  if (from === to) return { ok: true, noop: true };
  const table = actor === 'self' ? SELF_TRANSITIONS : ADMIN_TRANSITIONS;
  if (!(table[from] || []).includes(to)) {
    return { ok: false, error: `Cannot change a registration from ${from} to ${to}` };
  }
  return { ok: true };
}

/** Transitions that take up a seat (need a capacity check). */
const SEAT_HOLDERS = ['PENDING_APPROVAL', 'REGISTERED', 'COMPLETED', 'NOT_COMPLETED'];
export function transitionTakesSeat(from, to) {
  return !SEAT_HOLDERS.includes(from) && SEAT_HOLDERS.includes(to);
}

/** Does this change free a place (so the waiting list can move up)? (#102) */
export function transitionFreesSeat(from, to) {
  return SEAT_HOLDERS.includes(from) && !SEAT_HOLDERS.includes(to);
}

/**
 * Is registration open for this training right now?
 * Closes at `registrationClosesAt` when set, otherwise when the training starts.
 * Opens at `registrationOpensAt` when set.
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function checkRegistrationWindow(training, now = new Date()) {
  if (!training) return { ok: false, error: 'Training not found' };
  const opensAt = training.registrationOpensAt ? new Date(training.registrationOpensAt) : null;
  // Closes at registrationClosesAt, and never later than the start.
  const candidates = [training.registrationClosesAt, training.startDate].filter(Boolean).map((d) => new Date(d));
  const closesAt = candidates.length ? new Date(Math.min(...candidates.map((d) => d.getTime()))) : null;

  if (opensAt && now < opensAt) {
    return { ok: false, error: 'Registration has not opened yet' };
  }
  if (closesAt && now >= closesAt) {
    return { ok: false, error: 'Registration is closed for this training' };
  }
  return { ok: true };
}

/** Is there a free seat? `activeCount` excludes the registration being changed. */
export function hasCapacity(training, activeCount) {
  const max = Number(training?.maxParticipants);
  if (!Number.isFinite(max) || max < 1) return false;
  return activeCount < max;
}

/** Statuses an admin may pick next (including the current one), for UI menus. */
export function allowedAdminStatuses(from) {
  return [from, ...(ADMIN_TRANSITIONS[from] || [])];
}
