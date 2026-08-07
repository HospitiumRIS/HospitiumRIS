import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../../lib/auth-server';
import imachek, { isImaChekConfigured } from '../../../../../lib/imachek';

const INSTITUTION_ROLES = ['RESEARCH_ADMIN', 'INSTITUTION_ADMIN'];

async function refreshFromImaChek(record) {
  if (!record.externalCaseId || !isImaChekConfigured()) return record;
  if (record.status === 'COMPLETED' || record.status === 'FAILED') return record;

  try {
    const statusResult = await imachek.getAnalysisStatus(record.externalCaseId);
    const latest = Array.isArray(statusResult?.data) ? statusResult.data[0] : statusResult?.data;
    if (!latest) return record;

    const isCompleted = latest.case_analysis_status === 'completed';
    return await prisma.imageIntegrityCase.update({
      where: { id: record.id },
      data: {
        status: isCompleted ? 'COMPLETED' : 'PROCESSING',
        analysisStatus: latest.case_analysis_status,
        analysisProgress: latest.case_analysis_progress ?? record.analysisProgress,
        manipulationCount: latest.case_analysis_result?.manipulation_count ?? record.manipulationCount,
        similarityCount: latest.case_analysis_result?.similarity_count ?? record.similarityCount,
        similarityLevel: latest.case_analysis_result?.similarity_level ?? record.similarityLevel,
        classification: latest.case_classification ?? record.classification,
        analysisCompletedAt: latest.case_analysis_completed_at
          ? new Date(latest.case_analysis_completed_at)
          : record.analysisCompletedAt,
      },
    });
  } catch (error) {
    console.error(`ImaChek status refresh failed for case ${record.id}:`, error);
    return record;
  }
}

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

    record = await refreshFromImaChek(record);

    return NextResponse.json({ success: true, configured: isImaChekConfigured(), case: record });
  } catch (error) {
    console.error('Institution Image Integrity detail error:', error);
    return NextResponse.json({ error: 'Failed to load submission' }, { status: 500 });
  }
}
