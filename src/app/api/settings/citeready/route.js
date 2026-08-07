import { NextResponse } from 'next/server';
import { getUserId } from '../../../../lib/auth-server';
import { prisma } from '../../../../lib/prisma';

/**
 * CiteReady connection settings.
 *
 * We deliberately never store the user's CiteReady password (per the
 * CiteReady integration guide's own guidance). For password-login mode we
 * persist only the resulting bearer token, its expiry, and the email used
 * to obtain it. For OAuth mode (once real client credentials exist) we'd
 * persist access_token / refresh_token / expires_at instead.
 */

const DEFAULT_SETTINGS = {
  isConfigured: false,
  authMethod: null, // 'password' | 'oauth'
  email: null,
  environment: 'testing', // 'testing' | 'production'
  connectedAt: null,
  tokenExpiresAt: null,
};

export async function GET(request) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let settings;
    try {
      settings = await prisma.userSettings.findFirst({
        where: { userId, type: 'CITEREADY' },
      });
    } catch (dbError) {
      if (dbError.code === 'P2021' || dbError.message?.includes('does not exist') || dbError.code === 'P2032') {
        return NextResponse.json({
          ...DEFAULT_SETTINGS,
          oauthAvailable: Boolean(process.env.CITEREADY_CLIENT_ID),
        });
      }
      throw dbError;
    }

    if (!settings) {
      return NextResponse.json({
        ...DEFAULT_SETTINGS,
        oauthAvailable: Boolean(process.env.CITEREADY_CLIENT_ID),
      });
    }

    const data = settings.settings || {};
    const isExpired = data.tokenExpiresAt ? new Date(data.tokenExpiresAt) < new Date() : false;

    // Never return the token itself to the client.
    return NextResponse.json({
      isConfigured: Boolean(data.isConfigured) && !isExpired,
      authMethod: data.authMethod || null,
      email: data.email || null,
      environment: data.environment || 'testing',
      connectedAt: data.connectedAt || null,
      tokenExpiresAt: data.tokenExpiresAt || null,
      expired: isExpired,
      oauthAvailable: Boolean(process.env.CITEREADY_CLIENT_ID),
    });
  } catch (error) {
    console.error('Error fetching CiteReady settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

/**
 * Allow updating non-sensitive preferences (currently just environment)
 * without going through the login flow again.
 */
export async function POST(request) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { environment } = body;

    if (environment && !['testing', 'production'].includes(environment)) {
      return NextResponse.json({ error: 'Invalid environment' }, { status: 400 });
    }

    const existing = await prisma.userSettings.findFirst({
      where: { userId, type: 'CITEREADY' },
    });

    const merged = {
      ...DEFAULT_SETTINGS,
      ...(existing?.settings || {}),
      ...(environment ? { environment } : {}),
    };

    const settings = await prisma.userSettings.upsert({
      where: { userId_type: { userId, type: 'CITEREADY' } },
      update: { settings: merged, updatedAt: new Date() },
      create: { userId, type: 'CITEREADY', settings: merged },
    });

    return NextResponse.json({ message: 'Settings saved successfully', settings: settings.settings });
  } catch (error) {
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      return NextResponse.json(
        {
          error: 'Database not ready. Please run: npx prisma migrate dev --name add-citeready-settings',
          code: 'TABLE_NOT_FOUND',
        },
        { status: 503 }
      );
    }
    console.error('Error saving CiteReady settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.userSettings.deleteMany({ where: { userId, type: 'CITEREADY' } });

    return NextResponse.json({ message: 'CiteReady disconnected' });
  } catch (error) {
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      return NextResponse.json({ message: 'CiteReady disconnected' });
    }
    console.error('Error clearing CiteReady settings:', error);
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}
