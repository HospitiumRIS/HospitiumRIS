import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { userLibraryWhere } from '@/lib/publication-library';
import { computeQualityScore, evidenceFromPublication } from '@/lib/publicationQuality';

const USER_AGENT = 'HospitiumRis/1.0 (mailto:support@hospitium.org)';

function normalizeDoi(doi) {
  return String(doi || '')
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .trim()
    .toLowerCase();
}

function normalizeTitle(title) {
  return String(title || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function extractPmid(value) {
  const text = String(value || '');
  const match = text.match(/(\d{5,})$/);
  return match ? match[1] : text.replace(/\D/g, '') || '';
}

async function fetchJson(url, { timeoutMs = 12000, headers = {} } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
        ...headers,
      },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Citation lookup failed:', url, error.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchICiteByPmids(pmids) {
  const unique = [...new Set(pmids.map((id) => String(id)).filter(Boolean))];
  const byPmid = {};

  for (let i = 0; i < unique.length; i += 200) {
    const chunk = unique.slice(i, i + 200);
    const json = await fetchJson(
      `https://icite.od.nih.gov/api/pubs?pmids=${chunk.join(',')}&format=json`
    );
    const rows = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
    rows.forEach((row) => {
      if (row?.pmid != null) byPmid[String(row.pmid)] = row;
    });
  }

  return byPmid;
}

async function fetchOpenAlexByPmids(pmids) {
  const unique = [...new Set(pmids.map((id) => extractPmid(id)).filter(Boolean))];
  const byPmid = {};

  for (let i = 0; i < unique.length; i += 50) {
    const chunk = unique.slice(i, i + 50);
    const json = await fetchJson(
      `https://api.openalex.org/works?filter=${encodeURIComponent(`pmid:${chunk.join('|')}`)}&select=ids,doi,cited_by_count&per-page=${chunk.length}&mailto=support@hospitium.org`
    );
    (json?.results || []).forEach((work) => {
      const pmid = extractPmid(work.ids?.pmid);
      if (pmid) {
        byPmid[pmid] = {
          cited_by_count: work.cited_by_count || 0,
          doi: normalizeDoi(work.doi || work.ids?.doi),
        };
      }
    });
  }

  return byPmid;
}

async function fetchOpenAlexByDois(dois) {
  const unique = [...new Set(dois.map(normalizeDoi).filter(Boolean))];
  const byDoi = {};

  for (let i = 0; i < unique.length; i += 20) {
    const chunk = unique.slice(i, i + 20);
    const json = await fetchJson(
      `https://api.openalex.org/works?filter=${encodeURIComponent(`doi:${chunk.join('|')}`)}&select=ids,doi,cited_by_count&per-page=${chunk.length}&mailto=support@hospitium.org`
    );
    (json?.results || []).forEach((work) => {
      const doi = normalizeDoi(work.doi || work.ids?.doi);
      if (doi) {
        byDoi[doi] = {
          cited_by_count: work.cited_by_count || 0,
          pmid: extractPmid(work.ids?.pmid),
        };
      }
    });
  }

  return byDoi;
}

async function fetchCrossrefByDois(dois) {
  const unique = [...new Set(dois.map(normalizeDoi).filter(Boolean))];
  const byDoi = {};

  for (let i = 0; i < unique.length; i += 40) {
    const chunk = unique.slice(i, i + 40);
    const filter = chunk.map((doi) => `doi:${doi}`).join(',');
    const json = await fetchJson(
      `https://api.crossref.org/works?filter=${encodeURIComponent(filter)}&select=DOI,is-referenced-by-count&rows=${chunk.length}`
    );
    (json?.message?.items || []).forEach((item) => {
      const doi = normalizeDoi(item.DOI);
      if (doi) byDoi[doi] = item['is-referenced-by-count'] || 0;
    });
  }

  return byDoi;
}

function isInLibrary(pub, libraryPubs) {
  const doi = normalizeDoi(pub.doi);
  const pmid = String(pub.pubmedId || '').trim();
  const title = normalizeTitle(pub.title);
  const year = pub.year ? parseInt(pub.year, 10) : null;

  return libraryPubs.some((item) => {
    if (doi && item.doi && normalizeDoi(item.doi) === doi) return true;
    if (pmid && item.url && item.url.includes(pmid)) return true;
    if (title && year && normalizeTitle(item.title) === title && item.year === year) return true;
    return false;
  });
}

function pickCitationCount({ iCiteCount, openAlexCount, crossrefCount, existingCount }) {
  const candidates = [
    { source: 'OpenAlex', count: Number(openAlexCount) || 0 },
    { source: 'Crossref', count: Number(crossrefCount) || 0 },
    { source: 'NIH iCite', count: Number(iCiteCount) || 0 },
    { source: 'source', count: Number(existingCount) || 0 },
  ];
  return candidates.reduce((best, item) => (item.count > best.count ? item : best), candidates[0]);
}

export async function POST(request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const publications = Array.isArray(body.publications) ? body.publications : [];
    if (!publications.length) {
      return NextResponse.json({ items: {} });
    }

    const libraryPubs = await prisma.publication.findMany({
      where: userLibraryWhere(user.id),
      select: { id: true, doi: true, url: true, title: true, year: true },
    });

    const pmids = publications.map((pub) => pub.pubmedId).filter(Boolean);
    const dois = publications.map((pub) => pub.doi).filter(Boolean);

    const [iCite, openAlexByPmid, openAlexByDoi, crossrefByDoi] = await Promise.all([
      fetchICiteByPmids(pmids),
      fetchOpenAlexByPmids(pmids),
      fetchOpenAlexByDois(dois),
      fetchCrossrefByDois(dois),
    ]);

    const items = {};
    publications.forEach((pub) => {
      const pmid = extractPmid(pub.pubmedId);
      const doi = normalizeDoi(pub.doi);
      const metrics = pmid ? iCite[pmid] : null;
      const openAlex = (pmid && openAlexByPmid[pmid]) || (doi && openAlexByDoi[doi]) || null;
      const evidence = evidenceFromPublication(pub.pubTypes || [], pub.title);
      const picked = pickCitationCount({
        iCiteCount: metrics?.citation_count,
        openAlexCount: openAlex?.cited_by_count,
        crossrefCount: doi ? crossrefByDoi[doi] : 0,
        existingCount: pub.citationCount,
      });
      const citationCount = picked.count;
      const rcr = metrics?.relative_citation_ratio ?? null;
      const nihPercentile = metrics?.nih_percentile ?? null;
      const year = pub.year ? parseInt(pub.year, 10) : null;
      const citationsPerYear = metrics?.citations_per_year
        ?? (year && citationCount
          ? citationCount / Math.max(1, new Date().getFullYear() - year)
          : null);
      const qualityScore = computeQualityScore({
        rcr,
        nihPercentile,
        citationCount,
        citationsPerYear,
        evidenceScore: evidence.score,
      });

      items[pub.id] = {
        inLibrary: isInLibrary(pub, libraryPubs),
        citationCount,
        citationSource: citationCount > 0 ? picked.source : null,
        rcr,
        nihPercentile,
        citationsPerYear,
        qualityScore,
        evidenceLevel: evidence.label,
      };
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Search enrich error:', error);
    return NextResponse.json({ error: 'Failed to enrich search results' }, { status: 500 });
  }
}
