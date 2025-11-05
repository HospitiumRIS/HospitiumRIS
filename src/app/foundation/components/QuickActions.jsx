'use client';

import React from 'react';
import {
  Card,
  Typography,
  Grid,
  Button,
  Stack,
} from '@mui/material';
import {
  Campaign as CampaignIcon,
  Assignment as GrantIcon,
  Assessment as AssessmentIcon,
  AttachMoney as MoneyIcon,
  Group as GroupIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';

const QuickActions = () => {
  const actions = [
    {
      label: 'New Campaign',
      icon: <CampaignIcon />,
      variant: 'contained',
      color: '#8b6cbc',
      hoverColor: '#7a5ba8',
    },
    {
      label: 'Grant Opportunities',
      icon: <GrantIcon />,
      variant: 'outlined',
      color: '#8b6cbc',
    },
    {
      label: 'Analytics Report',
      icon: <AssessmentIcon />,
      variant: 'outlined',
      color: '#2e7d32',
    },
    {
      label: 'Manage Funds',
      icon: <MoneyIcon />,
      variant: 'outlined',
      color: '#ff9800',
    },
    {
      label: 'Donor Management',
      icon: <GroupIcon />,
      variant: 'outlined',
      color: '#1976d2',
    },
    {
      label: 'Performance Insights',
      icon: <AnalyticsIcon />,
      variant: 'outlined',
      color: '#8b6cbc',
    },
  ];

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 3, p: 4 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, fontSize: '1.25rem' }}>
        Quick Actions & Navigation
      </Typography>
      <Grid container spacing={2}>
        {actions.map((action, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
            <Button
              variant={action.variant}
              fullWidth
              startIcon={action.icon}
              sx={{ 
                py: 1.5,
                px: 2,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.875rem',
                ...(action.variant === 'contained' ? {
                  backgroundColor: action.color,
                  '&:hover': { 
                    backgroundColor: action.hoverColor || action.color,
                    transform: 'translateY(-1px)',
                    boxShadow: 3,
                  }
                } : {
                  borderColor: action.color, 
                  color: action.color,
                  '&:hover': {
                    borderColor: action.color,
                    backgroundColor: `${action.color}10`,
                    transform: 'translateY(-1px)',
                  }
                }),
                transition: 'all 0.3s ease',
              }}
            >
              {action.label}
            </Button>
          </Grid>
        ))}
      </Grid>
    </Card>
  );
};

export default QuickActions;
