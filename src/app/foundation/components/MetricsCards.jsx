'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Grid,
  Typography,
  Stack,
  Box,
} from '@mui/material';
import {
  MonetizationOn as MoneyIcon,
  Campaign as CampaignIcon,
  Assignment as GrantIcon,
  Group as GroupIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';

const MetricsCards = ({ dashboardData, formatCurrency }) => {
  const metrics = [
    {
      title: 'Total Funds',
      value: formatCurrency(dashboardData.totalFunds),
      icon: <MoneyIcon sx={{ fontSize: 28, color: '#8b6cbc', mb: 1 }} />,
      trend: `+${dashboardData.monthlyGrowth}%`,
      trendColor: '#2e7d32',
    },
    {
      title: 'Total Donations',
      value: formatCurrency(dashboardData.totalDonations),
      icon: <CampaignIcon sx={{ fontSize: 28, color: '#2e7d32', mb: 1 }} />,
      trend: `+${dashboardData.donationGrowth}%`,
      trendColor: '#2e7d32',
    },
    {
      title: 'Grant Opportunities',
      value: dashboardData.grantOpportunities,
      icon: <GrantIcon sx={{ fontSize: 28, color: '#ff9800', mb: 1 }} />,
      subtitle: `${dashboardData.activeGrants} active grants`,
      valueColor: '#ff9800',
    },
    {
      title: 'Total Donors',
      value: dashboardData.totalDonors,
      icon: <GroupIcon sx={{ fontSize: 28, color: '#1976d2', mb: 1 }} />,
      subtitle: 'Active contributors',
      valueColor: '#1976d2',
    },
  ];

  return (
    <Box 
      display="flex" 
      flexDirection={{ xs: 'column', md: 'row' }} 
      justifyContent="space-between" 
      gap={3} 
      sx={{ mb: 4 }}
    >
      {metrics.map((metric, index) => (
        <Box flex={1} key={index}>
          <Card 
            sx={{ 
              borderRadius: 3, 
              boxShadow: 3,
              height: 160,
              width: '100%',
              minWidth: 280,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
              }
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {metric.icon}
              <Typography 
                variant="h4" 
                fontWeight="bold" 
                sx={{ 
                  fontSize: { xs: '1.5rem', md: '2rem' },
                  color: metric.valueColor || 'inherit',
                  mb: 1
                }}
              >
                {metric.value}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" sx={{ fontSize: '1rem', mb: 1 }}>
                {metric.title}
              </Typography>
              {metric.trend && (
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                  <TrendingUpIcon sx={{ fontSize: 16, color: metric.trendColor }} />
                  <Typography variant="caption" sx={{ color: metric.trendColor, fontWeight: 600 }}>
                    {metric.trend}
                  </Typography>
                </Stack>
              )}
              {metric.subtitle && (
                <Typography variant="caption" color="text.secondary">
                  {metric.subtitle}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      ))}
    </Box>
  );
};

export default MetricsCards;
