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
  Collapse,
  Container,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Analytics as AnalyticsIcon,
  Block as CancelIcon,
  CalendarMonth as CalendarIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  ExpandLess as CollapseIcon,
  ExpandMore as ExpandIcon,
  GridView as CardsIcon,
  Home as HomeIcon,
  MoreHoriz as MoreIcon,
  Publish as PublishIcon,
  Refresh as RefreshIcon,
  School as TrainingIcon,
  Search as SearchIcon,
  TableRows as TableIcon,
  VerifiedUser as ComplianceIcon,
  WorkspacePremium as TemplatesIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import { useAuth } from '@/components/AuthProvider';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
  InstitutionModalVariant,
} from '@/components/GlobalAdmin/InstitutionModalShell';
import TrainingFormDialog from '@/components/Training/TrainingFormDialog';
import { AttentionList, Card, KpiCard, btn, show } from '@/components/Training/admin/analytics/AnalyticsParts';
import { AlertBadge, FillBar, PURPLE, PhaseChip, RowMenu, SetupProgress, dateRange } from '@/components/Training/admin/manage/ManageParts';
import TrainingCards from '@/components/Training/admin/manage/TrainingCards';
import TrainingCalendar from '@/components/Training/admin/manage/TrainingCalendar';
import TrainingQuickLook from '@/components/Training/admin/manage/TrainingQuickLook';
import { TRAINING_ADMIN_TYPES } from '@/lib/training-admin';
import { DELIVERY_MODE_LABELS } from '@/lib/training-sessions';
import { MANAGE_TABS, filterRows, groupByCourse, sortRows } from '@/lib/training-manage';

const whiteBtn = { ...btn, bgcolor: 'white', color: PURPLE, '&:hover': { bgcolor: '#f5f5f5' } };
const VIEWS = ['table', 'cards', 'calendar'];
const sessionWhen = (s) => {
  const d = new Date(s.startsAt);
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 86400000);
  const day = d.toDateString() === today.toDateString() ? 'Today' : d.toDateString() === tomorrow.toDateString() ? 'Tomorrow' : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  return `${day} · ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
};

function normalizeTrainingSeed(seed) {
  if (!seed) return null;
  if (seed.departments || seed.targetGroups) {
    return { ...seed, department: (seed.departments || []).join(', '), targetGroup: seed.targetGroups || seed.targetGroup || [] };
  }
  return seed;
}

/**
 * Manage trainings (#144): stat cards, needs attention, this week's sessions, status tabs,
 * table / cards / calendar views, group by course, quick look panel, row and bulk actions,
 * and export. Create and edit open in a right-side panel.
 */
export default function InstitutionTrainingPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [compliance, setCompliance] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  // List state
  const [tab, setTab] = useState('upcoming');
  const [view, setView] = useState('table');
  const [grouped, setGrouped] = useState(false);
  const [expanded, setExpanded] = useState([]);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('all');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selected, setSelected] = useState([]);
  // Panels and dialogs
  const [quick, setQuick] = useState(null);
  const [form, setForm] = useState({ open: false, mode: 'create', seed: null, draftId: null });
  const [confirm, setConfirm] = useState(null); // { action, rows }
  const [reason, setReason] = useState('');
  const [moreAnchor, setMoreAnchor] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      if (MANAGE_TABS.some((t) => t.key === p.get('tab'))) setTab(p.get('tab'));
      const savedView = window.localStorage.getItem('trainingListView');
      if (VIEWS.includes(p.get('view') || savedView)) setView(p.get('view') || savedView);
      if (window.localStorage.getItem('trainingListGrouped') === '1') setGrouped(true);
      const saved = window.localStorage.getItem('trainingDrafts');
      if (saved) setDrafts(JSON.parse(saved));
    } catch {
      // storage unavailable: defaults are fine
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/training/manage', { credentials: 'include', cache: 'no-store' });
      if (res.status === 401) { router.replace('/login'); return; }
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load trainings');
      setData(json);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
    // Compliance is secondary: load it after, and never block the list on it.
    fetch('/api/training/compliance', { credentials: 'include', cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j?.success) setCompliance({ overdue: (j.matrix?.totals?.OVERDUE || 0) + (j.totals?.overdue || 0), percent: j.matrix?.totals?.percent ?? j.totals?.percentCompliant ?? null }); })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.replace('/login'); return; }
    if (!TRAINING_ADMIN_TYPES.includes(user?.accountType)) { router.replace('/institution'); return; }
    load();
  }, [authLoading, isAuthenticated, user, router, load]);

  const rows = useMemo(() => data?.rows || [], [data]);
  const departments = useMemo(() => [...new Set(rows.flatMap((r) => String(r.department || '').split(',').map((d) => d.trim())).filter(Boolean))].sort(), [rows]);
  const categories = useMemo(() => [...new Set(rows.map((r) => r.category).filter(Boolean))].sort(), [rows]);
  const filtered = useMemo(() => sortRows(filterRows(rows, { tab, search, department, category }), tab), [rows, tab, search, department, category]);
  const groups = useMemo(() => (grouped ? groupByCourse(filtered) : []), [grouped, filtered]);
  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const selectedRows = rows.filter((r) => selected.includes(r.id));
  useEffect(() => { setPage(0); setSelected([]); }, [tab, search, department, category, grouped]);

  const changeTab = (next) => {
    setTab(next);
    window.history.replaceState(null, '', next === 'upcoming' ? window.location.pathname : `?tab=${next}`);
  };
  const changeView = (next) => {
    if (!next) return;
    setView(next);
    try { window.localStorage.setItem('trainingListView', next); } catch { /* ignore */ }
  };
  const toggleGrouped = (on) => {
    setGrouped(on);
    try { window.localStorage.setItem('trainingListGrouped', on ? '1' : '0'); } catch { /* ignore */ }
  };
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const setFilterFromCard = (next) => { setSearch(''); setDepartment('all'); setCategory('all'); changeTab(next); };

  // ---- create / edit / duplicate -------------------------------------------------------
  const openEdit = async (row) => {
    try {
      const res = await fetch(`/api/training/${row.id}`, { credentials: 'include' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Could not open the training');
      setForm({ open: true, mode: 'edit', seed: json.training, draftId: null });
    } catch (err) {
      setError(err.message);
    }
  };

  const persistTraining = async (apiData, { trainingId } = {}) => {
    try {
      setSubmitting(true);
      const res = await fetch(trainingId ? `/api/training/${trainingId}` : '/api/training', {
        method: trainingId ? 'PUT' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) return { success: false, error: json.error || 'Failed to save training details' };
      if (!trainingId && form.draftId) {
        const next = drafts.filter((d) => d.id !== form.draftId);
        setDrafts(next);
        try { window.localStorage.setItem('trainingDrafts', JSON.stringify(next)); } catch { /* ignore */ }
      }
      return { success: true, training: json.training };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setSubmitting(false);
    }
  };

  const notifyPublished = (ids) => {
    for (const trainingId of ids) {
      fetch('/api/notifications/training-created', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trainingId }) }).catch(() => {});
    }
  };

  const wizardFinished = async (training, { publish } = {}) => {
    try {
      setSubmitting(true);
      if (publish && training?.id) {
        const res = await fetch(`/api/training/${training.id}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'PUBLISHED' }) });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) throw new Error(json.error || 'Failed to publish training');
        notifyPublished([training.id]);
      }
      const wasCreate = form.mode === 'create';
      setForm({ open: false, mode: 'create', seed: null, draftId: null });
      setNotice(publish ? 'Training published. Eligible staff have been notified.' : 'Training saved.');
      await load();
      if (wasCreate && training?.id) router.push(`/institution/training/${training.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const duplicate = async (row) => {
    try {
      setSubmitting(true);
      const res = await fetch(`/api/training/${row.id}/duplicate`, { method: 'POST', credentials: 'include' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Could not duplicate');
      setNotice(`New draft cohort created with ${json.modules} modules and ${json.materials} materials. Set its dates.`);
      await load();
      setForm({ open: true, mode: 'edit', seed: json.training, draftId: null });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ---- publish / cancel / delete (one or many) ----------------------------------------
  const runBulk = async () => {
    const { action, rows: targets } = confirm;
    setSubmitting(true);
    try {
      const res = await fetch('/api/training/manage', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ids: targets.map((r) => r.id), reason }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'That did not work');
      if (action === 'publish') notifyPublished(json.done);
      const verb = { publish: 'published', cancel: 'cancelled', delete: 'deleted' }[action];
      setNotice(`${json.done.length} ${verb}${json.skipped.length ? `; ${json.skipped.length} skipped (${[...new Set(json.skipped.map((s) => s.reason))].join('; ')})` : ''}.`);
      setConfirm(null);
      setReason('');
      setSelected([]);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const onAction = (action, row) => {
    if (action === 'open') router.push(`/institution/training/${row.id}`);
    else if (action === 'quick') setQuick(row);
    else if (action === 'edit') openEdit(row);
    else if (action === 'duplicate') duplicate(row);
    else setConfirm({ action, rows: [row] });
  };

  const exportList = (format) => {
    const p = new URLSearchParams({ format, tab, search, department, category });
    window.location.assign(`/api/training/manage?${p.toString()}`);
  };

  if (authLoading || (loading && !data)) {
    return <Box sx={{ py: 10, display: 'flex', justifyContent: 'center' }}><CircularProgress sx={{ color: PURPLE }} /></Box>;
  }
  if (!isAuthenticated) return null;

  const s = data?.stats;
  const counts = data?.counts || {};
  const confirmText = confirm ? {
    publish: { title: `Publish ${confirm.rows.length === 1 ? confirm.rows[0].title : `${confirm.rows.length} trainings`}?`, body: 'Staff who can take them will see them and get a notification. Only drafts are published.', button: 'Publish', icon: PublishIcon, danger: false },
    cancel: { title: `Cancel ${confirm.rows.length === 1 ? confirm.rows[0].title : `${confirm.rows.length} trainings`}?`, body: 'Everyone registered, waiting or awaiting approval is told by email and in the app. Registrations are kept for the record.', button: 'Cancel training', icon: CancelIcon, danger: true },
    delete: { title: `Delete ${confirm.rows.length === 1 ? 'this draft' : `${confirm.rows.length} drafts`}?`, body: 'This action cannot be undone. Only drafts without registrations are deleted.', button: 'Delete', icon: DeleteIcon, danger: true },
  }[confirm.action] : null;

  const renderRow = (r, nested = false) => (
    <TableRow key={r.id} hover selected={selected.includes(r.id)} onClick={() => setQuick(r)} sx={{ cursor: 'pointer' }}>
      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
        <Checkbox size="small" checked={selected.includes(r.id)} onChange={() => toggle(r.id)} sx={{ '&.Mui-checked': { color: PURPLE } }} />
      </TableCell>
      <TableCell sx={{ maxWidth: 380, pl: nested ? 4 : undefined }}>
        <Typography variant="body2" sx={{ fontWeight: 800 }}>{r.title}</Typography>
        <Typography variant="caption" color="text.secondary">{[r.code, r.category, r.department].filter(Boolean).join(' · ') || '—'}</Typography>
        <SetupProgress row={r} />
      </TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        <Typography variant="body2">{dateRange(r.startDate, r.endDate)}</Typography>
        <Typography variant="caption" color="text.secondary">{r.sessionsCount} session{r.sessionsCount === 1 ? '' : 's'} · {DELIVERY_MODE_LABELS[r.deliveryMode] || 'In person'}</Typography>
      </TableCell>
      <TableCell><FillBar row={r} /></TableCell>
      <TableCell><PhaseChip phase={r.phase} />{r.isMandatory ? <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>Mandatory</Typography> : null}</TableCell>
      <TableCell><AlertBadge row={r} /></TableCell>
      <TableCell align="right" onClick={(e) => e.stopPropagation()}><RowMenu row={r} onAction={onAction} /></TableCell>
    </TableRow>
  );

  return (
    <InstitutionModalVariant.Provider value="panel">
      <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
        <PageHeader
          title="Manage trainings"
          description="Plan cohorts, publish them to staff and keep each one on track."
          icon={<TrainingIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[{ label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/institution' }]}
          actionButton={(
            <Stack direction="row" spacing={1}>
              <Button variant="contained" endIcon={<MoreIcon />} onClick={(e) => setMoreAnchor(e.currentTarget)} sx={whiteBtn}>More</Button>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setForm({ open: true, mode: 'create', seed: null, draftId: null })} sx={whiteBtn}>New training</Button>
            </Stack>
          )}
        />
        <Menu anchorEl={moreAnchor} open={Boolean(moreAnchor)} onClose={() => setMoreAnchor(null)} onClick={() => setMoreAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <MenuItem onClick={() => router.push('/institution/training/analytics')}><ListItemIcon><AnalyticsIcon fontSize="small" /></ListItemIcon><ListItemText>Analytics</ListItemText></MenuItem>
          <MenuItem onClick={() => router.push('/institution/training/compliance')}><ListItemIcon><ComplianceIcon fontSize="small" /></ListItemIcon><ListItemText>Compliance</ListItemText></MenuItem>
          <MenuItem onClick={() => router.push('/institution/training/certificate-templates')}><ListItemIcon><TemplatesIcon fontSize="small" /></ListItemIcon><ListItemText>Certificate templates</ListItemText></MenuItem>
          <Divider />
          <MenuItem onClick={() => exportList('xlsx')}><ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon><ListItemText>Export list (Excel)</ListItemText></MenuItem>
          <MenuItem onClick={() => exportList('csv')}><ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon><ListItemText>Export list (CSV)</ListItemText></MenuItem>
          <MenuItem onClick={load}><ListItemIcon><RefreshIcon fontSize="small" /></ListItemIcon><ListItemText>Refresh</ListItemText></MenuItem>
        </Menu>

        <Container maxWidth={false} sx={{ py: 3, maxWidth: '1600px', mx: 'auto' }}>
          <Stack spacing={2}>
            {error ? <Alert severity="error" sx={{ borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert> : null}

            {s ? (
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3, 1fr)', xl: 'repeat(6, 1fr)' } }}>
                <KpiCard label="Upcoming" value={s.upcoming} hint={`${s.startingIn30} start within 30 days`} onClick={() => setFilterFromCard('upcoming')} />
                <KpiCard label="Running now" value={s.running} hint="Started, not yet ended" onClick={() => setFilterFromCard('running')} />
                <KpiCard label="Drafts" value={s.drafts + drafts.length} hint={drafts.length ? `${drafts.length} unsaved on this device` : 'Not visible to staff'} onClick={() => setFilterFromCard('draft')} />
                <KpiCard label="Enrolled" value={s.enrolled} hint={s.waiting ? `${s.waiting} waiting or to approve` : 'Upcoming and running'} />
                <KpiCard label="Fill rate" value={show(s.fillRate, '%')} hint="Places taken, upcoming and running" />
                <KpiCard label="Overdue compliance" value={compliance ? compliance.overdue : '…'} hint={compliance?.percent !== null && compliance?.percent !== undefined ? `${compliance.percent}% compliant` : 'Mandatory and required training'} onClick={() => router.push('/institution/training/compliance')} />
              </Box>
            ) : null}

            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '3fr 2fr' }, alignItems: 'start' }}>
              <Card title="Needs attention" subtitle={data?.attention?.length ? `${data.attention.length} item(s), most urgent first` : null}>
                <AttentionList items={data?.attention || []} onOpen={(href) => router.push(href)} limit={6} emptyText="Nothing needs attention right now." moreText="(open the trainings marked “to act on”)" />
              </Card>
              <Card title="Next 7 days" subtitle={data?.weekSessions?.length ? `${data.weekSessions.length} session(s)` : null} action={<Button size="small" startIcon={<CalendarIcon />} onClick={() => { changeView('calendar'); changeTab('all'); }} sx={{ ...btn, color: PURPLE }}>Calendar</Button>}>
                {data?.weekSessions?.length ? (
                  <Stack spacing={0.75}>
                    {data.weekSessions.slice(0, 7).map((x) => (
                      <Stack key={x.id} direction="row" spacing={1.25} alignItems="center" onClick={() => router.push(`/institution/training/${x.trainingId}?tab=attendance`)} sx={{ p: 1, borderRadius: 1.5, cursor: 'pointer', bgcolor: x.live ? '#f0fdf4' : 'transparent', '&:hover': { bgcolor: alpha(PURPLE, 0.06) } }}>
                        <Box sx={{ width: 4, alignSelf: 'stretch', borderRadius: 2, bgcolor: x.live ? '#16a34a' : PURPLE }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>{x.trainingTitle}</Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>{x.title} · {x.live ? 'live now' : sessionWhen(x)}{x.venue ? ` · ${x.venue}` : ''}</Typography>
                        </Box>
                        <Tooltip title="Take attendance"><Chip size="small" label={x.live ? 'Check-in' : 'Attendance'} sx={{ fontWeight: 700, bgcolor: x.live ? '#dcfce7' : alpha(PURPLE, 0.1), color: x.live ? '#166534' : PURPLE }} /></Tooltip>
                      </Stack>
                    ))}
                  </Stack>
                ) : <Typography variant="body2" color="text.secondary">No sessions in the next 7 days.</Typography>}
              </Card>
            </Box>

            {drafts.length ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Unfinished drafts on this device</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {drafts.map((d) => (
                    <Chip
                      key={d.id}
                      label={d.title || 'Untitled draft'}
                      onClick={() => setForm({ open: true, mode: 'create', seed: normalizeTrainingSeed(d), draftId: d.id })}
                      onDelete={() => { const next = drafts.filter((x) => x.id !== d.id); setDrafts(next); try { window.localStorage.setItem('trainingDrafts', JSON.stringify(next)); } catch { /* ignore */ } }}
                      sx={{ bgcolor: 'white', fontWeight: 700 }}
                    />
                  ))}
                </Stack>
              </Alert>
            ) : null}

            <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
              <Tabs value={tab} onChange={(_, v) => changeTab(v)} variant="scrollable" sx={{ px: 1, borderBottom: '1px solid', borderColor: 'divider', '& .MuiTab-root': { ...btn, minHeight: 50 }, '& .Mui-selected': { color: `${PURPLE} !important` }, '& .MuiTabs-indicator': { bgcolor: PURPLE, height: 3 } }}>
                {MANAGE_TABS.map((t) => <Tab key={t.key} value={t.key} label={`${t.label} (${counts[t.key] ?? 0})`} />)}
              </Tabs>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ p: 2 }} alignItems={{ md: 'center' }}>
                <TextField size="small" placeholder="Search title, code, department, venue" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ flex: 1, minWidth: 220 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
                <TextField select size="small" label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} sx={{ minWidth: 170 }}>
                  <MenuItem value="all">All departments</MenuItem>
                  {departments.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </TextField>
                {categories.length ? (
                  <TextField select size="small" label="Category" value={category} onChange={(e) => setCategory(e.target.value)} sx={{ minWidth: 160 }}>
                    <MenuItem value="all">All categories</MenuItem>
                    {categories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </TextField>
                ) : null}
                {view !== 'calendar' ? <FormControlLabel control={<Switch size="small" checked={grouped} onChange={(e) => toggleGrouped(e.target.checked)} sx={{ '& .Mui-checked': { color: PURPLE }, '& .Mui-checked + .MuiSwitch-track': { bgcolor: PURPLE } }} />} label={<Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Group by course</Typography>} /> : null}
                <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, v) => changeView(v)} sx={{ '& .Mui-selected': { color: `${PURPLE} !important`, bgcolor: `${alpha(PURPLE, 0.1)} !important` } }}>
                  <ToggleButton value="table" aria-label="Table"><Tooltip title="Table"><TableIcon fontSize="small" /></Tooltip></ToggleButton>
                  <ToggleButton value="cards" aria-label="Cards"><Tooltip title="Cards"><CardsIcon fontSize="small" /></Tooltip></ToggleButton>
                  <ToggleButton value="calendar" aria-label="Calendar"><Tooltip title="Calendar"><CalendarIcon fontSize="small" /></Tooltip></ToggleButton>
                </ToggleButtonGroup>
              </Stack>

              {selectedRows.length ? (
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ px: 2, py: 1.25, bgcolor: alpha(PURPLE, 0.08), borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="body2" sx={{ fontWeight: 800, mr: 1 }}>{selectedRows.length} selected</Typography>
                  {[
                    ['publish', PublishIcon, 'Publish', selectedRows.filter((r) => r.phase === 'draft')],
                    ['cancel', CancelIcon, 'Cancel', selectedRows.filter((r) => r.phase === 'upcoming' || r.phase === 'running')],
                    ['delete', DeleteIcon, 'Delete drafts', selectedRows.filter((r) => r.phase === 'draft')],
                  ].map(([action, Icon, label, list]) => (
                    <Button key={action} size="small" variant="outlined" startIcon={<Icon />} disabled={!list.length} onClick={() => setConfirm({ action, rows: list })} sx={{ ...btn, bgcolor: 'white', ...(action === 'publish' ? { color: PURPLE, borderColor: alpha(PURPLE, 0.5) } : { color: '#b91c1c', borderColor: alpha('#b91c1c', 0.4) }) }}>
                      {label}{list.length && list.length !== selectedRows.length ? ` (${list.length})` : ''}
                    </Button>
                  ))}
                  <Button size="small" startIcon={<DownloadIcon />} onClick={() => exportList('xlsx')} sx={{ ...btn, color: PURPLE }}>Export</Button>
                  <Button size="small" onClick={() => setSelected([])} sx={{ ...btn, color: 'text.secondary' }}>Clear</Button>
                </Stack>
              ) : null}
            </Paper>

            {!filtered.length ? (
              <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{rows.length ? 'No trainings match' : 'No trainings yet'}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{rows.length ? 'Try another tab or clear the filters.' : 'Create the first one; you can save it as a draft and publish later.'}</Typography>
                {rows.length ? <Button onClick={() => { setSearch(''); setDepartment('all'); setCategory('all'); changeTab('all'); }} sx={{ ...btn, color: PURPLE }}>Show all trainings</Button> : <Button variant="contained" startIcon={<AddIcon />} onClick={() => setForm({ open: true, mode: 'create', seed: null, draftId: null })} sx={{ ...btn, bgcolor: PURPLE }}>New training</Button>}
              </Paper>
            ) : null}

            {filtered.length && view === 'calendar' ? <TrainingCalendar rows={filtered} sessions={data.sessions} onOpen={setQuick} /> : null}

            {filtered.length && view === 'cards' && !grouped ? <TrainingCards rows={filtered} selected={selected} onToggle={toggle} onOpen={setQuick} onAction={onAction} /> : null}
            {filtered.length && view === 'cards' && grouped ? groups.map((g) => (
              <Box key={g.key}>
                <Stack direction="row" spacing={1} alignItems="baseline" sx={{ mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{g.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{g.cohorts} cohort{g.cohorts === 1 ? '' : 's'} · {g.seated}/{g.capacity} places</Typography>
                </Stack>
                <TrainingCards rows={g.rows} selected={selected} onToggle={toggle} onOpen={setQuick} onAction={onAction} />
              </Box>
            )) : null}

            {filtered.length && view === 'table' ? (
              <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: alpha(PURPLE, 0.06) }}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            size="small"
                            checked={filtered.length > 0 && filtered.every((r) => selected.includes(r.id))}
                            indeterminate={selected.length > 0 && !filtered.every((r) => selected.includes(r.id))}
                            onChange={(e) => setSelected(e.target.checked ? filtered.map((r) => r.id) : [])}
                            sx={{ '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: PURPLE } }}
                          />
                        </TableCell>
                        {['Training', 'When', 'Places', 'Status', 'To act on', ''].map((h) => <TableCell key={h || 'actions'} sx={{ fontWeight: 700, py: 1.25 }}>{h}</TableCell>)}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {grouped ? groups.map((g) => {
                        const open = g.cohorts === 1 || expanded.includes(g.key);
                        if (g.cohorts === 1) return renderRow(g.rows[0]);
                        return (
                          <React.Fragment key={g.key}>
                            <TableRow sx={{ bgcolor: '#faf8fd', cursor: 'pointer' }} onClick={() => setExpanded((x) => (x.includes(g.key) ? x.filter((k) => k !== g.key) : [...x, g.key]))}>
                              <TableCell padding="checkbox"><IconButton size="small">{open ? <CollapseIcon fontSize="small" /> : <ExpandIcon fontSize="small" />}</IconButton></TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 800 }}>{g.title}</Typography>
                                <Typography variant="caption" color="text.secondary">{g.cohorts} cohorts{g.code ? ` · ${g.code}` : ''}</Typography>
                              </TableCell>
                              <TableCell><Typography variant="body2">{g.next ? `Next: ${dateRange(g.next.startDate, g.next.endDate)}` : 'No upcoming cohort'}</Typography></TableCell>
                              <TableCell><Typography variant="body2" sx={{ fontWeight: 700 }}>{g.seated}/{g.capacity}</Typography></TableCell>
                              <TableCell />
                              <TableCell>{g.alertTotal ? <Box component="span" sx={{ px: 0.9, borderRadius: 5, fontSize: 12, fontWeight: 800, bgcolor: '#fef3c7', color: '#92400e' }}>{g.alertTotal} to act on</Box> : null}</TableCell>
                              <TableCell />
                            </TableRow>
                            {open ? g.rows.map((r) => renderRow(r, true)) : null}
                          </React.Fragment>
                        );
                      }) : paged.map((r) => renderRow(r))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {!grouped ? (
                  <TablePagination component="div" count={filtered.length} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }} rowsPerPageOptions={[10, 25, 50, 100]} />
                ) : null}
              </Paper>
            ) : null}
          </Stack>
        </Container>

        <TrainingQuickLook row={quick} onClose={() => setQuick(null)} onOpen={(r) => router.push(`/institution/training/${r.id}`)} onAction={onAction} />

        <TrainingFormDialog
          open={form.open}
          mode={form.mode}
          initialTraining={normalizeTrainingSeed(form.seed)}
          submitting={submitting}
          onClose={() => setForm({ open: false, mode: 'create', seed: null, draftId: null })}
          onSaveDetails={persistTraining}
          onFinished={wizardFinished}
        />

        <InstitutionModal open={Boolean(confirm)} onClose={() => setConfirm(null)} disableClose={submitting} maxWidth="xs">
          {confirmText ? (
            <>
              <InstitutionModalHeader icon={confirmText.icon} tone={confirmText.danger ? 'danger' : 'primary'} title={confirmText.title} subtitle={confirm.action === 'delete' ? 'This action cannot be undone' : null} onClose={() => setConfirm(null)} disableClose={submitting} />
              <InstitutionModalBody>
                <Alert severity={confirmText.danger ? 'warning' : 'info'}>{confirmText.body}</Alert>
                {confirm.rows.length > 1 ? (
                  <Collapse in>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{confirm.rows.slice(0, 8).map((r) => r.title).join(', ')}{confirm.rows.length > 8 ? ` and ${confirm.rows.length - 8} more` : ''}</Typography>
                  </Collapse>
                ) : null}
                {confirm.action === 'cancel' ? <TextField size="small" label="Reason (sent to participants)" value={reason} onChange={(e) => setReason(e.target.value)} fullWidth multiline minRows={2} /> : null}
              </InstitutionModalBody>
              <InstitutionModalFooter>
                <Button onClick={() => setConfirm(null)} disabled={submitting} sx={{ textTransform: 'none' }}>Back</Button>
                <Button variant="contained" color={confirmText.danger ? 'error' : 'primary'} onClick={runBulk} disabled={submitting} sx={{ ...btn, ...(confirmText.danger ? {} : { bgcolor: PURPLE }) }}>{submitting ? 'Working…' : confirmText.button}</Button>
              </InstitutionModalFooter>
            </>
          ) : null}
        </InstitutionModal>

        <Snackbar open={Boolean(notice)} autoHideDuration={5000} onClose={() => setNotice('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert onClose={() => setNotice('')} severity="success" sx={{ width: '100%' }}>{notice}</Alert>
        </Snackbar>
      </Box>
    </InstitutionModalVariant.Provider>
  );
}
