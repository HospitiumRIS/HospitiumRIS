'use client';

import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { CloudUpload as UploadIcon, DriveFolderUpload as BulkIcon } from '@mui/icons-material';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
  InstitutionModalSection,
} from '@/components/GlobalAdmin/InstitutionModalShell';
import { BULK_LIMITS, baseName, isCandidateZipEntry } from '@/lib/certificate-bulk-match';

const PURPLE = '#8b6cbc';
const BATCH_BYTES = 30 * 1024 * 1024;
const BATCH_FILES = 25;
const RESULT_CHIP = {
  matched: { label: 'Matched', bg: '#dcfce7', color: '#166534' },
  ambiguous: { label: 'Choose', bg: '#fef3c7', color: '#92400e' },
  unmatched: { label: 'No match', bg: '#fee2e2', color: '#b91c1c' },
  not_completed: { label: 'Not completed', bg: '#f1f5f9', color: '#475569' },
  duplicate: { label: 'Duplicate', bg: '#f1f5f9', color: '#475569' },
  invalid: { label: 'Not accepted', bg: '#fee2e2', color: '#b91c1c' },
};
const fullName = (u) => [u?.givenName, u?.familyName].filter(Boolean).join(' ') || u?.email;

/** Give files unique base names (a ZIP can hold a.pdf in two folders). */
function uniqueNames(entries) {
  const used = new Set();
  return entries.map(({ name, blob }) => {
    let base = baseName(name);
    if (used.has(base.toLowerCase())) {
      const dot = base.lastIndexOf('.');
      const stem = dot > 0 ? base.slice(0, dot) : base;
      const ext = dot > 0 ? base.slice(dot) : '';
      let i = 2;
      while (used.has(`${stem} (${i})${ext}`.toLowerCase())) i += 1;
      base = `${stem} (${i})${ext}`;
    }
    used.add(base.toLowerCase());
    return { name: base, blob };
  });
}

async function expandSelection(fileList) {
  const out = [];
  for (const file of fileList) {
    if (/\.zip$/i.test(file.name)) {
      const { default: JSZip } = await import('jszip');
      const zip = await JSZip.loadAsync(file);
      const entries = Object.values(zip.files).filter((e) => !e.dir && isCandidateZipEntry(e.name));
      if (out.length + entries.length > BULK_LIMITS.maxFiles) throw new Error(`Up to ${BULK_LIMITS.maxFiles} files at a time`);
      for (const entry of entries) {
        out.push({ name: entry.name, blob: await entry.async('blob') });
      }
    } else {
      out.push({ name: file.name, blob: file });
    }
  }
  return uniqueNames(out);
}

/**
 * Upload many certificate files at once (#100), matched to participants by email,
 * name, or a "file,email" CSV. Unmatched or ambiguous files can be assigned by hand.
 */
export default function BulkCertificateUploadDialog({ open, trainingId, participants, onClose, onDone }) {
  const [files, setFiles] = useState([]); // [{ name, blob }]
  const [mappingCsv, setMappingCsv] = useState('');
  const [plan, setPlan] = useState(null);
  const [manual, setManual] = useState({}); // name -> registrationId
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null); // { done, total }
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const completed = useMemo(() => (participants || []).filter((p) => p.status === 'COMPLETED'), [participants]);

  const reset = () => {
    setFiles([]);
    setMappingCsv('');
    setPlan(null);
    setManual({});
    setProgress(null);
    setError('');
    setResult(null);
  };
  const close = () => {
    if (busy) return;
    reset();
    onClose?.();
  };

  const preview = async (list, csv) => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/training/${trainingId}/certificates/bulk-upload`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'preview', files: list.map((f) => ({ name: f.name, size: f.blob.size })), mappingCsv: csv }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Could not match the files');
      setPlan(json);
      setManual({});
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const pickFiles = async (event) => {
    const list = Array.from(event.target.files || []);
    event.target.value = '';
    if (!list.length) return;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const expanded = await expandSelection(list);
      if (!expanded.length) throw new Error('No files found');
      setFiles(expanded);
      setBusy(false);
      await preview(expanded, mappingCsv);
    } catch (err) {
      setError(err.message || 'Could not read the files');
      setBusy(false);
    }
  };

  const pickMapping = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const text = await file.text();
    setMappingCsv(text);
    if (files.length) await preview(files, text);
  };

  const assignments = useMemo(() => {
    const out = {};
    for (const row of plan?.rows || []) {
      if (manual[row.name]) out[row.name] = manual[row.name];
      else if (row.result === 'matched') out[row.name] = row.registrationId;
    }
    // One file per participant.
    const seen = new Set();
    for (const [name, reg] of Object.entries(out)) {
      if (seen.has(reg)) delete out[name];
      else seen.add(reg);
    }
    return out;
  }, [plan, manual]);
  const toUpload = files.filter((f) => assignments[f.name]);

  const upload = async () => {
    setBusy(true);
    setError('');
    setProgress({ done: 0, total: toUpload.length });
    const summary = { uploaded: 0, failed: [] };
    try {
      let batch = [];
      let bytes = 0;
      const send = async () => {
        if (!batch.length) return;
        const form = new FormData();
        const assigned = {};
        for (const f of batch) {
          form.append('files', new File([f.blob], f.name, { type: f.blob.type || undefined }));
          assigned[f.name] = assignments[f.name];
        }
        form.append('assignments', JSON.stringify(assigned));
        const res = await fetch(`/api/training/${trainingId}/certificates/bulk-upload`, { method: 'POST', credentials: 'include', body: form });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) {
          summary.failed.push(...batch.map((f) => ({ name: f.name, reason: json.error || 'Upload failed' })));
        } else {
          summary.uploaded += json.uploaded;
          summary.failed.push(...json.failed);
        }
        setProgress((p) => ({ ...p, done: p.done + batch.length }));
        batch = [];
        bytes = 0;
      };
      for (const f of toUpload) {
        if (batch.length >= BATCH_FILES || bytes + f.blob.size > BATCH_BYTES) await send();
        batch.push(f);
        bytes += f.blob.size;
      }
      await send();
      setResult(summary);
      onDone?.(summary);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const counts = plan?.counts || {};

  return (
    <InstitutionModal open={open} onClose={close} disableClose={busy} maxWidth="md">
      <InstitutionModalHeader icon={BulkIcon} title="Upload certificates" subtitle="Several files or one ZIP, matched to participants" onClose={close} disableClose={busy} />
      <InstitutionModalBody>
        {error ? <Alert severity="error" sx={{ borderRadius: 1.5 }}>{error}</Alert> : null}
        {result ? (
          <Alert severity={result.failed.length ? 'warning' : 'success'} sx={{ borderRadius: 1.5 }}>
            {result.uploaded} certificate{result.uploaded === 1 ? '' : 's'} uploaded, numbered and sent.
            {result.failed.length ? (
              <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                {result.failed.slice(0, 8).map((f) => <li key={f.name}>{f.name}: {f.reason}</li>)}
              </Box>
            ) : null}
          </Alert>
        ) : null}

        <InstitutionModalSection title="Files">
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
            <Button component="label" variant="outlined" startIcon={<UploadIcon />} disabled={busy} sx={{ borderColor: PURPLE, color: PURPLE, textTransform: 'none', fontWeight: 700 }}>
              {files.length ? `${files.length} file${files.length === 1 ? '' : 's'} selected` : 'Choose files or a ZIP'}
              <input hidden multiple type="file" accept=".pdf,.png,.jpg,.jpeg,.zip,application/zip" onChange={pickFiles} />
            </Button>
            <Button component="label" size="small" disabled={busy} sx={{ textTransform: 'none' }}>
              {mappingCsv ? 'Mapping CSV loaded (change)' : 'Optional: mapping CSV (file,email)'}
              <input hidden type="file" accept=".csv,.txt,text/csv" onChange={pickMapping} />
            </Button>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            PDF, PNG or JPEG, up to 5 MB each and {BULK_LIMITS.maxFiles} files. Name files after the participant (e.g. jane.achieng@hospital.org.pdf or Jane Achieng.pdf), or add a CSV with file and email columns.
          </Typography>
        </InstitutionModalSection>

        {busy && !progress ? <LinearProgress sx={{ '& .MuiLinearProgress-bar': { bgcolor: PURPLE } }} /> : null}
        {progress ? (
          <Box>
            <LinearProgress variant="determinate" value={progress.total ? (progress.done / progress.total) * 100 : 0} sx={{ height: 6, borderRadius: 3, '& .MuiLinearProgress-bar': { bgcolor: PURPLE } }} />
            <Typography variant="caption" color="text.secondary">{progress.done} of {progress.total}</Typography>
          </Box>
        ) : null}

        {plan && !result ? (
          <>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
              {Object.entries(counts).map(([k, v]) => (
                <Chip key={k} size="small" label={`${v} ${RESULT_CHIP[k]?.label.toLowerCase() || k}`} sx={{ bgcolor: RESULT_CHIP[k]?.bg, color: RESULT_CHIP[k]?.color, fontWeight: 700 }} />
              ))}
            </Stack>
            <TableContainer sx={{ maxHeight: 340, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {['File', 'Result', 'Participant'].map((h) => <TableCell key={h} sx={{ fontWeight: 800 }}>{h}</TableCell>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {plan.rows.map((row) => {
                    const chip = RESULT_CHIP[row.result];
                    const canAssign = row.result === 'unmatched' || row.result === 'ambiguous';
                    const options = row.result === 'ambiguous' ? completed.filter((p) => row.candidates.includes(p.registrationId)) : completed;
                    const matched = completed.find((p) => p.registrationId === row.registrationId);
                    return (
                      <TableRow key={row.name}>
                        <TableCell sx={{ maxWidth: 260, wordBreak: 'break-all' }}>{row.name}</TableCell>
                        <TableCell>
                          <Chip size="small" label={chip.label} sx={{ bgcolor: chip.bg, color: chip.color, fontWeight: 700 }} />
                          {row.reason && row.result !== 'matched' ? <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{row.reason}</Typography> : null}
                        </TableCell>
                        <TableCell sx={{ minWidth: 220 }}>
                          {canAssign ? (
                            <TextField select size="small" fullWidth value={manual[row.name] || ''} onChange={(e) => setManual((m) => ({ ...m, [row.name]: e.target.value }))} label="Assign to">
                              <MenuItem value="">Skip this file</MenuItem>
                              {options.map((p) => <MenuItem key={p.registrationId} value={p.registrationId}>{fullName(p.user)} ({p.user?.email})</MenuItem>)}
                            </TextField>
                          ) : matched ? (
                            <>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{fullName(matched.user)}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {matched.user?.email}{row.replaces ? ' · replaces current certificate' : ''}
                              </Typography>
                            </>
                          ) : '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : null}
      </InstitutionModalBody>
      <InstitutionModalFooter>
        <Button onClick={close} disabled={busy} sx={{ textTransform: 'none' }}>{result ? 'Close' : 'Cancel'}</Button>
        {!result ? (
          <Button variant="contained" disabled={busy || !toUpload.length} onClick={upload} sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700 }}>
            {busy && progress ? 'Uploading…' : `Upload ${toUpload.length} certificate${toUpload.length === 1 ? '' : 's'}`}
          </Button>
        ) : null}
      </InstitutionModalFooter>
    </InstitutionModal>
  );
}
