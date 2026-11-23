/**
 * Training facilitators (#104): who runs a training or a session, what an internal
 * facilitator may do, and how facilitators are named on certificates. Pure.
 */

export const FACILITATOR_ROLES = ['LEAD', 'CO_FACILITATOR', 'GUEST'];
export const FACILITATOR_ROLE_LABELS = {
  LEAD: 'Lead facilitator',
  CO_FACILITATOR: 'Co-facilitator',
  GUEST: 'Guest speaker',
};
const ROLE_ORDER = { LEAD: 0, CO_FACILITATOR: 1, GUEST: 2 };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const clean = (v, max = 200) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

/**
 * Validate a facilitator to add. Either an internal person (userId) or an external one
 * (name, optional email and title). sessionId null = the whole training.
 * @returns {{ ok: true, data } | { ok: false, error }}
 */
export function validateFacilitator(body, { sessionIds = [] } = {}) {
  const b = body || {};
  const role = b.role || 'CO_FACILITATOR';
  if (!FACILITATOR_ROLES.includes(role)) return { ok: false, error: 'Unknown role' };
  const sessionId = b.sessionId || null;
  if (sessionId && !sessionIds.includes(sessionId)) return { ok: false, error: 'Session not found in this training' };
  const userId = clean(b.userId, 64);
  const name = clean(b.name);
  const email = clean(b.email, 254);
  if (!userId && !name) return { ok: false, error: 'Choose a staff member or enter the guest’s name' };
  if (email && !EMAIL.test(email)) return { ok: false, error: 'Email is not valid' };
  return {
    ok: true,
    data: {
      role,
      sessionId,
      userId,
      name: userId ? null : name,
      email: userId ? null : email,
      title: clean(b.title),
      showOnCertificate: b.showOnCertificate !== false,
    },
  };
}

/** Does this facilitator row cover the session? A row without a session covers them all. */
export function coversSession(facilitator, sessionId) {
  return !facilitator.sessionId || facilitator.sessionId === sessionId;
}

/** May this user run the session (register, Present view, roster)? */
export function facilitatesSession(facilitators, userId, sessionId) {
  if (!userId) return false;
  return (facilitators || []).some((f) => f.userId === userId && coversSession(f, sessionId));
}

/** The session ids of a training this user facilitates. */
export function facilitatedSessionIds(facilitators, userId, sessions) {
  const mine = (facilitators || []).filter((f) => f.userId && f.userId === userId);
  if (!mine.length) return [];
  return (sessions || []).filter((s) => mine.some((f) => coversSession(f, s.id))).map((s) => s.id);
}

/** Display name of a facilitator (internal from the user, else the external name). */
export function facilitatorName(f) {
  if (f?.user) return `${f.user.givenName || ''} ${f.user.familyName || ''}`.trim() || f.user.email || 'Facilitator';
  return f?.name || 'Facilitator';
}

/** Facilitators for a session's details: whole-training ones plus the session's own, lead first. */
export function facilitatorsForSession(facilitators, sessionId) {
  return sortFacilitators((facilitators || []).filter((f) => coversSession(f, sessionId)));
}

export function sortFacilitators(list) {
  return [...(list || [])].sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9) || facilitatorName(a).localeCompare(facilitatorName(b)));
}

/**
 * The {{facilitators}} merge field: names of facilitators marked for the certificate,
 * lead first, each person once.
 */
export function certificateFacilitatorNames(facilitators) {
  const names = [];
  for (const f of sortFacilitators((facilitators || []).filter((x) => x.showOnCertificate !== false))) {
    const n = facilitatorName(f);
    if (!names.includes(n)) names.push(n);
  }
  return names;
}

export function certificateFacilitators(facilitators) {
  return certificateFacilitatorNames(facilitators).join(', ');
}

/** Public shape (no internal ids beyond what the UI needs). */
export function shapeFacilitator(f) {
  return {
    id: f.id,
    sessionId: f.sessionId || null,
    userId: f.userId || null,
    role: f.role,
    roleLabel: FACILITATOR_ROLE_LABELS[f.role] || f.role,
    name: facilitatorName(f),
    email: f.user?.email || f.email || null,
    title: f.title || null,
    showOnCertificate: f.showOnCertificate !== false,
    internal: Boolean(f.userId),
  };
}
