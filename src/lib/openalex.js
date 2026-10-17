/**
 * OpenAlex integration (https://openalex.org) — free scholarly index, no API key.
 * Used for Google-Scholar-style metrics on researcher profiles, keyed by ORCID iD.
 *
 * Counts are typically somewhat lower than Google Scholar because OpenAlex indexes
 * fewer sources (no theses, slides, etc.), but they are reproducible and legal to use.
 */

const OPENALEX_BASE = 'https://api.openalex.org';
const MAX_WORKS = 1000;
export const METRICS_WINDOW_YEARS = 5; // "Since <year>" column, like Scholar

function withMailto(url) {
  // Joining the OpenAlex "polite pool" gives faster, more reliable responses.
  const mailto = process.env.OPENALEX_MAILTO;
  if (!mailto) return url;
  return `${url}${url.includes('?') ? '&' : '?'}mailto=${encodeURIComponent(mailto)}`;
}

async function openAlexGet(path) {
  const res = await fetch(withMailto(`${OPENALEX_BASE}${path}`), {
    headers: { Accept: 'application/json', 'User-Agent': 'HospitiumRis/1.0 (https://hospitiumris.com)' },
    signal: AbortSignal.timeout(12000),
    next: { revalidate: 3600 }, // metrics change slowly; cache for an hour
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`OpenAlex responded ${res.status}`);
  return res.json();
}

export function normalizeDoi(value) {
  if (!value) return null;
  const doi = String(value)
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//, '')
    .replace(/^doi:\s*/, '');
  return doi || null;
}

function normalizeOrcidUrl(value) {
  if (!value) return null;
  const m = String(value).match(/(\d{4}-\d{4}-\d{4}-\d{3}[\dX])/i);
  return m ? m[1].toUpperCase() : null;
}

/** "Kevin Okoth Ouko" -> "KO Ouko" (Scholar style). */
export function abbreviateName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] || '';
  const last = parts[parts.length - 1];
  const initials = parts
    .slice(0, -1)
    .map((p) => p.replace(/[^A-Za-zÀ-ÿ]/g, '').charAt(0).toUpperCase())
    .join('');
  return `${initials} ${last}`;
}

/** h-index and i10-index from a list of citation counts. */
export function computeIndices(citationCounts) {
  const sorted = [...citationCounts].sort((a, b) => b - a);
  let h = 0;
  while (h < sorted.length && sorted[h] >= h + 1) h += 1;
  const i10 = sorted.filter((c) => c >= 10).length;
  return { hIndex: h, i10Index: i10 };
}

function venueString(work) {
  const source = work.primary_location?.source?.display_name || null;
  const b = work.biblio || {};
  let detail = '';
  if (b.volume) detail += b.volume;
  if (b.issue) detail += ` (${b.issue})`;
  const pages = b.first_page && b.last_page && b.first_page !== b.last_page
    ? `${b.first_page}-${b.last_page}`
    : b.first_page || '';
  if (pages) detail += detail ? `, ${pages}` : pages;
  return [source, detail].filter(Boolean).join(' ') || null;
}

async function fetchAllWorks(orcid) {
  const select = [
    'id', 'doi', 'title', 'publication_year', 'cited_by_count', 'counts_by_year',
    'authorships', 'primary_location', 'open_access', 'biblio', 'type',
  ].join(',');
  const works = [];
  let cursor = '*';
  while (cursor && works.length < MAX_WORKS) {
    const data = await openAlexGet(
      `/works?filter=author.orcid:${orcid}&per-page=200&select=${select}&cursor=${encodeURIComponent(cursor)}`
    );
    if (!data) break;
    works.push(...(data.results || []));
    cursor = data.meta?.next_cursor || null;
    if (!data.results?.length) break;
  }
  return works;
}

/**
 * Build Scholar-style data for an ORCID iD.
 * Returns null when OpenAlex has no works for this ORCID.
 */
export async function getScholarMetrics(orcid) {
  const raw = await fetchAllWorks(orcid);
  if (!raw.length) return null;

  const currentYear = new Date().getFullYear();
  const sinceYear = currentYear - METRICS_WINDOW_YEARS;
  const selfOrcid = orcid.toUpperCase();

  // ---- per-work data
  const works = raw.map((w) => {
    const citedSince = (w.counts_by_year || [])
      .filter((c) => c.year >= sinceYear)
      .reduce((sum, c) => sum + (c.cited_by_count || 0), 0);
    const authorNames = (w.authorships || []).map((a) => a.author?.display_name).filter(Boolean);
    return {
      openAlexId: w.id,
      doi: normalizeDoi(w.doi),
      title: w.title || 'Untitled',
      year: w.publication_year || null,
      citedBy: w.cited_by_count || 0,
      citedSince,
      authors: authorNames.map(abbreviateName),
      venue: venueString(w),
      isOpenAccess: Boolean(w.open_access?.is_oa),
      oaUrl: w.open_access?.oa_url || null,
      countsByYear: w.counts_by_year || [],
      authorships: w.authorships || [],
    };
  });

  // ---- cited-by table
  const all = computeIndices(works.map((w) => w.citedBy));
  const since = computeIndices(works.map((w) => w.citedSince));
  const citationsAll = works.reduce((s, w) => s + w.citedBy, 0);
  const citationsSince = works.reduce((s, w) => s + w.citedSince, 0);

  // ---- citations per year (last 7 years incl. current)
  const perYear = new Map();
  for (let y = currentYear - 6; y <= currentYear; y += 1) perYear.set(y, 0);
  for (const w of works) {
    for (const c of w.countsByYear) {
      if (perYear.has(c.year)) perYear.set(c.year, perYear.get(c.year) + (c.cited_by_count || 0));
    }
  }

  // ---- open access
  const openAccess = {
    available: works.filter((w) => w.isOpenAccess).length,
    notAvailable: works.filter((w) => !w.isOpenAccess).length,
  };

  // ---- co-authors (aggregated across all works)
  const coauthors = new Map();
  for (const w of works) {
    const isSelf = (a) => normalizeOrcidUrl(a.author?.orcid) === selfOrcid;
    if (!w.authorships.some(isSelf)) continue; // only works where we can identify the researcher
    for (const a of w.authorships) {
      if (isSelf(a) || !a.author?.id) continue;
      const key = a.author.id;
      const entry = coauthors.get(key) || {
        openAlexId: a.author.id,
        name: a.author.display_name,
        orcid: normalizeOrcidUrl(a.author.orcid),
        institution: null,
        institutionYear: -1,
        sharedWorks: 0,
      };
      entry.sharedWorks += 1;
      // keep the most recent affiliation we've seen
      const inst = a.institutions?.[0]?.display_name;
      if (inst && (w.year || 0) > entry.institutionYear) {
        entry.institution = inst;
        entry.institutionYear = w.year || 0;
      }
      if (!entry.orcid) entry.orcid = normalizeOrcidUrl(a.author.orcid);
      coauthors.set(key, entry);
    }
  }
  const topCoauthors = [...coauthors.values()]
    .sort((a, b) => b.sharedWorks - a.sharedWorks || a.name.localeCompare(b.name))
    .slice(0, 20)
    .map(({ institutionYear, ...rest }) => rest);

  return {
    sinceYear,
    citedBy: {
      citations: { all: citationsAll, since: citationsSince },
      hIndex: { all: all.hIndex, since: since.hIndex },
      i10Index: { all: all.i10Index, since: since.i10Index },
    },
    citationsPerYear: [...perYear.entries()].map(([year, count]) => ({ year, count })),
    openAccess,
    coauthors: topCoauthors,
    works: works.map(({ countsByYear, authorships, ...rest }) => rest),
  };
}
