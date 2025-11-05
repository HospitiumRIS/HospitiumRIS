'use client';

import React from 'react';
import {
  Card,
  Typography,
  Stack,
  Chip,
  IconButton,
  Box,
} from '@mui/material';
import {
  Launch as LaunchIcon,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';

const FundingTrendsChart = ({ fundingTrendsData, lineChartOptions }) => {
  return (
    <Card sx={{ borderRadius: 3, boxShadow: 3, p: 3, height: 400 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
          Funding Trends Overview
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip 
            label="6 Months" 
            size="small" 
            sx={{ 
              backgroundColor: '#8b6cbc',
              color: 'white',
              fontWeight: 600
            }} 
          />
          <IconButton size="small" sx={{ color: '#8b6cbc' }}>
            <LaunchIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>
      <Box sx={{ height: 320 }}>
        <Line data={fundingTrendsData} options={lineChartOptions} />
      </Box>
    </Card>
  );
};

export default FundingTrendsChart;
