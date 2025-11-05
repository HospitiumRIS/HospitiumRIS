'use client';

import React, { useState, useEffect } from 'react';
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
  Badge
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
  Delete as DeleteIcon
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';

const InstitutionDashboard = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');

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
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#4caf50' }} />
                      <Typography variant="body2">Approved: {analyticsData.overview.approvedProposals}</Typography>
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
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#f44336' }} />
                      <Typography variant="body2">Rejected: {analyticsData.overview.rejectedProposals}</Typography>
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
            </CardContent>
          </Card>

          {/* Top Researchers */}
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Top Researchers
                </Typography>
                <TextField
                  size="small"
                  placeholder="Search researchers..."
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
                Most productive researchers by total output
              </Typography>

              <TableContainer sx={{ maxHeight: 400 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Researcher</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Output</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Breakdown</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analyticsData.topResearchers
                      .filter(researcher => 
                        searchTerm === '' || 
                        researcher.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        researcher.department?.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .slice(0, 10)
                      .map((researcher) => (
                      <TableRow key={researcher.id} hover>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar sx={{ 
                              bgcolor: '#8b6cbc', 
                              width: 32, 
                              height: 32,
                              fontSize: '0.875rem'
                            }}>
                              {researcher.name?.charAt(0) || 'U'}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {researcher.name || 'Unknown'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {researcher.department || 'No Department'}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: '#8b6cbc' }}>
                            {researcher.totalOutput}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Typography variant="caption">
                              {researcher.manuscriptCount} manuscripts
                            </Typography>
                            <Typography variant="caption">
                              {researcher.proposalCount} proposals
                            </Typography>
                            <Typography variant="caption">
                              {researcher.publicationCount} publications
                            </Typography>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              </CardContent>
            </Card>
        </Box>

        {/* Recent Activity */}
        <Card sx={{ borderRadius: 3, boxShadow: 2, mt: 4 }}>
          <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Recent Research Activity
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Latest manuscripts, proposals, and research updates
            </Typography>

            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 2
            }}>
              {analyticsData.recentActivity.slice(0, 8).map((activity, index) => (
                <Paper key={`${activity.type}-${activity.id}`} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ 
                      bgcolor: activity.type === 'manuscript' ? '#8b6cbc' : '#a084d1',
                      width: 40,
                      height: 40
                    }}>
                      {activity.type === 'manuscript' ? <ManuscriptIcon /> : <ProposalIcon />}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {activity.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {activity.type === 'manuscript' ? 'Manuscript' : 'Proposal'} by {activity.author}
                      </Typography>
                    </Box>
                    <Stack alignItems="flex-end" spacing={1}>
                      <Chip
                        label={activity.status.replace('_', ' ')}
                        color={getStatusColor(activity.status)}
                        size="small"
                      />
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(activity.createdAt)}
                </Typography>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Box>
              </CardContent>
            </Card>
      </Container>
    </>
  );
};

export default InstitutionDashboard;