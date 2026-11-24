import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { courseKey, exportRows, filterRows, groupByCourse, manageAttention, manageRow, manageStats, monthGrid, sortRows, tabCounts, upcomingSessions } from '../src/lib/training-manage.js';

const now = new Date('2026-11-24T09:00:00Z');
const T = (id, extra = {}) => ({ id, title: 'GCP for research teams', status: 'PUBLISHED', startDate: '2026-12-01T06:00:00Z', endDate: '2026-12-02T15:00:00Z', maxParticipants: 20, department: 'Nursing, Pharmacy', description: 'A practical introduction to Good Clinical Practice for teams.', ...extra });
const reg = (status, extra = {}) => ({ status, attendancePercent: null, ...extra });

describe('courseKey', () => {
  it('code first, else normalised title', () => {
    assert.equal(courseKey({ code: ' GCP-01 ', title: 'x' }), 'code:gcp-01');
    assert.equal(courseKey({ title: '  GCP  for Teams' }), courseKey({ title: 'gcp for teams' }));
  });
});

describe('manageRow', () => {
  it('upcoming with approvals pending', () => {
    const r = manageRow(T('a'), { registrations: [reg('REGISTERED'), reg('REGISTERED'), reg('PENDING_APPROVAL'), reg('WAITLISTED'), reg('CANCELLED')], sessions: [{ id: 's', title: 'Day 1', status: 'SCHEDULED', startsAt: '2026-12-01T06:00:00Z', endsAt: '2026-12-01T12:00:00Z' }] }, now);
    assert.deepEqual([r.phase, r.seated, r.pending, r.waitlisted, r.fillRate, r.activeRegistrations, r.sessionsCount, r.alertTotal], ['upcoming', 2, 1, 1, 10, 4, 1, 1]);
    assert.equal(r.nextSession.id, 's');
  });
  it('ended: unmarked sessions, undecided, certificates due', () => {
    const r = manageRow(T('b', { startDate: '2026-11-01', endDate: '2026-11-02', minAttendancePercent: 80 }), {
      registrations: [reg('REGISTERED'), reg('COMPLETED'), reg('COMPLETED', { certificate: { status: 'ISSUED' } })],
      sessions: [{ id: 's1', status: 'SCHEDULED', startsAt: '2026-11-01T06:00:00Z', endsAt: '2026-11-01T12:00:00Z', attendanceCount: 0 }],
      needsGrading: 2,
    }, now);
    assert.deepEqual(r.alerts, { pending: 0, unmarked: 1, needsGrading: 2, undecided: 1, certificatesDue: 1 });
    assert.equal(r.alertTotal, 5);
  });
  it('cancelled trainings have nothing to act on', () => {
    const r = manageRow(T('c', { status: 'CANCELLED' }), { registrations: [reg('PENDING_APPROVAL')] }, now);
    assert.deepEqual([r.phase, r.alertTotal], ['cancelled', 0]);
  });
});

const rows = [
  manageRow(T('up1', { code: 'GCP' }), { registrations: [reg('REGISTERED'), reg('PENDING_APPROVAL')] }, now),
  manageRow(T('up2', { code: 'GCP', startDate: '2027-02-01', endDate: '2027-02-02' }), { registrations: [] }, now),
  manageRow(T('run', { title: 'BLS', startDate: '2026-11-23', endDate: '2026-11-25', maxParticipants: 10, category: 'Emergency' }), { registrations: Array.from({ length: 8 }, () => reg('REGISTERED')) }, now),
  manageRow(T('draft', { title: 'IPC', status: 'DRAFT', startDate: '2026-11-30', endDate: '2026-11-30' }), {}, now),
  manageRow(T('old', { title: 'Ethics', startDate: '2026-10-01', endDate: '2026-10-02' }), {}, now),
  manageRow(T('x', { title: 'Fire', status: 'CANCELLED' }), {}, now),
];

describe('list figures', () => {
  it('tab counts and stats', () => {
    assert.deepEqual(tabCounts(rows), { upcoming: 2, running: 1, draft: 1, ended: 1, cancelled: 1, all: 6 });
    const s = manageStats(rows, now);
    // live: up1 (1/20), up2 (0/20), run (8/10) → 9 of 50
    assert.deepEqual([s.upcoming, s.startingIn30, s.running, s.drafts, s.enrolled, s.waiting, s.fillRate], [2, 1, 1, 1, 9, 1, 18]);
  });
  it('needs attention: drafts close to start, approvals, empty schedules, low enrolment', () => {
    const items = manageAttention(rows, now);
    assert.deepEqual(items.map((i) => `${i.kind}:${i.trainingId}`), ['PENDING:up1', 'DRAFT_SOON:draft', 'NO_SESSIONS:up1', 'LOW_ENROLMENT:up1']);
    assert.equal(items[0].href, '/institution/training/up1?tab=registrations');
    assert.equal(items[1].title, 'Still a draft, starts in 6 days');
  });
  it('filters, sort and course groups', () => {
    assert.deepEqual(filterRows(rows, { tab: 'upcoming' }).map((r) => r.id), ['up1', 'up2']);
    assert.deepEqual(filterRows(rows, { department: 'Pharmacy', search: 'bls' }).map((r) => r.id), ['run']);
    assert.deepEqual(filterRows(rows, { category: 'Emergency' }).map((r) => r.id), ['run']);
    assert.deepEqual(sortRows(filterRows(rows, { tab: 'upcoming' }), 'upcoming').map((r) => r.id), ['up1', 'up2']);
    const groups = groupByCourse(rows);
    assert.equal(groups[0].key, 'code:gcp');
    assert.deepEqual([groups[0].cohorts, groups[0].seated, groups[0].capacity, groups[0].next.id], [2, 1, 40, 'up1']);
  });
  it('export rows', () => {
    const x = exportRows(rows).find((r) => r.Training === 'BLS');
    assert.deepEqual([x.Status, x.Enrolled, x['Fill %'], x.Category], ['Running', 8, 80, 'Emergency']);
  });
});

describe('upcomingSessions', () => {
  it('next 7 days of live trainings only, running sessions included', () => {
    const byId = new Map(rows.map((r) => [r.id, r]));
    const list = upcomingSessions([
      { id: 'a', trainingId: 'run', status: 'SCHEDULED', startsAt: '2026-11-24T08:00:00Z', endsAt: '2026-11-24T10:00:00Z' },
      { id: 'b', trainingId: 'up1', status: 'SCHEDULED', startsAt: '2026-12-01T06:00:00Z', endsAt: '2026-12-01T12:00:00Z' },
      { id: 'c', trainingId: 'draft', status: 'SCHEDULED', startsAt: '2026-11-30T06:00:00Z', endsAt: '2026-11-30T12:00:00Z' },
      { id: 'd', trainingId: 'up2', status: 'SCHEDULED', startsAt: '2027-02-01T06:00:00Z', endsAt: '2027-02-01T12:00:00Z' },
      { id: 'e', trainingId: 'run', status: 'CANCELLED', startsAt: '2026-11-25T08:00:00Z', endsAt: '2026-11-25T10:00:00Z' },
    ], byId, now);
    assert.deepEqual(list.map((s) => [s.id, s.live]), [['a', true], ['b', false]]);
    assert.equal(list[0].trainingTitle, 'BLS');
  });
});

describe('monthGrid', () => {
  it('Monday-first weeks covering the month', () => {
    const g = monthGrid(new Date('2026-11-15T00:00:00Z'));
    assert.equal(g[0][0].key, '2026-10-26');
    assert.equal(g.length, 6);
    assert.equal(g.flat().filter((d) => d.inMonth).length, 30);
  });
});
