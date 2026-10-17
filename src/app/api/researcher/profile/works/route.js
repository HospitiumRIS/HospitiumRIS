import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { getScholarMetrics } from '@/lib/openalex';

/**
 * GET /api/researcher/profile/works
 * The researcher's works: pulled live from ORCID, merged with manuscripts
 * published inside Hospitium that ORCID doesn't have yet. Display only — nothing is saved.
 * Duplicates are matched by DOI first, then by normalised title + year.
 * Works are enriched with OpenAlex citation counts / authors / venue, and the response
 * includes Google-Scholar-style metrics (cited by, h-index, i10, per-year, open access, co-authors).
 */

const ORCID_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'HospitiumRis/1.0 (https://hospitiumris.com)',
};

function normalizeDoi(value) {
  if (!value) return null;
  const doi = String(value)
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//, '')
    .replace(/^doi:\s*/, '');
  return doi || null;
}

function normalizeTitle(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function titleKey(work) {
  const t = normalizeTitle(work.title);
  return t ? `${t}|${work.year || ''}` : null;
}

function prettyType(type) {
  if (!type) return null;
  return String(type)
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function fetchOrcidWorks(orcidId) {
  const res = await fetch(`https://pub.orcid.org/v3.0/${orcidId}/works`, {
    headers: ORCID_HEADERS,
    signal: AbortSignal.timeout(10000),
    next: { revalidate: 900 }, // cache ORCID responses for 15 minutes
  });
  if (!res.ok) throw new Error(`ORCID responded ${res.status}`);
  const data = await res.json();

  return (data.group || [])
    .map((group) => {
      // ORCID groups duplicate versions of the same work; the first summary is the preferred one.
      const summary = group['work-summary']?.[0];
      if (!summary) return null;
      const ids = [
        ...(summary['external-ids']?.['external-id'] || []),
        ...(group['external-ids']?.['external-id'] || []),
      ];
      const doiId = ids.find((id) => id['external-id-type'] === 'doi');
      const doi = normalizeDoi(doiId?.['external-id-value'] || doiId?.['external-id-normalized']?.value);
      const pubDate = summary['publication-date'];
      const year = pubDate?.year?.value ? parseInt(pubDate.year.value, 10) : null;
      return {
        id: `orcid-${summary['put-code']}`,
        title: summary.title?.title?.value || 'Untitled',
        journal: summary['journal-title']?.value || null,
        year,
        month: pubDate?.month?.value ? parseInt(pubDate.month.value, 10) : null,
        doi,
        url: summary.url?.value || doiId?.['external-id-url']?.value || (doi ? `https://doi.org/${doi}` : null),
        type: prettyType(summary.type),
        sources: ['ORCID'],
      };
    })
    .filter(Boolean);
}

async function fetchHospitiumPublishedManuscripts(userId) {
  const manuscripts = await prisma.manuscript.findMany({
    where: {
      status: 'PUBLISHED',
      OR: [{ createdBy: userId }, { collaborators: { some: { userId } } }],
    },
    select: {
      id: true,
      title: true,
      type: true,
      publishedAt: true,
      updatedAt: true,
      publication: { select: { doi: true, journal: true, year: true, url: true } },
    },
  });

  return manuscripts.map((m) => {
    const date = m.publishedAt || m.updatedAt;
    const doi = normalizeDoi(m.publication?.doi);
    return {
      id: `manuscript-${m.id}`,
      manuscriptId: m.id,
      title: m.title || 'Untitled',
      journal: m.publication?.journal || null,
      year: m.publication?.year || (date ? new Date(date).getFullYear() : null),
      month: date ? new Date(date).getMonth() + 1 : null,
      doi,
      url: m.publication?.url || (doi ? `https://doi.org/${doi}` : null),
      type: prettyType(m.type),
      sources: ['HOSPITIUM'],
    };
  });
}

function mergeWorks(orcidWorks, hospitiumWorks) {
  const merged = [...orcidWorks];
  const byDoi = new Map();
  const byTitle = new Map();
  for (const w of merged) {
    if (w.doi) byDoi.set(w.doi, w);
    const key = titleKey(w);
    if (key) byTitle.set(key, w);
  }

  for (const h of hospitiumWorks) {
    const match = (h.doi && byDoi.get(h.doi)) || byTitle.get(titleKey(h));
    if (match) {
      if (!match.sources.includes('HOSPITIUM')) match.sources.push('HOSPITIUM');
      match.manuscriptId = h.manuscriptId;
    } else {
      merged.push(h);
    }
  }

  return merged.sort(
    (a, b) => (b.year || 0) - (a.year || 0) || (b.month || 0) - (a.month || 0) || a.title.localeCompare(b.title)
  );
}

/** Attach OpenAlex citation data to merged works (DOI first, then title + year). */
function enrichWithOpenAlex(works, openAlexWorks) {
  const byDoi = new Map();
  const byTitle = new Map();
  for (const o of openAlexWorks) {
    if (o.doi) byDoi.set(o.doi, o);
    const key = titleKey(o);
    if (key && !byTitle.has(key)) byTitle.set(key, o);
  }
  for (const w of works) {
    const o = (w.doi && byDoi.get(w.doi)) || byTitle.get(titleKey(w));
    w.citedBy = o ? o.citedBy : null;
    w.authors = o?.authors || [];
    w.venue = o?.venue || w.journal || null;
    w.isOpenAccess = o ? o.isOpenAccess : null;
    if (!w.doi && o?.doi) w.doi = o.doi;
    if (!w.url && o?.oaUrl) w.url = o.oaUrl;
  }
  return works;
}

async function linkCoauthorsToHospitium(coauthors) {
  const orcids = coauthors.map((c) => c.orcid).filter(Boolean);
  if (!orcids.length) return coauthors;
  const members = await prisma.user.findMany({
    where: { orcidId: { in: orcids }, status: 'ACTIVE' },
    select: { id: true, orcidId: true },
  });
  const byOrcid = new Map(members.map((m) => [m.orcidId?.toUpperCase(), m.id]));
  return coauthors.map((c) => ({ ...c, hospitiumUserId: (c.orcid && byOrcid.get(c.orcid)) || null }));
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    let orcidWorks = [];
    let orcidError = null;
    let scholar = null;
    let metricsError = null;

    const [orcidResult, scholarResult, hospitiumWorks] = await Promise.all([
      user.orcidId ? fetchOrcidWorks(user.orcidId).then((v) => ({ v }), (e) => ({ e })) : { v: [] },
      user.orcidId ? getScholarMetrics(user.orcidId).then((v) => ({ v }), (e) => ({ e })) : { v: null },
      fetchHospitiumPublishedManuscripts(user.id),
    ]);

    if (orcidResult.e) {
      console.error('Error fetching ORCID works:', orcidResult.e);
      orcidError = 'Could not reach ORCID right now. Showing Hospitium works only.';
    } else {
      orcidWorks = orcidResult.v;
    }
    if (scholarResult.e) {
      console.error('Error fetching OpenAlex metrics:', scholarResult.e);
      metricsError = 'Citation metrics are temporarily unavailable.';
    } else {
      scholar = scholarResult.v;
    }

    const works = enrichWithOpenAlex(mergeWorks(orcidWorks, hospitiumWorks), scholar?.works || []);

    let metrics = null;
    if (scholar) {
      const { works: _omit, coauthors, ...rest } = scholar;
      metrics = { ...rest, coauthors: await linkCoauthorsToHospitium(coauthors) };
    }

    return NextResponse.json({
      success: true,
      works,
      counts: {
        total: works.length,
        orcid: orcidWorks.length,
        hospitiumOnly: works.filter((w) => w.sources.length === 1 && w.sources[0] === 'HOSPITIUM').length,
        both: works.filter((w) => w.sources.length === 2).length,
      },
      hasOrcid: Boolean(user.orcidId),
      orcidError,
      metrics,
      metricsError,
      metricsSource: 'OpenAlex',
    });
  } catch (err) {
    console.error('Error building merged works:', err);
    return NextResponse.json({ success: false, message: 'Failed to load works' }, { status: 500 });
  }
}
