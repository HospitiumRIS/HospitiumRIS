import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-server';
import { initiateUpload, StorageError } from '../../../../lib/storage/files-service';

export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { module, entityType, entityId, fileName, size, contentType, entityTenantId } = body;

    if (!module || !entityType || !entityId || !fileName || !size) {
      return NextResponse.json({ error: 'module, entityType, entityId, fileName, and size are required' }, { status: 400 });
    }

    const result = await initiateUpload({
      user,
      module,
      entityType,
      entityId,
      fileName,
      sizeBytes: Number(size),
      contentType,
      entityTenantId: entityTenantId || null,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof StorageError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('Upload initiate error:', err);
    return NextResponse.json({ error: 'Failed to initiate upload' }, { status: 500 });
  }
}
