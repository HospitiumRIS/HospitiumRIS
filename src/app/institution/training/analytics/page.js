'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  FormControlLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip as MuiTooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Dashboard as OverviewIcon,
  Download as DownloadIcon,
  Engineering as OperationsIcon,
  Home as HomeIcon,
  Insights as AnalyticsIcon,
  PictureAsPdf as PdfIcon,
  TableView as TableIcon,
} from '@mui/icons-material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import PageHeader from '@/components/common/PageHeader';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
} from '@/components/GlobalAdmin/InstitutionModalShell';
import { formatTargetGroupLabel } from '@/lib/training-admin';
import { DELIVERY_MODE_LABELS } from '@/lib/training-sessions';
import {
  AMBER,
  AttentionList,
  Card,
  KpiCard,
  PURPLE,
  SimpleTable,
  Stat,
  TEAL,
  btn,
  monthLabel,
  show,
} from '@/components/Training/admin/analytics/AnalyticsParts';

const ymd = (d) => d.toISOString().slice(0, 10);
const dmy = (v) => new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const headerBtn = { bgcolor: 'white', color: PURPLE, ...btn, '&:hover': { bgcolor: '#f5f5f5' } };

const KPIS = [
  { key: 'trainings', label: 'Trainings run', value: (k) => k.trainings, hint: (k) => `${k.sessionsHeld} sessions held`, metric: (t) => t.sessionsHeld, metricLabel: 'Sessions held' },
  { key: 'enrolments', label: 'Enrolments', value: (k) => k.enrolments, metric: (t) => t.enrolments, metricLabel: 'Enrolments' },
  { key: 'attendanceRate', label: 'Attendance', value: (k) => show(k.attendanceRate, '%'), hint: (k) => `${k.attendedMarks} of ${k.expectedMarks} places`, metric: (t) => t.attendanceRate, metricLabel: 'Attendance', suffix: '%', asc: true },
  { key: 'noShowRate', label: 'No-shows', value: (k) => show(k.noShowRate, '%'), hint: (k) => `${k.noShows} people`, metric: (t) => t.noShowRate, metricLabel: 'No-show', suffix: '%' },
  { key: 'completionRate', label: 'Completion', value: (k) => show(k.completionRate, '%'), hint: (k) => `${k.completed} completed, ${k.notCompleted} not`, metric: (t) => t.completionRate, metricLabel: 'Completion', suffix: '%', asc: true },
  { key: 'certificates', label: 'Certificates', value: (k) => k.certificates, metric: (t) => t.certificates, metricLabel: 'Certificates' },
  { key: 'cpdHours', label: 'CPD hours delivered', value: (k) => k.cpdHours, metric: (t) => t.cpdHours, metricLabel: 'CPD hours' },
];

const BREAKDOWNS = {
  department: { label: 'Department', rows: (d) => d.byDepartment, filter: 'department', sheet: 'By department' },
  targetGroup: { label: 'Target group', rows: (d) => d.byTargetGroup, filter: 'targetGroup', format: formatTargetGroupLabel, sheet: 'By target group' },
  category: { label: 'Category', rows: (d) => d.byCategory, filter: 'category', sheet: 'By category' },
  deliveryMode: { label: 'Delivery mode', rows: (d) => d.byDeliveryMode || [], filter: 'deliveryMode', format: (k) => DELIVERY_MODE_LABELS[k] || k, sheet: 'By delivery mode' },
};

function lastMonths(months) {
  const to = new Date();
  const from = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth() - months, to.getUTCDate()));
  return { from: ymd(from), to: ymd(to) };
}

const DEFAULT_FILTERS = { ...lastMonths(12), department: 'all', targetGroup: 'all', category: 'all', deliveryMode: 'all' };

/**
 * Training analytics (#109, #138). Two views: Overview for management (KPIs against the
 * previous period, trends, breakdowns) and Operations for coordinators (needs attention,
 * capacity, facilitators, assessments). Everything clicks through: months and breakdown
 * rows filter the page, KPI cards list the trainings behind them.
 */
export default function TrainingAnalyticsPage() {
  const router = useRouter();
  const [view, setView] = useState('overview');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [groupTab, setGroupTab] = useState('department');
  const [drill, setDrill] = useState(null);
  const [savingEmail, setSavingEmail] = useState(false);

  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get('view');
    if (v === 'operations') setView('operations');
  }, []);

  const query = useMemo(() => {
    const p = new URLSearchParams({ from: filters.from, to: filters.to });
    for (const key of ['department', 'targetGroup', 'category', 'deliveryMode']) if (filters[key] !== 'all') p.set(key, filters[key]);
    return p.toString();
  }, [filters]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/training/analytics?${query}`, { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Could not load analytics');
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { load(); }, [load]);

  const setF = (patch) => setFilters((f) => ({ ...f, ...patch }));
  const changeView = (v) => {
    setView(v);
    window.history.replaceState(null, '', v === 'operations' ? '?view=operations' : window.location.pathname);
  };

  const drillMonth = (key) => {
    const [y, m] = key.split('-').map(Number);
    setF({ from: ymd(new Date(Date.UTC(y, m - 1, 1))), to: ymd(new Date(Date.UTC(y, m, 0))) });
  };

  const toggleEmail = async (enabled) => {
    setSavingEmail(true);
    setError('');
    try {
      const res = await fetch('/api/training/analytics', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ monthlyEmail: enabled }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Could not save');
      setData((d) => ({ ...d, monthlyEmail: { ...d.monthlyEmail, enabled } }));
      setNotice(enabled ? 'You will get the training report by email at the start of each month, with the PDF attached.' : 'Monthly email turned off.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingEmail(false);
    }
  };

  const k = data?.kpis;
  const months = (data?.byMonth || []).map((m) => ({ ...m, label: monthLabel(m.key) }));
  const group = BREAKDOWNS[groupTab];
  const groupRows = data ? group.rows(data) : [];
  const fmt = group.format || ((x) => x);
  const maxGroup = Math.max(1, ...groupRows.map((r) => r.enrolments));
  const activeFilters = ['department', 'targetGroup', 'category', 'deliveryMode']
    .filter((key) => filters[key] !== 'all')
    .map((key) => ({ key, label: `${BREAKDOWNS[key].label}: ${(BREAKDOWNS[key].format || ((x) => x))(filters[key])}` }));
  const exportHref = (format, extra = '') => `/api/training/analytics?${query}&format=${format}${extra}`;
  const openTraining = (t) => router.push(`/institution/training/${t.id}`);

  const trainingColumns = [
    { key: 'title', label: 'Training', render: (t) => (<><Typography variant="body2" sx={{ fontWeight: 700 }}>{t.title}</Typography>{t.department ? <Typography variant="caption" color="text.secondary">{t.department}</Typography> : null}</>) },
    { key: 'startDate', label: 'Start', render: (t) => dmy(t.startDate), sx: { whiteSpace: 'nowrap' } },
    { key: 'sessionsHeld', label: 'Sessions', align: 'right' },
    { key: 'enrolments', label: 'Enrolments', align: 'right' },
    { key: 'attendanceRate', label: 'Attendance', align: 'right', render: (t) => show(t.attendanceRate, '%') },
    { key: 'noShowRate', label: 'No-show', align: 'right', render: (t) => show(t.noShowRate, '%') },
    { key: 'completionRate', label: 'Completion', align: 'right', render: (t) => show(t.completionRate, '%') },
    { key: 'certificates', label: 'Certificates', align: 'right' },
    { key: 'cpdHours', label: 'CPD h', align: 'right' },
    { key: 'averageRating', label: 'Rating', align: 'right', render: (t) => show(t.averageRating) },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <PageHeader
        title="Training analytics"
        description="How training is running across your institution, and what needs doing next."
        icon={<AnalyticsIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/institution' },
          { label: 'Training', path: '/institution/training' },
        ]}
        actionButton={(
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            <Button variant="contained" startIcon={<PdfIcon />} component="a" href={exportHref('pdf')} disabled={!data} sx={headerBtn}>PDF report</Button>
            <Button variant="contained" startIcon={<TableIcon />} component="a" href={exportHref('xlsx')} disabled={!data} sx={headerBtn}>Excel</Button>
            <Button variant="contained" startIcon={<BackIcon />} onClick={() => router.push('/institution/training')} sx={headerBtn}>Trainings</Button>
          </Stack>
        )}
      />
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Stack spacing={2}>
          {/* Filters */}
          <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} alignItems={{ lg: 'center' }} sx={{ flexWrap: 'wrap', rowGap: 1.5 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField size="small" type="date" label="From" value={filters.from} onChange={(e) => e.target.value && setF({ from: e.target.value })} InputLabelProps={{ shrink: true }} />
                <TextField size="small" type="date" label="To" value={filters.to} onChange={(e) => e.target.value && setF({ to: e.target.value })} InputLabelProps={{ shrink: true }} />
              </Stack>
              <Stack direction="row" spacing={0.25}>
                {[[1, '1 mo'], [3, '3 mo'], [6, '6 mo'], [12, '12 mo']].map(([m, l]) => <Button key={m} size="small" onClick={() => setF(lastMonths(m))} sx={{ color: PURPLE, ...btn, minWidth: 0 }}>{l}</Button>)}
              </Stack>
              <TextField select size="small" label="Department" value={filters.department} onChange={(e) => setF({ department: e.target.value })} sx={{ minWidth: 170 }}>
                <MenuItem value="all">All departments</MenuItem>
                {(data?.options?.departments || []).map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </TextField>
              <TextField select size="small" label="Target group" value={filters.targetGroup} onChange={(e) => setF({ targetGroup: e.target.value })} sx={{ minWidth: 160 }}>
                <MenuItem value="all">All groups</MenuItem>
                {(data?.options?.targetGroups || []).map((d) => <MenuItem key={d} value={d}>{formatTargetGroupLabel(d)}</MenuItem>)}
              </TextField>
              <TextField select size="small" label="Category" value={filters.category} onChange={(e) => setF({ category: e.target.value })} sx={{ minWidth: 150 }}>
                <MenuItem value="all">All categories</MenuItem>
                {(data?.options?.categories || []).map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </TextField>
              <TextField select size="small" label="Format" value={filters.deliveryMode} onChange={(e) => setF({ deliveryMode: e.target.value })} sx={{ minWidth: 140 }}>
                <MenuItem value="all">Any format</MenuItem>
                {Object.entries(DELIVERY_MODE_LABELS).map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}
              </TextField>
              <Box sx={{ flex: 1 }} />
              <MuiTooltip title="A PDF of this page for the previous month, emailed at the start of each month">
                <FormControlLabel
                  control={<Switch checked={Boolean(data?.monthlyEmail?.enabled)} disabled={!data || savingEmail} onChange={(e) => toggleEmail(e.target.checked)} />}
                  label="Email me monthly"
                  sx={{ mr: 0, whiteSpace: 'nowrap' }}
                />
              </MuiTooltip>
            </Stack>
            {activeFilters.length || filters.from !== DEFAULT_FILTERS.from || filters.to !== DEFAULT_FILTERS.to ? (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5, flexWrap: 'wrap', rowGap: 1 }}>
                <Typography variant="caption" color="text.secondary">Showing {dmy(filters.from)} – {dmy(filters.to)}{data?.previousPeriod ? `, compared with ${dmy(data.previousPeriod.from)} – ${dmy(data.previousPeriod.to)}` : ''}</Typography>
                {activeFilters.map((f) => <Chip key={f.key} size="small" label={f.label} onDelete={() => setF({ [f.key]: 'all' })} sx={{ bgcolor: alpha(PURPLE, 0.1), color: PURPLE, fontWeight: 700 }} />)}
                <Button size="small" onClick={() => setFilters(DEFAULT_FILTERS)} sx={{ color: PURPLE, ...btn }}>Reset</Button>
              </Stack>
            ) : null}
            {loading ? <LinearProgress sx={{ mt: 1.5, '& .MuiLinearProgress-bar': { bgcolor: PURPLE } }} /> : null}
          </Paper>

          {error ? <Alert severity="error" onClose={() => setError('')}>{error}</Alert> : null}
          {notice ? <Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert> : null}
          {!data && loading ? <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress sx={{ color: PURPLE }} /></Box> : null}

          {k ? (
            <>
              {/* KPI cards */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)', xl: 'repeat(7, 1fr)' }, gap: 2 }}>
                {KPIS.map((kpi) => (
                  <KpiCard
                    key={kpi.key}
                    label={kpi.label}
                    value={kpi.value(k)}
                    hint={kpi.hint?.(k)}
                    comparison={data.comparison?.[kpi.key]}
                    series={data.sparklines?.[kpi.key]}
                    onClick={k.trainings ? () => setDrill(kpi) : undefined}
                  />
                ))}
              </Box>

              <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Tabs value={view} onChange={(_, v) => changeView(v)} sx={{ px: 1, '& .MuiTab-root': { ...btn, minHeight: 52 }, '& .Mui-selected': { color: `${PURPLE} !important` }, '& .MuiTabs-indicator': { bgcolor: PURPLE, height: 3 } }}>
                  <Tab value="overview" icon={<OverviewIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Overview" />
                  <Tab value="operations" icon={<OperationsIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Operations${data.attention?.length ? ` (${data.attention.length} to act on)` : ''}`} />
                </Tabs>
              </Paper>

              {!k.trainings ? <Alert severity="info">No trainings ran in this period with these filters.</Alert> : null}

              {view === 'overview' ? (
                <>
                  {data.attention?.length ? (
                    <Card
                      title="Needs attention"
                      subtitle="The most urgent items. Operations has the full list."
                      action={<Button size="small" onClick={() => changeView('operations')} sx={{ color: PURPLE, ...btn }}>See all</Button>}
                    >
                      <AttentionList items={data.attention} onOpen={(href) => router.push(href)} limit={3} />
                    </Card>
                  ) : null}

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '3fr 2fr' }, gap: 2 }}>
                    <Card title="By month" subtitle={months.length > 1 ? 'Click a month to focus on it' : undefined}>
                      <Box sx={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={months} margin={{ top: 5, right: 10, left: -10, bottom: 0 }} onClick={(e) => { const key = e?.activePayload?.[0]?.payload?.key; if (key && months.length > 1) drillMonth(key); }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis dataKey="label" fontSize={12} />
                            <YAxis allowDecimals={false} fontSize={12} />
                            <Tooltip cursor={{ fill: alpha(PURPLE, 0.06) }} />
                            <Legend />
                            <Bar dataKey="enrolments" name="Enrolments" fill={alpha(PURPLE, 0.45)} radius={[4, 4, 0, 0]} maxBarSize={48} style={{ cursor: months.length > 1 ? 'pointer' : 'default' }} />
                            <Bar dataKey="completed" name="Completed" fill={PURPLE} radius={[4, 4, 0, 0]} maxBarSize={48} style={{ cursor: months.length > 1 ? 'pointer' : 'default' }} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </Card>
                    <Card title="Rates" subtitle={months.length > 1 ? 'By month' : 'One month in this period, so shown as bars'}>
                      <Box sx={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          {months.length > 1 ? (
                            <LineChart data={months} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                              <XAxis dataKey="label" fontSize={12} />
                              <YAxis domain={[0, 100]} unit="%" fontSize={12} />
                              <Tooltip formatter={(v) => (v === null ? '—' : `${v}%`)} />
                              <Legend />
                              <Line type="monotone" dataKey="attendanceRate" name="Attendance" stroke={TEAL} strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                              <Line type="monotone" dataKey="completionRate" name="Completion" stroke={PURPLE} strokeWidth={2.5} strokeDasharray="6 3" dot={{ r: 3 }} connectNulls />
                              <Line type="monotone" dataKey="noShowRate" name="No-show" stroke={AMBER} strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                            </LineChart>
                          ) : (
                            <BarChart
                              data={[
                                { name: 'Attendance', value: k.attendanceRate ?? 0, fill: TEAL },
                                { name: 'Completion', value: k.completionRate ?? 0, fill: PURPLE },
                                { name: 'No-show', value: k.noShowRate ?? 0, fill: AMBER },
                              ]}
                              margin={{ top: 15, right: 10, left: -10, bottom: 0 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                              <XAxis dataKey="name" fontSize={12} />
                              <YAxis domain={[0, 100]} unit="%" fontSize={12} />
                              <Tooltip formatter={(v) => `${v}%`} />
                              <Bar dataKey="value" name="Rate" radius={[4, 4, 0, 0]} maxBarSize={64} label={{ position: 'top', fontSize: 12, formatter: (v) => `${v}%` }} />
                            </BarChart>
                          )}
                        </ResponsiveContainer>
                      </Box>
                    </Card>
                  </Box>

                  <Card
                    title="Breakdown"
                    subtitle={`Click a row to filter the page by ${group.label.toLowerCase()}. A training in several ${group.label.toLowerCase()}s counts in each.`}
                    action={<Button size="small" startIcon={<DownloadIcon />} component="a" href={exportHref('csv', `&sheet=${encodeURIComponent(group.sheet)}`)} sx={{ color: PURPLE, ...btn }}>CSV</Button>}
                  >
                    <Tabs value={groupTab} onChange={(_, v) => setGroupTab(v)} variant="scrollable" sx={{ mb: 1, '& .MuiTab-root': btn, '& .Mui-selected': { color: `${PURPLE} !important` }, '& .MuiTabs-indicator': { bgcolor: PURPLE } }}>
                      {Object.entries(BREAKDOWNS).map(([key, b]) => <Tab key={key} value={key} label={b.label} />)}
                    </Tabs>
                    {groupRows.length ? (
                      <Box sx={{ height: Math.min(380, 70 + Math.min(groupRows.length, 10) * 38), mb: 1.5 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={groupRows.slice(0, 10).map((r) => ({ ...r, name: fmt(r.key) }))} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }} barCategoryGap="25%">
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                            <XAxis type="number" allowDecimals={false} domain={[0, maxGroup]} tickCount={Math.min(maxGroup, 8) + 1} fontSize={12} />
                            <YAxis type="category" dataKey="name" width={150} fontSize={12} />
                            <Tooltip cursor={{ fill: alpha(PURPLE, 0.06) }} />
                            <Legend />
                            <Bar dataKey="enrolments" name="Enrolments" fill={alpha(PURPLE, 0.45)} maxBarSize={14} radius={[0, 3, 3, 0]} />
                            <Bar dataKey="completed" name="Completed" fill={PURPLE} maxBarSize={14} radius={[0, 3, 3, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    ) : null}
                    <SimpleTable
                      rowKey="key"
                      rows={groupRows}
                      onRowClick={(r) => r.key !== 'Not set' && setF({ [group.filter]: r.key })}
                      columns={[
                        { key: 'key', label: group.label, render: (r) => <Typography variant="body2" sx={{ fontWeight: 700 }}>{fmt(r.key)}</Typography> },
                        { key: 'trainings', label: 'Trainings', align: 'right' },
                        { key: 'enrolments', label: 'Enrolments', align: 'right' },
                        { key: 'attendanceRate', label: 'Attendance', align: 'right', render: (r) => show(r.attendanceRate, '%') },
                        { key: 'noShowRate', label: 'No-show', align: 'right', render: (r) => show(r.noShowRate, '%') },
                        { key: 'completionRate', label: 'Completion', align: 'right', render: (r) => show(r.completionRate, '%') },
                        { key: 'certificates', label: 'Certificates', align: 'right' },
                        { key: 'cpdHours', label: 'CPD h', align: 'right' },
                      ]}
                    />
                  </Card>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
                    <Card title="Feedback">
                      <Stack direction="row" spacing={3}>
                        <Stat value={show(k.averageRating)} label="average rating (1–5)" />
                        <Stat value={k.nps === null ? '—' : `${k.nps > 0 ? '+' : ''}${k.nps}`} label="NPS" />
                        <Stat value={k.feedbackResponses} label="responses" />
                      </Stack>
                    </Card>
                    <Card title="Mandatory compliance" action={<Button size="small" onClick={() => router.push('/institution/training/compliance')} sx={{ color: PURPLE, ...btn }}>Details</Button>}>
                      <Stack direction="row" spacing={3}>
                        <Stat value={show(data.compliance.percentCompliant, '%')} label="compliant" tone="#166534" />
                        <Stat value={data.compliance.overdue} label="overdue" tone={data.compliance.overdue ? '#b91c1c' : undefined} />
                        <Stat value={data.compliance.assigned} label="assigned" />
                      </Stack>
                    </Card>
                    <Card title="Learning gain" subtitle="Post-test minus pre-test, same people">
                      <Stack direction="row" spacing={3}>
                        <Stat value={data.prePost?.averageGain === null || data.prePost?.averageGain === undefined ? '—' : `${data.prePost.averageGain > 0 ? '+' : ''}${data.prePost.averageGain} pt`} label="average gain" tone={data.prePost?.averageGain > 0 ? '#166534' : undefined} />
                        <Stat value={data.prePost?.participants ?? 0} label="people with both tests" />
                      </Stack>
                    </Card>
                  </Box>

                  <Card title={`Trainings (${data.trainings.length})`} subtitle="Click a training to open it">
                    <SimpleTable rowKey="id" rows={data.trainings} onRowClick={openTraining} columns={trainingColumns} maxHeight={520} empty="No trainings in this period" />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Attendance counts present and late marks against every enrolment for every session held. No-shows are enrolments with no present or late mark. Completion is of decided outcomes. Changes compare with the previous period of the same length.
                    </Typography>
                  </Card>
                </>
              ) : (
                <>
                  <Card title={`Needs attention (${data.attention?.length || 0})`} subtitle="Each item links to where it's fixed">
                    <AttentionList items={data.attention || []} onOpen={(href) => router.push(href)} />
                  </Card>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 3fr' }, gap: 2 }}>
                    <Card title="Capacity and waiting list" action={<Button size="small" startIcon={<DownloadIcon />} component="a" href={exportHref('csv', '&sheet=Capacity')} sx={{ color: PURPLE, ...btn }}>CSV</Button>}>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 2 }}>
                        <Stat value={show(data.capacity.fillRate, '%')} label={`${data.capacity.taken} of ${data.capacity.offered} places`} tone={PURPLE} />
                        <Stat value={data.capacity.waitlisted} label="waiting list" />
                        <Stat value={data.capacity.pending} label="awaiting approval" tone={data.capacity.pending ? '#b45309' : undefined} />
                        <Stat value={data.capacity.cancelled} label="cancelled" />
                        <Stat value={show(data.capacity.cancellationRate, '%')} label="cancellation rate" />
                        <Stat value={data.capacity.rejected} label="declined" />
                      </Box>
                      <SimpleTable
                        rowKey="id"
                        rows={data.capacity.trainings.slice(0, 8)}
                        onRowClick={openTraining}
                        columns={[
                          { key: 'title', label: 'Training' },
                          { key: 'fill', label: 'Filled', render: (t) => (
                            <Box sx={{ minWidth: 110 }}>
                              <Typography variant="caption">{t.taken}/{t.places}{t.waitlisted ? ` · ${t.waitlisted} waiting` : ''}</Typography>
                              <LinearProgress variant="determinate" value={Math.min(100, t.fillRate || 0)} sx={{ height: 6, borderRadius: 3, bgcolor: alpha(PURPLE, 0.12), '& .MuiLinearProgress-bar': { bgcolor: (t.fillRate || 0) >= 100 ? '#b45309' : PURPLE } }} />
                            </Box>
                          ) },
                        ]}
                      />
                    </Card>
                    <Card title="Facilitators" subtitle="Sessions they ran in this period, attendance in those sessions, and their trainings' feedback rating" action={<Button size="small" startIcon={<DownloadIcon />} component="a" href={exportHref('csv', '&sheet=Facilitators')} sx={{ color: PURPLE, ...btn }}>CSV</Button>}>
                      <SimpleTable
                        rows={data.facilitators || []}
                        empty="No facilitators on these trainings"
                        columns={[
                          { key: 'name', label: 'Facilitator', render: (f) => <Typography variant="body2" sx={{ fontWeight: 700 }}>{f.name}</Typography> },
                          { key: 'trainings', label: 'Trainings', align: 'right' },
                          { key: 'sessionsHeld', label: 'Sessions', align: 'right' },
                          { key: 'attendanceRate', label: 'Attendance', align: 'right', render: (f) => show(f.attendanceRate, '%') },
                          { key: 'averageRating', label: 'Rating', align: 'right', render: (f) => show(f.averageRating) },
                        ]}
                      />
                    </Card>
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}>
                    <Card title="Pre/post-test gain" subtitle="Best pre-test and post-test scores of people who took both">
                      {data.prePost?.trainings?.length ? (
                        <Box sx={{ height: Math.min(320, 80 + data.prePost.trainings.length * 44) }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.prePost.trainings.slice(0, 8).map((t) => ({ ...t, name: t.trainingTitle }))} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                              <XAxis type="number" domain={[0, 100]} unit="%" fontSize={12} />
                              <YAxis type="category" dataKey="name" width={150} fontSize={12} />
                              <Tooltip formatter={(v) => `${v}%`} />
                              <Legend />
                              <Bar dataKey="pre" name="Pre-test" fill={alpha(PURPLE, 0.4)} maxBarSize={14} />
                              <Bar dataKey="post" name="Post-test" fill={PURPLE} maxBarSize={14} />
                            </BarChart>
                          </ResponsiveContainer>
                        </Box>
                      ) : <Typography variant="body2" color="text.secondary">No training in this period has both a graded pre-test and post-test.</Typography>}
                    </Card>
                    <Card title="Assessment pass rates">
                      {data.assessments.length ? (
                        <Stack spacing={1.25}>
                          {data.assessments.map((a) => (
                            <Box key={a.id} onClick={() => router.push(`/institution/training/${a.trainingId}?tab=assessments`)} sx={{ cursor: 'pointer', '&:hover': { opacity: 0.85 } }}>
                              <Stack direction="row" justifyContent="space-between" spacing={1}>
                                <Typography variant="body2" noWrap sx={{ fontWeight: 700, minWidth: 0 }}>{a.title} · {a.trainingTitle}</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{show(a.passRate, '%')}</Typography>
                              </Stack>
                              <LinearProgress variant="determinate" value={a.passRate || 0} sx={{ height: 6, borderRadius: 3, bgcolor: alpha(PURPLE, 0.12), '& .MuiLinearProgress-bar': { bgcolor: PURPLE } }} />
                              <Typography variant="caption" color="text.secondary">{a.passed} of {a.takers} passed{a.averageScore !== null ? ` · average ${a.averageScore}%` : ''}</Typography>
                            </Box>
                          ))}
                        </Stack>
                      ) : <Typography variant="body2" color="text.secondary">No graded assessments in this period.</Typography>}
                    </Card>
                  </Box>

                  <Card title="Delivery format" subtitle="Click a row to filter by format">
                    <SimpleTable
                      rows={data.byDeliveryMode || []}
                      onRowClick={(r) => setF({ deliveryMode: r.key })}
                      columns={[
                        { key: 'key', label: 'Format', render: (r) => <Typography variant="body2" sx={{ fontWeight: 700 }}>{DELIVERY_MODE_LABELS[r.key] || r.key}</Typography> },
                        { key: 'trainings', label: 'Trainings', align: 'right' },
                        { key: 'enrolments', label: 'Enrolments', align: 'right' },
                        { key: 'attendanceRate', label: 'Attendance', align: 'right', render: (r) => show(r.attendanceRate, '%') },
                        { key: 'noShowRate', label: 'No-show', align: 'right', render: (r) => show(r.noShowRate, '%') },
                        { key: 'completionRate', label: 'Completion', align: 'right', render: (r) => show(r.completionRate, '%') },
                      ]}
                    />
                  </Card>
                </>
              )}
            </>
          ) : null}
        </Stack>
      </Container>

      {/* KPI drill-down */}
      <InstitutionModal open={Boolean(drill)} onClose={() => setDrill(null)} maxWidth="md">
        <InstitutionModalHeader icon={AnalyticsIcon} title={drill?.label || ''} subtitle="The trainings behind this figure. Click one to open it." onClose={() => setDrill(null)} />
        <InstitutionModalBody>
          {drill && data ? (
            <SimpleTable
              rowKey="id"
              onRowClick={(t) => { setDrill(null); openTraining(t); }}
              rows={[...data.trainings]
                .filter((t) => drill.metric(t) !== null && drill.metric(t) !== undefined)
                .sort((a, b) => (drill.asc ? drill.metric(a) - drill.metric(b) : drill.metric(b) - drill.metric(a)))}
              columns={[
                { key: 'title', label: 'Training', render: (t) => <Typography variant="body2" sx={{ fontWeight: 700 }}>{t.title}</Typography> },
                { key: 'startDate', label: 'Start', render: (t) => dmy(t.startDate), sx: { whiteSpace: 'nowrap' } },
                { key: 'enrolments', label: 'Enrolments', align: 'right' },
                { key: 'metric', label: drill.metricLabel, align: 'right', render: (t) => <strong>{show(drill.metric(t), drill.suffix || '')}</strong> },
              ]}
              empty="No trainings have this figure yet"
            />
          ) : null}
        </InstitutionModalBody>
        <InstitutionModalFooter>
          <Button onClick={() => setDrill(null)} sx={{ textTransform: 'none' }}>Close</Button>
        </InstitutionModalFooter>
      </InstitutionModal>
    </Box>
  );
}
