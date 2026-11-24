'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Download as DownloadIcon,
  Home as HomeIcon,
  Insights as AnalyticsIcon,
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
import { formatTargetGroupLabel } from '@/lib/training-admin';

const PURPLE = '#8b6cbc';
const TEAL = '#0f766e';
const AMBER = '#d97706';
const btn = { textTransform: 'none', fontWeight: 700 };
const ymd = (d) => d.toISOString().slice(0, 10);
const show = (v, suffix = '') => (v === null || v === undefined ? '—' : `${v}${suffix}`);
const monthLabel = (key) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-GB', { month: 'short', year: '2-digit', timeZone: 'UTC' });
};

function Kpi({ label, value, hint, tone }) {
  return (
    <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>{label}</Typography>
      <Typography variant="h4" sx={{ fontWeight: 800, color: tone || '#1e293b', lineHeight: 1.2 }}>{value}</Typography>
      {hint ? <Typography variant="caption" color="text.secondary">{hint}</Typography> : null}
    </Paper>
  );
}

function Card({ title, children, action }) {
  return (
    <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', minWidth: 0 }}>
      <Stack direction="row" alignItems="center" sx={{ mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, flex: 1 }}>{title}</Typography>
        {action}
      </Stack>
      {children}
    </Paper>
  );
}

function GroupTable({ rows, label, format = (k) => k }) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: alpha(PURPLE, 0.06) }}>
            {[label, 'Trainings', 'Enrolments', 'Attendance', 'No-show', 'Completion', 'Certificates', 'CPD h'].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.key}>
              <TableCell sx={{ fontWeight: 700 }}>{format(r.key)}</TableCell>
              <TableCell>{r.trainings}</TableCell>
              <TableCell>{r.enrolments}</TableCell>
              <TableCell>{show(r.attendanceRate, '%')}</TableCell>
              <TableCell>{show(r.noShowRate, '%')}</TableCell>
              <TableCell>{show(r.completionRate, '%')}</TableCell>
              <TableCell>{r.certificates}</TableCell>
              <TableCell>{r.cpdHours}</TableCell>
            </TableRow>
          ))}
          {!rows.length ? <TableRow><TableCell colSpan={8} sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>No data</TableCell></TableRow> : null}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/**
 * Training analytics for institution admins (#109): KPIs, trends, breakdowns,
 * feedback, assessments and mandatory compliance, with XLSX / CSV export.
 */
export default function TrainingAnalyticsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState(() => {
    const to = new Date();
    const from = new Date(Date.UTC(to.getUTCFullYear() - 1, to.getUTCMonth(), to.getUTCDate()));
    return { from: ymd(from), to: ymd(to), department: 'all', targetGroup: 'all' };
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [groupTab, setGroupTab] = useState('department');

  const query = useMemo(() => {
    const p = new URLSearchParams({ from: filters.from, to: filters.to });
    if (filters.department !== 'all') p.set('department', filters.department);
    if (filters.targetGroup !== 'all') p.set('targetGroup', filters.targetGroup);
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
  const preset = (months) => {
    const to = new Date();
    const from = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth() - months, to.getUTCDate()));
    setF({ from: ymd(from), to: ymd(to) });
  };

  const k = data?.kpis;
  const months = (data?.byMonth || []).map((m) => ({ ...m, label: monthLabel(m.key) }));
  const groups = {
    department: { rows: data?.byDepartment || [], label: 'Department' },
    targetGroup: { rows: data?.byTargetGroup || [], label: 'Target group', format: formatTargetGroupLabel },
    category: { rows: data?.byCategory || [], label: 'Category' },
  };
  const g = groups[groupTab];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <PageHeader
        title="Training analytics"
        description="How training is running across your institution: attendance, completion, certificates, CPD, feedback and compliance."
        icon={<AnalyticsIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/institution' },
          { label: 'Training', path: '/institution/training' },
          { label: 'Analytics' },
        ]}
        actionButton={(
          <Stack direction="row" spacing={1}>
            <Button variant="contained" startIcon={<DownloadIcon />} component="a" href={`/api/training/analytics?${query}&format=xlsx`} disabled={!data} sx={{ bgcolor: 'white', color: PURPLE, ...btn, '&:hover': { bgcolor: '#f5f5f5' } }}>
              Excel
            </Button>
            <Button variant="contained" startIcon={<DownloadIcon />} component="a" href={`/api/training/analytics?${query}&format=csv`} disabled={!data} sx={{ bgcolor: 'white', color: PURPLE, ...btn, '&:hover': { bgcolor: '#f5f5f5' } }}>
              CSV
            </Button>
            <Button variant="contained" startIcon={<BackIcon />} onClick={() => router.push('/institution/training')} sx={{ bgcolor: 'white', color: PURPLE, ...btn, '&:hover': { bgcolor: '#f5f5f5' } }}>
              Trainings
            </Button>
          </Stack>
        )}
      />
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Stack spacing={2}>
          <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
              <TextField size="small" type="date" label="From" value={filters.from} onChange={(e) => e.target.value && setF({ from: e.target.value })} InputLabelProps={{ shrink: true }} />
              <TextField size="small" type="date" label="To" value={filters.to} onChange={(e) => e.target.value && setF({ to: e.target.value })} InputLabelProps={{ shrink: true }} />
              <Stack direction="row" spacing={0.5}>
                {[[3, '3 mo'], [6, '6 mo'], [12, '12 mo']].map(([m, l]) => <Button key={m} size="small" onClick={() => preset(m)} sx={{ color: PURPLE, ...btn, minWidth: 0 }}>{l}</Button>)}
              </Stack>
              <TextField select size="small" label="Department" value={filters.department} onChange={(e) => setF({ department: e.target.value })} sx={{ minWidth: 180 }}>
                <MenuItem value="all">All departments</MenuItem>
                {(data?.options?.departments || []).map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </TextField>
              <TextField select size="small" label="Target group" value={filters.targetGroup} onChange={(e) => setF({ targetGroup: e.target.value })} sx={{ minWidth: 180 }}>
                <MenuItem value="all">All groups</MenuItem>
                {(data?.options?.targetGroups || []).map((d) => <MenuItem key={d} value={d}>{formatTargetGroupLabel(d)}</MenuItem>)}
              </TextField>
            </Stack>
            {loading ? <LinearProgress sx={{ mt: 1.5, '& .MuiLinearProgress-bar': { bgcolor: PURPLE } }} /> : null}
          </Paper>

          {error ? <Alert severity="error" onClose={() => setError('')}>{error}</Alert> : null}
          {!data && loading ? <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress sx={{ color: PURPLE }} /></Box> : null}

          {k ? (
            <>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)', xl: 'repeat(7, 1fr)' }, gap: 2 }}>
                <Kpi label="Trainings run" value={k.trainings} hint={`${k.sessionsHeld} sessions held`} />
                <Kpi label="Enrolments" value={k.enrolments} />
                <Kpi label="Attendance" value={show(k.attendanceRate, '%')} hint={`${k.attendedMarks} of ${k.expectedMarks} places`} tone={TEAL} />
                <Kpi label="No-shows" value={show(k.noShowRate, '%')} hint={`${k.noShows} people`} tone={k.noShowRate > 20 ? '#b91c1c' : undefined} />
                <Kpi label="Completion" value={show(k.completionRate, '%')} hint={`${k.completed} completed, ${k.notCompleted} not`} tone={PURPLE} />
                <Kpi label="Certificates" value={k.certificates} />
                <Kpi label="CPD hours delivered" value={k.cpdHours} />
              </Box>

              {!k.trainings ? <Alert severity="info">No trainings ran in this period with these filters.</Alert> : null}

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '3fr 2fr' }, gap: 2 }}>
                <Card title="By month">
                  <Box sx={{ height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={months} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="label" fontSize={12} />
                        <YAxis allowDecimals={false} fontSize={12} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="enrolments" name="Enrolments" fill={alpha(PURPLE, 0.55)} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="completed" name="Completed" fill={PURPLE} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Card>
                <Card title="Rates by month">
                  <Box sx={{ height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={months} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="label" fontSize={12} />
                        <YAxis domain={[0, 100]} unit="%" fontSize={12} />
                        <Tooltip formatter={(v) => (v === null ? '—' : `${v}%`)} />
                        <Legend />
                        <Line type="monotone" dataKey="attendanceRate" name="Attendance" stroke={TEAL} strokeWidth={2} connectNulls />
                        <Line type="monotone" dataKey="completionRate" name="Completion" stroke={PURPLE} strokeWidth={2} connectNulls />
                        <Line type="monotone" dataKey="noShowRate" name="No-show" stroke={AMBER} strokeWidth={2} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Card>
              </Box>

              <Card
                title="Breakdown"
                action={(
                  <Button size="small" startIcon={<DownloadIcon />} component="a" href={`/api/training/analytics?${query}&format=csv&sheet=${encodeURIComponent(`By ${g.label.toLowerCase()}`)}`} sx={{ color: PURPLE, ...btn }}>
                    CSV
                  </Button>
                )}
              >
                <Tabs value={groupTab} onChange={(_, v) => setGroupTab(v)} sx={{ mb: 1, '& .Mui-selected': { color: `${PURPLE} !important` }, '& .MuiTabs-indicator': { bgcolor: PURPLE } }}>
                  <Tab value="department" label="Department" sx={btn} />
                  <Tab value="targetGroup" label="Target group" sx={btn} />
                  <Tab value="category" label="Category" sx={btn} />
                </Tabs>
                {g.rows.length ? (
                  <Box sx={{ height: Math.min(360, 60 + g.rows.length * 34), mb: 1.5 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={g.rows.slice(0, 10).map((r) => ({ ...r, name: (g.format || ((x) => x))(r.key) }))} layout="vertical" margin={{ top: 0, right: 16, left: 16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis type="number" allowDecimals={false} fontSize={12} />
                        <YAxis type="category" dataKey="name" width={140} fontSize={12} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="enrolments" name="Enrolments" fill={alpha(PURPLE, 0.55)} />
                        <Bar dataKey="completed" name="Completed" fill={PURPLE} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                ) : null}
                <GroupTable rows={g.rows} label={g.label} format={g.format} />
              </Card>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
                <Card title="Feedback">
                  <Stack direction="row" spacing={3}>
                    <Box><Typography variant="h4" sx={{ fontWeight: 800 }}>{show(k.averageRating)}</Typography><Typography variant="caption" color="text.secondary">average rating (1–5)</Typography></Box>
                    <Box><Typography variant="h4" sx={{ fontWeight: 800 }}>{k.nps === null ? '—' : `${k.nps > 0 ? '+' : ''}${k.nps}`}</Typography><Typography variant="caption" color="text.secondary">NPS</Typography></Box>
                    <Box><Typography variant="h4" sx={{ fontWeight: 800 }}>{k.feedbackResponses}</Typography><Typography variant="caption" color="text.secondary">responses</Typography></Box>
                  </Stack>
                </Card>
                <Card title="Mandatory compliance" action={<Button size="small" onClick={() => router.push('/institution/training/compliance')} sx={{ color: PURPLE, ...btn }}>Details</Button>}>
                  <Stack direction="row" spacing={3}>
                    <Box><Typography variant="h4" sx={{ fontWeight: 800, color: '#166534' }}>{show(data.compliance.percentCompliant, '%')}</Typography><Typography variant="caption" color="text.secondary">compliant</Typography></Box>
                    <Box><Typography variant="h4" sx={{ fontWeight: 800, color: data.compliance.overdue ? '#b91c1c' : undefined }}>{data.compliance.overdue}</Typography><Typography variant="caption" color="text.secondary">overdue</Typography></Box>
                    <Box><Typography variant="h4" sx={{ fontWeight: 800 }}>{data.compliance.assigned}</Typography><Typography variant="caption" color="text.secondary">assigned</Typography></Box>
                  </Stack>
                </Card>
                <Card title="Assessments">
                  {data.assessments.length ? (
                    <Stack spacing={1}>
                      {data.assessments.slice(0, 6).map((a) => (
                        <Box key={a.id}>
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

              <Card title={`Trainings (${data.trainings.length})`}>
                <TableContainer sx={{ maxHeight: 520 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        {['Training', 'Start', 'Sessions', 'Enrolments', 'Attendance', 'No-show', 'Completion', 'Certificates', 'CPD h', 'Rating'].map((h) => <TableCell key={h} sx={{ fontWeight: 700, bgcolor: '#f7f4fb' }}>{h}</TableCell>)}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.trainings.map((t) => (
                        <TableRow key={t.id} hover onClick={() => router.push(`/institution/training/${t.id}`)} sx={{ cursor: 'pointer' }}>
                          <TableCell sx={{ fontWeight: 700 }}>{t.title}{t.department ? <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{t.department}</Typography> : null}</TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{new Date(t.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</TableCell>
                          <TableCell>{t.sessionsHeld}</TableCell>
                          <TableCell>{t.enrolments}</TableCell>
                          <TableCell>{show(t.attendanceRate, '%')}</TableCell>
                          <TableCell>{show(t.noShowRate, '%')}</TableCell>
                          <TableCell>{show(t.completionRate, '%')}</TableCell>
                          <TableCell>{t.certificates}</TableCell>
                          <TableCell>{t.cpdHours}</TableCell>
                          <TableCell>{show(t.averageRating)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Attendance counts present and late marks against every enrolment for every session held. No-shows are enrolments with no present or late mark. Completion is of decided outcomes (completed or not completed).
                </Typography>
              </Card>
            </>
          ) : null}
        </Stack>
      </Container>
    </Box>
  );
}
