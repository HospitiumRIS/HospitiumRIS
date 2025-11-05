'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import {
  Box,
  CssBaseline,
  Toolbar,
  useTheme,
  alpha,
  Fade,
  Backdrop,
  CircularProgress,
  Typography,
  Stack
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

// Professional Components
import AnalyticsSidebar, { DRAWER_WIDTH } from '@/components/Analytics/AnalyticsSidebar';
import ProfessionalAnalyticsHeader from '@/components/Analytics/ProfessionalAnalyticsHeader';

// Lazy load tab components for better performance
const DashboardOverview = lazy(() => import('@/components/Analytics/DashboardOverview'));
const CampaignAnalytics = lazy(() => import('@/components/Analytics/CampaignAnalytics'));
const CategoryAnalytics = lazy(() => import('@/components/Analytics/CategoryAnalytics'));
const TrendAnalytics = lazy(() => import('@/components/Analytics/TrendAnalytics'));
const DonorAnalytics = lazy(() => import('@/components/Analytics/DonorAnalytics'));
const RetentionAnalytics = lazy(() => import('@/components/Analytics/RetentionAnalytics'));
const RevenueAnalytics = lazy(() => import('@/components/Analytics/RevenueAnalytics'));
const PerformanceAnalytics = lazy(() => import('@/components/Analytics/PerformanceAnalytics'));

// Configure dayjs plugins
dayjs.extend(relativeTime);

// Utility functions
const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Debounce hook for performance
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function ProfessionalDonationsAnalytics() {
  const theme = useTheme();
  
  // State management - optimized for fewer re-renders
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [selectedView, setSelectedView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: dayjs().subtract(1, 'year'),
    endDate: dayjs()
  });
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Debounced values for performance
  const debouncedCampaign = useDebounce(selectedCampaign, 500);
  const debouncedCategory = useDebounce(selectedCategory, 500);

  // Optimized data loading with new analytics API
  const loadAnalyticsData = useCallback(async (useCache = true) => {
    try {
      setLoading(true);
      setError(null);
      
      // Create cache key based on current filters
      const filterKey = `${dateRange.startDate.format('YYYY-MM-DD')}_${dateRange.endDate.format('YYYY-MM-DD')}_${debouncedCampaign}_${debouncedCategory}`;
      const cacheKey = `analytics_optimized_${filterKey}`;
      
      // Check cache first for performance
      if (typeof window !== 'undefined' && useCache) {
        const cachedData = sessionStorage.getItem(cacheKey);
        const cacheTime = sessionStorage.getItem(`${cacheKey}_time`);
        const now = Date.now();
        
        // Use cache if data is less than 5 minutes old
        if (cachedData && cacheTime && (now - parseInt(cacheTime)) < 5 * 60 * 1000) {
          console.log('Using cached analytics data');
          setAnalyticsData(JSON.parse(cachedData));
          setLoading(false);
          return;
        }
      }
      
      const params = new URLSearchParams({
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
        ...(debouncedCampaign && { campaignId: debouncedCampaign }),
        ...(debouncedCategory && { categoryId: debouncedCategory })
      });

      console.log('Fetching analytics data with params:', params.toString());

      // Use the optimized analytics API endpoint
      const response = await fetch(`/api/foundation/donations/analytics?${params}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch analytics data');
      }

      console.log('Analytics data loaded successfully:', result.data);
      setAnalyticsData(result.data);
      setLastUpdated(dayjs().fromNow());

      // Cache the data
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(cacheKey, JSON.stringify(result.data));
        sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString());
        
        // Clean up old cache entries
        const keys = Object.keys(sessionStorage).filter(key => key.startsWith('analytics_optimized_'));
        if (keys.length > 10) {
          keys.slice(0, -10).forEach(key => {
            sessionStorage.removeItem(key);
            sessionStorage.removeItem(`${key}_time`);
          });
        }
      }

    } catch (error) {
      console.error('Error loading analytics data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [dateRange, debouncedCampaign, debouncedCategory]);

  // Load data on mount and when filters change
  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  // Event handlers
  const handleViewChange = useCallback((viewId) => {
    setSelectedView(viewId);
  }, []);

  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen(!sidebarOpen);
  }, [sidebarOpen]);

  const handleRefresh = useCallback(() => {
    // Clear cache and reload
    if (typeof window !== 'undefined') {
      const keys = Object.keys(sessionStorage).filter(key => key.startsWith('analytics_optimized_'));
      keys.forEach(key => {
        sessionStorage.removeItem(key);
        sessionStorage.removeItem(`${key}_time`);
      });
    }
    setLastUpdated(null);
    loadAnalyticsData(false);
  }, [loadAnalyticsData]);

  const handleExportData = useCallback(() => {
    if (!analyticsData) return;
    
    const exportData = {
      overview: analyticsData.overview,
      campaignPerformance: analyticsData.campaignPerformance,
      topDonors: analyticsData.topDonors,
      generatedAt: new Date().toISOString(),
      dateRange: {
        start: dateRange.startDate.format('YYYY-MM-DD'),
        end: dateRange.endDate.format('YYYY-MM-DD')
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donations-analytics-${dayjs().format('YYYY-MM-DD')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [analyticsData, dateRange]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: 'Donations Analytics Dashboard',
        text: 'Check out these fundraising insights',
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  }, []);

  const handleSearch = useCallback((searchTerm) => {
    console.log('Search:', searchTerm);
  }, []);

  const handleQuickAction = useCallback((actionId) => {
    switch (actionId) {
      case 'export':
        handleExportData();
        break;
      case 'refresh':
        handleRefresh();
        break;
      case 'filters':
        console.log('Advanced filters');
        break;
      case 'settings':
        console.log('Settings');
        break;
      default:
        console.log('Unknown action:', actionId);
    }
  }, [handleExportData, handleRefresh]);

  // Render content based on selected view
  const renderContent = () => {
    if (loading && !analyticsData) {
      return (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh' 
        }}>
          <Stack alignItems="center" spacing={3}>
            <CircularProgress size={80} sx={{ color: '#8b6cbc' }} />
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#8b6cbc' }}>
              Loading Analytics Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Processing donation data and generating insights...
            </Typography>
          </Stack>
        </Box>
      );
    }

    if (error) {
      return (
        <Box sx={{ p: 4, textAlign: 'center', maxWidth: 600, mx: 'auto', mt: 8 }}>
          <Typography variant="h5" color="error" sx={{ mb: 2 }}>
            Error Loading Analytics
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {error}
          </Typography>
          <Button variant="contained" onClick={() => loadAnalyticsData(false)}>
            Try Again
          </Button>
        </Box>
      );
    }

    // Content components mapping
    const contentMap = {
      dashboard: () => <DashboardOverview analyticsData={analyticsData} loading={loading} />,
      insights: () => <DashboardOverview analyticsData={analyticsData} loading={loading} />, // For now, same as dashboard
      campaigns: () => <CampaignAnalytics analyticsData={analyticsData} loading={loading} />,
      categories: () => <CategoryAnalytics analyticsData={analyticsData} loading={loading} />,
      trends: () => <TrendAnalytics analyticsData={analyticsData} loading={loading} />,
      donors: () => <DonorAnalytics analyticsData={analyticsData} loading={loading} />,
      retention: () => <RetentionAnalytics analyticsData={analyticsData} loading={loading} />,
      segmentation: () => <DonorAnalytics analyticsData={analyticsData} loading={loading} />, // For now, same as donors
      revenue: () => <RevenueAnalytics analyticsData={analyticsData} loading={loading} />,
      performance: () => <PerformanceAnalytics analyticsData={analyticsData} loading={loading} />
    };

    const ContentComponent = contentMap[selectedView] || contentMap.dashboard;

    return (
      <Suspense fallback={
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ color: '#8b6cbc' }} />
        </Box>
      }>
        <Fade in={!loading} timeout={300}>
          <Box>
            <ContentComponent />
          </Box>
        </Fade>
      </Suspense>
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <CssBaseline />
        
        {/* Sidebar Navigation */}
        <AnalyticsSidebar
          selectedItem={selectedView}
          onSelect={handleViewChange}
          onQuickAction={handleQuickAction}
        />

        {/* Main Content Area */}
        <Box 
          component="main" 
          sx={{
            flexGrow: 1,
            width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
            minHeight: '100vh',
            backgroundColor: alpha('#f8f9fa', 0.3),
            position: 'relative',
            mt:8
          }}
        >
          {/* Professional Header */}
          <ProfessionalAnalyticsHeader
            onMenuClick={handleSidebarToggle}
            onSearch={handleSearch}
            onRefresh={handleRefresh}
            onExport={handleExportData}
            onShare={handleShare}
            lastUpdated={lastUpdated}
            isLoading={loading}
          />

          {/* Main Content */}
          <Box sx={{ 
            p: { xs: 2, sm: 3, md: 4 },
            mt: 0
          }}>
            {renderContent()}
          </Box>

          {/* Loading Backdrop */}
          <Backdrop
            sx={{
              color: '#fff',
              zIndex: (theme) => theme.zIndex.drawer + 1,
              backgroundColor: 'rgba(139, 108, 188, 0.1)',
              backdropFilter: 'blur(4px)'
            }}
            open={loading && analyticsData !== null}
          >
            <Stack alignItems="center" spacing={2}>
              <CircularProgress color="inherit" size={60} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Refreshing Data...
              </Typography>
            </Stack>
          </Backdrop>
        </Box>
      </Box>
    </LocalizationProvider>
  );
}
