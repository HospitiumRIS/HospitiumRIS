const ORCID_REGEX = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i;

export function normalizeOrcid(value) {
  if (value === undefined) return undefined;
  if (value === null || (typeof value === 'string' && !value.trim())) return null;
  const cleaned = String(value)
    .trim()
    .replace(/^https?:\/\/orcid\.org\//i, '');
  if (!ORCID_REGEX.test(cleaned)) {
    return { error: 'ORCID iD must look like 0000-0001-2345-6789' };
  }
  return cleaned.toUpperCase();
}
