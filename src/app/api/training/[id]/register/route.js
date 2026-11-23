import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../../lib/auth-server';
import { resolveTrainingScopeContext } from '@/lib/training-admin-server';
import { canRegisterForTraining, canViewTraining } from '@/lib/training-scope';
import { checkRegistrationTransition, checkRegistrationWindow } from '@/lib/training-registration-state';
import { checkSelfCancel, decideRegistration } from '@/lib/training-enrolment';
import { eligibilityFor, promoteWaitlist, seatCount } from '@/lib/training-enrolment-server';
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

    // Eligibility (#102): department rule and prerequisites.
    const eligibility = (await eligibilityFor(user, [training])).get(training.id);
    if (!eligibility.ok) {
      return NextResponse.json({ error: eligibility.reasons.join(' · '), reasons: eligibility.reasons }, { status: 400 });
    }

    // Capacity check and write in one transaction, holding a row lock on the training
    // so concurrent registrations for the last seat are serialised (#90). Depending on
    // the training the result is a place, a request awaiting approval or a waiting-list
    // place (#102).
    let outcome;
    try {
      outcome = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "trainings" WHERE "id" = ${id} FOR UPDATE`;

        const existing = await tx.trainingRegistration.findUnique({
          where: { trainingId_userId: { trainingId: id, userId: user.id } },
        });
        if (existing && existing.status === 'REJECTED') {
          return { error: 'Your request for this training was not approved. Contact the training team.', status: 400 };
        }
        if (existing && existing.status !== 'CANCELLED') {
          return { error: 'Already registered for this training', status: 400 };
        }

        const decision = decideRegistration(training, await seatCount(id, tx));
        if (decision.error) {
          return { error: decision.error, status: 400 };
        }
        const data = { status: decision.status, registeredAt: new Date(), cancelledAt: null, cancelReason: null };

        const registration = existing
          ? await tx.trainingRegistration.update({ where: { id: existing.id }, data })
          : await tx.trainingRegistration.create({ data: { ...data, trainingId: id, userId: user.id } });

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

    const kind = registration.status === 'WAITLISTED' ? 'WAITLISTED'
      : registration.status === 'PENDING_APPROVAL' ? 'REGISTRATION_PENDING' : 'REGISTRATION_CONFIRMED';
    let waitlistPosition = null;
    if (registration.status === 'WAITLISTED') {
      waitlistPosition = await prisma.trainingRegistration.count({
        where: { trainingId: id, status: 'WAITLISTED', registeredAt: { lte: registration.registeredAt } },
      });
    }
    await notifyTraining(kind, { userId: user.id, trainingId: id, extra: { waitlistPosition } });

    await auditTraining({
      trainingId: id,
      actorId: user.id,
      action: outcome.before ? 'REGISTRATION_REACTIVATED' : 'REGISTRATION_CREATED',
      entityType: 'TrainingRegistration',
      entityId: registration.id,
      before: outcome.before,
      after: { status: registration.status },
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
      message: completeRegistration.status === 'WAITLISTED'
        ? 'The training is full: you are on the waiting list'
        : completeRegistration.status === 'PENDING_APPROVAL'
          ? 'Request sent: a place is held while the training team approves it'
          : 'Successfully registered for training',
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

    if (registration.status === 'CANCELLED') {
      return NextResponse.json({ success: true, message: 'Registration already cancelled' });
    }
    // Start and cancellation deadline (#102).
    const cancellable = checkSelfCancel(registration.training, registration);
    if (!cancellable.ok) {
      return NextResponse.json({ error: cancellable.error }, { status: 400 });
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
        cancelledAt: new Date(),
        cancelReason: 'Cancelled by participant',
      },
    });

    // A freed place goes to the next person on the waiting list (#102).
    if (registration.status !== 'WAITLISTED') await promoteWaitlist(id, { actorId: user.id });

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
