'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Tooltip,
  Tabs,
  Tab,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Avatar,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Science as TrialIcon,
  CheckCircle as ApprovedIcon,
  Schedule as PendingIcon,
  Warning as WarningIcon,
  Public as WHOIcon,
  Assignment as ProtocolIcon,
  Description as DocumentIcon,
  Clear as ClearIcon,
  CalendarToday as CalendarIcon,
  AppRegistration as RegistrationIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import PageHeader from '../../../../components/common/PageHeader';
import { useAuth } from '../../../../components/AuthProvider';

const statusColors = {
  DRAFT: '#9e9e9e',
  PENDING_WHO_ALIGNMENT: '#ff9800',
  WHO_ALIGNED: '#4caf50',
  READY_FOR_SUBMISSION: '#2196f3',
  SUBMITTED: '#8b6cbc',
};

export default function TrialIntakePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [trials, setTrials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [sortBy, setSortBy] = useState('Recent');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedTrial, setSelectedTrial] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [newTrial, setNewTrial] = useState({
    clinicalTrialId: '',
    trialTitle: '',
    principalInvestigator: '',
    phase: '',
    studyType: ''
  });
  const [loadingTrialData, setLoadingTrialData] = useState(false);

  // Mock CTMS/EDC data pull
  const handleTrialIdChange = async (trialId) => {
    setNewTrial({ ...newTrial, clinicalTrialId: trialId });
    
    // Demo: Auto-fill when CT-2025-28 is entered
    if (trialId === 'CT-2025-28') {
      setLoadingTrialData(true);
      
      // Simulate API call delay
      setTimeout(() => {
        setNewTrial({
          clinicalTrialId: trialId,
          trialTitle: 'Efficacy and Safety of Novel Antimalarial Compound XYZ-401 in Adults with Uncomplicated Plasmodium falciparum Malaria',
          principalInvestigator: 'Dr. Amina Okonkwo',
          phase: 'Phase II',
          studyType: 'Interventional'
        });
        setLoadingTrialData(false);
      }, 1500);
    }
  };
  
  const [stats, setStats] = useState({
    total: 0,
    whoAligned: 0,
    pending: 0,
    draft: 0
  });

  useEffect(() => {
    fetchTrials();
  }, []);

  const fetchTrials = async () => {
    try {
      setLoading(true);
      const mockTrials = [
        {
          id: 1,
          trialId: 'CT-2024-001',
          title: 'Phase III Trial of Novel Antimalarial Drug',
          principalInvestigator: 'Dr. Sarah Johnson',
          status: 'WHO_ALIGNED',
          whoRegistryId: 'PACTR202401001',
          studyType: 'Interventional',
          phase: 'Phase III',
          createdAt: new Date('2024-01-15'),
          targetEnrollment: 500,
        },
        {
          id: 2,
          trialId: 'CT-2024-002',
          title: 'Observational Study on HIV Treatment Adherence',
          principalInvestigator: 'Dr. Michael Omondi',
          status: 'PENDING_WHO_ALIGNMENT',
          whoRegistryId: null,
          studyType: 'Observational',
          phase: 'N/A',
          createdAt: new Date('2024-02-20'),
          targetEnrollment: 300,
        },
        {
          id: 3,
          trialId: 'CT-2024-003',
          title: 'Randomized Trial of TB Vaccine Efficacy',
          principalInvestigator: 'Dr. Amina Hassan',
          status: 'DRAFT',
          whoRegistryId: null,
          studyType: 'Interventional',
          phase: 'Phase II',
          createdAt: new Date('2024-03-10'),
          targetEnrollment: 200,
        },
      ];
      setTrials(mockTrials);
      
      // Calculate statistics
      const total = mockTrials.length;
      const whoAligned = mockTrials.filter(t => t.status === 'WHO_ALIGNED').length;
      const pending = mockTrials.filter(t => t.status === 'PENDING_WHO_ALIGNMENT').length;
      const draft = mockTrials.filter(t => t.status === 'DRAFT').length;
      
      setStats({ total, whoAligned, pending, draft });
    } catch (error) {
      console.error('Error fetching trials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, trial) => {
    setMenuAnchor(event.currentTarget);
    setSelectedTrial(trial);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedTrial(null);
  };

  const filteredTrials = trials.filter((trial) => {
    const matchesSearch = trial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trial.trialId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trial.principalInvestigator.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All Statuses' || trial.status === statusFilter;
    const matchesType = typeFilter === 'All Types' || trial.studyType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });
  
  // Paginated trials
  const paginatedTrials = filteredTrials.slice(
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

  const breadcrumbs = [
    { label: 'Dashboard', href: '/researcher' },
    { label: 'Clinical Trials', href: '/researcher/clinical-trials' },
    { label: 'Trial Intake & Setup' },
  ];
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'WHO_ALIGNED': return <ApprovedIcon fontSize="small" />;
      case 'PENDING_WHO_ALIGNMENT': return <PendingIcon fontSize="small" />;
      case 'DRAFT': return <EditIcon fontSize="small" />;
      default: return <WarningIcon fontSize="small" />;
    }
  };

  return (
    <>
      <Box sx={{ width: '100%', mt: 8, mb: 0 }}>
        <PageHeader
          title="Trial Intake & Setup"
          description="Register new study concepts and align with WHO metadata standards"
          icon={<RegistrationIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={breadcrumbs}
          actionButton={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setRegisterModalOpen(true)}
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
              Register New Trial
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
                  Total Trials
                </Typography>
                <TrialIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {stats.total}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                All trial submissions
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
                  WHO Aligned
                </Typography>
                <ApprovedIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {stats.whoAligned}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Successfully aligned
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
                  Pending Alignment
                </Typography>
                <PendingIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {stats.pending}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Currently being aligned
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
                placeholder="Search trials by title, ID, or PI..."
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
                  <MenuItem value="PENDING_WHO_ALIGNMENT">Pending Alignment</MenuItem>
                  <MenuItem value="WHO_ALIGNED">WHO Aligned</MenuItem>
                  <MenuItem value="READY_FOR_SUBMISSION">Ready for Submission</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={typeFilter}
                  label="Type"
                  onChange={(e) => setTypeFilter(e.target.value)}
                  sx={{ 
                    borderRadius: 3,
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,1)'
                    }
                  }}
                >
                  <MenuItem value="All Types">All Types</MenuItem>
                  <MenuItem value="Interventional">Interventional</MenuItem>
                  <MenuItem value="Observational">Observational</MenuItem>
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
                  setTypeFilter('All Types');
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

        {/* Trials Table */}
        {loading ? (
          <Paper sx={{ 
            p: 8, 
            textAlign: 'center', 
            borderRadius: 4,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.06)'
          }}>
            <TrialIcon sx={{ fontSize: 64, color: '#ddd', mb: 3 }} />
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#666' }}>
              Loading your trials...
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Please wait while we fetch your clinical trials
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
        ) : filteredTrials.length === 0 ? (
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
              <TrialIcon sx={{ fontSize: 48, color: 'white' }} />
            </Box>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 700, color: '#2c3e50' }}>
              No trials found
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto', lineHeight: 1.6 }}>
              {searchQuery || statusFilter !== 'All Statuses' 
                ? 'Try adjusting your search criteria or clear all filters to see more results'
                : 'Register your first clinical trial to get started'
              }
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => router.push('/researcher/clinical-trials/intake/create')}
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
              Register New Trial
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
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Trial ID</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Title</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Principal Investigator</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Type / Phase</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>WHO Registry</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Created</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem', textAlign: 'center' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedTrials.map((trial) => (
                    <TableRow 
                      key={trial.id}
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: 'rgba(139, 108, 188, 0.04)'
                        },
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      <TableCell sx={{ py: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#8b6cbc' }}>
                          {trial.trialId}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                          {trial.title}
                        </Typography>
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
                            {trial.principalInvestigator.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#2c3e50' }}>
                            {trial.principalInvestigator}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Stack direction="column" spacing={0.5}>
                          <Chip
                            label={trial.studyType}
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(139, 108, 188, 0.1)',
                              color: '#8b6cbc',
                              fontWeight: 500,
                              fontSize: '0.7rem',
                              height: 20
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {trial.phase}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        {trial.whoRegistryId ? (
                          <Chip
                            icon={<WHOIcon />}
                            label={trial.whoRegistryId}
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(76, 175, 80, 0.1)',
                              color: '#4caf50',
                              fontWeight: 500,
                              '& .MuiChip-icon': {
                                color: '#4caf50'
                              }
                            }}
                          />
                        ) : (
                          <Chip label="Not Registered" size="small" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Chip
                          icon={getStatusIcon(trial.status)}
                          label={trial.status.replace(/_/g, ' ')}
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarIcon sx={{ fontSize: 16, color: '#8b6cbc' }} />
                          <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#2c3e50' }}>
                            {format(trial.createdAt, 'MMM dd, yyyy')}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="View">
                            <IconButton
                              size="small"
                              onClick={() => router.push(`/researcher/clinical-trials/intake/view/${trial.id}`)}
                              sx={{ 
                                color: '#8b6cbc',
                                '&:hover': { backgroundColor: 'rgba(139, 108, 188, 0.08)' }
                              }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="More">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, trial)}
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
            <TablePagination
              component="div"
              count={filteredTrials.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{
                borderTop: '1px solid rgba(0,0,0,0.06)',
                '.MuiTablePagination-toolbar': {
                  backgroundColor: '#f8f9fa'
                }
              }}
            />
          </Paper>
        )}

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleMenuClose}>
            <ViewIcon sx={{ mr: 1 }} /> View Details
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <EditIcon sx={{ mr: 1 }} /> Edit Trial
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <WHOIcon sx={{ mr: 1 }} /> Align with WHO Standards
          </MenuItem>
          <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ mr: 1 }} /> Delete
          </MenuItem>
        </Menu>

        {/* Registration Modal */}
        <Dialog 
          open={registerModalOpen} 
          onClose={() => {
            setRegisterModalOpen(false);
            setLoadingTrialData(false);
            setNewTrial({
              clinicalTrialId: '',
              trialTitle: '',
              principalInvestigator: '',
              phase: '',
              studyType: ''
            });
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ 
            bgcolor: '#8b6cbc', 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <RegistrationIcon />
            Register New Clinical Trial
          </DialogTitle>
          <DialogContent sx={{ mt: 3 }}>
            <Stack spacing={3}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Enter the Clinical Trial ID to automatically pull trial information from your CTMS or EDC system.
                <br />
                <strong>Demo:</strong> Try entering <Chip label="CT-2025-28" size="small" sx={{ mt: 0.5, bgcolor: '#8b6cbc', color: 'white', fontWeight: 600 }} /> to see auto-fill in action.
              </Alert>
              
              <TextField
                label="Clinical Trial ID"
                placeholder="e.g., CT-2025-28, NCT12345678, PACTR202401234567"
                value={newTrial.clinicalTrialId}
                onChange={(e) => handleTrialIdChange(e.target.value)}
                fullWidth
                required
                autoFocus
                disabled={loadingTrialData}
                helperText={loadingTrialData ? "Pulling trial data from CTMS/EDC..." : "This ID will be used to pull information from CTMS and EDC systems"}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {loadingTrialData ? (
                        <CircularProgress size={20} sx={{ color: '#8b6cbc' }} />
                      ) : (
                        <TrialIcon sx={{ color: '#8b6cbc' }} />
                      )}
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: '#8b6cbc' },
                    '&.Mui-focused fieldset': { borderColor: '#8b6cbc' },
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#8b6cbc' },
                }}
              />

              <TextField
                label="Trial Title"
                placeholder="Enter trial title"
                value={newTrial.trialTitle}
                onChange={(e) => setNewTrial({ ...newTrial, trialTitle: e.target.value })}
                fullWidth
                required
                multiline
                rows={2}
                disabled={loadingTrialData}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: '#8b6cbc' },
                    '&.Mui-focused fieldset': { borderColor: '#8b6cbc' },
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#8b6cbc' },
                }}
              />

              <TextField
                label="Principal Investigator"
                placeholder="Enter PI name"
                value={newTrial.principalInvestigator}
                onChange={(e) => setNewTrial({ ...newTrial, principalInvestigator: e.target.value })}
                fullWidth
                required
                disabled={loadingTrialData}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: '#8b6cbc' },
                    '&.Mui-focused fieldset': { borderColor: '#8b6cbc' },
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#8b6cbc' },
                }}
              />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth required disabled={loadingTrialData}>
                    <InputLabel sx={{ '&.Mui-focused': { color: '#8b6cbc' } }}>Phase</InputLabel>
                    <Select
                      value={newTrial.phase}
                      label="Phase"
                      onChange={(e) => setNewTrial({ ...newTrial, phase: e.target.value })}
                      sx={{
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#8b6cbc' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#8b6cbc' },
                      }}
                    >
                      <MenuItem value="Phase I">Phase I</MenuItem>
                      <MenuItem value="Phase II">Phase II</MenuItem>
                      <MenuItem value="Phase III">Phase III</MenuItem>
                      <MenuItem value="Phase IV">Phase IV</MenuItem>
                      <MenuItem value="N/A">N/A</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth required disabled={loadingTrialData}>
                    <InputLabel sx={{ '&.Mui-focused': { color: '#8b6cbc' } }}>Study Type</InputLabel>
                    <Select
                      value={newTrial.studyType}
                      label="Study Type"
                      onChange={(e) => setNewTrial({ ...newTrial, studyType: e.target.value })}
                      sx={{
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#8b6cbc' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#8b6cbc' },
                      }}
                    >
                      <MenuItem value="Interventional">Interventional</MenuItem>
                      <MenuItem value="Observational">Observational</MenuItem>
                      <MenuItem value="Expanded Access">Expanded Access</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 1 }}>
            <Button 
              onClick={() => {
                setRegisterModalOpen(false);
                setLoadingTrialData(false);
                setNewTrial({
                  clinicalTrialId: '',
                  trialTitle: '',
                  principalInvestigator: '',
                  phase: '',
                  studyType: ''
                });
              }}
              sx={{ color: '#666' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                // Here you would handle the CTMS/EDC data pull and trial registration
                console.log('Registering trial with ID:', newTrial.clinicalTrialId);
                console.log('Trial data:', newTrial);
                // TODO: Implement CTMS/EDC integration and save to database
                setRegisterModalOpen(false);
                setLoadingTrialData(false);
                setNewTrial({
                  clinicalTrialId: '',
                  trialTitle: '',
                  principalInvestigator: '',
                  phase: '',
                  studyType: ''
                });
              }}
              disabled={!newTrial.clinicalTrialId || !newTrial.trialTitle || !newTrial.principalInvestigator || !newTrial.phase || !newTrial.studyType || loadingTrialData}
              sx={{
                bgcolor: '#8b6cbc',
                '&:hover': { bgcolor: '#7a5cad' },
                '&:disabled': { bgcolor: '#ccc' }
              }}
            >
              Register Trial
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}
