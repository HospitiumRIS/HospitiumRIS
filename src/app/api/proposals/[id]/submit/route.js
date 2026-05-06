import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request, { params }) {
  try {
    const { id } = params;

    // Check if proposal exists
    const proposal = await prisma.proposal.findUnique({
      where: { id },
    });

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    if (proposal.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only draft proposals can be submitted' },
        { status: 400 }
      );
    }

    // Get the default pipeline
    const defaultPipeline = await prisma.proposalReviewPipeline.findFirst({
      where: {
        isDefault: true,
        isActive: true,
      },
      include: {
        stages: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!defaultPipeline) {
      return NextResponse.json(
        { error: 'No default review pipeline configured. Please contact administration.' },
        { status: 400 }
      );
    }

    // Update proposal status and create tracking
    const updatedProposal = await prisma.$transaction(async (tx) => {
      // Update proposal status
      const updated = await tx.proposal.update({
        where: { id },
        data: { status: 'SUBMITTED' },
      });

      // Create review tracking
      const tracking = await tx.proposalReviewTracking.create({
        data: {
          proposalId: id,
          pipelineId: defaultPipeline.id,
          currentStageOrder: 1,
          overallStatus: 'IN_PROGRESS',
          startedAt: new Date(),
        },
      });

      // Create stage progress for all stages
      for (const stage of defaultPipeline.stages) {
        await tx.proposalStageProgress.create({
          data: {
            trackingId: tracking.id,
            stageId: stage.id,
            status: stage.order === 1 ? 'IN_PROGRESS' : 'NOT_STARTED',
            startedAt: stage.order === 1 ? new Date() : null,
            assignedReviewers: stage.reviewerEmails || [],
          },
        });
      }

      return updated;
    });

    // TODO: Send notifications to reviewers of first stage

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
