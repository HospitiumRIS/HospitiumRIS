import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { useImageIntegrityStorage, previewUrlForCase } from '../src/lib/image-integrity-files.js';

describe('useImageIntegrityStorage', () => {
  const orig = { ...process.env };

  beforeEach(() => {
    delete process.env.STORAGE_CUTOVER_IMAGE_INTEGRITY;
    delete process.env.STORAGE_DRIVER;
  });

  afterEach(() => {
    process.env = { ...orig };
  });

  it('defaults to legacy local disk', () => {
    assert.equal(useImageIntegrityStorage(), false);
  });

  it('enables when R2 driver set', () => {
    process.env.STORAGE_DRIVER = 'r2';
    assert.equal(useImageIntegrityStorage(), true);
  });
});

describe('previewUrlForCase', () => {
  it('uses file API when storedFileId present', () => {
    assert.equal(previewUrlForCase('case-1', 'file-abc'), '/api/files/file-abc');
  });

  it('uses legacy route without storedFileId', () => {
    assert.equal(previewUrlForCase('case-1'), '/api/researcher/image-integrity/case-1/file');
  });
});
