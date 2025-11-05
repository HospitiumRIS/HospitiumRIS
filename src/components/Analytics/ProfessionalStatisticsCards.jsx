'use client';

import React, { memo, useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Skeleton,
  alpha,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  useTheme
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Campaign as CampaignIcon,
  InfoOutlined as InfoIcon,
  TrendingFlat as TrendingFlatIcon
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

const formatNumber = (number) => {
  return new Intl.NumberFormat('en-US').format(number);
};

const formatPercentage = (value) => {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
};

// Professional skeleton component with flexbox
const ProfessionalStatisticsSkeleton = memo(() => (
  <Box sx={{ 
    display: 'flex', 
    gap: 3, 
    flexWrap: 'wrap',
    '& > *': { 
      flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', lg: '1 1 calc(33.333% - 16px)', xl: '1 1 calc(16.666% - 20px)' } 
    }
  }}>
    {[1, 2, 3, 4, 5, 6].map((index) => (
      <Card key={index} sx={{ 
        borderRadius: 3, 
        height: '120px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        backgroundColor: '#8b6cbc',
        color: 'white'
      }}>
        <CardContent sx={{ p: 2.5 }}>
          <Skeleton variant="rectangular" width="100%" height={80} sx={{ borderRadius: 2, bgcolor: 'rgba(255,255,255,0.1)' }} />
        </CardContent>
      </Card>
    ))}
  </Box>
));

// Enhanced statistic card component
const StatisticCard = memo(({ stat, index }) => {
  const theme = useTheme();
  const [hover, setHover] = useState(false);

  const getTrendIcon = (trend) => {
    const trendValue = parseFloat(trend.replace(/[^-\d.]/g, ''));
    if (trendValue > 0) return TrendingUpIcon;
    if (trendValue < 0) return TrendingDownIcon;
    return TrendingFlatIcon;
  };

  const getTrendColor = (trend) => {
    const trendValue = parseFloat(trend.replace(/[^-\d.]/g, ''));
    if (trendValue > 0) return '#4caf50';
    if (trendValue < 0) return '#f44336';
    return '#9e9e9e';
  };

  const TrendIcon = getTrendIcon(stat.trend);
  const trendColor = getTrendColor(stat.trend);

  return (
    <Card
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      sx={{
        borderRadius: 3,
        height: '120px',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5cac 100%)',
        border: 'none',
        boxShadow: hover 
          ? '0 6px 20px rgba(139, 108, 188, 0.3)'
          : '0 3px 12px rgba(139, 108, 188, 0.15)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        transform: hover ? 'translateY(-3px) scale(1.01)' : 'translateY(0) scale(1)',
        color: 'white',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1))',
          transition: 'all 0.3s ease'
        }
      }}
    >
      <CardContent sx={{ 
        p: 2, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between',
        position: 'relative'
      }}>
        {/* Header with icon and info */}
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 1 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'all 0.3s ease'
            }}
          >
            <stat.icon sx={{ fontSize: 20, color: 'white' }} />
          </Box>
          <Tooltip title={`More info about ${stat.title}`}>
            <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Main value */}
        <Box sx={{ mb: 1 }}>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700, 
              color: 'white',
              fontSize: '1.3rem',
              lineHeight: 1.1,
              mb: 0.25
            }}
          >
            {typeof stat.value === 'string' ? stat.value : formatNumber(stat.value)}
          </Typography>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              fontWeight: 600, 
              color: 'white',
              fontSize: '0.8rem',
              opacity: 0.9
            }}
          >
            {stat.title}
          </Typography>
        </Box>

        {/* Trend and progress */}
        <Box>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <TrendIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.9)' }} />
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 600, 
                color: 'rgba(255,255,255,0.9)',
                fontSize: '0.7rem'
              }}
            >
              {stat.trend}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.65rem'
              }}
            >
              vs last period
            </Typography>
          </Stack>
          
          {stat.progress !== undefined && (
            <Box sx={{ mt: 0.5 }}>
              <LinearProgress
                variant="determinate"
                value={stat.progress}
                sx={{
                  height: 3,
                  borderRadius: 2,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 2,
                    background: 'rgba(255,255,255,0.8)'
                  }
                }}
              />
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
});

const ProfessionalStatisticsCards = memo(({ analyticsData, loading }) => {
  const theme = useTheme();

  if (loading) {
    return <ProfessionalStatisticsSkeleton />;
  }

  const statistics = [
    {
      title: 'Total Raised',
      value: formatCurrency(analyticsData?.overview.totalAmount || 0),
      subtitle: 'Lifetime donations received',
      icon: MoneyIcon,
      color: '#4caf50',
      trend: '+12.5%',
      progress: 75
    },
    {
      title: 'Total Donations',
      value: analyticsData?.overview.totalDonations || 0,
      subtitle: 'Individual donation records',
      icon: AnalyticsIcon,
      color: '#2196f3',
      trend: '+8.3%'
    },
    {
      title: 'Unique Donors',
      value: analyticsData?.overview.uniqueDonors || 0,
      subtitle: 'Individual contributors',
      icon: PeopleIcon,
      color: '#9c27b0',
      trend: '+15.7%'
    },
    {
      title: 'Average Donation',
      value: formatCurrency(analyticsData?.overview.avgDonation || 0),
      subtitle: 'Per donation amount',
      icon: TrendingUpIcon,
      color: '#ff9800',
      trend: '+5.2%'
    },
    {
      title: 'Active Campaigns',
      value: analyticsData?.overview.campaigns || 0,
      subtitle: 'Running fundraising campaigns',
      icon: CampaignIcon,
      color: '#8b6cbc',
      trend: '+2'
    },
    {
      title: 'Retention Rate',
      value: `${analyticsData?.overview.retentionRate?.toFixed(1) || 0}%`,
      subtitle: 'Repeat donor percentage',
      icon: PeopleIcon,
      color: '#00bcd4',
      trend: '+3.8%',
      progress: analyticsData?.overview.retentionRate || 0
    }
  ];

  return (
    <Box sx={{ mb: 4 }}>
      <Typography 
        variant="h5" 
        sx={{ 
          fontWeight: 700, 
          mb: 3,
          color: theme.palette.text.primary,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <AnalyticsIcon sx={{ color: '#8b6cbc' }} />
        Key Performance Indicators
      </Typography>
      
      <Box sx={{ 
        display: 'flex', 
        gap: 3, 
        flexWrap: 'wrap',
        '& > *': { 
          flex: { 
            xs: '1 1 100%', 
            sm: '1 1 calc(50% - 12px)', 
            lg: '1 1 calc(33.333% - 16px)', 
            xl: '1 1 calc(16.666% - 20px)' 
          } 
        }
      }}>
        {statistics.map((stat, index) => (
          <StatisticCard key={index} stat={stat} index={index} />
        ))}
      </Box>
    </Box>
  );
});

StatisticCard.displayName = 'StatisticCard';
ProfessionalStatisticsSkeleton.displayName = 'ProfessionalStatisticsSkeleton';
ProfessionalStatisticsCards.displayName = 'ProfessionalStatisticsCards';

export default ProfessionalStatisticsCards;
