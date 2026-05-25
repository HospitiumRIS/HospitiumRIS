'use client';

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  Skeleton
} from '@mui/material';
import {
  Campaign as CampaignIcon,
  AttachMoney as MoneyIcon,
  Timeline as TimelineIcon,
  Assignment as TaskIcon
} from '@mui/icons-material';

const StatisticsCards = ({ statistics, loading = false }) => {

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const calculateProgress = (current, target) => {
    if (!target || target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const cardSx = {
    p: 2,
    borderRadius: 2,
    bgcolor: '#8b6cbc',
    border: 'none',
    position: 'relative',
    overflow: 'hidden',
    height: '100px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    flex: { xs: '1 1 100%', sm: '1 1 0' },
    minWidth: { xs: '100%', sm: 0 },
    boxShadow: '0 2px 8px rgba(139, 108, 188, 0.25)'
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', gap: 2.5, mb: 4, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
        {[1, 2, 3, 4].map((i) => (
          <Paper key={i} sx={cardSx}>
            <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
            <Skeleton variant="text" width="60%" height={16} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
            <Skeleton variant="text" width="40%" height={32} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
            <Skeleton variant="text" width="50%" height={12} sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
          </Paper>
        ))}
      </Box>
    );
  }

  const cards = [
    {
      title: 'Categories',
      value: statistics.totalCategories || 0,
      subtitle: `${statistics.activeCampaigns || 0} active campaigns`,
      icon: CampaignIcon,
      progress: null
    },
    {
      title: 'Total Raised',
      value: formatCurrency(statistics.totalRaised || 0),
      subtitle: `of ${formatCurrency(statistics.totalTarget || 0)} target`,
      icon: MoneyIcon,
      progress: calculateProgress(statistics.totalRaised, statistics.totalTarget)
    },
    {
      title: 'Campaigns',
      value: statistics.totalCampaigns || 0,
      subtitle: `${statistics.activeCampaigns || 0} currently active`,
      icon: TaskIcon,
      progress: statistics.totalCampaigns > 0
        ? (statistics.activeCampaigns / statistics.totalCampaigns) * 100
        : 0
    },
    {
      title: 'Activities',
      value: statistics.totalActivities || 0,
      subtitle: `${statistics.completedActivities || 0} completed`,
      icon: TimelineIcon,
      progress: statistics.totalActivities > 0
        ? (statistics.completedActivities / statistics.totalActivities) * 100
        : 0
    }
  ];

  return (
    <Box sx={{ display: 'flex', gap: 2.5, mb: 4, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
      {cards.map((card, index) => (
        <Paper key={index} sx={cardSx}>
          <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)' }}>
              {card.title}
            </Typography>
            <card.icon sx={{ fontSize: 18, color: 'white', opacity: 0.85 }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem', lineHeight: 1 }}>
            {card.value}
          </Typography>
          {card.progress !== null ? (
            <Box>
              <LinearProgress
                variant="determinate"
                value={card.progress}
                sx={{
                  height: 3,
                  borderRadius: 2,
                  mb: 0.5,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  '& .MuiLinearProgress-bar': { backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 2 }
                }}
              />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                {card.subtitle}
              </Typography>
            </Box>
          ) : (
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              {card.subtitle}
            </Typography>
          )}
        </Paper>
      ))}
    </Box>
  );
};

export default StatisticsCards;
