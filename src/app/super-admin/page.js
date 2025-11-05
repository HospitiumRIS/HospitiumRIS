'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  Chip,
  Stack,
  Avatar
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ListAlt as LogsIcon,
  People as UsersIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Assessment as AnalyticsIcon,
  Storage as DatabaseIcon,
  AdminPanelSettings as AdminIcon,
  Visibility as ViewIcon,
  Edit as ManageIcon,
  Delete as DeleteIcon,
  Backup as BackupIcon,
  CloudDownload as ExportIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../components/AuthProvider';
import { useRouter } from 'next/navigation';

const SuperAdminPage = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  // Check Super Admin access
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (user.accountType !== 'SUPER_ADMIN') {
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch basic stats - you can extend this with actual API calls
        setStats({
          totalUsers: 4,
          activeUsers: 3,
          pendingUsers: 8,
          totalLogs: 1234,
          errorLogs: 23,
          systemHealth: 'healthy'
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.accountType === 'SUPER_ADMIN') {
      fetchStats();
    }
  }, [user]);

  const adminActions = [
    {
      title: 'Activity Logs',
      description: 'Monitor system activity and user actions',
      icon: <LogsIcon />,
      color: 'primary',
      action: () => router.push('/logs'),
      buttonText: 'View Logs'
    },
    {
      title: 'User Management',
      description: 'Manage user accounts and permissions',
      icon: <UsersIcon />,
      color: 'info',
      action: () => router.push('/super-admin/users'),
      buttonText: 'Manage Users'
    },
    {
      title: 'System Settings',
      description: 'Configure system-wide settings and preferences',
      icon: <SettingsIcon />,
      color: 'warning',
      action: () => router.push('/super-admin/settings'),
      buttonText: 'Configure'
    },
    {
      title: 'Security Center',
      description: 'Security monitoring and access controls',
      icon: <SecurityIcon />,
      color: 'error',
      action: () => router.push('/super-admin/security'),
      buttonText: 'Security'
    },
    {
      title: 'Analytics & Reports',
      description: 'System analytics and usage reports',
      icon: <AnalyticsIcon />,
      color: 'success',
      action: () => router.push('/super-admin/analytics'),
      buttonText: 'View Reports'
    },
    {
      title: 'Database Management',
      description: 'Database operations and maintenance',
      icon: <DatabaseIcon />,
      color: 'secondary',
      action: () => router.push('/super-admin/database'),
      buttonText: 'DB Tools'
    }
  ];

  const quickActions = [
    { icon: <ViewIcon />, label: 'View Logs', action: () => router.push('/logs') },
    { icon: <RefreshIcon />, label: 'Refresh Data', action: () => window.location.reload() },
    { icon: <BackupIcon />, label: 'Backup System', action: () => alert('Backup functionality coming soon') },
    { icon: <ExportIcon />, label: 'Export Data', action: () => alert('Export functionality coming soon') }
  ];

  if (!user || user.accountType !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default, py: 2 }}>
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
        {/* Compact Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 3,
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
              <AdminIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 600, mb: 0.5 }}>
                Super Admin Console
              </Typography>
              <Typography variant="body2" color="text.secondary">
                System Control & Monitoring
              </Typography>
            </Box>
          </Box>
          
          <Chip 
            label={`Welcome, ${user.givenName}`}
            color="primary" 
            variant="outlined"
            icon={<CheckIcon />}
          />
        </Box>

        {/* Compact Stats Overview */}
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 2, 
          mb: 3,
          '& .MuiCard-root': {
            transition: 'all 0.2s ease-in-out'
          }
        }}>
          {[
            { icon: <UsersIcon />, value: stats.totalUsers || 0, label: 'Total Users', color: 'primary.main' },
            { icon: <CheckIcon />, value: stats.activeUsers || 0, label: 'Active Users', color: 'success.main' },
            { icon: <LogsIcon />, value: stats.totalLogs || 0, label: 'Activity Logs', color: 'info.main' },
            { 
              icon: stats.systemHealth === 'healthy' ? <CheckIcon /> : <ErrorIcon />, 
              value: stats.systemHealth === 'healthy' ? 'Healthy' : 'Issues', 
              label: 'System Status', 
              color: stats.systemHealth === 'healthy' ? 'success.main' : 'error.main',
              isStatus: true
            }
          ].map((stat, index) => (
            <Card key={index} sx={{ 
              flex: '1 1 240px',
              minWidth: 240,
              bgcolor: 'background.paper',
              border: `1px solid ${theme.palette.divider}`,
              '&:hover': { boxShadow: 2 }
            }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: stat.color, width: 32, height: 32 }}>
                    {React.cloneElement(stat.icon, { fontSize: 'small' })}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {stat.isStatus ? (
                        <Chip 
                          label={stat.value} 
                          color={stat.color.includes('success') ? 'success' : 'error'}
                          size="small"
                        />
                      ) : (
                        stat.value.toLocaleString()
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Admin Actions - Flexible Grid */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Administrative Tools
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 2 
          }}>
            {adminActions.map((action, index) => (
              <Card key={index} sx={{ 
                flex: '1 1 300px',
                minWidth: 300,
                maxWidth: 400,
                border: `1px solid ${theme.palette.divider}`,
                '&:hover': { 
                  boxShadow: 3,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s ease-in-out'
                }
              }}>
                <CardContent sx={{ p: 2.5, pb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                    <Avatar sx={{ bgcolor: `${action.color}.main`, width: 32, height: 32 }}>
                      {React.cloneElement(action.icon, { fontSize: 'small' })}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {action.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                        {action.description}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
                <CardActions sx={{ p: 2.5, pt: 0 }}>
                  <Button 
                    variant="contained" 
                    color={action.color}
                    onClick={action.action}
                    size="small"
                    fullWidth
                    sx={{ py: 0.75 }}
                  >
                    {action.buttonText}
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Box>
        </Box>

        {/* Quick Actions & Recent Activity - Side by Side */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
          {/* Quick Actions */}
          <Paper sx={{ 
            flex: { xs: '1 1 100%', md: '1 1 40%' },
            p: 2.5,
            border: `1px solid ${theme.palette.divider}`
          }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Quick Actions
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: 1 
            }}>
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outlined"
                  startIcon={action.icon}
                  onClick={action.action}
                  size="small"
                  sx={{ 
                    justifyContent: 'flex-start',
                    py: 1,
                    px: 2
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </Box>
          </Paper>

          {/* Recent Activity */}
          <Paper sx={{ 
            flex: { xs: '1 1 100%', md: '1 1 60%' },
            p: 2.5,
            border: `1px solid ${theme.palette.divider}`
          }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Recent System Activity
            </Typography>
            <List sx={{ p: 0 }}>
              {[
                { icon: <InfoIcon color="info" />, primary: "System started successfully", secondary: "2 minutes ago" },
                { icon: <CheckIcon color="success" />, primary: "Admin user logged in", secondary: "5 minutes ago" },
                { icon: <LogsIcon color="primary" />, primary: "Activity logs accessed", secondary: "10 minutes ago" },
                { icon: <WarningIcon color="warning" />, primary: "High memory usage detected", secondary: "1 hour ago" }
              ].map((item, index) => (
                <React.Fragment key={index}>
                  <ListItem sx={{ px: 0, py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {React.cloneElement(item.icon, { fontSize: 'small' })}
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {item.primary}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {item.secondary}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < 3 && <Divider sx={{ my: 0.5 }} />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default SuperAdminPage;
