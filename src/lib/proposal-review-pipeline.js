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
  const canPromote = ['DRAFT', 'SUBMITTED'].includes(proposal?.status);
  const nextStatus = IN_REVIEW_STATUSES.includes(status) ? status : 'UNDER_REVIEW';

  if (existing) {
    if (canPromote && proposal.status !== nextStatus) {
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

export function isProposalInReview(status) {
  return IN_REVIEW_STATUSES.includes(status);
}
