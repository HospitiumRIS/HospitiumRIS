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
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  IconButton
} from '@mui/material';
import {
  Category as CategoryIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Campaign as CampaignIcon,
  Star as StarIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  Insights as InsightsIcon,
  CompareArrows as CompareIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';

const CategoryAnalytics = memo(({ analyticsData, loading }) => {
  const theme = useTheme();
  const [sortBy, setSortBy] = useState('raised');
  const [viewMode, setViewMode] = useState('performance');

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

  const getGrowthIcon = (growth) => {
    if (growth > 0) return <TrendingUpIcon sx={{ color: '#4caf50', fontSize: 16 }} />;
    if (growth < 0) return <TrendingDownIcon sx={{ color: '#f44336', fontSize: 16 }} />;
    return null;
  };

  const getCategoryColor = (index) => {
    const colors = [
      '#8b6cbc', '#4caf50', '#2196f3', '#ff9800', '#f44336',
      '#9c27b0', '#00bcd4', '#8bc34a', '#ff5722', '#607d8b'
    ];
    return colors[index % colors.length];
  };

  // Process category data
  const categories = useMemo(() => {
    if (!analyticsData?.categoryPerformance) return [];
    
    let processedCategories = analyticsData.categoryPerformance.map((category, index) => ({
      ...category,
      color: getCategoryColor(index),
      efficiency: category.donationCount > 0 ? category.raised / category.donationCount : 0,
      campaignSuccess: category.campaignCount > 0 ? 
        (category.campaignCount - (category.failedCampaigns || 0)) / category.campaignCount * 100 : 0
    }));

    // Sort categories
    switch (sortBy) {
      case 'raised':
        processedCategories.sort((a, b) => (b.raised || 0) - (a.raised || 0));
        break;
      case 'donors':
        processedCategories.sort((a, b) => (b.donorCount || 0) - (a.donorCount || 0));
        break;
      case 'campaigns':
        processedCategories.sort((a, b) => (b.campaignCount || 0) - (a.campaignCount || 0));
        break;
      case 'efficiency':
        processedCategories.sort((a, b) => b.efficiency - a.efficiency);
        break;
      default:
        break;
    }

    return processedCategories;
  }, [analyticsData?.categoryPerformance, sortBy]);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!categories.length) return { totalCategories: 0, topPerformer: null, totalRaised: 0, avgEfficiency: 0 };
    
    const totalRaised = categories.reduce((sum, cat) => sum + (cat.raised || 0), 0);
    const totalDonors = categories.reduce((sum, cat) => sum + (cat.donorCount || 0), 0);
    const topPerformer = categories.reduce((top, cat) => 
      (cat.raised || 0) > (top.raised || 0) ? cat : top, categories[0]);
    const avgEfficiency = categories.reduce((sum, cat) => sum + cat.efficiency, 0) / categories.length;

    return {
      totalCategories: categories.length,
      topPerformer,
      totalRaised,
      totalDonors,
      avgEfficiency
    };
  }, [categories]);

  // Loading skeleton
  const CategorySkeleton = () => (
    <Box>
      {[1, 2, 3, 4].map(i => (
        <Card key={i} sx={{ mb: 2, borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Skeleton variant="rectangular" width="100%" height={80} />
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
            <Skeleton variant="text" width={250} height={40} />
            <Skeleton variant="text" width={400} height={25} />
          </Box>
        </Stack>
        <CategorySkeleton />
      </Box>
    );
  }

  if (!analyticsData?.categoryPerformance || analyticsData.categoryPerformance.length === 0) {
    return (
      <Box>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
          <CategoryIcon sx={{ fontSize: 32, color: '#8b6cbc' }} />
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 800, 
              color: theme.palette.text.primary,
              mb: 0.5
            }}>
              Category Analytics
            </Typography>
            <Typography variant="body1" sx={{ 
              color: theme.palette.text.secondary
            }}>
              Performance analysis across different fundraising categories
            </Typography>
          </Box>
        </Stack>

        <Alert severity="info" sx={{ borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>No Category Data Available</Typography>
          <Typography>
            Create campaigns with different categories to see detailed category performance analytics.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Page Title */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <CategoryIcon sx={{ fontSize: 32, color: '#8b6cbc' }} />
        <Box>
          <Typography variant="h4" sx={{ 
            fontWeight: 800, 
            color: theme.palette.text.primary,
            mb: 0.5
          }}>
            Category Analytics
          </Typography>
          <Typography variant="body1" sx={{ 
            color: theme.palette.text.secondary
          }}>
            Performance analysis across different fundraising categories
          </Typography>
        </Box>
      </Stack>

      {/* Overview Statistics */}
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
            title: 'Total Categories',
            value: statistics.totalCategories,
            icon: CategoryIcon,
            color: '#8b6cbc'
          },
          {
            title: 'Top Performer',
            value: statistics.topPerformer?.name || 'N/A',
            subtitle: statistics.topPerformer ? formatCurrency(statistics.topPerformer.raised) : '',
            icon: StarIcon,
            color: '#ff9800'
          },
          {
            title: 'Total Raised',
            value: formatCurrency(statistics.totalRaised),
            icon: MoneyIcon,
            color: '#4caf50'
          },
          {
            title: 'Avg Efficiency',
            value: formatCurrency(statistics.avgEfficiency),
            subtitle: 'Per donor',
            icon: AssessmentIcon,
            color: '#2196f3'
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
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.25, fontSize: '1rem' }}>
                  {stat.value}
                </Typography>
                {stat.subtitle && (
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.8, display: 'block' }}>
                    {stat.subtitle}
                  </Typography>
                )}
                <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', opacity: 0.9 }}>
                  {stat.title}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Controls */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 4, 
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortBy}
            label="Sort By"
            onChange={(e) => setSortBy(e.target.value)}
          >
            <MenuItem value="raised">Total Raised</MenuItem>
            <MenuItem value="donors">Donor Count</MenuItem>
            <MenuItem value="campaigns">Campaign Count</MenuItem>
            <MenuItem value="efficiency">Efficiency</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>View Mode</InputLabel>
          <Select
            value={viewMode}
            label="View Mode"
            onChange={(e) => setViewMode(e.target.value)}
          >
            <MenuItem value="performance">Performance</MenuItem>
            <MenuItem value="comparison">Comparison</MenuItem>
            <MenuItem value="insights">Insights</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Main Content */}
      <Box sx={{ 
        display: 'flex', 
        gap: 4,
        flexDirection: { xs: 'column', lg: 'row' }
      }}>
        {/* Category Performance Table */}
        <Card sx={{ borderRadius: 3, flex: { xs: 1, lg: 2 } }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 3, borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <BarChartIcon sx={{ color: '#8b6cbc' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Category Performance
          </Typography>
              </Stack>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'rgba(139, 108, 188, 0.05)' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Raised</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Campaigns</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Donors</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Efficiency</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Success Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories.map((category, index) => (
                    <TableRow key={category.id || index} sx={{ 
                      '&:hover': { backgroundColor: 'rgba(139, 108, 188, 0.02)' },
                      borderBottom: '1px solid rgba(0,0,0,0.05)'
                    }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ 
                            width: 36, 
                            height: 36, 
                            backgroundColor: category.color,
                            fontSize: '0.8rem',
                            fontWeight: 600
                          }}>
                            {category.name?.charAt(0) || 'C'}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {category.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {category.donationCount || 0} donations
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#4caf50' }}>
                          {formatCurrency(category.raised)}
                        </Typography>
                      </TableCell>
                      
                      <TableCell align="center">
                        <Chip 
                          label={category.campaignCount || 0}
                          size="small"
                          sx={{
                            backgroundColor: `${category.color}20`,
                            color: category.color,
                            fontWeight: 600
                          }}
                        />
                      </TableCell>
                      
                      <TableCell align="center">
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {category.donorCount || 0}
                        </Typography>
                      </TableCell>
                      
                      <TableCell align="center">
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatCurrency(category.efficiency)}
                        </Typography>
                      </TableCell>
                      
                      <TableCell align="center">
                        <Box sx={{ minWidth: 80 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}>
                            {formatPercentage(category.campaignSuccess)}
          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(category.campaignSuccess || 0, 100)}
                            sx={{
                              height: 4,
                              borderRadius: 2,
                              backgroundColor: 'rgba(139, 108, 188, 0.1)',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: category.campaignSuccess >= 75 ? '#4caf50' : 
                                               category.campaignSuccess >= 50 ? '#ff9800' : '#f44336',
                                borderRadius: 2
                              }
                            }}
                          />
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Category Insights */}
        <Card sx={{ borderRadius: 3, flex: { xs: 1, lg: 1 } }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
              <InsightsIcon sx={{ color: '#8b6cbc' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Category Insights
              </Typography>
          </Stack>

            <List sx={{ p: 0 }}>
              {categories.slice(0, 5).map((category, index) => (
                <React.Fragment key={category.id || index}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ 
                        backgroundColor: category.color,
                        width: 32,
                        height: 32,
                        fontSize: '0.75rem'
                      }}>
                        {index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {category.name}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {formatCurrency(category.raised)} raised
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {category.donorCount} donors • {category.campaignCount} campaigns
                          </Typography>
                        </Box>
                      }
                    />
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: category.color }}>
                        {formatPercentage(category.campaignSuccess)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Success Rate
                      </Typography>
                    </Box>
                  </ListItem>
                  {index < categories.slice(0, 5).length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>

            {categories.length > 5 && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Showing top 5 categories
                </Typography>
              </Box>
            )}
        </CardContent>
      </Card>
      </Box>
    </Box>
  );
});

CategoryAnalytics.displayName = 'CategoryAnalytics';

export default CategoryAnalytics;
