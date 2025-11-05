'use client';

import React, { memo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  IconButton,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  alpha,
  useTheme
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

const ChartContainer = memo(({ 
  title, 
  subtitle, 
  children, 
  height = 400, 
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
      borderRadius: 4,
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      border: '1px solid rgba(139, 108, 188, 0.08)',
      overflow: 'hidden'
    }}>
      {/* Chart Header */}
      <Box sx={{ 
        p: 3, 
        pb: 2,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        background: `linear-gradient(90deg, ${alpha('#8b6cbc', 0.02)} 0%, ${alpha('#8b6cbc', 0.05)} 100%)`
      }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 700, 
              color: theme.palette.text.primary,
              fontSize: '1.3rem',
              mb: 0.5
            }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" sx={{ 
                color: theme.palette.text.secondary,
                fontSize: '0.9rem'
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
      <CardContent sx={{ p: 3, height: height - 120 }}>
        <Box sx={{ height: '100%' }}>
          {children}
        </Box>
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

// Enhanced Funding Trends Chart
export const ProfessionalFundingChart = memo(({ data, loading }) => {
  const theme = useTheme();
  const [viewType, setViewType] = useState('line');

  const chartData = {
    labels: data?.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Donations',
        data: data?.donations || [25000, 32000, 28000, 41000, 36000, 42500],
        borderColor: '#8b6cbc',
        backgroundColor: (ctx) => {
          const canvas = ctx.chart.ctx;
          const gradient = canvas.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, alpha('#8b6cbc', 0.3));
          gradient.addColorStop(1, alpha('#8b6cbc', 0.05));
          return gradient;
        },
        fill: viewType === 'line',
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: '#8b6cbc',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 3,
        borderRadius: viewType === 'bar' ? 8 : 0,
        borderSkipped: false
      },
      {
        label: 'Grants',
        data: data?.grants || [15000, 18000, 22000, 20000, 25000, 28000],
        borderColor: '#4caf50',
        backgroundColor: (ctx) => {
          const canvas = ctx.chart.ctx;
          const gradient = canvas.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, alpha('#4caf50', 0.3));
          gradient.addColorStop(1, alpha('#4caf50', 0.05));
          return gradient;
        },
        fill: viewType === 'line',
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: '#4caf50',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 3,
        borderRadius: viewType === 'bar' ? 8 : 0,
        borderSkipped: false
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: { size: 12, weight: '600' },
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
            const formatter = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0
            });
            return `${context.dataset.label}: ${formatter.format(context.parsed.y)}`;
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
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              notation: 'compact'
            }).format(value);
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

  const viewOptions = [
    { value: 'line', label: 'Line', icon: ShowChartIcon },
    { value: 'bar', label: 'Bar', icon: BarChartIcon }
  ];

  return (
    <ChartContainer
      title="Funding Trends"
      subtitle="Monthly donations and grants over the past 6 months"
      height={500}
      showViewToggle
      viewType={viewType}
      onViewChange={(_, newView) => newView && setViewType(newView)}
      viewOptions={viewOptions}
    >
      {viewType === 'line' ? (
        <Line data={chartData} options={options} />
      ) : (
        <Bar data={chartData} options={options} />
      )}
    </ChartContainer>
  );
});

// Enhanced Campaign Distribution Chart
export const ProfessionalCampaignChart = memo(({ data, loading }) => {
  const theme = useTheme();

  const chartData = {
    labels: data?.labels || ['Medical Research', 'Education', 'Community Development', 'Environmental'],
    datasets: [
      {
        data: data?.values || [35, 25, 20, 20],
        backgroundColor: [
          '#8b6cbc',
          '#4caf50',
          '#ff9800',
          '#2196f3'
        ],
        borderWidth: 4,
        borderColor: '#ffffff',
        hoverBorderWidth: 6,
        cutout: '65%'
      }
    ]
  };

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
            return `${context.label}: ${percentage}% (${context.parsed} campaigns)`;
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

  return (
    <ChartContainer
      title="Campaign Distribution"
      subtitle="Active campaigns by category"
      height={500}
    >
      <Box sx={{ position: 'relative', height: '100%' }}>
        <Doughnut data={chartData} options={options} />
        
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
            fontSize: '0.75rem',
            fontWeight: 600
          }}>
            Total Campaigns
          </Typography>
          <Typography variant="h5" sx={{ 
            fontWeight: 800,
            color: theme.palette.text.primary,
            fontSize: '1.5rem'
          }}>
            {data?.total || 5}
          </Typography>
        </Box>
      </Box>
    </ChartContainer>
  );
});

ChartContainer.displayName = 'ChartContainer';
ProfessionalFundingChart.displayName = 'ProfessionalFundingChart';
ProfessionalCampaignChart.displayName = 'ProfessionalCampaignChart';

export default ChartContainer;
