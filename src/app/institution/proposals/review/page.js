'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Assignment as AssignmentIcon,
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
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState([]);
  const [filteredProposals, setFilteredProposals] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    decision: '',
    comments: '',
    feedback: '',
    conditions: ''
  });
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
    router.push(`/institution/proposals/review/${proposal.id}`);
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

  const handleDownload = async (proposal) => {
    try {
      // Dynamically import jsPDF
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Set up document styling
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      let yPosition = 20;
      
      // Header
      doc.setFillColor(139, 108, 188);
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text('Research Proposal', margin, 25);
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
      yPosition = 50;
      
      // Title
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Proposal Title:', margin, yPosition);
      yPosition += 7;
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      const titleLines = doc.splitTextToSize(proposal.title || 'N/A', maxWidth);
      doc.text(titleLines, margin, yPosition);
      yPosition += (titleLines.length * 7) + 10;
      
      // Proposal ID
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Proposal ID:', margin, yPosition);
      doc.setFont(undefined, 'normal');
      doc.text(proposal.id || 'N/A', margin + 35, yPosition);
      yPosition += 10;
      
      // Principal Investigator
      doc.setFont(undefined, 'bold');
      doc.text('Principal Investigator:', margin, yPosition);
      doc.setFont(undefined, 'normal');
      doc.text(proposal.principalInvestigator || 'N/A', margin + 55, yPosition);
      yPosition += 10;
      
      // Department
      doc.setFont(undefined, 'bold');
      doc.text('Department:', margin, yPosition);
      doc.setFont(undefined, 'normal');
      doc.text(proposal.department || 'N/A', margin + 35, yPosition);
      yPosition += 10;
      
      // Status
      doc.setFont(undefined, 'bold');
      doc.text('Status:', margin, yPosition);
      doc.setFont(undefined, 'normal');
      doc.text(proposal.status || 'N/A', margin + 25, yPosition);
      yPosition += 10;
      
      // Submitted Date
      doc.setFont(undefined, 'bold');
      doc.text('Submitted Date:', margin, yPosition);
      doc.setFont(undefined, 'normal');
      doc.text(formatDate(proposal.submittedDate) || 'N/A', margin + 45, yPosition);
      yPosition += 10;
      
      // Budget
      doc.setFont(undefined, 'bold');
      doc.text('Budget:', margin, yPosition);
      doc.setFont(undefined, 'normal');
      doc.text(formatCurrency(proposal.budget) || 'N/A', margin + 25, yPosition);
      yPosition += 10;
      
      // Duration
      doc.setFont(undefined, 'bold');
      doc.text('Duration:', margin, yPosition);
      doc.setFont(undefined, 'normal');
      doc.text(proposal.duration || 'N/A', margin + 28, yPosition);
      yPosition += 10;
      
      // Research Area
      doc.setFont(undefined, 'bold');
      doc.text('Research Area:', margin, yPosition);
      doc.setFont(undefined, 'normal');
      doc.text(proposal.researchArea || 'N/A', margin + 42, yPosition);
      yPosition += 15;
      
      // Description
      if (proposal.description) {
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Description:', margin, yPosition);
        yPosition += 7;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const descLines = doc.splitTextToSize(proposal.description, maxWidth);
        doc.text(descLines, margin, yPosition);
        yPosition += (descLines.length * 5);
      }
      
      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      const today = new Date();
      const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
      
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Generated by HOSPITIUMRIS on ${formattedDate} | Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
      
      // Save the PDF
      doc.save(`proposal-${proposal.id}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
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
        {/* Statistics Cards */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 2.5,
          mb: 4
        }}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 100%)',
            color: 'white',
            borderRadius: 2,
            position: 'relative',
            overflow: 'visible'
          }}>
            <CardContent sx={{ p: 2, position: 'relative' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                <Box sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  borderRadius: 1, 
                  p: 0.5, 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ProposalIcon sx={{ fontSize: 16 }} />
                </Box>
                <Chip 
                  label="+0%"
                  size="small"
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.25)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: 20
                  }}
                />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.25, mt: 0.5 }}>
                {proposals.length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.8rem' }}>
                Total Proposals
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ 
            background: 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 100%)',
            color: 'white',
            borderRadius: 2,
            position: 'relative',
            overflow: 'visible'
          }}>
            <CardContent sx={{ p: 2, position: 'relative' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                <Box sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  borderRadius: 1, 
                  p: 0.5, 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ReviewIcon sx={{ fontSize: 16 }} />
                </Box>
                <Chip 
                  label="+0%"
                  size="small"
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.25)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: 20
                  }}
                />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.25, mt: 0.5 }}>
                {proposals.filter(p => p.status === 'UNDER_REVIEW').length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.8rem' }}>
                Under Review
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ 
            background: 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 100%)',
            color: 'white',
            borderRadius: 2,
            position: 'relative',
            overflow: 'visible'
          }}>
            <CardContent sx={{ p: 2, position: 'relative' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                <Box sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  borderRadius: 1, 
                  p: 0.5, 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ApproveIcon sx={{ fontSize: 16 }} />
                </Box>
                <Chip 
                  label="+0%"
                  size="small"
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.25)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: 20
                  }}
                />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.25, mt: 0.5 }}>
                {proposals.filter(p => p.status === 'APPROVED').length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.8rem' }}>
                Approved
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Filters */}
        <Paper sx={{ 
          p: 3, 
          mb: 4,
          borderRadius: 3,
          bgcolor: '#fafafa',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
        }}>
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            flexWrap: 'wrap', 
            alignItems: 'flex-end'
          }}>
            <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block', fontSize: '0.75rem' }}>
                Search
              </Typography>
              <TextField
                placeholder="Search proposals by title, PI, or department..."
                variant="outlined"
                size="small"
                fullWidth
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 8,
                    bgcolor: 'white',
                    '& fieldset': {
                      borderColor: '#e0e0e0'
                    },
                    '&:hover fieldset': {
                      borderColor: '#8b6cbc'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#8b6cbc'
                    }
                  }
                }}
              />
            </Box>
            
            <Box sx={{ minWidth: '180px' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block', fontSize: '0.75rem' }}>
                Status
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  displayEmpty
                  sx={{
                    borderRadius: 8,
                    bgcolor: 'white',
                    '& fieldset': {
                      borderColor: '#e0e0e0'
                    },
                    '&:hover fieldset': {
                      borderColor: '#8b6cbc'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#8b6cbc'
                    }
                  }}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="SUBMITTED">Submitted</MenuItem>
                  <MenuItem value="UNDER_REVIEW">Under Review</MenuItem>
                  <MenuItem value="APPROVED">Approved</MenuItem>
                  <MenuItem value="REJECTED">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ minWidth: '180px' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block', fontSize: '0.75rem' }}>
                Department
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  displayEmpty
                  sx={{
                    borderRadius: 8,
                    bgcolor: 'white',
                    '& fieldset': {
                      borderColor: '#e0e0e0'
                    },
                    '&:hover fieldset': {
                      borderColor: '#8b6cbc'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#8b6cbc'
                    }
                  }}
                >
                  <MenuItem value="all">All Departments</MenuItem>
                  {getUniqueDepartments().map(dept => (
                    <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Button
              variant="text"
              startIcon={<CloseIcon />}
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDepartmentFilter('all');
              }}
              sx={{ 
                color: '#8b6cbc',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: 'rgba(139, 108, 188, 0.08)'
                }
              }}
            >
              Clear All
            </Button>
          </Box>
        </Paper>

        {/* Proposals Table */}
        <Card elevation={2}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ 
              px: 3, 
              py: 2.5, 
              borderBottom: '1px solid #e0e0e0',
              background: 'linear-gradient(to right, #f8f9fa 0%, #ffffff 100%)'
            }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                    Research Proposals
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {filteredProposals.length} {filteredProposals.length === 1 ? 'proposal' : 'proposals'} found
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Chip 
                    icon={<ReviewIcon fontSize="small" />}
                    label={`${filteredProposals.filter(p => p.status === 'UNDER_REVIEW').length} Under Review`}
                    sx={{ 
                      bgcolor: '#fff3e0',
                      color: '#e65100',
                      fontWeight: 600,
                      border: '1px solid #ffb74d'
                    }}
                    size="small"
                  />
                  <Chip 
                    icon={<ApproveIcon fontSize="small" />}
                    label={`${filteredProposals.filter(p => p.status === 'APPROVED').length} Approved`}
                    sx={{ 
                      bgcolor: '#e8f5e9',
                      color: '#2e7d32',
                      fontWeight: 600,
                      border: '1px solid #81c784'
                    }}
                    size="small"
                  />
                </Stack>
              </Stack>
            </Box>

            <TableContainer>
              <Table sx={{ minWidth: 1000 }}>
                <TableHead>
                  <TableRow sx={{ 
                    backgroundColor: '#8b6cbc',
                    '& th': { 
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      borderBottom: 'none',
                      py: 2
                    }
                  }}>
                    <TableCell width="30%">Proposal Title</TableCell>
                    <TableCell width="15%">Principal Investigator</TableCell>
                    <TableCell width="12%">Department</TableCell>
                    <TableCell width="10%" align="right">Budget</TableCell>
                    <TableCell width="10%">Status</TableCell>
                    <TableCell width="10%">Submitted / Review Time</TableCell>
                    <TableCell width="13%" align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProposals.map((proposal, index) => (
                    <TableRow 
                      key={proposal.id} 
                      hover
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: '#f5f3f7',
                          cursor: 'pointer'
                        },
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa',
                        borderLeft: proposal.status === 'UNDER_REVIEW' && proposal.daysInReview > 30 
                          ? '4px solid #f44336' 
                          : proposal.status === 'UNDER_REVIEW'
                          ? '4px solid #ff9800'
                          : 'none'
                      }}
                    >
                      <TableCell>
                        <Box>
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              fontWeight: 600,
                              color: '#2c3e50',
                              mb: 0.5,
                              lineHeight: 1.3
                            }}
                          >
                            {proposal.title}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ 
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: 1.4
                            }}
                          >
                            {proposal.description}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: '#8b6cbc', 
                              width: 36, 
                              height: 36,
                              fontSize: '0.875rem',
                              fontWeight: 600
                            }}
                          >
                            {proposal.principalInvestigator.charAt(0)}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {proposal.principalInvestigator}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={proposal.department} 
                          size="small" 
                          sx={{ 
                            bgcolor: '#f3e5f5',
                            color: '#7b1fa2',
                            fontWeight: 600,
                            fontSize: '0.75rem'
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 700,
                            color: '#2c3e50',
                            fontFamily: 'monospace'
                          }}
                        >
                          {formatCurrency(proposal.budget)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(proposal.status)}
                          label={proposal.status.replace('_', ' ')}
                          color={getStatusColor(proposal.status)}
                          size="small"
                          sx={{ 
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            textTransform: 'capitalize'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {proposal.status === 'UNDER_REVIEW' ? (
                          <Box>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: proposal.daysInReview > 30 ? '#d32f2f' : '#1976d2',
                                fontWeight: 700,
                                fontSize: '0.875rem'
                              }}
                            >
                              {proposal.daysInReview} days
                            </Typography>
                            {proposal.daysInReview > 30 && (
                              <Chip 
                                label="OVERDUE" 
                                size="small" 
                                sx={{ 
                                  bgcolor: '#ffebee',
                                  color: '#c62828',
                                  fontSize: '0.65rem',
                                  height: 18,
                                  fontWeight: 700,
                                  mt: 0.5
                                }}
                              />
                            )}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                            {formatDate(proposal.submittedDate)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="View Details" arrow>
                            <IconButton 
                              size="small" 
                              onClick={() => handleViewDetails(proposal)}
                              sx={{ 
                                color: '#8b6cbc',
                                '&:hover': {
                                  bgcolor: '#f3e5f5',
                                  transform: 'scale(1.1)'
                                },
                                transition: 'all 0.2s'
                              }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
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
