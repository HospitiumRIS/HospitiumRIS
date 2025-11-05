'use client';

import React, { memo, useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  useTheme,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Avatar,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Skeleton,
  Alert
} from '@mui/material';
import {
  Campaign as CampaignIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Timeline as TimelineIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  CheckCircle as CompletedIcon,
  PlayArrow as ActiveIcon,
  Pause as PausedIcon,
  Schedule as PlanningIcon
} from '@mui/icons-material';

const CampaignAnalytics = memo(({ analyticsData, loading }) => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Utility functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return <ActiveIcon sx={{ color: '#4caf50' }} />;
      case 'completed': return <CompletedIcon sx={{ color: '#2196f3' }} />;
      case 'paused': return <PausedIcon sx={{ color: '#ff9800' }} />;
      case 'planning': return <PlanningIcon sx={{ color: '#757575' }} />;
      default: return <PlanningIcon sx={{ color: '#757575' }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return '#4caf50';
      case 'completed': return '#2196f3';
      case 'paused': return '#ff9800';
      case 'planning': return '#757575';
      default: return '#757575';
    }
  };

  // Process campaign data
  const campaigns = useMemo(() => {
    if (!analyticsData?.campaignPerformance) return [];
    
    let filtered = analyticsData.campaignPerformance;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(campaign => 
        campaign.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(campaign => campaign.status === statusFilter);
    }
    
    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(campaign => campaign.categoryName === categoryFilter);
    }
    
    return filtered;
  }, [analyticsData?.campaignPerformance, searchTerm, statusFilter, categoryFilter]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'Active').length;
    const totalRaised = campaigns.reduce((sum, c) => sum + (c.raised || 0), 0);
    const totalTarget = campaigns.reduce((sum, c) => sum + (c.targetAmount || 0), 0);
    const avgCompletion = totalCampaigns > 0 ? 
      campaigns.reduce((sum, c) => sum + (c.completionPercentage || 0), 0) / totalCampaigns : 0;
    const totalDonors = campaigns.reduce((sum, c) => sum + (c.donorCount || 0), 0);

    return {
      totalCampaigns,
      activeCampaigns,
      totalRaised,
      totalTarget,
      avgCompletion,
      totalDonors,
      completionRate: totalTarget > 0 ? (totalRaised / totalTarget) * 100 : 0
    };
  }, [campaigns]);

  // Get unique categories for filter
  const categories = useMemo(() => {
    if (!analyticsData?.campaignPerformance) return [];
    const uniqueCategories = [...new Set(analyticsData.campaignPerformance.map(c => c.categoryName))];
    return uniqueCategories.filter(cat => cat);
  }, [analyticsData?.campaignPerformance]);

  // Loading skeleton
  const CampaignSkeleton = () => (
    <Box>
      {[1, 2, 3, 4].map(i => (
        <Card key={i} sx={{ mb: 2, borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Skeleton variant="rectangular" width="100%" height={60} />
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  if (loading) {
    return (
      <Box>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
          <Skeleton variant="circular" width={32} height={32} />
          <Box>
            <Skeleton variant="text" width={200} height={40} />
            <Skeleton variant="text" width={300} height={25} />
          </Box>
        </Stack>
        <CampaignSkeleton />
      </Box>
    );
  }

  if (!analyticsData?.campaignPerformance || analyticsData.campaignPerformance.length === 0) {
    return (
      <Box>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
          <CampaignIcon sx={{ fontSize: 32, color: '#8b6cbc' }} />
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 800, 
              color: theme.palette.text.primary,
              mb: 0.5
            }}>
              Campaign Analytics
            </Typography>
            <Typography variant="body1" sx={{ 
              color: theme.palette.text.secondary
            }}>
              In-depth analysis of individual campaign performance and ROI
            </Typography>
          </Box>
        </Stack>

        <Alert severity="info" sx={{ borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>No Campaign Data Available</Typography>
          <Typography>
            Create some campaigns and start collecting donations to see comprehensive analytics here.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Page Title */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <CampaignIcon sx={{ fontSize: 32, color: '#8b6cbc' }} />
        <Box>
          <Typography variant="h4" sx={{ 
            fontWeight: 800, 
            color: theme.palette.text.primary,
            mb: 0.5
          }}>
            Campaign Analytics
          </Typography>
          <Typography variant="body1" sx={{ 
            color: theme.palette.text.secondary
          }}>
            In-depth analysis of individual campaign performance and ROI
          </Typography>
        </Box>
      </Stack>

      {/* Statistics Cards */}
      <Box sx={{ 
        display: 'flex', 
        gap: 3, 
        mb: 4,
        flexWrap: 'wrap',
        '& > *': { 
          flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', lg: '1 1 calc(25% - 18px)' } 
        }
      }}>
        {[
          {
            title: 'Total Campaigns',
            value: statistics.totalCampaigns,
            icon: CampaignIcon,
            color: '#8b6cbc'
          },
          {
            title: 'Active Campaigns',
            value: statistics.activeCampaigns,
            icon: ActiveIcon,
            color: '#4caf50'
          },
          {
            title: 'Total Raised',
            value: formatCurrency(statistics.totalRaised),
            icon: MoneyIcon,
            color: '#2196f3'
          },
          {
            title: 'Total Donors',
            value: statistics.totalDonors,
            icon: PeopleIcon,
            color: '#ff9800'
          }
        ].map((stat, index) => (
          <Card key={index} sx={{
        borderRadius: 3,
            height: '120px',
            background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5cac 100%)',
            color: 'white',
            boxShadow: '0 3px 12px rgba(139, 108, 188, 0.15)',
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: '0 6px 20px rgba(139, 108, 188, 0.3)'
            },
            transition: 'all 0.3s ease'
          }}>
            <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <stat.icon sx={{ fontSize: 20, color: 'white' }} />
                </Box>
              </Stack>
              
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.25 }}>
                  {stat.value}
                </Typography>
                <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', opacity: 0.9 }}>
                  {stat.title}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 4, borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            gap: 3, 
            flexWrap: 'wrap',
            alignItems: 'center',
            '& > *': { 
              flex: { xs: '1 1 100%', sm: '1 1 calc(33.333% - 16px)', lg: '1 1 calc(25% - 18px)' } 
            }
          }}>
            <TextField
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#8b6cbc' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: '#8b6cbc' },
                  '&.Mui-focused fieldset': { borderColor: '#8b6cbc' }
                }
              }}
            />

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Paused">Paused</MenuItem>
                <MenuItem value="Planning">Planning</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map(category => (
                  <MenuItem key={category} value={category}>{category}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Campaign Performance Table */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Campaign Performance Details
          </Typography>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'rgba(139, 108, 188, 0.05)' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Campaign</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Target</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Raised</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Progress</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Donors</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {campaigns.map((campaign, index) => (
                  <TableRow key={campaign.id || index} sx={{ 
                    '&:hover': { backgroundColor: 'rgba(139, 108, 188, 0.02)' },
                    borderBottom: '1px solid rgba(0,0,0,0.05)'
                  }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ 
                          width: 40, 
                          height: 40, 
                          backgroundColor: campaign.categoryColor || '#8b6cbc',
                          fontSize: '0.9rem',
                          fontWeight: 600
                        }}>
                          {campaign.name?.charAt(0) || 'C'}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {campaign.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {campaign.donationCount || 0} donations
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Chip 
                        label={campaign.categoryName || 'Unknown'} 
                        size="small"
                        sx={{
                          backgroundColor: `${campaign.categoryColor || '#8b6cbc'}20`,
                          color: campaign.categoryColor || '#8b6cbc',
                          border: `1px solid ${campaign.categoryColor || '#8b6cbc'}40`
                        }}
                      />
                    </TableCell>
                    
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatCurrency(campaign.targetAmount)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#4caf50' }}>
                        {formatCurrency(campaign.raised)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="center">
                      <Box sx={{ width: '100%', maxWidth: 100 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {formatPercentage(campaign.completionPercentage)}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(campaign.completionPercentage || 0, 100)}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: 'rgba(139, 108, 188, 0.1)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: campaign.completionPercentage >= 100 ? '#4caf50' : '#8b6cbc',
                              borderRadius: 3
                            }
                          }}
                        />
                      </Box>
                    </TableCell>
                    
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {campaign.donorCount || 0}
          </Typography>
                    </TableCell>
                    
                    <TableCell align="center">
                      <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                        {getStatusIcon(campaign.status)}
                        <Chip 
                          label={campaign.status} 
                          size="small"
                          sx={{
                            backgroundColor: `${getStatusColor(campaign.status)}20`,
                            color: getStatusColor(campaign.status),
                            fontWeight: 600
                          }}
                        />
                      </Stack>
                    </TableCell>
                    
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="View Details">
                          <IconButton size="small" sx={{ color: '#8b6cbc' }}>
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Campaign">
                          <IconButton size="small" sx={{ color: '#8b6cbc' }}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
          </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {campaigns.length === 0 && (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <CampaignIcon sx={{ fontSize: 64, color: 'rgba(139, 108, 188, 0.3)', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No campaigns found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search or filter criteria.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
});

CampaignAnalytics.displayName = 'CampaignAnalytics';

export default CampaignAnalytics;
