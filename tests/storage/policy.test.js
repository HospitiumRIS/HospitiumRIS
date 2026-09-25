import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateUploadRequest, isAllowedMimeType } from '../../src/lib/storage/policy.js';

describe('validateUploadRequest', () => {
  it('rejects disallowed extensions', () => {
    const result = validateUploadRequest({
      module: 'ETHICS_DOCUMENT',
      fileName: 'evil.html',
      sizeBytes: 100,
    });
    assert.equal(result.ok, false);
  });

  it('accepts valid ethics pdf', () => {
    const result = validateUploadRequest({
      module: 'ETHICS_DOCUMENT',
      fileName: 'consent.pdf',
      sizeBytes: 1024,
    });
    assert.equal(result.ok, true);
    assert.equal(result.ext, 'pdf');
  });
});

describe('isAllowedMimeType', () => {
  it('blocks html', () => {
    assert.equal(isAllowedMimeType('ETHICS_DOCUMENT', 'text/html'), false);
  });

  it('allows pdf', () => {
    assert.equal(isAllowedMimeType('ETHICS_DOCUMENT', 'application/pdf'), true);
  });
});
