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

const FoundationAnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Load analytics data
  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
    setLoading(true);
      setError(null);
      
      // Simulate API calls for both donations and grants data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock comprehensive analytics data
      setAnalyticsData({
        overview: {
          totalRaised: 78500,
          totalDonations: 45,
          uniqueDonors: 32,
          averageDonation: 1744,
          activeCampaigns: 12,
          retentionRate: 68.5,
          totalGrants: 850000,
          activeGrants: 8,
          grantSuccess: 75.0,
          avgGrantAmount: 106250
        },
        monthlyTrends: [
          { month: 'Jan 2024', donations: 12500, grants: 125000, total: 137500 },
          { month: 'Feb 2024', donations: 8300, grants: 75000, total: 83300 },
          { month: 'Mar 2024', donations: 15200, grants: 200000, total: 215200 },
          { month: 'Apr 2024', donations: 18700, grants: 150000, total: 168700 },
          { month: 'May 2024', donations: 11800, grants: 100000, total: 111800 },
          { month: 'Jun 2024', donations: 12000, grants: 200000, total: 212000 }
        ],
        campaignPerformance: [
          {
            id: 1,
            name: 'Annual Golfing Event',
            category: 'Fundraising',
            target: 15000,
            raised: 12500,
            donors: 25,
            progress: 83.3,
            status: 'Active',
            type: 'campaign'
          },
          {
            id: 2,
            name: 'Medical Research Grant',
            category: 'Healthcare',
            target: 250000,
            raised: 250000,
            donors: 1,
            progress: 100,
            status: 'Completed',
            type: 'grant'
          },
          {
            id: 3,
            name: 'Education Initiative',
            category: 'Education',
            target: 50000,
            raised: 35000,
            donors: 18,
            progress: 70,
            status: 'Active',
            type: 'campaign'
          },
          {
            id: 4,
            name: 'Technology Infrastructure Grant',
            category: 'Technology',
            target: 400000,
            raised: 400000,
            donors: 1,
            progress: 100,
            status: 'Completed',
            type: 'grant'
          }
        ],
        categoryDistribution: [
          { category: 'Healthcare', amount: 275000, percentage: 35.1, color: '#8b6cbc' },
          { category: 'Education', amount: 185000, percentage: 23.6, color: '#a084d1' },
          { category: 'Technology', amount: 200000, percentage: 25.5, color: '#b794f4' },
          { category: 'Fundraising', amount: 125000, percentage: 15.9, color: '#c8a8f6' }
        ],
        topDonors: [
          {
            id: 1,
            name: 'NIH Foundation',
            totalDonated: 250000,
            donations: 1,
            avgAmount: 250000,
            firstGift: '2024-01-15',
            recentGift: '2024-01-15',
            type: 'Grant'
          },
          {
            id: 2,
            name: 'Tech Innovation Fund',
            totalDonated: 200000,
            donations: 1,
            avgAmount: 200000,
            firstGift: '2024-03-10',
            recentGift: '2024-03-10',
            type: 'Grant'
          },
          {
            id: 3,
            name: 'Dr. Sarah Johnson',
            totalDonated: 15000,
            donations: 5,
            avgAmount: 3000,
            firstGift: '2024-01-20',
            recentGift: '2024-06-15',
            type: 'Individual'
          },
          {
            id: 4,
            name: 'Community Foundation',
            totalDonated: 8500,
            donations: 3,
            avgAmount: 2833,
            firstGift: '2024-02-05',
            recentGift: '2024-05-30',
            type: 'Foundation'
          }
        ]
      });
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
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Foundation Analytics"
          description="Comprehensive insights into fundraising performance and donor behavior"
          icon={<AnalyticsIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Foundation', path: '/foundation' },
            { label: 'Analytics' }
          ]}
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
        />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <CircularProgress size={60} sx={{ color: '#8b6cbc' }} />
          </Box>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Foundation Analytics"
          description="Comprehensive insights into fundraising performance and donor behavior"
          icon={<AnalyticsIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Foundation', path: '/foundation' },
            { label: 'Analytics' }
          ]}
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
        />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <>
      {/* Full-width Page Header */}
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Foundation Analytics"
          description="Comprehensive insights into fundraising performance and donor behavior"
          icon={<AnalyticsIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Foundation', path: '/foundation' },
            { label: 'Analytics' }
          ]}
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
          actionButton={
            <Stack direction="row" spacing={2}>
              <Tooltip title="Refresh Data">
                <IconButton 
                  onClick={handleRefresh}
                  sx={{ 
                    color: 'white',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Export Report">
                <IconButton 
                  onClick={handleExport}
                  sx={{ 
                    color: 'white',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  <ExportIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          }
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
            <Card sx={{ 
              background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5cac 100%)',
              color: 'white',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 8px 25px rgba(139, 108, 188, 0.3)'
              }
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <MoneyIcon sx={{ fontSize: 28, color: 'rgba(255,255,255,0.9)', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold" sx={{ color: 'white' }}>
                  {formatCurrency(analyticsData.overview.totalRaised + analyticsData.overview.totalGrants)}
                </Typography>
                <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Total Raised
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ 
              background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5cac 100%)',
              color: 'white',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 8px 25px rgba(139, 108, 188, 0.3)'
              }
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <CampaignIcon sx={{ fontSize: 28, color: 'rgba(255,255,255,0.9)', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold" sx={{ color: 'white' }}>
                  {analyticsData.overview.totalDonations}
                </Typography>
                <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Total Donations
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ 
              background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5cac 100%)',
              color: 'white',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 8px 25px rgba(139, 108, 188, 0.3)'
              }
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <PeopleIcon sx={{ fontSize: 28, color: 'rgba(255,255,255,0.9)', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold" sx={{ color: 'white' }}>
                  {analyticsData.overview.uniqueDonors}
                </Typography>
                <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Unique Donors
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ 
              background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5cac 100%)',
              color: 'white',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 8px 25px rgba(139, 108, 188, 0.3)'
              }
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <MoneyIcon sx={{ fontSize: 28, color: 'rgba(255,255,255,0.9)', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold" sx={{ color: 'white' }}>
                  {formatCurrency(analyticsData.overview.averageDonation)}
                </Typography>
                <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Average Donation
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ 
              background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5cac 100%)',
              color: 'white',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 8px 25px rgba(139, 108, 188, 0.3)'
              }
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <GrantIcon sx={{ fontSize: 28, color: 'rgba(255,255,255,0.9)', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold" sx={{ color: 'white' }}>
                  {analyticsData.overview.activeGrants}
                </Typography>
                <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Active Grants
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ 
              background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5cac 100%)',
              color: 'white',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 8px 25px rgba(139, 108, 188, 0.3)'
              }
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <TrendingUpIcon sx={{ fontSize: 28, color: 'rgba(255,255,255,0.9)', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold" sx={{ color: 'white' }}>
                  {analyticsData.overview.grantSuccess}%
                </Typography>
                <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Grant Success
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
            </CardContent>
          </Card>
        </Box>
      </Container>
    </>
  );
};

export default FoundationAnalyticsDashboard;