'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  MenuItem,
  Stack,
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
  alpha,
} from '@mui/material';
import {
  Badge as GcpIcon,
  CheckCircle as OkIcon,
  CloudUpload as RegistryIcon,
  EditNote as RecordIcon,
  ErrorOutline as AlertIcon,
  Gavel as ApprovalIcon,
  Groups as TeamIcon,
  HourglassTop as PendingIcon,
  OpenInNew as OpenIcon,
  PersonAdd as AddPersonIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import RowActions from '@/components/common/RowActions';
import StatusPill from '@/components/common/StatusPill';
import { FilterBar, PurpleTableHead, StatCards, TablePaper, filterFieldSx, paginationSx, zebraRowSx } from '@/components/common/ListPage';
import { InstitutionModal, InstitutionModalBody, InstitutionModalFooter, InstitutionModalHeader, InstitutionModalSection } from '@/components/GlobalAdmin/InstitutionModalShell';
import { APPROVAL_STATUS, GCP_STATUS, REGISTRY_STATUS, TRIAL_STATUS, approvalRows, registryRows, sampleTrials, teamRows } from '@/lib/clinical-trials';
import { PURPLE, TrialPanel, TrialStatusPill, fmt } from './TrialUI';

const initials = (n) => String(n || '?').replace(/^Dr\.\s*/, '').split(' ').filter(Boolean).map((x) => x[0]).join('').slice(0, 2).toUpperCase();
const tabSx = { px: 1, borderBottom: '1px solid rgba(139,108,188,0.12)', '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 52 }, '& .Mui-selected': { color: `${PURPLE} !important` }, '& .MuiTabs-indicator': { bgcolor: PURPLE } };
const btn = { textTransform: 'none', fontWeight: 700 };

export function CountTabs({ tabs, value, onChange, counts, alertKeys = [] }) {
  return (
    <Tabs value={value} onChange={(_, v) => onChange(v)} variant="scrollable" scrollButtons="auto" sx={tabSx}>
      {tabs.map((t) => {
        const hot = alertKeys.includes(t.key) && counts[t.key];
        return (
          <Tab key={t.key} value={t.key} label={(
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {t.label}
              <Box component="span" sx={{ px: 0.75, borderRadius: 999, fontSize: '0.7rem', fontWeight: 700, minWidth: 20, textAlign: 'center', bgcolor: value === t.key ? PURPLE : hot ? '#fee2e2' : '#f3f4f6', color: value === t.key ? 'white' : hot ? '#b91c1c' : '#6b7280' }}>{counts[t.key] || 0}</Box>
            </Box>
          )} />
        );
      })}
    </Tabs>
  );
}

export function usePaging(rows) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const current = Math.min(page, Math.max(0, Math.ceil(rows.length / rowsPerPage) - 1));
  return {
    rows: rows.slice(current * rowsPerPage, current * rowsPerPage + rowsPerPage),
    reset: () => setPage(0),
    pager: <TablePagination component="div" count={rows.length} page={current} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} rowsPerPageOptions={[5, 10, 25]} sx={paginationSx} />,
  };
}

export function TrialCell({ trial, onOpen }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="body2" onClick={() => onOpen(trial)} sx={{ fontWeight: 700, color: '#2D3748', cursor: 'pointer', '&:hover': { color: PURPLE, textDecoration: 'underline' } }}>{trial.shortTitle || trial.title}</Typography>
      <Typography variant="caption" color="text.secondary">{trial.code} · {trial.pi}</Typography>
    </Box>
  );
}

export const trialOptions = (trials) => trials.filter((t) => TRIAL_STATUS[t.status]?.open);
export const useTrials = (audience) => useState(() => sampleTrials({ mine: audience === 'researcher' }));

// ---------------------------------------------------------------------------------- //
// Approvals

function RecordApprovalPanel({ open, row, onClose, onSave }) {
  const [form, setForm] = useState({ status: 'APPROVED', reference: '', expiry: '' });
  React.useEffect(() => { if (open && row) setForm({ status: row.state === 'NOT_STARTED' ? 'PENDING' : 'APPROVED', reference: row.reference || '', expiry: row.expiry ? String(row.expiry).slice(0, 10) : '' }); }, [open, row]);
  if (!row) return null;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const missing = form.status === 'APPROVED' && (!form.reference.trim() || !form.expiry);
  return (
    <InstitutionModal open={open} onClose={onClose} variant="panel" maxWidth="sm">
      <InstitutionModalHeader icon={RecordIcon} title="Update regulatory approval" subtitle={`${row.trial.shortTitle} · ${row.body}`} onClose={onClose} />
      <InstitutionModalBody>
        <Alert severity="info" sx={{ mb: 2 }}>Clinical trials are in preview: changes are kept for this session only.</Alert>
        <Stack spacing={2}>
          <TextField select size="small" label="Status" value={form.status} onChange={set('status')}>
            {['PENDING', 'APPROVED', 'REJECTED'].map((s) => <MenuItem key={s} value={s}>{APPROVAL_STATUS[s].label}</MenuItem>)}
          </TextField>
          <TextField size="small" label="Approval reference" value={form.reference} onChange={set('reference')} placeholder="e.g. PPB/ECCT/26/015" required={form.status === 'APPROVED'} />
          <TextField size="small" type="date" label="Valid until" InputLabelProps={{ shrink: true }} value={form.expiry} onChange={set('expiry')} required={form.status === 'APPROVED'} />
          {missing ? <Typography variant="caption" color="text.secondary">An approval needs its reference and expiry date.</Typography> : null}
        </Stack>
      </InstitutionModalBody>
      <InstitutionModalFooter>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button variant="contained" disabled={missing} onClick={() => onSave(row, form)} sx={{ ...btn, bgcolor: PURPLE }}>Save</Button>
      </InstitutionModalFooter>
    </InstitutionModal>
  );
}

/** Ethics and regulatory approvals of every open trial, soonest problem first. */
export function ApprovalsView({ audience = 'researcher' }) {
  const router = useRouter();
  const [trials, setTrials] = useTrials(audience);
  const [tab, setTab] = useState('attention');
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('all');
  const [panel, setPanel] = useState(null);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState('');
  const researcher = audience === 'researcher';
  const all = useMemo(() => approvalRows(trials), [trials]);
  const TABS = [
    { key: 'attention', label: 'Needs action', match: (r) => ['EXPIRED', 'EXPIRING', 'NOT_STARTED', 'REJECTED'].includes(r.state) },
    { key: 'pending', label: 'Pending', match: (r) => r.state === 'PENDING' },
    { key: 'approved', label: 'Approved', match: (r) => r.state === 'APPROVED' },
    { key: 'all', label: 'All', match: () => true },
  ];
  const counts = Object.fromEntries(TABS.map((t) => [t.key, all.filter(t.match).length]));
  const q = search.trim().toLowerCase();
  const filtered = all.filter((r) => TABS.find((t) => t.key === tab).match(r) && (kind === 'all' || r.kind === kind)
    && (!q || [r.trial.title, r.trial.shortTitle, r.trial.code, r.trial.pi, r.body, r.reference].some((v) => String(v || '').toLowerCase().includes(q))));
  const paging = usePaging(filtered);
  const ethicsBase = researcher ? '/researcher/ethics/applications' : '/institution/ethics/applications';

  const action = (r) => {
    if (r.kind === 'Ethics') {
      if (researcher && r.state === 'NOT_STARTED') return { label: 'Apply for ethics', onClick: () => router.push('/researcher/ethics/applications/create') };
      return { label: researcher ? 'Open in Ethics' : 'Ethics register', onClick: () => router.push(ethicsBase), icon: <OpenIcon sx={{ fontSize: 14 }} /> };
    }
    return researcher ? { label: r.state === 'NOT_STARTED' ? 'Record submission' : 'Update', onClick: () => setEditing(r) } : null;
  };

  const save = (row, form) => {
    setTrials((list) => list.map((t) => (t.id === row.trial.id ? { ...t, regulatory: { ...(t.regulatory || {}), authority: row.body, status: form.status, reference: form.reference || null, expiry: form.expiry || null } } : t)));
    setEditing(null);
    setNotice(`Regulatory approval for "${row.trial.shortTitle}" updated.`);
  };

  return (
    <>
      {notice ? <Alert severity="success" onClose={() => setNotice('')} sx={{ mb: 2, borderRadius: 2 }}>{notice}</Alert> : null}
      <StatCards cards={[
        { label: 'Approvals tracked', value: all.length, sub: 'Ethics and regulatory, open trials', icon: <ApprovalIcon /> },
        { label: 'Needs action', value: counts.attention, sub: `${all.filter((r) => r.state === 'EXPIRED').length} expired`, icon: <AlertIcon /> },
        { label: 'Pending decision', value: counts.pending, sub: 'Submitted, waiting', icon: <PendingIcon /> },
        { label: 'Approved', value: counts.approved, sub: 'Valid for more than 60 days', icon: <OkIcon /> },
      ]} />
      <FilterBar search={search} onSearchChange={(v) => { setSearch(v); paging.reset(); }} searchPlaceholder="Search by trial, committee, authority or reference" onClear={() => { setSearch(''); setKind('all'); setTab('attention'); paging.reset(); }}>
        <TextField select className="filter-control" label="Type" value={kind} onChange={(e) => { setKind(e.target.value); paging.reset(); }} sx={filterFieldSx}>
          <MenuItem value="all">Ethics and regulatory</MenuItem>
          <MenuItem value="Ethics">Ethics</MenuItem>
          <MenuItem value="Regulatory">Regulatory</MenuItem>
        </TextField>
      </FilterBar>
      <TablePaper>
        <CountTabs tabs={TABS} value={tab} onChange={(v) => { setTab(v); paging.reset(); }} counts={counts} alertKeys={['attention']} />
        <TableContainer>
          <Table>
            <PurpleTableHead columns={['Trial', 'Approval', 'Status', 'Valid until', { label: 'Action', align: 'right' }]} />
            <TableBody>
              {paging.rows.map((r, i) => {
                const a = action(r);
                const m = APPROVAL_STATUS[r.state] || APPROVAL_STATUS.NOT_STARTED;
                return (
                  <TableRow key={r.id} sx={zebraRowSx(i)}>
                    <TableCell sx={{ maxWidth: 360 }}><TrialCell trial={r.trial} onOpen={setPanel} /></TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.kind}</Typography>
                      <Typography variant="caption" color="text.secondary">{r.body}{r.reference ? ` · ${r.reference}` : ''}</Typography>
                    </TableCell>
                    <TableCell><StatusPill label={m.label} tone={m.tone} /></TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Typography variant="body2">{fmt(r.expiry)}</Typography>
                      {r.daysLeft !== null && r.state !== 'PENDING' ? <Typography variant="caption" sx={{ color: r.daysLeft < 0 ? '#b91c1c' : r.daysLeft <= 60 ? '#b45309' : '#64748b' }}>{r.daysLeft < 0 ? `${-r.daysLeft} days ago` : `in ${r.daysLeft} days`}</Typography> : null}
                    </TableCell>
                    <TableCell align="right">{a ? <Button size="small" endIcon={a.icon} onClick={a.onClick} sx={{ ...btn, color: PURPLE, whiteSpace: 'nowrap' }}>{a.label}</Button> : null}</TableCell>
                  </TableRow>
                );
              })}
              {!paging.rows.length ? <TableRow><TableCell colSpan={5} sx={{ py: 6, textAlign: 'center' }}><Typography variant="body2" color="text.secondary">{tab === 'attention' ? 'No approvals need action.' : 'Nothing here.'}</Typography></TableCell></TableRow> : null}
            </TableBody>
          </Table>
        </TableContainer>
        {paging.pager}
      </TablePaper>
      <TrialPanel trial={panel} open={Boolean(panel)} onClose={() => setPanel(null)} audience={audience} onNavigate={(href) => router.push(href)} />
      <RecordApprovalPanel open={Boolean(editing)} row={editing} onClose={() => setEditing(null)} onSave={save} />
    </>
  );
}

// ---------------------------------------------------------------------------------- //
// Registry

function RegistryPanel({ open, row, onClose, onSave }) {
  const [number, setNumber] = useState('');
  React.useEffect(() => { if (open) setNumber(row?.number || ''); }, [open, row]);
  if (!row) return null;
  const v = number.trim().toUpperCase();
  const valid = /^PACTR\d{12,15}$/.test(v) || /^NCT\d{8}$/.test(v);
  return (
    <InstitutionModal open={open} onClose={onClose} variant="panel" maxWidth="sm">
      <InstitutionModalHeader icon={RegistryIcon} title="Registry number" subtitle={row.trial.shortTitle} onClose={onClose} />
      <InstitutionModalBody>
        <Alert severity="info" sx={{ mb: 2 }}>Clinical trials are in preview: changes are kept for this session only.</Alert>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">Register the trial on PACTR (pactr.samrc.ac.za) or ClinicalTrials.gov before the first participant is enrolled, then record the number here.</Typography>
          <TextField size="small" label="PACTR or NCT number" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="PACTR202611000123456 or NCT06654321" error={Boolean(v) && !valid} helperText={v && !valid ? 'PACTR + 12–15 digits, or NCT + 8 digits' : ' '} InputProps={{ sx: { fontFamily: 'monospace' } }} />
        </Stack>
      </InstitutionModalBody>
      <InstitutionModalFooter>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button variant="contained" disabled={!valid} onClick={() => onSave(row, v)} sx={{ ...btn, bgcolor: PURPLE }}>Save</Button>
      </InstitutionModalFooter>
    </InstitutionModal>
  );
}

/** Public registry status of each trial (PACTR / ClinicalTrials.gov) and the next step. */
export function RegistryView({ audience = 'researcher' }) {
  const router = useRouter();
  const [trials, setTrials] = useTrials(audience);
  const [tab, setTab] = useState('action');
  const [search, setSearch] = useState('');
  const [panel, setPanel] = useState(null);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState('');
  const researcher = audience === 'researcher';
  const all = useMemo(() => registryRows(trials), [trials]);
  const TABS = [
    { key: 'action', label: 'Needs action', match: (r) => Boolean(r.action) && r.status !== 'SUBMITTED' },
    { key: 'registered', label: 'Registered', match: (r) => ['REGISTERED', 'RESULTS_POSTED'].includes(r.status) },
    { key: 'results', label: 'Results due', match: (r) => r.status === 'RESULTS_DUE' },
    { key: 'all', label: 'All', match: () => true },
  ];
  const counts = Object.fromEntries(TABS.map((t) => [t.key, all.filter(t.match).length]));
  const q = search.trim().toLowerCase();
  const filtered = all.filter((r) => TABS.find((t) => t.key === tab).match(r) && (!q || [r.trial.title, r.trial.shortTitle, r.trial.code, r.trial.pi, r.number].some((x) => String(x || '').toLowerCase().includes(q))));
  const paging = usePaging(filtered);
  const save = (row, number) => {
    setTrials((list) => list.map((t) => (t.id === row.trial.id ? { ...t, registry: { ...(t.registry || {}), status: t.registry?.status === 'RESULTS_DUE' ? 'RESULTS_DUE' : 'REGISTERED', pactr: number.startsWith('PACTR') ? number : null, nct: number.startsWith('NCT') ? number : null } } : t)));
    setEditing(null);
    setNotice(`Registry number saved for "${row.trial.shortTitle}".`);
  };
  return (
    <>
      {notice ? <Alert severity="success" onClose={() => setNotice('')} sx={{ mb: 2, borderRadius: 2 }}>{notice}</Alert> : null}
      <StatCards cards={[
        { label: 'Trials', value: all.length, sub: 'Open and closed', icon: <RegistryIcon /> },
        { label: 'Not registered', value: all.filter((r) => r.status === 'NOT_REGISTERED').length, sub: `${all.filter((r) => r.urgent && r.status === 'NOT_REGISTERED').length} already recruiting`, icon: <AlertIcon /> },
        { label: 'Registered', value: counts.registered, sub: 'PACTR or ClinicalTrials.gov', icon: <OkIcon /> },
        { label: 'Results due', value: counts.results, sub: 'Summary results to post', icon: <PendingIcon /> },
      ]} />
      <FilterBar search={search} onSearchChange={(v) => { setSearch(v); paging.reset(); }} searchPlaceholder="Search by trial, PI or registry number" onClear={() => { setSearch(''); setTab('action'); paging.reset(); }} />
      <TablePaper>
        <CountTabs tabs={TABS} value={tab} onChange={(v) => { setTab(v); paging.reset(); }} counts={counts} alertKeys={['action']} />
        <TableContainer>
          <Table>
            <PurpleTableHead columns={['Trial', 'Trial status', 'Registry', 'Next step', { label: 'Action', align: 'right' }]} />
            <TableBody>
              {paging.rows.map((r, i) => {
                const m = REGISTRY_STATUS[r.status] || REGISTRY_STATUS.NOT_REGISTERED;
                return (
                  <TableRow key={r.id} sx={zebraRowSx(i)}>
                    <TableCell sx={{ maxWidth: 360 }}><TrialCell trial={r.trial} onOpen={setPanel} /></TableCell>
                    <TableCell><TrialStatusPill status={r.trial.status} /></TableCell>
                    <TableCell>
                      <StatusPill label={m.label} tone={m.tone} dot={false} />
                      {r.number ? <Typography variant="caption" component="div" sx={{ fontFamily: 'monospace', mt: 0.5 }}>{r.number}</Typography> : null}
                    </TableCell>
                    <TableCell><Typography variant="body2" sx={{ color: r.urgent ? '#b91c1c' : '#334155', fontWeight: r.urgent ? 700 : 400 }}>{r.action || '—'}</Typography></TableCell>
                    <TableCell align="right">
                      {researcher && ['NOT_REGISTERED', 'SUBMITTED'].includes(r.status) ? <Button size="small" onClick={() => setEditing(r)} sx={{ ...btn, color: PURPLE }}>Add number</Button> : null}
                      {r.number ? (
                        <Button size="small" endIcon={<OpenIcon sx={{ fontSize: 14 }} />} href={r.registry === 'PACTR' ? `https://pactr.samrc.ac.za/TrialDisplay.aspx?TrialID=${r.number.replace('PACTR', '')}` : `https://clinicaltrials.gov/study/${r.number}`} target="_blank" rel="noopener noreferrer" sx={{ ...btn, color: PURPLE }}>
                          View
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
              {!paging.rows.length ? <TableRow><TableCell colSpan={5} sx={{ py: 6, textAlign: 'center' }}><Typography variant="body2" color="text.secondary">{tab === 'action' ? 'Every trial is registered.' : 'Nothing here.'}</Typography></TableCell></TableRow> : null}
            </TableBody>
          </Table>
        </TableContainer>
        {paging.pager}
      </TablePaper>
      <TrialPanel trial={panel} open={Boolean(panel)} onClose={() => setPanel(null)} audience={audience} onNavigate={(href) => router.push(href)} />
      <RegistryPanel open={Boolean(editing)} row={editing} onClose={() => setEditing(null)} onSave={save} />
    </>
  );
}

// ---------------------------------------------------------------------------------- //
// Team & GCP

const DUTIES = ['Overall responsibility', 'Informed consent', 'Eligibility', 'SAE assessment', 'Drug dispensing', 'Drug accountability', 'Sample collection', 'Data entry', 'Regulatory files', 'Vital signs', 'Site liaison'];
const ROLES = ['Principal investigator', 'Co-investigator', 'Study coordinator', 'Research nurse', 'Clinical officer', 'Pharmacist', 'Data manager', 'Laboratory technician'];

function MemberPanel({ open, member, rows, onClose }) {
  if (!member) return null;
  const mine = rows.filter((r) => r.name === member.name);
  const m = GCP_STATUS[member.gcp];
  return (
    <InstitutionModal open={open} onClose={onClose} variant="panel" maxWidth="sm">
      <InstitutionModalHeader icon={TeamIcon} title={member.name} subtitle={member.role} onClose={onClose} />
      <InstitutionModalBody>
        <Stack spacing={2.5}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <GcpIcon sx={{ color: PURPLE }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>GCP certificate</Typography>
              <Typography variant="caption" color="text.secondary">{member.gcpExpiry ? `Valid until ${fmt(member.gcpExpiry)}` : 'No certificate on record'}</Typography>
            </Box>
            <StatusPill label={m.label} tone={m.tone} />
          </Stack>
          {member.email ? <Typography variant="body2">Email: <a href={`mailto:${member.email}`}>{member.email}</a></Typography> : null}
          <InstitutionModalSection title={`Trials (${mine.length})`}>
            <Stack spacing={1}>
              {mine.map((r) => (
                <Box key={r.id} sx={{ p: 1.25, borderRadius: 1.5, bgcolor: '#f8fafc' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{r.trial.shortTitle}</Typography>
                  <Typography variant="caption" color="text.secondary">{r.role}</Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
                    {r.duties.map((d) => <Chip key={d} size="small" label={d} sx={{ height: 20, fontSize: '0.68rem', bgcolor: alpha(PURPLE, 0.08), color: PURPLE, fontWeight: 600 }} />)}
                    {!r.duties.length ? <Typography variant="caption" color="text.secondary">No duties delegated</Typography> : null}
                  </Stack>
                </Box>
              ))}
            </Stack>
          </InstitutionModalSection>
        </Stack>
      </InstitutionModalBody>
    </InstitutionModal>
  );
}

function AddMemberPanel({ open, trials, onClose, onSave }) {
  const empty = { name: '', email: '', role: '', trialId: '', duties: [], gcpExpiry: '' };
  const [form, setForm] = useState(empty);
  React.useEffect(() => { if (open) setForm(empty); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const ready = form.name.trim() && form.role && form.trialId;
  return (
    <InstitutionModal open={open} onClose={onClose} variant="panel" maxWidth="sm">
      <InstitutionModalHeader icon={AddPersonIcon} title="Add a team member" subtitle="Delegate duties and record their GCP certificate" onClose={onClose} />
      <InstitutionModalBody>
        <Alert severity="info" sx={{ mb: 2 }}>Clinical trials are in preview: changes are kept for this session only.</Alert>
        <Stack spacing={2}>
          <TextField select size="small" label="Trial" required value={form.trialId} onChange={set('trialId')}>
            {trialOptions(trials).map((t) => <MenuItem key={t.id} value={t.id}>{t.shortTitle} ({t.code})</MenuItem>)}
          </TextField>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField size="small" fullWidth label="Full name" required value={form.name} onChange={set('name')} />
            <TextField size="small" fullWidth label="Email" type="email" value={form.email} onChange={set('email')} />
          </Stack>
          <TextField select size="small" label="Role" required value={form.role} onChange={set('role')}>
            {ROLES.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </TextField>
          <Autocomplete multiple size="small" options={DUTIES} value={form.duties} onChange={(_, v) => setForm((f) => ({ ...f, duties: v }))} renderInput={(params) => <TextField {...params} label="Delegated duties" placeholder="Choose duties" />} />
          <TextField size="small" type="date" label="GCP certificate valid until" InputLabelProps={{ shrink: true }} value={form.gcpExpiry} onChange={set('gcpExpiry')} helperText="Leave empty if they have no certificate yet: they'll be flagged." />
        </Stack>
      </InstitutionModalBody>
      <InstitutionModalFooter>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button variant="contained" disabled={!ready} onClick={() => onSave(form)} sx={{ ...btn, bgcolor: PURPLE }}>Add to team</Button>
      </InstitutionModalFooter>
    </InstitutionModal>
  );
}

/** Study team members across trials, their delegated duties and GCP certificates. */
export function TeamView({ audience = 'researcher' }) {
  const router = useRouter();
  const [trials, setTrials] = useTrials(audience);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [trialId, setTrialId] = useState('all');
  const [member, setMember] = useState(null);
  const [panel, setPanel] = useState(null);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState('');
  const researcher = audience === 'researcher';
  const all = useMemo(() => teamRows(trials), [trials]);
  const TABS = [
    { key: 'all', label: 'Everyone', match: () => true },
    { key: 'gcp', label: 'GCP needs action', match: (r) => r.gcp !== 'VALID' },
  ];
  const counts = Object.fromEntries(TABS.map((t) => [t.key, all.filter(t.match).length]));
  const q = search.trim().toLowerCase();
  const filtered = all.filter((r) => TABS.find((t) => t.key === tab).match(r) && (trialId === 'all' || r.trial.id === trialId)
    && (!q || [r.name, r.role, r.email, r.trial.shortTitle, ...r.duties].some((x) => String(x || '').toLowerCase().includes(q))));
  const paging = usePaging(filtered);
  const people = new Set(all.map((r) => r.name)).size;
  const save = (form) => {
    setTrials((list) => list.map((t) => (t.id === form.trialId ? { ...t, team: [...(t.team || []), { name: form.name.trim(), email: form.email || null, role: form.role, duties: form.duties, gcpExpiry: form.gcpExpiry || null }] } : t)));
    setAdding(false);
    setNotice(`${form.name.trim()} added to the team.`);
  };
  return (
    <>
      {notice ? <Alert severity="success" onClose={() => setNotice('')} sx={{ mb: 2, borderRadius: 2 }}>{notice}</Alert> : null}
      <StatCards cards={[
        { label: 'People', value: people, sub: `${all.length} trial roles`, icon: <TeamIcon /> },
        { label: 'GCP valid', value: all.filter((r) => r.gcp === 'VALID').length, sub: 'More than 90 days left', icon: <OkIcon /> },
        { label: 'GCP expiring', value: all.filter((r) => r.gcp === 'EXPIRING').length, sub: 'Within 90 days', icon: <PendingIcon /> },
        { label: 'No valid GCP', value: all.filter((r) => ['EXPIRED', 'MISSING'].includes(r.gcp)).length, sub: 'Expired or missing', icon: <AlertIcon /> },
      ]} />
      <FilterBar search={search} onSearchChange={(v) => { setSearch(v); paging.reset(); }} searchPlaceholder="Search by name, role, duty or trial" onClear={() => { setSearch(''); setTrialId('all'); setTab('all'); paging.reset(); }}>
        <TextField select className="filter-control" label="Trial" value={trialId} onChange={(e) => { setTrialId(e.target.value); paging.reset(); }} sx={filterFieldSx}>
          <MenuItem value="all">All trials</MenuItem>
          {trialOptions(trials).map((t) => <MenuItem key={t.id} value={t.id}>{t.shortTitle}</MenuItem>)}
        </TextField>
        {researcher ? <Button variant="contained" startIcon={<AddPersonIcon />} onClick={() => setAdding(true)} sx={{ ...btn, bgcolor: PURPLE, boxShadow: 'none', whiteSpace: 'nowrap', height: 40 }}>Add member</Button> : null}
      </FilterBar>
      <TablePaper>
        <CountTabs tabs={TABS} value={tab} onChange={(v) => { setTab(v); paging.reset(); }} counts={counts} alertKeys={['gcp']} />
        <TableContainer>
          <Table>
            <PurpleTableHead columns={['Person', 'Trial', 'Delegated duties', 'GCP', { label: 'Actions', align: 'center' }]} />
            <TableBody>
              {paging.rows.map((r, i) => {
                const m = GCP_STATUS[r.gcp];
                return (
                  <TableRow key={r.id} sx={zebraRowSx(i)}>
                    <TableCell>
                      <Stack direction="row" spacing={1.25} alignItems="center">
                        <Avatar sx={{ width: 30, height: 30, fontSize: '0.72rem', fontWeight: 700, bgcolor: alpha(PURPLE, 0.15), color: PURPLE }}>{initials(r.name)}</Avatar>
                        <Box>
                          <Typography variant="body2" onClick={() => setMember(r)} sx={{ fontWeight: 700, cursor: 'pointer', '&:hover': { color: PURPLE, textDecoration: 'underline' } }}>{r.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{r.role}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 260 }}><TrialCell trial={r.trial} onOpen={setPanel} /></TableCell>
                    <TableCell sx={{ maxWidth: 320 }}>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {r.duties.slice(0, 3).map((d) => <Chip key={d} size="small" label={d} sx={{ height: 20, fontSize: '0.68rem', bgcolor: alpha(PURPLE, 0.08), color: PURPLE, fontWeight: 600 }} />)}
                        {r.duties.length > 3 ? <Chip size="small" label={`+${r.duties.length - 3}`} sx={{ height: 20, fontSize: '0.68rem' }} /> : null}
                        {!r.duties.length ? <Typography variant="caption" color="text.secondary">None delegated</Typography> : null}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <StatusPill label={m.label} tone={m.tone} />
                      <Typography variant="caption" color="text.secondary" component="div">{r.gcpExpiry ? (r.gcpDaysLeft < 0 ? `expired ${fmt(r.gcpExpiry)}` : `until ${fmt(r.gcpExpiry)}`) : ''}</Typography>
                    </TableCell>
                    <TableCell align="center"><RowActions reserveMenuSpace={false} actions={[{ key: 'view', label: 'Open person', icon: <ViewIcon fontSize="small" />, onClick: () => setMember(r) }]} /></TableCell>
                  </TableRow>
                );
              })}
              {!paging.rows.length ? <TableRow><TableCell colSpan={5} sx={{ py: 6, textAlign: 'center' }}><Typography variant="body2" color="text.secondary">{tab === 'gcp' ? 'Every team member has a valid GCP certificate.' : 'No team members yet.'}</Typography></TableCell></TableRow> : null}
            </TableBody>
          </Table>
        </TableContainer>
        {paging.pager}
      </TablePaper>
      <MemberPanel open={Boolean(member)} member={member} rows={all} onClose={() => setMember(null)} />
      <TrialPanel trial={panel} open={Boolean(panel)} onClose={() => setPanel(null)} audience={audience} onNavigate={(href) => router.push(href)} />
      {researcher ? <AddMemberPanel open={adding} trials={trials} onClose={() => setAdding(false)} onSave={save} /> : null}
    </>
  );
}
