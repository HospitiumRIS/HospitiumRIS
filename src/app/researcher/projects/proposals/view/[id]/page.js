'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Paper,
  Divider,
  Stack,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Avatar,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Print as PrintIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  School as SchoolIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as BudgetIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Science as ScienceIcon,
  BusinessCenter as ManagementIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  CloudDownload as CloudDownloadIcon,
  ExpandMore as ExpandMoreIcon,
  Timeline as TimelineIcon,
  Shield as EthicsIcon,
  FolderOpen as FilesIcon,
  Assignment as AssignmentIcon,
  Verified as VerifiedIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  History as HistoryIcon,
  Close as CloseIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import { useAuth } from '@/components/AuthProvider';

const SectionHeader = ({ icon, title, number }) => (
  <Box sx={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: 2, 
    mb: 3,
    pb: 2,
    borderBottom: '2px solid #e5e7eb'
  }}>
    {number && (
      <Box sx={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        backgroundColor: '#8b6cbc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 700,
        fontSize: '1rem'
      }}>
        {number}
      </Box>
    )}
    {icon && !number && (
      <Box sx={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        backgroundColor: '#8b6cbc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        {icon}
      </Box>
    )}
    <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '1.1rem' }}>
      {title}
    </Typography>
  </Box>
);

const ProposalViewPage = () => {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewHistoryOpen, setReviewHistoryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  useEffect(() => {
    if (params.id) {
      fetchProposal();
    }
  }, [params.id]);

  const fetchProposal = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/proposals/${params.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch proposal');
      }

      const data = await response.json();
      
      if (data.success) {
        setProposal(data.proposal);
      } else {
        throw new Error(data.error || 'Failed to fetch proposal');
      }
    } catch (error) {
      console.error('Error fetching proposal:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/researcher/projects/proposals/edit/${params.id}`);
  };

  const handleBack = () => {
    router.push('/researcher/projects/proposals/list');
  };

  const handleOpenReviewHistory = () => {
    setReviewHistoryOpen(true);
  };

  const handleCloseReviewHistory = () => {
    setReviewHistoryOpen(false);
  };

  // Demo function to simulate status updates (in real app, this would be handled by admin)
  const simulateStatusUpdate = (newStatus, comment, amendmentRequirements = null, missingFiles = []) => {
    const updatedProposal = {
      ...proposal,
      status: newStatus,
      reviewHistory: [
        ...(proposal.reviewHistory || []),
        {
          status: newStatus,
          date: new Date().toISOString(),
          comment: comment,
          reviewer: 'Dr. Research Admin',
          amendmentRequirements: amendmentRequirements,
          missingFiles: missingFiles
        }
      ]
    };
    setProposal(updatedProposal);
  };

  const handleDownloadFile = async (file) => {
    try {
      // Create a download link for the file
      const link = document.createElement('a');
      link.href = `/api/proposals/${params.id}/files/${file.fileName}`;
      link.download = file.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'DRAFT': return 'warning';
      case 'UNDER_REVIEW': return 'info';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      case 'REQUIRES_AMENDMENT': return 'warning';
      case 'SUBMITTED': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'DRAFT': return <EditIcon />;
      case 'UNDER_REVIEW': return <ScheduleIcon />;
      case 'SUBMITTED': return <ScheduleIcon />;
      case 'APPROVED': return <CheckIcon />;
      case 'REJECTED': return <InfoIcon />;
      case 'REQUIRES_AMENDMENT': return <EditIcon />;
      default: return <InfoIcon />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Back to Proposals
        </Button>
      </Container>
    );
  }

  if (!proposal) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Proposal not found
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Back to Proposals
        </Button>
      </Container>
    );
  }

  return (
    <>
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Purple Gradient Header */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 100%)',
        color: 'white',
        pt: 10,
        pb: 4
      }}>
        <Container maxWidth="xl">
          {/* Breadcrumbs */}
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                cursor: 'pointer',
                '&:hover': { color: 'white' }
              }}
              onClick={() => router.push('/researcher')}
            >
              Institution
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>/</Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                cursor: 'pointer',
                '&:hover': { color: 'white' }
              }}
              onClick={() => router.push('/researcher/projects/proposals/list')}
            >
              Proposal Review
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>/</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              Details
            </Typography>
          </Box>

          {/* Title Section */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
            <Box sx={{
              width: 48,
              height: 48,
              borderRadius: 1.5,
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <AssignmentIcon sx={{ fontSize: 28 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, lineHeight: 1.3 }}>
                {proposal.title}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.95)', mb: 2 }}>
                Principal Investigator: <strong>{proposal.principalInvestigator || 'Not specified'}</strong> • Add "{proposal.departments?.[0] || 'Clinical Research & Epidemiology'}"
              </Typography>
            </Box>
          </Box>

          {/* Action Buttons */}
          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.25)'
                }
              }}
            >
              Back to List
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Stats Bar */}
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ 
          borderRadius: 0, 
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          overflow: 'hidden'
        }}>
          <Box sx={{ 
            display: 'flex',
            flexWrap: 'wrap'
          }}>
            <Box sx={{ 
              flex: '1 1 250px',
              p: 3, 
              textAlign: 'center',
              borderRight: '1px solid #e5e7eb'
            }}>
              <Typography variant="caption" sx={{ 
                color: '#9ca3af', 
                fontWeight: 600, 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px',
                fontSize: '0.7rem'
              }}>
                Budget
              </Typography>
              <Typography variant="h5" sx={{ 
                fontWeight: 700, 
                color: '#8b6cbc', 
                mt: 1 
              }}>
                {formatCurrency(proposal.totalBudgetAmount)}
              </Typography>
            </Box>
            <Box sx={{ 
              flex: '1 1 250px',
              p: 3, 
              textAlign: 'center',
              borderRight: '1px solid #e5e7eb'
            }}>
              <Typography variant="caption" sx={{ 
                color: '#9ca3af', 
                fontWeight: 600, 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px',
                fontSize: '0.7rem'
              }}>
                Status
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
                <Chip
                  icon={getStatusIcon(proposal.status)}
                  label={proposal.status?.replace('_', ' ') || 'Draft'}
                  sx={{
                    bgcolor: '#0ea5e9',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    height: '32px',
                    '& .MuiChip-icon': {
                      color: 'white'
                    }
                  }}
                />
              </Box>
            </Box>
            <Box sx={{ 
              flex: '1 1 250px',
              p: 3, 
              textAlign: 'center',
              borderRight: '1px solid #e5e7eb'
            }}>
              <Typography variant="caption" sx={{ 
                color: '#9ca3af', 
                fontWeight: 600, 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px',
                fontSize: '0.7rem'
              }}>
                Duration
              </Typography>
              <Typography variant="h5" sx={{ 
                fontWeight: 700, 
                color: '#2c3e50', 
                mt: 1 
              }}>
                {proposal.startDate && proposal.endDate ? 
                  Math.ceil((new Date(proposal.endDate) - new Date(proposal.startDate)) / (1000 * 60 * 60 * 24 * 30)) : 0} months
              </Typography>
            </Box>
            <Box sx={{ 
              flex: '1 1 250px',
              p: 3, 
              textAlign: 'center'
            }}>
              <Typography variant="caption" sx={{ 
                color: '#9ca3af', 
                fontWeight: 600, 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px',
                fontSize: '0.7rem'
              }}>
                Submitted
              </Typography>
              <Typography variant="h5" sx={{ 
                fontWeight: 700, 
                color: '#2c3e50', 
                mt: 1 
              }}>
                {formatDate(proposal.createdAt)}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>

      {/* Tabs Section */}
      <Container maxWidth="xl" sx={{ mb: 4 }}>
        <Paper sx={{ borderRadius: 0, boxShadow: 'none', borderBottom: '1px solid #e5e7eb' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                color: '#6b7280',
                minHeight: '48px',
                '&.Mui-selected': {
                  color: '#8b6cbc'
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#8b6cbc',
                height: '3px'
              }
            }}
          >
            <Tab 
              icon={<InfoIcon sx={{ fontSize: 18 }} />} 
              iconPosition="start" 
              label="Overview" 
            />
            <Tab 
              icon={<ScienceIcon sx={{ fontSize: 18 }} />} 
              iconPosition="start" 
              label="Research Details" 
            />
            <Tab 
              icon={<EthicsIcon sx={{ fontSize: 18 }} />} 
              iconPosition="start" 
              label="Ethics & Compliance" 
            />
            <Tab 
              icon={<FilesIcon sx={{ fontSize: 18 }} />} 
              iconPosition="start" 
              label="Supporting Documents" 
            />
            <Tab 
              icon={<HistoryIcon sx={{ fontSize: 18 }} />} 
              iconPosition="start" 
              label="Review History" 
            />
          </Tabs>
        </Paper>
      </Container>

      <Container maxWidth="xl" sx={{ pt: 2, pb: 4 }}>
        {/* Overview Tab Content */}
        {activeTab === 0 && (
              <Box>
                {/* Top Row - Two Cards */}
                <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
                  {/* Proposal Details Card */}
                  <Card sx={{ flex: '1 1 400px', borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                        <AssignmentIcon sx={{ color: '#8b6cbc', fontSize: 24 }} />
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '1rem' }}>
                          Proposal Details
                        </Typography>
                      </Box>

                      <Stack spacing={2.5}>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                            Title
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5, color: '#2c3e50', lineHeight: 1.6 }}>
                            {proposal.title}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                            Research Areas
                          </Typography>
                          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {proposal.researchAreas?.map((area, index) => (
                              <Chip
                                key={index}
                                label={area}
                                size="small"
                                sx={{ 
                                  bgcolor: '#f3e8ff', 
                                  color: '#8b6cbc',
                                  fontWeight: 600,
                                  fontSize: '0.75rem'
                                }}
                              />
                            )) || <Typography variant="body2" color="text.secondary">None specified</Typography>}
                          </Box>
                        </Box>

                        <Box>
                          <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                            Description
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5, color: '#4b5563', lineHeight: 1.6 }}>
                            {proposal.abstract || 'No description provided'}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                            Duration
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5, color: '#2c3e50', fontWeight: 600 }}>
                            {proposal.startDate && proposal.endDate ? 
                              Math.ceil((new Date(proposal.endDate) - new Date(proposal.startDate)) / (1000 * 60 * 60 * 24 * 30)) : 0} months
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                            Project Timeline
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5, color: '#2c3e50' }}>
                            {formatDate(proposal.startDate)} - {formatDate(proposal.endDate)}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                            Status
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <Chip
                              icon={getStatusIcon(proposal.status)}
                              label={proposal.status?.replace('_', ' ') || 'Draft'}
                              sx={{
                                bgcolor: '#0ea5e9',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                '& .MuiChip-icon': {
                                  color: 'white'
                                }
                              }}
                            />
                            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#6b7280' }}>
                              Days in Review
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#2c3e50' }}>
                              {Math.ceil((new Date() - new Date(proposal.createdAt)) / (1000 * 60 * 60 * 24))} days
                            </Typography>
                          </Box>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>

                  {/* Principal Investigator & Team Card */}
                  <Card sx={{ flex: '1 1 400px', borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                        <PersonIcon sx={{ color: '#8b6cbc', fontSize: 24 }} />
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '1rem' }}>
                          Principal Investigator & Team
                        </Typography>
                      </Box>

                      <Stack spacing={2.5}>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                            Principal Investigator
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5, color: '#2c3e50', fontWeight: 600 }}>
                            {proposal.principalInvestigator || 'Not specified'}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                            Department
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5, color: '#2c3e50' }}>
                            Add "{proposal.departments?.[0] || 'Clinical Research & Epidemiology'}"
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>

                {/* Funding Information Card */}
                <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <BudgetIcon sx={{ color: '#8b6cbc', fontSize: 24 }} />
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '1rem' }}>
                          Funding Information
                        </Typography>
                      </Box>
                      <Chip 
                        label="Compliant" 
                        size="small"
                        sx={{ 
                          bgcolor: '#10b981', 
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      <Box sx={{ 
                        flex: '0 0 auto',
                        p: 3,
                        borderRadius: 2,
                        bgcolor: '#f3e8ff'
                      }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#8b6cbc', mb: 0.5 }}>
                          {formatCurrency(proposal.totalBudgetAmount)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>
                          Total Budget Requested
                        </Typography>
                      </Box>

                      <Box sx={{ flex: '1 1 300px' }}>
                        <Stack spacing={2}>
                          <Box>
                            <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                              Funding Source
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5, color: '#2c3e50', fontWeight: 600 }}>
                              {proposal.fundingSource || 'Internal'}
                            </Typography>
                          </Box>

                          <Box>
                            <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                              Funding Institution
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5, color: '#2c3e50' }}>
                              {proposal.fundingInstitution || 'N/A'}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            )}

            {/* Research Details Tab Content */}
            {activeTab === 1 && (
              <Box>
                {/* Research Objectives Section */}
                <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '1rem' }}>
                        Research Objectives
                      </Typography>
                      <Chip 
                        label="Compliant" 
                        size="small"
                        sx={{ 
                          bgcolor: '#10b981', 
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#4b5563', lineHeight: 1.8 }}>
                      {proposal.researchObjectives || 'No research objectives provided'}
                    </Typography>
                  </CardContent>
                </Card>

                {/* Methodology Section */}
                <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '1rem' }}>
                        Methodology
                      </Typography>
                      <Chip 
                        label="Compliant" 
                        size="small"
                        sx={{ 
                          bgcolor: '#10b981', 
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#4b5563', lineHeight: 1.8 }}>
                      {proposal.methodology || 'No methodology provided'}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            )}

            {/* Ethics & Compliance Tab Content */}
            {activeTab === 2 && (
              <Box>
                {/* Ethics Approval Status Section */}
                <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <EthicsIcon sx={{ color: '#8b6cbc', fontSize: 24 }} />
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '1rem' }}>
                          Ethics Approval Status
                        </Typography>
                      </Box>
                      <Chip 
                        label="Compliant" 
                        size="small"
                        sx={{ 
                          bgcolor: '#10b981', 
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                      />
                    </Box>
                    <Chip
                      label={proposal.ethicsApprovalStatus || 'Approved'}
                      sx={{
                        bgcolor: '#10b981',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        height: '32px'
                      }}
                    />
                  </CardContent>
                </Card>

                {/* Ethical Considerations Section */}
                <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '1rem' }}>
                        Ethical Considerations
                      </Typography>
                      <Chip 
                        label="Compliant" 
                        size="small"
                        sx={{ 
                          bgcolor: '#10b981', 
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#4b5563', lineHeight: 1.8 }}>
                      {proposal.ethicalConsiderationsOverview || 'Test'}
                    </Typography>
                  </CardContent>
                </Card>

                {/* Two Column Layout for Consent Procedures and Data Security */}
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  {/* Consent Procedures */}
                  <Card sx={{ flex: '1 1 400px', borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '1rem' }}>
                          Consent Procedures
                        </Typography>
                        <Chip 
                          label="Compliant" 
                          size="small"
                          sx={{ 
                            bgcolor: '#10b981', 
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.75rem'
                          }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ color: '#4b5563', lineHeight: 1.8 }}>
                        {proposal.consentProcedures || 'Test'}
                      </Typography>
                    </CardContent>
                  </Card>

                  {/* Data Security Measures */}
                  <Card sx={{ flex: '1 1 400px', borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '1rem' }}>
                          Data Security Measures
                        </Typography>
                        <Chip 
                          label="Compliant" 
                          size="small"
                          sx={{ 
                            bgcolor: '#10b981', 
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.75rem'
                          }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ color: '#4b5563', lineHeight: 1.8 }}>
                        {proposal.dataSecurityMeasures || 'Test'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            )}

            {/* Supporting Documents Tab Content */}
            {activeTab === 3 && (
              <Box>
                <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <FilesIcon sx={{ color: '#8b6cbc', fontSize: 24 }} />
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '1rem' }}>
                          Supporting Documents
                        </Typography>
                      </Box>
                      <Chip 
                        label="Compliant" 
                        size="small"
                        sx={{ 
                          bgcolor: '#10b981', 
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                      />
                    </Box>

                    {/* File List */}
                    <Stack spacing={2}>
                      {/* Ethics Documents */}
                      {proposal.ethicsDocuments?.map((file, index) => (
                        <Paper key={index} sx={{ 
                          p: 2.5, 
                          border: '1px solid #e5e7eb',
                          borderRadius: 2,
                          boxShadow: 'none',
                          '&:hover': {
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                          }
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {/* File Icon */}
                            <Box sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 1.5,
                              bgcolor: '#fee2e2',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <FilesIcon sx={{ color: '#dc2626', fontSize: 24 }} />
                            </Box>

                            {/* File Info */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                                  {file.originalName}
                                </Typography>
                                <Chip 
                                  label="Ethics Documents" 
                                  size="small"
                                  sx={{ 
                                    bgcolor: '#fef3c7', 
                                    color: '#92400e',
                                    fontWeight: 600,
                                    fontSize: '0.7rem',
                                    height: '20px'
                                  }}
                                />
                              </Box>
                              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                {file.mimeType || 'application/pdf'} • {Math.round(file.size / 1024)} KB
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
                                Uploaded: {formatDate(file.uploadedAt || new Date())}
                              </Typography>
                            </Box>

                            {/* View Button */}
                            <Button
                              variant="outlined"
                              startIcon={<ViewIcon />}
                              onClick={() => handleDownloadFile(file)}
                              sx={{
                                borderColor: '#e5e7eb',
                                color: '#6b7280',
                                textTransform: 'none',
                                fontWeight: 600,
                                '&:hover': {
                                  borderColor: '#8b6cbc',
                                  color: '#8b6cbc',
                                  bgcolor: '#f3e8ff'
                                }
                              }}
                            >
                              View
                            </Button>
                          </Box>
                        </Paper>
                      ))}

                      {/* Data Management Plan */}
                      {proposal.dataManagementPlan?.map((file, index) => (
                        <Paper key={index} sx={{ 
                          p: 2.5, 
                          border: '1px solid #e5e7eb',
                          borderRadius: 2,
                          boxShadow: 'none',
                          '&:hover': {
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                          }
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 1.5,
                              bgcolor: '#dcfce7',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <FilesIcon sx={{ color: '#16a34a', fontSize: 24 }} />
                            </Box>

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                                  {file.originalName}
                                </Typography>
                                <Chip 
                                  label="Data Management" 
                                  size="small"
                                  sx={{ 
                                    bgcolor: '#dbeafe', 
                                    color: '#1e40af',
                                    fontWeight: 600,
                                    fontSize: '0.7rem',
                                    height: '20px'
                                  }}
                                />
                              </Box>
                              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                {file.mimeType || 'application/pdf'} • {Math.round(file.size / 1024)} KB
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
                                Uploaded: {formatDate(file.uploadedAt || new Date())}
                              </Typography>
                            </Box>

                            <Button
                              variant="outlined"
                              startIcon={<ViewIcon />}
                              onClick={() => handleDownloadFile(file)}
                              sx={{
                                borderColor: '#e5e7eb',
                                color: '#6b7280',
                                textTransform: 'none',
                                fontWeight: 600,
                                '&:hover': {
                                  borderColor: '#8b6cbc',
                                  color: '#8b6cbc',
                                  bgcolor: '#f3e8ff'
                                }
                              }}
                            >
                              View
                            </Button>
                          </Box>
                        </Paper>
                      ))}

                      {/* Other Related Files */}
                      {proposal.otherRelatedFiles?.map((file, index) => (
                        <Paper key={index} sx={{ 
                          p: 2.5, 
                          border: '1px solid #e5e7eb',
                          borderRadius: 2,
                          boxShadow: 'none',
                          '&:hover': {
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                          }
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 1.5,
                              bgcolor: '#dbeafe',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <FilesIcon sx={{ color: '#2563eb', fontSize: 24 }} />
                            </Box>

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                                  {file.originalName}
                                </Typography>
                                <Chip 
                                  label="Other Documents" 
                                  size="small"
                                  sx={{ 
                                    bgcolor: '#f3f4f6', 
                                    color: '#374151',
                                    fontWeight: 600,
                                    fontSize: '0.7rem',
                                    height: '20px'
                                  }}
                                />
                              </Box>
                              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                {file.mimeType || 'application/pdf'} • {Math.round(file.size / 1024)} KB
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
                                Uploaded: {formatDate(file.uploadedAt || new Date())}
                              </Typography>
                            </Box>

                            <Button
                              variant="outlined"
                              startIcon={<ViewIcon />}
                              onClick={() => handleDownloadFile(file)}
                              sx={{
                                borderColor: '#e5e7eb',
                                color: '#6b7280',
                                textTransform: 'none',
                                fontWeight: 600,
                                '&:hover': {
                                  borderColor: '#8b6cbc',
                                  color: '#8b6cbc',
                                  bgcolor: '#f3e8ff'
                                }
                              }}
                            >
                              View
                            </Button>
                          </Box>
                        </Paper>
                      ))}

                      {/* Empty State */}
                      {(!proposal.ethicsDocuments?.length && !proposal.dataManagementPlan?.length && !proposal.otherRelatedFiles?.length) && (
                        <Box sx={{ textAlign: 'center', py: 6 }}>
                          <FilesIcon sx={{ fontSize: 48, color: '#d1d5db', mb: 2 }} />
                          <Typography variant="h6" sx={{ color: '#6b7280', mb: 1 }}>
                            No Documents Uploaded
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                            Supporting documents will appear here once uploaded
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            )}

            {/* Review History Tab Content */}
            {activeTab === 4 && (
              <Box>
                <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                      <HistoryIcon sx={{ color: '#8b6cbc', fontSize: 24 }} />
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '1rem' }}>
                        Review History
                      </Typography>
                    </Box>

                    {/* Info Alert */}
                    {(!proposal.reviewHistory || proposal.reviewHistory.length === 0) ? (
                      <Alert 
                        severity="info" 
                        sx={{ 
                          borderRadius: 2,
                          bgcolor: '#e0f2fe',
                          border: '1px solid #bae6fd',
                          '& .MuiAlert-icon': {
                            color: '#0284c7'
                          }
                        }}
                      >
                        <Typography variant="body2" sx={{ color: '#0c4a6e' }}>
                          No review history available for this proposal. This will be the first review.
                        </Typography>
                      </Alert>
                    ) : (
                      <Stack spacing={2}>
                        {proposal.reviewHistory.map((entry, idx) => (
                          <Paper key={idx} sx={{ 
                            p: 3, 
                            backgroundColor: entry.status === 'REQUIRES_AMENDMENT' ? '#fef3f2' : 
                                            entry.status === 'APPROVED' ? '#f0fdf4' :
                                            entry.status === 'REJECTED' ? '#fef2f2' : '#f8fafc',
                            border: `1px solid ${entry.status === 'REQUIRES_AMENDMENT' ? '#fecaca' : 
                                                entry.status === 'APPROVED' ? '#bbf7d0' :
                                                entry.status === 'REJECTED' ? '#fca5a5' : '#e2e8f0'}`,
                            borderRadius: 2
                          }}>
                            <Stack spacing={2}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Chip
                                  label={entry.status?.replace('_', ' ') || 'Unknown'}
                                  sx={{
                                    bgcolor: entry.status === 'APPROVED' ? '#10b981' : 
                                            entry.status === 'REJECTED' ? '#ef4444' : 
                                            entry.status === 'REQUIRES_AMENDMENT' ? '#f59e0b' : '#6b7280',
                                    color: 'white',
                                    fontWeight: 600
                                  }}
                                />
                                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                  {formatDate(entry.date)}
                                </Typography>
                              </Box>
                              
                              {entry.reviewer && (
                                <Box>
                                  <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>
                                    Reviewed by
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: '#2c3e50' }}>
                                    {entry.reviewer}
                                  </Typography>
                                </Box>
                              )}

                              {entry.comment && (
                                <Box>
                                  <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>
                                    Comments
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: '#4b5563', mt: 0.5 }}>
                                    {entry.comment}
                                  </Typography>
                                </Box>
                              )}
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </Box>
            )}
      </Container>
    </Box>

      {/* Review History Modal */}
      <Dialog 
        open={reviewHistoryOpen} 
        onClose={handleCloseReviewHistory}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          backgroundColor: '#8b6cbc',
          color: 'white'
        }}>
          <HistoryIcon />
          Review History
          <Box sx={{ flexGrow: 1 }} />
          <IconButton 
            onClick={handleCloseReviewHistory}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {Array.isArray(proposal?.reviewHistory) && proposal.reviewHistory.length > 0 ? (
            <Stack spacing={2} sx={{ mt: 1 }}>
              {proposal.reviewHistory.map((entry, idx) => (
                <Paper key={idx} sx={{ 
                  p: 3, 
                  backgroundColor: entry.status === 'REQUIRES_AMENDMENT' ? '#fef3f2' : 
                                  entry.status === 'APPROVED' ? '#f0fdf4' :
                                  entry.status === 'REJECTED' ? '#fef2f2' : '#f8fafc',
                  border: `1px solid ${entry.status === 'REQUIRES_AMENDMENT' ? '#fecaca' : 
                                      entry.status === 'APPROVED' ? '#bbf7d0' :
                                      entry.status === 'REJECTED' ? '#fca5a5' : '#e2e8f0'}`
                }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip
                          label={entry.status?.replace('_', ' ') || 'Unknown'}
                          color={getStatusColor(entry.status)}
                          variant="filled"
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(entry.date)}
                        </Typography>
                      </Box>
                      {entry.comment && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {entry.comment}
                        </Typography>
                      )}
                      {entry.amendmentRequirements && (
                        <Box sx={{ mt: 2, p: 2, backgroundColor: '#fff7ed', borderRadius: 1, border: '1px solid #fed7aa' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#ea580c', mb: 1 }}>
                            Amendment Requirements:
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {entry.amendmentRequirements}
                          </Typography>
                        </Box>
                      )}
                      {entry.missingFiles && entry.missingFiles.length > 0 && (
                        <Box sx={{ mt: 2, p: 2, backgroundColor: '#fef3f2', borderRadius: 1, border: '1px solid #fecaca' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#dc2626', mb: 1 }}>
                            Missing Files:
                          </Typography>
                          <Stack spacing={0.5}>
                            {entry.missingFiles.map((file, fileIdx) => (
                              <Typography key={fileIdx} variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                • {file}
                              </Typography>
                            ))}
                          </Stack>
                        </Box>
                      )}
                      {entry.reviewer && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Reviewed by: {entry.reviewer}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No Review Activity Yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Review history will appear here once the proposal is submitted for review.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCloseReviewHistory} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProposalViewPage;
