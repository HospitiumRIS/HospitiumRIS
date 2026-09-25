import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../../lib/auth-server';
import { completeUpload, StorageError } from '../../../../../../lib/storage/files-service';

export async function POST(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const file = await completeUpload({
      user,
      fileId: id,
      sha256: body.sha256 || null,
    });

    return NextResponse.json({ success: true, file });
  } catch (err) {
    if (err instanceof StorageError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('Upload complete error:', err);
    return NextResponse.json({ error: 'Failed to complete upload' }, { status: 500 });
  }
}
