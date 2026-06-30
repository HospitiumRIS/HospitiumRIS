'use client';

import { useTranslation } from 'react-i18next';
import React, { memo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  useTheme
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  Construction as ConstructionIcon
} from '@mui/icons-material';

const PerformanceAnalytics = memo(({ analyticsData, loading }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <BarChartIcon sx={{ fontSize: 32, color: '#8b6cbc' }} />
        <Box>
          <Typography variant="h4" sx={{ 
            fontWeight: 800, 
            color: theme.palette.text.primary,
            mb: 0.5
          }}>
            {t('analytics.performance_analytics')}
          </Typography>
          <Typography variant="body1" sx={{ 
            color: theme.palette.text.secondary
          }}>
            {t('analytics.performance_analytics_desc')}
          </Typography>
        </Box>
      </Stack>

      <Card sx={{ 
        borderRadius: 3,
        border: '2px dashed rgba(139, 108, 188, 0.3)',
        backgroundColor: 'rgba(139, 108, 188, 0.02)'
      }}>
        <CardContent sx={{ p: 6, textAlign: 'center' }}>
          <ConstructionIcon sx={{ 
            fontSize: 80, 
            color: 'rgba(139, 108, 188, 0.4)',
            mb: 3
          }} />
          
          <Typography variant="h5" sx={{ 
            fontWeight: 700,
            color: theme.palette.text.primary,
            mb: 2
          }}>
            {t('analytics.performance_coming_soon')}
          </Typography>
          
          <Typography variant="body1" sx={{ 
            color: theme.palette.text.secondary,
            mb: 3,
            maxWidth: 500,
            mx: 'auto'
          }}>
            {t('analytics.performance_coming_desc')}
          </Typography>

          <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
            <Chip label={t('analytics.kpi_monitoring')} variant="outlined" color="primary" />
            <Chip label={t('analytics.benchmark_analysis')} variant="outlined" color="primary" />
            <Chip label={t('analytics.goal_tracking')} variant="outlined" color="primary" />
            <Chip label={t('analytics.performance_reports')} variant="outlined" color="primary" />
            <Chip label={t('analytics.optimization_tips')} variant="outlined" color="primary" />
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
});

PerformanceAnalytics.displayName = 'PerformanceAnalytics';

export default PerformanceAnalytics;
