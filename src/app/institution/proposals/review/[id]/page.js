'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  Divider,
  CircularProgress,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Grid,
  Tabs,
  Tab,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  RateReview as ReviewIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  AttachMoney as BudgetIcon,
  Schedule as TimelineIcon,
  Person as PrincipalInvestigatorIcon,
  School as DepartmentIcon,
  Assignment as ProposalIcon,
  Assignment as AssignmentIcon,
  History as HistoryIcon,
  ArrowBack as BackIcon,
  AttachFile as AttachFileIcon,
  Description as DocumentIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as FileIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import PageHeader from '../../../../../components/common/PageHeader';
import { useAuth } from '../../../../../components/AuthProvider';

const ProposalDetailsPage = () => {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const proposalId = params.id;

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    decision: '',
    overallComments: '',
    rejectionReason: '',
    revisionRequirements: '',
    sectionReviews: {
      researchObjectives: { compliant: null, comments: '' },
      methodology: { compliant: null, comments: '' },
      ethicsCompliance: { compliant: null, comments: '' },
      budgetJustification: { compliant: null, comments: '' },
      timeline: { compliant: null, comments: '' },
      teamQualifications: { compliant: null, comments: '' }
    },
    recommendation: ''
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      loadProposal();
      loadReviews();
    }
  }, [proposalId, mounted]);

  const loadProposal = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/proposals/${proposalId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch proposal: ${response.status}`);
      }

      const result = await response.json();
      const data = result.proposal || result; // Handle both wrapped and unwrapped responses
      
      const transformedProposal = {
        id: data.id,
        title: data.title,
        principalInvestigator: data.principalInvestigator || 'Unknown',
        department: data.departments?.[0] || 'Unknown',
        status: data.status,
        budget: data.totalBudgetAmount || 0,
        submittedDate: data.createdAt,
        description: data.description || data.abstract || data.researchObjectives || 'No description available',
        researchArea: data.researchAreas?.[0] || 'General Research',
        duration: data.endDate && data.startDate 
          ? `${Math.ceil((new Date(data.endDate) - new Date(data.startDate)) / (1000 * 60 * 60 * 24 * 30))} months`
          : 'Not specified',
        startDate: data.startDate,
        endDate: data.endDate,
        collaborators: data.coInvestigators || [],
        ethicsApproval: data.ethicsApprovalStatus || 'Pending',
        fundingSource: data.fundingSource || 'Internal',
        fundingInstitution: data.fundingInstitution || 'N/A',
        grantNumber: data.grantNumber || 'N/A',
        researchObjectives: data.researchObjectives || '',
        methodology: data.methodology || '',
        milestones: data.milestones || [],
        deliverables: data.deliverables || [],
        ethicalConsiderations: data.ethicalConsiderationsOverview || '',
        dataSecurityMeasures: data.dataSecurityMeasures || '',
        consentProcedures: data.consentProcedures || '',
        reviewHistory: data.reviewHistory || [],
        documents: data.documents || [],
        researchAreas: data.researchAreas || [],
        totalBudgetAmount: data.totalBudgetAmount || 0,
        daysInReview: data.status === 'UNDER_REVIEW' && data.updatedAt 
          ? Math.ceil((new Date() - new Date(data.updatedAt)) / (1000 * 60 * 60 * 24))
          : 0
      };

      setProposal(transformedProposal);
    } catch (error) {
      console.error('Error loading proposal:', error);
      setError(`Error loading proposal: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const response = await fetch(`/api/proposals/${proposalId}/review`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setReviews(result.reviews || []);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  const handleSubmitReview = async () => {
    try {
      setSubmittingReview(true);
      setError(null);
      
      const reviewPayload = {
        proposalId: proposal.id,
        decision: reviewForm.decision,
        overallComments: reviewForm.overallComments,
        rejectionReason: reviewForm.rejectionReason,
        revisionRequirements: reviewForm.revisionRequirements,
        sectionReviews: reviewForm.sectionReviews,
        recommendation: reviewForm.recommendation,
        reviewer: user?.name || user?.givenName + ' ' + user?.familyName || 'Research Administrator',
        reviewDate: new Date().toISOString(),
        complianceScore: {
          total: 6,
          compliant: Object.values(reviewForm.sectionReviews).filter(s => s.compliant === true).length,
          nonCompliant: Object.values(reviewForm.sectionReviews).filter(s => s.compliant === false).length
        }
      };

      console.log('Submitting comprehensive review:', reviewPayload);

      // Submit review to database
      const response = await fetch(`/api/proposals/${proposal.id}/review`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reviewPayload)
      });

      const result = await response.json();

      console.log('API Response:', { status: response.status, result });

      if (!response.ok) {
        const errorMessage = result.error || result.details || 'Failed to submit review';
        console.error('API Error:', errorMessage, result);
        throw new Error(errorMessage);
      }

      console.log('Review submitted successfully:', result);

      // Update local state with the new status from server
      const newStatus = result.proposal?.status || reviewForm.decision === 'approved' ? 'APPROVED' : 
                       reviewForm.decision === 'rejected' ? 'REJECTED' : 
                       reviewForm.decision === 'requires_revision' ? 'REVISION_REQUESTED' : 
                       'UNDER_REVIEW';

      setProposal({
        ...proposal,
        status: newStatus,
        reviewHistory: [
          ...proposal.reviewHistory,
          {
            id: result.review?.id || Date.now(),
            reviewer: reviewPayload.reviewer,
            decision: reviewForm.decision,
            overallComments: reviewForm.overallComments,
            rejectionReason: reviewForm.rejectionReason,
            revisionRequirements: reviewForm.revisionRequirements,
            sectionReviews: reviewForm.sectionReviews,
            recommendation: reviewForm.recommendation,
            complianceScore: reviewPayload.complianceScore,
            date: new Date().toISOString()
          }
        ],
        daysInReview: 0
      });

      // Show success message
      setSnackbar({
        open: true,
        message: result.message || 'Review submitted successfully!',
        severity: 'success'
      });

      // Reload reviews to update the Review History tab
      loadReviews();

      setReviewDialog(false);
      setReviewForm({
        decision: '',
        overallComments: '',
        rejectionReason: '',
        revisionRequirements: '',
        sectionReviews: {
          researchObjectives: { compliant: null, comments: '' },
          methodology: { compliant: null, comments: '' },
          ethicsCompliance: { compliant: null, comments: '' },
          budgetJustification: { compliant: null, comments: '' },
          timeline: { compliant: null, comments: '' },
          teamQualifications: { compliant: null, comments: '' }
        },
        recommendation: ''
      });
      
    } catch (error) {
      console.error('Error submitting review:', error);
      setError('Failed to submit review: ' + error.message);
      setSnackbar({
        open: true,
        message: 'Error: ' + error.message,
        severity: 'error'
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
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

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return <ApproveIcon fontSize="small" />;
      case 'submitted': return <ProposalIcon fontSize="small" />;
      case 'under_review': return <ReviewIcon fontSize="small" />;
      case 'rejected': return <RejectIcon fontSize="small" />;
      default: return <ProposalIcon fontSize="small" />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      return 'N/A';
    }
  };

  const getOrdinal = (n) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const renderTabContent = () => {
    if (!proposal) return null;

    switch (activeTab) {
      case 0: // Overview
        return (
          <Box>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 3 }}>
              {/* Basic Information */}
              <Box sx={{ flex: 1 }}>
                <Card sx={{ 
                  height: '100%',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  border: '1px solid #e0e0e0',
                  borderRadius: 2,
                  transition: 'all 0.3s',
                  '&:hover': {
                    boxShadow: '0 4px 16px rgba(139,108,188,0.15)',
                    borderColor: '#8b6cbc'
                  }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', fontWeight: 700, color: '#2c3e50' }}>
                      <ProposalIcon sx={{ mr: 1.5, color: '#8b6cbc', fontSize: 24 }} />
                      Proposal Details
                    </Typography>
                    <Stack spacing={2.5}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Title</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#2c3e50' }}>{proposal.title}</Typography>
                      </Box>
                      <Divider />
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Research Areas</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {proposal.researchAreas.map((area, index) => (
                            <Chip key={index} label={area} size="small" sx={{ bgcolor: '#f3e5f5', color: '#7b1fa2', fontWeight: 600 }} />
                          ))}
                        </Box>
                      </Box>
                      <Divider />
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</Typography>
                        <Typography variant="body2" sx={{ lineHeight: 1.7, color: '#555' }}>{proposal.description}</Typography>
                      </Box>
                      <Divider />
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Duration</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#2c3e50' }}>{proposal.duration}</Typography>
                      </Box>
                      {proposal.startDate && proposal.endDate && (
                        <>
                          <Divider />
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Project Timeline</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#2c3e50' }}>
                              {formatDate(proposal.startDate)} - {formatDate(proposal.endDate)}
                            </Typography>
                          </Box>
                        </>
                      )}
                      <Divider />
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</Typography>
                        <Chip 
                          label={proposal.status ? proposal.status.replace('_', ' ') : 'Unknown'} 
                          color={getStatusColor(proposal.status)}
                          icon={getStatusIcon(proposal.status)}
                        />
                      </Box>
                      {proposal.status === 'UNDER_REVIEW' && (
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">Days in Review</Typography>
                          <Typography variant="body2" sx={{ color: proposal.daysInReview > 30 ? 'error.main' : 'text.primary' }}>
                            {proposal.daysInReview} days
                            {proposal.daysInReview > 30 && ' (Review Overdue)'}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Box>

              {/* Principal Investigator & Team */}
              <Box sx={{ flex: 1 }}>
                <Card sx={{ 
                  height: '100%',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  border: '1px solid #e0e0e0',
                  borderRadius: 2,
                  transition: 'all 0.3s',
                  '&:hover': {
                    boxShadow: '0 4px 16px rgba(139,108,188,0.15)',
                    borderColor: '#8b6cbc'
                  }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', fontWeight: 700, color: '#2c3e50' }}>
                      <PrincipalInvestigatorIcon sx={{ mr: 1.5, color: '#8b6cbc', fontSize: 24 }} />
                      Principal Investigator & Team
                    </Typography>
                    <Stack spacing={2.5}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Principal Investigator</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#2c3e50' }}>{proposal.principalInvestigator}</Typography>
                      </Box>
                      <Divider />
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Department</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#2c3e50' }}>{proposal.department}</Typography>
                      </Box>
                      {proposal.collaborators.length > 0 && (
                        <>
                          <Divider />
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1.5, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Co-Investigators</Typography>
                            <List dense sx={{ bgcolor: '#fafafa', borderRadius: 1, p: 1 }}>
                              {proposal.collaborators.slice(0, 3).map((collaborator, index) => (
                                <ListItem key={index} sx={{ px: 1, py: 0.5 }}>
                                  <ListItemIcon>
                                    <Avatar sx={{ bgcolor: '#8b6cbc', width: 32, height: 32, fontSize: '0.875rem' }}>
                                    {collaborator?.name?.charAt(0) || collaborator?.charAt?.(0) || 'C'}
                                  </Avatar>
                                </ListItemIcon>
                                <ListItemText 
                                  primary={collaborator?.name || collaborator} 
                                  secondary={collaborator?.email}
                                />
                              </ListItem>
                            ))}
                              {proposal.collaborators.length > 3 && (
                                <Typography variant="body2" color="text.secondary" sx={{ ml: 5, fontStyle: 'italic' }}>
                                  +{proposal.collaborators.length - 3} more collaborators
                                </Typography>
                              )}
                            </List>
                          </Box>
                        </>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            </Box>

            {/* Funding Information */}
            <Box>
                <Card sx={{ 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  border: '1px solid #e0e0e0',
                  borderRadius: 2,
                  transition: 'all 0.3s',
                  '&:hover': {
                    boxShadow: '0 4px 16px rgba(139,108,188,0.15)',
                    borderColor: '#8b6cbc'
                  }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', fontWeight: 700, color: '#2c3e50' }}>
                        <BudgetIcon sx={{ mr: 1.5, color: '#8b6cbc', fontSize: 24 }} />
                        Funding Information
                      </Typography>
                    </Box>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={3}>
                        <Box sx={{ textAlign: 'center', py: 3, bgcolor: '#f3e5f5', borderRadius: 2 }}>
                          <Typography variant="h3" sx={{ color: '#8b6cbc', fontWeight: 'bold' }}>
                            {formatCurrency(proposal.totalBudgetAmount)}
                          </Typography>
                          <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mt: 1 }}>
                            Total Budget Requested
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={9}>
                        <Stack spacing={2.5}>
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Funding Source</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#2c3e50' }}>{proposal.fundingSource}</Typography>
                          </Box>
                          <Divider />
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Funding Institution</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#2c3e50' }}>{proposal.fundingInstitution}</Typography>
                          </Box>
                          {proposal.grantNumber !== 'N/A' && (
                            <>
                              <Divider />
                              <Box>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Grant Number</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#2c3e50' }}>{proposal.grantNumber}</Typography>
                              </Box>
                            </>
                          )}
                        </Stack>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
            </Box>
          </Box>
        );
      
      case 1: // Research Details
        return (
          <Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Card sx={{ 
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: '1px solid #e0e0e0',
                borderRadius: 2
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c3e50' }}>Research Objectives</Typography>
                  </Box>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: '#555' }}>
                    {proposal.researchObjectives || 'No research objectives provided.'}
                  </Typography>
                </CardContent>
              </Card>
              
              <Card sx={{ 
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: '1px solid #e0e0e0',
                borderRadius: 2
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c3e50' }}>Methodology</Typography>
                  </Box>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: '#555' }}>
                    {proposal.methodology || 'No methodology provided.'}
                  </Typography>
                </CardContent>
              </Card>
              
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                {proposal.milestones.length > 0 && (
                  <Box sx={{ flex: 1 }}>
                  <Card sx={{ 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    height: '100%'
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', fontWeight: 700, color: '#2c3e50' }}>
                          <TimelineIcon sx={{ mr: 1.5, color: '#8b6cbc', fontSize: 24 }} />
                          Milestones
                        </Typography>
                      </Box>
                      <List sx={{ p: 0 }}>
                        {proposal.milestones.map((milestone, index) => (
                          <ListItem key={index} divider={index < proposal.milestones.length - 1} sx={{ px: 0, py: 2 }}>
                            <ListItemIcon sx={{ minWidth: 40 }}>
                              <Box sx={{ 
                                bgcolor: '#8b6cbc', 
                                color: 'white', 
                                borderRadius: '50%', 
                                width: 32, 
                                height: 32, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                fontSize: '0.875rem',
                                fontWeight: 700
                              }}>
                                {index + 1}
                              </Box>
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography variant="subtitle2" component="span" sx={{ fontWeight: 600, color: '#2c3e50', display: 'block', mb: 0.5 }}>
                                  {milestone.title || `Milestone ${index + 1}`}
                                </Typography>
                              }
                              secondary={
                                <Box component="span" sx={{ display: 'block' }}>
                                  <Typography variant="body2" component="span" color="text.secondary" sx={{ mb: 0.5, lineHeight: 1.6, display: 'block' }}>
                                    {milestone.description || milestone}
                                  </Typography>
                                  {(milestone.dueDate || milestone.targetDate || milestone.date) && (
                                    <Chip 
                                      icon={<TimelineIcon sx={{ fontSize: 14 }} />}
                                      label={`Due: ${formatDate(milestone.dueDate || milestone.targetDate || milestone.date)}`}
                                      size="small"
                                      sx={{ 
                                        mt: 0.5,
                                        bgcolor: '#f3e5f5',
                                        color: '#7b1fa2',
                                        fontWeight: 600,
                                        fontSize: '0.7rem'
                                      }}
                                    />
                                  )}
                                </Box>
                              }
                              primaryTypographyProps={{ component: 'span' }}
                              secondaryTypographyProps={{ component: 'span' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                  </Box>
                )}
                {proposal.deliverables.length > 0 && (
                  <Box sx={{ flex: 1 }}>
                  <Card sx={{ 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    height: '100%'
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', fontWeight: 700, color: '#2c3e50' }}>
                          <AssignmentIcon sx={{ mr: 1.5, color: '#4caf50', fontSize: 24 }} />
                          Deliverables
                        </Typography>
                        {reviews.length > 0 && (
                          <Chip 
                            label="Compliant" 
                            size="small"
                            sx={{ 
                              bgcolor: '#10b981', 
                              color: 'white',
                              fontWeight: 600,
                              '& .MuiChip-icon': { color: 'white' }
                            }}
                            icon={<CheckCircleIcon />}
                          />
                        )}
                      </Box>
                      <List sx={{ p: 0 }}>
                        {proposal.deliverables.map((deliverable, index) => (
                          <ListItem key={index} divider={index < proposal.deliverables.length - 1} sx={{ px: 0, py: 2 }}>
                            <ListItemIcon sx={{ minWidth: 40 }}>
                              <Box sx={{ 
                                bgcolor: '#4caf50', 
                                color: 'white', 
                                borderRadius: '50%', 
                                width: 32, 
                                height: 32, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                fontSize: '0.875rem',
                                fontWeight: 700
                              }}>
                                {index + 1}
                              </Box>
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography variant="subtitle2" component="span" sx={{ fontWeight: 600, color: '#2c3e50', display: 'block', mb: 0.5 }}>
                                  {deliverable.title || `Deliverable ${index + 1}`}
                                </Typography>
                              }
                              secondary={
                                <Box component="span" sx={{ display: 'block' }}>
                                  <Typography variant="body2" component="span" color="text.secondary" sx={{ mb: 0.5, lineHeight: 1.6, display: 'block' }}>
                                    {deliverable.description || deliverable}
                                  </Typography>
                                  {(deliverable.dueDate || deliverable.deliveryDate || deliverable.targetDate || deliverable.date) && (
                                    <Chip 
                                      icon={<TimelineIcon sx={{ fontSize: 14 }} />}
                                      label={`Delivery: ${formatDate(deliverable.dueDate || deliverable.deliveryDate || deliverable.targetDate || deliverable.date)}`}
                                      size="small"
                                      sx={{ 
                                        mt: 0.5,
                                        bgcolor: '#e8f5e9',
                                        color: '#2e7d32',
                                        fontWeight: 600,
                                        fontSize: '0.7rem'
                                      }}
                                    />
                                  )}
                                </Box>
                              }
                              primaryTypographyProps={{ component: 'span' }}
                              secondaryTypographyProps={{ component: 'span' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        );

      case 2: // Ethics & Compliance
        return (
          <Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                        <ReviewIcon sx={{ mr: 1, color: '#8b6cbc' }} />
                        Ethics Approval Status
                      </Typography>
                      {reviews.length > 0 && (
                        <Chip 
                          label={proposal.ethicsApproval === 'Approved' ? 'Compliant' : 'Non-Compliant'}
                          size="small"
                          sx={{ 
                            bgcolor: proposal.ethicsApproval === 'Approved' ? '#10b981' : '#ef4444', 
                            color: 'white',
                            fontWeight: 600,
                            '& .MuiChip-icon': { color: 'white' }
                          }}
                          icon={proposal.ethicsApproval === 'Approved' ? <CheckCircleIcon /> : <ErrorIcon />}
                        />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Chip 
                        label={proposal.ethicsApproval} 
                        size="medium"
                        color={proposal.ethicsApproval === 'Approved' ? 'success' : 'warning'}
                        sx={{ mr: 2 }}
                      />
                      {proposal.ethicsApproval !== 'Approved' && (
                        <Alert severity="warning" sx={{ flex: 1 }}>
                          Ethics approval required before final project approval
                        </Alert>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              
              {proposal.ethicalConsiderations && (
                <Card sx={{ 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  border: '1px solid #e0e0e0',
                  borderRadius: 2
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c3e50' }}>Ethical Considerations</Typography>
                    </Box>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: '#555' }}>
                      {proposal.ethicalConsiderations}
                    </Typography>
                  </CardContent>
                </Card>
              )}
              
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                {proposal.consentProcedures && (
                  <Box sx={{ flex: 1 }}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">Consent Procedures</Typography>
                      </Box>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {proposal.consentProcedures}
                      </Typography>
                    </CardContent>
                  </Card>
                  </Box>
                )}
                {proposal.dataSecurityMeasures && (
                  <Box sx={{ flex: 1 }}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">Data Security Measures</Typography>
                      </Box>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {proposal.dataSecurityMeasures}
                      </Typography>
                    </CardContent>
                  </Card>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        );
      
      case 3: // Supporting Documents
        return (
          <Box>
            {proposal.documents && proposal.documents.length > 0 ? (
              <Card sx={{ 
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: '1px solid #e0e0e0',
                borderRadius: 2
              }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', fontWeight: 700, color: '#2c3e50' }}>
                        <AttachFileIcon sx={{ mr: 1.5, color: '#8b6cbc', fontSize: 24 }} />
                        Supporting Documents
                      </Typography>
                      {reviews.length > 0 && (
                        <Chip 
                          label="Compliant" 
                          size="small"
                          sx={{ 
                            bgcolor: '#10b981', 
                            color: 'white',
                            fontWeight: 600,
                            '& .MuiChip-icon': { color: 'white' }
                          }}
                          icon={<CheckCircleIcon />}
                        />
                      )}
                    </Box>
                    <List sx={{ p: 0 }}>
                      {proposal.documents.map((doc, index) => {
                        const isPdf = doc.fileName?.toLowerCase().endsWith('.pdf') || doc.type === 'application/pdf';
                        const isImage = doc.type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.fileName);
                        
                        return (
                          <ListItem 
                            key={doc.id || index} 
                            divider={index < proposal.documents.length - 1}
                            sx={{ 
                              px: 0, 
                              py: 2,
                              '&:hover': {
                                bgcolor: '#f5f3f7',
                                cursor: 'pointer'
                              }
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 48 }}>
                              <Box sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: isPdf ? '#f44336' : isImage ? '#4caf50' : '#2196f3',
                                color: 'white'
                              }}>
                                {isPdf ? <PdfIcon /> : isImage ? <DocumentIcon /> : <FileIcon />}
                              </Box>
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  <Typography variant="subtitle2" component="span" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                                    {doc.originalName || doc.fileName || doc.name || 'Untitled Document'}
                                  </Typography>
                                  {doc.category && (
                                    <Chip 
                                      label={doc.category}
                                      size="small"
                                      sx={{ 
                                        height: 20,
                                        fontSize: '0.7rem',
                                        bgcolor: doc.category === 'Ethics Documents' ? '#fef3c7' : 
                                                 doc.category === 'Data Management Plan' ? '#dbeafe' : '#f3f4f6',
                                        color: doc.category === 'Ethics Documents' ? '#92400e' : 
                                               doc.category === 'Data Management Plan' ? '#1e40af' : '#374151',
                                        fontWeight: 600
                                      }}
                                    />
                                  )}
                                </Box>
                              }
                              secondary={
                                <Box component="span" sx={{ display: 'block' }}>
                                  <Typography variant="caption" component="span" color="text.secondary" sx={{ display: 'block' }}>
                                    {doc.type || doc.mimeType || 'Unknown type'} • {doc.size ? `${(doc.size / 1024).toFixed(2)} KB` : 'Size unknown'}
                                  </Typography>
                                  {doc.uploadedAt && (
                                    <Typography variant="caption" component="span" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                      Uploaded: {formatDate(doc.uploadedAt)}
                                    </Typography>
                                  )}
                                </Box>
                              }
                              primaryTypographyProps={{ component: 'span' }}
                              secondaryTypographyProps={{ component: 'span' }}
                            />
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<AttachFileIcon />}
                              onClick={() => {
                                if (doc.url || doc.path) {
                                  window.open(doc.url || doc.path, '_blank');
                                }
                              }}
                              sx={{
                                borderColor: '#8b6cbc',
                                color: '#8b6cbc',
                                '&:hover': {
                                  borderColor: '#7b5cac',
                                  bgcolor: '#f3e5f5'
                                }
                              }}
                            >
                              View
                            </Button>
                          </ListItem>
                        );
                      })}
                    </List>
                  </CardContent>
                </Card>
            ) : (
              <Card sx={{ 
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: '1px solid #e0e0e0',
                borderRadius: 2
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', fontWeight: 700, color: '#2c3e50' }}>
                    <AttachFileIcon sx={{ mr: 1.5, color: '#8b6cbc', fontSize: 24 }} />
                    Supporting Documents
                  </Typography>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    No documents have been uploaded for this proposal yet.
                  </Alert>
                </CardContent>
              </Card>
            )}
          </Box>
        );
      
      case 4: // Review History
        return (
          <Box>
            {reviews.length > 0 ? (
              <Stack spacing={2}>
                {reviews.map((review, index) => (
                  <Accordion 
                    key={review.id || index}
                    defaultExpanded={index === 0}
                    sx={{ 
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px !important',
                      '&:before': { display: 'none' },
                      '&.Mui-expanded': {
                        margin: '0 !important',
                        mb: 2
                      }
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon sx={{ color: '#8b6cbc' }} />}
                      sx={{
                        '&:hover': { bgcolor: '#f5f3f7' },
                        borderRadius: '8px',
                        '&.Mui-expanded': {
                          borderBottomLeftRadius: 0,
                          borderBottomRightRadius: 0
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: '#8b6cbc', width: 48, height: 48 }}>
                            {review.reviewerName?.charAt(0) || 'R'}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c3e50' }}>
                              {getOrdinal(reviews.length - index)} Review
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#666', mt: 0.5 }}>
                              {review.reviewerName || 'Anonymous Reviewer'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(review.reviewDate)}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip 
                          label={review.decision?.replace('_', ' ')} 
                          color={
                            review.decision === 'APPROVED' ? 'success' : 
                            review.decision === 'REJECTED' ? 'error' : 
                            'warning'
                          }
                          sx={{ fontWeight: 700 }}
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 3, pt: 2 }}>
                      {/* Compliance Score */}
                      {review.complianceScore && (
                        <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#2c3e50' }}>
                            Compliance Summary
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 3 }}>
                            <Box>
                              <Typography variant="caption" color="text.secondary">Total Sections</Typography>
                              <Typography variant="h6" sx={{ fontWeight: 700 }}>{review.complianceScore.total || 6}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">Compliant</Typography>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: '#4caf50' }}>{review.complianceScore.compliant || 0}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">Non-Compliant</Typography>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: '#f44336' }}>{review.complianceScore.nonCompliant || 0}</Typography>
                            </Box>
                          </Box>
                        </Box>
                      )}

                      {/* Overall Comments */}
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#2c3e50' }}>
                          Overall Comments
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: '#555' }}>
                          {review.overallComments}
                        </Typography>
                      </Box>

                      {/* Rejection Reason */}
                      {review.rejectionReason && (
                        <Box sx={{ mb: 3 }}>
                          <Alert severity="error" sx={{ mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                              Reason for Rejection
                            </Typography>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                              {review.rejectionReason}
                            </Typography>
                          </Alert>
                        </Box>
                      )}

                      {/* Revision Requirements */}
                      {review.revisionRequirements && (
                        <Box sx={{ mb: 3 }}>
                          <Alert severity="warning" sx={{ mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                              Required Revisions
                            </Typography>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                              {review.revisionRequirements}
                            </Typography>
                          </Alert>
                        </Box>
                      )}

                      {/* Section Reviews */}
                      {review.sectionReviews && Object.keys(review.sectionReviews).length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#2c3e50' }}>
                            Section-by-Section Review
                          </Typography>
                          <Stack spacing={2}>
                            {Object.entries(review.sectionReviews).map(([sectionKey, sectionData]) => (
                              <Card key={sectionKey} variant="outlined" sx={{ bgcolor: '#fafafa' }}>
                                <CardContent sx={{ p: 2 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                                      {sectionKey.replace(/([A-Z])/g, ' $1').trim()}
                                    </Typography>
                                    <Chip 
                                      label={sectionData.compliant ? 'Compliant' : sectionData.compliant === false ? 'Non-Compliant' : 'Not Rated'}
                                      size="small"
                                      color={sectionData.compliant ? 'success' : sectionData.compliant === false ? 'error' : 'default'}
                                    />
                                  </Box>
                                  {sectionData.comments && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                      {sectionData.comments}
                                    </Typography>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </Stack>
                        </Box>
                      )}

                      {/* Recommendation */}
                      {review.recommendation && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#2c3e50' }}>
                            Reviewer Recommendation
                          </Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: '#555', fontStyle: 'italic' }}>
                            {review.recommendation}
                          </Typography>
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Stack>
            ) : (
              <Card sx={{ 
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: '1px solid #e0e0e0',
                borderRadius: 2
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', fontWeight: 700, color: '#2c3e50' }}>
                    <HistoryIcon sx={{ mr: 1.5, color: '#8b6cbc', fontSize: 24 }} />
                    Review History
                  </Typography>
                  <Alert severity="info">
                    No review history available for this proposal. This will be the first review.
                  </Alert>
                </CardContent>
              </Card>
            )}
          </Box>
        );
      
      default:
        return null;
    }
  };

  if (!mounted || loading) {
    return (
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Proposal Details"
          description="Review proposal information"
          icon={<ProposalIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Proposal Review', path: '/institution/proposals/review' },
            { label: 'Details' }
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
          title="Proposal Details"
          description="Review proposal information"
          icon={<ProposalIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Proposal Review', path: '/institution/proposals/review' },
            { label: 'Details' }
          ]}
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
        />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
            <Button 
              variant="outlined" 
              onClick={loadProposal} 
              sx={{ ml: 2 }}
            >
              Try Again
            </Button>
          </Alert>
        </Container>
      </Box>
    );
  }

  if (!proposal) {
    return null;
  }

  return (
    <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
      <PageHeader
        title={proposal.title}
        description={`Principal Investigator: ${proposal.principalInvestigator} • ${proposal.department}`}
        icon={<ProposalIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Institution', path: '/institution' },
          { label: 'Proposal Review', path: '/institution/proposals/review' },
          { label: 'Details' }
        ]}
        gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
        actionButton={
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<BackIcon />}
              onClick={() => router.push('/institution/proposals/review')}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                borderColor: 'rgba(255,255,255,0.3)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.3)',
                  borderColor: 'rgba(255,255,255,0.5)',
                },
                backdropFilter: 'blur(10px)'
              }}
            >
              Back to List
            </Button>
            {proposal.status === 'UNDER_REVIEW' && (
              <Button
                variant="contained"
                startIcon={<ReviewIcon />}
                onClick={() => setReviewDialog(true)}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.95)',
                  color: '#8b6cbc',
                  '&:hover': {
                    bgcolor: 'white',
                  },
                  fontWeight: 600
                }}
              >
                Review Proposal
              </Button>
            )}
          </Stack>
        }
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Summary Bar */}
        <Card sx={{ 
          mb: 4, 
          bgcolor: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)', 
          border: '1px solid #e0e0e0',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
        }}>
          <CardContent sx={{ py: 3, px: 4 }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' }, 
              gap: 4,
              alignItems: 'center',
              justifyContent: 'space-around'
            }}>
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.7rem' }}>
                  Budget
                </Typography>
                <Typography variant="h5" sx={{ color: '#8b6cbc', fontWeight: 800, mt: 0.5 }}>
                  {formatCurrency(proposal.totalBudgetAmount)}
                </Typography>
              </Box>
              
              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
              
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.7rem' }}>
                  Status
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip
                    icon={getStatusIcon(proposal.status)}
                    label={proposal.status ? proposal.status.replace('_', ' ') : 'Unknown'}
                    color={getStatusColor(proposal.status)}
                    sx={{ fontWeight: 700, fontSize: '0.875rem', px: 1 }}
                  />
                </Box>
              </Box>
              
              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
              
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.7rem' }}>
                  Duration
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: '#2c3e50' }}>
                  {proposal.duration}
                </Typography>
              </Box>
              
              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
              
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.7rem' }}>
                  Submitted
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: '#2c3e50' }}>
                  {formatDate(proposal.submittedDate)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Card>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ 
              bgcolor: 'white',
              borderBottom: '2px solid #e0e0e0',
              px: 3,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                minHeight: 56,
                color: '#666',
                '&.Mui-selected': {
                  color: '#8b6cbc',
                }
              },
              '& .MuiTabs-indicator': {
                height: 3,
                backgroundColor: '#8b6cbc',
                borderRadius: '3px 3px 0 0'
              }
            }}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<ProposalIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Overview" />
            <Tab icon={<AssignmentIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Research Details" />
            <Tab icon={<ReviewIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Ethics & Compliance" />
            <Tab icon={<AttachFileIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Supporting Documents" />
            <Tab icon={<HistoryIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Review History" />
          </Tabs>
          <Box sx={{ p: 4, bgcolor: '#fafafa', minHeight: '400px' }}>
            {renderTabContent()}
          </Box>
        </Card>
      </Container>

      {/* Comprehensive Review Dialog */}
      <Dialog 
        open={reviewDialog} 
        onClose={() => setReviewDialog(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5cac 100%)',
          color: 'white',
          p: 3
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ReviewIcon sx={{ mr: 1.5, fontSize: 28 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Comprehensive Proposal Review
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                  {proposal?.title}
                </Typography>
              </Box>
            </Box>
            <IconButton 
              onClick={() => setReviewDialog(false)}
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 4, maxHeight: 'calc(90vh - 200px)', overflowY: 'auto' }}>
            <Stack spacing={4}>
              {/* Section-by-Section Compliance Review */}
              <Box>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: '#2c3e50' }}>
                  Section Compliance Review
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Evaluate each section of the proposal for compliance with institutional standards and requirements.
                </Typography>
                
                <Stack spacing={3}>
                  {/* Research Objectives */}
                  <Card sx={{ border: '1px solid #e0e0e0' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                        1. Research Objectives
                      </Typography>
                      <FormControl component="fieldset">
                        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                          <Button
                            variant={reviewForm.sectionReviews.researchObjectives.compliant === true ? 'contained' : 'outlined'}
                            color="success"
                            size="small"
                            onClick={() => setReviewForm({
                              ...reviewForm,
                              sectionReviews: {
                                ...reviewForm.sectionReviews,
                                researchObjectives: { ...reviewForm.sectionReviews.researchObjectives, compliant: true }
                              }
                            })}
                          >
                            Compliant
                          </Button>
                          <Button
                            variant={reviewForm.sectionReviews.researchObjectives.compliant === false ? 'contained' : 'outlined'}
                            color="error"
                            size="small"
                            onClick={() => setReviewForm({
                              ...reviewForm,
                              sectionReviews: {
                                ...reviewForm.sectionReviews,
                                researchObjectives: { ...reviewForm.sectionReviews.researchObjectives, compliant: false }
                              }
                            })}
                          >
                            Non-Compliant
                          </Button>
                        </Stack>
                      </FormControl>
                      <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        maxRows={10}
                        size="small"
                        label="Comments"
                        value={reviewForm.sectionReviews.researchObjectives.comments}
                        onChange={(e) => setReviewForm({
                          ...reviewForm,
                          sectionReviews: {
                            ...reviewForm.sectionReviews,
                            researchObjectives: { ...reviewForm.sectionReviews.researchObjectives, comments: e.target.value }
                          }
                        })}
                        placeholder="Provide specific feedback on research objectives..."
                      />
                    </CardContent>
                  </Card>

                  {/* Methodology */}
                  <Card sx={{ border: '1px solid #e0e0e0' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                        2. Methodology
                      </Typography>
                      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                        <Button
                          variant={reviewForm.sectionReviews.methodology.compliant === true ? 'contained' : 'outlined'}
                          color="success"
                          size="small"
                          onClick={() => setReviewForm({
                            ...reviewForm,
                            sectionReviews: {
                              ...reviewForm.sectionReviews,
                              methodology: { ...reviewForm.sectionReviews.methodology, compliant: true }
                            }
                          })}
                        >
                          Compliant
                        </Button>
                        <Button
                          variant={reviewForm.sectionReviews.methodology.compliant === false ? 'contained' : 'outlined'}
                          color="error"
                          size="small"
                          onClick={() => setReviewForm({
                            ...reviewForm,
                            sectionReviews: {
                              ...reviewForm.sectionReviews,
                              methodology: { ...reviewForm.sectionReviews.methodology, compliant: false }
                            }
                          })}
                        >
                          Non-Compliant
                        </Button>
                      </Stack>
                      <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        maxRows={10}
                        size="small"
                        label="Comments"
                        value={reviewForm.sectionReviews.methodology.comments}
                        onChange={(e) => setReviewForm({
                          ...reviewForm,
                          sectionReviews: {
                            ...reviewForm.sectionReviews,
                            methodology: { ...reviewForm.sectionReviews.methodology, comments: e.target.value }
                          }
                        })}
                        placeholder="Provide specific feedback on methodology..."
                      />
                    </CardContent>
                  </Card>

                  {/* Ethics Compliance */}
                  <Card sx={{ border: '1px solid #e0e0e0' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                        3. Ethics & Compliance
                      </Typography>
                      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                        <Button
                          variant={reviewForm.sectionReviews.ethicsCompliance.compliant === true ? 'contained' : 'outlined'}
                          color="success"
                          size="small"
                          onClick={() => setReviewForm({
                            ...reviewForm,
                            sectionReviews: {
                              ...reviewForm.sectionReviews,
                              ethicsCompliance: { ...reviewForm.sectionReviews.ethicsCompliance, compliant: true }
                            }
                          })}
                        >
                          Compliant
                        </Button>
                        <Button
                          variant={reviewForm.sectionReviews.ethicsCompliance.compliant === false ? 'contained' : 'outlined'}
                          color="error"
                          size="small"
                          onClick={() => setReviewForm({
                            ...reviewForm,
                            sectionReviews: {
                              ...reviewForm.sectionReviews,
                              ethicsCompliance: { ...reviewForm.sectionReviews.ethicsCompliance, compliant: false }
                            }
                          })}
                        >
                          Non-Compliant
                        </Button>
                      </Stack>
                      <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        maxRows={10}
                        size="small"
                        label="Comments"
                        value={reviewForm.sectionReviews.ethicsCompliance.comments}
                        onChange={(e) => setReviewForm({
                          ...reviewForm,
                          sectionReviews: {
                            ...reviewForm.sectionReviews,
                            ethicsCompliance: { ...reviewForm.sectionReviews.ethicsCompliance, comments: e.target.value }
                          }
                        })}
                        placeholder="Provide specific feedback on ethics compliance..."
                      />
                    </CardContent>
                  </Card>

                  {/* Budget Justification */}
                  <Card sx={{ border: '1px solid #e0e0e0' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                        4. Budget Justification
                      </Typography>
                      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                        <Button
                          variant={reviewForm.sectionReviews.budgetJustification.compliant === true ? 'contained' : 'outlined'}
                          color="success"
                          size="small"
                          onClick={() => setReviewForm({
                            ...reviewForm,
                            sectionReviews: {
                              ...reviewForm.sectionReviews,
                              budgetJustification: { ...reviewForm.sectionReviews.budgetJustification, compliant: true }
                            }
                          })}
                        >
                          Compliant
                        </Button>
                        <Button
                          variant={reviewForm.sectionReviews.budgetJustification.compliant === false ? 'contained' : 'outlined'}
                          color="error"
                          size="small"
                          onClick={() => setReviewForm({
                            ...reviewForm,
                            sectionReviews: {
                              ...reviewForm.sectionReviews,
                              budgetJustification: { ...reviewForm.sectionReviews.budgetJustification, compliant: false }
                            }
                          })}
                        >
                          Non-Compliant
                        </Button>
                      </Stack>
                      <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        maxRows={10}
                        size="small"
                        label="Comments"
                        value={reviewForm.sectionReviews.budgetJustification.comments}
                        onChange={(e) => setReviewForm({
                          ...reviewForm,
                          sectionReviews: {
                            ...reviewForm.sectionReviews,
                            budgetJustification: { ...reviewForm.sectionReviews.budgetJustification, comments: e.target.value }
                          }
                        })}
                        placeholder="Provide specific feedback on budget justification..."
                      />
                    </CardContent>
                  </Card>

                  {/* Timeline */}
                  <Card sx={{ border: '1px solid #e0e0e0' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                        5. Timeline & Milestones
                      </Typography>
                      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                        <Button
                          variant={reviewForm.sectionReviews.timeline.compliant === true ? 'contained' : 'outlined'}
                          color="success"
                          size="small"
                          onClick={() => setReviewForm({
                            ...reviewForm,
                            sectionReviews: {
                              ...reviewForm.sectionReviews,
                              timeline: { ...reviewForm.sectionReviews.timeline, compliant: true }
                            }
                          })}
                        >
                          Compliant
                        </Button>
                        <Button
                          variant={reviewForm.sectionReviews.timeline.compliant === false ? 'contained' : 'outlined'}
                          color="error"
                          size="small"
                          onClick={() => setReviewForm({
                            ...reviewForm,
                            sectionReviews: {
                              ...reviewForm.sectionReviews,
                              timeline: { ...reviewForm.sectionReviews.timeline, compliant: false }
                            }
                          })}
                        >
                          Non-Compliant
                        </Button>
                      </Stack>
                      <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        maxRows={10}
                        size="small"
                        label="Comments"
                        value={reviewForm.sectionReviews.timeline.comments}
                        onChange={(e) => setReviewForm({
                          ...reviewForm,
                          sectionReviews: {
                            ...reviewForm.sectionReviews,
                            timeline: { ...reviewForm.sectionReviews.timeline, comments: e.target.value }
                          }
                        })}
                        placeholder="Provide specific feedback on timeline and milestones..."
                      />
                    </CardContent>
                  </Card>

                  {/* Team Qualifications */}
                  <Card sx={{ border: '1px solid #e0e0e0' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                        6. Team Qualifications
                      </Typography>
                      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                        <Button
                          variant={reviewForm.sectionReviews.teamQualifications.compliant === true ? 'contained' : 'outlined'}
                          color="success"
                          size="small"
                          onClick={() => setReviewForm({
                            ...reviewForm,
                            sectionReviews: {
                              ...reviewForm.sectionReviews,
                              teamQualifications: { ...reviewForm.sectionReviews.teamQualifications, compliant: true }
                            }
                          })}
                        >
                          Compliant
                        </Button>
                        <Button
                          variant={reviewForm.sectionReviews.teamQualifications.compliant === false ? 'contained' : 'outlined'}
                          color="error"
                          size="small"
                          onClick={() => setReviewForm({
                            ...reviewForm,
                            sectionReviews: {
                              ...reviewForm.sectionReviews,
                              teamQualifications: { ...reviewForm.sectionReviews.teamQualifications, compliant: false }
                            }
                          })}
                        >
                          Non-Compliant
                        </Button>
                      </Stack>
                      <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        maxRows={10}
                        size="small"
                        label="Comments"
                        value={reviewForm.sectionReviews.teamQualifications.comments}
                        onChange={(e) => setReviewForm({
                          ...reviewForm,
                          sectionReviews: {
                            ...reviewForm.sectionReviews,
                            teamQualifications: { ...reviewForm.sectionReviews.teamQualifications, comments: e.target.value }
                          }
                        })}
                        placeholder="Provide specific feedback on team qualifications..."
                      />
                    </CardContent>
                  </Card>
                </Stack>
              </Box>

              <Divider />

              {/* Overall Decision */}
              <Box>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: '#2c3e50' }}>
                  Overall Decision
                </Typography>
                
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Final Decision *</InputLabel>
                  <Select
                    value={reviewForm.decision}
                    label="Final Decision *"
                    onChange={(e) => setReviewForm({...reviewForm, decision: e.target.value})}
                  >
                    <MenuItem value="approved">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ApproveIcon sx={{ mr: 1, color: '#4caf50' }} />
                        Approved
                      </Box>
                    </MenuItem>
                    <MenuItem value="rejected">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <RejectIcon sx={{ mr: 1, color: '#f44336' }} />
                        Rejected
                      </Box>
                    </MenuItem>
                    <MenuItem value="requires_revision">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EditIcon sx={{ mr: 1, color: '#ff9800' }} />
                        Requires Revision
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Overall Comments *"
                  multiline
                  minRows={4}
                  maxRows={15}
                  fullWidth
                  value={reviewForm.overallComments}
                  onChange={(e) => setReviewForm({...reviewForm, overallComments: e.target.value})}
                  placeholder="Provide comprehensive comments summarizing your review..."
                  sx={{ mb: 3 }}
                  required
                />

                {/* Rejection Reason */}
                {reviewForm.decision === 'rejected' && (
                  <Box>
                    <Alert severity="error" sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Rejection requires detailed justification
                      </Typography>
                    </Alert>
                    <TextField
                      label="Reason for Rejection *"
                      multiline
                      minRows={4}
                      maxRows={15}
                      fullWidth
                      value={reviewForm.rejectionReason}
                      onChange={(e) => setReviewForm({...reviewForm, rejectionReason: e.target.value})}
                      placeholder="Provide detailed reasons for rejecting this proposal. Be specific about which aspects do not meet institutional standards..."
                      required
                      error={reviewForm.decision === 'rejected' && !reviewForm.rejectionReason}
                      helperText="This will be communicated to the principal investigator"
                    />
                  </Box>
                )}

                {/* Revision Requirements */}
                {reviewForm.decision === 'requires_revision' && (
                  <Box>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Specify required revisions clearly
                      </Typography>
                    </Alert>
                    <TextField
                      label="Required Revisions *"
                      multiline
                      minRows={5}
                      maxRows={15}
                      fullWidth
                      value={reviewForm.revisionRequirements}
                      onChange={(e) => setReviewForm({...reviewForm, revisionRequirements: e.target.value})}
                      placeholder="List specific revisions required before resubmission. Be clear and actionable in your requirements..."
                      required
                      error={reviewForm.decision === 'requires_revision' && !reviewForm.revisionRequirements}
                      helperText="Provide a detailed list of changes needed"
                    />
                  </Box>
                )}

                {/* Recommendation */}
                <TextField
                  label="Reviewer Recommendation"
                  multiline
                  minRows={3}
                  maxRows={12}
                  fullWidth
                  value={reviewForm.recommendation}
                  onChange={(e) => setReviewForm({...reviewForm, recommendation: e.target.value})}
                  placeholder="Any additional recommendations or suggestions for the research team..."
                  sx={{ mt: 3 }}
                />
              </Box>

              {/* Review Summary */}
              {reviewForm.decision && (
                <Card sx={{ bgcolor: '#f5f5f5', border: '2px solid #8b6cbc' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, color: '#8b6cbc', fontWeight: 700 }}>
                      Review Summary
                    </Typography>
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Decision:</Typography>
                        <Chip 
                          label={reviewForm.decision.replace('_', ' ').toUpperCase()} 
                          color={
                            reviewForm.decision === 'approved' ? 'success' : 
                            reviewForm.decision === 'rejected' ? 'error' : 
                            'warning'
                          }
                          size="small"
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Sections Reviewed:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>6</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Compliant Sections:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#4caf50' }}>
                          {Object.values(reviewForm.sectionReviews).filter(s => s.compliant === true).length}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Non-Compliant Sections:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#f44336' }}>
                          {Object.values(reviewForm.sectionReviews).filter(s => s.compliant === false).length}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              )}
            </Stack>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, borderTop: '1px solid #e0e0e0', bgcolor: '#fafafa' }}>
          <Button 
            onClick={() => setReviewDialog(false)}
            sx={{ mr: 'auto' }}
          >
            Cancel
          </Button>
          <Button 
            variant="outlined"
            onClick={() => {
              // Reset form
              setReviewForm({
                decision: '',
                overallComments: '',
                rejectionReason: '',
                revisionRequirements: '',
                sectionReviews: {
                  researchObjectives: { compliant: null, comments: '' },
                  methodology: { compliant: null, comments: '' },
                  ethicsCompliance: { compliant: null, comments: '' },
                  budgetJustification: { compliant: null, comments: '' },
                  timeline: { compliant: null, comments: '' },
                  teamQualifications: { compliant: null, comments: '' }
                },
                recommendation: ''
              });
            }}
            sx={{ mr: 1 }}
          >
            Reset Form
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSubmitReview}
            disabled={
              !reviewForm.decision || 
              !reviewForm.overallComments ||
              (reviewForm.decision === 'rejected' && !reviewForm.rejectionReason) ||
              (reviewForm.decision === 'requires_revision' && !reviewForm.revisionRequirements) ||
              submittingReview
            }
            sx={{ 
              bgcolor: '#8b6cbc',
              '&:hover': { bgcolor: '#7b5cac' },
              minWidth: 150
            }}
          >
            {submittingReview ? 'Submitting...' : 'Submit Review'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProposalDetailsPage;
