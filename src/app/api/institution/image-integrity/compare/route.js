import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { isImaChekConfigured } from '../../../../../lib/imachek';
import { startCaseComparison } from '../../../../../lib/image-integrity-compare';
import {
  requireInstitutionImageIntegrityAccess,
  institutionCasesWhere,
} from '../../../../../lib/image-integrity-institution';
import { MAX_COMPARE_CASES } from '../../../../../lib/image-integrity-limits';

/**
 * POST /api/institution/image-integrity/compare
 * Cross-paper comparison for oversight: compare completed cases within this institution.
 */
export async function POST(request) {
  try {
    const auth = await requireInstitutionImageIntegrityAccess(request);
    if (auth.errorResponse) return auth.errorResponse;
    const { institution } = auth;

    if (!isImaChekConfigured()) {
      return NextResponse.json({ error: 'ImaChek is not configured yet.' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const caseIds = Array.isArray(body.caseIds) ? body.caseIds.filter(Boolean) : [];
    const compareGlobal = body.compareGlobal !== false;

    if (caseIds.length < 2) {
      return NextResponse.json({ error: 'Select at least two completed cases to compare.' }, { status: 400 });
    }
    if (caseIds.length > MAX_COMPARE_CASES) {
      return NextResponse.json(
        { error: `You can compare at most ${MAX_COMPARE_CASES} cases at once.` },
        { status: 400 }
      );
    }

    const records = await prisma.imageIntegrityCase.findMany({
      where: {
        id: { in: caseIds },
        ...institutionCasesWhere(institution),
      },
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
    console.error('Institution Image Integrity compare error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to start comparison' },
      { status: error?.status || 500 }
    );
  }
}
