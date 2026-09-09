import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../../lib/auth-server';
import { isImaChekConfigured } from '../../../../../lib/imachek';
import { refreshIntegrityCaseFromImaChek } from '../../../../../lib/image-integrity-sync';
import { loadRelatedCases } from '../../../../../lib/image-integrity-compare';

const INSTITUTION_ROLES = ['RESEARCH_ADMIN', 'INSTITUTION_ADMIN'];

/**
 * GET /api/institution/image-integrity/[id]
 * Read-only detail view for institution oversight.
 */
export async function GET(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!INSTITUTION_ROLES.includes(user.accountType)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const force = new URL(request.url).searchParams.get('refresh') === '1';
    let record = await prisma.imageIntegrityCase.findUnique({
      where: { id },
      include: {
        submittedBy: {
          select: { id: true, givenName: true, familyName: true, email: true, primaryInstitution: true },
        },
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
