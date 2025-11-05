'use client';

import React from 'react';
import {
  Card,
  Typography,
  Box,
} from '@mui/material';
import { Pie } from 'react-chartjs-2';

const CampaignCategoriesChart = ({ campaignDistributionData, pieChartOptions }) => {
  return (
    <Card sx={{ borderRadius: 3, boxShadow: 3, p: 3, height: 400 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, fontSize: '1.25rem' }}>
        Campaign Categories Distribution
      </Typography>
      <Box sx={{ height: 320 }}>
        <Pie data={campaignDistributionData} options={pieChartOptions} />
      </Box>
    </Card>
  );
};

export default CampaignCategoriesChart;
