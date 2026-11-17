import prisma from '@/lib/prisma';
import { getScholarMetrics } from '@/lib/openalex';

/**
 * Researcher citation metrics (total citations and h-index) on
 * ResearchProfile, kept in sync from OpenAlex via the researcher's ORCID iD.
 *
 * ORCID itself carries no citation counts; OpenAlex indexes works by ORCID
 * and reports cited-by counts, from which getScholarMetrics computes totals
 * and the h-index.
 */

const DEFAULT_MAX_AGE_HOURS = 24;

export function normalizeOrcid(value) {
  const match = String(value || '').toUpperCase().match(/\d{4}-\d{4}-\d{4}-\d{3}[\dX]/);
  return match ? match[0] : null;
}

export function isMetricsStale(researchProfile, maxAgeHours = DEFAULT_MAX_AGE_HOURS) {
  const syncedAt = researchProfile?.metricsSyncedAt ? new Date(researchProfile.metricsSyncedAt) : null;
  if (!syncedAt || Number.isNaN(syncedAt.getTime())) return true;
  return Date.now() - syncedAt.getTime() > maxAgeHours * 3600 * 1000;
}

/**
 * Save already-computed metrics (the `citedBy` block from getScholarMetrics)
 * to the user's research profile. A null `citedBy` means OpenAlex has no
 * works for this ORCID: we record the sync time and leave existing values.
 */
export async function saveResearcherMetrics(userId, citedBy) {
  const now = new Date();
  const values = citedBy
    ? { hIndex: citedBy.hIndex?.all ?? 0, citationCount: citedBy.citations?.all ?? 0, metricsSyncedAt: now }
    : { metricsSyncedAt: now };
  return prisma.researchProfile.upsert({
    where: { userId },
    update: values,
    create: { userId, specialization: [], keywords: [], ...values },
    select: { hIndex: true, citationCount: true, metricsSyncedAt: true },
  });
}

/** Fetch metrics from OpenAlex for one researcher and save them. */
export async function syncResearcherMetrics({ id, orcidId }) {
  const orcid = normalizeOrcid(orcidId);
  if (!orcid) return null;
  const scholar = await getScholarMetrics(orcid);
  return saveResearcherMetrics(id, scholar?.citedBy || null);
}

/**
 * Sync researchers whose metrics are missing or older than maxAgeHours.
 * `users` are { id, orcidId, researchProfile } records. Returns a Map of
 * userId -> saved profile metrics for the ones that were refreshed.
 * Bounded so a page load never waits on more than `limit` OpenAlex lookups.
 */
export async function syncStaleResearcherMetrics(users, { maxAgeHours = DEFAULT_MAX_AGE_HOURS, limit = 25, concurrency = 4 } = {}) {
  const queue = users
    .filter((u) => normalizeOrcid(u.orcidId) && isMetricsStale(u.researchProfile, maxAgeHours))
    .sort((a, b) => (a.researchProfile?.metricsSyncedAt ? 1 : 0) - (b.researchProfile?.metricsSyncedAt ? 1 : 0))
    .slice(0, limit);

  const results = new Map();
  let next = 0;
  const worker = async () => {
    while (next < queue.length) {
      const user = queue[next];
      next += 1;
      try {
        const saved = await syncResearcherMetrics(user);
        if (saved) results.set(user.id, saved);
      } catch (error) {
        console.error(`Citation metrics sync failed for user ${user.id}:`, error.message);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker));
  return results;
}
