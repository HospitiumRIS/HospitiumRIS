import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../../../lib/auth-server';
import { requireTrainingAdminAccess } from '@/lib/training-admin-server';
import { MODULE_COMPLETION_MODES } from '@/lib/training-completion';
import { refreshTrainingProgress } from '@/lib/training-progress-server';

/**
 * PUT /api/training/[id]/modules/[moduleId]
 * Update a module (Admin only)
 */
export async function PUT(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);

    const { id, moduleId } = await params;
    const body = await request.json();

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

    const access = await requireTrainingAdminAccess(user, module.training);
    if (access.error) return access.error;

    const { title, description, order, status } = body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (order !== undefined) updateData.order = order;
    if (status !== undefined) {
      if (!['ACTIVE', 'INACTIVE'].includes(status)) {
        return NextResponse.json({ error: 'status must be ACTIVE or INACTIVE' }, { status: 400 });
      }
      updateData.status = status;
    }
    if (body.completionMode !== undefined) {
      if (!MODULE_COMPLETION_MODES.includes(body.completionMode)) {
        return NextResponse.json({ error: `completionMode must be one of ${MODULE_COMPLETION_MODES.join(', ')}` }, { status: 400 });
      }
      updateData.completionMode = body.completionMode;
    }
    if (body.isRequired !== undefined) updateData.isRequired = body.isRequired === true;

    const updatedModule = await prisma.trainingModule.update({
      where: { id: moduleId },
      data: updateData,
    });

    // How modules complete affects every participant's checklist (#96).
    if (['completionMode', 'isRequired', 'status'].some((k) => updateData[k] !== undefined)) {
      await refreshTrainingProgress(module.trainingId, null, { actorId: user.id });
    }

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

    const { moduleId } = await params;

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

    const access = await requireTrainingAdminAccess(user, module.training);
    if (access.error) return access.error;

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
