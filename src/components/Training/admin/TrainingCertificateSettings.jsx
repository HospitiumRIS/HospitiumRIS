'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { EmojiEvents as CertificateIcon, Edit as EditIcon, Visibility as PreviewIcon } from '@mui/icons-material';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
  InstitutionModalSection,
} from '@/components/GlobalAdmin/InstitutionModalShell';
import { CERTIFICATE_MODE_LABELS, CERTIFICATE_MODES } from '@/lib/certificate-template';

const PURPLE = '#8b6cbc';

function readImage(file) {
  return new Promise((resolve, reject) => {
    if (!/^image\/(png|jpeg)$/.test(file.type)) return reject(new Error('Use a PNG or JPEG image'));
    if (file.size > 290 * 1024) return reject(new Error('That image is too large (max about 290 KB)'));
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the image'));
    reader.readAsDataURL(file);
    return undefined;
  });
}

const fromTraining = (t) => ({
  certificateMode: t?.certificateMode || 'REVIEW',
  certificateTemplateId: t?.certificateTemplateId || '',
  certificatePrefix: t?.certificatePrefix || 'HRIS',
  certificateValidityMonths: t?.certificateValidityMonths ?? '',
  cpdHours: t?.cpdHours ?? '',
  cpdPoints: t?.cpdPoints ?? '',
  accreditationBody: t?.accreditationBody || '',
  accreditationNumber: t?.accreditationNumber || '',
  accreditationLogoDataUrl: t?.accreditationLogoDataUrl || null,
});

/**
 * Certificate & CPD settings of one training (#98): mode, template, number prefix,
 * validity and optional CPD / accreditation (decision D6).
 */
export default function TrainingCertificateSettings({ training, onSaved }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => fromTraining(training));
  const [templates, setTemplates] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/training/certificate-templates', { credentials: 'include' })
      .then((r) => r.json())
      .then((json) => { if (json.success) setTemplates(json.templates); })
      .catch(() => {});
  }, []);

  const templateName = templates.find((t) => t.id === training?.certificateTemplateId)?.name
    || `${templates.find((t) => t.isDefault)?.name || 'Standard design'} (default)`;

  const edit = () => {
    setDraft(fromTraining(training));
    setError('');
    setOpen(true);
  };

  const preview = async () => {
    setError('');
    const win = window.open('', '_blank');
    try {
      const res = await fetch('/api/training/certificate-templates/preview', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainingId: training.id, useTrainingTemplate: true }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Preview failed');
      const url = URL.createObjectURL(await res.blob());
      if (win) win.location.href = url;
    } catch (err) {
      if (win) win.close();
      setError(err.message);
    }
  };

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/training/${training.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...draft, certificateTemplateId: draft.certificateTemplateId || null }),
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

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const year = new Date().getFullYear();

  return (
    <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Certificate & CPD</Typography>
          <Typography variant="body2"><strong>Issuing:</strong> {CERTIFICATE_MODE_LABELS[training?.certificateMode] || CERTIFICATE_MODE_LABELS.REVIEW}</Typography>
          <Typography variant="body2"><strong>Template:</strong> {templateName}</Typography>
          <Typography variant="body2"><strong>Numbers:</strong> {training?.certificatePrefix || 'HRIS'}-{year}-000001, …</Typography>
          {training?.certificateValidityMonths ? <Typography variant="body2"><strong>Valid for:</strong> {training.certificateValidityMonths} months</Typography> : null}
          <Typography variant="body2">
            <strong>CPD:</strong> {[training?.cpdHours ? `${training.cpdHours} hours` : null, training?.cpdPoints ? `${training.cpdPoints} points` : null].filter(Boolean).join(', ') || 'None'}
          </Typography>
          {training?.accreditationBody ? (
            <Typography variant="body2"><strong>Accredited by:</strong> {training.accreditationBody}{training.accreditationNumber ? ` (${training.accreditationNumber})` : ''}</Typography>
          ) : null}
        </Box>
        <Stack spacing={1}>
          <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={edit} sx={{ borderColor: PURPLE, color: PURPLE, textTransform: 'none', fontWeight: 700 }}>Edit</Button>
          <Button size="small" startIcon={<PreviewIcon />} onClick={preview} sx={{ color: PURPLE, textTransform: 'none', fontWeight: 700 }}>Preview</Button>
        </Stack>
      </Stack>
      {error && !open ? <Alert severity="error" sx={{ mt: 1.5, borderRadius: 1.5 }}>{error}</Alert> : null}

      <InstitutionModal open={open} onClose={() => setOpen(false)} disableClose={busy} maxWidth="sm">
        <InstitutionModalHeader icon={CertificateIcon} title="Certificate & CPD" subtitle={training?.title} onClose={() => setOpen(false)} disableClose={busy} />
        <InstitutionModalBody>
          {error ? <Alert severity="error" sx={{ borderRadius: 1.5 }}>{error}</Alert> : null}
          <InstitutionModalSection title="Certificates">
            <Stack spacing={1.5}>
              <TextField select size="small" label="How certificates are issued" value={draft.certificateMode} onChange={(e) => set({ certificateMode: e.target.value })}>
                {CERTIFICATE_MODES.map((m) => <MenuItem key={m} value={m}>{CERTIFICATE_MODE_LABELS[m]}</MenuItem>)}
              </TextField>
              <TextField select size="small" label="Template" value={draft.certificateTemplateId} onChange={(e) => set({ certificateTemplateId: e.target.value })} helperText="Manage designs under Training › Certificate Templates">
                <MenuItem value="">Institution default</MenuItem>
                {templates.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}{t.isDefault ? ' (default)' : ''}</MenuItem>)}
              </TextField>
              <Stack direction="row" spacing={1.5}>
                <TextField
                  size="small"
                  label="Number prefix"
                  value={draft.certificatePrefix}
                  onChange={(e) => set({ certificatePrefix: e.target.value.toUpperCase() })}
                  helperText={`e.g. ${(draft.certificatePrefix || 'HRIS').toUpperCase()}-${year}-000001`}
                  inputProps={{ maxLength: 16 }}
                  sx={{ flex: 1 }}
                />
                <TextField size="small" type="number" label="Valid for (months)" value={draft.certificateValidityMonths} onChange={(e) => set({ certificateValidityMonths: e.target.value })} helperText="Empty = no expiry" inputProps={{ min: 1, max: 120 }} sx={{ flex: 1 }} />
              </Stack>
            </Stack>
          </InstitutionModalSection>
          <InstitutionModalSection title="CPD & accreditation (optional)">
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1.5}>
                <TextField size="small" type="number" label="CPD hours" value={draft.cpdHours} onChange={(e) => set({ cpdHours: e.target.value })} inputProps={{ min: 0, step: 0.5 }} sx={{ flex: 1 }} />
                <TextField size="small" type="number" label="CPD points" value={draft.cpdPoints} onChange={(e) => set({ cpdPoints: e.target.value })} inputProps={{ min: 0, step: 0.5 }} sx={{ flex: 1 }} />
              </Stack>
              <TextField size="small" label="Accreditation body" value={draft.accreditationBody} onChange={(e) => set({ accreditationBody: e.target.value })} placeholder="e.g. Nursing Council of Kenya" />
              <TextField size="small" label="Accreditation number" value={draft.accreditationNumber} onChange={(e) => set({ accreditationNumber: e.target.value })} />
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ width: 72, height: 44, border: '1px dashed', borderColor: 'divider', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {draft.accreditationLogoDataUrl ? <Box component="img" src={draft.accreditationLogoDataUrl} alt="" sx={{ maxWidth: '100%', maxHeight: '100%' }} /> : null}
                </Box>
                <Button component="label" size="small" variant="outlined" sx={{ textTransform: 'none' }}>
                  {draft.accreditationLogoDataUrl ? 'Change body logo' : 'Add body logo'}
                  <input hidden type="file" accept="image/png,image/jpeg" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (!file) return;
                    try { set({ accreditationLogoDataUrl: await readImage(file) }); } catch (err) { setError(err.message); }
                  }} />
                </Button>
                {draft.accreditationLogoDataUrl ? <Button size="small" color="error" onClick={() => set({ accreditationLogoDataUrl: null })} sx={{ textTransform: 'none' }}>Remove</Button> : null}
              </Stack>
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
