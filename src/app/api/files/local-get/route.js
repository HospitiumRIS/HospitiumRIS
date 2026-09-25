import { NextResponse } from 'next/server';
import { getStorageDriver, getPrivateBucket, getPublicBucket } from '../../../../lib/storage';

/**
 * Dev-only shim: serves objects for local driver presigned GET URLs.
 */
export async function GET(request) {
  if ((process.env.STORAGE_DRIVER || 'local') !== 'local') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { searchParams } = request.nextUrl;
  const bucket = searchParams.get('bucket');
  const key = searchParams.get('key');
  const expires = Number(searchParams.get('expires') || 0);
  const contentType = searchParams.get('contentType') || 'application/octet-stream';
  const disposition = searchParams.get('disposition');

  if (!bucket || !key || expires < Date.now()) {
    return NextResponse.json({ error: 'Invalid or expired download URL' }, { status: 400 });
  }

  if (bucket !== getPrivateBucket() && bucket !== getPublicBucket()) {
    return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 });
  }

  const driver = getStorageDriver();
  const buffer = await driver.get(bucket, key);

  const headers = {
    'Content-Type': contentType,
    'Cache-Control': 'private, no-store',
  };
  if (disposition) headers['Content-Disposition'] = disposition;

  return new NextResponse(buffer, { status: 200, headers });
}
