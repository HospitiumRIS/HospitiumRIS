'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  IconButton,
  Chip,
  Tooltip,
  Stack,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  CircularProgress,
  Snackbar,
  LinearProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Description as DescriptionIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  AttachFile as AttachFileIcon,
  CloudUpload as CloudUploadIcon,
  Download as DownloadIcon,
  Comment as CommentIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Timer as TimerIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as TaskIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';

const GrantWritingPortal = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [proposals, setProposals] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Dialog states
  const [newProposalDialog, setNewProposalDialog] = useState(false);
  const [viewProposalDialog, setViewProposalDialog] = useState(false);
  const [collaboratorDialog, setCollaboratorDialog] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);

  // Form states
  const [proposalForm, setProposalForm] = useState({
    title: '',
    grantor: '',
    deadline: '',
    amount: '',
    category: '',
    description: '',
    status: 'draft',
    assignedTo: '',
    priority: 'medium'
  });

  const [collaboratorForm, setCollaboratorForm] = useState({
    name: '',
    email: '',
    role: '',
    expertise: '',
    affiliation: ''
  });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Simulate API calls
      const [proposalsRes, templatesRes, collaboratorsRes] = await Promise.all([
        fetch(`/api/foundation/proposals?search=${searchTerm}&status=${filterStatus}`),
        fetch('/api/foundation/templates'),
        fetch('/api/foundation/collaborators')
      ]);

      // For now, using mock data
      setProposals([
        {
          id: 1,
          title: 'AI-Driven Healthcare Innovation Research',
          grantor: 'NIH - National Institute of Health',
          deadline: '2024-03-15',
          amount: 2500000,
          category: 'Research Grant',
          status: 'in_progress',
          progress: 65,
          assignedTo: 'Dr. Sarah Johnson',
          priority: 'high',
          lastUpdated: '2024-01-15',
          description: 'Comprehensive research proposal for AI applications in healthcare diagnostics and treatment optimization.',
          collaborators: ['Dr. Sarah Johnson', 'Dr. Michael Chen', 'Dr. Emily Rodriguez']
        }
      ]);

      setTemplates([
        { id: 1, name: 'NIH R01 Template', category: 'Research', downloads: 45 }
      ]);

      setCollaborators([
        { id: 1, name: 'Dr. Sarah Johnson', role: 'Principal Investigator', expertise: 'AI & Machine Learning', affiliation: 'Hospitium Research Institute' }
      ]);

    } catch (error) {
      console.error('Error loading data:', error);
      showSnackbar('Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'default';
      case 'in_progress': return 'warning';
      case 'review': return 'info';
      case 'submitted': return 'success';
      case 'awarded': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const handleNewProposal = () => {
    setProposalForm({
      title: '',
      grantor: '',
      deadline: '',
      amount: '',
      category: '',
      description: '',
      status: 'draft',
      assignedTo: '',
      priority: 'medium'
    });
    setNewProposalDialog(true);
  };

  const handleSaveProposal = async () => {
    try {
      setSaving(true);
      
      if (!proposalForm.title || !proposalForm.grantor || !proposalForm.deadline) {
        showSnackbar('Please fill in all required fields', 'error');
        return;
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showSnackbar('Proposal saved successfully!', 'success');
      setNewProposalDialog(false);
      loadData();
    } catch (error) {
      showSnackbar('Error saving proposal', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleViewProposal = (proposal) => {
    setSelectedProposal(proposal);
    setViewProposalDialog(true);
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  // Calculate statistics
  const totalProposals = proposals.length;
  const activeProposals = proposals.filter(p => p.status === 'in_progress').length;
  const submittedProposals = proposals.filter(p => p.status === 'submitted').length;
  const totalValue = proposals.reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
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
        />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <CircularProgress size={60} sx={{ color: '#8b6cbc' }} />
          </Box>
        </Container>
      </Box>
    );
  }

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
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNewProposal}
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
              New Proposal
            </Button>
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
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: '0 6px 20px rgba(139, 108, 188, 0.3)'
            },
            transition: 'all 0.3s ease'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" fontWeight="bold" color="white">
                {totalProposals}
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
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: '0 6px 20px rgba(139, 108, 188, 0.3)'
            },
            transition: 'all 0.3s ease'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" fontWeight="bold" color="white">
                {activeProposals}
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
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: '0 6px 20px rgba(139, 108, 188, 0.3)'
            },
            transition: 'all 0.3s ease'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" fontWeight="bold" color="white">
                {submittedProposals}
              </Typography>
              <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Submitted
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ 
            borderRadius: 3, 
            background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5cac 100%)',
            color: 'white',
            boxShadow: '0 3px 12px rgba(139, 108, 188, 0.15)',
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: '0 6px 20px rgba(139, 108, 188, 0.3)'
            },
            transition: 'all 0.3s ease'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" fontWeight="bold" color="white">
                {formatCurrency(totalValue)}
              </Typography>
              <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Total Value
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Search and Filters */}
        <Paper sx={{ borderRadius: 3, p: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search proposals by title, grantor, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Filter by Status</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="Filter by Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="review">Under Review</MenuItem>
                  <MenuItem value="submitted">Submitted</MenuItem>
                  <MenuItem value="awarded">Awarded</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="outlined"
                startIcon={<GroupIcon />}
                onClick={() => setCollaboratorDialog(true)}
                sx={{
                  borderColor: '#8b6cbc',
                  color: '#8b6cbc',
                  '&:hover': {
                    borderColor: '#7a5ba8',
                    backgroundColor: alpha('#8b6cbc', 0.08)
                  }
                }}
              >
                Manage Collaborators
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Main Content Tabs */}
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            sx={{
              backgroundColor: alpha('#8b6cbc', 0.05),
              '& .MuiTab-root': {
                fontWeight: 600,
                '&.Mui-selected': {
                  color: '#8b6cbc'
                }
              }
            }}
          >
            <Tab label="Active Proposals" icon={<AssignmentIcon />} />
            <Tab label="Templates Library" icon={<DescriptionIcon />} />
            <Tab label="Collaboration Hub" icon={<GroupIcon />} />
          </Tabs>

          {/* Tab Content */}
          <Box sx={{ p: 3 }}>
            {selectedTab === 0 && (
              <Box sx={{ 
                display: 'flex', 
                gap: 3, 
                flexWrap: 'wrap',
                '& > *': { 
                  flex: { xs: '1 1 100%', lg: '1 1 calc(50% - 12px)' } 
                }
              }}>
                {proposals.map((proposal) => (
                    <Card key={proposal.id} sx={{ 
                      borderRadius: 3, 
                      boxShadow: 2,
                      border: `2px solid ${alpha('#8b6cbc', 0.1)}`,
                      '&:hover': {
                        boxShadow: 4,
                        transform: 'translateY(-2px)',
                        transition: 'all 0.3s ease'
                      }
                    }}>
                      <CardContent sx={{ p: 3 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                              {proposal.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {proposal.grantor}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                              <Chip 
                                label={proposal.status.replace('_', ' ')} 
                                color={getStatusColor(proposal.status)}
                                size="small"
                              />
                              <Chip 
                                label={proposal.priority} 
                                color={getPriorityColor(proposal.priority)}
                                size="small"
                                variant="outlined"
                              />
                            </Stack>
                          </Box>
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="View Details">
                              <IconButton 
                                size="small" 
                                onClick={() => handleViewProposal(proposal)}
                                sx={{ color: '#8b6cbc' }}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton size="small" sx={{ color: '#ff9800' }}>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Stack>

                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Amount
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                              {formatCurrency(proposal.amount)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Deadline
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {formatDate(proposal.deadline)}
                            </Typography>
                          </Grid>
                        </Grid>

                        <Box sx={{ mb: 2 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              Progress
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              {proposal.progress}%
                            </Typography>
                          </Stack>
                          <LinearProgress 
                            variant="determinate" 
                            value={proposal.progress} 
                            sx={{ 
                              height: 8, 
                              borderRadius: 4,
                              backgroundColor: alpha('#8b6cbc', 0.1),
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: '#8b6cbc'
                              }
                            }} 
                          />
                        </Box>

                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Assigned to
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {proposal.assignedTo}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={-0.5}>
                            {proposal.collaborators.slice(0, 3).map((collab, index) => (
                              <Avatar 
                                key={index}
                                sx={{ 
                                  width: 24, 
                                  height: 24, 
                                  fontSize: '0.7rem',
                                  bgcolor: '#8b6cbc',
                                  border: '2px solid white'
                                }}
                              >
                                {collab.charAt(0)}
                              </Avatar>
                            ))}
                            {proposal.collaborators.length > 3 && (
                              <Avatar sx={{ width: 24, height: 24, fontSize: '0.6rem', bgcolor: 'grey.400' }}>
                                +{proposal.collaborators.length - 3}
                              </Avatar>
                            )}
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                ))}
              </Box>
            )}

            {selectedTab === 1 && (
              <Box>
                <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                  <Typography variant="body2">
                    Access pre-formatted templates for different types of grant proposals. Templates include standard sections, formatting guidelines, and best practices.
                  </Typography>
                </Alert>
                
                <Box sx={{ 
                  display: 'flex', 
                  gap: 3, 
                  flexWrap: 'wrap',
                  '& > *': { 
                    flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(33.333% - 16px)' } 
                  }
                }}>
                  {templates.map((template) => (
                    <Card key={template.id} sx={{ 
                      borderRadius: 3, 
                      boxShadow: 2,
                      '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
                      transition: 'all 0.3s ease'
                    }}>
                      <CardContent sx={{ textAlign: 'center', p: 3 }}>
                        <DescriptionIcon sx={{ fontSize: 48, color: '#8b6cbc', mb: 2 }} />
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                          {template.name}
                        </Typography>
                        <Chip 
                          label={template.category} 
                          size="small" 
                          sx={{ 
                            backgroundColor: alpha('#8b6cbc', 0.1), 
                            color: '#8b6cbc',
                            mb: 2 
                          }} 
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Downloaded {template.downloads} times
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<DownloadIcon />}
                          sx={{
                            backgroundColor: '#8b6cbc',
                            '&:hover': { backgroundColor: '#7a5ba8' }
                          }}
                        >
                          Download
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Box>
            )}

            {selectedTab === 2 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                    <Typography variant="body2">
                      Manage your team of collaborators, track their contributions, and coordinate proposal development activities.
                    </Typography>
                  </Alert>
                </Grid>
                <Grid item xs={12}>
                  <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: alpha('#8b6cbc', 0.05) }}>
                          <TableCell sx={{ fontWeight: 600 }}>Collaborator</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Expertise</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Affiliation</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {collaborators.map((collaborator) => (
                          <TableRow key={collaborator.id} hover>
                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={2}>
                                <Avatar sx={{ bgcolor: '#8b6cbc', width: 32, height: 32 }}>
                                  {collaborator.name.charAt(0)}
                                </Avatar>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  {collaborator.name}
                                </Typography>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={collaborator.role} 
                                size="small"
                                sx={{ 
                                  backgroundColor: alpha('#8b6cbc', 0.1), 
                                  color: '#8b6cbc' 
                                }}
                              />
                            </TableCell>
                            <TableCell>{collaborator.expertise}</TableCell>
                            <TableCell>{collaborator.affiliation}</TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={1}>
                                <Tooltip title="View Profile">
                                  <IconButton size="small" sx={{ color: '#8b6cbc' }}>
                                    <ViewIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Send Message">
                                  <IconButton size="small" sx={{ color: '#1976d2' }}>
                                    <CommentIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            )}
          </Box>
        </Paper>
      </Container>

      {/* New Proposal Dialog */}
      <Dialog 
        open={newProposalDialog} 
        onClose={() => setNewProposalDialog(false)}
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
          <Stack direction="row" alignItems="center" spacing={2}>
            <AddIcon sx={{ fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Create New Proposal
            </Typography>
          </Stack>
        </DialogTitle>
        
        <DialogContent sx={{ p: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Proposal Title *"
                value={proposalForm.title}
                onChange={(e) => setProposalForm(prev => ({ ...prev, title: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Grantor Organization *"
                value={proposalForm.grantor}
                onChange={(e) => setProposalForm(prev => ({ ...prev, grantor: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Deadline *"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={proposalForm.deadline}
                onChange={(e) => setProposalForm(prev => ({ ...prev, deadline: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Funding Amount"
                type="number"
                value={proposalForm.amount}
                onChange={(e) => setProposalForm(prev => ({ ...prev, amount: e.target.value }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={proposalForm.category}
                  onChange={(e) => setProposalForm(prev => ({ ...prev, category: e.target.value }))}
                  label="Category"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="Research Grant">Research Grant</MenuItem>
                  <MenuItem value="Program Grant">Program Grant</MenuItem>
                  <MenuItem value="Technology Grant">Technology Grant</MenuItem>
                  <MenuItem value="Training Grant">Training Grant</MenuItem>
                  <MenuItem value="Equipment Grant">Equipment Grant</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Assigned To</InputLabel>
                <Select
                  value={proposalForm.assignedTo}
                  onChange={(e) => setProposalForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                  label="Assigned To"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="Dr. Sarah Johnson">Dr. Sarah Johnson</MenuItem>
                  <MenuItem value="Dr. Michael Chen">Dr. Michael Chen</MenuItem>
                  <MenuItem value="Dr. Emily Rodriguez">Dr. Emily Rodriguez</MenuItem>
                  <MenuItem value="Dr. James Wilson">Dr. James Wilson</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={proposalForm.priority}
                  onChange={(e) => setProposalForm(prev => ({ ...prev, priority: e.target.value }))}
                  label="Priority"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                value={proposalForm.description}
                onChange={(e) => setProposalForm(prev => ({ ...prev, description: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={() => setNewProposalDialog(false)}
            variant="outlined"
            disabled={saving}
            sx={{ borderRadius: 2, borderColor: '#8b6cbc', color: '#8b6cbc' }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveProposal}
            disabled={saving || !proposalForm.title || !proposalForm.grantor || !proposalForm.deadline}
            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
            sx={{ 
              backgroundColor: '#8b6cbc',
              borderRadius: 2,
              '&:hover': { backgroundColor: '#7a5ba8' }
            }}
          >
            {saving ? 'Creating...' : 'Create Proposal'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Proposal Dialog */}
      <Dialog 
        open={viewProposalDialog} 
        onClose={() => setViewProposalDialog(false)}
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
          py: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <ViewIcon sx={{ fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Proposal Details
            </Typography>
          </Stack>
          <IconButton onClick={() => setViewProposalDialog(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 4 }}>
          {selectedProposal && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                  {selectedProposal.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  {selectedProposal.description}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Grantor
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {selectedProposal.grantor}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Amount
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                  {formatCurrency(selectedProposal.amount)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Deadline
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {formatDate(selectedProposal.deadline)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Status
                </Typography>
                <Chip
                  label={selectedProposal.status.replace('_', ' ')}
                  color={getStatusColor(selectedProposal.status)}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Progress
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={selectedProposal.progress} 
                    sx={{ 
                      flex: 1,
                      height: 8, 
                      borderRadius: 4,
                      backgroundColor: alpha('#8b6cbc', 0.1),
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#8b6cbc'
                      }
                    }} 
                  />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {selectedProposal.progress}%
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                  Collaborators
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  {selectedProposal.collaborators.map((collab, index) => (
                    <Chip
                      key={index}
                      avatar={<Avatar sx={{ bgcolor: '#8b6cbc' }}>{collab.charAt(0)}</Avatar>}
                      label={collab}
                      sx={{
                        backgroundColor: alpha('#8b6cbc', 0.1),
                        color: '#8b6cbc'
                      }}
                    />
                  ))}
                </Stack>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default GrantWritingPortal;
