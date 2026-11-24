import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { auditActionLabel, auditChanges, deliverOnce, sessionNotices, trainingsToClose } from '../src/lib/training-automation.js';

const now = new Date('2026-12-01T08:00:00Z');
const at = (min) => new Date(now.getTime() + min * 60 * 1000).toISOString();
const live = { status: 'PUBLISHED', deliveryMode: 'IN_PERSON' };
const session = (id, startMin, extra = {}) => ({ id, trainingId: 't1', status: 'SCHEDULED', startsAt: at(startMin), endsAt: at(startMin + 120), training: live, ...extra });

describe('sessionNotices', () => {
  it('24h reminder inside a day but more than 75 minutes away', () => {
    const keys = sessionNotices([session('a', 20 * 60), session('b', 25 * 60), session('c', 80)], now).map((n) => n.dedupeKey);
    assert.deepEqual(keys, ['reminder-24h:a', 'reminder-24h:c']);
  });
  it('1h reminder inside 75 minutes; never both for the same run', () => {
    const notices = sessionNotices([session('a', 60)], now);
    assert.deepEqual(notices.map((n) => n.dedupeKey), ['reminder-1h:a']);
    assert.equal(notices[0].extra.reminder, '1h');
  });
  it('check-in open inside the window, in person or hybrid only', () => {
    const list = sessionNotices([
      session('a', 10),
      session('b', -20),
      session('c', -40),
      session('d', 10, { deliveryMode: 'ONLINE' }),
      session('e', 10, { deliveryMode: 'HYBRID' }),
    ], now);
    const open = list.filter((n) => n.kind === 'CHECKIN_OPEN').map((n) => n.sessionId);
    assert.deepEqual(open, ['a', 'b', 'e']);
  });
  it('skips cancelled sessions and trainings that are not published', () => {
    assert.deepEqual(sessionNotices([
      session('a', 60, { status: 'CANCELLED' }),
      session('b', 60, { training: { status: 'DRAFT' } }),
      session('c', 60, { training: { status: 'CANCELLED' } }),
    ], now), []);
  });
});

describe('trainingsToClose', () => {
  it('published trainings past their end', () => {
    const ids = trainingsToClose([
      { id: '1', status: 'PUBLISHED', endDate: at(-1) },
      { id: '2', status: 'PUBLISHED', endDate: at(60) },
      { id: '3', status: 'DRAFT', endDate: at(-60) },
      { id: '4', status: 'COMPLETED', endDate: at(-60) },
    ], now).map((t) => t.id);
    assert.deepEqual(ids, ['1']);
  });
});

describe('re-running never sends duplicates (#110 acceptance)', () => {
  it('a second and a late run send nothing new', async () => {
    const sent = new Set();
    const sendOnce = async ({ dedupeKey, userId }) => {
      const key = `${userId}|${dedupeKey}`;
      if (sent.has(key)) return { skipped: 'duplicate' };
      sent.add(key);
      return { sent: true };
    };
    const recipients = async () => ['u1', 'u2'];
    const sessions = [session('a', 20 * 60), session('b', 50), session('c', 5)];

    const first = await deliverOnce(sessionNotices(sessions, now), recipients, sendOnce);
    // a: 24h; b: 1h (check-in not open until 15 min before); c: 1h + check-in → 4 × 2 people
    assert.deepEqual(first, { sent: 8, skipped: 0 });

    const again = await deliverOnce(sessionNotices(sessions, now), recipients, sendOnce);
    assert.deepEqual(again, { sent: 0, skipped: 8 });

    // 30 minutes later: nothing new is due yet (b's check-in opens 15 min before it starts)
    const later = new Date(now.getTime() + 30 * 60 * 1000);
    const third = await deliverOnce(sessionNotices(sessions, later), recipients, sendOnce);
    assert.equal(third.sent, 0);
    // 40 minutes later: b's check-in has opened → that notice only
    const b = await deliverOnce(sessionNotices(sessions, new Date(now.getTime() + 40 * 60 * 1000)), recipients, sendOnce);
    assert.deepEqual(b, { sent: 2, skipped: 4 }); // a 24h and b 1h already sent; c has closed

    // 19 hours later: a enters the 1h window → only the new 1h reminder goes out
    const nextDay = new Date(now.getTime() + 19 * 60 * 60 * 1000);
    const fourth = await deliverOnce(sessionNotices(sessions, nextDay), recipients, sendOnce);
    assert.deepEqual(fourth, { sent: 2, skipped: 0 });
    assert.ok(sent.has('u1|reminder-1h:a'));
  });
});

describe('activity log helpers', () => {
  it('labels and changes', () => {
    assert.equal(auditActionLabel('CERTIFICATE_ISSUED'), 'Certificate issued');
    assert.equal(auditActionLabel('SOMETHING_NEW'), 'Something new');
    assert.deepEqual(auditChanges({ status: 'REGISTERED', x: 1 }, { status: 'COMPLETED', x: 1, y: null }), [
      { field: 'status', from: 'REGISTERED', to: 'COMPLETED' },
      { field: 'y', from: '—', to: 'none' },
    ]);
    assert.deepEqual(auditChanges(null, { a: { b: 1 } }), [{ field: 'a', from: '—', to: '{"b":1}' }]);
  });
});
