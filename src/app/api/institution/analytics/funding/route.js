import { NextResponse } from 'next/server';
import prisma, { ensurePrismaConnected } from '@/lib/prisma';
import { requireInstitutionPortalAccess, getInstitutionProposalScope } from '@/lib/institution-scope';
import { resolveAnalyticsRange, inRange, daysBetween, pct, pctChange, monthBuckets } from '@/lib/analytics-range';

/**
 * GET /api/institution/analytics/funding?startDate&endDate
 *
 * Live funding position for the logged-in institution, following the money:
 *   proposal budgets (internal) -> external grant applications -> awards -> active portfolio.
 * Sources: Proposal (budget + grant tracker fields), GrantApplication, GrantAward, GrantReport.
 * Proposals tracked only through the grant tracker (no GrantApplication record) are included
 * using grantTrackingStatus / grantRequestedAmount / grantAppliedOn / grantDecisionOn.
 */

const clean = (v) => String(v || '').trim();
const num = (v) => Number(v) || 0;
const IN_FLIGHT = ['SUBMITTED', 'UNDER_REVIEW', 'ADDITIONAL_INFO_REQUESTED'];
const PREPARING = ['PREPARING', 'READY_TO_SUBMIT'];

export async function GET(request) {
  try {
    await ensurePrismaConnected();
    const access = await requireInstitutionPortalAccess();
    if (access.error) return access.error;
    const { institution, memberIds } = access;

    const { searchParams } = new URL(request.url);
    const range = resolveAnalyticsRange(searchParams);
    if (!range.valid) return NextResponse.json({ error: 'Start date must be before end date' }, { status: 400 });
    const { start, end, previousStart, previousEnd, now } = range;

    const proposalIds = await getInstitutionProposalScope(institution, memberIds);
    const none = { id: { equals: '__none__' } };

    const [proposals, opportunities] = await Promise.all([
      prisma.proposal.findMany({
        where: proposalIds.length ? { id: { in: proposalIds }, status: { not: 'DRAFT' } } : none,
        select: {
          id: true,
          title: true,
          status: true,
          principalInvestigator: true,
          departments: true,
          fundingSource: true,
          fundingInstitution: true,
          totalBudgetAmount: true,
          budgetCurrency: true,
          createdAt: true,
          updatedAt: true,
          grantTrackingStatus: true,
          grantRequestedAmount: true,
          grantAppliedOn: true,
          grantDecisionOn: true,
          grantNumber: true,
          grantStartDate: true,
          grantEndDate: true,
          grantApplications: {
            select: {
              id: true,
              applicationTitle: true,
              grantorName: true,
              grantProgram: true,
              requestedAmount: true,
              submissionDeadline: true,
              applicationDate: true,
              submittedAt: true,
              status: true,
              priority: true,
              createdAt: true,
              updatedAt: true,
              award: {
                select: {
                  id: true,
                  awardedAmount: true,
                  awardDate: true,
                  startDate: true,
                  endDate: true,
                  grantNumber: true,
                  contractSigned: true,
                  reports: { select: { dueDate: true, submittedDate: true, status: true, reportType: true } },
                },
              },
            },
          },
        },
      }),
      prisma.grantOpportunity.findMany({
        where: { status: 'open', deadline: { gte: now } },
        include: { grantor: { select: { name: true, type: true, country: true } } },
        orderBy: { deadline: 'asc' },
        take: 12,
      }),
    ]);

    // Currency: report in the most common proposal currency; flag the rest.
    const currencyCounts = proposals.reduce((acc, p) => {
      const c = clean(p.budgetCurrency).toUpperCase() || 'USD';
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {});
    const currency = Object.entries(currencyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'USD';
    const currencyOf = (p) => clean(p.budgetCurrency).toUpperCase() || 'USD';
    const otherCurrencies = Object.keys(currencyCounts).filter((c) => c !== currency);
    const department = (p) => clean(p.departments?.find((d) => d !== institution.name)) || clean(p.departments?.[0]) || 'Unassigned';

    // ---- normalise external applications (records + grant-tracker-only proposals) ----
    const applications = [];
    proposals.forEach((p) => {
      if (p.grantApplications?.length) {
        p.grantApplications.forEach((g) => applications.push({
          id: g.id,
          proposalId: p.id,
          proposalTitle: p.title,
          principalInvestigator: p.principalInvestigator,
          department: department(p),
          currency: currencyOf(p),
          title: g.applicationTitle,
          funder: clean(g.grantorName) || clean(p.fundingInstitution) || clean(p.fundingSource) || 'Unknown funder',
          program: g.grantProgram,
          requested: num(g.requestedAmount),
          status: g.status,
          priority: g.priority,
          deadline: g.submissionDeadline,
          submittedAt: g.submittedAt || g.applicationDate || (IN_FLIGHT.includes(g.status) || g.status === 'AWARDED' || g.status === 'REJECTED' ? g.createdAt : null),
          decidedAt: g.award?.awardDate || (g.status === 'REJECTED' ? g.updatedAt : null),
          award: g.award ? {
            amount: num(g.award.awardedAmount),
            awardDate: g.award.awardDate,
            startDate: g.award.startDate,
            endDate: g.award.endDate,
            grantNumber: g.award.grantNumber,
            contractSigned: g.award.contractSigned,
            reports: g.award.reports || [],
          } : null,
          source: 'application',
        }));
      } else if (p.grantTrackingStatus && p.grantTrackingStatus !== 'NOT_APPLIED') {
        const statusMap = { APPLIED: 'SUBMITTED', AWARDED: 'AWARDED', REJECTED: 'REJECTED', CANCELLED: 'WITHDRAWN' };
        const requested = num(p.grantRequestedAmount) || num(p.totalBudgetAmount);
        applications.push({
          id: `tracker-${p.id}`,
          proposalId: p.id,
          proposalTitle: p.title,
          principalInvestigator: p.principalInvestigator,
          department: department(p),
          currency: currencyOf(p),
          title: p.title,
          funder: clean(p.fundingInstitution) || clean(p.fundingSource) || 'Unknown funder',
          program: null,
          requested,
          status: statusMap[p.grantTrackingStatus] || 'SUBMITTED',
          priority: null,
          deadline: null,
          submittedAt: p.grantAppliedOn || p.updatedAt,
          decidedAt: ['AWARDED', 'REJECTED'].includes(p.grantTrackingStatus) ? (p.grantDecisionOn || p.updatedAt) : null,
          award: p.grantTrackingStatus === 'AWARDED' ? {
            amount: requested,
            awardDate: p.grantDecisionOn || p.updatedAt,
            startDate: p.grantStartDate,
            endDate: p.grantEndDate,
            grantNumber: p.grantNumber,
            contractSigned: null,
            reports: [],
          } : null,
          source: 'tracker',
        });
      }
    });

    const inCur = (list) => list.filter((a) => a.currency === currency);
    const sum = (list, f) => list.reduce((s, x) => s + f(x), 0);

    const periodStats = (s, e) => {
      const props = proposals.filter((p) => inRange(p.createdAt, s, e));
      const approvedInternal = props.filter((p) => p.status === 'APPROVED');
      const submitted = applications.filter((a) => inRange(a.submittedAt, s, e));
      const awarded = applications.filter((a) => a.award && inRange(a.award.awardDate, s, e));
      const rejected = applications.filter((a) => a.status === 'REJECTED' && inRange(a.decidedAt, s, e));
      return {
        proposals: props.length,
        requestedBudget: sum(props.filter((p) => currencyOf(p) === currency), (p) => num(p.totalBudgetAmount)),
        internallyApproved: approvedInternal.length,
        approvedBudget: sum(approvedInternal.filter((p) => currencyOf(p) === currency), (p) => num(p.totalBudgetAmount)),
        applicationsSubmitted: submitted.length,
        amountApplied: sum(inCur(submitted), (a) => a.requested),
        awards: awarded.length,
        amountAwarded: sum(inCur(awarded), (a) => a.award.amount),
        rejections: rejected.length,
        winRate: pct(awarded.length, awarded.length + rejected.length),
      };
    };
    const current = periodStats(start, end);
    const previous = periodStats(previousStart, previousEnd);

    // ---- live position (as of today) ----
    // Active = awarded and not yet ended (includes awards that start in the future).
    const activeAwards = applications.filter((a) => a.award && (!a.award.endDate || new Date(a.award.endDate) >= now));
    const pipelineApps = applications.filter((a) => IN_FLIGHT.includes(a.status));
    const preparingApps = applications.filter((a) => PREPARING.includes(a.status));
    const approvedNotApplied = proposals.filter((p) => p.status === 'APPROVED' && !(p.grantApplications?.length) && (!p.grantTrackingStatus || p.grantTrackingStatus === 'NOT_APPLIED'));

    const nextReport = (award) => (award.reports || [])
      .filter((r) => !r.submittedDate && !['SUBMITTED', 'APPROVED'].includes(clean(r.status).toUpperCase()))
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0] || null;

    const activePortfolio = activeAwards
      .map((a) => {
        const startD = a.award.startDate ? new Date(a.award.startDate) : null;
        const endD = a.award.endDate ? new Date(a.award.endDate) : null;
        const elapsed = startD && endD && endD > startD ? Math.max(0, Math.min(100, Math.round(((now - startD) / (endD - startD)) * 100))) : null;
        const report = nextReport(a.award);
        return {
          id: a.id,
          proposalId: a.proposalId,
          title: a.title,
          proposalTitle: a.proposalTitle,
          principalInvestigator: a.principalInvestigator,
          department: a.department,
          funder: a.funder,
          amount: a.award.amount,
          currency: a.currency,
          grantNumber: a.award.grantNumber,
          startDate: a.award.startDate,
          endDate: a.award.endDate,
          elapsed,
          daysRemaining: endD ? daysBetween(now, endD) : null,
          contractSigned: a.award.contractSigned,
          nextReport: report ? { type: report.reportType, dueDate: report.dueDate, overdue: new Date(report.dueDate) < now } : null,
          source: a.source,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // ---- breakdowns for the period ----
    const funderMap = new Map();
    applications.filter((a) => inRange(a.submittedAt, start, end) || (a.award && inRange(a.award.awardDate, start, end))).forEach((a) => {
      if (!funderMap.has(a.funder)) funderMap.set(a.funder, { funder: a.funder, applications: 0, awards: 0, requested: 0, awarded: 0, rejected: 0 });
      const f = funderMap.get(a.funder);
      if (inRange(a.submittedAt, start, end)) { f.applications += 1; if (a.currency === currency) f.requested += a.requested; }
      if (a.award && inRange(a.award.awardDate, start, end)) { f.awards += 1; if (a.currency === currency) f.awarded += a.award.amount; }
      if (a.status === 'REJECTED' && inRange(a.decidedAt, start, end)) f.rejected += 1;
    });
    const byFunder = [...funderMap.values()]
      .map((f) => ({ ...f, winRate: pct(f.awards, f.awards + f.rejected) }))
      .sort((a, b) => b.awarded - a.awarded || b.requested - a.requested);

    const deptMap = new Map();
    const deptRow = (name) => {
      if (!deptMap.has(name)) deptMap.set(name, { department: name, proposals: 0, budget: 0, applications: 0, awards: 0, awarded: 0 });
      return deptMap.get(name);
    };
    proposals.filter((p) => inRange(p.createdAt, start, end)).forEach((p) => {
      const d = deptRow(department(p));
      d.proposals += 1;
      if (currencyOf(p) === currency) d.budget += num(p.totalBudgetAmount);
    });
    applications.forEach((a) => {
      if (inRange(a.submittedAt, start, end)) deptRow(a.department).applications += 1;
      if (a.award && inRange(a.award.awardDate, start, end)) {
        const d = deptRow(a.department);
        d.awards += 1;
        if (a.currency === currency) d.awarded += a.award.amount;
      }
    });
    const byDepartment = [...deptMap.values()].sort((a, b) => b.awarded - a.awarded || b.budget - a.budget);

    const buckets = monthBuckets(start, end);
    const monthlyTrends = buckets.map((b) => ({
      month: b.label,
      budgeted: sum(proposals.filter((p) => currencyOf(p) === currency && inRange(p.createdAt, b.start, b.end)), (p) => num(p.totalBudgetAmount)),
      applied: sum(inCur(applications.filter((a) => inRange(a.submittedAt, b.start, b.end))), (a) => a.requested),
      awarded: sum(inCur(applications.filter((a) => a.award && inRange(a.award.awardDate, b.start, b.end))), (a) => a.award.amount),
    }));

    const funnel = [
      { stage: 'Proposals submitted', count: current.proposals, amount: current.requestedBudget },
      { stage: 'Internally approved', count: current.internallyApproved, amount: current.approvedBudget },
      { stage: 'Grant applications sent', count: current.applicationsSubmitted, amount: current.amountApplied },
      { stage: 'Awarded', count: current.awards, amount: current.amountAwarded },
    ];

    const statusLabel = (s) => clean(s).replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

    return NextResponse.json({
      institution: { id: institution.id, name: institution.name },
      range: { start: start.toISOString(), end: end.toISOString(), previousStart: previousStart.toISOString(), previousEnd: previousEnd.toISOString() },
      generatedAt: now.toISOString(),
      currency,
      otherCurrencies,
      current,
      previous,
      change: {
        requestedBudget: pctChange(current.requestedBudget, previous.requestedBudget),
        amountApplied: pctChange(current.amountApplied, previous.amountApplied),
        amountAwarded: pctChange(current.amountAwarded, previous.amountAwarded),
        awards: pctChange(current.awards, previous.awards),
      },
      position: {
        activeAwards: activePortfolio.length,
        activeAwardValue: sum(activePortfolio.filter((a) => a.currency === currency), (a) => a.amount),
        pipelineCount: pipelineApps.length,
        pipelineValue: sum(inCur(pipelineApps), (a) => a.requested),
        preparingCount: preparingApps.length,
        approvedNotApplied: approvedNotApplied.length,
        overdueReports: activePortfolio.filter((a) => a.nextReport?.overdue).length,
        unsignedContracts: activePortfolio.filter((a) => a.contractSigned === false).length,
      },
      funnel,
      monthlyTrends,
      byFunder,
      byDepartment,
      activePortfolio,
      pipeline: [...pipelineApps, ...preparingApps]
        .map((a) => ({
          id: a.id,
          proposalId: a.proposalId,
          title: a.title,
          principalInvestigator: a.principalInvestigator,
          funder: a.funder,
          requested: a.requested,
          currency: a.currency,
          status: a.status,
          statusLabel: statusLabel(a.status),
          deadline: a.deadline,
          submittedAt: a.submittedAt,
          daysWaiting: a.submittedAt && IN_FLIGHT.includes(a.status) ? daysBetween(a.submittedAt, now) : null,
          source: a.source,
        }))
        .sort((a, b) => (IN_FLIGHT.includes(b.status) ? 1 : 0) - (IN_FLIGHT.includes(a.status) ? 1 : 0) || b.requested - a.requested),
      approvedNotApplied: approvedNotApplied
        .map((p) => ({ id: p.id, title: p.title, principalInvestigator: p.principalInvestigator, department: department(p), budget: num(p.totalBudgetAmount), currency: currencyOf(p), fundingSource: p.fundingSource, approvedAt: p.updatedAt }))
        .sort((a, b) => b.budget - a.budget),
      opportunities: opportunities.map((o) => ({
        id: o.id,
        title: o.title,
        funder: o.grantor?.name || 'Funder',
        funderType: o.grantor?.type || null,
        country: o.grantor?.country || null,
        amount: num(o.amount),
        deadline: o.deadline,
        daysLeft: daysBetween(now, o.deadline),
        category: o.category,
      })),
    });
  } catch (error) {
    console.error('Error fetching funding analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch funding analytics' }, { status: 500 });
  }
}
