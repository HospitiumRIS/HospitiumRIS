/**
 * QR / code self check-in (#93). Server-only (uses node:crypto); no database access.
 *
 * - The QR code carries a token: HMAC(secret, "<sessionId>:<window>") where window is
 *   the current 30-second slot. Tokens from the previous and next slot are accepted
 *   for clock skew, so a screenshot stops working within about a minute.
 * - Each session also has a 6-digit code shown under the QR for people who can't scan.
 */

import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';

export const TOKEN_WINDOW_SECONDS = 30;
const TOKEN_LENGTH = 22;

export function checkInSecret() {
  const secret = process.env.TRAINING_CHECKIN_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error('TRAINING_CHECKIN_SECRET (or JWT_SECRET) must be set for training check-in');
  return secret;
}

export function tokenWindow(now = new Date()) {
  return Math.floor(now.getTime() / 1000 / TOKEN_WINDOW_SECONDS);
}

export function checkInToken(sessionId, window, secret) {
  return createHmac('sha256', `training-checkin:${secret}`)
    .update(`${sessionId}:${window}`)
    .digest('base64url')
    .slice(0, TOKEN_LENGTH);
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Is this token valid for this session now (±1 window)? */
export function verifyCheckInToken(sessionId, token, secret, now = new Date()) {
  if (!sessionId || !token || typeof token !== 'string' || token.length !== TOKEN_LENGTH) return false;
  const w = tokenWindow(now);
  return [w - 1, w, w + 1].some((candidate) => safeEqual(checkInToken(sessionId, candidate, secret), token));
}

/** Current token plus when it rotates, for the Present view. */
export function currentCheckInToken(sessionId, secret, now = new Date()) {
  const w = tokenWindow(now);
  const rotatesAt = new Date((w + 1) * TOKEN_WINDOW_SECONDS * 1000);
  return { token: checkInToken(sessionId, w, secret), rotatesAt };
}

export function generateCheckInCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export function normalizeCode(value) {
  return String(value || '').replace(/\D/g, '');
}

export function codesMatch(expected, given) {
  const a = normalizeCode(expected);
  const b = normalizeCode(given);
  return a.length === 6 && safeEqual(a, b);
}

/**
 * Check-in window for a session: opens `checkInOpensMinutesBefore` before the start
 * and closes `checkInClosesMinutesAfter` after the start.
 */
export function checkInWindow(session) {
  const start = new Date(session.startsAt).getTime();
  return {
    opensAt: new Date(start - (session.checkInOpensMinutesBefore ?? 15) * 60000),
    closesAt: new Date(start + (session.checkInClosesMinutesAfter ?? 30) * 60000),
    lateAt: new Date(start + (session.lateAfterMinutes ?? 10) * 60000),
  };
}

/**
 * @returns {{ ok: true, status: 'PRESENT'|'LATE' } | { ok: false, reason, error }}
 */
export function evaluateCheckIn(session, now = new Date()) {
  if (!session) return { ok: false, reason: 'not_found', error: 'Session not found' };
  if (session.status !== 'SCHEDULED') {
    return { ok: false, reason: 'cancelled', error: 'This session has been cancelled' };
  }
  const { opensAt, closesAt, lateAt } = checkInWindow(session);
  if (now < opensAt) {
    return { ok: false, reason: 'not_open', error: `Check-in opens at ${opensAt.toISOString()}`, opensAt };
  }
  if (now > closesAt) {
    return { ok: false, reason: 'closed', error: 'Check-in for this session has closed. Ask the facilitator to mark you.' };
  }
  return { ok: true, status: now > lateAt ? 'LATE' : 'PRESENT' };
}

/**
 * Build the check-in URL encoded in the QR code.
 */
export function checkInUrl(baseUrl, sessionId, token) {
  const url = new URL('/researcher/training/check-in', baseUrl);
  url.searchParams.set('s', sessionId);
  url.searchParams.set('t', token);
  return url.toString();
}
