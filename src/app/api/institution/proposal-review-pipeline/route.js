import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    // Check if the table exists by attempting to query it
    const pipelines = await prisma.proposalReviewPipeline.findMany({
      include: {
        stages: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ pipelines });
  } catch (error) {
    console.error('Error fetching pipelines:', error);
    
    // Check if error is due to missing table
    if (error.message?.includes('does not exist') || error.code === 'P2021') {
      return NextResponse.json(
        { 
          error: 'Database migration required. Please run: npx prisma migrate dev --name add_proposal_review_pipeline',
          pipelines: [],
          migrationNeeded: true
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch pipelines', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, description, isActive, isDefault } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Pipeline name is required' },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.proposalReviewPipeline.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const pipeline = await prisma.proposalReviewPipeline.create({
      data: {
        institutionId: 'default', // TODO: Get from session
        name,
        description,
        isActive: isActive ?? true,
        isDefault: isDefault ?? false,
      },
      include: {
        stages: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return NextResponse.json({ pipeline }, { status: 201 });
  } catch (error) {
    console.error('Error creating pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to create pipeline' },
      { status: 500 }
    );
  }
}
