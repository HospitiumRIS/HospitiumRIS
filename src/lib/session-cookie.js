import { createSession, SESSION_COOKIE_NAME } from './sessions.js';

/**
 * Session cookie options for login/logout.
 * In production, cookies must NOT use Secure unless the app is served over HTTPS.
 * `npm start` over http://localhost or a LAN IP otherwise drops sessions immediately.
 */
export function getSessionCookieOptions(maxAge) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const cookieSecureEnv = process.env.COOKIE_SECURE;

  let secure = false;
  if (cookieSecureEnv === 'true') {
    secure = true;
  } else if (cookieSecureEnv === 'false') {
    secure = false;
  } else {
    secure = appUrl.startsWith('https://');
  }

  const options = {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
  };

  if (typeof maxAge === 'number') {
    options.maxAge = maxAge;
  }

  return options;
}

/**
 * Start a server-side session for this user and put its token in the cookie.
 * The cookie never contains the user ID.
 *
 * @param {Response} response - NextResponse to set the cookie on
 * @param {string} userId
 * @param {{ rememberMe?: boolean, request?: Request }} options
 */
export async function setSessionCookie(response, userId, { rememberMe = false, request = null } = {}) {
  const token = await createSession(userId, { rememberMe, request });
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : undefined;
  response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions(maxAge));
  return token;
}

export function clearSessionCookie(response) {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    ...getSessionCookieOptions(0),
    maxAge: 0,
  });
}

export { SESSION_COOKIE_NAME };
