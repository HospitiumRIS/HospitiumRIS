import { NextResponse } from 'next/server';
import { readOrcidProof } from '@/lib/orcid-proof';

/**
 * GET /api/auth/orcid/session
 * The ORCID iD and name this browser verified with ORCID in the last few
 * minutes (from the signed proof cookie). Used to pre-fill researcher
 * registration after "Sign in with ORCID" finds no account.
 */
export async function GET(request) {
  const proof = readOrcidProof(request);
  if (!proof) {
    return NextResponse.json(
      { success: false, code: 'orcid_session_expired', message: 'Your ORCID sign-in expired. Please sign in with ORCID again.' },
      { status: 401 }
    );
  }
  return NextResponse.json({
    success: true,
    orcidId: proof.orcid,
    givenNames: proof.givenNames || '',
    familyName: proof.familyName || '',
  });
}
