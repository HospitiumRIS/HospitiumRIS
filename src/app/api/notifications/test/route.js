import { NextResponse } from 'next/server';
import { getUserId } from '../../../../lib/auth-server.js';
import { notificationService } from '../../../../services/notificationService.js';

/**
 * Test notification endpoint - creates sample notifications for testing
 * POST /api/notifications/test
 */
export async function POST(request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { testType = 'all' } = await request.json();
    const createdNotifications = [];

    // Test 1: Simple system announcement
    if (testType === 'all' || testType === 'system') {
      const notification1 = await notificationService.createNotification({
        userId,
        type: 'SYSTEM_ANNOUNCEMENT',
        title: 'Welcome to the Enhanced Notification System!',
        message: 'The notification system has been upgraded with new features including categories, priorities, and user preferences.',
        priority: 'NORMAL',
        category: 'SYSTEM',
        actionUrl: '/researcher/settings/notifications',
        actionLabel: 'View Settings',
        sendEmail: false
      });
      createdNotifications.push(notification1);
    }

    // Test 2: High priority notification
    if (testType === 'all' || testType === 'priority') {
      const notification2 = await notificationService.createNotification({
        userId,
        type: 'SYSTEM_NOTIFICATION',
        title: '⚠️ Important System Update',
        message: 'A critical security update has been applied to your account. Please review your recent activity.',
        priority: 'HIGH',
        category: 'SYSTEM',
        actionRequired: true,
        actionUrl: '/researcher/settings/security',
        actionLabel: 'Review Activity',
        sendEmail: false
      });
      createdNotifications.push(notification2);
    }

    // Test 3: Urgent notification
    if (testType === 'all' || testType === 'urgent') {
      const notification3 = await notificationService.createNotification({
        userId,
        type: 'SECURITY_ALERT',
        title: '🔒 Security Alert',
        message: 'Unusual login activity detected. If this wasn\'t you, please secure your account immediately.',
        priority: 'URGENT',
        category: 'SYSTEM',
        actionRequired: true,
        actionUrl: '/researcher/settings/security',
        actionLabel: 'Secure Account',
        sendEmail: false
      });
      createdNotifications.push(notification3);
    }

    // Test 4: Collaboration notification
    if (testType === 'all' || testType === 'collaboration') {
      const notification4 = await notificationService.createNotification({
        userId,
        type: 'COMMENT_MENTION',
        title: 'You were mentioned in a comment',
        message: 'Test User mentioned you in a comment: "Hey, can you review this section?"',
        priority: 'HIGH',
        category: 'COLLABORATION',
        actionRequired: true,
        actionUrl: '/researcher/publications/collaborate',
        actionLabel: 'View Comment',
        sendEmail: false
      });
      createdNotifications.push(notification4);
    }

    // Test 5: Training notification
    if (testType === 'all' || testType === 'training') {
      const notification5 = await notificationService.createNotification({
        userId,
        type: 'TRAINING_AVAILABLE',
        title: 'New Training Available',
        message: 'A new training "Research Ethics and Compliance" is now available for registration.',
        priority: 'NORMAL',
        category: 'TRAINING',
        actionUrl: '/researcher/training',
        actionLabel: 'View Training',
        sendEmail: false
      });
      createdNotifications.push(notification5);
    }

    // Test 6: Low priority notification
    if (testType === 'all' || testType === 'low') {
      const notification6 = await notificationService.createNotification({
        userId,
        type: 'PUBLICATION_IMPORTED',
        title: 'Publications Imported',
        message: '5 publications were successfully imported from ORCID.',
        priority: 'LOW',
        category: 'PUBLICATION',
        actionUrl: '/researcher/publications',
        actionLabel: 'View Publications',
        sendEmail: false
      });
      createdNotifications.push(notification6);
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdNotifications.length} test notification(s)`,
      notifications: createdNotifications
    });

  } catch (error) {
    console.error('Error creating test notifications:', error);
    return NextResponse.json({ 
      error: 'Failed to create test notifications',
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * Get available test types
 * GET /api/notifications/test
 */
export async function GET(request) {
  return NextResponse.json({
    success: true,
    availableTests: [
      { type: 'all', description: 'Create all test notifications' },
      { type: 'system', description: 'System announcement (NORMAL priority)' },
      { type: 'priority', description: 'Important update (HIGH priority)' },
      { type: 'urgent', description: 'Security alert (URGENT priority)' },
      { type: 'collaboration', description: 'Comment mention (HIGH priority)' },
      { type: 'training', description: 'Training available (NORMAL priority)' },
      { type: 'low', description: 'Publication import (LOW priority)' }
    ],
    usage: 'POST /api/notifications/test with body: { "testType": "all" }'
  });
}
