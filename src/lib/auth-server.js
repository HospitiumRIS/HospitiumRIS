import { cookies } from 'next/headers';
import { isBlockedByMaintenance } from './system-settings';
import { findSession, SESSION_COOKIE_NAME } from './sessions';

/** Raw session token from the cookie (never a user ID). */
export async function getSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
}

/**
 * Get authenticated user from the session cookie.
 * The cookie holds a random token that is looked up (by hash) in the sessions
 * table; idle/expired sessions are rejected and deleted.
 * @param {Request} request - The incoming request (unused; kept for callers)
 * @returns {Promise<Object|null>} User object or null if not authenticated
 */
export async function getAuthenticatedUser(request) {
  try {
    const token = await getSessionToken();
    if (!token) {
      return null;
    }

    const found = await findSession(token);
    if (!found) {
      return null;
    }
    const { user } = found;

    // Check if user is still active
    if (user.status !== 'ACTIVE' || !user.emailVerified) {
      return null;
    }

    // Maintenance mode: only global admins keep access.
    if (await isBlockedByMaintenance(user)) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Compatibility shim for routes that used to read the cookie directly and then
 * query `prisma.user.findUnique({ where: { id: sessionCookie.value } })`.
 * Returns `{ value: <userId> }` for a valid session, or null, so those routes
 * keep their own status/role checks unchanged while no longer trusting the
 * cookie value as a user ID. Prefer getAuthenticatedUser in new code.
 */
export async function getSessionRef() {
  const user = await getAuthenticatedUser();
  return user ? { value: user.id } : null;
}

/**
 * Get user ID from request session
 * @param {Request} request - The incoming request
 * @returns {Promise<string|null>} User ID or null if not authenticated
 */
export async function getUserId(request) {
  try {
    const user = await getAuthenticatedUser(request);
    return user ? user.id : null;
  } catch (error) {
    console.error('Get user ID error:', error);
    return null;
  }
}

/**
 * Middleware to require authentication
 * Returns user if authenticated, otherwise returns error response
 * @param {Request} request - The incoming request
 * @returns {Promise<{user: Object} | {error: NextResponse}>} User or error response
 */
export async function requireAuth(request) {
  const user = await getAuthenticatedUser(request);
  
  if (!user) {
    return {
      error: new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    };
  }
  
  return { user };
}
