import crypto from 'crypto';
import { getSessionCookieOptions } from '@/lib/session-cookie';

/**
 * Short-lived proof that the current browser completed ORCID OAuth.
 *
 * Set by the token exchange (the only place the server learns an ORCID iD
 * directly from ORCID) and required by ORCID sign-in and ORCID-based
 * registration, so neither ever trusts an ORCID iD sent by the browser.
 *
 * Format: base64url(JSON payload) + "." + base64url(HMAC-SHA256 signature).
 */

export const ORCID_PROOF_COOKIE = 'hospitium_orcid_proof';
const MAX_AGE_SECONDS = 20 * 60;

function signingKey() {
  const secret = process.env.SESSION_SECRET || process.env.ORCID_CLIENT_SECRET;
  if (!secret) throw new Error('No secret configured for ORCID sign-in (SESSION_SECRET or ORCID_CLIENT_SECRET)');
  // Derive a purpose-specific key so the raw secret is never used directly
  return crypto.createHmac('sha256', secret).update('hospitium:orcid-proof:v1').digest();
}

function sign(data) {
  return crypto.createHmac('sha256', signingKey()).update(data).digest('base64url');
}

export function createOrcidProof({ orcid, givenNames = '', familyName = '' }, now = Date.now()) {
  const payload = {
    orcid,
    givenNames,
    familyName,
    exp: Math.floor(now / 1000) + MAX_AGE_SECONDS,
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${data}.${sign(data)}`;
}

/** Returns the payload if the proof is authentic and unexpired, else null. */
export function verifyOrcidProof(value, now = Date.now()) {
  if (!value || typeof value !== 'string') return null;
  const [data, signature] = value.split('.');
  if (!data || !signature) return null;
  const expected = Buffer.from(sign(data));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (!payload?.orcid || !payload.exp || payload.exp * 1000 < now) return null;
    return payload;
  } catch {
    return null;
  }
}

export function readOrcidProof(request) {
  return verifyOrcidProof(request.cookies.get(ORCID_PROOF_COOKIE)?.value);
}

export function setOrcidProofCookie(response, details) {
  response.cookies.set(ORCID_PROOF_COOKIE, createOrcidProof(details), getSessionCookieOptions(MAX_AGE_SECONDS));
}

export function clearOrcidProofCookie(response) {
  response.cookies.set(ORCID_PROOF_COOKIE, '', { ...getSessionCookieOptions(0), maxAge: 0 });
}

/**
 * ORCID iDs are stored in a few shapes (bare iD or full https://orcid.org/
 * URL). Returns the possible stored forms for a bare iD, for lookups.
 */
export function orcidLookupValues(orcid) {
  const bare = String(orcid || '').replace(/^https?:\/\/(sandbox\.)?orcid\.org\//i, '').trim();
  return [...new Set([bare, `https://orcid.org/${bare}`, `https://sandbox.orcid.org/${bare}`, `http://orcid.org/${bare}`])];
}
