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
  Tooltip
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
  DeleteOutline as DiscardIcon
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
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(3, 1fr)'
            },
            gap: 3,
            alignItems: 'stretch'
          }}>
            {filteredProposals.map((proposal) => (
              <Card key={proposal.id} sx={{
                borderRadius: 3,
                boxShadow: '0 2px 8px rgba(139, 108, 188, 0.08)',
                border: '1px solid rgba(139, 108, 188, 0.12)',
                background: 'linear-gradient(135deg, #ffffff 0%, #fafbfd 100%)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                  boxShadow: '0 12px 32px rgba(139, 108, 188, 0.15)',
                  borderColor: 'rgba(139, 108, 188, 0.25)'
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                  background: 'linear-gradient(135deg, #8b6cbc 0%, #9575d1 100%)'
                  }
                }}>
                <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {/* Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
                      <Chip
                        icon={getStatusIcon(proposal.status)}
                        label={proposal.status.replace('_', ' ')}
                        size="small"
                        sx={{
                        backgroundColor: '#8b6cbc',
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                        height: 24,
                        borderRadius: 2,
                          '& .MuiChip-icon': {
                            color: 'white'
                          }
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, proposal)}
                      sx={{
                        color: '#8b6cbc',
                        '&:hover': {
                          backgroundColor: 'rgba(139, 108, 188, 0.08)',
                          transform: 'scale(1.1)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    {/* Title */}
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600, 
                    mb: 2.5, 
                    lineHeight: 1.3,
                    color: '#2D3748',
                    fontSize: '1.1rem',
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 2,
                    overflow: 'hidden',
                    minHeight: '2.6rem'
                    }}>
                      {proposal.title}
                    </Typography>

                    {/* Author */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                      <Avatar sx={{ 
                      width: 28, 
                      height: 28, 
                      backgroundColor: '#8b6cbc',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        {proposal.author.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" sx={{ 
                        color: '#2D3748', 
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                          {proposal.author}
                        </Typography>
                      <Typography variant="caption" sx={{ 
                        color: '#8b6cbc',
                        fontSize: '0.7rem',
                        fontWeight: 500
                      }}>
                          Principal Investigator
                        </Typography>
                      </Box>
                    </Box>

                    {/* Fields */}
                  <Box sx={{ mb: 2.5, flex: '0 0 auto' }}>
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
                            height: 20,
                            borderRadius: 1,
                            '& .MuiChip-label': {
                              px: 1
                              }
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
                            height: 20,
                            borderRadius: 1
                          }}
                        />
                      )}
                    </Stack>
                    </Box>

                  {/* Date Range - Compact */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                    gap: 1, 
                    mb: 2.5,
                    p: 1.5,
                      borderRadius: 2,
                    backgroundColor: 'rgba(139, 108, 188, 0.04)',
                    border: '1px solid rgba(139, 108, 188, 0.08)'
                  }}>
                    <CalendarIcon sx={{ fontSize: 16, color: '#8b6cbc' }} />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="caption" sx={{ 
                        fontWeight: 600, 
                        color: '#2D3748',
                        fontSize: '0.75rem',
                        display: 'block',
                        lineHeight: 1.2
                      }}>
                          {formatDateRange(proposal.startDate, proposal.endDate)}
                        </Typography>
                      {proposal.status === 'APPROVED' && proposal.daysOverdue > 0 && (
                        <Typography variant="caption" sx={{ 
                          color: '#e74c3c', 
                          fontWeight: 600,
                          fontSize: '0.7rem'
                        }}>
                            {proposal.daysOverdue} days overdue
                          </Typography>
                      )}
                      </Box>
                    </Box>

                  {/* Spacer to push actions to bottom */}
                  <Box sx={{ flex: 1 }} />

                    {/* Actions */}
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1.5, 
                    pt: 2, 
                    borderTop: '1px solid rgba(139, 108, 188, 0.08)',
                    mt: 'auto'
                  }}>
                      <Button
                        variant="outlined"
                      size="small"
                        startIcon={<ViewIcon fontSize="small" />}
                        onClick={() => handleViewProposal(proposal)}
                        sx={{ 
                          flex: 1,
                        borderColor: '#8b6cbc',
                        color: '#8b6cbc',
                        fontWeight: 500,
                          textTransform: 'none',
                        fontSize: '0.8rem',
                        py: 1,
                        borderRadius: 2,
                          '&:hover': {
                          borderColor: '#8b6cbc',
                          backgroundColor: 'rgba(139, 108, 188, 0.08)',
                          transform: 'translateY(-1px)'
                        },
                        transition: 'all 0.2s ease'
                        }}
                      >
                        View
                      </Button>
                      {proposal.status === 'DRAFT' ? (
                        <>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<ContinueIcon fontSize="small" />}
                            onClick={() => handleContinueProposal(proposal)}
                            sx={{ 
                              flex: 1,
                              backgroundColor: '#22c55e',
                              fontWeight: 600,
                              textTransform: 'none',
                              fontSize: '0.8rem',
                              py: 1,
                              borderRadius: 2,
                              boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
                              '&:hover': {
                                backgroundColor: '#16a34a',
                                boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)',
                                transform: 'translateY(-1px)'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            Continue
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<DiscardIcon fontSize="small" />}
                            onClick={() => handleDiscardProposal(proposal)}
                            sx={{ 
                              flex: 1,
                              borderColor: '#ef4444',
                              color: '#ef4444',
                              fontWeight: 500,
                              textTransform: 'none',
                              fontSize: '0.8rem',
                              py: 1,
                              borderRadius: 2,
                              '&:hover': {
                                borderColor: '#dc2626',
                                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                                transform: 'translateY(-1px)'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            Discard
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<EditIcon fontSize="small" />}
                          onClick={() => handleEditProposal(proposal)}
                          sx={{ 
                            flex: 1,
                            backgroundColor: '#8b6cbc',
                            fontWeight: 600,
                            textTransform: 'none',
                            fontSize: '0.8rem',
                            py: 1,
                            borderRadius: 2,
                            boxShadow: '0 2px 8px rgba(139, 108, 188, 0.3)',
                            '&:hover': {
                              backgroundColor: '#7b5ca7',
                              boxShadow: '0 4px 12px rgba(139, 108, 188, 0.4)',
                              transform: 'translateY(-1px)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          Edit
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
            ))}
          </Box>
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
      </Container>
    </>
  );
};

export default ProposalsListPage;
