'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  Article as ManuscriptsIcon,
  Backup as BackupIcon,
  CheckCircle as CheckIcon,
  CleaningServices as CleanupIcon,
  CloudDownload as CloudDownloadIcon,
  Error as ErrorIcon,
  GetApp as ExportIcon,
  Info as InfoIcon,
  People as UsersIcon,
  Refresh as RefreshIcon,
  School as PublicationsIcon,
  Storage as DatabaseIcon,
  Business as ProposalsIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import InstitutionAdminLayout from '../../../components/InstitutionAdmin/InstitutionAdminLayout';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
  InstitutionModalSection,
} from '../../../components/GlobalAdmin/InstitutionModalShell';

const PURPLE = '#8b6cbc';
const PURPLE_DARK = '#7a5caa';

const fieldSx = { '& .MuiInputBase-root': { borderRadius: 1.5 } };

function PageHeading({ title, subtitle, action }) {
  return (
    <Box sx={{ mb: 3, p: { xs: 2, md: 2.5 }, borderRadius: 2, border: `1px solid ${alpha(PURPLE, 0.12)}`, bgcolor: 'background.paper' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
        <Box>
          <Typography variant="overline" sx={{ color: alpha(PURPLE, 0.75), fontWeight: 700, letterSpacing: '0.08em' }}>
            Institution Admin
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em', mt: 0.25 }}>{title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>
        </Box>
        {action}
      </Stack>
    </Box>
  );
}

function StatCard({ label, value, caption, icon: Icon }) {
  return (
    <Paper elevation={0} sx={{ px: 2, py: 1.25, borderRadius: 2, border: `1px solid ${alpha(PURPLE, 0.12)}`, bgcolor: 'background.paper' }}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box sx={{ width: 34, height: 34, borderRadius: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(PURPLE, 0.12), color: PURPLE, flexShrink: 0 }}>
          <Icon sx={{ fontSize: 18 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={1}>
            <Typography variant="caption" noWrap sx={{ color: alpha(PURPLE, 0.7), fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: PURPLE_DARK, lineHeight: 1 }}>{value}</Typography>
          </Stack>
          {caption ? <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', mt: 0.25 }}>{caption}</Typography> : null}
        </Box>
      </Stack>
    </Paper>
  );
}

function OperationCard({ title, description, icon: Icon, onClick, disabled = false }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        height: '100%',
        borderRadius: 2,
        border: `1px solid ${alpha(PURPLE, 0.12)}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="flex-start">
        <Box sx={{ width: 36, height: 36, borderRadius: 1.25, bgcolor: alpha(PURPLE, 0.12), color: PURPLE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon sx={{ fontSize: 18 }} />
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{description}</Typography>
        </Box>
      </Stack>
      <Button
        variant="outlined"
        onClick={onClick}
        disabled={disabled}
        sx={{
          mt: 'auto',
          textTransform: 'none',
          fontWeight: 600,
          borderColor: alpha(PURPLE, 0.35),
          color: PURPLE_DARK,
          '&:hover': { borderColor: PURPLE, bgcolor: alpha(PURPLE, 0.06) },
        }}
      >
        Run
      </Button>
    </Paper>
  );
}

const TABLE_ICONS = {
  users: UsersIcon,
  manuscripts: ManuscriptsIcon,
  publications: PublicationsIcon,
  proposals: ProposalsIcon,
};

const DatabaseManagementPage = () => {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [dbStats, setDbStats] = useState({});
  const [backupHistory, setBackupHistory] = useState([]);
  const [selectedOperation, setSelectedOperation] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [operationData, setOperationData] = useState({});
  const [notice, setNotice] = useState({ open: false, message: '', severity: 'success' });
  const [lastRefreshed, setLastRefreshed] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.accountType !== 'INSTITUTION_ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router, authLoading]);

  const showNotice = (message, severity = 'success') => {
    setNotice({ open: true, message, severity });
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, backupRes] = await Promise.all([
        fetch('/api/institution-admin/database/stats', { credentials: 'include' }),
        fetch('/api/institution-admin/database/backup', { credentials: 'include' }),
      ]);

      const statsData = await statsRes.json();
      const backupData = await backupRes.json();

      if (statsData.success) {
        setDbStats(statsData.stats || {});
      } else {
        showNotice(statsData.message || 'Failed to load database stats', 'error');
      }

      if (backupData.success) {
        setBackupHistory(backupData.backups || []);
      }
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Error loading database page:', error);
      showNotice('Failed to load database information', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.accountType === 'INSTITUTION_ADMIN') {
      loadData();
    }
  }, [user, loadData]);

  const handleOperation = (operation) => {
    setSelectedOperation(operation);
    setOperationData({});
    setDialogOpen(true);
  };

  const downloadBackup = async (filename) => {
    try {
      const response = await fetch(
        `/api/institution-admin/database/backup/download?file=${encodeURIComponent(filename)}`,
        { credentials: 'include' }
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || 'Download failed');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showNotice('Backup downloaded');
    } catch (error) {
      console.error('Error downloading backup:', error);
      showNotice(error.message || 'Download failed', 'error');
    }
  };

  const executeOperation = async () => {
    setWorking(true);
    try {
      let response;

      if (selectedOperation === 'backup') {
        response = await fetch('/api/institution-admin/database/backup', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            backupType: operationData.backupType || 'full',
            description: operationData.description || '',
          }),
        });
      } else if (selectedOperation === 'export') {
        response = await fetch('/api/institution-admin/database/export', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            format: operationData.format || 'json',
            scope: operationData.scope || 'all',
          }),
        });
      } else {
        response = await fetch('/api/institution-admin/database/maintenance', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operation: selectedOperation,
            options: operationData,
          }),
        });
      }

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || 'Operation failed');
      }

      if (selectedOperation === 'backup' && result.backup?.filename) {
        showNotice(`${result.message} (${result.backup.size})`);
      } else if (selectedOperation === 'export' && result.export) {
        showNotice(`${result.message} — ${result.export.recordCount} records, ${result.export.size}`);
      } else {
        showNotice(result.message || `${selectedOperation} completed successfully`);
      }

      setDialogOpen(false);
      await loadData();
    } catch (error) {
      console.error(`Error executing ${selectedOperation}:`, error);
      showNotice(error.message || 'Operation failed', 'error');
    } finally {
      setWorking(false);
    }
  };

  const dataStats = useMemo(() => {
    const tables = dbStats.tableStats || [];
    return tables.map((table) => ({
      ...table,
      icon: TABLE_ICONS[table.name] || DatabaseIcon,
    }));
  }, [dbStats.tableStats]);

  const dialogConfig = useMemo(() => {
    const configs = {
      backup: {
        title: 'Create backup',
        subtitle: 'Export institution data to a backup file',
        content: (
          <Stack spacing={2}>
            <FormControl fullWidth size="small" sx={fieldSx}>
              <InputLabel>Backup type</InputLabel>
              <Select value={operationData.backupType || 'full'} label="Backup type" onChange={(e) => setOperationData({ ...operationData, backupType: e.target.value })}>
                <MenuItem value="full">Full backup</MenuItem>
                <MenuItem value="data">Data only</MenuItem>
                <MenuItem value="schema">Schema only</MenuItem>
              </Select>
            </FormControl>
            <TextField fullWidth size="small" label="Description" value={operationData.description || ''} onChange={(e) => setOperationData({ ...operationData, description: e.target.value })} placeholder="Optional note for this backup" sx={fieldSx} />
          </Stack>
        ),
      },
      export: {
        title: 'Export data',
        subtitle: 'Download a scoped export of your institution data',
        content: (
          <Stack spacing={2}>
            <FormControl fullWidth size="small" sx={fieldSx}>
              <InputLabel>Format</InputLabel>
              <Select value={operationData.format || 'json'} label="Format" onChange={(e) => setOperationData({ ...operationData, format: e.target.value })}>
                <MenuItem value="json">JSON</MenuItem>
                <MenuItem value="csv">CSV</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small" sx={fieldSx}>
              <InputLabel>Data scope</InputLabel>
              <Select value={operationData.scope || 'all'} label="Data scope" onChange={(e) => setOperationData({ ...operationData, scope: e.target.value })}>
                <MenuItem value="all">All data</MenuItem>
                <MenuItem value="users">Users</MenuItem>
                <MenuItem value="manuscripts">Manuscripts</MenuItem>
                <MenuItem value="publications">Publications</MenuItem>
                <MenuItem value="proposals">Proposals</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        ),
      },
      cleanup: {
        title: 'Data cleanup',
        subtitle: 'Remove expired invitations for your institution',
        content: (
          <Alert severity="info" sx={{ borderRadius: 1.5 }}>
            Cleans expired manuscript invitations linked to your institution members. Platform-wide maintenance is handled separately.
          </Alert>
        ),
      },
    };

    return configs[selectedOperation] || { title: 'Operation', subtitle: '', content: null };
  }, [selectedOperation, operationData]);

  if (!user || user.accountType !== 'INSTITUTION_ADMIN') {
    return null;
  }

  return (
    <InstitutionAdminLayout>
      <Box sx={{ p: { xs: 2, sm: 3 }, width: '100%' }}>
        <PageHeading
          title={t('institution_admin.database', { defaultValue: 'Database' })}
          subtitle={
            dbStats.institutionName
              ? `Manage data, backups, and exports for ${dbStats.institutionName}.`
              : 'Monitor institution data, create backups, and run maintenance tasks.'
          }
          action={(
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadData}
              disabled={loading}
              sx={{ textTransform: 'none', fontWeight: 600, borderColor: alpha(PURPLE, 0.35), color: PURPLE_DARK, '&:hover': { borderColor: PURPLE, bgcolor: alpha(PURPLE, 0.06) } }}
            >
              Refresh
            </Button>
          )}
        />

        {lastRefreshed ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Last refreshed {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        ) : null}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 1.5, mb: 3 }}>
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} variant="rounded" height={68} sx={{ borderRadius: 2 }} />)
          ) : (
            <>
              <StatCard label="Institution users" value={dbStats.totalUsers || 0} caption={`${dbStats.activeUsers || 0} active · ${dbStats.pendingUsers || 0} pending`} icon={UsersIcon} />
              <StatCard label="Manuscripts" value={dbStats.totalManuscripts || 0} caption="Created by your members" icon={ManuscriptsIcon} />
              <StatCard label="Publications" value={dbStats.totalPublications || 0} caption="Authored by your researchers" icon={PublicationsIcon} />
              <StatCard label="Proposals" value={dbStats.totalProposals || 0} caption="In institution review pipeline" icon={ProposalsIcon} />
            </>
          )}
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.2fr 0.8fr' }, gap: 2.5, mb: 3 }}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${alpha(PURPLE, 0.12)}` }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Data overview</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Record counts for your institution</Typography>
            {loading ? (
              <Stack spacing={1}>{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rounded" height={44} />)}</Stack>
            ) : (
              <Stack spacing={1}>
                {dataStats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <Stack key={stat.name} direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.25, borderRadius: 1.5, border: `1px solid ${alpha(PURPLE, 0.1)}` }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Icon sx={{ fontSize: 18, color: PURPLE }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{stat.label}</Typography>
                      </Stack>
                      <Chip size="small" label={stat.count} sx={{ bgcolor: alpha(PURPLE, 0.12), color: PURPLE_DARK, fontWeight: 700 }} />
                    </Stack>
                  );
                })}
              </Stack>
            )}
          </Paper>

          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${alpha(PURPLE, 0.12)}` }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Platform health</Typography>
              {!loading && dbStats.health ? (
                <Chip
                  size="small"
                  icon={<CheckIcon sx={{ fontSize: '14px !important' }} />}
                  label={dbStats.health}
                  sx={{
                    textTransform: 'capitalize',
                    fontWeight: 700,
                    bgcolor: alpha(PURPLE, 0.12),
                    color: PURPLE_DARK,
                  }}
                />
              ) : null}
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Shared environment — read-only for institution admins</Typography>
            {loading ? (
              <Stack spacing={1}>{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rounded" height={36} />)}</Stack>
            ) : (
              <Stack spacing={1.25}>
                {[
                  { label: 'Database size', value: dbStats.dbSize || 'N/A' },
                  { label: 'Connections', value: `${dbStats.connections || 0} / ${dbStats.maxConnections || 100}` },
                  { label: 'Server uptime', value: dbStats.uptime || 'N/A' },
                ].map((item) => (
                  <Stack key={item.label} direction="row" justifyContent="space-between" spacing={2}>
                    <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.value}</Typography>
                  </Stack>
                ))}
                <Alert severity="info" icon={<InfoIcon fontSize="inherit" />} sx={{ mt: 1, borderRadius: 1.5, py: 0.5 }}>
                  Vacuum, migration, and schema changes are managed by platform administrators.
                </Alert>
              </Stack>
            )}
          </Paper>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Operations</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Backup, export, and maintenance tools</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5 }}>
            <OperationCard title="Create backup" description="Save a JSON snapshot scoped to your institution" icon={BackupIcon} onClick={() => handleOperation('backup')} />
            <OperationCard title="Export data" description="Export users, manuscripts, publications, or proposals" icon={ExportIcon} onClick={() => handleOperation('export')} />
            <OperationCard title="Data cleanup" description="Remove expired invitations for your members" icon={CleanupIcon} onClick={() => handleOperation('cleanup')} />
          </Box>
        </Box>

        <Paper elevation={0} sx={{ borderRadius: 2, border: `1px solid ${alpha(PURPLE, 0.12)}`, overflow: 'hidden' }}>
          <Box sx={{ p: 2.5, borderBottom: `1px solid ${alpha(PURPLE, 0.1)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Backup history</Typography>
              <Typography variant="body2" color="text.secondary">{backupHistory.length} backup{backupHistory.length === 1 ? '' : 's'} available</Typography>
            </Box>
            <Button variant="contained" startIcon={<BackupIcon />} onClick={() => handleOperation('backup')} sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: PURPLE_DARK } }}>
              Create backup
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ p: 2 }}>{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rounded" height={48} sx={{ mb: 1, borderRadius: 1.5 }} />)}</Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(PURPLE, 0.04) }}>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Size</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>File</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {backupHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                        <Stack spacing={1} alignItems="center">
                          <BackupIcon sx={{ color: alpha(PURPLE, 0.45), fontSize: 40 }} />
                          <Typography variant="body2" color="text.secondary">No backups yet</Typography>
                          <Button size="small" onClick={() => handleOperation('backup')} sx={{ textTransform: 'none', color: PURPLE_DARK, fontWeight: 600 }}>Create your first backup</Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ) : (
                    backupHistory.slice(0, 10).map((backup) => (
                      <TableRow key={backup.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{backup.date?.split(' ')[0] || '—'}</Typography>
                          <Typography variant="caption" color="text.secondary">{backup.date?.split(' ')[1] || ''}</Typography>
                        </TableCell>
                        <TableCell><Chip size="small" label={backup.type} sx={{ fontWeight: 600 }} /></TableCell>
                        <TableCell><Typography variant="body2">{backup.size}</Typography></TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            icon={backup.status === 'Completed' ? <CheckIcon sx={{ fontSize: '14px !important' }} /> : <ErrorIcon sx={{ fontSize: '14px !important' }} />}
                            label={backup.status}
                            sx={{
                              fontWeight: 700,
                              bgcolor: backup.status === 'Completed' ? alpha(PURPLE, 0.12) : '#fee2e2',
                              color: backup.status === 'Completed' ? PURPLE_DARK : '#b91c1c',
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 180 }}>{backup.filename}</Typography>
                            <Tooltip title="Download backup">
                              <IconButton size="small" sx={{ color: PURPLE }} onClick={() => downloadBackup(backup.filename)}>
                                <CloudDownloadIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>

      <InstitutionModal open={dialogOpen} onClose={() => !working && setDialogOpen(false)} disableClose={working} maxWidth="sm">
        <InstitutionModalHeader
          icon={BackupIcon}
          title={dialogConfig.title}
          subtitle={dialogConfig.subtitle}
          onClose={() => setDialogOpen(false)}
          disableClose={working}
        />
        <InstitutionModalBody>
          <InstitutionModalSection title="Configuration">
            {dialogConfig.content}
          </InstitutionModalSection>
        </InstitutionModalBody>
        <InstitutionModalFooter>
          <Button onClick={() => setDialogOpen(false)} disabled={working} color="inherit">Cancel</Button>
          <Button
            variant="contained"
            onClick={executeOperation}
            disabled={working}
            startIcon={working ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ bgcolor: PURPLE, '&:hover': { bgcolor: PURPLE_DARK } }}
          >
            {working ? 'Running...' : 'Execute'}
          </Button>
        </InstitutionModalFooter>
      </InstitutionModal>

      <Snackbar open={notice.open} autoHideDuration={6000} onClose={() => setNotice((prev) => ({ ...prev, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={notice.severity} onClose={() => setNotice((prev) => ({ ...prev, open: false }))} sx={{ borderRadius: 2, width: '100%' }}>
          {notice.message}
        </Alert>
      </Snackbar>
    </InstitutionAdminLayout>
  );
};

export default DatabaseManagementPage;
