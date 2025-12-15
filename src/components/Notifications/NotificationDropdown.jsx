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
  Group as GroupIcon,
  Check as CheckIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../../hooks/useNotifications';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
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
  const [processingIds, setProcessingIds] = useState(new Set());
  const [respondingIds, setRespondingIds] = useState(new Set());

  // Debug logging
  console.log('🔔 NotificationDropdown render:', {
    open,
    hasAnchor: !!anchorEl,
    notificationCount: notifications.length,
    unreadCount,
    isLoading,
    error
  });

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

  // Handle accepting or declining an invitation
  const handleRespondToInvitation = useCallback(async (notification, action) => {
    const invitationId = notification.data?.invitationId;
    if (!invitationId) {
      console.error('No invitation ID found in notification data');
      return;
    }

    setRespondingIds(prev => new Set([...prev, notification.id]));

    try {
      const response = await fetch(`/api/manuscripts/invitations/${invitationId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} invitation`);
      }

      // Mark the notification as read
      await markAsRead([notification.id]);

      // Refresh notifications
      refresh();

      // If accepted, optionally navigate to the manuscript
      if (action === 'accept' && data.data?.manuscriptId) {
        onClose();
        router.push(`/researcher/publications/collaborate/edit/${data.data.manuscriptId}`);
      }

    } catch (error) {
      console.error(`Failed to ${action} invitation:`, error);
      // Could show a snackbar here for user feedback
    } finally {
      setRespondingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(notification.id);
        return newSet;
      });
    }
  }, [markAsRead, refresh, onClose, router]);

  // Check if a notification is an actionable invitation
  const isActionableInvitation = (notification) => {
    return (
      notification.type === 'COLLABORATION_INVITATION' &&
      notification.data?.invitationId &&
      notification.data?.action === 'pending'
    );
  };

  const renderNotification = (notification) => {
    const typeConfig = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.SYSTEM_NOTIFICATION;
    const Icon = typeConfig.icon;
    const isProcessing = processingIds.has(notification.id);
    const isResponding = respondingIds.has(notification.id);
    const canRespond = isActionableInvitation(notification) && !notification.isRead;

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
          },
          flexDirection: 'column',
          alignItems: 'stretch'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
          <Avatar
            sx={{
              bgcolor: typeConfig.color,
              color: 'white',
              width: 40,
              height: 40,
              mr: 2,
              flexShrink: 0
            }}
          >
            <Icon sx={{ fontSize: 20 }} />
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
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
                    '& .MuiChip-label': { px: 1 },
                    flexShrink: 0
                  }}
                />
              )}
            </Box>
            
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

          <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0, ml: 1 }}>
            {!notification.isRead && !canRespond && (
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
                disabled={isProcessing || isResponding}
                sx={{ color: 'error.main' }}
              >
                {isProcessing ? <CircularProgress size={16} /> : <DeleteIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {/* Accept/Decline buttons for pending invitations */}
        {canRespond && (
          <Box sx={{ 
            display: 'flex', 
            gap: 1, 
            mt: 2, 
            pt: 2, 
            borderTop: '1px solid rgba(0,0,0,0.08)' 
          }}>
            <Button
              variant="contained"
              size="small"
              startIcon={isResponding ? <CircularProgress size={14} color="inherit" /> : <CheckIcon />}
              onClick={() => handleRespondToInvitation(notification, 'accept')}
              disabled={isResponding}
              sx={{
                bgcolor: '#4caf50',
                '&:hover': { bgcolor: '#43a047' },
                textTransform: 'none',
                fontWeight: 600,
                flex: 1
              }}
            >
              {isResponding ? 'Processing...' : 'Accept'}
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={isResponding ? <CircularProgress size={14} /> : <ClearIcon />}
              onClick={() => handleRespondToInvitation(notification, 'decline')}
              disabled={isResponding}
              sx={{
                borderColor: '#f44336',
                color: '#f44336',
                '&:hover': { 
                  borderColor: '#d32f2f',
                  bgcolor: 'rgba(244, 67, 54, 0.04)'
                },
                textTransform: 'none',
                fontWeight: 600,
                flex: 1
              }}
            >
              Decline
            </Button>
          </Box>
        )}

        {/* Show role info for invitations */}
        {notification.type === 'COLLABORATION_INVITATION' && notification.data?.role && (
          <Box sx={{ mt: 1 }}>
            <Chip
              label={`Role: ${notification.data.role}`}
              size="small"
              sx={{
                bgcolor: 'rgba(139, 108, 188, 0.1)',
                color: '#8b6cbc',
                fontSize: '0.7rem',
                height: 22
              }}
            />
          </Box>
        )}
      </ListItem>
    );
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      disableScrollLock={true}
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
