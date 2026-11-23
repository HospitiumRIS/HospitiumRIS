import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../../lib/auth-server';
import { resolveTrainingScopeContext } from '@/lib/training-admin-server';
import { ACTIVE_REGISTRATION_STATUSES, canRegisterForTraining, canViewTraining } from '@/lib/training-scope';
import { checkRegistrationTransition, checkRegistrationWindow, hasCapacity } from '@/lib/training-registration-state';
import { auditTraining } from '@/lib/training-audit';
import { notifyTraining } from '@/lib/training-notify';

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

    // Tenant scoping (#88): only trainings the caller can see can be registered for.
    const scopeCtx = await resolveTrainingScopeContext(user);
    if (training.status === 'PUBLISHED' && !canRegisterForTraining(user, training, scopeCtx)) {
      return NextResponse.json(
        { error: 'Training not found' },
        { status: 404 }
      );
    }
    if (training.status !== 'PUBLISHED' && !canViewTraining(user, training, scopeCtx)) {
      return NextResponse.json(
        { error: 'Training not found' },
        { status: 404 }
      );
    }

    // Check if training is published
    if (training.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Training is not available for registration' },
        { status: 400 }
      );
    }

    // Registration window (#90): closed once the training has started.
    const windowCheck = checkRegistrationWindow(training);
    if (!windowCheck.ok) {
      return NextResponse.json({ error: windowCheck.error }, { status: 400 });
    }

    // Capacity check and write in one transaction, holding a row lock on the training
    // so concurrent registrations for the last seat are serialised (#90).
    let outcome;
    try {
      outcome = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "trainings" WHERE "id" = ${id} FOR UPDATE`;

        const existing = await tx.trainingRegistration.findUnique({
          where: { trainingId_userId: { trainingId: id, userId: user.id } },
        });
        if (existing && existing.status !== 'CANCELLED') {
          return { error: 'Already registered for this training', status: 400 };
        }

        const activeCount = await tx.trainingRegistration.count({
          where: { trainingId: id, status: { in: ACTIVE_REGISTRATION_STATUSES } },
        });
        if (!hasCapacity(training, activeCount)) {
          return { error: 'Training is full', status: 400 };
        }

        const registration = existing
          ? await tx.trainingRegistration.update({
              where: { id: existing.id },
              data: { status: 'REGISTERED', registeredAt: new Date() },
            })
          : await tx.trainingRegistration.create({
              data: { trainingId: id, userId: user.id, status: 'REGISTERED' },
            });

        // Progress rows for active modules; existing rows (from an earlier
        // registration) are kept as they are.
        if (training.modules.length > 0) {
          await tx.trainingModuleProgress.createMany({
            data: training.modules.map((module) => ({
              registrationId: registration.id,
              moduleId: module.id,
              status: 'PENDING',
            })),
            skipDuplicates: true,
          });
        }

        return { registration, before: existing ? { status: existing.status } : null };
      });
    } catch (error) {
      // Two requests from the same user racing on the unique (trainingId, userId).
      if (error?.code === 'P2002') {
        return NextResponse.json({ error: 'Already registered for this training' }, { status: 400 });
      }
      throw error;
    }

    if (outcome.error) {
      return NextResponse.json({ error: outcome.error }, { status: outcome.status });
    }
    const { registration } = outcome;

    await notifyTraining('REGISTRATION_CONFIRMED', { userId: user.id, trainingId: id });

    await auditTraining({
      trainingId: id,
      actorId: user.id,
      action: outcome.before ? 'REGISTRATION_REACTIVATED' : 'REGISTRATION_CREATED',
      entityType: 'TrainingRegistration',
      entityId: registration.id,
      before: outcome.before,
      after: { status: 'REGISTERED' },
    });

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

    const transition = checkRegistrationTransition(registration.status, 'CANCELLED', { actor: 'self' });
    if (!transition.ok) {
      return NextResponse.json({ error: transition.error }, { status: 400 });
    }
    if (transition.noop) {
      return NextResponse.json({ success: true, message: 'Registration already cancelled' });
    }

    // Update registration status to cancelled
    await prisma.trainingRegistration.update({
      where: { id: registration.id },
      data: {
        status: 'CANCELLED',
      },
    });

    await notifyTraining('REGISTRATION_CANCELLED', { userId: user.id, trainingId: id, extra: { reason: 'You cancelled your registration.' } });

    await auditTraining({
      trainingId: id,
      actorId: user.id,
      action: 'REGISTRATION_CANCELLED',
      entityType: 'TrainingRegistration',
      entityId: registration.id,
      before: { status: registration.status },
      after: { status: 'CANCELLED' },
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
