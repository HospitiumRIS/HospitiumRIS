'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  FormControlLabel,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as BackIcon,
  Block as ExemptIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  EventRepeat as ExtendIcon,
  GridOn as MatrixIcon,
  Home as HomeIcon,
  Insights as OverviewIcon,
  NotificationsActive as RemindIcon,
  People as PeopleIcon,
  PersonAdd as AssignIcon,
  PictureAsPdf as PdfIcon,
  PlayArrow as ApplyIcon,
  Rule as RuleIcon,
  TableView as ExcelIcon,
  Undo as UndoIcon,
  VerifiedUser as ComplianceIcon,
} from '@mui/icons-material';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from 'recharts';
import PageHeader from '@/components/common/PageHeader';
import { AttentionList, Card, KpiCard, PURPLE, SimpleTable, btn, monthLabel, show } from '@/components/Training/admin/analytics/AnalyticsParts';
import ComplianceMatrix from '@/components/Training/admin/compliance/ComplianceMatrix';
import RequirementDialog from '@/components/Training/admin/compliance/RequirementDialog';
import ComplianceActionDialog from '@/components/Training/admin/compliance/ComplianceActionDialog';
import { COMPLIANCE_LABELS } from '@/lib/training-assignment';

const VIEWS = ['overview', 'matrix', 'people', 'requirements'];
const STATE_SX = {
  OVERDUE: { bgcolor: '#fee2e2', color: '#b91c1c' },
  RETRAINING_DUE: { bgcolor: '#fee2e2', color: '#b91c1c' },
  DUE_SOON: { bgcolor: '#fef3c7', color: '#92400e' },
  EXPIRING: { bgcolor: '#fef3c7', color: '#92400e' },
  ON_TRACK: { bgcolor: '#e0f2fe', color: '#075985' },
  IN_PROGRESS: { bgcolor: alpha(PURPLE, 0.1), color: PURPLE },
  COMPLETED: { bgcolor: '#dcfce7', color: '#166534' },
  EXEMPT: { bgcolor: '#f3f0f9', color: PURPLE },
  WITHDRAWN: { bgcolor: '#f1f5f9', color: '#64748b' },
};
const ATTENTION_ORDER = ['OVERDUE', 'RETRAINING_DUE', 'DUE_SOON', 'EXPIRING', 'ON_TRACK', 'IN_PROGRESS', 'COMPLETED', 'EXEMPT', 'WITHDRAWN'];
const ACTIVE_REG = new Set(['REGISTERED', 'PENDING_APPROVAL', 'WAITLISTED', 'NOT_COMPLETED']);
const fmt = (v) => (v ? new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const barColor = (p) => (p === null ? '#cbd5e1' : p >= 90 ? '#16a34a' : p >= 70 ? '#d97706' : '#dc2626');
const whiteBtn = { ...btn, bgcolor: 'white', color: PURPLE, '&:hover': { bgcolor: '#f5f5f5' } };

/**
 * Training compliance v2 (#140, admins only): requirement rules, people × requirement
 * matrix, departments and trend, needs attention, and actions on people. Keeps the
 * assigned-training list from #103 in the People tab.
 */
export default function TrainingCompliancePage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [view, setView] = useState('overview');
  const [busy, setBusy] = useState('');
  const [matrixFilter, setMatrixFilter] = useState({ requirementId: null, state: 'NOT_COMPLIANT' });
  const [reqDialog, setReqDialog] = useState({ open: false, requirement: null });
  const [actionDialog, setActionDialog] = useState({ open: false, action: null, payload: {}, count: 0, trainingId: '' });
  // People tab
  const [trainingFilter, setTrainingFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('attention');
  const [deptFilter, setDeptFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get('view');
    if (VIEWS.includes(v)) setView(v);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/training/compliance', { credentials: 'include', cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Could not load compliance');
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const changeView = (v) => {
    setView(v);
    window.history.replaceState(null, '', v === 'overview' ? window.location.pathname : `?view=${v}`);
  };

  const post = async (key, url, body, okText) => {
    setBusy(key);
    setError('');
    setNotice('');
    try {
      const res = await fetch(url, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'That did not work');
      setNotice(okText(json));
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const sendDueReminders = () => post('remind', '/api/training/compliance', {}, (j) => (j.sent ? `${j.sent} reminder(s) sent.` : 'Everyone due a reminder has already had it.'));
  const applyNow = (requirementId = null) => post(`apply:${requirementId || 'all'}`, '/api/training/requirements/apply', { requirementId }, (j) => (
    `${j.assigned} person(s) assigned to the next cohort${j.noCohort ? `; ${j.noCohort} still need one but no open cohort has places` : ''}.`
  ));

  const toggleEmail = async (enabled) => {
    setBusy('email');
    setError('');
    try {
      const res = await fetch('/api/training/analytics', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ monthlyEmail: enabled }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Could not change the monthly email');
      setData((d) => ({ ...d, monthlyEmail: { enabled } }));
      setNotice(enabled ? 'You will get the training and compliance reports by email at the start of each month.' : 'Monthly email turned off.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const deleteRequirement = async (r) => {
    setBusy(`delete:${r.id}`);
    setError('');
    try {
      const res = await fetch(`/api/training/requirements/${r.id}`, { method: 'DELETE', credentials: 'include' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Could not delete');
      setNotice(`Requirement "${r.title}" deleted. Its cohorts and their completions are unchanged.`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const openAction = (action, payload, extra = {}) => {
    const req = extra.requirementId ? data.requirements.find((r) => r.id === extra.requirementId) : null;
    const nextCohort = req?.cohorts.find((c) => c.status === 'PUBLISHED' && new Date(c.startDate) > new Date());
    const count = (payload.registrationIds?.length || 0) + (payload.userIds?.length || 0) + (payload.cells?.length || 0) + (payload.exemptionIds?.length || 0);
    setActionDialog({ open: true, action, payload, count, trainingId: nextCohort?.id || '' });
  };

  const download = (format) => { window.location.href = `/api/training/compliance?format=${format}`; };

  const departments = useMemo(() => {
    const set = new Set((data?.matrix?.rows || []).map((r) => r.department).filter(Boolean));
    for (const p of data?.people || []) if (p.department) set.add(p.department);
    return [...set].sort();
  }, [data]);

  // People tab (assigned trainings, #103)
  const people = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.people || [])
      .filter((p) => trainingFilter === 'all' || p.trainingId === trainingFilter)
      .filter((p) => deptFilter === 'all' || p.department === deptFilter)
      .filter((p) => {
        if (stateFilter === 'all') return true;
        if (stateFilter === 'attention') return ['OVERDUE', 'RETRAINING_DUE', 'DUE_SOON', 'EXPIRING'].includes(p.state);
        return p.state === stateFilter;
      })
      .filter((p) => !q || `${p.name} ${p.email}`.toLowerCase().includes(q))
      .sort((a, b) => ATTENTION_ORDER.indexOf(a.state) - ATTENTION_ORDER.indexOf(b.state) || (a.daysLeft ?? 0) - (b.daysLeft ?? 0));
  }, [data, trainingFilter, deptFilter, stateFilter, search]);
  useEffect(() => { setSelected([]); }, [trainingFilter, deptFilter, stateFilter, search, data]);
  const selectedPeople = people.filter((p) => selected.includes(p.registrationId));
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const shown = people.slice(0, 500);
  const allShown = shown.length > 0 && shown.every((p) => selected.includes(p.registrationId));

  const totals = data?.matrix?.totals;
  const assignedTotals = data?.totals;
  const hasRequirements = Boolean(data?.requirements?.some((r) => r.isActive));
  const trend = data?.trend || [];
  const series = (fn) => trend.map(fn);
  const previous = data?.previousPercent ?? null;
  const pctComparison = totals?.percent !== null && totals?.percent !== undefined && previous !== null
    ? { change: Math.round((totals.percent - previous) * 10) / 10, previous, unit: 'pt', direction: totals.percent > previous ? 'up' : totals.percent < previous ? 'down' : 'flat', good: totals.percent === previous ? null : totals.percent > previous }
    : { change: null };

  // Needs attention: requirement items plus overdue assigned trainings (#103).
  const attention = useMemo(() => {
    if (!data) return [];
    const items = (data.attention || []).map((a) => ({ ...a, key: `${a.kind}-${a.requirementId}`, detail: a.kind === 'NO_COHORT' ? 'Create or publish a cohort and link it to the requirement.' : a.kind === 'GAPS' ? 'Assign them to the next cohort, or let auto-assign do it.' : a.kind === 'OVERDUE' ? 'Remind them or move the due date.' : 'They are still compliant; enrol them before it lapses.' }));
    if (data.totals?.overdue) items.push({ key: 'assigned-overdue', kind: 'ASSIGNED_OVERDUE', severity: 'high', count: data.totals.overdue, title: `${data.totals.overdue} overdue on assigned trainings`, detail: 'Mandatory or assigned trainings past their due date.', action: 'See who', tab: 'people', filter: { state: 'OVERDUE' } });
    if (data.totals?.retrainingDue) items.push({ key: 'retraining', kind: 'RETRAINING', severity: 'medium', count: data.totals.retrainingDue, title: `${data.totals.retrainingDue} certificates expired: re-training due`, detail: 'Assign them to a new cohort.', action: 'See who', tab: 'people', filter: { state: 'RETRAINING_DUE' } });
    const rank = { high: 0, medium: 1, low: 2 };
    return items.sort((a, b) => rank[a.severity] - rank[b.severity] || b.count - a.count);
  }, [data]);

  const openAttention = (href, a) => {
    if (a?.tab === 'people') {
      setStateFilter(a.filter?.state || 'attention');
      changeView('people');
    } else if (a?.tab === 'matrix') {
      setMatrixFilter({ requirementId: a.filter?.requirementId || null, state: a.filter?.state || 'NOT_COMPLIANT' });
      changeView('matrix');
    } else if (a?.kind === 'OVERDUE') {
      setMatrixFilter({ requirementId: a.requirementId, state: 'OVERDUE' });
      changeView('matrix');
    } else if (href) router.push(href);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <PageHeader
        title="Training compliance"
        description="Who meets each training requirement, who is overdue or expiring, by department and over time, and what to do about it."
        icon={<ComplianceIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/institution' },
          { label: 'Training', path: '/institution/training' },
        ]}
        actionButton={(
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button variant="contained" startIcon={<PdfIcon />} onClick={() => download('pdf')} disabled={!data} sx={whiteBtn}>PDF</Button>
            <Button variant="contained" startIcon={<ExcelIcon />} onClick={() => download('xlsx')} disabled={!data} sx={whiteBtn}>Excel</Button>
            <Button variant="contained" startIcon={<RemindIcon />} onClick={sendDueReminders} disabled={busy === 'remind'} sx={whiteBtn}>
              {busy === 'remind' ? 'Sending…' : 'Send due reminders'}
            </Button>
            <Button variant="contained" startIcon={<BackIcon />} onClick={() => router.push('/institution/training')} sx={whiteBtn}>Back to trainings</Button>
          </Stack>
        )}
      />
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Stack spacing={2}>
          {error ? <Alert severity="error" onClose={() => setError('')}>{error}</Alert> : null}
          {notice ? <Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert> : null}
          {loading && !data ? <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress sx={{ color: PURPLE }} /></Box> : null}

          {data ? (
            <>
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(5, 1fr)' } }}>
                <KpiCard label="Compliant" value={show(totals.percent, '%')} hint={hasRequirements ? `${totals.COMPLIANT + totals.EXPIRING} of ${totals.required - totals.EXEMPT} requirement checks` : 'Add a requirement to measure this'} comparison={pctComparison} series={series((t) => t.percent)} onClick={() => { setMatrixFilter({ requirementId: null, state: 'NOT_COMPLIANT' }); changeView('matrix'); }} />
                <KpiCard label="Overdue" value={show(totals.OVERDUE + (assignedTotals?.overdue || 0))} hint={`${totals.OVERDUE} on requirements · ${assignedTotals?.overdue || 0} on assigned trainings`} onClick={() => { setStateFilter('OVERDUE'); changeView('people'); }} />
                <KpiCard label="Not done or expired" value={show(totals.MISSING + totals.EXPIRED)} hint="Not enrolled in a cohort yet" onClick={() => { setMatrixFilter({ requirementId: null, state: 'GAP' }); changeView('matrix'); }} />
                <KpiCard label="Expiring in 30 days" value={show(totals.EXPIRING + (assignedTotals?.counts?.EXPIRING || 0))} hint="Still compliant today" onClick={() => { setMatrixFilter({ requirementId: null, state: 'EXPIRING' }); changeView('matrix'); }} />
                <KpiCard label="Exempt" value={show(totals.EXEMPT + (assignedTotals?.counts?.EXEMPT || 0))} hint="Left out of the %" onClick={() => { setMatrixFilter({ requirementId: null, state: 'EXEMPT' }); changeView('matrix'); }} />
              </Box>

              <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ md: 'center' }}>
                  <Tabs value={view} onChange={(_, v) => changeView(v)} variant="scrollable" sx={{ flex: 1, px: 1, '& .MuiTab-root': { ...btn, minHeight: 52 }, '& .Mui-selected': { color: `${PURPLE} !important` }, '& .MuiTabs-indicator': { bgcolor: PURPLE, height: 3 } }}>
                    <Tab value="overview" icon={<OverviewIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Overview${attention.length ? ` (${attention.length} to act on)` : ''}`} />
                    <Tab value="matrix" icon={<MatrixIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Matrix" />
                    <Tab value="people" icon={<PeopleIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Assigned trainings" />
                    <Tab value="requirements" icon={<RuleIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Requirements (${data.requirements.length})`} />
                  </Tabs>
                  <Tooltip title="The monthly email (also on the analytics page) includes this compliance report as a PDF.">
                    <FormControlLabel
                      sx={{ mx: 2 }}
                      control={<Switch size="small" checked={Boolean(data.monthlyEmail?.enabled)} disabled={busy === 'email'} onChange={(e) => toggleEmail(e.target.checked)} sx={{ '& .Mui-checked': { color: PURPLE }, '& .Mui-checked + .MuiSwitch-track': { bgcolor: PURPLE } }} />}
                      label={<Typography variant="body2" sx={{ fontWeight: 700 }}>Email me monthly</Typography>}
                    />
                  </Tooltip>
                </Stack>
              </Paper>

              {view === 'overview' ? (
                <Stack spacing={2}>
                  {!hasRequirements ? (
                    <Alert severity="info" action={<Button size="small" onClick={() => setReqDialog({ open: true, requirement: null })} sx={{ ...btn, color: PURPLE }}>Add requirement</Button>}>
                      Add requirement rules (for example &quot;Nursing: Basic Life Support every 24 months&quot;) to see compliance by person, department and over time.
                    </Alert>
                  ) : null}
                  <Card title="Needs attention" subtitle="What to act on now, most urgent first">
                    <AttentionList items={attention} onOpen={openAttention} emptyText="Nothing needs attention. Everyone required is compliant or on track." />
                  </Card>
                  {hasRequirements ? (
                    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' } }}>
                      <Card title="By department" subtitle="Compliant % of the requirement checks in each department (exempt left out)">
                        {data.matrix.byDepartment.length ? (
                          <Box sx={{ height: Math.min(380, 60 + data.matrix.byDepartment.length * 34) }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={data.matrix.byDepartment.slice(0, 12)} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }} barCategoryGap="25%">
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                                <XAxis type="number" domain={[0, 100]} unit="%" fontSize={12} />
                                <YAxis type="category" dataKey="key" width={130} fontSize={12} />
                                <ChartTooltip formatter={(v, _n, p) => [`${v ?? '—'}% (${p.payload.compliant} of ${p.payload.required}; ${p.payload.overdue} overdue)`, 'Compliant']} />
                                <Bar dataKey="percent" radius={[0, 4, 4, 0]} onClick={(d) => { setMatrixFilter({ requirementId: null, state: 'NOT_COMPLIANT', department: d.key }); changeView('matrix'); }} cursor="pointer">
                                  {data.matrix.byDepartment.slice(0, 12).map((d) => <Cell key={d.key} fill={barColor(d.percent)} />)}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </Box>
                        ) : <Typography color="text.secondary">No one in the institution falls under a requirement yet.</Typography>}
                      </Card>
                      <Card title="Trend" subtitle="Compliant % at the end of each month (last 12 months)">
                        <Box sx={{ height: 260 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trend.map((t) => ({ ...t, name: monthLabel(t.key) }))} margin={{ top: 5, right: 16, left: -10, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis dataKey="name" fontSize={12} />
                              <YAxis domain={[0, 100]} unit="%" fontSize={12} />
                              <ChartTooltip formatter={(v, _n, p) => [`${v ?? '—'}% (${p.payload.compliant} of ${p.payload.required})`, 'Compliant']} />
                              <Line type="monotone" dataKey="percent" stroke={PURPLE} strokeWidth={3} dot={{ r: 3 }} connectNulls />
                            </LineChart>
                          </ResponsiveContainer>
                        </Box>
                      </Card>
                    </Box>
                  ) : null}
                  {hasRequirements ? (
                    <Card title="By requirement" subtitle="Click a row to see the people">
                      <SimpleTable
                        rowKey="id"
                        rows={data.matrix.byRequirement}
                        onRowClick={(r) => { setMatrixFilter({ requirementId: r.id, state: 'NOT_COMPLIANT' }); changeView('matrix'); }}
                        columns={[
                          { key: 'title', label: 'Requirement', sx: { fontWeight: 700 } },
                          { key: 'scope', label: 'Applies to', render: (r) => (r.departments.length ? r.departments.join(', ') : 'Everyone') },
                          { key: 'required', label: 'Required', align: 'right' },
                          { key: 'COMPLIANT', label: 'Compliant', align: 'right', render: (r) => r.COMPLIANT + r.EXPIRING },
                          { key: 'DUE', label: 'Enrolled', align: 'right' },
                          { key: 'OVERDUE', label: 'Overdue', align: 'right', render: (r) => <Box component="span" sx={{ color: r.OVERDUE ? '#b91c1c' : undefined, fontWeight: r.OVERDUE ? 700 : 400 }}>{r.OVERDUE}</Box> },
                          { key: 'gaps', label: 'Not done', align: 'right', render: (r) => r.MISSING + r.EXPIRED },
                          { key: 'EXEMPT', label: 'Exempt', align: 'right' },
                          {
                            key: 'percent', label: 'Compliance', sx: { minWidth: 150 },
                            render: (r) => (r.percent === null ? '—' : (
                              <Stack spacing={0.4}>
                                <Typography variant="caption" sx={{ fontWeight: 700 }}>{r.percent}%</Typography>
                                <LinearProgress variant="determinate" value={r.percent} sx={{ height: 6, borderRadius: 3, bgcolor: alpha(PURPLE, 0.12), '& .MuiLinearProgress-bar': { bgcolor: barColor(r.percent) } }} />
                              </Stack>
                            )),
                          },
                        ]}
                      />
                    </Card>
                  ) : null}
                  <Card title="Assigned and mandatory trainings" subtitle="Click a row to see the people">
                    <SimpleTable
                      rowKey="id"
                      rows={data.trainings}
                      empty="Nothing assigned yet. Mark a training as mandatory, assign it from its Registrations tab, or give its certificates a validity period."
                      onRowClick={(t) => { setTrainingFilter(t.id); setStateFilter('all'); changeView('people'); }}
                      columns={[
                        { key: 'title', label: 'Training', render: (t) => <Box sx={{ fontWeight: 700 }}>{t.title}{t.isMandatory ? <Chip size="small" label="Mandatory" sx={{ ml: 1, height: 20, fontWeight: 700, bgcolor: alpha(PURPLE, 0.12), color: PURPLE }} /> : null}</Box> },
                        { key: 'startDate', label: 'Starts', render: (t) => fmt(t.startDate) },
                        { key: 'assigned', label: 'Assigned', align: 'right' },
                        { key: 'completed', label: 'Completed', align: 'right' },
                        { key: 'overdue', label: 'Overdue', align: 'right', render: (t) => <Box component="span" sx={{ color: t.overdue ? '#b91c1c' : undefined, fontWeight: t.overdue ? 700 : 400 }}>{t.overdue}</Box> },
                        { key: 'retrainingDue', label: 'Re-training', align: 'right' },
                        { key: 'percentCompliant', label: 'Compliance', align: 'right', render: (t) => show(t.percentCompliant, '%') },
                      ]}
                    />
                  </Card>
                </Stack>
              ) : null}

              {view === 'matrix' ? (
                <Card title="Compliance matrix" subtitle="Everyone a requirement applies to. Click a cell to remind, assign, extend or exempt.">
                  <ComplianceMatrix
                    requirements={data.requirements}
                    rows={data.matrix.rows}
                    departments={departments}
                    filter={matrixFilter}
                    onFilter={setMatrixFilter}
                    onAction={openAction}
                    onOpenTraining={(id) => router.push(`/institution/training/${id}?tab=registrations`)}
                  />
                </Card>
              ) : null}

              {view === 'people' ? (
                <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ p: 2 }} alignItems={{ md: 'center' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, flex: 1 }}>People on assigned and mandatory trainings</Typography>
                    <TextField size="small" placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
                    <TextField select size="small" label="Training" value={trainingFilter} onChange={(e) => setTrainingFilter(e.target.value)} sx={{ minWidth: 200 }}>
                      <MenuItem value="all">All trainings</MenuItem>
                      {data.trainings.map((t) => <MenuItem key={t.id} value={t.id}>{t.title}</MenuItem>)}
                    </TextField>
                    <TextField select size="small" label="Department" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} sx={{ minWidth: 160 }}>
                      <MenuItem value="all">All departments</MenuItem>
                      {departments.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                    </TextField>
                    <TextField select size="small" label="Show" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} sx={{ minWidth: 180 }}>
                      <MenuItem value="attention">Needs attention</MenuItem>
                      <MenuItem value="all">Everyone</MenuItem>
                      {ATTENTION_ORDER.map((s) => <MenuItem key={s} value={s}>{COMPLIANCE_LABELS[s]}</MenuItem>)}
                    </TextField>
                  </Stack>

                  {selectedPeople.length ? (
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center" sx={{ px: 2, py: 1.25, bgcolor: alpha(PURPLE, 0.08), borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="body2" sx={{ fontWeight: 800, mr: 1 }}>{selectedPeople.length} selected</Typography>
                      {[
                        ['remind', RemindIcon, 'Remind', selectedPeople.filter((p) => ACTIVE_REG.has(p.status) && p.state !== 'EXEMPT')],
                        ['extend', ExtendIcon, 'Extend due date', selectedPeople.filter((p) => ACTIVE_REG.has(p.status))],
                        ['assign', AssignIcon, 'Assign to cohort', selectedPeople],
                        ['exempt', ExemptIcon, 'Exempt', selectedPeople.filter((p) => p.state !== 'EXEMPT')],
                        ['unexempt', UndoIcon, 'Remove exemption', selectedPeople.filter((p) => p.state === 'EXEMPT')],
                      ].map(([action, Icon, label, list]) => (
                        <Button key={action} size="small" variant="outlined" startIcon={<Icon />} disabled={!list.length} onClick={() => openAction(action, action === 'assign' ? { userIds: [...new Set(list.map((p) => p.userId))] } : { registrationIds: list.map((p) => p.registrationId) })} sx={{ ...btn, color: PURPLE, borderColor: alpha(PURPLE, 0.5), bgcolor: 'white' }}>
                          {label}{list.length !== selectedPeople.length && list.length ? ` (${list.length})` : ''}
                        </Button>
                      ))}
                      <Button size="small" onClick={() => setSelected([])} sx={{ ...btn, color: 'text.secondary' }}>Clear</Button>
                    </Stack>
                  ) : null}

                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: alpha(PURPLE, 0.06) }}>
                          <TableCell padding="checkbox">
                            <Checkbox size="small" checked={allShown} indeterminate={!allShown && selected.length > 0} onChange={() => setSelected(allShown ? [] : shown.map((p) => p.registrationId))} sx={{ '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: PURPLE } }} />
                          </TableCell>
                          {['Person', 'Department', 'Training', 'Due', 'Completed', 'Certificate expires', 'State'].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {shown.length ? shown.map((p) => (
                          <TableRow key={p.registrationId} hover selected={selected.includes(p.registrationId)}>
                            <TableCell padding="checkbox">
                              <Checkbox size="small" checked={selected.includes(p.registrationId)} onChange={() => toggle(p.registrationId)} sx={{ '&.Mui-checked': { color: PURPLE } }} />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{p.name}</Typography>
                              <Typography variant="caption" color="text.secondary">{p.email}</Typography>
                            </TableCell>
                            <TableCell>{p.department || '—'}</TableCell>
                            <TableCell>
                              <Box component="span" onClick={() => router.push(`/institution/training/${p.trainingId}?tab=registrations`)} sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>{p.trainingTitle}</Box>
                              {p.source === 'ASSIGNED' ? <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Assigned</Typography> : null}
                            </TableCell>
                            <TableCell>{fmt(p.dueDate)}</TableCell>
                            <TableCell>{fmt(p.completedAt)}</TableCell>
                            <TableCell>{fmt(p.certificateExpiresAt)}</TableCell>
                            <TableCell>
                              <Tooltip title={p.exemptReason ? `Reason: ${p.exemptReason}` : ''}>
                                <Chip size="small" label={COMPLIANCE_LABELS[p.state]} sx={{ fontWeight: 700, ...STATE_SX[p.state] }} />
                              </Tooltip>
                              {p.state === 'OVERDUE' && p.daysLeft !== null ? <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{Math.max(1, -p.daysLeft)} day(s) late</Typography> : null}
                            </TableCell>
                          </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={8} sx={{ py: 4, textAlign: 'center' }}>
                              <Typography color="text.secondary">{stateFilter === 'attention' ? 'Nobody needs attention right now.' : 'No one matches these filters.'}</Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {people.length > 500 ? <Typography variant="caption" color="text.secondary" sx={{ p: 2, display: 'block' }}>Showing 500 of {people.length}. Narrow the filters or download Excel for everyone.</Typography> : null}
                </Paper>
              ) : null}

              {view === 'requirements' ? (
                <Card
                  title="Requirement rules"
                  subtitle="Who must complete what, and how often. Completing any linked cohort meets the requirement."
                  action={(
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="outlined" startIcon={busy === 'apply:all' ? <CircularProgress size={14} /> : <ApplyIcon />} disabled={!hasRequirements || busy === 'apply:all'} onClick={() => applyNow()} sx={{ ...btn, color: PURPLE, borderColor: alpha(PURPLE, 0.5) }}>Apply auto-assign now</Button>
                      <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setReqDialog({ open: true, requirement: null })} sx={{ ...btn, bgcolor: PURPLE }}>New requirement</Button>
                    </Stack>
                  )}
                >
                  <SimpleTable
                    rowKey="id"
                    rows={data.requirements}
                    empty="No requirements yet. Add one, e.g. Basic Life Support for Nursing every 24 months."
                    columns={[
                      { key: 'title', label: 'Requirement', render: (r) => <Box><Typography variant="body2" sx={{ fontWeight: 700 }}>{r.title}{!r.isActive ? <Chip size="small" label="Inactive" sx={{ ml: 1, height: 20 }} /> : null}</Typography>{r.description ? <Typography variant="caption" color="text.secondary">{r.description}</Typography> : null}</Box> },
                      { key: 'departments', label: 'Applies to', render: (r) => (r.departments.length ? r.departments.join(', ') : 'Everyone') },
                      { key: 'validityMonths', label: 'Valid for', render: (r) => (r.validityMonths ? `${r.validityMonths} months` : 'No expiry') },
                      { key: 'dueWithinDays', label: 'Due within', render: (r) => `${r.dueWithinDays} days` },
                      { key: 'autoAssign', label: 'Auto-assign', render: (r) => (r.autoAssign ? 'On' : 'Off') },
                      {
                        key: 'cohorts', label: 'Cohorts',
                        render: (r) => {
                          const next = r.cohorts.find((c) => c.status === 'PUBLISHED' && new Date(c.startDate) > new Date());
                          return (
                            <Box>
                              <Typography variant="body2">{r.cohorts.length} linked</Typography>
                              <Typography variant="caption" sx={{ color: next ? 'text.secondary' : '#b45309' }}>{next ? `Next: ${fmt(next.startDate)} (${Math.max(0, next.places - next.taken)} places)` : 'No upcoming cohort'}</Typography>
                            </Box>
                          );
                        },
                      },
                      {
                        key: 'actions', label: '', align: 'right',
                        render: (r) => (
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip title="Assign people who need it now"><span><IconButton size="small" disabled={!r.isActive || busy === `apply:${r.id}`} onClick={() => applyNow(r.id)}><ApplyIcon fontSize="small" /></IconButton></span></Tooltip>
                            <Tooltip title="Edit"><IconButton size="small" onClick={() => setReqDialog({ open: true, requirement: r })}><EditIcon fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title="Delete (cohorts and completions are kept)"><span><IconButton size="small" disabled={busy === `delete:${r.id}`} onClick={() => deleteRequirement(r)}><DeleteIcon fontSize="small" /></IconButton></span></Tooltip>
                          </Stack>
                        ),
                      },
                    ]}
                  />
                </Card>
              ) : null}
            </>
          ) : null}
        </Stack>
      </Container>

      <RequirementDialog
        open={reqDialog.open}
        requirement={reqDialog.requirement}
        departments={departments}
        trainingOptions={data?.trainingOptions || []}
        onClose={() => setReqDialog({ open: false, requirement: null })}
        onSaved={() => { setReqDialog({ open: false, requirement: null }); setNotice('Requirement saved.'); load(); }}
      />
      <ComplianceActionDialog
        open={actionDialog.open}
        action={actionDialog.action}
        count={actionDialog.count}
        payload={actionDialog.payload}
        trainingOptions={data?.trainingOptions || []}
        defaultTrainingId={actionDialog.trainingId}
        onClose={() => setActionDialog((a) => ({ ...a, open: false }))}
        onDone={(message) => { setActionDialog((a) => ({ ...a, open: false })); setSelected([]); setNotice(message); load(); }}
      />
    </Box>
  );
}
