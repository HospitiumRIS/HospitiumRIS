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
  Paper,
  FormControl,
  InputLabel,
  Select,
  Stack,
  TablePagination,
  LinearProgress,
  Avatar,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  HealthAndSafety as SafetyIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as ResolvedIcon,
  Schedule as PendingIcon,
  Report as ReportIcon,
  Flag as DeviationIcon,
  Clear as ClearIcon,
  CalendarToday as CalendarIcon,
  LocalHospital as HospitalIcon,
} from '@mui/icons-material';
import { format, differenceInDays } from 'date-fns';
import PageHeader from '../../../../components/common/PageHeader';
import { useAuth } from '../../../../components/AuthProvider';

const severityColors = {
  MILD: '#4caf50',
  MODERATE: '#ff9800',
  SEVERE: '#f44336',
  LIFE_THREATENING: '#d32f2f',
};

const statusColors = {
  REPORTED: '#2196f3',
  UNDER_REVIEW: '#ff9800',
  RESOLVED: '#4caf50',
  PENDING_ACTION: '#f44336',
};

export default function SafetyCompliancePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [safetyEvents, setSafetyEvents] = useState([]);
  const [deviations, setDeviations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Severities');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [sortBy, setSortBy] = useState('Recent');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState('SAE');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [stats, setStats] = useState({
    totalSAEs: 0,
    overdueReports: 0,
    protocolDeviations: 0,
    majorDeviations: 0
  });

  useEffect(() => {
    fetchSafetyData();
  }, []);

  const fetchSafetyData = async () => {
    try {
      setLoading(true);
      const mockSAEs = [
        {
          id: 1,
          saeNumber: 'SAE-2024-001',
          trialId: 'CT-2024-001',
          trialTitle: 'Phase III Trial of Novel Antimalarial Drug',
          participantId: 'P-001-045',
          eventDescription: 'Severe allergic reaction',
          severity: 'SEVERE',
          status: 'REPORTED',
          reportedDate: new Date('2024-03-20'),
          reportingDeadline: new Date('2024-03-27'),
          daysToDeadline: 3,
          reportedBy: 'Dr. Sarah Johnson',
        },
        {
          id: 2,
          saeNumber: 'SAE-2024-002',
          trialId: 'CT-2024-001',
          trialTitle: 'Phase III Trial of Novel Antimalarial Drug',
          participantId: 'P-001-089',
          eventDescription: 'Hospitalization due to fever',
          severity: 'MODERATE',
          status: 'UNDER_REVIEW',
          reportedDate: new Date('2024-03-15'),
          reportingDeadline: new Date('2024-03-22'),
          daysToDeadline: -2,
          reportedBy: 'Dr. Michael Omondi',
        },
        {
          id: 3,
          saeNumber: 'SAE-2024-003',
          trialId: 'CT-2024-002',
          trialTitle: 'Observational Study on HIV Treatment Adherence',
          participantId: 'P-002-023',
          eventDescription: 'Unexpected laboratory abnormality',
          severity: 'MILD',
          status: 'RESOLVED',
          reportedDate: new Date('2024-03-10'),
          reportingDeadline: new Date('2024-03-17'),
          daysToDeadline: -7,
          reportedBy: 'Mary Kamau',
        },
      ];

      const mockDeviations = [
        {
          id: 1,
          deviationNumber: 'PD-2024-001',
          trialId: 'CT-2024-001',
          trialTitle: 'Phase III Trial of Novel Antimalarial Drug',
          deviationType: 'CONSENT_PROCESS',
          description: 'Informed consent obtained after study procedure',
          severity: 'MAJOR',
          status: 'PENDING_ACTION',
          identifiedDate: new Date('2024-03-18'),
          reportedBy: 'Jane Wanjiru',
        },
        {
          id: 2,
          deviationNumber: 'PD-2024-002',
          trialId: 'CT-2024-002',
          trialTitle: 'Observational Study on HIV Treatment Adherence',
          deviationType: 'INCLUSION_CRITERIA',
          description: 'Participant enrolled outside age range',
          severity: 'MINOR',
          status: 'RESOLVED',
          identifiedDate: new Date('2024-03-12'),
          reportedBy: 'Dr. Michael Omondi',
        },
      ];

      setSafetyEvents(mockSAEs);
      setDeviations(mockDeviations);
      
      // Calculate statistics
      const totalSAEs = mockSAEs.length;
      const overdueReports = mockSAEs.filter(e => e.daysToDeadline < 0).length;
      const protocolDeviations = mockDeviations.length;
      const majorDeviations = mockDeviations.filter(d => d.severity === 'MAJOR').length;
      
      setStats({ totalSAEs, overdueReports, protocolDeviations, majorDeviations });
    } catch (error) {
      console.error('Error fetching safety data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, item) => {
    setMenuAnchor(event.currentTarget);
    setSelectedEvent(item);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedEvent(null);
  };

  const filteredData = viewMode === 'SAE' 
    ? safetyEvents.filter((event) => {
        const matchesSearch = event.eventDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             event.saeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             event.trialId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             event.reportedBy.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === 'All Severities' || event.severity === typeFilter;
        const matchesStatus = statusFilter === 'All Statuses' || event.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
      })
    : deviations.filter((dev) => {
        const matchesSearch = dev.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             dev.deviationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             dev.trialId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             dev.reportedBy.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === 'All Severities' || dev.severity === typeFilter;
        const matchesStatus = statusFilter === 'All Statuses' || dev.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
      });
  
  // Paginated data
  const paginatedData = filteredData.slice(
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
    { label: 'Safety & Compliance Desk' },
  ];

  return (
    <>
      <Box sx={{ width: '100%', mt: 8, mb: 0 }}>
        <PageHeader
          title="Safety & Compliance Desk"
          description="Monitor SAE reporting deadlines and protocol deviation flags"
          icon={<HospitalIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={breadcrumbs}
          actionButton={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/researcher/clinical-trials/safety/report')}
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
              Report {viewMode === 'SAE' ? 'SAE' : 'Deviation'}
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
                  Total SAEs
                </Typography>
                <ErrorIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {stats.totalSAEs}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Serious adverse events
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
                  Overdue Reports
                </Typography>
                <WarningIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {stats.overdueReports}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Past reporting deadline
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
                  Protocol Deviations
                </Typography>
                <DeviationIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {stats.protocolDeviations}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Total deviations
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
                  Major Deviations
                </Typography>
                <ReportIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {stats.majorDeviations}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Require immediate action
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* View Mode Toggle */}
        <Paper sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 4,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
        }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newMode) => newMode && setViewMode(newMode)}
            sx={{
              '& .MuiToggleButton-root': {
                px: 4,
                py: 1.5,
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                '&.Mui-selected': {
                  bgcolor: '#8b6cbc',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#7a5caa'
                  }
                }
              }
            }}
          >
            <ToggleButton value="SAE">
              <ErrorIcon sx={{ mr: 1, fontSize: 20 }} />
              Serious Adverse Events
            </ToggleButton>
            <ToggleButton value="DEVIATION">
              <DeviationIcon sx={{ mr: 1, fontSize: 20 }} />
              Protocol Deviations
            </ToggleButton>
          </ToggleButtonGroup>
        </Paper>

        {/* Data Table */}
        <Paper sx={{ 
          borderRadius: 4,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
          overflow: 'hidden'
        }}>
          <Box sx={{ p: 3, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <TextField
              fullWidth
              placeholder={`Search ${viewMode === 'SAE' ? 'SAEs' : 'deviations'} by number, trial ID, or description...`}
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
              <SafetyIcon sx={{ fontSize: 64, color: '#ddd', mb: 3 }} />
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#666' }}>
                Loading safety data...
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
          ) : filteredData.length === 0 ? (
            <Box sx={{ p: 8, textAlign: 'center' }}>
              <SafetyIcon sx={{ fontSize: 64, color: '#ddd', mb: 3 }} />
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 700, color: '#2c3e50' }}>
                No {viewMode === 'SAE' ? 'SAEs' : 'deviations'} found
              </Typography>
              <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
                {searchQuery ? 'Try adjusting your search criteria' : `No ${viewMode === 'SAE' ? 'SAEs' : 'deviations'} available`}
              </Typography>
            </Box>
          ) : viewMode === 'SAE' ? (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                      <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>SAE Number</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Trial</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Participant</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Event Description</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Severity</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Reported Date</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Deadline</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Reported By</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem', textAlign: 'center' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedData.map((event) => (
                        <TableRow key={event.id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#8b6cbc' }}>
                              {event.saeNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {event.trialId}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {event.trialTitle}
                            </Typography>
                          </TableCell>
                          <TableCell>{event.participantId}</TableCell>
                          <TableCell>{event.eventDescription}</TableCell>
                          <TableCell>
                            <Chip
                              label={event.severity}
                              size="small"
                              sx={{
                                backgroundColor: severityColors[event.severity],
                                color: 'white',
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={event.status.replace(/_/g, ' ')}
                              size="small"
                              sx={{
                                backgroundColor: statusColors[event.status],
                                color: 'white',
                              }}
                            />
                          </TableCell>
                          <TableCell>{format(event.reportedDate, 'MMM dd, yyyy')}</TableCell>
                          <TableCell>
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: event.daysToDeadline < 0 ? 'error.main' : event.daysToDeadline <= 3 ? 'warning.main' : 'text.primary'
                                }}
                              >
                                {format(event.reportingDeadline, 'MMM dd, yyyy')}
                              </Typography>
                              {event.daysToDeadline < 0 ? (
                                <Chip label={`${Math.abs(event.daysToDeadline)} days overdue`} size="small" color="error" />
                              ) : event.daysToDeadline <= 3 ? (
                                <Chip label={`${event.daysToDeadline} days left`} size="small" color="warning" />
                              ) : null}
                            </Box>
                          </TableCell>
                          <TableCell>{event.reportedBy}</TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, event)}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={filteredData.length}
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
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                        <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Deviation Number</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Trial</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Description</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Severity</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Identified Date</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Reported By</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem', textAlign: 'center' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedData.map((deviation) => (
                        <TableRow key={deviation.id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#8b6cbc' }}>
                              {deviation.deviationNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {deviation.trialId}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {deviation.trialTitle}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={deviation.deviationType.replace(/_/g, ' ')}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>{deviation.description}</TableCell>
                          <TableCell>
                            <Chip
                              label={deviation.severity}
                              size="small"
                              color={deviation.severity === 'MAJOR' ? 'error' : 'warning'}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={deviation.status.replace(/_/g, ' ')}
                              size="small"
                              sx={{
                                backgroundColor: statusColors[deviation.status],
                                color: 'white',
                              }}
                            />
                          </TableCell>
                          <TableCell>{format(deviation.identifiedDate, 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{deviation.reportedBy}</TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, deviation)}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={filteredData.length}
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
            <EditIcon sx={{ mr: 1 }} /> Edit Report
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <ReportIcon sx={{ mr: 1 }} /> Generate Report
          </MenuItem>
        </Menu>
      </Container>
    </>
  );
}
