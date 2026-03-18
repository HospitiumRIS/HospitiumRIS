import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../../lib/auth-server';

/**
 * POST /api/training/[id]/register
 * Register a researcher for a training
 */
export async function POST(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get training details
    const training = await prisma.training.findUnique({
      where: { id },
      include: {
        registrations: {
          where: {
            status: {
              in: ['REGISTERED', 'COMPLETED'],
            },
          },
        },
        modules: {
          where: { status: 'ACTIVE' },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!training) {
      return NextResponse.json(
        { error: 'Training not found' },
        { status: 404 }
      );
    }

    // Check institution match
    if (training.institutionId !== user.primaryInstitution) {
      return NextResponse.json(
        { error: 'Access denied - Training belongs to different institution' },
        { status: 403 }
      );
    }

    // Check if training is published
    if (training.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Training is not available for registration' },
        { status: 400 }
      );
    }

    // Check if already registered
    const existingRegistration = await prisma.trainingRegistration.findUnique({
      where: {
        trainingId_userId: {
          trainingId: id,
          userId: user.id,
        },
      },
    });

    if (existingRegistration && existingRegistration.status !== 'CANCELLED') {
      return NextResponse.json(
        { error: 'Already registered for this training' },
        { status: 400 }
      );
    }

    // Check if training is full
    const activeRegistrations = training.registrations.length;
    if (activeRegistrations >= training.maxParticipants) {
      return NextResponse.json(
        { error: 'Training is full' },
        { status: 400 }
      );
    }

    // Create or update registration
    let registration;
    if (existingRegistration) {
      // Reactivate cancelled registration
      registration = await prisma.trainingRegistration.update({
        where: { id: existingRegistration.id },
        data: {
          status: 'REGISTERED',
          registeredAt: new Date(),
        },
      });
    } else {
      // Create new registration
      registration = await prisma.trainingRegistration.create({
        data: {
          trainingId: id,
          userId: user.id,
          status: 'REGISTERED',
        },
      });
    }

    // Create module progress entries for all active modules
    if (training.modules.length > 0) {
      const moduleProgressData = training.modules.map(module => ({
        registrationId: registration.id,
        moduleId: module.id,
        status: 'PENDING',
      }));

      await prisma.trainingModuleProgress.createMany({
        data: moduleProgressData,
        skipDuplicates: true,
      });
    }

    // Fetch complete registration with progress
    const completeRegistration = await prisma.trainingRegistration.findUnique({
      where: { id: registration.id },
      include: {
        training: true,
        moduleProgress: {
          include: {
            module: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully registered for training',
      registration: completeRegistration,
    }, { status: 201 });
  } catch (error) {
    console.error('Error registering for training:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/training/[id]/register
 * Cancel registration for a training
 */
export async function DELETE(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Find registration
    const registration = await prisma.trainingRegistration.findUnique({
      where: {
        trainingId_userId: {
          trainingId: id,
          userId: user.id,
        },
      },
      include: {
        training: true,
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    // Check if training has already started or completed
    const now = new Date();
    if (new Date(registration.training.startDate) < now) {
      return NextResponse.json(
        { error: 'Cannot cancel registration - training has already started' },
        { status: 400 }
      );
    }

    // Update registration status to cancelled
    await prisma.trainingRegistration.update({
      where: { id: registration.id },
      data: {
        status: 'CANCELLED',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Registration cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling registration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
