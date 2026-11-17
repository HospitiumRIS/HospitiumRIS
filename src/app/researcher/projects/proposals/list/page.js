'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Avatar,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  CalendarToday as CalendarIcon,
  Assignment as ProposalIcon,
  CheckCircle as CheckCircleIcon,
  RateReview as ReviewIcon,
  Clear as ClearIcon,
  PlayArrow as ContinueIcon,
  DeleteOutline as DiscardIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Send as SendIcon,
  EmojiEvents as AwardIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../../../../components/common/PageHeader';
import ProposalStatusCell from '../../../../../components/Proposals/ProposalStatusCell';
import RowActions from '../../../../../components/common/RowActions';
import { PurpleTableHead, TablePaper, paginationSx, zebraRowSx } from '../../../../../components/common/ListPage';

const ProposalsListPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  
  // State management
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [timeFilter, setTimeFilter] = useState('All Time');
  const [sortBy, setSortBy] = useState('Recent');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [revisionResponse, setRevisionResponse] = useState('');
  const [submittingRevision, setSubmittingRevision] = useState(false);

  // Approve & Award Grant dialog state
  const [approveGrantDialogOpen, setApproveGrantDialogOpen] = useState(false);
  const [awardAmount, setAwardAmount] = useState('');
  const [approveNotes, setApproveNotes] = useState('');
  const [submittingApproval, setSubmittingApproval] = useState(false);
  const [approvalSuccess, setApprovalSuccess] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Statistics state
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    underReview: 0,
    draft: 0
  });

  // Fetch proposals from API
  const fetchProposals = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      if (statusFilter && statusFilter !== 'All Statuses') {
        params.append('status', statusFilter);
      }
      params.append('limit', '500');
      params.append('include', 'review');
      params.append('offset', '0');

      const response = await fetch(`/api/proposals?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch proposals');
      }

      const data = await response.json();
      
      if (data.success) {
        setProposals(data.proposals);
        
        // Calculate statistics
        const total = data.proposals.length;
        const approved = data.proposals.filter(p => p.status === 'APPROVED').length;
        const underReview = data.proposals.filter(p => p.status === 'UNDER_REVIEW').length;
        const draft = data.proposals.filter(p => p.status === 'DRAFT').length;
        
        setStats({ total, approved, underReview, draft });
      } else {
        throw new Error(data.error || 'Failed to fetch proposals');
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
      setProposals([]);
      setStats({ total: 0, approved: 0, underReview: 0, draft: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Load proposals on component mount and when filters change
  useEffect(() => {
    fetchProposals();
  }, [searchQuery, statusFilter]);

  // Initial load
  useEffect(() => {
    fetchProposals();
  }, []);

  // Filter proposals
  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         proposal.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         proposal.fields.some(field => field.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'All Statuses' || proposal.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Paginated proposals
  const paginatedProposals = filteredProposals.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle menu actions

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedProposal(null);
  };

  const handleViewProposal = (proposal) => {
    // Navigate to proposal view
    router.push(`/researcher/projects/proposals/view/${proposal.id}`);
    handleMenuClose();
  };

  const isProposalEditable = (proposal) =>
    proposal?.status === 'DRAFT' || proposal?.status === 'REVISION_REQUESTED';

  const handleEditProposal = (proposal) => {
    if (!isProposalEditable(proposal)) return;
    router.push(`/researcher/projects/proposals/edit/${proposal.id}`);
    handleMenuClose();
  };

  const handleContinueProposal = (proposal) => {
    // Navigate to create page with proposal ID to continue editing
    router.push(`/researcher/projects/proposals/create?id=${proposal.id}`);
    handleMenuClose();
  };

  const handleDiscardProposal = async (proposal) => {
    if (window.confirm('Are you sure you want to discard this draft? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/proposals/${proposal.id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          // Refresh the proposals list
          fetchProposals();
          handleMenuClose();
        } else {
          alert('Failed to discard proposal. Please try again.');
        }
      } catch (error) {
        console.error('Error discarding proposal:', error);
        alert('Failed to discard proposal. Please try again.');
      }
    }
  };

  const handleOpenApproveGrantDialog = (proposal) => {
    setAwardAmount(proposal.totalBudgetAmount ? String(proposal.totalBudgetAmount) : '450000');
    setApproveNotes('');
    setApprovalSuccess(false);
    setApproveGrantDialogOpen(true);
    setSelectedProposal(proposal);
  };

  const handleCloseApproveGrantDialog = () => {
    setApproveGrantDialogOpen(false);
    setSelectedProposal(null);
    setAwardAmount('');
    setApproveNotes('');
    setApprovalSuccess(false);
  };

  const handleApproveAndAward = async () => {
    if (!awardAmount || isNaN(parseFloat(awardAmount)) || parseFloat(awardAmount) <= 0) {
      alert('Please enter a valid award amount.');
      return;
    }

    try {
      setSubmittingApproval(true);
      const response = await fetch(`/api/proposals/${selectedProposal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'APPROVED',
          awardedAmount: parseFloat(awardAmount),
          notes: approveNotes || `Proposal approved. Grant awarded: $${parseFloat(awardAmount).toLocaleString()}`
        })
      });

      const result = await response.json();
      if (result.success) {
        setApprovalSuccess(true);
        fetchProposals();
        setTimeout(() => {
          handleCloseApproveGrantDialog();
        }, 1800);
      } else {
        alert(result.error || 'Failed to approve proposal.');
      }
    } catch (error) {
      console.error('Error approving proposal:', error);
      alert('Failed to approve proposal. Please try again.');
    } finally {
      setSubmittingApproval(false);
    }
  };

  const handleOpenStatusDialog = (proposal) => {
    setSelectedProposal(proposal);
    setStatusDialogOpen(true);
    setRevisionResponse('');
  };

  const handleCloseStatusDialog = () => {
    setStatusDialogOpen(false);
    setSelectedProposal(null);
    setRevisionResponse('');
  };

  const handleSubmitRevision = async () => {
    if (!revisionResponse.trim()) {
      alert('Please provide a response to the revision request.');
      return;
    }

    try {
      setSubmittingRevision(true);
      
      // Update proposal with revision response
      const response = await fetch(`/api/proposals/${selectedProposal.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          revisionResponse: revisionResponse,
          status: 'UNDER_REVIEW' // Change status back to under review
        })
      });

      if (response.ok) {
        alert('Revision response submitted successfully!');
        handleCloseStatusDialog();
        fetchProposals(); // Refresh the list
      } else {
        alert('Failed to submit revision response. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting revision:', error);
      alert('Failed to submit revision response. Please try again.');
    } finally {
      setSubmittingRevision(false);
    }
  };



  const formatDateRange = (startDate, endDate) => {
    const fmt = (value) => {
      const d = value ? new Date(value) : null;
      return d && !Number.isNaN(d.getTime())
        ? d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : null;
    };
    const start = fmt(startDate);
    const end = fmt(endDate);
    if (start && end) return `${start} – ${end}`;
    return start || end || 'Dates not set';
  };

  return (
    <>
       <Box sx={{ width: '100%' }}>
        <PageHeader
          title={t('researcher.proposals')}
          description={t('researcher.proposals_desc')}
          icon={<ProposalIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Dashboard', href: '/researcher' },
            { label: 'Projects', href: '/researcher/projects/list' },
            { label: 'Proposals' }
          ]}
          actionButton={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/researcher/projects/proposals/create')}
              sx={{
                bgcolor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 2,
                px: 3,
                py: 1,
                fontWeight: 600,
                letterSpacing: '0.5px',
                textTransform: 'none',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.25)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
                }
              }}
            >
              New Proposal
            </Button>
          }
        />
      </Box>

      <Container maxWidth="xl" sx={{ py: 6, backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 300px)' }}>
        {/* Statistics Cards */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ 
              p: 2, 
              borderRadius: 2,
              bgcolor: '#8b6cbc',
              boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)',
              border: 'none',
              position: 'relative',
              overflow: 'hidden',
              height: '100px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                  Total Proposals
                </Typography>
                <ProposalIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {stats.total}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                All proposal submissions
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ 
              p: 2, 
              borderRadius: 2,
              bgcolor: '#8b6cbc',
              boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)',
              border: 'none',
              position: 'relative',
              overflow: 'hidden',
              height: '100px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                  Approved
                </Typography>
                <CheckCircleIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {stats.approved}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Successfully approved
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ 
              p: 2, 
              borderRadius: 2,
              bgcolor: '#8b6cbc',
              boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)',
              border: 'none',
              position: 'relative',
              overflow: 'hidden',
              height: '100px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                  Under Review
                </Typography>
                <ReviewIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {stats.underReview}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Currently being reviewed
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ 
              p: 2, 
              borderRadius: 2,
              bgcolor: '#8b6cbc',
              boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)',
              border: 'none',
              position: 'relative',
              overflow: 'hidden',
              height: '100px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                  Draft
                </Typography>
                <EditIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {stats.draft}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Work in progress
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Search and Filters */}
        <Paper sx={{ 
          p: 4, 
          mb: 5, 
          borderRadius: 4, 
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
        }}>
          <Box sx={{ 
            display: 'flex', 
            gap: 3, 
            alignItems: 'center',
            flexWrap: 'wrap',
            '@media (max-width: 768px)': {
              flexDirection: 'column',
              alignItems: 'stretch'
            }
          }}>
            <Box sx={{ flex: '2 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                placeholder="Search proposals by title, PI, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setSearchQuery('')} size="small">
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,1)'
                    }
                  }
                }}
              />
            </Box>

            <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{ 
                    borderRadius: 3,
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,1)'
                    }
                  }}
                >
                  <MenuItem value="All Statuses">All Statuses</MenuItem>
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  <MenuItem value="UNDER_REVIEW">Under Review</MenuItem>
                  <MenuItem value="APPROVED">Approved</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
              <FormControl fullWidth>
                <InputLabel>Timeframe</InputLabel>
                <Select
                  value={timeFilter}
                  label="Timeframe"
                  onChange={(e) => setTimeFilter(e.target.value)}
                  sx={{ 
                    borderRadius: 3,
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,1)'
                    }
                  }}
                >
                  <MenuItem value="All Time">All Time</MenuItem>
                  <MenuItem value="This Year">This Year</MenuItem>
                  <MenuItem value="Last 6 Months">Last 6 Months</MenuItem>
                  <MenuItem value="Last 3 Months">Last 3 Months</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                  sx={{ 
                    borderRadius: 3,
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,1)'
                    }
                  }}
                >
                  <MenuItem value="Recent">Recent</MenuItem>
                  <MenuItem value="Title">Title</MenuItem>
                  <MenuItem value="Status">Status</MenuItem>
                  <MenuItem value="Due Date">Due Date</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ flex: '0 0 auto' }}>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('All Statuses');
                  setTimeFilter('All Time');
                  setSortBy('Recent');
                }}
                sx={{ 
                  borderRadius: 3,
                  height: '56px',
                  px: 3,
                  borderColor: '#e0e0e0',
                  color: '#667eea',
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  '&:hover': {
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.08)',
                    color: '#5a67d8',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)'
                  }
                }}
              >
                Clear All
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Proposals Grid */}
        {loading ? (
          <Paper sx={{ 
            p: 8, 
            textAlign: 'center', 
            borderRadius: 4,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.06)'
          }}>
            <ProposalIcon sx={{ fontSize: 64, color: '#ddd', mb: 3 }} />
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#666' }}>
              Loading your proposals...
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Please wait while we fetch your research proposals
            </Typography>
            <Box sx={{ width: 200, mx: 'auto' }}>
              <LinearProgress sx={{ 
                height: 4, 
                borderRadius: 2,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#667eea'
                }
              }} />
            </Box>
          </Paper>
        ) : filteredProposals.length === 0 ? (
          <Paper sx={{ 
            p: 8, 
            textAlign: 'center', 
            borderRadius: 4,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
            border: '1px solid rgba(0,0,0,0.04)'
          }}>
            <Box sx={{ 
              width: 120, 
              height: 120, 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #764ba2 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
              opacity: 0.1
            }}>
              <ProposalIcon sx={{ fontSize: 48, color: 'white' }} />
            </Box>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 700, color: '#2c3e50' }}>
              No proposals found
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto', lineHeight: 1.6 }}>
              {searchQuery || statusFilter !== 'All Statuses' 
                ? 'Try adjusting your search criteria or clear all filters to see more results'
                : 'Create your first research proposal to get started on your research journey'
              }
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => router.push('/researcher/projects/proposals/create')}
              sx={{
                background: 'linear-gradient(135deg, #764ba2 0%, #764ba2 100%)',
                borderRadius: 3,
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 35px rgba(102, 126, 234, 0.4)'
                }
              }}
            >
              Create New Proposal
            </Button>
          </Paper>
        ) : (
          <TablePaper>
            <TableContainer>
              <Table>
                <PurpleTableHead columns={['Title', 'Status', 'Timeline', { label: 'Actions', align: 'center' }]} />
                <TableBody>
                  {paginatedProposals.map((proposal, index) => {
                    const needsAttention = proposal.status === 'REJECTED' || proposal.status === 'REVISION_REQUESTED';
                    const fields = proposal.fields || [];
                    const isDraft = proposal.status === 'DRAFT';
                    const actions = [
                      { key: 'view', label: 'View', icon: <ViewIcon fontSize="small" />, onClick: () => handleViewProposal(proposal) },
                      isDraft
                        ? { key: 'continue', label: 'Continue editing', icon: <ContinueIcon fontSize="small" />, onClick: () => handleContinueProposal(proposal) }
                        : {
                            key: 'edit',
                            label: isProposalEditable(proposal) ? 'Edit' : 'Submitted proposals cannot be edited',
                            icon: <EditIcon fontSize="small" />,
                            onClick: () => handleEditProposal(proposal),
                            disabled: !isProposalEditable(proposal),
                          },
                    ];
                    const menuItems = [];
                    if (needsAttention) {
                      menuItems.push({ key: 'feedback', label: 'View review feedback', icon: <WarningIcon fontSize="small" />, onClick: () => handleOpenStatusDialog(proposal) });
                    }
                    if (!isDraft) {
                      menuItems.push({ key: 'award', label: 'Approve & Award Grant', icon: <AwardIcon fontSize="small" />, onClick: () => handleOpenApproveGrantDialog(proposal) });
                    }
                    if (isDraft) {
                      menuItems.push({ key: 'discard', label: 'Discard draft', icon: <DiscardIcon fontSize="small" />, onClick: () => handleDiscardProposal(proposal), danger: true });
                    }
                    return (
                      <TableRow key={proposal.id} sx={zebraRowSx(index)}>
                        <TableCell sx={{ maxWidth: 460 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <Typography
                              variant="subtitle1"
                              onClick={() => (needsAttention ? handleOpenStatusDialog(proposal) : handleViewProposal(proposal))}
                              sx={{
                                fontWeight: 600, color: '#2D3748', fontSize: '0.95rem', lineHeight: 1.3, mb: 0.75,
                                display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden',
                                cursor: 'pointer', '&:hover': { color: '#8b6cbc', textDecoration: 'underline' },
                              }}
                            >
                              {proposal.title}
                            </Typography>
                            {needsAttention && (
                              <Tooltip title="Reviewers left feedback. Click the title to see it.">
                                <WarningIcon sx={{ fontSize: 18, color: '#f59e0b', mt: 0.25, flexShrink: 0 }} />
                              </Tooltip>
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Avatar sx={{ width: 22, height: 22, backgroundColor: '#8b6cbc', fontSize: '0.62rem', fontWeight: 700 }}>
                              {(proposal.author || '?').split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </Avatar>
                            <Typography variant="caption" sx={{ color: '#374151', fontWeight: 600 }}>
                              {proposal.author}
                            </Typography>
                            {fields.slice(0, 2).map((field) => (
                              <Chip
                                key={field}
                                label={field}
                                size="small"
                                sx={{ backgroundColor: 'rgba(139, 108, 188, 0.1)', color: '#8b6cbc', fontWeight: 500, fontSize: '0.7rem', height: 20, borderRadius: 1 }}
                              />
                            ))}
                            {fields.length > 2 && (
                              <Tooltip title={fields.slice(2).join(', ')}>
                                <Typography variant="caption" sx={{ color: '#8b6cbc', fontWeight: 600 }}>
                                  +{fields.length - 2}
                                </Typography>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <ProposalStatusCell status={proposal.status} review={proposal.review} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
                            {formatDateRange(proposal.startDate, proposal.endDate)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <RowActions actions={actions} menuItems={menuItems} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={filteredProposals.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={paginationSx}
            />
          </TablePaper>
        )}


        {/* Approve & Award Grant Dialog */}
        <Dialog
          open={approveGrantDialogOpen}
          onClose={handleCloseApproveGrantDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
        >
          <DialogTitle sx={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            py: 2.5
          }}>
            <AwardIcon sx={{ fontSize: 28 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Approve & Award Grant</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem' }}>Set proposal status to Approved and record the awarded grant amount</Typography>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <IconButton onClick={handleCloseApproveGrantDialog} sx={{ color: 'white' }} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ p: 3 }}>
            {approvalSuccess ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <CheckCircleIcon sx={{ fontSize: 64, color: '#10b981', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#065f46', mb: 1 }}>Proposal Approved!</Typography>
                <Typography variant="body2" sx={{ color: '#6b7280' }}>
                  Grant of <strong>${parseFloat(awardAmount || 0).toLocaleString()}</strong> has been awarded.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={3} sx={{ mt: 1 }}>
                {selectedProposal && (
                  <Box sx={{ p: 2, bgcolor: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: 2 }}>
                    <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 0.5 }}>Proposal</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#065f46' }}>{selectedProposal.title}</Typography>
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>PI: {selectedProposal.author}</Typography>
                  </Box>
                )}

                <TextField
                  label="Awarded Grant Amount (USD)"
                  value={awardAmount}
                  onChange={(e) => setAwardAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  type="number"
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MoneyIcon sx={{ color: '#10b981' }} />
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&.Mui-focused fieldset': { borderColor: '#10b981' }
                    },
                    '& label.Mui-focused': { color: '#10b981' }
                  }}
                  helperText={awardAmount && !isNaN(parseFloat(awardAmount)) ? `$${parseFloat(awardAmount).toLocaleString()} USD` : 'Enter the awarded grant amount'}
                />

                <TextField
                  label="Approval Notes (Optional)"
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  multiline
                  rows={3}
                  fullWidth
                  placeholder="Add any notes about the grant approval..."
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&.Mui-focused fieldset': { borderColor: '#10b981' }
                    },
                    '& label.Mui-focused': { color: '#10b981' }
                  }}
                />

                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  This will set the proposal status to <strong>Approved</strong> and record the awarded amount. A review record will be created automatically.
                </Alert>
              </Stack>
            )}
          </DialogContent>

          {!approvalSuccess && (
            <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
              <Button
                onClick={handleCloseApproveGrantDialog}
                variant="outlined"
                sx={{ borderRadius: 2, borderColor: '#d1d5db', color: '#6b7280', '&:hover': { borderColor: '#9ca3af' } }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApproveAndAward}
                variant="contained"
                startIcon={submittingApproval ? null : <AwardIcon />}
                disabled={submittingApproval || !awardAmount || isNaN(parseFloat(awardAmount)) || parseFloat(awardAmount) <= 0}
                sx={{
                  borderRadius: 2,
                  bgcolor: '#10b981',
                  fontWeight: 600,
                  px: 3,
                  '&:hover': { bgcolor: '#059669' },
                  '&.Mui-disabled': { bgcolor: '#d1fae5', color: '#a7f3d0' }
                }}
              >
                {submittingApproval ? 'Approving...' : 'Approve & Award Grant'}
              </Button>
            </DialogActions>
          )}
        </Dialog>

        {/* Status Details Dialog */}
        <Dialog
          open={statusDialogOpen}
          onClose={handleCloseStatusDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{
            backgroundColor: selectedProposal?.status === 'REJECTED' ? '#fee2e2' : '#fef3c7',
            color: selectedProposal?.status === 'REJECTED' ? '#991b1b' : '#92400e',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            {selectedProposal?.status === 'REJECTED' ? (
              <>
                <ErrorIcon />
                Proposal Rejected
              </>
            ) : (
              <>
                <WarningIcon />
                Revision Requested
              </>
            )}
            <Box sx={{ flexGrow: 1 }} />
            <IconButton
              onClick={handleCloseStatusDialog}
              sx={{ color: 'inherit' }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 3, mt: 2 }}>
            {selectedProposal && (
              <Stack spacing={3}>
                {/* Proposal Title */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Proposal Title
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {selectedProposal.title}
                  </Typography>
                </Box>

                {/* Status Alert */}
                <Alert 
                  severity={selectedProposal.status === 'REJECTED' ? 'error' : 'warning'}
                  sx={{ borderRadius: 2 }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {selectedProposal.status === 'REJECTED' 
                      ? 'This proposal has been rejected' 
                      : 'This proposal requires revisions before approval'}
                  </Typography>
                  <Typography variant="body2">
                    {selectedProposal.status === 'REJECTED'
                      ? 'Please review the feedback below. You may need to create a new proposal addressing the concerns.'
                      : 'Please review the feedback below and provide your response addressing the requested changes.'}
                  </Typography>
                </Alert>

                {/* General Feedback/Reason */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#2c3e50', display: 'flex', alignItems: 'center', gap: 1 }}>
                    {selectedProposal.status === 'REJECTED' ? (
                      <>
                        <ErrorIcon sx={{ fontSize: 20, color: '#dc2626' }} />
                        Rejection Reason
                      </>
                    ) : (
                      <>
                        <WarningIcon sx={{ fontSize: 20, color: '#f59e0b' }} />
                        General Feedback
                      </>
                    )}
                  </Typography>
                  <Paper sx={{ p: 2.5, backgroundColor: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ lineHeight: 1.8, color: '#374151' }}>
                      {selectedProposal.reviewFeedback || selectedProposal.rejectionReason || 'No specific feedback provided.'}
                    </Typography>
                  </Paper>
                </Box>

                {/* Specific Areas Requiring Action - Only for REVISION_REQUESTED */}
                {selectedProposal.status === 'REVISION_REQUESTED' && selectedProposal.amendmentRequirements && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#2c3e50', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleIcon sx={{ fontSize: 20, color: '#f59e0b' }} />
                      Areas Requiring Action
                    </Typography>
                    <Paper sx={{ p: 2.5, backgroundColor: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ lineHeight: 1.8, color: '#92400e', whiteSpace: 'pre-line' }}>
                        {selectedProposal.amendmentRequirements}
                      </Typography>
                    </Paper>
                  </Box>
                )}

                {/* Missing Files - Only for REVISION_REQUESTED */}
                {selectedProposal.status === 'REVISION_REQUESTED' && selectedProposal.missingFiles && selectedProposal.missingFiles.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#2c3e50', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ErrorIcon sx={{ fontSize: 20, color: '#dc2626' }} />
                      Missing Required Files
                    </Typography>
                    <Paper sx={{ p: 2.5, backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 2 }}>
                      <Stack spacing={1}>
                        {selectedProposal.missingFiles.map((file, index) => (
                          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ 
                              width: 6, 
                              height: 6, 
                              borderRadius: '50%', 
                              backgroundColor: '#dc2626' 
                            }} />
                            <Typography variant="body2" sx={{ color: '#991b1b', fontWeight: 500 }}>
                              {file}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Paper>
                  </Box>
                )}

                {/* Reviewer Comments - Additional detailed comments */}
                {selectedProposal.reviewerComments && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#2c3e50', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon sx={{ fontSize: 20, color: '#8b6cbc' }} />
                      Reviewer Comments
                    </Typography>
                    <Paper sx={{ p: 2.5, backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ lineHeight: 1.8, color: '#374151', whiteSpace: 'pre-line' }}>
                        {selectedProposal.reviewerComments}
                      </Typography>
                    </Paper>
                  </Box>
                )}

                {/* Review Date and Reviewer Information */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, pt: 1 }}>
                  {selectedProposal.reviewedBy && (
                    <Chip
                      icon={<PersonIcon />}
                      label={`Reviewed by: ${selectedProposal.reviewedBy}`}
                      size="small"
                      sx={{ bgcolor: 'rgba(139, 108, 188, 0.1)', color: '#8b6cbc' }}
                    />
                  )}
                  {selectedProposal.reviewedAt && (
                    <Chip
                      icon={<CalendarIcon />}
                      label={`Date: ${new Date(selectedProposal.reviewedAt).toLocaleDateString()}`}
                      size="small"
                      sx={{ bgcolor: 'rgba(107, 114, 128, 0.1)', color: '#6b7280' }}
                    />
                  )}
                </Box>

                {/* Revision Response Section - Only for REVISION_REQUESTED */}
                {selectedProposal.status === 'REVISION_REQUESTED' && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#2c3e50' }}>
                      Your Response
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      placeholder="Describe how you will address the revision requirements..."
                      value={revisionResponse}
                      onChange={(e) => setRevisionResponse(e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      After submitting your response, you can edit the proposal to make the necessary changes.
                    </Typography>
                  </Box>
                )}
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button
              onClick={handleCloseStatusDialog}
              variant="outlined"
              sx={{ borderRadius: 2 }}
            >
              Close
            </Button>
            {selectedProposal?.status === 'REVISION_REQUESTED' && (
              <>
                <Button
                  onClick={() => {
                    handleCloseStatusDialog();
                    handleEditProposal(selectedProposal);
                  }}
                  variant="outlined"
                  startIcon={<EditIcon />}
                  sx={{ 
                    borderRadius: 2,
                    borderColor: '#8b6cbc',
                    color: '#8b6cbc',
                    '&:hover': {
                      borderColor: '#7b5cac',
                      backgroundColor: 'rgba(139, 108, 188, 0.08)'
                    }
                  }}
                >
                  Edit Proposal
                </Button>
                <Button
                  onClick={handleSubmitRevision}
                  variant="contained"
                  startIcon={<SendIcon />}
                  disabled={submittingRevision || !revisionResponse.trim()}
                  sx={{
                    borderRadius: 2,
                    backgroundColor: '#8b6cbc',
                    '&:hover': {
                      backgroundColor: '#7b5cac'
                    }
                  }}
                >
                  {submittingRevision ? 'Submitting...' : 'Submit Response'}
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default ProposalsListPage;
