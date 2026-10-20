import sys, os
root = sys.argv[1]

def edit(rel, pairs):
    p = os.path.join(root, rel)
    raw = open(p, encoding='utf-8', newline='').read()
    crlf = '\r\n' in raw
    s = raw.replace('\r\n', '\n')
    for old, new in pairs:
        assert s.count(old) == 1, f'{rel}: NOT UNIQUE/FOUND: {old[:90]}'
        s = s.replace(old, new)
    if crlf:
        s = s.replace('\n', '\r\n')
    open(p, 'w', encoding='utf-8', newline='').write(s)
    print('edited', rel)

# 1) lib: resubmission fix + new sync function
edit('src/lib/proposal-review-pipeline.js', [
("""  const canPromote = ['DRAFT', 'SUBMITTED'].includes(proposal?.status);
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
""",
"""  const canPromote = ['DRAFT', 'SUBMITTED', 'REVISION_REQUESTED'].includes(proposal?.status);
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
"""),
("""export function isProposalInReview(status) {""",
"""const STAGE_DONE = ['APPROVED', 'APPROVED_WITH_CONTINGENCIES', 'SKIPPED', 'DISAPPROVED'];
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

export function isProposalInReview(status) {"""),
])

# 2) review POST: sync pipeline after status update
edit('src/app/api/proposals/[id]/review/route.js', [
("""import { notifyProposalOwner } from '../../../../../lib/proposal-review-comms.js';""",
"""import { notifyProposalOwner } from '../../../../../lib/proposal-review-comms.js';
import { syncReviewPipelineWithDecision } from '../../../../../lib/proposal-review-pipeline.js';"""),
("""        const templateByStatus = {
            APPROVED: 'PROPOSAL_APPROVED',""",
"""        // Keep the stage-by-stage pipeline in step with the final decision
        try {
            await syncReviewPipelineWithDecision(prisma, id, decision, {
                comments: overallComments,
                reason: decision === 'rejected' ? rejectionReason : revisionRequirements,
            });
        } catch (pipelineError) {
            console.error('Failed to sync review pipeline with decision:', pipelineError);
        }

        const templateByStatus = {
            APPROVED: 'PROPOSAL_APPROVED',"""),
])

# 3) review-status GET: heal proposals decided before this fix
edit('src/app/api/proposals/[id]/review-status/route.js', [
("""import { ensureProposalInReviewPipeline, isProposalInReview } from '../../../../../lib/proposal-review-pipeline.js';""",
"""import { ensureProposalInReviewPipeline, isProposalInReview, syncReviewPipelineWithDecision } from '../../../../../lib/proposal-review-pipeline.js';"""),
("""    const tracking = await prisma.proposalReviewTracking.findUnique({
      where: { proposalId: id },
      include: trackingInclude,
    });
""",
"""    let tracking = await prisma.proposalReviewTracking.findUnique({
      where: { proposalId: id },
      include: trackingInclude,
    });

    // Self-heal: a final decision was recorded but the pipeline was never closed
    // (proposals decided before decisions were synced to the pipeline).
    const expectedOverall = { APPROVED: 'COMPLETED', REJECTED: 'REJECTED' }[proposal?.status];
    if (tracking && expectedOverall && tracking.overallStatus !== expectedOverall) {
      try {
        const latestReview = await prisma.proposalReview.findFirst({
          where: { proposalId: id },
          orderBy: { reviewDate: 'desc' },
          select: { overallComments: true, rejectionReason: true },
        });
        await syncReviewPipelineWithDecision(prisma, id, proposal.status, {
          comments: latestReview?.overallComments || '',
          reason: latestReview?.rejectionReason || '',
        });
        tracking = await prisma.proposalReviewTracking.findUnique({
          where: { proposalId: id },
          include: trackingInclude,
        });
      } catch (err) {
        console.error('Failed to sync review pipeline with proposal decision:', err);
      }
    }
"""),
])

# 4) widget header: show rejection clearly
edit('src/components/Proposals/ProposalReviewStatus.js', [
("""        <Chip
          label={overallStatus === 'COMPLETED' ? 'All Stages Complete' : `Stage ${currentStageOrder} of ${stages.length}`}
          color={overallStatus === 'COMPLETED' ? 'success' : 'primary'}
        />""",
"""        <Chip
          label={overallStatus === 'COMPLETED' ? 'All Stages Complete' : overallStatus === 'REJECTED' ? 'Review Closed: Not Approved' : `Stage ${currentStageOrder} of ${stages.length}`}
          color={overallStatus === 'COMPLETED' ? 'success' : overallStatus === 'REJECTED' ? 'error' : 'primary'}
        />"""),
("""          label={overallStatus === 'COMPLETED' ? 'Review Complete' : currentStage?.name || 'Not Started'}
          size="small"
          sx={{
            backgroundColor: overallStatus === 'COMPLETED' ? '#4caf50' : '#2196f3',""",
"""          label={overallStatus === 'COMPLETED' ? 'Review Complete' : overallStatus === 'REJECTED' ? 'Not Approved' : currentStage?.name || 'Not Started'}
          size="small"
          sx={{
            backgroundColor: overallStatus === 'COMPLETED' ? '#4caf50' : overallStatus === 'REJECTED' ? '#d32f2f' : '#2196f3',"""),
])

# 5) institution page: review decisions are stored upper-case (APPROVED), match case-insensitively
edit('src/app/institution/proposals/review/[id]/page.js', [
("""const decisionMeta = (value) => DECISIONS.find((item) => item.value === value) || null;""",
"""const decisionMeta = (value) => DECISIONS.find((item) => item.value === String(value || '').toLowerCase()) || null;"""),
])
print('all done')
