/**
 * Certificate issuance rules (#99). Server-only (node:crypto); no database access.
 */

import { randomBytes } from 'node:crypto';

/** 128-bit, URL-safe, unguessable code printed and encoded in the QR code. */
export function generateVerificationCode() {
  return randomBytes(16).toString('base64url');
}

export function verifyUrl(baseUrl, code) {
  return `${String(baseUrl || '').replace(/\/$/, '')}/verify/certificate/${encodeURIComponent(code)}`;
}

/** Expiry from the training's validity in months (null = never). */
export function certificateExpiry(issuedAt, months) {
  if (!months) return null;
  const d = new Date(issuedAt);
  const day = d.getUTCDate();
  d.setUTCMonth(d.getUTCMonth() + Number(months));
  // 31 Jan + 1 month -> end of February, not 3 March.
  if (d.getUTCDate() !== day) d.setUTCDate(0);
  return d;
}

/**
 * Sort a training's active registrations into the admin's certificate lists.
 * @param {object[]} registrations  { id, status, certificate|null }
 * @returns {{ ready, issued, revoked, notYet }}
 *   ready = completed with no certificate file yet; revoked ones can be reissued from their own list.
 */
export function classifyCertificates(registrations) {
  const out = { ready: [], issued: [], revoked: [], notYet: [] };
  for (const r of registrations || []) {
    const cert = r.certificate || null;
    if (cert && cert.status === 'REVOKED') out.revoked.push(r);
    else if (cert && cert.certificateUrl) out.issued.push(r);
    else if (r.status === 'COMPLETED') out.ready.push(r);
    else out.notYet.push(r);
  }
  return out;
}

/** Can a certificate be generated for this registration? */
export function canIssueFor(registration) {
  if (!registration) return { ok: false, error: 'Registration not found' };
  if (registration.status !== 'COMPLETED') return { ok: false, error: 'Only participants who completed the training can get a certificate' };
  return { ok: true };
}

/** Status shown to people: issued, revoked or expired. */
export function certificateState(cert, now = new Date()) {
  if (!cert) return 'NONE';
  if (cert.status === 'REVOKED') return 'REVOKED';
  if (cert.expiresAt && new Date(cert.expiresAt) < now) return 'EXPIRED';
  return 'VALID';
}
