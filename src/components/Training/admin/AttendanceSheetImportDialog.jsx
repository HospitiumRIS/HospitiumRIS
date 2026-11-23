'use client';

import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  UploadFile as ImportIcon,
} from '@mui/icons-material';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
  InstitutionModalSection,
} from '@/components/GlobalAdmin/InstitutionModalShell';
import { ATTENDANCE_LABELS } from '@/lib/training-attendance';

const PURPLE = '#8b6cbc';
const browserTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Nairobi';
  } catch {
    return 'Africa/Nairobi';
  }
};

/**
 * Import a filled-in attendance sheet (#95). The template is the attendance export:
 * fill in Status (and Note), upload, review the preview, apply.
 */
export default function AttendanceSheetImportDialog({ open, trainingId, onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setFile(null);
    setPreview(null);
    setError('');
  };
  const close = () => {
    if (busy) return;
    reset();
    onClose?.();
  };

  const send = async (picked, commit) => {
    setBusy(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', picked);
      form.append('tz', browserTimeZone());
      form.append('commit', commit ? 'true' : 'false');
      const res = await fetch(`/api/training/${trainingId}/attendance/import`, { method: 'POST', credentials: 'include', body: form });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Import failed');
      if (commit) {
        onImported?.(json);
        reset();
        onClose?.();
      } else {
        setPreview(json);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const pick = (event) => {
    const picked = event.target.files?.[0];
    event.target.value = '';
    if (!picked) return;
    setFile(picked);
    setPreview(null);
    send(picked, false);
  };

  const template = `/api/training/${trainingId}/attendance/export?format=xlsx&tz=${encodeURIComponent(browserTimeZone())}`;
  const counts = preview?.counts;

  return (
    <InstitutionModal open={open} onClose={close} disableClose={busy} maxWidth="md">
      <InstitutionModalHeader
        icon={ImportIcon}
        title="Import attendance sheet"
        subtitle="Mark attendance in bulk from a spreadsheet or a typed-up paper register"
        onClose={close}
        disableClose={busy}
      />
      <InstitutionModalBody>
        {error ? <Alert severity="error" sx={{ borderRadius: 1.5 }}>{error}</Alert> : null}
        <InstitutionModalSection title="1. Get the template">
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
            <Button component="a" href={template} variant="outlined" startIcon={<DownloadIcon />} sx={{ borderColor: PURPLE, color: PURPLE, textTransform: 'none', fontWeight: 700 }}>
              Download template (.xlsx)
            </Button>
            <Typography variant="caption" color="text.secondary">
              One row per participant per session. Fill in Status: Present, Late, Absent or Excused (P / L / A / E). Empty Status leaves a mark unchanged.
            </Typography>
          </Stack>
        </InstitutionModalSection>
        <InstitutionModalSection title="2. Upload the filled-in file">
          <Button component="label" variant="outlined" startIcon={<UploadIcon />} disabled={busy} sx={{ alignSelf: 'flex-start', borderColor: PURPLE, color: PURPLE, textTransform: 'none', fontWeight: 700 }}>
            {file ? file.name : 'Choose .xlsx or .csv'}
            <input hidden type="file" accept=".xlsx,.xls,.csv" onChange={pick} />
          </Button>
        </InstitutionModalSection>

        {preview ? (
          <>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
              <Chip color="primary" label={`${counts.set} to update`} />
              <Chip label={`${counts.same} unchanged`} />
              <Chip label={`${counts.skip} without status`} />
              {counts.error ? <Chip color="error" label={`${counts.error} with errors`} /> : null}
            </Stack>
            {preview.errors.length ? (
              <Alert severity="warning" sx={{ borderRadius: 1.5 }}>
                Rows with errors are skipped:
                <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                  {preview.errors.slice(0, 8).map((e) => <li key={e.row}>Row {e.row}: {e.reason}</li>)}
                </Box>
                {preview.errors.length > 8 ? `…and ${preview.errors.length - 8} more.` : null}
              </Alert>
            ) : null}
            {preview.changes.length ? (
              <TableContainer sx={{ maxHeight: 300, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {['Row', 'Participant', 'Session', 'Change'].map((h) => <TableCell key={h} sx={{ fontWeight: 800 }}>{h}</TableCell>)}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {preview.changes.map((c) => (
                      <TableRow key={`${c.row}`}>
                        <TableCell>{c.row}</TableCell>
                        <TableCell>{c.email}</TableCell>
                        <TableCell>{c.session}</TableCell>
                        <TableCell>
                          {c.previous ? `${ATTENDANCE_LABELS[c.previous]} → ` : ''}<strong>{ATTENDANCE_LABELS[c.status]}</strong>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : null}
          </>
        ) : null}
      </InstitutionModalBody>
      <InstitutionModalFooter>
        <Button onClick={close} disabled={busy} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button
          variant="contained"
          disabled={busy || !counts?.set}
          onClick={() => send(file, true)}
          sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700 }}
        >
          {busy ? 'Working…' : counts ? `Apply ${counts.set} update${counts.set === 1 ? '' : 's'}` : 'Apply'}
        </Button>
      </InstitutionModalFooter>
    </InstitutionModal>
  );
}
