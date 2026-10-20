import { NextResponse } from 'next/server';
import prisma, { ensurePrismaConnected } from '@/lib/prisma';
import { requireInstitutionPortalAccess, getInstitutionProposalScope } from '@/lib/institution-scope';
import { resolveAnalyticsRange, inRange, daysBetween, pct, monthBuckets, median, average } from '@/lib/analytics-range';

/**
 * GET /api/institution/analytics/compliance?startDate&endDate
 *
 * Live compliance position for the logged-in institution:
 *  - research portfolio = non-draft proposals active during the period
 *  - ethics status from the linked ethics application (falls back to the proposal field)
 *  - requirement coverage: ethics clearance, data management plan, consent, data security, documentation
 *  - obligations: expiring/expired clearances, overdue reviews, overdue funder reports & grant milestones
 */

const REVIEW_SLA_DAYS = 30;
const EXPIRY_WARNING_DAYS = 90;
const REPORT_WARNING_DAYS = 30;

const clean = (v) => String(v || '').trim();
const hasText = (v) => clean(String(v || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ')).length > 0;

/** Normalise free-text and enum ethics statuses into one vocabulary. */
function classifyEthics(rawStatus, expiryDate, now) {
  const v = clean(rawStatus).toLowerCase().replace(/[_-]+/g, ' ');
  if (!v) return 'missing';
  if (v.includes('not required') || v.includes('exempt') || v.includes('waiv')) return 'not_required';
  if (v.includes('expir')) return 'expired';
  if (v.includes('reject') || v.includes('declin') || v.includes('denied') || v.includes('disapprov')) return 'rejected';
  if (v.includes('withdraw')) return 'withdrawn';
  if (v.includes('condition')) return expiryDate && new Date(expiryDate) < now ? 'expired' : 'conditional';
  if (v.includes('revision')) return 'revision';
  if (v.includes('approv') && !v.includes('pending') && !v.includes('not')) {
    return expiryDate && new Date(expiryDate) < now ? 'expired' : 'approved';
  }
  if (v.includes('draft')) return 'missing';
  return 'pending';
}

const ETHICS_LABELS = {
  approved: 'Approved',
  conditional: 'Conditional approval',
  pending: 'Pending review',
  revision: 'Revision requested',
  rejected: 'Rejected',
  expired: 'Expired',
  withdrawn: 'Withdrawn',
  not_required: 'Not required',
  missing: 'No ethics record',
};

const CLEARED = new Set(['approved', 'conditional', 'not_required']);

export async function GET(request) {
  try {
    await ensurePrismaConnected();
    const access = await requireInstitutionPortalAccess();
    if (access.error) return access.error;
    const { institution, memberIds } = access;

    const { searchParams } = new URL(request.url);
    const range = resolveAnalyticsRange(searchParams);
    if (!range.valid) return NextResponse.json({ error: 'Start date must be before end date' }, { status: 400 });
    const { start, end, now } = range;

    const proposalIds = await getInstitutionProposalScope(institution, memberIds);
    const none = { id: { equals: '__none__' } };

    const proposals = await prisma.proposal.findMany({
      where: proposalIds.length ? { id: { in: proposalIds }, status: { not: 'DRAFT' } } : none,
      select: {
        id: true,
        title: true,
        status: true,
        principalInvestigator: true,
        departments: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        ethicsApprovalStatus: true,
        ethicsApprovalReference: true,
        ethicsCommittee: true,
        approvalDate: true,
        ethicalConsiderationsOverview: true,
        consentProcedures: true,
        dataSecurityMeasures: true,
        ethicsDocuments: true,
        dataManagementPlan: true,
        ethicsLinks: {
          select: {
            ethicsApplication: {
              select: {
                id: true,
                status: true,
                referenceNumber: true,
                committeeName: true,
                submittedDate: true,
                approvalDate: true,
                expiryDate: true,
                approvalConditions: true,
                documents: true,
                createdAt: true,
              },
            },
          },
        },
        grantApplications: {
          select: {
            id: true,
            applicationTitle: true,
            grantorName: true,
            status: true,
            milestones: { select: { id: true, title: true, dueDate: true, completedDate: true, status: true } },
            award: {
              select: {
                id: true,
                grantNumber: true,
                contractSigned: true,
                endDate: true,
                reports: { select: { id: true, reportType: true, dueDate: true, submittedDate: true, status: true } },
              },
            },
          },
        },
      },
    });

    // Portfolio: proposals active at any point in the period.
    const portfolio = proposals.filter((p) => {
      const created = new Date(p.createdAt);
      const projectEnd = p.endDate ? new Date(p.endDate) : null;
      return created <= end && (!projectEnd || projectEnd >= start);
    });

    const rows = portfolio.map((p) => {
      const app = p.ethicsLinks?.[0]?.ethicsApplication || null;
      const rawStatus = app?.status || p.ethicsApprovalStatus;
      const expiryDate = app?.expiryDate || null;
      const ethics = classifyEthics(rawStatus, expiryDate, now);
      const submittedAt = app?.submittedDate || app?.createdAt || p.createdAt;
      const approvedAt = app?.approvalDate || p.approvalDate || null;
      const humanSubjects = ethics !== 'not_required';
      const ethicsDocCount = (p.ethicsDocuments || []).length + (app?.documents || []).length;
      const checks = {
        ethics: CLEARED.has(ethics),
        dataPlan: (p.dataManagementPlan || []).length > 0,
        consent: humanSubjects ? hasText(p.consentProcedures) : null,
        dataSecurity: hasText(p.dataSecurityMeasures),
        documentation: humanSubjects ? ethicsDocCount > 0 : null,
      };
      const applicable = Object.values(checks).filter((v) => v !== null);
      const score = applicable.length ? Math.round((applicable.filter(Boolean).length / applicable.length) * 100) : 100;
      const pendingDays = ethics === 'pending' ? daysBetween(submittedAt, now) : null;
      const daysToExpiry = expiryDate ? daysBetween(now, expiryDate) : null;
      return {
        id: p.id,
        title: p.title,
        principalInvestigator: p.principalInvestigator,
        department: clean(p.departments?.find((d) => d !== institution.name)) || clean(p.departments?.[0]) || 'Unassigned',
        proposalStatus: p.status,
        ethics,
        ethicsLabel: ETHICS_LABELS[ethics],
        ethicsReference: app?.referenceNumber || p.ethicsApprovalReference || null,
        committee: clean(app?.committeeName || p.ethicsCommittee) || 'Not recorded',
        ethicsApplicationId: app?.id || null,
        submittedAt,
        approvedAt,
        expiryDate,
        daysToExpiry,
        pendingDays,
        reviewDays: approvedAt && submittedAt ? Math.max(0, daysBetween(submittedAt, approvedAt)) : null,
        conditions: app?.approvalConditions || null,
        checks,
        score,
        createdAt: p.createdAt,
        grants: p.grantApplications || [],
      };
    });

    const total = rows.length;
    const countBy = (key) => rows.filter((r) => r.ethics === key).length;
    const ethicsBreakdown = Object.keys(ETHICS_LABELS)
      .map((key) => ({ key, label: ETHICS_LABELS[key], count: countBy(key) }))
      .filter((r) => r.count > 0);

    const coverage = (key) => {
      const applicable = rows.filter((r) => r.checks[key] !== null);
      return { met: applicable.filter((r) => r.checks[key]).length, applicable: applicable.length, rate: pct(applicable.filter((r) => r.checks[key]).length, applicable.length) };
    };
    const requirements = [
      { key: 'ethics', label: 'Ethics clearance in place', description: 'Approved, conditionally approved or formally not required', ...coverage('ethics') },
      { key: 'dataPlan', label: 'Data management plan', description: 'DMP document attached to the proposal', ...coverage('dataPlan') },
      { key: 'consent', label: 'Informed consent procedure', description: 'Consent process described (human-participant studies)', ...coverage('consent') },
      { key: 'dataSecurity', label: 'Data security measures', description: 'Storage, access and protection measures described', ...coverage('dataSecurity') },
      { key: 'documentation', label: 'Ethics documentation', description: 'Certificate, consent forms or protocol on file (human-participant studies)', ...coverage('documentation') },
    ];
    const healthScore = total ? Math.round(rows.reduce((s, r) => s + r.score, 0) / total) : null;
    const fullyCompliant = rows.filter((r) => r.score === 100).length;

    // ---- obligations / risks (current, regardless of when the proposal started) ----
    const overdueReviews = rows.filter((r) => r.ethics === 'pending' && r.pendingDays > REVIEW_SLA_DAYS);
    const expired = rows.filter((r) => r.ethics === 'expired');
    const expiringSoon = rows.filter((r) => ['approved', 'conditional'].includes(r.ethics) && r.daysToExpiry !== null && r.daysToExpiry >= 0 && r.daysToExpiry <= EXPIRY_WARNING_DAYS);
    const activeWithoutClearance = rows.filter((r) => ['APPROVED', 'UNDER_REVIEW', 'SUBMITTED'].includes(r.proposalStatus) && ['missing', 'rejected', 'withdrawn'].includes(r.ethics));
    const missingDmp = rows.filter((r) => !r.checks.dataPlan && r.proposalStatus === 'APPROVED');

    const grantObligations = [];
    rows.forEach((r) => r.grants.forEach((g) => {
      (g.award?.reports || []).forEach((rep) => {
        const done = ['SUBMITTED', 'APPROVED'].includes(clean(rep.status).toUpperCase()) || rep.submittedDate;
        if (done) return;
        const days = daysBetween(now, rep.dueDate);
        if (days <= REPORT_WARNING_DAYS) {
          grantObligations.push({
            kind: 'report',
            proposalId: r.id,
            proposalTitle: r.title,
            principalInvestigator: r.principalInvestigator,
            grant: g.applicationTitle,
            grantor: g.grantorName,
            item: `${clean(rep.reportType) ? `${clean(rep.reportType).charAt(0)}${clean(rep.reportType).slice(1).toLowerCase()} report` : 'Report'}`,
            dueDate: rep.dueDate,
            daysUntilDue: days,
            overdue: days < 0,
          });
        }
      });
      (g.milestones || []).forEach((m) => {
        if (!m.dueDate || m.completedDate || clean(m.status).toUpperCase() === 'COMPLETED') return;
        const days = daysBetween(now, m.dueDate);
        if (days <= REPORT_WARNING_DAYS) {
          grantObligations.push({
            kind: 'milestone',
            proposalId: r.id,
            proposalTitle: r.title,
            principalInvestigator: r.principalInvestigator,
            grant: g.applicationTitle,
            grantor: g.grantorName,
            item: m.title,
            dueDate: m.dueDate,
            daysUntilDue: days,
            overdue: days < 0,
          });
        }
      });
      if (g.award && !g.award.contractSigned) {
        grantObligations.push({
          kind: 'contract',
          proposalId: r.id,
          proposalTitle: r.title,
          principalInvestigator: r.principalInvestigator,
          grant: g.applicationTitle,
          grantor: g.grantorName,
          item: 'Award contract not signed',
          dueDate: null,
          daysUntilDue: null,
          overdue: true,
        });
      }
    }));
    grantObligations.sort((a, b) => (a.daysUntilDue ?? -9999) - (b.daysUntilDue ?? -9999));
    const overdueGrantItems = grantObligations.filter((o) => o.overdue);

    const pick = (list) => list.slice(0, 25).map((r) => ({ id: r.id, title: r.title, principalInvestigator: r.principalInvestigator, department: r.department, detail: r.ethicsLabel, pendingDays: r.pendingDays, daysToExpiry: r.daysToExpiry, expiryDate: r.expiryDate }));
    const actions = [
      overdueReviews.length && { id: 'overdue-reviews', severity: 'high', title: `${overdueReviews.length} ethics review${overdueReviews.length === 1 ? '' : 's'} past the ${REVIEW_SLA_DAYS}-day target`, detail: 'Pending with the committee longer than the institutional service level.', action: 'Follow up with the committee secretariat', items: pick(overdueReviews) },
      expired.length && { id: 'expired', severity: 'high', title: `${expired.length} ethics clearance${expired.length === 1 ? ' has' : 's have'} expired`, detail: 'Research activity should pause until clearance is renewed.', action: 'Ask PIs to submit renewals', items: pick(expired) },
      activeWithoutClearance.length && { id: 'no-clearance', severity: 'high', title: `${activeWithoutClearance.length} active proposal${activeWithoutClearance.length === 1 ? '' : 's'} without ethics clearance`, detail: 'Submitted, under review or approved with no valid ethics approval on record.', action: 'Confirm ethics status with the PI', items: pick(activeWithoutClearance) },
      overdueGrantItems.length && { id: 'grant-overdue', severity: 'high', title: `${overdueGrantItems.length} overdue funder obligation${overdueGrantItems.length === 1 ? '' : 's'}`, detail: 'Grant reports, milestones or contracts past due.', action: 'Escalate to the grants office', items: overdueGrantItems.slice(0, 25).map((o) => ({ id: o.proposalId, title: o.proposalTitle, principalInvestigator: o.principalInvestigator, detail: `${o.item} · ${o.grantor}`, dueDate: o.dueDate })) },
      expiringSoon.length && { id: 'expiring', severity: 'medium', title: `${expiringSoon.length} clearance${expiringSoon.length === 1 ? '' : 's'} expiring within ${EXPIRY_WARNING_DAYS} days`, detail: 'Renewal applications should be lodged before expiry.', action: 'Send renewal reminders', items: pick(expiringSoon) },
      missingDmp.length && { id: 'missing-dmp', severity: 'medium', title: `${missingDmp.length} approved proposal${missingDmp.length === 1 ? '' : 's'} without a data management plan`, detail: 'Most funders require a DMP before data collection starts.', action: 'Request a DMP from the PI', items: pick(missingDmp) },
    ].filter(Boolean);

    // ---- trends ----
    const buckets = monthBuckets(start, end);
    const monthlyTrends = buckets.map((b) => ({
      month: b.label,
      submitted: rows.filter((r) => inRange(r.submittedAt, b.start, b.end)).length,
      approved: rows.filter((r) => r.approvedAt && inRange(r.approvedAt, b.start, b.end) && ['approved', 'conditional', 'expired'].includes(r.ethics)).length,
      rejected: rows.filter((r) => r.ethics === 'rejected' && inRange(r.submittedAt, b.start, b.end)).length,
    }));

    // ---- committees ----
    const committeeMap = new Map();
    rows.filter((r) => r.ethics !== 'not_required' && r.ethics !== 'missing').forEach((r) => {
      if (!committeeMap.has(r.committee)) committeeMap.set(r.committee, { committee: r.committee, total: 0, approved: 0, pending: 0, rejected: 0, other: 0, reviewDays: [] });
      const c = committeeMap.get(r.committee);
      c.total += 1;
      if (['approved', 'conditional', 'expired'].includes(r.ethics)) c.approved += 1;
      else if (r.ethics === 'pending' || r.ethics === 'revision') c.pending += 1;
      else if (r.ethics === 'rejected') c.rejected += 1;
      else c.other += 1;
      if (r.reviewDays !== null) c.reviewDays.push(r.reviewDays);
    });
    const committees = [...committeeMap.values()]
      .map(({ reviewDays, ...c }) => ({ ...c, medianReviewDays: median(reviewDays), approvalRate: pct(c.approved, c.approved + c.rejected) }))
      .sort((a, b) => b.total - a.total);

    // ---- departments ----
    const deptMap = new Map();
    rows.forEach((r) => {
      if (!deptMap.has(r.department)) deptMap.set(r.department, { department: r.department, proposals: 0, scoreSum: 0, cleared: 0, withDmp: 0, issues: 0 });
      const d = deptMap.get(r.department);
      d.proposals += 1;
      d.scoreSum += r.score;
      if (r.checks.ethics) d.cleared += 1;
      if (r.checks.dataPlan) d.withDmp += 1;
      if (r.score < 100) d.issues += 1;
    });
    const departments = [...deptMap.values()]
      .map(({ scoreSum, ...d }) => ({ ...d, score: Math.round(scoreSum / d.proposals), clearanceRate: pct(d.cleared, d.proposals), dmpRate: pct(d.withDmp, d.proposals) }))
      .sort((a, b) => a.score - b.score || b.proposals - a.proposals);

    const reviewTimes = rows.map((r) => r.reviewDays).filter((v) => v !== null);

    return NextResponse.json({
      institution: { id: institution.id, name: institution.name },
      range: { start: start.toISOString(), end: end.toISOString() },
      generatedAt: now.toISOString(),
      thresholds: { reviewSlaDays: REVIEW_SLA_DAYS, expiryWarningDays: EXPIRY_WARNING_DAYS, reportWarningDays: REPORT_WARNING_DAYS },
      overview: {
        portfolio: total,
        healthScore,
        fullyCompliant,
        cleared: rows.filter((r) => r.checks.ethics).length,
        clearanceRate: pct(rows.filter((r) => r.checks.ethics).length, total),
        pending: countBy('pending') + countBy('revision'),
        overdueReviews: overdueReviews.length,
        expiringSoon: expiringSoon.length,
        expired: expired.length,
        openActions: actions.reduce((s, a) => s + (a.items?.length || 0), 0),
        overdueGrantItems: overdueGrantItems.length,
        medianReviewDays: median(rows.map((r) => r.reviewDays).filter((v) => v !== null)),
        averageReviewDays: average(rows.map((r) => r.reviewDays).filter((v) => v !== null)),
        fastestReviewDays: reviewTimes.length ? Math.min(...reviewTimes) : null,
      },
      ethicsBreakdown,
      requirements,
      actions,
      grantObligations: grantObligations.slice(0, 50),
      monthlyTrends,
      committees,
      departments,
      register: rows
        .map(({ grants, ...r }) => r)
        .sort((a, b) => a.score - b.score || new Date(b.createdAt) - new Date(a.createdAt)),
    });
  } catch (error) {
    console.error('Error fetching compliance analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch compliance analytics' }, { status: 500 });
  }
}
