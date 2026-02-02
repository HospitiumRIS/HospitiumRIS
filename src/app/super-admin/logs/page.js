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
  Avatar,
  Card,
  CardContent
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Api as ApiIcon,
  Article as LogsIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import SuperAdminLayout from '../../../components/SuperAdmin/SuperAdminLayout';

// Log level colors and icons
const LOG_LEVEL_CONFIG = {
  ERROR: { color: 'error', icon: <ErrorIcon />, label: 'Error', bgColor: '#fee2e2', textColor: '#dc2626' },
  WARNING: { color: 'warning', icon: <WarningIcon />, label: 'Warning', bgColor: '#fef3c7', textColor: '#d97706' },
  INFO: { color: 'info', icon: <InfoIcon />, label: 'Info', bgColor: '#dbeafe', textColor: '#2563eb' },
  SUCCESS: { color: 'success', icon: <SuccessIcon />, label: 'Success', bgColor: '#dcfce7', textColor: '#16a34a' },
  API_CALL: { color: 'primary', icon: <ApiIcon />, label: 'API Call', bgColor: '#f3e8ff', textColor: '#8b6cbc' },
  DB_OPERATION: { color: 'secondary', icon: <ApiIcon />, label: 'Database', bgColor: '#e0e7ff', textColor: '#6366f1' }
};

const LogsPage = () => {
  const theme = useTheme();
  const { user, isLoading: authLoading } = useAuth();
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
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [error, setError] = useState('');

  // Check Super Admin access
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (user.accountType !== 'SUPER_ADMIN') {
      router.push('/dashboard');
      return;
    }
  }, [user, router, authLoading]);

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
    if (user?.accountType === 'SUPER_ADMIN') {
      fetchLogs();
    }
  }, [fetchLogs, user]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchLogs(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPagination(prev => ({ ...prev, page: 0 }));
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
    const config = LOG_LEVEL_CONFIG[level] || { bgColor: '#f3f4f6', textColor: '#6b7280', label: level };
    return (
      <Chip
        size="small"
        label={config.label}
        sx={{
          bgcolor: config.bgColor,
          color: config.textColor,
          fontWeight: 600,
          fontSize: '0.75rem',
          height: '24px'
        }}
      />
    );
  };

  if (!user || user.accountType !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <SuperAdminLayout>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
        {/* Professional Header */}
        <Box sx={{ 
          mb: 4,
          pb: 3,
          borderBottom: '2px solid',
          borderColor: 'divider'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#8b6cbc', width: 56, height: 56, boxShadow: '0 4px 12px rgba(139, 108, 188, 0.3)' }}>
                <LogsIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 700,
                    mb: 0.5,
                    letterSpacing: '-0.02em'
                  }}
                >
                  Activity Logs
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Monitor system activity and track all operations
                </Typography>
              </Box>
            </Box>
            
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={() => fetchLogs()}
              disabled={loading}
              sx={{
                bgcolor: '#8b6cbc',
                '&:hover': {
                  bgcolor: '#7a5caa'
                },
                boxShadow: '0 4px 12px rgba(139, 108, 188, 0.3)'
              }}
            >
              Refresh Data
            </Button>
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Statistics Cards */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
              Log Statistics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Overview of system activity and log levels
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {/* Total Logs */}
            <Box sx={{ flex: '1 1 calc(16.666% - 14px)', minWidth: '150px' }}>
              <Paper sx={{ 
                p: 2,
                borderRadius: 2,
                border: '1px solid #e5e7eb',
                boxShadow: 'none',
                transition: 'all 0.2s',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  transform: 'translateY(-2px)'
                }
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Box sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1.5,
                    bgcolor: '#f3e8ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#8b6cbc'
                  }}>
                    <LogsIcon fontSize="small" />
                  </Box>
                  <Typography variant="caption" sx={{ 
                    color: '#6b7280',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    fontSize: '0.65rem',
                    lineHeight: 1.2
                  }}>
                    Total Logs
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ 
                  fontWeight: 700, 
                  color: '#2c3e50',
                  fontSize: '1.25rem'
                }}>
                  {stats.total?.toLocaleString() || 0}
                </Typography>
              </Paper>
            </Box>

            {/* Level-specific cards */}
            {Object.entries(stats.levels || {}).map(([level, count]) => {
              const config = LOG_LEVEL_CONFIG[level] || { bgColor: '#f3f4f6', textColor: '#6b7280', label: level, icon: <InfoIcon /> };
              
              return (
                <Box key={level} sx={{ flex: '1 1 calc(16.666% - 14px)', minWidth: '150px' }}>
                  <Paper sx={{ 
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid #e5e7eb',
                    boxShadow: 'none',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      transform: 'translateY(-2px)'
                    }
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <Box sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1.5,
                        bgcolor: config.bgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: config.textColor
                      }}>
                        {React.cloneElement(config.icon, { fontSize: 'small' })}
                      </Box>
                      <Typography variant="caption" sx={{ 
                        color: '#6b7280',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        fontSize: '0.65rem',
                        lineHeight: 1.2
                      }}>
                        {config.label}
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 700, 
                      color: '#2c3e50',
                      fontSize: '1.25rem'
                    }}>
                      {count.toLocaleString()}
                    </Typography>
                  </Paper>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Filters and Controls */}
        <Paper sx={{ 
          p: 3, 
          mb: 3,
          borderRadius: 2,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb'
        }}>
          {/* Filters Row */}
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 2, 
            alignItems: 'flex-end',
            mb: 2 
          }}>
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
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleExportLogs}
                disabled={logs.length === 0}
                startIcon={<DownloadIcon />}
                sx={{
                  borderColor: '#8b6cbc',
                  color: '#8b6cbc',
                  '&:hover': {
                    borderColor: '#7a5caa',
                    bgcolor: '#f3e8ff'
                  }
                }}
              >
                Export
              </Button>
              
              <Button
                variant="outlined"
                size="small"
                onClick={() => setClearDialogOpen(true)}
                disabled={logs.length === 0}
                startIcon={<DeleteIcon />}
                color="error"
              >
                Clear All
              </Button>
            </Box>

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

        {/* Logs Table */}
        <Paper sx={{ 
          borderRadius: 2,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <TableCell sx={{ fontWeight: 700, py: 2, fontSize: '0.875rem', color: '#1f2937' }}>Timestamp</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 2, fontSize: '0.875rem', color: '#1f2937' }}>Level</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 2, fontSize: '0.875rem', color: '#1f2937' }}>Message</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 2, fontSize: '0.875rem', color: '#1f2937' }}>User/Email</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 2, fontSize: '0.875rem', color: '#1f2937' }}>IP Address</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 2, fontSize: '0.875rem', color: '#1f2937', textAlign: 'center' }}>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <CircularProgress />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Loading logs...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <LogsIcon sx={{ fontSize: 48, color: '#d1d5db', mb: 2 }} />
                      <Typography variant="h6" sx={{ color: '#6b7280', mb: 1 }}>
                        No Logs Found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        No logs match your current filters
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log, index) => (
                    <TableRow 
                      key={`${log.timestamp}-${index}`}
                      sx={{ 
                        '&:hover': { bgcolor: '#f5f3f7' },
                        transition: 'all 0.2s ease',
                        '& td': { borderBottom: '1px solid #f3f4f6' }
                      }}
                    >
                      <TableCell sx={{ py: 2 }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#6b7280' }}>
                          {formatTimestamp(log.timestamp)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        {getLogLevelChip(log.level)}
                      </TableCell>
                      <TableCell sx={{ py: 2, maxWidth: 400 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: '0.875rem',
                            color: '#374151',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {log.message}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {log.metadata?.email || log.metadata?.userId || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#6b7280' }}>
                          {log.metadata?.ip || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2, textAlign: 'center' }}>
                        <Tooltip title={<pre style={{ margin: 0, fontSize: '0.75rem' }}>{JSON.stringify(log.metadata || {}, null, 2)}</pre>} arrow>
                          <IconButton
                            size="small"
                            sx={{ 
                              color: '#8b6cbc',
                              '&:hover': {
                                bgcolor: 'rgba(139, 108, 188, 0.1)'
                              }
                            }}
                          >
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {logs.length > 0 && (
            <Box sx={{ 
              borderTop: '1px solid #e5e7eb',
              bgcolor: '#f9fafb'
            }}>
              <TablePagination
                component="div"
                count={pagination.total}
                page={pagination.page}
                onPageChange={handlePageChange}
                rowsPerPage={pagination.limit}
                onRowsPerPageChange={handleRowsPerPageChange}
                rowsPerPageOptions={[20, 50, 100]}
                sx={{ 
                  '.MuiTablePagination-toolbar': { 
                    minHeight: 52,
                    px: 2
                  }
                }}
              />
            </Box>
          )}
        </Paper>

        {/* Clear Logs Dialog */}
        <Dialog 
          open={clearDialogOpen} 
          onClose={() => setClearDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Stack direction="row" alignItems="center" spacing={1}>
              <DeleteIcon color="error" />
              <Typography variant="h6">Clear All Logs</Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>
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
            >
              Cancel
            </Button>
            <Button 
              onClick={handleClearLogs} 
              color="error" 
              variant="contained"
              startIcon={<DeleteIcon />}
            >
              Clear Logs
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </SuperAdminLayout>
  );
};

export default LogsPage;
