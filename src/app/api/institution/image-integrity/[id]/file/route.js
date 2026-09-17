import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma';
import { readIntegrityFile, getMimeType } from '../../../../../../lib/image-integrity-files';
import {
  requireInstitutionImageIntegrityAccess,
  institutionCasesWhere,
} from '../../../../../../lib/image-integrity-institution';

/**
 * GET /api/institution/image-integrity/[id]/file
 * Serve a submission file for institution oversight preview/download.
 */
export async function GET(request, { params }) {
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

    try {
      const { buffer } = await readIntegrityFile(record.id, record.fileName);
      const mime = getMimeType(record.fileFormat, record.fileName);
      const disposition = request.nextUrl.searchParams.get('download') === '1' ? 'attachment' : 'inline';

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': mime,
          'Content-Length': String(buffer.length),
          'Content-Disposition': `${disposition}; filename="${record.fileName.replace(/"/g, '')}"`,
          'Cache-Control': 'private, max-age=3600',
        },
      });
    } catch {
      return NextResponse.json(
        { error: 'File preview is not available for this submission.' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Institution Image Integrity file serve error:', error);
    return NextResponse.json({ error: 'Failed to load file' }, { status: 500 });
  }
}
