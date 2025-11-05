'use client';

import React, { memo, useState } from 'react';
import {
  Card,
  CardContent,
  Grid,
  Typography,
  Box,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  alpha,
  useTheme,
  Collapse
} from '@mui/material';
import {
  MonetizationOn as MoneyIcon,
  Campaign as CampaignIcon,
  Assignment as GrantIcon,
  Group as GroupIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  InfoOutlined as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const MetricCard = memo(({ metric, index }) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);

  const getTrendIcon = (trend) => {
    if (trend && trend.includes('+')) return TrendingUpIcon;
    if (trend && trend.includes('-')) return TrendingDownIcon;
    return TimelineIcon;
  };

  const getTrendColor = (trend) => {
    if (trend && trend.includes('+')) return '#4caf50';
    if (trend && trend.includes('-')) return '#f44336';
    return theme.palette.text.secondary;
  };

  const TrendIcon = getTrendIcon(metric.trend);
  const trendColor = getTrendColor(metric.trend);

  return (
    <Card
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        borderRadius: 4,
        height: expanded ? 'auto' : '200px',
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${metric.color}08 0%, ${metric.color}03 100%)`,
        border: `1px solid ${alpha(metric.color, 0.12)}`,
        boxShadow: hovered 
          ? `0 12px 40px ${alpha(metric.color, 0.15)}`
          : `0 4px 20px ${alpha(metric.color, 0.08)}`,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: hovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
        cursor: 'pointer',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '6px',
          background: `linear-gradient(90deg, ${metric.color}, ${alpha(metric.color, 0.6)})`,
          opacity: hovered ? 1 : 0.7,
          transition: 'opacity 0.3s ease'
        }
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <CardContent sx={{ 
        p: 4, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between',
        position: 'relative'
      }}>
        {/* Header */}
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 3.5,
              background: `linear-gradient(135deg, ${metric.color}, ${alpha(metric.color, 0.8)})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 8px 24px ${alpha(metric.color, 0.3)}`,
              transition: 'all 0.3s ease'
            }}
          >
            <metric.icon sx={{ fontSize: 28, color: 'white' }} />
          </Box>
          
          <Stack direction="row" spacing={0.5}>
            <Tooltip title={`More details about ${metric.title}`}>
              <IconButton size="small" sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}>
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <IconButton 
              size="small" 
              sx={{ 
                opacity: 0.6, 
                '&:hover': { opacity: 1 },
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease'
              }}
            >
              <ExpandMoreIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>

        {/* Main Value */}
        <Box sx={{ mb: 2 }}>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 900, 
              color: metric.color,
              fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' },
              lineHeight: 1.1,
              mb: 1,
              textShadow: `0 2px 4px ${alpha(metric.color, 0.1)}`
            }}
          >
            {metric.value}
          </Typography>
          
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600, 
              color: theme.palette.text.primary,
              fontSize: '1.1rem',
              mb: 0.5
            }}
          >
            {metric.title}
          </Typography>
          
          {metric.subtitle && (
            <Typography 
              variant="body2" 
              sx={{ 
                color: theme.palette.text.secondary,
                fontSize: '0.875rem'
              }}
            >
              {metric.subtitle}
            </Typography>
          )}
        </Box>

        {/* Trend and Progress */}
        <Box>
          {metric.trend && (
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <TrendIcon sx={{ fontSize: 18, color: trendColor }} />
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 700, 
                  color: trendColor,
                  fontSize: '0.875rem'
                }}
              >
                {metric.trend}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem'
                }}
              >
                {metric.period || 'vs last month'}
              </Typography>
            </Stack>
          )}
          
          {metric.progress !== undefined && (
            <Box sx={{ mb: 1 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
                  Progress to Goal
                </Typography>
                <Typography variant="caption" sx={{ color: metric.color, fontWeight: 600, fontSize: '0.75rem' }}>
                  {metric.progress.toFixed(0)}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={metric.progress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: alpha(metric.color, 0.1),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    background: `linear-gradient(90deg, ${metric.color}, ${alpha(metric.color, 0.7)})`
                  }
                }}
              />
            </Box>
          )}

          {metric.badges && (
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {metric.badges.map((badge, idx) => (
                <Chip
                  key={idx}
                  label={badge.label}
                  size="small"
                  color={badge.color || 'default'}
                  variant={badge.variant || 'filled'}
                  sx={{ 
                    fontSize: '0.7rem', 
                    height: 20,
                    '& .MuiChip-label': { px: 1 }
                  }}
                />
              ))}
            </Stack>
          )}
        </Box>

        {/* Expanded Content */}
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box sx={{ pt: 3, mt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            {metric.details && metric.details.map((detail, idx) => (
              <Stack key={idx} direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  {detail.label}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                  {detail.value}
                </Typography>
              </Stack>
            ))}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
});

const ProfessionalMetricsCards = memo(({ dashboardData, loading = false }) => {
  const theme = useTheme();

  const metrics = [
    {
      title: 'Total Funds Raised',
      value: formatCurrency(dashboardData.totalFunds || 0),
      subtitle: 'All-time fundraising total',
      icon: MoneyIcon,
      color: '#4caf50',
      trend: `+${dashboardData.monthlyGrowth || 0}%`,
      period: 'vs last month',
      progress: 78,
      badges: [
        { label: 'Growing', color: 'success' },
        { label: 'On Track', color: 'info', variant: 'outlined' }
      ],
      details: [
        { label: 'This Month', value: formatCurrency(45000) },
        { label: 'Last Month', value: formatCurrency(38000) },
        { label: 'Average Monthly', value: formatCurrency(42000) }
      ]
    },
    {
      title: 'Active Campaigns',
      value: dashboardData.activeCampaigns || 0,
      subtitle: `${dashboardData.totalCampaigns || 0} total campaigns`,
      icon: CampaignIcon,
      color: '#8b6cbc',
      trend: '+2',
      period: 'new this month',
      progress: 65,
      badges: [
        { label: `${dashboardData.activeCampaigns || 0} Active`, color: 'primary' },
        { label: 'High Performance', color: 'success', variant: 'outlined' }
      ],
      details: [
        { label: 'Completed', value: (dashboardData.totalCampaigns - dashboardData.activeCampaigns) || 0 },
        { label: 'Success Rate', value: '87%' },
        { label: 'Avg. Duration', value: '45 days' }
      ]
    },
    {
      title: 'Total Donors',
      value: dashboardData.totalDonors || 0,
      subtitle: 'Individual contributors',
      icon: GroupIcon,
      color: '#2196f3',
      trend: `+${dashboardData.donationGrowth || 0}%`,
      period: 'growth rate',
      progress: 45,
      badges: [
        { label: 'Growing', color: 'info' },
        { label: '12 New', color: 'success', variant: 'outlined' }
      ],
      details: [
        { label: 'Repeat Donors', value: '65%' },
        { label: 'New This Month', value: '12' },
        { label: 'Avg. Donation', value: formatCurrency(250) }
      ]
    },
    {
      title: 'Grant Opportunities',
      value: dashboardData.grantOpportunities || 0,
      subtitle: `${dashboardData.activeGrants || 0} active applications`,
      icon: GrantIcon,
      color: '#ff9800',
      trend: '+1',
      period: 'new opportunity',
      progress: 30,
      badges: [
        { label: 'In Review', color: 'warning' },
        { label: '2 Pending', color: 'default', variant: 'outlined' }
      ],
      details: [
        { label: 'Success Rate', value: '42%' },
        { label: 'Avg. Amount', value: formatCurrency(50000) },
        { label: 'Processing Time', value: '28 days' }
      ]
    }
  ];

  if (loading) {
    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[1, 2, 3, 4].map((index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <Card sx={{ height: 200, borderRadius: 4 }}>
              <CardContent sx={{ p: 4, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Loading...
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Box sx={{ mb: 5 }}>
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
        <MoneyIcon sx={{ color: '#8b6cbc' }} />
        Foundation Performance Metrics
      </Typography>
      
      <Grid container spacing={3}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <MetricCard metric={metric} index={index} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
});

MetricCard.displayName = 'MetricCard';
ProfessionalMetricsCards.displayName = 'ProfessionalMetricsCards';

export default ProfessionalMetricsCards;
