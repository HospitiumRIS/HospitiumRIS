import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  analyticsSheets,
  capacityFigures,
  compareKpis,
  computeAnalyticsV2,
  facilitatorFigures,
  needsAttention,
  prePostGain,
  previousPeriod,
} from '../src/lib/training-analytics.js';

/*
 * Seeded data (#138), counted by hand.
 * Current period = 2026-04-01 .. 2026-04-30; previous = 2026-03-02 .. 2026-03-31 (same length).
 *  A (April, IN_PERSON, 10 places, ended 10 Apr): sessions a1, a2 held
 *     r1 COMPLETED, attended both, certificate ISSUED
 *     r2 COMPLETED, attended a1, NO certificate          -> needs attention: 1 without certificate
 *     r3 REGISTERED, absent both                          -> undecided (ended > 14 days before 1 May)
 *     r4 WAITLISTED, r5 CANCELLED, r6 PENDING_APPROVAL (ended: no approval item)
 *     facilitators: Anna (whole training), Ben (a2 only)
 *     pre-test: r1 40 then 60 (best 60), r2 50; post-test: r1 90, r2 70, r3 graded 30 (no pre)
 *     feedback form, 0 responses                          -> no feedback
 *  B (April, ONLINE, 4 places, ends 20 May): session b1 held 20 Apr
 *     r7 REGISTERED attended, r8 REGISTERED absent, r9 REGISTERED absent -> attendance 33.3% (low)
 *     r10 WAITLISTED                                      -> waiting while 1 place free
 *     r11 PENDING_APPROVAL                                -> request to approve (counts as a place: 4 taken)
 *  P (March, previous period): 2 enrolments, both COMPLETED, held 1 session, both attended
 */
const now = new Date('2026-05-01T00:00:00Z');
const A = {
  id: 'A', title: 'IPC', department: 'Nursing', category: 'Clinical', deliveryMode: 'IN_PERSON', status: 'COMPLETED',
  startDate: '2026-04-08T06:00:00Z', endDate: '2026-04-10T15:00:00Z', maxParticipants: 10, completionGraceDays: 7, hasFeedbackForm: true,
  sessions: [{ id: 'a1', status: 'SCHEDULED', startsAt: '2026-04-08T06:00:00Z' }, { id: 'a2', status: 'SCHEDULED', startsAt: '2026-04-09T06:00:00Z' }],
  facilitators: [{ key: 'anna', name: 'Anna', sessionId: null }, { key: 'ben', name: 'Ben', sessionId: 'a2' }],
  registrations: [
    { id: 'r1', status: 'COMPLETED', certificate: { status: 'ISSUED' }, attendance: [{ sessionId: 'a1', status: 'PRESENT' }, { sessionId: 'a2', status: 'PRESENT' }] },
    { id: 'r2', status: 'COMPLETED', attendance: [{ sessionId: 'a1', status: 'PRESENT' }] },
    { id: 'r3', status: 'REGISTERED', attendance: [{ sessionId: 'a1', status: 'ABSENT' }, { sessionId: 'a2', status: 'ABSENT' }] },
    { id: 'r4', status: 'WAITLISTED', attendance: [] },
    { id: 'r5', status: 'CANCELLED', attendance: [] },
    { id: 'r6', status: 'PENDING_APPROVAL', attendance: [] },
  ],
};
const B = {
  id: 'B', title: 'GCP', department: 'Research', deliveryMode: 'ONLINE', status: 'PUBLISHED',
  startDate: '2026-04-20T06:00:00Z', endDate: '2026-05-20T15:00:00Z', maxParticipants: 4, hasFeedbackForm: true,
  sessions: [{ id: 'b1', status: 'SCHEDULED', startsAt: '2026-04-20T06:00:00Z' }],
  facilitators: [{ key: 'anna', name: 'Anna', sessionId: null }],
  registrations: [
    { id: 'r7', status: 'REGISTERED', attendance: [{ sessionId: 'b1', status: 'PRESENT' }] },
    { id: 'r8', status: 'REGISTERED', attendance: [] },
    { id: 'r9', status: 'REGISTERED', attendance: [{ sessionId: 'b1', status: 'ABSENT' }] },
    { id: 'r10', status: 'WAITLISTED', attendance: [] },
    { id: 'r11', status: 'PENDING_APPROVAL', attendance: [] },
  ],
};
const P = {
  id: 'P', title: 'Old', department: 'Nursing', status: 'COMPLETED', startDate: '2026-03-10T06:00:00Z', endDate: '2026-03-10T15:00:00Z', maxParticipants: 5,
  sessions: [{ id: 'p1', status: 'SCHEDULED', startsAt: '2026-03-10T06:00:00Z' }],
  registrations: [
    { id: 'q1', status: 'COMPLETED', certificate: { status: 'ISSUED' }, attendance: [{ sessionId: 'p1', status: 'PRESENT' }] },
    { id: 'q2', status: 'COMPLETED', certificate: { status: 'ISSUED' }, attendance: [{ sessionId: 'p1', status: 'PRESENT' }] },
  ],
};
const assessments = [
  { id: 'pre', trainingId: 'A', trainingTitle: 'IPC', type: 'PRE_TEST', attempts: [
    { registrationId: 'r1', status: 'GRADED', percent: 40 }, { registrationId: 'r1', status: 'GRADED', percent: 60 }, { registrationId: 'r2', status: 'GRADED', percent: 50 },
  ] },
  { id: 'post', trainingId: 'A', trainingTitle: 'IPC', type: 'POST_TEST', attempts: [
    { registrationId: 'r1', status: 'GRADED', percent: 90, passed: true }, { registrationId: 'r2', status: 'GRADED', percent: 70, passed: true },
    { registrationId: 'r3', status: 'GRADED', percent: 30, passed: false }, { registrationId: 'r3', status: 'NEEDS_GRADING', percent: null },
  ] },
];
const filters = { from: new Date('2026-04-01T00:00:00Z'), to: new Date('2026-04-30T23:59:59.999Z') };
const report = computeAnalyticsV2({ trainings: [A, B, P], assessments, filters, now });

describe('previous period', () => {
  it('is the equal-length period just before', () => {
    const p = previousPeriod(filters.from, filters.to);
    assert.equal(p.to.toISOString(), '2026-03-31T23:59:59.999Z');
    assert.equal(p.from.toISOString(), '2026-03-02T00:00:00.000Z'); // same length as 1–30 April
  });
  it('KPIs compare against March', () => {
    assert.equal(report.kpis.enrolments, 6);                         // r1 r2 r3 + r7 r8 r9
    assert.equal(report.previousPeriod.kpis.enrolments, 2);          // q1 q2
    assert.deepEqual(report.comparison.enrolments, { value: 6, previous: 2, change: 200, unit: '%', direction: 'up', good: true });
    // attendance now: A 3 of 6, B 1 of 3 → 4/9 = 44.4%; before 100% → −55.6 pt, bad
    assert.equal(report.comparison.attendanceRate.change, -55.6);
    assert.equal(report.comparison.attendanceRate.unit, 'pt');
    assert.equal(report.comparison.attendanceRate.good, false);
    // no-show going up is bad
    assert.equal(report.comparison.noShowRate.direction, 'up');
    assert.equal(report.comparison.noShowRate.good, false);
  });
  it('nothing to compare when the previous value is 0', () => {
    const c = compareKpis({ certificates: 3 }, { certificates: 0 });
    assert.equal(c.certificates.change, null);
    assert.equal(c.certificates.unit, null);
  });
});

describe('capacity', () => {
  it('places, fill rate, waiting list, approvals, cancellations', () => {
    const c = report.capacity;
    assert.equal(c.offered, 14);         // 10 + 4
    assert.equal(c.taken, 8);            // A: r1 r2 r3 r6; B: r7 r8 r9 r11 (pending approvals hold a place)
    assert.equal(c.fillRate, 57.1);      // 8 / 14
    assert.equal(c.waitlisted, 2);
    assert.equal(c.pending, 2);
    assert.equal(c.cancelled, 1);
  });
});

describe('delivery mode', () => {
  it('breaks down by format', () => {
    assert.deepEqual(report.byDeliveryMode.map((m) => [m.key, m.enrolments]), [['IN_PERSON', 3], ['ONLINE', 3]]);
  });
});

describe('facilitators', () => {
  it('sessions and attendance in their own sessions', () => {
    const anna = report.facilitators.find((f) => f.key === 'anna');
    const ben = report.facilitators.find((f) => f.key === 'ben');
    assert.equal(anna.trainings, 2);
    assert.equal(anna.sessionsHeld, 3);          // a1 a2 b1
    assert.equal(anna.attendanceRate, 44.4);     // 4 / 9
    assert.equal(ben.sessionsHeld, 1);           // a2
    assert.equal(ben.attendanceRate, 33.3);      // a2: r1 only of 3
  });
  it('average rating of their trainings', () => {
    const f = facilitatorFigures([A], { A: 4.5 }, now);
    assert.equal(f[0].averageRating, 4.5);
  });
});

describe('pre/post-test gain', () => {
  it('pairs participants and uses their best scores', () => {
    const g = prePostGain(assessments);
    assert.deepEqual(g.trainings[0], { trainingId: 'A', trainingTitle: 'IPC', participants: 2, pre: 55, post: 80, gain: 25 });
    assert.equal(g.averageGain, 25);
    assert.equal(prePostGain([]).averageGain, null);
  });
});

describe('needs attention', () => {
  it('lists each actionable item with a link to the fix', () => {
    const kinds = report.attention.map((a) => `${a.kind}:${a.trainingId}:${a.count}`);
    assert.deepEqual(kinds.sort(), [
      'LOW_ATTENDANCE:A:1',
      'LOW_ATTENDANCE:B:2',
      'NEEDS_GRADING:A:1',
      'NO_CERTIFICATE:A:1',
      'NO_FEEDBACK:A:3',
      'PENDING_APPROVAL:B:1',
      'UNDECIDED:A:1',
    ].sort());
    const cert = report.attention.find((a) => a.kind === 'NO_CERTIFICATE');
    assert.equal(cert.href, '/institution/training/A?tab=certificates');
    assert.equal(report.attention[0].severity, 'high');
  });
  it('waiting list while places are free, and overdue mandatory', () => {
    const roomy = { ...B, maxParticipants: 6 };
    const items = needsAttention({ trainings: [roomy], compliance: { overdue: 2 }, now });
    assert.ok(items.some((i) => i.kind === 'WAITLIST_WITH_PLACES' && i.count === 1));
    assert.equal(items[0].kind, 'OVERDUE_MANDATORY');
    assert.equal(items[0].href, '/institution/training/compliance');
  });
  it('nothing for a healthy training', () => {
    assert.deepEqual(needsAttention({ trainings: [P], now }), []);
  });
});

describe('export', () => {
  it('adds the v2 sheets and the comparison columns', () => {
    const sheets = analyticsSheets(report);
    for (const name of ['By delivery mode', 'Capacity', 'Facilitators', 'Pre-post gain', 'Needs attention']) assert.ok(sheets[name], name);
    const row = sheets.Summary.find((r) => r.Measure === 'Enrolments');
    assert.equal(row['Previous period'], 2);
    assert.equal(row.Change, '+200%');
  });
});

describe('capacity helper alone', () => {
  it('fill rate', () => {
    assert.equal(capacityFigures([{ id: 'x', maxParticipants: 4, registrations: [{ status: 'REGISTERED' }, { status: 'COMPLETED' }] }]).fillRate, 50);
  });
});

import { monthlyReportDue } from '../src/lib/training-analytics.js';

describe('monthly email (#138 acceptance: once per person per month)', () => {
  it('reports the previous month once', () => {
    const now = new Date('2026-12-03T08:00:00Z');
    const first = monthlyReportDue(null, now);
    assert.deepEqual([first.due, first.period, first.from.toISOString(), first.to.toISOString()], [true, '2026-11', '2026-11-01T00:00:00.000Z', '2026-11-30T23:59:59.999Z']);
    assert.equal(monthlyReportDue('2026-11', now).due, false);                       // already sent
    assert.equal(monthlyReportDue('2026-11', new Date('2026-12-31T23:00:00Z')).due, false);
    assert.equal(monthlyReportDue('2026-11', new Date('2027-01-01T00:30:00Z')).due, true); // next month
    assert.equal(monthlyReportDue(null, new Date('2027-01-05T00:00:00Z')).period, '2026-12');
  });
});
