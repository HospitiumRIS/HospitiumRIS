/**
 * Training analytics (#109): KPIs and breakdowns for an institution's trainings.
 * Pure: the API loads the data, this file does the arithmetic, so the figures can be
 * cross-checked against raw counts in tests.
 *
 * Definitions
 *   trainings run       non-draft, non-cancelled trainings starting in the period
 *   enrolments          registrations holding a place (registered, completed, not completed)
 *   attendance rate     present or late marks / (enrolments × sessions held), over held sessions
 *   no-show rate        enrolments with sessions held but no present or late mark / enrolments with sessions held
 *   completion rate     completed / (completed + not completed), i.e. of decided outcomes
 *   certificates        issued (not revoked) certificates of these trainings
 *   CPD hours delivered sum of the training's CPD hours over completed registrations
 */

import { summarizeCompliance } from './training-assignment.js';
import { npsScore } from './training-feedback.js';

export const SEAT_STATUSES = ['REGISTERED', 'COMPLETED', 'NOT_COMPLETED'];
const ATTENDED = new Set(['PRESENT', 'LATE']);

const pct = (num, den) => (den > 0 ? Math.round((num / den) * 1000) / 10 : null);
const round1 = (n) => Math.round(n * 10) / 10;
const splitList = (v) => (Array.isArray(v) ? v : String(v || '').split(',')).map((x) => String(x).trim()).filter(Boolean);

/** Month key of a date, e.g. 2026-03 (UTC). */
export function monthKey(value) {
  const d = new Date(value);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Does the training pass the filters? */
export function matchesFilters(training, { from = null, to = null, department = null, targetGroup = null, category = null, deliveryMode = null } = {}) {
  if (training.status === 'DRAFT' || training.status === 'CANCELLED') return false;
  const start = new Date(training.startDate).getTime();
  if (from && start < new Date(from).getTime()) return false;
  if (to && start > new Date(to).getTime()) return false;
  if (department && department !== 'all' && !splitList(training.department).includes(department)) return false;
  if (targetGroup && targetGroup !== 'all' && !splitList(training.targetGroup).includes(targetGroup)) return false;
  if (category && category !== 'all' && (training.category || 'Not set') !== category) return false;
  if (deliveryMode && deliveryMode !== 'all' && (training.deliveryMode || 'IN_PERSON') !== deliveryMode) return false;
  return true;
}

/**
 * Figures for one training.
 * @param {object} t  { id, title, department, targetGroup, category, startDate, cpdHours,
 *   sessions: [{ id, status, startsAt }], registrations: [{ id, status, source, dueDate,
 *   certificate?, attendance: [{ sessionId, status }] }] }
 */
export function trainingFigures(t, now = new Date()) {
  const held = (t.sessions || []).filter((s) => s.status !== 'CANCELLED' && new Date(s.startsAt) <= now);
  const heldIds = new Set(held.map((s) => s.id));
  const seats = (t.registrations || []).filter((r) => SEAT_STATUSES.includes(r.status));
  let attendedMarks = 0;
  let noShows = 0;
  for (const r of seats) {
    const attended = (r.attendance || []).filter((a) => heldIds.has(a.sessionId) && ATTENDED.has(a.status)).length;
    attendedMarks += attended;
    if (held.length && attended === 0) noShows += 1;
  }
  const completed = seats.filter((r) => r.status === 'COMPLETED').length;
  const notCompleted = seats.filter((r) => r.status === 'NOT_COMPLETED').length;
  const certificates = seats.filter((r) => r.certificate && r.certificate.status !== 'REVOKED').length;
  return {
    id: t.id,
    title: t.title,
    code: t.code || null,
    department: t.department || null,
    category: t.category || null,
    startDate: t.startDate,
    status: t.status,
    sessionsHeld: held.length,
    enrolments: seats.length,
    expectedMarks: seats.length * held.length,
    attendedMarks,
    withHeldSessions: held.length ? seats.length : 0,
    noShows,
    completed,
    notCompleted,
    certificates,
    cpdHours: round1(completed * (Number(t.cpdHours) || 0)),
    attendanceRate: pct(attendedMarks, seats.length * held.length),
    noShowRate: held.length ? pct(noShows, seats.length) : null,
    completionRate: pct(completed, completed + notCompleted),
  };
}

function sumFigures(list) {
  const s = list.reduce((acc, f) => {
    for (const k of ['enrolments', 'expectedMarks', 'attendedMarks', 'withHeldSessions', 'noShows', 'completed', 'notCompleted', 'certificates', 'cpdHours', 'sessionsHeld']) acc[k] += f[k];
    return acc;
  }, { enrolments: 0, expectedMarks: 0, attendedMarks: 0, withHeldSessions: 0, noShows: 0, completed: 0, notCompleted: 0, certificates: 0, cpdHours: 0, sessionsHeld: 0 });
  return {
    trainings: list.length,
    ...s,
    cpdHours: round1(s.cpdHours),
    attendanceRate: pct(s.attendedMarks, s.expectedMarks),
    noShowRate: pct(s.noShows, s.withHeldSessions),
    completionRate: pct(s.completed, s.completed + s.notCompleted),
  };
}

/** Group per-training figures by a key function (a training can fall in several groups). */
export function breakdown(trainings, figures, keysOf) {
  const groups = new Map();
  trainings.forEach((t, i) => {
    const keys = keysOf(t);
    for (const key of keys.length ? keys : ['Not set']) {
      groups.set(key, [...(groups.get(key) || []), figures[i]]);
    }
  });
  return [...groups.entries()].map(([key, list]) => ({ key, ...sumFigures(list) }));
}

/** Feedback across trainings: response count, average of rating questions, NPS. */
export function feedbackFigures(forms, responses) {
  const formById = new Map((forms || []).map((f) => [f.id, f]));
  const ratings = [];
  const nps = [];
  const perTraining = new Map();
  for (const r of responses || []) {
    const form = formById.get(r.formId);
    if (!form) continue;
    const mine = perTraining.get(r.trainingId) || { ratings: [], responses: 0 };
    mine.responses += 1;
    for (const q of form.questions || []) {
      const v = r.answers?.[q.id];
      if (!Number.isFinite(v)) continue;
      if (q.type === 'RATING') { ratings.push(v); mine.ratings.push(v); }
      if (q.type === 'NPS') nps.push(v);
    }
    perTraining.set(r.trainingId, mine);
  }
  const avg = (v) => (v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 100) / 100 : null);
  return {
    responses: (responses || []).length,
    averageRating: avg(ratings),
    nps: npsScore(nps),
    perTraining: Object.fromEntries([...perTraining.entries()].map(([id, x]) => [id, { responses: x.responses, averageRating: avg(x.ratings) }])),
  };
}

/** Assessment pass rates: per assessment, people who took it and people who passed. */
export function assessmentFigures(assessments) {
  return (assessments || []).map((a) => {
    const finished = (a.attempts || []).filter((x) => x.status === 'GRADED');
    const takers = new Set(finished.map((x) => x.registrationId));
    const passers = new Set(finished.filter((x) => x.passed).map((x) => x.registrationId));
    const scores = finished.map((x) => x.percent).filter(Number.isFinite);
    return {
      id: a.id,
      title: a.title,
      trainingId: a.trainingId,
      trainingTitle: a.trainingTitle,
      type: a.type,
      takers: takers.size,
      passed: passers.size,
      passRate: pct(passers.size, takers.size),
      averageScore: scores.length ? round1(scores.reduce((s, x) => s + x, 0) / scores.length) : null,
    };
  });
}

/**
 * The whole report.
 * @param {object} input { trainings, forms, responses, assessments, filters, now }
 */
export function computeAnalytics({ trainings = [], forms = [], responses = [], assessments = [], filters = {}, now = new Date() }) {
  const inScope = trainings.filter((t) => matchesFilters(t, filters));
  const ids = new Set(inScope.map((t) => t.id));
  const figures = inScope.map((t) => trainingFigures(t, now));
  const feedback = feedbackFigures(forms, (responses || []).filter((r) => ids.has(r.trainingId)));
  const assigned = inScope.flatMap((t) => (t.registrations || []).filter((r) => r.source === 'ASSIGNED'));

  const byMonth = breakdown(inScope, figures, (t) => [monthKey(t.startDate)]).sort((a, b) => a.key.localeCompare(b.key));
  const sortBy = (list) => list.sort((a, b) => b.enrolments - a.enrolments || a.key.localeCompare(b.key));

  return {
    kpis: { ...sumFigures(figures), feedbackResponses: feedback.responses, averageRating: feedback.averageRating, nps: feedback.nps },
    byDepartment: sortBy(breakdown(inScope, figures, (t) => splitList(t.department))),
    byTargetGroup: sortBy(breakdown(inScope, figures, (t) => splitList(t.targetGroup))),
    byCategory: sortBy(breakdown(inScope, figures, (t) => (t.category ? [t.category] : []))),
    byMonth,
    trainings: figures
      .map((f) => ({ ...f, feedbackResponses: feedback.perTraining[f.id]?.responses || 0, averageRating: feedback.perTraining[f.id]?.averageRating ?? null }))
      .sort((a, b) => new Date(b.startDate) - new Date(a.startDate)),
    assessments: assessmentFigures((assessments || []).filter((a) => ids.has(a.trainingId))),
    compliance: summarizeCompliance(assigned, now),
    options: {
      departments: [...new Set(trainings.flatMap((t) => splitList(t.department)))].sort(),
      targetGroups: [...new Set(trainings.flatMap((t) => splitList(t.targetGroup)))].sort(),
      categories: [...new Set(trainings.map((t) => t.category).filter(Boolean))].sort(),
    },
  };
}

/** Rows for spreadsheet export: one sheet per section. */
export function analyticsSheets(report) {
  const group = (rows, label) => rows.map((r) => ({
    [label]: r.key,
    Trainings: r.trainings,
    Enrolments: r.enrolments,
    'Attendance %': r.attendanceRate,
    'No-show %': r.noShowRate,
    Completed: r.completed,
    'Completion %': r.completionRate,
    Certificates: r.certificates,
    'CPD hours': r.cpdHours,
  }));
  const k = report.kpis;
  return {
    Summary: [
      { Measure: 'Trainings run', Value: k.trainings },
      { Measure: 'Enrolments', Value: k.enrolments },
      { Measure: 'Sessions held', Value: k.sessionsHeld },
      { Measure: 'Attendance rate %', Value: k.attendanceRate },
      { Measure: 'No-show rate %', Value: k.noShowRate },
      { Measure: 'Completion rate %', Value: k.completionRate },
      { Measure: 'Certificates issued', Value: k.certificates },
      { Measure: 'CPD hours delivered', Value: k.cpdHours },
      { Measure: 'Feedback responses', Value: k.feedbackResponses },
      { Measure: 'Average rating (1–5)', Value: k.averageRating },
      { Measure: 'NPS', Value: k.nps },
      { Measure: 'Mandatory: assigned', Value: report.compliance.assigned },
      { Measure: 'Mandatory: compliant %', Value: report.compliance.percentCompliant },
      { Measure: 'Mandatory: overdue', Value: report.compliance.overdue },
      ...(report.capacity ? [
        { Measure: 'Places offered', Value: report.capacity.offered },
        { Measure: 'Fill rate %', Value: report.capacity.fillRate },
        { Measure: 'Waiting list', Value: report.capacity.waitlisted },
        { Measure: 'Pending approvals', Value: report.capacity.pending },
        { Measure: 'Cancellations', Value: report.capacity.cancelled },
      ] : []),
      ...(report.prePost ? [{ Measure: 'Average pre/post-test gain (pt)', Value: report.prePost.averageGain }] : []),
    ].map((row) => {
      const key = { 'Trainings run': 'trainings', Enrolments: 'enrolments', 'Attendance rate %': 'attendanceRate', 'No-show rate %': 'noShowRate', 'Completion rate %': 'completionRate', 'Certificates issued': 'certificates', 'CPD hours delivered': 'cpdHours' }[row.Measure];
      const c = key && report.comparison?.[key];
      return c ? { ...row, 'Previous period': c.previous, Change: c.change === null ? '' : `${c.change > 0 ? '+' : ''}${c.change}${c.unit === 'pt' ? ' pt' : '%'}` } : row;
    }),
    Trainings: report.trainings.map((t) => ({
      Training: t.title,
      Code: t.code,
      Department: t.department,
      Category: t.category,
      Start: t.startDate ? new Date(t.startDate).toISOString().slice(0, 10) : '',
      'Sessions held': t.sessionsHeld,
      Enrolments: t.enrolments,
      'Attendance %': t.attendanceRate,
      'No-show %': t.noShowRate,
      Completed: t.completed,
      'Not completed': t.notCompleted,
      'Completion %': t.completionRate,
      Certificates: t.certificates,
      'CPD hours': t.cpdHours,
      'Feedback responses': t.feedbackResponses,
      'Average rating': t.averageRating,
    })),
    'By month': group(report.byMonth, 'Month'),
    'By department': group(report.byDepartment, 'Department'),
    'By target group': group(report.byTargetGroup, 'Target group'),
    'By category': group(report.byCategory, 'Category'),
    ...(report.byDeliveryMode ? { 'By delivery mode': group(report.byDeliveryMode, 'Delivery mode') } : {}),
    ...(report.capacity ? {
      Capacity: report.capacity.trainings.map((t) => ({
        Training: t.title, Places: t.places, Taken: t.taken, 'Fill %': t.fillRate, 'Waiting list': t.waitlisted, 'Pending approval': t.pending, Cancelled: t.cancelled,
      })),
    } : {}),
    ...(report.facilitators ? {
      Facilitators: report.facilitators.map((f) => ({
        Facilitator: f.name, Trainings: f.trainings, 'Sessions held': f.sessionsHeld, 'Attendance %': f.attendanceRate, 'Average rating': f.averageRating,
      })),
    } : {}),
    ...(report.prePost ? {
      'Pre-post gain': report.prePost.trainings.map((t) => ({
        Training: t.trainingTitle, Participants: t.participants, 'Pre-test %': t.pre, 'Post-test %': t.post, 'Gain (pt)': t.gain,
      })),
    } : {}),
    ...(report.attention ? {
      'Needs attention': report.attention.map((a) => ({ Severity: a.severity, Item: a.title, Training: a.detail, Action: a.action })),
    } : {}),
    Assessments: report.assessments.map((a) => ({
      Assessment: a.title,
      Training: a.trainingTitle,
      Type: a.type,
      'Took it': a.takers,
      Passed: a.passed,
      'Pass rate %': a.passRate,
      'Average score %': a.averageScore,
    })),
  };
}

// ---------------------------------------------------------------------------
// Analytics v2 (#138): previous period, capacity, delivery mode, facilitators,
// pre/post-test gain and the needs-attention list.
// ---------------------------------------------------------------------------

const DAY = 24 * 60 * 60 * 1000;

/** The equal-length period just before [from, to]. */
export function previousPeriod(from, to) {
  const f = new Date(from).getTime();
  const t = new Date(to).getTime();
  const length = t - f;
  return { from: new Date(f - length - 1), to: new Date(f - 1) };
}

const COMPARE_KEYS = ['trainings', 'enrolments', 'attendanceRate', 'noShowRate', 'completionRate', 'certificates', 'cpdHours'];
const RATE_KEYS = new Set(['attendanceRate', 'noShowRate', 'completionRate']);

/**
 * Change of each KPI against the previous period. Counts change in % of the previous
 * value; rates change in percentage points. `good` says whether the move is good news.
 */
export function compareKpis(current, previous) {
  const out = {};
  for (const key of COMPARE_KEYS) {
    const now = current?.[key] ?? null;
    const before = previous?.[key] ?? null;
    let change = null;
    let unit = RATE_KEYS.has(key) ? 'pt' : '%';
    if (now !== null && before !== null) {
      if (RATE_KEYS.has(key)) change = round1(now - before);
      else if (before > 0) change = round1(((now - before) / before) * 100);
      else unit = null; // nothing to compare against
    }
    const direction = change === null ? 'none' : change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
    const higherIsBetter = key !== 'noShowRate';
    out[key] = {
      value: now,
      previous: before,
      change,
      unit,
      direction,
      good: direction === 'flat' || direction === 'none' ? null : (direction === 'up') === higherIsBetter,
    };
  }
  return out;
}

/** Places, fill rate, waiting list, approvals, cancellations and declines. */
export function capacityFigures(trainings) {
  let offered = 0;
  let taken = 0;
  let waitlisted = 0;
  let pending = 0;
  let cancelled = 0;
  let rejected = 0;
  const rows = [];
  for (const t of trainings || []) {
    const regs = t.registrations || [];
    const count = (s) => regs.filter((r) => r.status === s).length;
    const seats = regs.filter((r) => SEAT_STATUSES.includes(r.status) || r.status === 'PENDING_APPROVAL').length;
    const max = Number(t.maxParticipants) || 0;
    offered += max;
    taken += seats;
    waitlisted += count('WAITLISTED');
    pending += count('PENDING_APPROVAL');
    cancelled += count('CANCELLED');
    rejected += count('REJECTED');
    rows.push({
      id: t.id,
      title: t.title,
      places: max,
      taken: seats,
      fillRate: pct(seats, max),
      waitlisted: count('WAITLISTED'),
      pending: count('PENDING_APPROVAL'),
      cancelled: count('CANCELLED'),
    });
  }
  return {
    offered,
    taken,
    fillRate: pct(taken, offered),
    waitlisted,
    pending,
    cancelled,
    rejected,
    cancellationRate: pct(cancelled, taken + cancelled),
    trainings: rows.sort((a, b) => (b.fillRate ?? -1) - (a.fillRate ?? -1)),
  };
}

/**
 * Per facilitator: trainings, sessions held, attendance in their sessions, and the
 * average feedback rating of the trainings they facilitate.
 * t.facilitators: [{ key, name, sessionId|null }]
 */
export function facilitatorFigures(trainings, ratingByTraining = {}, now = new Date()) {
  const map = new Map();
  for (const t of trainings || []) {
    const held = (t.sessions || []).filter((s) => s.status !== 'CANCELLED' && new Date(s.startsAt) <= now);
    const seats = (t.registrations || []).filter((r) => SEAT_STATUSES.includes(r.status));
    for (const f of t.facilitators || []) {
      const mine = held.filter((s) => !f.sessionId || s.id === f.sessionId);
      const ids = new Set(mine.map((s) => s.id));
      const cur = map.get(f.key) || { key: f.key, name: f.name, trainings: new Set(), sessions: new Set(), expected: 0, attended: 0, ratings: [] };
      cur.trainings.add(t.id);
      for (const s of mine) cur.sessions.add(s.id);
      cur.expected += seats.length * mine.length;
      for (const r of seats) cur.attended += (r.attendance || []).filter((a) => ids.has(a.sessionId) && ATTENDED.has(a.status)).length;
      if (Number.isFinite(ratingByTraining[t.id])) cur.ratings.push(ratingByTraining[t.id]);
      map.set(f.key, cur);
    }
  }
  return [...map.values()].map((c) => ({
    key: c.key,
    name: c.name,
    trainings: c.trainings.size,
    sessionsHeld: c.sessions.size,
    attendanceRate: pct(c.attended, c.expected),
    averageRating: c.ratings.length ? Math.round((c.ratings.reduce((a, b) => a + b, 0) / c.ratings.length) * 100) / 100 : null,
  })).sort((a, b) => b.sessionsHeld - a.sessionsHeld || a.name.localeCompare(b.name));
}

/**
 * Pre/post-test gain per training: for participants with a graded pre-test and a graded
 * post-test, best post % minus best pre %, averaged.
 */
export function prePostGain(assessments) {
  const byTraining = new Map();
  for (const a of assessments || []) {
    if (a.type !== 'PRE_TEST' && a.type !== 'POST_TEST') continue;
    const cur = byTraining.get(a.trainingId) || { trainingId: a.trainingId, trainingTitle: a.trainingTitle, pre: new Map(), post: new Map() };
    const target = a.type === 'PRE_TEST' ? cur.pre : cur.post;
    for (const x of a.attempts || []) {
      if (x.status !== 'GRADED' || !Number.isFinite(x.percent)) continue;
      target.set(x.registrationId, Math.max(target.get(x.registrationId) ?? -Infinity, x.percent));
    }
    byTraining.set(a.trainingId, cur);
  }
  const rows = [];
  for (const cur of byTraining.values()) {
    const paired = [...cur.pre.keys()].filter((id) => cur.post.has(id));
    if (!paired.length) continue;
    const pre = paired.reduce((s, id) => s + cur.pre.get(id), 0) / paired.length;
    const post = paired.reduce((s, id) => s + cur.post.get(id), 0) / paired.length;
    rows.push({ trainingId: cur.trainingId, trainingTitle: cur.trainingTitle, participants: paired.length, pre: round1(pre), post: round1(post), gain: round1(post - pre) });
  }
  const total = rows.reduce((s, r) => s + r.participants, 0);
  return {
    trainings: rows.sort((a, b) => b.gain - a.gain),
    averageGain: total ? round1(rows.reduce((s, r) => s + r.gain * r.participants, 0) / total) : null,
    participants: total,
  };
}

export const ATTENTION_THRESHOLDS = { lowAttendance: 60, undecidedAfterDays: 14, feedbackAfterDays: 2 };

/**
 * Things a coordinator should act on, most serious first. Each links to where it is fixed.
 * Per-training extras: endDate, hasFeedbackForm, feedbackResponses, needsGrading,
 * completionGraceDays.
 */
export function needsAttention({ trainings = [], figures = [], compliance = null, now = new Date() }) {
  const items = [];
  const byId = new Map(figures.map((f) => [f.id, f]));
  const link = (t, tab) => `/institution/training/${t.id}?tab=${tab}`;
  for (const t of trainings) {
    const f = byId.get(t.id) || trainingFigures(t, now);
    const regs = t.registrations || [];
    const ended = t.endDate && new Date(t.endDate) < now;
    const daysSinceEnd = ended ? (now - new Date(t.endDate)) / DAY : 0;

    const noCertificate = regs.filter((r) => r.status === 'COMPLETED' && !(r.certificate && r.certificate.status !== 'REVOKED')).length;
    if (noCertificate) items.push({ kind: 'NO_CERTIFICATE', severity: 'high', count: noCertificate, trainingId: t.id, title: `${noCertificate} completed without a certificate`, detail: t.title, href: link(t, 'certificates'), action: 'Issue certificates' });

    if (t.needsGrading) items.push({ kind: 'NEEDS_GRADING', severity: 'high', count: t.needsGrading, trainingId: t.id, title: `${t.needsGrading} assessment answer${t.needsGrading === 1 ? '' : 's'} to grade`, detail: t.title, href: link(t, 'assessments'), action: 'Grade' });

    const undecided = regs.filter((r) => r.status === 'REGISTERED').length;
    const grace = Number(t.completionGraceDays ?? 7);
    if (ended && undecided && daysSinceEnd > Math.max(grace, ATTENTION_THRESHOLDS.undecidedAfterDays)) {
      items.push({ kind: 'UNDECIDED', severity: 'medium', count: undecided, trainingId: t.id, title: `${undecided} outcome${undecided === 1 ? '' : 's'} not decided`, detail: `${t.title} ended ${Math.floor(daysSinceEnd)} days ago`, href: link(t, 'completion'), action: 'Decide completion' });
    }

    if (f.sessionsHeld && f.attendanceRate !== null && f.attendanceRate < ATTENTION_THRESHOLDS.lowAttendance) {
      items.push({ kind: 'LOW_ATTENDANCE', severity: 'medium', count: f.noShows, trainingId: t.id, title: `Attendance ${f.attendanceRate}%`, detail: `${t.title} · ${f.noShows} no-show${f.noShows === 1 ? '' : 's'}`, href: link(t, 'attendance'), action: 'Check the register' });
    }

    const pending = regs.filter((r) => r.status === 'PENDING_APPROVAL').length;
    if (pending && !ended) items.push({ kind: 'PENDING_APPROVAL', severity: 'medium', count: pending, trainingId: t.id, title: `${pending} request${pending === 1 ? '' : 's'} to approve`, detail: t.title, href: link(t, 'registrations'), action: 'Review requests' });

    const waitlisted = regs.filter((r) => r.status === 'WAITLISTED').length;
    const seats = regs.filter((r) => SEAT_STATUSES.includes(r.status) || r.status === 'PENDING_APPROVAL').length;
    const free = (Number(t.maxParticipants) || 0) - seats;
    if (waitlisted && free > 0 && !ended) items.push({ kind: 'WAITLIST_WITH_PLACES', severity: 'medium', count: Math.min(waitlisted, free), trainingId: t.id, title: `${waitlisted} waiting while ${free} place${free === 1 ? ' is' : 's are'} free`, detail: t.title, href: link(t, 'registrations'), action: 'Offer places' });

    if (ended && t.hasFeedbackForm && f.enrolments && !t.feedbackResponses && daysSinceEnd >= ATTENTION_THRESHOLDS.feedbackAfterDays) {
      items.push({ kind: 'NO_FEEDBACK', severity: 'low', count: f.enrolments, trainingId: t.id, title: 'No feedback yet', detail: `${t.title} ended ${Math.floor(daysSinceEnd)} days ago`, href: link(t, 'feedback'), action: 'Ask participants' });
    }
  }
  if (compliance?.overdue) {
    items.push({ kind: 'OVERDUE_MANDATORY', severity: 'high', count: compliance.overdue, trainingId: null, title: `${compliance.overdue} overdue mandatory training${compliance.overdue === 1 ? '' : 's'}`, detail: 'Assigned with a due date that has passed', href: '/institution/training/compliance', action: 'Open compliance' });
  }
  const rank = { high: 0, medium: 1, low: 2 };
  return items.sort((a, b) => rank[a.severity] - rank[b.severity] || b.count - a.count);
}

/** Small monthly series for sparklines. */
export function sparklines(byMonth) {
  const pick = (k) => (byMonth || []).map((m) => m[k] ?? null);
  return {
    trainings: pick('trainings'),
    enrolments: pick('enrolments'),
    attendanceRate: pick('attendanceRate'),
    noShowRate: pick('noShowRate'),
    completionRate: pick('completionRate'),
    certificates: pick('certificates'),
    cpdHours: pick('cpdHours'),
  };
}

/**
 * The v2 report: computeAnalytics for the period plus everything above, with the
 * previous period computed from the same loaded trainings.
 */
export function computeAnalyticsV2({ trainings = [], forms = [], responses = [], assessments = [], filters = {}, now = new Date() }) {
  const current = computeAnalytics({ trainings, forms, responses, assessments, filters, now });
  const prev = previousPeriod(filters.from, filters.to);
  const previous = computeAnalytics({ trainings, forms, responses, assessments, filters: { ...filters, from: prev.from, to: prev.to }, now });
  const responseCount = new Map();
  for (const r of responses || []) responseCount.set(r.trainingId, (responseCount.get(r.trainingId) || 0) + 1);
  const grading = new Map();
  for (const a of assessments || []) {
    const n = (a.attempts || []).filter((x) => x.status === 'NEEDS_GRADING').length;
    if (n) grading.set(a.trainingId, (grading.get(a.trainingId) || 0) + n);
  }
  const inScope = trainings
    .filter((t) => matchesFilters(t, filters))
    .map((t) => ({ ...t, feedbackResponses: responseCount.get(t.id) || 0, needsGrading: grading.get(t.id) || 0 }));
  const ids = new Set(inScope.map((t) => t.id));
  const figures = inScope.map((t) => trainingFigures(t, now));
  const ratingByTraining = Object.fromEntries(current.trainings.map((t) => [t.id, t.averageRating]));
  return {
    ...current,
    previousPeriod: { from: prev.from, to: prev.to, kpis: previous.kpis },
    comparison: compareKpis(current.kpis, previous.kpis),
    sparklines: sparklines(current.byMonth),
    byDeliveryMode: breakdown(inScope, figures, (t) => [t.deliveryMode || 'IN_PERSON']).sort((a, b) => b.enrolments - a.enrolments),
    capacity: capacityFigures(inScope),
    facilitators: facilitatorFigures(inScope, ratingByTraining, now),
    prePost: prePostGain((assessments || []).filter((a) => ids.has(a.trainingId))),
    attention: needsAttention({ trainings: inScope, figures, compliance: current.compliance, now }),
  };
}

/**
 * Monthly report due for a subscriber? The report covers the previous calendar month
 * (UTC) and goes once: when lastSentPeriod is not that month yet.
 * @returns {{ due: boolean, period: string, from: Date, to: Date }}
 */
export function monthlyReportDue(lastSentPeriod, now = new Date()) {
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) - 1);
  const period = monthKey(from);
  return { due: lastSentPeriod !== period, period, from, to };
}
