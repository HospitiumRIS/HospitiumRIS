'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  LinearProgress,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Assessment as AnalyticsIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Article as ArticleIcon,
  Assignment as ProposalIcon,
  School as TrainingIcon,
  Description as ManuscriptIcon,
  PersonAdd as NewUserIcon,
  CheckCircle as ActiveIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import GlobalAdminLayout from '../../../components/GlobalAdmin/GlobalAdminLayout';

const AnalyticsPage = () => {
  const theme = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    overview: {
      totalUsers: 0,
      totalInstitutions: 0,
      totalPublications: 0,
      totalProposals: 0,
      totalTrainings: 0,
      totalManuscripts: 0,
      activeUsers: 0,
      recentUsers: 0,
      userGrowthRate: 0
    },
    usersByType: [],
    institutionsByType: [],
    publicationTrend: [],
    proposalsByStatus: []
  });

  useEffect(() => {
    if (!authLoading && user?.accountType !== 'GLOBAL_ADMIN') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.accountType === 'GLOBAL_ADMIN') {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/global-admin/analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAnalytics();
  };

  if (authLoading) {
    return null;
  }

  return (
    <GlobalAdminLayout>
      <Container maxWidth="xl" sx={{ pt: { xs: 3, sm: 4, md: 5 } }}>
        {/* Header */}
        <Box sx={{ 
          mb: 4,
          pb: 3,
          borderBottom: '2px solid',
          borderColor: 'divider'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700, 
                  mb: 1,
                  color: theme.palette.text.primary,
                  letterSpacing: '-0.02em'
                }}
              >
                System Analytics
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                Comprehensive insights and metrics across the platform
              </Typography>
            </Box>
            <Tooltip title="Refresh data">
              <IconButton 
                onClick={handleRefresh} 
                sx={{ 
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                  boxShadow: 2
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {loading && <LinearProgress sx={{ mb: 3 }} />}

        {/* Overview Stats Cards - Row 1 */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2.5, 
          mb: 4,
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          '& > *': {
            flex: {
              xs: '1 1 100%',
              sm: '1 1 0'
            },
            minWidth: 0
          }
        }}>
          <Paper sx={{ 
            p: 2, 
            borderRadius: 2,
            bgcolor: theme.palette.primary.main,
            boxShadow: `0 2px 8px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(139, 108, 188, 0.2)'}`,
            border: 'none',
            position: 'relative',
            overflow: 'hidden',
            height: '100px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                Total Users
              </Typography>
              <PeopleIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {analytics.overview.totalUsers.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Registered accounts
            </Typography>
          </Paper>

          <Paper sx={{ 
            p: 2, 
            borderRadius: 2,
            bgcolor: theme.palette.primary.main,
            boxShadow: `0 2px 8px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(139, 108, 188, 0.2)'}`,
            border: 'none',
            position: 'relative',
            overflow: 'hidden',
            height: '100px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                Institutions
              </Typography>
              <BusinessIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {analytics.overview.totalInstitutions.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Active organizations
            </Typography>
          </Paper>

          <Paper sx={{ 
            p: 2, 
            borderRadius: 2,
            bgcolor: theme.palette.primary.main,
            boxShadow: `0 2px 8px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(139, 108, 188, 0.2)'}`,
            border: 'none',
            position: 'relative',
            overflow: 'hidden',
            height: '100px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                Publications
              </Typography>
              <ArticleIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {analytics.overview.totalPublications.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Research outputs
            </Typography>
          </Paper>

          <Paper sx={{ 
            p: 2, 
            borderRadius: 2,
            bgcolor: theme.palette.primary.main,
            boxShadow: `0 2px 8px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(139, 108, 188, 0.2)'}`,
            border: 'none',
            position: 'relative',
            overflow: 'hidden',
            height: '100px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                Proposals
              </Typography>
              <ProposalIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {analytics.overview.totalProposals.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Project proposals
            </Typography>
          </Paper>
        </Box>

        {/* Activity Stats Cards - Row 2 */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2.5, 
          mb: 4,
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          '& > *': {
            flex: {
              xs: '1 1 100%',
              sm: '1 1 0'
            },
            minWidth: 0
          }
        }}>
          <Paper sx={{ 
            p: 2, 
            borderRadius: 2,
            bgcolor: theme.palette.primary.main,
            boxShadow: `0 2px 8px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(139, 108, 188, 0.2)'}`,
            border: 'none',
            position: 'relative',
            overflow: 'hidden',
            height: '100px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                Active Users
              </Typography>
              <ActiveIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {analytics.overview.activeUsers.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Last 30 days
            </Typography>
          </Paper>

          <Paper sx={{ 
            p: 2, 
            borderRadius: 2,
            bgcolor: theme.palette.primary.main,
            boxShadow: `0 2px 8px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(139, 108, 188, 0.2)'}`,
            border: 'none',
            position: 'relative',
            overflow: 'hidden',
            height: '100px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                New Users
              </Typography>
              <NewUserIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {analytics.overview.recentUsers.toLocaleString()}
              </Typography>
              {analytics.overview.userGrowthRate !== 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {analytics.overview.userGrowthRate > 0 ? (
                    <TrendingUpIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.9)' }} />
                  ) : (
                    <TrendingDownIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.9)' }} />
                  )}
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.7rem', fontWeight: 600 }}>
                    {Math.abs(analytics.overview.userGrowthRate)}%
                  </Typography>
                </Box>
              )}
            </Box>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Last 30 days
            </Typography>
          </Paper>

          <Paper sx={{ 
            p: 2, 
            borderRadius: 2,
            bgcolor: theme.palette.primary.main,
            boxShadow: `0 2px 8px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(139, 108, 188, 0.2)'}`,
            border: 'none',
            position: 'relative',
            overflow: 'hidden',
            height: '100px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                Manuscripts
              </Typography>
              <ManuscriptIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {analytics.overview.totalManuscripts.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              In progress
            </Typography>
          </Paper>

          <Paper sx={{ 
            p: 2, 
            borderRadius: 2,
            bgcolor: theme.palette.primary.main,
            boxShadow: `0 2px 8px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(139, 108, 188, 0.2)'}`,
            border: 'none',
            position: 'relative',
            overflow: 'hidden',
            height: '100px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                Trainings
              </Typography>
              <TrainingIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {analytics.overview.totalTrainings.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Available courses
            </Typography>
          </Paper>
        </Box>

        {/* Detailed Analytics */}
        <Box sx={{ 
          display: 'flex', 
          gap: 3, 
          mb: 4,
          flexWrap: { xs: 'wrap', md: 'nowrap' },
          '& > *': {
            flex: {
              xs: '1 1 100%',
              md: '1 1 0'
            },
            minWidth: 0
          }
        }}>
          {/* Users by Type */}
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Users by Account Type
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {analytics.usersByType.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      bgcolor: `hsl(${index * 60}, 70%, 60%)` 
                    }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {item.type.replace(/_/g, ' ')}
                    </Typography>
                  </Box>
                  <Chip 
                    label={item.count.toLocaleString()} 
                    size="small"
                    sx={{ fontWeight: 600, minWidth: 60 }}
                  />
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Institutions by Type */}
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Institutions by Type
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {analytics.institutionsByType.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      bgcolor: `hsl(${index * 50}, 65%, 55%)` 
                    }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {item.type.replace(/_/g, ' ')}
                    </Typography>
                  </Box>
                  <Chip 
                    label={item.count.toLocaleString()} 
                    size="small"
                    sx={{ fontWeight: 600, minWidth: 60 }}
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>

        {/* Publication Trend & Proposal Status */}
        <Box sx={{ 
          display: 'flex', 
          gap: 3,
          flexWrap: { xs: 'wrap', md: 'nowrap' },
          '& > *': {
            flex: {
              xs: '1 1 100%',
              md: '1 1 0'
            },
            minWidth: 0
          }
        }}>
          {/* Publication Trend */}
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Publication Trend (Last 6 Months)
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {analytics.publicationTrend.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, minWidth: 100 }}>
                    {item.month}
                  </Typography>
                  <Box sx={{ flex: 1, mx: 2, height: 8, bgcolor: 'action.hover', borderRadius: 1, overflow: 'hidden' }}>
                    <Box 
                      sx={{ 
                        height: '100%', 
                        bgcolor: 'primary.main',
                        width: `${Math.min((item.count / Math.max(...analytics.publicationTrend.map(p => p.count))) * 100, 100)}%`,
                        transition: 'width 0.3s ease'
                      }} 
                    />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 40, textAlign: 'right' }}>
                    {item.count}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Proposals by Status */}
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Proposals by Status
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {analytics.proposalsByStatus.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      bgcolor: item.status === 'APPROVED' ? 'success.main' : 
                               item.status === 'REJECTED' ? 'error.main' :
                               item.status === 'PENDING' ? 'warning.main' : 'info.main'
                    }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {item.status}
                    </Typography>
                  </Box>
                  <Chip 
                    label={item.count.toLocaleString()} 
                    size="small"
                    sx={{ fontWeight: 600, minWidth: 60 }}
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>
      </Container>
    </GlobalAdminLayout>
  );
};

export default AnalyticsPage;
