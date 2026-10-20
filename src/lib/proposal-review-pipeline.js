const IN_REVIEW_STATUSES = ['SUBMITTED', 'UNDER_REVIEW'];

const DEFAULT_STAGES = [
  {
    name: 'Administrative Review',
    description: 'Completeness, eligibility, and administrative checks',
    stageType: 'ADMINISTRATIVE_REVIEW',
    order: 1,
    isRequired: true,
  },
  {
    name: 'Scientific Review',
    description: 'Scientific quality and methodology review',
    stageType: 'SCIENTIFIC_REVIEW',
    order: 2,
    isRequired: true,
  },
  {
    name: 'Final Decision',
    description: 'Institutional decision on the proposal',
    stageType: 'CUSTOM',
    order: 3,
    isRequired: true,
  },
];

async function resolveReviewPipeline(client) {
  let pipeline = await client.proposalReviewPipeline.findFirst({
    where: { isActive: true },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    include: { stages: { orderBy: { order: 'asc' } } },
  });

  if (!pipeline) {
    pipeline = await client.proposalReviewPipeline.create({
      data: {
        institutionId: 'default',
        name: 'Standard Proposal Review',
        description: 'Default review pipeline for submitted proposals',
        isActive: true,
        isDefault: true,
        stages: { create: DEFAULT_STAGES },
      },
      include: { stages: { orderBy: { order: 'asc' } } },
    });
    return pipeline;
  }

  if (!pipeline.stages?.length) {
    await client.proposalReviewStage.createMany({
      data: DEFAULT_STAGES.map((stage) => ({ ...stage, pipelineId: pipeline.id })),
    });
    pipeline = await client.proposalReviewPipeline.findUnique({
      where: { id: pipeline.id },
      include: { stages: { orderBy: { order: 'asc' } } },
    });
  }

  return pipeline;
}

export async function ensureProposalInReviewPipeline(client, proposalId, { status = 'UNDER_REVIEW' } = {}) {
  const existing = await client.proposalReviewTracking.findUnique({
    where: { proposalId },
  });

  const proposal = await client.proposal.findUnique({
    where: { id: proposalId },
    select: { status: true },
  });
  const canPromote = ['DRAFT', 'SUBMITTED', 'REVISION_REQUESTED'].includes(proposal?.status);
  const nextStatus = IN_REVIEW_STATUSES.includes(status) ? status : 'UNDER_REVIEW';

  if (existing) {
    if (canPromote && proposal.status !== nextStatus) {
      // Resubmission after a revision request: reopen the stage that was deferred.
      if (proposal.status === 'REVISION_REQUESTED' && IN_REVIEW_STATUSES.includes(nextStatus)) {
        await client.proposalStageProgress.updateMany({
          where: { trackingId: existing.id, status: 'DEFERRED' },
          data: { status: 'IN_PROGRESS', startedAt: new Date(), completedAt: null },
        });
        await client.proposalReviewTracking.update({
          where: { id: existing.id },
          data: { overallStatus: 'IN_PROGRESS', completedAt: null },
        });
      }
      await client.proposal.update({
        where: { id: proposalId },
        data: { status: nextStatus },
      });
    }
    return existing;
  }

  const pipeline = await resolveReviewPipeline(client);
  const firstStage = pipeline.stages?.[0] || null;

  const tracking = await client.proposalReviewTracking.create({
    data: {
      proposalId,
      pipelineId: pipeline.id,
      currentStageId: firstStage?.id || null,
      currentStageOrder: 1,
      overallStatus: 'IN_PROGRESS',
      startedAt: new Date(),
    },
  });

  for (const stage of pipeline.stages || []) {
    await client.proposalStageProgress.create({
      data: {
        trackingId: tracking.id,
        stageId: stage.id,
        status: stage.order === 1 ? 'IN_PROGRESS' : 'NOT_STARTED',
        startedAt: stage.order === 1 ? new Date() : null,
        assignedReviewers: stage.reviewerEmails || [],
      },
    });
  }

  if (canPromote || proposal?.status === 'UNDER_REVIEW') {
    await client.proposal.update({
      where: { id: proposalId },
      data: { status: nextStatus },
    });
  }

  return tracking;
}

const STAGE_DONE = ['APPROVED', 'APPROVED_WITH_CONTINGENCIES', 'SKIPPED', 'DISAPPROVED'];
const CLOSED_BY_DECISION = 'Closed by the final institutional decision';

/**
 * Keep the stage-by-stage review pipeline in step with a final decision recorded
 * through POST /api/proposals/[id]/review (or found on an already-decided proposal).
 *
 *  - approved          -> unfinished earlier stages SKIPPED, final stage APPROVED, tracking COMPLETED
 *  - rejected          -> unfinished earlier stages SKIPPED, final stage DISAPPROVED, tracking REJECTED
 *  - requires_revision -> current stage DEFERRED (reopened on resubmission)
 */
export async function syncReviewPipelineWithDecision(client, proposalId, decision, { comments = '', reason = '' } = {}) {
  const normalized = String(decision || '').toUpperCase();
  const kind = normalized.startsWith('APPROV') ? 'approved'
    : normalized.startsWith('REJECT') ? 'rejected'
      : normalized.includes('REVISION') ? 'revision'
        : null;
  if (!kind) return null;

  let tracking = await client.proposalReviewTracking.findUnique({ where: { proposalId } });
  if (!tracking) {
    // Decision made before the proposal ever entered the pipeline: create it, then close it.
    tracking = await ensureProposalInReviewPipeline(client, proposalId, { status: 'UNDER_REVIEW' });
  }

  const full = await client.proposalReviewTracking.findUnique({
    where: { id: tracking.id },
    include: {
      pipeline: { include: { stages: { orderBy: { order: 'asc' } } } },
      stageProgress: true,
    },
  });
  const stages = full?.pipeline?.stages || [];
  if (!stages.length) return full;

  const now = new Date();
  const progressByStage = new Map((full.stageProgress || []).map((row) => [row.stageId, row]));
  const getProgress = async (stage) => {
    const row = progressByStage.get(stage.id);
    if (row) return row;
    const created = await client.proposalStageProgress.create({
      data: { trackingId: full.id, stageId: stage.id, status: 'NOT_STARTED', assignedReviewers: stage.reviewerEmails || [] },
    });
    progressByStage.set(stage.id, created);
    return created;
  };

  if (kind === 'revision') {
    const current = stages.find((stage) => stage.order === full.currentStageOrder)
      || stages.find((stage) => !STAGE_DONE.includes(progressByStage.get(stage.id)?.status))
      || stages[stages.length - 1];
    const row = await getProgress(current);
    await client.proposalStageProgress.update({
      where: { id: row.id },
      data: { status: 'DEFERRED', startedAt: row.startedAt || now, completedAt: now, outcome: reason || comments || 'Revision requested' },
    });
    return client.proposalReviewTracking.update({
      where: { id: full.id },
      data: { currentStageId: current.id, currentStageOrder: current.order, overallStatus: 'IN_PROGRESS', completedAt: null },
    });
  }

  const finalStage = stages[stages.length - 1];
  for (const stage of stages) {
    const row = await getProgress(stage);
    if (stage.id === finalStage.id) {
      await client.proposalStageProgress.update({
        where: { id: row.id },
        data: {
          status: kind === 'approved' ? 'APPROVED' : 'DISAPPROVED',
          startedAt: row.startedAt || now,
          completedAt: now,
          outcome: comments || null,
          rejectionReason: kind === 'rejected' ? (reason || comments || null) : null,
        },
      });
    } else if (!STAGE_DONE.includes(row.status)) {
      await client.proposalStageProgress.update({
        where: { id: row.id },
        data: { status: 'SKIPPED', completedAt: now, outcome: CLOSED_BY_DECISION },
      });
    }
  }

  return client.proposalReviewTracking.update({
    where: { id: full.id },
    data: {
      currentStageId: finalStage.id,
      currentStageOrder: finalStage.order,
      overallStatus: kind === 'approved' ? 'COMPLETED' : 'REJECTED',
      completedAt: now,
    },
  });
}

export function isProposalInReview(status) {
  return IN_REVIEW_STATUSES.includes(status);
}
