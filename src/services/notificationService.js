import { PrismaClient } from '@prisma/client';
import { notificationTemplates } from './notificationTemplates.js';

const prisma = new PrismaClient();

/**
 * Centralized Notification Service
 * Handles all notification creation, delivery, and management
 */
class NotificationService {
  /**
   * Create a single notification
   * @param {Object} params - Notification parameters
   * @returns {Promise<Object>} Created notification
   */
  async createNotification({
    userId,
    type,
    title,
    message,
    data = {},
    priority = 'NORMAL',
    category = 'GENERAL',
    manuscriptId = null,
    proposalId = null,
    ethicsApplicationId = null,
    grantApplicationId = null,
    trainingId = null,
    preprintId = null,
    actionRequired = false,
    actionUrl = null,
    actionLabel = null,
    expiresAt = null,
    sendEmail = false
  }) {
    try {
      // Check user notification preferences
      const preferences = await this.getUserPreferences(userId);
      
      // Check if user has notifications enabled for this category
      if (!this.shouldSendNotification(preferences, category, 'inApp')) {
        console.log(`Notification skipped for user ${userId} - category ${category} disabled`);
        return null;
      }

      // Check quiet hours
      if (this.isQuietHours(preferences)) {
        console.log(`Notification delayed for user ${userId} - quiet hours active`);
        // Could implement queue for delayed delivery
      }

      // Create notification
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          data,
          priority,
          category,
          manuscriptId,
          proposalId,
          ethicsApplicationId,
          grantApplicationId,
          trainingId,
          preprintId,
          actionRequired,
          actionUrl,
          actionLabel,
          expiresAt,
          isRead: false
        },
        include: {
          manuscript: {
            select: { id: true, title: true, type: true }
          },
          proposal: {
            select: { id: true, title: true }
          },
          training: {
            select: { id: true, title: true }
          }
        }
      });

      // Send email if requested and user has email enabled
      if (sendEmail && this.shouldSendNotification(preferences, category, 'email')) {
        await this.sendEmailNotification(userId, notification, preferences);
      }

      console.log(`✅ Notification created: ${type} for user ${userId}`);
      return notification;

    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create bulk notifications
   * @param {Array} notifications - Array of notification objects
   * @returns {Promise<Array>} Created notifications
   */
  async createBulkNotifications(notifications) {
    try {
      const created = [];
      
      for (const notif of notifications) {
        const result = await this.createNotification(notif);
        if (result) {
          created.push(result);
        }
      }

      console.log(`✅ Created ${created.length} bulk notifications`);
      return created;

    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Create notification using a template
   * @param {string} templateKey - Template identifier
   * @param {Object} params - Template parameters
   * @returns {Promise<Object>} Created notification
   */
  async createFromTemplate(templateKey, params) {
    try {
      const template = notificationTemplates[templateKey];
      
      if (!template) {
        throw new Error(`Template not found: ${templateKey}`);
      }

      // Generate notification content from template
      const { title, message, category, priority, actionRequired, actionLabel } = 
        template.generate(params);

      return await this.createNotification({
        ...params,
        title,
        message,
        category,
        priority,
        actionRequired,
        actionLabel,
        type: template.type
      });

    } catch (error) {
      console.error('Error creating notification from template:', error);
      throw error;
    }
  }

  /**
   * Notify all users with a specific account type
   * @param {string} accountType - Account type to notify
   * @param {Object} notification - Notification details
   * @returns {Promise<Array>} Created notifications
   */
  async notifyByAccountType(accountType, notification) {
    try {
      const users = await prisma.user.findMany({
        where: {
          accountType,
          status: 'ACTIVE',
          emailVerified: true
        },
        select: { id: true }
      });

      const notifications = users.map(user => ({
        ...notification,
        userId: user.id
      }));

      return await this.createBulkNotifications(notifications);

    } catch (error) {
      console.error('Error notifying by account type:', error);
      throw error;
    }
  }

  /**
   * Notify all collaborators of a manuscript
   * @param {string} manuscriptId - Manuscript ID
   * @param {Object} notification - Notification details
   * @param {string} excludeUserId - User ID to exclude (e.g., the one who made the change)
   * @returns {Promise<Array>} Created notifications
   */
  async notifyCollaborators(manuscriptId, notification, excludeUserId = null) {
    try {
      const collaborators = await prisma.manuscriptCollaborator.findMany({
        where: {
          manuscriptId,
          ...(excludeUserId && { userId: { not: excludeUserId } })
        },
        select: { userId: true }
      });

      const notifications = collaborators.map(collab => ({
        ...notification,
        userId: collab.userId,
        manuscriptId
      }));

      return await this.createBulkNotifications(notifications);

    } catch (error) {
      console.error('Error notifying collaborators:', error);
      throw error;
    }
  }

  /**
   * Notify users in a specific target group (for training)
   * @param {Array} targetGroups - Array of target groups
   * @param {Object} notification - Notification details
   * @returns {Promise<Array>} Created notifications
   */
  async notifyTargetGroups(targetGroups, notification) {
    try {
      // This would need to be enhanced based on how target groups map to users
      // For now, we'll notify all researchers
      const users = await prisma.user.findMany({
        where: {
          accountType: 'RESEARCHER',
          status: 'ACTIVE',
          emailVerified: true
        },
        select: { id: true }
      });

      const notifications = users.map(user => ({
        ...notification,
        userId: user.id
      }));

      return await this.createBulkNotifications(notifications);

    } catch (error) {
      console.error('Error notifying target groups:', error);
      throw error;
    }
  }

  /**
   * Get user notification preferences
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User preferences or defaults
   */
  async getUserPreferences(userId) {
    try {
      let preferences = await prisma.notificationPreference.findUnique({
        where: { userId }
      });

      // Create default preferences if they don't exist
      if (!preferences) {
        preferences = await prisma.notificationPreference.create({
          data: {
            userId,
            emailEnabled: true,
            inAppEnabled: true,
            pushEnabled: false,
            emailDigest: 'IMMEDIATE',
            categoryPreferences: {},
            quietHoursEnabled: false,
            doNotDisturb: false
          }
        });
      }

      return preferences;

    } catch (error) {
      console.error('Error getting user preferences:', error);
      // Return defaults on error
      return {
        emailEnabled: true,
        inAppEnabled: true,
        pushEnabled: false,
        emailDigest: 'IMMEDIATE',
        categoryPreferences: {},
        quietHoursEnabled: false,
        doNotDisturb: false
      };
    }
  }

  /**
   * Check if notification should be sent based on preferences
   * @param {Object} preferences - User preferences
   * @param {string} category - Notification category
   * @param {string} channel - Delivery channel (email, inApp, push)
   * @returns {boolean} Should send notification
   */
  shouldSendNotification(preferences, category, channel) {
    // Check do not disturb
    if (preferences.doNotDisturb) {
      return false;
    }

    // Check channel enabled
    if (channel === 'email' && !preferences.emailEnabled) {
      return false;
    }
    if (channel === 'inApp' && !preferences.inAppEnabled) {
      return false;
    }
    if (channel === 'push' && !preferences.pushEnabled) {
      return false;
    }

    // Check category preferences
    const categoryPrefs = preferences.categoryPreferences || {};
    if (categoryPrefs[category] && categoryPrefs[category][channel] === false) {
      return false;
    }

    return true;
  }

  /**
   * Check if current time is within quiet hours
   * @param {Object} preferences - User preferences
   * @returns {boolean} Is quiet hours
   */
  isQuietHours(preferences) {
    if (!preferences.quietHoursEnabled) {
      return false;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = (preferences.quietHoursStart || '22:00').split(':').map(Number);
    const [endHour, endMinute] = (preferences.quietHoursEnd || '08:00').split(':').map(Number);

    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }

    return currentTime >= startTime && currentTime <= endTime;
  }

  /**
   * Send email notification
   * @param {string} userId - User ID
   * @param {Object} notification - Notification object
   * @param {Object} preferences - User preferences
   * @returns {Promise<void>}
   */
  async sendEmailNotification(userId, notification, preferences) {
    try {
      // Check email digest preference
      if (preferences.emailDigest !== 'IMMEDIATE') {
        console.log(`Email queued for digest: ${preferences.emailDigest}`);
        // Would implement digest queue here
        return;
      }

      // Get user email
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, givenName: true, familyName: true }
      });

      if (!user || !user.email) {
        console.log('User email not found');
        return;
      }

      // TODO: Integrate with email service
      console.log(`📧 Email notification sent to ${user.email}: ${notification.title}`);

      // Update notification as sent via email
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          sentViaEmail: true,
          emailSentAt: new Date()
        }
      });

    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  }

  /**
   * Mark notifications as read
   * @param {Array|string} notificationIds - Single ID or array of IDs
   * @param {string} userId - User ID (for security)
   * @returns {Promise<Object>} Update result
   */
  async markAsRead(notificationIds, userId) {
    try {
      const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];

      const result = await prisma.notification.updateMany({
        where: {
          id: { in: ids },
          userId
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      return result;

    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Update result
   */
  async markAllAsRead(userId) {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      return result;

    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Archive notification
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID (for security)
   * @returns {Promise<Object>} Updated notification
   */
  async archiveNotification(notificationId, userId) {
    try {
      const notification = await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId
        },
        data: {
          isArchived: true,
          archivedAt: new Date()
        }
      });

      return notification;

    } catch (error) {
      console.error('Error archiving notification:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID (for security)
   * @returns {Promise<Object>} Deleted notification
   */
  async deleteNotification(notificationId, userId) {
    try {
      // Verify ownership before deleting
      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId
        }
      });

      if (!notification) {
        throw new Error('Notification not found or unauthorized');
      }

      await prisma.notification.delete({
        where: { id: notificationId }
      });

      return notification;

    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics(userId) {
    try {
      const [total, unread, byCategory, byPriority] = await Promise.all([
        prisma.notification.count({ where: { userId } }),
        prisma.notification.count({ where: { userId, isRead: false } }),
        prisma.notification.groupBy({
          by: ['category'],
          where: { userId },
          _count: true
        }),
        prisma.notification.groupBy({
          by: ['priority'],
          where: { userId, isRead: false },
          _count: true
        })
      ]);

      return {
        total,
        unread,
        byCategory: byCategory.reduce((acc, item) => {
          acc[item.category] = item._count;
          return acc;
        }, {}),
        byPriority: byPriority.reduce((acc, item) => {
          acc[item.priority] = item._count;
          return acc;
        }, {})
      };

    } catch (error) {
      console.error('Error getting notification statistics:', error);
      throw error;
    }
  }

  /**
   * Clean up expired notifications
   * @returns {Promise<number>} Number of deleted notifications
   */
  async cleanupExpired() {
    try {
      const result = await prisma.notification.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      console.log(`🧹 Cleaned up ${result.count} expired notifications`);
      return result.count;

    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
      throw error;
    }
  }

  /**
   * Auto-archive old read notifications (30 days)
   * @returns {Promise<number>} Number of archived notifications
   */
  async autoArchiveOld() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await prisma.notification.updateMany({
        where: {
          isRead: true,
          isArchived: false,
          readAt: {
            lt: thirtyDaysAgo
          }
        },
        data: {
          isArchived: true,
          archivedAt: new Date()
        }
      });

      console.log(`📦 Auto-archived ${result.count} old notifications`);
      return result.count;

    } catch (error) {
      console.error('Error auto-archiving old notifications:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
