'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Business as InstitutionsIcon,
  People as UsersIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  Refresh as RefreshIcon,
  HealthAndSafety as HealthIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import GlobalAdminLayout from '../../components/GlobalAdmin/GlobalAdminLayout';

const GlobalAdminPage = () => {
  const theme = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({});
  const [systemHealth, setSystemHealth] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (user.accountType !== 'GLOBAL_ADMIN') {
      router.push('/dashboard');
      return;
    }
  }, [user, router, authLoading]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/global-admin/dashboard-stats');
        
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats || {});
          setSystemHealth(data.systemHealth || {});
        } else {
          setStats({
            totalInstitutions: 0,
            totalUsers: 0,
            activeUsers: 0,
            totalManuscripts: 0
          });
          setSystemHealth({
            cpuUsage: 0,
            memoryUsage: 0,
            diskUsage: 0,
            status: 'unknown'
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setStats({
          totalInstitutions: 0,
          totalUsers: 0,
          activeUsers: 0,
          totalManuscripts: 0
        });
        setSystemHealth({
          cpuUsage: 0,
          memoryUsage: 0,
          diskUsage: 0,
          status: 'unknown'
        });
      } finally {
        setLoading(false);
      }
    };

    if (user?.accountType === 'GLOBAL_ADMIN') {
      fetchDashboardData();
    }
  }, [user]);

  const handleRefresh = () => {
    setLoading(true);
    window.location.reload();
  };

  if (!user || user.accountType !== 'GLOBAL_ADMIN') {
    return null;
  }

  return (
    <GlobalAdminLayout>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
        <Box sx={{ 
          mb: 4,
          pb: 3,
          borderBottom: '2px solid',
          borderColor: 'divider'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700, 
                  mb: 1,
                  background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.02em'
                }}
              >
                System Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                Global system health and institution management
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

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {stats.totalInstitutions || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Total Institutions
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                    <InstitutionsIcon fontSize="large" />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {stats.totalUsers || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Total Users
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                    <UsersIcon fontSize="large" />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #ed6c02 0%, #e65100 100%)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(237, 108, 2, 0.3)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {stats.activeUsers || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Active Users
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                    <CheckIcon fontSize="large" />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(156, 39, 176, 0.3)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {systemHealth.status === 'healthy' ? 'Healthy' : 'Warning'}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      System Status
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                    <HealthIcon fontSize="large" />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Paper sx={{ mt: 3, p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            System Health Metrics
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">CPU Usage</Typography>
                  <Typography variant="body2" fontWeight={600}>{systemHealth.cpuUsage || 0}%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={systemHealth.cpuUsage || 0}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Memory Usage</Typography>
                  <Typography variant="body2" fontWeight={600}>{systemHealth.memoryUsage || 0}%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={systemHealth.memoryUsage || 0}
                  sx={{ height: 8, borderRadius: 4 }}
                  color="warning"
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Disk Usage</Typography>
                  <Typography variant="body2" fontWeight={600}>{systemHealth.diskUsage || 0}%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={systemHealth.diskUsage || 0}
                  sx={{ height: 8, borderRadius: 4 }}
                  color="secondary"
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </GlobalAdminLayout>
  );
};

export default GlobalAdminPage;
