import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../lib/auth-server';
import { resolveInstitutionMemberScope } from '../../../../lib/institution-admin';
import { isTrainingAdmin, resolveTrainingInstitution } from '@/lib/training-admin-server';
import { isOwningTrainingAdmin } from '@/lib/training-scope';

/**
 * POST /api/notifications/training-created
 * Send notifications to users when a new training is created
 */
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user || !isTrainingAdmin(user)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { trainingId } = body;

    if (!trainingId) {
      return NextResponse.json(
        { error: 'Training ID is required' },
        { status: 400 }
      );
    }

    // Get the training details
    const training = await prisma.training.findUnique({
      where: { id: trainingId },
    });

    if (!training) {
      return NextResponse.json(
        { error: 'Training not found' },
        { status: 404 }
      );
    }

    // Tenant isolation (#88): only the owning institution's training admins can trigger
    // this, and only that institution's researchers are notified. Trainings open to
    // other institutions are discoverable in the shared catalogue, not pushed to
    // every researcher on the platform.
    const ownInstitution = await resolveTrainingInstitution(user);
    if (!isOwningTrainingAdmin(user, training, { institutionId: ownInstitution?.id })) {
      return NextResponse.json({ error: 'Training not found' }, { status: 404 });
    }
    const institution = await prisma.institution.findUnique({
      where: { id: training.institutionId },
      select: { id: true, userId: true },
    });
    if (!institution) {
      return NextResponse.json({ success: true, notificationsSent: 0, totalUsers: 0 });
    }
    const { memberWhere } = await resolveInstitutionMemberScope(institution);

    const targetUsers = await prisma.user.findMany({
      where: {
        AND: [
          memberWhere,
          {
            id: { not: user.id }, // Exclude the creator
            status: 'ACTIVE',
            accountType: 'RESEARCHER', // Only notify researchers
          },
        ],
      },
    });

    // Create notifications for all eligible users
    const notifications = [];
    const isAllStaff = training.targetGroup.includes('ALL_STAFF');
    const isForResearchers = training.targetGroup.includes('RESEARCHERS');

    for (const targetUser of targetUsers) {
      // Notify if ALL_STAFF or RESEARCHERS is in target groups
      if (isAllStaff || isForResearchers) {
        notifications.push({
          userId: targetUser.id,
          type: 'COLLABORATION_INVITATION', // Reusing existing enum value
          title: 'New Training Available',
          message: `A new training "${training.title}" has been published. Register now!`,
          data: {
            trainingId: training.id,
            trainingTitle: training.title,
            startDate: training.startDate,
            endDate: training.endDate,
          },
        });
      }
    }

    // Bulk create notifications
    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications,
      });
    }

    return NextResponse.json({
      success: true,
      notificationsSent: notifications.length,
    });
  } catch (error) {
    console.error('Error sending training notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
