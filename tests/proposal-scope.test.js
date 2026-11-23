import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  NO_PROPOSALS_WHERE,
  authorizeProposalDelete,
  authorizeProposalPatch,
  canAccessProposalWith,
  institutionProposalWhere,
  isCoInvestigator,
  isPersonallyInvolved,
  orcidVariants,
  personalProposalWhere,
  proposalListMode,
} from '../src/lib/proposals/scope.js';

// Two institutions, A and B, each with a researcher and a research admin.
const A = 'inst-a';
const B = 'inst-b';
const researcherA = { id: 'ra', accountType: 'RESEARCHER', secondaryInstitutionId: A, orcidId: '0000-0001-0000-000X', email: 'ra@a.ac.ke' };
const researcherNoOrcidA = { id: 'ra2', accountType: 'RESEARCHER', secondaryInstitutionId: A, orcidId: null, email: 'ra2@a.ac.ke' };
const adminA = { id: 'aa', accountType: 'RESEARCH_ADMIN', secondaryInstitutionId: A };
const instAdminB = { id: 'ib', accountType: 'INSTITUTION_ADMIN', institution: { id: B } };
const researcherB = { id: 'rb', accountType: 'RESEARCHER', secondaryInstitutionId: B, orcidId: '0000-0002-0000-0002', email: 'rb@b.ac.ke' };
const foundationAdmin = { id: 'fa', accountType: 'FOUNDATION_ADMIN', secondaryInstitutionId: A };
const globalAdmin = { id: 'ga', accountType: 'GLOBAL_ADMIN' };

const proposalA = { id: 'pa', status: 'UNDER_REVIEW', institutionId: A, createdById: 'ra', principalInvestigatorOrcid: '0000-0001-0000-000X', coInvestigators: [] };
const proposalB = { id: 'pb', status: 'UNDER_REVIEW', institutionId: B, createdById: 'rb', principalInvestigatorOrcid: 'https://orcid.org/0000-0002-0000-0002', coInvestigators: [] };
const legacyB = { id: 'pl', status: 'APPROVED', institutionId: null, createdById: null, principalInvestigatorOrcid: '0000-0002-0000-0002', coInvestigators: [] };

describe('proposalListMode', () => {
  it('returns none without a session (callers answer 401)', () => {
    assert.equal(proposalListMode(null), 'none');
  });
  it('gives global admins everything', () => {
    assert.equal(proposalListMode(globalAdmin), 'all');
  });
  it('scopes research and institution admins to their institution', () => {
    assert.equal(proposalListMode(adminA), 'institution');
    assert.equal(proposalListMode(instAdminB), 'institution');
  });
  it('scopes researchers, including those without ORCID, to their own proposals', () => {
    assert.equal(proposalListMode(researcherA), 'personal');
    assert.equal(proposalListMode(researcherNoOrcidA), 'personal');
  });
  it('does not give foundation admins an institution-wide view', () => {
    assert.equal(proposalListMode(foundationAdmin), 'personal');
  });
  it('falls back to personal for an admin with no institution', () => {
    assert.equal(proposalListMode({ id: 'x', accountType: 'RESEARCH_ADMIN' }), 'personal');
  });
});

describe('personalProposalWhere', () => {
  it('never returns an empty (match-everything) filter', () => {
    const where = personalProposalWhere(researcherNoOrcidA);
    assert.notDeepEqual(where, {});
    assert.deepEqual(where.OR.slice(0, 2), [{ createdById: 'ra2' }, { grantFollowUpUserId: 'ra2' }]);
  });
  it('matches bare and URL forms of the PI ORCID', () => {
    const where = personalProposalWhere(researcherA);
    assert.deepEqual(where.OR[2], { principalInvestigatorOrcid: { in: ['0000-0001-0000-000X', 'https://orcid.org/0000-0001-0000-000X'] } });
  });
  it('adds co-investigator proposal IDs', () => {
    const where = personalProposalWhere(researcherA, ['p1', 'p1', 'p2']);
    assert.deepEqual(where.OR.at(-1), { id: { in: ['p1', 'p2'] } });
  });
  it('matches nothing without a user', () => {
    assert.deepEqual(personalProposalWhere(null), NO_PROPOSALS_WHERE);
  });
});

describe('institutionProposalWhere', () => {
  it('matches rows recorded for the institution', () => {
    const where = institutionProposalWhere(A, { memberIds: ['ra'], memberOrcids: [] });
    assert.deepEqual(where.OR[0], { institutionId: A });
  });
  it('attributes legacy rows only when institutionId is empty', () => {
    const where = institutionProposalWhere(A, { memberIds: ['ra'], memberOrcids: ['0000-0001-0000-000X'] });
    const legacy = where.OR[1];
    assert.deepEqual(legacy.AND[0], { institutionId: null });
    assert.ok(legacy.AND[1].OR.some((c) => c.createdById));
    assert.ok(legacy.AND[1].OR.some((c) => c.principalInvestigatorOrcid));
  });
  it('no longer trusts the free-text departments field or pipeline membership', () => {
    const text = JSON.stringify(institutionProposalWhere(A, { memberIds: ['ra'], memberOrcids: ['0000-0001-0000-000X'] }));
    assert.equal(text.includes('departments'), false);
    assert.equal(text.includes('reviewTracking'), false);
    assert.equal(text.includes('pipeline'), false);
  });
  it('matches nothing without an institution', () => {
    assert.deepEqual(institutionProposalWhere(null), NO_PROPOSALS_WHERE);
  });
});

describe('canAccessProposalWith', () => {
  it('lets the creator / PI open their proposal', () => {
    assert.equal(canAccessProposalWith(researcherA, proposalA), true);
  });
  it('blocks a researcher from another institution', () => {
    assert.equal(canAccessProposalWith(researcherA, proposalB), false);
  });
  it('blocks a researcher without ORCID from proposals they are not on', () => {
    assert.equal(canAccessProposalWith(researcherNoOrcidA, proposalA), false);
  });
  it('lets an admin open their own institution\'s proposal', () => {
    assert.equal(canAccessProposalWith(adminA, proposalA), true);
  });
  it('blocks an admin from another institution\'s proposal (the reported leak)', () => {
    assert.equal(canAccessProposalWith(adminA, proposalB), false);
    assert.equal(canAccessProposalWith(instAdminB, proposalA), false);
  });
  it('decides legacy rows for admins from the institution scope check', () => {
    assert.equal(canAccessProposalWith(adminA, legacyB), false);
    assert.equal(canAccessProposalWith(adminA, legacyB, { inInstitutionScope: false }), false);
    assert.equal(canAccessProposalWith(instAdminB, legacyB, { inInstitutionScope: true }), true);
  });
  it('ignores the scope flag when the row already names a different institution', () => {
    assert.equal(canAccessProposalWith(adminA, proposalB, { inInstitutionScope: true }), false);
  });
  it('lets global admins open anything', () => {
    assert.equal(canAccessProposalWith(globalAdmin, proposalB), true);
  });
  it('denies anonymous callers', () => {
    assert.equal(canAccessProposalWith(null, proposalA), false);
  });
});

describe('co-investigators', () => {
  const withCoI = { ...proposalB, coInvestigators: [{ name: 'R A', orcidId: 'https://orcid.org/0000-0001-0000-000x' }, { email: 'RA2@A.AC.KE' }] };
  it('matches co-investigators by ORCID (any form, any case)', () => {
    assert.equal(isCoInvestigator(researcherA, withCoI), true);
  });
  it('matches co-investigators by email case-insensitively', () => {
    assert.equal(isCoInvestigator(researcherNoOrcidA, withCoI), true);
  });
  it('lets a co-investigator from another institution open the shared proposal', () => {
    assert.equal(canAccessProposalWith(researcherA, withCoI), true);
  });
  it('treats the follow-up user as involved', () => {
    assert.equal(isPersonallyInvolved(researcherNoOrcidA, { ...proposalB, grantFollowUpUserId: 'ra2' }), true);
  });
});

describe('authorizeProposalPatch', () => {
  it('stops a researcher approving their own proposal', () => {
    const result = authorizeProposalPatch(researcherA, proposalA, { status: 'APPROVED' }, { hasAccess: true });
    assert.equal(result.ok, false);
    assert.equal(result.status, 403);
  });
  it('lets a researcher resubmit after a revision request', () => {
    const revision = { ...proposalA, status: 'REVISION_REQUESTED' };
    assert.equal(authorizeProposalPatch(researcherA, revision, { status: 'UNDER_REVIEW' }, { hasAccess: true }).ok, true);
  });
  it('stops a researcher recording an award', () => {
    assert.equal(authorizeProposalPatch(researcherA, proposalA, { awardedAmount: 1000 }, { hasAccess: true }).ok, false);
  });
  it('lets an institution admin with access decide', () => {
    assert.equal(authorizeProposalPatch(adminA, proposalA, { status: 'APPROVED', awardedAmount: 5 }, { hasAccess: true }).ok, true);
  });
  it('answers 404 without access, for everyone', () => {
    assert.equal(authorizeProposalPatch(adminA, proposalB, { status: 'APPROVED' }, { hasAccess: false }).status, 404);
  });
});

describe('authorizeProposalDelete', () => {
  it('lets the owner delete a draft', () => {
    assert.equal(authorizeProposalDelete(researcherA, { ...proposalA, status: 'DRAFT' }, { hasAccess: true }).ok, true);
  });
  it('refuses to delete a proposal under review', () => {
    assert.equal(authorizeProposalDelete(researcherA, proposalA, { hasAccess: true }).status, 409);
  });
  it('refuses an admin who is not the owner', () => {
    assert.equal(authorizeProposalDelete(adminA, { ...proposalA, status: 'DRAFT' }, { hasAccess: true }).status, 403);
  });
  it('answers 404 to a caller without access', () => {
    assert.equal(authorizeProposalDelete(researcherB, { ...proposalA, status: 'DRAFT' }, { hasAccess: false }).status, 404);
  });
});

describe('orcidVariants', () => {
  it('normalises URL, lower-case and bare input', () => {
    assert.deepEqual(orcidVariants('https://orcid.org/0000-0002-1825-009x'), ['0000-0002-1825-009X', 'https://orcid.org/0000-0002-1825-009X']);
    assert.deepEqual(orcidVariants(''), []);
  });
});
