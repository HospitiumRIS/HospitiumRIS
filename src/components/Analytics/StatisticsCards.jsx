'use client';

import React, { memo } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  Box,
  Skeleton,
  alpha
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Campaign as CampaignIcon,
} from '@mui/icons-material';

// Utility functions
const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Skeleton component for loading state
const StatisticsSkeleton = memo(() => (
  <Grid container spacing={3}>
    {[1, 2, 3, 4, 5].map((index) => (
      <Grid item xs={12} sm={6} md={2.4} key={index}>
        <Card sx={{ borderRadius: 3, height: '140px' }}>
          <CardContent sx={{ p: 2 }}>
            <Skeleton variant="rectangular" width="100%" height={120} />
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
));

const StatisticsCards = memo(({ analyticsData, loading }) => {
  if (loading) {
    return <StatisticsSkeleton />;
  }

  const statistics = [
    {
      title: 'Total Raised',
      value: formatCurrency(analyticsData?.overview.totalAmount || 0),
      subtitle: 'lifetime donations',
      icon: MoneyIcon,
      color: '#4caf50',
      trend: '+12.5%'
    },
    {
      title: 'Total Donations',
      value: analyticsData?.overview.totalDonations || 0,
      subtitle: 'donation records',
      icon: AnalyticsIcon,
      color: '#2196f3',
      trend: '+8.3%'
    },
    {
      title: 'Unique Donors',
      value: analyticsData?.overview.uniqueDonors || 0,
      subtitle: 'individual donors',
      icon: PeopleIcon,
      color: '#9c27b0',
      trend: '+15.7%'
    },
    {
      title: 'Average Donation',
      value: formatCurrency(analyticsData?.overview.avgDonation || 0),
      subtitle: 'per donation',
      icon: TrendingUpIcon,
      color: '#ff9800',
      trend: '+5.2%'
    },
    {
      title: 'Active Campaigns',
      value: analyticsData?.overview.campaigns || 0,
      subtitle: 'fundraising campaigns',
      icon: CampaignIcon,
      color: '#8b6cbc',
      trend: '+2'
    }
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 5 }}>
      {statistics.map((stat, index) => (
        <Grid item xs={12} sm={6} md={2.4} key={index}>
          <Card
            sx={{
              borderRadius: 3,
              background: `linear-gradient(135deg, ${stat.color} 0%, ${alpha(stat.color, 0.8)} 100%)`,
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: `0 4px 20px ${alpha(stat.color, 0.3)}`,
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              height: '140px',
              '&:hover': {
                boxShadow: `0 8px 32px ${alpha(stat.color, 0.4)}`,
                transform: 'translateY(-4px)'
              }
            }}
          >
            <CardContent sx={{ 
              p: 3, 
              position: 'relative', 
              zIndex: 1, 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between' 
            }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <stat.icon sx={{ fontSize: 28, opacity: 0.9 }} />
                <Chip 
                  label={stat.trend} 
                  size="small" 
                  sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontSize: '0.7rem',
                    fontWeight: 600
                  }} 
                />
              </Stack>
              <Box>
                <Typography variant="h4" sx={{ 
                  fontWeight: 700, 
                  mb: 0.5, 
                  lineHeight: 1.1, 
                  fontSize: { xs: '1.8rem', md: '2.125rem' } 
                }}>
                  {typeof stat.value === 'string' ? stat.value : stat.value.toLocaleString()}
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9, fontWeight: 600, mb: 0.25, fontSize: '1rem' }}>
                  {stat.title}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.75rem' }}>
                  {stat.subtitle}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
});

StatisticsCards.displayName = 'StatisticsCards';

export default StatisticsCards;
