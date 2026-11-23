import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildTodos, cpdForYear, filterCatalogue, upcomingSessions } from '../src/lib/training-hub.js';

const now = new Date('2026-12-01T09:00:00Z');
const at = (min) => new Date(now.getTime() + min * 60 * 1000).toISOString();
const days = (d) => at(d * 24 * 60);

describe('upcomingSessions', () => {
  const items = [{
    training: { id: 't1', title: 'Infection control' },
    attendance: [{ sessionId: 's0', status: 'PRESENT' }],
    sessions: [
      { id: 's0', title: 'Past', status: 'SCHEDULED', startsAt: at(-180), endsAt: at(-120), deliveryMode: 'IN_PERSON' },
      { id: 's1', title: 'Now', status: 'SCHEDULED', startsAt: at(5), endsAt: at(65), deliveryMode: 'IN_PERSON' },
      { id: 's2', title: 'Online', status: 'SCHEDULED', startsAt: at(10), endsAt: at(70), deliveryMode: 'ONLINE', hasOnlineLink: true },
      { id: 's3', title: 'Later', status: 'SCHEDULED', startsAt: days(3), endsAt: days(3.1), deliveryMode: 'IN_PERSON' },
      { id: 's4', title: 'Cancelled', status: 'CANCELLED', startsAt: days(1), endsAt: days(1.1) },
    ],
  }];
  it('skips ended and cancelled sessions, sorts and flags windows', () => {
    const list = upcomingSessions(items, now);
    assert.deepEqual(list.map((s) => s.id), ['s1', 's2', 's3']);
    assert.equal(list[0].checkInOpen, true);
    assert.equal(list[1].checkInOpen, false); // online: no QR check-in
    assert.equal(list[1].joinOpen, true);
    assert.equal(list[2].checkInOpen, false);
  });
});

describe('buildTodos', () => {
  const training = { id: 't1', title: 'Infection control', endDate: days(-2) };
  it('orders overdue, check-in, assessments, feedback, waiting', () => {
    const todos = buildTodos({
      registrations: [
        { id: 'r1', status: 'REGISTERED', source: 'ASSIGNED', dueDate: days(-3), training, hasFeedbackForm: true, feedbackSubmitted: false },
        { id: 'r2', status: 'WAITLISTED', training: { id: 't2', title: 'BLS' } },
      ],
      sessions: [{ id: 's1', title: 'Day 2', trainingId: 't1', trainingTitle: 'Infection control', checkInOpen: true }],
      assessments: [{ id: 'a1', trainingId: 't1', title: 'Post-test', isPublished: true, type: 'POST_TEST', isRequiredForCompletion: true, attempts: [] }],
    }, now);
    assert.deepEqual(todos.map((t) => t.kind), ['MANDATORY_OVERDUE', 'CHECK_IN', 'ASSESSMENT', 'FEEDBACK', 'WAITING']);
    assert.equal(todos.find((t) => t.kind === 'ASSESSMENT').href, '/researcher/training/assessment/t1/a1');
  });
  it('drops passed or closed assessments, sent feedback and cancelled registrations', () => {
    const todos = buildTodos({
      registrations: [
        { id: 'r1', status: 'REGISTERED', training, hasFeedbackForm: true, feedbackSubmitted: true },
        { id: 'r3', status: 'CANCELLED', training: { id: 't3', title: 'X' }, source: 'ASSIGNED', dueDate: days(-3) },
      ],
      assessments: [
        { id: 'a1', trainingId: 't1', title: 'Passed', isPublished: true, type: 'QUIZ', attempts: [{ status: 'GRADED', passed: true }] },
        { id: 'a2', trainingId: 't1', title: 'Closed', isPublished: true, type: 'QUIZ', availableUntil: days(-1), attempts: [] },
        { id: 'a3', trainingId: 't3', title: 'Not mine', isPublished: true, type: 'QUIZ', attempts: [] },
      ],
    }, now);
    assert.deepEqual(todos, []);
  });
  it('re-training and due soon', () => {
    const todos = buildTodos({
      registrations: [
        { id: 'r1', status: 'COMPLETED', training, certificate: { id: 'c', expiresAt: days(-1) } },
        { id: 'r2', status: 'REGISTERED', source: 'ASSIGNED', dueDate: days(5), training: { id: 't2', title: 'BLS', endDate: days(10) } },
      ],
    }, now);
    assert.deepEqual(todos.map((t) => t.kind), ['RETRAINING', 'MANDATORY_DUE']);
  });
});

describe('cpdForYear', () => {
  it('sums completed trainings of the year only', () => {
    const cpd = cpdForYear([
      { status: 'COMPLETED', completedAt: '2026-03-01', training: { id: 'a', title: 'A', cpdHours: 6, cpdPoints: 2 } },
      { status: 'COMPLETED', completedAt: '2026-08-01', training: { id: 'b', title: 'B', cpdHours: 1.5 } },
      { status: 'COMPLETED', completedAt: '2025-12-30', training: { id: 'c', title: 'C', cpdHours: 10 } },
      { status: 'REGISTERED', completedAt: null, training: { id: 'd', title: 'D', cpdHours: 10 } },
      { status: 'COMPLETED', completedAt: '2026-01-02', training: { id: 'e', title: 'E' } },
    ], 2026);
    assert.equal(cpd.hours, 7.5);
    assert.equal(cpd.points, 2);
    assert.deepEqual(cpd.trainings.map((t) => t.id), ['a', 'b']);
  });
});

describe('filterCatalogue', () => {
  const list = [
    { id: '1', title: 'Hand hygiene', department: 'Nursing, Pharmacy', category: 'Clinical', deliveryMode: 'IN_PERSON', startDate: days(3), cpdHours: 2, remainingSlots: 5, eligibility: { ok: true } },
    { id: '2', title: 'GCP refresher', department: 'Research', category: 'Research', deliveryMode: 'ONLINE', startDate: days(40), remainingSlots: 0, waitlistEnabled: false, eligibility: { ok: false } },
    { id: '3', title: 'Data protection', department: 'Admin', deliveryMode: 'HYBRID', startDate: days(100), remainingSlots: 0, waitlistEnabled: true },
  ];
  const ids = (f) => filterCatalogue(list, f, now).map((t) => t.id);
  it('search, department (multi), category, mode', () => {
    assert.deepEqual(ids({ search: 'gcp' }), ['2']);
    assert.deepEqual(ids({ department: 'Pharmacy' }), ['1']);
    assert.deepEqual(ids({ category: 'Research' }), ['2']);
    assert.deepEqual(ids({ mode: 'HYBRID' }), ['3']);
  });
  it('dates, CPD, eligibility and open places', () => {
    assert.deepEqual(ids({ date: 'week' }), ['1']);
    assert.deepEqual(ids({ date: 'quarter' }), ['1', '2']);
    assert.deepEqual(ids({ cpdOnly: true }), ['1']);
    assert.deepEqual(ids({ eligibleOnly: true }), ['1', '3']);
    assert.deepEqual(ids({ openOnly: true }), ['1', '3']);
  });
});
