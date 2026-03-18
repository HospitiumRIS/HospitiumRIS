import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getAuthenticatedUser } from '../../../lib/auth-server';

/**
 * GET /api/training
 * List all published trainings filtered by user's institution
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

    // Build filter
    const where = {};

    // If not admin or includeAll not set, only show published trainings
    if (!includeAll || user.accountType !== 'RESEARCH_ADMIN') {
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

    if (!user || user.accountType !== 'RESEARCH_ADMIN') {
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
        institutionId: user.primaryInstitution,
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
