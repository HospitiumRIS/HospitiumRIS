'use client';

import React, { memo, Suspense, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  alpha,
  useTheme,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  FullscreenOutlined as FullscreenIcon,
  MoreVertOutlined as MoreIcon,
  TrendingUp as TrendingUpIcon,
  ShowChart as ShowChartIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

// Professional color palettes
const CHART_COLORS = {
  primary: ['#8b6cbc', '#a084d1', '#b794f4', '#c9a6f7', '#dab8fa'],
  gradient: [
    'rgba(139, 108, 188, 0.8)',
    'rgba(160, 132, 209, 0.8)', 
    'rgba(183, 148, 244, 0.8)',
    'rgba(201, 166, 247, 0.8)',
    'rgba(218, 184, 250, 0.8)'
  ],
  success: ['#4caf50', '#66bb6a', '#81c784', '#a5d6a7', '#c8e6c9'],
  warning: ['#ff9800', '#ffb74d', '#ffcc02', '#ffd54f', '#ffe082'],
  info: ['#2196f3', '#42a5f5', '#64b5f6', '#90caf9', '#bbdefb'],
  mixed: ['#8b6cbc', '#4caf50', '#ff9800', '#2196f3', '#f44336', '#9c27b0', '#607d8b']
};

// Utility functions
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Loading skeleton for charts
const ChartSkeleton = memo(({ height = 350 }) => (
  <Box sx={{ 
    height, 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: alpha('#f5f5f5', 0.5),
    borderRadius: 2
  }}>
    <CircularProgress size={60} sx={{ color: '#8b6cbc' }} />
  </Box>
));

// Chart Container Component
const ChartContainer = memo(({ 
  title, 
  subtitle, 
  children, 
  height = 400, 
  loading = false,
  onFullscreen,
  onExport,
  onRefresh,
  showViewToggle = false,
  viewType,
  onViewChange,
  viewOptions = []
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Card sx={{ 
      borderRadius: 3,
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      border: '1px solid rgba(139, 108, 188, 0.1)',
      overflow: 'hidden'
    }}>
      {/* Chart Header */}
      <Box sx={{ 
        p: 3, 
        pb: 2,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: `linear-gradient(90deg, ${alpha('#8b6cbc', 0.02)} 0%, ${alpha('#8b6cbc', 0.05)} 100%)`
      }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 700, 
              color: theme.palette.text.primary,
              fontSize: '1.25rem',
              mb: 0.5
            }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" sx={{ 
                color: theme.palette.text.secondary,
                fontSize: '0.875rem'
              }}>
                {subtitle}
              </Typography>
            )}
          </Box>

          <Stack direction="row" alignItems="center" spacing={1}>
            {/* View Toggle */}
            {showViewToggle && viewOptions.length > 0 && (
              <ToggleButtonGroup
                value={viewType}
                exclusive
                onChange={onViewChange}
                size="small"
                sx={{
                  '& .MuiToggleButton-root': {
                    px: 1.5,
                    py: 0.5,
                    fontSize: '0.75rem',
                    border: `1px solid ${alpha('#8b6cbc', 0.2)}`,
                    '&.Mui-selected': {
                      backgroundColor: alpha('#8b6cbc', 0.1),
                      color: '#8b6cbc'
                    }
                  }
                }}
              >
                {viewOptions.map((option) => (
                  <ToggleButton key={option.value} value={option.value}>
                    <option.icon sx={{ fontSize: 16, mr: 0.5 }} />
                    {option.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            )}

            {/* Chart Actions */}
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Fullscreen">
                <IconButton 
                  size="small" 
                  onClick={onFullscreen}
                  sx={{
                    color: theme.palette.text.secondary,
                    '&:hover': { 
                      color: '#8b6cbc',
                      backgroundColor: alpha('#8b6cbc', 0.1)
                    }
                  }}
                >
                  <FullscreenIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <IconButton 
                size="small" 
                onClick={handleMenuClick}
                sx={{
                  color: theme.palette.text.secondary,
                  '&:hover': { 
                    color: '#8b6cbc',
                    backgroundColor: alpha('#8b6cbc', 0.1)
                  }
                }}
              >
                <MoreIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>
        </Stack>
      </Box>

      {/* Chart Content */}
      <CardContent sx={{ p: 3, height: height - 100 }}>
        {loading ? (
          <ChartSkeleton height={height - 140} />
        ) : (
          <Box sx={{ height: '100%' }}>
            {children}
          </Box>
        )}
      </CardContent>

      {/* Chart Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 180,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
          }
        }}
      >
        <MenuItem onClick={() => { onRefresh?.(); handleMenuClose(); }}>
          <ListItemIcon>
            <RefreshIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Refresh Data</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { onExport?.(); handleMenuClose(); }}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export Chart</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); }}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  );
});

// Campaign Performance Bar Chart
export const ProfessionalCampaignChart = memo(({ analyticsData, loading }) => {
  const theme = useTheme();
  const [viewType, setViewType] = useState('bar');

  const chartData = useMemo(() => {
    if (!analyticsData) return null;
    
    const campaigns = analyticsData.campaignPerformance
      .sort((a, b) => b.raised - a.raised)
      .slice(0, 10);

    return {
      labels: campaigns.map(c => c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name),
      datasets: [
        {
          label: 'Amount Raised',
          data: campaigns.map(c => c.raised),
          backgroundColor: (ctx) => {
            const canvas = ctx.chart.ctx;
            const gradient = canvas.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, '#8b6cbc');
            gradient.addColorStop(1, alpha('#8b6cbc', 0.3));
            return gradient;
          },
          borderColor: '#8b6cbc',
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
          hoverBackgroundColor: '#a084d1',
          hoverBorderColor: '#8b6cbc',
          hoverBorderWidth: 3
        }
      ]
    };
  }, [analyticsData]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#8b6cbc',
        borderWidth: 2,
        cornerRadius: 12,
        padding: 16,
        displayColors: false,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        callbacks: {
          label: function(context) {
            return `Raised: ${formatCurrency(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: alpha(theme.palette.divider, 0.1),
          drawBorder: false
        },
        ticks: {
          color: theme.palette.text.secondary,
          font: { size: 11 },
          callback: function(value) {
            return formatCurrency(value);
          },
          padding: 10
        }
      },
      x: {
        grid: { display: false },
        ticks: {
          color: theme.palette.text.secondary,
          font: { size: 11 },
          padding: 10
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  const viewOptions = [
    { value: 'bar', label: 'Bar', icon: BarChartIcon },
    { value: 'line', label: 'Line', icon: ShowChartIcon }
  ];

  if (!chartData) return <ChartSkeleton />;

  return (
    <ChartContainer
      title="Campaign Performance"
      subtitle="Top performing fundraising campaigns by amount raised"
      loading={loading}
      height={500}
      showViewToggle
      viewType={viewType}
      onViewChange={(_, newView) => newView && setViewType(newView)}
      viewOptions={viewOptions}
    >
      <Suspense fallback={<ChartSkeleton />}>
        {viewType === 'bar' ? (
          <Bar data={chartData} options={options} />
        ) : (
          <Line data={chartData} options={options} />
        )}
      </Suspense>
    </ChartContainer>
  );
});

// Category Distribution Doughnut Chart
export const ProfessionalCategoryChart = memo(({ analyticsData, loading }) => {
  const theme = useTheme();

  const chartData = useMemo(() => {
    if (!analyticsData) return null;

    const categories = analyticsData.categoryPerformance;
    
    return {
      labels: categories.map(c => c.name),
      datasets: [
        {
          data: categories.map(c => c.raised),
          backgroundColor: categories.map((c, index) => 
            c.color || CHART_COLORS.mixed[index % CHART_COLORS.mixed.length]
          ),
          borderWidth: 3,
          borderColor: '#ffffff',
          hoverBorderWidth: 4,
          cutout: '60%'
        }
      ]
    };
  }, [analyticsData]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: { size: 12, weight: '500' },
          color: theme.palette.text.primary
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#8b6cbc',
        borderWidth: 2,
        cornerRadius: 12,
        padding: 16,
        displayColors: true,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${formatCurrency(context.parsed)} (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      animateScale: true,
      animateRotate: true,
      duration: 1000
    }
  };

  if (!chartData) return <ChartSkeleton />;

  return (
    <ChartContainer
      title="Category Distribution"
      subtitle="Fundraising performance breakdown by category"
      loading={loading}
      height={500}
    >
      <Box sx={{ position: 'relative', height: '100%' }}>
        <Suspense fallback={<ChartSkeleton />}>
          <Doughnut data={chartData} options={options} />
        </Suspense>
        
        {/* Center Label */}
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none'
        }}>
          <Typography variant="caption" sx={{ 
            color: theme.palette.text.secondary,
            fontSize: '0.75rem'
          }}>
            Total Raised
          </Typography>
          <Typography variant="h6" sx={{ 
            fontWeight: 700,
            color: theme.palette.text.primary,
            fontSize: '1.1rem'
          }}>
            {formatCurrency(analyticsData?.overview.totalAmount || 0)}
          </Typography>
        </Box>
      </Box>
    </ChartContainer>
  );
});

// Monthly Trends Line Chart
export const ProfessionalTrendsChart = memo(({ analyticsData, loading }) => {
  const theme = useTheme();

  const chartData = useMemo(() => {
    if (!analyticsData) return null;
    
    const monthlyData = analyticsData.monthlyTrends.slice(-12);

    return {
      labels: monthlyData.map(data => data.monthName),
      datasets: [
        {
          label: 'Donation Amount',
          data: monthlyData.map(data => data.amount),
          borderColor: '#8b6cbc',
          backgroundColor: (ctx) => {
            const canvas = ctx.chart.ctx;
            const gradient = canvas.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, alpha('#8b6cbc', 0.3));
            gradient.addColorStop(1, alpha('#8b6cbc', 0.05));
            return gradient;
          },
          fill: true,
          tension: 0.4,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: '#8b6cbc',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 3,
          pointHoverBackgroundColor: '#a084d1',
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 4
        }
      ]
    };
  }, [analyticsData]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#8b6cbc',
        borderWidth: 2,
        cornerRadius: 12,
        padding: 16,
        displayColors: false,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        callbacks: {
          label: function(context) {
            return `Amount: ${formatCurrency(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: alpha(theme.palette.divider, 0.1),
          drawBorder: false
        },
        ticks: {
          color: theme.palette.text.secondary,
          font: { size: 11 },
          callback: function(value) {
            return formatCurrency(value);
          },
          padding: 10
        }
      },
      x: {
        grid: { display: false },
        ticks: {
          color: theme.palette.text.secondary,
          font: { size: 11 },
          padding: 10
        }
      }
    },
    animation: {
      duration: 1500,
      easing: 'easeOutQuart'
    },
    interaction: {
      mode: 'index',
      intersect: false,
    }
  };

  if (!chartData) return <ChartSkeleton />;

  return (
    <ChartContainer
      title="Monthly Donation Trends"
      subtitle="Donation patterns and growth over the last 12 months"
      loading={loading}
      height={500}
    >
      <Suspense fallback={<ChartSkeleton />}>
        <Line data={chartData} options={options} />
      </Suspense>
    </ChartContainer>
  );
});

ChartContainer.displayName = 'ChartContainer';
ChartSkeleton.displayName = 'ChartSkeleton';
ProfessionalCampaignChart.displayName = 'ProfessionalCampaignChart';
ProfessionalCategoryChart.displayName = 'ProfessionalCategoryChart';
ProfessionalTrendsChart.displayName = 'ProfessionalTrendsChart';

export { ChartSkeleton };
