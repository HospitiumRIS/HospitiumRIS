import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { buildResearcherWorks } from '@/lib/researcher-works';

/**
 * GET /api/researcher/profile/works
 * The signed-in researcher's works (ORCID + Hospitium, OpenAlex metrics). Display only.
 * Logic lives in src/lib/researcher-works.js so the institution profile view can reuse it.
 */
export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const payload = await buildResearcherWorks(user);
    return NextResponse.json({ success: true, ...payload });
  } catch (err) {
    console.error('Error building merged works:', err);
    return NextResponse.json({ success: false, message: 'Failed to load works' }, { status: 500 });
  }
}
