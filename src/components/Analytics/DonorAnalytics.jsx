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
  People as PeopleIcon,
  Construction as ConstructionIcon
} from '@mui/icons-material';

const DonorAnalytics = memo(({ analyticsData, loading }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <PeopleIcon sx={{ fontSize: 32, color: '#8b6cbc' }} />
        <Box>
          <Typography variant="h4" sx={{ 
            fontWeight: 800, 
            color: theme.palette.text.primary,
            mb: 0.5
          }}>
            {t('analytics.donor_analytics')}
          </Typography>
          <Typography variant="body1" sx={{ 
            color: theme.palette.text.secondary
          }}>
            {t('analytics.donor_analytics_desc_long')}
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
            {t('analytics.donor_analytics_coming_soon')}
          </Typography>
          
          <Typography variant="body1" sx={{ 
            color: theme.palette.text.secondary,
            mb: 3,
            maxWidth: 500,
            mx: 'auto'
          }}>
            {t('analytics.donor_analytics_coming_desc')}
          </Typography>

          <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
            <Chip label={t('analytics.behavioral_analysis')} variant="outlined" color="primary" />
            <Chip label={t('analytics.lifetime_value')} variant="outlined" color="primary" />
            <Chip label={t('analytics.segmentation')} variant="outlined" color="primary" />
            <Chip label={t('analytics.engagement_scoring')} variant="outlined" color="primary" />
            <Chip label={t('analytics.personalization')} variant="outlined" color="primary" />
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
});

DonorAnalytics.displayName = 'DonorAnalytics';

export default DonorAnalytics;
