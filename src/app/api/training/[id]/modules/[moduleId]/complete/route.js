import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { auditTraining } from '@/lib/training-audit';
import { ACTIVE_REGISTRATION_STATUSES } from '@/lib/training-scope';
import { refreshTrainingProgress } from '@/lib/training-progress-server';

/**
 * POST /api/training/[id]/modules/[moduleId]/complete
 * Body: { completed: true | false }
 * A participant marks a self-paced module (completion mode SELF) done or not done (#96).
 */
export async function POST(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, moduleId } = await params;
    const trainingModule = await prisma.trainingModule.findUnique({ where: { id: moduleId } });
    if (!trainingModule || trainingModule.trainingId !== id || trainingModule.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }
    if (trainingModule.completionMode !== 'SELF') {
      return NextResponse.json({ error: 'This module is completed by the training team, not by participants' }, { status: 400 });
    }

    const registration = await prisma.trainingRegistration.findUnique({
      where: { trainingId_userId: { trainingId: id, userId: user.id } },
    });
    if (!registration || !ACTIVE_REGISTRATION_STATUSES.includes(registration.status)) {
      return NextResponse.json({ error: 'You are not registered for this training' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const completed = body?.completed !== false;
    const now = new Date();
    await prisma.trainingModuleProgress.upsert({
      where: { registrationId_moduleId: { registrationId: registration.id, moduleId } },
      update: { status: completed ? 'COMPLETED' : 'PENDING', completedAt: completed ? now : null },
      create: { registrationId: registration.id, moduleId, status: completed ? 'COMPLETED' : 'PENDING', completedAt: completed ? now : null },
    });

    await refreshTrainingProgress(id, [registration.id], { actorId: user.id });
    await auditTraining({
      trainingId: id,
      actorId: user.id,
      action: completed ? 'MODULE_SELF_COMPLETED' : 'MODULE_SELF_UNCOMPLETED',
      entityType: 'TrainingModule',
      entityId: moduleId,
      after: { registrationId: registration.id },
    });

    return NextResponse.json({ success: true, moduleId, status: completed ? 'COMPLETED' : 'PENDING' });
  } catch (error) {
    console.error('Error completing module:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
