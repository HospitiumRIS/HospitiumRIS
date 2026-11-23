'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  LinearProgress,
  Paper,
  Snackbar,
  Stack,
  Typography,
  alpha,
} from '@mui/material';
import {
  Assignment as ModulesIcon,
  CalendarToday as CalendarIcon,
  ChecklistRtl as ChecklistIcon,
  Description as MaterialsIcon,
  EmojiEvents as CertificateIcon,
  Event as SessionsIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  Quiz as QuizIcon,
  RateReview as FeedbackIcon,
} from '@mui/icons-material';
import { DELIVERY_MODE_LABELS } from '@/lib/training-sessions';
import { ATTENDANCE_LABELS } from '@/lib/training-attendance';
import {
  ATTENDANCE_CHIP_SX,
  CANCEL_LABELS,
  LocationText,
  PURPLE,
  StatusChip,
  asList,
  checkInOpenNow,
  enrolmentAction,
  formatDate,
  formatDateTime,
  formatRange,
  formatSessionTime,
  joinOpenNow,
} from './trainingUi';

const btn = { textTransform: 'none', fontWeight: 700 };

function Section({ icon, title, action, children }) {
  return (
    <Paper sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <Box sx={{ color: PURPLE, display: 'flex' }}>{icon}</Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, flex: 1 }}>{title}</Typography>
        {action}
      </Stack>
      {children}
    </Paper>
  );
}

function Fact({ label, children }) {
  return (
    <Paper variant="outlined" sx={{ flex: 1, minWidth: 0, p: 1.5, borderRadius: 2 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>{children}</Typography>
    </Paper>
  );
}

/**
 * The full training page for participants (#107): about, enrolment, sessions (join,
 * check in), modules (mark done), materials, assessments, feedback, completion
 * checklist and certificate.
 */
export default function TrainingDetailView({ trainingId, onLoaded }) {
  const router = useRouter();
  const [training, setTraining] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/training/${trainingId}`, { cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (response.status === 404) { setNotFound(true); return; }
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to load training');
      setTraining(data.training);
      onLoaded?.(data.training);
      if (data.training.isRegistered) {
        const res = await fetch(`/api/training/${trainingId}/assessments/mine`, { cache: 'no-store' });
        const json = await res.json().catch(() => ({}));
        setAssessments(json.success ? json.assessments || [] : []);
      } else {
        setAssessments([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load training');
    }
  // onLoaded is only a title callback; leaving it out keeps reloads to id changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainingId]);

  useEffect(() => { load(); }, [load]);

  const register = async () => {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/training/${trainingId}/register`, { method: 'POST' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to register');
      const outcome = data.registration?.status;
      setNotice(outcome === 'WAITLISTED'
        ? 'The training is full, so you are on the waiting list. We will email you if a place opens.'
        : outcome === 'PENDING_APPROVAL'
          ? 'Request sent. A place is held for you while the training team reviews it.'
          : 'You are registered.');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (!confirmCancel) { setConfirmCancel(true); return; }
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/training/${trainingId}/register`, { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.error || 'Could not cancel');
      setNotice('Done. Your place has been released.');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      setConfirmCancel(false);
    }
  };

  const toggleModule = async (moduleId, completed) => {
    setBusy(true);
    try {
      const response = await fetch(`/api/training/${trainingId}/modules/${moduleId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.error || 'Could not update the module');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (notFound) {
    return (
      <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 2, border: '1px dashed', borderColor: alpha(PURPLE, 0.3) }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Training not found</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>It may have been removed, or it isn&apos;t open to you.</Typography>
        <Button variant="contained" onClick={() => router.push('/researcher/training?tab=catalogue')} sx={{ bgcolor: PURPLE, ...btn }}>Browse trainings</Button>
      </Paper>
    );
  }
  if (!training) {
    return error
      ? <Alert severity="error">{error}</Alert>
      : <Box sx={{ py: 10, display: 'flex', justifyContent: 'center' }}><CircularProgress sx={{ color: PURPLE }} /></Box>;
  }

  const t = training;
  const reg = t.userRegistration;
  const action = !t.isRegistered ? enrolmentAction(t) : { show: false };
  const canCancel = CANCEL_LABELS[reg?.status] && reg?.source !== 'ASSIGNED' && new Date(t.startDate) > new Date();
  const certificateUrl = reg?.certificate?.status !== 'REVOKED' ? reg?.certificate?.certificateUrl : null;
  const progress = reg?.moduleProgress || [];
  const modules = t.modules || [];
  const doneCount = modules.filter((m) => progress.some((p) => p.moduleId === m.id && p.status === 'COMPLETED')).length;
  const generalMaterials = (t.materials || []).filter((item) => !item.moduleId);

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error" onClose={() => setError('')}>{error}</Alert> : null}

      {/* Header card with the main action */}
      <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'flex-start' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 0.75, mb: 1 }}>
              {reg ? <StatusChip status={reg.status} /> : null}
              {t.isMandatory ? <Chip size="small" label="Mandatory" sx={{ fontWeight: 700, bgcolor: alpha(PURPLE, 0.12), color: PURPLE }} /> : null}
              {t.code ? <Chip size="small" variant="outlined" label={t.code} /> : null}
              {t.category ? <Chip size="small" variant="outlined" label={t.category} /> : null}
              {t.cpdHours || t.cpdPoints ? <Chip size="small" label={`CPD ${[t.cpdHours ? `${t.cpdHours} h` : null, t.cpdPoints ? `${t.cpdPoints} pts` : null].filter(Boolean).join(' · ')}`} sx={{ fontWeight: 700, bgcolor: '#e0f2fe', color: '#075985' }} /> : null}
            </Stack>
            <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{t.description || 'No description available.'}</Typography>
          </Box>
          <Stack spacing={1} sx={{ minWidth: { md: 220 } }}>
            {action.show ? (
              <Button variant="contained" size="large" onClick={register} disabled={busy || action.disabled} sx={{ bgcolor: PURPLE, ...btn }}>
                {busy ? 'Sending…' : action.label}
              </Button>
            ) : null}
            {certificateUrl ? (
              <Button variant="contained" startIcon={<CertificateIcon />} onClick={() => window.open(certificateUrl, '_blank', 'noopener')} sx={{ bgcolor: PURPLE, ...btn }}>
                Download certificate
              </Button>
            ) : null}
            {canCancel ? (
              <Button color="error" onClick={cancel} disabled={busy} sx={{ textTransform: 'none' }}>
                {confirmCancel ? 'Tap again to confirm' : CANCEL_LABELS[reg.status]}
              </Button>
            ) : null}
          </Stack>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2 }}>
          <Fact label="Dates"><CalendarIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: '-2px', color: PURPLE }} />{formatRange(t.startDate, t.endDate)}</Fact>
          <Fact label="Where"><LocationIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: '-2px', color: PURPLE }} /><LocationText location={t.location} /></Fact>
          <Fact label="Places">
            <PeopleIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: '-2px', color: PURPLE }} />
            {t.remainingSlots} of {t.maxParticipants} left{t.waitlistCount ? ` · ${t.waitlistCount} waiting` : ''}
          </Fact>
        </Stack>
        {asList(t.targetGroup).length || t.department ? (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
            {t.department ? <Chip size="small" label={t.department} sx={{ bgcolor: alpha(PURPLE, 0.08), color: PURPLE, fontWeight: 700 }} /> : null}
            {asList(t.targetGroup).map((group) => <Chip key={group} size="small" variant="outlined" label={group} />)}
          </Stack>
        ) : null}
      </Paper>

      {/* Status messages */}
      {reg?.source === 'ASSIGNED' && reg?.status !== 'COMPLETED' ? (
        <Alert severity={reg.dueDate && new Date(reg.dueDate) < new Date() ? 'error' : 'info'}>
          This training was assigned to you{reg.dueDate ? `. Complete it by ${formatDate(reg.dueDate)}.` : '.'}
        </Alert>
      ) : null}
      {reg?.status === 'WAITLISTED' ? (
        <Alert severity="info">You are on the waiting list{t.myWaitlistPosition ? ` (position ${t.myWaitlistPosition})` : ''}. We will email you if a place opens.</Alert>
      ) : reg?.status === 'PENDING_APPROVAL' ? (
        <Alert severity="warning">Your request is waiting for the training team to approve it. A place is held for you meanwhile.</Alert>
      ) : reg?.status === 'REJECTED' ? (
        <Alert severity="error">Your request was not approved{reg.rejectedReason ? `: ${reg.rejectedReason}` : '.'}</Alert>
      ) : null}
      {t.eligibility && !t.eligibility.ok && !t.isRegistered ? <Alert severity="warning">{t.eligibility.reasons.join(' · ')}</Alert> : null}

      {(t.requiresApproval || t.waitlistEnabled || t.registrationClosesAt || t.registrationOpensAt || t.cancellationDeadline || t.prerequisites?.length) && !t.isRegistered ? (
        <Section icon={<ChecklistIcon />} title="Enrolment">
          <Stack spacing={0.4}>
            {t.registrationOpensAt ? <Typography variant="body2">Registration opens {formatDateTime(t.registrationOpensAt)}</Typography> : null}
            {t.registrationClosesAt ? <Typography variant="body2">Registration closes {formatDateTime(t.registrationClosesAt)}</Typography> : null}
            {t.requiresApproval ? <Typography variant="body2">Places are confirmed by the training team</Typography> : null}
            {t.waitlistEnabled ? <Typography variant="body2">Waiting list when full{t.waitlistCount ? ` (${t.waitlistCount} waiting)` : ''}</Typography> : null}
            {t.cancellationDeadline ? <Typography variant="body2">Cancel by {formatDateTime(t.cancellationDeadline)}</Typography> : null}
            {t.prerequisites?.length ? <Typography variant="body2">Requires: {t.prerequisites.map((p) => p.title).join(', ')}</Typography> : null}
          </Stack>
        </Section>
      ) : null}

      {/* Completion checklist */}
      {t.myCompletion?.hasRules ? (
        <Section icon={<ChecklistIcon />} title={reg?.status === 'COMPLETED' ? 'Completed' : reg?.status === 'NOT_COMPLETED' ? 'Not completed' : t.myCompletion.eligible ? 'On track to complete' : 'To complete this training'}>
          <Stack spacing={0.5}>
            {t.myCompletion.checks.map((c) => (
              <Typography key={c.rule} variant="body2" sx={{ color: c.met ? '#166534' : 'text.primary' }}>
                {c.met ? '✓' : '○'} {c.label} <Box component="span" sx={{ color: 'text.secondary' }}>· {c.detail}</Box>
              </Typography>
            ))}
          </Stack>
        </Section>
      ) : null}

      {/* Sessions */}
      {(t.sessions || []).length ? (
        <Section
          icon={<SessionsIcon />}
          title={`Sessions (${t.sessions.length})`}
          action={t.myAttendanceSummary?.percent !== null && t.myAttendanceSummary?.percent !== undefined ? (
            <Typography variant="caption" sx={{ fontWeight: 700, color: PURPLE }}>
              Your attendance {t.myAttendanceSummary.percent}% ({t.myAttendanceSummary.attended}/{t.myAttendanceSummary.counted})
            </Typography>
          ) : null}
        >
          <Stack spacing={1}>
            {t.sessions.map((session) => (
              <Paper key={session.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{session.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{formatSessionTime(session.startsAt, session.endsAt)}</Typography>
                    {session.facilitators?.length ? (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        With {session.facilitators.map((f) => (f.title ? `${f.name} (${f.title})` : f.name)).join(', ')}
                      </Typography>
                    ) : null}
                    {t.myFacilitatedSessionIds?.includes(session.id) ? (
                      <Button size="small" onClick={() => router.push('/researcher/training/facilitating')} sx={{ px: 0, color: PURPLE, ...btn }}>You facilitate this session</Button>
                    ) : null}
                  </Box>
                  <Box sx={{ textAlign: { sm: 'right' } }}>
                    <Stack direction="row" spacing={0.75} justifyContent={{ sm: 'flex-end' }} sx={{ flexWrap: 'wrap', rowGap: 0.75 }}>
                      {t.isRegistered && session.effective?.hasOnlineLink && session.effective?.deliveryMode !== 'IN_PERSON' && joinOpenNow(session) ? (
                        <Button size="small" variant="contained" component="a" href={`/api/training/sessions/${session.id}/join`} target="_blank" rel="noopener noreferrer" sx={{ bgcolor: '#166534', ...btn, py: 0.25, '&:hover': { bgcolor: '#14532d' } }}>
                          Join session
                        </Button>
                      ) : null}
                      {!session.myAttendance && t.isRegistered && session.effective?.deliveryMode !== 'ONLINE' && checkInOpenNow(session) ? (
                        <Button size="small" variant="contained" onClick={() => router.push('/researcher/training/check-in')} sx={{ bgcolor: PURPLE, ...btn, py: 0.25 }}>Check in</Button>
                      ) : null}
                      {session.myAttendance ? <Chip size="small" label={ATTENDANCE_LABELS[session.myAttendance.status]} sx={{ fontWeight: 700, ...ATTENDANCE_CHIP_SX[session.myAttendance.status] }} /> : null}
                      <Chip size="small" label={DELIVERY_MODE_LABELS[session.effective?.deliveryMode] || 'In person'} sx={{ bgcolor: alpha(PURPLE, 0.08), color: PURPLE, fontWeight: 700 }} />
                    </Stack>
                    {session.effective?.venue ? <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>{session.effective.venue}</Typography> : null}
                    {session.effective?.hasOnlineLink && !session.effective?.onlineLink ? (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>Meeting link shown after you register</Typography>
                    ) : null}
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Section>
      ) : null}

      {/* Modules */}
      <Section
        icon={<ModulesIcon />}
        title={`Modules${modules.length ? ` (${modules.length})` : ''}`}
        action={reg && modules.length ? <Typography variant="caption" sx={{ fontWeight: 700, color: PURPLE }}>{doneCount}/{modules.length} done</Typography> : null}
      >
        {reg && modules.length ? (
          <LinearProgress variant="determinate" value={(doneCount / modules.length) * 100} sx={{ mb: 1.5, height: 6, borderRadius: 3, bgcolor: alpha(PURPLE, 0.12), '& .MuiLinearProgress-bar': { bgcolor: PURPLE } }} />
        ) : null}
        {modules.length ? (
          <Stack spacing={1}>
            {modules.map((module, index) => {
              const moduleMaterials = (t.materials || []).filter((item) => item.moduleId === module.id);
              const done = progress.some((p) => p.moduleId === module.id && p.status === 'COMPLETED');
              return (
                <Paper key={module.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>Module {index + 1}: {module.title}</Typography>
                    {t.isRegistered && module.completionMode === 'SELF' ? (
                      <Button size="small" variant={done ? 'outlined' : 'contained'} disabled={busy} onClick={() => toggleModule(module.id, !done)} sx={{ ...btn, py: 0.25, whiteSpace: 'nowrap', ...(done ? { color: '#166534', borderColor: '#166534' } : { bgcolor: PURPLE }) }}>
                        {done ? 'Done ✓' : 'Mark as done'}
                      </Button>
                    ) : done ? <Chip size="small" label="Done" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 700 }} /> : null}
                  </Stack>
                  {module.description ? <Typography variant="caption" color="text.secondary">{module.description}</Typography> : null}
                  {moduleMaterials.map((material) => (
                    <Stack key={material.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                      <Typography variant="body2">{material.name}</Typography>
                      {material.fileUrl ? <Button size="small" onClick={() => window.open(material.fileUrl, '_blank', 'noopener')} sx={{ color: PURPLE, ...btn }}>Open</Button> : null}
                    </Stack>
                  ))}
                </Paper>
              );
            })}
          </Stack>
        ) : <Typography variant="body2" color="text.secondary">No modules have been published yet.</Typography>}
      </Section>

      {generalMaterials.length ? (
        <Section icon={<MaterialsIcon />} title="Materials">
          <Stack spacing={1}>
            {generalMaterials.map((material) => (
              <Stack key={material.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                <Typography variant="body2">{material.name}</Typography>
                {material.fileUrl ? <Button size="small" onClick={() => window.open(material.fileUrl, '_blank', 'noopener')} sx={{ color: PURPLE, ...btn }}>Open</Button> : null}
              </Stack>
            ))}
          </Stack>
        </Section>
      ) : null}

      {assessments.length ? (
        <Section icon={<QuizIcon />} title="Assessments">
          <Stack spacing={1.25}>
            {assessments.map((a) => (
              <Stack key={a.id} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{a.title}{a.isRequiredForCompletion ? ' · required' : ''}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {a.questionCount} questions · pass {a.passMark}%{a.timeLimitMinutes ? ` · ${a.timeLimitMinutes} min` : ''}
                    {a.attemptsLeft !== null ? ` · ${a.attemptsLeft} attempt(s) left` : ''}{a.best ? ` · best ${a.best.percent}%` : ''}
                  </Typography>
                </Box>
                {a.passed ? <Chip size="small" label="Passed" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 700 }} /> : null}
                {a.awaitingGrading && !a.passed ? <Chip size="small" label="Being graded" sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 700 }} /> : null}
                <Button
                  size="small"
                  variant={a.canStart && !a.passed ? 'contained' : 'text'}
                  onClick={() => router.push(`/researcher/training/assessment/${t.id}/${a.id}`)}
                  sx={a.canStart && !a.passed ? { bgcolor: PURPLE, ...btn } : { color: PURPLE, ...btn }}
                >
                  {a.openAttemptId ? 'Resume' : a.canStart && !a.attemptsUsed ? 'Start' : a.canStart && !a.passed ? 'Try again' : 'View'}
                </Button>
              </Stack>
            ))}
          </Stack>
        </Section>
      ) : null}

      {t.myFeedback?.available ? (
        <Section icon={<FeedbackIcon />} title="Feedback">
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
            <Typography variant="body2" sx={{ flex: 1 }}>
              {t.myFeedback.submittedAt ? 'Thanks for your feedback.' : t.myFeedback.unlocked ? 'Tell us how this training went: it takes about two minutes.' : 'Feedback opens when the training ends.'}
            </Typography>
            {t.myFeedback.unlocked || t.myFeedback.submittedAt ? (
              <Button size="small" variant={t.myFeedback.submittedAt ? 'text' : 'contained'} onClick={() => router.push(`/researcher/training/feedback/${t.id}`)} sx={t.myFeedback.submittedAt ? { color: PURPLE, ...btn } : { bgcolor: PURPLE, ...btn }}>
                {t.myFeedback.submittedAt ? 'View' : 'Give feedback'}
              </Button>
            ) : null}
          </Stack>
        </Section>
      ) : null}

      {reg?.certificate ? (
        <Section icon={<CertificateIcon />} title="Certificate">
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
            <Typography variant="body2" sx={{ flex: 1 }}>
              {reg.certificate.status === 'REVOKED'
                ? 'This certificate has been revoked.'
                : `${reg.certificate.certificateNumber ? `No. ${reg.certificate.certificateNumber} · ` : ''}issued ${formatDate(reg.certificate.issuedAt)}${reg.certificate.expiresAt ? ` · valid until ${formatDate(reg.certificate.expiresAt)}` : ''}`}
            </Typography>
            {certificateUrl ? <Button size="small" variant="contained" startIcon={<CertificateIcon />} onClick={() => window.open(certificateUrl, '_blank', 'noopener')} sx={{ bgcolor: PURPLE, ...btn }}>Download</Button> : null}
          </Stack>
        </Section>
      ) : null}

      <Snackbar open={Boolean(notice)} autoHideDuration={5000} onClose={() => setNotice('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setNotice('')} severity="success" sx={{ width: '100%' }}>{notice}</Alert>
      </Snackbar>
    </Stack>
  );
}
