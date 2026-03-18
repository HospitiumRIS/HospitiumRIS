import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../../lib/auth-server';

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

    if (training.institutionId !== user.primaryInstitution) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
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

    return NextResponse.json({
      success: true,
      modules,
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

    if (!user || user.accountType !== 'RESEARCH_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Check training exists and belongs to user's institution
    const training = await prisma.training.findUnique({
      where: { id },
    });

    if (!training) {
      return NextResponse.json(
        { error: 'Training not found' },
        { status: 404 }
      );
    }

    if (training.institutionId !== user.primaryInstitution) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

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
      },
    });

    // Create progress entries for all existing registrations
    const registrations = await prisma.trainingRegistration.findMany({
      where: {
        trainingId: id,
        status: {
          in: ['REGISTERED', 'COMPLETED'],
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
