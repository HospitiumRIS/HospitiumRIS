'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Edit as EditIcon, HowToReg as EnrolIcon } from '@mui/icons-material';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
  InstitutionModalSection,
} from '@/components/GlobalAdmin/InstitutionModalShell';
import { ELIGIBILITY_LABELS, ELIGIBILITY_MODES } from '@/lib/training-enrolment';

const PURPLE = '#8b6cbc';

// <input type="datetime-local"> works in local time without a zone.
const toLocalInput = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocalInput = (value) => (value ? new Date(value).toISOString() : null);
const show = (value) => (value ? new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : null);

const fromTraining = (t) => ({
  registrationOpensAt: toLocalInput(t?.registrationOpensAt),
  registrationClosesAt: toLocalInput(t?.registrationClosesAt),
  cancellationDeadline: toLocalInput(t?.cancellationDeadline),
  requiresApproval: Boolean(t?.requiresApproval),
  waitlistEnabled: Boolean(t?.waitlistEnabled),
  eligibilityMode: t?.eligibilityMode || 'OPEN',
  prerequisiteTrainingIds: t?.prerequisiteTrainingIds || [],
});

/**
 * Enrolment settings of one training (#102): registration window, cancellation
 * deadline, approval, waiting list, eligibility and prerequisite trainings.
 */
export default function TrainingEnrolmentSettings({ training, onSaved }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => fromTraining(training));
  const [options, setOptions] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || options.length) return;
    fetch('/api/training?includeAll=true', { credentials: 'include' })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setOptions((json.trainings || [])
            .filter((t) => t.id !== training?.id && t.institutionId === training?.institutionId)
            .map((t) => ({ id: t.id, title: t.title, code: t.code })));
        }
      })
      .catch(() => {});
  }, [open, options.length, training?.id, training?.institutionId]);

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const edit = () => {
    setDraft(fromTraining(training));
    setError('');
    setOpen(true);
  };

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/training/${training.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...draft,
          registrationOpensAt: fromLocalInput(draft.registrationOpensAt),
          registrationClosesAt: fromLocalInput(draft.registrationClosesAt),
          cancellationDeadline: fromLocalInput(draft.cancellationDeadline),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Could not save');
      setOpen(false);
      onSaved?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const prereqTitles = (training?.prerequisites || []).map((p) => p.title);

  return (
    <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Enrolment</Typography>
          <Typography variant="body2">
            <strong>Registration:</strong>{' '}
            {[show(training?.registrationOpensAt) && `opens ${show(training.registrationOpensAt)}`,
              `closes ${show(training?.registrationClosesAt) || 'when the training starts'}`].filter(Boolean).join(', ')}
          </Typography>
          <Typography variant="body2"><strong>Approval:</strong> {training?.requiresApproval ? 'Required (requests hold a place)' : 'Not required'}</Typography>
          <Typography variant="body2"><strong>Waiting list:</strong> {training?.waitlistEnabled ? `On${training?.waitlistCount ? ` · ${training.waitlistCount} waiting` : ''}` : 'Off'}</Typography>
          <Typography variant="body2"><strong>Who can enrol:</strong> {ELIGIBILITY_LABELS[training?.eligibilityMode || 'OPEN']}</Typography>
          <Typography variant="body2"><strong>Prerequisites:</strong> {prereqTitles.length ? prereqTitles.join(', ') : 'None'}</Typography>
          <Typography variant="body2"><strong>Cancel by:</strong> {show(training?.cancellationDeadline) || 'Any time before the start'}</Typography>
        </Box>
        <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={edit} sx={{ borderColor: PURPLE, color: PURPLE, textTransform: 'none', fontWeight: 700 }}>Edit</Button>
      </Stack>

      <InstitutionModal open={open} onClose={() => setOpen(false)} disableClose={busy} maxWidth="sm">
        <InstitutionModalHeader icon={EnrolIcon} title="Enrolment" subtitle={training?.title} onClose={() => setOpen(false)} disableClose={busy} />
        <InstitutionModalBody>
          {error ? <Alert severity="error" sx={{ borderRadius: 1.5 }}>{error}</Alert> : null}
          <InstitutionModalSection title="Registration window">
            <Stack spacing={1.5}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField size="small" type="datetime-local" label="Opens" value={draft.registrationOpensAt} onChange={(e) => set({ registrationOpensAt: e.target.value })} InputLabelProps={{ shrink: true }} helperText="Empty = open now" sx={{ flex: 1 }} />
                <TextField size="small" type="datetime-local" label="Closes" value={draft.registrationClosesAt} onChange={(e) => set({ registrationClosesAt: e.target.value })} InputLabelProps={{ shrink: true }} helperText="Empty = at the start" sx={{ flex: 1 }} />
              </Stack>
              <TextField size="small" type="datetime-local" label="Participants can cancel until" value={draft.cancellationDeadline} onChange={(e) => set({ cancellationDeadline: e.target.value })} InputLabelProps={{ shrink: true }} helperText="Empty = any time before the start" />
            </Stack>
          </InstitutionModalSection>
          <InstitutionModalSection title="Places">
            <Stack>
              <FormControlLabel control={<Switch checked={draft.requiresApproval} onChange={(e) => set({ requiresApproval: e.target.checked })} />} label="Training admin approves each request" />
              <FormControlLabel control={<Switch checked={draft.waitlistEnabled} onChange={(e) => set({ waitlistEnabled: e.target.checked })} />} label="Waiting list when full (freed places are offered in order)" />
            </Stack>
          </InstitutionModalSection>
          <InstitutionModalSection title="Eligibility">
            <Stack spacing={1.5}>
              <TextField select size="small" label="Who can enrol" value={draft.eligibilityMode} onChange={(e) => set({ eligibilityMode: e.target.value })} helperText={draft.eligibilityMode === 'DEPARTMENT_ONLY' ? `Matched against the profile department. Training departments: ${training?.department || 'none set'}` : ' '}>
                {ELIGIBILITY_MODES.map((m) => <MenuItem key={m} value={m}>{ELIGIBILITY_LABELS[m]}</MenuItem>)}
              </TextField>
              <Autocomplete
                multiple
                size="small"
                options={options}
                getOptionLabel={(o) => (o.code ? `${o.title} (${o.code})` : o.title)}
                value={draft.prerequisiteTrainingIds.map((id) => options.find((o) => o.id === id) || (training?.prerequisites || []).find((p) => p.id === id) || { id, title: 'Training' })}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                onChange={(_, value) => set({ prerequisiteTrainingIds: value.map((v) => v.id).slice(0, 10) })}
                renderInput={(params) => <TextField {...params} label="Must have completed" placeholder="Choose trainings" helperText="Participants need a completed registration in each" />}
              />
            </Stack>
          </InstitutionModalSection>
        </InstitutionModalBody>
        <InstitutionModalFooter>
          <Button onClick={() => setOpen(false)} disabled={busy} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={busy} sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700 }}>{busy ? 'Saving…' : 'Save'}</Button>
        </InstitutionModalFooter>
      </InstitutionModal>
    </Paper>
  );
}
