'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  Api as ApiIcon,
  Article as LogsIcon,
  Download as DownloadIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
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

const LOG_LEVEL_CONFIG = {
  ERROR: { bg: '#fee2e2', color: '#b91c1c', label: 'Error', icon: ErrorIcon },
  WARNING: { bg: '#fef3c7', color: '#b45309', label: 'Warning', icon: WarningIcon },
  INFO: { bg: alpha(PURPLE, 0.12), color: PURPLE_DARK, label: 'Info', icon: InfoIcon },
  SUCCESS: { bg: '#dcfce7', color: '#15803d', label: 'Success', icon: SuccessIcon },
  API_CALL: { bg: alpha(PURPLE, 0.18), color: PURPLE_DARK, label: 'API', icon: ApiIcon },
  DB_OPERATION: { bg: '#e0e7ff', color: '#4338ca', label: 'Database', icon: ApiIcon },
};

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

function StatCard({ label, value, caption, icon: Icon, active = false, onClick }) {
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        px: 2,
        py: 1.25,
        borderRadius: 2,
        cursor: onClick ? 'pointer' : 'default',
        border: `1px solid ${active ? PURPLE : alpha(PURPLE, 0.12)}`,
        bgcolor: active ? alpha(PURPLE, 0.06) : 'background.paper',
        transition: 'border-color 0.15s, background-color 0.15s',
        '&:hover': onClick ? { borderColor: alpha(PURPLE, 0.45), bgcolor: alpha(PURPLE, 0.04) } : undefined,
      }}
    >
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

function LevelChip({ level }) {
  const config = LOG_LEVEL_CONFIG[level] || { bg: '#f3f4f6', color: '#6b7280', label: level, icon: InfoIcon };
  const Icon = config.icon;
  return (
    <Chip
      size="small"
      icon={<Icon sx={{ fontSize: '14px !important' }} />}
      label={config.label}
      sx={{ bgcolor: config.bg, color: config.color, fontWeight: 700, '& .MuiChip-icon': { color: config.color } }}
    />
  );
}

const LogsPage = () => {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({});
  const [institutionName, setInstitutionName] = useState('');
  const [memberCount, setMemberCount] = useState(0);
  const [filters, setFilters] = useState({ level: '', search: '', startDate: '', endDate: '' });
  const [pagination, setPagination] = useState({ page: 0, limit: 20, total: 0 });
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
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

  const fetchLogs = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page + 1),
        limit: String(pagination.limit),
        sortOrder: 'desc',
        ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '')),
      });

      const response = await fetch(`/api/institution-admin/logs?${params}`, { credentials: 'include' });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch logs');
      }

      setLogs(data.logs || []);
      setStats(data.stats || {});
      setInstitutionName(data.institutionName || '');
      setMemberCount(data.memberCount || 0);
      setPagination((prev) => ({ ...prev, total: data.total || 0 }));
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Error fetching logs:', err);
      showNotice(err.message || 'Failed to fetch logs', 'error');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    if (user?.accountType === 'INSTITUTION_ADMIN') {
      fetchLogs();
    }
  }, [user, fetchLogs]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const interval = setInterval(() => fetchLogs(false), 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPagination((prev) => ({ ...prev, page: 0 }));
  };

  const handleLevelFilter = (level) => {
    setFilters((prev) => ({ ...prev, level: prev.level === level ? '' : level }));
    setPagination((prev) => ({ ...prev, page: 0 }));
  };

  const handleExportLogs = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({
        export: 'true',
        sortOrder: 'desc',
        ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '')),
      });

      const response = await fetch(`/api/institution-admin/logs?${params}`, { credentials: 'include' });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Export failed');
      }

      const exportPayload = (data.logs || []).map((log) => ({
        timestamp: log.timestamp,
        level: log.level,
        message: log.message,
        member: log.member,
        metadata: log.metadata,
      }));

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `institution-logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showNotice(`Exported ${exportPayload.length} log entries`);
    } catch (err) {
      console.error('Error exporting logs:', err);
      showNotice(err.message || 'Export failed', 'error');
    } finally {
      setExporting(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
  };

  const statCards = useMemo(() => {
    const levels = stats.levels || {};
    return [
      { key: '', label: 'Total events', value: stats.total || 0, caption: `${memberCount} members tracked`, icon: LogsIcon },
      { key: 'ERROR', label: 'Errors', value: levels.ERROR || 0, caption: `${stats.recentErrors || 0} in last 24h`, icon: ErrorIcon },
      { key: 'WARNING', label: 'Warnings', value: levels.WARNING || 0, caption: 'Needs attention', icon: WarningIcon },
      { key: 'API_CALL', label: 'API calls', value: levels.API_CALL || 0, caption: 'Member API activity', icon: ApiIcon },
    ];
  }, [stats, memberCount]);

  if (!user || user.accountType !== 'INSTITUTION_ADMIN') {
    return null;
  }

  return (
    <InstitutionAdminLayout>
      <Box sx={{ p: { xs: 2, sm: 3 }, width: '100%' }}>
        <PageHeading
          title={t('institution_admin.logs', { defaultValue: 'Activity logs' })}
          subtitle={
            institutionName
              ? `Audit trail for ${institutionName} members — login, API, and system events.`
              : 'Monitor activity for your institution members.'
          }
          action={(
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExportLogs}
                disabled={exporting || loading || (stats.total || 0) === 0}
                sx={{ textTransform: 'none', fontWeight: 600, borderColor: alpha(PURPLE, 0.35), color: PURPLE_DARK, '&:hover': { borderColor: PURPLE, bgcolor: alpha(PURPLE, 0.06) } }}
              >
                {exporting ? 'Exporting…' : 'Export'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => fetchLogs()}
                disabled={loading}
                sx={{ textTransform: 'none', fontWeight: 600, borderColor: alpha(PURPLE, 0.35), color: PURPLE_DARK, '&:hover': { borderColor: PURPLE, bgcolor: alpha(PURPLE, 0.06) } }}
              >
                Refresh
              </Button>
            </Stack>
          )}
        />

        {lastRefreshed ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Last refreshed {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {stats.uniqueUsers ? ` · ${stats.uniqueUsers} active members in logs` : ''}
          </Typography>
        ) : null}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 1.5, mb: 3 }}>
          {loading && !stats.total ? (
            Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} variant="rounded" height={68} sx={{ borderRadius: 2 }} />)
          ) : (
            statCards.map((card) => (
              <StatCard
                key={card.key || 'all'}
                label={card.label}
                value={card.value}
                caption={card.caption}
                icon={card.icon}
                active={filters.level === card.key}
                onClick={card.key !== undefined ? () => handleLevelFilter(card.key) : undefined}
              />
            ))
          )}
        </Box>

        <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, border: `1px solid ${alpha(PURPLE, 0.12)}` }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'flex-end' }}>
            <TextField
              size="small"
              label="Search"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Message, email, endpoint…"
              sx={{ flex: 1, ...fieldSx }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: alpha(PURPLE, 0.55) }} />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 140, ...fieldSx }}>
              <InputLabel>Level</InputLabel>
              <Select value={filters.level} label="Level" onChange={(e) => handleFilterChange('level', e.target.value)}>
                <MenuItem value="">All levels</MenuItem>
                {Object.entries(LOG_LEVEL_CONFIG).map(([level, config]) => (
                  <MenuItem key={level} value={level}>{config.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField size="small" type="date" label="From" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 150, ...fieldSx }} />
            <TextField size="small" type="date" label="To" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 150, ...fieldSx }} />
            <FormControlLabel
              control={<Switch checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} size="small" sx={{ '& .Mui-checked': { color: PURPLE }, '& .Mui-checked + .MuiSwitch-track': { bgcolor: alpha(PURPLE, 0.5) } }} />}
              label={<Typography variant="body2">Auto-refresh (15s)</Typography>}
            />
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ borderRadius: 2, border: `1px solid ${alpha(PURPLE, 0.12)}`, overflow: 'hidden' }}>
          <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(PURPLE, 0.1)}` }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Event log</Typography>
            <Typography variant="body2" color="text.secondary">
              {pagination.total} event{pagination.total === 1 ? '' : 's'} for your institution members
            </Typography>
          </Box>

          {loading && logs.length === 0 ? (
            <Box sx={{ p: 2 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} variant="rounded" height={52} sx={{ mb: 1, borderRadius: 1.5 }} />
              ))}
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(PURPLE, 0.04) }}>
                    <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Level</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Message</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Member</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>IP</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 56 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <Stack spacing={1} alignItems="center">
                          <LogsIcon sx={{ color: alpha(PURPLE, 0.45), fontSize: 40 }} />
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>No events found</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {filters.level || filters.search || filters.startDate || filters.endDate
                              ? 'Try adjusting your filters'
                              : 'Activity from your institution members will appear here'}
                          </Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log, index) => {
                      const ts = formatTimestamp(log.timestamp);
                      const memberLabel = log.member?.name || log.member?.email || '—';
                      return (
                        <TableRow key={`${log.timestamp}-${index}`} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{ts.date}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{ts.time}</Typography>
                          </TableCell>
                          <TableCell><LevelChip level={log.level} /></TableCell>
                          <TableCell sx={{ maxWidth: 360 }}>
                            <Typography variant="body2" noWrap title={log.message}>{log.message}</Typography>
                            {log.metadata?.endpoint ? (
                              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', fontFamily: 'monospace' }}>
                                {log.metadata.method} {log.metadata.endpoint}
                              </Typography>
                            ) : null}
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={0.75} alignItems="center">
                              <PeopleIcon sx={{ fontSize: 16, color: alpha(PURPLE, 0.55) }} />
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="body2" noWrap>{memberLabel}</Typography>
                                {log.member?.email && log.member?.name ? (
                                  <Typography variant="caption" color="text.secondary" noWrap>{log.member.email}</Typography>
                                ) : null}
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{log.metadata?.ip || '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Tooltip title="View details">
                              <IconButton size="small" sx={{ color: PURPLE }} onClick={() => setSelectedLog(log)}>
                                <InfoIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {logs.length > 0 ? (
            <TablePagination
              component="div"
              count={pagination.total}
              page={pagination.page}
              onPageChange={(_, newPage) => setPagination((prev) => ({ ...prev, page: newPage }))}
              rowsPerPage={pagination.limit}
              onRowsPerPageChange={(e) => setPagination({ page: 0, limit: parseInt(e.target.value, 10), total: pagination.total })}
              rowsPerPageOptions={[20, 50, 100]}
            />
          ) : null}
        </Paper>

        <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
          Logs are scoped to your institution members only. Platform-wide log management is handled by global administrators.
        </Alert>
      </Box>

      <InstitutionModal open={Boolean(selectedLog)} onClose={() => setSelectedLog(null)} maxWidth="sm">
        <InstitutionModalHeader
          icon={LogsIcon}
          title="Event details"
          subtitle={selectedLog ? formatTimestamp(selectedLog.timestamp).date : ''}
          onClose={() => setSelectedLog(null)}
        />
        <InstitutionModalBody>
          {selectedLog ? (
            <Stack spacing={2}>
              <InstitutionModalSection title="Summary">
                <Stack spacing={1.25}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">Level</Typography>
                    <LevelChip level={selectedLog.level} />
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" spacing={2}>
                    <Typography variant="body2" color="text.secondary">Message</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right', maxWidth: '70%' }}>{selectedLog.message}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Member</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedLog.member?.name || selectedLog.member?.email || '—'}</Typography>
                  </Stack>
                </Stack>
              </InstitutionModalSection>
              <InstitutionModalSection title="Metadata">
                <Box
                  component="pre"
                  sx={{
                    m: 0,
                    p: 1.5,
                    borderRadius: 1.5,
                    bgcolor: alpha(PURPLE, 0.04),
                    border: `1px solid ${alpha(PURPLE, 0.1)}`,
                    fontSize: '0.75rem',
                    overflow: 'auto',
                    maxHeight: 280,
                  }}
                >
                  {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                </Box>
              </InstitutionModalSection>
            </Stack>
          ) : null}
        </InstitutionModalBody>
        <InstitutionModalFooter>
          <Button onClick={() => setSelectedLog(null)} color="inherit">Close</Button>
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

export default LogsPage;
