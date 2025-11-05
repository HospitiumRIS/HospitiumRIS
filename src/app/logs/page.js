'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Alert,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  CircularProgress,
  Switch,
  FormControlLabel,
  Avatar
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Api as ApiIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../components/AuthProvider';
import { useRouter } from 'next/navigation';

// Log level colors and icons
const LOG_LEVEL_CONFIG = {
  ERROR: { color: 'error', icon: <ErrorIcon />, label: 'Error' },
  WARNING: { color: 'warning', icon: <WarningIcon />, label: 'Warning' },
  INFO: { color: 'info', icon: <InfoIcon />, label: 'Info' },
  SUCCESS: { color: 'success', icon: <SuccessIcon />, label: 'Success' },
  API_CALL: { color: 'primary', icon: <ApiIcon />, label: 'API Call' },
  DB_OPERATION: { color: 'secondary', icon: <ApiIcon />, label: 'Database' }
};

const LogsPage = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  // State management
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    level: '',
    search: '',
    startDate: '',
    endDate: '',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 0,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [error, setError] = useState('');

  // Check admin access
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    // Only allow RESEARCH_ADMIN, FOUNDATION_ADMIN, and SUPER_ADMIN to access logs
    if (user.accountType !== 'RESEARCH_ADMIN' && 
        user.accountType !== 'FOUNDATION_ADMIN' && 
        user.accountType !== 'SUPER_ADMIN') {
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

  // Fetch logs function
  const fetchLogs = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: (pagination.page + 1).toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      });

      const response = await fetch(`/api/logs?${params}`);
      const data = await response.json();

      if (data.success) {
        setLogs(data.logs);
        setStats(data.stats);
        setPagination(prev => ({
          ...prev,
          total: data.total,
          totalPages: data.totalPages
        }));
      } else {
        setError(data.message || 'Failed to fetch logs');
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError('Network error while fetching logs');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  // Initial load and refresh
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchLogs(false); // Don't show loading spinner for auto-refresh
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPagination(prev => ({ ...prev, page: 0 })); // Reset to first page
  };

  // Handle pagination change
  const handlePageChange = (event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleRowsPerPageChange = (event) => {
    setPagination(prev => ({
      ...prev,
      limit: parseInt(event.target.value, 10),
      page: 0
    }));
  };

  // Clear logs function
  const handleClearLogs = async () => {
    try {
      const response = await fetch('/api/logs?confirm=true', {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setClearDialogOpen(false);
        fetchLogs();
      } else {
        setError(data.message || 'Failed to clear logs');
      }
    } catch (err) {
      console.error('Error clearing logs:', err);
      setError('Network error while clearing logs');
    }
  };

  // Export logs function
  const handleExportLogs = () => {
    const exportData = logs.map(log => ({
      timestamp: log.timestamp,
      level: log.level,
      message: log.message,
      ...log.metadata
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  // Get log level chip
  const getLogLevelChip = (level) => {
    const config = LOG_LEVEL_CONFIG[level] || { color: 'default', icon: null, label: level };
    return (
      <Chip
        size="small"
        color={config.color}
        icon={config.icon}
        label={config.label}
      />
    );
  };

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default, py: 2 }}>
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
        {/* Compact Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 3,
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
              <FilterIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 600, mb: 0.5 }}>
                Activity Logs Monitor
              </Typography>
              <Typography variant="body2" color="text.secondary">
                System activity tracking & analysis
              </Typography>
            </Box>
          </Box>
          
          <Stack direction="row" spacing={1}>
            <Chip 
              label={`${pagination.total} Total Logs`}
              color="primary" 
              variant="outlined"
              size="small"
            />
            {autoRefresh && (
              <Chip 
                label="Auto-refresh ON"
                color="success" 
                variant="outlined"
                size="small"
                icon={<RefreshIcon />}
              />
            )}
          </Stack>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Compact Statistics Cards */}
        {stats.total > 0 && (
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 2, 
            mb: 3 
          }}>
            {/* Total Logs Card */}
            <Card sx={{ 
              flex: '1 1 200px',
              minWidth: 200,
              bgcolor: 'background.paper',
              border: `1px solid ${theme.palette.divider}`,
              '&:hover': { boxShadow: 2 }
            }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                    <ApiIcon fontSize="small" />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {stats.total?.toLocaleString() || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Logs
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Level-specific cards */}
            {Object.entries(stats.levels || {}).map(([level, count]) => (
              <Card key={level} sx={{ 
                flex: '1 1 180px',
                minWidth: 180,
                bgcolor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                '&:hover': { boxShadow: 2 }
              }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 32 }}>
                      {LOG_LEVEL_CONFIG[level]?.icon && React.cloneElement(LOG_LEVEL_CONFIG[level].icon, { 
                        fontSize: 'small',
                        color: LOG_LEVEL_CONFIG[level].color === 'error' ? 'error.main' : 
                               LOG_LEVEL_CONFIG[level].color === 'warning' ? 'warning.main' :
                               LOG_LEVEL_CONFIG[level].color === 'success' ? 'success.main' : 'primary.main'
                      })}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {count.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {LOG_LEVEL_CONFIG[level]?.label || level}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {/* Compact Controls and Filters */}
        <Paper sx={{ 
          p: 2.5, 
          mb: 3,
          border: `1px solid ${theme.palette.divider}`
        }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
              Filters & Controls
            </Typography>
          </Box>
          
          {/* Filters Row */}
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 2, 
            alignItems: 'flex-end',
            mb: 2 
          }}>
            {/* Level Filter */}
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Level</InputLabel>
              <Select
                value={filters.level}
                label="Level"
                onChange={(e) => handleFilterChange('level', e.target.value)}
              >
                <MenuItem value="">All Levels</MenuItem>
                {Object.keys(LOG_LEVEL_CONFIG).map(level => (
                  <MenuItem key={level} value={level}>
                    {LOG_LEVEL_CONFIG[level].label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Search */}
            <TextField
              size="small"
              label="Search logs"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              sx={{ minWidth: 200, flex: '1 1 200px' }}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
              }}
            />

            {/* Date Range */}
            <TextField
              size="small"
              type="date"
              label="Start Date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 150 }}
            />

            <TextField
              size="small"
              type="date"
              label="End Date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 150 }}
            />
          </Box>

          {/* Controls Row */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2 
          }}>
            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Refresh logs">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => fetchLogs()}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
                >
                  Refresh
                </Button>
              </Tooltip>
              
              <Tooltip title="Export logs">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleExportLogs}
                  disabled={logs.length === 0}
                  startIcon={<DownloadIcon />}
                  color="info"
                >
                  Export
                </Button>
              </Tooltip>
              
              <Tooltip title="Clear all logs">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setClearDialogOpen(true)}
                  disabled={logs.length === 0}
                  startIcon={<DeleteIcon />}
                  color="error"
                >
                  Clear
                </Button>
              </Tooltip>
            </Box>

            {/* Auto-refresh toggle */}
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  size="small"
                />
              }
              label={
                <Typography variant="body2">
                  Auto-refresh (10s)
                </Typography>
              }
            />
          </Box>
        </Paper>

        {/* Compact Logs Table */}
        <Paper sx={{ border: `1px solid ${theme.palette.divider}` }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'background.default' }}>
                  <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Timestamp</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Level</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Message</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 1.5 }}>User/Email</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 1.5 }}>IP Address</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        No logs found matching your filters
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log, index) => (
                    <TableRow 
                      key={`${log.timestamp}-${index}`} 
                      hover 
                      sx={{ 
                        '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                        '&:hover': { bgcolor: 'action.selected' }
                      }}
                    >
                      <TableCell sx={{ py: 1 }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {formatTimestamp(log.timestamp)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1 }}>
                        {React.cloneElement(getLogLevelChip(log.level), { size: 'small' })}
                      </TableCell>
                      <TableCell sx={{ py: 1, maxWidth: 300 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: '0.8rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {log.message}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                          {log.metadata?.email || log.metadata?.userId || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1 }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {log.metadata?.ip || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1 }}>
                        <Tooltip title={JSON.stringify(log.metadata || {}, null, 2)}>
                          <Chip
                            size="small"
                            variant="outlined"
                            label="Details"
                            onClick={() => {
                              // Could open a detail dialog
                              console.log('Log details:', log);
                            }}
                            sx={{ 
                              fontSize: '0.7rem',
                              height: 24,
                              '& .MuiChip-label': { px: 1 }
                            }}
                          />
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Compact Pagination */}
          {logs.length > 0 && (
            <Box sx={{ 
              borderTop: `1px solid ${theme.palette.divider}`,
              bgcolor: 'background.default'
            }}>
              <TablePagination
                component="div"
                count={pagination.total}
                page={pagination.page}
                onPageChange={handlePageChange}
                rowsPerPage={pagination.limit}
                onRowsPerPageChange={handleRowsPerPageChange}
                rowsPerPageOptions={[25, 50, 100, 200]}
                size="small"
                sx={{ 
                  '.MuiTablePagination-toolbar': { 
                    minHeight: 48,
                    px: 2
                  },
                  '.MuiTablePagination-caption': {
                    fontSize: '0.8rem'
                  }
                }}
              />
            </Box>
          )}
        </Paper>

        {/* Compact Clear Logs Dialog */}
        <Dialog 
          open={clearDialogOpen} 
          onClose={() => setClearDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <DeleteIcon color="error" />
              <Typography variant="h6">Clear All Logs</Typography>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ py: 2 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              This action cannot be undone. A backup will be created automatically.
            </Alert>
            <Typography variant="body2">
              Are you sure you want to clear all activity logs? This will permanently remove 
              all log entries from the system while creating a backup file.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button 
              onClick={() => setClearDialogOpen(false)}
              variant="outlined"
              size="small"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleClearLogs} 
              color="error" 
              variant="contained"
              size="small"
              startIcon={<DeleteIcon />}
            >
              Clear Logs
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default LogsPage;
