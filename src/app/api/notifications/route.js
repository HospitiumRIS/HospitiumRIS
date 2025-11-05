import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserId } from '../../../lib/auth-server.js';
import { logApiActivity, logDatabaseActivity, logError, getRequestMetadata } from '../../../utils/activityLogger.js';

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
    const limit = parseInt(searchParams.get('limit')) || 20;

    const whereClause = {
      userId,
      ...(unreadOnly && { isRead: false })
    };

    console.log(`🔔 API: Fetching notifications for user ${userId}`, {
      unreadOnly: unreadOnly,
      limit: limit
    });

    // Get notifications with manuscript info if applicable
    const notifications = await prisma.notification.findMany({
      where: whereClause,
      include: {
        manuscript: {
          select: {
            id: true,
            title: true,
            type: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
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

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        hasMore: notifications.length === limit
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
    const { 
      type, 
      title, 
      message, 
      recipientId, 
      recipientEmail, 
      recipientRole, 
      metadata = {} 
    } = body;

    let targetUserId = recipientId;

    // If recipientRole is provided, find users with that role
    if (recipientRole && !recipientId) {
      const users = await prisma.user.findMany({
        where: {
          role: recipientRole
        },
        select: {
          id: true,
          email: true,
          givenName: true,
          familyName: true
        }
      });

      await logDatabaseActivity('SELECT', 'User', { success: true, count: users.length }, {
        ...requestMetadata,
        operation: 'Find users by role',
        role: recipientRole
      });

      // Create notifications for all users with the specified role
      const notifications = [];
      for (const user of users) {
        const notification = await prisma.notification.create({
          data: {
            type,
            title,
            message,
            userId: user.id,
            metadata: JSON.stringify(metadata),
            isRead: false
          }
        });
        notifications.push(notification);
      }

      await logDatabaseActivity('CREATE', 'Notification', { success: true, count: notifications.length }, {
        ...requestMetadata,
        operation: 'Create notifications for role',
        role: recipientRole,
        type
      });

      return NextResponse.json({
        success: true,
        message: `Notifications sent to ${notifications.length} ${recipientRole} users`,
        notifications
      });
    }

    // If recipientEmail is provided, find user by email
    if (recipientEmail && !targetUserId) {
      const user = await prisma.user.findUnique({
        where: { email: recipientEmail },
        select: { id: true }
      });

      if (user) {
        targetUserId = user.id;
      } else {
        await logError('User not found for notification', {
          ...requestMetadata,
          recipientEmail,
          type
        });
        
        return NextResponse.json({
          success: false,
          error: 'Recipient not found'
        }, { status: 404 });
      }
    }

    if (!targetUserId) {
      return NextResponse.json({
        success: false,
        error: 'No valid recipient specified'
      }, { status: 400 });
    }

    // Create the notification
    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        message,
        userId: targetUserId,
        metadata: JSON.stringify(metadata),
        isRead: false
      }
    });

    await logDatabaseActivity('CREATE', 'Notification', { success: true, count: 1 }, {
      ...requestMetadata,
      operation: 'Create notification',
      recipientId: targetUserId,
      type
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
