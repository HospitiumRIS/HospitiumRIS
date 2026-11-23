import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  TOKEN_WINDOW_SECONDS,
  checkInToken,
  checkInUrl,
  checkInWindow,
  codesMatch,
  currentCheckInToken,
  evaluateCheckIn,
  generateCheckInCode,
  tokenWindow,
  verifyCheckInToken,
} from '../src/lib/training-checkin.js';
import { rateLimit, resetRateLimits } from '../src/lib/simple-rate-limit.js';

const SECRET = 'test-secret';
const t0 = new Date('2026-12-01T06:00:05Z');
const later = (seconds) => new Date(t0.getTime() + seconds * 1000);

describe('check-in token', () => {
  it('is valid now and within one window either side', () => {
    const { token } = currentCheckInToken('s1', SECRET, t0);
    assert.equal(verifyCheckInToken('s1', token, SECRET, t0), true);
    assert.equal(verifyCheckInToken('s1', token, SECRET, later(TOKEN_WINDOW_SECONDS)), true);
    assert.equal(verifyCheckInToken('s1', token, SECRET, later(-TOKEN_WINDOW_SECONDS)), true);
  });

  it('expires after about a minute (screenshots stop working)', () => {
    const { token } = currentCheckInToken('s1', SECRET, t0);
    assert.equal(verifyCheckInToken('s1', token, SECRET, later(2 * TOKEN_WINDOW_SECONDS + 1)), false);
    assert.equal(verifyCheckInToken('s1', token, SECRET, later(-2 * TOKEN_WINDOW_SECONDS)), false);
  });

  it('is bound to the session and the secret', () => {
    const { token } = currentCheckInToken('s1', SECRET, t0);
    assert.equal(verifyCheckInToken('s2', token, SECRET, t0), false);
    assert.equal(verifyCheckInToken('s1', token, 'other-secret', t0), false);
    assert.equal(verifyCheckInToken('s1', '', SECRET, t0), false);
    assert.equal(verifyCheckInToken('s1', 'short', SECRET, t0), false);
  });

  it('rotates every window and reports when', () => {
    const a = currentCheckInToken('s1', SECRET, t0);
    const b = currentCheckInToken('s1', SECRET, later(TOKEN_WINDOW_SECONDS));
    assert.notEqual(a.token, b.token);
    assert.equal(a.rotatesAt.getTime(), (tokenWindow(t0) + 1) * TOKEN_WINDOW_SECONDS * 1000);
    assert.equal(checkInToken('s1', 5, SECRET), checkInToken('s1', 5, SECRET));
  });

  it('builds the QR URL', () => {
    const url = new URL(checkInUrl('https://hospitium.example.org', 's1', 'tok'));
    assert.equal(url.pathname, '/researcher/training/check-in');
    assert.equal(url.searchParams.get('s'), 's1');
    assert.equal(url.searchParams.get('t'), 'tok');
  });
});

describe('check-in code', () => {
  it('is six digits and matches ignoring spaces', () => {
    for (let i = 0; i < 20; i += 1) assert.match(generateCheckInCode(), /^\d{6}$/);
    assert.equal(codesMatch('012345', '012 345'), true);
    assert.equal(codesMatch('012345', '012346'), false);
    assert.equal(codesMatch(null, ''), false);
  });
});

describe('evaluateCheckIn', () => {
  const session = {
    status: 'SCHEDULED',
    startsAt: '2026-12-01T06:00:00Z',
    checkInOpensMinutesBefore: 15,
    checkInClosesMinutesAfter: 30,
    lateAfterMinutes: 10,
  };

  it('opens before the start, marks LATE after the threshold, closes after the window', () => {
    assert.equal(evaluateCheckIn(session, new Date('2026-12-01T05:40:00Z')).reason, 'not_open');
    assert.equal(evaluateCheckIn(session, new Date('2026-12-01T05:50:00Z')).status, 'PRESENT');
    assert.equal(evaluateCheckIn(session, new Date('2026-12-01T06:10:00Z')).status, 'PRESENT');
    assert.equal(evaluateCheckIn(session, new Date('2026-12-01T06:10:01Z')).status, 'LATE');
    assert.equal(evaluateCheckIn(session, new Date('2026-12-01T06:30:00Z')).status, 'LATE');
    assert.equal(evaluateCheckIn(session, new Date('2026-12-01T06:30:01Z')).reason, 'closed');
  });

  it('refuses cancelled sessions and reports the window', () => {
    assert.equal(evaluateCheckIn({ ...session, status: 'CANCELLED' }, t0).reason, 'cancelled');
    const w = checkInWindow(session);
    assert.equal(w.opensAt.toISOString(), '2026-12-01T05:45:00.000Z');
    assert.equal(w.closesAt.toISOString(), '2026-12-01T06:30:00.000Z');
  });
});

describe('rateLimit', () => {
  it('allows up to the limit per window, then blocks until reset', () => {
    resetRateLimits();
    const opts = { limit: 3, windowMs: 1000, now: 0 };
    assert.equal(rateLimit('k', opts).allowed, true);
    assert.equal(rateLimit('k', opts).allowed, true);
    assert.equal(rateLimit('k', opts).allowed, true);
    const blocked = rateLimit('k', opts);
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.retryAfterMs, 1000);
    assert.equal(rateLimit('k', { ...opts, now: 1000 }).allowed, true);
    assert.equal(rateLimit('other', opts).allowed, true);
  });
});
