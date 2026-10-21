import prisma from '@/lib/prisma';

/**
 * Research output per researcher, counting every role on the platform:
 *  - Publications: lead (owner or first author) vs co-author (linked via PublicationAuthor)
 *  - Manuscripts:  lead (created it) vs collaborator (ManuscriptCollaborator)
 *  - Proposals:    principal investigator (PI ORCID) vs co-investigator (coInvestigators JSON:
 *                  matched on userId, ORCID or email)
 *
 * computeResearcherOutputs(members, { withItems })
 *   members: [{ id, orcidId, email }]
 *   returns Map<userId, { publications, manuscripts, proposals, totals, items? }>
 */

const bareOrcid = (value) => {
  const match = String(value || '').match(/\d{4}-\d{4}-\d{4}-\d{3}[\dX]/i);
  return match ? match[0].toUpperCase() : null;
};
const lower = (v) => String(v || '').trim().toLowerCase();

const emptyRow = () => ({
  publications: { lead: 0, coauthor: 0, total: 0 },
  manuscripts: { lead: 0, collaborator: 0, total: 0, published: 0 },
  proposals: { pi: 0, coInvestigator: 0, total: 0, approved: 0 },
  totals: { lead: 0, collaborative: 0, all: 0 },
  items: { publications: [], manuscripts: [], proposals: [] },
});

export async function computeResearcherOutputs(members, { withItems = false } = {}) {
  const ids = members.map((m) => m.id);
  const result = new Map(members.map((m) => [m.id, emptyRow()]));
  if (!ids.length) return result;

  const byOrcid = new Map();
  const byEmail = new Map();
  members.forEach((m) => {
    const o = bareOrcid(m.orcidId);
    if (o) byOrcid.set(o, m.id);
    if (m.email) byEmail.set(lower(m.email), m.id);
  });
  const idSet = new Set(ids);

  const [publications, manuscripts, proposals] = await Promise.all([
    prisma.publication.findMany({
      where: { OR: [{ authorId: { in: ids } }, { authorRelations: { some: { userId: { in: ids } } } }] },
      select: {
        id: true,
        title: true,
        journal: true,
        year: true,
        doi: true,
        url: true,
        type: true,
        status: true,
        authorId: true,
        authors: true,
        publicationDate: true,
        authorRelations: { select: { userId: true, authorOrder: true, isCorresponding: true } },
      },
    }),
    prisma.manuscript.findMany({
      where: { OR: [{ createdBy: { in: ids } }, { collaborators: { some: { userId: { in: ids } } } }] },
      select: {
        id: true,
        title: true,
        type: true,
        field: true,
        status: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
        publishedAt: true,
        collaborators: { select: { userId: true, role: true } },
      },
    }),
    prisma.proposal.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        principalInvestigator: true,
        principalInvestigatorOrcid: true,
        coInvestigators: true,
        departments: true,
        totalBudgetAmount: true,
        budgetCurrency: true,
        startDate: true,
        endDate: true,
        createdAt: true,
      },
    }),
  ]);

  // ---- publications
  publications.forEach((p) => {
    const involved = new Map(); // userId -> role
    if (p.authorId && idSet.has(p.authorId)) involved.set(p.authorId, 'lead');
    p.authorRelations.forEach((a) => {
      if (!idSet.has(a.userId)) return;
      const role = a.authorOrder === 1 || a.userId === p.authorId ? 'lead' : 'coauthor';
      if (involved.get(a.userId) !== 'lead') involved.set(a.userId, role);
    });
    involved.forEach((role, userId) => {
      const row = result.get(userId);
      row.publications[role] += 1;
      row.publications.total += 1;
      if (withItems) {
        const rel = p.authorRelations.find((a) => a.userId === userId);
        row.items.publications.push({
          id: p.id,
          title: p.title,
          journal: p.journal,
          year: p.year || (p.publicationDate ? new Date(p.publicationDate).getFullYear() : null),
          doi: p.doi,
          url: p.url,
          type: p.type,
          status: p.status,
          role,
          authorPosition: rel?.authorOrder || null,
          authorCount: Array.isArray(p.authors) ? p.authors.length : null,
          isCorresponding: Boolean(rel?.isCorresponding),
        });
      }
    });
  });

  // ---- manuscripts
  manuscripts.forEach((m) => {
    const involved = new Map();
    if (idSet.has(m.createdBy)) involved.set(m.createdBy, 'lead');
    m.collaborators.forEach((c) => {
      if (!idSet.has(c.userId) || involved.has(c.userId)) return;
      involved.set(c.userId, c.role === 'OWNER' ? 'lead' : 'collaborator');
    });
    involved.forEach((role, userId) => {
      const row = result.get(userId);
      row.manuscripts[role] += 1;
      row.manuscripts.total += 1;
      if (m.status === 'PUBLISHED') row.manuscripts.published += 1;
      if (withItems) {
        row.items.manuscripts.push({
          id: m.id,
          title: m.title,
          type: m.type,
          field: m.field,
          status: m.status,
          role,
          collaboratorRole: m.collaborators.find((c) => c.userId === userId)?.role || (role === 'lead' ? 'OWNER' : null),
          collaboratorCount: m.collaborators.length,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
          publishedAt: m.publishedAt,
        });
      }
    });
  });

  // ---- proposals
  proposals.forEach((p) => {
    const involved = new Map();
    const piId = byOrcid.get(bareOrcid(p.principalInvestigatorOrcid));
    if (piId) involved.set(piId, 'pi');
    (Array.isArray(p.coInvestigators) ? p.coInvestigators : []).forEach((ci) => {
      if (!ci || typeof ci !== 'object') return;
      const uid = (ci.userId && idSet.has(ci.userId) && ci.userId)
        || byOrcid.get(bareOrcid(ci.orcidId || ci.orcid))
        || (ci.email && byEmail.get(lower(ci.email)));
      if (uid && !involved.has(uid)) involved.set(uid, 'coInvestigator');
    });
    involved.forEach((role, userId) => {
      const row = result.get(userId);
      row.proposals[role] += 1;
      row.proposals.total += 1;
      if (p.status === 'APPROVED') row.proposals.approved += 1;
      if (withItems) {
        row.items.proposals.push({
          id: p.id,
          title: p.title,
          status: p.status,
          role,
          principalInvestigator: p.principalInvestigator,
          departments: p.departments || [],
          budget: Number(p.totalBudgetAmount) || 0,
          currency: p.budgetCurrency || 'USD',
          startDate: p.startDate,
          endDate: p.endDate,
          createdAt: p.createdAt,
        });
      }
    });
  });

  result.forEach((row) => {
    row.totals.lead = row.publications.lead + row.manuscripts.lead + row.proposals.pi;
    row.totals.collaborative = row.publications.coauthor + row.manuscripts.collaborator + row.proposals.coInvestigator;
    row.totals.all = row.totals.lead + row.totals.collaborative;
    if (withItems) {
      row.items.publications.sort((a, b) => (b.year || 0) - (a.year || 0));
      row.items.manuscripts.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      row.items.proposals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      delete row.items;
    }
  });

  return result;
}
