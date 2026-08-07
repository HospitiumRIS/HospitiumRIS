import { NextResponse } from 'next/server';
import { getUserId } from '../../../../../lib/auth-server';
import { prisma } from '../../../../../lib/prisma';
import { loginWithPassword } from '../../../../../lib/citereadyClient';

/**
 * POST /api/citeready/auth/login
 * Body: { email, password, environment? }
 *
 * Proxies CiteReady's password-login flow (Part 1, Option A of the
 * integration guide) server-side and persists only the resulting token --
 * never the password itself.
 */
export async function POST(request) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, password, environment = 'testing' } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    let token, expiresAt;
    try {
      ({ token, expiresAt } = await loginWithPassword({ email, password, environment }));
    } catch (loginError) {
      return NextResponse.json({ error: loginError.message }, { status: 401 });
    }

    const settingsData = {
      isConfigured: true,
      authMethod: 'password',
      email,
      token,
      environment,
      connectedAt: new Date().toISOString(),
      tokenExpiresAt: expiresAt,
    };

    try {
      await prisma.userSettings.upsert({
        where: { userId_type: { userId, type: 'CITEREADY' } },
        update: { settings: settingsData, updatedAt: new Date() },
        create: { userId, type: 'CITEREADY', settings: settingsData },
      });
    } catch (dbError) {
      if (dbError.code === 'P2021' || dbError.message?.includes('does not exist')) {
        return NextResponse.json(
          {
            error: 'Database not ready. Please run: npx prisma migrate dev --name add-citeready-settings',
            code: 'TABLE_NOT_FOUND',
          },
          { status: 503 }
        );
      }
      throw dbError;
    }

    return NextResponse.json({
      success: true,
      email,
      environment,
      tokenExpiresAt: expiresAt,
    });
  } catch (error) {
    console.error('CiteReady login error:', error);
    return NextResponse.json({ error: 'Failed to connect to CiteReady' }, { status: 500 });
  }
}
