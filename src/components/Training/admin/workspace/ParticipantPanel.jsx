'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  LinearProgress,
  Stack,
  Typography,
  alpha,
} from '@mui/material';
import {
  CheckCircle as MetIcon,
  RadioButtonUnchecked as UnmetIcon,
  Person as PersonIcon,
  OpenInNew as OpenIcon,
} from '@mui/icons-material';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
  InstitutionModalSection,
} from '@/components/GlobalAdmin/InstitutionModalShell';

const PURPLE = '#8b6cbc';
const fmt = (v, time = false) => (v ? new Date(v).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', ...(time ? { hour: '2-digit', minute: '2-digit' } : {}) }) : '—');
const STATUS = {
  REGISTERED: ['Registered', '#e0e7ff', '#3730a3'],
  COMPLETED: ['Completed', '#dcfce7', '#166534'],
  NOT_COMPLETED: ['Not completed', '#fee2e2', '#b91c1c'],
  PENDING_APPROVAL: ['Awaiting approval', '#fef3c7', '#92400e'],
  WAITLISTED: ['Waiting list', '#fef3c7', '#92400e'],
  CANCELLED: ['Cancelled', '#f1f5f9', '#64748b'],
  REJECTED: ['Declined', '#f1f5f9', '#64748b'],
};
const ATT = { PRESENT: ['Present', '#166534'], LATE: ['Late', '#b45309'], ABSENT: ['Absent', '#b91c1c'], EXCUSED: ['Excused', '#475569'] };
const TONE = { good: '#16a34a', bad: '#dc2626', default: '#94a3b8' };

function Row({ label, children }) {
  return (
    <Stack direction="row" spacing={1} sx={{ py: 0.4 }}>
      <Typography variant="body2" color="text.secondary" sx={{ width: 120, flexShrink: 0 }}>{label}</Typography>
      <Box sx={{ minWidth: 0, flex: 1, fontSize: 14 }}>{children}</Box>
    </Stack>
  );
}

/**
 * One participant in full (right-side panel): registration, completion checklist,
 * attendance per session, modules, assessments, certificate and timeline.
 * onOpenTab(tab) jumps to a workspace section to act there.
 */
export default function ParticipantPanel({ trainingId, registrationId, onClose, onOpenTab }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!registrationId) return undefined;
    let alive = true;
    setData(null);
    setError('');
    fetch(`/api/training/${trainingId}/registrations/${registrationId}`, { credentials: 'include', cache: 'no-store' })
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (!alive) return;
        if (!ok || !j.success) setError(j.error || 'Could not load this person');
        else setData(j);
      })
      .catch(() => alive && setError('Could not load this person'));
    return () => { alive = false; };
  }, [trainingId, registrationId]);

  const status = data ? STATUS[data.registration.status] || [data.registration.status, '#f1f5f9', '#475569'] : null;
  const go = (tab) => { onClose(); onOpenTab(tab); };

  return (
    <InstitutionModal open={Boolean(registrationId)} onClose={onClose} maxWidth="sm" variant="panel">
      <InstitutionModalHeader icon={PersonIcon} title={data?.person.name || 'Participant'} subtitle={data ? [data.person.email, data.person.department].filter(Boolean).join(' · ') : 'Loading…'} onClose={onClose} />
      <InstitutionModalBody dense>
        {error ? <Alert severity="error">{error}</Alert> : null}
        {!data && !error ? <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress sx={{ color: PURPLE }} /></Box> : null}
        {data ? (
          <>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip size="small" label={status[0]} sx={{ bgcolor: status[1], color: status[2], fontWeight: 700 }} />
              {data.registration.source === 'ASSIGNED' ? <Chip size="small" label="Assigned" sx={{ bgcolor: alpha(PURPLE, 0.12), color: PURPLE, fontWeight: 700 }} /> : null}
              {data.registration.override ? <Chip size="small" label="Completion set by hand" sx={{ fontWeight: 700 }} /> : null}
              {data.registration.exemptReason ? <Chip size="small" label={`Exempt: ${data.registration.exemptReason}`} sx={{ fontWeight: 700 }} /> : null}
            </Stack>

            <InstitutionModalSection title="Registration">
              <Row label="Registered">{fmt(data.registration.registeredAt, true)}</Row>
              {data.registration.approvedAt ? <Row label="Approved">{fmt(data.registration.approvedAt, true)}</Row> : null}
              {data.registration.dueDate ? <Row label="Due by">{fmt(data.registration.dueDate)}</Row> : null}
              {data.registration.completedAt ? <Row label={data.registration.status === 'COMPLETED' ? 'Completed' : 'Decided'}>{fmt(data.registration.completedAt, true)}</Row> : null}
              {data.registration.cancelReason || data.registration.rejectedReason ? <Row label="Reason">{data.registration.cancelReason || data.registration.rejectedReason}</Row> : null}
            </InstitutionModalSection>

            <InstitutionModalSection title="Completion">
              {data.evaluation?.hasRules ? (
                <Stack spacing={0.75}>
                  {data.evaluation.checks.map((c) => (
                    <Stack key={c.rule} direction="row" spacing={1} alignItems="flex-start">
                      {c.met ? <MetIcon sx={{ fontSize: 18, color: '#16a34a', mt: 0.2 }} /> : <UnmetIcon sx={{ fontSize: 18, color: '#94a3b8', mt: 0.2 }} />}
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{c.label}</Typography>
                        <Typography variant="caption" color="text.secondary">{c.detail}{c.missing?.length ? ` · missing: ${c.missing.join(', ')}` : ''}</Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              ) : <Typography variant="body2" color="text.secondary">No completion rules: completion is decided by hand.</Typography>}
              {data.registration.override?.reason ? <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>Override reason: {data.registration.override.reason}</Typography> : null}
            </InstitutionModalSection>

            <InstitutionModalSection title={`Attendance${data.attendance.percent !== null && data.attendance.percent !== undefined ? ` · ${data.attendance.percent}%` : ''}`}>
              {data.attendance.percent !== null && data.attendance.percent !== undefined ? (
                <LinearProgress variant="determinate" value={Math.min(100, data.attendance.percent)} sx={{ height: 6, borderRadius: 3, mb: 1.25, bgcolor: alpha(PURPLE, 0.12), '& .MuiLinearProgress-bar': { bgcolor: PURPLE } }} />
              ) : null}
              {data.attendance.sessions.length ? data.attendance.sessions.map((s) => {
                const a = s.status ? ATT[s.status] : null;
                return (
                  <Stack key={s.id} direction="row" spacing={1} justifyContent="space-between" sx={{ py: 0.5, borderBottom: '1px dashed', borderColor: 'divider' }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" noWrap>{s.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{fmt(s.startsAt, true)}{s.required ? '' : ' · optional'}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: a ? a[1] : 'text.disabled', whiteSpace: 'nowrap' }}>
                      {a ? a[0] : s.held ? 'Not marked' : 'Upcoming'}
                    </Typography>
                  </Stack>
                );
              }) : <Typography variant="body2" color="text.secondary">No sessions scheduled.</Typography>}
            </InstitutionModalSection>

            {data.modules.length ? (
              <InstitutionModalSection title={`Modules · ${data.modules.filter((m) => m.status === 'COMPLETED').length} of ${data.modules.length} done`}>
                <Stack spacing={0.5}>
                  {data.modules.map((m) => (
                    <Stack key={m.id} direction="row" spacing={1} alignItems="center">
                      {m.status === 'COMPLETED' ? <MetIcon sx={{ fontSize: 17, color: '#16a34a' }} /> : <UnmetIcon sx={{ fontSize: 17, color: m.status === 'IN_PROGRESS' ? '#d97706' : '#cbd5e1' }} />}
                      <Typography variant="body2" sx={{ flex: 1 }}>{m.title}{m.required ? '' : ' (optional)'}</Typography>
                      <Typography variant="caption" color="text.secondary">{m.status === 'COMPLETED' ? 'Done' : m.status === 'IN_PROGRESS' ? 'In progress' : 'Not started'}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </InstitutionModalSection>
            ) : null}

            <InstitutionModalSection title="Assessments and feedback">
              {data.assessments.length ? data.assessments.map((a) => (
                <Stack key={a.id} direction="row" spacing={1} justifyContent="space-between" sx={{ py: 0.4 }}>
                  <Typography variant="body2">{a.title} · attempt {a.attemptNumber}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: a.status === 'NEEDS_GRADING' ? '#b45309' : a.passed ? '#166534' : a.passed === false ? '#b91c1c' : 'text.secondary' }}>
                    {a.status === 'IN_PROGRESS' ? 'In progress' : a.status === 'NEEDS_GRADING' ? 'Needs grading' : `${Number.isFinite(a.percent) ? `${Math.round(a.percent)}% · ` : ''}${a.passed ? 'Passed' : 'Not passed'}`}
                  </Typography>
                </Stack>
              )) : <Typography variant="body2" color="text.secondary">No assessment attempts.</Typography>}
              <Typography variant="body2" sx={{ mt: 1 }}>Feedback: {data.feedbackSubmittedAt ? `submitted ${fmt(data.feedbackSubmittedAt)}` : 'not submitted'}</Typography>
            </InstitutionModalSection>

            <InstitutionModalSection title="Certificate">
              {data.certificate ? (
                <Stack spacing={0.25}>
                  <Row label="Number">{data.certificate.certificateNumber || '—'}</Row>
                  <Row label="Status">{data.certificate.status === 'REVOKED' ? `Revoked${data.certificate.revokedReason ? `: ${data.certificate.revokedReason}` : ''}` : 'Issued'}</Row>
                  <Row label="Issued">{fmt(data.certificate.issuedAt)}</Row>
                  {data.certificate.expiresAt ? <Row label="Expires">{fmt(data.certificate.expiresAt)}</Row> : null}
                  {data.certificate.certificateUrl ? (
                    <Box><Button size="small" startIcon={<OpenIcon />} onClick={() => window.open(data.certificate.certificateUrl, '_blank', 'noopener')} sx={{ color: PURPLE, textTransform: 'none', fontWeight: 700, px: 0 }}>Open certificate</Button></Box>
                  ) : null}
                </Stack>
              ) : <Typography variant="body2" color="text.secondary">No certificate yet.</Typography>}
            </InstitutionModalSection>

            <InstitutionModalSection title="History">
              {data.timeline.length ? (
                <Stack spacing={0}>
                  {data.timeline.map((e, i) => (
                    <Stack key={`${e.at}-${i}`} direction="row" spacing={1.25}>
                      <Stack alignItems="center" sx={{ width: 10 }}>
                        <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: TONE[e.tone] || TONE.default, mt: 0.7 }} />
                        {i < data.timeline.length - 1 ? <Box sx={{ flex: 1, width: 2, bgcolor: 'divider' }} /> : null}
                      </Stack>
                      <Box sx={{ pb: 1.25 }}>
                        <Typography variant="body2">{e.label}</Typography>
                        <Typography variant="caption" color="text.secondary">{fmt(e.at, true)}</Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              ) : <Typography variant="body2" color="text.secondary">Nothing yet.</Typography>}
            </InstitutionModalSection>
          </>
        ) : null}
      </InstitutionModalBody>
      <InstitutionModalFooter>
        <Button onClick={() => go('attendance')} disabled={!data} sx={{ textTransform: 'none', color: PURPLE, fontWeight: 700 }}>Attendance</Button>
        <Button onClick={() => go('completion')} disabled={!data} sx={{ textTransform: 'none', color: PURPLE, fontWeight: 700 }}>Completion</Button>
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" onClick={onClose} sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700 }}>Done</Button>
      </InstitutionModalFooter>
    </InstitutionModal>
  );
}
