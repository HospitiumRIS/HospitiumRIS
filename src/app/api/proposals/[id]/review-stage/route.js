import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { forbidden, proposalReviewContext } from '@/lib/review-access-server';
import { isAssignedStageReviewer, isReviewAdmin, reviewerIdentity } from '@/lib/review-access';
import { notifyProposalOwner } from '../../../../../lib/proposal-review-comms.js';

const STAGE_DECISIONS = ['APPROVED', 'APPROVED_WITH_CONTINGENCIES', 'DEFERRED', 'DISAPPROVED'];

/**
 * POST /api/proposals/[id]/review-stage: one reviewer's review of a pipeline stage (#6).
 * Only reviewers assigned to that stage, or the institution's research office, may review,
 * never on their own proposal; the reviewer is the signed-in user, once per stage.
 */
export async function POST(request, { params }) {
  try {
    const { id: proposalId } = await params;
    const ctx = await proposalReviewContext(request, proposalId);
    if (ctx.error) return ctx.error;
    const body = await request.json().catch(() => ({}));
    const { stageId, decision, comments, conditions, reviewerRole } = body;

    if (!stageId || !decision) {
      return NextResponse.json(
        { error: 'Stage ID and decision are required' },
        { status: 400 }
      );
    }

    // Get tracking
    const tracking = await prisma.proposalReviewTracking.findUnique({
      where: { proposalId },
      include: {
        pipeline: {
          include: {
            stages: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
        stageProgress: {
          include: {
            stage: true,
          },
        },
      },
    });

    if (!tracking) {
      return NextResponse.json(
        { error: 'Proposal review tracking not found' },
        { status: 404 }
      );
    }

    // Find the stage progress
    const stageProgress = tracking.stageProgress.find(sp => sp.stageId === stageId);
    if (!stageProgress) {
      return NextResponse.json(
        { error: 'Stage progress not found' },
        { status: 404 }
      );
    }

    const stage = stageProgress.stage;

    const assignedHere = isAssignedStageReviewer(ctx.user, stageProgress, stage);
    const officeHere = isReviewAdmin(ctx.user) && ctx.perms.decide;
    if (!ctx.perms.reviewStage || !(assignedHere || officeHere)) {
      return forbidden('Only reviewers assigned to this stage can review it');
    }
    if (!STAGE_DECISIONS.includes(decision)) {
      return NextResponse.json({ error: `Decision must be one of ${STAGE_DECISIONS.join(', ')}` }, { status: 400 });
    }
    if (stageProgress.status && !['NOT_STARTED', 'IN_PROGRESS'].includes(stageProgress.status)) {
      return NextResponse.json({ error: 'This stage is already closed' }, { status: 409 });
    }
    const identity = reviewerIdentity(ctx.user);
    const already = await prisma.proposalStageReview.findFirst({ where: { stageProgressId: stageProgress.id, reviewerId: identity.reviewerId }, select: { id: true } });
    if (already) {
      return NextResponse.json({ error: 'You have already reviewed this stage' }, { status: 409 });
    }

    // Create review record
    const review = await prisma.proposalStageReview.create({
      data: {
        stageProgressId: stageProgress.id,
        stageId,
        reviewerId: identity.reviewerId,
        reviewerName: identity.reviewerName,
        reviewerEmail: identity.reviewerEmail,
        reviewerRole: typeof reviewerRole === 'string' ? reviewerRole.slice(0, 100) : (assignedHere ? 'Reviewer' : 'Research office'),
        decision,
        comments,
        conditions,
      },
    });

    // Get all reviews for this stage
    const allReviews = await prisma.proposalStageReview.findMany({
      where: { stageProgressId: stageProgress.id },
    });

    // Determine if stage is complete based on approval requirements
    let stageComplete = false;
    let finalDecision = decision;

    if (stage.requiresAllReviewers) {
      // Need all assigned reviewers to approve
      const assignedCount = stage.reviewerEmails?.length || 1;
      const approvedCount = allReviews.filter(r => 
        ['APPROVED', 'APPROVED_WITH_CONTINGENCIES'].includes(r.decision)
      ).length;
      stageComplete = approvedCount >= assignedCount;
    } else {
      // Need minimum approvals
      const approvedCount = allReviews.filter(r => 
        ['APPROVED', 'APPROVED_WITH_CONTINGENCIES'].includes(r.decision)
      ).length;
      stageComplete = approvedCount >= stage.minimumApprovals;
    }

    // Check for disapprovals
    const hasDisapproval = allReviews.some(r => r.decision === 'DISAPPROVED');
    if (hasDisapproval) {
      stageComplete = true;
      finalDecision = 'DISAPPROVED';
    }

    // Update stage progress if complete
    if (stageComplete) {
      await prisma.proposalStageProgress.update({
        where: { id: stageProgress.id },
        data: {
          status: finalDecision,
          completedAt: new Date(),
          outcome: comments,
          conditions: conditions,
          completedReviewers: allReviews.map(r => r.reviewerId),
        },
      });

      // If approved, move to next stage
      if (['APPROVED', 'APPROVED_WITH_CONTINGENCIES'].includes(finalDecision)) {
        const nextStage = tracking.pipeline.stages.find(s => s.order === stage.order + 1);
        
        if (nextStage) {
          // Start next stage
          const nextProgress = tracking.stageProgress.find(sp => sp.stageId === nextStage.id);
          if (nextProgress) {
            await prisma.proposalStageProgress.update({
              where: { id: nextProgress.id },
              data: {
                status: 'IN_PROGRESS',
                startedAt: new Date(),
              },
            });
          }

          await prisma.proposalReviewTracking.update({
            where: { id: tracking.id },
            data: {
              currentStageOrder: nextStage.order,
              currentStageId: nextStage.id,
            },
          });
        } else {
          // All stages complete
          await prisma.proposalReviewTracking.update({
            where: { id: tracking.id },
            data: {
              overallStatus: 'COMPLETED',
              completedAt: new Date(),
            },
          });

          await prisma.proposal.update({
            where: { id: proposalId },
            data: { status: 'APPROVED' },
          });
          const approvedProposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
          await notifyProposalOwner(prisma, approvedProposal, {
            templateKey: 'PROPOSAL_APPROVED',
            statusLabel: 'Approved',
            details: comments || 'All review stages are complete.',
          }).catch((err) => console.error('Failed to notify researcher of approval:', err));
        }
      } else if (finalDecision === 'DISAPPROVED') {
        // Proposal rejected
        await prisma.proposalReviewTracking.update({
          where: { id: tracking.id },
          data: {
            overallStatus: 'REJECTED',
            completedAt: new Date(),
          },
        });

        await prisma.proposal.update({
          where: { id: proposalId },
          data: { status: 'REJECTED' },
        });
        const rejectedProposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
        await notifyProposalOwner(prisma, rejectedProposal, {
          templateKey: 'PROPOSAL_REJECTED',
          statusLabel: 'Not approved',
          details: comments || conditions || 'The current review stage was not approved.',
        }).catch((err) => console.error('Failed to notify researcher of rejection:', err));
      }
    }

    return NextResponse.json({
      review,
      stageComplete,
      message: stageComplete 
        ? `Stage ${finalDecision.toLowerCase()}. ${finalDecision === 'APPROVED' ? 'Moving to next stage.' : ''}`
        : 'Review recorded. Waiting for additional reviewers.',
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}
