/**
 * Training automation (#110): what the hourly job should do now. Pure planning with
 * stable dedupe keys, so running it twice (or late) never sends the same thing twice.
 *
 * Session reminders
 *   24h   session starts within 24 hours, but more than 75 minutes away
 *   1h    session starts within 75 minutes (and hasn't started)
 *   check-in open  inside the check-in window (in-person / hybrid only)
 * Training status
 *   PUBLISHED trainings whose end date has passed become COMPLETED
 */

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const ONE_HOUR_WINDOW = 75 * MIN;

/**
 * Reminders due now for scheduled sessions of live trainings.
 * @param {{ id, trainingId, status, startsAt, endsAt, deliveryMode, checkInOpensMinutesBefore, checkInClosesMinutesAfter, training: { status, deliveryMode } }[]} sessions
 * @returns {{ kind, sessionId, trainingId, dedupeKey, extra }[]}
 */
export function sessionNotices(sessions, now = new Date()) {
  const out = [];
  const t = now.getTime();
  for (const s of sessions || []) {
    if (s.status !== 'SCHEDULED') continue;
    if (s.training && s.training.status !== 'PUBLISHED') continue;
    const start = new Date(s.startsAt).getTime();
    const until = start - t;
    if (until > 0 && until <= 24 * HOUR && until > ONE_HOUR_WINDOW) {
      out.push({ kind: 'SESSION_REMINDER', sessionId: s.id, trainingId: s.trainingId, dedupeKey: `reminder-24h:${s.id}`, extra: { reminder: '24h' } });
    }
    if (until > 0 && until <= ONE_HOUR_WINDOW) {
      out.push({ kind: 'SESSION_REMINDER', sessionId: s.id, trainingId: s.trainingId, dedupeKey: `reminder-1h:${s.id}`, extra: { reminder: '1h' } });
    }
    const mode = s.deliveryMode || s.training?.deliveryMode || 'IN_PERSON';
    const opens = start - (s.checkInOpensMinutesBefore ?? 15) * MIN;
    const closes = start + (s.checkInClosesMinutesAfter ?? 30) * MIN;
    if (mode !== 'ONLINE' && t >= opens && t <= closes) {
      out.push({ kind: 'CHECKIN_OPEN', sessionId: s.id, trainingId: s.trainingId, dedupeKey: `checkin-open:${s.id}`, extra: {} });
    }
  }
  return out;
}

/** Published trainings whose end date has passed. */
export function trainingsToClose(trainings, now = new Date()) {
  return (trainings || []).filter((tr) => tr.status === 'PUBLISHED' && tr.endDate && new Date(tr.endDate).getTime() < now.getTime());
}

/**
 * Run a plan through a "send once" function and count. The function returns
 * { sent: true } or { skipped }, so re-runs report 0 sent.
 */
export async function deliverOnce(items, recipientsOf, sendOnce) {
  let sent = 0;
  let skipped = 0;
  for (const item of items) {
    for (const userId of await recipientsOf(item)) {
      const r = await sendOnce({ ...item, userId });
      if (r?.sent) sent += 1;
      else skipped += 1;
    }
  }
  return { sent, skipped };
}

export const AUDIT_ACTION_LABELS = {
  REGISTERED: 'Registered',
  REGISTRATION_CANCELLED: 'Registration cancelled',
  REGISTRATION_STATUS_CHANGED: 'Registration status changed',
  WAITLIST_PROMOTED: 'Moved up from the waiting list',
  TRAINING_ASSIGNED: 'Training assigned',
  DUE_DATE_CHANGED: 'Due date changed',
  MODULE_PROGRESS_UPDATED: 'Module progress updated',
  ATTENDANCE_MARKED: 'Attendance marked',
  ATTENDANCE_IMPORTED: 'Attendance imported',
  CHECKED_IN: 'Checked in',
  COMPLETION_FINALISED: 'Completion decided',
  COMPLETION_OVERRIDDEN: 'Completion overridden',
  CERTIFICATE_ISSUED: 'Certificate issued',
  CERTIFICATE_REVOKED: 'Certificate revoked',
  CERTIFICATE_UPLOADED: 'Certificate uploaded',
  FACILITATOR_ADDED: 'Facilitator added',
  FACILITATOR_UPDATED: 'Facilitator changed',
  FACILITATOR_REMOVED: 'Facilitator removed',
  ASSESSMENT_CREATED: 'Assessment created',
  ASSESSMENT_UPDATED: 'Assessment changed',
  ASSESSMENT_DELETED: 'Assessment deleted',
  ASSESSMENT_SUBMITTED: 'Assessment submitted',
  ASSESSMENT_GRADED: 'Assessment graded',
  FEEDBACK_FORM_SAVED: 'Feedback form saved',
  FEEDBACK_FORM_REMOVED: 'Feedback form removed',
  FEEDBACK_SUBMITTED: 'Feedback sent',
  TRAINING_STATUS_AUTO: 'Status changed automatically',
};

/** A readable label for an audit action (unknown ones are prettified). */
export function auditActionLabel(action) {
  if (AUDIT_ACTION_LABELS[action]) return AUDIT_ACTION_LABELS[action];
  const s = String(action || '').toLowerCase().replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** What changed between before and after (top-level keys). */
export function auditChanges(before, after) {
  const b = before && typeof before === 'object' ? before : {};
  const a = after && typeof after === 'object' ? after : {};
  const keys = [...new Set([...Object.keys(b), ...Object.keys(a)])];
  const show = (v) => (v === undefined ? '—' : v === null ? 'none' : typeof v === 'object' ? JSON.stringify(v) : String(v));
  return keys
    .filter((k) => JSON.stringify(b[k]) !== JSON.stringify(a[k]))
    .map((k) => ({ field: k, from: show(b[k]), to: show(a[k]) }));
}
