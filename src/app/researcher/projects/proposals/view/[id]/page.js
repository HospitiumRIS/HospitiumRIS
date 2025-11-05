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
  DialogActions
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
  Close as CloseIcon
} from '@mui/icons-material';
import PageHeader from '../../../../../../components/common/PageHeader';
import { useAuth } from '../../../../../../components/AuthProvider';

const SectionHeader = ({ icon, title, number }) => (
  <Box sx={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: 2, 
    mb: 3,
    p: 2,
    borderRadius: 2,
    background: 'linear-gradient(135deg, #8b6cbc 0%, #a855f7 100%)',
    color: 'white'
  }}>
    {number && (
      <Box sx={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 600,
        fontSize: '1.1rem'
      }}>
        {number}
      </Box>
    )}
    {icon && !number && (
      <Box sx={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        {icon}
      </Box>
    )}
    <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
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
    <Box sx={{ mt: '80px' }}>
      {/* Page Header */}
      <PageHeader
        title={proposal.title}
        subtitle="Proposal Details"
        showBackButton={true}
        backButtonText="Back to Proposals"
        actions={
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleEdit}
              sx={{ borderColor: '#8b6cbc', color: '#8b6cbc' }}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
              sx={{ borderColor: '#22c55e', color: '#22c55e' }}
            >
              Share
            </Button>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              sx={{ borderColor: '#6b7280', color: '#6b7280' }}
            >
              Print
            </Button>
            {/* Demo Admin Actions - In real app, these would be in admin interface */}
            {proposal?.status === 'DRAFT' && (
              <Button
                variant="contained"
                onClick={() => simulateStatusUpdate('UNDER_REVIEW', 'Proposal submitted for review by Research Admin.')}
                sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}
              >
                Submit for Review
              </Button>
            )}
            {proposal?.status === 'UNDER_REVIEW' && (
              <>
                <Button
                  variant="contained"
                  onClick={() => simulateStatusUpdate('APPROVED', 'Proposal approved. All requirements met and ready to proceed.')}
                  sx={{ backgroundColor: '#22c55e', '&:hover': { backgroundColor: '#16a34a' } }}
                >
                  Approve
                </Button>
                <Button
                  variant="contained"
                  onClick={() => simulateStatusUpdate('REQUIRES_AMENDMENT', 'Amendments required before approval.', 'Please provide more detailed methodology section and update the budget breakdown.', ['Detailed Budget Spreadsheet', 'Ethics Approval Certificate'])}
                  sx={{ backgroundColor: '#f59e0b', '&:hover': { backgroundColor: '#d97706' } }}
                >
                  Request Amendment
                </Button>
              </>
            )}
          </Stack>
        }
        onBack={handleBack}
      />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Two Column Layout from the top */}
        <Box sx={{ 
          display: 'flex', 
          gap: 4, 
          alignItems: 'flex-start',
          '@media (max-width: 900px)': {
            flexDirection: 'column'
          }
        }}>
          {/* Left Column - Main Content */}
          <Box sx={{ 
            flex: '1 1 auto',
            minWidth: 0,
            '@media (max-width: 900px)': {
              width: '100%'
            }
          }}>
            {/* Proposal Status Indicator */}
            <Paper sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {getStatusIcon(proposal.status)}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2D3748' }}>
                    Proposal Status
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                    <Chip
                      label={proposal.status?.replace('_', ' ') || 'Draft'}
                      color={getStatusColor(proposal.status)}
                      variant="filled"
                      sx={{ fontWeight: 600 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {proposal.status === 'DRAFT' && 'Draft saved. Submit to send to Research Admin for review.'}
                      {proposal.status === 'SUBMITTED' && 'Submitted and awaiting review by Research Admin.'}
                      {proposal.status === 'UNDER_REVIEW' && 'Currently under review by Research Admin.'}
                      {proposal.status === 'APPROVED' && 'Approved by Research Admin. Proposal is ready to proceed.'}
                      {proposal.status === 'REJECTED' && 'Rejected by Research Admin. Please review feedback.'}
                      {proposal.status === 'REQUIRES_AMENDMENT' && 'Amendments required. Please address the feedback and resubmit.'}
                    </Typography>
                  </Stack>
                </Box>
              </Box>
            </Paper>
          {/* Core Information */}
          <Card sx={{ mb: 4, borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <SectionHeader number="1" title="Core Information" />
            <CardContent sx={{ p: 4, pt: 0 }}>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Abstract
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
                    {proposal.abstract || 'No abstract provided'}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Research Areas
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {proposal.researchAreas?.map((area, index) => (
                      <Chip
                        key={index}
                        label={area}
                        size="small"
                        sx={{ backgroundColor: '#f0f9ff', color: '#0ea5e9' }}
                      />
                    )) || <Typography variant="body2" color="text.secondary">None specified</Typography>}
                  </Stack>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Departments
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {proposal.departments?.map((dept, index) => (
                      <Chip
                        key={index}
                        label={dept}
                        size="small"
                        sx={{ backgroundColor: '#f0fdf4', color: '#22c55e' }}
                      />
                    )) || <Typography variant="body2" color="text.secondary">None specified</Typography>}
                  </Stack>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Start Date
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(proposal.startDate)}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    End Date
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(proposal.endDate)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Research Details */}
          <Card sx={{ mb: 4, borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <SectionHeader icon={<ScienceIcon />} title="Research Details" />
            <CardContent sx={{ p: 4, pt: 0 }}>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Research Objectives
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
                    {proposal.researchObjectives || 'No research objectives provided'}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Methodology
                  </Typography>
                  <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                    {proposal.methodology || 'No methodology provided'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Project Management */}
          {(proposal.milestones?.length > 0 || proposal.deliverables?.length > 0) && (
            <Card sx={{ mb: 4, borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <SectionHeader icon={<TimelineIcon />} title="Project Management" />
              <CardContent sx={{ p: 4, pt: 0 }}>

                <Grid container spacing={4}>
                  {proposal.milestones?.length > 0 && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                        Milestones
                      </Typography>
                      <Stack spacing={2}>
                        {proposal.milestones.map((milestone, index) => (
                          <Paper key={index} sx={{ p: 2, backgroundColor: '#f8f9fa', border: '1px solid #e2e8f0' }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                              <Box component="span" sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                backgroundColor: '#8b6cbc',
                                color: 'white',
                                fontSize: 12,
                                mr: 1
                              }}>{index + 1}</Box>
                              {milestone.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                              Target: {formatDate(milestone.targetDate)}
                            </Typography>
                            {milestone.description && (
                              <Typography variant="body2" color="text.secondary">
                                {milestone.description}
                              </Typography>
                            )}
                          </Paper>
                        ))}
                      </Stack>
                    </Grid>
                  )}

                  {proposal.deliverables?.length > 0 && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                        Deliverables
                      </Typography>
                      <Stack spacing={2}>
                        {proposal.deliverables.map((deliverable, index) => (
                          <Paper key={index} sx={{ p: 2, backgroundColor: '#f8f9fa', border: '1px solid #e2e8f0' }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                              {deliverable.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                              Due: {formatDate(deliverable.dueDate)} • Type: {deliverable.type}
                            </Typography>
                            {deliverable.description && (
                              <Typography variant="body2" color="text.secondary">
                                {deliverable.description}
                              </Typography>
                            )}
                          </Paper>
                        ))}
                      </Stack>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Funding Information moved to sidebar */}

          {/* Ethical Considerations */}
          <Card sx={{ mb: 4, borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <SectionHeader icon={<EthicsIcon />} title="Ethical Considerations" />
            <CardContent sx={{ p: 4, pt: 0 }}>

              <Grid container spacing={3}>
                {proposal.ethicalConsiderationsOverview && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Overview
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
                      {proposal.ethicalConsiderationsOverview}
                    </Typography>
                  </Grid>
                )}

                {proposal.consentProcedures && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Consent Procedures
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
                      {proposal.consentProcedures}
                    </Typography>
                  </Grid>
                )}

                {proposal.dataSecurityMeasures && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Data Security Measures
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
                      {proposal.dataSecurityMeasures}
                    </Typography>
                  </Grid>
                )}

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Ethics Approval Status
                  </Typography>
                  <Chip
                    label={proposal.ethicsApprovalStatus || 'Not specified'}
                    size="small"
                    color={proposal.ethicsApprovalStatus === 'Approved' ? 'success' : 'default'}
                  />
                </Grid>

                {proposal.ethicsCommittee && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Ethics Committee
                    </Typography>
                    <Typography variant="body1">
                      {proposal.ethicsCommittee}
                    </Typography>
                  </Grid>
                )}

                {proposal.ethicsApprovalReference && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Approval Reference
                    </Typography>
                    <Typography variant="body1">
                      {proposal.ethicsApprovalReference}
                    </Typography>
                  </Grid>
                )}

                {proposal.approvalDate && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Approval Date
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(proposal.approvalDate)}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Files Section */}
          {(proposal.ethicsDocuments?.length > 0 || proposal.dataManagementPlan?.length > 0 || proposal.otherRelatedFiles?.length > 0) && (
            <Card sx={{ mb: 4, borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <SectionHeader icon={<FilesIcon />} title="Attached Files" />
              <CardContent sx={{ p: 4, pt: 0 }}>

                <Grid container spacing={3}>
                  {proposal.ethicsDocuments?.length > 0 && (
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                        Ethics Documents
                      </Typography>
                      <Stack spacing={1}>
                        {proposal.ethicsDocuments.map((file, index) => (
                          <Paper key={index} sx={{ p: 2, backgroundColor: '#fef3f2', border: '1px solid #fecaca' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                <FilesIcon sx={{ color: '#dc2626', fontSize: 20 }} />
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: 'break-word' }}>
                                    {file.originalName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {Math.round(file.size / 1024)} KB
                                  </Typography>
                                </Box>
                              </Box>
                              <IconButton
                                size="small"
                                onClick={() => handleDownloadFile(file)}
                                sx={{ color: '#dc2626' }}
                              >
                                <DownloadIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Paper>
                        ))}
                      </Stack>
                    </Grid>
                  )}

                  {proposal.dataManagementPlan?.length > 0 && (
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                        Data Management Plan
                      </Typography>
                      <Stack spacing={1}>
                        {proposal.dataManagementPlan.map((file, index) => (
                          <Paper key={index} sx={{ p: 2, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                <FilesIcon sx={{ color: '#16a34a', fontSize: 20 }} />
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: 'break-word' }}>
                                    {file.originalName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {Math.round(file.size / 1024)} KB
                                  </Typography>
                                </Box>
                              </Box>
                              <IconButton
                                size="small"
                                onClick={() => handleDownloadFile(file)}
                                sx={{ color: '#16a34a' }}
                              >
                                <DownloadIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Paper>
                        ))}
                      </Stack>
                    </Grid>
                  )}

                  {proposal.otherRelatedFiles?.length > 0 && (
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                        Other Related Files
                      </Typography>
                      <Stack spacing={1}>
                        {proposal.otherRelatedFiles.map((file, index) => (
                          <Paper key={index} sx={{ p: 2, backgroundColor: '#f0f9ff', border: '1px solid #bfdbfe' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                <FilesIcon sx={{ color: '#2563eb', fontSize: 20 }} />
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: 'break-word' }}>
                                    {file.originalName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {Math.round(file.size / 1024)} KB
                                  </Typography>
                                </Box>
                              </Box>
                              <IconButton
                                size="small"
                                onClick={() => handleDownloadFile(file)}
                                sx={{ color: '#2563eb' }}
                              >
                                <DownloadIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Paper>
                        ))}
                      </Stack>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          )}
          </Box>

          {/* Right Column - Sidebar */}
          <Box sx={{ 
            flex: '0 0 320px',
            '@media (max-width: 900px)': {
              flex: '1 1 auto',
              width: '100%'
            }
          }}>
            <Box sx={{ position: 'sticky', top: '20px' }}>
              {/* Sidebar: Status Summary */}
              <Card sx={{ mb: 4, borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <Box sx={{ 
                  p: 2,
                  background: 'linear-gradient(135deg, #8b6cbc 0%, #a855f7 100%)',
                  color: 'white'
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'white' }}>
                    Status Summary
                  </Typography>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(proposal.status)}
                      <Chip
                        label={proposal.status?.replace('_', ' ') || 'Draft'}
                        color={getStatusColor(proposal.status)}
                        variant="filled"
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Created</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatDate(proposal.createdAt)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Last Updated</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatDate(proposal.updatedAt)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Budget</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(proposal.totalBudgetAmount)}
                      </Typography>
                    </Box>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<HistoryIcon />}
                      onClick={handleOpenReviewHistory}
                      sx={{ 
                        mt: 2,
                        borderColor: '#8b6cbc',
                        color: '#8b6cbc',
                        '&:hover': {
                          borderColor: '#7c3aed',
                          backgroundColor: 'rgba(139, 108, 188, 0.04)'
                        }
                      }}
                    >
                      Review History
                    </Button>
                  </Stack>
                </CardContent>
              </Card>

              {/* Funding Information */}
              <Card sx={{ mb: 4, borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <Box sx={{ 
                  p: 2,
                  background: 'linear-gradient(135deg, #8b6cbc 0%, #a855f7 100%)',
                  color: 'white'
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'white' }}>
                    Funding Information
                  </Typography>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Funding Source</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {proposal.fundingSource || 'Not specified'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Funding Institution</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {proposal.fundingInstitution || 'Not specified'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Grant Number</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {proposal.grantNumber || 'Not specified'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Total Budget</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#10b981' }}>
                        {formatCurrency(proposal.totalBudgetAmount)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Grant Start Date</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatDate(proposal.grantStartDate)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Grant End Date</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatDate(proposal.grantEndDate)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Team Information */}
              <Card sx={{ mb: 4, borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <Box sx={{ 
                  p: 2,
                  background: 'linear-gradient(135deg, #8b6cbc 0%, #a855f7 100%)',
                  color: 'white'
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'white' }}>
                    Team Information
                  </Typography>
                </Box>
                <CardContent sx={{ p: 3 }}>

                  {/* Principal Investigator */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                      Principal Investigator
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: '#8b6cbc' }}>
                        <PersonIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {proposal.principalInvestigator || 'Not specified'}
                        </Typography>
                        {proposal.principalInvestigatorOrcid && (
                          <Chip
                            label={`ORCID: ${proposal.principalInvestigatorOrcid}`}
                            size="small"
                            sx={{ mt: 0.5, backgroundColor: '#8b6cbc', color: 'white' }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>

                  {/* Co-Investigators */}
                  {proposal.coInvestigators?.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                        Co-Investigators ({proposal.coInvestigators.length})
                      </Typography>
                      <Stack spacing={2}>
                        {proposal.coInvestigators.map((coInv, index) => (
                          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: '#22c55e', width: 32, height: 32 }}>
                              <GroupIcon fontSize="small" />
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {coInv.name}
                              </Typography>
                              {coInv.email && (
                                <Typography variant="caption" color="text.secondary">
                                  {coInv.email}
                                </Typography>
                              )}
                              {coInv.orcidId && (
                                <Chip
                                  label={`ORCID: ${coInv.orcidId}`}
                                  size="small"
                                  sx={{ mt: 0.5, backgroundColor: '#22c55e', color: 'white' }}
                                />
                              )}
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card sx={{ mb: 4, borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <Box sx={{ 
                  p: 2,
                  background: 'linear-gradient(135deg, #8b6cbc 0%, #a855f7 100%)',
                  color: 'white'
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'white' }}>
                    Quick Stats
                  </Typography>
                </Box>
                <CardContent sx={{ p: 3 }}>

                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Research Areas
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {proposal.researchAreas?.length || 0}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Departments
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {proposal.departments?.length || 0}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Co-Investigators
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {proposal.coInvestigators?.length || 0}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Milestones
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {proposal.milestones?.length || 0}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Deliverables
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {proposal.deliverables?.length || 0}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Attached Files
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {(proposal.ethicsDocuments?.length || 0) + 
                         (proposal.dataManagementPlan?.length || 0) + 
                         (proposal.otherRelatedFiles?.length || 0)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Related Publications */}
              {proposal.selectedPublications?.length > 0 && (
                <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <Box sx={{ 
                    p: 2,
                    background: 'linear-gradient(135deg, #8b6cbc 0%, #a855f7 100%)',
                    color: 'white'
                  }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'white' }}>
                      Related Publications ({proposal.selectedPublications.length})
                    </Typography>
                  </Box>
                  <CardContent sx={{ p: 3 }}>

                    <Stack spacing={2}>
                      {proposal.selectedPublications.slice(0, 3).map((pub, index) => (
                        <Paper key={index} sx={{ p: 2, backgroundColor: '#f8f9fa', border: '1px solid #e2e8f0' }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                            {pub.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                            {pub.authors} • {pub.year}
                          </Typography>
                          {pub.journal && (
                            <Typography variant="caption" color="text.secondary">
                              {pub.journal}
                            </Typography>
                          )}
                        </Paper>
                      ))}
                      {proposal.selectedPublications.length > 3 && (
                        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
                          +{proposal.selectedPublications.length - 3} more publications
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              )}
            </Box>
          </Box>
        </Box>
      </Container>

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
          background: 'linear-gradient(135deg, #8b6cbc 0%, #a855f7 100%)',
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
    </Box>
  );
};

export default ProposalViewPage;
