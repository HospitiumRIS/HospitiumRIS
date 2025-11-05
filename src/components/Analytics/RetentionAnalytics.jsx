'use client';

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
  Assessment as AssessmentIcon,
  Construction as ConstructionIcon
} from '@mui/icons-material';

const RetentionAnalytics = memo(({ analyticsData, loading }) => {
  const theme = useTheme();

  return (
    <Box>
      {/* Page Title */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <AssessmentIcon sx={{ fontSize: 32, color: '#8b6cbc' }} />
        <Box>
          <Typography variant="h4" sx={{ 
            fontWeight: 800, 
            color: theme.palette.text.primary,
            mb: 0.5
          }}>
            Retention Analytics
          </Typography>
          <Typography variant="body1" sx={{ 
            color: theme.palette.text.secondary
          }}>
            Donor retention analysis and engagement optimization strategies
          </Typography>
        </Box>
      </Stack>

      {/* Coming Soon Card */}
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
            Retention Analytics Coming Soon
          </Typography>
          
          <Typography variant="body1" sx={{ 
            color: theme.palette.text.secondary,
            mb: 3,
            maxWidth: 500,
            mx: 'auto'
          }}>
            Comprehensive retention analysis including cohort analysis, churn prediction,
            re-engagement strategies, and loyalty program optimization.
          </Typography>

          <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
            <Chip label="Cohort Analysis" variant="outlined" color="primary" />
            <Chip label="Churn Prediction" variant="outlined" color="primary" />
            <Chip label="Re-engagement" variant="outlined" color="primary" />
            <Chip label="Loyalty Programs" variant="outlined" color="primary" />
            <Chip label="Retention Strategies" variant="outlined" color="primary" />
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
});

RetentionAnalytics.displayName = 'RetentionAnalytics';

export default RetentionAnalytics;
