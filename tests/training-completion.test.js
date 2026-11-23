import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  decideCompletionStatus,
  evaluateCompletion,
  hasCompletionRules,
  modulesCompletedByAttendance,
  validateCompletionRules,
} from '../src/lib/training-completion.js';

const modules = [
  { id: 'm1', title: 'Consent', isRequired: true, status: 'ACTIVE' },
  { id: 'm2', title: 'Data', isRequired: true, status: 'ACTIVE' },
  { id: 'm3', title: 'Extra', isRequired: false, status: 'ACTIVE' },
  { id: 'm4', title: 'Old', isRequired: true, status: 'INACTIVE' },
];

describe('evaluateCompletion', () => {
  it('has no rules by default (manual completion, as today)', () => {
    const r = evaluateCompletion({}, { attendancePercent: 10 });
    assert.equal(r.hasRules, false);
    assert.equal(r.eligible, false);
    assert.equal(hasCompletionRules({ minAttendancePercent: null }), false);
    assert.equal(hasCompletionRules({ minAttendancePercent: 80 }), true);
  });

  it('checks attendance against the minimum', () => {
    const t = { minAttendancePercent: 80 };
    assert.equal(evaluateCompletion(t, { attendancePercent: 80 }).eligible, true);
    assert.equal(evaluateCompletion(t, { attendancePercent: 79.9 }).eligible, false);
    const none = evaluateCompletion(t, { attendancePercent: null });
    assert.equal(none.eligible, false);
    assert.match(none.checks[0].detail, /No session held/);
  });

  it('requires all required, active modules and lists what is missing', () => {
    const t = { requireAllModules: true };
    const partial = evaluateCompletion(t, { modules, progress: { m1: 'COMPLETED', m3: 'COMPLETED' } });
    assert.equal(partial.eligible, false);
    assert.deepEqual(partial.checks[0].missing, ['Data']);
    assert.equal(partial.checks[0].detail, '1 of 2 completed');
    assert.equal(evaluateCompletion(t, { modules, progress: new Map([['m1', 'COMPLETED'], ['m2', 'COMPLETED']]) }).eligible, true);
  });

  it('combines rules: all must be met', () => {
    const t = { minAttendancePercent: 75, requireAllModules: true };
    const facts = { attendancePercent: 90, modules, progress: { m1: 'COMPLETED' } };
    const r = evaluateCompletion(t, facts);
    assert.equal(r.checks.length, 2);
    assert.equal(r.eligible, false);
    assert.equal(evaluateCompletion(t, { ...facts, progress: { m1: 'COMPLETED', m2: 'COMPLETED' } }).eligible, true);
  });

  it('assessment and feedback rules wait for their features to be set up', () => {
    const t = { requireAssessmentPass: true, requireFeedback: true };
    assert.equal(evaluateCompletion(t, {}).eligible, true); // nothing set up yet
    assert.equal(evaluateCompletion(t, { assessments: { required: 1, passed: 0 }, feedbackAvailable: true }).eligible, false);
    assert.equal(evaluateCompletion(t, { assessments: { required: 1, passed: 1 }, feedbackAvailable: true, feedbackSubmitted: true }).eligible, true);
  });
});

describe('decideCompletionStatus', () => {
  const training = { minAttendancePercent: 80, endDate: '2026-12-03T14:00:00Z', completionGraceDays: 7 };
  const eligible = { hasRules: true, eligible: true };
  const notMet = { hasRules: true, eligible: false };
  const during = new Date('2026-12-02T10:00:00Z');
  const justAfter = new Date('2026-12-04T10:00:00Z');
  const afterGrace = new Date('2026-12-11T10:00:00Z');
  const reg = (status, extra = {}) => ({ status, ...extra });

  it('never finalises while the training is running', () => {
    assert.equal(decideCompletionStatus(training, reg('REGISTERED'), eligible, during), null);
  });

  it('completes eligible participants once the training has ended', () => {
    assert.equal(decideCompletionStatus(training, reg('REGISTERED'), eligible, justAfter), 'COMPLETED');
    assert.equal(decideCompletionStatus(training, reg('NOT_COMPLETED'), eligible, afterGrace), 'COMPLETED');
    assert.equal(decideCompletionStatus(training, reg('COMPLETED'), eligible, justAfter), null);
  });

  it('marks NOT_COMPLETED only after the grace period', () => {
    assert.equal(decideCompletionStatus(training, reg('REGISTERED'), notMet, justAfter), null);
    assert.equal(decideCompletionStatus(training, reg('REGISTERED'), notMet, afterGrace), 'NOT_COMPLETED');
  });

  it('reopens an automatic completion that no longer holds during the grace period', () => {
    assert.equal(decideCompletionStatus(training, reg('COMPLETED'), notMet, justAfter), 'REGISTERED');
    assert.equal(decideCompletionStatus(training, reg('COMPLETED'), notMet, afterGrace), null);
  });

  it('respects overrides, cancelled registrations and trainings without rules', () => {
    assert.equal(decideCompletionStatus(training, reg('REGISTERED', { completionOverride: { type: 'INCOMPLETE' } }), eligible, justAfter), null);
    assert.equal(decideCompletionStatus(training, reg('CANCELLED'), eligible, justAfter), null);
    assert.equal(decideCompletionStatus(training, reg('REGISTERED'), { hasRules: false, eligible: false }, afterGrace), null);
  });
});

describe('modulesCompletedByAttendance', () => {
  const now = new Date('2026-12-05T00:00:00Z');
  const mods = [{ id: 'm1', completionMode: 'ON_SESSION_ATTENDANCE' }, { id: 'm2', completionMode: 'ON_SESSION_ATTENDANCE' }, { id: 'm3', completionMode: 'SELF' }];
  const sessions = [
    { id: 's1', moduleId: 'm1', status: 'SCHEDULED', startsAt: '2026-12-01T06:00:00Z' },
    { id: 's2', moduleId: 'm1', status: 'SCHEDULED', startsAt: '2026-12-02T06:00:00Z' },
    { id: 's3', moduleId: 'm1', status: 'CANCELLED', startsAt: '2026-12-03T06:00:00Z' },
    { id: 's4', moduleId: 'm2', status: 'SCHEDULED', startsAt: '2026-12-09T06:00:00Z' },
    { id: 's5', moduleId: 'm3', status: 'SCHEDULED', startsAt: '2026-12-01T06:00:00Z' },
  ];

  it('completes a module once all its held sessions were attended', () => {
    assert.deepEqual(modulesCompletedByAttendance(mods, sessions, [{ sessionId: 's1', status: 'PRESENT' }], now), []);
    assert.deepEqual(modulesCompletedByAttendance(mods, sessions, [
      { sessionId: 's1', status: 'PRESENT' },
      { sessionId: 's2', status: 'LATE' },
      { sessionId: 's5', status: 'PRESENT' },
    ], now), ['m1']);
  });
});

describe('validateCompletionRules', () => {
  it('accepts valid values and clears the minimum', () => {
    assert.deepEqual(validateCompletionRules({ minAttendancePercent: 80, requireAllModules: true, completionGraceDays: 3 }).data,
      { minAttendancePercent: 80, requireAllModules: true, completionGraceDays: 3 });
    assert.deepEqual(validateCompletionRules({ minAttendancePercent: '' }).data, { minAttendancePercent: null });
  });

  it('rejects out-of-range values', () => {
    assert.equal(validateCompletionRules({ minAttendancePercent: 120 }).ok, false);
    assert.equal(validateCompletionRules({ minAttendancePercent: 50.5 }).ok, false);
    assert.equal(validateCompletionRules({ completionGraceDays: -1 }).ok, false);
  });
});
