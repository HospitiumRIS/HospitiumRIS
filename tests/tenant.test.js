import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveTenantId } from '../src/lib/tenant.js';

describe('resolveTenantId', () => {
  it('prefers secondaryInstitutionId', () => {
    assert.equal(
      resolveTenantId({ secondaryInstitutionId: 'tenant-a', institution: { id: 'owned-b' } }),
      'tenant-a'
    );
  });

  it('falls back to owned institution', () => {
    assert.equal(resolveTenantId({ institution: { id: 'owned-b' } }), 'owned-b');
  });

  it('returns null for users without institution', () => {
    assert.equal(resolveTenantId({ id: 'user-1' }), null);
  });
});
