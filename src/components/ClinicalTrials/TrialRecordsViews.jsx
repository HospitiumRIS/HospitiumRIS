'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Chip,
  Link,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import {
  AddLink as LinkIcon,
  Article as PublicationIcon,
  CheckCircle as OkIcon,
  Description as DocIcon,
  ErrorOutline as AlertIcon,
  HourglassTop as PendingIcon,
  Insights as ResultsIcon,
  Storage as DatasetIcon,
  UploadFile as UploadIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from 'recharts';
import RowActions from '@/components/common/RowActions';
import StatusPill from '@/components/common/StatusPill';
import { FilterBar, PurpleTableHead, StatCards, TablePaper, filterFieldSx, zebraRowSx } from '@/components/common/ListPage';
import { InstitutionModal, InstitutionModalBody, InstitutionModalFooter, InstitutionModalHeader, InstitutionModalSection } from '@/components/GlobalAdmin/InstitutionModalShell';
import { DOC_STATUS, DOC_TYPES, OUTPUT_TYPES, PACE, SAMPLE_OUTPUTS, TRIAL_STATUS, complianceRows, documentState, enrolment, eventRows, portfolioSummary, recruitmentRows, resultsRows, sampleDocuments } from '@/lib/clinical-trials';
import { PURPLE, TrialPanel, fmt } from './TrialUI';
import { CountTabs, TrialCell, usePaging, useTrials } from './TrialOversightViews';

const btn = { textTransform: 'none', fontWeight: 700 };
const preview = <Alert severity="info" sx={{ mb: 2 }}>Clinical trials are in preview: changes are kept for this session only.</Alert>;
const OUT_ICON = { Publication: PublicationIcon, Dataset: DatasetIcon };
const outHref = (o) => (o.doi ? `https://doi.org/${o.doi}` : o.url || null);

// ---------------------------------------------------------------------------------- //
// Results & outputs

function OutputsPanel({ open, row, canLink, onClose, onLink }) {
  const [form, setForm] = useState({ type: 'Publication', title: '', venue: '', date: '', doi: '' });
  React.useEffect(() => { if (open) setForm({ type: 'Publication', title: '', venue: '', date: '', doi: '' }); }, [open]);
  if (!row) return null;
  const doi = form.doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
  const looksUrl = /^https?:\/\//i.test(doi);
  const doiOk = !doi || /^10\.\d{4,9}\/\S+$/.test(doi) || looksUrl;
  const ready = form.title.trim() && doiOk;
  return (
    <InstitutionModal open={open} onClose={onClose} variant="panel" maxWidth="sm">
      <InstitutionModalHeader icon={ResultsIcon} title={row.trial.shortTitle} subtitle={`${row.trial.code} · results and outputs`} onClose={onClose} />
      <InstitutionModalBody>
        <Stack spacing={2.5}>
          <Stack direction="row" spacing={1}><StatusPill label={row.next} tone={row.tone} dot={false} /></Stack>
          <InstitutionModalSection title={`Outputs (${row.outputs.length})`}>
            <Stack spacing={1}>
              {row.outputs.map((o) => {
                const Icon = OUT_ICON[o.type] || ResultsIcon;
                const href = outHref(o);
                return (
                  <Stack key={o.id} direction="row" spacing={1.25} alignItems="flex-start" sx={{ p: 1.25, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                    <Icon sx={{ color: PURPLE, mt: 0.25 }} />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      {href ? <Link href={href} target="_blank" rel="noopener noreferrer" underline="hover" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.875rem' }}>{o.title}</Link> : <Typography variant="body2" sx={{ fontWeight: 700 }}>{o.title}</Typography>}
                      <Typography variant="caption" color="text.secondary" component="div">{[o.type, o.venue, fmt(o.date), o.doi ? `DOI ${o.doi}` : null].filter(Boolean).join(' · ')}</Typography>
                    </Box>
                  </Stack>
                );
              })}
              {!row.outputs.length ? <Typography variant="body2" color="text.secondary">No outputs linked yet.</Typography> : null}
            </Stack>
          </InstitutionModalSection>
          {canLink ? (
            <InstitutionModalSection title="Link an output">
              {preview}
              <Stack spacing={1.5}>
                <TextField select size="small" label="Type" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                  {OUTPUT_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
                <TextField size="small" label="Title" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <TextField size="small" fullWidth label="Journal, repository or event" value={form.venue} onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))} />
                  <TextField size="small" type="date" label="Date" InputLabelProps={{ shrink: true }} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
                </Stack>
                <TextField size="small" label="DOI or link" value={form.doi} onChange={(e) => setForm((f) => ({ ...f, doi: e.target.value }))} placeholder="10.xxxx/… or https://…" error={!doiOk} helperText={!doiOk ? 'Enter a DOI (10.xxxx/…) or a full link' : ' '} />
              </Stack>
            </InstitutionModalSection>
          ) : null}
        </Stack>
      </InstitutionModalBody>
      {canLink ? (
        <InstitutionModalFooter>
          <Button onClick={onClose} sx={{ textTransform: 'none' }}>Close</Button>
          <Button variant="contained" startIcon={<LinkIcon />} disabled={!ready} onClick={() => onLink(row, { ...form, doi: looksUrl ? null : doi || null, url: looksUrl ? doi : null })} sx={{ ...btn, bgcolor: PURPLE }}>Link output</Button>
        </InstitutionModalFooter>
      ) : null}
    </InstitutionModal>
  );
}

/** What each trial has produced, and the results still owed. */
export function ResultsView({ audience = 'researcher' }) {
  const router = useRouter();
  const [trials] = useTrials(audience);
  const [outputs, setOutputs] = useState(SAMPLE_OUTPUTS);
  const [tab, setTab] = useState('owed');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [panel, setPanel] = useState(null);
  const [notice, setNotice] = useState('');
  const researcher = audience === 'researcher';
  const all = useMemo(() => resultsRows(trials, outputs), [trials, outputs]);
  const TABS = [
    { key: 'owed', label: 'Results owed', match: (r) => ['danger', 'warning'].includes(r.tone) },
    { key: 'closed', label: 'Closed trials', match: (r) => r.closed },
    { key: 'running', label: 'Running trials', match: (r) => !r.closed },
    { key: 'all', label: 'All', match: () => true },
  ];
  const counts = Object.fromEntries(TABS.map((t) => [t.key, all.filter(t.match).length]));
  const q = search.trim().toLowerCase();
  const filtered = all.filter((r) => TABS.find((t) => t.key === tab).match(r) && (!q || [r.trial.title, r.trial.shortTitle, r.trial.code, r.trial.pi, ...r.outputs.map((o) => o.title)].some((x) => String(x || '').toLowerCase().includes(q))));
  const paging = usePaging(filtered);
  const mineOutputs = outputs.filter((o) => trials.some((t) => t.id === o.trialId));
  const link = (row, form) => {
    setOutputs((list) => [...list, { id: `out-${Date.now()}`, trialId: row.trial.id, type: form.type, title: form.title.trim(), venue: form.venue || null, date: form.date || null, doi: form.doi, url: form.url }]);
    setNotice(`${form.type} linked to "${row.trial.shortTitle}".`);
  };
  const current = selected ? all.find((r) => r.id === selected) : null;
  return (
    <>
      {notice ? <Alert severity="success" onClose={() => setNotice('')} sx={{ mb: 2, borderRadius: 2 }}>{notice}</Alert> : null}
      <StatCards cards={[
        { label: 'Outputs', value: mineOutputs.length, sub: 'Linked to trials', icon: <ResultsIcon /> },
        { label: 'Publications', value: mineOutputs.filter((o) => o.type === 'Publication').length, sub: `${mineOutputs.filter((o) => o.type === 'Dataset').length} datasets shared`, icon: <PublicationIcon /> },
        { label: 'Results owed', value: counts.owed, sub: 'Registry results or main paper', icon: <AlertIcon /> },
        { label: 'Closed and reported', value: all.filter((r) => r.closed && r.tone === 'success').length, sub: `of ${counts.closed} closed trials`, icon: <OkIcon /> },
      ]} />
      <FilterBar search={search} onSearchChange={(v) => { setSearch(v); paging.reset(); }} searchPlaceholder="Search by trial or output title" onClear={() => { setSearch(''); setTab('owed'); paging.reset(); }} />
      <TablePaper>
        <CountTabs tabs={TABS} value={tab} onChange={(v) => { setTab(v); paging.reset(); }} counts={counts} alertKeys={['owed']} />
        <TableContainer>
          <Table>
            <PurpleTableHead columns={['Trial', 'Trial status', 'Outputs', 'Next step', { label: 'Actions', align: 'center' }]} />
            <TableBody>
              {paging.rows.map((r, i) => (
                <TableRow key={r.id} sx={zebraRowSx(i)}>
                  <TableCell sx={{ maxWidth: 340 }}><TrialCell trial={r.trial} onOpen={setPanel} /></TableCell>
                  <TableCell><StatusPill label={TRIAL_STATUS[r.trial.status].label} tone={TRIAL_STATUS[r.trial.status].tone} /></TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {r.publications ? <Chip size="small" icon={<PublicationIcon />} label={r.publications} sx={{ height: 22, fontWeight: 700, bgcolor: alpha(PURPLE, 0.08), color: PURPLE, '& .MuiChip-icon': { color: PURPLE, fontSize: 15 } }} /> : null}
                      {r.datasets ? <Chip size="small" icon={<DatasetIcon />} label={r.datasets} sx={{ height: 22, fontWeight: 700, bgcolor: '#ccfbf1', color: '#0f766e', '& .MuiChip-icon': { color: '#0f766e', fontSize: 15 } }} /> : null}
                      {r.outputs.length - r.publications - r.datasets > 0 ? <Chip size="small" label={`+${r.outputs.length - r.publications - r.datasets} other`} sx={{ height: 22 }} /> : null}
                      {!r.outputs.length ? <Typography variant="caption" color="text.secondary">None yet</Typography> : null}
                    </Stack>
                  </TableCell>
                  <TableCell><StatusPill label={r.next} tone={r.tone} dot={false} /></TableCell>
                  <TableCell align="center">
                    <RowActions reserveMenuSpace={false} actions={[
                      { key: 'open', label: 'Outputs', icon: <ViewIcon fontSize="small" />, onClick: () => setSelected(r.id) },
                      ...(researcher ? [{ key: 'link', label: 'Link an output', icon: <LinkIcon fontSize="small" />, onClick: () => setSelected(r.id) }] : []),
                    ]} />
                  </TableCell>
                </TableRow>
              ))}
              {!paging.rows.length ? <TableRow><TableCell colSpan={5} sx={{ py: 6, textAlign: 'center' }}><Typography variant="body2" color="text.secondary">{tab === 'owed' ? 'No results are owed.' : 'No trials here.'}</Typography></TableCell></TableRow> : null}
            </TableBody>
          </Table>
        </TableContainer>
        {paging.pager}
      </TablePaper>
      <OutputsPanel open={Boolean(current)} row={current} canLink={researcher} onClose={() => setSelected(null)} onLink={link} />
      <TrialPanel trial={panel} open={Boolean(panel)} onClose={() => setPanel(null)} audience={audience} onNavigate={(href) => router.push(href)} />
    </>
  );
}

// ---------------------------------------------------------------------------------- //
// Documents (trial master file)

function UploadDocPanel({ open, trials, onClose, onSave }) {
  const [form, setForm] = useState({ trialId: '', type: '', version: '', file: null });
  React.useEffect(() => { if (open) setForm({ trialId: '', type: '', version: '', file: null }); }, [open]);
  const ready = form.trialId && form.type && form.version.trim() && form.file;
  return (
    <InstitutionModal open={open} onClose={onClose} variant="panel" maxWidth="sm">
      <InstitutionModalHeader icon={UploadIcon} title="Add a document" subtitle="New versions of protocols and consent forms go for approval first" onClose={onClose} />
      <InstitutionModalBody>
        {preview}
        <Stack spacing={2}>
          <TextField select size="small" label="Trial" required value={form.trialId} onChange={(e) => setForm((f) => ({ ...f, trialId: e.target.value }))}>
            {trials.filter((t) => TRIAL_STATUS[t.status]?.open).map((t) => <MenuItem key={t.id} value={t.id}>{t.shortTitle} ({t.code})</MenuItem>)}
          </TextField>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField select size="small" fullWidth label="Document type" required value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              {DOC_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField size="small" label="Version" required value={form.version} onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))} placeholder="e.g. 3.1" sx={{ width: { sm: 140 } }} />
          </Stack>
          <Button component="label" variant="outlined" startIcon={<UploadIcon />} sx={{ ...btn, borderStyle: 'dashed', py: 1.5, color: PURPLE, borderColor: alpha(PURPLE, 0.5) }}>
            {form.file ? form.file.name : 'Choose file (PDF or Word)'}
            <input hidden type="file" accept=".pdf,.doc,.docx" onChange={(e) => setForm((f) => ({ ...f, file: e.target.files?.[0] || null }))} />
          </Button>
        </Stack>
      </InstitutionModalBody>
      <InstitutionModalFooter>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button variant="contained" disabled={!ready} onClick={() => onSave(form)} sx={{ ...btn, bgcolor: PURPLE }}>Add document</Button>
      </InstitutionModalFooter>
    </InstitutionModal>
  );
}

/** Trial master file: current, awaiting approval and superseded versions. */
export function DocumentsView({ audience = 'researcher' }) {
  const router = useRouter();
  const [trials] = useTrials(audience);
  const [docs, setDocs] = useState(() => sampleDocuments(trials));
  const [tab, setTab] = useState('current');
  const [type, setType] = useState('all');
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [panel, setPanel] = useState(null);
  const [notice, setNotice] = useState('');
  const researcher = audience === 'researcher';
  const rows = useMemo(() => docs.map((d) => ({ ...d, state: documentState(d) })), [docs]);
  const TABS = [
    { key: 'current', label: 'Current', match: (d) => d.state === 'CURRENT' },
    { key: 'awaiting', label: 'Awaiting approval', match: (d) => d.state === 'AWAITING_APPROVAL' },
    { key: 'expired', label: 'Expired', match: (d) => d.state === 'EXPIRED' },
    { key: 'superseded', label: 'Superseded', match: (d) => d.state === 'SUPERSEDED' },
    { key: 'all', label: 'All', match: () => true },
  ];
  const counts = Object.fromEntries(TABS.map((t) => [t.key, rows.filter(t.match).length]));
  const q = search.trim().toLowerCase();
  const filtered = rows.filter((d) => TABS.find((t) => t.key === tab).match(d) && (type === 'all' || d.type === type) && (!q || [d.name, d.type, d.trial.shortTitle, d.trial.code].some((x) => String(x || '').toLowerCase().includes(q))));
  const paging = usePaging(filtered);
  const add = (form) => {
    const trial = trials.find((t) => t.id === form.trialId);
    const needsApproval = ['Protocol', 'Informed consent form', 'Participant information sheet'].includes(form.type);
    setDocs((list) => [{ id: `doc-${Date.now()}`, trialId: trial.id, trial, type: form.type, name: form.file.name, version: form.version.trim(), status: needsApproval ? 'AWAITING_APPROVAL' : 'CURRENT', date: new Date().toISOString().slice(0, 10) }, ...list]);
    setAdding(false);
    setTab(needsApproval ? 'awaiting' : 'current');
    setNotice(needsApproval ? `${form.type} v${form.version} added. It stays "awaiting approval" until the ethics committee approves it.` : `${form.type} added.`);
  };
  return (
    <>
      {notice ? <Alert severity="success" onClose={() => setNotice('')} sx={{ mb: 2, borderRadius: 2 }}>{notice}</Alert> : null}
      <StatCards cards={[
        { label: 'Current documents', value: counts.current, sub: `Across ${new Set(rows.map((d) => d.trialId)).size} trials`, icon: <DocIcon /> },
        { label: 'Awaiting approval', value: counts.awaiting, sub: 'New versions submitted', icon: <PendingIcon /> },
        { label: 'Expired', value: counts.expired, sub: 'Approval letters past their date', icon: <AlertIcon /> },
        { label: 'Superseded', value: counts.superseded, sub: 'Kept for the audit trail', icon: <OkIcon /> },
      ]} />
      <FilterBar search={search} onSearchChange={(v) => { setSearch(v); paging.reset(); }} searchPlaceholder="Search by document or trial" onClear={() => { setSearch(''); setType('all'); setTab('current'); paging.reset(); }}>
        <TextField select className="filter-control" label="Type" value={type} onChange={(e) => { setType(e.target.value); paging.reset(); }} sx={filterFieldSx}>
          <MenuItem value="all">All types</MenuItem>
          {DOC_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </TextField>
        {researcher ? <Button variant="contained" startIcon={<UploadIcon />} onClick={() => setAdding(true)} sx={{ ...btn, bgcolor: PURPLE, boxShadow: 'none', whiteSpace: 'nowrap', height: 40 }}>Add document</Button> : null}
      </FilterBar>
      <TablePaper>
        <CountTabs tabs={TABS} value={tab} onChange={(v) => { setTab(v); paging.reset(); }} counts={counts} alertKeys={['expired']} />
        <TableContainer>
          <Table>
            <PurpleTableHead columns={['Document', 'Trial', 'Version', 'Status', 'Date']} />
            <TableBody>
              {paging.rows.map((d, i) => {
                const m = DOC_STATUS[d.state];
                return (
                  <TableRow key={d.id} sx={zebraRowSx(i)}>
                    <TableCell>
                      <Stack direction="row" spacing={1.25} alignItems="center">
                        <DocIcon sx={{ color: PURPLE }} />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{d.type}</Typography>
                          <Typography variant="caption" color="text.secondary" noWrap component="div" sx={{ maxWidth: 320 }}>{d.name}{d.language ? ` · ${d.language}` : ''}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 260 }}><TrialCell trial={d.trial} onOpen={setPanel} /></TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>v{d.version}</TableCell>
                    <TableCell><StatusPill label={m.label} tone={m.tone} />{d.expiry ? <Typography variant="caption" color="text.secondary" component="div">valid until {fmt(d.expiry)}</Typography> : null}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmt(d.date)}</TableCell>
                  </TableRow>
                );
              })}
              {!paging.rows.length ? <TableRow><TableCell colSpan={5} sx={{ py: 6, textAlign: 'center' }}><Typography variant="body2" color="text.secondary">No documents here.</Typography></TableCell></TableRow> : null}
            </TableBody>
          </Table>
        </TableContainer>
        {paging.pager}
      </TablePaper>
      {researcher ? <UploadDocPanel open={adding} trials={trials} onClose={() => setAdding(false)} onSave={add} /> : null}
      <TrialPanel trial={panel} open={Boolean(panel)} onClose={() => setPanel(null)} audience={audience} onNavigate={(href) => router.push(href)} />
    </>
  );
}

// ---------------------------------------------------------------------------------- //
// Reports & analytics (research office)

function ChartCard({ title, subtitle, children }) {
  return (
    <Paper sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none', minWidth: 0 }}>
      <Typography sx={{ fontWeight: 800 }}>{title}</Typography>
      {subtitle ? <Typography variant="caption" color="text.secondary">{subtitle}</Typography> : null}
      <Box sx={{ mt: 2 }}>{children}</Box>
    </Paper>
  );
}

const TONE_COLOR = { success: '#10b981', info: '#3b82f6', progress: PURPLE, warning: '#f59e0b', danger: '#ef4444', neutral: '#94a3b8' };

/** Portfolio analytics: trials by status, enrolment vs target, issues and outputs. */
export function ReportsView() {
  const [trials] = useTrials('institution');
  const s = portfolioSummary(trials);
  const byStatus = Object.entries(TRIAL_STATUS).map(([k, m]) => ({ name: m.label, value: trials.filter((t) => t.status === k).length, color: TONE_COLOR[m.tone] })).filter((d) => d.value);
  const enrol = recruitmentRows(trials).filter((r) => r.target).map((r) => ({ name: r.trial.shortTitle, Enrolled: r.enrolled, Remaining: Math.max(0, r.target - r.enrolled), pace: r.pace }));
  const issues = complianceRows(trials).reduce((m, f) => m.set(f.key, (m.get(f.key) || 0) + 1), new Map());
  const LABELS = { sae_overdue: 'SAE report overdue', ethics_expired: 'Ethics expired', ethics_expiring: 'Ethics expiring', reg_expired: 'Regulatory expired', not_registered: 'Not registered', deviations: 'Open deviations', gcp: 'GCP missing / expired', slow: 'Recruitment behind' };
  const issueData = [...issues.entries()].map(([k, v]) => ({ name: LABELS[k] || k, value: v })).sort((a, b) => b.value - a.value);
  const events = eventRows(trials);
  const outputs = SAMPLE_OUTPUTS.filter((o) => trials.some((t) => t.id === o.trialId));
  return (
    <>
      <StatCards cards={[
        { label: 'Trials', value: s.total, sub: `${s.open} open · ${s.closed} closed`, icon: <ResultsIcon /> },
        { label: 'Enrolment', value: `${s.enrolledPct}%`, sub: `${s.enrolled.toLocaleString()} of ${s.target.toLocaleString()} in open trials`, icon: <OkIcon /> },
        { label: 'Trials with issues', value: s.flagged, sub: `${s.urgent} urgent`, icon: <AlertIcon /> },
        { label: 'Outputs', value: outputs.length, sub: `${outputs.filter((o) => o.type === 'Publication').length} publications`, icon: <PublicationIcon /> },
      ]} />
      <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' } }}>
        <ChartCard title="Trials by status" subtitle="Whole portfolio">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byStatus} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
              <ChartTooltip />
              <Bar dataKey="value" name="Trials" radius={[0, 4, 4, 0]}>{byStatus.map((d) => <Cell key={d.name} fill={d.color} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Enrolment against target" subtitle="Recruiting, follow-up and suspended trials">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={enrol} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
              <ChartTooltip formatter={(v, n, p) => [v.toLocaleString(), `${n}${n === 'Enrolled' ? ` (${PACE[p.payload.pace].label})` : ''}`]} />
              <Bar dataKey="Enrolled" stackId="a" fill={PURPLE} />
              <Bar dataKey="Remaining" stackId="a" fill="#e9e3f5" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Open issues by type" subtitle="From approvals, safety, registry, GCP and recruitment">
          {issueData.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={issueData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={170} tick={{ fontSize: 12 }} />
                <ChartTooltip />
                <Bar dataKey="value" name="Trials" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <Typography variant="body2" sx={{ color: '#166534' }}>No open issues.</Typography>}
        </ChartCard>
        <ChartCard title="Safety events" subtitle="SAEs and protocol deviations">
          <Stack spacing={1.25}>
            {[['SAEs', events.filter((e) => e.type === 'SAE')], ['Protocol deviations', events.filter((e) => e.type === 'DEVIATION')]].map(([label, list]) => (
              <Stack key={label} direction="row" spacing={2} alignItems="center" sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f8fafc' }}>
                <Typography sx={{ fontWeight: 700, flex: 1 }}>{label}</Typography>
                <StatusPill label={`${list.filter((e) => e.state === 'OVERDUE').length} overdue`} tone="danger" dot={false} />
                <StatusPill label={`${list.filter((e) => e.state !== 'CLOSED').length} open`} tone="warning" dot={false} />
                <StatusPill label={`${list.filter((e) => e.state === 'CLOSED').length} closed`} tone="neutral" dot={false} />
              </Stack>
            ))}
            <Typography variant="caption" color="text.secondary">Enrolment figures: {enrolment({ targetEnrollment: s.target, enrolled: s.enrolled }).pct}% of target across open trials.</Typography>
          </Stack>
        </ChartCard>
      </Box>
    </>
  );
}
