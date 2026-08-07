import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getBaseUrl } from '../../../../../lib/citereadyClient';

/**
 * GET /api/citeready/oauth/callback?code=...&state=...
 *
 * Scaffold for the OAuth 2.0 authorization-code exchange (Part 1, Option B).
 * Implements the guide's requirements up front so this works the moment
 * real credentials land:
 *  - client authenticated via HTTP Basic (client_secret_basic) -- the guide
 *    is explicit that client_secret_post is rejected with invalid_client.
 *  - stores the rotated refresh_token pair, since every refresh issues a
 *    new one and invalidates the old.
 *
 * Not reachable in practice until CITEREADY_CLIENT_ID/SECRET/REDIRECT_URI
 * are set, since /oauth/authorize won't redirect here without them.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // userId, per our simple state binding in /authorize
  const error = searchParams.get('error');

  const redirectBackTo = (status, message) =>
    NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || ''}/researcher/publications/import?tab=citeready&citereadyOauth=${status}${
        message ? `&message=${encodeURIComponent(message)}` : ''
      }`
    );

  if (error) {
    return redirectBackTo('error', error);
  }

  if (!code || !state) {
    return redirectBackTo('error', 'Missing authorization code');
  }

  const clientId = process.env.CITEREADY_CLIENT_ID;
  const clientSecret = process.env.CITEREADY_CLIENT_SECRET;
  const redirectUri = process.env.CITEREADY_REDIRECT_URI;
  const environment = process.env.CITEREADY_ENVIRONMENT || 'testing';

  if (!clientId || !clientSecret || !redirectUri) {
    return redirectBackTo('error', 'CiteReady OAuth is not configured');
  }

  try {
    const baseUrl = getBaseUrl(environment);
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    });

    const tokenRes = await fetch(`${baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const tokenData = await tokenRes.json().catch(() => ({}));

    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || 'Token exchange failed');
    }

    const expiresAt = new Date(Date.now() + (tokenData.expires_in || 86400) * 1000).toISOString();

    const settingsData = {
      isConfigured: true,
      authMethod: 'oauth',
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      environment,
      connectedAt: new Date().toISOString(),
      tokenExpiresAt: expiresAt,
    };

    await prisma.userSettings.upsert({
      where: { userId_type: { userId: state, type: 'CITEREADY' } },
      update: { settings: settingsData, updatedAt: new Date() },
      create: { userId: state, type: 'CITEREADY', settings: settingsData },
    });

    return redirectBackTo('success');
  } catch (err) {
    console.error('CiteReady OAuth callback error:', err);
    return redirectBackTo('error', err.message);
  }
}
