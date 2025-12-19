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
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AnalyticsIcon,
  AccountBalance as BankIcon,
  Assignment as ProposalIcon,
  Event as EventIcon,
  Refresh as RefreshIcon,
  FileDownload as ExportIcon,
  Search as SearchIcon,
  CheckCircle as ApprovedIcon,
  Schedule as PendingIcon,
  Cancel as RejectedIcon,
  Business as BusinessIcon,
  School as SchoolIcon,
  Public as PublicIcon,
  InfoOutlined as InfoIcon,
  Gavel as GrantIcon,
  ShowChart as LineChartIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';

const FundingAnalytics = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [error, setError] = useState(null);
  const [proposalSearchTerm, setProposalSearchTerm] = useState('');
  const [opportunitySearchTerm, setOpportunitySearchTerm] = useState('');

  useEffect(() => {
    loadFundingData();
  }, []);

  const loadFundingData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/institution/analytics/funding');
      if (!response.ok) {
        throw new Error('Failed to fetch funding analytics');
      }
      
      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading funding analytics:', error);
      setError('Failed to load funding analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadFundingData();
  };

  const handleExport = () => {
    console.log('Export funding data');
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
      case 'approved': return 'success';
      case 'submitted': return 'warning';
      case 'under_review': return 'info';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getDaysUntilDeadline = (deadline) => {
    const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const filteredProposals = useMemo(() => {
    if (!analyticsData?.topProposals) return [];
    
    let proposals = [...analyticsData.topProposals];
    
    if (proposalSearchTerm.trim()) {
      const searchLower = proposalSearchTerm.toLowerCase();
      proposals = proposals.filter(p => 
        p.title?.toLowerCase().includes(searchLower) ||
        p.principalInvestigator?.toLowerCase().includes(searchLower) ||
        p.department?.toLowerCase().includes(searchLower)
      );
    }
    
    return proposals;
  }, [analyticsData?.topProposals, proposalSearchTerm]);

  const filteredOpportunities = useMemo(() => {
    if (!analyticsData?.upcomingDeadlines) return [];
    
    let opportunities = [...analyticsData.upcomingDeadlines];
    
    if (opportunitySearchTerm.trim()) {
      const searchLower = opportunitySearchTerm.toLowerCase();
      opportunities = opportunities.filter(o => 
        o.title?.toLowerCase().includes(searchLower) ||
        o.grantorName?.toLowerCase().includes(searchLower)
      );
    }
    
    return opportunities;
  }, [analyticsData?.upcomingDeadlines, opportunitySearchTerm]);

  if (loading) {
    return (
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Funding Analytics"
          description="Grant opportunities, funding sources, and proposal budgets"
          icon={<MoneyIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Analytics', path: '/institution/analytics' },
            { label: 'Funding' }
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
          title="Funding Analytics"
          description="Grant opportunities, funding sources, and proposal budgets"
          icon={<MoneyIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Analytics', path: '/institution/analytics' },
            { label: 'Funding' }
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
          title="Funding Analytics"
          description="Grant opportunities, funding sources, and proposal budgets"
          icon={<MoneyIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Analytics', path: '/institution/analytics' },
            { label: 'Funding' }
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
        {/* Key Funding Metrics */}
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
            <MoneyIcon sx={{ color: '#8b6cbc' }} />
            Funding Overview
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
                    <MoneyIcon sx={{ fontSize: 20, color: 'white' }} />
                  </Box>
                  <Tooltip title="Total funding requested across all proposals">
                    <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', fontSize: '1.3rem', lineHeight: 1.1, mb: 0.25 }}>
                    {formatCurrency(analyticsData.overview.totalFundingRequested)}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'white', fontSize: '0.8rem', opacity: 0.9 }}>
                    Total Requested
                  </Typography>
                </Box>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <TrendingUpIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.9)' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.7rem' }}>
                    All Proposals
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
                    <ApprovedIcon sx={{ fontSize: 20, color: 'white' }} />
                  </Box>
                  <Tooltip title="Total funding approved">
                    <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', fontSize: '1.3rem', lineHeight: 1.1, mb: 0.25 }}>
                    {formatCurrency(analyticsData.overview.totalFundingApproved)}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'white', fontSize: '0.8rem', opacity: 0.9 }}>
                    Total Approved
                  </Typography>
                </Box>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <ApprovedIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.9)' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.7rem' }}>
                    Secured Funding
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
                    <GrantIcon sx={{ fontSize: 20, color: 'white' }} />
                  </Box>
                  <Tooltip title="Available grant opportunities">
                    <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', fontSize: '1.3rem', lineHeight: 1.1, mb: 0.25 }}>
                    {formatCurrency(analyticsData.overview.totalGrantOpportunities)}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'white', fontSize: '0.8rem', opacity: 0.9 }}>
                    Grant Opportunities
                  </Typography>
                </Box>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <EventIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.9)' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.7rem' }}>
                    Available Now
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
                  <Tooltip title="Total proposals with budget">
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
                  <ProposalIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.9)' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.7rem' }}>
                    With Budget
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
                  <Tooltip title="Proposal success rate">
                    <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', fontSize: '1.3rem', lineHeight: 1.1, mb: 0.25 }}>
                    {analyticsData.overview.successRate}%
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'white', fontSize: '0.8rem', opacity: 0.9 }}>
                    Success Rate
                  </Typography>
                </Box>
                <Box>
                  <LinearProgress
                    variant="determinate"
                    value={analyticsData.overview.successRate}
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
                    <AnalyticsIcon sx={{ fontSize: 20, color: 'white' }} />
                  </Box>
                  <Tooltip title="Average proposal amount">
                    <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', fontSize: '1.3rem', lineHeight: 1.1, mb: 0.25 }}>
                    {formatCurrency(analyticsData.overview.avgProposalAmount)}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'white', fontSize: '0.8rem', opacity: 0.9 }}>
                    Avg Proposal
                  </Typography>
                </Box>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <AnalyticsIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.9)' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.7rem' }}>
                    Per Proposal
                  </Typography>
                </Stack>
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
          {/* Monthly Funding Trends */}
          <Card sx={{ 
            borderRadius: 3, 
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid rgba(139, 108, 188, 0.1)'
          }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <LineChartIcon sx={{ color: '#8b6cbc' }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Monthly Funding Trends
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Approved funding amounts over the last 6 months
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
                          value={Math.min((trend.amount / Math.max(...analyticsData.monthlyTrends.map(t => t.amount), 1)) * 100, 100)}
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
                      <Typography variant="body2" sx={{ minWidth: 100, fontWeight: 600, color: '#8b6cbc' }}>
                        {formatCurrency(trend.amount)}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </CardContent>
          </Card>

          {/* Funding by Source */}
          <Card sx={{ 
            borderRadius: 3, 
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid rgba(139, 108, 188, 0.1)'
          }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <PieChartIcon sx={{ color: '#8b6cbc' }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Funding by Source
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Distribution of approved funding by source
              </Typography>
              
              <Box sx={{ 
                height: 300, 
                overflowY: 'auto'
              }}>
                <Stack spacing={2}>
                  {analyticsData.fundingBySource.slice(0, 5).map((source, index) => (
                    <Box key={source.source}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {source.source}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#8b6cbc' }}>
                          {formatCurrency(source.totalAmount)}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min((source.totalAmount / analyticsData.overview.totalFundingApproved) * 100, 100)}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: alpha('#8b6cbc', 0.1),
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: '#8b6cbc',
                            borderRadius: 4
                          }
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {source.count} proposals
                      </Typography>
                    </Box>
                  ))}
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
          {/* Top Funded Proposals */}
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
                      Top Funded Proposals
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Proposals with highest budget amounts
                    </Typography>
                  </Box>
                  <TextField
                    size="small"
                    placeholder="Search proposals..."
                    value={proposalSearchTerm}
                    onChange={(e) => setProposalSearchTerm(e.target.value)}
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
                        Proposal
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, backgroundColor: '#fafafa', borderBottom: '2px solid', borderColor: 'divider', py: 1.5 }}>
                        Status
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, backgroundColor: '#fafafa', borderBottom: '2px solid', borderColor: 'divider', py: 1.5 }}>
                        Budget
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredProposals.slice(0, 10).map((proposal) => (
                      <TableRow 
                        key={proposal.id} 
                        hover
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: alpha('#8b6cbc', 0.05) }
                        }}
                      >
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {proposal.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {proposal.principalInvestigator} • {proposal.department}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={proposal.status}
                            color={getStatusColor(proposal.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#8b6cbc' }}>
                            {formatCurrency(proposal.budgetAmount)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Upcoming Grant Deadlines */}
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
                      Upcoming Deadlines
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Grant opportunities closing soon
                    </Typography>
                  </Box>
                  <TextField
                    size="small"
                    placeholder="Search opportunities..."
                    value={opportunitySearchTerm}
                    onChange={(e) => setOpportunitySearchTerm(e.target.value)}
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

              <Box sx={{ p: 3, maxHeight: 400, overflowY: 'auto' }}>
                <Stack spacing={2}>
                  {filteredOpportunities.slice(0, 10).map((opportunity) => {
                    const daysLeft = getDaysUntilDeadline(opportunity.deadline);
                    return (
                      <Box
                        key={opportunity.id}
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
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {opportunity.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                              {opportunity.grantorName}
                            </Typography>
                          </Box>
                          <Chip
                            label={formatCurrency(opportunity.amount)}
                            size="small"
                            sx={{ 
                              bgcolor: alpha('#8b6cbc', 0.1),
                              color: '#8b6cbc',
                              fontWeight: 600
                            }}
                          />
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Chip
                            icon={<EventIcon sx={{ fontSize: 14 }} />}
                            label={`${daysLeft} days left`}
                            size="small"
                            color={daysLeft <= 7 ? 'error' : daysLeft <= 30 ? 'warning' : 'default'}
                            sx={{ height: 20, fontSize: '0.65rem' }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            Deadline: {formatDate(opportunity.deadline)}
                          </Typography>
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </>
  );
};

export default FundingAnalytics;
