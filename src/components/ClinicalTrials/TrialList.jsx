'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Avatar,
  Box,
  Button,
  MenuItem,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import {
  AddCircleOutline as RegisterIcon,
  CheckCircle as DoneIcon,
  Groups as RecruitIcon,
  HourglassTop as PendingIcon,
  ReportProblem as FlagIcon,
  Science as TrialIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import RowActions from '@/components/common/RowActions';
import { FilterBar, PurpleTableHead, StatCards, TablePaper, filterFieldSx, paginationSx, zebraRowSx } from '@/components/common/ListPage';
import { PHASES, TRIAL_STATUS, portfolioSummary, trialFlags } from '@/lib/clinical-trials';
import { ApprovalPill, EnrolmentBar, FlagChip, PURPLE, RegisterTrialPanel, TrialPanel, TrialStatusPill, fmt } from './TrialUI';

const OPEN_TABS = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'attention', label: 'Needs attention', match: (t) => trialFlags(t).length > 0 },
  { key: 'setup', label: 'In setup', match: (t) => ['DRAFT', 'IN_APPROVAL', 'APPROVED'].includes(t.status) },
  { key: 'running', label: 'Recruiting & follow-up', match: (t) => ['RECRUITING', 'FOLLOW_UP'].includes(t.status) },
  { key: 'suspended', label: 'Suspended', match: (t) => t.status === 'SUSPENDED' },
];
const initials = (n) => String(n || '?').replace(/^Dr\.\s*/, '').split(' ').filter(Boolean).map((x) => x[0]).join('').slice(0, 2).toUpperCase();

/**
 * Trials list shared by My trials (researcher) and the Trial portfolio (research
 * office): stat cards, filters, status tabs, a review-style table and the trial panel.
 * `closed` lists completed / terminated trials instead.
 */
export default function TrialList({ trials: initial, audience = 'researcher', closed = false, canRegister = false, pi }) {
  const router = useRouter();
  const [trials, setTrials] = useState(initial);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [phase, setPhase] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [panel, setPanel] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [notice, setNotice] = useState('');

  const scoped = useMemo(() => trials.filter((t) => Boolean(TRIAL_STATUS[t.status]?.open) !== closed), [trials, closed]);
  const tabs = closed
    ? [{ key: 'all', label: 'All', match: () => true }, { key: 'completed', label: 'Completed', match: (t) => t.status === 'COMPLETED' }, { key: 'stopped', label: 'Terminated or withdrawn', match: (t) => t.status !== 'COMPLETED' }]
    : OPEN_TABS;
  const counts = Object.fromEntries(tabs.map((t) => [t.key, scoped.filter(t.match).length]));
  const q = search.trim().toLowerCase();
  const filtered = scoped.filter((t) => (tabs.find((x) => x.key === tab) || tabs[0]).match(t)
    && (phase === 'all' || t.phase === phase)
    && (!q || [t.title, t.shortTitle, t.code, t.pi, t.condition, t.department].some((v) => String(v || '').toLowerCase().includes(q))));
  const current = Math.min(page, Math.max(0, Math.ceil(filtered.length / rowsPerPage) - 1));
  const rows = filtered.slice(current * rowsPerPage, current * rowsPerPage + rowsPerPage);
  const s = portfolioSummary(trials);

  const cards = closed
    ? [
      { label: 'Closed trials', value: scoped.length, sub: 'Completed, terminated or withdrawn', icon: <TrialIcon /> },
      { label: 'Completed', value: scoped.filter((t) => t.status === 'COMPLETED').length, sub: 'As planned', icon: <DoneIcon /> },
      { label: 'Results due', value: scoped.filter((t) => t.registry?.status === 'RESULTS_DUE').length, sub: 'Registry results not posted', icon: <PendingIcon /> },
      { label: 'Participants', value: scoped.reduce((a, t) => a + (t.enrolled || 0), 0).toLocaleString(), sub: 'Enrolled across closed trials', icon: <RecruitIcon /> },
    ]
    : [
      { label: audience === 'researcher' ? 'My open trials' : 'Open trials', value: s.open, sub: `${s.inApproval} in setup`, icon: <TrialIcon /> },
      { label: 'Recruiting', value: s.recruiting, sub: `${s.enrolled.toLocaleString()} of ${s.target.toLocaleString()} enrolled`, icon: <RecruitIcon /> },
      { label: 'Needs attention', value: s.flagged, sub: `${s.urgent} urgent`, icon: <FlagIcon /> },
      { label: 'Closed', value: s.closed, sub: audience === 'researcher' ? 'See the Closed trials tab' : 'Completed or stopped', icon: <DoneIcon /> },
    ];

  const register = (form) => {
    const n = trials.length + 1;
    const trial = {
      id: `draft-${Date.now()}`, code: `CT-DRAFT-${String(n).padStart(3, '0')}`, status: 'DRAFT', enrolled: 0, sites: [], team: [{ name: pi || 'You', role: 'Principal investigator' }],
      ethics: null, regulatory: null, registry: { status: 'NOT_REGISTERED' }, events: [], mine: true,
      pi: pi || 'You', ...form, targetEnrollment: Number(form.targetEnrollment) || 0, shortTitle: form.shortTitle || form.title,
    };
    // A trial pulled by its registry / CTMS ID keeps that ID.
    const id = form.trialId;
    if (/^PACTR/.test(id || '')) trial.registry = { status: form.registryStatus || 'REGISTERED', pactr: id };
    else if (/^NCT/.test(id || '')) trial.registry = { status: form.registryStatus || 'REGISTERED', nct: id };
    else if (/^CT-/.test(id || '')) trial.code = id;
    delete trial.trialId; delete trial.registryStatus; delete trial.lookupSource;
    setTrials((list) => [trial, ...list]);
    setRegistering(false);
    setTab('setup');
    setNotice(`"${trial.shortTitle}" saved as a draft. Next: apply for ethics clearance.`);
  };

  return (
    <>
      {notice ? <Alert severity="success" onClose={() => setNotice('')} sx={{ mb: 2, borderRadius: 2 }}>{notice}</Alert> : null}
      <StatCards cards={cards} />
      <FilterBar search={search} onSearchChange={(v) => { setSearch(v); setPage(0); }} searchPlaceholder="Search by title, code, PI or condition" onClear={() => { setSearch(''); setPhase('all'); setTab('all'); setPage(0); }}>
        <TextField select className="filter-control" label="Phase" value={phase} onChange={(e) => { setPhase(e.target.value); setPage(0); }} sx={filterFieldSx}>
          <MenuItem value="all">All phases</MenuItem>
          {PHASES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
        </TextField>
        {canRegister && !closed ? (
          <Button variant="contained" startIcon={<RegisterIcon />} onClick={() => setRegistering(true)} sx={{ textTransform: 'none', fontWeight: 700, bgcolor: PURPLE, boxShadow: 'none', whiteSpace: 'nowrap', height: 40 }}>Register a trial</Button>
        ) : null}
      </FilterBar>

      <TablePaper>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(0); }} variant="scrollable" scrollButtons="auto" sx={{ px: 1, borderBottom: '1px solid rgba(139,108,188,0.12)', '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 52 }, '& .Mui-selected': { color: `${PURPLE} !important` }, '& .MuiTabs-indicator': { bgcolor: PURPLE } }}>
          {tabs.map((t) => (
            <Tab key={t.key} value={t.key} label={(
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {t.label}
                <Box component="span" sx={{ px: 0.75, borderRadius: 999, fontSize: '0.7rem', fontWeight: 700, minWidth: 20, textAlign: 'center', bgcolor: tab === t.key ? PURPLE : t.key === 'attention' && counts[t.key] ? '#fee2e2' : '#f3f4f6', color: tab === t.key ? 'white' : t.key === 'attention' && counts[t.key] ? '#b91c1c' : '#6b7280' }}>{counts[t.key] || 0}</Box>
              </Box>
            )} />
          ))}
        </Tabs>
        <TableContainer>
          <Table>
            <PurpleTableHead columns={closed
              ? ['Trial', 'Outcome', 'Enrolled', 'Registry', 'Closed', { label: 'Actions', align: 'center' }]
              : ['Trial', 'Status', 'Enrolment', 'Ethics', 'Registry', 'Attention', { label: 'Actions', align: 'center' }]} />
            <TableBody>
              {rows.map((t, i) => (
                <TableRow key={t.id} sx={zebraRowSx(i)}>
                  <TableCell sx={{ maxWidth: 420 }}>
                    <Typography variant="subtitle1" onClick={() => setPanel(t)} sx={{ fontWeight: 600, color: '#2D3748', fontSize: '0.95rem', lineHeight: 1.3, mb: 0.5, cursor: 'pointer', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden', '&:hover': { color: PURPLE, textDecoration: 'underline' } }}>
                      {t.shortTitle || t.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                      <Avatar sx={{ width: 22, height: 22, fontSize: '0.6rem', fontWeight: 700, bgcolor: PURPLE }}>{initials(t.pi)}</Avatar>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        <Box component="span" sx={{ color: '#374151', fontWeight: 600 }}>{t.pi}</Box> · {t.code} · {t.phase}
                      </Typography>
                    </Box>
                  </TableCell>
                  {closed ? (
                    <>
                      <TableCell><TrialStatusPill status={t.status} />{t.closure?.reason ? <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5 }}>{t.closure.reason}</Typography> : null}</TableCell>
                      <TableCell><EnrolmentBar trial={t} width={130} /></TableCell>
                      <TableCell><ApprovalPill registry={t.registry || {}} />{t.registry?.resultsDue ? <Typography variant="caption" color="text.secondary" component="div">due {fmt(t.registry.resultsDue)}</Typography> : null}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmt(t.closure?.date || t.endDate)}</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell><TrialStatusPill status={t.status} /></TableCell>
                      <TableCell>{t.status === 'DRAFT' || t.status === 'IN_APPROVAL' ? <Typography variant="caption" color="text.secondary">Target {Number(t.targetEnrollment || 0).toLocaleString()}</Typography> : <EnrolmentBar trial={t} width={140} />}</TableCell>
                      <TableCell><ApprovalPill approval={t.ethics} /></TableCell>
                      <TableCell><ApprovalPill registry={t.registry || {}} /></TableCell>
                      <TableCell><FlagChip trial={t} /></TableCell>
                    </>
                  )}
                  <TableCell align="center">
                    <RowActions reserveMenuSpace={false} actions={[{ key: 'open', label: 'Open trial', icon: <ViewIcon fontSize="small" />, onClick: () => setPanel(t) }]} />
                  </TableCell>
                </TableRow>
              ))}
              {!rows.length ? (
                <TableRow><TableCell colSpan={7} sx={{ py: 6, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">{scoped.length ? 'No trials match these filters.' : closed ? 'No closed trials yet.' : canRegister ? 'No trials yet. Register your first trial.' : 'No trials yet.'}</Typography>
                </TableCell></TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={filtered.length} page={current} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} rowsPerPageOptions={[5, 10, 25]} sx={paginationSx} />
      </TablePaper>

      <TrialPanel trial={panel} open={Boolean(panel)} onClose={() => setPanel(null)} audience={audience} onNavigate={(href) => router.push(href)} />
      {canRegister ? <RegisterTrialPanel open={registering} onClose={() => setRegistering(false)} onSave={register} pi={pi} /> : null}
    </>
  );
}
