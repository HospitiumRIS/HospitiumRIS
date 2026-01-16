'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Stack,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  Tabs,
  Tab,
  LinearProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as WriteIcon,
  Assignment as ProposalIcon,
  Article as ArticleIcon,
  Work as ProjectIcon,
  Groups as CollaborationIcon,
  Hub as NetworkIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Create as CreateIcon,
  Visibility as VisibilityIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  RateReview as RateReviewIcon,
  Close as CloseIcon,
  OpenInNew as OpenInNewIcon,
  CalendarToday as CalendarTodayIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../components/AuthProvider';
import PageHeader from '../../components/common/PageHeader';
import KenyaNetworkVisualization from '../../components/KenyaNetworkVisualization';

const ResearcherDashboard = () => {
  const theme = useTheme();
  const { user, isLoading } = useAuth();
  const [currentDate, setCurrentDate] = useState('');
  const [greeting, setGreeting] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Analytics widget state
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState('6months'); // '1year', '6months', 'thismonth'
  const [analyticsDataType, setAnalyticsDataType] = useState('publications'); // 'publications' or 'projects'
  
  // Recent work widget state
  const [recentWorkTab, setRecentWorkTab] = useState('all'); // 'all', 'publications', 'projects'
  
  // Details dialog state
  const [detailsDialog, setDetailsDialog] = useState({ open: false, item: null, type: null });
  
  // Current date for dropdowns (to avoid hydration mismatch)
  const [currentDateLabel, setCurrentDateLabel] = useState('');
  const [currentYear, setCurrentYear] = useState('');

  // Fetch real dashboard data from APIs
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        setDataLoading(true);
        setError(null);
        
        // Fetch researcher stats, proposals, and network data in parallel
        const [statsRes, proposalsRes, networkRes] = await Promise.all([
          fetch('/api/researcher/stats', { credentials: 'include' }),
          fetch('/api/proposals', { credentials: 'include' }),
          fetch('/api/network', { credentials: 'include' })
        ]);

        const statsData = statsRes.ok ? await statsRes.json() : null;
        const proposalsData = proposalsRes.ok ? await proposalsRes.json() : { proposals: [] };
        const networkData = networkRes.ok ? await networkRes.json() : { authors: [], publications: [] };

        // Extract data from responses
        const proposals = proposalsData.proposals || [];
        const networkAuthors = networkData.authors || [];

        // Build dashboard stats using real data from stats API
        const stats = {
          totalPublications: { 
            value: statsData?.stats?.publications?.total || 0,
            change: statsData?.stats?.publications?.change || '+0%',
            trend: statsData?.stats?.publications?.trend || 'neutral'
          },
          ongoingProjects: { 
            value: statsData?.stats?.projects?.ongoing || 0,
            change: statsData?.stats?.projects?.change || '+0%',
            trend: statsData?.stats?.projects?.trend || 'neutral'
          },
          collaborations: { 
            value: statsData?.stats?.collaborations?.total || 0,
            change: statsData?.stats?.collaborations?.change || '+0%',
            trend: statsData?.stats?.collaborations?.trend || 'neutral'
          },
          networkSize: { 
            value: statsData?.stats?.network?.total || 0,
            change: statsData?.stats?.network?.change || '+0%',
            trend: statsData?.stats?.network?.trend || 'neutral'
          },
          citationImpact: { 
            value: statsData?.stats?.citations?.total || 0,
            change: statsData?.stats?.citations?.change || '+0%',
            trend: statsData?.stats?.citations?.trend || 'neutral'
          }
        };

        // Recent publications from stats API (with real citation counts)
        const recentPublications = (statsData?.recentPublications || []).map(pub => ({
          id: pub.id,
          title: pub.title,
          journal: pub.journal,
          year: pub.year,
          authors: pub.authors,
          doi: pub.doi,
          citations: pub.citations || 0 // Real citations from OpenAlex API
        }));

        // Collaborative writings (manuscripts)
        const collaborativeWritings = proposals
          .filter(p => ['DRAFT', 'UNDER_REVIEW'].includes(p.status))
          .slice(0, 5)
          .map(proposal => ({
            id: proposal.id,
            title: proposal.title,
            type: 'Research Proposal',
            collaborators: ['Co-Investigators'], // Mock for now
            status: proposal.status === 'DRAFT' ? 'Draft' : 'Review'
          }));

        // Analytics data for chart from stats API - store both publications and projects data
        const publicationsByMonth = statsData?.publicationsByMonth || Array.from({ length: 6 }, (_, i) => ({
          month: new Date(0, i).toLocaleDateString('en-US', { month: 'short' }),
          count: 0
        }));

        // Calculate projects by month from the stats data
        const projectsByMonth = Array.from({ length: 6 }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - (5 - i));
          const monthName = date.toLocaleDateString('en-US', { month: 'short' });
          
          // Count projects created in this month
          const monthProjects = (statsData?.recentProjects?.manuscripts || [])
            .concat(statsData?.recentProjects?.proposals || [])
            .filter(project => {
              const createdDate = new Date(project.createdAt);
              return createdDate.getMonth() === date.getMonth() && 
                     createdDate.getFullYear() === date.getFullYear();
            }).length;
          
          return { month: monthName, count: monthProjects };
        });

        setDashboardData({
          stats,
          collaborativeWritings,
          recentPublications,
    analyticsData: {
            publicationsOverTime: publicationsByMonth,
            projectsOverTime: projectsByMonth,
            publications6Months: publicationsByMonth,
            projects6Months: projectsByMonth
          },
          rawData: {
            publications: statsData?.recentPublications || [],
            proposals,
            networkData,
            allProjects: (statsData?.recentProjects?.manuscripts || [])
              .concat(statsData?.recentProjects?.proposals || [])
          }
        });
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
        // Fallback to mock data on error
        setDashboardData({
          stats: {
            totalPublications: { value: 0, change: '+0%', trend: 'neutral' },
            ongoingProjects: { value: 0, change: '+0%', trend: 'neutral' },
            collaborations: { value: 0, change: '+0%', trend: 'neutral' },
            networkSize: { value: 0, change: '+0%', trend: 'neutral' },
            citationImpact: { value: 0, change: '+0%', trend: 'neutral' }
          },
          collaborativeWritings: [],
          recentPublications: [],
          analyticsData: {
            publicationsOverTime: Array.from({ length: 6 }, (_, i) => ({
              month: new Date(0, i).toLocaleDateString('en-US', { month: 'short' }),
              count: 0
            }))
          }
        });
      } finally {
        setDataLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Get time-appropriate greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour < 12) {
      return 'Good morning';
    } else if (hour < 17) {
      return 'Good afternoon';
    } else {
      return 'Good evening';
    }
  };

  // Initialize date and greeting, and update greeting periodically
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
      setGreeting(getTimeBasedGreeting());
      
      // Set date labels for dropdowns
      setCurrentDateLabel(now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
      setCurrentYear(now.getFullYear().toString());
    };

    // Set initial values
    updateDateTime();

    // Update greeting every 30 minutes to catch time boundary changes
    const interval = setInterval(updateDateTime, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Get user's display name
  const getUserDisplayName = () => {
    if (isLoading) return 'User';
    if (!user) return 'User';
    
    // Try different name fields
    if (user.firstName) {
      return user.firstName;
    } else if (user.fullName) {
      return user.fullName.split(' ')[0]; // Get first name from full name
    } else if (user.name) {
      return user.name.split(' ')[0]; // Get first name from name
    } else if (user.email) {
      return user.email.split('@')[0]; // Use email username as fallback
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
      case 'institution_admin':
        return 'Institution Administrator';
      case 'foundation_manager':
        return 'Foundation Manager';
      case 'super_admin':
        return 'Super Administrator';
      default:
        return 'User Account';
    }
  };

  // Get analytics data based on selected time range and data type (CURRENT YEAR ONLY)
  const getAnalyticsData = () => {
    if (!dashboardData) return [];

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); // 0-11
    const isPublications = analyticsDataType === 'publications';
    const rawData = isPublications 
      ? dashboardData.rawData.publications 
      : dashboardData.rawData.allProjects;

    if (analyticsTimeRange === 'thismonth') {
      // For "this month", show weeks of current month
      const weeksInMonth = 4;
      const today = new Date();
      const currentDay = today.getDate();
      
      return Array.from({ length: weeksInMonth }, (_, i) => {
        const weekNumber = i + 1;
        const weekLabel = `W${weekNumber}`;
        const weekStart = (i * 7) + 1;
        const weekEnd = Math.min((i + 1) * 7, currentDay);
        
        // Count items in this week of current month
        const weekCount = rawData.filter(item => {
          if (!item.createdAt && !item.year && !item.publicationDate) return false;
          
          const itemDate = isPublications
            ? (item.publicationDate ? new Date(item.publicationDate) : item.year === currentYear ? new Date(item.year, currentMonth, 15) : new Date(item.createdAt))
            : new Date(item.createdAt);
          
          if (itemDate.getFullYear() !== currentYear || itemDate.getMonth() !== currentMonth) return false;
          
          const itemDay = itemDate.getDate();
          return itemDay >= weekStart && itemDay <= weekEnd;
        }).length;
        
        return { month: weekLabel, count: weekCount };
      });
    } else if (analyticsTimeRange === '6months') {
      // Show last 6 months of CURRENT YEAR only
      const startMonth = Math.max(0, currentMonth - 5);
      const monthsToShow = currentMonth - startMonth + 1;
      
      return Array.from({ length: monthsToShow }, (_, i) => {
        const monthIndex = startMonth + i;
        const date = new Date(currentYear, monthIndex, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        
        // Count items for this month in current year
        const monthCount = rawData.filter(item => {
          if (!item.createdAt && !item.year && !item.publicationDate) return false;
          
          const itemDate = isPublications
            ? (item.publicationDate ? new Date(item.publicationDate) : item.year === currentYear ? new Date(item.year, 0) : new Date(item.createdAt))
            : new Date(item.createdAt);
          
          return itemDate.getMonth() === monthIndex && 
                 itemDate.getFullYear() === currentYear;
        }).length;
        
        return { month: monthName, count: monthCount };
      });
    } else {
      // Show all months of CURRENT YEAR (Jan to current month)
      return Array.from({ length: currentMonth + 1 }, (_, i) => {
        const date = new Date(currentYear, i, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        
        // Count items for this month in current year
        const monthCount = rawData.filter(item => {
          if (!item.createdAt && !item.year && !item.publicationDate) return false;
          
          const itemDate = isPublications
            ? (item.publicationDate ? new Date(item.publicationDate) : item.year === currentYear ? new Date(item.year, 0) : new Date(item.createdAt))
            : new Date(item.createdAt);
          
          return itemDate.getMonth() === i && 
                 itemDate.getFullYear() === currentYear;
        }).length;
        
        return { month: monthName, count: monthCount };
      });
    }
  };

  // Get color for analytics chart based on data type
  const getAnalyticsColor = () => {
    return analyticsDataType === 'publications' 
      ? { primary: '#8b6cbc', secondary: '#a084d1' }
      : { primary: '#FF6B6B', secondary: '#FF8E8E' };
  };

  // Handle opening details dialog
  const handleViewDetails = (item, type) => {
    setDetailsDialog({ open: true, item, type });
  };

  // Handle closing details dialog
  const handleCloseDetails = () => {
    setDetailsDialog({ open: false, item: null, type: null });
  };

  // Get tooltip content for chart bars (CURRENT YEAR ONLY)
  const getTooltipContent = (item, index) => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const dataTypeName = analyticsDataType === 'publications' ? 'Publications' : 'Projects';
    const total = getAnalyticsData().reduce((sum, d) => sum + d.count, 0);
    const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
    
    let timeLabel = item.month;
    if (analyticsTimeRange === '1year') {
      // Show months of current year
      const date = new Date(currentYear, index, 1);
      timeLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (analyticsTimeRange === '6months') {
      // Show last 6 months of current year
      const startMonth = Math.max(0, currentMonth - 5);
      const date = new Date(currentYear, startMonth + index, 1);
      timeLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (analyticsTimeRange === 'thismonth') {
      timeLabel = `Week ${index + 1} of ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    }

    return (
      <Box sx={{ p: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
          {timeLabel}
        </Typography>
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          {dataTypeName}: <strong>{item.count}</strong>
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
          {percentage}% of total
        </Typography>
        {total > 0 && (
          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'rgba(255,255,255,0.8)' }}>
            Total: {total} {dataTypeName.toLowerCase()}
          </Typography>
        )}
      </Box>
    );
  };

  const actionButtons = (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          color: 'white',
          fontWeight: 600,
          borderRadius: 2,
          px: 3,
          py: 1,
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
          },
        }}
      >
        New Collaborative Writing
      </Button>
      <Button
        variant="contained"
        startIcon={<ProposalIcon />}
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          color: 'white',
          fontWeight: 600,
          borderRadius: 2,
          px: 3,
          py: 1,
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
          },
        }}
      >
        New Project Proposal
      </Button>
    </Stack>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        mt:8,
      }}
    >
      <PageHeader
        title={`${greeting}, ${getUserDisplayName()}!`}
        description={
          <>
            <span style={{ fontSize: '0.95rem', fontWeight: 400, opacity: 0.9 }}>
              Logged in as: <span style={{ fontWeight: 700, color: '#fff' }}>{getAccountTypeDisplay()}</span>
            </span>
            <br />
            Here's what's happening with your research today
            <br />
            <span style={{ fontSize: '0.875rem', opacity: 0.8 }}>
              {currentDate}
            </span>
          </>
        }
        actionButton={actionButtons}
        gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 100%)"
      />
      
      {/* Dashboard Content */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Loading State */}
        {dataLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <Typography variant="h6" sx={{ color: 'text.secondary' }}>Loading your dashboard...</Typography>
          </Box>
        ) : error ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <Typography variant="h6" sx={{ color: 'error.main' }}>{error}</Typography>
          </Box>
        ) : dashboardData && (
          <>
        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Total Publications */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                      <ArticleIcon sx={{ fontSize: 24, opacity: 0.9 }} />
                  <Chip 
                    label={dashboardData.stats.totalPublications.change}
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
                  {dashboardData.stats.totalPublications.value}
                </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.95, fontWeight: 500 }}>
                      Publications
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Ongoing Projects */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                      <ProjectIcon sx={{ fontSize: 24, opacity: 0.9 }} />
                  <Chip 
                    label={dashboardData.stats.ongoingProjects.change}
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
                  {dashboardData.stats.ongoingProjects.value}
                </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.95, fontWeight: 500 }}>
                      Active Projects
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Collaborations */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                      <CollaborationIcon sx={{ fontSize: 24, opacity: 0.9 }} />
                  <Chip 
                    label={dashboardData.stats.collaborations.change}
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
                  {dashboardData.stats.collaborations.value}
                </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.95, fontWeight: 500 }}>
                      Collaborators
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Citation Count */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                      <TrendingUpIcon sx={{ fontSize: 24, opacity: 0.9 }} />
                  <Chip 
                    label={dashboardData.stats.citationImpact.change}
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
                  {dashboardData.stats.citationImpact.value}
                </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.95, fontWeight: 500 }}>
                  Citation Count
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          </Grid>

        <Grid container spacing={4}>
          {/* Research Analytics */}
          <Grid size={{ xs: 12, md: 8 }}>
                <Card elevation={4} sx={{ 
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(139, 108, 188, 0.1)'
                }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.5, color: '#2d3748' }}>
                        <BarChartIcon sx={{ color: '#8b6cbc', fontSize: 28 }} />
                    Research Analytics
                </Typography>
                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <Chip 
                          label="Publications" 
                          size="small" 
                          onClick={() => setAnalyticsDataType('publications')}
                          sx={{ 
                            bgcolor: analyticsDataType === 'publications' ? 'rgba(139, 108, 188, 0.2)' : 'rgba(139, 108, 188, 0.1)', 
                            color: '#8b6cbc',
                            fontWeight: analyticsDataType === 'publications' ? 600 : 400,
                            cursor: 'pointer',
                            border: analyticsDataType === 'publications' ? '2px solid #8b6cbc' : 'none',
                            '&:hover': {
                              bgcolor: 'rgba(139, 108, 188, 0.25)'
                            }
                          }} 
                        />
                        <Chip 
                          label="Projects" 
                          size="small"
                          onClick={() => setAnalyticsDataType('projects')}
                          sx={{ 
                            bgcolor: analyticsDataType === 'projects' ? 'rgba(255, 107, 107, 0.2)' : 'rgba(255, 107, 107, 0.1)', 
                            color: '#FF6B6B',
                            fontWeight: analyticsDataType === 'projects' ? 600 : 400,
                            cursor: 'pointer',
                            border: analyticsDataType === 'projects' ? '2px solid #FF6B6B' : 'none',
                            '&:hover': {
                              bgcolor: 'rgba(255, 107, 107, 0.25)'
                            }
                          }} 
                        />
                  </Box>
                </Box>
                
                    {/* Time Range Selector */}
                    <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="body2" sx={{ color: '#718096', fontWeight: 500 }}>
                        Time Range:
                      </Typography>
                      <FormControl size="small" sx={{ minWidth: 150 }}>
                        <Select
                          value={analyticsTimeRange}
                          onChange={(e) => setAnalyticsTimeRange(e.target.value)}
                          MenuProps={{
                            disableScrollLock: true,
                            PaperProps: {
                              sx: {
                                mt: 1,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                borderRadius: 2
                              }
                            },
                            anchorOrigin: {
                              vertical: 'bottom',
                              horizontal: 'left',
                            },
                            transformOrigin: {
                              vertical: 'top',
                              horizontal: 'left',
                            },
                          }}
                          sx={{
                            bgcolor: 'white',
                            borderRadius: 2,
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(139, 108, 188, 0.3)'
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#8b6cbc'
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#8b6cbc'
                            }
                          }}
                        >
                          <MenuItem value="thismonth">This Month{currentDateLabel && ` (${currentDateLabel})`}</MenuItem>
                          <MenuItem value="6months">Last 6 Months{currentYear && ` (${currentYear})`}</MenuItem>
                          <MenuItem value="1year">Year to Date{currentYear && ` (${currentYear})`}</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                
                    {/* Enhanced Chart */}
                <Box sx={{ 
                      height: 240, 
                  display: 'flex', 
                  alignItems: 'end', 
                  justifyContent: 'space-around',
                      background: `linear-gradient(135deg, ${analyticsDataType === 'publications' ? 'rgba(139, 108, 188, 0.02)' : 'rgba(255, 107, 107, 0.02)'} 0%, ${analyticsDataType === 'publications' ? 'rgba(139, 108, 188, 0.05)' : 'rgba(255, 107, 107, 0.05)'} 100%)`,
                      borderRadius: 2,
                      p: 3,
                      mb: 3,
                      border: `1px solid ${analyticsDataType === 'publications' ? 'rgba(139, 108, 188, 0.1)' : 'rgba(255, 107, 107, 0.1)'}`
                }}>
                  {getAnalyticsData().map((item, index) => {
                    const colors = getAnalyticsColor();
                    return (
                        <Box key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      <Tooltip 
                        title={getTooltipContent(item, index)}
                        arrow
                        placement="top"
                        componentsProps={{
                          tooltip: {
                            sx: {
                              bgcolor: colors.primary,
                              color: 'white',
                              fontSize: '0.875rem',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                              borderRadius: 2,
                              p: 1.5
                            }
                          },
                          arrow: {
                            sx: {
                              color: colors.primary
                            }
                          }
                        }}
                      >
                      <Box sx={{ 
                            width: analyticsTimeRange === '1year' ? 32 : 48,
                            height: Math.max(20, (item.count * 60) + 20),
                            background: item.count > 0 
                              ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` 
                              : `${colors.primary}33`,
                            borderRadius: 2,
                            mb: 1.5,
                            position: 'relative',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            '&:hover': {
                              transform: 'scale(1.08)',
                              boxShadow: `0 6px 20px ${colors.primary}66`
                            },
                            '&::before': {
                              content: `"${item.count}"`,
                              position: 'absolute',
                              top: -25,
                              left: '50%',
                              transform: 'translateX(-50%)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: colors.primary
                            }
                          }} />
                      </Tooltip>
                          <Typography variant="body2" sx={{ color: '#4a5568', fontWeight: 500, fontSize: analyticsTimeRange === '1year' ? '0.7rem' : '0.875rem' }}>
                        {item.month}
                      </Typography>
                    </Box>
                    );
                  })}
                </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                  <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ color: '#8b6cbc', fontWeight: 800 }}>
                          {dashboardData.stats.totalPublications.value}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#718096', fontWeight: 500 }}>Total Publications</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ color: '#FF6B6B', fontWeight: 800 }}>
                          {dashboardData.recentPublications.filter(p => p.year === new Date().getFullYear()).length}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#718096', fontWeight: 500 }}>This Year</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ color: '#4ECDC4', fontWeight: 800 }}>
                          {dashboardData.stats.ongoingProjects.value}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#718096', fontWeight: 500 }}>Active Projects</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
                  </Grid>

          {/* Recent Work - Enhanced */}
          <Grid size={{ xs: 12, md: 4 }}>
                <Card elevation={4} sx={{ 
                  height: '100%',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(139, 108, 188, 0.1)'
                }}>
                  <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.5, color: '#2d3748' }}>
                        <TimelineIcon sx={{ color: '#8b6cbc', fontSize: 24 }} />
                        Recent Work
                  </Typography>
                      <Tooltip title="Add new item">
                        <IconButton size="small" sx={{ 
                          color: '#8b6cbc', 
                          bgcolor: 'rgba(139, 108, 188, 0.1)',
                          '&:hover': { bgcolor: 'rgba(139, 108, 188, 0.2)' }
                        }}>
                    <AddIcon />
                  </IconButton>
                      </Tooltip>
                </Box>

                    {/* Tabs */}
                    <Tabs 
                      value={recentWorkTab} 
                      onChange={(e, newValue) => setRecentWorkTab(newValue)}
                      sx={{
                        mb: 2,
                        minHeight: 40,
                        '& .MuiTab-root': {
                          minHeight: 40,
                          textTransform: 'none',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          color: '#718096',
                          '&.Mui-selected': {
                            color: '#8b6cbc',
                            fontWeight: 600
                          }
                        },
                        '& .MuiTabs-indicator': {
                          bgcolor: '#8b6cbc',
                          height: 3,
                          borderRadius: '3px 3px 0 0'
                        }
                      }}
                    >
                      <Tab label="All" value="all" />
                      <Tab label="Publications" value="publications" />
                      <Tab label="Projects" value="projects" />
                    </Tabs>

                    <Box sx={{ maxHeight: 420, overflowY: 'auto', pr: 1 }}>
                      {/* Publications */}
                      {(recentWorkTab === 'all' || recentWorkTab === 'publications') && dashboardData.recentPublications.length > 0 && (
                        <Box sx={{ mb: recentWorkTab === 'all' ? 3 : 0 }}>
                          {recentWorkTab === 'all' && (
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#4a5568', display: 'flex', alignItems: 'center', gap: 1 }}>
                              <ArticleIcon sx={{ fontSize: 16 }} />
                              Publications
                            </Typography>
                          )}
                          {dashboardData.recentPublications.slice(0, recentWorkTab === 'all' ? 2 : 5).map((pub, index) => (
                            <Paper key={pub.id} elevation={0} sx={{ 
                              p: 2, 
                              mb: 1.5,
                              bgcolor: 'rgba(139, 108, 188, 0.02)',
                              border: '1px solid rgba(139, 108, 188, 0.1)',
                              borderRadius: 2,
                              transition: 'all 0.2s',
                              '&:hover': {
                                bgcolor: 'rgba(139, 108, 188, 0.05)',
                                boxShadow: '0 2px 8px rgba(139, 108, 188, 0.15)',
                                transform: 'translateY(-2px)'
                              }
                            }}>
                              <Box sx={{ display: 'flex', alignItems: 'start', gap: 1, mb: 1 }}>
                                <ArticleIcon sx={{ color: '#8b6cbc', fontSize: 18, mt: 0.2 }} />
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: '#2d3748', lineHeight: 1.4 }}>
                                    {pub.title.length > 60 ? `${pub.title.substring(0, 60)}...` : pub.title}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#718096', display: 'block', mb: 0.5 }}>
                                    {pub.journal} • {pub.year}
                                  </Typography>
                                </Box>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                                <Chip 
                                  label={`${pub.citations} citations`}
                                  size="small"
                                  sx={{ 
                                    fontSize: '0.7rem',
                                    height: 20,
                                    bgcolor: 'rgba(76, 175, 80, 0.1)',
                                    color: '#2e7d32',
                                    fontWeight: 600
                                  }}
                                />
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <Tooltip title="View details">
                                    <IconButton 
                                      size="small" 
                                      sx={{ p: 0.5, color: '#8b6cbc' }}
                                      onClick={() => handleViewDetails(pub, 'publication')}
                                    >
                                      <VisibilityIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Box>
                            </Paper>
                          ))}
                        </Box>
                      )}

                      {/* Projects */}
                      {(recentWorkTab === 'all' || recentWorkTab === 'projects') && dashboardData.rawData?.allProjects && dashboardData.rawData.allProjects.length > 0 && (
                        <Box>
                          {recentWorkTab === 'all' && (
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#4a5568', display: 'flex', alignItems: 'center', gap: 1 }}>
                              <ProposalIcon sx={{ fontSize: 16 }} />
                              Projects
                            </Typography>
                          )}
                          {dashboardData.rawData.allProjects.slice(0, recentWorkTab === 'all' ? 2 : 5).map((project, index) => {
                            const statusColor = {
                              'DRAFT': '#FFA726',
                              'UNDER_REVIEW': '#42A5F5',
                              'APPROVED': '#66BB6A',
                              'IN_PROGRESS': '#8b6cbc',
                              'COMPLETED': '#26A69A',
                              'REJECTED': '#EF5350'
                            };
                            const statusLabel = project.status?.replace('_', ' ');
                            
                            return (
                              <Paper key={project.id} elevation={0} sx={{ 
                                p: 2, 
                                mb: 1.5,
                                bgcolor: 'rgba(255, 107, 107, 0.02)',
                                border: '1px solid rgba(255, 107, 107, 0.1)',
                                borderRadius: 2,
                                transition: 'all 0.2s',
                                '&:hover': {
                                  bgcolor: 'rgba(255, 107, 107, 0.05)',
                                  boxShadow: '0 2px 8px rgba(255, 107, 107, 0.15)',
                                  transform: 'translateY(-2px)'
                                }
                              }}>
                                <Box sx={{ display: 'flex', alignItems: 'start', gap: 1, mb: 1 }}>
                                  <ProposalIcon sx={{ color: '#FF6B6B', fontSize: 18, mt: 0.2 }} />
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: '#2d3748', lineHeight: 1.4 }}>
                                      {project.title.length > 60 ? `${project.title.substring(0, 60)}...` : project.title}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#718096', display: 'block', mb: 0.5 }}>
                                      {project.type || 'Proposal'} • {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                                  <Chip 
                                    label={statusLabel}
                                    size="small"
                                    icon={project.status === 'IN_PROGRESS' ? <ScheduleIcon /> : project.status === 'COMPLETED' ? <CheckCircleIcon /> : <RateReviewIcon />}
                                    sx={{ 
                                      fontSize: '0.7rem',
                                      height: 20,
                                      bgcolor: `${statusColor[project.status]}15`,
                                      color: statusColor[project.status],
                                      fontWeight: 600,
                                      '& .MuiChip-icon': {
                                        fontSize: 14,
                                        color: statusColor[project.status]
                                      }
                                    }}
                                  />
                                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    <Tooltip title="View details">
                                      <IconButton 
                                        size="small" 
                                        sx={{ p: 0.5, color: '#FF6B6B' }}
                                        onClick={() => handleViewDetails(project, 'project')}
                                      >
                                        <VisibilityIcon sx={{ fontSize: 16 }} />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </Box>
                              </Paper>
                            );
                          })}
                        </Box>
                      )}

                      {/* Empty State */}
                      {((recentWorkTab === 'all' && dashboardData.recentPublications.length === 0 && (!dashboardData.rawData?.allProjects || dashboardData.rawData.allProjects.length === 0)) ||
                        (recentWorkTab === 'publications' && dashboardData.recentPublications.length === 0) ||
                        (recentWorkTab === 'projects' && (!dashboardData.rawData?.allProjects || dashboardData.rawData.allProjects.length === 0))) && (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                          {recentWorkTab === 'publications' ? (
                            <>
                              <ArticleIcon sx={{ fontSize: 48, color: '#cbd5e0', mb: 1 }} />
                              <Typography variant="body2" color="text.secondary">
                                No publications found
                              </Typography>
                            </>
                          ) : recentWorkTab === 'projects' ? (
                            <>
                              <ProposalIcon sx={{ fontSize: 48, color: '#cbd5e0', mb: 1 }} />
                              <Typography variant="body2" color="text.secondary">
                                No projects found
                              </Typography>
                            </>
                          ) : (
                            <>
                              <TimelineIcon sx={{ fontSize: 48, color: '#cbd5e0', mb: 1 }} />
                              <Typography variant="body2" color="text.secondary">
                                No recent work found
                              </Typography>
                            </>
                          )}
                        </Box>
                      )}
                    </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Research Collaboration Network */}
          <Grid size={{ xs: 12 }}>
                <Card elevation={4} sx={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(139, 108, 188, 0.1)',
                  borderRadius: 3,
                  overflow: 'hidden'
                }}>
                  <Box sx={{ 
                    p: 3, 
                    borderBottom: '1px solid rgba(139, 108, 188, 0.1)',
                    background: 'linear-gradient(135deg, rgba(139, 108, 188, 0.02) 0%, rgba(139, 108, 188, 0.05) 100%)'
                  }}>
                    <Typography variant="h5" sx={{ 
                      fontWeight: 700, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1.5, 
                      color: '#2d3748' 
                    }}>
                      <NetworkIcon sx={{ color: '#8b6cbc', fontSize: 28 }} />
                      Research Collaboration Network
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#718096', mt: 1 }}>
                      Interactive visualization of your research connections and collaborations
                    </Typography>
                  </Box>
            <KenyaNetworkVisualization />
                </Card>
          </Grid>
        </Grid>
          </>
        )}
      </Container>

      {/* Details Dialog */}
      <Dialog
        open={detailsDialog.open}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
        disableScrollLock={true}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          background: detailsDialog.type === 'publication' 
            ? 'linear-gradient(135deg, rgba(139, 108, 188, 0.05) 0%, rgba(139, 108, 188, 0.02) 100%)'
            : 'linear-gradient(135deg, rgba(255, 107, 107, 0.05) 0%, rgba(255, 107, 107, 0.02) 100%)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {detailsDialog.type === 'publication' ? (
              <ArticleIcon sx={{ color: '#8b6cbc', fontSize: 28 }} />
            ) : (
              <ProposalIcon sx={{ color: '#FF6B6B', fontSize: 28 }} />
            )}
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#2d3748' }}>
              {detailsDialog.type === 'publication' ? 'Publication Details' : 'Project Details'}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseDetails} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3, mt: 2 }}>
          {detailsDialog.item && detailsDialog.type === 'publication' && (
            <Box>
              {/* Publication Details */}
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#2d3748', lineHeight: 1.4 }}>
                {detailsDialog.item.title}
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <Chip
                  icon={<CalendarTodayIcon />}
                  label={`Year: ${detailsDialog.item.year}`}
                  size="small"
                  sx={{ bgcolor: 'rgba(139, 108, 188, 0.1)', color: '#8b6cbc', fontWeight: 600 }}
                />
                <Chip
                  label={`${detailsDialog.item.citations || 0} citations`}
                  size="small"
                  sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', color: '#2e7d32', fontWeight: 600 }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Journal */}
              {detailsDialog.item.journal && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#4a5568', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusinessIcon sx={{ fontSize: 18 }} />
                    Journal
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#718096' }}>
                    {detailsDialog.item.journal}
                  </Typography>
                </Box>
              )}

              {/* Authors */}
              {detailsDialog.item.authors && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#4a5568', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon sx={{ fontSize: 18 }} />
                    Authors
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#718096' }}>
                    {detailsDialog.item.authors}
                  </Typography>
                </Box>
              )}

              {/* DOI */}
              {detailsDialog.item.doi && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#4a5568', mb: 0.5 }}>
                    DOI
                  </Typography>
                  <Link 
                    href={`https://doi.org/${detailsDialog.item.doi}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    sx={{ 
                      color: '#8b6cbc', 
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    {detailsDialog.item.doi}
                    <OpenInNewIcon sx={{ fontSize: 16 }} />
                  </Link>
                </Box>
              )}
            </Box>
          )}

          {detailsDialog.item && detailsDialog.type === 'project' && (
            <Box>
              {/* Project Details */}
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#2d3748', lineHeight: 1.4 }}>
                {detailsDialog.item.title}
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <Chip
                  icon={detailsDialog.item.status === 'IN_PROGRESS' ? <ScheduleIcon /> : detailsDialog.item.status === 'COMPLETED' ? <CheckCircleIcon /> : <RateReviewIcon />}
                  label={detailsDialog.item.status?.replace('_', ' ')}
                  size="small"
                  sx={{ 
                    bgcolor: `${
                      {
                        'DRAFT': '#FFA726',
                        'UNDER_REVIEW': '#42A5F5',
                        'APPROVED': '#66BB6A',
                        'IN_PROGRESS': '#8b6cbc',
                        'COMPLETED': '#26A69A',
                        'REJECTED': '#EF5350'
                      }[detailsDialog.item.status]
                    }15`,
                    color: {
                      'DRAFT': '#FFA726',
                      'UNDER_REVIEW': '#42A5F5',
                      'APPROVED': '#66BB6A',
                      'IN_PROGRESS': '#8b6cbc',
                      'COMPLETED': '#26A69A',
                      'REJECTED': '#EF5350'
                    }[detailsDialog.item.status],
                    fontWeight: 600
                  }}
                />
                {detailsDialog.item.type && (
                  <Chip
                    icon={<DescriptionIcon />}
                    label={detailsDialog.item.type}
                    size="small"
                    sx={{ bgcolor: 'rgba(255, 107, 107, 0.1)', color: '#FF6B6B', fontWeight: 600 }}
                  />
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Principal Investigator */}
              {detailsDialog.item.principalInvestigator && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#4a5568', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon sx={{ fontSize: 18 }} />
                    Principal Investigator
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#718096' }}>
                    {detailsDialog.item.principalInvestigator}
                  </Typography>
                </Box>
              )}

              {/* Dates */}
              <Box sx={{ display: 'flex', gap: 3, mb: 2, flexWrap: 'wrap' }}>
                {detailsDialog.item.startDate && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#4a5568', mb: 0.5 }}>
                      Start Date
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#718096' }}>
                      {new Date(detailsDialog.item.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </Typography>
                  </Box>
                )}
                {detailsDialog.item.endDate && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#4a5568', mb: 0.5 }}>
                      End Date
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#718096' }}>
                      {new Date(detailsDialog.item.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Created Date */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#4a5568', mb: 0.5 }}>
                  Created
                </Typography>
                <Typography variant="body2" sx={{ color: '#718096' }}>
                  {new Date(detailsDialog.item.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
          <Button onClick={handleCloseDetails} variant="outlined" sx={{ textTransform: 'none' }}>
            Close
          </Button>
          {detailsDialog.type === 'publication' && detailsDialog.item?.doi && (
            <Button 
              variant="contained"
              startIcon={<OpenInNewIcon />}
              href={`https://doi.org/${detailsDialog.item.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ 
                textTransform: 'none',
                bgcolor: '#8b6cbc',
                '&:hover': { bgcolor: '#7a5caa' }
              }}
            >
              Open Publication
            </Button>
          )}
          {detailsDialog.type === 'project' && (
            <Button 
              variant="contained"
              startIcon={<WriteIcon />}
              sx={{ 
                textTransform: 'none',
                bgcolor: '#FF6B6B',
                '&:hover': { bgcolor: '#EF5350' }
              }}
            >
              Edit Project
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResearcherDashboard;
