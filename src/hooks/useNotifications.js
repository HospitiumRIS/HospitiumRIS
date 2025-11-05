import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../components/AuthProvider';

export function useNotifications(unreadOnly = true) {  // Default to unread only for dropdown
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (overrideUnreadOnly = null, limit = 20) => {
    const shouldFetchUnreadOnly = overrideUnreadOnly !== null ? overrideUnreadOnly : unreadOnly;
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (shouldFetchUnreadOnly) params.append('unreadOnly', 'true');
      params.append('limit', limit.toString());

      const response = await fetch(`/api/notifications?${params}`);
      const data = await response.json();

      if (!response.ok) {
        // If it's a 401, user is not authenticated, don't treat as error
        if (response.status === 401) {
          setNotifications([]);
          setUnreadCount(0);
          return { notifications: [], unreadCount: 0 };
        }
        throw new Error(data.error || 'Failed to fetch notifications');
      }

      setNotifications(data.data.notifications || []);
      setUnreadCount(data.data.unreadCount || 0);
      
      return data.data;
    } catch (err) {
      console.error('Error fetching notifications:', err);
      // Don't show error for common issues during development
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        console.warn('Notifications API unavailable - this is normal during development');
      } else {
        setError(err.message);
      }
      // Always return safe defaults
      setNotifications([]);
      setUnreadCount(0);
      return { notifications: [], unreadCount: 0 };
    } finally {
      setIsLoading(false);
    }
  }, [unreadOnly]);

  // Mark notifications as read
  const markAsRead = useCallback(async (notificationIds = null, markAllAsRead = false) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds,
          markAllAsRead
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mark notifications as read');
      }

      // Update local state
      if (markAllAsRead) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date() })));
        setUnreadCount(0);
      } else if (notificationIds) {
        setNotifications(prev => prev.map(n => 
          notificationIds.includes(n.id) 
            ? { ...n, isRead: true, readAt: new Date() }
            : n
        ));
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
      }

      return data;
    } catch (err) {
      console.error('Error marking notifications as read:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete notification');
      }

      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update unread count if the deleted notification was unread
      const deletedNotification = notifications.find(n => n.id === notificationId);
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      return data;
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError(err.message);
      throw err;
    }
  }, [notifications]);

  // Add new notification (for real-time updates)
  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.isRead) {
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  // Initial fetch on mount (only for authenticated users)
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      console.log('🔔 Initializing notifications for authenticated user');
      fetchNotifications();
    } else if (!authLoading && !isAuthenticated) {
      console.log('🔔 User not authenticated, skipping notifications');
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
    }
  }, [fetchNotifications, isAuthenticated, authLoading]);

  // Auto-refresh every 30 seconds (only for authenticated users)
  useEffect(() => {
    if (!isAuthenticated || authLoading) return;

    console.log('🔔 Setting up notifications auto-refresh');
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000); // 30 seconds

    return () => {
      console.log('🔔 Cleaning up notifications auto-refresh');
      clearInterval(interval);
    };
  }, [fetchNotifications, isAuthenticated, authLoading]);

  // Listen for custom refresh events
  useEffect(() => {
    if (!isAuthenticated || authLoading) return;

    const handleCustomRefresh = () => {
      console.log('🔔 Custom refresh event received, fetching notifications');
      fetchNotifications();
    };

    window.addEventListener('refreshNotifications', handleCustomRefresh);

    return () => {
      window.removeEventListener('refreshNotifications', handleCustomRefresh);
    };
  }, [fetchNotifications, isAuthenticated, authLoading]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    deleteNotification,
    addNotification,
    refresh: () => fetchNotifications(),
    refreshAll: () => fetchNotifications(false) // Fetch all notifications (read + unread)
  };
}
