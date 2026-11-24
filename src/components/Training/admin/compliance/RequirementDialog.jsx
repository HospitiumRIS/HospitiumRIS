'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Rule as RuleIcon } from '@mui/icons-material';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
  InstitutionModalSection,
} from '@/components/GlobalAdmin/InstitutionModalShell';

const PURPLE = '#8b6cbc';
const fmt = (v) => (v ? new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const EMPTY = { title: '', description: '', departments: [], validityMonths: '', dueWithinDays: 30, autoAssign: true, isActive: true, trainingIds: [] };

/**
 * Create or edit a requirement rule (#140): who it applies to, how long a completion
 * counts, how long people get, auto-assign, and which cohorts satisfy it.
 */
export default function RequirementDialog({ open, requirement, departments = [], trainingOptions = [], onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(requirement ? {
      title: requirement.title,
      description: requirement.description || '',
      departments: requirement.departments || [],
      validityMonths: requirement.validityMonths ?? '',
      dueWithinDays: requirement.dueWithinDays,
      autoAssign: requirement.autoAssign,
      isActive: requirement.isActive,
      trainingIds: requirement.cohorts.map((c) => c.id),
    } : EMPTY);
  }, [open, requirement]);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  // Trainings already linked to another requirement are not offered.
  const options = trainingOptions.filter((t) => !t.requirementId || t.requirementId === requirement?.id);
  const chosen = options.filter((t) => form.trainingIds.includes(t.id));

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(requirement ? `/api/training/requirements/${requirement.id}` : '/api/training/requirements', {
        method: requirement ? 'PUT' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Could not save the requirement');
      onSaved(json.requirement);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <InstitutionModal open={open} onClose={onClose} disableClose={busy} maxWidth="sm">
      <InstitutionModalHeader icon={RuleIcon} title={requirement ? 'Edit requirement' : 'New requirement'} subtitle="A standing rule, e.g. Nursing staff complete BLS every 24 months" onClose={onClose} disableClose={busy} />
      <InstitutionModalBody>
        {error ? <Alert severity="error" sx={{ borderRadius: 1.5 }}>{error}</Alert> : null}
        <InstitutionModalSection title="Requirement">
          <Stack spacing={2}>
            <TextField label="Name" value={form.title} onChange={(e) => set('title')(e.target.value)} required fullWidth size="small" placeholder="Basic Life Support" />
            <TextField label="Description (optional)" value={form.description} onChange={(e) => set('description')(e.target.value)} fullWidth size="small" multiline minRows={2} />
            <Autocomplete
              multiple
              freeSolo
              size="small"
              options={departments}
              value={form.departments}
              onChange={(_, v) => set('departments')(v.map((x) => String(x).trim()).filter(Boolean))}
              renderTags={(value, getTagProps) => value.map((option, index) => <Chip size="small" label={option} {...getTagProps({ index })} key={option} />)}
              renderInput={(params) => <TextField {...params} label="Applies to departments" helperText="Leave empty for everyone in the institution" />}
            />
          </Stack>
        </InstitutionModalSection>
        <InstitutionModalSection title="Timing">
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Valid for (months)" type="number" size="small" value={form.validityMonths} onChange={(e) => set('validityMonths')(e.target.value)} helperText="Empty = never expires" inputProps={{ min: 1, max: 120 }} fullWidth />
            <TextField label="Due within (days)" type="number" size="small" value={form.dueWithinDays} onChange={(e) => set('dueWithinDays')(e.target.value)} helperText="From the day someone is assigned" inputProps={{ min: 1, max: 365 }} fullWidth />
          </Stack>
        </InstitutionModalSection>
        <InstitutionModalSection title="Cohorts that count">
          <Autocomplete
            multiple
            size="small"
            disableCloseOnSelect
            options={options}
            value={chosen}
            getOptionLabel={(t) => `${t.title} · ${fmt(t.startDate)}`}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            onChange={(_, v) => set('trainingIds')(v.map((t) => t.id))}
            renderOption={(props, t, { selected }) => (
              <li {...props} key={t.id}>
                <Checkbox size="small" checked={selected} sx={{ mr: 1, color: PURPLE, '&.Mui-checked': { color: PURPLE } }} />
                <Stack>
                  <Typography variant="body2">{t.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{fmt(t.startDate)} · {t.open ? (t.status === 'PUBLISHED' ? 'Open' : 'Draft') : 'Finished'}</Typography>
                </Stack>
              </li>
            )}
            renderInput={(params) => <TextField {...params} label="Linked trainings" helperText="Completing any of these meets the requirement. Link past cohorts too, so earlier completions count." />}
          />
        </InstitutionModalSection>
        <Stack>
          <FormControlLabel control={<Switch checked={form.autoAssign} onChange={(e) => set('autoAssign')(e.target.checked)} sx={{ '& .Mui-checked': { color: PURPLE }, '& .Mui-checked + .MuiSwitch-track': { bgcolor: PURPLE } }} />} label="Auto-assign people who need it to the next open cohort (checked hourly)" />
          <FormControlLabel control={<Switch checked={form.isActive} onChange={(e) => set('isActive')(e.target.checked)} sx={{ '& .Mui-checked': { color: PURPLE }, '& .Mui-checked + .MuiSwitch-track': { bgcolor: PURPLE } }} />} label="Active (counts towards compliance)" />
        </Stack>
      </InstitutionModalBody>
      <InstitutionModalFooter>
        <Button onClick={onClose} disabled={busy} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={busy || !form.title.trim()} sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700 }}>
          {busy ? 'Saving…' : 'Save requirement'}
        </Button>
      </InstitutionModalFooter>
    </InstitutionModal>
  );
}
