'use client';

import { useTranslation } from 'react-i18next';
import React, { memo, useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  useTheme,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  CalendarToday as CalendarIcon,
  Analytics as AnalyticsIcon,
  Insights as InsightsIcon,
  ShowChart as ShowChartIcon,
  Assessment as AssessmentIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';

const TrendAnalytics = memo(({ analyticsData, loading }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [timeframe, setTimeframe] = useState('12months');
  const [metric, setMetric] = useState('donations');

  // Utility functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  const getTrendIcon = (trend) => {
    if (trend > 5) return TrendingUpIcon;
    if (trend < -5) return TrendingDownIcon;
    return TrendingFlatIcon;
  };

  const getTrendColor = (trend) => {
    if (trend > 5) return '#4caf50';
    if (trend < -5) return '#f44336';
    return '#ff9800';
  };

  const getMonthName = (monthIndex) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthIndex];
  };

  // Process monthly trends data
  const monthlyTrends = useMemo(() => {
    if (!analyticsData?.monthlyTrends) return [];
    
    return analyticsData.monthlyTrends.map((month, index) => {
      const prevMonth = index > 0 ? analyticsData.monthlyTrends[index - 1] : null;
      const monthlyGrowth = (prevMonth && prevMonth.total_amount > 0) ? 
        ((month.total_amount - prevMonth.total_amount) / prevMonth.total_amount * 100) : 0;
      const donorGrowth = (prevMonth && prevMonth.donor_count > 0) ? 
        ((month.donor_count - prevMonth.donor_count) / prevMonth.donor_count * 100) : 0;

      return {
        ...month,
        monthName: getMonthName(month.month - 1),
        monthlyGrowth: Number(monthlyGrowth.toFixed(2)),
        donorGrowth: Number(donorGrowth.toFixed(2)),
        avgDonation: (month.total_donations > 0) ? Number((month.total_amount / month.total_donations).toFixed(2)) : 0
      };
    });
  }, [analyticsData?.monthlyTrends]);

  // Calculate trend statistics
  const trendStatistics = useMemo(() => {
    if (!monthlyTrends.length) return {
      overallGrowth: 0,
      avgMonthlyDonations: 0,
      peakMonth: null,
      strongestGrowthMonth: null,
      recentTrends: []
    };

    const recentTrends = monthlyTrends.slice(-3); // Last 3 months
    const overallGrowth = (monthlyTrends.length >= 2 && monthlyTrends[0].total_amount > 0) ? 
      Number(((monthlyTrends[monthlyTrends.length - 1].total_amount - monthlyTrends[0].total_amount) / 
       monthlyTrends[0].total_amount * 100).toFixed(2)) : 0;

    const avgMonthlyDonations = Number((monthlyTrends.reduce((sum, month) => 
      sum + month.total_amount, 0) / monthlyTrends.length).toFixed(2));

    const peakMonth = monthlyTrends.reduce((peak, month) => 
      month.total_amount > peak.total_amount ? month : peak, monthlyTrends[0]);

    const strongestGrowthMonth = monthlyTrends.reduce((strongest, month) => 
      month.monthlyGrowth > strongest.monthlyGrowth ? month : strongest, monthlyTrends[0]);

    return {
      overallGrowth,
      avgMonthlyDonations,
      peakMonth,
      strongestGrowthMonth,
      recentTrends
    };
  }, [monthlyTrends]);

  // Loading skeleton
  const TrendSkeleton = () => (
    <Box>
      {[1, 2, 3].map(i => (
        <Card key={i} sx={{ mb: 2, borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Skeleton variant="rectangular" width="100%" height={100} />
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  if (loading) {
    return (
      <Box>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
          <Skeleton variant="circular" width={32} height={32} />
          <Box>
            <Skeleton variant="text" width={200} height={40} />
            <Skeleton variant="text" width={350} height={25} />
          </Box>
        </Stack>
        <TrendSkeleton />
      </Box>
    );
  }

  if (!analyticsData?.monthlyTrends || analyticsData.monthlyTrends.length === 0) {
    return (
      <Box>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
          <TimelineIcon sx={{ fontSize: 32, color: '#8b6cbc' }} />
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 800, 
              color: theme.palette.text.primary,
              mb: 0.5
            }}>
              {t('analytics.trend_analytics')}
            </Typography>
            <Typography variant="body1" sx={{ 
              color: theme.palette.text.secondary
            }}>
              {t('analytics.trend_analytics_desc')}
            </Typography>
          </Box>
        </Stack>

        <Alert severity="info" sx={{ borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>{t('analytics.no_trend_data_title')}</Typography>
          <Typography>
            {t('analytics.no_trend_data_desc')}
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Page Title */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <TimelineIcon sx={{ fontSize: 32, color: '#8b6cbc' }} />
        <Box>
          <Typography variant="h4" sx={{ 
            fontWeight: 800, 
            color: theme.palette.text.primary,
            mb: 0.5
          }}>
            {t('analytics.trend_analytics')}
          </Typography>
          <Typography variant="body1" sx={{ 
            color: theme.palette.text.secondary
          }}>
            {t('analytics.trend_analytics_desc')}
          </Typography>
        </Box>
      </Stack>

      {/* Trend Overview Statistics */}
      <Box sx={{ 
        display: 'flex', 
        gap: 3, 
        mb: 4,
        flexWrap: 'wrap',
        '& > *': { 
          flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', lg: '1 1 calc(25% - 18px)' } 
        }
      }}>
        {[
          {
            title: t('analytics.overall_growth'),
            value: formatPercentage(trendStatistics.overallGrowth),
            icon: getTrendIcon(trendStatistics.overallGrowth),
            iconColor: getTrendColor(trendStatistics.overallGrowth),
            color: getTrendColor(trendStatistics.overallGrowth),
            subtitle: t('analytics.year_over_year')
          },
          {
            title: t('analytics.peak_month'),
            value: trendStatistics.peakMonth?.monthName || t('common.not_available'),
            subtitle: trendStatistics.peakMonth ? formatCurrency(trendStatistics.peakMonth.total_amount) : '',
            icon: CalendarIcon,
            color: '#ff9800'
          },
          {
            title: t('analytics.monthly_average'),
            value: formatCurrency(trendStatistics.avgMonthlyDonations),
            icon: AssessmentIcon,
            color: '#2196f3'
          },
          {
            title: t('analytics.best_growth'),
            value: trendStatistics.strongestGrowthMonth?.monthName || t('common.not_available'),
            subtitle: trendStatistics.strongestGrowthMonth ? 
              t('analytics.growth_label', { percent: formatPercentage(trendStatistics.strongestGrowthMonth.monthlyGrowth) }) : '',
            icon: SpeedIcon,
            color: '#4caf50'
          }
        ].map((stat, index) => (
          <Card key={index} sx={{
        borderRadius: 3,
            height: '120px',
            background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5cac 100%)',
            color: 'white',
            boxShadow: '0 3px 12px rgba(139, 108, 188, 0.15)',
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: '0 6px 20px rgba(139, 108, 188, 0.3)'
            },
            transition: 'all 0.3s ease'
          }}>
            <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <stat.icon sx={{ fontSize: 20, color: 'white' }} />
                </Box>
              </Stack>
              
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.25, fontSize: '1rem' }}>
                  {stat.value}
                </Typography>
                {stat.subtitle && (
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.8, display: 'block' }}>
                    {stat.subtitle}
                  </Typography>
                )}
                <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', opacity: 0.9 }}>
                  {stat.title}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Controls */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 4, 
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>{t('analytics.timeframe')}</InputLabel>
          <Select
            value={timeframe}
            label={t('analytics.timeframe')}
            onChange={(e) => setTimeframe(e.target.value)}
          >
            <MenuItem value="6months">{t('analytics.last_6_months')}</MenuItem>
            <MenuItem value="12months">{t('analytics.last_12_months')}</MenuItem>
            <MenuItem value="24months">{t('analytics.last_24_months')}</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>{t('analytics.metric')}</InputLabel>
          <Select
            value={metric}
            label={t('analytics.metric')}
            onChange={(e) => setMetric(e.target.value)}
          >
            <MenuItem value="donations">{t('analytics.donation_amount')}</MenuItem>
            <MenuItem value="count">{t('analytics.donation_count')}</MenuItem>
            <MenuItem value="donors">{t('analytics.unique_donors')}</MenuItem>
            <MenuItem value="average">{t('analytics.average_donation')}</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Main Content */}
      <Box sx={{ 
        display: 'flex', 
        gap: 4,
        flexDirection: { xs: 'column', lg: 'row' }
      }}>
        {/* Monthly Trends */}
        <Card sx={{ borderRadius: 3, flex: { xs: 1, lg: 2 } }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
              <ShowChartIcon sx={{ color: '#8b6cbc' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {t('analytics.monthly_trends')}
              </Typography>
            </Stack>

            <Box sx={{ overflowX: 'auto' }}>
              {monthlyTrends.map((month, index) => (
                <Box key={month.month} sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  py: 2, 
                  borderBottom: index < monthlyTrends.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none'
                }}>
                  <Box sx={{ minWidth: 80 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {month.monthName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {month.year || '2024'}
                    </Typography>
                  </Box>

                  <Box sx={{ flex: 1, mx: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(month.total_amount)}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        {React.createElement(getTrendIcon(month.monthlyGrowth), { 
                          sx: { color: getTrendColor(month.monthlyGrowth), fontSize: 20 }
                        })}
                        <Typography variant="caption" sx={{ 
                          color: getTrendColor(month.monthlyGrowth),
                          fontWeight: 600 
                        }}>
                          {month.monthlyGrowth !== 0 ? formatPercentage(month.monthlyGrowth) : t('common.not_available')}
                        </Typography>
                      </Stack>
                    </Box>

                    <LinearProgress
                      variant="determinate"
                      value={trendStatistics.peakMonth ? 
                        (month.total_amount / trendStatistics.peakMonth.total_amount * 100) : 0}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: 'rgba(139, 108, 188, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: '#8b6cbc',
                          borderRadius: 3
                        }
                      }}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {t('analytics.donations_donors_count', { donations: month.total_donations })}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('analytics.donors_count_label', { count: month.donor_count })}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Trend Insights */}
        <Card sx={{ borderRadius: 3, flex: { xs: 1, lg: 1 } }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
              <InsightsIcon sx={{ color: '#8b6cbc' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {t('analytics.trend_insights')}
              </Typography>
            </Stack>

            <List sx={{ p: 0 }}>
              {/* Recent Trends */}
              <ListItem sx={{ px: 0, flexDirection: 'column', alignItems: 'stretch' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  {t('analytics.recent_performance')}
          </Typography>
          
                {trendStatistics.recentTrends?.slice(0, 3).map((month, index) => (
                  <Box key={month.month} sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    py: 1,
                    px: 2,
                    borderRadius: 2,
                    backgroundColor: index === trendStatistics.recentTrends.length - 1 ? 
                      'rgba(139, 108, 188, 0.05)' : 'transparent',
                    mb: 1
                  }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {month.monthName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatCurrency(month.total_amount)}
                      </Typography>
                    </Box>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      {React.createElement(getTrendIcon(month.monthlyGrowth), { 
                        sx: { color: getTrendColor(month.monthlyGrowth), fontSize: 16 }
                      })}
                      <Typography variant="caption" sx={{ 
                        color: getTrendColor(month.monthlyGrowth),
                        fontWeight: 600 
                      }}>
                        {month.monthlyGrowth !== 0 ? formatPercentage(month.monthlyGrowth) : t('common.not_available')}
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </ListItem>

              <Divider sx={{ my: 2 }} />

              {/* Key Metrics */}
              <ListItem sx={{ px: 0, flexDirection: 'column', alignItems: 'stretch' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  {t('analytics.key_metrics')}
          </Typography>

                {[
                  {
                    label: t('analytics.average_donation'),
                    value: formatCurrency(monthlyTrends.reduce((sum, m) => sum + m.avgDonation, 0) / monthlyTrends.length),
                    icon: MoneyIcon,
                    color: '#4caf50'
                  },
                  {
                    label: t('analytics.peak_donations'),
                    value: trendStatistics.peakMonth ? trendStatistics.peakMonth.total_donations : 0,
                    icon: AnalyticsIcon,
                    color: '#2196f3'
                  },
                  {
                    label: t('analytics.growth_rate'),
                    value: formatPercentage(trendStatistics.overallGrowth),
                    icon: SpeedIcon,
                    color: getTrendColor(trendStatistics.overallGrowth)
                  }
                ].map((metricItem, index) => (
                  <Box key={index} sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    py: 1,
                    px: 2,
                    borderRadius: 2,
                    '&:hover': { backgroundColor: 'rgba(139, 108, 188, 0.02)' }
                  }}>
                    <Avatar sx={{ 
                      backgroundColor: `${metricItem.color}20`,
                      width: 32,
                      height: 32,
                      mr: 2
                    }}>
                      <metricItem.icon sx={{ fontSize: 16, color: metricItem.color }} />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {metricItem.label}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: metricItem.color }}>
                        {metricItem.value}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </ListItem>
            </List>
        </CardContent>
      </Card>
      </Box>
    </Box>
  );
});

TrendAnalytics.displayName = 'TrendAnalytics';

export default TrendAnalytics;
