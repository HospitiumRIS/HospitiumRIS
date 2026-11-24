'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  AddCircleOutline as RegisterIcon,
  CloudDownload as FetchIcon,
  Search as SearchIcon,
  ErrorOutline as HighIcon,
  OpenInNew as OpenIcon,
  ReportProblemOutlined as MediumIcon,
  InfoOutlined as LowIcon,
  Science as TrialIcon,
} from '@mui/icons-material';
import StatusPill from '@/components/common/StatusPill';
import { InstitutionModal, InstitutionModalBody, InstitutionModalFooter, InstitutionModalHeader, InstitutionModalSection } from '@/components/GlobalAdmin/InstitutionModalShell';
import { APPROVAL_STATUS, PHASES, REGISTRY_STATUS, SAMPLE_REGISTRY_RECORDS, STUDY_TYPES, TRIAL_STATUS, approvalState, enrolment, expectedEnrolmentPct, lookupTrialRecord, normaliseTrialId, trialFlags, trialIdSource, validateTrialDraft } from '@/lib/clinical-trials';

export const PURPLE = '#8b6cbc';
const INK = '#1e293b';
export const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

export function TrialStatusPill({ status }) {
  const m = TRIAL_STATUS[status] || { label: status, tone: 'neutral' };
  return <StatusPill label={m.label} tone={m.tone} />;
}

export function ApprovalPill({ approval, registry }) {
  if (registry) {
    const m = REGISTRY_STATUS[registry.status] || REGISTRY_STATUS.NOT_REGISTERED;
    return <StatusPill label={m.label} tone={m.tone} dot={false} />;
  }
  const m = APPROVAL_STATUS[approvalState(approval)] || APPROVAL_STATUS.NOT_STARTED;
  return <StatusPill label={m.label} tone={m.tone} dot={false} />;
}

export function EnrolmentBar({ trial, width = 150 }) {
  const { target, enrolled, pct } = enrolment(trial);
  const expected = trial.status === 'RECRUITING' ? expectedEnrolmentPct(trial) : null;
  if (!target) return <Typography variant="caption" color="text.secondary">No target set</Typography>;
  const behind = expected !== null && expected - pct > 20;
  return (
    <Tooltip title={`${enrolled} of ${target} enrolled${expected !== null ? ` · ${expected}% expected by now` : ''}`}>
      <Box sx={{ width, position: 'relative' }}>
        <LinearProgress variant="determinate" value={pct} sx={{ height: 7, borderRadius: 4, bgcolor: alpha(PURPLE, 0.12), '& .MuiLinearProgress-bar': { bgcolor: behind ? '#d97706' : pct >= 100 ? '#10b981' : PURPLE } }} />
        {expected !== null ? <Box sx={{ position: 'absolute', top: -3, left: `calc(${expected}% - 1px)`, width: 2, height: 13, bgcolor: '#334155', borderRadius: 1 }} /> : null}
        <Typography variant="caption" sx={{ fontWeight: 700, color: behind ? '#b45309' : '#334155' }}>{enrolled.toLocaleString()} / {target.toLocaleString()} ({pct}%)</Typography>
      </Box>
    </Tooltip>
  );
}

const SEV = { high: { icon: HighIcon, color: '#b91c1c', bg: '#fef2f2' }, medium: { icon: MediumIcon, color: '#b45309', bg: '#fffbeb' }, low: { icon: LowIcon, color: '#475569', bg: '#f8fafc' } };

export function FlagList({ flags, empty = 'Nothing needs attention.' }) {
  if (!flags.length) return <Typography variant="body2" sx={{ color: '#166534' }}>{empty}</Typography>;
  return (
    <Stack spacing={0.75}>
      {flags.map((f) => {
        const s = SEV[f.severity];
        const Icon = s.icon;
        return (
          <Stack key={f.key} direction="row" spacing={1} alignItems="center" sx={{ p: 1, borderRadius: 1.5, bgcolor: s.bg, borderLeft: `3px solid ${s.color}` }}>
            <Icon sx={{ color: s.color, fontSize: 18 }} />
            <Typography variant="body2" sx={{ color: INK }}>{f.text}</Typography>
          </Stack>
        );
      })}
    </Stack>
  );
}

/** Compact flag summary for table rows. */
export function FlagChip({ trial }) {
  const flags = trialFlags(trial);
  if (!flags.length) return <Typography variant="caption" color="text.secondary">—</Typography>;
  const top = flags[0];
  return (
    <Tooltip title={flags.map((f) => f.text).join(' · ')}>
      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.25, borderRadius: 999, bgcolor: SEV[top.severity].bg, color: SEV[top.severity].color, fontSize: '0.72rem', fontWeight: 700 }}>
        {React.createElement(SEV[top.severity].icon, { sx: { fontSize: 14 } })}
        {flags.length === 1 ? 'Needs attention' : `${flags.length} issues`}
      </Box>
    </Tooltip>
  );
}

function Fact({ label, children }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.64rem', letterSpacing: '0.05em' }}>{label}</Typography>
      <Box sx={{ typography: 'body2', fontWeight: 600, color: INK }}>{children || '—'}</Box>
    </Box>
  );
}

/**
 * Trial summary in a right-side panel: status, facts, attention, approvals, enrolment by
 * site, team, and shortcuts to the related hub tabs.
 */
export function TrialPanel({ trial, open, onClose, audience = 'researcher', onNavigate }) {
  if (!trial) return null;
  const base = audience === 'researcher' ? '/researcher/clinical-trials' : '/institution/clinical-trials';
  const ethicsHref = audience === 'researcher' ? '/researcher/ethics/applications' : '/institution/ethics/applications';
  const links = audience === 'researcher'
    ? [['Approvals & team', `${base}/approvals`], ['Recruitment & safety', `${base}/recruitment`], ['Registry & results', `${base}/registry`]]
    : [['Approvals & registry', `${base}/approvals`], ['Safety & compliance', `${base}/safety`], ['Recruitment', `${base}/recruitment`]];
  const flags = trialFlags(trial);
  const approvals = [
    ['Ethics', trial.ethics, trial.ethics ? [trial.ethics.committee, trial.ethics.reference].filter(Boolean).join(' · ') : 'Not started', trial.ethics?.expiry],
    ['Regulatory', trial.regulatory, trial.regulatory ? [trial.regulatory.authority, trial.regulatory.reference].filter(Boolean).join(' · ') : 'Not started', trial.regulatory?.expiry],
  ];
  return (
    <InstitutionModal open={open} onClose={onClose} variant="panel" maxWidth="md">
      <InstitutionModalHeader icon={TrialIcon} title={trial.shortTitle || trial.title} subtitle={`${trial.code} · ${trial.phase} · ${trial.studyType}`} onClose={onClose} />
      <InstitutionModalBody>
        <Stack spacing={2.5}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <TrialStatusPill status={trial.status} />
            {trial.department ? <StatusPill label={trial.department} tone="progress" dot={false} /> : null}
          </Stack>
          <Typography variant="body2" sx={{ color: '#334155' }}>{trial.title}</Typography>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, minmax(0,1fr))' } }}>
            <Fact label="Principal investigator">{trial.pi}</Fact>
            <Fact label="Sponsor">{trial.sponsor}</Fact>
            <Fact label="Dates">{`${fmt(trial.startDate)} – ${fmt(trial.endDate)}`}</Fact>
            <Fact label="Condition">{trial.condition}</Fact>
            <Fact label="Intervention">{trial.intervention}</Fact>
            <Fact label="Registry">{trial.registry?.pactr || trial.registry?.nct || <ApprovalPill registry={trial.registry || {}} />}</Fact>
          </Box>

          <InstitutionModalSection title="Needs attention">
            <FlagList flags={flags} empty={TRIAL_STATUS[trial.status]?.open ? 'Nothing needs attention.' : 'Closed trial.'} />
          </InstitutionModalSection>

          <InstitutionModalSection title="Approvals">
            <Stack spacing={1}>
              {approvals.map(([k, a, sub, exp]) => (
                <Stack key={k} direction="row" spacing={1.5} alignItems="center" sx={{ p: 1.25, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{k}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap component="div">{sub}{exp ? ` · valid until ${fmt(exp)}` : ''}</Typography>
                  </Box>
                  <ApprovalPill approval={a} />
                </Stack>
              ))}
              <Button size="small" endIcon={<OpenIcon sx={{ fontSize: 14 }} />} onClick={() => onNavigate(ethicsHref)} sx={{ alignSelf: 'flex-start', textTransform: 'none', fontWeight: 700, color: PURPLE }}>
                {audience === 'researcher' ? 'My ethics applications' : 'Ethics register'}
              </Button>
            </Stack>
          </InstitutionModalSection>

          {trial.targetEnrollment ? (
            <InstitutionModalSection title="Enrolment">
              <EnrolmentBar trial={trial} width="100%" />
              {trial.sites?.length ? (
                <Stack spacing={1} sx={{ mt: 1.5 }}>
                  {trial.sites.map((s) => (
                    <Stack key={s.name} direction="row" spacing={1.5} alignItems="center">
                      <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }} noWrap>{s.name}</Typography>
                      <Box sx={{ width: 160 }}><EnrolmentBar trial={{ targetEnrollment: s.target, enrolled: s.enrolled, status: 'X' }} width={160} /></Box>
                    </Stack>
                  ))}
                </Stack>
              ) : null}
            </InstitutionModalSection>
          ) : null}

          {trial.closure ? (
            <InstitutionModalSection title="Closure">
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{trial.closure.reason} · {fmt(trial.closure.date)}</Typography>
              {trial.closure.lesson ? <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Lesson learned: {trial.closure.lesson}</Typography> : null}
            </InstitutionModalSection>
          ) : null}

          <InstitutionModalSection title="Study team">
            <Stack spacing={0.75}>
              {(trial.team || []).map((m) => (
                <Stack key={m.name} direction="row" spacing={1.25} alignItems="center">
                  <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', bgcolor: alpha(PURPLE, 0.15), color: PURPLE, fontWeight: 700 }}>{m.name.replace(/^Dr\.\s*/, '').split(' ').map((x) => x[0]).join('').slice(0, 2)}</Avatar>
                  <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>{m.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{m.role}</Typography>
                </Stack>
              ))}
            </Stack>
          </InstitutionModalSection>
        </Stack>
      </InstitutionModalBody>
      <InstitutionModalFooter>
        {links.map(([label, href]) => (
          <Button key={href} size="small" onClick={() => onNavigate(href)} sx={{ textTransform: 'none', fontWeight: 700, color: PURPLE }}>{label}</Button>
        ))}
      </InstitutionModalFooter>
    </InstitutionModal>
  );
}

const EMPTY = { trialId: '', title: '', shortTitle: '', phase: '', studyType: '', condition: '', intervention: '', sponsor: '', targetEnrollment: '', startDate: '', endDate: '' };
const IMPORTABLE = ['title', 'shortTitle', 'phase', 'studyType', 'condition', 'intervention', 'sponsor', 'targetEnrollment', 'startDate', 'endDate'];

/**
 * Register a new trial (side panel). Entering a PACTR / NCT / CTMS ID fetches the
 * trial's metadata and fills the form (sample records for now). Sample mode: the trial
 * lives in this session only.
 */
export function RegisterTrialPanel({ open, onClose, onSave, pi }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [lookup, setLookup] = useState({ state: 'idle', message: '', source: '', registryStatus: null });
  const [imported, setImported] = useState([]);
  useEffect(() => { if (open) { setForm(EMPTY); setErrors({}); setLookup({ state: 'idle', message: '', source: '', registryStatus: null }); setImported([]); } }, [open]);
  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (imported.includes(k)) setImported((list) => list.filter((x) => x !== k));
  };
  const fetchRecord = async (value = form.trialId) => {
    const id = normaliseTrialId(value);
    setForm((f) => ({ ...f, trialId: id }));
    const source = trialIdSource(id);
    setLookup({ state: 'loading', message: source ? `Fetching from ${source}…` : 'Checking…', source: source || '', registryStatus: null });
    // Stands in for the registry / CTMS API call.
    await new Promise((r) => setTimeout(r, 900));
    const res = lookupTrialRecord(id);
    if (!res.ok) {
      setLookup({ state: 'error', message: res.error, source: source || '', registryStatus: null });
      return;
    }
    const r = res.record;
    setForm((f) => ({ ...f, trialId: res.id, ...Object.fromEntries(IMPORTABLE.map((k) => [k, r[k] === undefined || r[k] === null ? '' : String(r[k])])) }));
    setImported(IMPORTABLE.filter((k) => r[k] !== undefined && r[k] !== null && r[k] !== ''));
    setErrors({});
    setLookup({ state: 'done', message: `Details pulled from ${r.source}. Check them before saving.`, source: r.source, registryStatus: r.registryStatus || null });
  };
  const save = () => {
    const v = validateTrialDraft(form);
    setErrors(v.errors);
    if (v.ok) onSave({ ...form, lookupSource: lookup.state === 'done' ? lookup.source : null, registryStatus: lookup.registryStatus });
  };
  const mark = (k) => (imported.includes(k) ? { InputProps: { sx: { bgcolor: '#f5f3ff' } }, helperText: errors[k] || 'Imported', FormHelperTextProps: { sx: { color: errors[k] ? undefined : PURPLE } } } : { helperText: errors[k] });
  return (
    <InstitutionModal open={open} onClose={onClose} variant="panel" maxWidth="sm">
      <InstitutionModalHeader icon={RegisterIcon} title="Register a trial" subtitle="Start from the trial ID to pull its details, or fill them in yourself." onClose={onClose} />
      <InstitutionModalBody>
        <Alert severity="info" sx={{ mb: 2 }}>Clinical trials are in preview: a trial you register here is kept for this session only.</Alert>
        <Box sx={{ p: 2, mb: 2.5, borderRadius: 2, bgcolor: alpha(PURPLE, 0.05), border: `1px solid ${alpha(PURPLE, 0.2)}` }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Trial ID</Typography>
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              fullWidth
              placeholder="PACTR…, NCT… or CT-YYYY-NN"
              value={form.trialId}
              onChange={(e) => { setForm((f) => ({ ...f, trialId: e.target.value })); if (lookup.state !== 'loading') setLookup({ state: 'idle', message: '', source: '', registryStatus: null }); }}
              onKeyDown={(e) => { if (e.key === 'Enter' && form.trialId.trim()) { e.preventDefault(); fetchRecord(); } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>, sx: { bgcolor: 'white', fontFamily: 'monospace' } }}
              disabled={lookup.state === 'loading'}
            />
            <Button variant="contained" onClick={() => fetchRecord()} disabled={!form.trialId.trim() || lookup.state === 'loading'} startIcon={lookup.state === 'loading' ? <CircularProgress size={16} color="inherit" /> : <FetchIcon />} sx={{ textTransform: 'none', fontWeight: 700, bgcolor: PURPLE, boxShadow: 'none', whiteSpace: 'nowrap', minWidth: 130 }}>
              {lookup.state === 'loading' ? 'Fetching' : 'Fetch details'}
            </Button>
          </Stack>
          {lookup.state === 'loading' ? <LinearProgress sx={{ mt: 1, height: 3, borderRadius: 2, bgcolor: alpha(PURPLE, 0.12), '& .MuiLinearProgress-bar': { bgcolor: PURPLE } }} /> : null}
          {lookup.message && lookup.state !== 'loading' ? (
            <Alert severity={lookup.state === 'done' ? 'success' : 'warning'} sx={{ mt: 1.25, py: 0 }}>{lookup.message}</Alert>
          ) : null}
          {lookup.state === 'loading' ? <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>{lookup.message}</Typography> : null}
          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 1.25 }}>
            <Typography variant="caption" color="text.secondary">Try a sample ID:</Typography>
            {Object.keys(SAMPLE_REGISTRY_RECORDS).map((id) => (
              <Chip key={id} size="small" label={id} onClick={() => fetchRecord(id)} disabled={lookup.state === 'loading'} sx={{ fontFamily: 'monospace', fontWeight: 600, bgcolor: 'white', border: `1px solid ${alpha(PURPLE, 0.3)}`, cursor: 'pointer' }} />
            ))}
          </Stack>
        </Box>
        <Stack spacing={2}>
          <TextField size="small" label="Full title" required multiline minRows={2} value={form.title} onChange={set('title')} error={Boolean(errors.title)} {...mark('title')} />
          <TextField size="small" label="Short title" value={form.shortTitle} onChange={set('shortTitle')} placeholder="e.g. XYZ-401 malaria trial" {...mark('shortTitle')} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField select size="small" fullWidth label="Phase" required value={form.phase} onChange={set('phase')} error={Boolean(errors.phase)} {...mark('phase')}>
              {PHASES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </TextField>
            <TextField select size="small" fullWidth label="Study type" required value={form.studyType} onChange={set('studyType')} error={Boolean(errors.studyType)} {...mark('studyType')}>
              {STUDY_TYPES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </TextField>
          </Stack>
          <TextField size="small" label="Condition studied" value={form.condition} onChange={set('condition')} {...mark('condition')} />
          <TextField size="small" label="Intervention" value={form.intervention} onChange={set('intervention')} {...mark('intervention')} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField size="small" fullWidth label="Sponsor" value={form.sponsor} onChange={set('sponsor')} {...mark('sponsor')} />
            <TextField size="small" fullWidth type="number" label="Target enrolment" value={form.targetEnrollment} onChange={set('targetEnrollment')} error={Boolean(errors.targetEnrollment)} {...mark('targetEnrollment')} />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField size="small" fullWidth type="date" label="Planned start" InputLabelProps={{ shrink: true }} value={form.startDate} onChange={set('startDate')} {...mark('startDate')} />
            <TextField size="small" fullWidth type="date" label="Planned end" InputLabelProps={{ shrink: true }} value={form.endDate} onChange={set('endDate')} error={Boolean(errors.endDate)} {...mark('endDate')} />
          </Stack>
          <Typography variant="caption" color="text.secondary">Principal investigator: {pi || 'you'}. Next steps: ethics clearance (in Ethics), regulatory approval, then registration on PACTR or ClinicalTrials.gov.</Typography>
        </Stack>
      </InstitutionModalBody>
      <InstitutionModalFooter>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button variant="contained" onClick={save} sx={{ textTransform: 'none', fontWeight: 700, bgcolor: PURPLE }}>Save draft</Button>
      </InstitutionModalFooter>
    </InstitutionModal>
  );
}
