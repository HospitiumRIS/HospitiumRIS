'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Badge,
  Tooltip,
  CardActions,
  Stepper,
  Step,
  StepLabel,
  Snackbar,
  LinearProgress,
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
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  Close as CloseIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  Pending as PendingIcon,
  Description as DescriptionIcon,
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
  const router = useRouter();
  
  // State management
  const [proposals, setProposals] = useState([]);
  const [stats, setStats] = useState({
    totalProposals: 0,
    draftProposals: 0,
    inProgressProposals: 0,
    submittedProposals: 0,
    totalCollaborators: 0,
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
        
        // Calculate stats
        const proposals = result.proposals || [];
        const totalProposals = proposals.length;
        const draftProposals = proposals.filter(p => p.status === 'DRAFT').length;
        const inProgressProposals = proposals.filter(p => p.status === 'IN_PROGRESS').length;
        const submittedProposals = proposals.filter(p => p.status === 'SUBMITTED').length;
        
        setStats({
          totalProposals,
          draftProposals,
          inProgressProposals,
          submittedProposals,
          totalCollaborators: 0,
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
        {/* Statistics Cards */}
        <Box sx={{ 
          display: 'flex', 
          gap: 3, 
          mb: 4,
          flexWrap: 'wrap',
          '& > *': { 
            flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', lg: '1 1 calc(25% - 18px)' } 
          }
        }}>
          <Card sx={{ 
            borderRadius: 3, 
            background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5cac 100%)',
            color: 'white',
            boxShadow: '0 3px 12px rgba(139, 108, 188, 0.15)',
            transition: 'all 0.3s ease'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="h3" fontWeight="bold" color="white">
                {stats.totalProposals}
              </Typography>
              <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Total Proposals
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ 
            borderRadius: 3, 
            background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5cac 100%)',
            color: 'white',
            boxShadow: '0 3px 12px rgba(139, 108, 188, 0.15)',
            transition: 'all 0.3s ease'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="h3" fontWeight="bold" color="white">
                {stats.draftProposals}
              </Typography>
              <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Drafts
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ 
            borderRadius: 3, 
            background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5cac 100%)',
            color: 'white',
            boxShadow: '0 3px 12px rgba(139, 108, 188, 0.15)',
            transition: 'all 0.3s ease'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="h3" fontWeight="bold" color="white">
                {stats.inProgressProposals}
              </Typography>
              <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                In Progress
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ 
            borderRadius: 3, 
            background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5cac 100%)',
            color: 'white',
            boxShadow: '0 3px 12px rgba(139, 108, 188, 0.15)',
            transition: 'all 0.3s ease'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="h3" fontWeight="bold" color="white">
                {stats.submittedProposals}
              </Typography>
              <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Submitted
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Search and Filters */}
        <Paper sx={{ borderRadius: 3, p: 3, mb: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <TextField
              fullWidth
              placeholder="Search proposals by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1 }}
            />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Filter by Status"
              >
                <MenuItem value="All Status">All Status</MenuItem>
                {STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
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
            gap: 3, 
            flexWrap: 'wrap',
            '& > *': { 
              flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)', lg: '1 1 calc(33.333% - 16px)' } 
            }
          }}>
            {filteredProposals.map((proposal) => (
              <Card key={proposal.id} sx={{ 
                borderRadius: 3, 
                boxShadow: 2,
                border: `2px solid ${alpha('#8b6cbc', 0.1)}`,
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease'
                }
              }}>
                <CardContent sx={{ flex: 1, p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {proposal.title}
                      </Typography>
                      <Chip 
                        label={getStatusLabel(proposal.status)} 
                        size="small"
                        sx={{
                          backgroundColor: alpha(getStatusColor(proposal.status), 0.1),
                          color: getStatusColor(proposal.status),
                          fontWeight: 600
                        }}
                      />
                    </Box>
                    <IconButton 
                      size="small" 
                      onClick={(e) => handleMenuClick(e, proposal)}
                      sx={{ color: '#8b6cbc' }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Stack>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 60 }}>
                    {proposal.description || proposal.abstract || 'No description available'}
                  </Typography>

                  {proposal.researchAreas && proposal.researchAreas.length > 0 && (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5} sx={{ mb: 2 }}>
                      {proposal.researchAreas.slice(0, 3).map((area, index) => (
                        <Chip
                          key={index}
                          label={area}
                          size="small"
                          sx={{
                            backgroundColor: alpha('#8b6cbc', 0.08),
                            color: '#8b6cbc',
                            fontSize: '0.75rem'
                          }}
                        />
                      ))}
                      {proposal.researchAreas.length > 3 && (
                        <Chip
                          label={`+${proposal.researchAreas.length - 3}`}
                          size="small"
                          sx={{
                            backgroundColor: alpha('#8b6cbc', 0.08),
                            color: '#8b6cbc',
                            fontSize: '0.75rem'
                          }}
                        />
                      )}
                    </Stack>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      {proposal.updatedAt ? format(new Date(proposal.updatedAt), 'MMM dd, yyyy') : 'Recently updated'}
                    </Typography>
                    <Stack direction="row" spacing={-0.5}>
                      <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: '#8b6cbc' }}>
                        {proposal.principalInvestigator?.charAt(0) || 'U'}
                      </Avatar>
                    </Stack>
                  </Stack>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => handleEditProposal(proposal)}
                    sx={{
                      backgroundColor: '#8b6cbc',
                      '&:hover': { backgroundColor: '#7a5ba8' }
                    }}
                  >
                    Edit Proposal
                  </Button>
                </CardActions>
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
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 100%)',
          color: 'white',
          py: 3
        }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={2}>
              <AddIcon sx={{ fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Create New Grant Proposal
              </Typography>
            </Stack>
            <IconButton onClick={() => setNewProposalOpen(false)} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <Box sx={{ px: 3, pt: 3 }}>
          <Stepper activeStep={activeStep}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
        
        <DialogContent sx={{ p: 4 }}>
          {formError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {formError}
            </Alert>
          )}

          {activeStep === 0 && (
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Proposal Title *"
                value={newProposal.title}
                onChange={(e) => setNewProposal(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter a descriptive title for your grant proposal"
              />
              
              <FormControl fullWidth>
                <InputLabel>Grant Type *</InputLabel>
                <Select
                  value={newProposal.type}
                  onChange={(e) => setNewProposal(prev => ({ ...prev, type: e.target.value }))}
                  label="Grant Type *"
                >
                  {GRANT_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>

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
                    label="Research Fields *"
                    placeholder="Select research fields"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option}
                      {...getTagProps({ index })}
                      sx={{
                        backgroundColor: alpha('#8b6cbc', 0.1),
                        color: '#8b6cbc'
                      }}
                    />
                  ))
                }
              />

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                value={newProposal.description}
                onChange={(e) => setNewProposal(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Provide a brief overview of your grant proposal"
              />
            </Stack>
          )}

          {activeStep === 1 && (
            <Stack spacing={3}>
              <Alert severity="info">
                You can invite collaborators now or add them later from the proposal editor.
              </Alert>
              
              <Typography variant="body2" color="text.secondary">
                Collaborator invitation features will be available in the proposal editor after creation.
              </Typography>
            </Stack>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={() => setNewProposalOpen(false)}
            variant="outlined"
            disabled={isSubmitting}
            sx={{ borderColor: '#8b6cbc', color: '#8b6cbc' }}
          >
            Cancel
          </Button>
          
          {activeStep > 0 && (
            <Button
              onClick={handleBackStep}
              disabled={isSubmitting}
              startIcon={<ArrowBackIcon />}
              sx={{ color: '#8b6cbc' }}
            >
              Back
            </Button>
          )}
          
          {activeStep < steps.length - 1 ? (
            <Button 
              variant="contained" 
              onClick={handleNextStep}
              disabled={isSubmitting}
              endIcon={<ArrowForwardIcon />}
              sx={{ 
                backgroundColor: '#8b6cbc',
                '&:hover': { backgroundColor: '#7a5ba8' }
              }}
            >
              Next
            </Button>
          ) : (
            <Button 
              variant="contained" 
              onClick={handleFinishProposal}
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={16} /> : <CheckCircleIcon />}
              sx={{ 
                backgroundColor: '#8b6cbc',
                '&:hover': { backgroundColor: '#7a5ba8' }
              }}
            >
              {isSubmitting ? 'Creating...' : 'Create Proposal'}
            </Button>
          )}
        </DialogActions>
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
