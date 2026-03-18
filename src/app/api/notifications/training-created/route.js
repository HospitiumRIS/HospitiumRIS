import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../lib/auth-server';

/**
 * POST /api/notifications/training-created
 * Send notifications to users when a new training is created
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

    // Get all researchers (no institution filtering)
    const targetUsers = await prisma.user.findMany({
      where: {
        id: { not: user.id }, // Exclude the creator
        status: 'ACTIVE',
        accountType: 'RESEARCHER', // Only notify researchers
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
