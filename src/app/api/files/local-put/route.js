import { NextResponse } from 'next/server';
import { getStorageDriver, getPrivateBucket, getPublicBucket } from '../../../../lib/storage';

/**
 * Dev-only shim: accepts PUT uploads for the local storage driver presigned URLs.
 */
export async function PUT(request) {
  if ((process.env.STORAGE_DRIVER || 'local') !== 'local') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { searchParams } = request.nextUrl;
  const bucket = searchParams.get('bucket');
  const key = searchParams.get('key');
  const expires = Number(searchParams.get('expires') || 0);
  const contentType = searchParams.get('contentType') || 'application/octet-stream';

  if (!bucket || !key || expires < Date.now()) {
    return NextResponse.json({ error: 'Invalid or expired upload URL' }, { status: 400 });
  }

  if (bucket !== getPrivateBucket() && bucket !== getPublicBucket()) {
    return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 });
  }

  const body = Buffer.from(await request.arrayBuffer());
  const driver = getStorageDriver();
  await driver.put(bucket, key, body, { contentType });

  return new NextResponse(null, { status: 200 });
}
