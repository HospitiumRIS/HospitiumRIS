'use client';

import React, { memo } from 'react';
import {
  Grid,
  Card,
  Typography,
  Box,
  Stack,
  Chip,
  LinearProgress,
  Tooltip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  alpha
} from '@mui/material';
import { ZoomIn as ZoomInIcon } from '@mui/icons-material';
import { CampaignChart } from './ChartComponents';

// Utility functions
const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const CampaignPerformanceTab = memo(({ analyticsData, handleInitiativeDetail }) => {
  if (!analyticsData) return null;

  return (
    <Grid container spacing={4}>
      <Grid item xs={12} lg={8}>
        <Card sx={{ 
          p: 4, 
          height: 500, 
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid rgba(139, 108, 188, 0.1)'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 4, color: '#2c3e50', fontSize: '1.25rem' }}>
            Top Performing Campaigns
          </Typography>
          <Box sx={{ height: 380 }}>
            <CampaignChart analyticsData={analyticsData} />
          </Box>
        </Card>
      </Grid>
      
      <Grid item xs={12} lg={4}>
        <Card sx={{ 
          p: 4, 
          height: 500,
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid rgba(139, 108, 188, 0.1)'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 4, color: '#2c3e50', fontSize: '1.25rem' }}>
            Campaign Rankings
          </Typography>
          <Box sx={{ maxHeight: 380, overflowY: 'auto', pr: 1 }}>
            {analyticsData.campaignPerformance
              .sort((a, b) => b.raised - a.raised)
              .slice(0, 8)
              .map((campaign, index) => (
                <Box key={campaign.id} sx={{ 
                  mb: 3, 
                  p: 2, 
                  backgroundColor: 'rgba(139, 108, 188, 0.02)', 
                  borderRadius: 2, 
                  border: '1px solid rgba(139, 108, 188, 0.1)' 
                }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                      #{index + 1} {campaign.name}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Chip 
                        label={campaign.categoryName} 
                        size="small" 
                        sx={{ 
                          backgroundColor: alpha(campaign.categoryColor, 0.1),
                          color: campaign.categoryColor,
                          fontWeight: 500,
                          fontSize: '0.75rem'
                        }}
                      />
                      <Tooltip title="View detailed analysis">
                        <IconButton 
                          size="small" 
                          onClick={() => handleInitiativeDetail(campaign)}
                          sx={{ color: '#8b6cbc' }}
                        >
                          <ZoomInIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                  <Box sx={{ mb: 2 }}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Raised: {formatCurrency(campaign.raised)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {campaign.donorCount} donors
                      </Typography>
                    </Stack>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(campaign.completionPercentage, 100)} 
                    sx={{ 
                      height: 10, 
                      borderRadius: 5,
                      backgroundColor: alpha(campaign.categoryColor, 0.1),
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: campaign.categoryColor,
                        borderRadius: 5
                      }
                    }} 
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {Math.min(campaign.completionPercentage, 100).toFixed(1)}% of target
                  </Typography>
                </Box>
              ))}
          </Box>
        </Card>
      </Grid>
      
      {/* Initiative Efficiency Matrix */}
      <Grid item xs={12}>
        <Card sx={{ 
          p: 4,
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid rgba(139, 108, 188, 0.1)'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 4, color: '#2c3e50', fontSize: '1.25rem' }}>
            Initiative Efficiency Matrix
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: alpha('#8b6cbc', 0.05) }}>
                  <TableCell sx={{ fontWeight: 600 }}>Initiative</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Amount Raised</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Donors</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Avg/Donor</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analyticsData.campaignPerformance
                  .sort((a, b) => (b.raised / Math.max(b.donorCount, 1)) - (a.raised / Math.max(a.donorCount, 1)))
                  .slice(0, 10)
                  .map((campaign) => (
                    <TableRow key={campaign.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                          {campaign.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={campaign.categoryName}
                          size="small"
                          sx={{ 
                            backgroundColor: alpha(campaign.categoryColor, 0.1),
                            color: campaign.categoryColor
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                          {formatCurrency(campaign.raised)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {campaign.donorCount}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatCurrency(campaign.raised / Math.max(campaign.donorCount, 1))}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={campaign.status}
                          size="small"
                          color={campaign.status === 'Active' ? 'success' : 'default'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Grid>
    </Grid>
  );
});

CampaignPerformanceTab.displayName = 'CampaignPerformanceTab';

export default CampaignPerformanceTab;
