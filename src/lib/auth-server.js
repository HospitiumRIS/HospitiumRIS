import { cookies } from 'next/headers';
import prisma from './prisma';

/**
 * Get authenticated user from request
 * @param {Request} request - The incoming request
 * @returns {Promise<Object|null>} User object or null if not authenticated
 */
export async function getAuthenticatedUser(request) {
  try {
    // Check for session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('hospitium_session');
    
    if (!sessionCookie?.value) {
      return null;
    }

    // Find user by session ID (which is the user ID in our implementation)
    const user = await prisma.user.findUnique({
      where: { id: sessionCookie.value },
      include: {
        institution: true,
        foundation: true,
      }
    });

    if (!user) {
      return null;
    }

    // Check if user is still active
    if (user.status !== 'ACTIVE' || !user.emailVerified) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
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
