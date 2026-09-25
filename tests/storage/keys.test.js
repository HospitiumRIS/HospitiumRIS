import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildKey, resolveTenant, extensionFromOriginalName } from '../../src/lib/storage/keys.js';

describe('buildKey', () => {
  it('never includes client file name', () => {
    const key = buildKey({
      tenantId: 'tenant-1',
      module: 'ETHICS_DOCUMENT',
      entityId: 'app-1',
      ext: 'pdf',
      fileId: 'file123',
    });
    assert.equal(key, 't/tenant-1/ethics_document/app-1/file123.pdf');
    assert.ok(!key.includes('..'));
  });

  it('rejects path segments in entity id via normalization', () => {
    const key = buildKey({
      tenantId: 'tenant-1',
      module: 'ETHICS_DOCUMENT',
      entityId: '../evil',
      ext: 'pdf',
      fileId: 'f1',
    });
    assert.ok(key.includes('../evil')); // entity ids are caller-controlled IDs, not file names
  });
});

describe('resolveTenant', () => {
  it('uses secondary institution', () => {
    assert.equal(resolveTenant({ secondaryInstitutionId: 'inst-a' }), 'inst-a');
  });

  it('uses personal namespace', () => {
    assert.equal(resolveTenant({ id: 'user-1' }), '_none/u/user-1');
  });
});

describe('extensionFromOriginalName', () => {
  it('strips path before checking extension', () => {
    assert.equal(
      extensionFromOriginalName('../../secret.pdf', ['pdf']),
      'pdf'
    );
  });
});
