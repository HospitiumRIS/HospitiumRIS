import { Prisma } from '@prisma/client';
import prisma from './prisma';

export const ESTIMATED_FIELDS = ['avgTurnaroundDays'];

const PROPOSAL_DECIDED_STATUSES = ['APPROVED', 'REJECTED'];
const PROPOSAL_STATUS_ORDER = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUESTED', 'APPROVED', 'REJECTED'];
const GRANT_TRACKING_ORDER = ['NOT_APPLIED', 'APPLIED', 'AWARDED', 'REJECTED', 'CANCELLED'];
const GRANT_APP_STATUS_ORDER = ['PREPARING', 'READY_TO_SUBMIT', 'SUBMITTED', 'UNDER_REVIEW', 'ADDITIONAL_INFO_REQUESTED', 'AWARDED', 'REJECTED', 'WITHDRAWN'];
const EXECUTION_STATUS_ORDER = ['Planning', 'Review', 'Active', 'On Hold', 'Completed'];

const EXECUTION_FROM_PROPOSAL = {
  DRAFT: 'Planning',
  SUBMITTED: 'Review',
  UNDER_REVIEW: 'Review',
  REVISION_REQUESTED: 'Planning',
  APPROVED: 'Active',
  REJECTED: 'On Hold',
};

function normalizeItemStatus(status) {
  const normalized = String(status || 'pending').trim().toLowerCase().replace(/_/g, ' ');
  if (['completed', 'delivered'].includes(normalized)) return 'Completed';
  if (normalized === 'in progress') return 'In Progress';
  if (normalized === 'blocked') return 'Blocked';
  return 'Pending';
}

function isComplete(status) {
  return normalizeItemStatus(status) === 'Completed';
}

function itemDueDate(item) {
  return item?.dueDate || item?.targetDate || item?.deadline || null;
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function labelStatus(status) {
  return String(status || '').replaceAll('_', ' ');
}

function executionStatus(proposal) {
  const logs = Array.isArray(proposal.otherRelatedFiles)
    ? proposal.otherRelatedFiles.filter((item) => item?.category === 'status_change')
    : [];
  const last = logs[logs.length - 1];
  if (last?.toStatus && EXECUTION_STATUS_ORDER.includes(last.toStatus)) {
    return last.toStatus;
  }
  return EXECUTION_FROM_PROPOSAL[proposal.status] || 'Planning';
}

function summarizeItems(items, now) {
  const completed = items.filter((item) => isComplete(item.status));
  const overdue = items.filter((item) => {
    const due = parseDate(itemDueDate(item));
    return !isComplete(item.status) && due && due < now;
  });
  const pending = items.filter((item) => !isComplete(item.status) && !overdue.includes(item));
  const onTimeCompleted = completed.filter((item) => {
    const due = parseDate(itemDueDate(item));
    const done = parseDate(item.completedDate);
    return due && done && done <= due;
  });
  return {
    total: items.length,
    completed: completed.length,
    overdue: overdue.length,
    pending: pending.length,
    inProgress: items.filter((item) => normalizeItemStatus(item.status) === 'In Progress').length,
    blocked: items.filter((item) => normalizeItemStatus(item.status) === 'Blocked').length,
    onTimeRate: completed.length ? (onTimeCompleted.length / completed.length) * 100 : null,
  };
}

function mapTrackedItems(items, proposal, kind) {
  return (Array.isArray(items) ? items : []).map((item, index) => ({
    id: item.id || `${kind}-${proposal.id}-${index}`,
    title: item.title || item.name || `${kind === 'milestone' ? 'Milestone' : 'Deliverable'} ${index + 1}`,
    status: normalizeItemStatus(item.status),
    dueDate: itemDueDate(item),
    completedDate: item.completedDate || null,
    kind,
    proposalId: proposal.id,
    proposalTitle: proposal.title,
    grantTitle: proposal.title,
  }));
}

async function resolveProposalIds(user) {
  const ids = new Set();

  if (user?.orcidId) {
    const byOrcid = await prisma.proposal.findMany({
      where: { principalInvestigatorOrcid: user.orcidId },
      select: { id: true },
    });
    byOrcid.forEach((row) => ids.add(row.id));
  }

  try {
    const ethics = await prisma.ethicsApplication.findMany({
      where: { userId: user.id },
      select: { id: true },
    });
    if (ethics.length) {
      const links = await prisma.proposalEthicsLink.findMany({
        where: { ethicsApplicationId: { in: ethics.map((item) => item.id) } },
        select: { proposalId: true },
      });
      links.forEach((row) => ids.add(row.proposalId));
    }
  } catch (error) {
    console.error('Could not resolve ethics-linked proposals:', error);
  }

  try {
    const followed = await prisma.proposal.findMany({
      where: { grantFollowUpUserId: user.id },
      select: { id: true },
    });
    followed.forEach((row) => ids.add(row.id));
  } catch {
    // grantFollowUpUserId may be missing on a stale Prisma client
  }

  return [...ids];
}

async function loadGrantTrackingByIds(ids) {
  if (!ids.length) return {};
  try {
    const rows = await prisma.$queryRaw`
      SELECT
        id,
        COALESCE("grantTrackingStatus", 'NOT_APPLIED') AS "grantTrackingStatus",
        "grantRequestedAmount",
        "grantAppliedOn",
        "grantDecisionOn"
      FROM proposals
      WHERE id IN (${Prisma.join(ids)})
    `;
    return Object.fromEntries(rows.map((row) => [row.id, row]));
  } catch (error) {
    console.error('Could not load grant tracking fields:', error);
    return {};
  }
}

export async function getProjectsMetrics(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, orcidId: true },
  });

  const proposalIds = user ? await resolveProposalIds(user) : [];
  let proposals = [];

  if (proposalIds.length) {
    proposals = await prisma.proposal.findMany({
      where: { id: { in: proposalIds } },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        totalBudgetAmount: true,
        startDate: true,
        endDate: true,
        milestones: true,
        deliverables: true,
        otherRelatedFiles: true,
        departments: true,
        reviewTracking: {
          select: {
            overallStatus: true,
            currentStageOrder: true,
            pipeline: {
              select: {
                name: true,
                stages: { select: { id: true, name: true, order: true }, orderBy: { order: 'asc' } },
              },
            },
            stageProgress: {
              select: {
                status: true,
                stage: { select: { name: true, order: true } },
              },
            },
          },
        },
        reviews: {
          select: { reviewDate: true, createdAt: true, decision: true },
          orderBy: { reviewDate: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  const grantFields = await loadGrantTrackingByIds(proposals.map((item) => item.id));
  proposals = proposals.map((proposal) => ({
    ...proposal,
    grantTrackingStatus: grantFields[proposal.id]?.grantTrackingStatus || 'NOT_APPLIED',
    grantRequestedAmount: grantFields[proposal.id]?.grantRequestedAmount ?? null,
    grantAppliedOn: grantFields[proposal.id]?.grantAppliedOn ?? null,
    grantDecisionOn: grantFields[proposal.id]?.grantDecisionOn ?? null,
    executionStatus: executionStatus(proposal),
  }));

  const grantApplications = await prisma.grantApplication.findMany({
    where: { userId },
    include: { award: true, milestones: true },
    orderBy: { createdAt: 'desc' },
  });

  const now = new Date();
  const totalProposals = proposals.length;
  const inReview = proposals.filter((item) => ['SUBMITTED', 'UNDER_REVIEW'].includes(item.status)).length;
  const revisionRequested = proposals.filter((item) => item.status === 'REVISION_REQUESTED').length;
  const activeProjects = proposals.filter((item) => item.executionStatus === 'Active').length;
  const decidedProposals = proposals.filter((item) => PROPOSAL_DECIDED_STATUSES.includes(item.status));
  const approvedProposals = proposals.filter((item) => item.status === 'APPROVED');
  const approvalRate = decidedProposals.length ? (approvedProposals.length / decidedProposals.length) * 100 : null;

  const proposalStatusCounts = PROPOSAL_STATUS_ORDER.map((status) => ({
    status: labelStatus(status),
    key: status,
    count: proposals.filter((item) => item.status === status).length,
  }));

  const executionStatusCounts = EXECUTION_STATUS_ORDER.map((status) => ({
    status,
    count: proposals.filter((item) => item.executionStatus === status).length,
  }));

  const turnaroundSamples = decidedProposals.map((proposal) => {
    const firstReview = proposal.reviews?.[proposal.reviews.length - 1];
    const decidedAt = parseDate(firstReview?.reviewDate || firstReview?.createdAt || proposal.updatedAt);
    const startedAt = parseDate(proposal.createdAt);
    if (!decidedAt || !startedAt) return null;
    return (decidedAt - startedAt) / 86400000;
  }).filter((value) => value != null && value >= 0);

  const avgTurnaroundDays = turnaroundSamples.length
    ? Math.round(turnaroundSamples.reduce((sum, value) => sum + value, 0) / turnaroundSamples.length)
    : null;

  const proposalMilestones = proposals.flatMap((proposal) => mapTrackedItems(proposal.milestones, proposal, 'milestone'));
  const proposalDeliverables = proposals.flatMap((proposal) => mapTrackedItems(proposal.deliverables, proposal, 'deliverable'));
  const grantMilestones = grantApplications.flatMap((application) =>
    (application.milestones || []).map((item) => ({
      id: item.id,
      title: item.title,
      status: normalizeItemStatus(item.status),
      dueDate: item.dueDate,
      completedDate: item.completedDate,
      kind: 'grant-milestone',
      proposalId: application.proposalId,
      proposalTitle: application.applicationTitle,
      grantTitle: application.applicationTitle,
    }))
  );

  const allMilestones = [...proposalMilestones, ...grantMilestones];
  const milestoneBreakdown = summarizeItems(allMilestones, now);
  const deliverableBreakdown = summarizeItems(proposalDeliverables, now);

  const upcomingMilestones = [...allMilestones, ...proposalDeliverables]
    .filter((item) => !isComplete(item.status) && item.dueDate)
    .sort((a, b) => parseDate(a.dueDate) - parseDate(b.dueDate))
    .slice(0, 10)
    .map((item) => ({
      title: item.title,
      grantTitle: item.proposalTitle,
      proposalId: item.proposalId,
      kind: item.kind,
      dueDate: item.dueDate,
      status: parseDate(item.dueDate) < now ? 'Overdue' : item.status,
    }));

  const totalProposedBudget = proposals.reduce((sum, item) => sum + Number(item.totalBudgetAmount || 0), 0);
  let totalRequested = 0;
  let totalAwarded = 0;
  const fundingByYear = {};

  const trackerGrants = proposals.map((proposal) => {
    const requested = Number(proposal.grantRequestedAmount || 0);
    const awarded = proposal.grantTrackingStatus === 'AWARDED' ? (requested || Number(proposal.totalBudgetAmount || 0)) : 0;
    if (proposal.grantTrackingStatus !== 'NOT_APPLIED') totalRequested += requested || Number(proposal.totalBudgetAmount || 0);
    if (awarded) {
      totalAwarded += awarded;
      const year = parseDate(proposal.grantDecisionOn || proposal.updatedAt)?.getFullYear();
      if (year) fundingByYear[year] = (fundingByYear[year] || 0) + awarded;
    }
    return {
      id: proposal.id,
      title: proposal.title,
      grantorName: null,
      source: 'proposal',
      status: proposal.grantTrackingStatus,
      requestedAmount: requested || Number(proposal.totalBudgetAmount || 0) || null,
      awardedAmount: awarded || null,
      appliedOn: proposal.grantAppliedOn,
      decisionOn: proposal.grantDecisionOn,
    };
  });

  const applicationGrants = grantApplications.map((application) => {
    const requested = Number(application.requestedAmount || 0);
    const awardedAmount = application.award ? Number(application.award.awardedAmount || 0) : null;
    totalRequested += requested;
    if (application.status === 'AWARDED' && awardedAmount) {
      totalAwarded += awardedAmount;
      const year = parseDate(application.award?.awardDate || application.createdAt)?.getFullYear();
      if (year) fundingByYear[year] = (fundingByYear[year] || 0) + awardedAmount;
    }
    return {
      id: application.id,
      title: application.applicationTitle,
      grantorName: application.grantorName,
      source: 'application',
      status: application.status,
      requestedAmount: requested,
      awardedAmount,
      appliedOn: application.applicationDate,
      decisionOn: application.award?.awardDate || null,
    };
  });

  const grants = [...trackerGrants.filter((item) => item.status !== 'NOT_APPLIED'), ...applicationGrants];
  const fundingTrend = Object.keys(fundingByYear).sort().map((year) => ({ year: Number(year), amount: fundingByYear[year] }));
  const budgetUtilization = totalRequested > 0 ? Math.min(100, (totalAwarded / totalRequested) * 100) : null;

  const grantTrackingCounts = GRANT_TRACKING_ORDER.map((status) => ({
    status: labelStatus(status),
    key: status,
    count: proposals.filter((item) => item.grantTrackingStatus === status).length,
  }));

  const applicationPipeline = GRANT_APP_STATUS_ORDER.map((status) => ({
    status: labelStatus(status),
    key: status,
    count: grantApplications.filter((item) => item.status === status).length,
  })).filter((item) => item.count > 0);

  const trackerApplied = proposals.filter((item) => item.grantTrackingStatus !== 'NOT_APPLIED').length;
  const trackerAwarded = proposals.filter((item) => item.grantTrackingStatus === 'AWARDED').length;
  const applicationAwarded = grantApplications.filter((item) => item.status === 'AWARDED').length;
  const totalGrantApplications = trackerApplied + grantApplications.length;
  const awardedCount = trackerAwarded + applicationAwarded;
  const conversionRate = totalGrantApplications > 0 ? (awardedCount / totalGrantApplications) * 100 : null;

  const pipeline = grantTrackingCounts.filter((item) => item.count > 0);

  const proposalsView = proposals.map((proposal) => {
    const milestones = mapTrackedItems(proposal.milestones, proposal, 'milestone');
    const completed = milestones.filter((item) => isComplete(item.status)).length;
    const next = milestones.find((item) => !isComplete(item.status));
    const currentStage = proposal.reviewTracking?.pipeline?.stages?.find(
      (stage) => stage.order === proposal.reviewTracking?.currentStageOrder
    ) || proposal.reviewTracking?.stageProgress?.find((item) => item.status === 'IN_PROGRESS')?.stage;
    return {
      id: proposal.id,
      title: proposal.title,
      status: proposal.status,
      statusLabel: labelStatus(proposal.status),
      executionStatus: proposal.executionStatus,
      progress: milestones.length ? Math.round((completed / milestones.length) * 100) : 0,
      milestoneCount: milestones.length,
      completedMilestones: completed,
      nextMilestone: next?.title || (milestones.length ? 'All milestones completed' : 'No milestones defined'),
      nextDue: next?.dueDate || proposal.endDate,
      grantTrackingStatus: proposal.grantTrackingStatus,
      budget: Number(proposal.totalBudgetAmount || 0),
      departments: proposal.departments || [],
      reviewStage: currentStage?.name || null,
      reviewOverall: proposal.reviewTracking?.overallStatus || null,
      updatedAt: proposal.updatedAt,
    };
  });

  const avgProgress = proposalsView.length
    ? Math.round(proposalsView.reduce((sum, item) => sum + item.progress, 0) / proposalsView.length)
    : 0;

  return {
    overview: {
      totalProposals,
      activeProposals: inReview + revisionRequested,
      inReview,
      revisionRequested,
      approvedCount: approvedProposals.length,
      activeProjects,
      approvalRate,
      avgTurnaroundDays,
      avgProgress,
      totalMilestones: allMilestones.length,
      completedMilestones: milestoneBreakdown.completed,
      overdueMilestones: milestoneBreakdown.overdue,
      onTimeRate: milestoneBreakdown.onTimeRate,
      totalDeliverables: deliverableBreakdown.total,
      completedDeliverables: deliverableBreakdown.completed,
      totalProposedBudget,
      totalRequested,
      totalAwarded,
      budgetUtilization,
      totalGrantApplications,
      awardedCount,
      conversionRate,
    },
    proposalStatusCounts,
    executionStatusCounts,
    grantTrackingCounts,
    pipeline,
    applicationPipeline,
    fundingTrend,
    grants: grants.slice(0, 12),
    upcomingMilestones,
    milestoneBreakdown,
    deliverableBreakdown,
    proposals: proposalsView,
    meta: {
      estimatedFields: ESTIMATED_FIELDS,
      hasOrcid: Boolean(user?.orcidId),
      generatedAt: new Date().toISOString(),
    },
  };
}
