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
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  CalendarToday as CalendarIcon,
  CheckCircleOutline as AllDoneIcon,
  Dashboard as OverviewIcon,
  Description as MaterialsIcon,
  EmojiEvents as CertificateIcon,
  Home as HomeIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  Public as SharedIcon,
  QrCodeScanner as CheckInIcon,
  RecordVoiceOver as FacilitatingIcon,
  Refresh as RefreshIcon,
  School as TrainingIcon,
  Schedule as ScheduleIcon,
  Search as SearchIcon,
  WorkspacePremium as CpdIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import { DELIVERY_MODE_LABELS } from '@/lib/training-sessions';
import { DATE_FILTERS, filterCatalogue } from '@/lib/training-hub';
import {
  DUE_CHIP,
  DeadlineLabel,
  LocationText,
  MetaRow,
  PURPLE,
  StatCard,
  StatusChip,
  asList,
  formatDate,
  formatRange,
  formatSessionTime,
} from '@/components/Training/researcher/trainingUi';

const TABS = ['overview', 'mine', 'catalogue'];
const btn = { textTransform: 'none', fontWeight: 700 };
const grid = { display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }, gap: 2 };
const fieldSx = {
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: PURPLE },
  '& .MuiInputLabel-root.Mui-focused': { color: PURPLE },
};

const TODO_TONE = {
  MANDATORY_OVERDUE: '#b91c1c',
  CHECK_IN: '#166534',
  JOIN: '#166534',
  RETRAINING: '#b91c1c',
  ASSESSMENT: PURPLE,
  MANDATORY_DUE: '#92400e',
  FEEDBACK: '#075985',
  WAITING: '#64748b',
};
const TODO_ACTION = {
  MANDATORY_OVERDUE: 'Open', CHECK_IN: 'Check in', JOIN: 'Join', RETRAINING: 'Find a refresher',
  ASSESSMENT: 'Start', MANDATORY_DUE: 'Open', FEEDBACK: 'Give feedback', WAITING: 'View',
};

function EmptyState({ icon, title, text, action }) {
  return (
    <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 2, border: '1px dashed', borderColor: alpha(PURPLE, 0.3) }}>
      <Box sx={{ color: '#cbd5e1', mb: 1, '& svg': { fontSize: 42 } }}>{icon}</Box>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: action ? 2 : 0 }}>{text}</Typography>
      {action}
    </Paper>
  );
}

function TrainingCard({ training, registration, onOpen, catalogue }) {
  const groups = asList(training.targetGroup);
  const full = (training.remainingSlots ?? 0) <= 0;
  return (
    <Paper
      elevation={0}
      onClick={onOpen}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen(); }}
      sx={{
        p: 2.25,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 240,
        '&:hover, &:focus-visible': { borderColor: alpha(PURPLE, 0.45), boxShadow: `0 8px 24px ${alpha(PURPLE, 0.12)}`, outline: 'none' },
      }}
    >
      <Stack direction="row" justifyContent="space-between" spacing={1} sx={{ mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b' }}>{training.title}</Typography>
        {registration ? <StatusChip status={registration.status} /> : <DeadlineLabel startDate={training.startDate} endDate={training.endDate} />}
      </Stack>
      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
        {training.isMandatory ? <Chip size="small" label="Mandatory" sx={{ height: 22, fontWeight: 700, bgcolor: alpha(PURPLE, 0.12), color: PURPLE }} /> : null}
        {registration?.source === 'ASSIGNED' ? (
          <Chip size="small" label={registration.dueDate ? `Assigned · due ${formatDate(registration.dueDate)}` : 'Assigned to you'} sx={{ height: 22, fontWeight: 700, bgcolor: '#f1f5f9', color: '#334155' }} />
        ) : null}
        {DUE_CHIP[registration?.compliance?.state] ? (
          <Chip size="small" label={DUE_CHIP[registration.compliance.state].label} sx={{ height: 22, fontWeight: 700, ...DUE_CHIP[registration.compliance.state].sx }} />
        ) : null}
        {catalogue && training.deliveryMode ? <Chip size="small" variant="outlined" label={DELIVERY_MODE_LABELS[training.deliveryMode] || training.deliveryMode} sx={{ height: 22 }} /> : null}
        {catalogue && (training.cpdHours || training.cpdPoints) ? (
          <Chip size="small" icon={<CpdIcon sx={{ fontSize: 14 }} />} label={`CPD ${[training.cpdHours ? `${training.cpdHours} h` : null, training.cpdPoints ? `${training.cpdPoints} pts` : null].filter(Boolean).join(' · ')}`} sx={{ height: 22, fontWeight: 700, bgcolor: '#e0f2fe', color: '#075985' }} />
        ) : null}
        {catalogue && training.fromOtherInstitution ? (
          <Chip size="small" icon={<SharedIcon sx={{ fontSize: 14 }} />} label="Open to other institutions" sx={{ height: 22, fontWeight: 700, bgcolor: '#f0fdf4', color: '#166534' }} />
        ) : null}
        {catalogue && training.eligibility && !training.eligibility.ok ? (
          <Chip size="small" label="Not eligible" title={training.eligibility.reasons.join(' · ')} sx={{ height: 22, fontWeight: 700, bgcolor: '#fef3c7', color: '#92400e' }} />
        ) : null}
        {catalogue && training.requiresApproval ? <Chip size="small" variant="outlined" label="Approval needed" sx={{ height: 22 }} /> : null}
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {training.description || 'No description provided.'}
      </Typography>
      <Stack spacing={0.75} sx={{ mb: 1.5 }}>
        <MetaRow icon={<CalendarIcon sx={{ fontSize: 16 }} />}>{formatRange(training.startDate, training.endDate)}</MetaRow>
        <MetaRow icon={<LocationIcon sx={{ fontSize: 16 }} />}><LocationText location={training.location} /></MetaRow>
        <MetaRow icon={<PeopleIcon sx={{ fontSize: 16 }} />}>{[training.department, ...groups].filter(Boolean).join(' · ') || 'Audience not specified'}</MetaRow>
      </Stack>
      {registration && registration.totalModules > 0 ? (
        <Box sx={{ mt: 'auto' }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">Progress</Typography>
            <Typography variant="caption" sx={{ color: PURPLE, fontWeight: 700 }}>{registration.completedModules}/{registration.totalModules} modules</Typography>
          </Stack>
          <LinearProgress variant="determinate" value={registration.progressPercentage || 0} sx={{ height: 6, borderRadius: 3, bgcolor: alpha(PURPLE, 0.12), '& .MuiLinearProgress-bar': { bgcolor: PURPLE } }} />
          {registration.hasCertificate ? <Chip icon={<CertificateIcon sx={{ fontSize: 16 }} />} label="Certificate ready" size="small" sx={{ mt: 1.25, bgcolor: '#dcfce7', color: '#166534', fontWeight: 700 }} /> : null}
        </Box>
      ) : !registration ? (
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 'auto' }}>
          <Chip size="small" label={`${training.moduleCount ?? training.modules?.length ?? 0} modules`} sx={{ bgcolor: alpha(PURPLE, 0.08), color: PURPLE, fontWeight: 700 }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: !full ? '#166534' : training.waitlistEnabled ? '#92400e' : '#b91c1c' }}>
            {!full ? `${training.remainingSlots} seats left` : training.waitlistEnabled ? `Full · waiting list${training.waitlistCount ? ` (${training.waitlistCount})` : ''}` : 'Full'}
          </Typography>
        </Stack>
      ) : <Box sx={{ mt: 'auto' }} />}
      <Button size="small" startIcon={registration ? <MaterialsIcon /> : <ScheduleIcon />} sx={{ mt: 1.5, color: PURPLE, ...btn, alignSelf: 'flex-start', px: 0 }}>
        {registration ? 'Open training' : 'View details and register'}
      </Button>
    </Paper>
  );
}

function Overview({ dashboard, loading, onOpen, router }) {
  if (loading && !dashboard) return <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}><CircularProgress sx={{ color: PURPLE }} /></Box>;
  if (!dashboard) return null;
  const { todos, nextSessions, cpd, counts } = dashboard;
  const go = (todo) => {
    if (todo.external) window.open(todo.href, '_blank', 'noopener');
    else router.push(todo.href);
  };
  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <StatCard label="In progress" value={counts.active} caption="Trainings you're enrolled in" />
        <StatCard label="Completed" value={counts.completed} caption="All time" />
        <StatCard label={`CPD ${cpd.year}`} value={`${cpd.hours} h`} caption={cpd.points ? `${cpd.points} points` : 'From completed trainings'} />
        <StatCard label="Waiting" value={counts.waiting} caption="Approval or waiting list" />
      </Stack>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '3fr 2fr' }, gap: 2, alignItems: 'start' }}>
        <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5 }}>To do</Typography>
          {todos.length ? (
            <Stack spacing={1}>
              {todos.map((todo) => (
                <Stack
                  key={`${todo.kind}-${todo.href}-${todo.title}`}
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  alignItems={{ sm: 'center' }}
                  sx={{ p: 1.25, borderRadius: 1.5, border: '1px solid', borderColor: 'divider', borderLeft: `4px solid ${TODO_TONE[todo.kind] || PURPLE}` }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{todo.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{todo.detail}</Typography>
                  </Box>
                  <Button size="small" variant={todo.kind === 'WAITING' ? 'text' : 'outlined'} onClick={() => go(todo)} sx={{ ...btn, color: TODO_TONE[todo.kind] || PURPLE, borderColor: TODO_TONE[todo.kind] || PURPLE, whiteSpace: 'nowrap' }}>
                    {TODO_ACTION[todo.kind] || 'Open'}
                  </Button>
                </Stack>
              ))}
            </Stack>
          ) : (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 2, color: '#166534' }}>
              <AllDoneIcon />
              <Typography variant="body2">You&apos;re all caught up.</Typography>
            </Stack>
          )}
        </Paper>
        <Stack spacing={2}>
          <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" sx={{ mb: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, flex: 1 }}>Next sessions</Typography>
              <Button size="small" onClick={() => router.push('/researcher/training/calendar')} sx={{ color: PURPLE, ...btn }}>Calendar</Button>
            </Stack>
            {nextSessions.length ? (
              <Stack spacing={1}>
                {nextSessions.map((s) => (
                  <Stack key={s.id} direction="row" spacing={1.25} alignItems="center" onClick={() => onOpen(s.trainingId)} sx={{ cursor: 'pointer', p: 1, borderRadius: 1.5, '&:hover': { bgcolor: alpha(PURPLE, 0.05) } }}>
                    <TimeIcon sx={{ color: PURPLE }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>{s.title}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>{formatSessionTime(s.startsAt, s.endsAt)} · {s.trainingTitle}</Typography>
                    </Box>
                    {s.checkInOpen ? <Chip size="small" label="Check in" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 700 }} /> : null}
                    {s.joinOpen ? <Chip size="small" label="Live" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 700 }} /> : null}
                  </Stack>
                ))}
              </Stack>
            ) : <Typography variant="body2" color="text.secondary">No upcoming sessions.</Typography>}
          </Paper>
          <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <CpdIcon sx={{ color: PURPLE }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, flex: 1 }}>CPD in {cpd.year}</Typography>
              <Button size="small" onClick={() => router.push('/researcher/training/transcript')} sx={{ color: PURPLE, ...btn }}>Transcript</Button>
            </Stack>
            {cpd.trainings.length ? (
              <Stack spacing={0.5}>
                {cpd.trainings.map((t) => (
                  <Stack key={t.id} direction="row" justifyContent="space-between" spacing={1}>
                    <Typography variant="body2" noWrap sx={{ minWidth: 0 }}>{t.title}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{[t.hours ? `${t.hours} h` : null, t.points ? `${t.points} pts` : null].filter(Boolean).join(' · ')}</Typography>
                  </Stack>
                ))}
              </Stack>
            ) : <Typography variant="body2" color="text.secondary">Complete trainings with CPD hours to build up your total.</Typography>}
          </Paper>
        </Stack>
      </Box>
    </Stack>
  );
}

/**
 * Researcher learning hub (#107): overview (to-do, next sessions, CPD), my trainings,
 * and the catalogue with filters. Each training opens its own page.
 */
export default function TrainingPage() {
  const router = useRouter();
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [myTrainings, setMyTrainings] = useState([]);
  const [catalogue, setCatalogue] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [mySearch, setMySearch] = useState('');
  const [filters, setFilters] = useState({ search: '', department: 'all', category: 'all', mode: 'all', date: 'any', cpdOnly: false, eligibleOnly: false, openOnly: false });

  const open = useCallback((id) => router.push(`/researcher/training/${id}`), [router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [myRes, allRes, dashRes] = await Promise.all([
        fetch('/api/training/my', { cache: 'no-store' }),
        fetch('/api/training', { cache: 'no-store' }),
        fetch('/api/training/my/dashboard', { cache: 'no-store' }),
      ]);
      const [my, all, dash] = await Promise.all([myRes.json().catch(() => ({})), allRes.json().catch(() => ({})), dashRes.json().catch(() => ({}))]);
      const registrations = my.success ? my.registrations || [] : [];
      setMyTrainings(registrations);
      const mine = new Set(registrations.filter((r) => r.status !== 'CANCELLED').map((r) => r.training.id));
      setCatalogue(all.success ? (all.trainings || []).filter((t) => !mine.has(t.id)) : []);
      setDashboard(dash.success ? dash : null);
      if (!my.success || !all.success) setError(my.error || all.error || 'Some trainings could not be loaded');
    } catch (err) {
      setError(err.message || 'Failed to load trainings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Old links: ?training=<id> (emails, other pages) open the training's page;
  // ?tab= and #available pick a tab.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const linked = params.get('training');
    if (linked) {
      router.replace(`/researcher/training/${encodeURIComponent(linked)}`);
      return;
    }
    const wanted = params.get('tab');
    if (TABS.includes(wanted)) setTab(wanted);
    else if (window.location.hash === '#available') setTab('catalogue');
  }, [router]);

  const changeTab = (value) => {
    setTab(value);
    if (typeof window !== 'undefined') window.history.replaceState(null, '', value === 'overview' ? '/researcher/training' : `/researcher/training?tab=${value}`);
  };

  const urgency = (item) => ({ OVERDUE: 0, RETRAINING_DUE: 1, DUE_SOON: 2, EXPIRING: 3 }[item.compliance?.state] ?? 9);
  const mine = useMemo(() => {
    const q = mySearch.trim().toLowerCase();
    return myTrainings
      .filter((r) => !q || `${r.training.title} ${r.training.department || ''}`.toLowerCase().includes(q))
      .sort((a, b) => urgency(a) - urgency(b) || new Date(b.registeredAt) - new Date(a.registeredAt));
  }, [myTrainings, mySearch]);

  const options = useMemo(() => ({
    departments: [...new Set(catalogue.flatMap((t) => String(t.department || '').split(',').map((d) => d.trim())).filter(Boolean))].sort(),
    categories: [...new Set(catalogue.map((t) => t.category).filter(Boolean))].sort(),
  }), [catalogue]);
  const filtered = useMemo(() => filterCatalogue(catalogue, filters), [catalogue, filters]);
  const setF = (patch) => setFilters((f) => ({ ...f, ...patch }));
  const filtersOn = filters.search || filters.department !== 'all' || filters.category !== 'all' || filters.mode !== 'all' || filters.date !== 'any' || filters.cpdOnly || filters.eligibleOnly || filters.openOnly;

  return (
    <Box>
      <PageHeader
        title="Training"
        description="Your learning: what to do next, your trainings, and courses open to you."
        icon={<TrainingIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/researcher' },
          { label: 'Training' },
        ]}
        actionButton={(
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            <Button variant="contained" startIcon={<CheckInIcon />} onClick={() => router.push('/researcher/training/check-in')} sx={{ bgcolor: '#166534', color: 'white', ...btn, '&:hover': { bgcolor: '#14532d' } }}>
              Session check-in
            </Button>
            <Button variant="contained" startIcon={<CertificateIcon />} onClick={() => router.push('/researcher/training/certificates')} sx={{ bgcolor: 'white', color: PURPLE, ...btn, '&:hover': { bgcolor: '#f5f5f5' } }}>
              Certificates
            </Button>
            <Button variant="contained" startIcon={<FacilitatingIcon />} onClick={() => router.push('/researcher/training/facilitating')} sx={{ bgcolor: 'white', color: PURPLE, ...btn, '&:hover': { bgcolor: '#f5f5f5' } }}>
              Facilitating
            </Button>
            <Button variant="contained" startIcon={<RefreshIcon />} onClick={load} disabled={loading} sx={{ bgcolor: 'white', color: PURPLE, ...btn, '&:hover': { bgcolor: '#f5f5f5' } }}>
              Refresh
            </Button>
          </Stack>
        )}
      />

      <Container maxWidth={false} sx={{ py: 3, maxWidth: '1600px', mx: 'auto' }}>
        {error ? <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert> : null}

        <Paper id="available" sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', scrollMarginTop: 96 }}>
          <Tabs
            value={tab}
            onChange={(_, value) => changeTab(value)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': { ...btn, minHeight: 52, color: '#64748b' },
              '& .Mui-selected': { color: `${PURPLE} !important` },
              '& .MuiTabs-indicator': { backgroundColor: PURPLE, height: 3 },
            }}
          >
            <Tab value="overview" icon={<OverviewIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Overview${dashboard?.todos?.length ? ` (${dashboard.todos.length} to do)` : ''}`} />
            <Tab value="mine" icon={<TrainingIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`My trainings (${myTrainings.length})`} />
            <Tab value="catalogue" icon={<SearchIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Catalogue (${catalogue.length})`} />
          </Tabs>
        </Paper>

        {tab === 'overview' ? <Overview dashboard={dashboard} loading={loading} onOpen={open} router={router} /> : null}

        {tab === 'mine' ? (
          loading ? <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}><CircularProgress sx={{ color: PURPLE }} /></Box> : (
            <Stack spacing={2}>
              {myTrainings.length ? (
                <TextField size="small" placeholder="Search my trainings" value={mySearch} onChange={(e) => setMySearch(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} sx={{ maxWidth: 420, ...fieldSx }} />
              ) : null}
              {mine.length ? (
                <Box sx={grid}>
                  {mine.map((r) => <TrainingCard key={r.id} training={r.training} registration={r} onOpen={() => open(r.training.id)} />)}
                </Box>
              ) : (
                <EmptyState
                  icon={<TrainingIcon />}
                  title={myTrainings.length ? 'Nothing matches' : 'No trainings yet'}
                  text={myTrainings.length ? 'Try another search.' : 'Browse the catalogue and register to start tracking your progress.'}
                  action={!myTrainings.length ? <Button variant="contained" onClick={() => changeTab('catalogue')} sx={{ bgcolor: PURPLE, ...btn }}>Browse the catalogue</Button> : null}
                />
              )}
            </Stack>
          )
        ) : null}

        {tab === 'catalogue' ? (
          <Stack spacing={2}>
            <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Stack spacing={1.5}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                  <TextField fullWidth size="small" placeholder="Search title, code, department or audience" value={filters.search} onChange={(e) => setF({ search: e.target.value })} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} sx={fieldSx} />
                  <TextField select size="small" label="Department" value={filters.department} onChange={(e) => setF({ department: e.target.value })} sx={{ minWidth: 180, ...fieldSx }}>
                    <MenuItem value="all">All departments</MenuItem>
                    {options.departments.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                  </TextField>
                  <TextField select size="small" label="Category" value={filters.category} onChange={(e) => setF({ category: e.target.value })} sx={{ minWidth: 160, ...fieldSx }}>
                    <MenuItem value="all">All categories</MenuItem>
                    {options.categories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </TextField>
                  <TextField select size="small" label="Format" value={filters.mode} onChange={(e) => setF({ mode: e.target.value })} sx={{ minWidth: 140, ...fieldSx }}>
                    <MenuItem value="all">Any format</MenuItem>
                    {Object.entries(DELIVERY_MODE_LABELS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                  </TextField>
                  <TextField select size="small" label="When" value={filters.date} onChange={(e) => setF({ date: e.target.value })} sx={{ minWidth: 170, ...fieldSx }}>
                    {Object.entries(DATE_FILTERS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                  </TextField>
                </Stack>
                <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', rowGap: 0.5 }} alignItems="center">
                  <FormControlLabel control={<Switch size="small" checked={filters.cpdOnly} onChange={(e) => setF({ cpdOnly: e.target.checked })} />} label="With CPD" />
                  <FormControlLabel control={<Switch size="small" checked={filters.eligibleOnly} onChange={(e) => setF({ eligibleOnly: e.target.checked })} />} label="I'm eligible" />
                  <FormControlLabel control={<Switch size="small" checked={filters.openOnly} onChange={(e) => setF({ openOnly: e.target.checked })} />} label="Places or waiting list" />
                  {filtersOn ? (
                    <Button size="small" onClick={() => setFilters({ search: '', department: 'all', category: 'all', mode: 'all', date: 'any', cpdOnly: false, eligibleOnly: false, openOnly: false })} sx={{ color: PURPLE, ...btn }}>
                      Clear filters
                    </Button>
                  ) : null}
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>{filtered.length} of {catalogue.length}</Typography>
                </Stack>
              </Stack>
            </Paper>
            {loading ? <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}><CircularProgress sx={{ color: PURPLE }} /></Box> : filtered.length ? (
              <Box sx={grid}>
                {filtered.map((t) => <TrainingCard key={t.id} training={t} catalogue onOpen={() => open(t.id)} />)}
              </Box>
            ) : (
              <EmptyState
                icon={<ScheduleIcon />}
                title={catalogue.length ? 'No trainings match these filters' : 'Nothing open right now'}
                text={catalogue.length ? 'Clear a filter or two to see more.' : 'New trainings appear here as soon as they are published.'}
              />
            )}
          </Stack>
        ) : null}
      </Container>
    </Box>
  );
}
