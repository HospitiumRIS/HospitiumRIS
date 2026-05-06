import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(request, { params }) {
  try {
    const { pipelineId, stageId } = params;
    const body = await request.json();
    const {
      name,
      description,
      stageType,
      isRequired,
      autoApprove,
      daysToComplete,
      reviewerRoles,
      reviewerEmails,
      requiresAllReviewers,
      minimumApprovals,
    } = body;

    if (!name || !stageType) {
      return NextResponse.json(
        { error: 'Stage name and type are required' },
        { status: 400 }
      );
    }

    const stage = await prisma.proposalReviewStage.update({
      where: { id: stageId },
      data: {
        name,
        description,
        stageType,
        isRequired,
        autoApprove,
        daysToComplete: daysToComplete ? parseInt(daysToComplete) : null,
        reviewerRoles: reviewerRoles || [],
        reviewerEmails: reviewerEmails || [],
        requiresAllReviewers,
        minimumApprovals,
      },
    });

    return NextResponse.json({ stage });
  } catch (error) {
    console.error('Error updating stage:', error);
    return NextResponse.json(
      { error: 'Failed to update stage' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { pipelineId, stageId } = params;

    // Get the stage to delete
    const stageToDelete = await prisma.proposalReviewStage.findUnique({
      where: { id: stageId },
    });

    if (!stageToDelete) {
      return NextResponse.json(
        { error: 'Stage not found' },
        { status: 404 }
      );
    }

    // Delete the stage
    await prisma.proposalReviewStage.delete({
      where: { id: stageId },
    });

    // Reorder remaining stages
    await prisma.$transaction(async (tx) => {
      const remainingStages = await tx.proposalReviewStage.findMany({
        where: {
          pipelineId,
          order: { gt: stageToDelete.order },
        },
        orderBy: { order: 'asc' },
      });

      for (const stage of remainingStages) {
        await tx.proposalReviewStage.update({
          where: { id: stage.id },
          data: { order: stage.order - 1 },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting stage:', error);
    return NextResponse.json(
      { error: 'Failed to delete stage' },
      { status: 500 }
    );
  }
}
