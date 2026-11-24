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
export function matchesFilters(training, { from = null, to = null, department = null, targetGroup = null } = {}) {
  if (training.status === 'DRAFT' || training.status === 'CANCELLED') return false;
  const start = new Date(training.startDate).getTime();
  if (from && start < new Date(from).getTime()) return false;
  if (to && start > new Date(to).getTime()) return false;
  if (department && department !== 'all' && !splitList(training.department).includes(department)) return false;
  if (targetGroup && targetGroup !== 'all' && !splitList(training.targetGroup).includes(targetGroup)) return false;
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
    ],
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
