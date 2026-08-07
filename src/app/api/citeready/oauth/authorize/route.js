import { NextResponse } from 'next/server';
import { getUserId } from '../../../../../lib/auth-server';
import { getBaseUrl } from '../../../../../lib/citereadyClient';

/**
 * GET /api/citeready/oauth/authorize
 *
 * Scaffold for CiteReady's OAuth 2.0 / OIDC flow (Part 1, Option B of the
 * integration guide). Not usable until CiteReady administrators issue a
 * real client_id/client_secret/redirect_uri -- see client_info.txt and
 * CITEREADY_CLIENT_ID / CITEREADY_CLIENT_SECRET / CITEREADY_REDIRECT_URI
 * in .env. Until then this route responds with a clear "not configured"
 * error rather than silently failing at the provider.
 */
export async function GET(request) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clientId = process.env.CITEREADY_CLIENT_ID;
  const redirectUri = process.env.CITEREADY_REDIRECT_URI;
  const environment = process.env.CITEREADY_ENVIRONMENT || 'testing';

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      {
        error: 'CiteReady OAuth is not configured yet. Set CITEREADY_CLIENT_ID and CITEREADY_REDIRECT_URI once CiteReady issues credentials, or use password login for now.',
        code: 'OAUTH_NOT_CONFIGURED',
      },
      { status: 503 }
    );
  }

  const baseUrl = getBaseUrl(environment);
  const state = userId; // simple state binding; swap for a signed/random value + cookie in production

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email read',
    state,
  });

  return NextResponse.redirect(`${baseUrl}/oauth/authorize?${params}`);
}
