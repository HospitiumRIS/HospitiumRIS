import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  canIssueFor,
  certificateExpiry,
  certificateState,
  classifyCertificates,
  generateVerificationCode,
  verifyUrl,
} from '../src/lib/certificate-issuance.js';

describe('verification codes', () => {
  it('are 128-bit, URL-safe and unique', () => {
    const codes = new Set(Array.from({ length: 500 }, generateVerificationCode));
    assert.equal(codes.size, 500);
    for (const c of codes) assert.match(c, /^[A-Za-z0-9_-]{22}$/);
    assert.equal(verifyUrl('https://h.org/', 'a_b-c'), 'https://h.org/verify/certificate/a_b-c');
  });
});

describe('certificateExpiry', () => {
  it('adds months, clamping to the end of shorter months', () => {
    assert.equal(certificateExpiry('2026-03-15T00:00:00Z', 24).toISOString(), '2028-03-15T00:00:00.000Z');
    assert.equal(certificateExpiry('2026-01-31T00:00:00Z', 1).toISOString(), '2026-02-28T00:00:00.000Z');
    assert.equal(certificateExpiry('2026-01-31T00:00:00Z', null), null);
  });
});

describe('classifyCertificates', () => {
  it('sorts registrations into ready, issued, revoked and not yet', () => {
    const r = classifyCertificates([
      { id: 'a', status: 'COMPLETED', certificate: null },
      { id: 'b', status: 'COMPLETED', certificate: { status: 'ISSUED', certificateUrl: '/api/files/1' } },
      { id: 'c', status: 'COMPLETED', certificate: { status: 'REVOKED', certificateUrl: '/api/files/2' } },
      { id: 'd', status: 'REGISTERED', certificate: null },
      { id: 'e', status: 'COMPLETED', certificate: { status: 'ISSUED', certificateUrl: '' } }, // half-created upload
    ]);
    assert.deepEqual(r.ready.map((x) => x.id), ['a', 'e']);
    assert.deepEqual(r.issued.map((x) => x.id), ['b']);
    assert.deepEqual(r.revoked.map((x) => x.id), ['c']);
    assert.deepEqual(r.notYet.map((x) => x.id), ['d']);
  });
});

describe('canIssueFor / certificateState', () => {
  it('needs a completed registration', () => {
    assert.equal(canIssueFor({ status: 'COMPLETED' }).ok, true);
    assert.equal(canIssueFor({ status: 'REGISTERED' }).ok, false);
    assert.equal(canIssueFor(null).ok, false);
  });

  it('reports valid, expired and revoked', () => {
    const now = new Date('2027-01-01T00:00:00Z');
    assert.equal(certificateState({ status: 'ISSUED' }, now), 'VALID');
    assert.equal(certificateState({ status: 'ISSUED', expiresAt: '2026-12-31T00:00:00Z' }, now), 'EXPIRED');
    assert.equal(certificateState({ status: 'REVOKED', expiresAt: '2026-12-31T00:00:00Z' }, now), 'REVOKED');
    assert.equal(certificateState(null), 'NONE');
  });
});
