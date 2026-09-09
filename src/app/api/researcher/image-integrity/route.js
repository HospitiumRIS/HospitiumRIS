import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../lib/auth-server';
import imachek, { isImaChekConfigured, ImaChekNotConfiguredError, ImaChekApiError, extractCaseId } from '../../../../lib/imachek';
import { saveIntegrityFile, previewUrlForCase } from '../../../../lib/image-integrity-files';
import { refreshIntegrityCasesFromImaChek } from '../../../../lib/image-integrity-sync';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB, per ImaChek file requirements
const SUPPORTED_FORMATS = ['png', 'tif', 'tiff', 'jpg', 'jpeg', 'zip', 'pdf'];
const IMAGE_FORMATS = ['png', 'jpg', 'jpeg']; // browser-displayable thumbnails only
const MAX_BATCH_FILES = 20;

function withPreview(record) {
  if (!record) return record;
  return {
    ...record,
    previewUrl: previewUrlForCase(record.id),
    isImagePreview: IMAGE_FORMATS.includes((record.fileFormat || '').toLowerCase()),
  };
}

function getExtension(fileName = '') {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

function stripExtension(fileName = '') {
  const idx = fileName.lastIndexOf('.');
  return idx > 0 ? fileName.slice(0, idx) : fileName;
}

/**
 * Create the local record and forward a single file to ImaChek. Used by
 * both single and batch uploads - every case is always a one-file upload
 * to ImaChek, which keeps the "cannot mix file types" / "one PDF or ZIP
 * per upload" rules trivially satisfied regardless of what else is in the
 * batch.
 */
async function createAndUploadCase({
  title,
  contributor,
  doi,
  authors,
  description,
  file,
  compareGlobal,
  submittedById,
}) {
  const extension = getExtension(file.name);
  const fileBytes = Buffer.from(await file.arrayBuffer());
  const fileForUpload = new File([fileBytes], file.name, { type: file.type || 'application/octet-stream' });

  let record = await prisma.imageIntegrityCase.create({
    data: {
      title,
      contributor,
      doi,
      authors: authors?.length ? authors : undefined,
      description: description || null,
      fileName: file.name,
      fileFormat: extension,
      fileSizeBytes: file.size,
      comparedGlobalRepository: compareGlobal,
      status: 'UPLOADING',
      submittedById,
    },
  });

  try {
    await saveIntegrityFile(record.id, fileForUpload);
  } catch (storeError) {
    console.error('Failed to store image integrity file locally:', storeError);
  }

  if (!isImaChekConfigured()) {
    record = await prisma.imageIntegrityCase.update({
      where: { id: record.id },
      data: {
        status: 'FAILED',
        errorMessage:
          'ImaChek is not configured yet. Ask an administrator to set IMACHEK_API_URL and IMACHEK_API_KEY.',
      },
    });
    return { record: withPreview(record), ok: false };
  }

  try {
    const uploadResult = await imachek.uploadFile({
      title,
      contributor,
      file: fileForUpload,
      fileName: file.name,
      compareGlobal,
    });

    // ImaChek returns { status, message, data: { case_id, analysis_status } }
    const externalCaseId = extractCaseId(uploadResult);

    record = await prisma.imageIntegrityCase.update({
      where: { id: record.id },
      data: {
        externalCaseId: externalCaseId || null,
        status: externalCaseId ? 'PROCESSING' : 'FAILED',
        analysisStatus: externalCaseId ? 'processing' : null,
        errorMessage: externalCaseId
          ? null
          : `ImaChek did not return a case_id. Response: ${JSON.stringify(uploadResult)?.slice(0, 300) || 'empty'}`,
        analysisStartedAt: externalCaseId ? new Date() : null,
      },
    });
    return { record: withPreview(record), ok: Boolean(externalCaseId) };
  } catch (uploadError) {
    console.error('ImaChek upload error:', uploadError);
    const message =
      uploadError instanceof ImaChekNotConfiguredError || uploadError instanceof ImaChekApiError
        ? uploadError.message
        : 'Failed to upload file to ImaChek.';
    record = await prisma.imageIntegrityCase.update({
      where: { id: record.id },
      data: { status: 'FAILED', errorMessage: message },
    });
    return { record: withPreview(record), ok: false };
  }
}

/**
 * GET /api/researcher/image-integrity
 * List the current researcher's own image integrity submissions.
 */
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.accountType !== 'RESEARCHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const cases = await prisma.imageIntegrityCase.findMany({
      where: { submittedById: user.id },
      orderBy: { createdAt: 'desc' },
    });

    const refreshed = await refreshIntegrityCasesFromImaChek(cases);

    return NextResponse.json({
      success: true,
      configured: isImaChekConfigured(),
      cases: refreshed.map(withPreview),
    });
  } catch (error) {
    console.error('Image Integrity list error:', error);
    return NextResponse.json({ error: 'Failed to load submissions' }, { status: 500 });
  }
}

/**
 * POST /api/researcher/image-integrity
 * Upload one or more files for ImaChek analysis (batch upload). Each file
 * becomes its own case/record - matches ImaChek's "upload all files first,
 * then monitor their status collectively" batch guidance. multipart/form-data:
 *  - title (string, required for a single file; optional prefix for a batch)
 *  - contributor (string, optional - defaults to submitter's name)
 *  - doi (string, optional, applied to every file in the batch)
 *  - compareGlobal ("true"/"false", optional)
 *  - files (File, repeated - one or more)
 */
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.accountType !== 'RESEARCHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const titlePrefix = (formData.get('title') || '').toString().trim();
    const contributor = formData.get('contributor') || `${user.givenName} ${user.familyName}`.trim();
    const doi = formData.get('doi') || null;
    const description = (formData.get('description') || '').toString().trim() || null;
    const compareGlobal = formData.get('compareGlobal') === 'true';

    let authors = [];
    const authorsRaw = formData.get('authors');
    if (authorsRaw) {
      try {
        const parsed = JSON.parse(authorsRaw.toString());
        if (Array.isArray(parsed)) {
          authors = parsed.map((a) => String(a || '').trim()).filter(Boolean);
        }
      } catch {
        authors = authorsRaw
          .toString()
          .split(/\n|;/)
          .map((a) => a.trim())
          .filter(Boolean);
      }
    }

    // Accept either the batch field name ("files") or the legacy single
    // field name ("file") for backward compatibility.
    let files = formData.getAll('files').filter((f) => f && typeof f !== 'string');
    if (files.length === 0) {
      const singleFile = formData.get('file');
      if (singleFile && typeof singleFile !== 'string') files = [singleFile];
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'At least one file is required.' }, { status: 400 });
    }
    if (files.length > MAX_BATCH_FILES) {
      return NextResponse.json({ error: `You can upload at most ${MAX_BATCH_FILES} files at once.` }, { status: 400 });
    }
    if (files.length === 1 && !titlePrefix) {
      return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
    }

    // Validate every file up-front so a bad file in the batch fails fast
    // without creating partial records.
    for (const file of files) {
      const extension = getExtension(file.name);
      if (!SUPPORTED_FORMATS.includes(extension)) {
        return NextResponse.json(
          { error: `"${file.name}": unsupported format ".${extension}". Supported: ${SUPPORTED_FORMATS.join(', ')}` },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: `"${file.name}" exceeds the 25MB size limit.` }, { status: 400 });
      }
    }

    const results = [];
    for (const file of files) {
      const title =
        files.length === 1
          ? titlePrefix
          : titlePrefix
          ? `${titlePrefix} — ${stripExtension(file.name)}`
          : stripExtension(file.name);

      const { record, ok } = await createAndUploadCase({
        title,
        contributor,
        doi,
        authors,
        description,
        file,
        compareGlobal,
        submittedById: user.id,
      });
      results.push({ ok, case: record });
    }

    const succeeded = results.filter((r) => r.ok).length;
    const failed = results.length - succeeded;

    if (results.length === 1) {
      const only = results[0];
      return NextResponse.json(
        { success: only.ok, configured: isImaChekConfigured(), case: only.case },
        { status: only.ok ? 200 : 202 }
      );
    }

    return NextResponse.json(
      {
        success: failed === 0,
        configured: isImaChekConfigured(),
        summary: { total: results.length, succeeded, failed },
        cases: results.map((r) => r.case),
      },
      { status: failed === 0 ? 200 : 207 }
    );
  } catch (error) {
    console.error('Image Integrity upload error:', error);
    return NextResponse.json({ error: 'Failed to submit file(s) for analysis' }, { status: 500 });
  }
}
