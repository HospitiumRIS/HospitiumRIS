/**
 * Server-side login sessions.
 *
 * The browser gets a random 32-byte token in the httpOnly `hospitium_session`
 * cookie. The database stores only its SHA-256 hash, so neither a leaked user
 * ID nor a leaked database row can be turned into a working session.
 *
 * Expiry:
 *  - idle: admin roles use System Settings > Session timeout (default 30 min);
 *    everyone else 24 hours.
 *  - absolute: 30 days with "Remember me", otherwise 7 days.
 *
 * Server-only.
 */
import crypto from 'crypto';
import prisma from './prisma.js';
import { getSettingsSection } from './system-settings.js';

export const SESSION_COOKIE_NAME = 'hospitium_session';

const DAY_MS = 24 * 60 * 60 * 1000;
export const ABSOLUTE_MS = { remember: 30 * DAY_MS, normal: 7 * DAY_MS };
export const NON_ADMIN_IDLE_MS = DAY_MS;
// Avoid a database write on every request: refresh lastSeenAt at most this often.
const TOUCH_INTERVAL_MS = 60 * 1000;

export const ADMIN_ROLES = new Set([
  'GLOBAL_ADMIN',
  'INSTITUTION_ADMIN',
  'RESEARCH_ADMIN',
  'FOUNDATION_ADMIN',
  'OPERATIONS',
]);

const USER_INCLUDE = {
  institution: true,
  secondaryInstitution: true,
  foundation: true,
};

export function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function newToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function clientInfo(request) {
  if (!request?.headers) return { ipAddress: null, userAgent: null };
  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress = (forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip'))?.trim() || null;
  const userAgent = request.headers.get('user-agent')?.slice(0, 500) || null;
  return { ipAddress, userAgent };
}

/** Idle limit in ms for this account type. */
export async function idleLimitMs(accountType) {
  if (!ADMIN_ROLES.has(accountType)) return NON_ADMIN_IDLE_MS;
  try {
    const system = await getSettingsSection('system');
    const minutes = Number(system.sessionTimeout) || 30;
    return minutes * 60 * 1000;
  } catch {
    return 30 * 60 * 1000;
  }
}

/**
 * Create a session row and return the raw token for the cookie.
 * Also clears this user's expired sessions so the table doesn't grow.
 */
export async function createSession(userId, { rememberMe = false, request = null } = {}) {
  const token = newToken();
  const now = Date.now();
  const { ipAddress, userAgent } = clientInfo(request);

  await prisma.session.deleteMany({ where: { userId, expiresAt: { lt: new Date(now) } } }).catch(() => {});
  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      rememberMe: Boolean(rememberMe),
      expiresAt: new Date(now + (rememberMe ? ABSOLUTE_MS.remember : ABSOLUTE_MS.normal)),
      ipAddress,
      userAgent,
    },
  });
  return token;
}

/**
 * Resolve a cookie token to { session, user } or null. Expired or idle
 * sessions are deleted. Does not check account status (callers do).
 */
export async function findSession(token, { now = Date.now() } = {}) {
  if (!token || typeof token !== 'string' || token.length < 20) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: USER_INCLUDE } },
  });
  if (!session || !session.user) return null;

  const idleMs = await idleLimitMs(session.user.accountType);
  const expired = session.expiresAt.getTime() <= now;
  const idle = now - session.lastSeenAt.getTime() > idleMs;
  if (expired || idle) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  if (now - session.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
    await prisma.session
      .update({ where: { id: session.id }, data: { lastSeenAt: new Date(now) } })
      .catch(() => {});
  }

  const { user, ...rest } = session;
  return { session: rest, user };
}

export async function deleteSessionByToken(token) {
  if (!token) return;
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
}

/**
 * End all of a user's sessions, optionally keeping the current one.
 * @returns {Promise<number>} number of sessions ended
 */
export async function revokeUserSessions(userId, { exceptToken = null } = {}) {
  if (!userId) return 0;
  const where = { userId };
  if (exceptToken) where.tokenHash = { not: hashToken(exceptToken) };
  const { count } = await prisma.session.deleteMany({ where });
  return count;
}

/** Remove every expired session (for the retention job). */
export async function purgeExpiredSessions(now = Date.now()) {
  const { count } = await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date(now) } } });
  return count;
}
