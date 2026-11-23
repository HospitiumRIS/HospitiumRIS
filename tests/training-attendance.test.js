import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  bulkMarkRecords,
  computeAttendance,
  countedSessions,
  sessionAttendanceSummary,
  validateAttendanceUpdate,
} from '../src/lib/training-attendance.js';

const now = new Date('2026-12-05T12:00:00Z');
const s = (id, startsAt, extra = {}) => ({ id, startsAt, status: 'SCHEDULED', isAttendanceRequired: true, ...extra });
const sessions = [
  s('s1', '2026-12-01T06:00:00Z'),
  s('s2', '2026-12-02T06:00:00Z'),
  s('s3', '2026-12-03T06:00:00Z'),
  s('s4', '2026-12-04T06:00:00Z'),
  s('s5', '2026-12-04T13:00:00Z', { isAttendanceRequired: false }),
  s('s6', '2026-12-04T15:00:00Z', { status: 'CANCELLED' }),
  s('s7', '2026-12-09T06:00:00Z'), // future
];

describe('countedSessions', () => {
  it('counts scheduled, required sessions that have started', () => {
    assert.deepEqual(countedSessions(sessions, now).map((x) => x.id), ['s1', 's2', 's3', 's4']);
  });
});

describe('computeAttendance', () => {
  it('present and late count as attended', () => {
    const r = computeAttendance(sessions, [
      { sessionId: 's1', status: 'PRESENT' },
      { sessionId: 's2', status: 'LATE' },
      { sessionId: 's3', status: 'ABSENT' },
      { sessionId: 's4', status: 'PRESENT' },
    ], { now });
    assert.equal(r.percent, 75);
    assert.equal(r.attended, 3);
    assert.equal(r.late, 1);
    assert.equal(r.absent, 1);
  });

  it('excused sessions leave the denominator by default (D5)', () => {
    const records = [
      { sessionId: 's1', status: 'PRESENT' },
      { sessionId: 's2', status: 'PRESENT' },
      { sessionId: 's3', status: 'PRESENT' },
      { sessionId: 's4', status: 'EXCUSED' },
    ];
    assert.equal(computeAttendance(sessions, records, { now }).percent, 100);
    assert.equal(computeAttendance(sessions, records, { now, excludeExcused: false }).percent, 75);
  });

  it('unmarked held sessions count as missed; optional, cancelled and future ones are ignored', () => {
    const r = computeAttendance(sessions, [
      { sessionId: 's1', status: 'PRESENT' },
      { sessionId: 's5', status: 'PRESENT' },
      { sessionId: 's7', status: 'PRESENT' },
    ], { now });
    assert.equal(r.percent, 25);
    assert.equal(r.unmarked, 3);
    assert.equal(r.counted, 4);
  });

  it('returns null before any session has been held, 100 when all held ones are excused', () => {
    assert.equal(computeAttendance(sessions, [], { now: new Date('2026-11-01') }).percent, null);
    const allExcused = ['s1', 's2', 's3', 's4'].map((sessionId) => ({ sessionId, status: 'EXCUSED' }));
    assert.equal(computeAttendance(sessions, allExcused, { now }).percent, 100);
  });

  it('rounds to one decimal', () => {
    const three = sessions.slice(0, 3);
    const r = computeAttendance(three, [{ sessionId: 's1', status: 'PRESENT' }], { now });
    assert.equal(r.percent, 33.3);
  });
});

describe('sessionAttendanceSummary', () => {
  it('totals a session and its rate over active registrations', () => {
    const records = [
      { sessionId: 's1', status: 'PRESENT' },
      { sessionId: 's1', status: 'LATE' },
      { sessionId: 's1', status: 'ABSENT' },
      { sessionId: 's2', status: 'PRESENT' },
    ];
    assert.deepEqual(sessionAttendanceSummary(sessions[0], records, 4),
      { present: 1, late: 1, absent: 1, excused: 0, unmarked: 1, rate: 50 });
    assert.equal(sessionAttendanceSummary(sessions[0], [], 0).rate, null);
  });
});

describe('validateAttendanceUpdate', () => {
  const active = new Set(['r1', 'r2']);

  it('splits upserts and clears and trims notes', () => {
    const r = validateAttendanceUpdate({ records: [
      { registrationId: 'r1', status: 'PRESENT', note: '  arrived early ' },
      { registrationId: 'r2', status: null },
    ] }, active);
    assert.equal(r.ok, true);
    assert.deepEqual(r.upserts, [{ registrationId: 'r1', status: 'PRESENT', note: 'arrived early' }]);
    assert.deepEqual(r.clears, ['r2']);
  });

  it('rejects unknown participants, duplicates, bad statuses and empty bodies', () => {
    assert.equal(validateAttendanceUpdate({ records: [{ registrationId: 'rX', status: 'PRESENT' }] }, active).ok, false);
    assert.equal(validateAttendanceUpdate({ records: [{ registrationId: 'r1', status: 'PRESENT' }, { registrationId: 'r1', status: 'LATE' }] }, active).ok, false);
    assert.match(validateAttendanceUpdate({ records: [{ registrationId: 'r1', status: 'HERE' }] }, active).error, /Invalid attendance status/);
    assert.equal(validateAttendanceUpdate({}, active).ok, false);
  });
});

describe('bulkMarkRecords', () => {
  it('marks everyone present, or only unmarked people absent', () => {
    const existing = new Map([['r1', 'PRESENT']]);
    assert.equal(bulkMarkRecords('all-present', ['r1', 'r2'], existing).length, 2);
    assert.deepEqual(bulkMarkRecords('remaining-absent', ['r1', 'r2'], existing), [{ registrationId: 'r2', status: 'ABSENT' }]);
    assert.deepEqual(bulkMarkRecords('nope', ['r1'], existing), []);
  });
});
