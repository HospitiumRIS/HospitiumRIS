'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Container,
  Typography,
  Button,
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
  Menu,
  Divider,
  Stack,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Alert,
  CircularProgress,
  Tooltip,
  Snackbar,
} from '@mui/material';

import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Groups as GroupsIcon,
  Visibility as VisibilityIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  Pending as PendingIcon,
  Description as DescriptionIcon,
  InfoOutlined as InfoIcon,
} from '@mui/icons-material';

import { alpha } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import PageHeader from '@/components/common/PageHeader';

// Constants
const GRANT_FIELDS = [
  'Healthcare',
  'Medical Research',
  'Public Health',
  'Clinical Trials',
  'Biomedical Engineering',
  'Health Policy',
  'Global Health',
  'Mental Health',
  'Epidemiology',
  'Other'
];

const GRANT_TYPES = [
  'Research Grant',
  'Program Grant',
  'Training Grant',
  'Equipment Grant',
  'Infrastructure Grant',
  'Fellowship',
  'Other'
];

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft', color: '#9e9e9e', icon: PendingIcon },
  { value: 'IN_PROGRESS', label: 'In Progress', color: '#ff9800', icon: AccessTimeIcon },
  { value: 'UNDER_REVIEW', label: 'Under Review', color: '#2196f3', icon: VisibilityIcon },
  { value: 'SUBMITTED', label: 'Submitted', color: '#4caf50', icon: CheckCircleIcon },
  { value: 'AWARDED', label: 'Awarded', color: '#4caf50', icon: CheckCircleIcon },
  { value: 'REJECTED', label: 'Rejected', color: '#f44336', icon: CloseIcon },
];

export default function GrantWritingPortal() {
  const { t } = useTranslation();
  const router = useRouter();
  
  // State management
  const [proposals, setProposals] = useState([]);
  const [stats, setStats] = useState({
    totalProposals: 0,
    draftProposals: 0,
    inProgressProposals: 0,
    underReviewProposals: 0,
    submittedProposals: 0,
    awardedProposals: 0,
    rejectedProposals: 0,
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  
  // Dialog states
  const [newProposalOpen, setNewProposalOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Menu states
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuProposal, setMenuProposal] = useState(null);
  
  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // New proposal form state
  const [newProposal, setNewProposal] = useState({
    title: '',
    type: '',
    fields: [],
    description: '',
    collaborators: [],
  });
  
  // Collaborator search state
  const [collaboratorSearch, setCollaboratorSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const steps = ['Proposal Details', 'Invite Collaborators'];
  
  // Utility functions
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  
  // Fetch proposals from API
  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/proposals', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setProposals(result.proposals || []);
        
        const proposals = result.proposals || [];
        setStats({
          totalProposals: proposals.length,
          draftProposals: proposals.filter(p => p.status === 'DRAFT').length,
          inProgressProposals: proposals.filter(p => p.status === 'IN_PROGRESS').length,
          underReviewProposals: proposals.filter(p => p.status === 'UNDER_REVIEW').length,
          submittedProposals: proposals.filter(p => p.status === 'SUBMITTED').length,
          awardedProposals: proposals.filter(p => p.status === 'AWARDED').length,
          rejectedProposals: proposals.filter(p => p.status === 'REJECTED').length,
        });
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
      showSnackbar('Failed to fetch proposals', 'error');
      setProposals([]);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Load proposals on mount
  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);
  
  // Filter proposals
  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = proposal.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || proposal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  
  // Handlers
  const handleMenuClick = (event, proposal) => {
    setAnchorEl(event.currentTarget);
    setMenuProposal(proposal);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuProposal(null);
  };
  
  const handleNewProposal = () => {
    setNewProposal({
      title: '',
      type: '',
      fields: [],
      description: '',
      collaborators: [],
    });
    setActiveStep(0);
    setFormError(null);
    setNewProposalOpen(true);
  };
  
  const handleNextStep = () => {
    if (activeStep === 0) {
      // Validate proposal details
      if (!newProposal.title || !newProposal.type || newProposal.fields.length === 0) {
        setFormError('Please fill in all required fields: Title, Type, and at least one Field');
        return;
      }
      setFormError(null);
      setActiveStep(1);
    }
  };
  
  const handleBackStep = () => {
    setActiveStep(activeStep - 1);
  };
  
  const handleFinishProposal = async () => {
    try {
      setIsSubmitting(true);
      setFormError(null);
      
      // Create proposal via API
      const proposalData = {
        title: newProposal.title,
        type: newProposal.type,
        researchAreas: newProposal.fields,
        abstract: newProposal.description || null,
        status: 'DRAFT',
      };
      
      const formData = new FormData();
      formData.append('proposalData', JSON.stringify(proposalData));
      
      const response = await fetch('/api/proposals', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create proposal');
      }
      
      const result = await response.json();
      
      if (result.success) {
        showSnackbar('Proposal created successfully!', 'success');
        setNewProposalOpen(false);
        fetchProposals();
      } else {
        throw new Error(result.error || 'Failed to create proposal');
      }
    } catch (error) {
      console.error('Error creating proposal:', error);
      setFormError(error.message || 'Failed to create proposal');
      showSnackbar('Failed to create proposal', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEditProposal = (proposal) => {
    handleMenuClose();
    router.push(`/foundation/grants/writing-portal/edit/${proposal.id}`);
  };
  
  const handleViewProposal = (proposal) => {
    handleMenuClose();
    router.push(`/foundation/grants/writing-portal/edit/${proposal.id}`);
  };
  
  const handleDeleteProposal = async (proposal) => {
    handleMenuClose();
    if (confirm('Are you sure you want to delete this proposal?')) {
      try {
        const response = await fetch(`/api/proposals/${proposal.id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          showSnackbar('Proposal deleted successfully', 'success');
          fetchProposals();
        } else {
          throw new Error('Failed to delete proposal');
        }
      } catch (error) {
        showSnackbar('Failed to delete proposal', 'error');
      }
    }
  };
  
  const getStatusColor = (status) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === status);
    return statusOption ? statusOption.color : '#9e9e9e';
  };
  
  const getStatusLabel = (status) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === status);
    return statusOption ? statusOption.label : status;
  };

  return (
    <>
      {/* Full-width Page Header */}
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Grant Writing Portal"
          description="Collaborative platform for grant proposal development and management"
          icon={<DescriptionIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Foundation', path: '/foundation' },
            { label: 'Grants', path: '/foundation/grants' },
            { label: 'Writing Portal' }
          ]}
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
          actionButton={
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={fetchProposals}
                sx={{
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  '&:hover': {
                    background: 'rgba(255,255,255,0.25)',
                  },
                }}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleNewProposal}
                sx={{
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  '&:hover': {
                    background: 'rgba(255,255,255,0.3)',
                  },
                }}
              >
                New Proposal
              </Button>
            </Stack>
          }
        />
      </Box>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Stats + Filter Panel */}
        <Paper sx={{
          borderRadius: 3, mb: 3, overflow: 'hidden',
          boxShadow: `0 4px 24px ${alpha('#8b6cbc', 0.08)}`,
          border: `1px solid ${alpha('#8b6cbc', 0.1)}`
        }}>
          {/* Compact summary bar */}
          <Box sx={{
            px: 3, py: 1.5,
            background: `linear-gradient(135deg, ${alpha('#8b6cbc', 0.06)} 0%, ${alpha('#8b6cbc', 0.03)} 100%)`,
            borderBottom: '1px solid', borderColor: 'divider',
            display: 'flex', alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5
          }}>
            {[
              { label: 'Total',        value: stats.totalProposals,       color: '#8b6cbc' },
              { label: 'Draft',        value: stats.draftProposals,       color: '#9e9e9e', key: 'DRAFT' },
              { label: 'In Progress',  value: stats.inProgressProposals,  color: '#ff9800', key: 'IN_PROGRESS' },
              { label: 'Under Review', value: stats.underReviewProposals, color: '#2196f3', key: 'UNDER_REVIEW' },
              { label: 'Submitted',    value: stats.submittedProposals,   color: '#4caf50', key: 'SUBMITTED' },
              { label: 'Awarded',      value: stats.awardedProposals,     color: '#059669', key: 'AWARDED' },
              { label: 'Rejected',     value: stats.rejectedProposals,    color: '#f44336', key: 'REJECTED' },
            ].map((item, i) => (
              <React.Fragment key={i}>
                {i > 0 && <Divider orientation="vertical" flexItem sx={{ mx: 2, my: 0.5 }} />}
                <Stack
                  direction="row" spacing={0.75} alignItems="center"
                  onClick={item.key ? () => setStatusFilter(statusFilter === item.key ? 'All Status' : item.key) : undefined}
                  sx={item.key ? {
                    cursor: 'pointer', px: 1, py: 0.3, borderRadius: 1,
                    bgcolor: statusFilter === item.key ? alpha(item.color, 0.1) : 'transparent',
                    outline: statusFilter === item.key ? `1.5px solid ${alpha(item.color, 0.35)}` : 'none',
                    transition: 'all 0.15s',
                    '&:hover': { bgcolor: alpha(item.color, 0.07) }
                  } : { px: 1, py: 0.3 }}
                >
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 500 }}>
                    {item.label}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.8rem', fontWeight: 800, color: item.color }}>
                    {item.value ?? 0}
                  </Typography>
                </Stack>
              </React.Fragment>
            ))}
          </Box>

          {/* Filter row */}
          <Box sx={{ px: 3, py: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search proposals by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1, minWidth: 220 }}
            />
            <FormControl size="small" sx={{ minWidth: 170 }}>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                displayEmpty
              >
                <MenuItem value="All Status">All Statuses</MenuItem>
                {STATUS_OPTIONS.map((s) => (
                  <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {(searchQuery || statusFilter !== 'All Status') && (
              <Button size="small" variant="text"
                onClick={() => { setSearchQuery(''); setStatusFilter('All Status'); }}
                sx={{ color: '#8b6cbc', whiteSpace: 'nowrap', px: 1 }}>
                Clear
              </Button>
            )}
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', px: 3, pb: 1.5, display: 'block' }}>
            Showing <strong>{filteredProposals.length}</strong> of <strong>{proposals.length}</strong> proposals
            {(searchQuery || statusFilter !== 'All Status') && ' · filtered view'}
          </Typography>
        </Paper>

        {/* Proposals Grid */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={60} sx={{ color: '#8b6cbc' }} />
          </Box>
        ) : filteredProposals.length === 0 ? (
          <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 3 }}>
            <DescriptionIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h5" color="text.secondary" gutterBottom>
              No proposals found
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
              {searchQuery || statusFilter !== 'All Status'
                ? 'Try adjusting your search filters'
                : 'Start by creating your first grant proposal'
              }
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNewProposal}
              sx={{
                backgroundColor: '#8b6cbc',
                '&:hover': { backgroundColor: '#7a5ba8' }
              }}
            >
              Create New Proposal
            </Button>
          </Paper>
        ) : (
          <Box sx={{
            display: 'flex',
            gap: 2.5,
            flexWrap: 'wrap',
            '& > *': {
              flex: { xs: '1 1 100%', md: '1 1 calc(50% - 10px)', lg: '1 1 calc(33.333% - 14px)' }
            }
          }}>
            {filteredProposals.map((proposal) => (
              <Card
                key={proposal.id}
                onClick={() => handleEditProposal(proposal)}
                sx={{
                  borderRadius: 2.5,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: `1px solid ${alpha(getStatusColor(proposal.status), 0.18)}`,
                  borderLeft: `4px solid ${getStatusColor(proposal.status)}`,
                  boxShadow: `0 2px 12px ${alpha('#000', 0.06)}`,
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: `0 6px 28px ${alpha(getStatusColor(proposal.status), 0.22)}`,
                    transform: 'translateY(-2px)',
                  }
                }}
              >
                <CardContent sx={{ flex: 1, p: 2.5, pb: '12px !important' }}>
                  {/* Status + type + menu row */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
                    <Chip
                      label={getStatusLabel(proposal.status)}
                      size="small"
                      sx={{
                        height: 20, fontSize: '0.67rem', fontWeight: 700,
                        bgcolor: alpha(getStatusColor(proposal.status), 0.12),
                        color: getStatusColor(proposal.status),
                        '& .MuiChip-label': { px: 0.75 }
                      }}
                    />
                    {proposal.type && (
                      <Chip
                        label={proposal.type}
                        size="small"
                        sx={{
                          height: 20, fontSize: '0.67rem',
                          bgcolor: alpha('#8b6cbc', 0.08), color: '#8b6cbc',
                          '& .MuiChip-label': { px: 0.75 }
                        }}
                      />
                    )}
                    <Box sx={{ flex: 1 }} />
                    <IconButton
                      size="small"
                      onClick={(e) => { e.stopPropagation(); handleMenuClick(e, proposal); }}
                      sx={{ color: 'text.disabled', p: 0.3, '&:hover': { color: '#8b6cbc' } }}
                    >
                      <MoreVertIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>

                  {/* Title */}
                  <Typography variant="subtitle1" sx={{
                    fontWeight: 700, mb: 1, lineHeight: 1.35, color: '#1e293b',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                  }}>
                    {proposal.title}
                  </Typography>

                  {/* Abstract */}
                  <Typography variant="body2" color="text.secondary" sx={{
                    mb: 1.5, fontSize: '0.8rem', lineHeight: 1.55,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    minHeight: '2.5em'
                  }}>
                    {proposal.description || proposal.abstract || 'No description provided.'}
                  </Typography>

                  {/* Research area chips */}
                  {proposal.researchAreas && proposal.researchAreas.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
                      {proposal.researchAreas.slice(0, 3).map((area, i) => (
                        <Chip key={i} label={area} size="small" sx={{
                          height: 18, fontSize: '0.62rem',
                          bgcolor: alpha('#8b6cbc', 0.07), color: '#8b6cbc',
                          '& .MuiChip-label': { px: 0.6 }
                        }} />
                      ))}
                      {proposal.researchAreas.length > 3 && (
                        <Chip label={`+${proposal.researchAreas.length - 3}`} size="small" sx={{
                          height: 18, fontSize: '0.62rem',
                          bgcolor: alpha('#64748b', 0.08), color: '#64748b',
                          '& .MuiChip-label': { px: 0.6 }
                        }} />
                      )}
                    </Box>
                  )}

                  <Divider sx={{ my: 1.25 }} />

                  {/* Author + date footer */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Avatar sx={{ width: 24, height: 24, fontSize: '0.68rem', bgcolor: '#8b6cbc', fontWeight: 700 }}>
                        {proposal.principalInvestigator?.charAt(0) || 'U'}
                      </Avatar>
                      <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.72rem', fontWeight: 500 }}>
                        {proposal.principalInvestigator || 'Unassigned'}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
                      {proposal.updatedAt ? format(new Date(proposal.updatedAt), 'MMM dd, yyyy') : '—'}
                    </Typography>
                  </Box>
                </CardContent>

                {/* Card footer bar */}
                <Box sx={{
                  px: 2.5, py: 1,
                  bgcolor: alpha('#8b6cbc', 0.03),
                  borderTop: `1px solid ${alpha('#8b6cbc', 0.08)}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <GroupsIcon sx={{ fontSize: 12 }} />
                    {proposal.collaborators?.length > 0
                      ? `${proposal.collaborators.length} collaborator${proposal.collaborators.length !== 1 ? 's' : ''}`
                      : 'Solo'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#8b6cbc', fontWeight: 600, fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 0.4 }}>
                    <EditIcon sx={{ fontSize: 11 }} /> Open
                  </Typography>
                </Box>
              </Card>
            ))}
          </Box>
        )}
      </Container>

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleViewProposal(menuProposal)}>
          <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => handleEditProposal(menuProposal)}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => handleMenuClose()}>
          <ShareIcon fontSize="small" sx={{ mr: 1 }} />
          Share
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleDeleteProposal(menuProposal)} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* New Proposal Dialog */}
      <Dialog 
        open={newProposalOpen} 
        onClose={() => setNewProposalOpen(false)}
        maxWidth="md"
        fullWidth
        disableScrollLock
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        {/* ── Hero Header ── */}
        <Box sx={{
          background: 'linear-gradient(135deg, #5c3d9e 0%, #8b6cbc 55%, #a084d1 100%)',
          px: 3.5, pt: 3, pb: 2.5,
          position: 'relative', overflow: 'hidden',
        }}>
          <Box sx={{ position: 'absolute', top: -24, right: -24, width: 110, height: 110, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />
          <Box sx={{ position: 'absolute', bottom: -32, right: 72, width: 80, height: 80, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 48, height: 48,
                bgcolor: 'rgba(255,255,255,0.15)',
                borderRadius: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.22)',
                backdropFilter: 'blur(4px)',
              }}>
                <DescriptionIcon sx={{ fontSize: 26, color: 'white' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', lineHeight: 1.25, mb: 0.25 }}>
                  New Grant Proposal
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.78rem' }}>
                  Set up your workspace — collaborators can join after creation
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={() => setNewProposalOpen(false)}
              sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' } }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* ── Form Body ── */}
        <DialogContent sx={{ p: 0, overflow: 'auto' }}>
          {formError && (
            <Alert severity="error" sx={{ mx: 3.5, mt: 2.5, borderRadius: 2 }}>
              {formError}
            </Alert>
          )}

          <Box sx={{ display: 'flex', minHeight: 0 }}>
            {/* Left: Title + Description */}
            <Box sx={{ flex: '1 1 58%', p: 3.5, pr: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{ width: 3, height: 16, bgcolor: '#8b6cbc', borderRadius: 2, flexShrink: 0 }} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#8b6cbc', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.67rem' }}>
                  Proposal Details
                </Typography>
              </Box>

              <TextField
                fullWidth
                label="Proposal Title *"
                value={newProposal.title}
                onChange={(e) => setNewProposal(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Novel Biomarkers for Early Cancer Detection"
                autoFocus
                sx={{ mb: 2.5 }}
              />

              <TextField
                fullWidth
                multiline
                rows={6}
                label="Abstract / Description"
                value={newProposal.description}
                onChange={(e) => setNewProposal(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Briefly describe the goals, methods, and expected outcomes of this proposal..."
              />
            </Box>

            <Divider orientation="vertical" flexItem />

            {/* Right: Type selector + Research Fields */}
            <Box sx={{ flex: '1 1 42%', p: 3.5, pl: 2.5, bgcolor: alpha('#8b6cbc', 0.018) }}>
              {/* Grant Type */}
              <Box sx={{ mb: 3.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Box sx={{ width: 3, height: 16, bgcolor: '#8b6cbc', borderRadius: 2, flexShrink: 0 }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#8b6cbc', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.67rem' }}>
                    Grant Type *
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  {GRANT_TYPES.map((type) => {
                    const selected = newProposal.type === type;
                    return (
                      <Chip
                        key={type}
                        label={type}
                        onClick={() => setNewProposal(prev => ({ ...prev, type }))}
                        sx={{
                          cursor: 'pointer',
                          fontWeight: selected ? 700 : 400,
                          fontSize: '0.75rem',
                          bgcolor: selected ? '#8b6cbc' : alpha('#8b6cbc', 0.07),
                          color: selected ? 'white' : '#5a4a78',
                          border: `1.5px solid ${selected ? '#8b6cbc' : alpha('#8b6cbc', 0.2)}`,
                          transition: 'all 0.15s',
                          '&:hover': { bgcolor: selected ? '#7a5ba8' : alpha('#8b6cbc', 0.14) },
                          '& .MuiChip-label': { px: 1.25 },
                        }}
                      />
                    );
                  })}
                </Box>
              </Box>

              {/* Research Fields */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Box sx={{ width: 3, height: 16, bgcolor: '#8b6cbc', borderRadius: 2, flexShrink: 0 }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#8b6cbc', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.67rem' }}>
                    Research Fields *
                  </Typography>
                </Box>
                <Autocomplete
                  multiple
                  options={GRANT_FIELDS}
                  value={newProposal.fields}
                  onChange={(event, newValue) => {
                    setNewProposal(prev => ({ ...prev, fields: newValue }));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      placeholder={newProposal.fields.length === 0 ? 'Select research areas...' : ''}
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        key={index}
                        label={option}
                        {...getTagProps({ index })}
                        size="small"
                        sx={{ bgcolor: alpha('#8b6cbc', 0.1), color: '#8b6cbc', fontSize: '0.72rem' }}
                      />
                    ))
                  }
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>

        {/* ── Footer ── */}
        <Box sx={{
          px: 3.5, py: 2,
          bgcolor: alpha('#8b6cbc', 0.03),
          borderTop: '1px solid', borderColor: 'divider',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <InfoIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
              Starts as <strong>Draft</strong> · invite collaborators from the editor
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            <Button
              onClick={() => setNewProposalOpen(false)}
              variant="outlined"
              disabled={isSubmitting}
              sx={{ borderColor: '#8b6cbc', color: '#8b6cbc' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleFinishProposal}
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
              sx={{ backgroundColor: '#8b6cbc', '&:hover': { backgroundColor: '#7a5ba8' }, minWidth: 148 }}
            >
              {isSubmitting ? 'Creating...' : 'Create Proposal'}
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
