import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../../../lib/auth-server';
import imachek, { isImaChekConfigured } from '../../../../../../lib/imachek';

const INSTITUTION_ROLES = ['RESEARCH_ADMIN', 'INSTITUTION_ADMIN'];

/**
 * POST /api/institution/image-integrity/[id]/report
 * Institution oversight: generate the temporary ImaChek shareable report
 * URL (5 minute TTL) so a compliance officer can review a submission's
 * full findings. Read-only over the submission itself - this only caches
 * a viewer link, it never mutates researcher data.
 */
export async function POST(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!INSTITUTION_ROLES.includes(user.accountType)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const record = await prisma.imageIntegrityCase.findUnique({ where: { id } });
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
