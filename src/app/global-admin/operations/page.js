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
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  PlayArrow as RunIcon,
  ChevronRight as ChevronIcon,
} from '@mui/icons-material';
import GlobalAdminLayout from '../../../components/GlobalAdmin/GlobalAdminLayout';
import {
  useGlobalAdminGuard,
  PageHeader,
  SectionCard,
  StatTile,
  StatGrid,
  AttentionList,
  EmptyState,
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

  return (
    <GlobalAdminLayout>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <PageHeader
          title="Operations"
          subtitle="How HospitiumRIS is running: system health, usage per institution, modules in use, background jobs and errors."
          actions={
            <>
              <ToggleButtonGroup size="small" exclusive value={days} onChange={(_, v) => v && setDays(v)}>
                <ToggleButton value={7}>7 days</ToggleButton>
                <ToggleButton value={30}>30 days</ToggleButton>
                <ToggleButton value={90}>90 days</ToggleButton>
              </ToggleButtonGroup>
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load} disabled={loading}>
                Refresh
              </Button>
            </>
          }
        />

        {loading && <LinearProgress sx={{ mb: 2 }} />}
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {data && (
          <>
            <SectionCard title="Needs attention">
              <AttentionList items={data.attention} onOpen={openTab} />
            </SectionCard>

            <StatGrid>
              <StatTile label="Active accounts" value={formatNumber(k.activeAccounts)} hint={`${k.institutions} institutions`} />
              <StatTile label={`Signed in, last ${days} days`} value={formatNumber(k.signedInUsers)} hint="distinct users" />
              <StatTile
                label="Failed sign-ins, 24 h"
                value={formatNumber(k.failedSignIns24h)}
                tone={k.failedSignIns24h > 20 ? 'warning' : undefined}
              />
              <StatTile label="Files stored" value={formatBytes(k.storageBytes)} hint={`${formatNumber(k.files)} files`} />
              <StatTile label="Activity today" value={formatNumber(k.usageEventsToday)} hint="page views & actions" />
              <StatTile label="Errors, 24 h" value={formatNumber(k.errors24h)} tone={k.errors24h ? 'error' : undefined} />
            </StatGrid>

            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant="scrollable"
              allowScrollButtonsMobile
              sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
            >
              {TABS.map((key) => (
                <Tab key={key} value={key} label={TAB_LABELS[key]} sx={{ textTransform: 'none', fontWeight: 600 }} />
              ))}
            </Tabs>

            {tab === 'health' && (
              <>
                <StatGrid>
                  <StatTile
                    label="Database"
                    value={data.system.database.status === 'healthy' ? 'Healthy' : data.system.database.status === 'warning' ? 'Slow' : 'Down'}
                    hint={data.system.database.latencyMs != null ? `${data.system.database.latencyMs} ms round trip` : data.system.database.error}
                    tone={data.system.database.status === 'error' ? 'error' : data.system.database.status === 'warning' ? 'warning' : undefined}
                  />
                  <StatTile
                    label="Server memory"
                    value={`${data.system.memoryUsagePct}%`}
                    tone={data.system.memoryUsagePct >= 90 ? 'warning' : undefined}
                  />
                  <StatTile label="App uptime" value={formatUptime(data.system.processUptimeSeconds)} hint={`Host up ${formatUptime(data.system.hostUptimeSeconds)}`} />
                  <StatTile label="Node.js" value={data.system.nodeVersion} />
                  <StatTile
                    label="Jobs healthy"
                    value={`${data.jobs.filter((j) => j.status === 'ok').length}/${data.jobs.length}`}
                    tone={data.jobs.some((j) => j.status === 'failed') ? 'error' : data.jobs.some((j) => j.status !== 'ok') ? 'warning' : undefined}
                  />
                  <StatTile label="Usage retention" value={`${data.retention.usageDays} d`} hint={`Sign-ins ${data.retention.authDays} d · admin ${Math.round(data.retention.adminDays / 365)} y`} />
                </StatGrid>
                <Alert severity="info" sx={{ mb: 3 }}>
                  CPU, disk and connection details are on the <Button size="small" onClick={() => router.push('/global-admin/health')}>System health</Button> page.
                </Alert>
              </>
            )}

            {tab === 'usage' && (
              <SectionCard
                title="Usage by institution"
                subtitle={`Last ${days} days. Counts only: no record content is read. Click a row for the institution's activity.`}
                action={
                  <TextField
                    size="small"
                    placeholder="Search institutions"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                  />
                }
              >
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {sortHeader('name', 'Institution', 'left')}
                        {sortHeader('accounts', 'Accounts')}
                        {sortHeader('activeUsers', 'Active users')}
                        {sortHeader('signIns', 'Sign-ins')}
                        {sortHeader('failedSignIns', 'Failed sign-ins')}
                        {sortHeader('events', 'Activity')}
                        <TableCell>Most used modules</TableCell>
                        {sortHeader('storageBytes', 'Files stored')}
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
                          <TableCell align="right" sx={{ color: row.failedSignIns >= 10 ? 'error.main' : undefined }}>
                            {formatNumber(row.failedSignIns)}
                          </TableCell>
                          <TableCell align="right">{formatNumber(row.events)}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {row.topModules.length
                                ? row.topModules.map((m) => <Chip key={m.key} size="small" label={m.label} variant="outlined" />)
                                : <Typography variant="caption" color="text.secondary">No activity</Typography>}
                            </Box>
                          </TableCell>
                          <TableCell align="right">{formatBytes(row.storageBytes)}</TableCell>
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
              </SectionCard>
            )}

            {tab === 'modules' && (
              <SectionCard
                title="Modules in use"
                subtitle={`Across all institutions, last ${days} days. "Enabled at" counts institutions that have the module switched on.`}
              >
                <TableContainer>
                  <Table size="small">
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
                        <TableRow key={m.key}>
                          <TableCell sx={{ fontWeight: 600 }}>{m.label}</TableCell>
                          <TableCell align="right">{formatNumber(m.institutions)}</TableCell>
                          <TableCell align="right">{m.enabledAt == null ? '—' : formatNumber(m.enabledAt)}</TableCell>
                          <TableCell align="right">{formatNumber(m.users)}</TableCell>
                          <TableCell align="right">{formatNumber(m.views)}</TableCell>
                          <TableCell align="right">{formatNumber(m.actions)}</TableCell>
                          <TableCell>{m.lastUsedAt ? timeAgo(m.lastUsedAt) : 'Not used'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {!data.modules.length && <EmptyState>No module activity recorded yet.</EmptyState>}
              </SectionCard>
            )}

            {tab === 'jobs' && (
              <SectionCard
                title="Background jobs"
                subtitle="Scheduled with an external cron calling the job URL with Authorization: Bearer $CRON_SECRET. Every run is written to the audit log."
              >
                {jobMessage && <Alert severity={jobMessage.severity} sx={{ mb: 2 }} onClose={() => setJobMessage(null)}>{jobMessage.text}</Alert>}
                <TableContainer>
                  <Table size="small">
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
                          <TableRow key={job.key}>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{job.label}</Typography>
                              <Typography variant="caption" color="text.secondary">{job.description}</Typography>
                            </TableCell>
                            <TableCell><Chip size="small" label={s.label} color={s.color} variant="outlined" /></TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              {job.lastRunAt ? formatDate(job.lastRunAt, { time: true }) : 'Never'}
                              {job.lastTriggeredBy && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {job.lastTriggeredBy === 'manual' ? 'Run by an admin' : 'Scheduled'}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ maxWidth: 360 }}>
                              <Typography variant="body2">{job.lastSummary || '—'}</Typography>
                            </TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              <Typography variant="body2">Every {job.expectedEveryHours} h</Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{job.cronPath}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<RunIcon />}
                                disabled={Boolean(runningJob)}
                                onClick={() => runJob(job.key)}
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
              </SectionCard>
            )}

            {tab === 'errors' && (
              <SectionCard
                title="Application errors, last 24 hours"
                subtitle="From the server activity log. Expected sign-in failures are excluded; see the audit log for those."
              >
                {data.errors.length ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {data.errors.map((e, idx) => (
                      <Paper key={`${e.timestamp}-${idx}`} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{e.message}</Typography>
                          <Typography variant="caption" color="text.secondary">{formatDate(e.timestamp, { time: true })}</Typography>
                        </Box>
                        {(e.endpoint || e.detail) && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', display: 'block', mt: 0.5 }}>
                            {[e.endpoint, e.statusCode, e.detail].filter(Boolean).join(' · ')}
                          </Typography>
                        )}
                      </Paper>
                    ))}
                  </Box>
                ) : (
                  <EmptyState>No application errors in the last 24 hours.</EmptyState>
                )}
              </SectionCard>
            )}

            <Typography variant="caption" color="text.secondary">
              Updated {formatDate(data.generatedAt, { time: true })}
            </Typography>
          </>
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
