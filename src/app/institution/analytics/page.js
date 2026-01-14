'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Stack,
  Chip,
  alpha,
  LinearProgress,
  Avatar,
  Divider,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  People as ResearchersIcon,
  Description as ManuscriptIcon,
  Assignment as ProposalIcon,
  MenuBook as PublicationIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  FileDownload as ExportIcon,
  ShowChart as LineChartIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  School as InstitutionIcon,
  CheckCircle as ApprovedIcon,
  Schedule as PendingIcon,
  RateReview as ReviewIcon,
  Cancel as RejectedIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Article as ArticleIcon,
  Folder as FolderIcon,
  InfoOutlined as InfoIcon,
  FormatQuote as CitationIcon,
  Group as CollaborationIcon,
  AttachMoney as FundingIcon,
  Business as DepartmentIcon,
  EmojiEvents as AchievementIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';

const InstitutionAnalytics = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [researcherSearchTerm, setResearcherSearchTerm] = useState('');

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

  const handleRefresh = () => {
    loadAnalyticsData();
  };

  const handleExport = () => {
    console.log('Export analytics data');
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

  const filteredResearchers = useMemo(() => {
    if (!analyticsData?.topResearchers) return [];
    
    let researchers = [...analyticsData.topResearchers];
    
    if (researcherSearchTerm.trim()) {
      const searchLower = researcherSearchTerm.toLowerCase();
      researchers = researchers.filter(r => 
        r.name?.toLowerCase().includes(searchLower) ||
        r.department?.toLowerCase().includes(searchLower) ||
        r.email?.toLowerCase().includes(searchLower)
      );
    }
    
    return researchers;
  }, [analyticsData?.topResearchers, researcherSearchTerm]);

  if (loading) {
    return (
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Institution Analytics"
          description="Comprehensive analytics and insights for institutional research"
          icon={<AnalyticsIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
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
          title="Institution Analytics"
          description="Comprehensive analytics and insights for institutional research"
          icon={<AnalyticsIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Analytics' }
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
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Institution Analytics"
          description="Comprehensive analytics and insights for institutional research"
          icon={<AnalyticsIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
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

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Key Performance Indicators */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700, 
              mb: 3,
              color: '#2d3748',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <AnalyticsIcon sx={{ color: '#8b6cbc' }} />
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
                lg: '1 1 calc(33.333% - 16px)', 
                xl: '1 1 calc(16.666% - 20px)' 
              } 
            }
          }}>
            <Card sx={{ 
              borderRadius: 3,
              height: '120px',
              position: 'relative',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5cac 100%)',
              boxShadow: '0 3px 12px rgba(139, 108, 188, 0.15)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              color: 'white',
              '&:hover': {
                transform: 'translateY(-3px) scale(1.01)',
                boxShadow: '0 6px 20px rgba(139, 108, 188, 0.3)'
              }
            }}>
              <CardContent sx={{ 
                p: 2, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between'
              }}>
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Box sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <ResearchersIcon sx={{ fontSize: 20, color: 'white' }} />
                  </Box>
                  <Tooltip title="Total active researchers">
                    <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', fontSize: '1.3rem', lineHeight: 1.1, mb: 0.25 }}>
                    {analyticsData.overview.totalResearchers}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'white', fontSize: '0.8rem', opacity: 0.9 }}>
                    Total Researchers
                  </Typography>
                </Box>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <TrendingUpIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.9)' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.7rem' }}>
                    Active
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ 
              borderRadius: 3,
              height: '120px',
              position: 'relative',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5cac 100%)',
              boxShadow: '0 3px 12px rgba(139, 108, 188, 0.15)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              color: 'white',
              '&:hover': {
                transform: 'translateY(-3px) scale(1.01)',
                boxShadow: '0 6px 20px rgba(139, 108, 188, 0.3)'
              }
            }}>
              <CardContent sx={{ 
                p: 2, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between'
              }}>
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Box sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <ManuscriptIcon sx={{ fontSize: 20, color: 'white' }} />
                  </Box>
                  <Tooltip title="Total manuscripts created">
                    <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', fontSize: '1.3rem', lineHeight: 1.1, mb: 0.25 }}>
                    {analyticsData.overview.totalManuscripts}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'white', fontSize: '0.8rem', opacity: 0.9 }}>
                    Total Manuscripts
                  </Typography>
                </Box>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <TrendingUpIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.9)' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.7rem' }}>
                    Growing
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ 
              borderRadius: 3,
              height: '120px',
              position: 'relative',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5cac 100%)',
              boxShadow: '0 3px 12px rgba(139, 108, 188, 0.15)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              color: 'white',
              '&:hover': {
                transform: 'translateY(-3px) scale(1.01)',
                boxShadow: '0 6px 20px rgba(139, 108, 188, 0.3)'
              }
            }}>
              <CardContent sx={{ 
                p: 2, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between'
              }}>
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Box sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <ProposalIcon sx={{ fontSize: 20, color: 'white' }} />
                  </Box>
                  <Tooltip title="Total research proposals">
                    <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', fontSize: '1.3rem', lineHeight: 1.1, mb: 0.25 }}>
                    {analyticsData.overview.totalProposals}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'white', fontSize: '0.8rem', opacity: 0.9 }}>
                    Total Proposals
                  </Typography>
                </Box>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <TrendingUpIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.9)' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.7rem' }}>
                    Active
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ 
              borderRadius: 3,
              height: '120px',
              position: 'relative',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5cac 100%)',
              boxShadow: '0 3px 12px rgba(139, 108, 188, 0.15)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              color: 'white',
              '&:hover': {
                transform: 'translateY(-3px) scale(1.01)',
                boxShadow: '0 6px 20px rgba(139, 108, 188, 0.3)'
              }
            }}>
              <CardContent sx={{ 
                p: 2, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between'
              }}>
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Box sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <PublicationIcon sx={{ fontSize: 20, color: 'white' }} />
                  </Box>
                  <Tooltip title="Total publications">
                    <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', fontSize: '1.3rem', lineHeight: 1.1, mb: 0.25 }}>
                    {analyticsData.overview.totalPublications}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'white', fontSize: '0.8rem', opacity: 0.9 }}>
                    Total Publications
                  </Typography>
                </Box>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <TrendingUpIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.9)' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.7rem' }}>
                    Published
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ 
              borderRadius: 3,
              height: '120px',
              position: 'relative',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5cac 100%)',
              boxShadow: '0 3px 12px rgba(139, 108, 188, 0.15)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              color: 'white',
              '&:hover': {
                transform: 'translateY(-3px) scale(1.01)',
                boxShadow: '0 6px 20px rgba(139, 108, 188, 0.3)'
              }
            }}>
              <CardContent sx={{ 
                p: 2, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between'
              }}>
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Box sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <ReviewIcon sx={{ fontSize: 20, color: 'white' }} />
                  </Box>
                  <Tooltip title="Proposals awaiting review">
                    <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', fontSize: '1.3rem', lineHeight: 1.1, mb: 0.25 }}>
                    {analyticsData.overview.submittedProposals + analyticsData.overview.underReviewProposals}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'white', fontSize: '0.8rem', opacity: 0.9 }}>
                    Awaiting Review
                  </Typography>
                </Box>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <PendingIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.9)' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.7rem' }}>
                    Pending
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ 
              borderRadius: 3,
              height: '120px',
              position: 'relative',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5cac 100%)',
              boxShadow: '0 3px 12px rgba(139, 108, 188, 0.15)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              color: 'white',
              '&:hover': {
                transform: 'translateY(-3px) scale(1.01)',
                boxShadow: '0 6px 20px rgba(139, 108, 188, 0.3)'
              }
            }}>
              <CardContent sx={{ 
                p: 2, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between'
              }}>
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Box sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <TrendingUpIcon sx={{ fontSize: 20, color: 'white' }} />
                  </Box>
                  <Tooltip title="Proposal approval success rate">
                    <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', fontSize: '1.3rem', lineHeight: 1.1, mb: 0.25 }}>
                    {analyticsData.overview.proposalSuccessRate}%
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'white', fontSize: '0.8rem', opacity: 0.9 }}>
                    Success Rate
                  </Typography>
                </Box>
                <Box>
                  <LinearProgress
                    variant="determinate"
                    value={analyticsData.overview.proposalSuccessRate}
                    sx={{
                      height: 3,
                      borderRadius: 2,
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 2,
                        background: 'rgba(255,255,255,0.8)'
                      }
                    }}
                  />
                </Box>
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
          <Card sx={{ 
            borderRadius: 3, 
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid rgba(139, 108, 188, 0.1)'
          }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <LineChartIcon sx={{ color: '#8b6cbc' }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Research Output Trends
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Monthly research output including manuscripts and proposals
              </Typography>
              
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
          <Card sx={{ 
            borderRadius: 3, 
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid rgba(139, 108, 188, 0.1)'
          }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <PieChartIcon sx={{ color: '#8b6cbc' }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Proposal Status
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Current distribution of proposal review status
              </Typography>
              
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

        {/* Department Performance Section */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700, 
              mb: 3,
              color: '#2d3748',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <DepartmentIcon sx={{ color: '#8b6cbc' }} />
            Department Performance
          </Typography>
          
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            gap: 2
          }}>
            {analyticsData.departmentStats?.slice(0, 6).map((dept) => (
              <Card key={dept.name} sx={{ 
                borderRadius: 2,
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                border: '1px solid #f3f4f6',
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  borderColor: '#e5e7eb',
                  transform: 'translateY(-2px)'
                }
              }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1f2937', mb: 2 }}>
                    {dept.name}
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        Researchers
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#8b6cbc' }}>
                        {dept.researcherCount || 0}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        Publications
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#10b981' }}>
                        {dept.publicationCount || 0}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        Proposals
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#f59e0b' }}>
                        {dept.proposalCount || 0}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        Success Rate
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#3b82f6' }}>
                        {dept.successRate || 0}%
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>

        {/* Research Impact Metrics */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700, 
              mb: 3,
              color: '#2d3748',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <AchievementIcon sx={{ color: '#8b6cbc' }} />
            Research Impact & Collaboration
          </Typography>
          
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 2
          }}>
            <Card sx={{ 
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #f3f4f6'
            }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#3b82f6', mb: 0.5, lineHeight: 1 }}>
                      {analyticsData.impactMetrics?.totalCitations || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mt: 0.5 }}>
                      Total Citations
                    </Typography>
                  </Box>
                  <CitationIcon sx={{ fontSize: 28, color: '#3b82f6', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ 
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #f3f4f6'
            }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#10b981', mb: 0.5, lineHeight: 1 }}>
                      {analyticsData.impactMetrics?.averageHIndex || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mt: 0.5 }}>
                      Average H-Index
                    </Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 28, color: '#10b981', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ 
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #f3f4f6'
            }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#f59e0b', mb: 0.5, lineHeight: 1 }}>
                      {analyticsData.impactMetrics?.activeCollaborations || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mt: 0.5 }}>
                      Collaborations
                    </Typography>
                  </Box>
                  <CollaborationIcon sx={{ fontSize: 28, color: '#f59e0b', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ 
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #f3f4f6'
            }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#059669', mb: 0.5, lineHeight: 1 }}>
                      ${(analyticsData.impactMetrics?.totalFunding || 0) / 1000}K
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mt: 0.5 }}>
                      Total Funding
                    </Typography>
                  </Box>
                  <FundingIcon sx={{ fontSize: 28, color: '#059669', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Box>
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
          {/* Top Researchers */}
          <Card sx={{ 
            borderRadius: 3, 
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid rgba(139, 108, 188, 0.1)'
          }}>
            <CardContent sx={{ p: 0 }}>
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
                    placeholder="Search researchers..."
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

              <TableContainer sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, backgroundColor: '#fafafa', borderBottom: '2px solid', borderColor: 'divider', py: 1.5 }}>
                        Researcher
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, backgroundColor: '#fafafa', borderBottom: '2px solid', borderColor: 'divider', py: 1.5 }}>
                        Manuscripts
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, backgroundColor: '#fafafa', borderBottom: '2px solid', borderColor: 'divider', py: 1.5 }}>
                        Publications
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, backgroundColor: '#fafafa', borderBottom: '2px solid', borderColor: 'divider', py: 1.5 }}>
                        Total
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredResearchers.slice(0, 10).map((researcher, index) => (
                      <TableRow 
                        key={researcher.id} 
                        hover
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: alpha('#8b6cbc', 0.05) }
                        }}
                        onClick={() => router.push(`/institution/researcher/${researcher.id}`)}
                      >
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Avatar sx={{ 
                              width: 32, 
                              height: 32, 
                              bgcolor: '#8b6cbc',
                              fontSize: '0.875rem',
                              fontWeight: 600
                            }}>
                              {researcher.name.split(' ').map(n => n[0]).join('')}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {researcher.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {researcher.department}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {researcher.manuscriptCount}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {researcher.publicationCount}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={researcher.totalOutput}
                            size="small"
                            sx={{ 
                              bgcolor: alpha('#8b6cbc', 0.1),
                              color: '#8b6cbc',
                              fontWeight: 600
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card sx={{ 
            borderRadius: 3, 
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid rgba(139, 108, 188, 0.1)'
          }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Recent Activity
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Latest manuscripts and proposals
                  </Typography>
                </Box>
              </Stack>

              <Stack spacing={2} sx={{ maxHeight: 400, overflowY: 'auto' }}>
                {analyticsData.recentActivity.slice(0, 10).map((activity) => (
                  <Box
                    key={`${activity.type}-${activity.id}`}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: alpha('#8b6cbc', 0.1),
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: '#8b6cbc',
                        backgroundColor: alpha('#8b6cbc', 0.02),
                        transform: 'translateX(4px)'
                      }
                    }}
                  >
                    <Stack direction="row" alignItems="flex-start" spacing={2}>
                      <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: activity.type === 'manuscript' 
                          ? alpha('#8b6cbc', 0.1) 
                          : alpha('#e67e22', 0.1),
                        color: activity.type === 'manuscript' ? '#8b6cbc' : '#e67e22'
                      }}>
                        {activity.type === 'manuscript' ? <ArticleIcon /> : <FolderIcon />}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {activity.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          by {activity.author}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Chip
                            label={activity.type === 'manuscript' ? 'Manuscript' : 'Proposal'}
                            size="small"
                            sx={{ 
                              height: 20,
                              fontSize: '0.65rem',
                              bgcolor: activity.type === 'manuscript' 
                                ? alpha('#8b6cbc', 0.1) 
                                : alpha('#e67e22', 0.1),
                              color: activity.type === 'manuscript' ? '#8b6cbc' : '#e67e22'
                            }}
                          />
                          <Chip
                            label={activity.status}
                            size="small"
                            color={getStatusColor(activity.status)}
                            sx={{ height: 20, fontSize: '0.65rem' }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(activity.createdAt)}
                          </Typography>
                        </Stack>
                      </Box>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </>
  );
};

export default InstitutionAnalytics;
