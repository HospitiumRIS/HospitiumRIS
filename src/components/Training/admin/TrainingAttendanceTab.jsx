'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  CheckCircle as PresentIcon,
  DoneAll as AllPresentIcon,
  EditNote as NoteIcon,
  EventNote as AttendanceIcon,
  HighlightOff as AbsentIcon,
  MoreTime as LateIcon,
  RemoveCircleOutline as ClearIcon,
  Search as SearchIcon,
  VerifiedUser as ExcusedIcon,
  PersonOff as RemainingAbsentIcon,
  QrCode2 as QrIcon,
  VideoCall as VirtualIcon,
  Download as DownloadIcon,
  UploadFile as ImportIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
} from '@/components/GlobalAdmin/InstitutionModalShell';
import { ATTENDANCE_LABELS } from '@/lib/training-attendance';
import VirtualAttendanceImportDialog from './VirtualAttendanceImportDialog';
import AttendanceSheetImportDialog from './AttendanceSheetImportDialog';

const browserTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Nairobi';
  } catch {
    return 'Africa/Nairobi';
  }
};

const PURPLE = '#8b6cbc';

const STATUS_STYLE = {
  PRESENT: { short: 'P', bg: '#dcfce7', color: '#166534', Icon: PresentIcon },
  LATE: { short: 'L', bg: '#fef3c7', color: '#92400e', Icon: LateIcon },
  ABSENT: { short: 'A', bg: '#fee2e2', color: '#b91c1c', Icon: AbsentIcon },
  EXCUSED: { short: 'E', bg: '#e0f2fe', color: '#075985', Icon: ExcusedIcon },
};

const formatShort = (value) => new Date(value).toLocaleDateString([], { day: 'numeric', month: 'short' });
const formatTime = (value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const fullName = (user) => [user?.givenName, user?.familyName].filter(Boolean).join(' ') || user?.email || 'Participant';

function rateColor(percent) {
  if (percent === null || percent === undefined) return 'text.secondary';
  if (percent >= 80) return '#166534';
  if (percent >= 50) return '#92400e';
  return '#b91c1c';
}

function Cell({ record, disabled, onOpen }) {
  const style = record ? STATUS_STYLE[record.status] : null;
  return (
    <Tooltip title={record ? `${ATTENDANCE_LABELS[record.status]}${record.method && record.method !== 'MANUAL' ? ` · ${record.method.replace('_', ' ').toLowerCase()}` : ''}${record.note ? ` · ${record.note}` : ''}` : 'Not marked'}>
      <span>
        <Box
          component="button"
          type="button"
          disabled={disabled}
          onClick={onOpen}
          aria-label={record ? ATTENDANCE_LABELS[record.status] : 'Not marked'}
          sx={{
            width: 34,
            height: 30,
            borderRadius: 1,
            border: '1px solid',
            borderColor: style ? 'transparent' : 'divider',
            bgcolor: style ? style.bg : 'transparent',
            color: style ? style.color : 'text.disabled',
            fontWeight: 800,
            fontSize: 13,
            cursor: disabled ? 'not-allowed' : 'pointer',
            position: 'relative',
            '&:hover': disabled ? {} : { outline: `2px solid ${alpha(PURPLE, 0.4)}` },
          }}
        >
          {style ? style.short : '·'}
          {record?.note ? <Box component="span" sx={{ position: 'absolute', top: 2, right: 3, width: 5, height: 5, borderRadius: '50%', bgcolor: PURPLE }} /> : null}
        </Box>
      </span>
    </Tooltip>
  );
}

export default function TrainingAttendanceTab({ trainingId, training, onTrainingChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [cellMenu, setCellMenu] = useState(null); // { anchor, session, participant, record }
  const [sessionMenu, setSessionMenu] = useState(null); // { anchor, session }
  const [noteEditor, setNoteEditor] = useState(null); // { session, participant, record, note, status }
  const [importSession, setImportSession] = useState(null);
  const [sheetImportOpen, setSheetImportOpen] = useState(false);
  const [exportMenu, setExportMenu] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/training/${trainingId}/attendance`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load attendance');
      setData(json);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [trainingId]);

  useEffect(() => {
    load();
  }, [load]);

  const recordMap = useMemo(() => {
    const map = new Map();
    for (const r of data?.records || []) map.set(`${r.sessionId}:${r.registrationId}`, r);
    return map;
  }, [data]);

  const participants = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = data?.participants || [];
    if (!term) return list;
    return list.filter((p) => `${fullName(p.user)} ${p.user?.email || ''}`.toLowerCase().includes(term));
  }, [data, search]);

  const sessions = data?.sessions || [];
  const overall = useMemo(() => {
    const values = (data?.participants || []).map((p) => p.summary.percent).filter((v) => v !== null && v !== undefined);
    if (!values.length) return null;
    return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  }, [data]);

  const send = async (sessionId, body, success) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/training/${trainingId}/sessions/${sessionId}/attendance`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) throw new Error(json.error || 'Failed to save attendance');
      if (success) setNotice(success);
      await load();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const mark = async (status) => {
    if (!cellMenu) return;
    const { session, participant } = cellMenu;
    setCellMenu(null);
    await send(session.id, { records: [{ registrationId: participant.registrationId, status }] });
  };

  const bulk = async (action) => {
    if (!sessionMenu) return;
    const { session } = sessionMenu;
    setSessionMenu(null);
    await send(
      session.id,
      { action },
      action === 'all-present' ? `Everyone marked present for “${session.title}”.` : `Unmarked participants marked absent for “${session.title}”.`
    );
  };

  const saveNote = async () => {
    const { session, participant, status, note } = noteEditor;
    const ok = await send(session.id, { records: [{ registrationId: participant.registrationId, status, note }] }, 'Note saved.');
    if (ok) setNoteEditor(null);
  };

  const toggleExcused = async (checked) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/training/${trainingId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ excludeExcusedSessions: checked }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update setting');
      setNotice(checked ? 'Excused sessions no longer count against attendance.' : 'Excused sessions now count as missed.');
      await load();
      onTrainingChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress sx={{ color: PURPLE }} /></Box>;
  }

  const held = sessions.filter((s) => s.held && s.status === 'SCHEDULED' && s.isAttendanceRequired).length;

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error" sx={{ borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert> : null}
      {notice ? <Alert severity="success" sx={{ borderRadius: 2 }} onClose={() => setNotice('')}>{notice}</Alert> : null}

      <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }}>
          <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Average attendance</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: rateColor(overall) }}>{overall === null ? '—' : `${overall}%`}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Sessions held</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>{held} / {sessions.filter((s) => s.status === 'SCHEDULED' && s.isAttendanceRequired).length}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Participants</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>{data?.participants?.length || 0}</Typography>
            </Box>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
            <FormControlLabel
              control={<Switch size="small" checked={data?.excludeExcusedSessions !== false} disabled={busy} onChange={(e) => toggleExcused(e.target.checked)} />}
              label={<Typography variant="body2">Excused sessions don&apos;t count against attendance</Typography>}
            />
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" startIcon={<DownloadIcon />} onClick={(e) => setExportMenu(e.currentTarget)} sx={{ borderColor: PURPLE, color: PURPLE, textTransform: 'none', fontWeight: 700 }}>
                Export
              </Button>
              <Button size="small" variant="outlined" startIcon={<ImportIcon />} onClick={() => setSheetImportOpen(true)} sx={{ borderColor: PURPLE, color: PURPLE, textTransform: 'none', fontWeight: 700 }}>
                Import
              </Button>
            </Stack>
            <TextField
              size="small"
              placeholder="Search participants"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> }}
              sx={{ minWidth: 220 }}
            />
          </Stack>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', rowGap: 1 }}>
          {Object.entries(STATUS_STYLE).map(([status, style]) => (
            <Chip key={status} size="small" label={`${style.short} = ${ATTENDANCE_LABELS[status]}`} sx={{ bgcolor: style.bg, color: style.color, fontWeight: 700 }} />
          ))}
          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
            Click a cell to mark it. Click a session heading for bulk actions.
          </Typography>
        </Stack>
      </Paper>

      {!sessions.length ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>Add sessions in the Schedule tab to start taking attendance.</Alert>
      ) : !(data?.participants || []).length ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>No active registrations yet.</Alert>
      ) : (
        <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 640 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, minWidth: 220, position: 'sticky', left: 0, zIndex: 3, bgcolor: 'background.paper' }}>Participant</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, minWidth: 90 }}>Attendance</TableCell>
                  {sessions.map((session) => {
                    const cancelled = session.status === 'CANCELLED';
                    return (
                      <TableCell key={session.id} align="center" sx={{ minWidth: 96, opacity: cancelled ? 0.5 : 1, p: 0.75 }}>
                        <Box
                          component="button"
                          type="button"
                          disabled={busy || cancelled}
                          onClick={(e) => setSessionMenu({ anchor: e.currentTarget, session })}
                          sx={{ border: 0, bgcolor: 'transparent', cursor: cancelled ? 'default' : 'pointer', borderRadius: 1, px: 0.5, py: 0.25, '&:hover': cancelled ? {} : { bgcolor: alpha(PURPLE, 0.08) } }}
                        >
                          <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, color: 'text.primary', textDecoration: cancelled ? 'line-through' : 'none' }}>
                            {formatShort(session.startsAt)}
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>{formatTime(session.startsAt)}</Typography>
                          <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: rateColor(session.summary.rate) }}>
                            {cancelled ? 'Cancelled' : !session.isAttendanceRequired ? 'Optional' : session.summary.rate === null ? '—' : `${session.summary.rate}%`}
                          </Typography>
                        </Box>
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableHead>
              <TableBody>
                {participants.map((participant) => (
                  <TableRow key={participant.registrationId} hover>
                    <TableCell sx={{ position: 'sticky', left: 0, zIndex: 1, bgcolor: 'background.paper' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{fullName(participant.user)}</Typography>
                      <Typography variant="caption" color="text.secondary">{participant.user?.email}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontWeight: 800, color: rateColor(participant.summary.percent) }}>
                        {participant.summary.percent === null ? '—' : `${participant.summary.percent}%`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {participant.summary.attended}/{participant.summary.counted}
                        {participant.summary.excused ? ` · ${participant.summary.excused} exc.` : ''}
                      </Typography>
                    </TableCell>
                    {sessions.map((session) => {
                      const record = recordMap.get(`${session.id}:${participant.registrationId}`);
                      return (
                        <TableCell key={session.id} align="center" sx={{ p: 0.5 }}>
                          <Cell
                            record={record}
                            disabled={busy || session.status === 'CANCELLED'}
                            onOpen={(e) => setCellMenu({ anchor: e.currentTarget, session, participant, record })}
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Menu anchorEl={cellMenu?.anchor} open={Boolean(cellMenu)} onClose={() => setCellMenu(null)} disableScrollLock>
        {cellMenu ? (
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="caption" color="text.secondary">{fullName(cellMenu.participant.user)} · {cellMenu.session.title}</Typography>
          </Box>
        ) : null}
        {Object.entries(STATUS_STYLE).map(([status, style]) => (
          <MenuItem key={status} selected={cellMenu?.record?.status === status} onClick={() => mark(status)}>
            <ListItemIcon><style.Icon fontSize="small" sx={{ color: style.color }} /></ListItemIcon>
            <ListItemText>{ATTENDANCE_LABELS[status]}</ListItemText>
          </MenuItem>
        ))}
        <Divider />
        <MenuItem
          onClick={() => {
            const { session, participant, record } = cellMenu;
            setCellMenu(null);
            setNoteEditor({ session, participant, record, status: record?.status || 'EXCUSED', note: record?.note || '' });
          }}
        >
          <ListItemIcon><NoteIcon fontSize="small" /></ListItemIcon>
          <ListItemText>{cellMenu?.record?.note ? 'Edit note…' : 'Add note…'}</ListItemText>
        </MenuItem>
        {cellMenu?.record ? (
          <MenuItem onClick={() => mark(null)}>
            <ListItemIcon><ClearIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Clear mark</ListItemText>
          </MenuItem>
        ) : null}
      </Menu>

      <Menu anchorEl={sessionMenu?.anchor} open={Boolean(sessionMenu)} onClose={() => setSessionMenu(null)} disableScrollLock>
        {sessionMenu ? (
          <Box sx={{ px: 2, py: 1, maxWidth: 280 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{sessionMenu.session.title}</Typography>
            <Typography variant="caption" color="text.secondary">
              {sessionMenu.session.summary.present} present · {sessionMenu.session.summary.late} late · {sessionMenu.session.summary.absent} absent · {sessionMenu.session.summary.excused} excused · {sessionMenu.session.summary.unmarked} unmarked
            </Typography>
          </Box>
        ) : null}
        <Divider />
        <MenuItem onClick={() => bulk('all-present')}>
          <ListItemIcon><AllPresentIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Mark everyone present</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => bulk('remaining-absent')}>
          <ListItemIcon><RemainingAbsentIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Mark remaining absent</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            const { session } = sessionMenu;
            setSessionMenu(null);
            window.open(`/institution/training/${trainingId}/sessions/${session.id}/present`, '_blank', 'noopener');
          }}
        >
          <ListItemIcon><QrIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Open check-in screen</ListItemText>
        </MenuItem>
        <MenuItem
          component="a"
          href={sessionMenu ? `/api/training/${trainingId}/sessions/${sessionMenu.session.id}/sign-in-sheet?tz=${encodeURIComponent(browserTimeZone())}` : undefined}
          target="_blank"
          rel="noopener"
          onClick={() => setSessionMenu(null)}
        >
          <ListItemIcon><PrintIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Printable sign-in sheet (PDF)</ListItemText>
        </MenuItem>
        <MenuItem
          component="a"
          href={sessionMenu ? `/api/training/${trainingId}/attendance/export?format=xlsx&sessionId=${sessionMenu.session.id}&tz=${encodeURIComponent(browserTimeZone())}` : undefined}
          onClick={() => setSessionMenu(null)}
        >
          <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Export this session (.xlsx)</ListItemText>
        </MenuItem>
        {sessionMenu?.session?.deliveryMode !== 'IN_PERSON' ? (
          <MenuItem
            onClick={() => {
              const { session } = sessionMenu;
              setSessionMenu(null);
              setImportSession(session);
            }}
          >
            <ListItemIcon><VirtualIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Import Zoom / Teams report…</ListItemText>
          </MenuItem>
        ) : null}
      </Menu>

      <Menu anchorEl={exportMenu} open={Boolean(exportMenu)} onClose={() => setExportMenu(null)} disableScrollLock>
        <MenuItem component="a" href={`/api/training/${trainingId}/attendance/export?format=xlsx&tz=${encodeURIComponent(browserTimeZone())}`} onClick={() => setExportMenu(null)}>
          <ListItemText primary="Excel (.xlsx)" secondary="All sessions; also the import template" />
        </MenuItem>
        <MenuItem component="a" href={`/api/training/${trainingId}/attendance/export?format=csv&tz=${encodeURIComponent(browserTimeZone())}`} onClick={() => setExportMenu(null)}>
          <ListItemText primary="CSV" secondary="All sessions" />
        </MenuItem>
      </Menu>

      <AttendanceSheetImportDialog
        open={sheetImportOpen}
        trainingId={trainingId}
        onClose={() => setSheetImportOpen(false)}
        onImported={async (result) => {
          setNotice(`Attendance sheet imported: ${result.written} mark${result.written === 1 ? '' : 's'} updated${result.errors?.length ? `, ${result.errors.length} row(s) skipped with errors` : ''}.`);
          await load();
        }}
      />

      <VirtualAttendanceImportDialog
        open={Boolean(importSession)}
        trainingId={trainingId}
        session={importSession}
        onClose={() => setImportSession(null)}
        onImported={async (result) => {
          setNotice(`Imported online attendance: ${result.written} participant${result.written === 1 ? '' : 's'} updated.`);
          await load();
        }}
      />

      <InstitutionModal open={Boolean(noteEditor)} onClose={() => setNoteEditor(null)} disableClose={busy} maxWidth="xs">
        <InstitutionModalHeader
          icon={AttendanceIcon}
          title="Attendance note"
          subtitle={noteEditor ? `${fullName(noteEditor.participant.user)} · ${noteEditor.session.title}` : ''}
          onClose={() => setNoteEditor(null)}
          disableClose={busy}
        />
        {noteEditor ? (
          <InstitutionModalBody>
            <TextField
              select
              size="small"
              label="Status"
              value={noteEditor.status}
              onChange={(e) => setNoteEditor((prev) => ({ ...prev, status: e.target.value }))}
            >
              {Object.keys(STATUS_STYLE).map((status) => <MenuItem key={status} value={status}>{ATTENDANCE_LABELS[status]}</MenuItem>)}
            </TextField>
            <TextField
              label="Note"
              multiline
              minRows={3}
              value={noteEditor.note}
              onChange={(e) => setNoteEditor((prev) => ({ ...prev, note: e.target.value }))}
              inputProps={{ maxLength: 500 }}
              helperText="e.g. reason for an excused absence. Visible to training admins."
            />
          </InstitutionModalBody>
        ) : null}
        <InstitutionModalFooter>
          <Button onClick={() => setNoteEditor(null)} disabled={busy} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={saveNote} disabled={busy} sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700 }}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
        </InstitutionModalFooter>
      </InstitutionModal>
    </Stack>
  );
}
