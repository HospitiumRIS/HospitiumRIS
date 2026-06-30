'use client';

import { useTranslation } from 'react-i18next';
import React, { memo } from 'react';
import {
  Box,
  Typography,
  Stack,
  useTheme
} from '@mui/material';
import {
  Analytics as AnalyticsIcon
} from '@mui/icons-material';

import ProfessionalStatisticsCards from './ProfessionalStatisticsCards';
import { 
  ProfessionalCampaignChart, 
  ProfessionalCategoryChart, 
  ProfessionalTrendsChart 
} from './ProfessionalCharts';
import ProfessionalDataTable from './ProfessionalDataTable';

const DashboardOverview = memo(({ analyticsData, loading }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const donorColumns = [
    {
      id: 'name',
      label: t('analytics.donor'),
      type: 'avatar',
      sortable: true,
      sticky: true,
      minWidth: 200
    },
    {
      id: 'totalAmount',
      label: t('analytics.total_donated'),
      type: 'currency',
      sortable: true,
      align: 'right',
      minWidth: 140,
      fontWeight: 600,
      color: (value) => value > 10000 ? '#4caf50' : theme.palette.text.primary
    },
    {
      id: 'donationCount',
      label: t('analytics.donations'),
      sortable: true,
      align: 'center',
      minWidth: 100
    },
    {
      id: 'averageAmount',
      label: t('analytics.avg_amount'),
      type: 'currency',
      sortable: true,
      align: 'right',
      minWidth: 120
    },
    {
      id: 'firstDonation',
      label: t('analytics.first_gift'),
      type: 'date',
      sortable: true,
      minWidth: 120
    },
    {
      id: 'lastDonation',
      label: t('analytics.recent_gift'),
      type: 'date',
      sortable: true,
      minWidth: 120
    }
  ];

  const campaignColumns = [
    {
      id: 'name',
      label: t('analytics.campaign'),
      sortable: true,
      sticky: true,
      minWidth: 200,
      fontWeight: 600
    },
    {
      id: 'categoryName',
      label: t('common.category'),
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
      label: t('analytics.amount_raised'),
      type: 'trend',
      sortable: true,
      align: 'right',
      minWidth: 150,
      fontWeight: 600
    },
    {
      id: 'donorCount',
      label: t('analytics.donors'),
      sortable: true,
      align: 'center',
      minWidth: 100
    },
    {
      id: 'completionPercentage',
      label: t('analytics.progress'),
      type: 'progress',
      sortable: true,
      align: 'center',
      minWidth: 120
    },
    {
      id: 'status',
      label: t('common.status'),
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
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <AnalyticsIcon sx={{ fontSize: 32, color: '#8b6cbc' }} />
        <Box>
          <Typography variant="h4" sx={{ 
            fontWeight: 800, 
            color: theme.palette.text.primary,
            mb: 0.5
          }}>
            {t('analytics.analytics_dashboard')}
          </Typography>
          <Typography variant="body1" sx={{ 
            color: theme.palette.text.secondary
          }}>
            {t('analytics.dashboard_subtitle')}
          </Typography>
        </Box>
      </Stack>

      <ProfessionalStatisticsCards 
        analyticsData={analyticsData} 
        loading={loading} 
      />

      <Box sx={{ mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          gap: 4, 
          mb: 4,
          flexWrap: 'wrap'
        }}>
          <Box sx={{ flex: { xs: '1 1 100%', lg: '2 2 calc(66.666% - 16px)' } }}>
            <ProfessionalCampaignChart 
              analyticsData={analyticsData} 
              loading={loading} 
            />
          </Box>

          <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 calc(33.333% - 16px)' } }}>
            <ProfessionalCategoryChart 
              analyticsData={analyticsData} 
              loading={loading} 
            />
          </Box>
        </Box>

        <Box>
          <ProfessionalTrendsChart 
            analyticsData={analyticsData} 
            loading={loading} 
          />
        </Box>
      </Box>

      <Box sx={{ 
        display: 'flex', 
        gap: 4, 
        flexWrap: 'wrap',
        '& > *': { 
          flex: { xs: '1 1 100%', lg: '1 1 calc(50% - 16px)' } 
        }
      }}>
        <Box>
          <ProfessionalDataTable
            title={t('analytics.top_donors')}
            subtitle={t('analytics.top_donors_subtitle')}
            data={analyticsData?.topDonors || []}
            columns={donorColumns}
            loading={loading}
            pageSize={8}
            onRowClick={handleRowClick}
            onAction={handleAction}
            emptyMessage={t('analytics.no_donor_data')}
          />
        </Box>

        <Box>
          <ProfessionalDataTable
            title={t('analytics.campaign_performance_table')}
            subtitle={t('analytics.campaign_performance_subtitle')}
            data={analyticsData?.campaignPerformance || []}
            columns={campaignColumns}
            loading={loading}
            pageSize={8}
            onRowClick={handleRowClick}
            onAction={handleAction}
            emptyMessage={t('analytics.no_campaign_data')}
          />
        </Box>
      </Box>
    </Box>
  );
});

DashboardOverview.displayName = 'DashboardOverview';

export default DashboardOverview;
