'use client';

import React, { memo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Stack,
  IconButton,
  Tooltip,
  Chip,
  Badge,
  alpha,
  useTheme,
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Campaign as CampaignIcon,
  MonetizationOn as DonationIcon,
  Assignment as GrantIcon,
  People as VolunteerIcon,
  Assessment as ReportIcon,
  Settings as SettingsIcon,
  Notifications as NotificationIcon,
  Launch as LaunchIcon,
  TrendingUp as AnalyticsIcon,
  Email as EmailIcon,
  Event as EventIcon,
  Share as ShareIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

const ActionCard = memo(({ action, onClick, featured = false }) => {
  const theme = useTheme();
  const [hovered, setHovered] = useState(false);

  return (
    <Card
      onClick={() => onClick?.(action)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        borderRadius: featured ? 4 : 3,
        height: featured ? 160 : 140,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        background: featured 
          ? `linear-gradient(135deg, ${action.color}15 0%, ${action.color}05 100%)`
          : `linear-gradient(135deg, ${action.color}08 0%, ${action.color}03 100%)`,
        border: `1px solid ${alpha(action.color, featured ? 0.2 : 0.1)}`,
        boxShadow: hovered 
          ? `0 12px 40px ${alpha(action.color, 0.15)}`
          : `0 4px 20px ${alpha(action.color, 0.05)}`,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: hovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: featured ? '6px' : '4px',
          background: `linear-gradient(90deg, ${action.color}, ${alpha(action.color, 0.6)})`,
          opacity: hovered ? 1 : 0.7,
          transition: 'opacity 0.3s ease'
        }
      }}
    >
      <CardContent sx={{ 
        p: featured ? 4 : 3, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Badge for featured actions */}
        {action.badge && (
          <Badge
            badgeContent={action.badge}
            color={action.badgeColor || 'primary'}
            sx={{
              position: 'absolute',
              top: featured ? 16 : 12,
              right: featured ? 16 : 12,
              '& .MuiBadge-badge': {
                fontSize: '0.65rem',
                height: 18,
                minWidth: 18
              }
            }}
          >
            <div />
          </Badge>
        )}

        {/* Icon */}
        <Box
          sx={{
            width: featured ? 56 : 48,
            height: featured ? 56 : 48,
            borderRadius: featured ? 3.5 : 3,
            background: `linear-gradient(135deg, ${action.color}, ${alpha(action.color, 0.8)})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 8px 24px ${alpha(action.color, 0.25)}`,
            mb: 2,
            transition: 'all 0.3s ease',
            transform: hovered ? 'scale(1.1)' : 'scale(1)'
          }}
        >
          <action.icon sx={{ 
            fontSize: featured ? 28 : 24, 
            color: 'white' 
          }} />
        </Box>

        {/* Title */}
        <Typography 
          variant={featured ? "h6" : "subtitle1"}
          sx={{ 
            fontWeight: 700, 
            color: theme.palette.text.primary,
            fontSize: featured ? '1.1rem' : '1rem',
            mb: 0.5,
            lineHeight: 1.2
          }}
        >
          {action.title}
        </Typography>

        {/* Description */}
        <Typography 
          variant="caption" 
          sx={{ 
            color: theme.palette.text.secondary,
            fontSize: featured ? '0.8rem' : '0.75rem',
            lineHeight: 1.3
          }}
        >
          {action.description}
        </Typography>

        {/* Quick indicator for urgent actions */}
        {action.urgent && (
          <Chip
            label="Urgent"
            size="small"
            color="error"
            sx={{
              position: 'absolute',
              bottom: featured ? 16 : 12,
              right: featured ? 16 : 12,
              height: 20,
              fontSize: '0.65rem',
              fontWeight: 600
            }}
          />
        )}
      </CardContent>
    </Card>
  );
});

const ProfessionalQuickActions = memo(({ onActionClick, customActions = [] }) => {
  const theme = useTheme();

  const defaultActions = [
    {
      id: 'create-campaign',
      title: 'Create Campaign',
      description: 'Start a new fundraising campaign',
      icon: CampaignIcon,
      color: '#8b6cbc',
      featured: true,
      action: () => console.log('Create campaign')
    },
    {
      id: 'process-donation',
      title: 'Process Donation',
      description: 'Record new donation',
      icon: DonationIcon,
      color: '#4caf50',
      badge: '5',
      badgeColor: 'success',
      action: () => console.log('Process donation')
    },
    {
      id: 'apply-grant',
      title: 'Grant Application',
      description: 'Submit grant proposal',
      icon: GrantIcon,
      color: '#ff9800',
      urgent: true,
      action: () => console.log('Apply for grant')
    },
    {
      id: 'manage-volunteers',
      title: 'Manage Volunteers',
      description: 'Review volunteer applications',
      icon: VolunteerIcon,
      color: '#2196f3',
      badge: '12',
      badgeColor: 'info',
      action: () => console.log('Manage volunteers')
    },
    {
      id: 'generate-report',
      title: 'Generate Reports',
      description: 'Create financial reports',
      icon: ReportIcon,
      color: '#9c27b0',
      action: () => console.log('Generate report')
    },
    {
      id: 'view-analytics',
      title: 'View Analytics',
      description: 'Detailed performance metrics',
      icon: AnalyticsIcon,
      color: '#607d8b',
      featured: true,
      action: () => window.open('/foundation/donations-analytics', '_blank')
    },
    {
      id: 'schedule-event',
      title: 'Schedule Event',
      description: 'Plan fundraising event',
      icon: EventIcon,
      color: '#795548',
      action: () => console.log('Schedule event')
    },
    {
      id: 'send-newsletter',
      title: 'Send Newsletter',
      description: 'Donor communication',
      icon: EmailIcon,
      color: '#e91e63',
      action: () => console.log('Send newsletter')
    },
    {
      id: 'settings',
      title: 'Foundation Settings',
      description: 'Configure foundation parameters',
      icon: SettingsIcon,
      color: '#424242',
      action: () => console.log('Open settings')
    }
  ];

  const allActions = [...defaultActions, ...customActions];
  const featuredActions = allActions.filter(action => action.featured);
  const regularActions = allActions.filter(action => !action.featured);

  const handleActionClick = (action) => {
    if (onActionClick) {
      onActionClick(action);
    } else if (action.action) {
      action.action();
    }
  };

  return (
    <Box>
      {/* Featured Actions */}
      {featuredActions.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700, 
              mb: 3,
              color: theme.palette.text.primary,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <AddIcon sx={{ color: '#8b6cbc' }} />
            Quick Actions
          </Typography>
          
          <Grid container spacing={3}>
            {featuredActions.map((action) => (
              <Grid item xs={12} md={6} key={action.id}>
                <ActionCard 
                  action={action} 
                  onClick={handleActionClick}
                  featured={true}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Regular Actions */}
      <Box>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 700, 
            mb: 3,
            color: theme.palette.text.primary,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <SettingsIcon sx={{ color: '#8b6cbc' }} />
          Management Tools
        </Typography>
        
        <Grid container spacing={2}>
          {regularActions.map((action) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={action.id}>
              <ActionCard 
                action={action} 
                onClick={handleActionClick}
                featured={false}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Floating Action Button for most common action */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          backgroundColor: '#8b6cbc',
          color: 'white',
          '&:hover': {
            backgroundColor: '#7a5ba8',
            transform: 'scale(1.1)'
          },
          transition: 'all 0.3s ease',
          boxShadow: '0 8px 32px rgba(139, 108, 188, 0.3)',
          zIndex: 1000
        }}
        onClick={() => handleActionClick(defaultActions[0])}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
});

ActionCard.displayName = 'ActionCard';
ProfessionalQuickActions.displayName = 'ProfessionalQuickActions';

export default ProfessionalQuickActions;
