import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDailySessions,
  buildDeliveryFields,
  deliveryFieldsFromLegacyLocation,
  effectiveSessionDelivery,
  groupSessionsByDay,
  legacyLocationString,
  resolveTrainingDeliveryUpdate,
  sessionsOutsideTraining,
  validateSessionInput,
} from '../src/lib/training-sessions.js';

// 1-3 Dec 2026, 09:00-17:00 Nairobi (06:00-14:00Z)
const training = {
  title: 'GCP refresher',
  startDate: '2026-12-01T06:00:00Z',
  endDate: '2026-12-03T14:00:00Z',
  deliveryMode: 'HYBRID',
  venue: 'Main hall',
  onlineLink: 'https://meet.example.org/gcp',
  status: 'PUBLISHED',
};

describe('validateSessionInput', () => {
  const ok = { title: 'Day 1', startsAt: '2026-12-01T06:00:00Z', endsAt: '2026-12-01T14:00:00Z' };

  it('accepts a session inside the training and fills defaults', () => {
    const r = validateSessionInput(ok, training);
    assert.equal(r.ok, true);
    assert.equal(r.data.deliveryMode, 'HYBRID');
    assert.equal(r.data.status, 'SCHEDULED');
    assert.equal(r.data.isAttendanceRequired, true);
    assert.equal(r.data.checkInOpensMinutesBefore, 15);
    assert.equal(r.data.lateAfterMinutes, 10);
  });

  it('requires end after start', () => {
    const r = validateSessionInput({ ...ok, endsAt: ok.startsAt }, training);
    assert.equal(r.ok, false);
    assert.ok(r.errors.some((e) => /end after/.test(e)));
  });

  it('rejects sessions outside the training window', () => {
    const r = validateSessionInput({ ...ok, startsAt: '2026-11-30T06:00:00Z' }, training);
    assert.equal(r.ok, false);
    assert.ok(r.errors.some((e) => /within the training dates/.test(e)));
    assert.equal(validateSessionInput({ ...ok, endsAt: '2026-12-03T15:00:00Z' }, training).ok, false);
  });

  it('requires a title and valid dates', () => {
    const r = validateSessionInput({ startsAt: 'nope' }, training);
    assert.equal(r.ok, false);
    assert.ok(r.errors.length >= 3);
  });

  it('online sessions need a link, from the session or the training', () => {
    assert.equal(validateSessionInput({ ...ok, deliveryMode: 'ONLINE' }, training).ok, true);
    const noLink = { ...training, onlineLink: null };
    assert.equal(validateSessionInput({ ...ok, deliveryMode: 'ONLINE' }, noLink).ok, false);
    assert.equal(validateSessionInput({ ...ok, deliveryMode: 'ONLINE', onlineLink: 'ftp://x' }, noLink).ok, false);
  });

  it('rejects unknown enums, bad minutes and foreign modules', () => {
    assert.equal(validateSessionInput({ ...ok, deliveryMode: 'TELEPATHY' }, training).ok, false);
    assert.equal(validateSessionInput({ ...ok, status: 'OPEN' }, training).ok, false);
    assert.equal(validateSessionInput({ ...ok, lateAfterMinutes: -5 }, training).ok, false);
    assert.equal(validateSessionInput({ ...ok, moduleId: 'm9' }, training, { moduleIds: ['m1'] }).ok, false);
    assert.equal(validateSessionInput({ ...ok, moduleId: 'm1' }, training, { moduleIds: ['m1'] }).ok, true);
  });

  it('merges a partial update with the existing session', () => {
    const existing = { ...ok, deliveryMode: 'IN_PERSON', venue: 'Room 2', lateAfterMinutes: 5 };
    const r = validateSessionInput({ title: 'Renamed' }, training, { existing });
    assert.equal(r.ok, true);
    assert.equal(r.data.title, 'Renamed');
    assert.equal(r.data.venue, 'Room 2');
    assert.equal(r.data.lateAfterMinutes, 5);
  });
});

describe('buildDailySessions', () => {
  it('splits a multi-day training into one session per day', () => {
    const sessions = buildDailySessions(training);
    assert.equal(sessions.length, 3);
    assert.deepEqual(sessions.map((s) => s.title), ['Day 1', 'Day 2', 'Day 3']);
    assert.equal(sessions[2].startsAt.toISOString(), '2026-12-03T06:00:00.000Z');
    assert.equal(sessions[2].endsAt.toISOString(), '2026-12-03T14:00:00.000Z');
    for (const s of sessions) assert.equal(validateSessionInput(s, training).ok, true);
  });

  it('gives one session for a single-day training', () => {
    const one = buildDailySessions({ ...training, endDate: '2026-12-01T14:00:00Z' });
    assert.equal(one.length, 1);
    assert.equal(one[0].title, 'GCP refresher');
  });

  it('handles a training ending at its start time-of-day', () => {
    const s = buildDailySessions({ ...training, endDate: '2026-12-03T06:00:00Z' });
    assert.equal(s.length, 2);
    assert.ok(s.every((x) => x.endsAt <= new Date('2026-12-03T06:00:00Z')));
  });

  it('returns nothing for invalid dates; cancelled trainings give cancelled sessions', () => {
    assert.deepEqual(buildDailySessions({ startDate: null }), []);
    assert.equal(buildDailySessions({ ...training, status: 'CANCELLED' })[0].status, 'CANCELLED');
  });
});

describe('delivery fields', () => {
  it('builds structured fields from the form', () => {
    assert.deepEqual(buildDeliveryFields({ locationType: 'hybrid', locationAddress: ' Hall ', onlineLink: 'https://x.org' }),
      { deliveryMode: 'HYBRID', venue: 'Hall', onlineLink: 'https://x.org' });
    assert.deepEqual(buildDeliveryFields({ locationType: 'online', locationAddress: 'ignored', onlineLink: 'https://x.org' }),
      { deliveryMode: 'ONLINE', venue: null, onlineLink: 'https://x.org' });
    assert.ok(buildDeliveryFields({ locationType: 'online' }).error);
    assert.ok(buildDeliveryFields({ locationType: 'in_person' }).error);
    assert.ok(buildDeliveryFields({ locationType: 'hybrid', onlineLink: 'javascript:alert(1)' }).error);
  });

  it('parses legacy location strings like the backfill and round-trips them', () => {
    for (const legacy of ['https://zoom.us/j/1', 'Main hall | https://meet.x', 'Room 4', '']) {
      const fields = deliveryFieldsFromLegacyLocation(legacy);
      assert.equal(legacyLocationString(fields), legacy);
    }
    assert.equal(deliveryFieldsFromLegacyLocation('Main hall | https://meet.x').deliveryMode, 'HYBRID');
  });

  it('sessions inherit the training venue and link', () => {
    assert.deepEqual(effectiveSessionDelivery({ deliveryMode: 'HYBRID' }, training),
      { deliveryMode: 'HYBRID', venue: 'Main hall', onlineLink: 'https://meet.example.org/gcp' });
    assert.equal(effectiveSessionDelivery({ deliveryMode: 'IN_PERSON', venue: 'Lab' }, training).onlineLink, null);
  });
});

describe('grouping and drift', () => {
  it('groups by Nairobi day and flags sessions outside the training', () => {
    const sessions = buildDailySessions(training);
    const groups = groupSessionsByDay(sessions, { timeZone: 'Africa/Nairobi' });
    assert.deepEqual(groups.map((g) => g.dayKey), ['2026-12-01', '2026-12-02', '2026-12-03']);
    const shorter = { ...training, endDate: '2026-12-02T14:00:00Z' };
    assert.equal(sessionsOutsideTraining(sessions, shorter).length, 1);
  });
});

describe('resolveTrainingDeliveryUpdate', () => {
  it('derives structured fields from a legacy location-only body', () => {
    assert.deepEqual(resolveTrainingDeliveryUpdate({ location: 'Hall | https://m.x' }),
      { deliveryMode: 'HYBRID', venue: 'Hall', onlineLink: 'https://m.x', location: 'Hall | https://m.x' });
    assert.deepEqual(resolveTrainingDeliveryUpdate({ title: 'x' }), {});
  });

  it('validates structured fields and keeps location in sync', () => {
    assert.deepEqual(resolveTrainingDeliveryUpdate({ deliveryMode: 'ONLINE', onlineLink: 'https://z.us/j/1' }),
      { deliveryMode: 'ONLINE', venue: null, onlineLink: 'https://z.us/j/1', location: 'https://z.us/j/1' });
    assert.ok(resolveTrainingDeliveryUpdate({ deliveryMode: 'BOGUS' }).error);
    assert.ok(resolveTrainingDeliveryUpdate({ deliveryMode: 'ONLINE' }).error);
  });

  it('merges a partial update with the existing training', () => {
    const r = resolveTrainingDeliveryUpdate({ venue: 'New hall' }, { deliveryMode: 'HYBRID', venue: 'Old', onlineLink: 'https://m.x' });
    assert.equal(r.location, 'New hall | https://m.x');
  });
});
