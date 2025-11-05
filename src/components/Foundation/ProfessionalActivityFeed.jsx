'use client';

import React, { memo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Divider,
  alpha,
  useTheme,
  Collapse,
  Badge
} from '@mui/material';
import {
  MonetizationOn as MoneyIcon,
  Campaign as CampaignIcon,
  Assignment as GrantIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  Notifications as NotificationIcon,
  ExpandMore as ExpandMoreIcon,
  Launch as LaunchIcon,
  Schedule as ScheduleIcon,
  PriorityHigh as PriorityIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const ActivityItem = memo(({ activity, index }) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  const getActivityIcon = (type) => {
    const iconMap = {
      donation: MoneyIcon,
      campaign: CampaignIcon,
      grant: GrantIcon,
      volunteer: PersonIcon,
      milestone: TrendingUpIcon,
      notification: NotificationIcon
    };
    return iconMap[type] || NotificationIcon;
  };

  const getActivityColor = (type) => {
    const colorMap = {
      donation: '#4caf50',
      campaign: '#8b6cbc',
      grant: '#ff9800',
      volunteer: '#2196f3',
      milestone: '#9c27b0',
      notification: '#607d8b'
    };
    return colorMap[type] || '#607d8b';
  };

  const ActivityIcon = getActivityIcon(activity.type);
  const activityColor = getActivityColor(activity.type);
  
  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" spacing={2} alignItems="flex-start">
        {/* Activity Icon */}
        <Badge
          badgeContent={activity.urgent ? <PriorityIcon sx={{ fontSize: 12 }} /> : null}
          color="error"
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <Avatar
            sx={{
              width: 48,
              height: 48,
              backgroundColor: alpha(activityColor, 0.1),
              color: activityColor,
              border: `2px solid ${alpha(activityColor, 0.2)}`,
              boxShadow: `0 4px 12px ${alpha(activityColor, 0.2)}`
            }}
          >
            <ActivityIcon sx={{ fontSize: 24 }} />
          </Avatar>
        </Badge>

        {/* Activity Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ 
                fontWeight: 600, 
                color: theme.palette.text.primary,
                fontSize: '1rem',
                mb: 0.5
              }}>
                {activity.title}
              </Typography>
              <Typography variant="body2" sx={{ 
                color: theme.palette.text.secondary,
                fontSize: '0.875rem',
                lineHeight: 1.4
              }}>
                {activity.description}
              </Typography>
            </Box>
            
            <Stack direction="row" alignItems="center" spacing={1}>
              {activity.amount && (
                <Chip
                  label={new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  }).format(activity.amount)}
                  size="small"
                  color={activity.type === 'donation' ? 'success' : 'primary'}
                  sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                />
              )}
              
              <Tooltip title="View details">
                <IconButton 
                  size="small" 
                  onClick={() => setExpanded(!expanded)}
                  sx={{
                    color: theme.palette.text.secondary,
                    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease'
                  }}
                >
                  <ExpandMoreIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          {/* Time and Status */}
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <ScheduleIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
              <Typography variant="caption" sx={{ 
                color: theme.palette.text.secondary,
                fontSize: '0.75rem'
              }}>
                {dayjs(activity.timestamp).fromNow()}
              </Typography>
            </Stack>

            {activity.status && (
              <Chip
                label={activity.status}
                size="small"
                variant="outlined"
                color={activity.status === 'completed' ? 'success' : 
                       activity.status === 'pending' ? 'warning' : 'default'}
                sx={{ 
                  height: 20, 
                  fontSize: '0.65rem',
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            )}
          </Stack>

          {/* Expanded Details */}
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ 
              mt: 2, 
              p: 2, 
              backgroundColor: alpha(activityColor, 0.02),
              borderRadius: 2,
              border: `1px solid ${alpha(activityColor, 0.1)}`
            }}>
              {activity.details && (
                <Stack spacing={1}>
                  {activity.details.map((detail, idx) => (
                    <Stack key={idx} direction="row" justifyContent="space-between">
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        {detail.label}:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {detail.value}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              )}
              
              {activity.actionUrl && (
                <Button
                  size="small"
                  endIcon={<LaunchIcon />}
                  sx={{ mt: 2 }}
                  onClick={() => window.open(activity.actionUrl)}
                >
                  View Details
                </Button>
              )}
            </Box>
          </Collapse>
        </Box>
      </Stack>
    </Box>
  );
});

const ProfessionalActivityFeed = memo(({ activities = [], loading = false, maxItems = 8 }) => {
  const theme = useTheme();
  const [showAll, setShowAll] = useState(false);

  const defaultActivities = [
    {
      id: 1,
      type: 'donation',
      title: 'Major Gift Received',
      description: 'Anonymous donor contributed to Medical Research Fund',
      amount: 25000,
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      status: 'completed',
      urgent: true,
      details: [
        { label: 'Campaign', value: 'Medical Research Fund' },
        { label: 'Payment Method', value: 'Wire Transfer' },
        { label: 'Tax Receipt', value: 'Generated' }
      ],
      actionUrl: '/foundation/donations'
    },
    {
      id: 2,
      type: 'campaign',
      title: 'Campaign Milestone Reached',
      description: 'Community Health Initiative reached 80% of funding goal',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      status: 'active',
      details: [
        { label: 'Target Amount', value: '$50,000' },
        { label: 'Current Amount', value: '$40,000' },
        { label: 'Days Remaining', value: '15 days' }
      ],
      actionUrl: '/foundation/campaigns'
    },
    {
      id: 3,
      type: 'grant',
      title: 'Grant Application Submitted',
      description: 'NIH Research Grant application submitted successfully',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      status: 'pending',
      details: [
        { label: 'Grant Amount', value: '$150,000' },
        { label: 'Application ID', value: 'NIH-2024-001' },
        { label: 'Review Period', value: '60 days' }
      ],
      actionUrl: '/foundation/grants'
    },
    {
      id: 4,
      type: 'volunteer',
      title: 'New Volunteer Registration',
      description: 'Dr. Emily Chen registered as medical research volunteer',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
      status: 'completed',
      details: [
        { label: 'Specialty', value: 'Cardiology' },
        { label: 'Experience', value: '10+ years' },
        { label: 'Availability', value: 'Weekends' }
      ],
      actionUrl: '/foundation/volunteers'
    },
    {
      id: 5,
      type: 'milestone',
      title: 'Monthly Funding Goal Achieved',
      description: 'Foundation exceeded monthly funding target by 15%',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
      status: 'completed',
      details: [
        { label: 'Target', value: '$100,000' },
        { label: 'Achieved', value: '$115,000' },
        { label: 'Growth', value: '+15%' }
      ]
    },
    {
      id: 6,
      type: 'notification',
      title: 'System Maintenance Complete',
      description: 'Database optimization and security updates completed',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
      status: 'completed'
    }
  ];

  const displayActivities = activities.length > 0 ? activities : defaultActivities;
  const visibleActivities = showAll ? displayActivities : displayActivities.slice(0, maxItems);

  if (loading) {
    return (
      <Card sx={{ borderRadius: 4, height: 600 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Loading activities...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ 
      borderRadius: 4,
      border: '1px solid rgba(139, 108, 188, 0.08)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
    }}>
      <CardContent sx={{ p: 4 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h6" sx={{ 
              fontWeight: 700,
              color: theme.palette.text.primary,
              fontSize: '1.3rem'
            }}>
              Recent Activities
            </Typography>
            <Typography variant="body2" sx={{ 
              color: theme.palette.text.secondary,
              fontSize: '0.9rem'
            }}>
              Latest foundation updates and milestones
            </Typography>
          </Box>

          <Badge 
            badgeContent={displayActivities.filter(a => a.urgent).length} 
            color="error"
          >
            <NotificationIcon sx={{ color: '#8b6cbc' }} />
          </Badge>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        {/* Activities List */}
        <Box sx={{ maxHeight: 500, overflowY: 'auto' }}>
          {visibleActivities.map((activity, index) => (
            <ActivityItem 
              key={activity.id} 
              activity={activity} 
              index={index}
            />
          ))}
        </Box>

        {/* Show More/Less Button */}
        {displayActivities.length > maxItems && (
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={() => setShowAll(!showAll)}
              sx={{
                borderRadius: 3,
                px: 3,
                borderColor: alpha('#8b6cbc', 0.3),
                color: '#8b6cbc',
                '&:hover': {
                  borderColor: '#8b6cbc',
                  backgroundColor: alpha('#8b6cbc', 0.05)
                }
              }}
            >
              {showAll ? 'Show Less' : `Show ${displayActivities.length - maxItems} More`}
            </Button>
          </Box>
        )}

        {/* Empty State */}
        {displayActivities.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <NotificationIcon sx={{ 
              fontSize: 64, 
              color: theme.palette.text.secondary,
              opacity: 0.5,
              mb: 2
            }} />
            <Typography variant="h6" sx={{ 
              color: theme.palette.text.secondary,
              fontWeight: 600
            }}>
              No Recent Activities
            </Typography>
            <Typography variant="body2" sx={{ 
              color: theme.palette.text.secondary,
              mt: 1
            }}>
              Foundation activities will appear here as they happen
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
});

ActivityItem.displayName = 'ActivityItem';
ProfessionalActivityFeed.displayName = 'ProfessionalActivityFeed';

export default ProfessionalActivityFeed;
