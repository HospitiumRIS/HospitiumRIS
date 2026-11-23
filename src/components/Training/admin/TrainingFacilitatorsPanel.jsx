'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Delete as DeleteIcon,
  PersonAdd as AddIcon,
  RecordVoiceOver as FacilitatorIcon,
  WorkspacePremium as CertIcon,
} from '@mui/icons-material';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
  InstitutionModalSection,
} from '@/components/GlobalAdmin/InstitutionModalShell';
import { FACILITATOR_ROLE_LABELS, FACILITATOR_ROLES } from '@/lib/training-facilitators';

const PURPLE = '#8b6cbc';

const EMPTY = { kind: 'staff', person: null, name: '', email: '', title: '', role: 'CO_FACILITATOR', sessionId: '', showOnCertificate: true };
const fmtSession = (s) => `${new Date(s.startsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} ${new Date(s.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · ${s.title}`;

/**
 * Facilitators of a training (#104): staff of the institution or external guests, for
 * the whole training or one session, with role and whether they appear on certificates.
 */
export default function TrainingFacilitatorsPanel({ trainingId, training, sessions = [], facilitators = [], onChanged }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(EMPTY);
  const [options, setOptions] = useState([]);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || draft.kind !== 'staff') return undefined;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/training/${trainingId}/assign?search=${encodeURIComponent(search)}`, { credentials: 'include', signal: controller.signal })
        .then((r) => r.json())
        .then((json) => { if (json.success) setOptions(json.members || []); })
        .catch(() => {});
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [open, draft.kind, search, trainingId]);

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const sessionTitle = (id) => sessions.find((s) => s.id === id)?.title || 'A session';

  const call = async (url, init) => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(url, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...init });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Something went wrong');
      await onChanged?.();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const add = async () => {
    const ok = await call(`/api/training/${trainingId}/facilitators`, {
      method: 'POST',
      body: JSON.stringify({
        userId: draft.kind === 'staff' ? draft.person?.id : null,
        name: draft.kind === 'guest' ? draft.name : null,
        email: draft.kind === 'guest' ? draft.email : null,
        title: draft.title,
        role: draft.role,
        sessionId: draft.sessionId || null,
        showOnCertificate: draft.showOnCertificate,
      }),
    });
    if (ok) {
      setOpen(false);
      setDraft(EMPTY);
    }
  };

  const ready = draft.kind === 'staff' ? Boolean(draft.person) : Boolean(draft.name.trim());

  return (
    <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1} sx={{ mb: facilitators.length ? 1.5 : 0 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Facilitators</Typography>
          <Typography variant="body2" color="text.secondary">
            Staff facilitators can take the register and show the check-in screen for their sessions from Training › Facilitating.
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => { setDraft(EMPTY); setError(''); setOpen(true); }} sx={{ borderColor: PURPLE, color: PURPLE, textTransform: 'none', fontWeight: 700, alignSelf: 'flex-start', whiteSpace: 'nowrap' }}>
          Add facilitator
        </Button>
      </Stack>
      {error && !open ? <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError('')}>{error}</Alert> : null}
      <Stack spacing={1}>
        {facilitators.map((f) => (
          <Stack key={f.id} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} sx={{ p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {f.name}{f.title ? <Typography component="span" variant="body2" color="text.secondary">{` · ${f.title}`}</Typography> : null}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {f.internal ? 'Staff' : 'Guest'}{f.email ? ` · ${f.email}` : ''} · {f.sessionId ? sessionTitle(f.sessionId) : 'All sessions'}
              </Typography>
            </Box>
            <TextField select size="small" value={f.role} disabled={busy} onChange={(e) => call(`/api/training/${trainingId}/facilitators/${f.id}`, { method: 'PUT', body: JSON.stringify({ role: e.target.value }) })} sx={{ minWidth: 170 }}>
              {FACILITATOR_ROLES.map((r) => <MenuItem key={r} value={r}>{FACILITATOR_ROLE_LABELS[r]}</MenuItem>)}
            </TextField>
            <Tooltip title={f.showOnCertificate ? 'Shown on certificates: click to hide' : 'Not on certificates: click to show'}>
              <Chip
                icon={<CertIcon sx={{ fontSize: 16 }} />}
                label={f.showOnCertificate ? 'On certificate' : 'Not on certificate'}
                size="small"
                disabled={busy}
                onClick={() => call(`/api/training/${trainingId}/facilitators/${f.id}`, { method: 'PUT', body: JSON.stringify({ showOnCertificate: !f.showOnCertificate }) })}
                sx={{ fontWeight: 700, ...(f.showOnCertificate ? { bgcolor: alpha(PURPLE, 0.12), color: PURPLE } : {}) }}
              />
            </Tooltip>
            <Tooltip title="Remove">
              <span><IconButton size="small" color="error" disabled={busy} onClick={() => call(`/api/training/${trainingId}/facilitators/${f.id}`, { method: 'DELETE' })}><DeleteIcon fontSize="small" /></IconButton></span>
            </Tooltip>
          </Stack>
        ))}
      </Stack>

      <InstitutionModal open={open} onClose={() => setOpen(false)} disableClose={busy} maxWidth="sm">
        <InstitutionModalHeader icon={FacilitatorIcon} title="Add facilitator" subtitle={training?.title} onClose={() => setOpen(false)} disableClose={busy} />
        <InstitutionModalBody>
          {error ? <Alert severity="error" sx={{ borderRadius: 1.5 }}>{error}</Alert> : null}
          <InstitutionModalSection title="Who">
            <Stack spacing={1.5}>
              <ToggleButtonGroup size="small" exclusive value={draft.kind} onChange={(_, v) => v && set({ kind: v })}>
                <ToggleButton value="staff" sx={{ textTransform: 'none' }}>Staff member</ToggleButton>
                <ToggleButton value="guest" sx={{ textTransform: 'none' }}>External guest</ToggleButton>
              </ToggleButtonGroup>
              {draft.kind === 'staff' ? (
                <Autocomplete
                  size="small"
                  options={options}
                  value={draft.person}
                  filterOptions={(x) => x}
                  getOptionLabel={(p) => `${p.givenName || ''} ${p.familyName || ''}`.trim() + (p.email ? ` · ${p.email}` : '')}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                  onChange={(_, value) => set({ person: value })}
                  onInputChange={(_, value, reason) => { if (reason === 'input') setSearch(value); }}
                  renderInput={(params) => <TextField {...params} label="Search staff by name or email" />}
                />
              ) : (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <TextField size="small" label="Name" value={draft.name} onChange={(e) => set({ name: e.target.value })} sx={{ flex: 1 }} />
                  <TextField size="small" label="Email (optional)" value={draft.email} onChange={(e) => set({ email: e.target.value })} sx={{ flex: 1 }} />
                </Stack>
              )}
              <TextField size="small" label="Title (optional)" placeholder="e.g. Consultant Paediatrician" value={draft.title} onChange={(e) => set({ title: e.target.value })} />
            </Stack>
          </InstitutionModalSection>
          <InstitutionModalSection title="Role">
            <Stack spacing={1.5}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField select size="small" label="Role" value={draft.role} onChange={(e) => set({ role: e.target.value })} sx={{ flex: 1 }}>
                  {FACILITATOR_ROLES.map((r) => <MenuItem key={r} value={r}>{FACILITATOR_ROLE_LABELS[r]}</MenuItem>)}
                </TextField>
                <TextField select size="small" label="Facilitates" value={draft.sessionId} onChange={(e) => set({ sessionId: e.target.value })} sx={{ flex: 1.4 }}>
                  <MenuItem value="">All sessions</MenuItem>
                  {sessions.filter((s) => s.status !== 'CANCELLED').map((s) => <MenuItem key={s.id} value={s.id}>{fmtSession(s)}</MenuItem>)}
                </TextField>
              </Stack>
              <FormControlLabel control={<Switch checked={draft.showOnCertificate} onChange={(e) => set({ showOnCertificate: e.target.checked })} />} label="Name them on certificates ({{facilitators}})" />
            </Stack>
          </InstitutionModalSection>
        </InstitutionModalBody>
        <InstitutionModalFooter>
          <Button onClick={() => setOpen(false)} disabled={busy} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={add} disabled={busy || !ready} sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700 }}>{busy ? 'Adding…' : 'Add'}</Button>
        </InstitutionModalFooter>
      </InstitutionModal>
    </Paper>
  );
}
