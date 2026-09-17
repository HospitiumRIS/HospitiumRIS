import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { isImaChekConfigured } from '../../../../../lib/imachek';
import { refreshIntegrityCaseFromImaChek } from '../../../../../lib/image-integrity-sync';
import { loadRelatedCases } from '../../../../../lib/image-integrity-compare';
import {
  requireInstitutionImageIntegrityAccess,
  institutionCasesWhere,
} from '../../../../../lib/image-integrity-institution';

/**
 * GET /api/institution/image-integrity/[id]
 * Read-only detail view for institution oversight.
 */
export async function GET(request, { params }) {
  try {
    const auth = await requireInstitutionImageIntegrityAccess(request);
    if (auth.errorResponse) return auth.errorResponse;
    const { institution } = auth;

    const { id } = await params;
    const force = new URL(request.url).searchParams.get('refresh') === '1';
    let record = await prisma.imageIntegrityCase.findFirst({
      where: {
        id,
        ...institutionCasesWhere(institution),
      },
      include: {
        submittedBy: {
          select: { id: true, givenName: true, familyName: true, email: true, primaryInstitution: true },
        },
        labUnit: { select: { id: true, name: true } },
        collection: { select: { id: true, name: true, color: true } },
      },
    });
    if (!record) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const submittedBy = record.submittedBy;
    record = await refreshIntegrityCaseFromImaChek(record, { force });
    if (submittedBy && !record.submittedBy) {
      record = { ...record, submittedBy };
    }
    const relatedCases = await loadRelatedCases(record.analysisTarget);

    return NextResponse.json({
      success: true,
      configured: isImaChekConfigured(),
      case: record,
      relatedCases,
    });
  } catch (error) {
    console.error('Institution Image Integrity detail error:', error);
    return NextResponse.json({ error: 'Failed to load submission' }, { status: 500 });
  }
}
