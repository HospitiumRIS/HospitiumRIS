import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../../../lib/auth-server';
import { readIntegrityFile, getMimeType } from '../../../../../../lib/image-integrity-files';

/**
 * GET /api/researcher/image-integrity/[id]/file
 * Serve the locally stored submission file for preview/download.
 */
export async function GET(request, { params }) {
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
    console.error('Image Integrity file serve error:', error);
    return NextResponse.json({ error: 'Failed to load file' }, { status: 500 });
  }
}
