import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { notFound, proposalReviewContext } from '@/lib/review-access-server';
import { ensureProposalInReviewPipeline, isProposalInReview, syncReviewPipelineWithDecision } from '../../../../../lib/proposal-review-pipeline.js';

const trackingInclude = {
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
            reviews: {
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
          orderBy: {
            stage: {
              order: 'asc',
            },
          },
        },
};

/** GET: review pipeline progress. The research office, assigned reviewers and the people on the proposal (#6). */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const ctx = await proposalReviewContext(request, id);
    if (ctx.error) return ctx.error;
    if (!ctx.perms.read) return notFound('Proposal not found');

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (proposal && isProposalInReview(proposal.status)) {
      const existing = await prisma.proposalReviewTracking.findUnique({
        where: { proposalId: id },
        select: { id: true },
      });
      if (!existing) {
        try {
          await ensureProposalInReviewPipeline(prisma, id, { status: proposal.status });
        } catch (err) {
          console.error('Failed to assign review pipeline:', err);
        }
      }
    }

    let tracking = await prisma.proposalReviewTracking.findUnique({
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

    if (!tracking) {
      return NextResponse.json(
        { tracking: null, message: 'Proposal has not been submitted for review yet' },
        { status: 200 }
      );
    }

    return NextResponse.json({ tracking });
  } catch (error) {
    console.error('Error fetching review status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review status' },
      { status: 500 }
    );
  }
}
