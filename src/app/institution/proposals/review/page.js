'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Badge,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Grid,
  Tabs,
  Tab
} from '@mui/material';
import {
  RateReview as ReviewIcon,
  Visibility as ViewIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Edit as EditIcon,
  AttachMoney as BudgetIcon,
  Schedule as TimelineIcon,
  Person as PrincipalInvestigatorIcon,
  School as DepartmentIcon,
  Assignment as ProposalIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  Comment as CommentIcon,
  History as HistoryIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import PageHeader from '../../../../components/common/PageHeader';
import { useAuth } from '../../../../components/AuthProvider';

const ProposalReviewPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState([]);
  const [filteredProposals, setFilteredProposals] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    decision: '',
    comments: '',
    feedback: '',
    conditions: ''
  });
  const [activeTab, setActiveTab] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    loadProposals();
  }, []);

  useEffect(() => {
    filterProposals();
  }, [proposals, searchTerm, statusFilter, departmentFilter]);

  const loadProposals = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all proposals but prioritize under review ones
      const response = await fetch('/api/proposals?limit=100', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch proposals: ${response.status}`);
      }

      const result = await response.json();
      const data = result.proposals || result;
      
      if (Array.isArray(data)) {
        // Transform proposals for display
        const transformedProposals = data.map(proposal => ({
          id: proposal.id,
          title: proposal.title,
          principalInvestigator: proposal.principalInvestigator || 'Unknown',
          department: proposal.departments?.[0] || 'Unknown',
          status: proposal.status,
          budget: proposal.totalBudgetAmount || 0,
          submittedDate: proposal.createdAt,
          description: proposal.description || proposal.abstract || proposal.researchObjectives || 'No description available',
          researchArea: proposal.researchAreas?.[0] || 'General Research',
          duration: proposal.endDate && proposal.startDate 
            ? `${Math.ceil((new Date(proposal.endDate) - new Date(proposal.startDate)) / (1000 * 60 * 60 * 24 * 30))} months`
            : 'Not specified',
          startDate: proposal.startDate,
          endDate: proposal.endDate,
          collaborators: proposal.coInvestigators || [],
          ethicsApproval: proposal.ethicsApprovalStatus || 'Pending',
          fundingSource: proposal.fundingSource || 'Internal',
          fundingInstitution: proposal.fundingInstitution || 'N/A',
          grantNumber: proposal.grantNumber || 'N/A',
          researchObjectives: proposal.researchObjectives || '',
          methodology: proposal.methodology || '',
          milestones: proposal.milestones || [],
          deliverables: proposal.deliverables || [],
          ethicalConsiderations: proposal.ethicalConsiderationsOverview || '',
          dataSecurityMeasures: proposal.dataSecurityMeasures || '',
          consentProcedures: proposal.consentProcedures || '',
          reviewHistory: proposal.reviewHistory || [],
          documents: proposal.documents || [],
          // Add additional fields for comprehensive review
          researchAreas: proposal.researchAreas || [],
          totalBudgetAmount: proposal.totalBudgetAmount || 0,
          priority: proposal.status === 'UNDER_REVIEW' ? 'high' : 'normal',
          daysInReview: proposal.status === 'UNDER_REVIEW' && proposal.updatedAt 
            ? Math.ceil((new Date() - new Date(proposal.updatedAt)) / (1000 * 60 * 60 * 24))
            : 0
        }));

        // Sort proposals - Under Review first, then by submission date
        const sortedProposals = transformedProposals.sort((a, b) => {
          if (a.status === 'UNDER_REVIEW' && b.status !== 'UNDER_REVIEW') return -1;
          if (b.status === 'UNDER_REVIEW' && a.status !== 'UNDER_REVIEW') return 1;
          return new Date(b.submittedDate) - new Date(a.submittedDate);
        });

        setProposals(sortedProposals);
      } else {
        console.error('Invalid data format received:', data);
        setError('Invalid data format received from server');
      }
    } catch (error) {
      console.error('Error loading proposals:', error);
      setError(`Error loading proposals: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filterProposals = () => {
    let filtered = proposals;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(proposal =>
        proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposal.principalInvestigator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposal.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(proposal => proposal.status === statusFilter);
    }

    // Filter by department
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(proposal => proposal.department === departmentFilter);
    }

    setFilteredProposals(filtered);
  };

  const handleViewDetails = (proposal) => {
    setSelectedProposal(proposal);
    setDetailsDialog(true);
  };

  const handleReviewProposal = (proposal) => {
    setSelectedProposal(proposal);
    setReviewForm({
      decision: '',
      comments: '',
      feedback: '',
      conditions: ''
    });
    setReviewDialog(true);
  };

  const handleSubmitReview = async () => {
    try {
      setSubmittingReview(true);
      
      // Submit the review to the API
      const reviewPayload = {
        proposalId: selectedProposal.id,
        decision: reviewForm.decision,
        comments: reviewForm.comments,
        feedback: reviewForm.feedback,
        conditions: reviewForm.conditions,
        reviewer: user?.name || user?.givenName + ' ' + user?.familyName || 'Research Administrator',
        reviewDate: new Date().toISOString()
      };

      console.log('Submitting review:', reviewPayload);

      // For now, simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update the proposal status locally
      const newStatus = reviewForm.decision === 'approved' ? 'APPROVED' : 
                       reviewForm.decision === 'rejected' ? 'REJECTED' : 
                       reviewForm.decision === 'revision_required' ? 'REVISION_REQUIRED' : 
                       'UNDER_REVIEW';

      const updatedProposals = proposals.map(proposal => 
        proposal.id === selectedProposal.id
          ? { 
              ...proposal, 
              status: newStatus,
              reviewHistory: [
                ...proposal.reviewHistory,
                {
                  id: Date.now(),
                  reviewer: reviewPayload.reviewer,
                  decision: reviewForm.decision,
                  comments: reviewForm.comments,
                  feedback: reviewForm.feedback,
                  conditions: reviewForm.conditions,
                  date: new Date().toISOString()
                }
              ],
              daysInReview: 0 // Reset for newly reviewed proposals
            }
          : proposal
      );

      setProposals(updatedProposals);
      setReviewDialog(false);
      setSelectedProposal(null);
      setReviewForm({
        decision: '',
        comments: '',
        feedback: '',
        conditions: ''
      });
      
      // Show success message
      console.log('Review submitted successfully');
      
      // In a real implementation, you might want to show a success toast
      // and possibly send an email notification to the PI
      
    } catch (error) {
      console.error('Error submitting review:', error);
      setError('Failed to submit review: ' + error.message);
    } finally {
      setSubmittingReview(false);
    }
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
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const getUniqueDepartments = () => {
    const departments = [...new Set(proposals.map(p => p.department))];
    return departments.filter(dept => dept && dept !== 'Unknown');
  };

  const renderTabContent = () => {
    if (!selectedProposal) return null;

    switch (activeTab) {
      case 0: // Overview
        return (
          <Box>
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12} md={6}>
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <ProposalIcon sx={{ mr: 1, color: '#8b6cbc' }} />
                      Proposal Details
                    </Typography>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Title</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedProposal.title}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Research Areas</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {selectedProposal.researchAreas.map((area, index) => (
                            <Chip key={index} label={area} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                        <Typography variant="body2">{selectedProposal.description}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Duration</Typography>
                        <Typography variant="body1">{selectedProposal.duration}</Typography>
                      </Box>
                      {selectedProposal.startDate && selectedProposal.endDate && (
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">Project Timeline</Typography>
                          <Typography variant="body2">
                            {formatDate(selectedProposal.startDate)} - {formatDate(selectedProposal.endDate)}
                          </Typography>
                        </Box>
                      )}
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                        <Chip 
                          label={selectedProposal.status.replace('_', ' ')} 
                          color={getStatusColor(selectedProposal.status)}
                          icon={getStatusIcon(selectedProposal.status)}
                        />
                      </Box>
                      {selectedProposal.status === 'UNDER_REVIEW' && (
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">Days in Review</Typography>
                          <Typography variant="body2" sx={{ color: selectedProposal.daysInReview > 30 ? 'error.main' : 'text.primary' }}>
                            {selectedProposal.daysInReview} days
                            {selectedProposal.daysInReview > 30 && ' (Review Overdue)'}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Principal Investigator & Team */}
              <Grid item xs={12} md={6}>
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <PrincipalInvestigatorIcon sx={{ mr: 1, color: '#8b6cbc' }} />
                      Principal Investigator & Team
                    </Typography>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Principal Investigator</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedProposal.principalInvestigator}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Department</Typography>
                        <Typography variant="body1">{selectedProposal.department}</Typography>
                      </Box>
                      {selectedProposal.collaborators.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">Co-Investigators</Typography>
                          <List dense>
                            {selectedProposal.collaborators.slice(0, 3).map((collaborator, index) => (
                              <ListItem key={index} sx={{ px: 0 }}>
                                <ListItemIcon>
                                  <Avatar sx={{ bgcolor: '#8b6cbc', width: 24, height: 24, fontSize: '0.75rem' }}>
                                    {collaborator?.name?.charAt(0) || collaborator?.charAt?.(0) || 'C'}
                                  </Avatar>
                                </ListItemIcon>
                                <ListItemText 
                                  primary={collaborator?.name || collaborator} 
                                  secondary={collaborator?.email}
                                />
                              </ListItem>
                            ))}
                            {selectedProposal.collaborators.length > 3 && (
                              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                                +{selectedProposal.collaborators.length - 3} more
                              </Typography>
                            )}
                          </List>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Funding Information */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <BudgetIcon sx={{ mr: 1, color: '#8b6cbc' }} />
                      Funding Information
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={3}>
                        <Box sx={{ textAlign: 'center', py: 2 }}>
                          <Typography variant="h4" sx={{ color: '#8b6cbc', fontWeight: 'bold' }}>
                            {formatCurrency(selectedProposal.totalBudgetAmount)}
                          </Typography>
                          <Typography variant="subtitle2" color="text.secondary">
                            Total Budget Requested
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={9}>
                        <Stack spacing={2}>
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">Funding Source</Typography>
                            <Typography variant="body1">{selectedProposal.fundingSource}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">Funding Institution</Typography>
                            <Typography variant="body1">{selectedProposal.fundingInstitution}</Typography>
                          </Box>
                          {selectedProposal.grantNumber !== 'N/A' && (
                            <Box>
                              <Typography variant="subtitle2" color="text.secondary">Grant Number</Typography>
                              <Typography variant="body1">{selectedProposal.grantNumber}</Typography>
                            </Box>
                          )}
                        </Stack>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );
      
      case 1: // Research Details
        return (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>Research Objectives</Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                      {selectedProposal.researchObjectives || 'No research objectives provided.'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>Methodology</Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                      {selectedProposal.methodology || 'No methodology provided.'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              {selectedProposal.milestones.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>Milestones</Typography>
                      <List>
                        {selectedProposal.milestones.map((milestone, index) => (
                          <ListItem key={index} divider>
                            <ListItemIcon>
                              <Typography variant="body2" sx={{ 
                                bgcolor: '#8b6cbc', 
                                color: 'white', 
                                borderRadius: '50%', 
                                width: 24, 
                                height: 24, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                fontSize: '0.75rem'
                              }}>
                                {index + 1}
                              </Typography>
                            </ListItemIcon>
                            <ListItemText
                              primary={milestone.title || `Milestone ${index + 1}`}
                              secondary={milestone.description || milestone}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              {selectedProposal.deliverables.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>Deliverables</Typography>
                      <List>
                        {selectedProposal.deliverables.map((deliverable, index) => (
                          <ListItem key={index} divider>
                            <ListItemIcon>
                              <Typography variant="body2" sx={{ 
                                bgcolor: '#4caf50', 
                                color: 'white', 
                                borderRadius: '50%', 
                                width: 24, 
                                height: 24, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                fontSize: '0.75rem'
                              }}>
                                {index + 1}
                              </Typography>
                            </ListItemIcon>
                            <ListItemText
                              primary={deliverable.title || `Deliverable ${index + 1}`}
                              secondary={deliverable.description || deliverable}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Box>
        );

      case 2: // Ethics & Compliance
        return (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <ReviewIcon sx={{ mr: 1, color: '#8b6cbc' }} />
                      Ethics Approval Status
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Chip 
                        label={selectedProposal.ethicsApproval} 
                        size="medium"
                        color={selectedProposal.ethicsApproval === 'Approved' ? 'success' : 'warning'}
                        sx={{ mr: 2 }}
                      />
                      {selectedProposal.ethicsApproval !== 'Approved' && (
                        <Alert severity="warning" sx={{ flex: 1 }}>
                          Ethics approval required before final project approval
                        </Alert>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              {selectedProposal.ethicalConsiderations && (
                <Grid item xs={12}>
                  <Card sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>Ethical Considerations</Typography>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {selectedProposal.ethicalConsiderations}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              {selectedProposal.consentProcedures && (
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>Consent Procedures</Typography>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {selectedProposal.consentProcedures}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              {selectedProposal.dataSecurityMeasures && (
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>Data Security Measures</Typography>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {selectedProposal.dataSecurityMeasures}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Box>
        );
      
      case 3: // Review History
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <HistoryIcon sx={{ mr: 1, color: '#8b6cbc' }} />
                Review History
              </Typography>
              {selectedProposal.reviewHistory.length > 0 ? (
                <List>
                  {selectedProposal.reviewHistory.map((review, index) => (
                    <ListItem key={review.id || index} divider>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: '#8b6cbc', width: 32, height: 32 }}>
                          {review.reviewer.charAt(0)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="subtitle2">{review.reviewer}</Typography>
                            <Chip 
                              label={review.decision} 
                              size="small" 
                              color={getStatusColor(review.decision)}
                            />
                          </Stack>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {review.comments}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(review.date)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  No review history available for this proposal. This will be the first review.
                </Alert>
              )}
            </CardContent>
          </Card>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Proposal Review"
          description="Review and approve institutional research proposals"
          icon={<ReviewIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Administration', path: '/institution' },
            { label: 'Proposal Review' }
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
          title="Proposal Review"
          description="Review and approve institutional research proposals"
          icon={<ReviewIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Administration', path: '/institution' },
            { label: 'Proposal Review' }
          ]}
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
        />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
            <Button 
              variant="outlined" 
              onClick={loadProposals} 
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
    <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
      <PageHeader
        title="Proposal Review"
        description="Review and approve institutional research proposals"
        icon={<ReviewIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Institution', path: '/institution' },
          { label: 'Administration', path: '/institution' },
          { label: 'Proposal Review' }
        ]}
        gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
        actionButton={
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={loadProposals}
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.3)',
              },
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            Refresh
          </Button>
        }
      />
      
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Overview Cards */}
        <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
          <Card sx={{ 
            flex: '1 1 calc(25% - 18px)', 
            minWidth: '200px',
            background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5cac 100%)',
            color: 'white',
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: '0 8px 25px rgba(139, 108, 188, 0.3)'
            }
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <ProposalIcon sx={{ fontSize: 28, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {proposals.length}
              </Typography>
              <Typography variant="subtitle2">
                Total Proposals
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ 
            flex: '1 1 calc(25% - 18px)', 
            minWidth: '200px',
            background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5cac 100%)',
            color: 'white',
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: '0 8px 25px rgba(139, 108, 188, 0.3)'
            }
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <ReviewIcon sx={{ fontSize: 28, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {proposals.filter(p => p.status === 'UNDER_REVIEW').length}
              </Typography>
              <Typography variant="subtitle2">
                Under Review
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ 
            flex: '1 1 calc(25% - 18px)', 
            minWidth: '200px',
            background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5cac 100%)',
            color: 'white',
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: '0 8px 25px rgba(139, 108, 188, 0.3)'
            }
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <ApproveIcon sx={{ fontSize: 28, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {proposals.filter(p => p.status === 'APPROVED').length}
              </Typography>
              <Typography variant="subtitle2">
                Approved
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ 
            flex: '1 1 calc(25% - 18px)', 
            minWidth: '200px',
            background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5cac 100%)',
            color: 'white',
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: '0 8px 25px rgba(139, 108, 188, 0.3)'
            }
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <BudgetIcon sx={{ fontSize: 28, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {formatCurrency(proposals.reduce((sum, p) => sum + p.budget, 0))}
              </Typography>
              <Typography variant="subtitle2">
                Total Requested
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                placeholder="Search proposals..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                }}
                sx={{ flex: '1 1 300px', minWidth: '250px' }}
              />
              
              <FormControl size="small" sx={{ minWidth: '150px' }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="SUBMITTED">Submitted</MenuItem>
                  <MenuItem value="UNDER_REVIEW">Under Review</MenuItem>
                  <MenuItem value="APPROVED">Approved</MenuItem>
                  <MenuItem value="REJECTED">Rejected</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: '150px' }}>
                <InputLabel>Department</InputLabel>
                <Select
                  value={departmentFilter}
                  label="Department"
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  <MenuItem value="all">All Departments</MenuItem>
                  {getUniqueDepartments().map(dept => (
                    <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </CardContent>
        </Card>

        {/* Quick Actions Panel for Under Review Proposals */}
        {filteredProposals.filter(p => p.status === 'UNDER_REVIEW').length > 0 && (
          <Card sx={{ mb: 3, border: '2px solid #8b6cbc' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', color: '#8b6cbc' }}>
                <ReviewIcon sx={{ mr: 1 }} />
                Priority Reviews Needed
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {filteredProposals
                  .filter(p => p.status === 'UNDER_REVIEW')
                  .sort((a, b) => b.daysInReview - a.daysInReview)
                  .slice(0, 3)
                  .map((proposal) => (
                    <Card key={proposal.id} sx={{ flex: '1 1 300px', minWidth: '280px', border: proposal.daysInReview > 30 ? '1px solid #f44336' : '1px solid #e0e0e0' }}>
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }} noWrap>
                          {proposal.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          PI: {proposal.principalInvestigator}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" sx={{ color: proposal.daysInReview > 30 ? 'error.main' : 'text.primary' }}>
                            {proposal.daysInReview} days in review
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatCurrency(proposal.totalBudgetAmount)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleViewDetails(proposal)}
                            sx={{ flex: 1, borderColor: '#8b6cbc', color: '#8b6cbc' }}
                          >
                            View
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleReviewProposal(proposal)}
                            sx={{ flex: 1, bgcolor: '#8b6cbc', '&:hover': { bgcolor: '#7b5cac' } }}
                          >
                            Review
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
              </Box>
              {filteredProposals.filter(p => p.status === 'UNDER_REVIEW').length > 3 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                  +{filteredProposals.filter(p => p.status === 'UNDER_REVIEW').length - 3} more proposals awaiting review
                </Typography>
              )}
            </CardContent>
          </Card>
        )}

        {/* Proposals Table */}
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                All Research Proposals
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip 
                  label={`${filteredProposals.filter(p => p.status === 'UNDER_REVIEW').length} Under Review`}
                  color="warning"
                  size="small"
                />
                <Badge badgeContent={filteredProposals.filter(p => p.status === 'UNDER_REVIEW').length} color="error">
                  <ReviewIcon sx={{ color: '#8b6cbc' }} />
                </Badge>
              </Stack>
            </Stack>

            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Proposal</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Principal Investigator</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Budget</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Review Time</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProposals.map((proposal) => (
                    <TableRow key={proposal.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {proposal.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {proposal.description}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ bgcolor: '#8b6cbc', width: 32, height: 32, mr: 1 }}>
                            {proposal.principalInvestigator.charAt(0)}
                          </Avatar>
                          <Typography variant="body2">
                            {proposal.principalInvestigator}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={proposal.department} 
                          size="small" 
                          variant="outlined"
                          sx={{ borderColor: '#8b6cbc', color: '#8b6cbc' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(proposal.budget)}
                        </Typography>
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
                        {proposal.status === 'UNDER_REVIEW' ? (
                          <Box>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: proposal.daysInReview > 30 ? 'error.main' : 'text.primary',
                                fontWeight: proposal.daysInReview > 30 ? 600 : 400
                              }}
                            >
                              {proposal.daysInReview} days
                            </Typography>
                            {proposal.daysInReview > 30 && (
                              <Chip 
                                label="Overdue" 
                                size="small" 
                                color="error" 
                                sx={{ fontSize: '0.6rem', height: 16 }}
                              />
                            )}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(proposal.submittedDate)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small" 
                              onClick={() => handleViewDetails(proposal)}
                              sx={{ color: '#8b6cbc' }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {proposal.status === 'UNDER_REVIEW' && (
                            <Tooltip title="Review Proposal">
                              <IconButton 
                                size="small" 
                                onClick={() => handleReviewProposal(proposal)}
                                sx={{ color: '#4caf50' }}
                              >
                                <ReviewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {filteredProposals.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No proposals found matching your criteria.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Proposal Details Dialog */}
        <Dialog 
          open={detailsDialog} 
          onClose={() => setDetailsDialog(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: { height: '90vh' }
          }}
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5cac 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ProposalIcon sx={{ mr: 1 }} />
              Proposal Details
            </Box>
            <IconButton 
              onClick={() => setDetailsDialog(false)}
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Overview" />
              <Tab label="Research Details" />
              <Tab label="Ethics & Compliance" />
              <Tab label="Review History" />
            </Tabs>
            <Box sx={{ p: 3 }}>
              {renderTabContent()}
            </Box>
          </DialogContent>
        </Dialog>

        {/* Review Dialog */}
        <Dialog 
          open={reviewDialog} 
          onClose={() => setReviewDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5cac 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center'
          }}>
            <ReviewIcon sx={{ mr: 1 }} />
            Review Proposal: {selectedProposal?.title}
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Stack spacing={3}>
              <FormControl fullWidth>
                <InputLabel>Decision</InputLabel>
                <Select
                  value={reviewForm.decision}
                  label="Decision"
                  onChange={(e) => setReviewForm({...reviewForm, decision: e.target.value})}
                >
                  <MenuItem value="approved">Approve</MenuItem>
                  <MenuItem value="rejected">Reject</MenuItem>
                  <MenuItem value="revision_required">Revision Required</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Review Comments"
                multiline
                rows={4}
                fullWidth
                value={reviewForm.comments}
                onChange={(e) => setReviewForm({...reviewForm, comments: e.target.value})}
                placeholder="Provide detailed comments about your decision..."
              />

              <TextField
                label="Feedback for Researcher"
                multiline
                rows={3}
                fullWidth
                value={reviewForm.feedback}
                onChange={(e) => setReviewForm({...reviewForm, feedback: e.target.value})}
                placeholder="Constructive feedback that will be shared with the researcher..."
                helperText="This feedback will be sent to the principal investigator"
              />

              {reviewForm.decision === 'approved' && (
                <TextField
                  label="Approval Conditions (if any)"
                  multiline
                  rows={2}
                  fullWidth
                  value={reviewForm.conditions}
                  onChange={(e) => setReviewForm({...reviewForm, conditions: e.target.value})}
                  placeholder="Any conditions or requirements for approval..."
                  helperText="Specific conditions that must be met for this approval"
                />
              )}

              {reviewForm.decision === 'revision_required' && (
                <TextField
                  label="Required Revisions"
                  multiline
                  rows={3}
                  fullWidth
                  value={reviewForm.conditions}
                  onChange={(e) => setReviewForm({...reviewForm, conditions: e.target.value})}
                  placeholder="Specify what revisions are needed before resubmission..."
                  helperText="Detailed list of required changes"
                  required
                />
              )}

              {reviewForm.decision === 'rejected' && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    This proposal will be marked as rejected. Please provide detailed feedback explaining the reasons for rejection.
                  </Typography>
                </Alert>
              )}

              {reviewForm.decision && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Review Summary
                  </Typography>
                  <Typography variant="body2">
                    <strong>Decision:</strong> {reviewForm.decision.replace('_', ' ').toUpperCase()}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Proposal:</strong> {selectedProposal?.title}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Principal Investigator:</strong> {selectedProposal?.principalInvestigator}
                  </Typography>
                </Box>
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setReviewDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSubmitReview}
              disabled={!reviewForm.decision || !reviewForm.comments || submittingReview}
              sx={{ 
                bgcolor: '#8b6cbc',
                '&:hover': { bgcolor: '#7b5cac' }
              }}
            >
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default ProposalReviewPage;
