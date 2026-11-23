'use client';

import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControlLabel,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { CloudUpload as UploadIcon, VideoCall as VirtualIcon } from '@mui/icons-material';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
  InstitutionModalSection,
} from '@/components/GlobalAdmin/InstitutionModalShell';
import { ATTENDANCE_LABELS } from '@/lib/training-attendance';
import { decodeReport, defaultMinMinutes } from '@/lib/training-virtual-attendance';

const PURPLE = '#8b6cbc';
const STATUS_SX = {
  PRESENT: { bgcolor: '#dcfce7', color: '#166534' },
  LATE: { bgcolor: '#fef3c7', color: '#92400e' },
  ABSENT: { bgcolor: '#fee2e2', color: '#b91c1c' },
  EXCUSED: { bgcolor: '#e0f2fe', color: '#075985' },
};
const ACTION_LABEL = { set: 'Will update', keep: 'Kept (already marked)', same: 'No change' };
const formatTime = (value) => (value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—');

/**
 * Import a Zoom or Teams attendance report for one session (#94): pick the file,
 * preview who will be marked what, then apply.
 */
export default function VirtualAttendanceImportDialog({ open, trainingId, session, onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [minMinutes, setMinMinutes] = useState('');
  const [overwrite, setOverwrite] = useState(false);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setFile(null);
    setText('');
    setMinMinutes('');
    setOverwrite(false);
    setPreview(null);
    setError('');
  };

  const close = () => {
    if (busy) return;
    reset();
    onClose?.();
  };

  const offsetMinutes = session ? new Date(session.startsAt).getTimezoneOffset() : 0;

  const request = async (commit, overrides = {}) => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/training/${trainingId}/sessions/${session.id}/attendance/import`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: overrides.text ?? text,
          offsetMinutes,
          minMinutes: (overrides.minMinutes ?? minMinutes) === '' ? undefined : Number(overrides.minMinutes ?? minMinutes),
          overwrite: overrides.overwrite ?? overwrite,
          commit,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Import failed');
      if (commit) {
        onImported?.(json);
        reset();
        onClose?.();
      } else {
        setPreview(json);
        if (minMinutes === '') setMinMinutes(String(json.summary.minMinutes));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const pickFile = async (event) => {
    const picked = event.target.files?.[0];
    event.target.value = '';
    if (!picked) return;
    if (picked.size > 2 * 1024 * 1024) {
      setError('The report is too large (2 MB max)');
      return;
    }
    const decoded = decodeReport(new Uint8Array(await picked.arrayBuffer()));
    setFile(picked);
    setText(decoded);
    setPreview(null);
    await request(false, { text: decoded });
  };

  const summary = preview?.summary;

  return (
    <InstitutionModal open={open} onClose={close} disableClose={busy} maxWidth="md">
      <InstitutionModalHeader
        icon={VirtualIcon}
        title="Import online attendance"
        subtitle={session ? `${session.title} · Zoom or Microsoft Teams attendance report` : ''}
        onClose={close}
        disableClose={busy}
      />
      <InstitutionModalBody>
        {error ? <Alert severity="error" sx={{ borderRadius: 1.5 }}>{error}</Alert> : null}

        <InstitutionModalSection title="Report">
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
            <Button component="label" variant="outlined" startIcon={<UploadIcon />} disabled={busy} sx={{ borderColor: PURPLE, color: PURPLE, textTransform: 'none', fontWeight: 700 }}>
              {file ? file.name : 'Choose CSV / TSV report'}
              <input hidden type="file" accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values" onChange={pickFile} />
            </Button>
            <Typography variant="caption" color="text.secondary">
              Zoom: Reports → Usage → Participants → Export. Teams: meeting → Attendance → Download. Times are read in your time zone.
            </Typography>
          </Stack>
        </InstitutionModalSection>

        {preview ? (
          <>
            <InstitutionModalSection title="Rules">
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                <TextField
                  size="small"
                  type="number"
                  label="Minutes needed to count as attended"
                  value={minMinutes}
                  onChange={(e) => setMinMinutes(e.target.value)}
                  inputProps={{ min: 0, max: 1440 }}
                  helperText={session ? `Default: half the session (${defaultMinMinutes(session)} min). Joining after the late threshold marks Late.` : ''}
                  sx={{ maxWidth: 320 }}
                />
                <FormControlLabel
                  control={<Switch checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} />}
                  label={<Typography variant="body2">Overwrite existing Present / Late / Excused marks</Typography>}
                />
                <Button variant="outlined" disabled={busy} onClick={() => request(false)} sx={{ textTransform: 'none' }}>Update preview</Button>
              </Stack>
            </InstitutionModalSection>

            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
              <Chip label={`${summary.source === 'teams' ? 'Teams' : summary.source === 'zoom' ? 'Zoom' : 'CSV'} report · ${summary.rows} people`} />
              <Chip color="primary" label={`${summary.toSet} to update`} />
              {summary.kept ? <Chip label={`${summary.kept} already marked (kept)`} /> : null}
              {summary.unmatched ? <Chip color="warning" label={`${summary.unmatched} not registered`} /> : null}
              {summary.notInReport ? <Chip label={`${summary.notInReport} registered but not in report`} /> : null}
            </Stack>

            <TableContainer sx={{ maxHeight: 340, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {['Participant', 'Minutes', 'First join', 'Status', 'Result'].map((h) => <TableCell key={h} sx={{ fontWeight: 800 }}>{h}</TableCell>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.matched.map((row) => (
                    <TableRow key={row.registrationId}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.name || row.email}</Typography>
                        <Typography variant="caption" color="text.secondary">{row.email}</Typography>
                      </TableCell>
                      <TableCell>{row.minutes}</TableCell>
                      <TableCell>{formatTime(row.firstJoin)}</TableCell>
                      <TableCell><Chip size="small" label={ATTENDANCE_LABELS[row.status]} sx={{ fontWeight: 700, ...STATUS_SX[row.status] }} /></TableCell>
                      <TableCell>
                        <Typography variant="caption" color={row.action === 'set' ? 'primary' : 'text.secondary'} sx={{ fontWeight: 700 }}>
                          {ACTION_LABEL[row.action]}{row.existingStatus && row.action !== 'same' ? ` (was ${ATTENDANCE_LABELS[row.existingStatus]})` : ''}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {preview.unmatched.length ? (
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>In the report but not registered (ignored):</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {preview.unmatched.map((u) => `${u.name || u.email} (${u.email})`).join(', ')}
                </Typography>
              </Box>
            ) : null}
            {preview.notInReport.length ? (
              <Typography variant="caption" color="text.secondary">
                Not in the report (left unmarked; use “Mark remaining absent” afterwards if they missed it): {preview.notInReport.map((p) => p.name || p.email).join(', ')}
              </Typography>
            ) : null}
          </>
        ) : null}
      </InstitutionModalBody>
      <InstitutionModalFooter>
        <Button onClick={close} disabled={busy} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button
          variant="contained"
          disabled={busy || !preview || !summary?.toSet}
          onClick={() => request(true)}
          sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700 }}
        >
          {busy ? 'Working…' : summary ? `Apply ${summary.toSet} update${summary.toSet === 1 ? '' : 's'}` : 'Apply'}
        </Button>
      </InstitutionModalFooter>
    </InstitutionModal>
  );
}
