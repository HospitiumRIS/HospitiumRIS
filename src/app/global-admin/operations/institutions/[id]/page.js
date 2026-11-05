'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Container,
  Button,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  ToggleButton,
  ToggleButtonGroup,
  LinearProgress,
  Typography,
  Alert,
  Tooltip,
} from '@mui/material';
import { ArrowBack as BackIcon, Refresh as RefreshIcon, ListAlt as AuditIcon, Settings as ManageIcon, Lock as PrivacyIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
} from 'recharts';
import GlobalAdminLayout from '../../../../../components/GlobalAdmin/GlobalAdminLayout';
import {
  useGlobalAdminGuard,
  PageHeader,
  SectionCard,
  StatTile,
  StatGrid,
  EmptyState,
  OutcomeChip,
  ActionChip,
  formatBytes,
  formatNumber,
  formatDate,
  timeAgo,
  describeDevice,
} from '../../../../../components/GlobalAdmin/ops/OpsUi';

const REASON_LABELS = {
  missing_credentials: 'Missing email or password',
  user_not_found: 'Unknown email',
  account_not_verified: 'Not activated',
  account_suspended: 'Suspended',
  invalid_password: 'Wrong password',
  orcid_not_linked: 'ORCID not linked',
  unexpected_error: 'Server error',
};

const ACCOUNT_TYPE_LABELS = {
  RESEARCHER: 'Researchers',
  RESEARCH_ADMIN: 'Research admins',
  INSTITUTION_ADMIN: 'Institution admins',
  FOUNDATION_ADMIN: 'Foundation admins',
};

function ModuleStatus({ module }) {
  if (module.enabled === false) return <Chip size="small" label="Not enabled" variant="outlined" />;
  if (module.enabled && !module.views && !module.actions) return <Chip size="small" label="Enabled · not used" color="warning" variant="outlined" />;
  if (module.enabled) return <Chip size="small" label="Enabled" color="success" variant="outlined" />;
  return <Chip size="small" label="Always on" variant="outlined" />;
}

function KeyValueList({ rows, empty }) {
  if (!rows.length) return <EmptyState>{empty}</EmptyState>;
  return (
    <Table size="small">
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.label}>
            <TableCell sx={{ pl: 0 }}>{row.label}</TableCell>
            <TableCell align="right" sx={{ pr: 0, fontWeight: 600 }}>{row.value}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function InstitutionActivityInner() {
  const { ready } = useGlobalAdminGuard();
  const theme = useTheme();
  const router = useRouter();
  const { id } = useParams();
  const searchParams = useSearchParams();
  const [days, setDays] = useState(() => {
    const d = Number(searchParams.get('days'));
    return [7, 30, 90].includes(d) ? d : 30;
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/global-admin/operations/institutions/${id}?days=${days}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load');
      setData(json.data);
    } catch (err) {
      setError(err.message || 'Failed to load institution activity');
    } finally {
      setLoading(false);
    }
  }, [id, days]);

  useEffect(() => {
    if (ready && id) load();
  }, [ready, id, load]);

  if (!ready) return null;
  const k = data?.kpis;
  const inst = data?.institution;

  return (
    <GlobalAdminLayout>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <PageHeader
          back={
            <Button startIcon={<BackIcon />} size="small" sx={{ mb: 1, ml: -1 }} onClick={() => router.push('/global-admin/operations?tab=usage')}>
              Operations
            </Button>
          }
          title={inst?.name || 'Institution activity'}
          subtitle={inst ? [inst.type, inst.country, `on HospitiumRIS since ${formatDate(inst.createdAt)}`].filter(Boolean).join(' · ') : ''}
          actions={
            <>
              <ToggleButtonGroup size="small" exclusive value={days} onChange={(_, v) => v && setDays(v)}>
                <ToggleButton value={7}>7 d</ToggleButton>
                <ToggleButton value={30}>30 d</ToggleButton>
                <ToggleButton value={90}>90 d</ToggleButton>
              </ToggleButtonGroup>
              <Tooltip title="Refresh">
                <span>
                  <Button variant="outlined" onClick={load} disabled={loading}><RefreshIcon fontSize="small" /></Button>
                </span>
              </Tooltip>
            </>
          }
        />

        {loading && <LinearProgress sx={{ mb: 2 }} />}
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {data && (
          <>
            <Alert icon={<PrivacyIcon fontSize="small" />} severity="info" sx={{ mb: 3 }}
              action={
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" color="inherit" startIcon={<AuditIcon fontSize="small" />} onClick={() => router.push(`/global-admin/audit?institutionId=${id}`)}>
                    Audit log
                  </Button>
                  <Button size="small" color="inherit" startIcon={<ManageIcon fontSize="small" />} onClick={() => router.push(`/global-admin/institutions/${id}`)}>
                    Manage
                  </Button>
                </Box>
              }
            >
              Activity is shown as counts and timestamps only. Nothing here opens this institution&apos;s records, documents or submissions.
            </Alert>

            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 3, alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>Enabled modules:</Typography>
              {inst.enabledModules.length
                ? inst.enabledModules.map((key) => <Chip key={key} size="small" label={key.replace(/_/g, ' ')} sx={{ textTransform: 'capitalize' }} />)
                : <Chip size="small" label="None" />}
            </Box>

            <StatGrid>
              <StatTile label="Active accounts" value={formatNumber(k.accounts)} hint={`${formatNumber(k.newAccounts)} new in ${days} d`} />
              <StatTile label="Active users" value={formatNumber(k.activeUsers)} hint={k.accounts ? `${Math.round((k.activeUsers / k.accounts) * 100)}% of accounts` : undefined} />
              <StatTile label="Sign-ins" value={formatNumber(k.signIns)} hint={`Last ${k.lastSignInAt ? timeAgo(k.lastSignInAt) : 'never'}`} />
              <StatTile label="Failed sign-ins" value={formatNumber(k.failedSignIns)} tone={k.failedSignIns >= 20 ? 'warning' : undefined} />
              <StatTile label="Actions" value={formatNumber(k.actions)} hint={`${formatNumber(k.views)} page views`} />
              <StatTile label="Files stored" value={formatBytes(k.storageBytes)} hint={`${formatNumber(k.files)} files`} />
            </StatGrid>

            <SectionCard title="Activity over time" subtitle="Daily page views, actions, active users and sign-ins.">
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <ComposedChart data={data.trend} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
                    <XAxis dataKey="day" tickFormatter={(d) => d.slice(5)} tick={{ fontSize: 12, fill: theme.palette.text.secondary }} minTickGap={16} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: theme.palette.text.secondary }} />
                    <ChartTooltip contentStyle={{ background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area type="monotone" dataKey="views" name="Page views" stroke={theme.palette.primary.main} fill={theme.palette.primary.main} fillOpacity={0.12} strokeWidth={2} />
                    <Bar dataKey="actions" name="Actions" fill={theme.palette.secondary.main} barSize={8} radius={[3, 3, 0, 0]} />
                    <Line type="monotone" dataKey="activeUsers" name="Active users" stroke={theme.palette.success.main} dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="signIns" name="Sign-ins" stroke={theme.palette.info.main} dot={false} strokeWidth={2} strokeDasharray="4 3" />
                    <Line type="monotone" dataKey="failedSignIns" name="Failed sign-ins" stroke={theme.palette.error.main} dot={false} strokeWidth={1.5} />
                  </ComposedChart>
                </ResponsiveContainer>
              </Box>
            </SectionCard>

            <SectionCard title="Modules" subtitle={`Which parts of HospitiumRIS this institution used in the last ${days} days.`}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Module</TableCell>
                      <TableCell>Status</TableCell>
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
                        <TableCell><ModuleStatus module={m} /></TableCell>
                        <TableCell align="right">{formatNumber(m.users)}</TableCell>
                        <TableCell align="right">{formatNumber(m.views)}</TableCell>
                        <TableCell align="right">{formatNumber(m.actions)}</TableCell>
                        <TableCell>{m.lastUsedAt ? timeAgo(m.lastUsedAt) : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {!data.modules.length && <EmptyState>No module activity yet.</EmptyState>}
            </SectionCard>

            <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' } }}>
              <SectionCard title="Accounts by role" sx={{ mb: 0 }}>
                <KeyValueList
                  empty="No accounts."
                  rows={data.accountsByType.map((r) => ({ label: ACCOUNT_TYPE_LABELS[r.accountType] || r.accountType, value: formatNumber(r.count) }))}
                />
              </SectionCard>
              <SectionCard title="Accounts by status" sx={{ mb: 0 }}>
                <KeyValueList
                  empty="No accounts."
                  rows={data.accountsByStatus.map((r) => ({ label: r.status.charAt(0) + r.status.slice(1).toLowerCase(), value: formatNumber(r.count) }))}
                />
              </SectionCard>
              <SectionCard title="Storage by module" sx={{ mb: 0 }}>
                <KeyValueList
                  empty="No files stored."
                  rows={data.storageByModule.map((r) => ({
                    label: r.module.toLowerCase().replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()),
                    value: `${formatBytes(r.bytes)} · ${formatNumber(r.files)}`,
                  }))}
                />
              </SectionCard>
            </Box>
            <Box sx={{ mb: 3 }} />

            <SectionCard title="Most active people" subtitle="By number of page views and actions. Counts only.">
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Person</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell align="right">Sign-ins</TableCell>
                      <TableCell align="right">Page views</TableCell>
                      <TableCell align="right">Actions</TableCell>
                      <TableCell align="right">Modules</TableCell>
                      <TableCell>Last active</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.topUsers.map((u) => (
                      <TableRow key={u.userId} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{u.name}</TableCell>
                        <TableCell>{ACCOUNT_TYPE_LABELS[u.accountType]?.replace(/s$/, '') || u.accountType || '—'}</TableCell>
                        <TableCell align="right">{formatNumber(u.signIns)}</TableCell>
                        <TableCell align="right">{formatNumber(u.views)}</TableCell>
                        <TableCell align="right">{formatNumber(u.actions)}</TableCell>
                        <TableCell align="right">{formatNumber(u.modules)}</TableCell>
                        <TableCell>{timeAgo(u.lastActiveAt)}</TableCell>
                        <TableCell align="right">
                          <Button size="small" onClick={() => router.push(`/global-admin/audit?category=USAGE&actorUserId=${u.userId}`)}>Activity</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {!data.topUsers.length && <EmptyState>No activity recorded in this period.</EmptyState>}
            </SectionCard>

            <SectionCard
              title="Recent sign-in activity"
              subtitle="Successful and failed sign-ins, sign-outs and account events."
              action={<Button size="small" onClick={() => router.push(`/global-admin/audit?category=AUTH&institutionId=${id}`)}>View all</Button>}
            >
              {data.failedSignInSources.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Failed sign-ins in this period came mostly from:{' '}
                  {data.failedSignInSources.map((s) => `${s.ipAddress} (${s.count})`).join(', ')}
                </Alert>
              )}
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>When</TableCell>
                      <TableCell>Who</TableCell>
                      <TableCell>Event</TableCell>
                      <TableCell>Result</TableCell>
                      <TableCell>IP address</TableCell>
                      <TableCell>Device</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.recentSignIns.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(e.createdAt, { time: true })}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{e.actorName || e.actorEmail || 'Unknown'}</Typography>
                          {e.actorName && e.actorEmail && <Typography variant="caption" color="text.secondary">{e.actorEmail}</Typography>}
                        </TableCell>
                        <TableCell><ActionChip action={e.action} category="AUTH" /></TableCell>
                        <TableCell>
                          <OutcomeChip outcome={e.outcome} />
                          {e.reason && <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>{REASON_LABELS[e.reason] || e.reason}</Typography>}
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 13 }}>{e.ipAddress || '—'}</TableCell>
                        <TableCell>{describeDevice(e.userAgent) || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {!data.recentSignIns.length && <EmptyState>No sign-in events recorded yet.</EmptyState>}
            </SectionCard>

            <SectionCard
              title="Recent admin changes"
              subtitle="Changes made by administrators for this institution."
              action={<Button size="small" onClick={() => router.push(`/global-admin/audit?category=ADMIN&institutionId=${id}`)}>View all</Button>}
            >
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>When</TableCell>
                      <TableCell>Done by</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>What happened</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.recentAdminChanges.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(e.createdAt, { time: true })}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{e.actorName || 'Unknown'}</Typography>
                          <Typography variant="caption" color="text.secondary">{e.actorAccountType === 'GLOBAL_ADMIN' ? 'Platform administrator' : 'Institution administrator'}</Typography>
                        </TableCell>
                        <TableCell><ActionChip action={e.action} category="ADMIN" /></TableCell>
                        <TableCell>
                          {e.summary}
                          {e.metadata?.changedFields?.length > 0 && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              Changed: {e.metadata.changedFields.join(', ')}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {!data.recentAdminChanges.length && <EmptyState>No admin changes recorded yet.</EmptyState>}
            </SectionCard>
          </>
        )}
      </Container>
    </GlobalAdminLayout>
  );
}

export default function InstitutionActivityPage() {
  return (
    <React.Suspense fallback={null}>
      <InstitutionActivityInner />
    </React.Suspense>
  );
}
