'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Button,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { AssignmentInd as AssignIcon } from '@mui/icons-material';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
  InstitutionModalSection,
} from '@/components/GlobalAdmin/InstitutionModalShell';

const PURPLE = '#8b6cbc';

const personLabel = (p) => `${p.givenName || ''} ${p.familyName || ''}`.trim() + (p.email ? ` · ${p.email}` : '');

/**
 * Assign a training to people of the institution (#103): pick people, departments or
 * everyone, with an optional due date.
 */
export default function AssignTrainingDialog({ open, onClose, training, onAssigned }) {
  const [mode, setMode] = useState('people');
  const [people, setPeople] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [options, setOptions] = useState([]);
  const [deptOptions, setDeptOptions] = useState([]);
  const [search, setSearch] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [allowOverCapacity, setAllowOverCapacity] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!open || !training?.id) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/training/${training.id}/assign?search=${encodeURIComponent(search)}`, { credentials: 'include', signal: controller.signal })
        .then((r) => r.json())
        .then((json) => {
          if (!json.success) return;
          setOptions(json.members || []);
          if (json.departments) setDeptOptions(json.departments);
        })
        .catch(() => {});
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [open, training?.id, search]);

  const reset = () => {
    setMode('people');
    setPeople([]);
    setDepartments([]);
    setSearch('');
    setDueDate('');
    setAllowOverCapacity(false);
    setNote('');
    setError('');
    setResult(null);
  };
  const close = () => { if (!busy) { reset(); onClose?.(); } };

  const ready = mode === 'all' || (mode === 'people' ? people.length > 0 : departments.length > 0);

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/training/${training.id}/assign`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: mode === 'people' ? people.map((p) => p.id) : [],
          departments: mode === 'departments' ? departments : [],
          allMembers: mode === 'all',
          // End of the chosen day, local time.
          dueDate: dueDate ? new Date(`${dueDate}T23:59:00`).toISOString() : null,
          allowOverCapacity,
          note: note.trim() || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Could not assign');
      setResult(json);
      onAssigned?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <InstitutionModal open={open} onClose={close} disableClose={busy} maxWidth="sm">
      <InstitutionModalHeader icon={AssignIcon} title="Assign training" subtitle={training?.title} onClose={close} disableClose={busy} />
      <InstitutionModalBody>
        {error ? <Alert severity="error" sx={{ borderRadius: 1.5 }}>{error}</Alert> : null}
        {result ? (
          <Alert severity={result.skipped?.length ? 'warning' : 'success'} sx={{ borderRadius: 1.5 }}>
            {result.created} assigned{result.updated ? `, ${result.updated} already enrolled now marked as assigned` : ''}.
            {result.skipped?.length ? (
              <Stack component="ul" sx={{ m: 0, mt: 0.5, pl: 2 }}>
                {result.skipped.slice(0, 8).map((s) => <li key={s.userId}>{s.name || 'Someone'}: {s.reason}</li>)}
                {result.skipped.length > 8 ? <li>and {result.skipped.length - 8} more</li> : null}
              </Stack>
            ) : null}
          </Alert>
        ) : null}
        <InstitutionModalSection title="Who">
          <Stack spacing={1.5}>
            <ToggleButtonGroup size="small" exclusive value={mode} onChange={(_, v) => v && setMode(v)}>
              <ToggleButton value="people" sx={{ textTransform: 'none' }}>People</ToggleButton>
              <ToggleButton value="departments" sx={{ textTransform: 'none' }}>Departments</ToggleButton>
              <ToggleButton value="all" sx={{ textTransform: 'none' }}>Everyone</ToggleButton>
            </ToggleButtonGroup>
            {mode === 'people' ? (
              <Autocomplete
                multiple
                size="small"
                options={options}
                value={people}
                filterOptions={(x) => x}
                getOptionLabel={personLabel}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                onChange={(_, value) => setPeople(value)}
                onInputChange={(_, value, reason) => { if (reason === 'input') setSearch(value); }}
                renderInput={(params) => <TextField {...params} label="Search staff by name or email" />}
              />
            ) : null}
            {mode === 'departments' ? (
              <Autocomplete
                multiple
                size="small"
                options={deptOptions}
                value={departments}
                onChange={(_, value) => setDepartments(value)}
                renderInput={(params) => <TextField {...params} label="Departments" helperText="Matched against each person's profile department" />}
              />
            ) : null}
            {mode === 'all' ? (
              <Typography variant="body2" color="text.secondary">Every active member of your institution.</Typography>
            ) : null}
          </Stack>
        </InstitutionModalSection>
        <InstitutionModalSection title="Due date and message">
          <Stack spacing={1.5}>
            <TextField size="small" type="date" label="Complete by" value={dueDate} onChange={(e) => setDueDate(e.target.value)} InputLabelProps={{ shrink: true }} helperText="Reminders go out 7 days before and weekly once overdue" />
            <TextField size="small" multiline minRows={2} label="Message (optional)" value={note} onChange={(e) => setNote(e.target.value)} inputProps={{ maxLength: 500 }} />
            <FormControlLabel
              control={<Switch checked={allowOverCapacity} onChange={(e) => setAllowOverCapacity(e.target.checked)} />}
              label={`Assign even if the ${training?.maxParticipants ?? ''} places are taken`}
            />
          </Stack>
        </InstitutionModalSection>
      </InstitutionModalBody>
      <InstitutionModalFooter>
        <Button onClick={close} disabled={busy} sx={{ textTransform: 'none' }}>{result ? 'Done' : 'Cancel'}</Button>
        <Button variant="contained" onClick={submit} disabled={busy || !ready} sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700 }}>
          {busy ? 'Assigning…' : 'Assign'}
        </Button>
      </InstitutionModalFooter>
    </InstitutionModal>
  );
}
