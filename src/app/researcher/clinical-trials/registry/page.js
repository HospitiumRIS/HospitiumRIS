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
  Stepper,
  Step,
  StepLabel,
  Paper,
  FormControl,
  InputLabel,
  Select,
  Stack,
  TablePagination,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  CloudSync as RegistryIcon,
  Public as PublicIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  CheckCircle as SyncedIcon,
  Schedule as PendingIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  CalendarToday as CalendarIcon,
  Language as LanguageIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import PageHeader from '../../../../components/common/PageHeader';
import { useAuth } from '../../../../components/AuthProvider';

const registryTypes = {
  CLINICALTRIALS_GOV: { name: 'ClinicalTrials.gov', color: '#2196f3', icon: '🇺🇸' },
  PACTR: { name: 'Pan African Clinical Trials Registry', color: '#4caf50', icon: '🌍' },
  WHO_ICTRP: { name: 'WHO ICTRP', color: '#ff9800', icon: '🌐' },
};

const syncStatusColors = {
  SYNCED: '#4caf50',
  PENDING: '#ff9800',
  ERROR: '#f44336',
  NOT_REGISTERED: '#9e9e9e',
};

export default function RegistryManagementPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [registryFilter, setRegistryFilter] = useState('All Registries');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [sortBy, setSortBy] = useState('Recent');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [stats, setStats] = useState({
    totalRegistrations: 0,
    synced: 0,
    pendingSync: 0,
    notRegistered: 0
  });

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const mockRegistrations = [
        {
          id: 1,
          trialId: 'CT-2024-001',
          title: 'Phase III Trial of Novel Antimalarial Drug',
          registry: 'CLINICALTRIALS_GOV',
          registryId: 'NCT05234567',
          syncStatus: 'SYNCED',
          lastSyncDate: new Date('2024-03-20'),
          registrationDate: new Date('2024-01-15'),
          publicUrl: 'https://clinicaltrials.gov/study/NCT05234567',
          dataCompleteness: 95,
        },
        {
          id: 2,
          trialId: 'CT-2024-001',
          title: 'Phase III Trial of Novel Antimalarial Drug',
          registry: 'PACTR',
          registryId: 'PACTR202401001',
          syncStatus: 'SYNCED',
          lastSyncDate: new Date('2024-03-20'),
          registrationDate: new Date('2024-01-20'),
          publicUrl: 'https://pactr.samrc.ac.za/TrialDisplay.aspx?TrialID=PACTR202401001',
          dataCompleteness: 92,
        },
        {
          id: 3,
          trialId: 'CT-2024-002',
          title: 'Observational Study on HIV Treatment Adherence',
          registry: 'PACTR',
          registryId: 'PACTR202402015',
          syncStatus: 'PENDING',
          lastSyncDate: new Date('2024-03-15'),
          registrationDate: new Date('2024-02-25'),
          publicUrl: 'https://pactr.samrc.ac.za/TrialDisplay.aspx?TrialID=PACTR202402015',
          dataCompleteness: 78,
        },
        {
          id: 4,
          trialId: 'CT-2024-003',
          title: 'Randomized Trial of TB Vaccine Efficacy',
          registry: 'WHO_ICTRP',
          registryId: null,
          syncStatus: 'NOT_REGISTERED',
          lastSyncDate: null,
          registrationDate: null,
          publicUrl: null,
          dataCompleteness: 0,
        },
      ];
      setRegistrations(mockRegistrations);
      
      // Calculate statistics
      const totalRegistrations = mockRegistrations.length;
      const synced = mockRegistrations.filter(r => r.syncStatus === 'SYNCED').length;
      const pendingSync = mockRegistrations.filter(r => r.syncStatus === 'PENDING').length;
      const notRegistered = mockRegistrations.filter(r => r.syncStatus === 'NOT_REGISTERED').length;
      
      setStats({ totalRegistrations, synced, pendingSync, notRegistered });
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, registration) => {
    setMenuAnchor(event.currentTarget);
    setSelectedRegistration(registration);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedRegistration(null);
  };

  const filteredRegistrations = registrations.filter((reg) => {
    const matchesSearch = reg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         reg.trialId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (reg.registryId && reg.registryId.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRegistry = registryFilter === 'All Registries' || reg.registry === registryFilter;
    const matchesStatus = statusFilter === 'All Statuses' || reg.syncStatus === statusFilter;
    return matchesSearch && matchesRegistry && matchesStatus;
  });
  
  // Paginated registrations
  const paginatedRegistrations = filteredRegistrations.slice(
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
    { label: 'Regulatory Reporting' },
  ];

  return (
    <>
      <Box sx={{ width: '100%', mt: 8, mb: 0 }}>
        <PageHeader
          title="Regulatory Reporting"
          description="Prepare submission-ready exports for ClinicalTrials.gov and PACTR"
          icon={<LanguageIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={breadcrumbs}
          actionButton={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/researcher/clinical-trials/registry/register')}
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
              Register Trial
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
                  Total Registrations
                </Typography>
                <RegistryIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {stats.totalRegistrations}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Across all registries
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
                  Synced
                </Typography>
                <SyncedIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {stats.synced}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Successfully synchronized
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
                  Pending Sync
                </Typography>
                <PendingIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {stats.pendingSync}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Awaiting synchronization
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
                  Not Registered
                </Typography>
                <ErrorIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {stats.notRegistered}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Require registration
              </Typography>
            </Paper>
          </Grid>
        </Grid>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box sx={{ fontSize: 32 }}>{registryTypes.CLINICALTRIALS_GOV.icon}</Box>
                    <Box>
                      <Typography variant="h6">ClinicalTrials.gov</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {registrations.filter(r => r.registry === 'CLINICALTRIALS_GOV').length} registrations
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<UploadIcon />}
                    sx={{ borderColor: registryTypes.CLINICALTRIALS_GOV.color, color: registryTypes.CLINICALTRIALS_GOV.color }}
                  >
                    Export for Upload
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box sx={{ fontSize: 32 }}>{registryTypes.PACTR.icon}</Box>
                    <Box>
                      <Typography variant="h6">PACTR</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {registrations.filter(r => r.registry === 'PACTR').length} registrations
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<UploadIcon />}
                    sx={{ borderColor: registryTypes.PACTR.color, color: registryTypes.PACTR.color }}
                  >
                    Export for Upload
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box sx={{ fontSize: 32 }}>{registryTypes.WHO_ICTRP.icon}</Box>
                    <Box>
                      <Typography variant="h6">WHO ICTRP</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {registrations.filter(r => r.registry === 'WHO_ICTRP').length} registrations
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<UploadIcon />}
                    sx={{ borderColor: registryTypes.WHO_ICTRP.color, color: registryTypes.WHO_ICTRP.color }}
                  >
                    Export for Upload
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

        {/* Registrations Table */}
        <Paper sx={{ 
          borderRadius: 4,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
          overflow: 'hidden'
        }}>
          <Box sx={{ p: 3, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <TextField
              fullWidth
              placeholder="Search registrations by trial ID, title, or registry ID..."
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
              <RegistryIcon sx={{ fontSize: 64, color: '#ddd', mb: 3 }} />
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#666' }}>
                Loading registrations...
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
          ) : filteredRegistrations.length === 0 ? (
            <Box sx={{ p: 8, textAlign: 'center' }}>
              <RegistryIcon sx={{ fontSize: 64, color: '#ddd', mb: 3 }} />
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 700, color: '#2c3e50' }}>
                No registrations found
              </Typography>
              <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
                {searchQuery ? 'Try adjusting your search criteria' : 'No registry registrations available'}
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
                      <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Registry</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Registry ID</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Sync Status</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Data Completeness</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Last Sync</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Registration Date</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem', textAlign: 'center' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedRegistrations.map((reg) => (
                        <TableRow key={reg.id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#8b6cbc' }}>
                              {reg.trialId}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{reg.title}</Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <span>{registryTypes[reg.registry].icon}</span>
                              <Chip
                                label={registryTypes[reg.registry].name}
                                size="small"
                                sx={{
                                  backgroundColor: registryTypes[reg.registry].color,
                                  color: 'white',
                                }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            {reg.registryId ? (
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {reg.registryId}
                                </Typography>
                                {reg.publicUrl && (
                                  <Tooltip title="View on Registry">
                                    <IconButton
                                      size="small"
                                      onClick={() => window.open(reg.publicUrl, '_blank')}
                                    >
                                      <PublicIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                            ) : (
                              <Chip label="Not Assigned" size="small" variant="outlined" />
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={
                                reg.syncStatus === 'SYNCED' ? <SyncedIcon /> :
                                reg.syncStatus === 'PENDING' ? <PendingIcon /> :
                                reg.syncStatus === 'ERROR' ? <ErrorIcon /> : undefined
                              }
                              label={reg.syncStatus.replace(/_/g, ' ')}
                              size="small"
                              sx={{
                                backgroundColor: syncStatusColors[reg.syncStatus],
                                color: 'white',
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ flexGrow: 1, minWidth: 80 }}>
                                <Typography variant="caption" color="text.secondary">
                                  {reg.dataCompleteness}%
                                </Typography>
                                <Box
                                  sx={{
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor: '#e0e0e0',
                                    overflow: 'hidden',
                                  }}
                                >
                                  <Box
                                    sx={{
                                      height: '100%',
                                      width: `${reg.dataCompleteness}%`,
                                      backgroundColor: reg.dataCompleteness >= 90 ? '#4caf50' : reg.dataCompleteness >= 70 ? '#ff9800' : '#f44336',
                                    }}
                                  />
                                </Box>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {reg.lastSyncDate ? format(reg.lastSyncDate, 'MMM dd, yyyy') : '-'}
                          </TableCell>
                          <TableCell>
                            {reg.registrationDate ? format(reg.registrationDate, 'MMM dd, yyyy') : '-'}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, reg)}
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
                  count={filteredRegistrations.length}
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
            <RefreshIcon sx={{ mr: 1 }} /> Sync Now
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <DownloadIcon sx={{ mr: 1 }} /> Export Data
          </MenuItem>
          {selectedRegistration?.publicUrl && (
            <MenuItem onClick={() => window.open(selectedRegistration.publicUrl, '_blank')}>
              <PublicIcon sx={{ mr: 1 }} /> View on Registry
            </MenuItem>
          )}
        </Menu>
      </Container>
    </>
  );
}
