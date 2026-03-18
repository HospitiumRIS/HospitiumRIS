import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../../../lib/auth-server';

/**
 * PUT /api/training/[id]/modules/[moduleId]
 * Update a module (Admin only)
 */
export async function PUT(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user || user.accountType !== 'RESEARCH_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { id, moduleId } = params;
    const body = await request.json();

    // Check module exists and belongs to user's institution
    const module = await prisma.trainingModule.findUnique({
      where: { id: moduleId },
      include: {
        training: true,
      },
    });

    if (!module) {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404 }
      );
    }

    if (module.training.institutionId !== user.primaryInstitution) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const { title, description, order, status } = body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (order !== undefined) updateData.order = order;
    if (status !== undefined) updateData.status = status;

    const updatedModule = await prisma.trainingModule.update({
      where: { id: moduleId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      module: updatedModule,
    });
  } catch (error) {
    console.error('Error updating module:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/training/[id]/modules/[moduleId]
 * Delete a module (Admin only)
 */
export async function DELETE(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user || user.accountType !== 'RESEARCH_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { moduleId } = await params;

    // Check module exists and belongs to user's institution
    const module = await prisma.trainingModule.findUnique({
      where: { id: moduleId },
      include: {
        training: true,
      },
    });

    if (!module) {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404 }
      );
    }

    if (module.training.institutionId !== user.primaryInstitution) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Delete module (cascade will delete progress entries)
    await prisma.trainingModule.delete({
      where: { id: moduleId },
    });

    return NextResponse.json({
      success: true,
      message: 'Module deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting module:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
