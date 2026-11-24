import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  canDecideEthics,
  canUseGrantApplication,
  canUseManuscript,
  ethicsListScope,
  isAssignedProposalReviewer,
  isAssignedStageReviewer,
  proposalReviewPermissions,
  reviewerIdentity,
} from '../src/lib/review-access.js';

const admin = { id: 'a', accountType: 'RESEARCH_ADMIN', email: 'admin@x.org', givenName: 'Ada', familyName: 'Admin' };
const researcher = { id: 'r', accountType: 'RESEARCHER', email: 'Rev@X.org' };
const global = { id: 'g', accountType: 'GLOBAL_ADMIN', email: 'g@x.org' };

describe('reviewer identity comes from the session', () => {
  it('uses the user, never the body', () => {
    assert.deepEqual(reviewerIdentity(admin), { reviewerId: 'a', reviewerName: 'Ada Admin', reviewerEmail: 'admin@x.org' });
    assert.equal(reviewerIdentity({ id: 'z', email: 'z@x.org' }).reviewerName, 'z@x.org');
  });
});

describe('assigned reviewers (by email, case-insensitive)', () => {
  it('stage progress or stage list', () => {
    assert.equal(isAssignedStageReviewer(researcher, { assignedReviewers: ['rev@x.org'] }, null), true);
    assert.equal(isAssignedStageReviewer(researcher, {}, { reviewerEmails: [' REV@x.org '] }), true);
    assert.equal(isAssignedStageReviewer(researcher, { assignedReviewers: ['other@x.org'] }, {}), false);
    assert.equal(isAssignedStageReviewer({ id: 'n' }, { assignedReviewers: [''] }, {}), false);
    assert.equal(isAssignedProposalReviewer(researcher, [{ assignedReviewers: [] , stage: { reviewerEmails: ['rev@x.org'] } }]), true);
  });
});

describe('proposalReviewPermissions', () => {
  it('anonymous: nothing', () => {
    assert.deepEqual(Object.values(proposalReviewPermissions(null, { inScope: true })), [false, false, false, false, false]);
  });
  it('research office of the institution decides; another institution does not', () => {
    const p = proposalReviewPermissions(admin, { inScope: true });
    assert.deepEqual([p.read, p.decide, p.reviewStage, p.submit], [true, true, true, false]);
    assert.deepEqual(Object.values(proposalReviewPermissions(admin, { inScope: false })), [false, false, false, false, false]);
  });
  it('an admin cannot decide or review their own proposal', () => {
    const p = proposalReviewPermissions(admin, { inScope: true, involved: true });
    assert.deepEqual([p.read, p.decide, p.reviewStage, p.submit], [true, false, false, true]);
  });
  it('assigned reviewer reviews a stage but does not take the final decision', () => {
    const p = proposalReviewPermissions(researcher, { assigned: true });
    assert.deepEqual([p.read, p.decide, p.reviewStage, p.submit, p.linkEthics], [true, false, true, false, false]);
  });
  it('the researcher on the proposal reads and submits, never decides', () => {
    const p = proposalReviewPermissions(researcher, { inScope: true, involved: true });
    assert.deepEqual([p.read, p.decide, p.reviewStage, p.submit, p.linkEthics], [true, false, false, true, true]);
  });
  it('an unrelated researcher: nothing', () => {
    assert.deepEqual(Object.values(proposalReviewPermissions(researcher, {})), [false, false, false, false, false]);
  });
});

describe('ethicsListScope', () => {
  it('researchers see only their own, whatever userId they send', () => {
    assert.equal(ethicsListScope(researcher).mode, 'own');
    assert.equal(ethicsListScope(researcher, { userId: 'someone-else' }).mode, 'own');
  });
  it('admins see their institution, or their own when asked', () => {
    assert.equal(ethicsListScope(admin).mode, 'institution');
    assert.equal(ethicsListScope(admin, { userId: 'a' }).mode, 'own');
    assert.equal(ethicsListScope(admin, { mine: true }).mode, 'own');
    assert.equal(ethicsListScope(global).mode, 'all');
    assert.equal(ethicsListScope(null).mode, 'none');
  });
});

describe('canDecideEthics', () => {
  it('same-institution research office only, never own application', () => {
    assert.equal(canDecideEthics(admin, { userId: 'r' }, { sharesTenant: true }), true);
    assert.equal(canDecideEthics(admin, { userId: 'r' }, { sharesTenant: false }), false);
    assert.equal(canDecideEthics(admin, { userId: 'a' }, { sharesTenant: true }), false);
    assert.equal(canDecideEthics(researcher, { userId: 'x' }, { sharesTenant: true }), false);
    assert.equal(canDecideEthics(global, { userId: 'x' }), true);
    assert.equal(canDecideEthics(null, { userId: 'x' }), false);
  });
});

describe('grants and manuscripts', () => {
  it('owner only / creator or collaborator', () => {
    assert.equal(canUseGrantApplication(researcher, { userId: 'r' }), true);
    assert.equal(canUseGrantApplication(admin, { userId: 'r' }), false);
    assert.equal(canUseManuscript(researcher, { createdBy: 'x', collaborators: [{ userId: 'r' }] }), true);
    assert.equal(canUseManuscript(researcher, { createdBy: 'x', collaborators: [] }), false);
    assert.equal(canUseManuscript(null, { createdBy: 'x' }), false);
  });
});
