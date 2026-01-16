'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  Button,
  Badge,
  Tabs,
  Tab,
  Fade,
  Collapse,
  ButtonGroup,
  Skeleton
} from '@mui/material';
import {
  School as InstitutionIcon,
  People as ResearchersIcon,
  Description as ManuscriptIcon,
  Assignment as ProposalIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AnalyticsIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  FileDownload as ExportIcon,
  Refresh as RefreshIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as LineChartIcon,
  MenuBook as PublicationIcon,
  RateReview as ReviewIcon,
  CheckCircle as ApprovedIcon,
  Schedule as PendingIcon,
  Cancel as RejectedIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  OpenInNew as OpenInNewIcon,
  MoreVert as MoreVertIcon,
  AccessTime as AccessTimeIcon,
  ArrowForward as ArrowForwardIcon,
  Article as ArticleIcon,
  Folder as FolderIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import PageHeader from '@/components/common/PageHeader';
import { useAuth } from '@/components/AuthProvider';

const InstitutionDashboard = () => {
  const router = useRouter();
  const theme = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const [greeting, setGreeting] = useState('');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');
  
  // Recent Activity state
  const [activityFilter, setActivityFilter] = useState('all');
  const [activitySearchTerm, setActivitySearchTerm] = useState('');
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [hoveredActivityId, setHoveredActivityId] = useState(null);
  
  // Top Researchers state
  const [researcherSearchTerm, setResearcherSearchTerm] = useState('');
  const [showAllResearchers, setShowAllResearchers] = useState(false);
  const [sortBy, setSortBy] = useState('totalOutput'); // totalOutput, manuscripts, proposals, publications
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Research Output Trends state
  const [trendsTimeRange, setTrendsTimeRange] = useState('6months'); // '3months', '6months', '12months'
  const [trendsOutputType, setTrendsOutputType] = useState('all'); // 'all', 'manuscripts', 'proposals'
  
  // Proposal Status state
  const [proposalViewType, setProposalViewType] = useState('all'); // 'all', 'active', 'completed'
  const [selectedStatus, setSelectedStatus] = useState(null); // null or specific status
  
  // Manuscripts state
  const [manuscriptStatusFilter, setManuscriptStatusFilter] = useState('all'); // 'all', 'draft', 'under_review', 'published'
  const [manuscriptSearchTerm, setManuscriptSearchTerm] = useState('');
  const [manuscriptSortBy, setManuscriptSortBy] = useState('updated'); // 'updated', 'title', 'author'

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

  // Get user's display name
  const getUserDisplayName = () => {
    if (authLoading) return 'User';
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
      setGreeting(getTimeBasedGreeting());
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Load analytics data
  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/institution/analytics');
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      setError('Failed to load institutional analytics data');
    } finally {
      setLoading(false);
    }
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
      case 'approved': return 'success';
      case 'submitted': return 'warning';
      case 'under_review': return 'info';
      case 'rejected': return 'error';
      case 'published': return 'success';
      case 'draft': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return <ApprovedIcon fontSize="small" />;
      case 'submitted': return <PendingIcon fontSize="small" />;
      case 'under_review': return <ReviewIcon fontSize="small" />;
      case 'rejected': return <RejectedIcon fontSize="small" />;
      default: return null;
    }
  };

  const handleRefresh = () => {
    loadAnalyticsData();
  };

  const handleExport = () => {
    console.log('Export institutional data');
  };

  // Format relative time (e.g., "2 hours ago", "3 days ago")
  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
    return formatDate(dateString);
  };

  // Filter and search activities
  const filteredActivities = useMemo(() => {
    if (!analyticsData?.recentActivity) return [];
    
    let activities = [...analyticsData.recentActivity];
    
    // Filter by type
    if (activityFilter !== 'all') {
      activities = activities.filter(a => a.type === activityFilter);
    }
    
    // Filter by search term
    if (activitySearchTerm.trim()) {
      const searchLower = activitySearchTerm.toLowerCase();
      activities = activities.filter(a => 
        a.title?.toLowerCase().includes(searchLower) ||
        a.author?.toLowerCase().includes(searchLower)
      );
    }
    
    return activities;
  }, [analyticsData?.recentActivity, activityFilter, activitySearchTerm]);

  // Get display activities (limited or all)
  const displayActivities = showAllActivities 
    ? filteredActivities 
    : filteredActivities.slice(0, 5);

  // Get activity type configuration
  const getActivityTypeConfig = (type) => {
    if (type === 'manuscript') {
      return {
        icon: <ArticleIcon />,
        color: '#8b6cbc',
        bgColor: alpha('#8b6cbc', 0.1),
        label: 'Manuscript'
      };
    }
    return {
      icon: <FolderIcon />,
      color: '#e67e22',
      bgColor: alpha('#e67e22', 0.1),
      label: 'Proposal'
    };
  };

  // Get counts for filter badges
  const getActivityCounts = () => {
    if (!analyticsData?.recentActivity) return { all: 0, manuscript: 0, proposal: 0 };
    const activities = analyticsData.recentActivity;
    return {
      all: activities.length,
      manuscript: activities.filter(a => a.type === 'manuscript').length,
      proposal: activities.filter(a => a.type === 'proposal').length
    };
  };

  // Filter and sort researchers
  const filteredResearchers = useMemo(() => {
    if (!analyticsData?.topResearchers) return [];
    
    let researchers = [...analyticsData.topResearchers];
    
    // Filter by search term
    if (researcherSearchTerm.trim()) {
      const searchLower = researcherSearchTerm.toLowerCase();
      researchers = researchers.filter(r => 
        r.name?.toLowerCase().includes(searchLower) ||
        r.department?.toLowerCase().includes(searchLower) ||
        r.email?.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort researchers
    researchers.sort((a, b) => {
      let valueA, valueB;
      switch (sortBy) {
        case 'manuscriptCount':
          valueA = a.manuscriptCount || 0;
          valueB = b.manuscriptCount || 0;
          break;
        case 'proposalCount':
          valueA = a.proposalCount || 0;
          valueB = b.proposalCount || 0;
          break;
        case 'publicationCount':
          valueA = a.publicationCount || 0;
          valueB = b.publicationCount || 0;
          break;
        default:
          valueA = a.totalOutput || 0;
          valueB = b.totalOutput || 0;
      }
      return sortOrder === 'desc' ? valueB - valueA : valueA - valueB;
    });
    
    return researchers;
  }, [analyticsData?.topResearchers, researcherSearchTerm, sortBy, sortOrder]);

  // Get display researchers (limited or all)
  const displayResearchers = showAllResearchers 
    ? filteredResearchers 
    : filteredResearchers.slice(0, 5);

  // Handle sort change
  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  if (loading || !analyticsData) {
    return (
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Research Administration"
          description="Institutional research output, proposals, and researcher management"
          icon={<InstitutionIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Dashboard' }
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
          title="Research Administration"
          description="Institutional research output, proposals, and researcher management"
          icon={<InstitutionIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Dashboard' }
          ]}
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
        />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
            <Button 
              variant="outlined" 
              onClick={handleRefresh} 
              sx={{ ml: 2 }}
            >
              Try Again
            </Button>
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
          title={`${greeting}, ${getUserDisplayName()}!`}
          description={
            <>
              <span style={{ fontSize: '0.95rem', fontWeight: 400, opacity: 0.9 }}>
                Logged in as: <span style={{ fontWeight: 700, color: '#fff' }}>{getAccountTypeDisplay()}</span>
              </span>
            
              <br />
              <span style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                {currentDate}
              </span>
            </>
          }
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
        />
      </Box>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Dashboard Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#8b6cbc', mb: 1 }}>
            Institutional Research Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive overview of research activities, proposals, and institutional metrics
          </Typography>
        </Box>

        {/* Key Metrics Cards */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#8b6cbc' }}>
            Key Performance Indicators
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            gap: 3, 
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
            '& > *': {
              flex: {
                xs: '1 1 100%',
                sm: '1 1 0'
              },
              minWidth: 0
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
                <ResearchersIcon sx={{ fontSize: 28, color: 'rgba(255,255,255,0.9)', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold" sx={{ color: 'white' }}>
                  {analyticsData.overview.totalResearchers}
                  </Typography>
                <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Researchers
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
                <ManuscriptIcon sx={{ fontSize: 28, color: 'rgba(255,255,255,0.9)', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold" sx={{ color: 'white' }}>
                  {analyticsData.overview.totalManuscripts}
                  </Typography>
                <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Manuscripts
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
                <ProposalIcon sx={{ fontSize: 28, color: 'rgba(255,255,255,0.9)', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold" sx={{ color: 'white' }}>
                  {analyticsData.overview.totalProposals}
                </Typography>
                <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Proposals
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
                <PublicationIcon sx={{ fontSize: 28, color: 'rgba(255,255,255,0.9)', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold" sx={{ color: 'white' }}>
                  {analyticsData.overview.totalPublications}
                </Typography>
                <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Publications
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
          {/* Research Output Trends - Interactive */}
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <LineChartIcon sx={{ color: '#8b6cbc' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Research Output Trends
                  </Typography>
                </Stack>
                
                {/* Interactive Controls */}
                <Stack direction="row" spacing={2} alignItems="center">
                  {/* Time Range Filter */}
                  <ButtonGroup size="small" sx={{ boxShadow: 'none' }}>
                    <Button
                      onClick={() => setTrendsTimeRange('3months')}
                      variant={trendsTimeRange === '3months' ? 'contained' : 'outlined'}
                      sx={{
                        bgcolor: trendsTimeRange === '3months' ? '#8b6cbc' : 'transparent',
                        color: trendsTimeRange === '3months' ? 'white' : '#8b6cbc',
                        borderColor: '#8b6cbc',
                        '&:hover': {
                          bgcolor: trendsTimeRange === '3months' ? '#7b5cac' : alpha('#8b6cbc', 0.1),
                          borderColor: '#8b6cbc'
                        },
                        textTransform: 'none',
                        fontSize: '0.75rem'
                      }}
                    >
                      3M
                    </Button>
                    <Button
                      onClick={() => setTrendsTimeRange('6months')}
                      variant={trendsTimeRange === '6months' ? 'contained' : 'outlined'}
                      sx={{
                        bgcolor: trendsTimeRange === '6months' ? '#8b6cbc' : 'transparent',
                        color: trendsTimeRange === '6months' ? 'white' : '#8b6cbc',
                        borderColor: '#8b6cbc',
                        '&:hover': {
                          bgcolor: trendsTimeRange === '6months' ? '#7b5cac' : alpha('#8b6cbc', 0.1),
                          borderColor: '#8b6cbc'
                        },
                        textTransform: 'none',
                        fontSize: '0.75rem'
                      }}
                    >
                      6M
                    </Button>
                    <Button
                      onClick={() => setTrendsTimeRange('12months')}
                      variant={trendsTimeRange === '12months' ? 'contained' : 'outlined'}
                      sx={{
                        bgcolor: trendsTimeRange === '12months' ? '#8b6cbc' : 'transparent',
                        color: trendsTimeRange === '12months' ? 'white' : '#8b6cbc',
                        borderColor: '#8b6cbc',
                        '&:hover': {
                          bgcolor: trendsTimeRange === '12months' ? '#7b5cac' : alpha('#8b6cbc', 0.1),
                          borderColor: '#8b6cbc'
                        },
                        textTransform: 'none',
                        fontSize: '0.75rem'
                      }}
                    >
                      12M
                    </Button>
                  </ButtonGroup>
                </Stack>
              </Stack>

              {/* Output Type Toggle */}
              <Tabs
                value={trendsOutputType}
                onChange={(e, newValue) => setTrendsOutputType(newValue)}
                sx={{
                  mb: 2,
                  minHeight: 36,
                  '& .MuiTab-root': {
                    minHeight: 36,
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'text.secondary',
                    '&.Mui-selected': {
                      color: '#8b6cbc'
                    }
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#8b6cbc'
                  }
                }}
              >
                <Tab label="All Outputs" value="all" />
                <Tab label="Manuscripts Only" value="manuscripts" />
                <Tab label="Proposals Only" value="proposals" />
              </Tabs>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {trendsOutputType === 'all' 
                  ? 'Monthly research output including manuscripts and proposals'
                  : trendsOutputType === 'manuscripts'
                  ? 'Monthly manuscript submissions and publications'
                  : 'Monthly proposal submissions'}
              </Typography>
              
              {/* Interactive Chart */}
              <Box sx={{ 
                height: 300, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: alpha('#8b6cbc', 0.05),
                borderRadius: 2,
                position: 'relative'
              }}>
                <Stack spacing={1} sx={{ width: '100%', px: 3 }}>
                  {analyticsData.monthlyTrends
                    .slice(trendsTimeRange === '3months' ? -3 : trendsTimeRange === '6months' ? -6 : -12)
                    .map((trend, index) => {
                      const value = trendsOutputType === 'all' 
                        ? trend.total 
                        : trendsOutputType === 'manuscripts'
                        ? trend.manuscripts || Math.floor(trend.total * 0.6)
                        : trend.proposals || Math.floor(trend.total * 0.4);
                      
                      const maxValue = Math.max(
                        ...analyticsData.monthlyTrends
                          .slice(trendsTimeRange === '3months' ? -3 : trendsTimeRange === '6months' ? -6 : -12)
                          .map(t => trendsOutputType === 'all' 
                            ? t.total 
                            : trendsOutputType === 'manuscripts'
                            ? t.manuscripts || Math.floor(t.total * 0.6)
                            : t.proposals || Math.floor(t.total * 0.4)
                          ),
                        1
                      );

                      return (
                        <Stack 
                          key={trend.month} 
                          direction="row" 
                          alignItems="center" 
                          spacing={2}
                          sx={{
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'translateX(4px)',
                              '& .MuiLinearProgress-root': {
                                height: 16
                              }
                            }
                          }}
                        >
                          <Typography variant="body2" sx={{ minWidth: 80, fontWeight: 500 }}>
                            {trend.month}
                          </Typography>
                          <Box sx={{ flex: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min((value / maxValue) * 100, 100)}
                              sx={{
                                height: 12,
                                borderRadius: 6,
                                backgroundColor: alpha('#8b6cbc', 0.1),
                                transition: 'height 0.2s ease',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: trendsOutputType === 'manuscripts' 
                                    ? '#4CAF50'
                                    : trendsOutputType === 'proposals'
                                    ? '#FF9800'
                                    : '#8b6cbc',
                                  borderRadius: 6,
                                  transition: 'background-color 0.3s ease'
                                }
                              }}
                            />
                          </Box>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              minWidth: 40, 
                              fontWeight: 600, 
                              color: trendsOutputType === 'manuscripts' 
                                ? '#4CAF50'
                                : trendsOutputType === 'proposals'
                                ? '#FF9800'
                                : '#8b6cbc',
                              transition: 'color 0.3s ease'
                            }}
                          >
                            {value}
                          </Typography>
                        </Stack>
                      );
                    })}
                </Stack>
              </Box>
            </CardContent>
          </Card>

          {/* Proposal Status Distribution - Interactive */}
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <PieChartIcon sx={{ color: '#8b6cbc' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Proposal Status
                  </Typography>
                </Stack>
                
                {/* View Type Filter */}
                <ButtonGroup size="small" sx={{ boxShadow: 'none' }}>
                  <Button
                    onClick={() => setProposalViewType('all')}
                    variant={proposalViewType === 'all' ? 'contained' : 'outlined'}
                    sx={{
                      bgcolor: proposalViewType === 'all' ? '#8b6cbc' : 'transparent',
                      color: proposalViewType === 'all' ? 'white' : '#8b6cbc',
                      borderColor: '#8b6cbc',
                      '&:hover': {
                        bgcolor: proposalViewType === 'all' ? '#7b5cac' : alpha('#8b6cbc', 0.1),
                        borderColor: '#8b6cbc'
                      },
                      textTransform: 'none',
                      fontSize: '0.75rem'
                    }}
                  >
                    All
                  </Button>
                  <Button
                    onClick={() => setProposalViewType('active')}
                    variant={proposalViewType === 'active' ? 'contained' : 'outlined'}
                    sx={{
                      bgcolor: proposalViewType === 'active' ? '#8b6cbc' : 'transparent',
                      color: proposalViewType === 'active' ? 'white' : '#8b6cbc',
                      borderColor: '#8b6cbc',
                      '&:hover': {
                        bgcolor: proposalViewType === 'active' ? '#7b5cac' : alpha('#8b6cbc', 0.1),
                        borderColor: '#8b6cbc'
                      },
                      textTransform: 'none',
                      fontSize: '0.75rem'
                    }}
                  >
                    Active
                  </Button>
                  <Button
                    onClick={() => setProposalViewType('completed')}
                    variant={proposalViewType === 'completed' ? 'contained' : 'outlined'}
                    sx={{
                      bgcolor: proposalViewType === 'completed' ? '#8b6cbc' : 'transparent',
                      color: proposalViewType === 'completed' ? 'white' : '#8b6cbc',
                      borderColor: '#8b6cbc',
                      '&:hover': {
                        bgcolor: proposalViewType === 'completed' ? '#7b5cac' : alpha('#8b6cbc', 0.1),
                        borderColor: '#8b6cbc'
                      },
                      textTransform: 'none',
                      fontSize: '0.75rem'
                    }}
                  >
                    Completed
                  </Button>
                </ButtonGroup>
              </Stack>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {proposalViewType === 'all' 
                  ? 'Current distribution of all proposal statuses'
                  : proposalViewType === 'active'
                  ? 'Proposals currently in progress (Draft, Submitted, Under Review)'
                  : 'Completed proposals (Approved, Rejected)'}
              </Typography>
              
              {/* Interactive Status Bars */}
              <Box sx={{ 
                height: 300, 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center',
                background: alpha('#8b6cbc', 0.05),
                borderRadius: 2,
                p: 3
              }}>
                <Stack spacing={2.5}>
                  {(() => {
                    const statuses = [
                      { label: 'Draft', count: analyticsData.overview.draftProposals || 0, color: '#9e9e9e', type: 'active' },
                      { label: 'Submitted', count: analyticsData.overview.submittedProposals, color: '#ff9800', type: 'active' },
                      { label: 'Under Review', count: analyticsData.overview.underReviewProposals, color: '#2196f3', type: 'active' },
                      { label: 'Approved', count: analyticsData.overview.approvedProposals, color: '#4caf50', type: 'completed' },
                      { label: 'Rejected', count: analyticsData.overview.rejectedProposals, color: '#f44336', type: 'completed' },
                      { label: 'Revision Requested', count: analyticsData.overview.revisionRequestedProposals || 0, color: '#ff5722', type: 'active' }
                    ];

                    const filteredStatuses = proposalViewType === 'all' 
                      ? statuses
                      : proposalViewType === 'active'
                      ? statuses.filter(s => s.type === 'active')
                      : statuses.filter(s => s.type === 'completed');

                    const maxCount = Math.max(...filteredStatuses.map(s => s.count), 1);

                    return filteredStatuses.map((status) => (
                      <Box 
                        key={status.label}
                        onClick={() => setSelectedStatus(selectedStatus === status.label ? null : status.label)}
                        sx={{ 
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateX(4px)'
                          }
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 0.5 }}>
                          <Box sx={{ 
                            width: 14, 
                            height: 14, 
                            borderRadius: '50%', 
                            backgroundColor: status.color,
                            transition: 'transform 0.2s ease',
                            transform: selectedStatus === status.label ? 'scale(1.3)' : 'scale(1)'
                          }} />
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              minWidth: 140,
                              fontWeight: selectedStatus === status.label ? 600 : 500,
                              color: selectedStatus === status.label ? status.color : 'text.primary',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {status.label}
                          </Typography>
                          <Box sx={{ flex: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={(status.count / maxCount) * 100}
                              sx={{
                                height: selectedStatus === status.label ? 14 : 10,
                                borderRadius: 5,
                                backgroundColor: alpha(status.color, 0.1),
                                transition: 'height 0.2s ease',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: status.color,
                                  borderRadius: 5,
                                  transition: 'background-color 0.3s ease'
                                }
                              }}
                            />
                          </Box>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              minWidth: 50,
                              fontWeight: 700,
                              color: status.color,
                              fontSize: selectedStatus === status.label ? '1rem' : '0.875rem',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {status.count}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              minWidth: 50,
                              color: 'text.secondary',
                              opacity: selectedStatus === status.label ? 1 : 0.7,
                              transition: 'opacity 0.2s ease'
                            }}
                          >
                            ({((status.count / analyticsData.overview.totalProposals) * 100).toFixed(1)}%)
                          </Typography>
                        </Stack>
                      </Box>
                    ));
                  })()}
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Box>

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
          {/* Recent Proposals for Review */}
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Proposals for Review
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => router.push('/institution/proposals/review')}
                    sx={{
                      bgcolor: '#8b6cbc',
                      '&:hover': { bgcolor: '#7b5cac' },
                      textTransform: 'none'
                    }}
                  >
                    Review All
                  </Button>
                  <Badge badgeContent={analyticsData.overview.submittedProposals + analyticsData.overview.underReviewProposals} color="error">
                    <ReviewIcon sx={{ color: '#8b6cbc' }} />
                  </Badge>
                </Stack>
              </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Recent proposals requiring administrative review
              </Typography>

              {analyticsData.recentProposals
                .filter(proposal => ['SUBMITTED', 'UNDER_REVIEW'].includes(proposal.status))
                .length > 0 ? (
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Proposal</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analyticsData.recentProposals
                        .filter(proposal => ['SUBMITTED', 'UNDER_REVIEW'].includes(proposal.status))
                        .slice(0, 10)
                        .map((proposal) => (
                        <TableRow key={proposal.id} hover>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {proposal.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                by {proposal.author} • {proposal.department}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getStatusIcon(proposal.status)}
                              label={proposal.status.replace('_', ' ')}
                              color={getStatusColor(proposal.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(proposal.createdAt)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <Tooltip title="View Details">
                                <IconButton size="small" sx={{ color: '#8b6cbc' }}>
                                  <ViewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Review">
                                <IconButton size="small" sx={{ color: '#4caf50' }}>
                                  <ReviewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <ReviewIcon sx={{ fontSize: 48, color: '#e0e0e0', mb: 2 }} />
                  <Typography variant="body1" sx={{ color: '#9ca3af', mb: 1, fontWeight: 500 }}>
                    No proposals awaiting review
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    All proposals have been reviewed or there are no submitted proposals at this time.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Manuscripts Widget - Interactive */}
          <Card sx={{ 
            borderRadius: 3, 
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            border: '1px solid',
            borderColor: alpha('#8b6cbc', 0.1)
          }}>
            <CardContent sx={{ p: 0 }}>
              {/* Header */}
              <Box sx={{ 
                p: 3, 
                pb: 2,
                background: `linear-gradient(135deg, ${alpha('#8b6cbc', 0.03)} 0%, ${alpha('#a084d1', 0.05)} 100%)`,
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#2d3748' }}>
                      Manuscripts in Progress
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      All manuscripts currently being worked on
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip 
                      label={`${analyticsData.overview.totalManuscripts} Total`}
                      sx={{ 
                        backgroundColor: alpha('#8b6cbc', 0.1),
                        color: '#8b6cbc',
                        fontWeight: 600
                      }}
                    />
                  </Stack>
                </Stack>

                {/* Interactive Controls */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                  {/* Search */}
                  <TextField
                    size="small"
                    placeholder="Search by title or author..."
                    value={manuscriptSearchTerm}
                    onChange={(e) => setManuscriptSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ 
                      flex: 1,
                      minWidth: { xs: '100%', sm: 200 },
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'white',
                        fontSize: '0.875rem',
                        '&:hover fieldset': { borderColor: '#8b6cbc' },
                        '&.Mui-focused fieldset': { borderColor: '#8b6cbc' }
                      }
                    }}
                  />

                  {/* Status Filter */}
                  <ButtonGroup size="small" sx={{ boxShadow: 'none' }}>
                    <Button
                      onClick={() => setManuscriptStatusFilter('all')}
                      variant={manuscriptStatusFilter === 'all' ? 'contained' : 'outlined'}
                      sx={{
                        bgcolor: manuscriptStatusFilter === 'all' ? '#8b6cbc' : 'transparent',
                        color: manuscriptStatusFilter === 'all' ? 'white' : '#8b6cbc',
                        borderColor: '#8b6cbc',
                        '&:hover': {
                          bgcolor: manuscriptStatusFilter === 'all' ? '#7b5cac' : alpha('#8b6cbc', 0.1),
                          borderColor: '#8b6cbc'
                        },
                        textTransform: 'none',
                        fontSize: '0.75rem'
                      }}
                    >
                      All
                    </Button>
                    <Button
                      onClick={() => setManuscriptStatusFilter('draft')}
                      variant={manuscriptStatusFilter === 'draft' ? 'contained' : 'outlined'}
                      sx={{
                        bgcolor: manuscriptStatusFilter === 'draft' ? '#8b6cbc' : 'transparent',
                        color: manuscriptStatusFilter === 'draft' ? 'white' : '#8b6cbc',
                        borderColor: '#8b6cbc',
                        '&:hover': {
                          bgcolor: manuscriptStatusFilter === 'draft' ? '#7b5cac' : alpha('#8b6cbc', 0.1),
                          borderColor: '#8b6cbc'
                        },
                        textTransform: 'none',
                        fontSize: '0.75rem'
                      }}
                    >
                      Draft
                    </Button>
                    <Button
                      onClick={() => setManuscriptStatusFilter('under_review')}
                      variant={manuscriptStatusFilter === 'under_review' ? 'contained' : 'outlined'}
                      sx={{
                        bgcolor: manuscriptStatusFilter === 'under_review' ? '#8b6cbc' : 'transparent',
                        color: manuscriptStatusFilter === 'under_review' ? 'white' : '#8b6cbc',
                        borderColor: '#8b6cbc',
                        '&:hover': {
                          bgcolor: manuscriptStatusFilter === 'under_review' ? '#7b5cac' : alpha('#8b6cbc', 0.1),
                          borderColor: '#8b6cbc'
                        },
                        textTransform: 'none',
                        fontSize: '0.75rem'
                      }}
                    >
                      Review
                    </Button>
                    <Button
                      onClick={() => setManuscriptStatusFilter('published')}
                      variant={manuscriptStatusFilter === 'published' ? 'contained' : 'outlined'}
                      sx={{
                        bgcolor: manuscriptStatusFilter === 'published' ? '#8b6cbc' : 'transparent',
                        color: manuscriptStatusFilter === 'published' ? 'white' : '#8b6cbc',
                        borderColor: '#8b6cbc',
                        '&:hover': {
                          bgcolor: manuscriptStatusFilter === 'published' ? '#7b5cac' : alpha('#8b6cbc', 0.1),
                          borderColor: '#8b6cbc'
                        },
                        textTransform: 'none',
                        fontSize: '0.75rem'
                      }}
                    >
                      Published
                    </Button>
                  </ButtonGroup>
                </Stack>
              </Box>

              {/* Table */}
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell 
                        onClick={() => setManuscriptSortBy('title')}
                        sx={{ 
                          fontWeight: 600, 
                          backgroundColor: '#fafafa',
                          borderBottom: '2px solid',
                          borderColor: 'divider',
                          py: 1.5,
                          width: '40%',
                          cursor: 'pointer',
                          userSelect: 'none',
                          '&:hover': { backgroundColor: alpha('#8b6cbc', 0.05) }
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <span>Title</span>
                          {manuscriptSortBy === 'title' && <span style={{ fontSize: '0.75rem', color: '#8b6cbc' }}>↓</span>}
                        </Stack>
                      </TableCell>
                      <TableCell 
                        onClick={() => setManuscriptSortBy('author')}
                        sx={{ 
                          fontWeight: 600, 
                          backgroundColor: '#fafafa',
                          borderBottom: '2px solid',
                          borderColor: 'divider',
                          py: 1.5,
                          cursor: 'pointer',
                          userSelect: 'none',
                          '&:hover': { backgroundColor: alpha('#8b6cbc', 0.05) }
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <span>Author(s)</span>
                          {manuscriptSortBy === 'author' && <span style={{ fontSize: '0.75rem', color: '#8b6cbc' }}>↓</span>}
                        </Stack>
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          fontWeight: 600, 
                          backgroundColor: '#fafafa',
                          borderBottom: '2px solid',
                          borderColor: 'divider',
                          py: 1.5
                        }}
                      >
                        Status
                      </TableCell>
                      <TableCell 
                        onClick={() => setManuscriptSortBy('updated')}
                        sx={{ 
                          fontWeight: 600, 
                          backgroundColor: '#fafafa',
                          borderBottom: '2px solid',
                          borderColor: 'divider',
                          py: 1.5,
                          cursor: 'pointer',
                          userSelect: 'none',
                          '&:hover': { backgroundColor: alpha('#8b6cbc', 0.05) }
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <span>Last Updated</span>
                          {manuscriptSortBy === 'updated' && <span style={{ fontSize: '0.75rem', color: '#8b6cbc' }}>↓</span>}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(() => {
                      if (!analyticsData.recentManuscripts || analyticsData.recentManuscripts.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={4} sx={{ py: 4, textAlign: 'center' }}>
                              <Typography variant="body2" color="text.secondary">
                                No manuscripts found
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      }

                      // Filter manuscripts
                      let filtered = analyticsData.recentManuscripts.filter(manuscript => {
                        // Status filter
                        if (manuscriptStatusFilter !== 'all') {
                          const status = (manuscript.status || 'DRAFT').toUpperCase();
                          if (manuscriptStatusFilter === 'draft' && status !== 'DRAFT') return false;
                          if (manuscriptStatusFilter === 'under_review' && status !== 'UNDER_REVIEW') return false;
                          if (manuscriptStatusFilter === 'published' && status !== 'PUBLISHED') return false;
                        }

                        // Search filter
                        if (manuscriptSearchTerm) {
                          const searchLower = manuscriptSearchTerm.toLowerCase();
                          const title = (manuscript.title || '').toLowerCase();
                          const author = (manuscript.author || '').toLowerCase();
                          return title.includes(searchLower) || author.includes(searchLower);
                        }

                        return true;
                      });

                      // Sort manuscripts
                      filtered = filtered.sort((a, b) => {
                        if (manuscriptSortBy === 'title') {
                          return (a.title || '').localeCompare(b.title || '');
                        } else if (manuscriptSortBy === 'author') {
                          const authorA = a.author || '';
                          const authorB = b.author || '';
                          return authorA.localeCompare(authorB);
                        } else {
                          // Sort by updated date (newest first)
                          const dateA = new Date(a.updatedAt || a.createdAt || 0);
                          const dateB = new Date(b.updatedAt || b.createdAt || 0);
                          return dateB - dateA;
                        }
                      });

                      return filtered.map((manuscript, index) => (
                        <TableRow 
                          key={manuscript.id || index}
                          sx={{ 
                            cursor: 'pointer',
                            transition: 'background-color 0.15s ease',
                            '&:hover': { 
                              backgroundColor: alpha('#8b6cbc', 0.04)
                            }
                          }}
                        >
                          <TableCell sx={{ py: 2 }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 600,
                                color: '#2d3748',
                                '&:hover': { color: '#8b6cbc' },
                                transition: 'color 0.15s ease'
                              }}
                            >
                              {manuscript.title || 'Untitled Manuscript'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              {manuscript.author || 'Unknown'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Chip
                              label={manuscript.status || 'Draft'}
                              size="small"
                              sx={{
                                backgroundColor: manuscript.status === 'PUBLISHED' 
                                  ? alpha('#4CAF50', 0.1)
                                  : manuscript.status === 'UNDER_REVIEW'
                                  ? alpha('#FF9800', 0.1)
                                  : alpha('#8b6cbc', 0.1),
                                color: manuscript.status === 'PUBLISHED'
                                  ? '#4CAF50'
                                  : manuscript.status === 'UNDER_REVIEW'
                                  ? '#FF9800'
                                  : '#8b6cbc',
                                fontWeight: 500,
                                fontSize: '0.75rem'
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              {manuscript.updatedAt ? formatDate(manuscript.updatedAt) : manuscript.createdAt ? formatDate(manuscript.createdAt) : 'N/A'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ));
                    })()}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Enhanced Top Researchers */}
          <Card sx={{ 
            borderRadius: 3, 
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            border: '1px solid',
            borderColor: alpha('#8b6cbc', 0.1)
          }}>
            <CardContent sx={{ p: 0 }}>
              {/* Header */}
              <Box sx={{ 
                p: 3, 
                pb: 2,
                background: `linear-gradient(135deg, ${alpha('#8b6cbc', 0.03)} 0%, ${alpha('#a084d1', 0.05)} 100%)`,
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#2d3748' }}>
                      Researchers
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Researchers by total output
                    </Typography>
                  </Box>
                  <TextField
                    size="small"
                    placeholder="Search by name or department..."
                    value={researcherSearchTerm}
                    onChange={(e) => setResearcherSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ 
                      width: { xs: '100%', sm: 240 },
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'white',
                        fontSize: '0.875rem',
                        '&:hover fieldset': { borderColor: '#8b6cbc' },
                        '&.Mui-focused fieldset': { borderColor: '#8b6cbc' }
                      }
                    }}
                  />
                </Stack>
              </Box>

              {/* Table */}
              <TableContainer sx={{ maxHeight: showAllResearchers ? 600 : 380 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell 
                        sx={{ 
                          fontWeight: 600, 
                          backgroundColor: '#fafafa',
                          borderBottom: '2px solid',
                          borderColor: 'divider',
                          py: 1.5,
                          width: '35%'
                        }}
                      >
                        Researcher
                      </TableCell>
                      <TableCell 
                        onClick={() => handleSortChange('totalOutput')}
                        sx={{ 
                          fontWeight: 600, 
                          backgroundColor: '#fafafa',
                          borderBottom: '2px solid',
                          borderColor: 'divider',
                          py: 1.5,
                          cursor: 'pointer',
                          userSelect: 'none',
                          '&:hover': { backgroundColor: alpha('#8b6cbc', 0.05) },
                          transition: 'background-color 0.2s ease'
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <span>Total</span>
                          {sortBy === 'totalOutput' && (
                            <span style={{ fontSize: '0.75rem', color: '#8b6cbc' }}>
                              {sortOrder === 'desc' ? '↓' : '↑'}
                            </span>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell 
                        onClick={() => handleSortChange('manuscriptCount')}
                        sx={{ 
                          fontWeight: 600, 
                          backgroundColor: '#fafafa',
                          borderBottom: '2px solid',
                          borderColor: 'divider',
                          py: 1.5,
                          cursor: 'pointer',
                          userSelect: 'none',
                          '&:hover': { backgroundColor: alpha('#8b6cbc', 0.05) },
                          transition: 'background-color 0.2s ease'
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <span>Manuscripts</span>
                          {sortBy === 'manuscriptCount' && (
                            <span style={{ fontSize: '0.75rem', color: '#8b6cbc' }}>
                              {sortOrder === 'desc' ? '↓' : '↑'}
                            </span>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell 
                        onClick={() => handleSortChange('proposalCount')}
                        sx={{ 
                          fontWeight: 600, 
                          backgroundColor: '#fafafa',
                          borderBottom: '2px solid',
                          borderColor: 'divider',
                          py: 1.5,
                          cursor: 'pointer',
                          userSelect: 'none',
                          '&:hover': { backgroundColor: alpha('#8b6cbc', 0.05) },
                          transition: 'background-color 0.2s ease'
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <span>Proposals</span>
                          {sortBy === 'proposalCount' && (
                            <span style={{ fontSize: '0.75rem', color: '#8b6cbc' }}>
                              {sortOrder === 'desc' ? '↓' : '↑'}
                            </span>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell 
                        onClick={() => handleSortChange('publicationCount')}
                        sx={{ 
                          fontWeight: 600, 
                          backgroundColor: '#fafafa',
                          borderBottom: '2px solid',
                          borderColor: 'divider',
                          py: 1.5,
                          cursor: 'pointer',
                          userSelect: 'none',
                          '&:hover': { backgroundColor: alpha('#8b6cbc', 0.05) },
                          transition: 'background-color 0.2s ease'
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <span>Publications</span>
                          {sortBy === 'publicationCount' && (
                            <span style={{ fontSize: '0.75rem', color: '#8b6cbc' }}>
                              {sortOrder === 'desc' ? '↓' : '↑'}
                            </span>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredResearchers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ py: 6, textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            {researcherSearchTerm 
                              ? `No researchers found matching "${researcherSearchTerm}"`
                              : 'No researchers to display'
                            }
                          </Typography>
                          {researcherSearchTerm && (
                            <Button 
                              variant="text" 
                              size="small"
                              onClick={() => setResearcherSearchTerm('')}
                              sx={{ mt: 1, color: '#8b6cbc', textTransform: 'none' }}
                            >
                              Clear search
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayResearchers.map((researcher, index) => (
                        <TableRow 
                          key={researcher.id}
                          sx={{ 
                            transition: 'all 0.15s ease',
                            '&:hover': { 
                              backgroundColor: alpha('#8b6cbc', 0.04)
                            },
                            '& td': {
                              borderBottom: index === displayResearchers.length - 1 && !showAllResearchers && filteredResearchers.length > 5 
                                ? 'none' 
                                : undefined
                            }
                          }}
                        >
                          <TableCell sx={{ py: 2 }}>
                            <Box>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight: 600,
                                  color: '#2d3748'
                                }}
                              >
                                {researcher.name || 'Unknown'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {researcher.department || 'No Department'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 700, 
                                color: '#8b6cbc',
                                fontSize: '1rem'
                              }}
                            >
                              {researcher.totalOutput}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#4a5568' }}>
                              {researcher.manuscriptCount}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#4a5568' }}>
                              {researcher.proposalCount}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#4a5568' }}>
                              {researcher.publicationCount}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* View More / View Less */}
              {filteredResearchers.length > 5 && (
                <Box sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  borderTop: '1px dashed',
                  borderColor: 'divider',
                  backgroundColor: alpha('#8b6cbc', 0.02)
                }}>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => setShowAllResearchers(!showAllResearchers)}
                    sx={{
                      color: '#8b6cbc',
                      fontWeight: 600,
                      textTransform: 'none',
                      '&:hover': {
                        backgroundColor: alpha('#8b6cbc', 0.08)
                      }
                    }}
                  >
                    {showAllResearchers 
                      ? 'Show Less' 
                      : `View All ${filteredResearchers.length} Researchers`
                    }
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Enhanced Recent Activity Section */}
        <Card sx={{ 
          borderRadius: 3, 
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)', 
          mt: 4,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: alpha('#8b6cbc', 0.1)
        }}>
          <CardContent sx={{ p: 0 }}>
            {/* Header Section */}
            <Box sx={{ 
              p: 3, 
              pb: 2,
              background: `linear-gradient(135deg, ${alpha('#8b6cbc', 0.03)} 0%, ${alpha('#a084d1', 0.05)} 100%)`,
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(139, 108, 188, 0.3)'
                    }}>
                      <AccessTimeIcon sx={{ color: 'white', fontSize: 22 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#2d3748' }}>
              Recent Research Activity
            </Typography>
                      <Typography variant="body2" color="text.secondary">
              Latest manuscripts, proposals, and research updates
            </Typography>
                    </Box>
                  </Stack>
                </Box>
                
                {/* Search and Filter Controls */}
                <Stack direction="row" spacing={2} alignItems="center">
                  <TextField
                    size="small"
                    placeholder="Search activities..."
                    value={activitySearchTerm}
                    onChange={(e) => setActivitySearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ 
                      width: { xs: '100%', sm: 220 },
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'white',
                        '&:hover': {
                          '& fieldset': { borderColor: '#8b6cbc' }
                        },
                        '&.Mui-focused': {
                          '& fieldset': { borderColor: '#8b6cbc' }
                        }
                      }
                    }}
                  />
                </Stack>
              </Stack>
              
              {/* Filter Tabs */}
              <Box sx={{ mt: 2 }}>
                <ButtonGroup 
                  variant="outlined" 
                  size="small"
                  sx={{
                    '& .MuiButton-root': {
                      textTransform: 'none',
                      px: 2,
                      py: 0.75,
                      borderColor: alpha('#8b6cbc', 0.3),
                      color: 'text.secondary',
                      '&:hover': {
                        borderColor: '#8b6cbc',
                        backgroundColor: alpha('#8b6cbc', 0.05)
                      }
                    }
                  }}
                >
                  <Button
                    onClick={() => setActivityFilter('all')}
                    sx={{
                      ...(activityFilter === 'all' && {
                        backgroundColor: '#8b6cbc',
                        color: 'white',
                        borderColor: '#8b6cbc',
                        '&:hover': {
                          backgroundColor: '#7b5cac',
                          borderColor: '#7b5cac'
                        }
                      })
                    }}
                  >
                    All
                    <Chip 
                      label={getActivityCounts().all} 
                      size="small" 
                      sx={{ 
                        ml: 1, 
                        height: 20, 
                        fontSize: '0.7rem',
                        backgroundColor: activityFilter === 'all' ? 'rgba(255,255,255,0.2)' : alpha('#8b6cbc', 0.1),
                        color: activityFilter === 'all' ? 'white' : '#8b6cbc'
                      }} 
                    />
                  </Button>
                  <Button
                    onClick={() => setActivityFilter('manuscript')}
                    startIcon={<ArticleIcon sx={{ fontSize: 18 }} />}
                    sx={{
                      ...(activityFilter === 'manuscript' && {
                        backgroundColor: '#8b6cbc',
                        color: 'white',
                        borderColor: '#8b6cbc',
                        '&:hover': {
                          backgroundColor: '#7b5cac',
                          borderColor: '#7b5cac'
                        }
                      })
                    }}
                  >
                    Manuscripts
                    <Chip 
                      label={getActivityCounts().manuscript} 
                      size="small" 
                      sx={{ 
                        ml: 1, 
                        height: 20, 
                        fontSize: '0.7rem',
                        backgroundColor: activityFilter === 'manuscript' ? 'rgba(255,255,255,0.2)' : alpha('#8b6cbc', 0.1),
                        color: activityFilter === 'manuscript' ? 'white' : '#8b6cbc'
                      }} 
                    />
                  </Button>
                  <Button
                    onClick={() => setActivityFilter('proposal')}
                    startIcon={<FolderIcon sx={{ fontSize: 18 }} />}
                    sx={{
                      ...(activityFilter === 'proposal' && {
                        backgroundColor: '#8b6cbc',
                        color: 'white',
                        borderColor: '#8b6cbc',
                        '&:hover': {
                          backgroundColor: '#7b5cac',
                          borderColor: '#7b5cac'
                        }
                      })
                    }}
                  >
                    Proposals
                    <Chip 
                      label={getActivityCounts().proposal} 
                      size="small" 
                      sx={{ 
                        ml: 1, 
                        height: 20, 
                        fontSize: '0.7rem',
                        backgroundColor: activityFilter === 'proposal' ? 'rgba(255,255,255,0.2)' : alpha('#e67e22', 0.1),
                        color: activityFilter === 'proposal' ? 'white' : '#e67e22'
                      }} 
                    />
                  </Button>
                </ButtonGroup>
              </Box>
            </Box>

            {/* Activity List */}
            <Box sx={{ p: 3 }}>
              {filteredActivities.length === 0 ? (
            <Box sx={{ 
                  textAlign: 'center', 
                  py: 6,
                  px: 3,
                  backgroundColor: alpha('#8b6cbc', 0.02),
                  borderRadius: 2
                }}>
                  <Box sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    backgroundColor: alpha('#8b6cbc', 0.1),
              display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2
                  }}>
                    <SearchIcon sx={{ fontSize: 32, color: '#8b6cbc' }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748', mb: 1 }}>
                    No activities found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {activitySearchTerm 
                      ? `No results for "${activitySearchTerm}". Try a different search term.`
                      : `No ${activityFilter === 'all' ? '' : activityFilter + ' '}activities to display yet.`
                    }
                  </Typography>
                  {activitySearchTerm && (
                    <Button 
                      variant="text" 
                      onClick={() => setActivitySearchTerm('')}
                      sx={{ mt: 2, color: '#8b6cbc' }}
                    >
                      Clear search
                    </Button>
                  )}
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {displayActivities.map((activity, index) => {
                    const typeConfig = getActivityTypeConfig(activity.type);
                    const isHovered = hoveredActivityId === `${activity.type}-${activity.id}`;
                    
                    return (
                      <Fade in={true} timeout={300 + index * 100} key={`${activity.type}-${activity.id}`}>
                        <Paper 
                          onMouseEnter={() => setHoveredActivityId(`${activity.type}-${activity.id}`)}
                          onMouseLeave={() => setHoveredActivityId(null)}
                          sx={{ 
                            p: 2.5, 
                            borderRadius: 2.5, 
                            border: '1px solid',
                            borderColor: isHovered ? alpha(typeConfig.color, 0.3) : 'divider',
                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            backgroundColor: isHovered ? alpha(typeConfig.color, 0.02) : 'transparent',
                            boxShadow: isHovered ? `0 4px 12px ${alpha(typeConfig.color, 0.15)}` : 'none'
                          }}
                        >
                  <Stack direction="row" alignItems="center" spacing={2}>
                            {/* Activity Type Icon */}
                            <Box sx={{
                              position: 'relative'
                            }}>
                    <Avatar sx={{ 
                                bgcolor: typeConfig.bgColor,
                                color: typeConfig.color,
                                width: 48,
                                height: 48,
                                transition: 'all 0.25s ease',
                                transform: isHovered ? 'scale(1.05)' : 'scale(1)'
                    }}>
                                {typeConfig.icon}
                    </Avatar>
                              {/* Activity type indicator dot */}
                              <Box sx={{
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                width: 14,
                                height: 14,
                                borderRadius: '50%',
                                backgroundColor: typeConfig.color,
                                border: '2px solid white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                {activity.type === 'manuscript' ? (
                                  <ManuscriptIcon sx={{ fontSize: 8, color: 'white' }} />
                                ) : (
                                  <ProposalIcon sx={{ fontSize: 8, color: 'white' }} />
                                )}
                              </Box>
                            </Box>
                            
                            {/* Activity Content */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                                <Typography 
                                  variant="subtitle1" 
                                  sx={{ 
                                    fontWeight: 600,
                                    color: '#2d3748',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    transition: 'color 0.2s ease',
                                    ...(isHovered && { color: typeConfig.color })
                                  }}
                                >
                        {activity.title}
                      </Typography>
                              </Stack>
                              <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
                                <Chip
                                  label={typeConfig.label}
                                  size="small"
                                  sx={{
                                    height: 22,
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    backgroundColor: typeConfig.bgColor,
                                    color: typeConfig.color,
                                    border: 'none'
                                  }}
                                />
                                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                  by <Box component="span" sx={{ fontWeight: 500, ml: 0.5, color: '#4a5568' }}>{activity.author}</Box>
                      </Typography>
                              </Stack>
                    </Box>
                            
                            {/* Right Section: Status & Time */}
                            <Stack alignItems="flex-end" spacing={1} sx={{ flexShrink: 0 }}>
                      <Chip
                        label={activity.status.replace('_', ' ')}
                        color={getStatusColor(activity.status)}
                        size="small"
                                sx={{
                                  fontWeight: 500,
                                  textTransform: 'capitalize'
                                }}
                              />
                              <Stack direction="row" alignItems="center" spacing={0.5}>
                                <AccessTimeIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                  {getRelativeTime(activity.createdAt)}
                </Typography>
                              </Stack>
                            </Stack>
                            
                            {/* Action Buttons */}
                            <Stack direction="row" spacing={0.5} sx={{ 
                              opacity: isHovered ? 1 : 0,
                              transition: 'opacity 0.2s ease',
                              ml: 1
                            }}>
                    </Stack>
                  </Stack>
                </Paper>
                      </Fade>
                    );
                  })}
                </Box>
              )}
              
              {/* View More / View Less Button */}
              {filteredActivities.length > 5 && (
                <Box sx={{ 
                  mt: 3, 
                  textAlign: 'center',
                  pt: 2,
                  borderTop: '1px dashed',
                  borderColor: 'divider'
                }}>
                  <Button
                    variant="text"
                    onClick={() => setShowAllActivities(!showAllActivities)}
                    endIcon={<ArrowForwardIcon sx={{ 
                      transform: showAllActivities ? 'rotate(-90deg)' : 'rotate(90deg)',
                      transition: 'transform 0.2s ease'
                    }} />}
                    sx={{
                      color: '#8b6cbc',
                      fontWeight: 600,
                      textTransform: 'none',
                      px: 3,
                      py: 1,
                      borderRadius: 2,
                      '&:hover': {
                        backgroundColor: alpha('#8b6cbc', 0.08)
                      }
                    }}
                  >
                    {showAllActivities 
                      ? 'Show Less' 
                      : `View All ${filteredActivities.length} Activities`
                    }
                  </Button>
                </Box>
              )}
            </Box>
              </CardContent>
            </Card>
      </Container>
    </>
  );
};

export default InstitutionDashboard;