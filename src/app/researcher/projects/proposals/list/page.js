'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
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
  Menu,
  Divider,
  Paper,
  Stack,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  Assignment as ProposalIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Pending as PendingIcon,
  RateReview as ReviewIcon,
  Clear as ClearIcon,
  Sort as SortIcon,
  PlayArrow as ContinueIcon,
  DeleteOutline as DiscardIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import PageHeader from '../../../../../components/common/PageHeader';

const ProposalsListPage = () => {
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
      params.append('limit', '50');
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

  // Handle menu actions
  const handleMenuClick = (event, proposal) => {
    setMenuAnchor(event.currentTarget);
    setSelectedProposal(proposal);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedProposal(null);
  };

  const handleViewProposal = (proposal) => {
    // Navigate to proposal view
    router.push(`/researcher/projects/proposals/view/${proposal.id}`);
    handleMenuClose();
  };

  const handleEditProposal = (proposal) => {
    // Navigate to proposal edit
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return '#4caf50';
      case 'UNDER_REVIEW': return '#ff9800';
      case 'DRAFT': return '#607d8b';
      default: return '#9e9e9e';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPROVED': return <CheckCircleIcon fontSize="small" />;
      case 'UNDER_REVIEW': return <ReviewIcon fontSize="small" />;
      case 'DRAFT': return <EditIcon fontSize="small" />;
      default: return <PendingIcon fontSize="small" />;
    }
  };

  const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    const end = new Date(endDate).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    return `${start} - ${end}`;
  };

  return (
    <>
       <Box sx={{ width: '100%',mt:8, mb: 0 }}>
        <PageHeader
          title="Research Proposals"
          description="Manage and track your research project proposals"
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
        <Box sx={{ 
          display: 'flex', 
          gap: 3, 
          mb: 5,
          flexWrap: 'wrap',
          '@media (max-width: 768px)': {
            flexDirection: 'column'
          }
        }}>
            <Card sx={{ 
            flex: '1 1 250px',
            minWidth: '250px',
            background: '#8b6cbc', 
              color: 'white',
            height: '100px',
            borderRadius: 4,
            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.15)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
              '&:hover': {
              transform: 'translateY(-8px)',
              boxShadow: '0 20px 40px rgba(102, 126, 234, 0.25)'
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
              opacity: 0,
              transition: 'opacity 0.3s ease'
            },
            '&:hover::before': {
              opacity: 1
            }
          }}>
              <CardContent sx={{ textAlign: 'center', py: 1.5, position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ 
                  position: 'absolute', 
                  top: -20, 
                  right: -20, 
                  opacity: 0.1, 
                  transform: 'rotate(12deg)' 
                }}>
                  <ProposalIcon sx={{ fontSize: 80 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.25, letterSpacing: '-1px', fontSize: '1.5rem' }}>
                  {stats.total}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <ProposalIcon fontSize="small" />
                  <Typography variant="body2" sx={{ fontWeight: 600, letterSpacing: '0.5px', fontSize: '0.8rem' }}>
                    Total Proposals
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ 
            flex: '1 1 250px',
            minWidth: '250px',
            background: 'linear-gradient(135deg, #764ba2 0%, #764ba2 100%)', 
              color: 'white',
            height: '100px',
            borderRadius: 4,
            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.15)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
              '&:hover': {
              transform: 'translateY(-8px)',
              boxShadow: '0 20px 40px rgba(102, 126, 234, 0.25)'
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
              opacity: 0,
              transition: 'opacity 0.3s ease'
            },
            '&:hover::before': {
              opacity: 1
            }
          }}>
              <CardContent sx={{ textAlign: 'center', py: 1.5, position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ 
                  position: 'absolute', 
                  top: -20, 
                  right: -20, 
                  opacity: 0.1, 
                  transform: 'rotate(12deg)' 
                }}>
                  <CheckCircleIcon sx={{ fontSize: 80 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.25, letterSpacing: '-1px', fontSize: '1.5rem' }}>
                  {stats.approved}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <CheckCircleIcon fontSize="small" />
                  <Typography variant="body2" sx={{ fontWeight: 600, letterSpacing: '0.5px', fontSize: '0.8rem' }}>
                    Approved
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ 
            flex: '1 1 250px',
            minWidth: '250px',
            background: 'linear-gradient(135deg, #764ba2 0%, #764ba2 100%)', 
              color: 'white',
            height: '100px',
            borderRadius: 4,
            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.15)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
              '&:hover': {
              transform: 'translateY(-8px)',
              boxShadow: '0 20px 40px rgba(102, 126, 234, 0.25)'
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
              opacity: 0,
              transition: 'opacity 0.3s ease'
            },
            '&:hover::before': {
              opacity: 1
            }
          }}>
              <CardContent sx={{ textAlign: 'center', py: 1.5, position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ 
                  position: 'absolute', 
                  top: -20, 
                  right: -20, 
                  opacity: 0.1, 
                  transform: 'rotate(12deg)' 
                }}>
                  <ReviewIcon sx={{ fontSize: 80 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.25, letterSpacing: '-1px', fontSize: '1.5rem' }}>
                  {stats.underReview}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <ReviewIcon fontSize="small" />
                  <Typography variant="body2" sx={{ fontWeight: 600, letterSpacing: '0.5px', fontSize: '0.8rem' }}>
                    Under Review
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ 
            flex: '1 1 250px',
            minWidth: '250px',
            background: 'linear-gradient(135deg, #764ba2 0%, #764ba2 100%)', 
              color: 'white',
            height: '100px',
            borderRadius: 4,
            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.15)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
              '&:hover': {
              transform: 'translateY(-8px)',
              boxShadow: '0 20px 40px rgba(102, 126, 234, 0.25)'
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
              opacity: 0,
              transition: 'opacity 0.3s ease'
            },
            '&:hover::before': {
              opacity: 1
            }
          }}>
              <CardContent sx={{ textAlign: 'center', py: 1.5, position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ 
                  position: 'absolute', 
                  top: -20, 
                  right: -20, 
                  opacity: 0.1, 
                  transform: 'rotate(12deg)' 
                }}>
                  <EditIcon sx={{ fontSize: 80 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.25, letterSpacing: '-1px', fontSize: '1.5rem' }}>
                  {stats.draft}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <EditIcon fontSize="small" />
                  <Typography variant="body2" sx={{ fontWeight: 600, letterSpacing: '0.5px', fontSize: '0.8rem' }}>
                    Draft
                  </Typography>
                </Box>
              </CardContent>
            </Card>
        </Box>

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
          <Paper sx={{ 
            borderRadius: 4,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.06)',
            overflow: 'hidden'
          }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Title</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Principal Investigator</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Fields</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Date Range</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem', textAlign: 'center' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProposals.map((proposal) => (
                    <TableRow 
                      key={proposal.id}
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: 'rgba(139, 108, 188, 0.04)'
                        },
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      <TableCell 
                        sx={{ 
                          py: 2,
                          cursor: (proposal.status === 'REJECTED' || proposal.status === 'REVISION_REQUESTED') ? 'pointer' : 'default',
                          '&:hover': (proposal.status === 'REJECTED' || proposal.status === 'REVISION_REQUESTED') ? {
                            backgroundColor: 'rgba(139, 108, 188, 0.04)'
                          } : {}
                        }}
                        onClick={() => {
                          if (proposal.status === 'REJECTED' || proposal.status === 'REVISION_REQUESTED') {
                            handleOpenStatusDialog(proposal);
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#2c3e50', mb: 0.5 }}>
                            {proposal.title}
                          </Typography>
                          {(proposal.status === 'REJECTED' || proposal.status === 'REVISION_REQUESTED') && (
                            <Tooltip title="Click to view details">
                              <WarningIcon sx={{ fontSize: 18, color: '#f59e0b' }} />
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ 
                            width: 32, 
                            height: 32, 
                            backgroundColor: '#8b6cbc',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}>
                            {proposal.author.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#2c3e50' }}>
                            {proposal.author}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Chip
                          icon={getStatusIcon(proposal.status)}
                          label={proposal.status.replace('_', ' ')}
                          size="small"
                          sx={{
                            backgroundColor: '#8b6cbc',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            '& .MuiChip-icon': {
                              color: 'white'
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                          {proposal.fields.slice(0, 2).map((field, index) => (
                            <Chip
                              key={index}
                              label={field}
                              size="small"
                              sx={{
                                backgroundColor: 'rgba(139, 108, 188, 0.1)',
                                color: '#8b6cbc',
                                fontWeight: 500,
                                fontSize: '0.7rem',
                                height: 20
                              }}
                            />
                          ))}
                          {proposal.fields.length > 2 && (
                            <Chip
                              label={`+${proposal.fields.length - 2}`}
                              size="small"
                              sx={{
                                backgroundColor: 'rgba(139, 108, 188, 0.05)',
                                color: '#8b6cbc',
                                fontWeight: 500,
                                fontSize: '0.7rem',
                                height: 20
                              }}
                            />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarIcon sx={{ fontSize: 16, color: '#8b6cbc' }} />
                          <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#2c3e50' }}>
                            {formatDateRange(proposal.startDate, proposal.endDate)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="View">
                            <IconButton
                              size="small"
                              onClick={() => handleViewProposal(proposal)}
                              sx={{ 
                                color: '#8b6cbc',
                                '&:hover': { backgroundColor: 'rgba(139, 108, 188, 0.08)' }
                              }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {proposal.status === 'DRAFT' ? (
                            <>
                              <Tooltip title="Continue">
                                <IconButton
                                  size="small"
                                  onClick={() => handleContinueProposal(proposal)}
                                  sx={{ 
                                    color: '#22c55e',
                                    '&:hover': { backgroundColor: 'rgba(34, 197, 94, 0.08)' }
                                  }}
                                >
                                  <ContinueIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Discard">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDiscardProposal(proposal)}
                                  sx={{ 
                                    color: '#ef4444',
                                    '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.08)' }
                                  }}
                                >
                                  <DiscardIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          ) : (
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => handleEditProposal(proposal)}
                                sx={{ 
                                  color: '#8b6cbc',
                                  '&:hover': { backgroundColor: 'rgba(139, 108, 188, 0.08)' }
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="More">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuClick(e, proposal)}
                              sx={{ 
                                color: '#8b6cbc',
                                '&:hover': { backgroundColor: 'rgba(139, 108, 188, 0.08)' }
                              }}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* Context Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              minWidth: 200,
              border: '1px solid rgba(0,0,0,0.04)',
              '& .MuiMenuItem-root': {
                borderRadius: 1,
                mx: 1,
                my: 0.5,
                fontWeight: 500
              }
            }
          }}
        >
          <MenuItem onClick={() => handleViewProposal(selectedProposal)}>
            <ViewIcon fontSize="small" sx={{ mr: 1 }} />
            View Proposal
          </MenuItem>
          {selectedProposal?.status === 'DRAFT' ? [
              <MenuItem key="continue" onClick={() => handleContinueProposal(selectedProposal)}>
                <ContinueIcon fontSize="small" sx={{ mr: 1 }} />
                Continue Editing
              </MenuItem>,
              <Divider key="divider1" />,
              <MenuItem key="discard" onClick={() => handleDiscardProposal(selectedProposal)} sx={{ color: '#f44336' }}>
                <DiscardIcon fontSize="small" sx={{ mr: 1 }} />
                Discard Draft
              </MenuItem>
            ] : [
              <MenuItem key="edit" onClick={() => handleEditProposal(selectedProposal)}>
                <EditIcon fontSize="small" sx={{ mr: 1 }} />
                Edit Proposal
              </MenuItem>,
              <Divider key="divider2" />,
              <MenuItem key="delete" onClick={handleMenuClose} sx={{ color: '#f44336' }}>
                <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                Delete Proposal
              </MenuItem>
            ]}
        </Menu>

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
