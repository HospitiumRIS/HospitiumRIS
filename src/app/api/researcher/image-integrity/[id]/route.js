import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../../lib/auth-server';
import imachek, { isImaChekConfigured } from '../../../../../lib/imachek';

/**
 * Pull the latest status/results from ImaChek and persist them locally.
 * Safe to call repeatedly; no-ops if not configured or already terminal.
 */
async function refreshFromImaChek(record) {
  if (!record.externalCaseId || !isImaChekConfigured()) return record;
  if (record.status === 'COMPLETED' || record.status === 'FAILED') return record;

  try {
    const statusResult = await imachek.getAnalysisStatus(record.externalCaseId);
    const latest = Array.isArray(statusResult?.data) ? statusResult.data[0] : statusResult?.data;
    if (!latest) return record;

    const analysisStatus = latest.case_analysis_status;
    const isCompleted = analysisStatus === 'completed';

    return await prisma.imageIntegrityCase.update({
      where: { id: record.id },
      data: {
        status: isCompleted ? 'COMPLETED' : 'PROCESSING',
        analysisStatus,
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

/** GET /api/researcher/image-integrity/[id] */
export async function GET(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.accountType !== 'RESEARCHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    let record = await prisma.imageIntegrityCase.findFirst({
      where: { id, submittedById: user.id },
    });

    if (!record) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    record = await refreshFromImaChek(record);

    return NextResponse.json({ success: true, configured: isImaChekConfigured(), case: record });
  } catch (error) {
    console.error('Image Integrity detail error:', error);
    return NextResponse.json({ error: 'Failed to load submission' }, { status: 500 });
  }
}

/** DELETE /api/researcher/image-integrity/[id] */
export async function DELETE(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.accountType !== 'RESEARCHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const record = await prisma.imageIntegrityCase.findFirst({
      where: { id, submittedById: user.id },
    });
    if (!record) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (record.externalCaseId && isImaChekConfigured()) {
      try {
        await imachek.deleteCase(record.externalCaseId);
      } catch (error) {
        // If ImaChek refuses (e.g. analysis still in progress), surface that
        // instead of silently deleting our local record and orphaning theirs.
        console.error('ImaChek delete error:', error);
        return NextResponse.json(
          { error: error?.message || 'ImaChek could not delete this case yet. It may still be processing.' },
          { status: 409 }
        );
      }
    }

    await prisma.imageIntegrityCase.delete({ where: { id: record.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Image Integrity delete error:', error);
    return NextResponse.json({ error: 'Failed to delete submission' }, { status: 500 });
  }
}
