'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  LinearProgress,
  IconButton,
  Tooltip,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Alert
} from '@mui/material';
import {
  Assessment as LogsIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Api as ApiIcon,
  Storage as DatabaseIcon,
  Download as DownloadIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import GlobalAdminLayout from '../../../components/GlobalAdmin/GlobalAdminLayout';

const LogsPage = () => {
  const theme = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    byLevel: {},
    byAction: {},
    recentErrors: 0,
    uniqueUsers: 0
  });
  const [filters, setFilters] = useState({
    level: '',
    action: '',
    search: ''
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  useEffect(() => {
    if (!authLoading && user?.accountType !== 'GLOBAL_ADMIN') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.accountType === 'GLOBAL_ADMIN') {
      fetchLogs();
    }
  }, [user, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('limit', '500');
      if (filters.level) params.append('level', filters.level);
      if (filters.action) params.append('action', filters.action);

      const response = await fetch(`/api/global-admin/logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.data.logs || []);
        setStats(data.data.stats || {});
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchLogs();
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'ERROR': return <ErrorIcon fontSize="small" />;
      case 'WARNING': return <WarningIcon fontSize="small" />;
      case 'SUCCESS': return <SuccessIcon fontSize="small" />;
      case 'API_CALL': return <ApiIcon fontSize="small" />;
      case 'DB_OPERATION': return <DatabaseIcon fontSize="small" />;
      default: return <InfoIcon fontSize="small" />;
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'ERROR': return 'error';
      case 'WARNING': return 'warning';
      case 'SUCCESS': return 'success';
      case 'API_CALL': return 'info';
      case 'DB_OPERATION': return 'secondary';
      default: return 'default';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const filteredLogs = logs.filter(log => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        log.message?.toLowerCase().includes(searchLower) ||
        log.metadata?.user?.email?.toLowerCase().includes(searchLower) ||
        log.metadata?.action?.toLowerCase().includes(searchLower) ||
        log.metadata?.ip?.includes(searchLower)
      );
    }
    return true;
  });

  const paginatedLogs = filteredLogs.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (authLoading) {
    return null;
  }

  return (
    <GlobalAdminLayout>
      <Container maxWidth="xl" sx={{ pt: { xs: 3, sm: 4, md: 5 } }}>
        {/* Header */}
        <Box sx={{ 
          mb: 4,
          pb: 3,
          borderBottom: '2px solid',
          borderColor: 'divider'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700, 
                  mb: 1,
                  color: theme.palette.text.primary,
                  letterSpacing: '-0.02em'
                }}
              >
                System Activity Logs
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                Monitor and audit all system activities and user actions
              </Typography>
            </Box>
            <Tooltip title="Refresh logs">
              <IconButton 
                onClick={handleRefresh} 
                sx={{ 
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                  boxShadow: 2
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {loading && <LinearProgress sx={{ mb: 3 }} />}

        {/* Stats Cards */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2.5, 
          mb: 4,
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          '& > *': {
            flex: {
              xs: '1 1 100%',
              sm: '1 1 0'
            },
            minWidth: 0
          }
        }}>
          <Paper sx={{ 
            p: 2, 
            borderRadius: 2,
            bgcolor: theme.palette.primary.main,
            boxShadow: `0 2px 8px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(139, 108, 188, 0.2)'}`,
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
                Total Logs
              </Typography>
              <LogsIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {stats.total.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Activity entries
            </Typography>
          </Paper>

          <Paper sx={{ 
            p: 2, 
            borderRadius: 2,
            bgcolor: theme.palette.primary.main,
            boxShadow: `0 2px 8px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(139, 108, 188, 0.2)'}`,
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
                Recent Errors
              </Typography>
              <ErrorIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {stats.recentErrors}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Last 24 hours
            </Typography>
          </Paper>

          <Paper sx={{ 
            p: 2, 
            borderRadius: 2,
            bgcolor: theme.palette.primary.main,
            boxShadow: `0 2px 8px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(139, 108, 188, 0.2)'}`,
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
                API Calls
              </Typography>
              <ApiIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {(stats.byLevel?.API_CALL || 0).toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Endpoint requests
            </Typography>
          </Paper>

          <Paper sx={{ 
            p: 2, 
            borderRadius: 2,
            bgcolor: theme.palette.primary.main,
            boxShadow: `0 2px 8px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(139, 108, 188, 0.2)'}`,
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
                Active Users
              </Typography>
              <PersonIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {stats.uniqueUsers}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Unique accounts
            </Typography>
          </Paper>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder="Search logs..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: '1 1 300px', minWidth: 0 }}
              size="small"
            />
            
            <FormControl sx={{ flex: '0 0 150px', minWidth: 150 }} size="small">
              <InputLabel>Level</InputLabel>
              <Select
                value={filters.level}
                label="Level"
                onChange={(e) => handleFilterChange('level', e.target.value)}
              >
                <MenuItem value="">All Levels</MenuItem>
                <MenuItem value="ERROR">Error</MenuItem>
                <MenuItem value="WARNING">Warning</MenuItem>
                <MenuItem value="SUCCESS">Success</MenuItem>
                <MenuItem value="API_CALL">API Call</MenuItem>
                <MenuItem value="DB_OPERATION">DB Operation</MenuItem>
                <MenuItem value="INFO">Info</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setFilters({ level: '', action: '', search: '' })}
              sx={{ flex: '0 0 auto' }}
            >
              Clear Filters
            </Button>
          </Box>
        </Paper>

        {/* Logs Table */}
        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'primary.main' }}>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 600, width: '140px' }}>Timestamp</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, width: '100px' }}>Level</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Message</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, width: '180px' }}>User</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, width: '120px' }}>IP Address</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, width: '150px' }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <Typography variant="body2" color="text.secondary">
                        Loading logs...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : paginatedLogs.length > 0 ? (
                  paginatedLogs.map((log, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TimeIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 14 }} />
                          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                            {formatTimestamp(log.timestamp)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getLevelIcon(log.level)}
                          label={log.level}
                          color={getLevelColor(log.level)}
                          size="small"
                          sx={{ fontWeight: 600, fontSize: '0.65rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                          {log.message}
                        </Typography>
                        {log.metadata?.error && (
                          <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5, fontSize: '0.7rem' }}>
                            Error: {log.metadata.error}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.metadata?.user ? (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                              {log.metadata.user.name || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                              {log.metadata.user.email}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            System
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                          {log.metadata?.ip || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {log.metadata?.action && (
                          <Chip
                            label={log.metadata.action}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.65rem', fontWeight: 500 }}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <Typography variant="body2" color="text.secondary">
                        No logs found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={filteredLogs.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </Container>
    </GlobalAdminLayout>
  );
};

export default LogsPage;
