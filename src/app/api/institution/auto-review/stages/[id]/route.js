import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      description,
      order,
      isRequired,
      allowSkip,
      autoApproveOnPass,
      daysToComplete,
      requiresAllReviewers,
      minimumApprovals
    } = body;

    const updatedStage = await prisma.autoReviewStage.update({
      where: { id },
      data: {
        name,
        description,
        order,
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
      stage: updatedStage
    });
  } catch (error) {
    console.error('Error updating stage:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update stage' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const executionCount = await prisma.stageExecution.count({
      where: { stageId: id }
    });

    if (executionCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete stage with existing executions' 
        },
        { status: 400 }
      );
    }

    await prisma.autoReviewStage.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Stage deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting stage:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete stage' },
      { status: 500 }
    );
  }
}
