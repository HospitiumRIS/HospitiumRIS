import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../lib/auth-server';

/**
 * GET /api/training/[id]
 * Get a single training with full details
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

    const training = await prisma.training.findUnique({
      where: { id },
      include: {
        modules: {
          where: { status: 'ACTIVE' },
          orderBy: { order: 'asc' },
        },
        materials: {
          orderBy: { createdAt: 'desc' },
        },
        registrations: {
          include: {
            user: {
              select: {
                id: true,
                givenName: true,
                familyName: true,
                email: true,
                researchProfile: {
                  select: {
                    department: true,
                  },
                },
              },
            },
            moduleProgress: {
              include: {
                module: true,
              },
            },
            certificate: true,
          },
        },
        _count: {
          select: {
            registrations: true,
            modules: true,
            materials: true,
          },
        },
      },
    });

    if (!training) {
      return NextResponse.json(
        { error: 'Training not found' },
        { status: 404 }
      );
    }

    // Check institution access
    if (training.institutionId !== user.primaryInstitution) {
      return NextResponse.json(
        { error: 'Access denied - Training belongs to different institution' },
        { status: 403 }
      );
    }

    // Filter materials based on access level and user registration
    const userRegistration = training.registrations.find(r => r.userId === user.id);
    const filteredMaterials = training.materials.filter(material => {
      if (material.accessLevel === 'PUBLIC') return true;
      if (material.accessLevel === 'REGISTERED_ONLY' && userRegistration) return true;
      if (user.accountType === 'RESEARCH_ADMIN') return true; // Admin sees all
      return false;
    });

    const activeRegistrations = training.registrations.filter(
      r => r.status === 'REGISTERED' || r.status === 'COMPLETED'
    ).length;

    return NextResponse.json({
      success: true,
      training: {
        ...training,
        materials: filteredMaterials,
        registrationCount: activeRegistrations,
        remainingSlots: training.maxParticipants - activeRegistrations,
        isRegistered: !!userRegistration,
        userRegistration,
      },
    });
  } catch (error) {
    console.error('Error fetching training:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/training/[id]
 * Update a training (Admin only)
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

    const { id } = await params;
    const body = await request.json();

    // Check if training exists and belongs to user's institution
    const existingTraining = await prisma.training.findUnique({
      where: { id },
    });

    if (!existingTraining) {
      return NextResponse.json(
        { error: 'Training not found' },
        { status: 404 }
      );
    }

    if (existingTraining.institutionId !== user.primaryInstitution) {
      return NextResponse.json(
        { error: 'Access denied - Training belongs to different institution' },
        { status: 403 }
      );
    }

    const {
      title,
      description,
      department,
      targetGroup,
      location,
      startDate,
      endDate,
      maxParticipants,
      status,
    } = body;

    // Build update data
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (department !== undefined) updateData.department = department;
    if (targetGroup !== undefined) updateData.targetGroup = targetGroup;
    if (location !== undefined) updateData.location = location;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (maxParticipants !== undefined) updateData.maxParticipants = parseInt(maxParticipants);
    if (status !== undefined) updateData.status = status;

    const training = await prisma.training.update({
      where: { id },
      data: updateData,
      include: {
        modules: {
          where: { status: 'ACTIVE' },
          orderBy: { order: 'asc' },
        },
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
    });
  } catch (error) {
    console.error('Error updating training:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/training/[id]
 * Delete a training (Admin only)
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

    const { id } = await params;

    // Check if training exists and belongs to user's institution
    const existingTraining = await prisma.training.findUnique({
      where: { id },
      include: {
        registrations: true,
      },
    });

    if (!existingTraining) {
      return NextResponse.json(
        { error: 'Training not found' },
        { status: 404 }
      );
    }

    if (existingTraining.institutionId !== user.primaryInstitution) {
      return NextResponse.json(
        { error: 'Access denied - Training belongs to different institution' },
        { status: 403 }
      );
    }

    // Check if there are active registrations
    const activeRegistrations = existingTraining.registrations.filter(
      r => r.status === 'REGISTERED' || r.status === 'COMPLETED'
    );

    if (activeRegistrations.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete training with active registrations' },
        { status: 400 }
      );
    }

    await prisma.training.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Training deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting training:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
