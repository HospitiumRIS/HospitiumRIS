const SESSION_COOKIE_NAME = 'hospitium_session';

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

export function setSessionCookie(response, userId, { rememberMe = false } = {}) {
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : undefined;
  response.cookies.set(SESSION_COOKIE_NAME, userId, getSessionCookieOptions(maxAge));
}

export function clearSessionCookie(response) {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    ...getSessionCookieOptions(0),
    maxAge: 0,
  });
}

export { SESSION_COOKIE_NAME };
