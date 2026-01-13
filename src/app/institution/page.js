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
import PageHeader from '@/components/common/PageHeader';

const InstitutionDashboard = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
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

  // Navigate to activity detail
  const handleActivityClick = (activity) => {
    if (activity.type === 'manuscript') {
      router.push(`/researcher/manuscripts/${activity.id}`);
    } else {
      router.push(`/researcher/proposals/${activity.id}`);
    }
  };

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

  // Navigate to researcher profile (institution view)
  const handleResearcherClick = (researcher) => {
    router.push(`/institution/researcher/${researcher.id}`);
  };

  if (loading) {
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
          title="Research Administration"
          description="Institutional research output, proposals, and researcher management"
          icon={<InstitutionIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Dashboard' }
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
                <Badge badgeContent={analyticsData.overview.submittedProposals + analyticsData.overview.underReviewProposals} color="error">
                  <ReviewIcon sx={{ fontSize: 28, color: 'rgba(255,255,255,0.9)', mb: 1 }} />
                </Badge>
                <Typography variant="h4" fontWeight="bold" sx={{ color: 'white' }}>
                  {analyticsData.overview.submittedProposals + analyticsData.overview.underReviewProposals}
                  </Typography>
                <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Awaiting Review
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
                  {analyticsData.overview.proposalSuccessRate}%
                </Typography>
                <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Success Rate
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
          {/* Research Output Trends */}
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <LineChartIcon sx={{ color: '#8b6cbc' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Research Output Trends
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Monthly research output including manuscripts and proposals
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
                          value={Math.min((trend.total / Math.max(...analyticsData.monthlyTrends.map(t => t.total), 1)) * 100, 100)}
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
                      <Typography variant="body2" sx={{ minWidth: 40, fontWeight: 600, color: '#8b6cbc' }}>
                        {trend.total}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </CardContent>
          </Card>

          {/* Proposal Status Distribution */}
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <PieChartIcon sx={{ color: '#8b6cbc' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Proposal Status
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Current distribution of proposal review status
              </Typography>
              
              {/* Mock Pie Chart */}
              <Box sx={{ 
                height: 300, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: alpha('#8b6cbc', 0.05),
                borderRadius: 2
              }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ fontWeight: 600, color: '#8b6cbc', mb: 1 }}>
                    {analyticsData.overview.totalProposals}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Total Proposals
                  </Typography>
                  <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#9e9e9e' }} />
                      <Typography variant="body2">Draft: {analyticsData.overview.draftProposals || 0}</Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ff9800' }} />
                      <Typography variant="body2">Submitted: {analyticsData.overview.submittedProposals}</Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#2196f3' }} />
                      <Typography variant="body2">Under Review: {analyticsData.overview.underReviewProposals}</Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#4caf50' }} />
                      <Typography variant="body2">Approved: {analyticsData.overview.approvedProposals}</Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#f44336' }} />
                      <Typography variant="body2">Rejected: {analyticsData.overview.rejectedProposals}</Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ff5722' }} />
                      <Typography variant="body2">Revision Requested: {analyticsData.overview.revisionRequestedProposals || 0}</Typography>
                    </Stack>
                  </Stack>
                </Box>
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
                      Top Researchers
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Most productive researchers by total output
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
                          onClick={() => handleResearcherClick(researcher)}
                          sx={{ 
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            '&:hover': { 
                              backgroundColor: alpha('#8b6cbc', 0.04)
                            },
                            '&:active': {
                              backgroundColor: alpha('#8b6cbc', 0.08)
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
                                  color: '#2d3748',
                                  '&:hover': { color: '#8b6cbc' },
                                  transition: 'color 0.15s ease'
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
                          onClick={() => handleActivityClick(activity)}
                          onMouseEnter={() => setHoveredActivityId(`${activity.type}-${activity.id}`)}
                          onMouseLeave={() => setHoveredActivityId(null)}
                          sx={{ 
                            p: 2.5, 
                            borderRadius: 2.5, 
                            border: '1px solid',
                            borderColor: isHovered ? alpha(typeConfig.color, 0.3) : 'divider',
                            cursor: 'pointer',
                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            backgroundColor: isHovered ? alpha(typeConfig.color, 0.02) : 'transparent',
                            transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
                            boxShadow: isHovered ? `0 4px 12px ${alpha(typeConfig.color, 0.15)}` : 'none',
                            '&:active': {
                              transform: 'translateX(2px) scale(0.995)'
                            }
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
                              <Tooltip title="View Details" arrow>
                                <IconButton 
                                  size="small" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleActivityClick(activity);
                                  }}
                                  sx={{ 
                                    color: typeConfig.color,
                                    backgroundColor: alpha(typeConfig.color, 0.1),
                                    '&:hover': {
                                      backgroundColor: alpha(typeConfig.color, 0.2)
                                    }
                                  }}
                                >
                                  <OpenInNewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
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