import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../../lib/auth-server';
import imachek, { isImaChekConfigured } from '../../../../../lib/imachek';
import { deleteIntegrityFile } from '../../../../../lib/image-integrity-files';
import { refreshIntegrityCaseFromImaChek } from '../../../../../lib/image-integrity-sync';
import { loadRelatedCases } from '../../../../../lib/image-integrity-compare';

/** GET /api/researcher/image-integrity/[id] */
export async function GET(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.accountType !== 'RESEARCHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const force = new URL(request.url).searchParams.get('refresh') === '1';
    let record = await prisma.imageIntegrityCase.findFirst({
      where: { id, submittedById: user.id },
    });

    if (!record) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    record = await refreshIntegrityCaseFromImaChek(record, { force });
    const relatedCases = await loadRelatedCases(record.analysisTarget);

    return NextResponse.json({
      success: true,
      configured: isImaChekConfigured(),
      case: record,
      relatedCases,
    });
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

    await deleteIntegrityFile(record.id, record.fileName);
    await prisma.imageIntegrityCase.delete({ where: { id: record.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Image Integrity delete error:', error);
    return NextResponse.json({ error: 'Failed to delete submission' }, { status: 500 });
  }
}
