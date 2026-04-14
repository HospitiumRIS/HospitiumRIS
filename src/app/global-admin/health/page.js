'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  LinearProgress,
  IconButton,
  Tooltip,
  Button,
  Avatar,
  Chip,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import {
  HealthAndSafety as HealthIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  NetworkCheck as NetworkIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import GlobalAdminLayout from '../../../components/GlobalAdmin/GlobalAdminLayout';

const SystemHealthPage = () => {
  const theme = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [healthData, setHealthData] = useState({
    cpu: { usage: 45, status: 'healthy' },
    memory: { usage: 62, status: 'healthy' },
    disk: { usage: 38, status: 'healthy' },
    database: { status: 'healthy', connections: 12, maxConnections: 100 },
    network: { status: 'healthy', latency: 23 },
    uptime: { days: 15, hours: 7, minutes: 32 }
  });

  useEffect(() => {
    if (!authLoading && user?.accountType !== 'GLOBAL_ADMIN') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleRefresh = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckIcon />;
      case 'warning': return <WarningIcon />;
      case 'error': return <ErrorIcon />;
      default: return <CheckIcon />;
    }
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
                System Health
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                Monitor system performance and resource usage
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

        {/* Health Status Cards */}
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
                CPU Usage
              </Typography>
              <SpeedIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {healthData.cpu.usage}%
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              System processor
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
                Memory Usage
              </Typography>
              <MemoryIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {healthData.memory.usage}%
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              RAM utilization
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
                Disk Usage
              </Typography>
              <StorageIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {healthData.disk.usage}%
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Storage capacity
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
                Network Latency
              </Typography>
              <NetworkIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {healthData.network.latency}ms
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Response time
            </Typography>
          </Paper>
        </Box>

        {/* Detailed Health Metrics */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Database Health
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip 
                    icon={getStatusIcon(healthData.database.status)}
                    label={healthData.database.status.toUpperCase()} 
                    color={getStatusColor(healthData.database.status)}
                    size="small"
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Active Connections</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {healthData.database.connections} / {healthData.database.maxConnections}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(healthData.database.connections / healthData.database.maxConnections) * 100}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                System Uptime
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-around' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {healthData.uptime.days}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Days</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {healthData.uptime.hours}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Hours</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {healthData.uptime.minutes}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Minutes</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </GlobalAdminLayout>
  );
};

export default SystemHealthPage;
