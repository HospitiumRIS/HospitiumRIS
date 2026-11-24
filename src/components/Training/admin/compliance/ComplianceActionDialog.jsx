'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Button, FormControlLabel, Checkbox, MenuItem, Stack, TextField, Typography } from '@mui/material';
import {
  Block as ExemptIcon,
  EventRepeat as ExtendIcon,
  NotificationsActive as RemindIcon,
  PersonAdd as AssignIcon,
  Undo as UndoIcon,
} from '@mui/icons-material';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
} from '@/components/GlobalAdmin/InstitutionModalShell';

const PURPLE = '#8b6cbc';
const fmt = (v) => (v ? new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const META = {
  remind: { icon: RemindIcon, title: 'Send a reminder', button: 'Send reminder', text: 'Each person gets one reminder about their due or overdue training (at most one a day).' },
  extend: { icon: ExtendIcon, title: 'Extend the due date', button: 'Move due date' },
  exempt: { icon: ExemptIcon, title: 'Exempt from compliance', button: 'Exempt', text: 'Exempt people are left out of the compliance figures. The reason is kept and shown in exports.' },
  unexempt: { icon: UndoIcon, title: 'Remove exemption', button: 'Remove exemption', text: 'They count towards compliance again.' },
  assign: { icon: AssignIcon, title: 'Assign to a cohort', button: 'Assign' },
};

/**
 * Confirm and run one action on the selected people (#140).
 * payload: what to send besides the form (registrationIds, cells, userIds, exemptionIds).
 */
export default function ComplianceActionDialog({ open, action, count, payload, trainingOptions = [], defaultTrainingId = '', onClose, onDone }) {
  const [dueDate, setDueDate] = useState('');
  const [reason, setReason] = useState('');
  const [trainingId, setTrainingId] = useState('');
  const [overCapacity, setOverCapacity] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setDueDate('');
    setReason('');
    setTrainingId(defaultTrainingId || '');
    setOverCapacity(false);
    setError('');
  }, [open, defaultTrainingId]);

  if (!action) return null;
  const meta = META[action];
  const openCohorts = trainingOptions.filter((t) => t.open);
  const ready = (action !== 'extend' || dueDate) && (action !== 'exempt' || reason.trim()) && (action !== 'assign' || trainingId);

  const run = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/training/compliance/actions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload, dueDate: dueDate || null, reason, trainingId, allowOverCapacity: overCapacity }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'That did not work');
      onDone(json.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <InstitutionModal open={open} onClose={onClose} disableClose={busy} maxWidth="xs">
      <InstitutionModalHeader icon={meta.icon} title={meta.title} subtitle={`${count} selected`} onClose={onClose} disableClose={busy} />
      <InstitutionModalBody>
        {error ? <Alert severity="error" sx={{ borderRadius: 1.5 }}>{error}</Alert> : null}
        {meta.text ? <Typography variant="body2" color="text.secondary">{meta.text}</Typography> : null}
        <Stack spacing={2}>
          {action === 'assign' ? (
            <TextField select size="small" label="Cohort" value={trainingId} onChange={(e) => setTrainingId(e.target.value)} fullWidth helperText={openCohorts.length ? 'People who completed it already are skipped.' : 'No open trainings. Create or publish one first.'}>
              {openCohorts.map((t) => <MenuItem key={t.id} value={t.id}>{t.title} · {fmt(t.startDate)}{t.status === 'DRAFT' ? ' (draft)' : ''}</MenuItem>)}
            </TextField>
          ) : null}
          {action === 'extend' || action === 'assign' ? (
            <TextField type="date" size="small" label={action === 'extend' ? 'New due date' : 'Due date (optional)'} value={dueDate} onChange={(e) => setDueDate(e.target.value)} InputLabelProps={{ shrink: true }} inputProps={{ min: new Date().toISOString().slice(0, 10) }} fullWidth />
          ) : null}
          {action === 'exempt' || action === 'extend' || action === 'assign' ? (
            <TextField size="small" label={action === 'exempt' ? 'Reason' : 'Note (optional)'} required={action === 'exempt'} value={reason} onChange={(e) => setReason(e.target.value)} fullWidth multiline minRows={2} placeholder={action === 'exempt' ? 'e.g. Locum, covered by another employer' : ''} />
          ) : null}
          {action === 'assign' ? (
            <FormControlLabel control={<Checkbox size="small" checked={overCapacity} onChange={(e) => setOverCapacity(e.target.checked)} />} label="Allow over capacity (otherwise extra people go on the waiting list)" />
          ) : null}
        </Stack>
      </InstitutionModalBody>
      <InstitutionModalFooter>
        <Button onClick={onClose} disabled={busy} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button variant="contained" onClick={run} disabled={busy || !ready} sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700 }}>
          {busy ? 'Working…' : meta.button}
        </Button>
      </InstitutionModalFooter>
    </InstitutionModal>
  );
}
