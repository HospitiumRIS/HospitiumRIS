import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-server';
import { getDownloadRedirect, softDeleteFile, StorageError } from '../../../../lib/storage/files-service';

export async function GET(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const download = request.nextUrl.searchParams.get('download') === '1';

    const result = await getDownloadRedirect({ user, fileId: id, download });

    if (result.legacy) {
      const disposition = `${download ? 'attachment' : 'inline'}; filename="${String(result.originalName).replace(/"/g, '')}"`;
      return new NextResponse(result.buffer, {
        status: 200,
        headers: {
          'Content-Type': result.mimeType,
          'Content-Disposition': disposition,
          'Cache-Control': 'private, no-store',
        },
      });
    }

    return NextResponse.redirect(result.redirectUrl, {
      status: 302,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (err) {
    if (err instanceof StorageError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('File download error:', err);
    return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await softDeleteFile({ user, fileId: id });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof StorageError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('File delete error:', err);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
