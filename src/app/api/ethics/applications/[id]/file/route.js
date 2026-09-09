import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../../../lib/auth-server';
import { readEthicsFile, getEthicsMimeType, sanitizeFileName } from '../../../../../../lib/ethics-files';

const STAFF_ACCOUNT_TYPES = ['RESEARCH_ADMIN', 'INSTITUTION_ADMIN', 'GLOBAL_ADMIN'];

function canAccess(user, application) {
  if (!user || !application) return false;
  if (application.userId === user.id) return true;
  return STAFF_ACCOUNT_TYPES.includes(user.accountType);
}

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
    if (!canAccess(user, application)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
      const { buffer } = await readEthicsFile(application.id, storedName);
      const downloadName = match?.originalName || match?.name || storedName;
      const disposition =
        request.nextUrl.searchParams.get('download') === '1' ? 'attachment' : 'inline';

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': match?.mimeType || getEthicsMimeType(storedName),
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
