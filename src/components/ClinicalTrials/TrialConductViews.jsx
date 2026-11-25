'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  CheckCircle as OkIcon,
  ErrorOutline as AlertIcon,
  Groups as RecruitIcon,
  HealthAndSafety as SafetyIcon,
  HourglassTop as PendingIcon,
  PersonAdd as EnrolIcon,
  ReportProblem as DeviationIcon,
  TrendingDown as BehindIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import RowActions from '@/components/common/RowActions';
import StatusPill from '@/components/common/StatusPill';
import { FilterBar, PurpleTableHead, StatCards, TablePaper, filterFieldSx, zebraRowSx } from '@/components/common/ListPage';
import { InstitutionModal, InstitutionModalBody, InstitutionModalFooter, InstitutionModalHeader, InstitutionModalSection } from '@/components/GlobalAdmin/InstitutionModalShell';
import { EVENT_STATE, PACE, complianceRows, eventDeadline, eventRows, recruitmentRows } from '@/lib/clinical-trials';
import { EnrolmentBar, FlagList, PURPLE, TrialPanel, TrialStatusPill, fmt } from './TrialUI';
import { CountTabs, TrialCell, trialOptions, usePaging, useTrials } from './TrialOversightViews';

const btn = { textTransform: 'none', fontWeight: 700 };
const preview = <Alert severity="info" sx={{ mb: 2 }}>Clinical trials are in preview: changes are kept for this session only.</Alert>;
const today = () => new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------------------------- //
// Recruitment

function RecruitmentPanel({ open, row, onClose, canRecord, onRecord }) {
  const [form, setForm] = useState({ site: '', date: today(), screened: '', enrolled: '' });
  React.useEffect(() => { if (open && row) setForm({ site: row.trial.sites?.[0]?.name || '', date: today(), screened: '', enrolled: '' }); }, [open, row]);
  if (!row) return null;
  const t = row.trial;
  const n = Number(form.enrolled);
  const ready = form.site && form.date && n > 0 && (!form.screened || Number(form.screened) >= n);
  return (
    <InstitutionModal open={open} onClose={onClose} variant="panel" maxWidth="sm">
      <InstitutionModalHeader icon={RecruitIcon} title={t.shortTitle} subtitle={`${t.code} · recruitment`} onClose={onClose} />
      <InstitutionModalBody>
        <Stack spacing={2.5}>
          <Stack direction="row" spacing={1} alignItems="center"><TrialStatusPill status={t.status} /><StatusPill label={PACE[row.pace].label} tone={PACE[row.pace].tone} dot={false} /></Stack>
          <EnrolmentBar trial={t} width="100%" />
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5 }}>
            {[['Enrolled', row.enrolled.toLocaleString()], ['Still to enrol', row.remaining.toLocaleString()], ['Needed per month', row.perMonth ?? '—']].map(([k, v]) => (
              <Box key={k} sx={{ p: 1.25, borderRadius: 1.5, bgcolor: '#f8fafc' }}><Typography variant="caption" color="text.secondary">{k}</Typography><Typography sx={{ fontWeight: 800 }}>{v}</Typography></Box>
            ))}
          </Box>
          <Typography variant="caption" color="text.secondary">Recruitment window {fmt(t.recruitmentStart || t.startDate)} – {fmt(t.recruitmentEnd || t.endDate)}</Typography>
          {t.sites?.length ? (
            <InstitutionModalSection title="By site">
              <Stack spacing={1.25}>
                {t.sites.map((s) => (
                  <Stack key={s.name} direction="row" spacing={1.5} alignItems="center">
                    <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }} noWrap>{s.name}</Typography>
                    <EnrolmentBar trial={{ targetEnrollment: s.target, enrolled: s.enrolled, status: 'X' }} width={170} />
                  </Stack>
                ))}
              </Stack>
            </InstitutionModalSection>
          ) : null}
          {canRecord && t.status === 'RECRUITING' ? (
            <InstitutionModalSection title="Record enrolment">
              {preview}
              <Stack spacing={1.5}>
                <TextField select size="small" label="Site" value={form.site} onChange={(e) => setForm((f) => ({ ...f, site: e.target.value }))}>
                  {(t.sites?.length ? t.sites : [{ name: 'Main site' }]).map((s) => <MenuItem key={s.name} value={s.name}>{s.name}</MenuItem>)}
                </TextField>
                <Stack direction="row" spacing={1.5}>
                  <TextField size="small" type="date" label="Date" InputLabelProps={{ shrink: true }} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} inputProps={{ max: today() }} fullWidth />
                  <TextField size="small" type="number" label="Screened" value={form.screened} onChange={(e) => setForm((f) => ({ ...f, screened: e.target.value }))} fullWidth />
                  <TextField size="small" type="number" label="Enrolled" required value={form.enrolled} onChange={(e) => setForm((f) => ({ ...f, enrolled: e.target.value }))} fullWidth error={Boolean(form.screened) && Number(form.screened) < n} />
                </Stack>
                {form.screened && Number(form.screened) < n ? <Typography variant="caption" color="error">Enrolled can't be more than screened.</Typography> : null}
              </Stack>
            </InstitutionModalSection>
          ) : null}
        </Stack>
      </InstitutionModalBody>
      {canRecord && t.status === 'RECRUITING' ? (
        <InstitutionModalFooter>
          <Button onClick={onClose} sx={{ textTransform: 'none' }}>Close</Button>
          <Button variant="contained" startIcon={<EnrolIcon />} disabled={!ready} onClick={() => onRecord(row, form)} sx={{ ...btn, bgcolor: PURPLE }}>Record</Button>
        </InstitutionModalFooter>
      ) : null}
    </InstitutionModal>
  );
}

/** Enrolment against plan for trials that are (or should be) recruiting. */
export function RecruitmentView({ audience = 'researcher' }) {
  const router = useRouter();
  const [trials, setTrials] = useTrials(audience);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [panel, setPanel] = useState(null);
  const [notice, setNotice] = useState('');
  const researcher = audience === 'researcher';
  const all = useMemo(() => recruitmentRows(trials), [trials]);
  const TABS = [
    { key: 'all', label: 'All', match: () => true },
    { key: 'behind', label: 'Behind or paused', match: (r) => ['BEHIND', 'PAUSED'].includes(r.pace) },
    { key: 'track', label: 'On track', match: (r) => ['ON_TRACK', 'AHEAD', 'COMPLETE'].includes(r.pace) },
    { key: 'not', label: 'Not started', match: (r) => r.pace === 'NOT_STARTED' },
  ];
  const counts = Object.fromEntries(TABS.map((t) => [t.key, all.filter(t.match).length]));
  const q = search.trim().toLowerCase();
  const filtered = all.filter((r) => TABS.find((t) => t.key === tab).match(r) && (!q || [r.trial.title, r.trial.shortTitle, r.trial.code, r.trial.pi].some((x) => String(x || '').toLowerCase().includes(q))));
  const paging = usePaging(filtered);
  const target = all.reduce((a, r) => a + r.target, 0);
  const enrolled = all.reduce((a, r) => a + r.enrolled, 0);
  const record = (row, form) => {
    const n = Number(form.enrolled);
    setTrials((list) => list.map((t) => (t.id !== row.trial.id ? t : {
      ...t,
      enrolled: (t.enrolled || 0) + n,
      sites: (t.sites || []).map((s) => (s.name === form.site ? { ...s, enrolled: (s.enrolled || 0) + n } : s)),
    })));
    setSelected(null);
    setNotice(`${n} participant${n === 1 ? '' : 's'} recorded for "${row.trial.shortTitle}" at ${form.site}.`);
  };
  const current = selected ? all.find((r) => r.trial.id === selected) : null;
  return (
    <>
      {notice ? <Alert severity="success" onClose={() => setNotice('')} sx={{ mb: 2, borderRadius: 2 }}>{notice}</Alert> : null}
      <StatCards cards={[
        { label: 'Enrolled', value: enrolled.toLocaleString(), sub: `of ${target.toLocaleString()} (${target ? Math.round((enrolled / target) * 100) : 0}%)`, icon: <RecruitIcon /> },
        { label: 'Recruiting', value: all.filter((r) => r.trial.status === 'RECRUITING').length, sub: 'Trials open to enrolment', icon: <EnrolIcon /> },
        { label: 'Behind or paused', value: counts.behind, sub: 'More than 20 points behind plan', icon: <BehindIcon /> },
        { label: 'On track', value: counts.track, sub: 'In line with or ahead of plan', icon: <OkIcon /> },
      ]} />
      <FilterBar search={search} onSearchChange={(v) => { setSearch(v); paging.reset(); }} searchPlaceholder="Search by trial, code or PI" onClear={() => { setSearch(''); setTab('all'); paging.reset(); }} />
      <TablePaper>
        <CountTabs tabs={TABS} value={tab} onChange={(v) => { setTab(v); paging.reset(); }} counts={counts} alertKeys={['behind']} />
        <TableContainer>
          <Table>
            <PurpleTableHead columns={['Trial', 'Pace', 'Enrolment vs plan', 'Sites', 'Needed / month', { label: 'Actions', align: 'center' }]} />
            <TableBody>
              {paging.rows.map((r, i) => (
                <TableRow key={r.trial.id} sx={zebraRowSx(i)}>
                  <TableCell sx={{ maxWidth: 340 }}><TrialCell trial={r.trial} onOpen={setPanel} /></TableCell>
                  <TableCell><StatusPill label={PACE[r.pace].label} tone={PACE[r.pace].tone} /></TableCell>
                  <TableCell><EnrolmentBar trial={r.trial} width={170} /></TableCell>
                  <TableCell>{r.trial.sites?.length || '—'}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: r.pace === 'BEHIND' ? '#b91c1c' : 'inherit' }}>{r.perMonth ?? '—'}</TableCell>
                  <TableCell align="center">
                    <RowActions reserveMenuSpace={false} actions={[
                      { key: 'open', label: 'Recruitment details', icon: <ViewIcon fontSize="small" />, onClick: () => setSelected(r.trial.id) },
                      ...(researcher && r.trial.status === 'RECRUITING' ? [{ key: 'rec', label: 'Record enrolment', icon: <EnrolIcon fontSize="small" />, onClick: () => setSelected(r.trial.id) }] : []),
                    ]} />
                  </TableCell>
                </TableRow>
              ))}
              {!paging.rows.length ? <TableRow><TableCell colSpan={6} sx={{ py: 6, textAlign: 'center' }}><Typography variant="body2" color="text.secondary">{tab === 'behind' ? 'No trial is behind plan.' : 'No trials here.'}</Typography></TableCell></TableRow> : null}
            </TableBody>
          </Table>
        </TableContainer>
        {paging.pager}
      </TablePaper>
      <RecruitmentPanel open={Boolean(current)} row={current} onClose={() => setSelected(null)} canRecord={researcher} onRecord={record} />
      <TrialPanel trial={panel} open={Boolean(panel)} onClose={() => setPanel(null)} audience={audience} onNavigate={(href) => router.push(href)} />
    </>
  );
}

// ---------------------------------------------------------------------------------- //
// Safety events & deviations

const SEVERITIES = { SAE: ['Serious', 'Life-threatening', 'Fatal'], DEVIATION: ['Minor', 'Major'] };
const RELATEDNESS = ['Not related', 'Unlikely related', 'Possibly related', 'Probably related', 'Definitely related'];

function ReportEventPanel({ open, type, trials, onClose, onSave }) {
  const empty = { trialId: '', title: '', participant: '', site: '', onset: today(), awareOn: today(), severity: '', related: '', expected: false, capa: '' };
  const [form, setForm] = useState(empty);
  React.useEffect(() => { if (open) setForm({ ...empty, severity: type === 'SAE' ? 'Serious' : 'Minor' }); }, [open, type]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const trial = trials.find((t) => t.id === form.trialId);
  const due = eventDeadline({ type, severity: form.severity, awareOn: form.awareOn });
  const ready = form.trialId && form.title.trim() && form.onset && form.awareOn && form.awareOn >= form.onset && (type !== 'SAE' || form.related);
  const sae = type === 'SAE';
  return (
    <InstitutionModal open={open} onClose={onClose} variant="panel" maxWidth="sm">
      <InstitutionModalHeader icon={sae ? SafetyIcon : DeviationIcon} tone={sae ? 'danger' : 'primary'} title={sae ? 'Report a serious adverse event' : 'Log a protocol deviation'} subtitle={sae ? 'Report to the ethics committee and regulator within 7 days (fatal / life-threatening) or 15 days' : 'Major deviations are reported within 7 days'} onClose={onClose} />
      <InstitutionModalBody>
        {preview}
        <Stack spacing={2}>
          <TextField select size="small" label="Trial" required value={form.trialId} onChange={(e) => setForm((f) => ({ ...f, trialId: e.target.value, site: '' }))}>
            {trialOptions(trials).filter((t) => ['RECRUITING', 'FOLLOW_UP', 'SUSPENDED'].includes(t.status)).map((t) => <MenuItem key={t.id} value={t.id}>{t.shortTitle} ({t.code})</MenuItem>)}
          </TextField>
          <TextField size="small" label={sae ? 'Event (diagnosis or main sign)' : 'What happened'} required value={form.title} onChange={set('title')} multiline minRows={sae ? 1 : 2} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField size="small" fullWidth label="Participant ID" value={form.participant} onChange={set('participant')} placeholder="e.g. KIS-0042" helperText="Study ID only, never names" />
            <TextField select size="small" fullWidth label="Site" value={form.site} onChange={set('site')} disabled={!trial}>
              {(trial?.sites?.length ? trial.sites : [{ name: 'Main site' }]).map((s) => <MenuItem key={s.name} value={s.name}>{s.name}</MenuItem>)}
            </TextField>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField size="small" fullWidth type="date" label={sae ? 'Onset' : 'Occurred on'} InputLabelProps={{ shrink: true }} value={form.onset} onChange={set('onset')} inputProps={{ max: today() }} />
            <TextField size="small" fullWidth type="date" label="Team became aware" InputLabelProps={{ shrink: true }} value={form.awareOn} onChange={set('awareOn')} inputProps={{ max: today() }} error={form.awareOn < form.onset} helperText={form.awareOn < form.onset ? 'Must be on or after the onset' : ' '} />
          </Stack>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>Severity</Typography>
            <RadioGroup row value={form.severity} onChange={set('severity')}>
              {SEVERITIES[type].map((s) => <FormControlLabel key={s} value={s} control={<Radio size="small" />} label={s} />)}
            </RadioGroup>
          </Box>
          {sae ? (
            <>
              <TextField select size="small" label="Relationship to the study product" required value={form.related} onChange={set('related')}>
                {RELATEDNESS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </TextField>
              <FormControlLabel control={<Switch checked={form.expected} onChange={(e) => setForm((f) => ({ ...f, expected: e.target.checked }))} />} label="Expected (listed in the investigator's brochure)" />
            </>
          ) : (
            <TextField size="small" label="Corrective / preventive action" value={form.capa} onChange={set('capa')} multiline minRows={2} />
          )}
          {due ? <Alert severity="warning" sx={{ py: 0 }}>Report by <b>{fmt(due)}</b>.</Alert> : null}
          {sae && form.related && !form.expected && form.related !== 'Not related' && form.related !== 'Unlikely related' ? <Alert severity="error" sx={{ py: 0 }}>Related and unexpected: this is a suspected SUSAR. Notify the sponsor immediately.</Alert> : null}
        </Stack>
      </InstitutionModalBody>
      <InstitutionModalFooter>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button variant="contained" color={sae ? 'error' : 'primary'} disabled={!ready} onClick={() => onSave(type, form)} sx={{ ...btn, ...(sae ? {} : { bgcolor: PURPLE }) }}>{sae ? 'Report SAE' : 'Log deviation'}</Button>
      </InstitutionModalFooter>
    </InstitutionModal>
  );
}

function EventPanel({ open, ev, canAct, onClose, onAction }) {
  if (!ev) return null;
  const m = EVENT_STATE[ev.state];
  return (
    <InstitutionModal open={open} onClose={onClose} variant="panel" maxWidth="sm">
      <InstitutionModalHeader icon={ev.type === 'SAE' ? SafetyIcon : DeviationIcon} tone={ev.type === 'SAE' ? 'danger' : 'primary'} title={ev.title} subtitle={`${ev.type === 'SAE' ? 'Serious adverse event' : 'Protocol deviation'} · ${ev.trial.shortTitle}`} onClose={onClose} />
      <InstitutionModalBody>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1}><StatusPill label={m.label} tone={m.tone} /><StatusPill label={ev.severity} tone={['Fatal', 'Life-threatening', 'Major'].includes(ev.severity) ? 'danger' : 'warning'} dot={false} /></Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            {[['Participant', ev.participant], ['Site', ev.site], ['Onset', fmt(ev.onset)], ['Team aware', fmt(ev.awareOn)], ['Report by', ev.deadline ? fmt(ev.deadline) : 'Log only'], ['Reported', ev.reportedOn ? fmt(ev.reportedOn) : '—'], ...(ev.type === 'SAE' ? [['Relationship', ev.related], ['Expected', ev.expected ? 'Yes' : 'No']] : [])].map(([k, v]) => (
              <Box key={k}><Typography variant="caption" color="text.secondary">{k}</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>{v || '—'}</Typography></Box>
            ))}
          </Box>
          {ev.capa ? <Alert severity="info" sx={{ py: 0 }}>Corrective action: {ev.capa}</Alert> : null}
        </Stack>
      </InstitutionModalBody>
      {canAct && ev.state !== 'CLOSED' ? (
        <InstitutionModalFooter>
          {ev.state !== 'REPORTED' && ev.deadline ? <Button variant="contained" onClick={() => onAction(ev, 'REPORTED')} sx={{ ...btn, bgcolor: PURPLE }}>Mark as reported</Button> : null}
          <Button onClick={() => onAction(ev, 'CLOSED')} sx={{ ...btn, color: PURPLE }}>Close event</Button>
        </InstitutionModalFooter>
      ) : null}
    </InstitutionModal>
  );
}

/** SAEs and protocol deviations across trials, by reporting urgency. */
export function SafetyView({ audience = 'researcher' }) {
  const router = useRouter();
  const [trials, setTrials] = useTrials(audience);
  const [tab, setTab] = useState('report');
  const [type, setType] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [reporting, setReporting] = useState(null);
  const [panel, setPanel] = useState(null);
  const [notice, setNotice] = useState('');
  const researcher = audience === 'researcher';
  const all = useMemo(() => eventRows(trials), [trials]);
  const TABS = [
    { key: 'report', label: 'To report', match: (e) => ['OVERDUE', 'DUE_SOON', 'TO_REPORT'].includes(e.state) },
    { key: 'open', label: 'Open', match: (e) => e.state !== 'CLOSED' },
    { key: 'closed', label: 'Closed', match: (e) => e.state === 'CLOSED' },
    { key: 'all', label: 'All', match: () => true },
  ];
  const counts = Object.fromEntries(TABS.map((t) => [t.key, all.filter(t.match).length]));
  const q = search.trim().toLowerCase();
  const filtered = all.filter((e) => TABS.find((t) => t.key === tab).match(e) && (type === 'all' || e.type === type)
    && (!q || [e.title, e.participant, e.site, e.trial.shortTitle, e.trial.code].some((x) => String(x || '').toLowerCase().includes(q))));
  const paging = usePaging(filtered);
  const save = (kind, form) => {
    const ev = { id: `ev-${Date.now()}`, type: kind, title: form.title.trim(), participant: form.participant || '—', site: form.site || null, onset: form.onset, awareOn: form.awareOn, severity: form.severity, related: form.related || null, expected: form.expected, capa: form.capa || null, status: 'OPEN' };
    setTrials((list) => list.map((t) => (t.id === form.trialId ? { ...t, events: [...(t.events || []), ev] } : t)));
    setReporting(null);
    setTab('report');
    setNotice(kind === 'SAE' ? `SAE recorded. Report it by ${fmt(eventDeadline(ev))}.` : 'Deviation logged.');
  };
  const act = (ev, status) => {
    setTrials((list) => list.map((t) => (t.id !== ev.trial.id ? t : { ...t, events: t.events.map((e) => (e.id === ev.id ? { ...e, status, ...(status === 'REPORTED' ? { reportedOn: today() } : {}) } : e)) })));
    setSelected(null);
    setNotice(status === 'REPORTED' ? 'Marked as reported.' : 'Event closed.');
  };
  const current = selected ? all.find((e) => e.id === selected) : null;
  return (
    <>
      {notice ? <Alert severity="success" onClose={() => setNotice('')} sx={{ mb: 2, borderRadius: 2 }}>{notice}</Alert> : null}
      <StatCards cards={[
        { label: 'Reports overdue', value: all.filter((e) => e.state === 'OVERDUE').length, sub: 'Past the 7 / 15-day deadline', icon: <AlertIcon /> },
        { label: 'To report', value: counts.report, sub: `${all.filter((e) => e.state === 'DUE_SOON').length} due within 3 days`, icon: <PendingIcon /> },
        { label: 'Open SAEs', value: all.filter((e) => e.type === 'SAE' && e.state !== 'CLOSED').length, sub: 'Not yet closed', icon: <SafetyIcon /> },
        { label: 'Open deviations', value: all.filter((e) => e.type === 'DEVIATION' && e.state !== 'CLOSED').length, sub: `${all.filter((e) => e.type === 'DEVIATION' && e.severity === 'Major' && e.state !== 'CLOSED').length} major`, icon: <DeviationIcon /> },
      ]} />
      <FilterBar search={search} onSearchChange={(v) => { setSearch(v); paging.reset(); }} searchPlaceholder="Search by event, participant ID, site or trial" onClear={() => { setSearch(''); setType('all'); setTab('report'); paging.reset(); }}>
        <TextField select className="filter-control" label="Type" value={type} onChange={(e) => { setType(e.target.value); paging.reset(); }} sx={filterFieldSx}>
          <MenuItem value="all">SAEs and deviations</MenuItem>
          <MenuItem value="SAE">Serious adverse events</MenuItem>
          <MenuItem value="DEVIATION">Protocol deviations</MenuItem>
        </TextField>
        {researcher ? (
          <Stack direction="row" spacing={1}>
            <Button variant="contained" color="error" startIcon={<SafetyIcon />} onClick={() => setReporting('SAE')} sx={{ ...btn, boxShadow: 'none', whiteSpace: 'nowrap', height: 40 }}>Report SAE</Button>
            <Button variant="outlined" startIcon={<DeviationIcon />} onClick={() => setReporting('DEVIATION')} sx={{ ...btn, color: PURPLE, borderColor: PURPLE, whiteSpace: 'nowrap', height: 40 }}>Log deviation</Button>
          </Stack>
        ) : null}
      </FilterBar>
      <TablePaper>
        <CountTabs tabs={TABS} value={tab} onChange={(v) => { setTab(v); paging.reset(); }} counts={counts} alertKeys={['report']} />
        <TableContainer>
          <Table>
            <PurpleTableHead columns={['Event', 'Trial', 'Severity', 'Status', 'Report by', { label: 'Actions', align: 'center' }]} />
            <TableBody>
              {paging.rows.map((e, i) => {
                const m = EVENT_STATE[e.state];
                return (
                  <TableRow key={e.id} sx={zebraRowSx(i)}>
                    <TableCell sx={{ maxWidth: 340 }}>
                      <Typography variant="body2" onClick={() => setSelected(e.id)} sx={{ fontWeight: 700, cursor: 'pointer', '&:hover': { color: PURPLE, textDecoration: 'underline' } }}>{e.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{e.type === 'SAE' ? 'SAE' : 'Deviation'} · {e.participant} · {fmt(e.onset)}</Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 240 }}><TrialCell trial={e.trial} onOpen={setPanel} /></TableCell>
                    <TableCell><StatusPill label={e.severity} tone={['Fatal', 'Life-threatening', 'Major'].includes(e.severity) ? 'danger' : 'warning'} dot={false} /></TableCell>
                    <TableCell><StatusPill label={m.label} tone={m.tone} /></TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {e.deadline ? <><Typography variant="body2">{fmt(e.deadline)}</Typography>{['OVERDUE', 'DUE_SOON', 'TO_REPORT'].includes(e.state) ? <Typography variant="caption" sx={{ color: e.daysLeft < 0 ? '#b91c1c' : e.daysLeft <= 3 ? '#b45309' : '#64748b' }}>{e.daysLeft < 0 ? `${-e.daysLeft} days late` : e.daysLeft === 0 ? 'today' : `in ${e.daysLeft} days`}</Typography> : null}</> : <Typography variant="caption" color="text.secondary">Log only</Typography>}
                    </TableCell>
                    <TableCell align="center"><RowActions reserveMenuSpace={false} actions={[{ key: 'open', label: 'Open event', icon: <ViewIcon fontSize="small" />, onClick: () => setSelected(e.id) }]} /></TableCell>
                  </TableRow>
                );
              })}
              {!paging.rows.length ? <TableRow><TableCell colSpan={6} sx={{ py: 6, textAlign: 'center' }}><Typography variant="body2" color="text.secondary">{tab === 'report' ? 'Nothing waiting to be reported.' : 'No events here.'}</Typography></TableCell></TableRow> : null}
            </TableBody>
          </Table>
        </TableContainer>
        {paging.pager}
      </TablePaper>
      <EventPanel open={Boolean(current)} ev={current} canAct={researcher} onClose={() => setSelected(null)} onAction={act} />
      {researcher ? <ReportEventPanel open={Boolean(reporting)} type={reporting || 'SAE'} trials={trials} onClose={() => setReporting(null)} onSave={save} /> : null}
      <TrialPanel trial={panel} open={Boolean(panel)} onClose={() => setPanel(null)} audience={audience} onNavigate={(href) => router.push(href)} />
    </>
  );
}

// ---------------------------------------------------------------------------------- //
// Compliance flags (research office)

/** Every open issue across trials, most urgent first, grouped by severity tabs. */
export function ComplianceView() {
  const router = useRouter();
  const [trials] = useTrials('institution');
  const [tab, setTab] = useState('high');
  const [panel, setPanel] = useState(null);
  const all = useMemo(() => complianceRows(trials), [trials]);
  const TABS = [
    { key: 'high', label: 'Urgent', match: (f) => f.severity === 'high' },
    { key: 'medium', label: 'Soon', match: (f) => f.severity === 'medium' },
    { key: 'low', label: 'When you can', match: (f) => f.severity === 'low' },
    { key: 'all', label: 'All', match: () => true },
  ];
  const counts = Object.fromEntries(TABS.map((t) => [t.key, all.filter(t.match).length]));
  const rows = all.filter(TABS.find((t) => t.key === tab).match);
  const byTrial = rows.reduce((m, f) => m.set(f.trial.id, [...(m.get(f.trial.id) || []), f]), new Map());
  return (
    <>
      <StatCards cards={[
        { label: 'Open issues', value: all.length, sub: `${new Set(all.map((f) => f.trial.id)).size} trials affected`, icon: <AlertIcon /> },
        { label: 'Urgent', value: counts.high, sub: 'Overdue reports, expired approvals, unregistered', icon: <SafetyIcon /> },
        { label: 'Soon', value: counts.medium, sub: 'Expiring approvals, deviations, GCP', icon: <PendingIcon /> },
        { label: 'Trials without issues', value: trials.filter((t) => !all.some((f) => f.trial.id === t.id)).length, sub: 'Open and closed', icon: <OkIcon /> },
      ]} />
      <TablePaper>
        <CountTabs tabs={TABS} value={tab} onChange={setTab} counts={counts} alertKeys={['high']} />
        <Stack spacing={1.5} sx={{ p: 2 }}>
          {[...byTrial.entries()].map(([id, flags]) => (
            <Box key={id} sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'white' }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}><TrialCell trial={flags[0].trial} onOpen={setPanel} /></Box>
                <TrialStatusPill status={flags[0].trial.status} />
              </Stack>
              <FlagList flags={flags} />
            </Box>
          ))}
          {!rows.length ? <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No issues at this level.</Typography> : null}
        </Stack>
      </TablePaper>
      <TrialPanel trial={panel} open={Boolean(panel)} onClose={() => setPanel(null)} audience="institution" onNavigate={(href) => router.push(href)} />
    </>
  );
}
