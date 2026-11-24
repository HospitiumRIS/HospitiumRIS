import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { forbidden, proposalReviewContext } from '@/lib/review-access-server';
import { ensureProposalInReviewPipeline } from '../../../../../lib/proposal-review-pipeline.js';

/** POST: submit a proposal for review. Only the people on the proposal (#6). */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const ctx = await proposalReviewContext(request, id);
    if (ctx.error) return ctx.error;
    if (!ctx.perms.submit) return forbidden('Only the people on this proposal can submit it');

    const proposal = await prisma.proposal.findUnique({
      where: { id },
    });

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    const existingTracking = await prisma.proposalReviewTracking.findUnique({
      where: { proposalId: id },
    });

    if (!['DRAFT', 'REVISION_REQUESTED', 'SUBMITTED', 'UNDER_REVIEW'].includes(proposal.status) && existingTracking) {
      return NextResponse.json(
        { error: 'This proposal cannot be submitted for review' },
        { status: 400 }
      );
    }

    await ensureProposalInReviewPipeline(prisma, id, { status: 'UNDER_REVIEW' });

    const updatedProposal = await prisma.proposal.findUnique({
      where: { id },
    });

    return NextResponse.json({
      proposal: updatedProposal,
      message: 'Proposal submitted successfully and entered review pipeline',
    });
  } catch (error) {
    console.error('Error submitting proposal:', error);
    return NextResponse.json(
      { error: 'Failed to submit proposal' },
      { status: 500 }
    );
  }
}
