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
  VerifiedUser as ComplianceIcon,
  CheckCircle as ApprovedIcon,
  Schedule as PendingIcon,
  Cancel as RejectedIcon,
  Description as DocumentIcon,
  Security as SecurityIcon,
  Assignment as ProposalIcon,
  Gavel as CommitteeIcon,
  Refresh as RefreshIcon,
  FileDownload as ExportIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AnalyticsIcon,
  InfoOutlined as InfoIcon,
  ShowChart as LineChartIcon,
  BarChart as BarChartIcon,
  Policy as PolicyIcon,
  Shield as ShieldIcon,
  FactCheck as FactCheckIcon
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';

const ComplianceAnalytics = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [error, setError] = useState(null);
  const [proposalSearchTerm, setProposalSearchTerm] = useState('');
  const [pendingSearchTerm, setPendingSearchTerm] = useState('');

  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/institution/analytics/compliance');
      if (!response.ok) {
        throw new Error('Failed to fetch compliance analytics');
      }
      
      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading compliance analytics:', error);
      setError('Failed to load compliance analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadComplianceData();
  };

  const handleExport = () => {
    console.log('Export compliance data');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getApprovalStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const filteredProposals = useMemo(() => {
    if (!analyticsData?.recentApprovals) return [];
    
    let proposals = [...analyticsData.recentApprovals];
    
    if (proposalSearchTerm.trim()) {
      const searchLower = proposalSearchTerm.toLowerCase();
      proposals = proposals.filter(p => 
        p.title?.toLowerCase().includes(searchLower) ||
        p.principalInvestigator?.toLowerCase().includes(searchLower) ||
        p.department?.toLowerCase().includes(searchLower)
      );
    }
    
    return proposals;
  }, [analyticsData?.recentApprovals, proposalSearchTerm]);

  const filteredPending = useMemo(() => {
    if (!analyticsData?.pendingReviews) return [];
    
    let pending = [...analyticsData.pendingReviews];
    
    if (pendingSearchTerm.trim()) {
      const searchLower = pendingSearchTerm.toLowerCase();
      pending = pending.filter(p => 
        p.title?.toLowerCase().includes(searchLower) ||
        p.principalInvestigator?.toLowerCase().includes(searchLower) ||
        p.department?.toLowerCase().includes(searchLower)
      );
    }
    
    return pending;
  }, [analyticsData?.pendingReviews, pendingSearchTerm]);

  if (loading) {
    return (
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Compliance Analytics"
          description="Ethics approvals, data management, and regulatory compliance tracking"
          icon={<ComplianceIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Analytics', path: '/institution/analytics' },
            { label: 'Compliance' }
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
          title="Compliance Analytics"
          description="Ethics approvals, data management, and regulatory compliance tracking"
          icon={<ComplianceIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Analytics', path: '/institution/analytics' },
            { label: 'Compliance' }
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
          title="Compliance Analytics"
          description="Ethics approvals, data management, and regulatory compliance tracking"
          icon={<ComplianceIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Analytics', path: '/institution/analytics' },
            { label: 'Compliance' }
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
        {/* Key Compliance Metrics */}
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
            <ComplianceIcon sx={{ color: '#8b6cbc' }} />
            Compliance Overview
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
                    <ProposalIcon sx={{ fontSize: 20, color: 'white' }} />
                  </Box>
                  <Tooltip title="Total proposals submitted">
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
                    All Submissions
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
                  <Tooltip title="Ethics approvals granted">
                    <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', fontSize: '1.3rem', lineHeight: 1.1, mb: 0.25 }}>
                    {analyticsData.overview.approvedEthics}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'white', fontSize: '0.8rem', opacity: 0.9 }}>
                    Ethics Approved
                  </Typography>
                </Box>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <ApprovedIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.9)' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.7rem' }}>
                    Approved
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
                    <PendingIcon sx={{ fontSize: 20, color: 'white' }} />
                  </Box>
                  <Tooltip title="Pending ethics review">
                    <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', fontSize: '1.3rem', lineHeight: 1.1, mb: 0.25 }}>
                    {analyticsData.overview.pendingEthics}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'white', fontSize: '0.8rem', opacity: 0.9 }}>
                    Pending Review
                  </Typography>
                </Box>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <PendingIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.9)' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.7rem' }}>
                    Under Review
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
                    <ShieldIcon sx={{ fontSize: 20, color: 'white' }} />
                  </Box>
                  <Tooltip title="Proposals with data management plans">
                    <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', fontSize: '1.3rem', lineHeight: 1.1, mb: 0.25 }}>
                    {analyticsData.overview.proposalsWithDataPlan}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'white', fontSize: '0.8rem', opacity: 0.9 }}>
                    Data Plans
                  </Typography>
                </Box>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <ShieldIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.9)' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.7rem' }}>
                    Data Management
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
                  <Tooltip title="Overall compliance rate">
                    <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', fontSize: '1.3rem', lineHeight: 1.1, mb: 0.25 }}>
                    {analyticsData.overview.complianceRate}%
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'white', fontSize: '0.8rem', opacity: 0.9 }}>
                    Compliance Rate
                  </Typography>
                </Box>
                <Box>
                  <LinearProgress
                    variant="determinate"
                    value={analyticsData.overview.complianceRate}
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
                    <FactCheckIcon sx={{ fontSize: 20, color: 'white' }} />
                  </Box>
                  <Tooltip title="Ethics approval success rate">
                    <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', fontSize: '1.3rem', lineHeight: 1.1, mb: 0.25 }}>
                    {analyticsData.overview.approvalRate}%
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'white', fontSize: '0.8rem', opacity: 0.9 }}>
                    Approval Rate
                  </Typography>
                </Box>
                <Box>
                  <LinearProgress
                    variant="determinate"
                    value={analyticsData.overview.approvalRate}
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
          {/* Monthly Ethics Approvals */}
          <Card sx={{ 
            borderRadius: 3, 
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid rgba(139, 108, 188, 0.1)'
          }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <LineChartIcon sx={{ color: '#8b6cbc' }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Monthly Ethics Approvals
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Ethics review outcomes over the last 6 months
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
                      <Stack direction="row" spacing={1} sx={{ minWidth: 120 }}>
                        <Chip 
                          label={`A:${trend.approved}`} 
                          size="small" 
                          sx={{ 
                            height: 20, 
                            fontSize: '0.65rem',
                            bgcolor: alpha('#4caf50', 0.1),
                            color: '#4caf50'
                          }} 
                        />
                        <Chip 
                          label={`P:${trend.pending}`} 
                          size="small" 
                          sx={{ 
                            height: 20, 
                            fontSize: '0.65rem',
                            bgcolor: alpha('#ff9800', 0.1),
                            color: '#ff9800'
                          }} 
                        />
                      </Stack>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </CardContent>
          </Card>

          {/* Compliance by Department */}
          <Card sx={{ 
            borderRadius: 3, 
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid rgba(139, 108, 188, 0.1)'
          }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <BarChartIcon sx={{ color: '#8b6cbc' }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Compliance by Department
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Top departments by compliance rate
              </Typography>
              
              <Box sx={{ 
                height: 300, 
                overflowY: 'auto'
              }}>
                <Stack spacing={2}>
                  {analyticsData.complianceByDepartment.slice(0, 5).map((dept, index) => (
                    <Box key={dept.department}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {dept.department}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#8b6cbc' }}>
                          {dept.complianceRate}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={dept.complianceRate}
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
                        {dept.totalProposals} proposals
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
          {/* Recent Approvals */}
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
                      Recent Approvals
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Latest ethics approvals granted
                    </Typography>
                  </Box>
                  <TextField
                    size="small"
                    placeholder="Search approvals..."
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
                        Committee
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, backgroundColor: '#fafafa', borderBottom: '2px solid', borderColor: 'divider', py: 1.5 }}>
                        Date
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
                          <Typography variant="body2">
                            {proposal.ethicsCommittee || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(proposal.approvalDate)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Pending Reviews */}
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
                      Pending Reviews
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Awaiting ethics committee review
                    </Typography>
                  </Box>
                  <TextField
                    size="small"
                    placeholder="Search pending..."
                    value={pendingSearchTerm}
                    onChange={(e) => setPendingSearchTerm(e.target.value)}
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
                  {filteredPending.slice(0, 10).map((proposal) => (
                    <Box
                      key={proposal.id}
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
                            {proposal.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            {proposal.principalInvestigator} • {proposal.department}
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                        {proposal.hasDataPlan && (
                          <Chip
                            icon={<ShieldIcon sx={{ fontSize: 14 }} />}
                            label="Data Plan"
                            size="small"
                            sx={{ 
                              height: 20, 
                              fontSize: '0.65rem',
                              bgcolor: alpha('#8b6cbc', 0.1),
                              color: '#8b6cbc'
                            }}
                          />
                        )}
                        {proposal.hasConsent && (
                          <Chip
                            icon={<FactCheckIcon sx={{ fontSize: 14 }} />}
                            label="Consent"
                            size="small"
                            sx={{ 
                              height: 20, 
                              fontSize: '0.65rem',
                              bgcolor: alpha('#4caf50', 0.1),
                              color: '#4caf50'
                            }}
                          />
                        )}
                        <Typography variant="caption" color="text.secondary">
                          Submitted: {formatDate(proposal.submittedDate)}
                        </Typography>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </>
  );
};

export default ComplianceAnalytics;
