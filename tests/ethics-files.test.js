import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { useEthicsStorage, ethicsFileUrl } from '../src/lib/ethics-files.js';

describe('useEthicsStorage', () => {
  const orig = { ...process.env };

  beforeEach(() => {
    delete process.env.STORAGE_CUTOVER_ETHICS;
    delete process.env.STORAGE_DRIVER;
  });

  afterEach(() => {
    process.env = { ...orig };
  });

  it('defaults to legacy local disk', () => {
    assert.equal(useEthicsStorage(), false);
  });

  it('enables when cutover flag set', () => {
    process.env.STORAGE_CUTOVER_ETHICS = 'true';
    assert.equal(useEthicsStorage(), true);
  });

  it('enables when R2 driver set', () => {
    process.env.STORAGE_DRIVER = 'r2';
    assert.equal(useEthicsStorage(), true);
  });
});

describe('ethicsFileUrl', () => {
  it('uses file API when fileId present', () => {
    assert.equal(ethicsFileUrl('app-1', 'doc.pdf', 'file-abc'), '/api/files/file-abc');
  });

  it('uses legacy ethics route without fileId', () => {
    assert.ok(ethicsFileUrl('app-1', 'doc.pdf').includes('/api/ethics/applications/app-1/file'));
  });
});
