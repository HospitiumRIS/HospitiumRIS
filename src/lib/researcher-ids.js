/**
 * External researcher identifiers (Google Scholar, Scopus, Web of Science, ...).
 * Pure functions — safe to import from both server routes and client components.
 *
 * Stored on ResearchProfile.researcherIds as: [{ type, value, label? }]
 *   - value is the bare identifier (not a URL), except for OTHER where it is a URL.
 * ORCID is not stored here; it lives on User.orcidId.
 */

export const RESEARCHER_ID_TYPES = {
  GOOGLE_SCHOLAR: {
    label: 'Google Scholar',
    short: 'Scholar',
    color: '#4285f4',
    placeholder: 'Profile URL or user ID (e.g. qc6CJjYAAAAJ)',
    help: 'Copy the link to your Google Scholar profile, or just the code after "user=".',
    // user IDs are 12 chars ending in AAAAJ, but accept any token
    parse: (input) => {
      const m = input.match(/[?&]user=([\w-]+)/);
      if (m) return m[1];
      return /^[\w-]{6,20}$/.test(input) ? input : null;
    },
    url: (id) => `https://scholar.google.com/citations?user=${encodeURIComponent(id)}`,
  },
  SCOPUS: {
    label: 'Scopus Author ID',
    short: 'Scopus',
    color: '#e9711c',
    placeholder: 'Profile URL or author ID (e.g. 57193456789)',
    help: 'Numeric ID shown on your Scopus author page.',
    parse: (input) => {
      const m = input.match(/authorId=(\d+)/i) || input.match(/^(\d{6,14})$/);
      return m ? m[1] : null;
    },
    url: (id) => `https://www.scopus.com/authid/detail.uri?authorId=${encodeURIComponent(id)}`,
  },
  WEB_OF_SCIENCE: {
    label: 'Web of Science ResearcherID',
    short: 'WoS',
    color: '#5e33bf',
    placeholder: 'ResearcherID (e.g. ABC-1234-2020)',
    help: 'Your Web of Science / Publons ResearcherID.',
    parse: (input) => {
      const m = input.match(/([A-Z]{1,3}-\d{4}-\d{4})/i);
      return m ? m[1].toUpperCase() : null;
    },
    url: (id) => `https://www.webofscience.com/wos/author/record/${encodeURIComponent(id)}`,
  },
  RESEARCHGATE: {
    label: 'ResearchGate',
    short: 'ResearchGate',
    color: '#00ccbb',
    placeholder: 'Profile URL or name (e.g. Jane-Doe-2)',
    help: 'The part of your profile link after /profile/.',
    parse: (input) => {
      const m = input.match(/researchgate\.net\/profile\/([^/?#]+)/i);
      if (m) return m[1];
      return /^[\w.-]{3,100}$/.test(input) ? input : null;
    },
    url: (id) => `https://www.researchgate.net/profile/${encodeURIComponent(id)}`,
  },
  SEMANTIC_SCHOLAR: {
    label: 'Semantic Scholar',
    short: 'Semantic Scholar',
    color: '#1857b6',
    placeholder: 'Profile URL or author ID (e.g. 1741101)',
    help: 'Numeric author ID from your Semantic Scholar page.',
    parse: (input) => {
      const m = input.match(/semanticscholar\.org\/author\/(?:[^/]+\/)?(\d+)/i) || input.match(/^(\d{3,15})$/);
      return m ? m[1] : null;
    },
    url: (id) => `https://www.semanticscholar.org/author/${encodeURIComponent(id)}`,
  },
  OPENALEX: {
    label: 'OpenAlex',
    short: 'OpenAlex',
    color: '#d6336c',
    placeholder: 'Author ID (e.g. A5023888391)',
    help: 'Usually found automatically from your ORCID iD.',
    parse: (input) => {
      const m = input.match(/(A\d{4,12})/i);
      return m ? m[1].toUpperCase() : null;
    },
    url: (id) => `https://openalex.org/authors/${encodeURIComponent(id)}`,
  },
  LOOP: {
    label: 'Loop (Frontiers)',
    short: 'Loop',
    color: '#f05a28',
    placeholder: 'Profile URL or ID (e.g. 123456)',
    help: 'Numeric ID from your Loop profile link.',
    parse: (input) => {
      const m = input.match(/loop\.frontiersin\.org\/people\/(\d+)/i) || input.match(/^(\d{3,12})$/);
      return m ? m[1] : null;
    },
    url: (id) => `https://loop.frontiersin.org/people/${encodeURIComponent(id)}`,
  },
  OTHER: {
    label: 'Other',
    short: 'Other',
    color: '#64748b',
    placeholder: 'https://…',
    help: 'Any other researcher profile. Give it a name and paste the link.',
    parse: (input) => {
      try {
        const u = new URL(input);
        return ['http:', 'https:'].includes(u.protocol) ? u.toString() : null;
      } catch {
        return null;
      }
    },
    url: (value) => value,
  },
};

export const MAX_RESEARCHER_IDS = 15;

/** Validate and normalise a single entry. Returns { entry } or { error }. */
export function normalizeResearcherId(raw) {
  const type = raw?.type;
  const def = RESEARCHER_ID_TYPES[type];
  if (!def) return { error: 'Unknown identifier type' };
  const input = String(raw?.value ?? '').trim();
  if (!input) return { error: `${def.label}: value is required` };
  const value = def.parse(input);
  if (!value) return { error: `${def.label}: "${input}" doesn't look valid. ${def.help}` };
  const entry = { type, value };
  if (type === 'OTHER') {
    const label = String(raw?.label ?? '').trim().slice(0, 60);
    if (!label) return { error: 'Other: please give the profile a name' };
    entry.label = label;
  }
  return { entry };
}

/** Validate a whole list (dedupes identical type+value). Returns { ids } or { error }. */
export function normalizeResearcherIdList(list) {
  if (!Array.isArray(list)) return { error: 'researcherIds must be a list' };
  if (list.length > MAX_RESEARCHER_IDS) return { error: `You can add up to ${MAX_RESEARCHER_IDS} identifiers` };
  const seen = new Set();
  const ids = [];
  for (const raw of list) {
    const { entry, error } = normalizeResearcherId(raw);
    if (error) return { error };
    const key = `${entry.type}|${entry.value.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    ids.push(entry);
  }
  return { ids };
}

/** Display helpers for a stored entry. */
export function researcherIdDisplay(entry) {
  const def = RESEARCHER_ID_TYPES[entry?.type] || RESEARCHER_ID_TYPES.OTHER;
  return {
    label: entry?.type === 'OTHER' ? entry.label || 'Profile' : def.label,
    short: entry?.type === 'OTHER' ? entry.label || 'Profile' : def.short,
    color: def.color,
    url: def.url(entry.value),
    value: entry.value,
  };
}

/**
 * Read stored ids, folding in the legacy ResearchProfile.googleScholar column
 * (kept in sync for backwards compatibility).
 */
export function readResearcherIds(researchProfile) {
  const stored = Array.isArray(researchProfile?.researcherIds) ? researchProfile.researcherIds : [];
  const ids = stored.filter((e) => e && RESEARCHER_ID_TYPES[e.type] && e.value);
  const legacy = researchProfile?.googleScholar;
  if (legacy && !ids.some((e) => e.type === 'GOOGLE_SCHOLAR')) {
    const value = RESEARCHER_ID_TYPES.GOOGLE_SCHOLAR.parse(String(legacy).trim());
    if (value) ids.unshift({ type: 'GOOGLE_SCHOLAR', value });
  }
  return ids;
}
