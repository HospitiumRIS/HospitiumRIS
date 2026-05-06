import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request, { params }) {
  try {
    const { pipelineId } = params;
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

    // Get the next order number
    const lastStage = await prisma.proposalReviewStage.findFirst({
      where: { pipelineId },
      orderBy: { order: 'desc' },
    });

    const nextOrder = lastStage ? lastStage.order + 1 : 1;

    const stage = await prisma.proposalReviewStage.create({
      data: {
        pipelineId,
        name,
        description,
        stageType,
        order: nextOrder,
        isRequired: isRequired ?? true,
        autoApprove: autoApprove ?? false,
        daysToComplete: daysToComplete ? parseInt(daysToComplete) : null,
        reviewerRoles: reviewerRoles || [],
        reviewerEmails: reviewerEmails || [],
        requiresAllReviewers: requiresAllReviewers ?? false,
        minimumApprovals: minimumApprovals || 1,
      },
    });

    return NextResponse.json({ stage }, { status: 201 });
  } catch (error) {
    console.error('Error creating stage:', error);
    return NextResponse.json(
      { error: 'Failed to create stage' },
      { status: 500 }
    );
  }
}
