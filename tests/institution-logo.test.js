import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { useLogoStorage, parseStoredLogo } from '../src/lib/institution-logo.js';

describe('useLogoStorage', () => {
  const orig = { ...process.env };

  beforeEach(() => {
    delete process.env.STORAGE_CUTOVER_LOGO;
    delete process.env.STORAGE_DRIVER;
  });

  afterEach(() => {
    process.env = { ...orig };
  });

  it('defaults to legacy local disk', () => {
    assert.equal(useLogoStorage(), false);
  });

  it('enables when R2 driver set', () => {
    process.env.STORAGE_DRIVER = 'r2';
    assert.equal(useLogoStorage(), true);
  });
});

describe('parseStoredLogo', () => {
  it('parses file API references', () => {
    assert.deepEqual(parseStoredLogo('/api/files/cm123abc'), { fileId: 'cm123abc' });
  });

  it('parses legacy upload paths', () => {
    assert.deepEqual(parseStoredLogo('/uploads/institutions/inst-1/logo.png'), {
      institutionId: 'inst-1',
      fileName: 'logo.png',
    });
  });
});
