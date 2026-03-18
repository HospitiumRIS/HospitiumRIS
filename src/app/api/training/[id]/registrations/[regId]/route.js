import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../../../lib/auth-server';

/**
 * PUT /api/training/[id]/registrations/[regId]
 * Update registration status and module progress (Admin only)
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

    const { id, regId } = await params;
    const body = await request.json();

    // Check registration exists and belongs to user's institution
    const registration = await prisma.trainingRegistration.findUnique({
      where: { id: regId },
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

    if (registration.training.institutionId !== user.primaryInstitution) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const { status, moduleProgress } = body;

    // Update registration status if provided
    if (status) {
      await prisma.trainingRegistration.update({
        where: { id: regId },
        data: { status },
      });
    }

    // Update module progress if provided
    if (moduleProgress && Array.isArray(moduleProgress)) {
      for (const progress of moduleProgress) {
        const { moduleId, status: progressStatus } = progress;
        
        if (!moduleId || !progressStatus) continue;

        // Find or create progress entry
        const existingProgress = await prisma.trainingModuleProgress.findUnique({
          where: {
            registrationId_moduleId: {
              registrationId: regId,
              moduleId,
            },
          },
        });

        if (existingProgress) {
          await prisma.trainingModuleProgress.update({
            where: { id: existingProgress.id },
            data: {
              status: progressStatus,
              completedAt: progressStatus === 'COMPLETED' ? new Date() : null,
            },
          });
        } else {
          await prisma.trainingModuleProgress.create({
            data: {
              registrationId: regId,
              moduleId,
              status: progressStatus,
              completedAt: progressStatus === 'COMPLETED' ? new Date() : null,
            },
          });
        }
      }
    }

    // Fetch updated registration
    const updatedRegistration = await prisma.trainingRegistration.findUnique({
      where: { id: regId },
      include: {
        user: {
          select: {
            id: true,
            givenName: true,
            familyName: true,
            email: true,
          },
        },
        moduleProgress: {
          include: {
            module: true,
          },
        },
        certificate: true,
      },
    });

    return NextResponse.json({
      success: true,
      registration: updatedRegistration,
    });
  } catch (error) {
    console.error('Error updating registration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
