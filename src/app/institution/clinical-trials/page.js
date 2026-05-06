'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Stack,
  LinearProgress,
  IconButton,
  Tooltip,
  MenuItem,
  Grid,
  CircularProgress,
  Avatar,
  Divider,
  Badge,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Science as TrialIcon,
  CheckCircle as ActiveIcon,
  Cancel as SuspendedIcon,
  Archive as ClosedIcon,
  Lightbulb as ConceptIcon,
  Visibility as ViewIcon,
  Assessment as DashboardIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  VerifiedUser as ComplianceIcon,
  BarChart as ChartIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';

export default function InstitutionClinicalTrialsPage() {
  const router = useRouter();
  const [trials, setTrials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchTrials();
  }, []);

  const fetchTrials = async () => {
    setLoading(true);
    // Mock data - replace with actual API call
    setTimeout(() => {
      setTrials([
        {
          id: 'CT-001',
          title: 'Phase III Malaria Vaccine Trial',
          pi: 'Dr. Jane Omondi',
          status: 'ACTIVE',
          phase: 'Phase III',
          ethicsStatus: 'APPROVED',
          trn: 'PACTR202401001',
          enrollmentProgress: 75,
          targetEnrollment: 500,
          currentEnrollment: 375,
        },
        {
          id: 'CT-002',
          title: 'TB Drug Resistance Study',
          pi: 'Dr. Samuel Mwangi',
          status: 'ACTIVE',
          phase: 'Phase II',
          ethicsStatus: 'APPROVED',
          trn: 'NCT05123456',
          enrollmentProgress: 45,
          targetEnrollment: 200,
          currentEnrollment: 90,
        },
        {
          id: 'CT-003',
          title: 'HIV Prevention Trial',
          pi: 'Dr. Mary Wanjiru',
          status: 'CONCEPT',
          phase: 'Phase I',
          ethicsStatus: 'PENDING',
          trn: null,
          enrollmentProgress: 0,
          targetEnrollment: 150,
          currentEnrollment: 0,
        },
        {
          id: 'CT-004',
          title: 'Diabetes Management Study',
          pi: 'Dr. John Kamau',
          status: 'SUSPENDED',
          phase: 'Phase II',
          ethicsStatus: 'EXPIRED',
          trn: 'PACTR202301002',
          enrollmentProgress: 30,
          targetEnrollment: 300,
          currentEnrollment: 90,
        },
        {
          id: 'CT-005',
          title: 'Maternal Health Intervention',
          pi: 'Dr. Grace Akinyi',
          status: 'CLOSED',
          phase: 'Phase III',
          ethicsStatus: 'APPROVED',
          trn: 'NCT04987654',
          enrollmentProgress: 100,
          targetEnrollment: 600,
          currentEnrollment: 600,
        },
      ]);
      setLoading(false);
    }, 800);
  };

  const getStatusColor = (status) => {
    const colors = {
      ACTIVE: 'success',
      CONCEPT: 'info',
      SUSPENDED: 'warning',
      CLOSED: 'default',
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status) => {
    const icons = {
      ACTIVE: <ActiveIcon fontSize="small" />,
      CONCEPT: <ConceptIcon fontSize="small" />,
      SUSPENDED: <SuspendedIcon fontSize="small" />,
      CLOSED: <ClosedIcon fontSize="small" />,
    };
    return icons[status] || null;
  };

  const getEthicsStatusColor = (status) => {
    const colors = {
      APPROVED: 'success',
      PENDING: 'warning',
      EXPIRED: 'error',
      UNDER_REVIEW: 'info',
    };
    return colors[status] || 'default';
  };

  const filteredTrials = trials.filter((trial) => {
    const matchesSearch =
      trial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trial.pi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trial.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || trial.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <Box sx={{ width: '100%', mt: 8, mb: 0 }}>
        <PageHeader
          title="Clinical Trials Portfolio"
          description="Institutional oversight of all clinical trial activities"
          icon={<TrialIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Clinical Trials', path: '/institution/clinical-trials' },
          ]}
          actionButton={
            <Button
              variant="contained"
              startIcon={<DashboardIcon />}
              onClick={() => router.push('/institution/clinical-trials/dashboard')}
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
              Reports & Analytics
            </Button>
          }
        />
      </Box>

      <Container maxWidth="xl" sx={{ py: 6, backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 300px)' }}>

        {/* Statistics Cards */}
        <Box sx={{ display: 'flex', gap: 2.5, mb: 4, flexWrap: 'wrap' }}>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 10px)', md: '1 1 calc(25% - 15px)' } }}>
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
                  Active Trials
                </Typography>
                <ActiveIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {trials.filter((t) => t.status === 'ACTIVE').length}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Currently running
              </Typography>
            </Paper>
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 10px)', md: '1 1 calc(25% - 15px)' } }}>
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
                  Total Enrollment
                </Typography>
                <PeopleIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {trials.reduce((sum, t) => sum + t.currentEnrollment, 0)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Participants enrolled
              </Typography>
            </Paper>
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 10px)', md: '1 1 calc(25% - 15px)' } }}>
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
                  Compliance Rate
                </Typography>
                <ComplianceIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                92%
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Ethics compliance
              </Typography>
            </Paper>
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 10px)', md: '1 1 calc(25% - 15px)' } }}>
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
                  Avg Enrollment
                </Typography>
                <ChartIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {Math.round((trials.reduce((sum, t) => sum + t.enrollmentProgress, 0) / trials.length) || 0)}%
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Progress rate
              </Typography>
            </Paper>
          </Box>
        </Box>

        {/* Filters and Search */}
        <Paper sx={{ mb: 3, p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              placeholder="Search trials, PI, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#8b6cbc' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                flexGrow: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: '#8b6cbc',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#8b6cbc',
                  },
                }
              }}
              size="small"
            />
            <TextField
              select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ 
                minWidth: 180,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: '#8b6cbc',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#8b6cbc',
                  },
                }
              }}
              size="small"
            >
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="CONCEPT">Concept</MenuItem>
              <MenuItem value="SUSPENDED">Suspended</MenuItem>
              <MenuItem value="CLOSED">Closed</MenuItem>
            </TextField>
          </Stack>
        </Paper>

        {/* Trials Table */}
        <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <Box sx={{ p: 3, bgcolor: 'white', borderBottom: '1px solid #e5e7eb' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#8b6cbc', width: 40, height: 40 }}>
                  <TrialIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                    Trial Portfolio
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                    {filteredTrials.length} {filteredTrials.length === 1 ? 'trial' : 'trials'} found
                  </Typography>
                </Box>
              </Box>
              <Chip 
                label={`${filteredTrials.length} Total`} 
                sx={{ 
                  bgcolor: '#8b6cbc', 
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }} 
              />
            </Box>
          </Box>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress sx={{ color: '#8b6cbc' }} />
            </Box>
          ) : (
            <TableContainer sx={{ bgcolor: 'white' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f9fafb' }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#6b7280' }}>Trial ID</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#6b7280' }}>Title</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#6b7280' }}>Principal Investigator</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#6b7280' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#6b7280' }}>Phase</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#6b7280' }}>Ethics</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#6b7280' }}>TRN</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#6b7280' }}>Enrollment</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#6b7280' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTrials.map((trial) => (
                    <TableRow 
                      key={trial.id} 
                      sx={{ 
                        '&:hover': { 
                          bgcolor: '#f9fafb',
                          cursor: 'pointer'
                        },
                        borderBottom: '1px solid #f3f4f6'
                      }}
                    >
                      <TableCell>
                        <Chip 
                          label={trial.id} 
                          size="small"
                          sx={{ 
                            fontWeight: 700, 
                            bgcolor: '#8b6cbc15',
                            color: '#8b6cbc',
                            fontFamily: 'monospace',
                            fontSize: '0.75rem'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {trial.title}
                        </Typography>
                      </TableCell>
                      <TableCell>{trial.pi}</TableCell>
                      <TableCell>
                        <Chip
                          label={trial.status}
                          color={getStatusColor(trial.status)}
                          size="small"
                          icon={getStatusIcon(trial.status)}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={trial.phase} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={trial.ethicsStatus}
                          color={getEthicsStatusColor(trial.ethicsStatus)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {trial.trn || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ minWidth: 120 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption">
                              {trial.currentEnrollment}/{trial.targetEnrollment}
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              {trial.enrollmentProgress}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={trial.enrollmentProgress}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: '#e5e7eb',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: trial.enrollmentProgress >= 75 ? '#10b981' : trial.enrollmentProgress >= 50 ? '#f59e0b' : '#ef4444',
                              },
                            }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => router.push(`/institution/clinical-trials/${trial.id}`)}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Container>
    </>
  );
}
