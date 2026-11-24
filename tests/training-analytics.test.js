import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { analyticsSheets, computeAnalytics, matchesFilters, monthKey } from '../src/lib/training-analytics.js';

/**
 * Seeded data. Raw facts, counted by hand:
 *  T1 (Nursing, Clinical, March): 2 held sessions + 1 cancelled + 1 future; 4 seats
 *     r1 COMPLETED  attended s1,s2          certificate ISSUED   cpd 6
 *     r2 COMPLETED  attended s1 (LATE)     certificate REVOKED
 *     r3 NOT_COMPLETED absent both                                   -> no-show
 *     r4 REGISTERED attended nothing marked                          -> no-show
 *     r5 CANCELLED (ignored)
 *  T2 (Nursing, Pharmacy; Research; April): 1 held session; 2 seats
 *     r6 COMPLETED attended   certificate ISSUED  cpd 2
 *     r7 REGISTERED ASSIGNED due in the past, absent -> no-show, overdue
 *  T3 DRAFT (ignored), T4 CANCELLED (ignored)
 */
const now = new Date('2026-05-01T00:00:00Z');
const T1 = {
  id: 't1', title: 'IPC', department: 'Nursing', targetGroup: ['NURSES'], category: 'Clinical', status: 'COMPLETED', startDate: '2026-03-02T06:00:00Z', cpdHours: 6,
  sessions: [
    { id: 's1', status: 'SCHEDULED', startsAt: '2026-03-02T06:00:00Z' },
    { id: 's2', status: 'SCHEDULED', startsAt: '2026-03-03T06:00:00Z' },
    { id: 'sx', status: 'CANCELLED', startsAt: '2026-03-04T06:00:00Z' },
    { id: 'sf', status: 'SCHEDULED', startsAt: '2026-06-01T06:00:00Z' },
  ],
  registrations: [
    { id: 'r1', status: 'COMPLETED', certificate: { status: 'ISSUED' }, attendance: [{ sessionId: 's1', status: 'PRESENT' }, { sessionId: 's2', status: 'PRESENT' }, { sessionId: 'sx', status: 'PRESENT' }] },
    { id: 'r2', status: 'COMPLETED', certificate: { status: 'REVOKED' }, attendance: [{ sessionId: 's1', status: 'LATE' }, { sessionId: 's2', status: 'EXCUSED' }] },
    { id: 'r3', status: 'NOT_COMPLETED', attendance: [{ sessionId: 's1', status: 'ABSENT' }, { sessionId: 's2', status: 'ABSENT' }] },
    { id: 'r4', status: 'REGISTERED', attendance: [] },
    { id: 'r5', status: 'CANCELLED', attendance: [{ sessionId: 's1', status: 'PRESENT' }] },
  ],
};
const T2 = {
  id: 't2', title: 'GCP', department: 'Nursing, Pharmacy', targetGroup: ['RESEARCHERS'], category: 'Research', status: 'PUBLISHED', startDate: '2026-04-10T06:00:00Z', cpdHours: 2,
  sessions: [{ id: 's3', status: 'SCHEDULED', startsAt: '2026-04-10T06:00:00Z' }],
  registrations: [
    { id: 'r6', status: 'COMPLETED', certificate: { status: 'ISSUED' }, attendance: [{ sessionId: 's3', status: 'PRESENT' }] },
    { id: 'r7', status: 'REGISTERED', source: 'ASSIGNED', dueDate: '2026-04-20T00:00:00Z', attendance: [{ sessionId: 's3', status: 'ABSENT' }] },
  ],
};
const T3 = { ...T1, id: 't3', status: 'DRAFT' };
const T4 = { ...T1, id: 't4', status: 'CANCELLED' };
const forms = [{ id: 'f', questions: [{ id: 'overall', type: 'RATING' }, { id: 'nps', type: 'NPS' }, { id: 'txt', type: 'TEXT' }] }];
const responses = [
  { trainingId: 't1', formId: 'f', answers: { overall: 5, nps: 10, txt: 'x' } },
  { trainingId: 't1', formId: 'f', answers: { overall: 3, nps: 6 } },
  { trainingId: 't2', formId: 'f', answers: { overall: 4 } },
  { trainingId: 't3', formId: 'f', answers: { overall: 1 } }, // draft: out of scope
];
const assessments = [{
  id: 'a1', trainingId: 't1', trainingTitle: 'IPC', title: 'Post-test', type: 'POST_TEST',
  attempts: [
    { registrationId: 'r1', status: 'GRADED', passed: false, percent: 50 },
    { registrationId: 'r1', status: 'GRADED', passed: true, percent: 90 },
    { registrationId: 'r2', status: 'GRADED', passed: false, percent: 40 },
    { registrationId: 'r3', status: 'IN_PROGRESS', passed: null, percent: null },
  ],
}];

const report = computeAnalytics({ trainings: [T1, T2, T3, T4], forms, responses, assessments, now });

describe('KPIs cross-checked against raw counts', () => {
  it('trainings, enrolments, sessions', () => {
    assert.equal(report.kpis.trainings, 2);        // T1, T2
    assert.equal(report.kpis.enrolments, 6);       // r1–r4, r6, r7
    assert.equal(report.kpis.sessionsHeld, 3);     // s1, s2, s3
  });
  it('attendance and no-shows', () => {
    // expected marks: T1 4 seats × 2 held = 8, T2 2 × 1 = 2 → 10; attended: r1 2, r2 1, r6 1 = 4
    assert.equal(report.kpis.expectedMarks, 10);
    assert.equal(report.kpis.attendedMarks, 4);
    assert.equal(report.kpis.attendanceRate, 40);
    // no-shows: r3, r4, r7 of 6 enrolments with held sessions
    assert.equal(report.kpis.noShows, 3);
    assert.equal(report.kpis.noShowRate, 50);
  });
  it('completion, certificates, CPD', () => {
    assert.equal(report.kpis.completed, 3);            // r1, r2, r6
    assert.equal(report.kpis.notCompleted, 1);         // r3
    assert.equal(report.kpis.completionRate, 75);      // 3 / 4
    assert.equal(report.kpis.certificates, 2);         // r1, r6 (r2 revoked)
    assert.equal(report.kpis.cpdHours, 14);            // 2×6 + 1×2
  });
  it('feedback and assessments', () => {
    assert.equal(report.kpis.feedbackResponses, 3);    // draft excluded
    assert.equal(report.kpis.averageRating, 4);        // (5+3+4)/3
    assert.equal(report.kpis.nps, 0);                  // 1 promoter, 1 detractor
    assert.deepEqual(report.assessments[0], { id: 'a1', title: 'Post-test', trainingId: 't1', trainingTitle: 'IPC', type: 'POST_TEST', takers: 2, passed: 1, passRate: 50, averageScore: 60 });
  });
  it('mandatory compliance', () => {
    assert.equal(report.compliance.assigned, 1);
    assert.equal(report.compliance.overdue, 1);
  });
});

describe('breakdowns', () => {
  it('department counts a multi-department training in each', () => {
    const nursing = report.byDepartment.find((d) => d.key === 'Nursing');
    const pharmacy = report.byDepartment.find((d) => d.key === 'Pharmacy');
    assert.equal(nursing.trainings, 2);
    assert.equal(nursing.enrolments, 6);
    assert.equal(pharmacy.trainings, 1);
    assert.equal(pharmacy.enrolments, 2);
  });
  it('month, category, target group', () => {
    assert.deepEqual(report.byMonth.map((m) => [m.key, m.enrolments]), [['2026-03', 4], ['2026-04', 2]]);
    assert.deepEqual(report.byCategory.map((c) => c.key).sort(), ['Clinical', 'Research']);
    assert.equal(report.byTargetGroup.find((g) => g.key === 'NURSES').completionRate, 66.7);
  });
});

describe('filters', () => {
  it('date range, department and target group', () => {
    const april = computeAnalytics({ trainings: [T1, T2], filters: { from: '2026-04-01', to: '2026-04-30' }, now });
    assert.equal(april.kpis.trainings, 1);
    const pharmacy = computeAnalytics({ trainings: [T1, T2], filters: { department: 'Pharmacy' }, now });
    assert.deepEqual(pharmacy.trainings.map((t) => t.id), ['t2']);
    const nurses = computeAnalytics({ trainings: [T1, T2], filters: { targetGroup: 'NURSES' }, now });
    assert.deepEqual(nurses.trainings.map((t) => t.id), ['t1']);
    assert.equal(matchesFilters({ status: 'DRAFT', startDate: '2026-01-01' }), false);
    assert.equal(monthKey('2026-12-31T23:00:00Z'), '2026-12');
  });
  it('options list every department and group', () => {
    assert.deepEqual(report.options.departments, ['Nursing', 'Pharmacy']);
  });
});

describe('export sheets', () => {
  it('has every section with rows', () => {
    const sheets = analyticsSheets(report);
    assert.deepEqual(Object.keys(sheets), ['Summary', 'Trainings', 'By month', 'By department', 'By target group', 'By category', 'Assessments']);
    assert.equal(sheets.Summary.find((r) => r.Measure === 'Enrolments').Value, 6);
    assert.equal(sheets.Trainings.length, 2);
  });
});
