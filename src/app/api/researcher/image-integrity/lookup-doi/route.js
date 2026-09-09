import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../lib/auth-server';
import { getPublicationByDOI } from '../../../../../services/crossrefService';

/**
 * GET /api/researcher/image-integrity/lookup-doi?doi=10.xxxx/...
 * Enrich form fields from Crossref when a DOI is known.
 */
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const doi = request.nextUrl.searchParams.get('doi') || '';
    if (!doi.trim()) {
      return NextResponse.json({ error: 'DOI is required' }, { status: 400 });
    }

    const pub = await getPublicationByDOI(doi);
    const description = String(pub.abstract || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 2000);

    return NextResponse.json({
      success: true,
      doi: pub.doi || doi,
      title: pub.title || '',
      authors: Array.isArray(pub.authors) ? pub.authors.filter(Boolean) : [],
      description,
      journal: pub.journal || '',
      year: pub.year || null,
      source: 'crossref',
    });
  } catch (error) {
    const message = error?.message || 'DOI lookup failed';
    const status = /not found/i.test(message) ? 404 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
