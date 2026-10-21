import prisma from './prisma';
import { buildResearcherWorks } from './researcher-works';
import { computeResearcherOutputs } from './researcher-output';

/**
 * Researcher impact report (GET /api/researcher/analytics/impact).
 *
 * Every figure comes from a real source:
 *  - Works: the researcher's ORCID record merged with work published in Hospitium
 *  - Citations, h-index, i10-index, citations per year, open access, co-authors: OpenAlex
 *  - Platform output by role (lead / co-author, collaborator, PI / co-investigator): Hospitium
 * Nothing is estimated. When a source is unavailable the field is null and `dataSources`
 * explains why, so the page can say so instead of inventing a number.
 *
 * Keys used by services/impactInsightsService.js are preserved:
 *   overview.{totalCitations,hIndex,totalPublications,collaborators}, topPublications, trajectory, collaborationNetwork
 */

export const ESTIMATED_FIELDS = [];

const RECENT_YEARS = 5;

export async function getImpactMetrics(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, orcidId: true, givenName: true, familyName: true, researchProfile: { select: { hIndex: true, citationCount: true } } },
  });
  if (!user) throw new Error('User not found');

  const [worksPayload, outputs] = await Promise.all([
    buildResearcherWorks(user),
    computeResearcherOutputs([{ id: user.id, orcidId: user.orcidId, email: user.email }]),
  ]);

  const works = worksPayload.works || [];
  const m = worksPayload.metrics;
  const platform = outputs.get(user.id);
  const currentYear = new Date().getFullYear();
  const sinceYear = currentYear - RECENT_YEARS + 1;

  const citedWorks = works.filter((w) => typeof w.citedBy === 'number');
  const citationsAll = m?.citedBy?.citations?.all ?? user.researchProfile?.citationCount ?? null;
  const hIndex = m?.citedBy?.hIndex?.all ?? user.researchProfile?.hIndex ?? null;
  const i10Index = m?.citedBy?.i10Index?.all ?? null;
  const worksWithCitations = citedWorks.filter((w) => w.citedBy > 0).length;
  const oaKnown = works.filter((w) => w.isOpenAccess !== null && w.isOpenAccess !== undefined);
  const openAccessRate = oaKnown.length ? Math.round((oaKnown.filter((w) => w.isOpenAccess).length / oaKnown.length) * 100) : null;
  const recentWorks = works.filter((w) => w.year && w.year >= sinceYear).length;

  // Publications per year (from works) joined with citations received per year (OpenAlex).
  const pubsByYear = new Map();
  works.forEach((w) => { if (w.year) pubsByYear.set(w.year, (pubsByYear.get(w.year) || 0) + 1); });
  const citesByYear = new Map((m?.citationsPerYear || []).map((r) => [r.year, r.count]));
  const years = [...new Set([...pubsByYear.keys(), ...citesByYear.keys()])].filter((y) => y >= currentYear - 14).sort((a, b) => a - b);
  const trajectory = years.map((year) => ({ year, publications: pubsByYear.get(year) || 0, citations: citesByYear.has(year) ? citesByYear.get(year) : null }));

  const citationsRecent = (m?.citationsPerYear || []).filter((r) => r.year >= sinceYear).reduce((s, r) => s + r.count, 0);
  const lastYear = citesByYear.get(currentYear - 1) ?? null;
  const yearBefore = citesByYear.get(currentYear - 2) ?? null;
  const citationGrowth = lastYear !== null && yearBefore ? Math.round(((lastYear - yearBefore) / yearBefore) * 1000) / 10 : null;

  const topPublications = [...works]
    .sort((a, b) => (b.citedBy || 0) - (a.citedBy || 0) || (b.year || 0) - (a.year || 0))
    .slice(0, 25)
    .map((w) => ({
      id: w.id,
      title: w.title,
      citations: w.citedBy ?? null,
      citationsPerYear: w.citedBy && w.year ? Math.round((w.citedBy / Math.max(1, currentYear - w.year + 1)) * 10) / 10 : null,
      year: w.year,
      journal: w.venue || w.journal || null,
      type: w.type || null,
      doi: w.doi,
      url: w.url,
      isOpenAccess: w.isOpenAccess ?? null,
      sources: w.sources,
      authors: w.authors || [],
    }));

  const venueMap = new Map();
  works.forEach((w) => {
    const v = w.venue || w.journal;
    if (!v) return;
    const row = venueMap.get(v) || { venue: v, works: 0, citations: 0 };
    row.works += 1;
    row.citations += w.citedBy || 0;
    venueMap.set(v, row);
  });
  const topVenues = [...venueMap.values()].sort((a, b) => b.works - a.works || b.citations - a.citations).slice(0, 8);

  const typeMap = new Map();
  works.forEach((w) => { const t = w.type || 'Other'; typeMap.set(t, (typeMap.get(t) || 0) + 1); });
  const workTypes = [...typeMap.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);

  const coauthors = m?.coauthors || [];
  const collaborationNetwork = coauthors.slice(0, 12).map((c) => ({
    name: c.name,
    institution: c.institution || null,
    sharedWorks: c.sharedWorks || 0,
    orcid: c.orcid || null,
    hospitiumUserId: c.hospitiumUserId || null,
    openAlexId: c.openAlexId || null,
  }));
  const instMap = new Map();
  coauthors.forEach((c) => {
    if (!c.institution) return;
    instMap.set(c.institution, (instMap.get(c.institution) || 0) + (c.sharedWorks || 1));
  });
  const collaboratingInstitutions = [...instMap.entries()].map(([institution, sharedWorks]) => ({ institution, sharedWorks })).sort((a, b) => b.sharedWorks - a.sharedWorks).slice(0, 8);

  return {
    overview: {
      totalPublications: works.length,
      recentPublications: recentWorks,
      totalCitations: citationsAll,
      citationsRecent: m ? citationsRecent : null,
      citationGrowth,
      hIndex,
      hIndexRecent: m?.citedBy?.hIndex?.since ?? null,
      i10Index,
      i10IndexRecent: m?.citedBy?.i10Index?.since ?? null,
      avgCitationsPerWork: citedWorks.length && citationsAll !== null ? Math.round((citationsAll / citedWorks.length) * 10) / 10 : null,
      citedWorksRate: citedWorks.length ? Math.round((worksWithCitations / citedWorks.length) * 100) : null,
      openAccessRate,
      collaborators: coauthors.length,
      platformOutput: platform.totals.all,
    },
    recentWindowYears: RECENT_YEARS,
    trajectory,
    citationsPerYear: m?.citationsPerYear || [],
    topPublications,
    topVenues,
    workTypes,
    openAccess: m?.openAccess || null,
    collaborationNetwork,
    collaboratingInstitutions,
    platform,
    dataSources: {
      hasOrcid: worksPayload.hasOrcid,
      orcidError: worksPayload.orcidError,
      metricsError: worksPayload.metricsError,
      metricsSource: worksPayload.metricsSource,
      counts: worksPayload.counts,
    },
    meta: {
      estimatedFields: ESTIMATED_FIELDS,
      generatedAt: new Date().toISOString(),
    },
  };
}
