import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const workflow = await prisma.autoReviewWorkflow.findUnique({
      where: { id },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: {
            parameters: true,
            reviewers: {
              include: {
                role: true
              }
            }
          }
        },
        executions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            stageExecutions: {
              include: {
                stage: true,
                validationResults: true
              }
            }
          }
        }
      }
    });

    if (!workflow) {
      return NextResponse.json(
        { success: false, error: 'Workflow not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      workflow
    });
  } catch (error) {
    console.error('Error fetching workflow:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workflow' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      description,
      isActive,
      isDefault,
      autoRouteOnPass,
      requireHumanReview
    } = body;

    if (isDefault) {
      const workflow = await prisma.autoReviewWorkflow.findUnique({
        where: { id },
        select: { type: true }
      });

      if (workflow) {
        await prisma.autoReviewWorkflow.updateMany({
          where: { type: workflow.type, isDefault: true, id: { not: id } },
          data: { isDefault: false }
        });
      }
    }

    const updatedWorkflow = await prisma.autoReviewWorkflow.update({
      where: { id },
      data: {
        name,
        description,
        isActive,
        isDefault,
        autoRouteOnPass,
        requireHumanReview
      },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: {
            parameters: true,
            reviewers: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      workflow: updatedWorkflow
    });
  } catch (error) {
    console.error('Error updating workflow:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update workflow' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const executionCount = await prisma.workflowExecution.count({
      where: { workflowId: id }
    });

    if (executionCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete workflow with existing executions. Deactivate it instead.' 
        },
        { status: 400 }
      );
    }

    await prisma.autoReviewWorkflow.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Workflow deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete workflow' },
      { status: 500 }
    );
  }
}
