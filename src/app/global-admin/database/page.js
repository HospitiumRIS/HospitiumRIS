'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
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
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Storage as DatabaseIcon,
  Refresh as RefreshIcon,
  Backup as BackupIcon,
  RestorePage as RestoreIcon,
  DeleteSweep as CleanupIcon,
  Analytics as AnalyticsIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
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
  const [loading, setLoading] = useState(false);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [databaseStats, setDatabaseStats] = useState({
    totalSize: '2.4 GB',
    tables: 45,
    records: 125430,
    lastBackup: '2 hours ago'
  });
  const [tables, setTables] = useState([
    { name: 'users', records: 1250, size: '45 MB', status: 'healthy' },
    { name: 'institutions', records: 87, size: '12 MB', status: 'healthy' },
    { name: 'manuscripts', records: 3420, size: '890 MB', status: 'healthy' },
    { name: 'proposals', records: 2150, size: '560 MB', status: 'healthy' },
    { name: 'publications', records: 1890, size: '420 MB', status: 'healthy' },
    { name: 'activity_logs', records: 98450, size: '340 MB', status: 'warning' }
  ]);

  useEffect(() => {
    if (!authLoading && user?.accountType !== 'GLOBAL_ADMIN') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const handleBackup = () => {
    setBackupDialogOpen(true);
  };

  const handleCloseBackupDialog = () => {
    setBackupDialogOpen(false);
  };

  const handleConfirmBackup = () => {
    console.log('Creating database backup...');
    setBackupDialogOpen(false);
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
      <Container maxWidth="xl">
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
                Database Size
              </Typography>
              <DatabaseIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {databaseStats.totalSize}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Total storage used
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
                Total Tables
              </Typography>
              <AnalyticsIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {databaseStats.tables}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Database tables
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
                Total Records
              </Typography>
              <AnalyticsIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {databaseStats.records.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Database records
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
                Last Backup
              </Typography>
              <BackupIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              2h
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              {databaseStats.lastBackup}
            </Typography>
          </Paper>
        </Box>

        {/* Quick Actions */}
        <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Database Operations
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<BackupIcon />}
              onClick={handleBackup}
              sx={{ textTransform: 'none' }}
            >
              Create Backup
            </Button>
            <Button
              variant="outlined"
              startIcon={<RestoreIcon />}
              sx={{ textTransform: 'none' }}
            >
              Restore Database
            </Button>
            <Button
              variant="outlined"
              startIcon={<CleanupIcon />}
              sx={{ textTransform: 'none' }}
            >
              Cleanup Old Data
            </Button>
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              sx={{ textTransform: 'none' }}
            >
              Export Data
            </Button>
          </Box>
        </Paper>

        {/* Database Tables */}
        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Database Tables
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'primary.main' }}>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Table Name</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Records</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Size</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tables.map((table) => (
                  <TableRow key={table.name} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {table.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{table.records.toLocaleString()}</TableCell>
                    <TableCell>{table.size}</TableCell>
                    <TableCell>
                      <Chip 
                        label={table.status.toUpperCase()} 
                        color={getStatusColor(table.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Optimize">
                        <IconButton size="small" color="primary">
                          <AnalyticsIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Export">
                        <IconButton size="small" color="primary">
                          <ExportIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Backup Confirmation Dialog */}
        <Dialog open={backupDialogOpen} onClose={handleCloseBackupDialog}>
          <DialogTitle>Create Database Backup</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              This will create a full backup of the database. The process may take several minutes.
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Current database size: {databaseStats.totalSize}
            </Alert>
            <TextField
              fullWidth
              label="Backup Name (Optional)"
              placeholder="backup-2026-04-14"
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseBackupDialog}>Cancel</Button>
            <Button onClick={handleConfirmBackup} variant="contained">
              Create Backup
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </GlobalAdminLayout>
  );
};

export default DatabaseManagementPage;
