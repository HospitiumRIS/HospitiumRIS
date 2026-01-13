import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { logApiActivity, getRequestMetadata } from '../../../../../utils/activityLogger.js';

const prisma = new PrismaClient();

export async function POST(request, { params }) {
    const requestMetadata = getRequestMetadata(request);
    
    try {
        const resolvedParams = await params;
        const { id } = resolvedParams;
        const body = await request.json();
        
        await logApiActivity('POST', `/api/proposals/${id}/review`, 200, requestMetadata);
        
        if (!id) {
            return NextResponse.json(
                { error: 'Proposal ID is required' },
                { status: 400 }
            );
        }

        const {
            decision,
            overallComments,
            rejectionReason,
            revisionRequirements,
            sectionReviews,
            recommendation,
            reviewer,
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

        // Determine new status based on decision
        const statusMap = {
            'approved': 'APPROVED',
            'rejected': 'REJECTED',
            'requires_revision': 'REVISION_REQUESTED'
        };
        const newStatus = statusMap[decision] || 'UNDER_REVIEW';

        // Create the review record
        const review = await prisma.proposalReview.create({
            data: {
                proposalId: id,
                reviewerId: requestMetadata.userId || 'system',
                reviewerName: reviewer || 'Research Administrator',
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
            { 
                error: 'Failed to submit review',
                details: error.message 
            },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

// GET endpoint to retrieve reviews for a proposal
export async function GET(request, { params }) {
    try {
        const resolvedParams = await params;
        const { id } = resolvedParams;
        
        if (!id) {
            return NextResponse.json(
                { error: 'Proposal ID is required' },
                { status: 400 }
            );
        }

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
    } finally {
        await prisma.$disconnect();
    }
}
