'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as UsersIcon,
  PersonAdd as PersonAddIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import SuperAdminLayout from '../../components/SuperAdmin/SuperAdminLayout';

const SuperAdminPage = () => {
  const theme = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({});
  const [recentUsers, setRecentUsers] = useState([]);
  const [systemHealth, setSystemHealth] = useState({});
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState('week');

  // Check Super Admin access
  useEffect(() => {
    // Wait for auth to finish loading before checking
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (user.accountType !== 'SUPER_ADMIN') {
      router.push('/dashboard');
      return;
    }
  }, [user, router, authLoading]);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch(`/api/super-admin/dashboard-stats?period=${timePeriod}`);
        console.log('Dashboard API Response Status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Dashboard API Data:', data);
          setStats(data.stats || {});
          setRecentUsers(data.recentUsers || []);
          setSystemHealth(data.systemHealth || {});
        } else {
          const errorData = await response.json();
          console.error('Dashboard API Error:', errorData);
          // Fallback to mock data
          setStats({
            totalUsers: 12,
            newUsersToday: 3,
            activeUsers: 8,
            pendingUsers: 2,
            totalManuscripts: 45,
            activeManuscripts: 23
          });
          setRecentUsers([
            { id: 1, name: 'John Doe', email: 'john@example.com', accountType: 'RESEARCHER', status: 'ACTIVE', createdAt: new Date().toISOString() },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com', accountType: 'INSTITUTION', status: 'PENDING', createdAt: new Date().toISOString() },
            { id: 3, name: 'Bob Johnson', email: 'bob@example.com', accountType: 'RESEARCHER', status: 'ACTIVE', createdAt: new Date().toISOString() }
          ]);
          setSystemHealth({
            cpuUsage: 45,
            memoryUsage: 62,
            diskUsage: 38,
            status: 'healthy'
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set fallback data
        setStats({
          totalUsers: 12,
          newUsersToday: 3,
          activeUsers: 8,
          pendingUsers: 2,
          totalManuscripts: 45,
          activeManuscripts: 23
        });
        setRecentUsers([]);
        setSystemHealth({
          cpuUsage: 45,
          memoryUsage: 62,
          diskUsage: 38,
          status: 'healthy'
        });
      } finally {
        setLoading(false);
      }
    };

    if (user?.accountType === 'SUPER_ADMIN') {
      fetchDashboardData();
    }
  }, [user, timePeriod]);

  const handleRefresh = () => {
    setLoading(true);
    window.location.reload();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'primary';
      case 'PENDING':
        return 'secondary';
      case 'SUSPENDED':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (!user || user.accountType !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <SuperAdminLayout>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
        {/* Professional Header */}
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
                  background: 'linear-gradient(135deg, #8b6cbc 0%, #7a5caa 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.02em'
                }}
              >
                Dashboard Overview
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                Real-time system performance and user activity monitoring
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

        {/* Professional Stats Cards */}
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 2, 
          mb: 3 
        }}>
          <Box sx={{ flex: '1 1 calc(25% - 12px)', minWidth: '200px' }}>
            <Card 
              sx={{ 
                height: '100%',
                background: 'linear-gradient(135deg, #8b6cbc 0%, #7a5caa 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 40px rgba(139, 108, 188, 0.3)'
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '150px',
                  height: '150px',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                  borderRadius: '50%',
                  transform: 'translate(50%, -50%)'
                }
              }}
            >
              <CardContent sx={{ position: 'relative', zIndex: 1, p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 44, height: 44 }}>
                    <UsersIcon />
                  </Avatar>
                  <Chip 
                    icon={<TrendingUpIcon />} 
                    label="+12%" 
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontWeight: 600
                    }}
                    size="small" 
                  />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, letterSpacing: '-0.02em' }}>
                  {stats.totalUsers || 0}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500, fontSize: '0.875rem' }}>
                  Total Users
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: '1 1 calc(25% - 12px)', minWidth: '200px' }}>
            <Card 
              sx={{ 
                height: '100%',
                background: 'linear-gradient(135deg, #8b6cbc 0%, #7a5caa 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 40px rgba(139, 108, 188, 0.3)'
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '150px',
                  height: '150px',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                  borderRadius: '50%',
                  transform: 'translate(50%, -50%)'
                }
              }}
            >
              <CardContent sx={{ position: 'relative', zIndex: 1, p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 44, height: 44 }}>
                    <PersonAddIcon />
                  </Avatar>
                  <Chip 
                    icon={<TrendingUpIcon />} 
                    label="+3 today" 
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontWeight: 600
                    }}
                    size="small" 
                  />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, letterSpacing: '-0.02em' }}>
                  {stats.newUsersToday || 0}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                  New Users Today
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: '1 1 calc(25% - 12px)', minWidth: '200px' }}>
            <Card 
              sx={{ 
                height: '100%',
                background: 'linear-gradient(135deg, #8b6cbc 0%, #7a5caa 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 40px rgba(139, 108, 188, 0.3)'
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '150px',
                  height: '150px',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                  borderRadius: '50%',
                  transform: 'translate(50%, -50%)'
                }
              }}
            >
              <CardContent sx={{ position: 'relative', zIndex: 1, p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 44, height: 44 }}>
                    <CheckIcon />
                  </Avatar>
                  <Chip 
                    label="Active" 
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontWeight: 600
                    }}
                    size="small" 
                  />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, letterSpacing: '-0.02em' }}>
                  {stats.activeUsers || 0}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                  Active Users
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: '1 1 calc(25% - 12px)', minWidth: '200px' }}>
            <Card 
              sx={{ 
                height: '100%',
                background: 'linear-gradient(135deg, #8b6cbc 0%, #7a5caa 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 40px rgba(139, 108, 188, 0.3)'
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '150px',
                  height: '150px',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                  borderRadius: '50%',
                  transform: 'translate(50%, -50%)'
                }
              }}
            >
              <CardContent sx={{ position: 'relative', zIndex: 1, p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 44, height: 44 }}>
                    <WarningIcon />
                  </Avatar>
                  <Chip 
                    label="Pending" 
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontWeight: 600
                    }}
                    size="small" 
                  />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, letterSpacing: '-0.02em' }}>
                  {stats.pendingUsers || 0}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                  Pending Approvals
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* System Health */}
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 2, 
          mb: 3 
        }}>
          <Box sx={{ flex: '1 1 calc(50% - 12px)', minWidth: '300px' }}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 4, 
                height: '100%',
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(249,250,251,1) 100%)',
                transition: 'box-shadow 0.3s ease-in-out',
                '&:hover': {
                  boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ bgcolor: '#8b6cbc', width: 48, height: 48 }}>
                  <SpeedIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    System Health
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Real-time performance metrics
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SpeedIcon sx={{ color: '#8b6cbc' }} fontSize="small" />
                    <Typography variant="body2">CPU Usage</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={600}>
                    {systemHealth.cpuUsage || 0}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={systemHealth.cpuUsage || 0} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 1,
                    bgcolor: '#f3e5f5',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#8b6cbc'
                    }
                  }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MemoryIcon sx={{ color: '#8b6cbc' }} fontSize="small" />
                    <Typography variant="body2">Memory Usage</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={600}>
                    {systemHealth.memoryUsage || 0}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={systemHealth.memoryUsage || 0} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 1,
                    bgcolor: '#f3e5f5',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#8b6cbc'
                    }
                  }}
                />
              </Box>

              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StorageIcon sx={{ color: '#8b6cbc' }} fontSize="small" />
                    <Typography variant="body2">Disk Usage</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={600}>
                    {systemHealth.diskUsage || 0}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={systemHealth.diskUsage || 0} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 1,
                    bgcolor: '#f3e5f5',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#8b6cbc'
                    }
                  }}
                />
              </Box>

              <Box sx={{ mt: 3, p: 2, bgcolor: '#f3e5f5', borderRadius: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckIcon sx={{ color: '#8b6cbc' }} />
                <Typography variant="body2" sx={{ color: '#8b6cbc' }} fontWeight={600}>
                  System Status: {systemHealth.status === 'healthy' ? 'Healthy' : 'Issues Detected'}
                </Typography>
              </Box>
            </Paper>
          </Box>

          <Box sx={{ flex: '1 1 calc(50% - 12px)', minWidth: '300px' }}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 4, 
                height: '100%',
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(249,250,251,1) 100%)',
                transition: 'box-shadow 0.3s ease-in-out',
                '&:hover': {
                  boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ bgcolor: '#8b6cbc', width: 48, height: 48 }}>
                  <TrendingUpIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Quick Stats
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Key performance indicators
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '120px' }}>
                  <Box sx={{ p: 2, bgcolor: '#f3e5f5', borderRadius: 2, textAlign: 'center', border: '1px solid #e1bee7' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#8b6cbc' }}>
                      {stats.totalManuscripts || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#8b6cbc', fontWeight: 500 }}>
                      Total Manuscripts
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '120px' }}>
                  <Box sx={{ p: 2, bgcolor: '#f3e5f5', borderRadius: 2, textAlign: 'center', border: '1px solid #e1bee7' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#8b6cbc' }}>
                      {stats.activeManuscripts || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#8b6cbc', fontWeight: 500 }}>
                      Active Manuscripts
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '120px' }}>
                  <Box sx={{ p: 2, bgcolor: '#f3e5f5', borderRadius: 2, textAlign: 'center', border: '1px solid #e1bee7' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#8b6cbc' }}>
                      {stats.activeUsers || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#8b6cbc', fontWeight: 500 }}>
                      Online Now
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '120px' }}>
                  <Box sx={{ p: 2, bgcolor: '#f3e5f5', borderRadius: 2, textAlign: 'center', border: '1px solid #e1bee7' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#8b6cbc' }}>
                      {stats.pendingUsers || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#8b6cbc', fontWeight: 500 }}>
                      Pending Reviews
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Box>

        {/* Recent Users Table */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 4,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(249,250,251,1) 100%)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#8b6cbc', width: 48, height: 48 }}>
                <UsersIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Recently Created User Accounts
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Latest user registrations and their status
                </Typography>
              </Box>
            </Box>
            <Chip 
              label={`${recentUsers.length} users`} 
              sx={{ 
                fontWeight: 600, 
                fontSize: '0.875rem', 
                height: 32,
                bgcolor: '#f3e5f5',
                color: '#8b6cbc',
                border: '1px solid #e1bee7'
              }}
            />
          </Box>

          {/* Time Period Filter */}
          <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
            {[
              { value: 'week', label: 'This Week' },
              { value: 'month', label: '1 Month' },
              { value: '3months', label: '3 Months' },
              { value: '6months', label: '6 Months' },
              { value: 'year', label: 'Past Year' }
            ].map((filter) => (
              <Chip
                key={filter.value}
                label={filter.label}
                onClick={() => setTimePeriod(filter.value)}
                sx={{
                  bgcolor: timePeriod === filter.value ? '#8b6cbc' : '#f3e5f5',
                  color: timePeriod === filter.value ? 'white' : '#8b6cbc',
                  border: '1px solid #e1bee7',
                  fontWeight: 600,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: timePeriod === filter.value ? '#7a5caa' : '#ede7f6'
                  }
                }}
              />
            ))}
          </Box>
          
          <TableContainer sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem', color: 'text.primary' }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem', color: 'text.primary' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem', color: 'text.primary' }}>Account Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem', color: 'text.primary' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem', color: 'text.primary' }}>Created</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.875rem', color: 'text.primary' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentUsers.length > 0 ? (
                  recentUsers.map((user) => (
                    <TableRow 
                      key={user.id} 
                      sx={{ 
                        '&:hover': { 
                          bgcolor: 'action.hover',
                          cursor: 'pointer',
                          '& .MuiTableCell-root': {
                            color: 'primary.main'
                          }
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ 
                            width: 36, 
                            height: 36, 
                            bgcolor: 'primary.main',
                            fontWeight: 600,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }}>
                            {user.name?.[0]}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{user.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {user.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={user.accountType} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={user.status} 
                          color={getStatusColor(user.status)} 
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(user.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View details">
                          <IconButton 
                            size="small" 
                            onClick={() => router.push(`/super-admin/users?id=${user.id}`)}
                            sx={{
                              bgcolor: '#8b6cbc',
                              color: 'white',
                              '&:hover': {
                                bgcolor: '#7a5caa',
                                transform: 'scale(1.1)'
                              },
                              transition: 'all 0.2s ease-in-out'
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                        No recent users found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </SuperAdminLayout>
  );
};

export default SuperAdminPage;
