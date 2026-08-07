import prisma from './prisma';
import { subMonths, format } from 'date-fns';

// Fields we cannot yet compute from real, per-event data (no monthly citation
// events, no altmetric/view tracking tables). We still surface them because
// researchers expect to see them, but we compute deterministic, clearly
// labeled estimates instead of random mock numbers, and flag them in `meta`.
export const ESTIMATED_FIELDS = [
  'citationTrend',
  'totalViews',
  'totalDownloads',
  'i10Index',
  'altmetricScore',
  'socialMediaMentions',
  'newsArticles',
  'policyDocuments',
  'blogPosts'
];

export async function getImpactMetrics(userId) {
  // --- Publications, co-authors, real citation counts ---
  const publications = await prisma.publication.findMany({
    where: {
      authorRelations: { some: { userId } }
    },
    include: {
      authorRelations: {
        include: {
          user: {
            select: { givenName: true, familyName: true, institution: true }
          }
        }
      },
      manuscriptCitations: true
    },
    orderBy: { publicationDate: 'desc' }
  });

  const researchProfile = await prisma.researchProfile.findUnique({ where: { userId } });

  // --- Core publication/citation metrics (real) ---
  const totalPublications = publications.length;

  const citationCountByPublication = publications.map((pub) => {
    const realCitationCount = (pub.manuscriptCitations || []).reduce(
      (sum, mc) => sum + (mc.citationCount || 0),
      0
    );
    return { pub, realCitationCount };
  });

  const internalCitationTotal = citationCountByPublication.reduce(
    (sum, p) => sum + p.realCitationCount,
    0
  );

  // Prefer the tracked citationCount on the research profile (e.g. synced
  // from ORCID/Scholar) when present; fall back to internally-tracked
  // manuscript citations so the number is never just "0" for active users.
  const totalCitations = researchProfile?.citationCount ?? internalCitationTotal;
  const hIndex = researchProfile?.hIndex || 0;

  // i10-Index (publications with >=10 citations) - estimated because we
  // only have real citation counts for internally-tracked manuscript
  // citations, not external citation databases.
  const publicationsWithTenPlus = citationCountByPublication.filter(
    (p) => p.realCitationCount >= 10
  ).length;
  const i10Index = totalCitations > 0
    ? Math.max(publicationsWithTenPlus, Math.floor(totalPublications * 0.2))
    : 0;

  // --- Collaborators (real, from co-authorship) ---
  const collaboratorSet = new Set();
  const institutionCollaborations = {};

  publications.forEach((pub) => {
    pub.authorRelations.forEach((author) => {
      if (author.userId !== userId) {
        collaboratorSet.add(author.userId);
        const institutionName = author.user?.institution?.name || 'Unknown Institution';
        if (!institutionCollaborations[institutionName]) {
          institutionCollaborations[institutionName] = {
            institution: institutionName,
            country: author.user?.institution?.country || 'Unknown',
            collaborations: 0
          };
        }
        institutionCollaborations[institutionName].collaborations++;
      }
    });
  });

  const totalCollaborators = collaboratorSet.size;
  const collaborationNetwork = Object.values(institutionCollaborations)
    .sort((a, b) => b.collaborations - a.collaborations)
    .slice(0, 10);

  // --- Publications by year (real) - powers both the impact table and ---
  // --- the benchmarking/trajectory chart.                             ---
  const publicationsByYear = {};
  citationCountByPublication.forEach(({ pub, realCitationCount }) => {
    const year = pub.year || (pub.publicationDate ? new Date(pub.publicationDate).getFullYear() : null);
    if (!year) return;
    if (!publicationsByYear[year]) publicationsByYear[year] = { year, publications: 0, citations: 0 };
    publicationsByYear[year].publications += 1;
    publicationsByYear[year].citations += realCitationCount;
  });
  const trajectory = Object.values(publicationsByYear).sort((a, b) => a.year - b.year);

  // --- Top publications table (real citation + recency-weighted impact) ---
  const currentYear = new Date().getFullYear();
  const topPublications = citationCountByPublication.map(({ pub, realCitationCount }) => {
    const year = pub.year || (pub.publicationDate ? new Date(pub.publicationDate).getFullYear() : null);
    const yearsOld = year ? currentYear - year : 10;
    const impactScore = realCitationCount - yearsOld * 0.5;

    let impact = 'Low';
    if (impactScore > 20 || realCitationCount > 50) impact = 'High';
    else if (impactScore > 5 || realCitationCount > 15) impact = 'Medium';

    return {
      id: pub.id,
      title: pub.title,
      citations: realCitationCount,
      year,
      journal: pub.journal || 'Unknown Journal',
      type: pub.type || 'Article',
      doi: pub.doi,
      url: pub.url,
      abstract: pub.abstract,
      impact,
      authors: pub.authors,
      keywords: pub.keywords
    };
  }).sort((a, b) => b.citations - a.citations);

  // --- Citation trend (estimated): deterministic distribution of the ---
  // real `totalCitations` total across the last 12 months, weighted so ---
  // more recent months carry a larger (but non-random) share. This keeps
  // the shape stable across reloads, unlike the previous Math.random() version.
  const monthsBack = 12;
  const weights = Array.from({ length: monthsBack }, (_, i) => i + 1); // 1..12, recent = larger
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const citationTrend = [];
  let distributed = 0;
  for (let i = monthsBack - 1; i >= 0; i--) {
    const date = subMonths(new Date(), i);
    const weightIndex = monthsBack - 1 - i;
    const isLast = i === 0;
    const share = isLast
      ? totalCitations - distributed
      : Math.round((weights[weightIndex] / weightSum) * totalCitations);
    distributed += isLast ? 0 : share;
    citationTrend.push({
      month: format(date, 'MMM yy'),
      citations: Math.max(0, share)
    });
  }

  // --- Public reach / altmetrics (estimated - no tracking tables yet) ---
  const totalViews = totalPublications * 642;
  const totalDownloads = totalPublications * 365;
  const metrics = {
    altmetricScore: Math.floor(50 + totalPublications * 2),
    socialMediaMentions: Math.floor(totalPublications * 6.5),
    newsArticles: Math.floor(totalPublications * 0.96),
    policyDocuments: Math.floor(totalPublications * 0.17),
    blogPosts: Math.floor(totalPublications * 3.7)
  };

  // --- Composite research score (real inputs) ---
  const researchScore = Math.min(
    100,
    hIndex * 5 + totalPublications * 2 + totalCollaborators * 0.5 + totalCitations * 0.1
  ).toFixed(1);

  return {
    overview: {
      totalCitations,
      hIndex,
      i10Index,
      totalPublications,
      totalViews,
      totalDownloads,
      collaborators: totalCollaborators,
      researchScore: parseFloat(researchScore)
    },
    citationTrend,
    topPublications,
    collaborationNetwork,
    trajectory,
    metrics,
    meta: {
      estimatedFields: ESTIMATED_FIELDS,
      generatedAt: new Date().toISOString()
    }
  };
}
