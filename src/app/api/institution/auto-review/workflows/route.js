import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const isActive = searchParams.get('isActive');

    const where = {};
    if (type) where.type = type;
    if (isActive !== null) where.isActive = isActive === 'true';

    const workflows = await prisma.autoReviewWorkflow.findMany({
      where,
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
        _count: {
          select: {
            executions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      workflows
    });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      type,
      isActive = true,
      isDefault = false,
      autoRouteOnPass = false,
      requireHumanReview = true,
      createdBy
    } = body;

    if (!name || !type) {
      return NextResponse.json(
        { success: false, error: 'Name and type are required' },
        { status: 400 }
      );
    }

    if (isDefault) {
      await prisma.autoReviewWorkflow.updateMany({
        where: { type, isDefault: true },
        data: { isDefault: false }
      });
    }

    const workflow = await prisma.autoReviewWorkflow.create({
      data: {
        name,
        description,
        type,
        isActive,
        isDefault,
        autoRouteOnPass,
        requireHumanReview,
        createdBy
      },
      include: {
        stages: true
      }
    });

    return NextResponse.json({
      success: true,
      workflow
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating workflow:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create workflow' },
      { status: 500 }
    );
  }
}
