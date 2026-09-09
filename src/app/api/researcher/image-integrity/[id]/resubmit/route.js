import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../../../lib/auth-server';
import imachek, {
  isImaChekConfigured,
  ImaChekNotConfiguredError,
  ImaChekApiError,
  extractCaseId,
} from '../../../../../../lib/imachek';
import { readIntegrityFile, getMimeType, previewUrlForCase } from '../../../../../../lib/image-integrity-files';

const IMAGE_FORMATS = ['png', 'jpg', 'jpeg'];

function withPreview(record) {
  if (!record) return record;
  return {
    ...record,
    previewUrl: previewUrlForCase(record.id),
    isImagePreview: IMAGE_FORMATS.includes((record.fileFormat || '').toLowerCase()),
  };
}

/**
 * POST /api/researcher/image-integrity/[id]/resubmit
 * Re-run ImaChek analysis for a failed submission using the stored file.
 */
export async function POST(request, { params }) {
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
    if (record.status !== 'FAILED') {
      return NextResponse.json(
        { error: 'Only failed submissions can be resubmitted.' },
        { status: 400 }
      );
    }
    if (!isImaChekConfigured()) {
      return NextResponse.json(
        { error: 'ImaChek is not configured. Ask an administrator to set the API credentials.' },
        { status: 503 }
      );
    }

    let fileBuffer;
    try {
      ({ buffer: fileBuffer } = await readIntegrityFile(record.id, record.fileName));
    } catch {
      return NextResponse.json(
        {
          error:
            'Original file is no longer available for resubmission. Please create a new integrity check.',
        },
        { status: 404 }
      );
    }

    // Best-effort cleanup of a previous ImaChek case id if one exists
    if (record.externalCaseId) {
      try {
        await imachek.deleteCase(record.externalCaseId);
      } catch {
        // Ignore — failed uploads often never created a durable remote case
      }
    }

    const mime = getMimeType(record.fileFormat, record.fileName);
    const fileForUpload = new File([fileBuffer], record.fileName, { type: mime });

    let updated = await prisma.imageIntegrityCase.update({
      where: { id: record.id },
      data: {
        status: 'UPLOADING',
        analysisStatus: null,
        analysisProgress: 0,
        errorMessage: null,
        externalCaseId: null,
        manipulationCount: null,
        similarityCount: null,
        similarityLevel: null,
        classification: null,
        reportUrl: null,
        reportId: null,
        reportExpiresAt: null,
        analysisStartedAt: null,
        analysisCompletedAt: null,
      },
    });

    try {
      const uploadResult = await imachek.uploadFile({
        title: record.title,
        contributor: record.contributor,
        file: fileForUpload,
        fileName: record.fileName,
        compareGlobal: record.comparedGlobalRepository,
      });

      const externalCaseId = extractCaseId(uploadResult);
      updated = await prisma.imageIntegrityCase.update({
        where: { id: record.id },
        data: {
          externalCaseId: externalCaseId || null,
          status: externalCaseId ? 'PROCESSING' : 'FAILED',
          analysisStatus: externalCaseId ? 'processing' : null,
          analysisProgress: externalCaseId ? 5 : 0,
          errorMessage: externalCaseId
            ? null
            : `ImaChek did not return a case_id. Response: ${JSON.stringify(uploadResult)?.slice(0, 300) || 'empty'}`,
          analysisStartedAt: externalCaseId ? new Date() : null,
        },
      });

      return NextResponse.json(
        { success: Boolean(externalCaseId), configured: true, case: withPreview(updated) },
        { status: externalCaseId ? 200 : 202 }
      );
    } catch (uploadError) {
      console.error('ImaChek resubmit error:', uploadError);
      const message =
        uploadError instanceof ImaChekNotConfiguredError || uploadError instanceof ImaChekApiError
          ? uploadError.message
          : 'Failed to resubmit file to ImaChek.';
      updated = await prisma.imageIntegrityCase.update({
        where: { id: record.id },
        data: { status: 'FAILED', errorMessage: message },
      });
      return NextResponse.json(
        { success: false, configured: true, case: withPreview(updated), error: message },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('Image Integrity resubmit error:', error);
    return NextResponse.json({ error: 'Failed to resubmit analysis' }, { status: 500 });
  }
}
