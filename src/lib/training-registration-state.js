/**
 * Training registration state machine and registration-window rules (#90).
 * Pure: no database access.
 */

export const REGISTRATION_STATUSES = ['REGISTERED', 'COMPLETED', 'NOT_COMPLETED', 'CANCELLED'];
export const MODULE_PROGRESS_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];

/** Allowed admin transitions: from -> [to]. */
const ADMIN_TRANSITIONS = {
  REGISTERED: ['COMPLETED', 'NOT_COMPLETED', 'CANCELLED'],
  COMPLETED: ['REGISTERED', 'NOT_COMPLETED'], // reopen, e.g. completion marked by mistake
  NOT_COMPLETED: ['COMPLETED', 'REGISTERED'], // #96
  CANCELLED: ['REGISTERED'], // reinstate (capacity is checked by the caller)
};

/** Allowed participant (self-service) transitions. */
const SELF_TRANSITIONS = {
  REGISTERED: ['CANCELLED'],
  CANCELLED: ['REGISTERED'],
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
export function transitionTakesSeat(from, to) {
  return from === 'CANCELLED' && (to === 'REGISTERED' || to === 'COMPLETED');
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
  const closesAt = training.registrationClosesAt
    ? new Date(training.registrationClosesAt)
    : training.startDate ? new Date(training.startDate) : null;

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
