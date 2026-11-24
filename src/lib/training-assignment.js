/**
 * Assigned / mandatory trainings (#103): who an assignment reaches, what happens to
 * each person's registration, due-date and certificate-expiry states, reminders and
 * compliance totals. Pure: no database access.
 */

export const REGISTRATION_SOURCES = ['SELF', 'ASSIGNED', 'IMPORT'];
export const DUE_SOON_DAYS = 7;
export const EXPIRING_SOON_DAYS = 30;
const DAY = 24 * 60 * 60 * 1000;

export const COMPLIANCE_STATES = ['OVERDUE', 'DUE_SOON', 'ON_TRACK', 'IN_PROGRESS', 'RETRAINING_DUE', 'EXPIRING', 'COMPLETED', 'EXEMPT', 'WITHDRAWN'];
export const COMPLIANCE_LABELS = {
  OVERDUE: 'Overdue',
  DUE_SOON: 'Due soon',
  ON_TRACK: 'On track',
  IN_PROGRESS: 'In progress',
  RETRAINING_DUE: 'Re-training due',
  EXPIRING: 'Certificate expiring',
  COMPLETED: 'Completed',
  EXEMPT: 'Exempt',
  WITHDRAWN: 'Withdrawn',
};

const norm = (value) => String(value || '').trim().toLowerCase();

function toDate(value) {
  if (value === null || value === undefined || value === '') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/**
 * Validate POST /assign input.
 * @returns {{ ok: true, data: { userIds, departments, allMembers, dueDate, allowOverCapacity, note } } | { ok: false, error }}
 */
export function validateAssignment(body, now = new Date()) {
  const b = body || {};
  const userIds = Array.isArray(b.userIds) ? [...new Set(b.userIds.filter((x) => typeof x === 'string' && x))] : [];
  const departments = Array.isArray(b.departments)
    ? [...new Set(b.departments.map((d) => String(d || '').trim()).filter(Boolean))]
    : [];
  const allMembers = b.allMembers === true;
  if (!userIds.length && !departments.length && !allMembers) {
    return { ok: false, error: 'Choose people, a department or everyone in the institution' };
  }
  if (userIds.length > 1000) return { ok: false, error: 'Up to 1000 people at a time' };
  const dueDate = toDate(b.dueDate);
  if (dueDate === undefined) return { ok: false, error: 'Due date is not a valid date' };
  if (dueDate && dueDate.getTime() < now.getTime() - DAY) return { ok: false, error: 'Due date is in the past' };
  const note = typeof b.note === 'string' && b.note.trim() ? b.note.trim().slice(0, 500) : null;
  return { ok: true, data: { userIds, departments, allMembers, dueDate, allowOverCapacity: b.allowOverCapacity === true, note } };
}

/**
 * Pick the assignees among the institution's members. Ids that are not members are
 * reported, never assigned (an assignment never leaves the own institution).
 * @param {{ id, department? }[]} members
 * @returns {{ assignees: object[], outOfScope: string[] }}
 */
export function matchAssignees(members, { userIds = [], departments = [], allMembers = false } = {}) {
  const byId = new Map((members || []).map((m) => [m.id, m]));
  const wantedDepts = new Set(departments.map(norm));
  const chosen = new Map();
  for (const m of members || []) {
    if (allMembers || (wantedDepts.size && wantedDepts.has(norm(m.department)))) chosen.set(m.id, m);
  }
  const outOfScope = [];
  for (const id of userIds) {
    if (byId.has(id)) chosen.set(id, byId.get(id));
    else outOfScope.push(id);
  }
  return { assignees: [...chosen.values()], outOfScope };
}

/**
 * What an assignment does to one person's existing registration.
 * @returns {'create'|'reinstate'|'confirm'|'update'|'skip-completed'}
 *   create     no registration yet
 *   reinstate  CANCELLED / REJECTED: back to a place
 *   confirm    PENDING_APPROVAL / WAITLISTED: the assignment gives them the place
 *   update     already holding a place: mark as assigned and set the due date
 *   skip-completed  already completed this training
 */
export function assignmentAction(existing) {
  if (!existing) return 'create';
  switch (existing.status) {
    case 'CANCELLED':
    case 'REJECTED':
      return 'reinstate';
    case 'PENDING_APPROVAL':
    case 'WAITLISTED':
      return 'confirm';
    case 'COMPLETED':
      return 'skip-completed';
    default:
      return 'update';
  }
}

/** Does this action need a free place? */
export function actionTakesSeat(action) {
  return action === 'create' || action === 'reinstate' || action === 'confirm';
}

/**
 * Compliance state of one registration (#103): due dates for people still to finish,
 * certificate expiry for people who finished (recurring compliance).
 * @param {{ status, dueDate?, certificate?: { status?, expiresAt? } }} registration
 * @returns {{ state: string, daysLeft: number|null }}
 */
export function complianceState(registration, now = new Date()) {
  const r = registration || {};
  if (r.exempt) return { state: 'EXEMPT', daysLeft: null }; // exempted by an admin (compliance v2)
  if (r.status === 'CANCELLED' || r.status === 'REJECTED') return { state: 'WITHDRAWN', daysLeft: null };
  if (r.status === 'COMPLETED') {
    const cert = r.certificate;
    const expires = cert && cert.status !== 'REVOKED' && cert.expiresAt ? new Date(cert.expiresAt) : null;
    if (expires) {
      const daysLeft = Math.ceil((expires.getTime() - now.getTime()) / DAY);
      if (daysLeft <= 0) return { state: 'RETRAINING_DUE', daysLeft };
      if (daysLeft <= EXPIRING_SOON_DAYS) return { state: 'EXPIRING', daysLeft };
    }
    return { state: 'COMPLETED', daysLeft: null };
  }
  const due = r.dueDate ? new Date(r.dueDate) : null;
  if (!due) return { state: 'IN_PROGRESS', daysLeft: null };
  const daysLeft = Math.ceil((due.getTime() - now.getTime()) / DAY);
  if (now.getTime() > due.getTime()) return { state: 'OVERDUE', daysLeft };
  if (daysLeft <= DUE_SOON_DAYS) return { state: 'DUE_SOON', daysLeft };
  return { state: 'ON_TRACK', daysLeft };
}

/**
 * The reminder a registration should get now, if any. Dedupe keys make repeated runs
 * safe: one "due soon", one overdue reminder per week overdue, one each for an
 * expiring and an expired certificate.
 * @returns {{ kind: string, dedupeKey: string } | null}
 */
export function reminderFor(registration, now = new Date()) {
  const r = registration || {};
  const { state, daysLeft } = complianceState(r, now);
  const dueKey = r.dueDate ? new Date(r.dueDate).toISOString().slice(0, 10) : '';
  if (r.source === 'ASSIGNED' && state === 'DUE_SOON') {
    return { kind: 'TRAINING_DUE', dedupeKey: `due:${r.id}:${dueKey}` };
  }
  if (r.source === 'ASSIGNED' && state === 'OVERDUE') {
    const week = Math.floor(-daysLeft / 7);
    return { kind: 'TRAINING_OVERDUE', dedupeKey: `overdue:${r.id}:${dueKey}:w${week}` };
  }
  if (state === 'EXPIRING' && r.certificate?.id) {
    return { kind: 'CERTIFICATE_EXPIRING', dedupeKey: `cert-expiring:${r.certificate.id}` };
  }
  if (state === 'RETRAINING_DUE' && r.certificate?.id) {
    return { kind: 'RETRAINING_DUE', dedupeKey: `retraining:${r.certificate.id}` };
  }
  return null;
}

/** Totals for the compliance view. */
export function summarizeCompliance(registrations, now = new Date()) {
  const counts = Object.fromEntries(COMPLIANCE_STATES.map((s) => [s, 0]));
  let assigned = 0;
  for (const r of registrations || []) {
    const { state } = complianceState(r, now);
    counts[state] += 1;
    if (state !== 'WITHDRAWN' && state !== 'EXEMPT') assigned += 1;
  }
  const done = counts.COMPLETED + counts.EXPIRING;
  return {
    assigned,
    completed: done,
    overdue: counts.OVERDUE,
    dueSoon: counts.DUE_SOON,
    retrainingDue: counts.RETRAINING_DUE,
    counts,
    percentCompliant: assigned ? Math.round((done / assigned) * 100) : null,
  };
}
