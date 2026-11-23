import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractVerificationCode, publicCertificateView } from '../src/lib/certificate-verify.js';

describe('extractVerificationCode', () => {
  it('accepts a code or a pasted link, and rejects junk', () => {
    assert.equal(extractVerificationCode(' Xk3d9Qe2_ab-cdEFGhijKL '), 'Xk3d9Qe2_ab-cdEFGhijKL');
    assert.equal(extractVerificationCode('https://hospitium.hospitiumris.org/verify/certificate/Xk3d9Qe2abcdEFGhijKL?x=1'), 'Xk3d9Qe2abcdEFGhijKL');
    assert.equal(extractVerificationCode('short'), null);
    assert.equal(extractVerificationCode("'; drop table x; --"), null);
    assert.equal(extractVerificationCode(''), null);
  });
});

describe('publicCertificateView (D3)', () => {
  const base = {
    certificateNumber: 'KNH-2026-000001',
    status: 'ISSUED',
    issuedAt: '2026-12-04T08:00:00Z',
    expiresAt: null,
    revokedAt: null,
    revokedReason: 'internal note',
    verificationCode: 'secret-code',
    userId: 'u1',
    user: { givenName: 'Jane', familyName: 'Achieng', email: 'jane@a.ac.ke', id: 'u1' },
    training: { title: 'GCP', cpdHours: 16, accreditationBody: 'KMPDC' },
    institution: { name: 'KNH' },
    snapshot: null,
  };

  it('shows the full name and certificate facts, but no email, ids, code or revoke reason', () => {
    const v = publicCertificateView(base);
    assert.equal(v.state, 'VALID');
    assert.equal(v.participantName, 'Jane Achieng');
    assert.equal(v.trainingTitle, 'GCP');
    assert.equal(v.cpdHours, 16);
    const json = JSON.stringify(publicCertificateView({ ...base, status: 'REVOKED', revokedAt: '2026-12-10T00:00:00Z' }));
    for (const secret of ['jane@a.ac.ke', 'u1', 'secret-code', 'internal note']) assert.equal(json.includes(secret), false, secret);
  });

  it('prefers the issue-time snapshot and reports expiry and revocation', () => {
    const snap = { participantName: 'Jane W. Achieng', trainingTitle: 'GCP (2026)', completionDate: '3 December 2026', cpdHours: '16' };
    const v = publicCertificateView({ ...base, snapshot: snap });
    assert.equal(v.participantName, 'Jane W. Achieng');
    assert.equal(v.trainingTitle, 'GCP (2026)');
    assert.equal(publicCertificateView({ ...base, expiresAt: '2026-01-01T00:00:00Z' }, new Date('2027-01-01')).state, 'EXPIRED');
    const revoked = publicCertificateView({ ...base, status: 'REVOKED', revokedAt: '2026-12-10T00:00:00Z' });
    assert.equal(revoked.state, 'REVOKED');
    assert.equal(revoked.revokedAt, '2026-12-10T00:00:00.000Z');
  });
});
