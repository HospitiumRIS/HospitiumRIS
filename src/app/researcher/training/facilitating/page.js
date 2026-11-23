'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  alpha,
} from '@mui/material';
import {
  Description as SheetIcon,
  FactCheck as RegisterIcon,
  Home as HomeIcon,
  QrCode2 as QrIcon,
  RecordVoiceOver as FacilitatorIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
} from '@/components/GlobalAdmin/InstitutionModalShell';
import { ATTENDANCE_LABELS, ATTENDANCE_STATUSES } from '@/lib/training-attendance';

const PURPLE = '#8b6cbc';
const STATUS_SX = {
  PRESENT: { bgcolor: '#dcfce7', color: '#166534' },
  LATE: { bgcolor: '#fef3c7', color: '#92400e' },
  ABSENT: { bgcolor: '#fee2e2', color: '#b91c1c' },
  EXCUSED: { bgcolor: '#e0f2fe', color: '#075985' },
};

const dayFmt = (v) => new Date(v).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const timeFmt = (v) => new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/** Take the register for one session (#104). Uses the same endpoints as the admin tab. */
function RegisterDialog({ target, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    if (!target) return;
    try {
      const res = await fetch(`/api/training/${target.trainingId}/sessions/${target.sessionId}/roster`, { credentials: 'include', cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Could not load the register');
      setData(json);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [target]);

  useEffect(() => {
    setData(null);
    setSearch('');
    load();
  }, [load]);

  const send = async (body) => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/training/${target.trainingId}/sessions/${target.sessionId}/attendance`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Could not save');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const rows = (data?.participants || []).filter((p) => !search.trim() || `${p.name} ${p.email}`.toLowerCase().includes(search.trim().toLowerCase()));
  const marked = (data?.participants || []).filter((p) => p.attendance).length;
  const present = (data?.participants || []).filter((p) => ['PRESENT', 'LATE'].includes(p.attendance?.status)).length;
  const cancelled = data?.session?.status === 'CANCELLED';

  return (
    <InstitutionModal open={Boolean(target)} onClose={onClose} disableClose={busy} maxWidth="md">
      <InstitutionModalHeader
        icon={RegisterIcon}
        title={data?.session?.title || 'Register'}
        subtitle={data ? `${data.training.title} · ${dayFmt(data.session.startsAt)} ${timeFmt(data.session.startsAt)}` : ''}
        onClose={onClose}
        disableClose={busy}
      />
      <InstitutionModalBody>
        {error ? <Alert severity="error" sx={{ borderRadius: 1.5 }}>{error}</Alert> : null}
        {!data && !error ? <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress sx={{ color: PURPLE }} /></Box> : null}
        {cancelled ? <Alert severity="warning">This session is cancelled, so attendance can't be taken.</Alert> : null}
        {data ? (
          <Stack spacing={1.5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
              <Typography variant="body2" sx={{ flex: 1 }}>
                <strong>{present}</strong> present or late · {marked}/{data.participants.length} marked
              </Typography>
              <TextField size="small" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
              <Button size="small" variant="outlined" disabled={busy || cancelled} onClick={() => send({ action: 'all-present' })} sx={{ borderColor: PURPLE, color: PURPLE, textTransform: 'none', fontWeight: 700 }}>
                Everyone present
              </Button>
              <Button size="small" disabled={busy || cancelled} onClick={() => send({ action: 'remaining-absent' })} sx={{ color: '#b91c1c', textTransform: 'none', fontWeight: 700 }}>
                Rest absent
              </Button>
            </Stack>
            {busy ? <LinearProgress sx={{ '& .MuiLinearProgress-bar': { bgcolor: PURPLE } }} /> : null}
            <Stack spacing={0.75}>
              {rows.map((p) => (
                <Stack key={p.registrationId} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{p.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {[p.department, p.attendance?.checkedInAt ? `checked in ${timeFmt(p.attendance.checkedInAt)}` : null, p.attendance && p.attendance.method !== 'MANUAL' ? p.attendance.method.toLowerCase().replace('_', ' ') : null].filter(Boolean).join(' · ') || p.email}
                    </Typography>
                  </Box>
                  <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={p.attendance?.status || null}
                    disabled={busy || cancelled}
                    onChange={(_, value) => send({ records: [{ registrationId: p.registrationId, status: value }] })}
                  >
                    {ATTENDANCE_STATUSES.map((s) => (
                      <ToggleButton
                        key={s}
                        value={s}
                        sx={{ textTransform: 'none', px: 1.25, '&.Mui-selected': { ...STATUS_SX[s], fontWeight: 700 } }}
                      >
                        {ATTENDANCE_LABELS[s]}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Stack>
              ))}
              {!rows.length ? <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>No participants.</Typography> : null}
            </Stack>
          </Stack>
        ) : null}
      </InstitutionModalBody>
      <InstitutionModalFooter>
        <Button onClick={onClose} disabled={busy} sx={{ textTransform: 'none' }}>Done</Button>
      </InstitutionModalFooter>
    </InstitutionModal>
  );
}

/**
 * Sessions I facilitate (#104): show the check-in screen, take the register and print the
 * sign-in sheet, for assigned sessions only.
 */
export default function FacilitatingPage() {
  const [trainings, setTrainings] = useState(null);
  const [error, setError] = useState('');
  const [view, setView] = useState('upcoming');
  const [register, setRegister] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/training/facilitating', { credentials: 'include', cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Could not load your sessions');
      setTrainings(json.trainings || []);
    } catch (err) {
      setError(err.message);
      setTrainings([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sessions = useMemo(() => {
    const now = Date.now();
    const all = (trainings || []).flatMap((t) => t.sessions.map((s) => ({ ...s, training: t })));
    const filtered = all.filter((s) => (view === 'upcoming' ? new Date(s.endsAt).getTime() >= now - 2 * 60 * 60 * 1000 : new Date(s.endsAt).getTime() < now));
    return filtered.sort((a, b) => (view === 'upcoming' ? 1 : -1) * (new Date(a.startsAt) - new Date(b.startsAt)));
  }, [trainings, view]);

  const sheet = (s) => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Nairobi';
    window.open(`/api/training/${s.training.id}/sessions/${s.id}/sign-in-sheet?tz=${encodeURIComponent(tz)}`, '_blank', 'noopener');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <PageHeader
        title="Facilitating"
        description="Sessions you run: show the check-in screen, take the register and print the sign-in sheet."
        icon={<FacilitatorIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/researcher' },
          { label: 'Training', path: '/researcher/training' },
          { label: 'Facilitating' },
        ]}
      />
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Stack spacing={2}>
          {error ? <Alert severity="error" onClose={() => setError('')}>{error}</Alert> : null}
          <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, v) => v && setView(v)} sx={{ alignSelf: 'flex-start' }}>
            <ToggleButton value="upcoming" sx={{ textTransform: 'none', px: 2 }}>Today and upcoming</ToggleButton>
            <ToggleButton value="past" sx={{ textTransform: 'none', px: 2 }}>Past</ToggleButton>
          </ToggleButtonGroup>

          {trainings === null ? <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress sx={{ color: PURPLE }} /></Box> : null}
          {trainings && !trainings.length ? (
            <Paper sx={{ p: 4, borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
              <Typography sx={{ fontWeight: 700 }}>You are not facilitating any sessions</Typography>
              <Typography variant="body2" color="text.secondary">When a training admin adds you as a facilitator, your sessions appear here.</Typography>
            </Paper>
          ) : null}
          {trainings && trainings.length && !sessions.length ? (
            <Alert severity="info">{view === 'upcoming' ? 'No upcoming sessions.' : 'No past sessions yet.'}</Alert>
          ) : null}

          {sessions.map((s) => {
            const cancelled = s.status === 'CANCELLED';
            const live = !cancelled && Date.now() >= new Date(s.startsAt).getTime() - 30 * 60 * 1000 && Date.now() <= new Date(s.endsAt).getTime() + 30 * 60 * 1000;
            return (
              <Paper key={s.id} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: live ? alpha(PURPLE, 0.6) : 'divider', opacity: cancelled ? 0.65 : 1 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
                  <Box sx={{ minWidth: 150 }}>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>{dayFmt(s.startsAt)}</Typography>
                    <Typography variant="body2" color="text.secondary">{timeFmt(s.startsAt)} – {timeFmt(s.endsAt)}</Typography>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{s.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{s.training.title}{s.venue ? ` · ${s.venue}` : ''}</Typography>
                    <Stack direction="row" spacing={0.75} sx={{ mt: 0.75, flexWrap: 'wrap', rowGap: 0.75 }}>
                      {s.role ? <Chip size="small" label={s.role} sx={{ bgcolor: alpha(PURPLE, 0.1), color: PURPLE, fontWeight: 700 }} /> : null}
                      {live ? <Chip size="small" label="Now" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 700 }} /> : null}
                      {cancelled ? <Chip size="small" label="Cancelled" sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 700 }} /> : null}
                      <Chip size="small" variant="outlined" label={`${s.present}/${s.training.participants} present`} />
                    </Stack>
                  </Box>
                  {!cancelled ? (
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                      <Button size="small" variant="contained" startIcon={<QrIcon />} onClick={() => window.open(`/researcher/training/facilitating/${s.training.id}/${s.id}/present`, '_blank', 'noopener')} sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700 }}>
                        Check-in screen
                      </Button>
                      <Button size="small" variant="outlined" startIcon={<RegisterIcon />} onClick={() => setRegister({ trainingId: s.training.id, sessionId: s.id })} sx={{ borderColor: PURPLE, color: PURPLE, textTransform: 'none', fontWeight: 700 }}>
                        Register
                      </Button>
                      <Button size="small" startIcon={<SheetIcon />} onClick={() => sheet(s)} sx={{ color: PURPLE, textTransform: 'none', fontWeight: 700 }}>
                        Sign-in sheet
                      </Button>
                    </Stack>
                  ) : null}
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      </Container>
      <RegisterDialog target={register} onClose={() => { setRegister(null); load(); }} />
    </Box>
  );
}
