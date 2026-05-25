'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
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
  TablePagination,
  alpha,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  LinearProgress,
  useTheme,
  Avatar,
} from '@mui/material';
import {
  Search as SearchIcon,
  EmojiEvents as TrophyIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  PlayArrow as PlayArrowIcon,
  AccountBalance as AccountBalanceIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';

const GrantAwardsWonPage = () => {
  const theme = useTheme();
  
  // State management
  const [awards, setAwards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [selectedAward, setSelectedAward] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration
      setAwards([
        {
          id: 1,
          title: 'AI-Driven Healthcare Innovation Research',
          grantor: 'NIH - National Institute of Health',
          awardDate: '2024-01-20',
          startDate: '2024-02-01',
          endDate: '2026-01-31',
          totalAmount: 2500000,
          disbursedAmount: 625000,
          remainingAmount: 1875000,
          status: 'active',
          projectStatus: 'on_track',
          principalInvestigator: 'Dr. Sarah Johnson',
          coPrincipalInvestigator: 'Dr. Michael Chen',
          department: 'Research & Innovation',
          grantNumber: 'NIH-2024-AI-001',
          projectPeriod: '24 months',
          nextMilestone: 'Q1 Progress Report',
          nextMilestoneDate: '2024-03-31',
          completionPercentage: 25,
          description: 'Comprehensive research program focused on developing AI-powered diagnostic tools for early disease detection and treatment optimization in healthcare settings.',
          objectives: [
            'Develop machine learning algorithms for medical imaging analysis',
            'Create predictive models for patient outcomes',
            'Implement AI-driven decision support systems',
            'Conduct clinical validation studies'
          ],
          keyPersonnel: [
            { name: 'Dr. Sarah Johnson', role: 'Principal Investigator', effort: '50%' },
            { name: 'Dr. Michael Chen', role: 'Co-Principal Investigator', effort: '25%' },
            { name: 'Dr. Emily Rodriguez', role: 'Research Coordinator', effort: '100%' },
            { name: 'Dr. James Wilson', role: 'Data Scientist', effort: '75%' }
          ],
          budgetBreakdown: [
            { category: 'Personnel', allocated: 1500000, spent: 375000, remaining: 1125000 },
            { category: 'Equipment', allocated: 500000, spent: 125000, remaining: 375000 },
            { category: 'Supplies', allocated: 300000, spent: 75000, remaining: 225000 },
            { category: 'Travel', allocated: 100000, spent: 25000, remaining: 75000 },
            { category: 'Other', allocated: 100000, spent: 25000, remaining: 75000 }
          ]
        },
        {
          id: 2,
          title: 'Medical Education Technology Platform',
          grantor: 'Gates Foundation',
          awardDate: '2024-01-22',
          startDate: '2024-02-15',
          endDate: '2025-08-14',
          totalAmount: 1200000,
          disbursedAmount: 400000,
          remainingAmount: 800000,
          status: 'active',
          projectStatus: 'on_track',
          principalInvestigator: 'Dr. Emily Rodriguez',
          coPrincipalInvestigator: 'Dr. Lisa Wang',
          department: 'Medical Education',
          grantNumber: 'GATES-2024-EDTECH-002',
          projectPeriod: '18 months',
          nextMilestone: 'Platform Beta Release',
          nextMilestoneDate: '2024-04-15',
          completionPercentage: 33,
          description: 'Development of innovative medical education platform using VR and AI technologies to enhance learning outcomes for medical students and healthcare professionals.',
          objectives: [
            'Design immersive VR medical training modules',
            'Integrate AI-powered assessment tools',
            'Create adaptive learning pathways',
            'Conduct user experience testing and optimization'
          ],
          keyPersonnel: [
            { name: 'Dr. Emily Rodriguez', role: 'Principal Investigator', effort: '40%' },
            { name: 'Dr. Lisa Wang', role: 'Co-Principal Investigator', effort: '30%' },
            { name: 'Dr. James Wilson', role: 'Technical Lead', effort: '80%' },
            { name: 'Ms. Jennifer Martinez', role: 'UX Designer', effort: '100%' }
          ],
          budgetBreakdown: [
            { category: 'Personnel', allocated: 720000, spent: 240000, remaining: 480000 },
            { category: 'Technology', allocated: 300000, spent: 100000, remaining: 200000 },
            { category: 'Equipment', allocated: 120000, spent: 40000, remaining: 80000 },
            { category: 'Testing', allocated: 60000, spent: 20000, remaining: 40000 }
          ]
        },
        {
          id: 3,
          title: 'Community Health Outreach Initiative',
          grantor: 'Robert Wood Johnson Foundation',
          awardDate: '2023-09-15',
          startDate: '2023-10-01',
          endDate: '2024-09-30',
          totalAmount: 850000,
          disbursedAmount: 680000,
          remainingAmount: 170000,
          status: 'active',
          projectStatus: 'at_risk',
          principalInvestigator: 'Dr. Michael Chen',
          coPrincipalInvestigator: 'Dr. Amanda Foster',
          department: 'Community Health',
          grantNumber: 'RWJF-2023-OUTREACH-003',
          projectPeriod: '12 months',
          nextMilestone: 'Final Report Submission',
          nextMilestoneDate: '2024-09-15',
          completionPercentage: 80,
          description: 'Comprehensive community health program targeting underserved populations with focus on preventive care, health education, and access to healthcare services.',
          objectives: [
            'Establish mobile health clinics in underserved areas',
            'Develop community health education programs',
            'Train community health workers',
            'Create sustainable healthcare access pathways'
          ],
          keyPersonnel: [
            { name: 'Dr. Michael Chen', role: 'Principal Investigator', effort: '30%' },
            { name: 'Dr. Amanda Foster', role: 'Co-Principal Investigator', effort: '25%' },
            { name: 'Ms. Rebecca Thompson', role: 'Program Manager', effort: '100%' },
            { name: 'Mr. David Wilson', role: 'Community Coordinator', effort: '100%' }
          ],
          budgetBreakdown: [
            { category: 'Personnel', allocated: 425000, spent: 340000, remaining: 85000 },
            { category: 'Equipment', allocated: 255000, spent: 204000, remaining: 51000 },
            { category: 'Outreach', allocated: 127500, spent: 102000, remaining: 25500 },
            { category: 'Training', allocated: 42500, spent: 34000, remaining: 8500 }
          ]
        },
        {
          id: 4,
          title: 'Pediatric Care Enhancement Program',
          grantor: 'Children\'s Health Foundation',
          awardDate: '2023-06-10',
          startDate: '2023-07-01',
          endDate: '2024-06-30',
          totalAmount: 650000,
          disbursedAmount: 650000,
          remainingAmount: 0,
          status: 'completed',
          projectStatus: 'completed',
          principalInvestigator: 'Dr. Lisa Wang',
          coPrincipalInvestigator: 'Dr. Jennifer Martinez',
          department: 'Pediatrics',
          grantNumber: 'CHF-2023-PEDS-004',
          projectPeriod: '12 months',
          nextMilestone: 'Project Completed',
          nextMilestoneDate: '2024-06-30',
          completionPercentage: 100,
          description: 'Enhancement of pediatric care services through advanced diagnostic equipment, staff training, and family support programs.',
          objectives: [
            'Upgrade pediatric diagnostic equipment',
            'Implement family-centered care protocols',
            'Train staff in specialized pediatric care',
            'Develop child-friendly treatment environments'
          ],
          keyPersonnel: [
            { name: 'Dr. Lisa Wang', role: 'Principal Investigator', effort: '40%' },
            { name: 'Dr. Jennifer Martinez', role: 'Co-Principal Investigator', effort: '30%' },
            { name: 'Ms. Sarah Thompson', role: 'Clinical Coordinator', effort: '100%' },
            { name: 'Mr. Robert Davis', role: 'Equipment Specialist', effort: '50%' }
          ],
          budgetBreakdown: [
            { category: 'Equipment', allocated: 390000, spent: 390000, remaining: 0 },
            { category: 'Personnel', allocated: 195000, spent: 195000, remaining: 0 },
            { category: 'Training', allocated: 39000, spent: 39000, remaining: 0 },
            { category: 'Supplies', allocated: 26000, spent: 26000, remaining: 0 }
          ]
        }
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

  // Filter and search logic
  const filteredAwards = useMemo(() => {
    return awards.filter(award => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        award.title?.toLowerCase().includes(searchLower) ||
        award.grantor?.toLowerCase().includes(searchLower) ||
        award.principalInvestigator?.toLowerCase().includes(searchLower) ||
        award.grantNumber?.toLowerCase().includes(searchLower) ||
        award.department?.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = filterStatus === 'all' || award.status === filterStatus;

      // Year filter
      const awardYear = new Date(award.awardDate).getFullYear().toString();
      const matchesYear = filterYear === 'all' || awardYear === filterYear;

      return matchesSearch && matchesStatus && matchesYear;
    });
  }, [awards, searchTerm, filterStatus, filterYear]);

  // Pagination
  const paginatedAwards = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredAwards.slice(start, start + rowsPerPage);
  }, [filteredAwards, page, rowsPerPage]);

  // Statistics
  const stats = useMemo(() => ({
    total: awards.length,
    active: awards.filter(a => a.status === 'active').length,
    completed: awards.filter(a => a.status === 'completed').length,
    totalValue: awards.reduce((sum, a) => sum + a.totalAmount, 0),
    totalDisbursed: awards.reduce((sum, a) => sum + a.disbursedAmount, 0),
  }), [awards]);

  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'completed': return 'info';
      case 'on_hold': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getProjectStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'on_track': return 'success';
      case 'at_risk': return 'warning';
      case 'delayed': return 'error';
      case 'completed': return 'info';
      default: return 'default';
    }
  };

  const getStatusHex = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return '#22c55e';
      case 'completed': return '#3b82f6';
      case 'on_hold': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const getProjectStatusHex = (status) => {
    switch (status?.toLowerCase()) {
      case 'on_track': return '#22c55e';
      case 'at_risk': return '#f59e0b';
      case 'delayed': return '#ef4444';
      case 'completed': return '#3b82f6';
      default: return '#94a3b8';
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewAward = (award) => {
    setSelectedAward(award);
    setViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialog(false);
    setSelectedAward(null);
  };

  if (loading) {
    return (
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Grant Awards Won"
          description="Manage and track awarded grants, milestones, and reporting requirements"
          icon={<TrophyIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Foundation', path: '/foundation' },
            { label: 'Grants', path: '/foundation/grants' },
            { label: 'Awards Won' }
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
      {/* Full-width PageHeader */}
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Grant Awards Won"
          description="Manage and track awarded grants, milestones, and reporting requirements"
          icon={<TrophyIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Foundation', path: '/foundation' },
            { label: 'Grants', path: '/foundation/grants' },
            { label: 'Awards Won' }
          ]}
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
          actionButton={
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={loadData}
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
                Refresh
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                sx={{
                  borderColor: 'rgba(255,255,255,0.5)',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                Export
              </Button>
            </Stack>
          }
        />
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Compact Summary + Filter Panel */}
        <Paper sx={{ borderRadius: 3, mb: 3, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid', borderColor: 'divider' }}>
          {/* Summary bar */}
          <Box sx={{ px: 3, py: 1.5, background: 'linear-gradient(135deg, rgba(139,108,188,0.06) 0%, rgba(160,132,209,0.04) 100%)', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
            {[
              { label: 'Total Awards', value: stats.total, color: '#8b6cbc', key: null },
              { label: 'Active', value: stats.active, color: '#22c55e', key: 'active' },
              { label: 'Completed', value: stats.completed, color: '#3b82f6', key: 'completed' },
              { label: 'Total Value', value: formatCurrency(stats.totalValue), color: '#059669', key: null },
              { label: 'Disbursed', value: formatCurrency(stats.totalDisbursed), color: '#6366f1', key: null },
            ].map((item, i) => (
              <React.Fragment key={i}>
                {i > 0 && <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />}
                <Stack
                  direction="row" spacing={0.75} alignItems="center"
                  onClick={item.key ? () => setFilterStatus(filterStatus === item.key ? 'all' : item.key) : undefined}
                  sx={item.key ? {
                    cursor: 'pointer', px: 1, py: 0.3, borderRadius: 1,
                    bgcolor: filterStatus === item.key ? alpha(item.color, 0.1) : 'transparent',
                    outline: filterStatus === item.key ? `1.5px solid ${alpha(item.color, 0.35)}` : 'none',
                    transition: 'all 0.15s',
                    '&:hover': { bgcolor: alpha(item.color, 0.07) }
                  } : { px: 1, py: 0.3 }}
                >
                  <Typography variant="caption" sx={{ fontSize: '0.76rem', color: 'text.secondary', fontWeight: 500 }}>{item.label}</Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.85rem', fontWeight: 800, color: item.color }}>{item.value}</Typography>
                </Stack>
              </React.Fragment>
            ))}
          </Box>

          {/* Filter row */}
          <Box sx={{ px: 3, py: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Search by title, grantor, PI, grant number, department..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> }}
              sx={{ flex: '1 1 260px', minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }} displayEmpty sx={{ borderRadius: 2 }}>
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="on_hold">On Hold</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select value={filterYear} onChange={(e) => { setFilterYear(e.target.value); setPage(0); }} displayEmpty sx={{ borderRadius: 2 }}>
                <MenuItem value="all">All Years</MenuItem>
                <MenuItem value="2024">2024</MenuItem>
                <MenuItem value="2023">2023</MenuItem>
                <MenuItem value="2022">2022</MenuItem>
              </Select>
            </FormControl>
            {(searchTerm || filterStatus !== 'all' || filterYear !== 'all') && (
              <Button size="small" variant="outlined"
                onClick={() => { setSearchTerm(''); setFilterStatus('all'); setFilterYear('all'); setPage(0); }}
                sx={{ borderColor: alpha('#8b6cbc', 0.4), color: '#8b6cbc', borderRadius: 2, whiteSpace: 'nowrap' }}
              >
                Clear
              </Button>
            )}
          </Box>
          <Typography variant="caption" sx={{ px: 3, pb: 1.5, display: 'block', color: 'text.secondary' }}>
            Showing <strong>{filteredAwards.length}</strong> of <strong>{awards.length}</strong> awards
            {(searchTerm || filterStatus !== 'all' || filterYear !== 'all') && ' \u2014 filters active'}
          </Typography>
        </Paper>

        {/* Awards Table */}
        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'primary.main' }}>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Grant Title</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Grantor</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Principal Investigator</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Award Amount</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Period</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Progress</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedAwards.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <Typography variant="body1" color="text.secondary">
                        No awards found matching your filters
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedAwards.map((award, index) => (
                    <TableRow 
                      key={award.id}
                      hover
                      sx={{ 
                        '&:nth-of-type(odd)': { bgcolor: alpha('#8b6cbc', 0.02) },
                        '&:hover': { bgcolor: alpha('#8b6cbc', 0.05) }
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#2c3e50', mb: 0.5 }}>
                          {award.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {award.grantNumber} • {award.department}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <BusinessIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="body2">{award.grantor}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="body2">{award.principalInvestigator}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(award.totalAmount)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatCurrency(award.disbursedAmount)} received
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <CalendarIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="body2">{award.projectPeriod}</Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(award.startDate)} - {formatDate(award.endDate)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ width: '100%', mb: 0.5 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={award.completionPercentage}
                            sx={{ 
                              height: 6, 
                              borderRadius: 3,
                              bgcolor: alpha('#e0e0e0', 0.3),
                              '& .MuiLinearProgress-bar': {
                                bgcolor: award.projectStatus === 'at_risk' ? '#ff9800' : '#4caf50',
                                borderRadius: 3
                              }
                            }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {award.completionPercentage}% complete
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Chip
                            label={award.status}
                            color={getStatusColor(award.status)}
                            size="small"
                          />
                          <Chip
                            label={award.projectStatus.replace('_', ' ')}
                            color={getProjectStatusColor(award.projectStatus)}
                            size="small"
                            variant="outlined"
                          />
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewAward(award)}
                            sx={{ 
                              color: '#8b6cbc',
                              '&:hover': { bgcolor: alpha('#8b6cbc', 0.1) }
                            }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filteredAwards.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 20, 50, 100]}
            sx={{
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: alpha('#8b6cbc', 0.02)
            }}
          />
        </Paper>
      </Container>

      {/* View Award Dialog */}
      <Dialog
        open={viewDialog}
        onClose={handleCloseViewDialog}
        maxWidth="lg"
        fullWidth
        disableScrollLock
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        {selectedAward && (
          <>
            {/* Gradient Hero Header */}
            <Box sx={{ background: 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 100%)', px: 3, pt: 3, pb: 2.5, color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <TrophyIcon sx={{ fontSize: 18, opacity: 0.85 }} />
                    <Typography variant="caption" sx={{ opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.72rem' }}>
                      Grant Award Details
                    </Typography>
                  </Stack>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, lineHeight: 1.25 }}>
                    {selectedAward.title}
                  </Typography>
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                    <Chip label={selectedAward.status} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700, backdropFilter: 'blur(4px)', height: 22, fontSize: '0.72rem', textTransform: 'capitalize' }} />
                    <Chip label={selectedAward.projectStatus.replace(/_/g, ' ')} size="small" variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.5)', color: 'white', fontWeight: 600, height: 22, fontSize: '0.72rem', textTransform: 'capitalize' }} />
                    <Chip label={selectedAward.grantNumber} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', height: 22, fontSize: '0.70rem' }} />
                  </Stack>
                </Box>
                <IconButton onClick={handleCloseViewDialog} sx={{ color: 'white', mt: -0.5 }}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>

            {/* Metrics Strip */}
            <Box sx={{ display: 'flex', borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha('#8b6cbc', 0.02), flexWrap: 'wrap' }}>
              {[
                { label: 'Total Award', value: formatCurrency(selectedAward.totalAmount), color: '#059669' },
                { label: 'Disbursed', value: formatCurrency(selectedAward.disbursedAmount), color: '#3b82f6' },
                { label: 'Remaining', value: formatCurrency(selectedAward.remainingAmount), color: '#8b5cf6' },
                { label: 'Period', value: selectedAward.projectPeriod, color: '#1e293b' },
                { label: 'Completion', value: `${selectedAward.completionPercentage}%`, color: getProjectStatusHex(selectedAward.projectStatus) },
              ].map((m, i) => (
                <Box key={i} sx={{ flex: '1 1 0', px: 2, py: 1.5, borderRight: i < 4 ? '1px solid' : 'none', borderColor: 'divider', textAlign: 'center', minWidth: 100 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>{m.label}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: m.color, fontSize: '0.95rem', mt: 0.25 }}>{m.value}</Typography>
                </Box>
              ))}
            </Box>

            <DialogContent sx={{ p: 3 }}>
              {/* Two-column body */}
              <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap', '& > *': { flex: '1 1 280px' } }}>
                {/* Left — Description + Objectives */}
                <Stack spacing={2.5}>
                  <Box sx={{ p: 2, bgcolor: alpha('#8b6cbc', 0.04), borderRadius: 2, border: `1px solid ${alpha('#8b6cbc', 0.1)}` }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 0.75 }}>Description</Typography>
                    <Typography variant="body2" sx={{ lineHeight: 1.65, color: '#374151' }}>{selectedAward.description}</Typography>
                  </Box>

                  {selectedAward.objectives?.length > 0 && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 1 }}>Project Objectives</Typography>
                      <Stack spacing={0.85}>
                        {selectedAward.objectives.map((obj, i) => (
                          <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                            <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: alpha('#8b6cbc', 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.15 }}>
                              <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#8b6cbc' }}>{i + 1}</Typography>
                            </Box>
                            <Typography variant="body2" sx={{ lineHeight: 1.55 }}>{obj}</Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Stack>

                {/* Right — Grantor/Team + Timeline */}
                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 1 }}>Grantor & Team</Typography>
                    <Stack spacing={1.5}>
                      {[
                        { icon: <BusinessIcon sx={{ fontSize: 15 }} />, label: 'Grantor', value: selectedAward.grantor },
                        { icon: <PersonIcon sx={{ fontSize: 15 }} />, label: 'Principal Investigator', value: selectedAward.principalInvestigator },
                        { icon: <PersonIcon sx={{ fontSize: 15 }} />, label: 'Co-Principal Investigator', value: selectedAward.coPrincipalInvestigator },
                        { icon: <AssignmentIcon sx={{ fontSize: 15 }} />, label: 'Department', value: selectedAward.department },
                      ].map(({ icon, label, value }) => (
                        <Box key={label} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <Box sx={{ color: '#8b6cbc', mt: 0.15, flexShrink: 0 }}>{icon}</Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', lineHeight: 1 }}>{label}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>{value}</Typography>
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 1 }}>Timeline</Typography>
                    <Stack spacing={0.85}>
                      {[
                        { label: 'Award Date', value: formatDate(selectedAward.awardDate) },
                        { label: 'Start Date', value: formatDate(selectedAward.startDate) },
                        { label: 'End Date', value: formatDate(selectedAward.endDate) },
                        { label: 'Next Milestone', value: selectedAward.nextMilestone },
                        { label: 'Milestone Due', value: formatDate(selectedAward.nextMilestoneDate) },
                      ].map(({ label, value }) => (
                        <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', flexShrink: 0 }}>{label}</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.78rem', textAlign: 'right' }}>{value}</Typography>
                        </Box>
                      ))}
                    </Stack>
                    <Box sx={{ mt: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>Overall Progress</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: getProjectStatusHex(selectedAward.projectStatus), fontSize: '0.78rem' }}>{selectedAward.completionPercentage}%</Typography>
                      </Box>
                      <LinearProgress value={selectedAward.completionPercentage} variant="determinate" sx={{ height: 7, borderRadius: 4, bgcolor: alpha('#8b6cbc', 0.1), '& .MuiLinearProgress-bar': { bgcolor: getProjectStatusHex(selectedAward.projectStatus), borderRadius: 4 } }} />
                    </Box>
                  </Box>
                </Stack>
              </Box>

              {/* Budget Breakdown */}
              {selectedAward.budgetBreakdown?.length > 0 && (
                <Box sx={{ mb: 2.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 1 }}>Budget Breakdown</Typography>
                  <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#8b6cbc' }}>
                          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Category</TableCell>
                          <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>Allocated</TableCell>
                          <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>Spent</TableCell>
                          <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>Remaining</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 600, minWidth: 110 }}>Usage</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedAward.budgetBreakdown.map((item, idx) => {
                          const pct = item.allocated > 0 ? Math.round((item.spent / item.allocated) * 100) : 0;
                          const barColor = pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#22c55e';
                          return (
                            <TableRow key={idx} hover sx={{ '&:nth-of-type(odd)': { bgcolor: alpha('#8b6cbc', 0.02) } }}>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.84rem' }}>{item.category}</TableCell>
                              <TableCell align="right" sx={{ fontSize: '0.84rem' }}>{formatCurrency(item.allocated)}</TableCell>
                              <TableCell align="right" sx={{ fontSize: '0.84rem' }}>{formatCurrency(item.spent)}</TableCell>
                              <TableCell align="right" sx={{ fontSize: '0.84rem', fontWeight: item.remaining === 0 ? 700 : 400, color: item.remaining === 0 ? '#22c55e' : 'text.primary' }}>{formatCurrency(item.remaining)}</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <LinearProgress value={pct} variant="determinate" sx={{ flex: 1, height: 5, borderRadius: 3, bgcolor: alpha('#8b6cbc', 0.1), '& .MuiLinearProgress-bar': { bgcolor: barColor, borderRadius: 3 } }} />
                                  <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.72rem', minWidth: 28, textAlign: 'right', color: barColor }}>{pct}%</Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Key Personnel */}
              {selectedAward.keyPersonnel?.length > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 1 }}>Key Personnel</Typography>
                  <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#8b6cbc' }}>
                          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Name</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Role</TableCell>
                          <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>Effort</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedAward.keyPersonnel.map((person, idx) => (
                          <TableRow key={idx} hover sx={{ '&:nth-of-type(odd)': { bgcolor: alpha('#8b6cbc', 0.02) } }}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 26, height: 26, fontSize: '0.65rem', bgcolor: '#8b6cbc', flexShrink: 0 }}>{person.name.charAt(0)}</Avatar>
                                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.84rem' }}>{person.name}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell><Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.84rem' }}>{person.role}</Typography></TableCell>
                            <TableCell align="right">
                              <Chip label={person.effort} size="small" sx={{ bgcolor: alpha('#8b6cbc', 0.1), color: '#8b6cbc', fontWeight: 700, height: 20, fontSize: '0.72rem', '& .MuiChip-label': { px: 0.75 } }} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, bgcolor: alpha('#8b6cbc', 0.03), borderTop: '1px solid', borderColor: 'divider' }}>
              <Button onClick={handleCloseViewDialog} variant="outlined" sx={{ borderColor: alpha('#8b6cbc', 0.35), color: '#8b6cbc', borderRadius: 2 }}>
                Close
              </Button>
              <Button variant="contained" startIcon={<DownloadIcon />} sx={{ bgcolor: '#8b6cbc', borderRadius: 2, '&:hover': { bgcolor: '#7a5caa' } }}>
                Export Report
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
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

export default GrantAwardsWonPage;
