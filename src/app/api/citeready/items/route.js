import { NextResponse } from 'next/server';
import { getUserId } from '../../../../lib/auth-server';
import { getCiteReadyCredentials } from '../../../../lib/citereadyAuth';
import { getItems, searchItems, mapCslItemToPublication } from '../../../../lib/citereadyClient';

/**
 * GET /api/citeready/items?folderID=1&q=&page=0&pageSize=50
 * Proxies GET {BASE_URL}/api/v1/items (or /api/v1/search when q is present)
 * with type=csl, using the signed-in user's stored CiteReady token, and
 * maps results into this app's publication shape.
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

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const folderID = searchParams.get('folderID') || undefined;
    const page = parseInt(searchParams.get('page') || '0', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    const result = q
      ? await searchItems({ ...credentials, q, folderID, page, pageSize })
      : await getItems({ ...credentials, folderID: folderID || 1, page, pageSize });

    const publications = (result.items || []).map(mapCslItemToPublication);

    return NextResponse.json({
      success: true,
      publications,
      total: result.total || publications.length,
    });
  } catch (error) {
    if (error.code === 'CITEREADY_UNAUTHORIZED') {
      return NextResponse.json({ error: error.message, code: 'CITEREADY_UNAUTHORIZED' }, { status: 401 });
    }
    console.error('Error fetching CiteReady items:', error);
    return NextResponse.json({ error: 'Failed to fetch CiteReady items' }, { status: 500 });
  }
}
