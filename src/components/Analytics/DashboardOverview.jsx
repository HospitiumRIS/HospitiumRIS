'use client';

import React, { memo } from 'react';
import {
  Grid,
  Box,
  Typography,
  Stack,
  useTheme
} from '@mui/material';
import {
  Analytics as AnalyticsIcon
} from '@mui/icons-material';

// Import professional components
import ProfessionalStatisticsCards from './ProfessionalStatisticsCards';
import { 
  ProfessionalCampaignChart, 
  ProfessionalCategoryChart, 
  ProfessionalTrendsChart 
} from './ProfessionalCharts';
import ProfessionalDataTable from './ProfessionalDataTable';

const DashboardOverview = memo(({ analyticsData, loading }) => {
  const theme = useTheme();

  // Define columns for top donors table
  const donorColumns = [
    {
      id: 'name',
      label: 'Donor',
      type: 'avatar',
      sortable: true,
      sticky: true,
      minWidth: 200
    },
    {
      id: 'totalAmount',
      label: 'Total Donated',
      type: 'currency',
      sortable: true,
      align: 'right',
      minWidth: 140,
      fontWeight: 600,
      color: (value) => value > 10000 ? '#4caf50' : theme.palette.text.primary
    },
    {
      id: 'donationCount',
      label: 'Donations',
      sortable: true,
      align: 'center',
      minWidth: 100
    },
    {
      id: 'averageAmount',
      label: 'Avg Amount',
      type: 'currency',
      sortable: true,
      align: 'right',
      minWidth: 120
    },
    {
      id: 'firstDonation',
      label: 'First Gift',
      type: 'date',
      sortable: true,
      minWidth: 120
    },
    {
      id: 'lastDonation',
      label: 'Recent Gift',
      type: 'date',
      sortable: true,
      minWidth: 120
    }
  ];

  // Define columns for campaign performance table
  const campaignColumns = [
    {
      id: 'name',
      label: 'Campaign',
      sortable: true,
      sticky: true,
      minWidth: 200,
      fontWeight: 600
    },
    {
      id: 'categoryName',
      label: 'Category',
      type: 'chip',
      sortable: true,
      minWidth: 120,
      getChipColor: (value) => {
        const colorMap = {
          'Education': 'primary',
          'Healthcare': 'success',
          'Environment': 'info',
          'Community': 'warning'
        };
        return colorMap[value] || 'default';
      }
    },
    {
      id: 'raised',
      label: 'Amount Raised',
      type: 'trend',
      sortable: true,
      align: 'right',
      minWidth: 150,
      fontWeight: 600
    },
    {
      id: 'donorCount',
      label: 'Donors',
      sortable: true,
      align: 'center',
      minWidth: 100
    },
    {
      id: 'completionPercentage',
      label: 'Progress',
      type: 'progress',
      sortable: true,
      align: 'center',
      minWidth: 120
    },
    {
      id: 'status',
      label: 'Status',
      type: 'chip',
      sortable: true,
      minWidth: 100,
      getChipColor: (value) => {
        const statusColors = {
          'Active': 'success',
          'Planning': 'warning',
          'Completed': 'info',
          'Paused': 'default'
        };
        return statusColors[value] || 'default';
      }
    }
  ];

  const handleRowClick = (row) => {
    console.log('Row clicked:', row);
  };

  const handleAction = (action, row) => {
    console.log('Action:', action, 'Row:', row);
  };

  return (
    <Box>
      {/* Page Title */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <AnalyticsIcon sx={{ fontSize: 32, color: '#8b6cbc' }} />
        <Box>
          <Typography variant="h4" sx={{ 
            fontWeight: 800, 
            color: theme.palette.text.primary,
            mb: 0.5
          }}>
            Analytics Dashboard
          </Typography>
          <Typography variant="body1" sx={{ 
            color: theme.palette.text.secondary
          }}>
            Comprehensive overview of your fundraising performance and donor engagement
          </Typography>
        </Box>
      </Stack>

      {/* Key Performance Indicators */}
      <ProfessionalStatisticsCards 
        analyticsData={analyticsData} 
        loading={loading} 
      />

      {/* Charts Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          gap: 4, 
          mb: 4,
          flexWrap: 'wrap'
        }}>
          {/* Campaign Performance Chart */}
          <Box sx={{ flex: { xs: '1 1 100%', lg: '2 2 calc(66.666% - 16px)' } }}>
            <ProfessionalCampaignChart 
              analyticsData={analyticsData} 
              loading={loading} 
            />
          </Box>

          {/* Category Distribution */}
          <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 calc(33.333% - 16px)' } }}>
            <ProfessionalCategoryChart 
              analyticsData={analyticsData} 
              loading={loading} 
            />
          </Box>
        </Box>

        {/* Monthly Trends */}
        <Box>
          <ProfessionalTrendsChart 
            analyticsData={analyticsData} 
            loading={loading} 
          />
        </Box>
      </Box>

      {/* Data Tables Section */}
      <Box sx={{ 
        display: 'flex', 
        gap: 4, 
        flexWrap: 'wrap',
        '& > *': { 
          flex: { xs: '1 1 100%', lg: '1 1 calc(50% - 16px)' } 
        }
      }}>
        {/* Top Donors Table */}
        <Box>
          <ProfessionalDataTable
            title="Top Donors"
            subtitle="Highest contributing donors by total donation amount"
            data={analyticsData?.topDonors || []}
            columns={donorColumns}
            loading={loading}
            pageSize={8}
            onRowClick={handleRowClick}
            onAction={handleAction}
            emptyMessage="No donor data available"
          />
        </Box>

        {/* Campaign Performance Table */}
        <Box>
          <ProfessionalDataTable
            title="Campaign Performance"
            subtitle="Active and recent fundraising campaigns ranked by performance"
            data={analyticsData?.campaignPerformance || []}
            columns={campaignColumns}
            loading={loading}
            pageSize={8}
            onRowClick={handleRowClick}
            onAction={handleAction}
            emptyMessage="No campaign data available"
          />
        </Box>
      </Box>
    </Box>
  );
});

DashboardOverview.displayName = 'DashboardOverview';

export default DashboardOverview;
