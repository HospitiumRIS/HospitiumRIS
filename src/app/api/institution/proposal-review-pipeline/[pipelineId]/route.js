import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireInstitutionPipeline } from '@/lib/institution-scope';

export async function GET(request, { params }) {
  try {
    const { pipelineId } = await params;
    const access = await requireInstitutionPipeline(pipelineId);
    if (access.error) return access.error;

    const pipeline = await prisma.proposalReviewPipeline.findUnique({
      where: { id: pipelineId },
      include: {
        stages: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return NextResponse.json({ pipeline });
  } catch (error) {
    console.error('Error fetching pipeline:', error);
    return NextResponse.json({ error: 'Failed to fetch pipeline' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { pipelineId } = await params;
    const access = await requireInstitutionPipeline(pipelineId);
    if (access.error) return access.error;

    const { institution } = access;
    const body = await request.json();
    const { name, description, isActive, isDefault } = body;

    if (!name) {
      return NextResponse.json({ error: 'Pipeline name is required' }, { status: 400 });
    }

    if (isDefault) {
      await prisma.proposalReviewPipeline.updateMany({
        where: {
          institutionId: institution.id,
          isDefault: true,
          id: { not: pipelineId },
        },
        data: { isDefault: false },
      });
    }

    const pipeline = await prisma.proposalReviewPipeline.update({
      where: { id: pipelineId },
      data: {
        name,
        description,
        isActive,
        isDefault,
      },
      include: {
        stages: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return NextResponse.json({ pipeline });
  } catch (error) {
    console.error('Error updating pipeline:', error);
    return NextResponse.json({ error: 'Failed to update pipeline' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { pipelineId } = await params;
    const access = await requireInstitutionPipeline(pipelineId);
    if (access.error) return access.error;

    const trackingCount = await prisma.proposalReviewTracking.count({
      where: { pipelineId },
    });

    if (trackingCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete pipeline that is being used by proposals' },
        { status: 400 }
      );
    }

    await prisma.proposalReviewPipeline.delete({
      where: { id: pipelineId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pipeline:', error);
    return NextResponse.json({ error: 'Failed to delete pipeline' }, { status: 500 });
  }
}
