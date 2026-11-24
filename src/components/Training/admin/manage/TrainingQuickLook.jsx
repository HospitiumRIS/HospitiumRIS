'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, LinearProgress, Stack, Typography, alpha } from '@mui/material';
import {
  CheckCircle as DoneIcon,
  ContentCopy as DuplicateIcon,
  Edit as EditIcon,
  OpenInNew as OpenIcon,
  Publish as PublishIcon,
  RadioButtonUnchecked as TodoIcon,
  School as TrainingIcon,
} from '@mui/icons-material';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
  InstitutionModalSection,
} from '@/components/GlobalAdmin/InstitutionModalShell';
import { DELIVERY_MODE_LABELS } from '@/lib/training-sessions';
import { untilLabel } from '@/lib/training-workspace';
import { AlertBadge, FillBar, PURPLE, PhaseChip, dateRange } from './ManageParts';

const btn = { textTransform: 'none', fontWeight: 700 };
const when = (v) => new Date(v).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const show = (v, s = '') => (v === null || v === undefined ? '—' : `${v}${s}`);

function Figure({ label, value }) {
  return (
    <Box sx={{ p: 1.25, borderRadius: 1.5, bgcolor: PURPLE, color: 'white' }}>
      <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 700 }}>{label}</Typography>
      <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>{value}</Typography>
    </Box>
  );
}

/**
 * Right-side summary of one training from the list (#144): facts, figures, next steps and
 * the next session, with the main actions. Opening the workspace is one click away.
 */
export default function TrainingQuickLook({ row, onClose, onOpen, onAction }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!row) return undefined;
    let alive = true;
    setData(null);
    setError('');
    fetch(`/api/training/${row.id}/overview`, { credentials: 'include', cache: 'no-store' })
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => { if (alive) { if (!ok || !j.success) setError(j.error || 'Could not load'); else setData(j); } })
      .catch(() => alive && setError('Could not load'));
    return () => { alive = false; };
  }, [row]);

  const act = (key) => { onClose(); onAction(key, row); };
  const s = data?.stats;
  const n = data?.nextSession;
  const todo = data?.checklist?.items?.filter((i) => !i.done) || [];

  return (
    <InstitutionModal open={Boolean(row)} onClose={onClose} maxWidth="sm" variant="panel">
      <InstitutionModalHeader icon={TrainingIcon} title={row?.title || ''} subtitle={row ? [dateRange(row.startDate, row.endDate), DELIVERY_MODE_LABELS[row.deliveryMode], row.venue].filter(Boolean).join(' · ') : ''} onClose={onClose} />
      <InstitutionModalBody dense>
        {row ? (
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <PhaseChip phase={row.phase} />
            <AlertBadge row={row} />
            <Typography variant="caption" color="text.secondary">{[row.code, row.category, row.department].filter(Boolean).join(' · ')}</Typography>
          </Stack>
        ) : null}
        {error ? <Alert severity="error">{error}</Alert> : null}
        {!data && !error ? <Box sx={{ py: 5, textAlign: 'center' }}><CircularProgress size={26} sx={{ color: PURPLE }} /></Box> : null}
        {s ? (
          <>
            <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <Figure label="Places" value={`${s.seated}/${s.capacity}`} />
              <Figure label="Attendance" value={show(s.attendance, '%')} />
              <Figure label="Completion" value={show(s.completionRate, '%')} />
              <Figure label="Certificates" value={show(s.certificates)} />
            </Box>
            <FillBar row={row} />

            <InstitutionModalSection title={`Next steps · ${data.checklist.done} of ${data.checklist.total} done`}>
              <LinearProgress variant="determinate" value={data.checklist.percent} sx={{ height: 5, borderRadius: 3, mb: 1, bgcolor: alpha(PURPLE, 0.12), '& .MuiLinearProgress-bar': { bgcolor: PURPLE } }} />
              {todo.length ? (
                <Stack spacing={0.5}>
                  {todo.slice(0, 6).map((i) => (
                    <Stack key={i.key} direction="row" spacing={1} alignItems="flex-start">
                      <TodoIcon sx={{ fontSize: 17, color: i.optional ? '#cbd5e1' : '#94a3b8', mt: 0.25 }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{i.label}{i.optional ? ' (optional)' : ''}</Typography>
                        <Typography variant="caption" color="text.secondary">{i.detail}</Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Stack direction="row" spacing={1} alignItems="center"><DoneIcon sx={{ color: '#16a34a', fontSize: 18 }} /><Typography variant="body2">Everything is in place.</Typography></Stack>
              )}
            </InstitutionModalSection>

            <InstitutionModalSection title="Next session">
              {n ? (
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{n.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{when(n.startsAt)} · {n.state === 'live' ? 'live now' : untilLabel(n.minutesUntil)}</Typography>
                </Box>
              ) : <Typography variant="body2" color="text.secondary">{data.sessionsTotal ? 'All sessions have taken place.' : 'No sessions scheduled.'}</Typography>}
            </InstitutionModalSection>

            {data.recentActivity.length ? (
              <InstitutionModalSection title="Recent activity">
                <Stack spacing={0.5}>
                  {data.recentActivity.slice(0, 4).map((a) => (
                    <Typography key={a.id} variant="body2">{a.label} <Typography component="span" variant="caption" color="text.secondary">· {a.actor} · {new Date(a.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Typography></Typography>
                  ))}
                </Stack>
              </InstitutionModalSection>
            ) : null}
          </>
        ) : null}
      </InstitutionModalBody>
      <InstitutionModalFooter>
        <Button startIcon={<EditIcon />} onClick={() => act('edit')} sx={{ ...btn, color: PURPLE }}>Edit</Button>
        <Button startIcon={<DuplicateIcon />} onClick={() => act('duplicate')} sx={{ ...btn, color: PURPLE }}>Duplicate</Button>
        {row?.phase === 'draft' ? <Button startIcon={<PublishIcon />} onClick={() => act('publish')} sx={{ ...btn, color: PURPLE }}>Publish</Button> : null}
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" endIcon={<OpenIcon />} onClick={() => { onClose(); onOpen(row); }} sx={{ ...btn, bgcolor: PURPLE }}>Open workspace</Button>
      </InstitutionModalFooter>
    </InstitutionModal>
  );
}
