import crypto from 'crypto';

/**
 * Donor privacy helpers (server-side).
 *
 * Foundation APIs send only masked donor details to the browser. Full details are
 * available one donor at a time through POST /api/foundation/donors/reveal, which
 * is restricted to foundation/global admins and written to the activity log.
 *
 *   maskEmail('joy.owango@gmail.com')  -> 'j***@gmail.com'
 *   maskPhone('+254 712 345 678')      -> '+254 7** *** *78'
 *   maskName('Joy Owango', 'Individual') -> 'J** O*****'
 *   maskName('Acme Foundation', 'Foundation') -> 'Acme Foundation' (organisations are not personal data)
 */

export const MASK_CHAR = '*';
export const ANONYMOUS_LABEL = 'Anonymous Donor';

const ORGANISATION_TYPES = /(corporate|corporation|company|business|foundation|trust|organi[sz]ation|ngo|non[- ]?profit|government|institution|church|association|charity|fund|agency)/i;

export function isIndividualDonor(donorType) {
  const type = String(donorType || '').trim();
  if (!type) return true;
  if (/individual|person|private/i.test(type)) return true;
  return !ORGANISATION_TYPES.test(type);
}

export function maskEmail(email) {
  const value = String(email || '').trim();
  if (!value) return value || null;
  const at = value.lastIndexOf('@');
  if (at <= 0) return `${value.charAt(0)}${MASK_CHAR.repeat(3)}`;
  return `${value.charAt(0)}${MASK_CHAR.repeat(3)}${value.slice(at)}`;
}

export function maskPhone(phone) {
  const value = String(phone || '').trim();
  if (!value) return value || null;
  const digitPositions = [];
  for (let i = 0; i < value.length; i += 1) if (/\d/.test(value[i])) digitPositions.push(i);
  const total = digitPositions.length;
  if (!total) return MASK_CHAR.repeat(4);
  // Keep a short leading prefix (country/network code) and the last 2 digits; mask the rest.
  const keepStart = total >= 9 ? 4 : total >= 7 ? 3 : 0;
  const keepEnd = total >= 5 ? 2 : 0;
  const keep = new Set([...digitPositions.slice(0, keepStart), ...digitPositions.slice(total - keepEnd)]);
  return value.split('').map((ch, i) => (/\d/.test(ch) && !keep.has(i) ? MASK_CHAR : ch)).join('');
}

export function maskPersonName(name) {
  const value = String(name || '').trim();
  if (!value) return value;
  return value
    .split(/(\s+|-)/)
    .map((part) => {
      if (!part || /^\s+$/.test(part) || part === '-') return part;
      if (/^(dr|prof|mr|mrs|ms|miss|rev|sir|hon)\.?$/i.test(part)) return part;
      return `${part.charAt(0)}${MASK_CHAR.repeat(Math.max(1, part.length - 1))}`;
    })
    .join('');
}

export function maskName(name, donorType) {
  return isIndividualDonor(donorType) ? maskPersonName(name) : String(name || '').trim();
}

export const looksMasked = (value) => typeof value === 'string' && value.includes(MASK_CHAR);

/** Stable, non-reversible key for grouping/counting donors without exposing their email. */
export function donorKey({ donorEmail, donorName }) {
  const basis = donorEmail ? `e:${String(donorEmail).toLowerCase().trim()}` : `n:${String(donorName || '').toLowerCase().trim()}`;
  return crypto.createHash('sha256').update(basis).digest('hex').slice(0, 16);
}

/** Mask the personal fields of a donation-like object (keeps every other field). */
export function maskDonor(record) {
  if (!record) return record;
  const anonymous = Boolean(record.isAnonymous);
  const key = donorKey(record);
  return {
    ...record,
    donorName: anonymous ? ANONYMOUS_LABEL : maskName(record.donorName, record.donorType),
    donorEmail: anonymous ? null : maskEmail(record.donorEmail),
    donorPhone: anonymous ? null : maskPhone(record.donorPhone),
    ...(Object.prototype.hasOwnProperty.call(record, 'displayName')
      ? { displayName: anonymous ? ANONYMOUS_LABEL : maskName(record.donorName, record.donorType) }
      : {}),
    donorKey: anonymous ? `anon-${record.id || key}` : key,
    piiMasked: true,
  };
}

/**
 * When an edit form sends back masked values, keep what is stored.
 * Returns the value to persist for a personal field.
 */
export function resolveIncomingPii(incoming, stored) {
  if (incoming === undefined) return stored;
  if (looksMasked(incoming)) return stored;
  const trimmed = typeof incoming === 'string' ? incoming.trim() : incoming;
  return trimmed === '' ? null : trimmed;
}
