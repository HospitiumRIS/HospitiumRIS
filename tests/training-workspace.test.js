import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { nextSession, participantTimeline, setupChecklist, trainingPhase, untilLabel, workspaceStats } from '../src/lib/training-workspace.js';

const now = new Date('2026-11-24T09:00:00Z');
const T = (extra = {}) => ({ status: 'PUBLISHED', startDate: '2026-11-30T06:00:00Z', endDate: '2026-12-02T15:00:00Z', maxParticipants: 30, description: 'A practical introduction to Good Clinical Practice for study teams.', ...extra });

describe('trainingPhase', () => {
  it('follows status and dates', () => {
    assert.equal(trainingPhase(T({ status: 'DRAFT' }), now), 'draft');
    assert.equal(trainingPhase(T({ status: 'CANCELLED' }), now), 'cancelled');
    assert.equal(trainingPhase(T(), now), 'upcoming');
    assert.equal(trainingPhase(T({ startDate: '2026-11-23' }), now), 'running');
    assert.equal(trainingPhase(T({ startDate: '2026-11-01', endDate: '2026-11-02' }), now), 'ended');
    assert.equal(trainingPhase(T({ status: 'COMPLETED' }), now), 'ended');
  });
});

describe('workspaceStats', () => {
  it('counts seats, attendance, completion and certificates', () => {
    const s = workspaceStats({
      training: T(),
      registrations: [
        { status: 'COMPLETED', attendancePercent: 100, certificate: { status: 'ISSUED' } },
        { status: 'COMPLETED', attendancePercent: 80 },
        { status: 'NOT_COMPLETED', attendancePercent: 30 },
        { status: 'REGISTERED', attendancePercent: null },
        { status: 'WAITLISTED' },
        { status: 'PENDING_APPROVAL' },
        { status: 'CANCELLED', attendancePercent: 0 },
      ],
      feedback: { responses: 2, averageRating: 4.5 },
    });
    assert.deepEqual(
      [s.seated, s.fillRate, s.waitlisted, s.pending, s.attendance, s.completionRate, s.certificates, s.certificatesDue, s.rating],
      [4, 13, 1, 1, 70, 67, 1, 1, 4.5],
    );
  });
  it('no data gives nulls, not zeros', () => {
    const s = workspaceStats({ training: T({ maxParticipants: 0 }) });
    assert.deepEqual([s.fillRate, s.attendance, s.completionRate], [null, null, null]);
  });
});

describe('nextSession', () => {
  const sessions = [
    { id: 'a', status: 'SCHEDULED', startsAt: '2026-11-24T08:00:00Z', endsAt: '2026-11-24T08:30:00Z' },
    { id: 'b', status: 'SCHEDULED', startsAt: '2026-11-24T11:15:00Z', endsAt: '2026-11-24T13:00:00Z' },
    { id: 'c', status: 'SCHEDULED', startsAt: '2026-11-27T08:00:00Z', endsAt: '2026-11-27T12:00:00Z' },
    { id: 'x', status: 'CANCELLED', startsAt: '2026-11-24T10:00:00Z', endsAt: '2026-11-24T11:00:00Z' },
  ];
  it('skips past and cancelled sessions', () => {
    const n = nextSession(sessions, now);
    assert.deepEqual([n.id, n.state, n.minutesUntil, n.index, n.checkInOpen], ['b', 'today', 135, 2, false]);
    assert.equal(untilLabel(n.minutesUntil), 'in 2 h 15 min');
  });
  it('live and check-in window', () => {
    const n = nextSession(sessions, new Date('2026-11-24T11:20:00Z'));
    assert.deepEqual([n.id, n.state, n.checkInOpen], ['b', 'live', true]);
    assert.equal(nextSession(sessions, new Date('2026-12-01')), null);
    assert.equal(untilLabel(3 * 24 * 60), 'in 3 days');
    assert.equal(untilLabel(0), 'now');
  });
});

describe('setupChecklist', () => {
  it('a fresh draft: what is missing and what is next', () => {
    const c = setupChecklist({ training: T({ status: 'DRAFT', description: '' }), sessions: [], modules: [], assessments: [], stats: {} }, now);
    assert.equal(c.phase, 'draft');
    assert.deepEqual(c.items.map((i) => i.key), ['description', 'sessions', 'modules', 'facilitators', 'rules', 'feedback', 'publish']);
    assert.equal(c.next.key, 'description');
    // optional items not done are left out of the count
    assert.deepEqual([c.done, c.total], [0, 5]);
  });
  it('required assessment appears when the rules need it', () => {
    const c = setupChecklist({ training: T({ requireAssessmentPass: true }), assessments: [{ isPublished: false, isRequiredForCompletion: true }], stats: { seated: 1, capacity: 30 } }, now);
    const a = c.items.find((i) => i.key === 'assessment');
    assert.deepEqual([a.done, a.detail], [false, '0 of 1 published']);
    assert.equal(c.items.find((i) => i.key === 'enrolment').done, true);
  });
  it('after the end: attendance, grading, completion, certificates', () => {
    const c = setupChecklist({
      training: T({ startDate: '2026-11-01', endDate: '2026-11-02', minAttendancePercent: 80 }),
      sessions: [
        { status: 'SCHEDULED', startsAt: '2026-11-01T08:00:00Z', endsAt: '2026-11-01T12:00:00Z', attendanceCount: 10 },
        { status: 'SCHEDULED', startsAt: '2026-11-02T08:00:00Z', endsAt: '2026-11-02T12:00:00Z', attendanceCount: 0 },
      ],
      modules: [{ status: 'ACTIVE' }],
      feedbackForm: true,
      facilitators: 1,
      stats: { seated: 10, capacity: 30, pending: 0, certificatesDue: 3, certificates: 5 },
      needsGrading: 2,
      undecided: 1,
    }, now);
    const by = Object.fromEntries(c.items.map((i) => [i.key, i]));
    assert.equal(c.phase, 'ended');
    assert.equal(by.attendance.detail, '1 held session(s) with no attendance');
    assert.deepEqual([by.grading.done, by.completion.done, by.certificates.detail], [false, false, '3 completed without a certificate']);
    assert.equal(c.next.key, 'attendance');
  });
  it('everything done is 100%', () => {
    const c = setupChecklist({ training: T({ minAttendancePercent: 80 }), sessions: [{ status: 'SCHEDULED', startsAt: '2026-11-30', endsAt: '2026-11-30T12:00:00Z' }], modules: [{ status: 'ACTIVE' }], feedbackForm: true, facilitators: 2, stats: { seated: 3, capacity: 30 } }, now);
    assert.deepEqual([c.percent, c.next], [100, null]);
  });
});

describe('participantTimeline', () => {
  it('orders newest first and drops audit duplicates', () => {
    const t = participantTimeline({
      registration: { registeredAt: '2026-11-01T08:00:00Z', source: 'ASSIGNED', status: 'COMPLETED', completedAt: '2026-11-20T08:00:00Z' },
      attempts: [{ assessmentTitle: 'Final quiz', attemptNumber: 1, submittedAt: '2026-11-10T08:00:00Z', passed: true, percent: 85 }],
      certificate: { issuedAt: '2026-11-21T08:00:00Z', certificateNumber: 'HRIS-1' },
      audit: [{ createdAt: '2026-11-20T08:00:30Z', label: 'Completed', actor: null }],
    });
    assert.deepEqual(t.map((e) => e.label), ['Certificate HRIS-1 issued', 'Completed', 'Final quiz: attempt 1 passed (85%)', 'Assigned']);
  });
});
