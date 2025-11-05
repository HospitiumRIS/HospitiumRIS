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
  MonetizationOn as MonetizationOnIcon,
  Construction as ConstructionIcon
} from '@mui/icons-material';

const RevenueAnalytics = memo(({ analyticsData, loading }) => {
  const theme = useTheme();

  return (
    <Box>
      {/* Page Title */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <MonetizationOnIcon sx={{ fontSize: 32, color: '#8b6cbc' }} />
        <Box>
          <Typography variant="h4" sx={{ 
            fontWeight: 800, 
            color: theme.palette.text.primary,
            mb: 0.5
          }}>
            Revenue Analytics
          </Typography>
          <Typography variant="body1" sx={{ 
            color: theme.palette.text.secondary
          }}>
            Financial analysis and revenue forecasting for strategic planning
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
            Revenue Analytics Coming Soon
          </Typography>
          
          <Typography variant="body1" sx={{ 
            color: theme.palette.text.secondary,
            mb: 3,
            maxWidth: 500,
            mx: 'auto'
          }}>
            Advanced financial analytics including revenue forecasting, budget analysis,
            cost-per-acquisition, and ROI optimization across all channels.
          </Typography>

          <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
            <Chip label="Revenue Forecasting" variant="outlined" color="primary" />
            <Chip label="Budget Analysis" variant="outlined" color="primary" />
            <Chip label="Cost Analysis" variant="outlined" color="primary" />
            <Chip label="ROI Optimization" variant="outlined" color="primary" />
            <Chip label="Financial Planning" variant="outlined" color="primary" />
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
});

RevenueAnalytics.displayName = 'RevenueAnalytics';

export default RevenueAnalytics;
