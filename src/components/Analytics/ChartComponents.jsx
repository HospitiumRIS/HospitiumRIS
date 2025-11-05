'use client';

import React, { memo, Suspense, useMemo } from 'react';
import { Box, CircularProgress, alpha } from '@mui/material';
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
import { Bar, Pie, Line } from 'react-chartjs-2';

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

// Utility functions
const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Chart color palettes
const CHART_COLORS = {
  primary: ['#8b6cbc', '#a084d1', '#b794f4', '#c9a6f7', '#dab8fa'],
  success: ['#4caf50', '#66bb6a', '#81c784', '#a5d6a7', '#c8e6c9'],
  warning: ['#ff9800', '#ffb74d', '#ffcc02', '#ffd54f', '#ffe082'],
  info: ['#2196f3', '#42a5f5', '#64b5f6', '#90caf9', '#bbdefb'],
  mixed: ['#8b6cbc', '#4caf50', '#ff9800', '#2196f3', '#f44336', '#9c27b0', '#607d8b']
};

// Loading skeleton for charts
const ChartSkeleton = memo(({ height = 350 }) => (
  <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <CircularProgress size={60} />
  </Box>
));

// Campaign Performance Bar Chart
export const CampaignChart = memo(({ analyticsData }) => {
  const chartData = useMemo(() => {
    if (!analyticsData) return null;
    
    const top10Campaigns = analyticsData.campaignPerformance
      .sort((a, b) => b.raised - a.raised)
      .slice(0, 10);

    return {
      labels: top10Campaigns.map(c => c.name),
      datasets: [
        {
          label: 'Amount Raised',
          data: top10Campaigns.map(c => c.raised),
          backgroundColor: CHART_COLORS.primary,
          borderColor: CHART_COLORS.primary.map(color => color + '80'),
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
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
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#8b6cbc',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: function(context) {
            return formatCurrency(context.parsed.y);
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.1)'
        },
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  if (!chartData) return <ChartSkeleton />;

  return (
    <Suspense fallback={<ChartSkeleton />}>
      <Bar data={chartData} options={options} />
    </Suspense>
  );
});

// Category Distribution Pie Chart
export const CategoryChart = memo(({ analyticsData }) => {
  const chartData = useMemo(() => {
    if (!analyticsData) return null;

    return {
      labels: analyticsData.categoryPerformance.map(c => c.name),
      datasets: [
        {
          data: analyticsData.categoryPerformance.map(c => c.raised),
          backgroundColor: analyticsData.categoryPerformance.map(c => c.color),
          borderWidth: 3,
          borderColor: '#ffffff'
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
          padding: 20,
          font: {
            size: 12,
            weight: 500
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#8b6cbc',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${formatCurrency(context.parsed)} (${percentage}%)`;
          }
        }
      }
    }
  };

  if (!chartData) return <ChartSkeleton />;

  return (
    <Suspense fallback={<ChartSkeleton />}>
      <Pie data={chartData} options={options} />
    </Suspense>
  );
});

// Monthly Trends Line Chart
export const TrendsChart = memo(({ analyticsData, dashboardColors }) => {
  const chartData = useMemo(() => {
    if (!analyticsData) return null;
    
    const monthlyData = analyticsData.monthlyTrends.slice(-12); // Last 12 months

    return {
      labels: monthlyData.map(data => data.monthName),
      datasets: [
        {
          label: 'Donation Amount',
          data: monthlyData.map(data => data.amount),
          borderColor: dashboardColors.primary,
          backgroundColor: alpha(dashboardColors.primary, 0.1),
          fill: true,
          tension: 0.4,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: dashboardColors.primary,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 3
        }
      ]
    };
  }, [analyticsData, dashboardColors]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#8b6cbc',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.1)'
        },
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    }
  };

  if (!chartData) return <ChartSkeleton />;

  return (
    <Suspense fallback={<ChartSkeleton />}>
      <Line data={chartData} options={options} />
    </Suspense>
  );
});

CampaignChart.displayName = 'CampaignChart';
CategoryChart.displayName = 'CategoryChart';
TrendsChart.displayName = 'TrendsChart';
ChartSkeleton.displayName = 'ChartSkeleton';

export { ChartSkeleton };
