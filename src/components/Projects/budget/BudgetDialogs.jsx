'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Autocomplete, Button, MenuItem, Stack, TextField, Typography, alpha } from '@mui/material';
import { AttachFile as FileIcon, Payments as ExpenseIcon, PlaylistAdd as LineIcon, RateReview as NoteIcon } from '@mui/icons-material';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
} from '@/components/GlobalAdmin/InstitutionModalShell';
import { BUDGET_CATEGORIES } from '@/lib/project-budget';
import { PURPLE, btn } from './BudgetParts';

async function send(url, options) {
  const res = await fetch(url, { credentials: 'include', ...options });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) throw new Error(json.error || 'That did not work');
  return json;
}

/** Add or edit a budget line (research office). */
export function LineDialog({ open, projectId, line, currency, onClose, onSaved }) {
  const [form, setForm] = useState({ category: '', description: '', amount: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (open) {
      setForm(line ? { category: line.category, description: line.description || '', amount: String(line.amount) } : { category: '', description: '', amount: '' });
      setError('');
    }
  }, [open, line]);
  const save = async () => {
    setBusy(true);
    setError('');
    try {
      await send(line ? `/api/projects/${projectId}/budget/lines/${line.id}` : `/api/projects/${projectId}/budget`, {
        method: line ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      onSaved(line ? 'Budget line saved.' : 'Budget line added.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <InstitutionModal open={open} onClose={onClose} disableClose={busy} maxWidth="sm">
      <InstitutionModalHeader icon={LineIcon} title={line ? 'Edit budget line' : 'Add a budget line'} subtitle={`Amounts in ${currency}`} onClose={onClose} disableClose={busy} />
      <InstitutionModalBody>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <Stack spacing={2}>
          <Autocomplete freeSolo options={BUDGET_CATEGORIES} value={form.category} onInputChange={(_, v) => setForm((f) => ({ ...f, category: v }))} renderInput={(params) => <TextField {...params} size="small" label="Category" required />} />
          <TextField size="small" label="Description (optional)" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="e.g. 2 research assistants, 18 months" />
          <TextField size="small" label={`Amount (${currency})`} type="number" required value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} inputProps={{ min: 0, step: '0.01' }} />
        </Stack>
      </InstitutionModalBody>
      <InstitutionModalFooter>
        <Button onClick={onClose} disabled={busy} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={busy || !form.category.trim() || !(Number(form.amount) > 0)} sx={{ ...btn, bgcolor: PURPLE }}>{busy ? 'Saving…' : 'Save'}</Button>
      </InstitutionModalFooter>
    </InstitutionModal>
  );
}

/**
 * Record an expense (research office, approved on entry) or submit a claim with a
 * receipt (researcher on the project).
 */
export function ExpenseDialog({ open, projectId, mode, lines = [], currency, onClose, onSaved }) {
  const claim = mode === 'claim';
  const today = new Date().toISOString().slice(0, 10);
  const empty = { spentOn: today, description: '', amount: '', budgetLineId: '', payee: '', reference: '' };
  const [form, setForm] = useState(empty);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (open) { setForm({ ...empty, spentOn: new Date().toISOString().slice(0, 10) }); setFile(null); setError(''); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) data.append(k, v); });
      data.append('currency', currency);
      if (claim) data.append('asClaim', '1');
      if (file) data.append('receipt', file);
      await send(`/api/projects/${projectId}/budget/expenses`, { method: 'POST', body: data });
      onSaved(claim ? 'Claim submitted. The research office will review it.' : 'Expense recorded.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const ready = form.description.trim() && Number(form.amount) > 0 && form.spentOn && (!claim || file);
  return (
    <InstitutionModal open={open} onClose={onClose} disableClose={busy} maxWidth="sm">
      <InstitutionModalHeader icon={ExpenseIcon} title={claim ? 'Submit an expense claim' : 'Record an expense'} subtitle={claim ? 'The research office approves or rejects it' : 'Recorded as approved'} onClose={onClose} disableClose={busy} />
      <InstitutionModalBody>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField size="small" type="date" label="Date" required value={form.spentOn} onChange={set('spentOn')} InputLabelProps={{ shrink: true }} inputProps={{ max: today }} fullWidth />
            <TextField size="small" type="number" label={`Amount (${currency})`} required value={form.amount} onChange={set('amount')} inputProps={{ min: 0, step: '0.01' }} fullWidth />
          </Stack>
          <TextField size="small" label="What was it for?" required value={form.description} onChange={set('description')} placeholder="e.g. Field travel to Kisumu, data collection" />
          <TextField select size="small" label="Budget line" value={form.budgetLineId} onChange={set('budgetLineId')} helperText={lines.length ? '' : 'No budget lines yet: it will be recorded as unallocated'}>
            <MenuItem value="">Unallocated</MenuItem>
            {lines.map((l) => <MenuItem key={l.id} value={l.id}>{l.category}{l.description ? ` · ${l.description}` : ''}</MenuItem>)}
          </TextField>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField size="small" label="Paid to (optional)" value={form.payee} onChange={set('payee')} fullWidth />
            <TextField size="small" label="Invoice / reference (optional)" value={form.reference} onChange={set('reference')} fullWidth />
          </Stack>
          <Button component="label" variant="outlined" startIcon={<FileIcon />} sx={{ ...btn, borderStyle: 'dashed', py: 1.5, color: PURPLE, borderColor: alpha(PURPLE, 0.5) }}>
            {file ? file.name : claim ? 'Attach the receipt (required)' : 'Attach a receipt (optional)'}
            <input hidden type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.heic" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </Button>
          {claim ? <Typography variant="caption" color="text.secondary">PDF or photo, up to 10 MB.</Typography> : null}
        </Stack>
      </InstitutionModalBody>
      <InstitutionModalFooter>
        <Button onClick={onClose} disabled={busy} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={busy || !ready} sx={{ ...btn, bgcolor: PURPLE }}>{busy ? 'Saving…' : claim ? 'Submit claim' : 'Record expense'}</Button>
      </InstitutionModalFooter>
    </InstitutionModal>
  );
}

const ACTION_TEXT = {
  approve: { title: 'Approve claim', button: 'Approve', note: 'Note (optional)', required: false },
  reject: { title: 'Reject claim', button: 'Reject', note: 'Reason (sent with the decision)', required: true },
  void: { title: 'Void expense', button: 'Void', note: 'Reason', required: true },
  withdraw: { title: 'Withdraw claim', button: 'Withdraw', note: null, required: false },
};

/** Confirm approve / reject / void / withdraw (small, centred). */
export function ExpenseActionDialog({ open, projectId, expense, action, onClose, onDone }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (open) { setNote(''); setError(''); } }, [open]);
  if (!action) return null;
  const meta = ACTION_TEXT[action];
  const run = async () => {
    setBusy(true);
    setError('');
    try {
      await send(`/api/projects/${projectId || expense.proposalId}/budget/expenses/${expense.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, note }) });
      onDone({ approve: 'Claim approved.', reject: 'Claim rejected.', void: 'Expense voided.', withdraw: 'Claim withdrawn.' }[action]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <InstitutionModal open={open} onClose={onClose} disableClose={busy} maxWidth="xs">
      <InstitutionModalHeader icon={NoteIcon} tone={action === 'approve' ? 'primary' : 'danger'} title={meta.title} subtitle={expense ? `${expense.description} · ${expense.currency} ${Number(expense.amount).toLocaleString('en-GB')}` : ''} onClose={onClose} disableClose={busy} />
      <InstitutionModalBody>
        {error ? <Alert severity="error">{error}</Alert> : null}
        {meta.note ? <TextField size="small" label={meta.note} required={meta.required} value={note} onChange={(e) => setNote(e.target.value)} fullWidth multiline minRows={2} /> : <Typography variant="body2">The claim will be removed.</Typography>}
      </InstitutionModalBody>
      <InstitutionModalFooter>
        <Button onClick={onClose} disabled={busy} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button variant="contained" color={action === 'approve' ? 'primary' : 'error'} onClick={run} disabled={busy || (meta.required && !note.trim())} sx={{ ...btn, ...(action === 'approve' ? { bgcolor: PURPLE } : {}) }}>{busy ? 'Working…' : meta.button}</Button>
      </InstitutionModalFooter>
    </InstitutionModal>
  );
}
