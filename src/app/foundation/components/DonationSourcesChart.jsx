'use client';

import React from 'react';
import {
  Card,
  Typography,
  Box,
} from '@mui/material';
import { Bar } from 'react-chartjs-2';

const DonationSourcesChart = ({ donationSourcesData, chartOptions }) => {
  return (
    <Card sx={{ borderRadius: 3, boxShadow: 3, p: 3, height: 400 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, fontSize: '1.25rem' }}>
        Donation Sources Analysis
      </Typography>
      <Box sx={{ height: 320 }}>
        <Bar data={donationSourcesData} options={chartOptions} />
      </Box>
    </Card>
  );
};

export default DonationSourcesChart;
