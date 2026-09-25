import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { canReadTrainingMaterial, canReadTrainingCertificate } from '../src/lib/training-access.js';

describe('canReadTrainingMaterial', () => {
  const training = { id: 't1', institutionId: 'inst-a' };

  it('allows public materials for same-tenant researchers', async () => {
    const user = { id: 'u1', accountType: 'RESEARCHER', secondaryInstitutionId: 'inst-a' };
    const material = { trainingId: 't1', accessLevel: 'PUBLIC', training };
    assert.equal(await canReadTrainingMaterial(user, material), true);
  });

  it('denies registered-only materials without registration', async () => {
    const user = { id: 'u1', accountType: 'RESEARCHER', secondaryInstitutionId: 'inst-a' };
    const material = { trainingId: 't1', accessLevel: 'REGISTERED_ONLY', training };
    assert.equal(await canReadTrainingMaterial(user, material), false);
  });
});

describe('canReadTrainingCertificate', () => {
  const training = { id: 't1', institutionId: 'inst-a' };

  it('allows certificate owner', async () => {
    const user = { id: 'u1', accountType: 'RESEARCHER', secondaryInstitutionId: 'inst-a' };
    const certificate = { userId: 'u1', training };
    assert.equal(await canReadTrainingCertificate(user, certificate), true);
  });

  it('denies other users in same tenant', async () => {
    const user = { id: 'u2', accountType: 'RESEARCHER', secondaryInstitutionId: 'inst-a' };
    const certificate = { userId: 'u1', training };
    assert.equal(await canReadTrainingCertificate(user, certificate), false);
  });
});
