'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  InputAdornment,
  TextField,
  alpha,
  Avatar,
  Stack,
  Divider,
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  Campaign as CampaignIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as GrantIcon,
  Assessment as AnalyticsIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  FileDownload as ExportIcon,
  Refresh as RefreshIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as LineChartIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import { useAuth } from '@/components/AuthProvider';

// NoSSR wrapper component to prevent hydration mismatch
const NoSSR = ({ children, fallback = null }) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return fallback;
  }

  return children;
};

const FoundationAnalyticsDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [greeting, setGreeting] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  // Get user display name
  const getUserDisplayName = () => {
    if (user?.givenName && user?.familyName) {
      return `${user.givenName} ${user.familyName}`;
    }
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  // Get formatted account type display name
  const getAccountTypeDisplay = () => {
    if (!user || !user.accountType) return 'User Account';
    
    const accountType = user.accountType.toLowerCase();
    
    switch (accountType) {
      case 'researcher':
        return 'Researcher';
      case 'research_admin':
        return 'Research Administrator';
      case 'foundation_admin':
        return 'Foundation Administrator';
      case 'super_admin':
        return 'Super Administrator';
      case 'global_admin':
        return 'Global Admin';
      default:
        return 'User Account';
    }
  };

  // Initialize date and greeting
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const options = { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      setCurrentDate(now.toLocaleDateString('en-US', options));

      const hour = now.getHours();
      if (hour < 12) {
        setGreeting('Good morning');
      } else if (hour < 18) {
        setGreeting('Good afternoon');
      } else {
        setGreeting('Good evening');
      }
    };

    updateDateTime();
  }, []);

  // Load analytics data
  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/foundation/analytics');
      if (!response.ok) {
        throw new Error('Failed to fetch foundation analytics');
      }
      
      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'completed': return 'info';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const handleRefresh = () => {
    loadAnalyticsData();
  };

  const handleExport = () => {
    console.log('Export analytics data');
  };

  if (loading) {
    return (
      <NoSSR fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><CircularProgress size={60} sx={{ color: '#8b6cbc' }} /></Box>}>
        <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
          <PageHeader
            title={`${greeting}, ${getUserDisplayName()}!`}
            description={
              <>
                <span style={{ fontSize: '0.95rem', fontWeight: 400, opacity: 0.9 }}>
                  Logged in as: <span style={{ fontWeight: 700, color: '#fff' }}>{getAccountTypeDisplay()}</span>
                </span>
                <br />
                Here's what's happening with your foundation today
                <br />
                <span style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                  {currentDate}
                </span>
              </>
            }
            gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 100%)"
          />
          <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
              <CircularProgress size={60} sx={{ color: '#8b6cbc' }} />
            </Box>
          </Container>
        </Box>
      </NoSSR>
    );
  }

  if (error) {
    return (
      <NoSSR fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><CircularProgress size={60} sx={{ color: '#8b6cbc' }} /></Box>}>
        <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
          <PageHeader
            title={`${greeting}, ${getUserDisplayName()}!`}
            description={
              <>
                <span style={{ fontSize: '0.95rem', fontWeight: 400, opacity: 0.9 }}>
                  Logged in as: <span style={{ fontWeight: 700, color: '#fff' }}>{getAccountTypeDisplay()}</span>
                </span>
                <br />
                Here's what's happening with your foundation today
                <br />
                <span style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                  {currentDate}
                </span>
              </>
            }
            gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 100%)"
          />
          <Container maxWidth="xl" sx={{ py: 4 }}>
            <Alert severity="error" sx={{ mb: 4 }}>
              {error}
            </Alert>
          </Container>
        </Box>
      </NoSSR>
    );
  }

  return (
    <NoSSR fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><CircularProgress size={60} sx={{ color: '#8b6cbc' }} /></Box>}>
      {/* Full-width Page Header */}
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title={`${greeting}, ${getUserDisplayName()}!`}
          description={
            <>
              <span style={{ fontSize: '0.95rem', fontWeight: 400, opacity: 0.9 }}>
                Logged in as: <span style={{ fontWeight: 700, color: '#fff' }}>{getAccountTypeDisplay()}</span>
              </span>
              <br />
              Here's what's happening with your foundation today
              <br />
              <span style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                {currentDate}
              </span>
            </>
          }
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 100%)"
        />
      </Box>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Analytics Dashboard Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#8b6cbc', mb: 1 }}>
            Analytics Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive overview of your fundraising performance and donor engagement
          </Typography>
        </Box>

        {/* Key Performance Indicators */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#8b6cbc' }}>
            Key Performance Indicators
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            gap: 3, 
            flexWrap: 'wrap',
            '& > *': {
              flex: {
                xs: '1 1 100%',
                sm: '1 1 calc(50% - 12px)',
                md: '1 1 calc(33.333% - 16px)',
                lg: '1 1 calc(16.666% - 20px)'
              }
            }
          }}>
            <Card elevation={3} sx={{ 
              background: 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 100%)',
              color: 'white',
              height: '100%',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: 0,
                width: '50%',
                height: '100%',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50% 0 0 50%',
                transform: 'translateX(60%)'
              }
            }}>
              <CardContent sx={{ p: 2, position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <MoneyIcon sx={{ fontSize: 24, opacity: 0.9 }} />
                  <Chip 
                    label="+0%"
                    size="small"
                    sx={{ 
                      backgroundColor: 'rgba(255,255,255,0.25)',
                      color: 'white',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      border: '1px solid rgba(255,255,255,0.3)'
                    }}
                  />
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5, fontSize: '2rem' }}>
                  {formatCurrency(analyticsData.overview.totalRaised + analyticsData.overview.totalGrants)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.95, fontWeight: 500 }}>
                  Total Raised
                </Typography>
              </CardContent>
            </Card>

            <Card elevation={3} sx={{ 
              background: 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 100%)',
              color: 'white',
              height: '100%',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: 0,
                width: '50%',
                height: '100%',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50% 0 0 50%',
                transform: 'translateX(60%)'
              }
            }}>
              <CardContent sx={{ p: 2, position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <CampaignIcon sx={{ fontSize: 24, opacity: 0.9 }} />
                  <Chip 
                    label="+0%"
                    size="small"
                    sx={{ 
                      backgroundColor: 'rgba(255,255,255,0.25)',
                      color: 'white',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      border: '1px solid rgba(255,255,255,0.3)'
                    }}
                  />
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5, fontSize: '2rem' }}>
                  {analyticsData.overview.totalDonations}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.95, fontWeight: 500 }}>
                  Total Donations
                </Typography>
              </CardContent>
            </Card>

            <Card elevation={3} sx={{ 
              background: 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 100%)',
              color: 'white',
              height: '100%',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: 0,
                width: '50%',
                height: '100%',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50% 0 0 50%',
                transform: 'translateX(60%)'
              }
            }}>
              <CardContent sx={{ p: 2, position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <PeopleIcon sx={{ fontSize: 24, opacity: 0.9 }} />
                  <Chip 
                    label="+0%"
                    size="small"
                    sx={{ 
                      backgroundColor: 'rgba(255,255,255,0.25)',
                      color: 'white',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      border: '1px solid rgba(255,255,255,0.3)'
                    }}
                  />
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5, fontSize: '2rem' }}>
                  {analyticsData.overview.uniqueDonors}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.95, fontWeight: 500 }}>
                  Unique Donors
                </Typography>
              </CardContent>
            </Card>

            <Card elevation={3} sx={{ 
              background: 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 100%)',
              color: 'white',
              height: '100%',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: 0,
                width: '50%',
                height: '100%',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50% 0 0 50%',
                transform: 'translateX(60%)'
              }
            }}>
              <CardContent sx={{ p: 2, position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <MoneyIcon sx={{ fontSize: 24, opacity: 0.9 }} />
                  <Chip 
                    label="+0%"
                    size="small"
                    sx={{ 
                      backgroundColor: 'rgba(255,255,255,0.25)',
                      color: 'white',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      border: '1px solid rgba(255,255,255,0.3)'
                    }}
                  />
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5, fontSize: '2rem' }}>
                  {formatCurrency(analyticsData.overview.averageDonation)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.95, fontWeight: 500 }}>
                  Average Donation
                </Typography>
              </CardContent>
            </Card>

            <Card elevation={3} sx={{ 
              background: 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 100%)',
              color: 'white',
              height: '100%',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: 0,
                width: '50%',
                height: '100%',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50% 0 0 50%',
                transform: 'translateX(60%)'
              }
            }}>
              <CardContent sx={{ p: 2, position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <GrantIcon sx={{ fontSize: 24, opacity: 0.9 }} />
                  <Chip 
                    label="+0%"
                    size="small"
                    sx={{ 
                      backgroundColor: 'rgba(255,255,255,0.25)',
                      color: 'white',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      border: '1px solid rgba(255,255,255,0.3)'
                    }}
                  />
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5, fontSize: '2rem' }}>
                  {analyticsData.overview.activeGrants}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.95, fontWeight: 500 }}>
                  Active Grants
                </Typography>
              </CardContent>
            </Card>

          </Box>
        </Box>

        {/* Charts Section */}
        <Box sx={{ 
          display: 'flex', 
          gap: 4, 
          mb: 4, 
          flexWrap: 'wrap',
          '& > *:first-of-type': {
            flex: {
              xs: '1 1 100%',
              lg: '1 1 calc(60% - 16px)'
            }
          },
          '& > *:last-of-type': {
            flex: {
              xs: '1 1 100%',
              lg: '1 1 calc(40% - 16px)'
            }
          }
        }}>
          {/* Campaign Performance Chart */}
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <BarChartIcon sx={{ color: '#8b6cbc' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Performance Overview
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Top performing fundraising campaigns by amount raised
              </Typography>
              
              {/* Mock Bar Chart */}
              <Box sx={{ 
                height: 300, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: alpha('#8b6cbc', 0.05),
                borderRadius: 2,
                position: 'relative'
              }}>
                {analyticsData.campaignPerformance && analyticsData.campaignPerformance.length > 0 ? (
                  <Stack spacing={2} sx={{ width: '100%', px: 3 }}>
                    {analyticsData.campaignPerformance.slice(0, 4).map((item, index) => (
                      <Box key={item.id}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {item.name}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#8b6cbc' }}>
                            {formatCurrency(item.raised)}
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={(item.raised / 400000) * 100}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: alpha('#8b6cbc', 0.1),
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: index === 0 ? '#8b6cbc' : 
                                             index === 1 ? '#a084d1' : 
                                             index === 2 ? '#b794f4' : '#c8a8f6',
                              borderRadius: 4
                            }
                          }}
                        />
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No campaign performance data available
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <PieChartIcon sx={{ color: '#8b6cbc' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Category Distribution
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Fundraising performance breakdown by category
              </Typography>
              
              {/* Mock Pie Chart */}
              <Box sx={{ 
                height: 300, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: alpha('#8b6cbc', 0.05),
                borderRadius: 2,
                position: 'relative'
              }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ fontWeight: 600, color: '#8b6cbc', mb: 1 }}>
                    {formatCurrency(analyticsData.overview.totalRaised + analyticsData.overview.totalGrants)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Raised
                  </Typography>
                  <Box sx={{ mt: 3 }}>
                    {analyticsData.categoryDistribution.map((category, index) => (
                      <Stack key={category.category} direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                        <Box sx={{ 
                          width: 12, 
                          height: 12, 
                          borderRadius: '50%', 
                          backgroundColor: category.color 
                        }} />
                        <Typography variant="caption">
                          {category.category} ({category.percentage}%)
                        </Typography>
                      </Stack>
                    ))}
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Monthly Trends Chart */}
        <Card sx={{ borderRadius: 3, boxShadow: 2, mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
              <LineChartIcon sx={{ color: '#8b6cbc' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Monthly Fundraising Trends
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Donation patterns and growth over the last 6 months
            </Typography>
            
            {/* Mock Line Chart */}
            <Box sx={{ 
              height: 300, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: alpha('#8b6cbc', 0.05),
              borderRadius: 2
            }}>
              <Stack spacing={1} sx={{ width: '100%', px: 3 }}>
                {analyticsData.monthlyTrends.map((trend, index) => (
                  <Stack key={trend.month} direction="row" alignItems="center" spacing={2}>
                    <Typography variant="body2" sx={{ minWidth: 80, fontWeight: 500 }}>
                      {trend.month}
                    </Typography>
                    <Box sx={{ flex: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={(trend.total / 250000) * 100}
                        sx={{
                          height: 12,
                          borderRadius: 6,
                          backgroundColor: alpha('#8b6cbc', 0.1),
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: '#8b6cbc',
                            borderRadius: 6
                          }
                        }}
                    />
                  </Box>
                    <Typography variant="body2" sx={{ minWidth: 80, fontWeight: 600, color: '#8b6cbc' }}>
                      {formatCurrency(trend.total)}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </CardContent>
        </Card>

        {/* Data Tables Section */}
        <Box sx={{ 
          display: 'flex', 
          gap: 4, 
          flexWrap: 'wrap',
          '& > *': {
            flex: {
              xs: '1 1 100%',
              lg: '1 1 calc(50% - 16px)'
            }
          }
        }}>
          {/* Top Donors */}
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Top Donors
                </Typography>
                <TextField
                  size="small"
                  placeholder="Search donors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ width: 200 }}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Highest contributing donors by total donation amount
              </Typography>

              {analyticsData.topDonors && analyticsData.topDonors.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Donor</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Total Donated</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Avg Amount</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Recent Gift</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analyticsData.topDonors.map((donor) => (
                        <TableRow key={donor.id} hover>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={2}>
                              <Avatar sx={{ 
                                bgcolor: '#8b6cbc', 
                                width: 32, 
                                height: 32,
                                fontSize: '0.875rem'
                              }}>
                                {donor.name.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {donor.name}
                                </Typography>
                                <Chip 
                                  label={donor.type} 
                                  size="small"
                                  sx={{
                                    backgroundColor: alpha('#8b6cbc', 0.1),
                                    color: '#8b6cbc',
                                    fontSize: '0.75rem',
                                    height: 20
                                  }}
                                />
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#8b6cbc' }}>
                              {formatCurrency(donor.totalDonated)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatCurrency(donor.avgAmount)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(donor.recentGift)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No donor data available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Campaign Performance */}
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Campaign Performance
                </Typography>
                <Tooltip title="Filter">
                  <IconButton size="small">
                    <FilterIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Active and recent fundraising campaigns by performance
              </Typography>

              {analyticsData.campaignPerformance && analyticsData.campaignPerformance.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Campaign</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Amount Raised</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Progress</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analyticsData.campaignPerformance.map((campaign) => (
                      <TableRow key={campaign.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {campaign.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {campaign.category}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#8b6cbc' }}>
                            {formatCurrency(campaign.raised)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            of {formatCurrency(campaign.target)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ minWidth: 80 }}>
                            <LinearProgress
                              variant="determinate"
                              value={campaign.progress}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: alpha('#8b6cbc', 0.1),
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: '#8b6cbc',
                                  borderRadius: 3
                                }
                              }}
                            />
                            <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                              {campaign.progress.toFixed(1)}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={campaign.status}
                            color={getStatusColor(campaign.status)}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No campaign performance data available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Container>
    </NoSSR>
  );
};

export default FoundationAnalyticsDashboard;