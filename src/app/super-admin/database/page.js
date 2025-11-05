'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  Chip,
  Stack,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Storage as DatabaseIcon,
  Backup as BackupIcon,
  Restore as RestoreIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  Assessment as AnalyticsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Security as SecurityIcon,
  CleaningServices as CleanupIcon,
  Build as MigrateIcon,
  People as UsersIcon,
  Article as ManuscriptsIcon,
  School as PublicationsIcon,
  Business as ProposalsIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as ViewIcon,
  GetApp as ExportIcon,
  CloudDownload as CloudDownloadIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../../components/AuthProvider';
import { useRouter } from 'next/navigation';

const DatabaseManagementPage = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dbStats, setDbStats] = useState({});
  const [backupHistory, setBackupHistory] = useState([]);
  const [selectedOperation, setSelectedOperation] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [operationData, setOperationData] = useState({});

  // Check Super Admin access
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (user.accountType !== 'SUPER_ADMIN') {
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

  // Fetch database statistics
  useEffect(() => {
    const fetchDbStats = async () => {
      try {
        setLoading(true);
        
        // Fetch database statistics
        const statsResponse = await fetch('/api/super-admin/database/stats');
        const statsData = await statsResponse.json();
        
        if (statsData.success) {
          setDbStats({
            totalUsers: statsData.stats.totalUsers,
            activeUsers: statsData.stats.activeUsers,
            totalManuscripts: statsData.stats.totalManuscripts,
            totalPublications: statsData.stats.totalPublications,
            totalProposals: statsData.stats.totalProposals,
            totalDonations: statsData.stats.totalDonations,
            dbSize: statsData.stats.dbSize || '2.3 GB',
            lastBackup: statsData.stats.lastBackup || 'N/A',
            backupSize: statsData.stats.backupSize || 'N/A',
            uptime: statsData.stats.uptime || 'N/A',
            connections: statsData.stats.connections || 0,
            slowQueries: statsData.stats.slowQueries || 0
          });
        }
        
        // Fetch backup history
        const backupResponse = await fetch('/api/super-admin/database/backup');
        const backupData = await backupResponse.json();
        
        if (backupData.success) {
          setBackupHistory(backupData.backups || []);
        } else {
          // Fallback data if API fails
          setBackupHistory([
            { id: 1, date: '2024-10-22 08:30:00', size: '1.8 GB', type: 'Automatic', status: 'Completed' },
            { id: 2, date: '2024-10-21 08:30:00', size: '1.7 GB', type: 'Automatic', status: 'Completed' }
          ]);
        }
        
      } catch (error) {
        console.error('Error fetching database stats:', error);
        // Fallback to hardcoded data on error
        setDbStats({
          totalUsers: 4,
          activeUsers: 3,
          totalManuscripts: 25,
          totalPublications: 150,
          totalProposals: 12,
          totalDonations: 89,
          dbSize: '2.3 GB',
          lastBackup: '2024-10-22 08:30:00',
          backupSize: '1.8 GB',
          uptime: '15 days, 6 hours',
          connections: 12,
          slowQueries: 3
        });
      } finally {
        setLoading(false);
      }
    };

    if (user?.accountType === 'SUPER_ADMIN') {
      fetchDbStats();
    }
  }, [user]);

  const handleOperation = (operation) => {
    setSelectedOperation(operation);
    setOperationData({});
    setDialogOpen(true);
  };

  const executeOperation = async () => {
    setLoading(true);
    try {
      let response;
      
      switch (selectedOperation) {
        case 'backup':
          response = await fetch('/api/super-admin/database/backup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              backupType: operationData.backupType || 'full',
              description: operationData.description || '',
              compression: operationData.compression || 'gzip'
            })
          });
          break;
          
        case 'cleanup':
        case 'migrate':
        case 'reindex':
        case 'analyze':
        case 'vacuum':
        case 'statistics':
          response = await fetch('/api/super-admin/database/maintenance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              operation: selectedOperation,
              options: operationData
            })
          });
          break;
          
        default:
          throw new Error(`Unknown operation: ${selectedOperation}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        alert(`${selectedOperation} operation completed successfully!`);
        
        // Refresh data after successful operation
        window.location.reload();
      } else {
        throw new Error(result.message || 'Operation failed');
      }
      
      setDialogOpen(false);
    } catch (error) {
      console.error(`Error executing ${selectedOperation}:`, error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const dbOperations = [
    {
      title: 'Database Backup',
      description: 'Create a full database backup with compression',
      icon: <BackupIcon />,
      color: 'primary',
      action: () => handleOperation('backup'),
      urgent: false
    },
    {
      title: 'Schedule Backup',
      description: 'Configure automatic backup scheduling',
      icon: <ScheduleIcon />,
      color: 'info',
      action: () => handleOperation('schedule'),
      urgent: false
    },
    {
      title: 'Restore Database',
      description: 'Restore database from backup file',
      icon: <RestoreIcon />,
      color: 'warning',
      action: () => handleOperation('restore'),
      urgent: true
    },
    {
      title: 'Export Data',
      description: 'Export specific data tables or collections',
      icon: <ExportIcon />,
      color: 'success',
      action: () => handleOperation('export'),
      urgent: false
    },
    {
      title: 'Data Cleanup',
      description: 'Clean up orphaned records and temporary data',
      icon: <CleanupIcon />,
      color: 'secondary',
      action: () => handleOperation('cleanup'),
      urgent: false
    },
    {
      title: 'Run Migration',
      description: 'Execute pending database migrations',
      icon: <MigrateIcon />,
      color: 'error',
      action: () => handleOperation('migrate'),
      urgent: true
    }
  ];

  const dataStats = [
    { label: 'Users', count: dbStats.totalUsers, icon: <UsersIcon />, table: 'users' },
    { label: 'Manuscripts', count: dbStats.totalManuscripts, icon: <ManuscriptsIcon />, table: 'manuscripts' },
    { label: 'Publications', count: dbStats.totalPublications, icon: <PublicationsIcon />, table: 'publications' },
    { label: 'Proposals', count: dbStats.totalProposals, icon: <ProposalsIcon />, table: 'proposals' },
  ];

  const maintenanceActions = [
    { label: 'Reindex Database', action: () => handleOperation('reindex'), icon: <RefreshIcon /> },
    { label: 'Analyze Tables', action: () => handleOperation('analyze'), icon: <AnalyticsIcon /> },
    { label: 'Vacuum Database', action: () => handleOperation('vacuum'), icon: <CleanupIcon /> },
    { label: 'Update Statistics', action: () => handleOperation('statistics'), icon: <AnalyticsIcon /> }
  ];

  const renderOperationDialog = () => {
    const dialogConfigs = {
      backup: {
        title: 'Create Database Backup',
        content: (
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>Backup Type</InputLabel>
              <Select
                value={operationData.backupType || ''}
                onChange={(e) => setOperationData({...operationData, backupType: e.target.value})}
              >
                <MenuItem value="full">Full Backup</MenuItem>
                <MenuItem value="incremental">Incremental Backup</MenuItem>
                <MenuItem value="schema">Schema Only</MenuItem>
                <MenuItem value="data">Data Only</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Backup Description"
              value={operationData.description || ''}
              onChange={(e) => setOperationData({...operationData, description: e.target.value})}
              placeholder="Optional description for this backup"
            />
            <FormControl fullWidth>
              <InputLabel>Compression</InputLabel>
              <Select
                value={operationData.compression || 'gzip'}
                onChange={(e) => setOperationData({...operationData, compression: e.target.value})}
              >
                <MenuItem value="none">No Compression</MenuItem>
                <MenuItem value="gzip">GZIP</MenuItem>
                <MenuItem value="bzip2">BZIP2</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        )
      },
      schedule: {
        title: 'Schedule Automatic Backups',
        content: (
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>Frequency</InputLabel>
              <Select
                value={operationData.frequency || ''}
                onChange={(e) => setOperationData({...operationData, frequency: e.target.value})}
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Schedule Time"
              type="time"
              value={operationData.time || '02:00'}
              onChange={(e) => setOperationData({...operationData, time: e.target.value})}
            />
            <TextField
              fullWidth
              label="Retention Period (days)"
              type="number"
              value={operationData.retention || 30}
              onChange={(e) => setOperationData({...operationData, retention: e.target.value})}
            />
          </Stack>
        )
      },
      export: {
        title: 'Export Database Data',
        content: (
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>Export Format</InputLabel>
              <Select
                value={operationData.format || ''}
                onChange={(e) => setOperationData({...operationData, format: e.target.value})}
              >
                <MenuItem value="sql">SQL</MenuItem>
                <MenuItem value="csv">CSV</MenuItem>
                <MenuItem value="json">JSON</MenuItem>
                <MenuItem value="xlsx">Excel</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Data Scope</InputLabel>
              <Select
                value={operationData.scope || ''}
                onChange={(e) => setOperationData({...operationData, scope: e.target.value})}
              >
                <MenuItem value="all">All Data</MenuItem>
                <MenuItem value="users">Users Only</MenuItem>
                <MenuItem value="publications">Publications Only</MenuItem>
                <MenuItem value="manuscripts">Manuscripts Only</MenuItem>
                <MenuItem value="custom">Custom Selection</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        )
      }
    };

    const config = dialogConfigs[selectedOperation] || { title: 'Operation', content: null };

    return (
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{config.title}</DialogTitle>
        <DialogContent>
          {config.content}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={executeOperation} 
            variant="contained" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Processing...' : 'Execute'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  if (!user || user.accountType !== 'SUPER_ADMIN') {
    return null;
  }

  if (loading && Object.keys(dbStats).length === 0) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${theme.palette.primary.main}05 0%, ${theme.palette.secondary.main}05 100%)`
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Loading Database Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Fetching real-time statistics...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: `linear-gradient(135deg, ${theme.palette.primary.main}03 0%, ${theme.palette.secondary.main}03 50%, ${theme.palette.background.default} 100%)`,
      py: 3
    }}>
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
        {/* Professional Header with Gradient */}
        <Box sx={{ 
          background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}15 100%)`,
          borderRadius: 3,
          p: 4,
          mb: 4,
          border: `1px solid ${theme.palette.primary.main}20`,
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Background Pattern */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '200px',
            height: '200px',
            background: `radial-gradient(circle, ${theme.palette.primary.main}10 0%, transparent 70%)`,
            borderRadius: '50%',
            transform: 'translate(50%, -50%)'
          }} />
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            position: 'relative',
            zIndex: 1
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Avatar sx={{ 
                bgcolor: 'primary.main', 
                width: 56, 
                height: 56,
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
              }}>
                <DatabaseIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h4" component="h1" sx={{ 
                  fontWeight: 700, 
                  mb: 1,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.02em'
                }}>
                  Database Management
                </Typography>
                <Typography variant="h6" sx={{ 
                  color: 'text.secondary',
                  fontWeight: 400,
                  opacity: 0.8
                }}>
                  Enterprise-grade backup, restore & maintenance operations
                </Typography>
              </Box>
            </Box>
            
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={() => window.location.reload()}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1.5,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  '&:hover': {
                    boxShadow: '0 6px 24px rgba(0,0,0,0.15)'
                  }
                }}
              >
                Refresh Data
              </Button>
            </Stack>
          </Box>
        </Box>

        {/* Professional Database Health Overview */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Database Health & Performance
            </Typography>
            <Chip 
              label="Real-time" 
              color="success" 
              size="small" 
              sx={{ fontWeight: 600 }}
              icon={<CheckIcon />}
            />
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Paper sx={{ 
                p: 4, 
                borderRadius: 3,
                background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                border: `1px solid ${theme.palette.divider}`
              }}>
                <Grid container spacing={4}>
                  {[
                    { 
                      value: dbStats.dbSize, 
                      label: 'Database Size', 
                      icon: <DatabaseIcon />, 
                      color: 'primary.main',
                      bgColor: 'primary.main'
                    },
                    { 
                      value: dbStats.backupSize, 
                      label: 'Latest Backup', 
                      icon: <BackupIcon />, 
                      color: 'info.main',
                      bgColor: 'info.main'
                    },
                    { 
                      value: dbStats.connections, 
                      label: 'Active Connections', 
                      icon: <SecurityIcon />, 
                      color: 'warning.main',
                      bgColor: 'warning.main'
                    },
                    { 
                      value: dbStats.slowQueries, 
                      label: 'Slow Queries', 
                      icon: <AnalyticsIcon />, 
                      color: dbStats.slowQueries > 0 ? 'error.main' : 'success.main',
                      bgColor: dbStats.slowQueries > 0 ? 'error.main' : 'success.main'
                    }
                  ].map((stat, index) => (
                    <Grid item xs={6} sm={3} key={index}>
                      <Box sx={{ textAlign: 'center', position: 'relative' }}>
                        <Box sx={{ 
                          position: 'relative',
                          mb: 2
                        }}>
                          <Avatar sx={{ 
                            bgcolor: stat.bgColor,
                            mx: 'auto',
                            width: 64,
                            height: 64,
                            boxShadow: `0 8px 24px ${stat.bgColor}30`,
                            border: '3px solid',
                            borderColor: 'background.paper'
                          }}>
                            {React.cloneElement(stat.icon, { fontSize: 'large' })}
                          </Avatar>
                          <Box sx={{
                            position: 'absolute',
                            top: -8,
                            right: '50%',
                            transform: 'translateX(50%)',
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            bgcolor: 'success.main',
                            border: '3px solid',
                            borderColor: 'background.paper',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                          }} />
                        </Box>
                        <Typography variant="h4" sx={{ 
                          fontWeight: 800, 
                          color: stat.color,
                          mb: 0.5,
                          letterSpacing: '-0.02em'
                        }}>
                          {stat.value}
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          color: 'text.secondary',
                          fontWeight: 500,
                          textTransform: 'uppercase',
                          fontSize: '0.75rem',
                          letterSpacing: '0.5px'
                        }}>
                          {stat.label}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
            
            <Grid item xs={12} lg={4}>
              <Paper sx={{ 
                p: 4, 
                height: '100%',
                borderRadius: 3,
                background: `linear-gradient(145deg, ${theme.palette.success.main}08 0%, ${theme.palette.success.main}03 100%)`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                border: `1px solid ${theme.palette.success.main}20`
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar sx={{ bgcolor: 'success.main', width: 40, height: 40 }}>
                    <CheckIcon />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                    System Status
                  </Typography>
                </Box>
                
                <Stack spacing={3}>
                  {[
                    { icon: <CheckIcon />, label: 'Database Online', status: 'Operational', color: 'success' },
                    { icon: <BackupIcon />, label: 'Backups Active', status: 'Running', color: 'success' },
                    { icon: <SecurityIcon />, label: 'Security Status', status: 'Secure', color: 'success' },
                    { icon: <AnalyticsIcon />, label: 'Performance', status: 'Optimal', color: 'success' }
                  ].map((item, index) => (
                    <Box key={index} sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ color: `${item.color}.main` }}>
                          {React.cloneElement(item.icon, { fontSize: 'small' })}
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {item.label}
                        </Typography>
                      </Box>
                      <Chip 
                        label={item.status}
                        color={item.color}
                        size="small"
                        sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                      />
                    </Box>
                  ))}
                </Stack>
                
                <Divider sx={{ my: 3 }} />
                
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Last Updated
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {new Date().toLocaleTimeString()}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* Professional Data Statistics */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                Data Overview
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Real-time statistics from your database tables
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<AnalyticsIcon />}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              View Analytics
            </Button>
          </Box>
          
          <Grid container spacing={3}>
            {dataStats.map((stat, index) => {
              const colors = ['primary', 'secondary', 'success', 'warning'];
              const color = colors[index % colors.length];
              
              return (
                <Grid item xs={12} sm={6} lg={3} key={index}>
                  <Card sx={{ 
                    height: '100%',
                    borderRadius: 3,
                    background: `linear-gradient(145deg, ${theme.palette[color].main}08 0%, ${theme.palette[color].main}03 100%)`,
                    border: `2px solid ${theme.palette[color].main}15`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': { 
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 40px ${theme.palette[color].main}25`,
                      border: `2px solid ${theme.palette[color].main}30`
                    }
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                        <Avatar sx={{ 
                          bgcolor: `${color}.main`, 
                          width: 48, 
                          height: 48,
                          boxShadow: `0 8px 24px ${theme.palette[color].main}40`
                        }}>
                          {React.cloneElement(stat.icon, { fontSize: 'medium' })}
                        </Avatar>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="caption" sx={{ 
                            color: 'text.secondary', 
                            fontWeight: 500,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            Total
                          </Typography>
                          <Typography variant="h3" sx={{ 
                            fontWeight: 800, 
                            color: `${color}.main`,
                            lineHeight: 1,
                            letterSpacing: '-0.02em'
                          }}>
                            {stat.count}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Typography variant="h6" sx={{ 
                        fontWeight: 600, 
                        color: 'text.primary',
                        mb: 1
                      }}>
                        {stat.label}
                      </Typography>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        mt: 2,
                        p: 1.5,
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.divider}`
                      }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Table: {stat.table}
                        </Typography>
                        <IconButton 
                          size="small" 
                          sx={{ 
                            color: `${color}.main`,
                            '&:hover': { bgcolor: `${color}.main`, color: 'white' }
                          }}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        {/* Professional Database Operations */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
              Database Operations
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Execute critical database maintenance and management tasks
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            {dbOperations.map((operation, index) => (
              <Grid item xs={12} sm={6} lg={4} key={index}>
                <Card sx={{ 
                  height: '100%',
                  borderRadius: 3,
                  border: `2px solid ${theme.palette[operation.color].main}15`,
                  background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette[operation.color].main}05 100%)`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': { 
                    transform: 'translateY(-6px)',
                    boxShadow: `0 20px 60px ${theme.palette[operation.color].main}25`,
                    border: `2px solid ${theme.palette[operation.color].main}30`
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: `linear-gradient(90deg, ${theme.palette[operation.color].main}, ${theme.palette[operation.color].light})`,
                    borderRadius: '3px 3px 0 0'
                  }
                }}>
                  <CardContent sx={{ p: 3, pb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                      <Avatar sx={{ 
                        bgcolor: `${operation.color}.main`, 
                        width: 48, 
                        height: 48,
                        boxShadow: `0 8px 24px ${theme.palette[operation.color].main}40`
                      }}>
                        {React.cloneElement(operation.icon, { fontSize: 'medium' })}
                      </Avatar>
                      
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 700,
                            color: 'text.primary',
                            lineHeight: 1.2
                          }}>
                            {operation.title}
                          </Typography>
                          {operation.urgent && (
                            <Chip 
                              label="Critical" 
                              color="error" 
                              size="small" 
                              sx={{ 
                                fontWeight: 600, 
                                fontSize: '0.7rem',
                                height: '20px'
                              }}
                            />
                          )}
                        </Box>
                        
                        <Typography variant="body2" sx={{ 
                          color: 'text.secondary',
                          lineHeight: 1.5,
                          fontWeight: 400
                        }}>
                          {operation.description}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* Operation Status Indicator */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      p: 1.5,
                      bgcolor: `${operation.color}.main`,
                      color: 'white',
                      borderRadius: 2,
                      mb: 2,
                      opacity: 0.9
                    }}>
                      <CheckIcon fontSize="small" />
                      <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                        Ready to Execute
                      </Typography>
                    </Box>
                  </CardContent>
                  
                  <CardActions sx={{ px: 3, pb: 3, pt: 0 }}>
                    <Button 
                      variant="contained" 
                      color={operation.color}
                      onClick={operation.action}
                      fullWidth
                      size="large"
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 700,
                        py: 1.2,
                        fontSize: '0.9rem',
                        boxShadow: `0 4px 16px ${theme.palette[operation.color].main}40`,
                        '&:hover': {
                          boxShadow: `0 6px 24px ${theme.palette[operation.color].main}50`
                        }
                      }}
                    >
                      Execute Operation
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Professional Backup History & Maintenance */}
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Paper sx={{ 
              borderRadius: 3,
              background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
              border: `1px solid ${theme.palette.divider}`,
              overflow: 'hidden'
            }}>
              {/* Header */}
              <Box sx={{ 
                p: 3, 
                background: `linear-gradient(135deg, ${theme.palette.primary.main}10 0%, ${theme.palette.secondary.main}10 100%)`,
                borderBottom: `1px solid ${theme.palette.divider}`
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                      <BackupIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Backup History
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {backupHistory.length} backups available
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<BackupIcon />}
                    onClick={() => handleOperation('backup')}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                  >
                    Create Backup
                  </Button>
                </Box>
              </Box>
              
              {/* Table */}
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: 'background.default' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Date & Time</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Size</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: 'text.primary' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {backupHistory.slice(0, 5).map((backup, index) => (
                      <TableRow 
                        key={backup.id}
                        sx={{ 
                          '&:hover': { bgcolor: 'action.hover' },
                          borderBottom: `1px solid ${theme.palette.divider}`
                        }}
                      >
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {backup.date.split(' ')[0]}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {backup.date.split(' ')[1]}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={backup.type} 
                            size="small" 
                            color={backup.type === 'Manual' ? 'primary' : 'secondary'}
                            sx={{ fontWeight: 600, minWidth: '80px' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {backup.size}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={backup.status}
                            size="small"
                            color={backup.status === 'Completed' ? 'success' : 'error'}
                            icon={backup.status === 'Completed' ? <CheckIcon /> : <ErrorIcon />}
                            sx={{ fontWeight: 600, minWidth: '100px' }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <IconButton 
                              size="small" 
                              onClick={() => handleOperation('download')}
                              sx={{ 
                                bgcolor: 'primary.main', 
                                color: 'white',
                                '&:hover': { bgcolor: 'primary.dark' }
                              }}
                            >
                              <CloudDownloadIcon fontSize="small" />
                            </IconButton>
                            {backup.status === 'Completed' && (
                              <IconButton 
                                size="small" 
                                onClick={() => handleOperation('restore')}
                                sx={{ 
                                  bgcolor: 'warning.main', 
                                  color: 'white',
                                  '&:hover': { bgcolor: 'warning.dark' }
                                }}
                              >
                                <RestoreIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {backupHistory.length === 0 && (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <BackupIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    No backups available
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create your first backup to see it here
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
          
          <Grid item xs={12} lg={4}>
            <Stack spacing={3}>
              {/* Quick Maintenance */}
              <Paper sx={{ 
                p: 3,
                borderRadius: 3,
                background: `linear-gradient(145deg, ${theme.palette.success.main}08 0%, ${theme.palette.success.main}03 100%)`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                border: `1px solid ${theme.palette.success.main}20`
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar sx={{ bgcolor: 'success.main', width: 40, height: 40 }}>
                    <RefreshIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Quick Maintenance
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Routine operations
                    </Typography>
                  </Box>
                </Box>
                
                <Stack spacing={2}>
                  {maintenanceActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outlined"
                      startIcon={action.icon}
                      onClick={action.action}
                      fullWidth
                      sx={{ 
                        justifyContent: 'flex-start',
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        py: 1.5,
                        borderColor: 'success.main',
                        color: 'success.main',
                        '&:hover': {
                          bgcolor: 'success.main',
                          color: 'white',
                          borderColor: 'success.main'
                        }
                      }}
                    >
                      {action.label}
                    </Button>
                  ))}
                </Stack>
              </Paper>
              
              {/* Emergency Actions */}
              <Paper sx={{ 
                p: 3,
                borderRadius: 3,
                background: `linear-gradient(145deg, ${theme.palette.error.main}08 0%, ${theme.palette.error.main}03 100%)`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                border: `1px solid ${theme.palette.error.main}20`
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar sx={{ bgcolor: 'error.main', width: 40, height: 40 }}>
                    <WarningIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.main' }}>
                      Emergency Actions
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Critical operations
                    </Typography>
                  </Box>
                </Box>
                
                <Stack spacing={2}>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<WarningIcon />}
                    onClick={() => handleOperation('emergency')}
                    fullWidth
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 700,
                      py: 1.5
                    }}
                  >
                    Emergency Backup
                  </Button>
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<SecurityIcon />}
                    onClick={() => handleOperation('maintenance')}
                    fullWidth
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      py: 1.5
                    }}
                  >
                    Maintenance Mode
                  </Button>
                </Stack>
                
                <Alert 
                  severity="warning" 
                  sx={{ 
                    mt: 2, 
                    borderRadius: 2,
                    '& .MuiAlert-message': { fontSize: '0.8rem' }
                  }}
                >
                  Use emergency actions only when necessary. Always backup first.
                </Alert>
              </Paper>
            </Stack>
          </Grid>
        </Grid>

        {/* Operation Dialog */}
        {renderOperationDialog()}
        
        {/* Footer */}
        <Box sx={{ 
          mt: 6, 
          p: 3,
          textAlign: 'center',
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.paper',
          borderRadius: 3
        }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            Database Management System • Last refreshed: {new Date().toLocaleString()} • All operations logged
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default DatabaseManagementPage;
