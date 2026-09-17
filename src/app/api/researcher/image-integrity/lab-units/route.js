import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../lib/auth-server';
import { listActiveLabUnitsForInstitution } from '../../../../../lib/image-integrity-lab-units';

/**
 * GET /api/researcher/image-integrity/lab-units
 * Active lab/units for the researcher's verified institution (optional on submit).
 */
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.accountType !== 'RESEARCHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const labUnits = await listActiveLabUnitsForInstitution(user.secondaryInstitutionId);

    return NextResponse.json({
      success: true,
      labUnits,
      institutionLinked: Boolean(user.secondaryInstitutionId),
    });
  } catch (error) {
    console.error('Researcher lab units list error:', error);
    return NextResponse.json({ error: 'Failed to load lab/units' }, { status: 500 });
  }
}
