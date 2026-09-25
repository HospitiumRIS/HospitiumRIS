import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { canReadStoredFile, canInitiateForTenant } from '../../src/lib/storage/access.js';

const tenantA = 'tenant-a';
const tenantB = 'tenant-b';

describe('canReadStoredFile', () => {
  const file = { id: 'f1', tenantId: tenantA, ownerUserId: 'owner-a', status: 'AVAILABLE' };

  it('denies tenant B user', () => {
    const user = { id: 'user-b', secondaryInstitutionId: tenantB, accountType: 'RESEARCHER' };
    assert.equal(canReadStoredFile(user, file), false);
  });

  it('allows same-tenant user', () => {
    const user = { id: 'user-x', secondaryInstitutionId: tenantA, accountType: 'RESEARCH_ADMIN' };
    assert.equal(canReadStoredFile(user, file), true);
  });

  it('allows owner regardless of tenant', () => {
    const user = { id: 'owner-a', secondaryInstitutionId: tenantB, accountType: 'RESEARCHER' };
    assert.equal(canReadStoredFile(user, file), true);
  });

  it('allows global admin', () => {
    const user = { id: 'admin', accountType: 'GLOBAL_ADMIN' };
    assert.equal(canReadStoredFile(user, file), true);
  });

  it('allows any authenticated user for PUBLIC files', () => {
    const publicFile = { ...file, visibility: 'PUBLIC' };
    const outsider = { id: 'user-z', secondaryInstitutionId: tenantB, accountType: 'RESEARCHER' };
    assert.equal(canReadStoredFile(outsider, publicFile), true);
  });
});

describe('canInitiateForTenant', () => {
  it('blocks cross-tenant upload initiation', () => {
    const user = { id: 'u1', secondaryInstitutionId: tenantA, accountType: 'RESEARCHER' };
    assert.equal(canInitiateForTenant(user, tenantB), false);
  });
});
