import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const tracking = await prisma.proposalReviewTracking.findUnique({
      where: { proposalId: id },
      include: {
        pipeline: {
          include: {
            stages: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
        stageProgress: {
          include: {
            stage: true,
            reviews: {
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
          orderBy: {
            stage: {
              order: 'asc',
            },
          },
        },
      },
    });

    if (!tracking) {
      return NextResponse.json(
        { tracking: null, message: 'Proposal has not been submitted for review yet' },
        { status: 200 }
      );
    }

    return NextResponse.json({ tracking });
  } catch (error) {
    console.error('Error fetching review status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review status' },
      { status: 500 }
    );
  }
}
