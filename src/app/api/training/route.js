import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getAuthenticatedUser } from '../../../lib/auth-server';

/**
 * GET /api/training
 * List all published trainings (institution filtering temporarily disabled)
 */
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const includeAll = searchParams.get('includeAll') === 'true'; // For admin to see all statuses

    // TODO(institution-filtering): Institution scoping is temporarily disabled
    // so researchers see all trainings regardless of institution. Re-enable by
    // restoring the institutionId filter here once institution assignment is
    // reliable — keep this in sync with /api/training/[id], /api/training/my,
    // and /api/training/[id]/register.
    const where = {};

    // If not admin or includeAll not set, only show published trainings
    const isTrainingAdmin = ['RESEARCH_ADMIN', 'INSTITUTION_ADMIN'].includes(user.accountType);
    if (!includeAll || !isTrainingAdmin) {
      where.status = 'PUBLISHED';
    } else if (status) {
      where.status = status;
    }

    const trainings = await prisma.training.findMany({
      where,
      include: {
        modules: {
          where: { status: 'ACTIVE' },
          orderBy: { order: 'asc' },
        },
        registrations: {
          select: {
            id: true,
            userId: true,
            status: true,
          },
        },
        _count: {
          select: {
            registrations: true,
            modules: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    // Transform data to include computed fields
    const transformedTrainings = trainings.map(training => {
      const activeRegistrations = training.registrations.filter(
        r => r.status === 'REGISTERED' || r.status === 'COMPLETED'
      ).length;

      const remainingSlots = training.maxParticipants - activeRegistrations;
      const userRegistration = training.registrations.find(r => r.userId === user.id);

      return {
        id: training.id,
        title: training.title,
        description: training.description,
        department: training.department,
        targetGroup: training.targetGroup,
        location: training.location,
        startDate: training.startDate,
        endDate: training.endDate,
        maxParticipants: training.maxParticipants,
        status: training.status,
        institutionId: training.institutionId,
        createdBy: training.createdBy,
        createdAt: training.createdAt,
        updatedAt: training.updatedAt,
        moduleCount: training._count.modules,
        registrationCount: activeRegistrations,
        remainingSlots,
        isRegistered: !!userRegistration,
        userRegistrationStatus: userRegistration?.status || null,
        modules: training.modules,
      };
    });

    return NextResponse.json({
      success: true,
      count: transformedTrainings.length,
      trainings: transformedTrainings,
    });
  } catch (error) {
    console.error('Error fetching trainings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/training
 * Create a new training (Admin only)
 */
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user || !['RESEARCH_ADMIN', 'INSTITUTION_ADMIN'].includes(user.accountType)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      department,
      targetGroup,
      location,
      startDate,
      endDate,
      maxParticipants,
      status = 'DRAFT',
    } = body;

    // Validation
    if (!title || !department || !targetGroup || !startDate || !endDate || !maxParticipants) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Ensure targetGroup is an array
    const targetGroupArray = Array.isArray(targetGroup) ? targetGroup : targetGroup.split(',').map(g => g.trim());

    const ownInstitution = await prisma.institution.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!ownInstitution) {
      return NextResponse.json(
        { error: 'No institution found for this admin account' },
        { status: 400 }
      );
    }

    // Create training
    const training = await prisma.training.create({
      data: {
        title,
        description,
        department,
        targetGroup: targetGroupArray,
        location,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        maxParticipants: parseInt(maxParticipants),
        status,
        institutionId: ownInstitution.id,
        createdBy: user.id,
      },
      include: {
        modules: true,
        _count: {
          select: {
            registrations: true,
            modules: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      training,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating training:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
