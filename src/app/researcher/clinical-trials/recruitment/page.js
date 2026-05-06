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
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Tooltip,
  LinearProgress,
  Paper,
  FormControl,
  InputLabel,
  Select,
  Stack,
  TablePagination,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  PeopleAlt as RecruitmentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as EnrolledIcon,
  Cancel as ScreenFailIcon,
  Assessment as AssessmentIcon,
  Clear as ClearIcon,
  CalendarToday as CalendarIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import PageHeader from '../../../../components/common/PageHeader';
import { useAuth } from '../../../../components/AuthProvider';

export default function RecruitmentProgressPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [trials, setTrials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [sortBy, setSortBy] = useState('Recent');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedTrial, setSelectedTrial] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [stats, setStats] = useState({
    totalEnrolled: 0,
    targetEnrollment: 0,
    screeningFailures: 0,
    activeSites: 0
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
          targetEnrollment: 500,
          currentEnrollment: 342,
          screeningFailures: 58,
          screenedTotal: 400,
          enrollmentRate: 68.4,
          sitesActive: 5,
          sitesTotal: 5,
          avgEnrollmentPerMonth: 28.5,
          status: 'ON_TRACK',
          expectedCompletion: new Date('2024-12-31'),
        },
        {
          id: 2,
          trialId: 'CT-2024-002',
          title: 'Observational Study on HIV Treatment Adherence',
          targetEnrollment: 300,
          currentEnrollment: 145,
          screeningFailures: 22,
          screenedTotal: 167,
          enrollmentRate: 48.3,
          sitesActive: 3,
          sitesTotal: 4,
          avgEnrollmentPerMonth: 18.1,
          status: 'BEHIND',
          expectedCompletion: new Date('2024-11-30'),
        },
        {
          id: 3,
          trialId: 'CT-2024-003',
          title: 'Randomized Trial of TB Vaccine Efficacy',
          targetEnrollment: 200,
          currentEnrollment: 178,
          screeningFailures: 15,
          screenedTotal: 193,
          enrollmentRate: 89.0,
          sitesActive: 2,
          sitesTotal: 2,
          avgEnrollmentPerMonth: 35.6,
          status: 'AHEAD',
          expectedCompletion: new Date('2024-09-30'),
        },
      ];
      setTrials(mockTrials);
      
      // Calculate statistics
      const totalEnrolled = mockTrials.reduce((sum, t) => sum + t.currentEnrollment, 0);
      const targetEnrollment = mockTrials.reduce((sum, t) => sum + t.targetEnrollment, 0);
      const screeningFailures = mockTrials.reduce((sum, t) => sum + t.screeningFailures, 0);
      const activeSites = mockTrials.reduce((sum, t) => sum + t.sitesActive, 0);
      
      setStats({ totalEnrolled, targetEnrollment, screeningFailures, activeSites });
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
                         trial.trialId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All Statuses' || trial.status === statusFilter;
    return matchesSearch && matchesStatus;
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
    { label: 'Trial Progress & Recruitment' },
  ];

  const statusColors = {
    ON_TRACK: '#4caf50',
    BEHIND: '#ff9800',
    AHEAD: '#2196f3',
  };

  return (
    <>
      <Box sx={{ width: '100%', mt: 8, mb: 0 }}>
        <PageHeader
          title="Trial Progress & Recruitment"
          description="Track enrollment metrics and site performance benchmarks"
          icon={<PersonAddIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={breadcrumbs}
          actionButton={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/researcher/clinical-trials/recruitment/add')}
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
              Record Enrollment
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
                  Total Enrolled
                </Typography>
                <EnrolledIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {stats.totalEnrolled}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Across all trials
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
                  Target Enrollment
                </Typography>
                <TrendingUpIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {stats.targetEnrollment}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Total target across trials
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
                  Screening Failures
                </Typography>
                <ScreenFailIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {stats.screeningFailures}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Total screen failures
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
                  Active Sites
                </Typography>
                <AssessmentIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {stats.activeSites}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Sites currently enrolling
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Trials Table */}
        <Paper sx={{ 
          borderRadius: 4,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
          overflow: 'hidden'
        }}>
          <Box sx={{ p: 3, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <TextField
              fullWidth
              placeholder="Search trials by ID or title..."
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

          {loading ? (
            <Box sx={{ p: 8, textAlign: 'center' }}>
              <RecruitmentIcon sx={{ fontSize: 64, color: '#ddd', mb: 3 }} />
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#666' }}>
                Loading trials...
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
            </Box>
          ) : filteredTrials.length === 0 ? (
            <Box sx={{ p: 8, textAlign: 'center' }}>
              <RecruitmentIcon sx={{ fontSize: 64, color: '#ddd', mb: 3 }} />
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 700, color: '#2c3e50' }}>
                No trials found
              </Typography>
              <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
                {searchQuery ? 'Try adjusting your search criteria' : 'No trials available'}
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                      <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Trial ID</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Title</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Enrollment Progress</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Screened</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Screen Failures</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Active Sites</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Avg/Month</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Expected Completion</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem', textAlign: 'center' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedTrials.map((trial) => (
                        <TableRow key={trial.id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#8b6cbc' }}>
                              {trial.trialId}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{trial.title}</Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {trial.currentEnrollment} / {trial.targetEnrollment}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  ({trial.enrollmentRate.toFixed(1)}%)
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={trial.enrollmentRate}
                                sx={{
                                  height: 8,
                                  borderRadius: 4,
                                  backgroundColor: '#e0e0e0',
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: statusColors[trial.status],
                                  },
                                }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={<EnrolledIcon />}
                              label={trial.screenedTotal}
                              size="small"
                              color="primary"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={<ScreenFailIcon />}
                              label={trial.screeningFailures}
                              size="small"
                              color="error"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            {trial.sitesActive} / {trial.sitesTotal}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {trial.status === 'AHEAD' ? (
                                <TrendingUpIcon sx={{ color: '#4caf50', fontSize: 18 }} />
                              ) : trial.status === 'BEHIND' ? (
                                <TrendingDownIcon sx={{ color: '#ff9800', fontSize: 18 }} />
                              ) : null}
                              <Typography variant="body2">{trial.avgEnrollmentPerMonth.toFixed(1)}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={trial.status.replace(/_/g, ' ')}
                              size="small"
                              sx={{
                                backgroundColor: statusColors[trial.status],
                                color: 'white',
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <CalendarIcon sx={{ fontSize: 16, color: '#8b6cbc' }} />
                              <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#2c3e50' }}>
                                {format(trial.expectedCompletion, 'MMM dd, yyyy')}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1} justifyContent="center">
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  onClick={() => router.push(`/researcher/clinical-trials/recruitment/view/${trial.id}`)}
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
              </>
            )}
          </Paper>

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleMenuClose}>
            <ViewIcon sx={{ mr: 1 }} /> View Details
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <EditIcon sx={{ mr: 1 }} /> Update Enrollment
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <AssessmentIcon sx={{ mr: 1 }} /> Site Performance Report
          </MenuItem>
        </Menu>
      </Container>
    </>
  );
}
