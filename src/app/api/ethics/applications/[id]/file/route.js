import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../../../lib/auth-server';
import { readEthicsFile, getEthicsMimeType, sanitizeFileName } from '../../../../../../lib/ethics-files';
import { canAccessEthicsApplication } from '../../../../../../lib/ethics-access';

function documentFileName(doc) {
  return doc?.fileName || doc?.originalName || doc?.name || '';
}

export async function GET(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const requestedName = sanitizeFileName(request.nextUrl.searchParams.get('name') || '');

    const application = await prisma.ethicsApplication.findUnique({
      where: { id },
      select: { id: true, userId: true, documents: true },
    });

    if (!application) {
      return NextResponse.json({ error: 'Ethics application not found' }, { status: 404 });
    }
    if (!(await canAccessEthicsApplication(prisma, user, application))) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const documents = Array.isArray(application.documents) ? application.documents : [];
    const match = requestedName
      ? documents.find((doc) => sanitizeFileName(documentFileName(doc)) === requestedName)
      : documents[0];

    const storedName = sanitizeFileName(documentFileName(match) || requestedName);
    if (!storedName) {
      return NextResponse.json({ error: 'Certificate file not found' }, { status: 404 });
    }

    try {
      const { buffer, mimeType } = await readEthicsFile(application.id, storedName, {
        user,
        fileId: match?.fileId,
      });
      const downloadName = match?.originalName || match?.name || storedName;
      const disposition =
        request.nextUrl.searchParams.get('download') === '1' ? 'attachment' : 'inline';

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': mimeType || match?.mimeType || getEthicsMimeType(storedName),
          'Content-Length': String(buffer.length),
          'Content-Disposition': `${disposition}; filename="${String(downloadName).replace(/"/g, '')}"`,
          'Cache-Control': 'private, max-age=3600',
        },
      });
    } catch {
      return NextResponse.json({ error: 'Certificate file is not available' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error serving ethics certificate:', error);
    return NextResponse.json({ error: 'Failed to load file' }, { status: 500 });
  }
}
