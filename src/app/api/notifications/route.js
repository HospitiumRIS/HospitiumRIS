import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserId } from '../../../lib/auth-server.js';
import { logApiActivity, logDatabaseActivity, logError, getRequestMetadata } from '../../../utils/activityLogger.js';
import { notificationService } from '../../../services/notificationService.js';

const prisma = new PrismaClient();

/**
 * Get user notifications
 * GET /api/notifications?unreadOnly=true&limit=20
 */
export async function GET(request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const limit = parseInt(searchParams.get('limit')) || 20;
    const offset = parseInt(searchParams.get('offset')) || 0;

    const whereClause = {
      userId,
      isArchived: false,
      ...(unreadOnly && { isRead: false }),
      ...(category && { category }),
      ...(priority && { priority })
    };

    console.log(`🔔 API: Fetching notifications for user ${userId}`, {
      unreadOnly: unreadOnly,
      limit: limit
    });

    // Get notifications with all related entities
    const notifications = await prisma.notification.findMany({
      where: whereClause,
      include: {
        manuscript: {
          select: { id: true, title: true, type: true }
        },
        proposal: {
          select: { id: true, title: true }
        },
        ethicsApplication: {
          select: { id: true, title: true, referenceNumber: true }
        },
        grantApplication: {
          select: { id: true, applicationTitle: true, grantorName: true }
        },
        training: {
          select: { id: true, title: true, startDate: true }
        },
        preprint: {
          select: { id: true, title: true, server: true }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    });

    console.log(`🔔 Found ${notifications.length} notifications for user ${userId}:`, 
      notifications.map(n => ({ id: n.id, title: n.title, isRead: n.isRead, createdAt: n.createdAt })));

    // Additional debugging - check if there are ANY notifications in the database
    const totalNotifications = await prisma.notification.count();
    console.log(`🔔 TOTAL notifications in database: ${totalNotifications}`);

    if (totalNotifications > 0 && notifications.length === 0) {
      // Get a sample of notifications to see what user IDs exist
      const sampleNotifications = await prisma.notification.findMany({
        select: { userId: true, title: true, createdAt: true },
        take: 5,
        orderBy: { createdAt: 'desc' }
      });
      console.log(`🔔 Sample notifications with user IDs:`, sampleNotifications);
    }

    // Get counts
    const [unreadCount, totalCount] = await Promise.all([
      prisma.notification.count({
        where: { userId, isRead: false, isArchived: false }
      }),
      prisma.notification.count({
        where: whereClause
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        total: totalCount,
        hasMore: offset + notifications.length < totalCount
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    
    // Handle case where tables don't exist yet (before migration)
    if (error.code === 'P2021') {
      return NextResponse.json({
        success: true,
        data: {
          notifications: [],
          unreadCount: 0,
          hasMore: false
        }
      });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Create new notification
 * POST /api/notifications
 */
export async function POST(request) {
  const requestMetadata = getRequestMetadata(request);
  
  try {
    await logApiActivity('POST', '/api/notifications', 200, requestMetadata);
    
    const body = await request.json();
    
    // Use notification service for creation
    const notification = await notificationService.createNotification(body);

    await logDatabaseActivity('CREATE', 'Notification', { success: true, count: 1 }, {
      ...requestMetadata,
      operation: 'Create notification via service',
      type: body.type
    });

    return NextResponse.json({
      success: true,
      message: 'Notification created successfully',
      notification
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    
    await logApiActivity('POST', '/api/notifications', 500, {
      ...requestMetadata,
      error: error.message
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to create notification'
    }, { status: 500 });
  }
}

/**
 * Mark notifications as read
 * PATCH /api/notifications
 */
export async function PATCH(request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { notificationIds, markAllAsRead } = await request.json();

    if (markAllAsRead) {
      // Mark all user notifications as read
      await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications marked as read'
    });

  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Delete notification
 * DELETE /api/notifications
 */
export async function DELETE(request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    // Verify notification belongs to user before deleting
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId
      }
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    await prisma.notification.delete({
      where: {
        id: notificationId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Notification deleted'
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
