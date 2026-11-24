import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ethicsExportRows, ethicsRow, ethicsSummary, filterEthicsRows, inTab, tabCounts } from '../src/lib/institution-ethics.js';

const now = new Date('2026-11-25T09:00:00Z');
const owner = { id: 'u1', givenName: 'Joy', familyName: 'Owango', email: 'joy@x.org' };
const app = (extra = {}) => ({ id: 'a', title: 'TRIAGE-KE', status: 'SUBMITTED', referenceNumber: null, department: 'Emergency', source: 'APPLICATION', createdAt: '2026-10-01', updatedAt: '2026-10-02', ...extra });

describe('ethicsRow', () => {
  it('uses the stored PI, else the applicant', () => {
    assert.equal(ethicsRow(app({ principalInvestigator: 'Dr. K' }), owner, now).principalInvestigator, 'Dr. K');
    assert.equal(ethicsRow(app(), owner, now).principalInvestigator, 'Joy Owango');
    assert.equal(ethicsRow(app(), null, now).principalInvestigator, '—');
  });
  it('approvals past expiry show as Expired; days to expiry while valid', () => {
    const lapsed = ethicsRow(app({ status: 'APPROVED', expiryDate: '2026-11-01' }), owner, now);
    assert.deepEqual([lapsed.status, lapsed.statusLabel, lapsed.daysToExpiry], ['EXPIRED', 'Expired', null]);
    const soon = ethicsRow(app({ status: 'CONDITIONAL_APPROVAL', expiryDate: '2026-12-20T09:00:00Z' }), owner, now);
    assert.deepEqual([soon.status, soon.daysToExpiry, soon.expiringSoon], ['CONDITIONAL_APPROVAL', 25, true]);
    const later = ethicsRow(app({ status: 'APPROVED', expiryDate: '2028-10-05' }), owner, now);
    assert.equal(later.expiringSoon, false);
  });
  it('marks uploaded external certificates', () => {
    assert.equal(ethicsRow(app({ source: 'EXTERNAL_CERTIFICATE' }), owner, now).external, true);
    assert.equal(ethicsRow(app(), owner, now).external, false);
  });
});

const rows = [
  ethicsRow(app({ id: '1', status: 'SUBMITTED' }), owner, now),
  ethicsRow(app({ id: '2', status: 'UNDER_REVIEW', department: 'Surgery' }), owner, now),
  ethicsRow(app({ id: '3', status: 'APPROVED', expiryDate: '2026-12-10', referenceNumber: 'NREIB/0417', source: 'EXTERNAL_CERTIFICATE' }), owner, now),
  ethicsRow(app({ id: '4', status: 'APPROVED', expiryDate: '2026-01-01' }), owner, now),
  ethicsRow(app({ id: '5', status: 'REVISION_REQUESTED' }), owner, now),
  ethicsRow(app({ id: '6', status: 'DRAFT' }), owner, now),
];

describe('tabs, summary, filters, export', () => {
  it('tab membership and counts', () => {
    assert.deepEqual(tabCounts(rows), { all: 6, to_review: 2, approved: 1, expiring: 1, with_researcher: 2, closed: 1 });
    assert.equal(inTab(rows[3], 'closed'), true);
  });
  it('summary', () => {
    assert.deepEqual(ethicsSummary(rows), { total: 6, toReview: 2, approved: 1, expiring: 1, expired: 1, withResearcher: 2, external: 1 });
  });
  it('filters', () => {
    assert.deepEqual(filterEthicsRows(rows, { tab: 'to_review', department: 'Surgery' }).map((r) => r.id), ['2']);
    assert.deepEqual(filterEthicsRows(rows, { search: 'nreib' }).map((r) => r.id), ['3']);
  });
  it('export rows', () => {
    const x = ethicsExportRows(rows)[2];
    assert.deepEqual([x.Reference, x.Status, x.Source, x.Expires, x['Days to expiry']], ['NREIB/0417', 'Approved', 'External certificate', '2026-12-10', 15]);
  });
});
