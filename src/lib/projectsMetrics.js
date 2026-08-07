import prisma from './prisma';

// Fields computed from timestamps we track (createdAt/updatedAt) rather than
// an explicit submission/decision-date history, so we flag them as estimates
// rather than presenting them as exact durations.
export const ESTIMATED_FIELDS = ['avgTurnaroundDays'];

const PROPOSAL_ACTIVE_STATUSES = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUESTED'];
const PROPOSAL_DECIDED_STATUSES = ['APPROVED', 'REJECTED'];
const PROPOSAL_STATUS_ORDER = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUESTED', 'APPROVED', 'REJECTED'];
const GRANT_STATUS_ORDER = ['PREPARING', 'READY_TO_SUBMIT', 'SUBMITTED', 'UNDER_REVIEW', 'ADDITIONAL_INFO_REQUESTED', 'AWARDED', 'REJECTED', 'WITHDRAWN'];

export async function getProjectsMetrics(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { orcidId: true } });

  // Proposals aren't linked to a userId column directly (schema has a TODO
  // noting auth wasn't wired up yet); the rest of the app matches a
  // researcher's proposals by ORCID, so we follow that same convention.
  let proposals = [];
  if (user?.orcidId) {
    proposals = await prisma.proposal.findMany({
      where: { principalInvestigatorOrcid: user.orcidId },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        totalBudgetAmount: true,
        startDate: true,
        endDate: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  const grantApplications = await prisma.grantApplication.findMany({
    where: { userId },
    include: { award: true, milestones: true },
    orderBy: { createdAt: 'desc' }
  });

  // --- Proposal success & approval rate (real) ---
  const totalProposals = proposals.length;
  const activeProposals = proposals.filter((p) => PROPOSAL_ACTIVE_STATUSES.includes(p.status)).length;
  const decidedProposals = proposals.filter((p) => PROPOSAL_DECIDED_STATUSES.includes(p.status));
  const approvedProposals = proposals.filter((p) => p.status === 'APPROVED');
  const approvalRate = decidedProposals.length > 0 ? (approvedProposals.length / decidedProposals.length) * 100 : null;

  const proposalStatusCounts = PROPOSAL_STATUS_ORDER.map((status) => ({
    status: status.replace(/_/g, ' '),
    count: proposals.filter((p) => p.status === status).length
  }));

  // Turnaround time (estimated): time between record creation and last
  // update for proposals that reached a final decision. Not a true
  // submission-to-decision measurement since we don't store those events.
  const avgTurnaroundDays = decidedProposals.length > 0
    ? Math.round(
        decidedProposals.reduce(
          (sum, p) => sum + (new Date(p.updatedAt) - new Date(p.createdAt)) / 86400000,
          0
        ) / decidedProposals.length
      )
    : null;

  // --- Budget (real, from Proposal + GrantApplication/GrantAward) ---
  const totalProposedBudget = proposals.reduce((sum, p) => sum + Number(p.totalBudgetAmount || 0), 0);

  let totalRequested = 0;
  let totalAwarded = 0;
  const fundingByYear = {};
  const grants = grantApplications.map((ga) => {
    const requested = Number(ga.requestedAmount || 0);
    const awardedAmount = ga.award ? Number(ga.award.awardedAmount || 0) : null;
    totalRequested += requested;
    if (ga.status === 'AWARDED' && awardedAmount) {
      totalAwarded += awardedAmount;
      const year = ga.award?.awardDate ? new Date(ga.award.awardDate).getFullYear() : new Date(ga.createdAt).getFullYear();
      fundingByYear[year] = (fundingByYear[year] || 0) + awardedAmount;
    }
    return {
      id: ga.id,
      title: ga.applicationTitle,
      grantorName: ga.grantorName,
      status: ga.status,
      requestedAmount: requested,
      awardedAmount,
      submissionDeadline: ga.submissionDeadline,
      awardDate: ga.award?.awardDate || null
    };
  });
  const fundingTrend = Object.keys(fundingByYear)
    .sort()
    .map((year) => ({ year: Number(year), amount: fundingByYear[year] }));

  const budgetUtilization = totalRequested > 0 ? Math.min(100, (totalAwarded / totalRequested) * 100) : null;

  // --- Grant application pipeline / conversion (real, current status snapshot) ---
  const totalGrantApplications = grantApplications.length;
  const awardedCount = grantApplications.filter((ga) => ga.status === 'AWARDED').length;
  const conversionRate = totalGrantApplications > 0 ? (awardedCount / totalGrantApplications) * 100 : null;

  const pipeline = GRANT_STATUS_ORDER
    .map((status) => ({
      status: status.replace(/_/g, ' '),
      count: grantApplications.filter((ga) => ga.status === status).length
    }))
    .filter((s) => s.count > 0);

  // --- Milestones & timeliness (real, from GrantMilestone) ---
  const allMilestones = grantApplications.flatMap((ga) =>
    (ga.milestones || []).map((m) => ({ ...m, grantTitle: ga.applicationTitle }))
  );
  const now = new Date();
  const completedMilestones = allMilestones.filter((m) => m.status === 'COMPLETED');
  const overdueMilestones = allMilestones.filter(
    (m) => m.status !== 'COMPLETED' && m.dueDate && new Date(m.dueDate) < now
  );
  const pendingMilestones = allMilestones.filter(
    (m) => m.status !== 'COMPLETED' && !(m.dueDate && new Date(m.dueDate) < now)
  );

  const onTimeCompleted = completedMilestones.filter(
    (m) => m.dueDate && m.completedDate && new Date(m.completedDate) <= new Date(m.dueDate)
  );
  const onTimeRate = completedMilestones.length > 0 ? (onTimeCompleted.length / completedMilestones.length) * 100 : null;

  const upcomingMilestones = allMilestones
    .filter((m) => m.status !== 'COMPLETED' && m.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 8)
    .map((m) => ({
      title: m.title,
      grantTitle: m.grantTitle,
      dueDate: m.dueDate,
      status: m.dueDate && new Date(m.dueDate) < now ? 'Overdue' : m.status
    }));

  return {
    overview: {
      totalProposals,
      activeProposals,
      approvalRate,
      avgTurnaroundDays,
      totalMilestones: allMilestones.length,
      completedMilestones: completedMilestones.length,
      onTimeRate,
      totalProposedBudget,
      totalRequested,
      totalAwarded,
      budgetUtilization,
      totalGrantApplications,
      awardedCount,
      conversionRate
    },
    proposalStatusCounts,
    pipeline,
    fundingTrend,
    grants: grants.slice(0, 10),
    upcomingMilestones,
    milestoneBreakdown: {
      completed: completedMilestones.length,
      overdue: overdueMilestones.length,
      pending: pendingMilestones.length
    },
    meta: {
      estimatedFields: ESTIMATED_FIELDS,
      hasOrcid: Boolean(user?.orcidId),
      generatedAt: new Date().toISOString()
    }
  };
}
