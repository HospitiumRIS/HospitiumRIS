import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { rm } from 'fs/promises';
import path from 'path';
import { createLocalDriver, getLocalRoot } from '../../src/lib/storage/drivers/local.js';

const TEST_ROOT = path.join(process.cwd(), '.storage-local-test');

describe('local storage driver', () => {
  before(async () => {
    process.env.STORAGE_LOCAL_ROOT = TEST_ROOT;
    await rm(TEST_ROOT, { recursive: true, force: true });
  });

  after(async () => {
    await rm(TEST_ROOT, { recursive: true, force: true });
    delete process.env.STORAGE_LOCAL_ROOT;
  });

  it('put, head, get, delete round-trip', async () => {
    const driver = createLocalDriver();
    const bucket = 'test-private';
    const key = 't/tenant-1/ethics/app-1/file.pdf';
    const body = Buffer.from('%PDF-1.4 test content');

    await driver.put(bucket, key, body, { contentType: 'application/pdf' });
    const head = await driver.head(bucket, key);
    assert.equal(head.size, body.length);

    const got = await driver.get(bucket, key);
    assert.equal(got.toString(), body.toString());

    await driver.delete(bucket, key);
    await assert.rejects(() => driver.head(bucket, key));
  });

  it('uses configured local root', () => {
    assert.equal(getLocalRoot(), TEST_ROOT);
  });
});
