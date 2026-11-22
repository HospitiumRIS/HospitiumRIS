'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Container,
  Button,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TableSortLabel,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  LinearProgress,
  Chip,
  Typography,
  Alert,
  Tooltip,
  Paper,
  Skeleton,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  PlayArrow as RunIcon,
  ChevronRight as ChevronIcon,
  PeopleAltOutlined as AccountsIcon,
  LoginOutlined as SignInIcon,
  LockOutlined as LockIcon,
  FolderOutlined as StorageIcon,
  TouchAppOutlined as ActivityIcon,
  BugReportOutlined as BugIcon,
  StorageOutlined as DatabaseIcon,
  MemoryOutlined as MemoryIcon,
  TimerOutlined as UptimeIcon,
  CodeOutlined as CodeIcon,
  ScheduleOutlined as JobsIcon,
  InventoryOutlined as RetentionIcon,
  ErrorOutline as ErrorDotIcon,
  CheckCircleOutline as OkIcon,
} from '@mui/icons-material';
import GlobalAdminLayout from '../../../components/GlobalAdmin/GlobalAdminLayout';
import {
  useGlobalAdminGuard,
  PageHeader,
  SectionCard,
  StatTile,
  StatGrid,
  StatusPill,
  AttentionList,
  EmptyState,
  tableSx,
  formatBytes,
  formatNumber,
  formatDate,
  timeAgo,
} from '../../../components/GlobalAdmin/ops/OpsUi';

const TABS = ['health', 'usage', 'modules', 'jobs', 'errors'];
const TAB_LABELS = { health: 'Health', usage: 'Usage by institution', modules: 'Modules', jobs: 'Jobs', errors: 'Errors' };

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return d ? `${d}d ${h}h` : `${h}h ${m}m`;
}

const JOB_STATUS = {
  ok: { label: 'Healthy', color: 'success' },
  overdue: { label: 'Overdue', color: 'warning' },
  failed: { label: 'Failed', color: 'error' },
  never_run: { label: 'Never run', color: 'default' },
};

function OperationsPageInner() {
  const { ready } = useGlobalAdminGuard();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = TABS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'health';

  const [tab, setTab] = useState(initialTab);
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ key: 'activeUsers', dir: 'desc' });
  const [runningJob, setRunningJob] = useState('');
  const [jobMessage, setJobMessage] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/global-admin/operations?days=${days}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load');
      setData(json.data);
    } catch (err) {
      setError(err.message || 'Failed to load operations data');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  const openTab = (target) => {
    if (target === 'audit') {
      router.push('/global-admin/audit?category=AUTH&outcome=FAILURE');
      return;
    }
    setTab(target);
  };

  const runJob = async (key) => {
    setRunningJob(key);
    setJobMessage(null);
    try {
      const res = await fetch(`/api/global-admin/operations/jobs/${key}`, { method: 'POST' });
      const json = await res.json();
      setJobMessage({ severity: json.success ? 'success' : 'error', text: json.message || (json.success ? 'Done' : 'Job failed') });
      await load();
    } catch (err) {
      setJobMessage({ severity: 'error', text: err.message });
    } finally {
      setRunningJob('');
    }
  };

  const institutions = useMemo(() => {
    const rows = (data?.institutions || []).filter((row) =>
      row.name.toLowerCase().includes(search.trim().toLowerCase())
    );
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (sort.key === 'name') return dir * String(av).localeCompare(String(bv));
      if (sort.key === 'lastSignInAt') return dir * ((av ? new Date(av).getTime() : 0) - (bv ? new Date(bv).getTime() : 0));
      return dir * ((Number(av) || 0) - (Number(bv) || 0));
    });
  }, [data, search, sort]);

  const sortHeader = (key, label, align = 'right') => (
    <TableCell align={align} sortDirection={sort.key === key ? sort.dir : false} sx={{ whiteSpace: 'nowrap' }}>
      <TableSortLabel
        active={sort.key === key}
        direction={sort.key === key ? sort.dir : 'desc'}
        onClick={() => setSort((s) => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }))}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );

  if (!ready) return null;
  const k = data?.kpis;
  const firstLoad = loading && !data;

  const jobsOk = data ? data.jobs.filter((j) => j.status === 'ok').length : 0;
  const jobsTone = data?.jobs.some((j) => j.status === 'failed')
    ? 'error'
    : data?.jobs.some((j) => j.status !== 'ok')
      ? 'warning'
      : 'success';
  const tabBadges = data
    ? {
        jobs: jobsTone === 'success' ? null : { count: data.jobs.length - jobsOk, color: jobsTone },
        errors: data.errors.length ? { count: data.errors.length, color: 'error' } : null,
      }
    : {};
  const db = data?.system.database;
  const dbTone = db?.status === 'error' ? 'error' : db?.status === 'warning' ? 'warning' : 'success';

  return (
    <GlobalAdminLayout>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
        <PageHeader
          title="Operations"
          subtitle="How HospitiumRIS is running: system health, usage per institution, modules in use, background jobs and errors."
          meta={data ? `Updated ${formatDate(data.generatedAt, { time: true })}` : null}
          actions={
            <>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={days}
                onChange={(_, v) => v && setDays(v)}
                aria-label="Period"
                sx={{
                  '& .MuiToggleButton-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 1.5,
                    py: 0.5,
                    borderColor: 'divider',
                  },
                  '& .Mui-selected': { color: 'primary.main' },
                }}
              >
                <ToggleButton value={7}>7 days</ToggleButton>
                <ToggleButton value={30}>30 days</ToggleButton>
                <ToggleButton value={90}>90 days</ToggleButton>
              </ToggleButtonGroup>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={load}
                disabled={loading}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
              >
                Refresh
              </Button>
            </>
          }
        />

        {loading && data && <LinearProgress sx={{ mb: 2, borderRadius: 1, height: 3 }} />}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            action={<Button color="inherit" size="small" onClick={load}>Try again</Button>}
          >
            {error}
          </Alert>
        )}

        {/* KPI tiles */}
        <StatGrid>
          <StatTile
            icon={AccountsIcon}
            label="Active accounts"
            value={formatNumber(k?.activeAccounts)}
            hint={k ? `${k.institutions} institutions` : ' '}
            loading={firstLoad}
          />
          <StatTile
            icon={SignInIcon}
            tone="info"
            label={`Signed in, last ${days} days`}
            value={formatNumber(k?.signedInUsers)}
            hint="distinct users"
            loading={firstLoad}
          />
          <StatTile
            icon={LockIcon}
            label="Failed sign-ins, 24 h"
            value={formatNumber(k?.failedSignIns24h)}
            hint="wrong password or unknown account"
            tone={k?.failedSignIns24h > 20 ? 'warning' : undefined}
            loading={firstLoad}
          />
          <StatTile
            icon={StorageIcon}
            label="Files stored"
            value={formatBytes(k?.storageBytes)}
            hint={k ? `${formatNumber(k.files)} files` : ' '}
            loading={firstLoad}
          />
          <StatTile
            icon={ActivityIcon}
            tone="success"
            label="Activity today"
            value={formatNumber(k?.usageEventsToday)}
            hint="page views & actions"
            loading={firstLoad}
          />
          <StatTile
            icon={BugIcon}
            label="Errors, 24 h"
            value={formatNumber(k?.errors24h)}
            hint={k?.errors24h ? 'see the Errors tab' : 'all clear'}
            tone={k?.errors24h ? 'error' : undefined}
            loading={firstLoad}
          />
        </StatGrid>

        {data && (
          <>
            <SectionCard
              title="Needs attention"
              flush
              action={
                data.attention?.length ? (
                  <StatusPill
                    label={`${data.attention.length} ${data.attention.length === 1 ? 'item' : 'items'}`}
                    color={
                      data.attention.some((a) => a.severity === 'error')
                        ? 'error'
                        : data.attention.some((a) => a.severity === 'warning')
                          ? 'warning'
                          : 'info'
                    }
                  />
                ) : null
              }
            >
              <AttentionList items={data.attention} onOpen={openTab} />
            </SectionCard>

            {/* Tabbed detail */}
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', mb: 2 }}>
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                variant="scrollable"
                allowScrollButtonsMobile
                sx={{
                  px: { xs: 1, md: 2 },
                  borderBottom: 1,
                  borderColor: 'divider',
                  minHeight: 48,
                  '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 48, fontSize: '0.875rem' },
                }}
              >
                {TABS.map((key) => (
                  <Tab
                    key={key}
                    value={key}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {TAB_LABELS[key]}
                        {tabBadges[key] && <StatusPill label={tabBadges[key].count} color={tabBadges[key].color} />}
                      </Box>
                    }
                  />
                ))}
              </Tabs>

              <Box>
                {tab === 'health' && (
                  <Box sx={{ p: { xs: 2, md: 3 } }}>
                    <StatGrid sx={{ mb: 2 }}>
                      <StatTile
                        icon={DatabaseIcon}
                        label="Database"
                        value={db.status === 'healthy' ? 'Healthy' : db.status === 'warning' ? 'Slow' : 'Down'}
                        hint={db.latencyMs != null ? `${db.latencyMs} ms round trip` : db.error}
                        tone={dbTone}
                      />
                      <StatTile
                        icon={MemoryIcon}
                        label="Server memory"
                        value={`${data.system.memoryUsagePct}%`}
                        hint="of host memory in use"
                        tone={data.system.memoryUsagePct >= 90 ? 'warning' : undefined}
                      />
                      <StatTile
                        icon={UptimeIcon}
                        label="App uptime"
                        value={formatUptime(data.system.processUptimeSeconds)}
                        hint={`Host up ${formatUptime(data.system.hostUptimeSeconds)}`}
                      />
                      <StatTile icon={CodeIcon} label="Node.js" value={data.system.nodeVersion} hint="runtime version" />
                      <StatTile
                        icon={JobsIcon}
                        label="Jobs healthy"
                        value={`${jobsOk}/${data.jobs.length}`}
                        hint="background jobs on schedule"
                        tone={jobsTone}
                      />
                      <StatTile
                        icon={RetentionIcon}
                        label="Usage retention"
                        value={`${data.retention.usageDays} d`}
                        hint={`Sign-ins ${data.retention.authDays} d · admin ${Math.round(data.retention.adminDays / 365)} y`}
                      />
                    </StatGrid>
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1.5,
                        px: 2,
                        py: 1.5,
                        borderRadius: 1.5,
                        bgcolor: 'action.hover',
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        CPU, disk and connection details are on the System health page.
                      </Typography>
                      <Button
                        size="small"
                        endIcon={<ChevronIcon fontSize="small" />}
                        onClick={() => router.push('/global-admin/health')}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        Open System health
                      </Button>
                    </Box>
                  </Box>
                )}

                {tab === 'usage' && (
                  <>
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                        px: { xs: 2, md: 3 },
                        py: 2,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" sx={{ flex: '1 1 320px' }}>
                        Last {days} days. Counts only: no record content is read. Click a row for the institution&apos;s activity.
                      </Typography>
                      <TextField
                        size="small"
                        placeholder="Search institutions"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{ width: { xs: '100%', sm: 260 } }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>
                    <TableContainer sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                      <Table size="small" sx={tableSx}>
                        <TableHead>
                          <TableRow>
                            {sortHeader('name', 'Institution', 'left')}
                            {sortHeader('accounts', 'Accounts')}
                            {sortHeader('activeUsers', 'Active users')}
                            {sortHeader('signIns', 'Sign-ins')}
                            {sortHeader('failedSignIns', 'Failed')}
                            {sortHeader('events', 'Activity')}
                            <TableCell>Most used modules</TableCell>
                            {sortHeader('storageBytes', 'Files')}
                            {sortHeader('lastSignInAt', 'Last sign-in')}
                            <TableCell />
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {institutions.map((row) => (
                            <TableRow
                              key={row.id}
                              hover
                              sx={{ cursor: 'pointer' }}
                              onClick={() => router.push(`/global-admin/operations/institutions/${row.id}?days=${days}`)}
                            >
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {[row.type, row.country].filter(Boolean).join(' · ')}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">{formatNumber(row.accounts)}</TableCell>
                              <TableCell align="right">{formatNumber(row.activeUsers)}</TableCell>
                              <TableCell align="right">{formatNumber(row.signIns)}</TableCell>
                              <TableCell align="right" sx={{ color: row.failedSignIns >= 10 ? 'error.main' : undefined, fontWeight: row.failedSignIns >= 10 ? 600 : undefined }}>
                                {formatNumber(row.failedSignIns)}
                              </TableCell>
                              <TableCell align="right">{formatNumber(row.events)}</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                  {row.topModules.length ? (
                                    row.topModules.map((m) => (
                                      <Chip key={m.key} size="small" label={m.label} sx={{ height: 22, fontSize: '0.72rem' }} />
                                    ))
                                  ) : (
                                    <Typography variant="caption" color="text.disabled">No activity</Typography>
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{formatBytes(row.storageBytes)}</TableCell>
                              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                <Tooltip title={formatDate(row.lastSignInAt, { time: true })}>
                                  <span>{row.lastSignInAt ? timeAgo(row.lastSignInAt) : 'Never'}</span>
                                </Tooltip>
                              </TableCell>
                              <TableCell padding="checkbox"><ChevronIcon fontSize="small" color="action" /></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    {!institutions.length && <EmptyState>No institutions match.</EmptyState>}
                  </>
                )}

                {tab === 'modules' && (
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
                      Across all institutions, last {days} days. &quot;Enabled at&quot; counts institutions that have the module switched on.
                    </Typography>
                    <TableContainer sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                      <Table size="small" sx={tableSx}>
                        <TableHead>
                          <TableRow>
                            <TableCell>Module</TableCell>
                            <TableCell align="right">Institutions using</TableCell>
                            <TableCell align="right">Enabled at</TableCell>
                            <TableCell align="right">Users</TableCell>
                            <TableCell align="right">Page views</TableCell>
                            <TableCell align="right">Actions</TableCell>
                            <TableCell>Last used</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {data.modules.map((m) => (
                            <TableRow key={m.key} hover>
                              <TableCell sx={{ fontWeight: 600 }}>{m.label}</TableCell>
                              <TableCell align="right">{formatNumber(m.institutions)}</TableCell>
                              <TableCell align="right">{m.enabledAt == null ? '—' : formatNumber(m.enabledAt)}</TableCell>
                              <TableCell align="right">{formatNumber(m.users)}</TableCell>
                              <TableCell align="right">{formatNumber(m.views)}</TableCell>
                              <TableCell align="right">{formatNumber(m.actions)}</TableCell>
                              <TableCell sx={{ whiteSpace: 'nowrap', color: m.lastUsedAt ? undefined : 'text.disabled' }}>
                                {m.lastUsedAt ? timeAgo(m.lastUsedAt) : 'Not used'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    {!data.modules.length && <EmptyState>No module activity recorded yet.</EmptyState>}
                  </>
                )}

                {tab === 'jobs' && (
                  <>
                    <Box sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Scheduled with an external cron calling the job URL with{' '}
                        <Box component="code" sx={{ fontSize: '0.8rem', px: 0.5, borderRadius: 0.5, bgcolor: 'action.hover' }}>
                          Authorization: Bearer $CRON_SECRET
                        </Box>
                        . Every run is written to the audit log.
                      </Typography>
                      {jobMessage && (
                        <Alert severity={jobMessage.severity} sx={{ mt: 2 }} onClose={() => setJobMessage(null)}>
                          {jobMessage.text}
                        </Alert>
                      )}
                    </Box>
                    <TableContainer sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                      <Table size="small" sx={tableSx}>
                        <TableHead>
                          <TableRow>
                            <TableCell>Job</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Last run</TableCell>
                            <TableCell>Result</TableCell>
                            <TableCell>Schedule</TableCell>
                            <TableCell align="right" />
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {data.jobs.map((job) => {
                            const s = JOB_STATUS[job.status] || JOB_STATUS.never_run;
                            return (
                              <TableRow key={job.key} hover>
                                <TableCell sx={{ minWidth: 220 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{job.label}</Typography>
                                  <Typography variant="caption" color="text.secondary">{job.description}</Typography>
                                </TableCell>
                                <TableCell><StatusPill label={s.label} color={s.color} /></TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                  <Typography variant="body2">
                                    {job.lastRunAt ? formatDate(job.lastRunAt, { time: true }) : 'Never'}
                                  </Typography>
                                  {job.lastTriggeredBy && (
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      {job.lastTriggeredBy === 'manual' ? 'Run by an admin' : 'Scheduled'}
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell sx={{ maxWidth: 360 }}>
                                  <Typography variant="body2" color={job.lastSummary ? 'text.primary' : 'text.disabled'}>
                                    {job.lastSummary || '—'}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                  <Typography variant="body2">Every {job.expectedEveryHours} h</Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                                    {job.cronPath}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<RunIcon />}
                                    disabled={Boolean(runningJob)}
                                    onClick={() => runJob(job.key)}
                                    sx={{ textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap', borderRadius: 1.5 }}
                                  >
                                    {runningJob === job.key ? 'Running…' : 'Run now'}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}

                {tab === 'errors' && (
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
                      Application errors in the last 24 hours, from the server activity log. Expected sign-in failures are excluded; see the audit log for those.
                    </Typography>
                    {data.errors.length ? (
                      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, borderTop: '1px solid', borderColor: 'divider' }}>
                        {data.errors.map((e, idx) => (
                          <Box
                            component="li"
                            key={`${e.timestamp}-${idx}`}
                            sx={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 1.5,
                              px: { xs: 2, md: 3 },
                              py: 1.5,
                              borderTop: idx === 0 ? 'none' : '1px solid',
                              borderColor: 'divider',
                            }}
                          >
                            <ErrorDotIcon sx={{ fontSize: 18, color: 'error.main', mt: 0.25 }} />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>{e.message}</Typography>
                              {(e.endpoint || e.detail) && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ fontFamily: 'monospace', display: 'block', mt: 0.5, wordBreak: 'break-all' }}
                                >
                                  {[e.endpoint, e.statusCode, e.detail].filter(Boolean).join(' · ')}
                                </Typography>
                              )}
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                              {formatDate(e.timestamp, { time: true })}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                        <EmptyState icon={OkIcon}>No application errors in the last 24 hours.</EmptyState>
                      </Box>
                    )}
                  </>
                )}
              </Box>
            </Paper>
          </>
        )}

        {firstLoad && (
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 3 }}>
            <Skeleton width={180} height={28} />
            <Skeleton height={44} />
            <Skeleton height={44} />
            <Skeleton height={44} width="70%" />
          </Paper>
        )}
      </Container>
    </GlobalAdminLayout>
  );
}

export default function OperationsPage() {
  return (
    <React.Suspense fallback={null}>
      <OperationsPageInner />
    </React.Suspense>
  );
}
