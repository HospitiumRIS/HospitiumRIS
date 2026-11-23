/**
 * Learning hub (#107): the participant's to-do list, upcoming sessions, CPD for the
 * year and catalogue filtering. Pure: callers pass already-loaded data.
 */

import { canStartAttempt } from './training-assessment.js';
import { complianceState } from './training-assignment.js';
import { feedbackUnlocked } from './training-feedback.js';

const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;
const SEAT = ['REGISTERED', 'COMPLETED', 'NOT_COMPLETED'];

/** Is check-in open for this session right now (same window as the server)? */
export function checkInWindowOpen(session, now = new Date()) {
  if (!session || session.status !== 'SCHEDULED') return false;
  const start = new Date(session.startsAt).getTime();
  const t = now.getTime();
  return t >= start - (session.checkInOpensMinutesBefore ?? 15) * MIN && t <= start + (session.checkInClosesMinutesAfter ?? 30) * MIN;
}

/** Can an online session be joined right now? */
export function joinWindowOpen(session, now = new Date()) {
  if (!session || session.status !== 'SCHEDULED') return false;
  const t = now.getTime();
  return t >= new Date(session.startsAt).getTime() - (session.checkInOpensMinutesBefore ?? 15) * MIN && t <= new Date(session.endsAt).getTime();
}

/**
 * Next sessions across the participant's trainings (not yet ended), soonest first.
 * @param {{ training, sessions, attendance }[]} items  one per active registration
 */
export function upcomingSessions(items, now = new Date(), limit = 5) {
  const out = [];
  for (const item of items || []) {
    const marked = new Map((item.attendance || []).map((a) => [a.sessionId, a.status]));
    for (const s of item.sessions || []) {
      if (s.status !== 'SCHEDULED' || new Date(s.endsAt).getTime() < now.getTime()) continue;
      out.push({
        id: s.id,
        title: s.title,
        startsAt: s.startsAt,
        endsAt: s.endsAt,
        deliveryMode: s.deliveryMode,
        venue: s.venue,
        trainingId: item.training.id,
        trainingTitle: item.training.title,
        myAttendance: marked.get(s.id) || null,
        checkInOpen: checkInWindowOpen(s, now) && s.deliveryMode !== 'ONLINE' && !marked.has(s.id),
        joinOpen: joinWindowOpen(s, now) && s.deliveryMode !== 'IN_PERSON' && Boolean(s.hasOnlineLink),
      });
    }
  }
  return out.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt)).slice(0, limit);
}

const PRIORITY = { MANDATORY_OVERDUE: 0, CHECK_IN: 1, JOIN: 1, RETRAINING: 2, ASSESSMENT: 3, MANDATORY_DUE: 4, FEEDBACK: 5, WAITING: 8 };

/**
 * The participant's to-do list.
 * @param {object} input
 *   registrations  [{ id, status, source, dueDate, attendancePercent, certificate?, training: { id, title, endDate, minAttendancePercent }, hasFeedbackForm, feedbackSubmitted }]
 *   sessions       output of upcomingSessions (all, not limited)
 *   assessments    [{ ...assessment, trainingId, attempts: [] }]  published assessments of their trainings
 * @returns {{ kind, priority, title, detail, trainingId, href, due? }[]}
 */
export function buildTodos({ registrations = [], sessions = [], assessments = [] }, now = new Date()) {
  const todos = [];
  const byTraining = new Map(registrations.map((r) => [r.training.id, r]));

  for (const s of sessions) {
    if (s.checkInOpen) todos.push({ kind: 'CHECK_IN', title: `Check in: ${s.title}`, detail: s.trainingTitle, trainingId: s.trainingId, href: '/researcher/training/check-in' });
    else if (s.joinOpen) todos.push({ kind: 'JOIN', title: `Join now: ${s.title}`, detail: s.trainingTitle, trainingId: s.trainingId, href: `/api/training/sessions/${s.id}/join`, external: true });
  }

  for (const r of registrations) {
    const t = r.training;
    if (r.status === 'PENDING_APPROVAL' || r.status === 'WAITLISTED') {
      todos.push({ kind: 'WAITING', title: r.status === 'WAITLISTED' ? `On the waiting list: ${t.title}` : `Awaiting approval: ${t.title}`, detail: 'Nothing to do yet', trainingId: t.id, href: `/researcher/training/${t.id}` });
      continue;
    }
    if (!SEAT.includes(r.status)) continue;
    const { state, daysLeft } = complianceState(r, now);
    if (r.source === 'ASSIGNED' && state === 'OVERDUE') {
      todos.push({ kind: 'MANDATORY_OVERDUE', title: `Overdue: ${t.title}`, detail: `Was due ${Math.max(1, -daysLeft)} day(s) ago`, trainingId: t.id, href: `/researcher/training/${t.id}`, due: r.dueDate });
    } else if (r.source === 'ASSIGNED' && state === 'DUE_SOON') {
      todos.push({ kind: 'MANDATORY_DUE', title: `Due soon: ${t.title}`, detail: `Due in ${daysLeft} day(s)`, trainingId: t.id, href: `/researcher/training/${t.id}`, due: r.dueDate });
    } else if (state === 'RETRAINING_DUE') {
      todos.push({ kind: 'RETRAINING', title: `Re-training due: ${t.title}`, detail: 'Your certificate has expired', trainingId: t.id, href: '/researcher/training#available' });
    }
    if (r.hasFeedbackForm && !r.feedbackSubmitted && feedbackUnlocked(t, r, now).unlocked) {
      const age = t.endDate ? (now.getTime() - new Date(t.endDate).getTime()) / DAY : 0;
      if (age <= 60) todos.push({ kind: 'FEEDBACK', title: `Give feedback: ${t.title}`, detail: 'About two minutes', trainingId: t.id, href: `/researcher/training/feedback/${t.id}` });
    }
  }

  for (const a of assessments) {
    const r = byTraining.get(a.trainingId);
    if (!r || !SEAT.includes(r.status)) continue;
    const attempts = a.attempts || [];
    if (attempts.some((x) => x.passed === true) || attempts.some((x) => x.status === 'NEEDS_GRADING')) continue;
    const decision = canStartAttempt(a, attempts, now);
    if (!decision.ok) continue;
    todos.push({
      kind: 'ASSESSMENT',
      title: `${decision.resume ? 'Finish' : 'Take'}: ${a.title}`,
      detail: `${r.training.title}${a.isRequiredForCompletion ? ' · required' : ''}${a.availableUntil ? ` · closes ${new Date(a.availableUntil).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}`,
      trainingId: a.trainingId,
      href: `/researcher/training/assessment/${a.trainingId}/${a.id}`,
      due: a.availableUntil || null,
      required: Boolean(a.isRequiredForCompletion),
    });
  }

  return todos
    .map((t) => ({ ...t, priority: PRIORITY[t.kind] ?? 9 }))
    .sort((a, b) => a.priority - b.priority
      || (b.required ? 1 : 0) - (a.required ? 1 : 0)
      || (a.due ? new Date(a.due).getTime() : Infinity) - (b.due ? new Date(b.due).getTime() : Infinity));
}

/**
 * CPD earned in a calendar year: completed trainings (by completion date) with CPD hours
 * or points.
 */
export function cpdForYear(registrations, year = new Date().getFullYear()) {
  const rows = (registrations || []).filter((r) => r.status === 'COMPLETED' && r.completedAt && new Date(r.completedAt).getFullYear() === year
    && (Number(r.training?.cpdHours) > 0 || Number(r.training?.cpdPoints) > 0));
  const sum = (key) => Math.round(rows.reduce((s, r) => s + (Number(r.training[key]) || 0), 0) * 10) / 10;
  return {
    year,
    hours: sum('cpdHours'),
    points: sum('cpdPoints'),
    trainings: rows.map((r) => ({ id: r.training.id, title: r.training.title, completedAt: r.completedAt, hours: r.training.cpdHours || 0, points: r.training.cpdPoints || 0 })),
  };
}

export const DATE_FILTERS = {
  any: 'Any time',
  week: 'Starting this week',
  month: 'Starting in 30 days',
  quarter: 'Starting in 90 days',
};

/**
 * Filter the catalogue.
 * @param {object[]} trainings  catalogue entries from GET /api/training
 * @param {{ search?, department?, category?, mode?, date?, cpdOnly?, eligibleOnly?, openOnly? }} f
 */
export function filterCatalogue(trainings, f = {}, now = new Date()) {
  const q = String(f.search || '').trim().toLowerCase();
  const horizon = { week: 7, month: 30, quarter: 90 }[f.date];
  return (trainings || []).filter((t) => {
    if (q) {
      const hay = `${t.title} ${t.description || ''} ${t.department || ''} ${t.category || ''} ${t.code || ''} ${(Array.isArray(t.targetGroup) ? t.targetGroup : [t.targetGroup]).join(' ')}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.department && f.department !== 'all' && !String(t.department || '').split(',').map((d) => d.trim()).includes(f.department)) return false;
    if (f.category && f.category !== 'all' && t.category !== f.category) return false;
    if (f.mode && f.mode !== 'all' && (t.deliveryMode || 'IN_PERSON') !== f.mode) return false;
    if (horizon) {
      const start = new Date(t.startDate).getTime();
      if (!(start >= now.getTime() && start <= now.getTime() + horizon * DAY)) return false;
    }
    if (f.cpdOnly && !(Number(t.cpdHours) > 0 || Number(t.cpdPoints) > 0)) return false;
    if (f.eligibleOnly && t.eligibility && !t.eligibility.ok) return false;
    if (f.openOnly && !((t.remainingSlots ?? 0) > 0 || t.waitlistEnabled)) return false;
    return true;
  });
}
