import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  useTrainingStorage,
  trainingFileUrl,
  parseTrainingFileUrl,
} from '../src/lib/training-files.js';

describe('useTrainingStorage', () => {
  const orig = { ...process.env };

  beforeEach(() => {
    delete process.env.STORAGE_CUTOVER_TRAINING;
    delete process.env.STORAGE_DRIVER;
  });

  afterEach(() => {
    process.env = { ...orig };
  });

  it('defaults to legacy local disk', () => {
    assert.equal(useTrainingStorage(), false);
  });

  it('enables when R2 driver set', () => {
    process.env.STORAGE_DRIVER = 'r2';
    assert.equal(useTrainingStorage(), true);
  });
});

describe('trainingFileUrl', () => {
  it('points to authenticated file API', () => {
    assert.equal(trainingFileUrl('file-123'), '/api/files/file-123');
  });
});

describe('parseTrainingFileUrl', () => {
  it('parses file API references', () => {
    assert.deepEqual(parseTrainingFileUrl('/api/files/file-123'), { fileId: 'file-123' });
  });

  it('parses legacy material paths', () => {
    const parsed = parseTrainingFileUrl('/uploads/training/materials/123_report.pdf');
    assert.ok(parsed.legacyPath.endsWith('123_report.pdf'));
  });

  it('parses legacy certificate paths', () => {
    const parsed = parseTrainingFileUrl('/uploads/training/certificates/cert_user_1.pdf');
    assert.ok(parsed.legacyPath.includes('certificates'));
  });
});
