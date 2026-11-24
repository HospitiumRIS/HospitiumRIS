import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { forbidden, proposalReviewContext } from '@/lib/review-access-server';
import { reviewerIdentity } from '@/lib/review-access';
import { logApiActivity, getRequestMetadata } from '../../../../../utils/activityLogger.js';
import { notifyProposalOwner } from '../../../../../lib/proposal-review-comms.js';
import { syncReviewPipelineWithDecision } from '../../../../../lib/proposal-review-pipeline.js';

/**
 * POST /api/proposals/[id]/review: the institution's decision (approve, reject, ask for
 * revision). Research office of the proposal's institution only (#6); the reviewer is the
 * signed-in user, never a name from the request body.
 */
export async function POST(request, { params }) {
    const requestMetadata = getRequestMetadata(request);
    
    try {
        const resolvedParams = await params;
        const { id } = resolvedParams;
        const ctx = await proposalReviewContext(request, id);
        if (ctx.error) return ctx.error;
        if (!ctx.perms.decide) {
            return forbidden('Only the research office of this proposal\'s institution can record a decision, and not on its own proposal');
        }
        const body = await request.json().catch(() => ({}));

        const {
            decision,
            overallComments,
            rejectionReason,
            revisionRequirements,
            sectionReviews,
            recommendation,
            reviewDate,
            complianceScore
        } = body;

        // Validate required fields
        if (!decision || !overallComments) {
            return NextResponse.json(
                { error: 'Decision and overall comments are required' },
                { status: 400 }
            );
        }

        // Validate conditional requirements
        if (decision === 'rejected' && !rejectionReason) {
            return NextResponse.json(
                { error: 'Rejection reason is required when rejecting a proposal' },
                { status: 400 }
            );
        }

        if (decision === 'requires_revision' && !revisionRequirements) {
            return NextResponse.json(
                { error: 'Revision requirements are required when requesting revisions' },
                { status: 400 }
            );
        }

        // Check if proposal exists
        const proposal = await prisma.proposal.findUnique({
            where: { id }
        });

        if (!proposal) {
            return NextResponse.json(
                { error: 'Proposal not found' },
                { status: 404 }
            );
        }

        if (!['approved', 'rejected', 'requires_revision'].includes(decision)) {
            return NextResponse.json({ error: 'Decision must be approved, rejected or requires_revision' }, { status: 400 });
        }

        // Determine new status based on decision
        const statusMap = {
            'approved': 'APPROVED',
            'rejected': 'REJECTED',
            'requires_revision': 'REVISION_REQUESTED'
        };
        const newStatus = statusMap[decision];
        const identity = reviewerIdentity(ctx.user);

        // Create the review record
        const review = await prisma.proposalReview.create({
            data: {
                proposalId: id,
                reviewerId: identity.reviewerId,
                reviewerName: identity.reviewerName,
                decision: decision.toUpperCase(),
                overallComments,
                rejectionReason: rejectionReason || null,
                revisionRequirements: revisionRequirements || null,
                recommendation: recommendation || null,
                sectionReviews: sectionReviews || {},
                complianceScore: complianceScore || {},
                reviewDate: reviewDate ? new Date(reviewDate) : new Date(),
                status: 'COMPLETED'
            }
        });

        // Update proposal status
        const updatedProposal = await prisma.proposal.update({
            where: { id },
            data: {
                status: newStatus,
                updatedAt: new Date()
            }
        });

        // Keep the stage-by-stage pipeline in step with the final decision
        try {
            await syncReviewPipelineWithDecision(prisma, id, decision, {
                comments: overallComments,
                reason: decision === 'rejected' ? rejectionReason : revisionRequirements,
            });
        } catch (pipelineError) {
            console.error('Failed to sync review pipeline with decision:', pipelineError);
        }

        const templateByStatus = {
            APPROVED: 'PROPOSAL_APPROVED',
            REJECTED: 'PROPOSAL_REJECTED',
            REVISION_REQUESTED: 'PROPOSAL_REVISION_REQUESTED',
        };
        const detailsByStatus = {
            APPROVED: recommendation || overallComments,
            REJECTED: rejectionReason || overallComments,
            REVISION_REQUESTED: revisionRequirements || overallComments,
        };
        try {
            await notifyProposalOwner(prisma, updatedProposal, {
                templateKey: templateByStatus[newStatus] || 'PROPOSAL_STATUS_CHANGED',
                statusLabel: newStatus.replaceAll('_', ' ').toLowerCase(),
                details: detailsByStatus[newStatus] || overallComments,
            });
        } catch (notifyError) {
            console.error('Failed to notify researcher of review decision:', notifyError);
        }

        // Log the activity
        await logApiActivity(
            'POST',
            `/api/proposals/${id}/review`,
            200,
            {
                ...requestMetadata,
                action: 'proposal_reviewed',
                decision: decision,
                proposalId: id
            }
        );

        return NextResponse.json({
            success: true,
            review,
            proposal: updatedProposal,
            message: `Proposal ${decision === 'approved' ? 'approved' : decision === 'rejected' ? 'rejected' : 'marked for revision'} successfully`
        });

    } catch (error) {
        console.error('Error submitting review:', error);
        
        await logApiActivity(
            'POST',
            `/api/proposals/${params?.id}/review`,
            500,
            {
                ...requestMetadata,
                error: error.message
            }
        );

        return NextResponse.json(
            { error: 'Failed to submit review' },
            { status: 500 }
        );
    }
}

/** GET: decisions recorded on a proposal. The research office, assigned reviewers and the people on the proposal. */
export async function GET(request, { params }) {
    try {
        const resolvedParams = await params;
        const { id } = resolvedParams;
        const ctx = await proposalReviewContext(request, id);
        if (ctx.error) return ctx.error;
        if (!ctx.perms.read) return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });

        const reviews = await prisma.proposalReview.findMany({
            where: { proposalId: id },
            orderBy: { reviewDate: 'desc' }
        });

        return NextResponse.json({
            success: true,
            reviews
        });

    } catch (error) {
        console.error('Error fetching reviews:', error);
        return NextResponse.json(
            { error: 'Failed to fetch reviews' },
            { status: 500 }
        );
    }
}
