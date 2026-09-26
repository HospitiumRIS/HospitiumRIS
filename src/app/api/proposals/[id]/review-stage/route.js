import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { notifyProposalOwner } from '../../../../../lib/proposal-review-comms.js';

const prisma = new PrismaClient();

export async function POST(request, { params }) {
  try {
    const { id: proposalId } = await params;
    const body = await request.json();
    const {
      stageId,
      decision,
      comments,
      conditions,
      reviewerId,
      reviewerName,
      reviewerEmail,
      reviewerRole,
    } = body;

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

    // Create review record
    const review = await prisma.proposalStageReview.create({
      data: {
        stageProgressId: stageProgress.id,
        stageId,
        reviewerId: reviewerId || 'unknown',
        reviewerName: reviewerName || 'Unknown Reviewer',
        reviewerEmail: reviewerEmail || '',
        reviewerRole,
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
