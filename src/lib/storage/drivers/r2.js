import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function createClient() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const endpoint = process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);
  if (!endpoint || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    throw new Error('R2 credentials not configured');
  }
  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

export function createR2Driver() {
  const client = createClient();

  return {
    name: 'r2',

    async put(bucket, key, body, { contentType } = {}) {
      await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }));
      return { etag: null, size: Buffer.isBuffer(body) ? body.length : body?.byteLength };
    },

    async get(bucket, key) {
      const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      return Buffer.from(await res.Body.transformToByteArray());
    },

    getStream(bucket, key) {
      return client.send(new GetObjectCommand({ Bucket: bucket, Key: key })).then((res) => res.Body);
    },

    async head(bucket, key) {
      const res = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      return {
        size: res.ContentLength ?? 0,
        contentType: res.ContentType || 'application/octet-stream',
        etag: res.ETag,
      };
    },

    async delete(bucket, key) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },

    async deletePrefix(bucket, prefix) {
      let token;
      do {
        const list = await client.send(new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          ContinuationToken: token,
        }));
        for (const obj of list.Contents || []) {
          if (obj.Key) await this.delete(bucket, obj.Key);
        }
        token = list.IsTruncated ? list.NextContinuationToken : undefined;
      } while (token);
    },

    async presignPut(bucket, key, { expiresIn = 600, contentType } = {}) {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
      });
      const url = await getSignedUrl(client, command, { expiresIn });
      return { url, method: 'PUT', headers: { 'Content-Type': contentType || 'application/octet-stream' } };
    },

    async presignGet(bucket, key, { expiresIn = 120, contentType, contentDisposition } = {}) {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        ResponseContentType: contentType,
        ResponseContentDisposition: contentDisposition,
      });
      const url = await getSignedUrl(client, command, { expiresIn });
      return { url, method: 'GET' };
    },

    async copy(srcBucket, srcKey, destBucket, destKey) {
      await client.send(new CopyObjectCommand({
        Bucket: destBucket,
        Key: destKey,
        CopySource: `${srcBucket}/${srcKey}`,
      }));
    },
  };
}
