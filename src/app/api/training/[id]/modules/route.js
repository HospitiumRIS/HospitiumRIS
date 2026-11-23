import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../../lib/auth-server';
import {
  requireTrainingAdminAccess,
  resolveTrainingViewer,
} from '@/lib/training-admin-server';
import { ACTIVE_REGISTRATION_STATUSES, canSeeMaterial } from '@/lib/training-scope';
import { MODULE_COMPLETION_MODES } from '@/lib/training-completion';

/**
 * GET /api/training/[id]/modules
 * Get all modules for a training
 */
export async function GET(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check training exists and user has access
    const training = await prisma.training.findUnique({
      where: { id },
    });

    if (!training) {
      return NextResponse.json(
        { error: 'Training not found' },
        { status: 404 }
      );
    }

    // Same visibility as the training itself (#88), including shared-catalogue
    // trainings and the caller's own registrations.
    const viewer = await resolveTrainingViewer(user, training);
    if (!viewer.canView) {
      return NextResponse.json(
        { error: 'Training not found' },
        { status: 404 }
      );
    }

    const modules = await prisma.trainingModule.findMany({
      where: {
        trainingId: id,
        status: 'ACTIVE',
      },
      orderBy: { order: 'asc' },
      include: {
        materials: true,
        _count: {
          select: {
            progress: true,
          },
        },
      },
    });

    // Registered-only materials are hidden unless the caller administers the
    // training or holds an active registration (#89).
    const visibleModules = modules.map((module) => ({
      ...module,
      materials: module.materials.filter((material) => canSeeMaterial(material, viewer)),
    }));

    return NextResponse.json({
      success: true,
      modules: visibleModules,
    });
  } catch (error) {
    console.error('Error fetching modules:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/training/[id]/modules
 * Create a new module (Admin only)
 */
export async function POST(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);

    const { id } = await params;
    const body = await request.json();

    const training = await prisma.training.findUnique({
      where: { id },
    });

    if (!training) {
      return NextResponse.json(
        { error: 'Training not found' },
        { status: 404 }
      );
    }

    const access = await requireTrainingAdminAccess(user, training);
    if (access.error) return access.error;

    const { title, description, order } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Module title is required' },
        { status: 400 }
      );
    }

    // Get next order number if not provided
    let moduleOrder = order;
    if (!moduleOrder) {
      const lastModule = await prisma.trainingModule.findFirst({
        where: { trainingId: id },
        orderBy: { order: 'desc' },
      });
      moduleOrder = lastModule ? lastModule.order + 1 : 1;
    }

    const module = await prisma.trainingModule.create({
      data: {
        trainingId: id,
        title,
        description,
        order: moduleOrder,
        status: 'ACTIVE',
        ...(MODULE_COMPLETION_MODES.includes(body.completionMode) ? { completionMode: body.completionMode } : {}),
        ...(body.isRequired !== undefined ? { isRequired: body.isRequired === true } : {}),
      },
    });

    // Create progress entries for all existing registrations
    const registrations = await prisma.trainingRegistration.findMany({
      where: {
        trainingId: id,
        status: {
          in: ACTIVE_REGISTRATION_STATUSES,
        },
      },
    });

    if (registrations.length > 0) {
      await prisma.trainingModuleProgress.createMany({
        data: registrations.map(reg => ({
          registrationId: reg.id,
          moduleId: module.id,
          status: 'PENDING',
        })),
      });
    }

    return NextResponse.json({
      success: true,
      module,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating module:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
