import { NextResponse } from 'next/server';
import { getUserId } from '../../../../lib/auth-server';
import { getCiteReadyCredentials } from '../../../../lib/citereadyAuth';
import { getFolders } from '../../../../lib/citereadyClient';

/**
 * GET /api/citeready/folders
 * Proxies GET {BASE_URL}/api/v1/folders using the signed-in user's stored
 * CiteReady token.
 */
export async function GET(request) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const credentials = await getCiteReadyCredentials(userId);
    if (!credentials) {
      return NextResponse.json({ error: 'CiteReady not connected', code: 'NOT_CONNECTED' }, { status: 409 });
    }

    const record = await getFolders(credentials);

    return NextResponse.json({ success: true, record });
  } catch (error) {
    if (error.code === 'CITEREADY_UNAUTHORIZED') {
      return NextResponse.json({ error: error.message, code: 'CITEREADY_UNAUTHORIZED' }, { status: 401 });
    }
    console.error('Error fetching CiteReady folders:', error);
    return NextResponse.json({ error: 'Failed to fetch CiteReady folders' }, { status: 500 });
  }
}
