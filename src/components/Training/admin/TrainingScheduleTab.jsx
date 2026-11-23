'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  CalendarMonth as CalendarIcon,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  ContentCut as SplitIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  EventBusy as CancelIcon,
  EventAvailable as RestoreIcon,
  Event as SessionIcon,
  ViewList as ListIcon,
  QrCode2 as QrIcon,
  WarningAmber as WarningIcon,
} from '@mui/icons-material';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
  InstitutionModalSection,
} from '@/components/GlobalAdmin/InstitutionModalShell';
import TrainingFacilitatorsPanel from './TrainingFacilitatorsPanel';
import { sortFacilitators } from '@/lib/training-facilitators';
import {
  DELIVERY_MODES,
  DELIVERY_MODE_LABELS,
  SESSION_DEFAULTS,
  groupSessionsByDay,
  sessionsOutsideTraining,
} from '@/lib/training-sessions';

const PURPLE = '#8b6cbc';
const DAY_MS = 24 * 60 * 60 * 1000;

const pad = (n) => String(n).padStart(2, '0');

/** Date -> value for <input type="datetime-local"> in the browser's time zone. */
function toLocalInput(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

const formatTime = (value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const formatDay = (value) => new Date(value).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

function emptyDraft(training) {
  const start = training?.startDate ? new Date(training.startDate) : new Date();
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  return {
    title: '',
    description: '',
    startsAt: toLocalInput(start),
    endsAt: toLocalInput(end),
    deliveryMode: training?.deliveryMode || 'IN_PERSON',
    venue: '',
    onlineLink: '',
    moduleId: '',
    isAttendanceRequired: SESSION_DEFAULTS.isAttendanceRequired,
    checkInOpensMinutesBefore: SESSION_DEFAULTS.checkInOpensMinutesBefore,
    checkInClosesMinutesAfter: SESSION_DEFAULTS.checkInClosesMinutesAfter,
    lateAfterMinutes: SESSION_DEFAULTS.lateAfterMinutes,
  };
}

function draftFromSession(session) {
  return {
    title: session.title || '',
    description: session.description || '',
    startsAt: toLocalInput(session.startsAt),
    endsAt: toLocalInput(session.endsAt),
    deliveryMode: session.deliveryMode || 'IN_PERSON',
    venue: session.venue || '',
    onlineLink: session.onlineLink || '',
    moduleId: session.moduleId || '',
    isAttendanceRequired: session.isAttendanceRequired !== false,
    checkInOpensMinutesBefore: session.checkInOpensMinutesBefore,
    checkInClosesMinutesAfter: session.checkInClosesMinutesAfter,
    lateAfterMinutes: session.lateAfterMinutes,
  };
}

function SessionRow({ session, facilitators = [], onEdit, onToggleCancel, onDelete, onPresent, busy }) {
  const cancelled = session.status === 'CANCELLED';
  const where = session.effective?.deliveryMode === 'ONLINE'
    ? (session.effective?.onlineLink ? 'Online meeting' : 'Online (no link yet)')
    : [session.effective?.venue, session.effective?.deliveryMode === 'HYBRID' ? '+ online' : null].filter(Boolean).join(' ') || 'Venue not set';

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.5}
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      sx={{
        p: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.5,
        opacity: cancelled ? 0.6 : 1,
        bgcolor: cancelled ? alpha('#94a3b8', 0.06) : 'background.paper',
      }}
    >
      <Box sx={{ minWidth: 120 }}>
        <Typography variant="body2" sx={{ fontWeight: 800, textDecoration: cancelled ? 'line-through' : 'none' }}>
          {formatTime(session.startsAt)} – {formatTime(session.endsAt)}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>{session.title}</Typography>
        <Typography variant="caption" color="text.secondary">{where}</Typography>
        {facilitators.length ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Facilitated by {facilitators.map((f) => f.name).join(', ')}
          </Typography>
        ) : null}
        <Stack direction="row" spacing={0.75} sx={{ mt: 0.75, flexWrap: 'wrap', rowGap: 0.75 }}>
          <Chip size="small" label={DELIVERY_MODE_LABELS[session.deliveryMode] || session.deliveryMode} sx={{ bgcolor: alpha(PURPLE, 0.08), color: PURPLE, fontWeight: 700 }} />
          {session.module ? <Chip size="small" variant="outlined" label={`Module: ${session.module.title}`} /> : null}
          {!session.isAttendanceRequired ? <Chip size="small" variant="outlined" label="Attendance optional" /> : null}
          {cancelled ? <Chip size="small" label="Cancelled" sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 700 }} /> : null}
        </Stack>
      </Box>
      <Stack direction="row" spacing={0.5}>
        {!cancelled ? (
          <Tooltip title="Open check-in screen (QR code)"><span><IconButton size="small" disabled={busy} onClick={() => onPresent(session)}><QrIcon fontSize="small" /></IconButton></span></Tooltip>
        ) : null}
        <Tooltip title="Edit session"><span><IconButton size="small" disabled={busy} onClick={() => onEdit(session)}><EditIcon fontSize="small" /></IconButton></span></Tooltip>
        <Tooltip title={cancelled ? 'Restore session' : 'Cancel session'}>
          <span><IconButton size="small" disabled={busy} onClick={() => onToggleCancel(session)}>{cancelled ? <RestoreIcon fontSize="small" /> : <CancelIcon fontSize="small" />}</IconButton></span>
        </Tooltip>
        <Tooltip title="Delete session"><span><IconButton size="small" color="error" disabled={busy} onClick={() => onDelete(session)}><DeleteIcon fontSize="small" /></IconButton></span></Tooltip>
      </Stack>
    </Stack>
  );
}

function MonthCalendar({ sessions, month, onMonthChange, onSelect }) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const startOffset = (first.getDay() + 6) % 7; // Monday first
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(new Date(month.getFullYear(), month.getMonth(), d));
  while (cells.length % 7) cells.push(null);

  const byDay = new Map();
  for (const s of sessions) {
    const d = new Date(s.startsAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(s);
  }
  const today = new Date();

  return (
    <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <IconButton size="small" aria-label="Previous month" onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><PrevIcon /></IconButton>
        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
          {month.toLocaleDateString([], { month: 'long', year: 'numeric' })}
        </Typography>
        <IconButton size="small" aria-label="Next month" onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><NextIcon /></IconButton>
      </Stack>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 0.5 }}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <Typography key={d} variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textAlign: 'center', py: 0.5 }}>{d}</Typography>
        ))}
        {cells.map((date, i) => {
          if (!date) return <Box key={`e${i}`} />;
          const items = byDay.get(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`) || [];
          const isToday = date.toDateString() === today.toDateString();
          return (
            <Box key={date.toISOString()} sx={{ minHeight: 86, p: 0.75, border: '1px solid', borderColor: isToday ? PURPLE : 'divider', borderRadius: 1, bgcolor: items.length ? alpha(PURPLE, 0.03) : 'transparent' }}>
              <Typography variant="caption" sx={{ fontWeight: isToday ? 800 : 600, color: isToday ? PURPLE : 'text.secondary' }}>{date.getDate()}</Typography>
              <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                {items.map((s) => (
                  <Box
                    key={s.id}
                    component="button"
                    type="button"
                    onClick={() => onSelect(s)}
                    sx={{
                      textAlign: 'left',
                      border: 0,
                      cursor: 'pointer',
                      borderRadius: 0.75,
                      px: 0.75,
                      py: 0.25,
                      fontSize: 11,
                      fontWeight: 700,
                      color: s.status === 'CANCELLED' ? '#b91c1c' : 'white',
                      bgcolor: s.status === 'CANCELLED' ? '#fee2e2' : PURPLE,
                      textDecoration: s.status === 'CANCELLED' ? 'line-through' : 'none',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatTime(s.startsAt)} {s.title}
                  </Box>
                ))}
              </Stack>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}

export default function TrainingScheduleTab({ trainingId, training, modules = [], onChanged }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [view, setView] = useState('list');
  const [month, setMonth] = useState(() => {
    const d = training?.startDate ? new Date(training.startDate) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [editor, setEditor] = useState(null); // { mode: 'create'|'edit', session?, draft }
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [confirm, setConfirm] = useState(null); // { type: 'delete'|'split', session? }
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [facilitators, setFacilitators] = useState([]);

  const loadFacilitators = useCallback(async () => {
    const res = await fetch(`/api/training/${trainingId}/facilitators`, { credentials: 'include' });
    const json = await res.json().catch(() => ({}));
    if (json.success) setFacilitators(json.facilitators || []);
  }, [trainingId]);

  useEffect(() => { loadFacilitators(); }, [loadFacilitators]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/training/${trainingId}/sessions`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load sessions');
      setSessions(data.sessions || []);
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

  const groups = useMemo(() => groupSessionsByDay(sessions), [sessions]);
  const outside = useMemo(() => sessionsOutsideTraining(sessions, training), [sessions, training]);
  const multiDay = useMemo(() => {
    if (!training?.startDate || !training?.endDate) return false;
    return new Date(training.endDate) - new Date(training.startDate) > DAY_MS - 1;
  }, [training]);
  const scheduled = sessions.filter((s) => s.status === 'SCHEDULED');

  const request = async (url, options, success) => {
    setBusy(true);
    try {
      const res = await fetch(url, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...options });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data.error || 'Request failed');
      if (success) setNotice(success);
      await load();
      onChanged?.();
      return true;
    } catch (err) {
      return err.message || 'Request failed';
    } finally {
      setBusy(false);
    }
  };

  const openCreate = () => {
    setFormError('');
    setShowAdvanced(false);
    setEditor({ mode: 'create', draft: emptyDraft(training) });
  };

  const openEdit = (session) => {
    setFormError('');
    setShowAdvanced(false);
    setEditor({ mode: 'edit', session, draft: draftFromSession(session) });
  };

  const updateDraft = (patch) => setEditor((prev) => ({ ...prev, draft: { ...prev.draft, ...patch } }));

  const saveEditor = async () => {
    const { draft } = editor;
    const body = {
      ...draft,
      startsAt: fromLocalInput(draft.startsAt),
      endsAt: fromLocalInput(draft.endsAt),
      moduleId: draft.moduleId || null,
      checkInOpensMinutesBefore: Number(draft.checkInOpensMinutesBefore),
      checkInClosesMinutesAfter: Number(draft.checkInClosesMinutesAfter),
      lateAfterMinutes: Number(draft.lateAfterMinutes),
    };
    const isEdit = editor.mode === 'edit';
    const result = await request(
      isEdit ? `/api/training/${trainingId}/sessions/${editor.session.id}` : `/api/training/${trainingId}/sessions`,
      { method: isEdit ? 'PUT' : 'POST', body: JSON.stringify(body) },
      isEdit ? 'Session updated.' : 'Session added.'
    );
    if (result === true) setEditor(null);
    else setFormError(result);
  };

  const toggleCancel = async (session) => {
    const next = session.status === 'CANCELLED' ? 'SCHEDULED' : 'CANCELLED';
    const result = await request(
      `/api/training/${trainingId}/sessions/${session.id}`,
      { method: 'PUT', body: JSON.stringify({ status: next }) },
      next === 'CANCELLED' ? 'Session cancelled.' : 'Session restored.'
    );
    if (result !== true) setError(result);
  };

  const runConfirm = async () => {
    if (!confirm) return;
    const result = confirm.type === 'delete'
      ? await request(`/api/training/${trainingId}/sessions/${confirm.session.id}`, { method: 'DELETE' }, 'Session deleted.')
      : await request(`/api/training/${trainingId}/sessions/split`, { method: 'POST', body: JSON.stringify({ confirm: true }) }, 'Schedule split into daily sessions.');
    if (result !== true) setError(result);
    setConfirm(null);
  };

  const draft = editor?.draft;

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error" sx={{ borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert> : null}
      {notice ? <Alert severity="success" sx={{ borderRadius: 2 }} onClose={() => setNotice('')}>{notice}</Alert> : null}

      <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Schedule & sessions</Typography>
            <Typography variant="body2" color="text.secondary">
              {scheduled.length} scheduled session{scheduled.length === 1 ? '' : 's'}
              {sessions.length > scheduled.length ? ` · ${sessions.length - scheduled.length} cancelled` : ''}
              {' · '}Attendance is taken per session.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, v) => v && setView(v)}>
              <ToggleButton value="list" sx={{ textTransform: 'none', px: 1.5 }}><ListIcon fontSize="small" sx={{ mr: 0.5 }} />List</ToggleButton>
              <ToggleButton value="calendar" sx={{ textTransform: 'none', px: 1.5 }}><CalendarIcon fontSize="small" sx={{ mr: 0.5 }} />Calendar</ToggleButton>
            </ToggleButtonGroup>
            {multiDay ? (
              <Button variant="outlined" startIcon={<SplitIcon />} disabled={busy} onClick={() => setConfirm({ type: 'split' })} sx={{ borderColor: PURPLE, color: PURPLE, textTransform: 'none', fontWeight: 700 }}>
                Split into daily sessions
              </Button>
            ) : null}
            <Button variant="contained" startIcon={<AddIcon />} disabled={busy} onClick={openCreate} sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700 }}>
              Add session
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <TrainingFacilitatorsPanel trainingId={trainingId} training={training} sessions={sessions} facilitators={facilitators} onChanged={loadFacilitators} />

      {outside.length ? (
        <Alert severity="warning" icon={<WarningIcon />} sx={{ borderRadius: 2 }}>
          {outside.length} session{outside.length === 1 ? '' : 's'} fall{outside.length === 1 ? 's' : ''} outside the training dates. Edit {outside.length === 1 ? 'it' : 'them'}, or change the training dates.
        </Alert>
      ) : null}

      {loading ? (
        <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress sx={{ color: PURPLE }} /></Box>
      ) : view === 'calendar' ? (
        <MonthCalendar sessions={sessions} month={month} onMonthChange={setMonth} onSelect={openEdit} />
      ) : groups.length ? (
        groups.map((group) => (
          <Paper key={group.dayKey} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.25 }}>{formatDay(group.sessions[0].startsAt)}</Typography>
            <Stack spacing={1}>
              {group.sessions.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  facilitators={sortFacilitators(facilitators.filter((f) => !f.sessionId || f.sessionId === session.id))}
                  busy={busy}
                  onEdit={openEdit}
                  onToggleCancel={toggleCancel}
                  onPresent={(s) => window.open(`/institution/training/${trainingId}/sessions/${s.id}/present`, '_blank', 'noopener')}
                  onDelete={(s) => setConfirm({ type: 'delete', session: s })}
                />
              ))}
            </Stack>
          </Paper>
        ))
      ) : (
        <Alert severity="info" sx={{ borderRadius: 2 }}>No sessions yet. Add the first one to start taking attendance.</Alert>
      )}

      <InstitutionModal open={Boolean(editor)} onClose={() => setEditor(null)} disableClose={busy} maxWidth="sm">
        <InstitutionModalHeader
          icon={SessionIcon}
          title={editor?.mode === 'edit' ? 'Edit session' : 'Add session'}
          subtitle={training?.title}
          onClose={() => setEditor(null)}
          disableClose={busy}
        />
        {draft ? (
          <InstitutionModalBody>
            {formError ? <Alert severity="error" sx={{ borderRadius: 1.5 }}>{formError}</Alert> : null}
            <InstitutionModalSection title="Session">
              <Stack spacing={1.5}>
                <TextField size="small" label="Title" value={draft.title} onChange={(e) => updateDraft({ title: e.target.value })} required fullWidth placeholder="e.g. Day 1: Consent and documentation" />
                <TextField size="small" label="Description" value={draft.description} onChange={(e) => updateDraft({ description: e.target.value })} fullWidth multiline minRows={2} />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                  <TextField size="small" type="datetime-local" label="Starts" value={draft.startsAt} onChange={(e) => updateDraft({ startsAt: e.target.value })} InputLabelProps={{ shrink: true }} required />
                  <TextField size="small" type="datetime-local" label="Ends" value={draft.endsAt} onChange={(e) => updateDraft({ endsAt: e.target.value })} InputLabelProps={{ shrink: true }} required />
                </Box>
                <TextField select size="small" label="Curriculum module (optional)" value={draft.moduleId} onChange={(e) => updateDraft({ moduleId: e.target.value })} fullWidth>
                  <MenuItem value="">Not linked</MenuItem>
                  {modules.map((m) => <MenuItem key={m.id} value={m.id}>{m.title}</MenuItem>)}
                </TextField>
              </Stack>
            </InstitutionModalSection>

            <InstitutionModalSection title="Where">
              <Stack spacing={1.5}>
                <TextField select size="small" label="Delivery mode" value={draft.deliveryMode} onChange={(e) => updateDraft({ deliveryMode: e.target.value })} fullWidth>
                  {DELIVERY_MODES.map((mode) => <MenuItem key={mode} value={mode}>{DELIVERY_MODE_LABELS[mode]}</MenuItem>)}
                </TextField>
                {draft.deliveryMode !== 'ONLINE' ? (
                  <TextField size="small" label="Venue" value={draft.venue} onChange={(e) => updateDraft({ venue: e.target.value })} fullWidth helperText={training?.venue ? `Leave empty to use the training venue: ${training.venue}` : 'Leave empty to use the training venue'} />
                ) : null}
                {draft.deliveryMode !== 'IN_PERSON' ? (
                  <TextField size="small" label="Online meeting link" value={draft.onlineLink} onChange={(e) => updateDraft({ onlineLink: e.target.value })} fullWidth placeholder="https://..." helperText="Leave empty to use the training's link. Only registered participants see it." />
                ) : null}
              </Stack>
            </InstitutionModalSection>

            <InstitutionModalSection title="Attendance">
              <FormControlLabel
                control={<Switch checked={draft.isAttendanceRequired} onChange={(e) => updateDraft({ isAttendanceRequired: e.target.checked })} />}
                label="Counts towards attendance"
              />
              <Button size="small" onClick={() => setShowAdvanced((v) => !v)} sx={{ alignSelf: 'flex-start', color: PURPLE, textTransform: 'none', fontWeight: 700 }}>
                {showAdvanced ? 'Hide check-in settings' : 'Check-in settings'}
              </Button>
              <Collapse in={showAdvanced}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5, mt: 1 }}>
                  <TextField size="small" type="number" label="Opens (min before)" value={draft.checkInOpensMinutesBefore} onChange={(e) => updateDraft({ checkInOpensMinutesBefore: e.target.value })} inputProps={{ min: 0, max: 1440 }} />
                  <TextField size="small" type="number" label="Closes (min after start)" value={draft.checkInClosesMinutesAfter} onChange={(e) => updateDraft({ checkInClosesMinutesAfter: e.target.value })} inputProps={{ min: 0, max: 1440 }} />
                  <TextField size="small" type="number" label="Late after (min)" value={draft.lateAfterMinutes} onChange={(e) => updateDraft({ lateAfterMinutes: e.target.value })} inputProps={{ min: 0, max: 1440 }} />
                </Box>
              </Collapse>
            </InstitutionModalSection>
          </InstitutionModalBody>
        ) : null}
        <InstitutionModalFooter>
          <Button onClick={() => setEditor(null)} disabled={busy} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={saveEditor} disabled={busy || !draft?.title?.trim()} sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700 }}>
            {busy ? 'Saving…' : editor?.mode === 'edit' ? 'Save changes' : 'Add session'}
          </Button>
        </InstitutionModalFooter>
      </InstitutionModal>

      <InstitutionModal open={Boolean(confirm)} onClose={() => setConfirm(null)} disableClose={busy} maxWidth="xs">
        <InstitutionModalHeader
          icon={confirm?.type === 'delete' ? DeleteIcon : SplitIcon}
          tone="danger"
          title={confirm?.type === 'delete' ? 'Delete session' : 'Split into daily sessions'}
          subtitle="This action cannot be undone"
          onClose={() => setConfirm(null)}
          disableClose={busy}
        />
        <InstitutionModalBody>
          <Alert severity="warning" sx={{ borderRadius: 1.5 }}>
            {confirm?.type === 'delete'
              ? <>“{confirm?.session?.title}” on {confirm?.session ? formatDay(confirm.session.startsAt) : ''} will be removed from the schedule.</>
              : <>All {sessions.length} current session{sessions.length === 1 ? '' : 's'} will be replaced by one session per day of the training, from its start time to its end time.</>}
          </Alert>
        </InstitutionModalBody>
        <InstitutionModalFooter>
          <Button onClick={() => setConfirm(null)} disabled={busy} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={runConfirm} disabled={busy} sx={{ textTransform: 'none', fontWeight: 700 }}>
            {busy ? 'Working…' : confirm?.type === 'delete' ? 'Delete session' : 'Replace sessions'}
          </Button>
        </InstitutionModalFooter>
      </InstitutionModal>
    </Stack>
  );
}
