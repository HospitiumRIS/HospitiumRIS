'use client';

import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Fade,
  Skeleton
} from '@mui/material';
import {
  Campaign as CampaignIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  Timeline as TimelineIcon,
  Assignment as TaskIcon
} from '@mui/icons-material';

const StatisticsCards = ({ 
  statistics, 
  loading = false, 
  DASHBOARD_COLORS 
}) => {
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const calculateProgress = (current, target) => {
    if (!target || target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  if (loading) {
    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[1, 2, 3, 4].map((index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ 
                height: 120, 
                background: `linear-gradient(135deg, ${DASHBOARD_COLORS.primary} 0%, ${DASHBOARD_COLORS.primaryLight} 100%)` 
              }}>
                <CardContent sx={{ color: 'white', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Skeleton variant="text" width="40%" height={32} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
                  <Skeleton variant="text" width="60%" height={20} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                  <Skeleton variant="text" width="50%" height={16} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                </CardContent>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  const cards = [
    {
      title: 'Total Categories',
      value: statistics.totalCategories || 0,
      subtitle: `${statistics.activeCampaigns || 0} active campaigns`,
      icon: CampaignIcon,
      gradient: ['#667eea', '#764ba2'],
      color: '#667eea',
      progress: null
    },
    {
      title: 'Total Raised',
      value: formatCurrency(statistics.totalRaised || 0),
      subtitle: `Target: ${formatCurrency(statistics.totalTarget || 0)}`,
      icon: MoneyIcon,
      gradient: ['#f093fb', '#f5576c'],
      color: '#f093fb',
      progress: calculateProgress(statistics.totalRaised, statistics.totalTarget)
    },
    {
      title: 'Total Campaigns',
      value: statistics.totalCampaigns || 0,
      subtitle: `${statistics.activeCampaigns || 0} currently active`,
      icon: TaskIcon,
      gradient: ['#4facfe', '#00f2fe'],
      color: '#4facfe',
      progress: statistics.totalCampaigns > 0 ? (statistics.activeCampaigns / statistics.totalCampaigns) * 100 : 0
    },
    {
      title: 'Total Activities',
      value: statistics.totalActivities || 0,
      subtitle: `${statistics.completedActivities || 0} completed`,
      icon: TimelineIcon,
      gradient: ['#fa709a', '#fee140'],
      color: '#fa709a',
      progress: statistics.totalActivities > 0 ? (statistics.completedActivities / statistics.totalActivities) * 100 : 0
    }
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {cards.map((card, index) => (
        <Grid item xs={12} sm={6} lg={3} key={index}>
          <Fade in timeout={600 + (index * 100)}>
            <Card sx={{ 
              borderRadius: 3, 
              overflow: 'hidden',
              height: 120,
              position: 'relative',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
              }
            }}>
              <Box sx={{ 
                height: '100%',
                background: `linear-gradient(135deg, ${card.gradient[0]} 0%, ${card.gradient[1]} 100%)`,
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Background Pattern */}
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '100%',
                  height: '100%',
                  backgroundImage: `radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
                                   radial-gradient(circle at 20% 80%, rgba(255,255,255,0.08) 0%, transparent 50%)`,
                  pointerEvents: 'none'
                }} />
                
                <CardContent sx={{ 
                  color: 'white', 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center',
                  position: 'relative',
                  zIndex: 1
                }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" sx={{ 
                      fontWeight: 800, 
                      mb: 0.5,
                      fontSize: { xs: '1.8rem', sm: '2rem' },
                      textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                      {card.value}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      opacity: 0.9, 
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      mb: card.progress !== null ? 1 : 0
                    }}>
                      {card.title}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      opacity: 0.8, 
                      fontSize: '0.75rem',
                      display: 'block'
                    }}>
                      {card.subtitle}
                    </Typography>
                    
                    {/* Progress Bar */}
                    {card.progress !== null && (
                      <Box sx={{ mt: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={card.progress}
                          sx={{
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: 'rgba(255, 255, 255, 0.8)',
                              borderRadius: 2
                            }
                          }}
                        />
                        <Typography variant="caption" sx={{ 
                          fontSize: '0.7rem', 
                          opacity: 0.8,
                          mt: 0.5,
                          display: 'block'
                        }}>
                          {Math.round(card.progress)}% complete
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  
                  {/* Icon */}
                  <Box sx={{ 
                    opacity: 0.7,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <card.icon sx={{ 
                      fontSize: { xs: 40, sm: 48 },
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                    }} />
                  </Box>
                </CardContent>
              </Box>
            </Card>
          </Fade>
        </Grid>
      ))}
    </Grid>
  );
};

export default StatisticsCards;
