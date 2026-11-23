import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../../../lib/auth-server';
import { requireTrainingAdminAccess } from '@/lib/training-admin-server';
import { ACTIVE_REGISTRATION_STATUSES } from '@/lib/training-scope';
import {
  MODULE_PROGRESS_STATUSES,
  checkRegistrationTransition,
  hasCapacity,
  isValidModuleProgressStatus,
  transitionTakesSeat,
} from '@/lib/training-registration-state';
import { auditTraining } from '@/lib/training-audit';
import { recomputeAttendancePercent } from '@/lib/training-attendance-server';

/**
 * PUT /api/training/[id]/registrations/[regId]
 * Update registration status and module progress (Admin only)
 */
export async function PUT(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);

    const { id, regId } = await params;
    const body = await request.json().catch(() => null);

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

    const access = await requireTrainingAdminAccess(user, registration.training);
    if (access.error) return access.error;

    if (registration.trainingId !== id) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    const { status, moduleProgress, reason } = body || {};

    // Validate everything before writing anything (#90).
    let transition = null;
    if (status !== undefined) {
      transition = checkRegistrationTransition(registration.status, status, { actor: 'admin' });
      if (!transition.ok) {
        return NextResponse.json({ error: transition.error }, { status: 400 });
      }
    }

    let progressUpdates = [];
    if (moduleProgress !== undefined) {
      if (!Array.isArray(moduleProgress)) {
        return NextResponse.json({ error: 'moduleProgress must be an array' }, { status: 400 });
      }
      const trainingModules = await prisma.trainingModule.findMany({
        where: { trainingId: id },
        select: { id: true },
      });
      const moduleIds = new Set(trainingModules.map((m) => m.id));
      for (const item of moduleProgress) {
        if (!item?.moduleId || !moduleIds.has(item.moduleId)) {
          return NextResponse.json({ error: 'Unknown module for this training' }, { status: 400 });
        }
        if (!isValidModuleProgressStatus(item.status)) {
          return NextResponse.json(
            { error: `Invalid module status "${item?.status}". Allowed: ${MODULE_PROGRESS_STATUSES.join(', ')}` },
            { status: 400 }
          );
        }
      }
      progressUpdates = moduleProgress;
    }

    const changeStatus = transition && !transition.noop;
    const outcome = await prisma.$transaction(async (tx) => {
      if (changeStatus) {
        // Reinstating a cancelled registration takes a seat: check capacity under a
        // row lock on the training.
        if (transitionTakesSeat(registration.status, status)) {
          await tx.$queryRaw`SELECT "id" FROM "trainings" WHERE "id" = ${id} FOR UPDATE`;
          const activeCount = await tx.trainingRegistration.count({
            where: { trainingId: id, status: { in: ACTIVE_REGISTRATION_STATUSES }, id: { not: regId } },
          });
          if (!hasCapacity(registration.training, activeCount)) {
            return { error: 'Training is full', status: 400 };
          }
        }
        await tx.trainingRegistration.update({
          where: { id: regId },
          data: { status },
        });
      }

      for (const { moduleId, status: progressStatus } of progressUpdates) {
        await tx.trainingModuleProgress.upsert({
          where: { registrationId_moduleId: { registrationId: regId, moduleId } },
          update: {
            status: progressStatus,
            completedAt: progressStatus === 'COMPLETED' ? new Date() : null,
          },
          create: {
            registrationId: regId,
            moduleId,
            status: progressStatus,
            completedAt: progressStatus === 'COMPLETED' ? new Date() : null,
          },
        });
      }
      return {};
    });

    if (outcome.error) {
      return NextResponse.json({ error: outcome.error }, { status: outcome.status });
    }

    if (changeStatus) {
      await recomputeAttendancePercent(id, [regId]);
      await auditTraining({
        trainingId: id,
        actorId: user.id,
        action: 'REGISTRATION_STATUS_CHANGED',
        entityType: 'TrainingRegistration',
        entityId: regId,
        before: { status: registration.status },
        after: { status },
        reason: typeof reason === 'string' ? reason.slice(0, 500) : null,
      });
    }
    if (progressUpdates.length) {
      await auditTraining({
        trainingId: id,
        actorId: user.id,
        action: 'MODULE_PROGRESS_UPDATED',
        entityType: 'TrainingRegistration',
        entityId: regId,
        after: { moduleProgress: progressUpdates.map(({ moduleId, status: st }) => ({ moduleId, status: st })) },
      });
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
