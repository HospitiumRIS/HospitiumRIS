import { mkdir, writeFile, readFile, unlink, rm, access, stat } from 'fs/promises';
import path from 'path';
import { createReadStream } from 'fs';

function getRoot() {
  return process.env.STORAGE_LOCAL_ROOT || path.join(process.cwd(), '.storage-local');
}

async function objectPath(bucket, key) {
  const full = path.join(getRoot(), bucket, key);
  await mkdir(path.dirname(full), { recursive: true });
  return full;
}

export function createLocalDriver() {
  return {
    name: 'local',

    async put(bucket, key, body, { contentType } = {}) {
      const dest = await objectPath(bucket, key);
      const data = Buffer.isBuffer(body) ? body : Buffer.from(body);
      await writeFile(dest, data);
      return { etag: String(data.length), size: data.length, contentType };
    },

    async get(bucket, key) {
      const dest = path.join(getRoot(), bucket, key);
      return readFile(dest);
    },

    getStream(bucket, key) {
      const dest = path.join(getRoot(), bucket, key);
      return createReadStream(dest);
    },

    async head(bucket, key) {
      const dest = path.join(getRoot(), bucket, key);
      await access(dest);
      const info = await stat(dest);
      return { size: info.size, contentType: 'application/octet-stream', etag: String(info.size) };
    },

    async delete(bucket, key) {
      try {
        await unlink(path.join(getRoot(), bucket, key));
      } catch {
        // ignore missing
      }
    },

    async deletePrefix(bucket, prefix) {
      try {
        await rm(path.join(getRoot(), bucket, prefix), { recursive: true, force: true });
      } catch {
        // ignore missing
      }
    },

    async presignPut(bucket, key, { expiresIn = 600, contentType } = {}) {
      const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const url = `${base}/api/files/local-put?bucket=${encodeURIComponent(bucket)}&key=${encodeURIComponent(key)}&expires=${Date.now() + expiresIn * 1000}&contentType=${encodeURIComponent(contentType || 'application/octet-stream')}`;
      return { url, method: 'PUT', headers: { 'Content-Type': contentType || 'application/octet-stream' } };
    },

    async presignGet(bucket, key, { expiresIn = 120, contentType, contentDisposition } = {}) {
      const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      let url = `${base}/api/files/local-get?bucket=${encodeURIComponent(bucket)}&key=${encodeURIComponent(key)}&expires=${Date.now() + expiresIn * 1000}`;
      if (contentType) url += `&contentType=${encodeURIComponent(contentType)}`;
      if (contentDisposition) url += `&disposition=${encodeURIComponent(contentDisposition)}`;
      return { url, method: 'GET' };
    },

    async copy(srcBucket, srcKey, destBucket, destKey) {
      const data = await this.get(srcBucket, srcKey);
      await this.put(destBucket, destKey, data);
    },
  };
}

export function getLocalRoot() {
  return getRoot();
}
