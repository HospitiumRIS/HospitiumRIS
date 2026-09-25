import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeFileName } from '../src/lib/sanitize-file-name.js';

describe('sanitizeFileName', () => {
  it('strips path separators', () => {
    assert.equal(sanitizeFileName('../../etc/passwd'), 'passwd');
    assert.equal(sanitizeFileName('..\\..\\secret.pdf'), 'secret.pdf');
  });

  it('replaces unsafe characters', () => {
    assert.equal(sanitizeFileName('file name (1).pdf'), 'file_name__1_.pdf');
  });

  it('handles empty input', () => {
    assert.equal(sanitizeFileName(''), 'upload');
  });
});
