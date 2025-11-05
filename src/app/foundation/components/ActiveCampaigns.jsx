'use client';

import React from 'react';
import {
  Card,
  Typography,
  Stack,
  Box,
  LinearProgress,
  alpha,
} from '@mui/material';

const ActiveCampaigns = ({ formatCurrency }) => {
  const campaigns = [
    {
      name: 'Medical Research Initiative',
      progress: 75,
      raised: 7500,
      goal: 10000,
      color: '#8b6cbc',
    },
    {
      name: 'Community Health Program',
      progress: 60,
      raised: 3000,
      goal: 5000,
      color: '#2e7d32',
    },
    {
      name: 'Emergency Relief Fund',
      progress: 90,
      raised: 4500,
      goal: 5000,
      color: '#ff9800',
    },
    {
      name: 'Education Support Initiative',
      progress: 45,
      raised: 2250,
      goal: 5000,
      color: '#1976d2',
    },
  ];

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 3, p: 3, height: 500 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, fontSize: '1.25rem' }}>
        Active Campaigns Progress
      </Typography>
      <Stack spacing={4}>
        {campaigns.map((campaign, index) => (
          <Box key={index}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
              <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                {campaign.name}
              </Typography>
              <Typography variant="body2" sx={{ 
                fontWeight: 600, 
                color: campaign.color,
                backgroundColor: alpha(campaign.color, 0.1),
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
              }}>
                {campaign.progress}%
              </Typography>
            </Stack>
            <LinearProgress 
              variant="determinate" 
              value={campaign.progress} 
              sx={{ 
                height: 12, 
                borderRadius: 6,
                backgroundColor: alpha(campaign.color, 0.1),
                mb: 1.5,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: campaign.color,
                  borderRadius: 6
                }
              }} 
            />
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                {formatCurrency(campaign.raised)} of {formatCurrency(campaign.goal)} raised
              </Typography>
              <Typography variant="caption" sx={{ 
                color: campaign.color,
                fontWeight: 600,
              }}>
                {formatCurrency(campaign.goal - campaign.raised)} remaining
              </Typography>
            </Stack>
          </Box>
        ))}
      </Stack>
    </Card>
  );
};

export default ActiveCampaigns;
