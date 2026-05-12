import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request, { params }) {
  try {
    const { id: workflowId } = await params;
    const body = await request.json();
    const {
      name,
      description,
      order,
      isRequired = true,
      allowSkip = false,
      autoApproveOnPass = false,
      daysToComplete,
      requiresAllReviewers = false,
      minimumApprovals = 1
    } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Stage name is required' },
        { status: 400 }
      );
    }

    let stageOrder = order;
    if (!stageOrder) {
      const maxOrder = await prisma.autoReviewStage.findFirst({
        where: { workflowId },
        orderBy: { order: 'desc' },
        select: { order: true }
      });
      stageOrder = (maxOrder?.order || 0) + 1;
    }

    const stage = await prisma.autoReviewStage.create({
      data: {
        workflowId,
        name,
        description,
        order: stageOrder,
        isRequired,
        allowSkip,
        autoApproveOnPass,
        daysToComplete: daysToComplete ? parseInt(daysToComplete) : null,
        requiresAllReviewers,
        minimumApprovals
      },
      include: {
        parameters: true,
        reviewers: {
          include: {
            role: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      stage
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating stage:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create stage' },
      { status: 500 }
    );
  }
}
