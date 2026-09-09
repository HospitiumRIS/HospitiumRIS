import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../../lib/auth-server';
import { isImaChekConfigured } from '../../../../../lib/imachek';
import { startCaseComparison } from '../../../../../lib/image-integrity-compare';

/**
 * POST /api/researcher/image-integrity/compare
 * Body: { caseIds: string[], compareGlobal?: boolean }
 * Runs ImaChek Case Compare Analysis across the researcher's own completed cases.
 */
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.accountType !== 'RESEARCHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!isImaChekConfigured()) {
      return NextResponse.json({ error: 'ImaChek is not configured yet.' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const caseIds = Array.isArray(body.caseIds) ? body.caseIds.filter(Boolean) : [];
    const compareGlobal = body.compareGlobal !== false;

    if (caseIds.length < 2) {
      return NextResponse.json({ error: 'Select at least two completed cases to compare.' }, { status: 400 });
    }

    const records = await prisma.imageIntegrityCase.findMany({
      where: { id: { in: caseIds }, submittedById: user.id },
    });

    if (records.length !== caseIds.length) {
      return NextResponse.json({ error: 'One or more selected cases were not found.' }, { status: 404 });
    }

    const ordered = caseIds.map((id) => records.find((r) => r.id === id)).filter(Boolean);
    const { primary, comparedCount } = await startCaseComparison(ordered, { compareGlobal });

    return NextResponse.json({
      success: true,
      message: 'Cross-case comparison started',
      case: primary,
      comparedCount,
    });
  } catch (error) {
    console.error('Image Integrity compare error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to start comparison' },
      { status: error?.status || 500 }
    );
  }
}
