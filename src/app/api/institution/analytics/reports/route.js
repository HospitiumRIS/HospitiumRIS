import { NextResponse } from 'next/server';
import prisma, { ensurePrismaConnected } from '@/lib/prisma';
import { requireInstitutionPortalAccess, getInstitutionProposalScope } from '@/lib/institution-scope';

/**
 * GET /api/institution/analytics/reports?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 *
 * Live data for the five "Dashboards & Reports" on /institution/analytics,
 * scoped to the logged-in user's institution. Every figure is computed for the
 * selected period and for the previous period of the same length so the UI can
 * show "vs previous period" instead of invented peer/national benchmarks.
 */

const DAY = 24 * 60 * 60 * 1000;
const UNASSIGNED = 'Unassigned';
const MANUSCRIPT_STATUSES = ['DRAFT', 'IN_REVIEW', 'UNDER_REVISION', 'PUBLISHED', 'ARCHIVED'];
const PROPOSAL_STATUSES = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUESTED', 'APPROVED', 'REJECTED'];

const parseDate = (value, fallback) => {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
};

const inRange = (date, start, end) => Boolean(date) && date >= start && date <= end;
const pct = (num, den) => (den > 0 ? Math.round((num / den) * 1000) / 10 : null);
const change = (current, previous) => (previous > 0 ? Math.round(((current - previous) / previous) * 1000) / 10 : null);
const clean = (value) => String(value || '').trim();
const titleCase = (value) => clean(value).replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const median = (values) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
};

const publicationDate = (pub) => {
  if (pub.publicationDate) return new Date(pub.publicationDate);
  if (pub.year) return new Date(Date.UTC(pub.year, 0, 1));
  return pub.createdAt ? new Date(pub.createdAt) : null;
};

function buildBuckets(start, end) {
  const spanDays = (end - start) / DAY;
  const unit = spanDays > 740 ? 'quarter' : 'month';
  const buckets = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= end) {
    const bucketStart = new Date(cursor);
    const next = new Date(cursor);
    next.setMonth(next.getMonth() + (unit === 'quarter' ? 3 : 1));
    const label = unit === 'quarter'
      ? `Q${Math.floor(bucketStart.getMonth() / 3) + 1} ${String(bucketStart.getFullYear()).slice(2)}`
      : bucketStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    buckets.push({ label, start: bucketStart, end: new Date(next.getTime() - 1) });
    cursor.setTime(next.getTime());
  }
  return buckets;
}

function quarterBuckets(start, end) {
  const buckets = [];
  const cursor = new Date(start.getFullYear(), Math.floor(start.getMonth() / 3) * 3, 1);
  while (cursor <= end) {
    const bucketStart = new Date(cursor);
    const next = new Date(cursor);
    next.setMonth(next.getMonth() + 3);
    buckets.push({
      label: `Q${Math.floor(bucketStart.getMonth() / 3) + 1} ${String(bucketStart.getFullYear()).slice(2)}`,
      start: bucketStart,
      end: new Date(next.getTime() - 1),
    });
    cursor.setTime(next.getTime());
  }
  return buckets;
}

const bucketIndex = (buckets, date) => buckets.findIndex((b) => date >= b.start && date <= b.end);

export async function GET(request) {
  try {
    await ensurePrismaConnected();

    const access = await requireInstitutionPortalAccess();
    if (access.error) return access.error;
    const { institution, memberIds } = access;

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setFullYear(defaultStart.getFullYear() - 1);
    defaultStart.setDate(defaultStart.getDate() + 1);
    const start = parseDate(searchParams.get('startDate'), defaultStart);
    start.setHours(0, 0, 0, 0);
    const end = parseDate(searchParams.get('endDate'), now);
    end.setHours(23, 59, 59, 999);
    if (start > end) {
      return NextResponse.json({ error: 'Start date must be before end date' }, { status: 400 });
    }
    const span = end - start + 1;
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(start.getTime() - span);

    const proposalIds = await getInstitutionProposalScope(institution, memberIds);
    const none = { id: { equals: '__none__' } };

    const [members, manuscripts, proposals, publications, reviews] = await Promise.all([
      memberIds.length
        ? prisma.user.findMany({
            where: { id: { in: memberIds }, accountType: 'RESEARCHER' },
            select: {
              id: true,
              givenName: true,
              familyName: true,
              email: true,
              orcidId: true,
              createdAt: true,
              researchProfile: { select: { department: true, hIndex: true, citationCount: true } },
            },
          })
        : [],
      prisma.manuscript.findMany({
        where: memberIds.length ? { createdBy: { in: memberIds } } : none,
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
          _count: { select: { collaborators: true } },
        },
      }),
      prisma.proposal.findMany({
        where: proposalIds.length ? { id: { in: proposalIds } } : none,
        select: {
          id: true,
          title: true,
          status: true,
          departments: true,
          researchAreas: true,
          principalInvestigatorOrcid: true,
          totalBudgetAmount: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.publication.findMany({
        where: memberIds.length ? { authorRelations: { some: { userId: { in: memberIds } } } } : none,
        select: {
          id: true,
          title: true,
          type: true,
          field: true,
          journal: true,
          doi: true,
          year: true,
          status: true,
          publicationDate: true,
          createdAt: true,
          authorRelations: { where: { userId: { in: memberIds.length ? memberIds : ['__none__'] } }, select: { userId: true } },
        },
      }),
      proposalIds.length
        ? prisma.proposalReview.findMany({
            where: { proposalId: { in: proposalIds } },
            select: { proposalId: true, decision: true, reviewDate: true },
            orderBy: { reviewDate: 'asc' },
          })
        : [],
    ]);

    // ---------- lookups ----------
    const memberById = new Map(members.map((m) => [m.id, m]));
    const memberByOrcid = new Map(members.filter((m) => m.orcidId).map((m) => [String(m.orcidId).replace(/^https?:\/\/orcid\.org\//, ''), m]));
    const nameOf = (m) => `${m.givenName || ''} ${m.familyName || ''}`.trim() || m.email || 'Researcher';
    const departmentOf = (userId) => clean(memberById.get(userId)?.researchProfile?.department) || UNASSIGNED;
    const proposalPi = (p) => memberByOrcid.get(String(p.principalInvestigatorOrcid || '').replace(/^https?:\/\/orcid\.org\//, '')) || null;
    const proposalDepartments = (p) => {
      const listed = (p.departments || []).map(clean).filter(Boolean).filter((d) => d !== institution.name);
      if (listed.length) return listed;
      const pi = proposalPi(p);
      return [pi ? departmentOf(pi.id) : UNASSIGNED];
    };

    const pubsWithDate = publications.map((p) => ({ ...p, date: publicationDate(p) }));
    const firstDecision = new Map();
    reviews.forEach((r) => { if (!firstDecision.has(r.proposalId)) firstDecision.set(r.proposalId, r); });

    const period = (s, e) => {
      const ms = manuscripts.filter((m) => inRange(new Date(m.createdAt), s, e));
      const ps = proposals.filter((p) => inRange(new Date(p.createdAt), s, e));
      const pubs = pubsWithDate.filter((p) => p.status === 'PUBLISHED' && inRange(p.date, s, e));
      const decided = ps.filter((p) => ['APPROVED', 'REJECTED'].includes(p.status));
      const approved = ps.filter((p) => p.status === 'APPROVED');
      const submitted = ps.filter((p) => p.status !== 'DRAFT');
      const msBeyondDraft = ms.filter((m) => m.status !== 'DRAFT');
      const msPublished = ms.filter((m) => m.status === 'PUBLISHED');
      const msInOrAfterReview = ms.filter((m) => ['IN_REVIEW', 'UNDER_REVISION', 'PUBLISHED'].includes(m.status));
      const turnaround = ps
        .map((p) => firstDecision.get(p.id))
        .filter(Boolean)
        .map((r) => {
          const p = proposals.find((x) => x.id === r.proposalId);
          return Math.max(0, Math.round((new Date(r.reviewDate) - new Date(p.createdAt)) / DAY));
        });
      const activeResearchers = new Set([
        ...ms.map((m) => m.createdBy),
        ...pubs.flatMap((p) => p.authorRelations.map((a) => a.userId)),
        ...ps.map((p) => proposalPi(p)?.id).filter(Boolean),
      ]);
      return {
        manuscripts: ms.length,
        proposals: ps.length,
        publications: pubs.length,
        approvedProposals: approved.length,
        decidedProposals: decided.length,
        submittedProposals: submitted.length,
        approvalRate: pct(approved.length, decided.length),
        submissionRate: pct(submitted.length, ps.length),
        manuscriptProgressRate: pct(msBeyondDraft.length, ms.length),
        manuscriptPublishRate: pct(msPublished.length, msInOrAfterReview.length),
        collaborationRate: pct(ms.filter((m) => m._count.collaborators > 0).length, ms.length),
        medianTurnaroundDays: median(turnaround),
        activeResearchers: activeResearchers.size,
        approvedBudget: approved.reduce((sum, p) => sum + Number(p.totalBudgetAmount || 0), 0),
      };
    };

    const current = period(start, end);
    const previous = period(prevStart, prevEnd);
    const researcherCount = members.length;

    // ---------- 1. institute performance ----------
    const buckets = buildBuckets(start, end);
    const monthlyOutput = buckets.map((b) => {
      const shift = span;
      const prevB = { start: new Date(b.start.getTime() - shift), end: new Date(b.end.getTime() - shift) };
      const count = (s, e) => ({
        publications: pubsWithDate.filter((p) => p.status === 'PUBLISHED' && inRange(p.date, s, e)).length,
        manuscripts: manuscripts.filter((m) => inRange(new Date(m.createdAt), s, e)).length,
        proposals: proposals.filter((p) => inRange(new Date(p.createdAt), s, e)).length,
      });
      const cur = count(b.start, b.end);
      const prev = count(prevB.start, prevB.end);
      return {
        month: b.label,
        ...cur,
        total: cur.publications + cur.manuscripts + cur.proposals,
        prevPublications: prev.publications,
        prevManuscripts: prev.manuscripts,
        prevProposals: prev.proposals,
        prevTotal: prev.publications + prev.manuscripts + prev.proposals,
      };
    });

    const totalOutput = (p) => p.publications + p.manuscripts + p.proposals;
    const insight = (area, cur, prev, { unit = '', higherIsBetter = true, format = (v) => v } = {}) => {
      if (cur === null || cur === undefined) {
        return { area, status: 'neutral', value: null, previous: prev, detail: 'No activity in this period yet', score: 0 };
      }
      const delta = prev === null || prev === undefined ? null : Math.round((cur - prev) * 10) / 10;
      const improved = delta === null ? null : higherIsBetter ? delta >= 0 : delta <= 0;
      const detail = delta === null
        ? `${format(cur)}${unit} this period (no earlier data to compare)`
        : `${format(cur)}${unit} vs ${format(prev)}${unit} in the previous period`;
      return {
        area,
        status: improved === null ? 'neutral' : improved ? 'better' : 'worse',
        value: cur,
        previous: prev ?? null,
        delta,
        detail,
        score: unit === '%' ? Math.max(0, Math.min(100, cur)) : null,
      };
    };

    const performance = {
      monthlyOutput,
      bucketUnit: buckets.length && (buckets[0].label.startsWith('Q') ? 'quarter' : 'month'),
      insights: [
        { ...insight('Research output', totalOutput(current), totalOutput(previous)), changePct: change(totalOutput(current), totalOutput(previous)), detail: `${totalOutput(current)} items (${current.publications} publications, ${current.manuscripts} manuscripts, ${current.proposals} proposals) vs ${totalOutput(previous)} previously` },
        insight('Proposal approval rate', current.approvalRate, previous.approvalRate, { unit: '%' }),
        insight('Manuscripts beyond draft', current.manuscriptProgressRate, previous.manuscriptProgressRate, { unit: '%' }),
        insight('Collaborative manuscripts', current.collaborationRate, previous.collaborationRate, { unit: '%' }),
        insight('Median proposal decision time', current.medianTurnaroundDays, previous.medianTurnaroundDays, { unit: ' days', higherIsBetter: false }),
      ],
      comparison: [
        { metric: 'Publications', current: current.publications, previous: previous.publications },
        { metric: 'Manuscripts', current: current.manuscripts, previous: previous.manuscripts },
        { metric: 'Proposals', current: current.proposals, previous: previous.proposals },
        { metric: 'Approved proposals', current: current.approvedProposals, previous: previous.approvedProposals },
        { metric: 'Active researchers', current: current.activeResearchers, previous: previous.activeResearchers },
      ],
      perResearcher: {
        outputs: researcherCount ? Math.round((totalOutput(current) / researcherCount) * 10) / 10 : 0,
        previousOutputs: researcherCount ? Math.round((totalOutput(previous) / researcherCount) * 10) / 10 : 0,
      },
    };

    // ---------- 2. citations & researcher impact ----------
    const outputsByResearcher = new Map(members.map((m) => [m.id, { publications: 0, manuscripts: 0, proposals: 0 }]));
    pubsWithDate.filter((p) => p.status === 'PUBLISHED' && inRange(p.date, start, end))
      .forEach((p) => p.authorRelations.forEach((a) => { const row = outputsByResearcher.get(a.userId); if (row) row.publications += 1; }));
    manuscripts.filter((m) => inRange(new Date(m.createdAt), start, end))
      .forEach((m) => { const row = outputsByResearcher.get(m.createdBy); if (row) row.manuscripts += 1; });
    proposals.filter((p) => inRange(new Date(p.createdAt), start, end))
      .forEach((p) => { const pi = proposalPi(p); const row = pi && outputsByResearcher.get(pi.id); if (row) row.proposals += 1; });

    const researcherRows = members.map((m) => {
      const out = outputsByResearcher.get(m.id);
      const totalWorks = pubsWithDate.filter((p) => p.authorRelations.some((a) => a.userId === m.id)).length;
      return {
        id: m.id,
        name: nameOf(m),
        department: departmentOf(m.id),
        citations: m.researchProfile?.citationCount || 0,
        hIndex: m.researchProfile?.hIndex || 0,
        works: totalWorks,
        ...out,
        output: out.publications + out.manuscripts + out.proposals,
      };
    });
    const hBands = [
      { range: 'h 0', min: 0, max: 0 },
      { range: 'h 1–4', min: 1, max: 4 },
      { range: 'h 5–9', min: 5, max: 9 },
      { range: 'h 10–19', min: 10, max: 19 },
      { range: 'h 20+', min: 20, max: Infinity },
    ];
    const citations = {
      byResearcher: [...researcherRows].sort((a, b) => b.citations - a.citations || b.hIndex - a.hIndex).slice(0, 10),
      mostActive: [...researcherRows].sort((a, b) => b.output - a.output).filter((r) => r.output > 0).slice(0, 8),
      hIndexDistribution: hBands.map((band) => ({ range: band.range, count: researcherRows.filter((r) => r.hIndex >= band.min && r.hIndex <= band.max).length })),
      totals: {
        citations: researcherRows.reduce((s, r) => s + r.citations, 0),
        averageHIndex: researcherRows.length ? Math.round((researcherRows.reduce((s, r) => s + r.hIndex, 0) / researcherRows.length) * 10) / 10 : 0,
        researchersWithProfiles: researcherRows.filter((r) => r.citations > 0 || r.hIndex > 0).length,
        researchers: researcherRows.length,
      },
      notCaptured: ['Citations per individual work', 'Citation growth over time'],
    };

    // ---------- 3. work status (manuscripts + proposals) ----------
    const manuscriptColors = { DRAFT: '#94a3b8', IN_REVIEW: '#f59e0b', UNDER_REVISION: '#f97316', PUBLISHED: '#22c55e', ARCHIVED: '#64748b' };
    const proposalColors = { DRAFT: '#94a3b8', SUBMITTED: '#3b82f6', UNDER_REVIEW: '#8b6cbc', REVISION_REQUESTED: '#f59e0b', APPROVED: '#22c55e', REJECTED: '#ef4444' };
    const msInPeriod = manuscripts.filter((m) => inRange(new Date(m.createdAt), start, end));
    const psInPeriod = proposals.filter((p) => inRange(new Date(p.createdAt), start, end));
    const statusTrend = (items, statuses) => buckets.map((b) => {
      const row = { month: b.label };
      statuses.forEach((s) => { row[s] = 0; });
      items.forEach((item) => {
        const d = new Date(item.createdAt);
        if (inRange(d, b.start, b.end) && row[item.status] !== undefined) row[item.status] += 1;
      });
      return row;
    });
    const prevMs = manuscripts.filter((m) => inRange(new Date(m.createdAt), prevStart, prevEnd));
    const prevPs = proposals.filter((p) => inRange(new Date(p.createdAt), prevStart, prevEnd));
    const rate = (items, num, den) => pct(items.filter(num).length, items.filter(den).length);

    const workStatus = {
      manuscripts: {
        total: msInPeriod.length,
        pipeline: MANUSCRIPT_STATUSES.map((s) => ({ key: s, status: titleCase(s), count: msInPeriod.filter((m) => m.status === s).length, color: manuscriptColors[s] })),
        trend: statusTrend(msInPeriod, MANUSCRIPT_STATUSES),
        series: MANUSCRIPT_STATUSES.map((s) => ({ key: s, label: titleCase(s), color: manuscriptColors[s] })),
        conversion: [
          { stage: 'Draft → Review', rate: rate(msInPeriod, (m) => m.status !== 'DRAFT', () => true), previous: rate(prevMs, (m) => m.status !== 'DRAFT', () => true) },
          { stage: 'Review → Published', rate: rate(msInPeriod, (m) => m.status === 'PUBLISHED', (m) => ['IN_REVIEW', 'UNDER_REVISION', 'PUBLISHED'].includes(m.status)), previous: rate(prevMs, (m) => m.status === 'PUBLISHED', (m) => ['IN_REVIEW', 'UNDER_REVISION', 'PUBLISHED'].includes(m.status)) },
          { stage: 'Needed revision', rate: rate(msInPeriod, (m) => m.status === 'UNDER_REVISION', (m) => m.status !== 'DRAFT'), previous: rate(prevMs, (m) => m.status === 'UNDER_REVISION', (m) => m.status !== 'DRAFT'), lowerIsBetter: true },
        ],
      },
      proposals: {
        total: psInPeriod.length,
        pipeline: PROPOSAL_STATUSES.map((s) => ({ key: s, status: titleCase(s), count: psInPeriod.filter((p) => p.status === s).length, color: proposalColors[s] })),
        trend: statusTrend(psInPeriod, PROPOSAL_STATUSES),
        series: PROPOSAL_STATUSES.map((s) => ({ key: s, label: titleCase(s), color: proposalColors[s] })),
        conversion: [
          { stage: 'Draft → Submitted', rate: rate(psInPeriod, (p) => p.status !== 'DRAFT', () => true), previous: rate(prevPs, (p) => p.status !== 'DRAFT', () => true) },
          { stage: 'Decided → Approved', rate: rate(psInPeriod, (p) => p.status === 'APPROVED', (p) => ['APPROVED', 'REJECTED'].includes(p.status)), previous: rate(prevPs, (p) => p.status === 'APPROVED', (p) => ['APPROVED', 'REJECTED'].includes(p.status)) },
          { stage: 'Sent back for revision', rate: rate(psInPeriod, (p) => p.status === 'REVISION_REQUESTED', (p) => p.status !== 'DRAFT'), previous: rate(prevPs, (p) => p.status === 'REVISION_REQUESTED', (p) => p.status !== 'DRAFT'), lowerIsBetter: true },
        ],
        medianDecisionDays: current.medianTurnaroundDays,
        approvedBudget: current.approvedBudget,
      },
    };

    // ---------- 4. by faculty / research area ----------
    const facultyMap = new Map();
    const facultyRow = (name) => {
      if (!facultyMap.has(name)) facultyMap.set(name, { faculty: name, publications: 0, manuscripts: 0, proposals: 0, researchers: 0, previousTotal: 0 });
      return facultyMap.get(name);
    };
    members.forEach((m) => { facultyRow(departmentOf(m.id)).researchers += 1; });
    const pubsInPeriod = pubsWithDate.filter((p) => p.status === 'PUBLISHED' && inRange(p.date, start, end));
    const pubFaculties = (p) => [...new Set(p.authorRelations.map((a) => departmentOf(a.userId)))];
    pubsInPeriod.forEach((p) => pubFaculties(p).forEach((f) => { facultyRow(f).publications += 1; }));
    msInPeriod.forEach((m) => { facultyRow(departmentOf(m.createdBy)).manuscripts += 1; });
    psInPeriod.forEach((p) => proposalDepartments(p).forEach((f) => { facultyRow(f).proposals += 1; }));
    pubsWithDate.filter((p) => p.status === 'PUBLISHED' && inRange(p.date, prevStart, prevEnd)).forEach((p) => pubFaculties(p).forEach((f) => { facultyRow(f).previousTotal += 1; }));
    prevMs.forEach((m) => { facultyRow(departmentOf(m.createdBy)).previousTotal += 1; });
    prevPs.forEach((p) => proposalDepartments(p).forEach((f) => { facultyRow(f).previousTotal += 1; }));
    const byFaculty = [...facultyMap.values()]
      .map((row) => {
        const total = row.publications + row.manuscripts + row.proposals;
        return { ...row, total, trend: change(total, row.previousTotal) };
      })
      .filter((row) => row.total > 0 || row.researchers > 0)
      .sort((a, b) => b.total - a.total || b.researchers - a.researchers);

    const areaMap = new Map();
    const areaRow = (name, faculty) => {
      const key = clean(name);
      if (!key) return null;
      const lower = key.toLowerCase();
      if (!areaMap.has(lower)) areaMap.set(lower, { area: key, publications: 0, manuscripts: 0, proposals: 0, faculties: {} });
      const row = areaMap.get(lower);
      if (faculty) row.faculties[faculty] = (row.faculties[faculty] || 0) + 1;
      return row;
    };
    pubsInPeriod.forEach((p) => { const row = areaRow(p.field, pubFaculties(p)[0]); if (row) row.publications += 1; });
    msInPeriod.forEach((m) => { const row = areaRow(m.field, departmentOf(m.createdBy)); if (row) row.manuscripts += 1; });
    psInPeriod.forEach((p) => (p.researchAreas || []).forEach((a) => { const row = areaRow(a, proposalDepartments(p)[0]); if (row) row.proposals += 1; }));
    const byResearchArea = [...areaMap.values()]
      .map((row) => {
        const faculty = Object.entries(row.faculties).sort((a, b) => b[1] - a[1])[0]?.[0] || UNASSIGNED;
        return { area: row.area, faculty, publications: row.publications, manuscripts: row.manuscripts, proposals: row.proposals, count: row.publications + row.manuscripts + row.proposals };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    const topFaculties = byFaculty.filter((f) => f.total > 0).slice(0, 6).map((f) => f.faculty);
    const qBuckets = quarterBuckets(start, end);
    const quarterlyTrend = qBuckets.map((q) => {
      const row = { quarter: q.label };
      topFaculties.forEach((f) => { row[f] = 0; });
      pubsWithDate.filter((p) => p.status === 'PUBLISHED' && inRange(p.date, q.start, q.end))
        .forEach((p) => pubFaculties(p).forEach((f) => { if (row[f] !== undefined) row[f] += 1; }));
      manuscripts.filter((m) => inRange(new Date(m.createdAt), q.start, q.end))
        .forEach((m) => { const f = departmentOf(m.createdBy); if (row[f] !== undefined) row[f] += 1; });
      proposals.filter((p) => inRange(new Date(p.createdAt), q.start, q.end))
        .forEach((p) => proposalDepartments(p).forEach((f) => { if (row[f] !== undefined) row[f] += 1; }));
      return row;
    });

    const faculty = {
      faculties: ['All Faculties', ...byFaculty.map((f) => f.faculty)],
      byFaculty,
      byResearchArea,
      quarterlyTrend,
      quarterlySeries: topFaculties,
    };

    // ---------- 5. output by type ----------
    const typeMap = new Map();
    const typeRow = (name) => {
      const label = titleCase(name) || 'Unspecified';
      if (!typeMap.has(label)) typeMap.set(label, { type: label, published: 0, inProgress: 0, withDoi: 0, withJournal: 0 });
      return typeMap.get(label);
    };
    pubsInPeriod.forEach((p) => {
      const row = typeRow(p.type);
      row.published += 1;
      if (clean(p.doi)) row.withDoi += 1;
      if (clean(p.journal)) row.withJournal += 1;
    });
    msInPeriod.filter((m) => !['PUBLISHED', 'ARCHIVED'].includes(m.status)).forEach((m) => { typeRow(m.type).inProgress += 1; });
    const totalPublished = pubsInPeriod.length;
    const byType = [...typeMap.values()]
      .map((row) => ({
        ...row,
        count: row.published,
        share: totalPublished ? Math.round((row.published / totalPublished) * 100) : 0,
        doiCoverage: pct(row.withDoi, row.published),
        journalCoverage: pct(row.withJournal, row.published),
      }))
      .sort((a, b) => b.published - a.published || b.inProgress - a.inProgress);

    const journalMap = new Map();
    pubsInPeriod.forEach((p) => {
      const name = clean(p.journal);
      if (!name) return;
      journalMap.set(name, (journalMap.get(name) || 0) + 1);
    });
    const topJournals = [...journalMap.entries()].map(([journal, count]) => ({ journal, count })).sort((a, b) => b.count - a.count).slice(0, 8);

    const publicationType = {
      byType,
      topJournals,
      totals: {
        published: totalPublished,
        inProgress: msInPeriod.filter((m) => !['PUBLISHED', 'ARCHIVED'].includes(m.status)).length,
        doiCoverage: pct(pubsInPeriod.filter((p) => clean(p.doi)).length, totalPublished),
      },
      notCaptured: ['Journal impact factor', 'Journal quartile (Q1–Q4)', 'Open-access status'],
    };

    return NextResponse.json({
      institution: { id: institution.id, name: institution.name },
      range: { start: start.toISOString(), end: end.toISOString(), previousStart: prevStart.toISOString(), previousEnd: prevEnd.toISOString() },
      generatedAt: new Date().toISOString(),
      summary: { current, previous, researchers: researcherCount },
      performance,
      citations,
      workStatus,
      faculty,
      publicationType,
    });
  } catch (error) {
    console.error('Error building institution reports:', error);
    return NextResponse.json({ error: 'Failed to build institution reports' }, { status: 500 });
  }
}
