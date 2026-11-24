import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { autoReviewAccess } from '@/lib/auto-review-access';

/** GET: the institution's auto-review workflows (#9). */
export async function GET(request) {
  try {
    const ctx = await autoReviewAccess();
    if (ctx.error) return ctx.error;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const isActive = searchParams.get('isActive');

    const where = { ...ctx.workflowWhere };
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

/** POST: create a workflow for the caller's institution; creator from the session (#9). */
export async function POST(request) {
  try {
    const ctx = await autoReviewAccess();
    if (ctx.error) return ctx.error;
    const body = await request.json().catch(() => ({}));
    const {
      name,
      description,
      type,
      isActive = true,
      isDefault = false,
      autoRouteOnPass = false,
      requireHumanReview = true
    } = body;

    if (!name || !type) {
      return NextResponse.json(
        { success: false, error: 'Name and type are required' },
        { status: 400 }
      );
    }

    if (isDefault) {
      await prisma.autoReviewWorkflow.updateMany({
        where: { ...ctx.workflowWhere, type, isDefault: true },
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
        createdBy: ctx.user.id,
        institutionId: ctx.institution.id
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
