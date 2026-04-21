'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress
} from '@mui/material';
import {
  Storage as DatabaseIcon,
  Refresh as RefreshIcon,
  Backup as BackupIcon,
  Restore as RestoreIcon,
  DeleteSweep as CleanupIcon,
  Assessment as AnalyticsIcon,
  CloudDownload as ExportIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import GlobalAdminLayout from '../../../components/GlobalAdmin/GlobalAdminLayout';

const DatabaseManagementPage = () => {
  const theme = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [backupFormat, setBackupFormat] = useState('sql');
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [allTables, setAllTables] = useState([]);
  const [stats, setStats] = useState({
    totalRecords: 0,
    users: 0,
    institutions: 0,
    publications: 0,
    activityLogs: 0,
    databaseSize: '0',
    tableCount: 0
  });
  const [connections, setConnections] = useState({
    active: 0,
    max: 0,
    usage: '0'
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [tableSizes, setTableSizes] = useState([]);

  useEffect(() => {
    if (!authLoading && user?.accountType !== 'GLOBAL_ADMIN') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.accountType === 'GLOBAL_ADMIN') {
      fetchDatabaseData();
    }
  }, [user]);

  const fetchDatabaseData = async () => {
    try {
      setLoading(true);
      const [statsResponse, tablesResponse] = await Promise.all([
        fetch('/api/global-admin/database'),
        fetch('/api/global-admin/database/tables')
      ]);
      
      if (statsResponse.ok) {
        const data = await statsResponse.json();
        setStats(data.stats);
        setConnections(data.connections);
        setRecentActivity(data.recentActivity || []);
        setTableSizes(data.tableSizes || []);
      }

      if (tablesResponse.ok) {
        const tablesData = await tablesResponse.json();
        setAllTables(tablesData.tables || []);
      }
    } catch (error) {
      console.error('Error fetching database data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchDatabaseData();
  };

  const handleBackup = () => {
    setBackupDialogOpen(true);
  };

  const handleCloseBackupDialog = () => {
    setBackupDialogOpen(false);
  };

  const handleConfirmBackup = async () => {
    try {
      setBackupInProgress(true);
      const response = await fetch('/api/global-admin/database/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ format: backupFormat }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Backup created successfully!\nFile: ${data.backup.fileName}\nSize: ${data.backup.size}`);
        setBackupDialogOpen(false);
      } else {
        alert(`Backup failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('Failed to create backup');
    } finally {
      setBackupInProgress(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

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
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                Database Management
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                Monitor and manage database operations
              </Typography>
            </Box>
            <Tooltip title="Refresh data">
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

        {/* Database Stats Cards */}
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
                Total Records
              </Typography>
              <DatabaseIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {stats.totalRecords?.toLocaleString() || 0}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              {stats.users} users, {stats.institutions} institutions
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
                Connections
              </Typography>
              <AnalyticsIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {connections.active}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              {connections.active} / {connections.max} ({connections.usage}%)
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
                Database Size
              </Typography>
              <DatabaseIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {stats.databaseSize} MB
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              {stats.tableCount} tables
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
                Activity Logs
              </Typography>
              <BackupIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {stats.activityLogs?.toLocaleString() || 0}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Activity log entries
            </Typography>
          </Paper>
        </Box>

        {/* Recent Activity */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Recent Database Activity
          </Typography>
          {loading ? (
            <Typography variant="body2" color="text.secondary">Loading...</Typography>
          ) : recentActivity.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {recentActivity.map((activity) => (
                <Box 
                  key={activity.id} 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    p: 1.5,
                    bgcolor: 'background.default',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {activity.action} - {activity.entityType}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      by {activity.user}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(activity.timestamp).toLocaleString()}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">No recent activity</Typography>
          )}
        </Paper>

        {/* All Database Tables */}
        <Paper sx={{ borderRadius: 2, overflow: 'hidden', mb: 3 }}>
          <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Database Tables ({allTables.length})
            </Typography>
          </Box>
          {loading ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <CircularProgress size={24} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Loading tables...
              </Typography>
            </Box>
          ) : allTables.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'primary.main' }}>
                  <TableRow>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Table Name</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }} align="right">Rows</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }} align="right">Columns</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }} align="right">Size</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allTables.map((table) => (
                    <TableRow key={table.name} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {table.name}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {table.rowCount?.toLocaleString() || 0}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {table.columnCount || 0}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="primary.main" fontWeight={600}>
                          {table.size}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 3 }}>
              <Typography variant="body2" color="text.secondary">No tables found</Typography>
            </Box>
          )}
        </Paper>

        {/* Database Operations */}
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Quick Operations
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<BackupIcon />}
              onClick={handleBackup}
            >
              Create Backup
            </Button>
            <Button
              variant="outlined"
              startIcon={<RestoreIcon />}
            >
              Restore Database
            </Button>
            <Button
              variant="outlined"
              startIcon={<CleanupIcon />}
              color="warning"
            >
              Cleanup Logs
            </Button>
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              color="info"
            >
              Export Data
            </Button>
          </Box>
        </Paper>

        {/* Backup Dialog */}
        <Dialog open={backupDialogOpen} onClose={handleCloseBackupDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Create Database Backup</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, mt: 1 }}>
              This will create a full backup of the database. The process may take several minutes.
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              Current database size: {stats.databaseSize} MB
            </Alert>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Backup Format</InputLabel>
              <Select
                value={backupFormat}
                label="Backup Format"
                onChange={(e) => setBackupFormat(e.target.value)}
              >
                <MenuItem value="sql">
                  <Box>
                    <Typography variant="body2" fontWeight={600}>SQL (.sql)</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Plain text SQL dump - Human readable, largest file size
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="custom">
                  <Box>
                    <Typography variant="body2" fontWeight={600}>Custom (.dump)</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Compressed binary format - Recommended for large databases
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="tar">
                  <Box>
                    <Typography variant="body2" fontWeight={600}>TAR (.tar)</Typography>
                    <Typography variant="caption" color="text.secondary">
                      TAR archive format - Good for portability
                    </Typography>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="caption">
                Backups will be saved to the <strong>/backups</strong> directory in your project root.
              </Typography>
            </Alert>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleCloseBackupDialog} disabled={backupInProgress}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmBackup} 
              variant="contained"
              disabled={backupInProgress}
              startIcon={backupInProgress ? <CircularProgress size={16} /> : <BackupIcon />}
            >
              {backupInProgress ? 'Creating Backup...' : 'Create Backup'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </GlobalAdminLayout>
  );
};

export default DatabaseManagementPage;
