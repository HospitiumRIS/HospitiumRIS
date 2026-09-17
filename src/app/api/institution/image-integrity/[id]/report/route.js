import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma';
import imachek, { isImaChekConfigured } from '../../../../../../lib/imachek';
import {
  requireInstitutionImageIntegrityAccess,
  institutionCasesWhere,
} from '../../../../../../lib/image-integrity-institution';

/**
 * POST /api/institution/image-integrity/[id]/report
 * Institution oversight: generate the temporary ImaChek shareable report
 * URL (5 minute TTL) so a compliance officer can review a submission's
 * full findings. Read-only over the submission itself - this only caches
 * a viewer link, it never mutates researcher data.
 */
export async function POST(request, { params }) {
  try {
    const auth = await requireInstitutionImageIntegrityAccess(request);
    if (auth.errorResponse) return auth.errorResponse;
    const { institution } = auth;

    const { id } = await params;
    const record = await prisma.imageIntegrityCase.findFirst({
      where: {
        id,
        ...institutionCasesWhere(institution),
      },
    });
    if (!record) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }
    if (!record.externalCaseId || !isImaChekConfigured()) {
      return NextResponse.json({ error: 'ImaChek is not configured for this submission.' }, { status: 400 });
    }
    if (record.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Analysis is not complete yet.' }, { status: 409 });
    }

    const result = await imachek.generateReport(record.externalCaseId, {
      title: record.title,
      contributor: record.contributor,
    });

    const updated = await prisma.imageIntegrityCase.update({
      where: { id: record.id },
      data: {
        reportUrl: result?.data?.report_url || null,
        reportId: result?.data?.report_id || null,
        reportExpiresAt: result?.data?.expires_at ? new Date(result.data.expires_at) : null,
      },
    });

    return NextResponse.json({ success: true, case: updated });
  } catch (error) {
    console.error('Institution Image Integrity report generation error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to generate report' }, { status: 500 });
  }
}
