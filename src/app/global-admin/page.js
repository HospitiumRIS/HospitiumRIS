'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  IconButton,
  Tooltip,
  Button,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider
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
  HealthAndSafety as HealthIcon,
  Article as ManuscriptsIcon,
  Science as ResearchIcon,
  AccountBalance as FoundationIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import GlobalAdminLayout from '../../components/GlobalAdmin/GlobalAdminLayout';

const GlobalAdminPage = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({});
  const [systemHealth, setSystemHealth] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
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
          setRecentActivity(data.recentActivity || []);
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
      <Container maxWidth="xl" sx={{ pt: { xs: 3, sm: 4, md: 5 } }}>
        {/* Header */}
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
                  color: theme.palette.text.primary,
                  letterSpacing: '-0.02em'
                }}
              >
                {t('global_admin.system_dashboard')}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                {t('global_admin.system_health_label')}
              </Typography>
            </Box>
            <Tooltip title={t('global_admin.refresh_data')}>
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

        <Box sx={{ 
          display: 'flex', 
          gap: 2.5, 
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
                {t('global_admin.total_institutions')}
              </Typography>
              <InstitutionsIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {stats.totalInstitutions || 0}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              {t('global_admin.registered_institutions')}
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
                {t('global_admin.total_users')}
              </Typography>
              <UsersIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {stats.totalUsers || 0}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              {t('global_admin.system_wide_users')}
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
                {t('global_admin.active_users')}
              </Typography>
              <CheckIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {stats.activeUsers || 0}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              {t('global_admin.currently_active')}
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
                {t('global_admin.system_status')}
              </Typography>
              <HealthIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {systemHealth.status === 'healthy' ? t('global_admin.healthy') : t('common.warning')}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              {t('global_admin.all_systems_operational')}
            </Typography>
          </Paper>
          </Box>

          <Paper sx={{ mt: 3, p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            {t('global_admin.system_health_metrics')}
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">{t('global_admin.cpu_usage')}</Typography>
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
                  <Typography variant="body2" color="text.secondary">{t('global_admin.memory_usage')}</Typography>
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
                  <Typography variant="body2" color="text.secondary">{t('global_admin.disk_usage')}</Typography>
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

        {/* Recent Activity */}
        <Paper sx={{ mt: 3, p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            {t('global_admin.recent_system_activity')}
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>{t('global_admin.timestamp')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('global_admin.event_type')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('global_admin.user')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('global_admin.details')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('global_admin.status')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{new Date(activity.timestamp).toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip 
                          label={activity.type} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{activity.user}</TableCell>
                      <TableCell>{activity.details}</TableCell>
                      <TableCell>
                        <Chip 
                          label={activity.status} 
                          size="small" 
                          color={activity.status === 'Success' ? 'success' : 'error'}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('global_admin.no_recent_activity')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          </Paper>

          {/* Quick Actions */}
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {t('global_admin.quick_actions')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{
                    justifyContent: 'flex-start',
                    py: 1.5
                  }}
                  onClick={() => router.push('/global-admin/institutions')}
                >
                  <InstitutionsIcon sx={{ mr: 2 }} />
                  {t('global_admin.manage_institutions')}
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{
                    justifyContent: 'flex-start',
                    py: 1.5
                  }}
                  onClick={() => router.push('/global-admin/health')}
                >
                  <HealthIcon sx={{ mr: 2 }} />
                  {t('global_admin.system_health_check')}
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{
                    justifyContent: 'flex-start',
                    py: 1.5
                  }}
                  onClick={() => router.push('/global-admin/database')}
                >
                  <StorageIcon sx={{ mr: 2 }} />
                  {t('global_admin.database_management')}
                </Button>
              </Box>
            </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {t('global_admin.system_information')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">{t('global_admin.platform')}</Typography>
                  <Chip label={systemHealth.platform || t('common.not_available')} size="small" />
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">{t('global_admin.cpu_cores')}</Typography>
                  <Typography variant="body2" fontWeight={600}>{systemHealth.cpuCount || 0}</Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">{t('global_admin.total_memory')}</Typography>
                  <Typography variant="body2" fontWeight={600}>{systemHealth.totalMemoryGB || 0} GB</Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">{t('global_admin.uptime')}</Typography>
                  <Typography variant="body2" fontWeight={600}>{systemHealth.uptime || 0} hours</Typography>
                </Box>
              </Box>
            </Paper>
            </Grid>
          </Grid>
      </Container>
    </GlobalAdminLayout>
  );
};

export default GlobalAdminPage;
