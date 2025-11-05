import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Chip,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Menu,
  Badge,
  Tooltip,
  Stack
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  MarkEmailRead as MarkReadIcon,
  Refresh as RefreshIcon,
  NotificationsNone as NotificationsIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../../hooks/useNotifications';

const NOTIFICATION_TYPES = {
  COLLABORATION_INVITATION: {
    icon: GroupIcon,
    color: '#8b6cbc',
    bgColor: 'rgba(139, 108, 188, 0.1)'
  },
  MANUSCRIPT_UPDATE: {
    icon: DescriptionIcon,
    color: '#2196f3',
    bgColor: 'rgba(33, 150, 243, 0.1)'
  },
  COMMENT_MENTION: {
    icon: PersonIcon,
    color: '#ff9800',
    bgColor: 'rgba(255, 152, 0, 0.1)'
  },
  SYSTEM_NOTIFICATION: {
    icon: NotificationsIcon,
    color: '#4caf50',
    bgColor: 'rgba(76, 175, 80, 0.1)'
  }
};

export default function NotificationDropdown({ anchorEl, open, onClose }) {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    deleteNotification,
    refresh,
    refreshAll
  } = useNotifications(); // This fetches unread only by default
  
  const [showAll, setShowAll] = useState(false);
  const [allNotifications, setAllNotifications] = useState([]);

  // Debug logging
  console.log('🔔 NotificationDropdown render:', {
    open,
    hasAnchor: !!anchorEl,
    notificationCount: notifications.length,
    unreadCount,
    isLoading,
    error
  });

  const [processingIds, setProcessingIds] = useState(new Set());

  // Fetch all notifications when showAll is enabled
  useEffect(() => {
    if (showAll && open) {
      console.log('🔔 Fetching ALL notifications (read + unread)');
      // Use the hook's fetchNotifications function with unreadOnly = false
      refreshAll()
        .then(data => {
          setAllNotifications(data.notifications || []);
        })
        .catch(err => {
          console.error('Failed to fetch all notifications:', err);
        });
    }
  }, [showAll, open, refreshAll]);

  // Determine which notifications to display
  const displayNotifications = showAll ? allNotifications : notifications;

  const handleMarkAsRead = useCallback(async (notificationId) => {
    setProcessingIds(prev => new Set([...prev, notificationId]));
    try {
      await markAsRead([notificationId]);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  }, [markAsRead]);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAsRead(null, true);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [markAsRead]);

  const handleDeleteNotification = useCallback(async (notificationId) => {
    setProcessingIds(prev => new Set([...prev, notificationId]));
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  }, [deleteNotification]);

  const renderNotification = (notification) => {
    const typeConfig = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.SYSTEM_NOTIFICATION;
    const Icon = typeConfig.icon;
    const isProcessing = processingIds.has(notification.id);

    return (
      <ListItem
        key={notification.id}
        sx={{
          py: 2,
          px: 3,
          bgcolor: notification.isRead ? 'transparent' : typeConfig.bgColor,
          borderLeft: notification.isRead ? 'none' : `3px solid ${typeConfig.color}`,
          '&:hover': {
            bgcolor: 'rgba(0,0,0,0.04)'
          }
        }}
      >
        <Avatar
          sx={{
            bgcolor: typeConfig.color,
            color: 'white',
            width: 40,
            height: 40,
            mr: 2
          }}
        >
          <Icon sx={{ fontSize: 20 }} />
        </Avatar>

        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: notification.isRead ? 400 : 600, flex: 1 }}>
                {notification.title}
              </Typography>
              {!notification.isRead && (
                <Chip
                  label="New"
                  size="small"
                  sx={{
                    bgcolor: typeConfig.color,
                    color: 'white',
                    fontSize: '0.7rem',
                    height: 20,
                    '& .MuiChip-label': { px: 1 }
                  }}
                />
              )}
            </Box>
          }
          secondary={
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {notification.message}
              </Typography>
              {notification.manuscript && (
                <Typography variant="caption" color="text.secondary" sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.5,
                  mb: 0.5 
                }}>
                  <DescriptionIcon sx={{ fontSize: 12 }} />
                  {notification.manuscript.title}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </Typography>
            </Box>
          }
        />

        <ListItemSecondaryAction>
          <Stack direction="row" spacing={0.5}>
            {!notification.isRead && (
              <Tooltip title="Mark as read">
                <IconButton
                  size="small"
                  onClick={() => handleMarkAsRead(notification.id)}
                  disabled={isProcessing}
                  sx={{ color: typeConfig.color }}
                >
                  {isProcessing ? <CircularProgress size={16} /> : <MarkReadIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={() => handleDeleteNotification(notification.id)}
                disabled={isProcessing}
                sx={{ color: 'error.main' }}
              >
                {isProcessing ? <CircularProgress size={16} /> : <DeleteIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Stack>
        </ListItemSecondaryAction>
      </ListItem>
    );
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      PaperProps={{
        sx: {
          width: 420,
          maxHeight: 600,
          border: '1px solid rgba(0,0,0,0.1)',
          borderRadius: 2,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
        }
      }}
    >
      <Box>
        {/* Header */}
        <Box sx={{ 
          p: 2.5, 
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          bgcolor: '#fafbfd'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <NotificationsIcon sx={{ color: '#8b6cbc' }} />
              Notifications
            </Typography>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Refresh">
                <IconButton size="small" onClick={refresh} disabled={isLoading}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Close">
                <IconButton size="small" onClick={onClose}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {showAll 
                  ? `Showing ${displayNotifications.length} notifications`
                  : unreadCount > 0 
                    ? `${unreadCount} unread notifications` 
                    : 'All caught up!'
                }
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setShowAll(!showAll)}
                sx={{ 
                  textTransform: 'none',
                  color: '#8b6cbc',
                  borderColor: '#8b6cbc',
                  fontSize: '0.7rem',
                  py: 0.25,
                  px: 1,
                  minWidth: 'auto'
                }}
              >
                {showAll ? 'Unread' : 'All'}
              </Button>
            </Box>
            {unreadCount > 0 && !showAll && (
              <Button
                size="small"
                onClick={handleMarkAllAsRead}
                sx={{ 
                  textTransform: 'none',
                  color: '#8b6cbc',
                  fontSize: '0.8rem'
                }}
              >
                Mark all as read
              </Button>
            )}
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ maxHeight: 450, overflow: 'auto' }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ m: 2 }}>
              {error}
            </Alert>
          ) : displayNotifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <NotificationsIcon sx={{ fontSize: 48, color: '#cbd5e0', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {showAll ? 'No notifications yet' : 'No unread notifications'}
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {displayNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  {renderNotification(notification)}
                  {index < displayNotifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      </Box>
    </Menu>
  );
}
