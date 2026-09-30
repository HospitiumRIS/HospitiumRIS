import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireInstitutionPipeline } from '@/lib/institution-scope';

export async function POST(request, { params }) {
  try {
    const { pipelineId, stageId } = await params;
    const access = await requireInstitutionPipeline(pipelineId);
    if (access.error) return access.error;

    const body = await request.json();
    const { direction } = body;

    if (!['up', 'down'].includes(direction)) {
      return NextResponse.json(
        { error: 'Invalid direction. Must be "up" or "down"' },
        { status: 400 }
      );
    }

    const currentStage = await prisma.proposalReviewStage.findFirst({
      where: { id: stageId, pipelineId },
    });

    if (!currentStage) {
      return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
    }

    const targetOrder = direction === 'up' ? currentStage.order - 1 : currentStage.order + 1;

    const targetStage = await prisma.proposalReviewStage.findFirst({
      where: {
        pipelineId,
        order: targetOrder,
      },
    });

    if (!targetStage) {
      return NextResponse.json(
        { error: 'Cannot move stage in that direction' },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.proposalReviewStage.update({
        where: { id: currentStage.id },
        data: { order: targetOrder },
      }),
      prisma.proposalReviewStage.update({
        where: { id: targetStage.id },
        data: { order: currentStage.order },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error moving stage:', error);
    return NextResponse.json({ error: 'Failed to move stage' }, { status: 500 });
  }
}
