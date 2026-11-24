/**
 * Manage trainings list (admin): one row per training with its phase, figures and
 * things to act on; tabs, stats, needs attention, this week's sessions, course groups
 * and export rows. Pure: no database.
 */

import { nextSession, setupChecklist, trainingPhase, workspaceStats } from './training-workspace.js';

const DAY = 24 * 60 * 60 * 1000;

export const MANAGE_TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'running', label: 'Running' },
  { key: 'draft', label: 'Drafts' },
  { key: 'ended', label: 'Ended' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'all', label: 'All' },
];

export const PHASE_CHIP = {
  draft: { label: 'Draft', bg: '#f1f5f9', color: '#475569' },
  upcoming: { label: 'Upcoming', bg: '#ede9fe', color: '#6d28d9' },
  running: { label: 'Running', bg: '#dcfce7', color: '#166534' },
  ended: { label: 'Ended', bg: '#fef3c7', color: '#92400e' },
  cancelled: { label: 'Cancelled', bg: '#fee2e2', color: '#b91c1c' },
};

/** Cohorts of the same course share a code, else a title (case and spacing ignored). */
export function courseKey(t) {
  const code = String(t.code || '').trim().toLowerCase();
  if (code) return `code:${code}`;
  return `title:${String(t.title || '').trim().toLowerCase().replace(/\s+/g, ' ')}`;
}

/**
 * One list row.
 * @param {object} t     training (scalar fields)
 * @param {object} facts { sessions:[{id,title,status,startsAt,endsAt,attendanceCount}], modules, materials,
 *                         assessments, feedbackForm, facilitators, registrations:[{status,attendancePercent,certificate}],
 *                         needsGrading }
 */
export function manageRow(t, facts = {}, now = new Date()) {
  const phase = trainingPhase(t, now);
  const registrations = facts.registrations || [];
  const stats = workspaceStats({ training: t, registrations });
  const sessions = facts.sessions || [];
  const ended = phase === 'ended';
  const hasRules = Boolean(t.minAttendancePercent) || t.requireAllModules || t.requireAssessmentPass || t.requireFeedback;
  const undecided = ended && hasRules ? registrations.filter((r) => r.status === 'REGISTERED').length : 0;
  const unmarked = sessions.filter((s) => s.status === 'SCHEDULED' && new Date(s.endsAt) < now && !s.attendanceCount).length;
  const checklist = setupChecklist({ training: t, sessions, modules: facts.modules, materials: facts.materials, assessments: facts.assessments, feedbackForm: facts.feedbackForm, facilitators: facts.facilitators, stats, needsGrading: facts.needsGrading || 0, undecided }, now);
  const alerts = phase === 'cancelled' ? {} : {
    pending: stats.pending,
    unmarked,
    needsGrading: facts.needsGrading || 0,
    undecided,
    certificatesDue: ended ? stats.certificatesDue : 0,
  };
  const next = nextSession(sessions, now);
  return {
    id: t.id,
    title: t.title,
    code: t.code || null,
    category: t.category || null,
    department: t.department || null,
    targetGroup: t.targetGroup || [],
    deliveryMode: t.deliveryMode,
    venue: t.venue || t.location || null,
    startDate: t.startDate,
    endDate: t.endDate,
    status: t.status,
    isMandatory: Boolean(t.isMandatory),
    phase,
    course: courseKey(t),
    capacity: stats.capacity,
    seated: stats.seated,
    waitlisted: stats.waitlisted,
    pending: stats.pending,
    fillRate: stats.fillRate,
    attendance: stats.attendance,
    completionRate: stats.completionRate,
    activeRegistrations: registrations.filter((r) => ['REGISTERED', 'PENDING_APPROVAL', 'WAITLISTED'].includes(r.status)).length,
    sessionsCount: sessions.filter((s) => s.status === 'SCHEDULED').length,
    nextSession: next ? { id: next.id, title: next.title, startsAt: next.startsAt, endsAt: next.endsAt, state: next.state } : null,
    setup: { done: checklist.done, total: checklist.total, percent: checklist.percent, next: checklist.next ? { key: checklist.next.key, label: checklist.next.label, tab: checklist.next.tab } : null },
    alerts,
    alertTotal: Object.values(alerts).reduce((a, b) => a + (b || 0), 0),
  };
}

export function tabOf(row) {
  return row.phase;
}

export function tabCounts(rows) {
  const out = Object.fromEntries(MANAGE_TABS.map((t) => [t.key, 0]));
  for (const r of rows) out[tabOf(r)] += 1;
  out.all = rows.length;
  return out;
}

/** Headline figures for the stat cards. */
export function manageStats(rows, now = new Date()) {
  const live = rows.filter((r) => r.phase === 'upcoming' || r.phase === 'running');
  const seats = live.reduce((a, r) => a + r.seated, 0);
  const capacity = live.reduce((a, r) => a + (r.capacity || 0), 0);
  const in30 = new Date(now.getTime() + 30 * DAY);
  return {
    upcoming: rows.filter((r) => r.phase === 'upcoming').length,
    startingIn30: rows.filter((r) => r.phase === 'upcoming' && new Date(r.startDate) <= in30).length,
    running: rows.filter((r) => r.phase === 'running').length,
    drafts: rows.filter((r) => r.phase === 'draft').length,
    enrolled: seats,
    waiting: live.reduce((a, r) => a + r.waitlisted + r.pending, 0),
    fillRate: capacity ? Math.round((seats / capacity) * 100) : null,
    toActOn: rows.reduce((a, r) => a + r.alertTotal, 0),
  };
}

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/**
 * Things to act on across trainings, most urgent first.
 * @returns {[{ key, kind, severity, trainingId, count, title, detail, href, action }]}
 */
export function manageAttention(rows, now = new Date()) {
  const items = [];
  const href = (r, tab) => `/institution/training/${r.id}${tab ? `?tab=${tab}` : ''}`;
  const add = (r, kind, severity, count, title, detail, tab, action) => items.push({ key: `${kind}-${r.id}`, kind, severity, trainingId: r.id, count, title, detail, href: href(r, tab), action });
  for (const r of rows) {
    if (r.phase === 'cancelled') continue;
    const a = r.alerts;
    if (a.pending) add(r, 'PENDING', 'high', a.pending, `${plural(a.pending, 'registration')} to approve`, r.title, 'registrations', 'Review');
    if (a.unmarked) add(r, 'UNMARKED', 'high', a.unmarked, `${plural(a.unmarked, 'session')} without attendance`, r.title, 'attendance', 'Take attendance');
    if (a.needsGrading) add(r, 'GRADING', 'medium', a.needsGrading, `${plural(a.needsGrading, 'answer')} to grade`, r.title, 'assessments', 'Grade');
    if (a.undecided) add(r, 'UNDECIDED', 'medium', a.undecided, `Completion not decided for ${plural(a.undecided, 'person', 'people')}`, r.title, 'completion', 'Decide');
    if (a.certificatesDue) add(r, 'CERTIFICATES', 'medium', a.certificatesDue, `${plural(a.certificatesDue, 'certificate')} to issue`, r.title, 'certificates', 'Issue');
    const days = Math.ceil((new Date(r.startDate) - now) / DAY);
    if (r.phase === 'draft' && days >= 0 && days <= 14) add(r, 'DRAFT_SOON', 'high', 1, `Still a draft, starts in ${plural(days, 'day')}`, r.title, null, 'Publish');
    if (r.phase === 'upcoming' && days <= 14 && !r.sessionsCount) add(r, 'NO_SESSIONS', 'medium', 1, 'No sessions scheduled', `${r.title} starts in ${plural(days, 'day')}`, 'schedule', 'Schedule');
    if (r.phase === 'upcoming' && days <= 7 && r.capacity && r.fillRate !== null && r.fillRate < 30) add(r, 'LOW_ENROLMENT', 'low', r.seated, `Only ${r.seated} of ${r.capacity} places taken`, `${r.title} starts in ${plural(days, 'day')}`, 'registrations', 'Assign people');
  }
  const rank = { high: 0, medium: 1, low: 2 };
  return items.sort((x, y) => rank[x.severity] - rank[y.severity] || y.count - x.count);
}

/** Scheduled sessions in the next `days` days (and any running now), soonest first. */
export function upcomingSessions(sessions, trainingsById, now = new Date(), days = 7) {
  const until = new Date(now.getTime() + days * DAY);
  return sessions
    .filter((s) => s.status === 'SCHEDULED' && new Date(s.endsAt) >= now && new Date(s.startsAt) <= until)
    .filter((s) => {
      const t = trainingsById.get(s.trainingId);
      return t && t.phase !== 'cancelled' && t.phase !== 'draft';
    })
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
    .map((s) => ({ ...s, trainingTitle: trainingsById.get(s.trainingId).title, live: new Date(s.startsAt) <= now }));
}

/** Rows grouped by course, largest first; each group with totals. */
export function groupByCourse(rows) {
  const groups = new Map();
  for (const r of rows) groups.set(r.course, [...(groups.get(r.course) || []), r]);
  return [...groups.entries()].map(([key, list]) => {
    const sorted = [...list].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    const capacity = list.reduce((a, r) => a + (r.capacity || 0), 0);
    const seated = list.reduce((a, r) => a + r.seated, 0);
    return {
      key,
      title: sorted[0].title,
      code: sorted[0].code,
      rows: sorted,
      cohorts: list.length,
      seated,
      capacity,
      alertTotal: list.reduce((a, r) => a + r.alertTotal, 0),
      next: [...list].filter((r) => r.phase === 'upcoming' || r.phase === 'running').sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0] || null,
    };
  }).sort((a, b) => b.cohorts - a.cohorts || a.title.localeCompare(b.title));
}

/** Search, department and category filters. */
export function filterRows(rows, { tab = 'all', search = '', department = 'all', category = 'all' } = {}) {
  const q = search.trim().toLowerCase();
  return rows.filter((r) => (tab === 'all' || tabOf(r) === tab)
    && (department === 'all' || (r.department || '').split(',').map((d) => d.trim()).includes(department))
    && (category === 'all' || r.category === category)
    && (!q || `${r.title} ${r.code || ''} ${r.department || ''} ${r.category || ''} ${r.venue || ''}`.toLowerCase().includes(q)));
}

/** Sort order per tab: upcoming soonest first, ended latest first. */
export function sortRows(rows, tab) {
  const by = (dir) => (a, b) => dir * (new Date(a.startDate) - new Date(b.startDate));
  if (tab === 'upcoming' || tab === 'running' || tab === 'draft') return [...rows].sort(by(1));
  return [...rows].sort(by(-1));
}

const d10 = (v) => (v ? new Date(v).toISOString().slice(0, 10) : '');

/** Rows for the Excel / CSV export of the list. */
export function exportRows(rows) {
  return rows.map((r) => ({
    Training: r.title,
    Code: r.code || '',
    Category: r.category || '',
    Departments: r.department || '',
    Status: PHASE_CHIP[r.phase].label,
    Starts: d10(r.startDate),
    Ends: d10(r.endDate),
    Sessions: r.sessionsCount,
    Capacity: r.capacity,
    Enrolled: r.seated,
    'Waiting list': r.waitlisted,
    'Awaiting approval': r.pending,
    'Fill %': r.fillRate ?? '',
    'Attendance %': r.attendance ?? '',
    'Completion %': r.completionRate ?? '',
    'Setup done': `${r.setup.done}/${r.setup.total}`,
    'To act on': r.alertTotal,
    Mandatory: r.isMandatory ? 'Yes' : 'No',
  }));
}

/** Month grid (weeks of 7 days, Monday first) covering the month of `month` (UTC). */
export function monthGrid(month) {
  const first = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1));
  const offset = (first.getUTCDay() + 6) % 7;
  const start = new Date(first.getTime() - offset * DAY);
  const last = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0));
  const weeks = [];
  for (let d = start; d <= last || weeks.length < 5; ) {
    const week = [];
    for (let i = 0; i < 7; i += 1) {
      week.push({ date: d, key: d.toISOString().slice(0, 10), inMonth: d.getUTCMonth() === month.getUTCMonth() });
      d = new Date(d.getTime() + DAY);
    }
    weeks.push(week);
    if (weeks.length >= 6) break;
  }
  return weeks;
}
