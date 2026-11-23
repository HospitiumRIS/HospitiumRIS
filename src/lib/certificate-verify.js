/**
 * Public certificate verification (#101). Pure: shapes what the public may see.
 * Decision D3: the full name is shown; no email, user id or other personal data.
 */

import { certificateState } from './certificate-issuance.js';

/** Accepts a bare code or a pasted verification URL. */
export function extractVerificationCode(input) {
  const value = String(input || '').trim();
  if (!value) return null;
  const fromUrl = /\/verify\/certificate\/([A-Za-z0-9_-]+)/.exec(value);
  const code = fromUrl ? fromUrl[1] : value;
  return /^[A-Za-z0-9_-]{16,64}$/.test(code) ? code : null;
}

function dateOnly(d) {
  return d ? new Date(d).toISOString() : null;
}

/**
 * @param {object} cert  certificate with training { title, cpdHours, cpdPoints, accreditationBody,
 *                       accreditationNumber, endDate }, user { givenName, familyName }, institution { name }
 */
export function publicCertificateView(cert, now = new Date()) {
  const snap = cert.snapshot || {};
  const name = snap.participantName
    || [cert.user?.givenName, cert.user?.familyName].filter(Boolean).join(' ')
    || 'Name not recorded';
  const state = certificateState(cert, now);
  return {
    state, // VALID | EXPIRED | REVOKED
    certificateNumber: cert.certificateNumber,
    participantName: name,
    trainingTitle: snap.trainingTitle || cert.training?.title || '',
    institutionName: snap.institutionName || cert.institution?.name || '',
    completionDate: snap.completionDate || null,
    issuedAt: dateOnly(cert.issuedAt),
    expiresAt: dateOnly(cert.expiresAt),
    revokedAt: state === 'REVOKED' ? dateOnly(cert.revokedAt) : null,
    cpdHours: snap.cpdHours || (cert.training?.cpdHours ?? null),
    cpdPoints: snap.cpdPoints || (cert.training?.cpdPoints ?? null),
    accreditationBody: snap.accreditationBody || cert.training?.accreditationBody || null,
    accreditationNumber: snap.accreditationNumber || cert.training?.accreditationNumber || null,
  };
}
