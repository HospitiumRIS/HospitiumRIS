'use client';

import React from 'react';
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
  CheckCircle as DoneIcon,
  Description as SheetIcon,
  Edit as EditIcon,
  EventAvailable as AttendanceIcon,
  History as HistoryIcon,
  RadioButtonUnchecked as TodoIcon,
  Videocam as JoinIcon,
} from '@mui/icons-material';
import { Card, KpiCard, PURPLE, btn, show } from '@/components/Training/admin/analytics/AnalyticsParts';
import TrainingCertificateSettings from '@/components/Training/admin/TrainingCertificateSettings';
import TrainingEnrolmentSettings from '@/components/Training/admin/TrainingEnrolmentSettings';
import { formatTargetGroupLabel } from '@/lib/training-admin';
import { DELIVERY_MODE_LABELS } from '@/lib/training-sessions';
import { PHASE_LABELS, untilLabel } from '@/lib/training-workspace';

const fmtDate = (v) => (v ? new Date(v).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const fmtTime = (v) => (v ? new Date(v).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '');
const ago = (v) => {
  const m = Math.round((Date.now() - new Date(v).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  if (m < 48 * 60) return `${Math.round(m / 60)} h ago`;
  return new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};
const PHASE_TONE = { draft: '#64748b', upcoming: PURPLE, running: '#16a34a', ended: '#b45309', cancelled: '#b91c1c' };

function Fact({ label, children }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</Typography>
      <Typography variant="body2" sx={{ mt: 0.25, wordBreak: 'break-word' }}>{children}</Typography>
    </Box>
  );
}

/**
 * Workspace overview: figures, next steps, next session, recent activity, details and
 * settings. Everything that needs work links to its section (onOpenTab).
 */
export default function TrainingOverview({ training, data, error, onRetry, onOpenTab, onEditDetails, onPublish, onChanged }) {
  const load = onRetry;

  const s = data?.stats;
  const c = data?.checklist;
  const n = data?.nextSession;
  const open = (tab) => (tab === 'details' ? onEditDetails() : tab === 'publish' ? onPublish() : onOpenTab(tab));
  const groups = (Array.isArray(training.targetGroup) ? training.targetGroup : [training.targetGroup]).filter(Boolean);

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error" action={<Button size="small" onClick={load}>Retry</Button>}>{error}</Alert> : null}
      {!data && !error ? <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress size={28} sx={{ color: PURPLE }} /></Box> : null}

      {s ? (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3, 1fr)', xl: 'repeat(5, 1fr)' } }}>
          <KpiCard label="Places taken" value={`${s.seated}/${s.capacity}`} hint={[s.fillRate !== null ? `${s.fillRate}% full` : null, s.waitlisted ? `${s.waitlisted} waiting` : null, s.pending ? `${s.pending} to approve` : null].filter(Boolean).join(' · ') || 'No one yet'} onClick={() => onOpenTab('registrations')} />
          <KpiCard label="Attendance" value={show(s.attendance, '%')} hint={s.attendance === null ? 'No session held yet' : 'Average across participants'} onClick={() => onOpenTab('attendance')} />
          <KpiCard label="Completion" value={show(s.completionRate, '%')} hint={s.completed + s.notCompleted ? `${s.completed} completed · ${s.notCompleted} not` : 'Decided after it ends'} onClick={() => onOpenTab('completion')} />
          <KpiCard label="Certificates" value={show(s.certificates)} hint={s.certificatesDue ? `${s.certificatesDue} still to issue` : 'Issued'} onClick={() => onOpenTab('certificates')} />
          <KpiCard label="Rating" value={s.rating === null ? '—' : `${s.rating}/5`} hint={`${s.feedbackResponses} feedback response(s)`} onClick={() => onOpenTab('feedback')} />
        </Box>
      ) : null}

      {c ? (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '3fr 2fr' }, alignItems: 'start' }}>
          <Card
            title="Next steps"
            subtitle={PHASE_LABELS[c.phase]}
            action={<Chip size="small" label={`${c.done} of ${c.total} done`} sx={{ fontWeight: 800, bgcolor: alpha(PHASE_TONE[c.phase] || PURPLE, 0.12), color: PHASE_TONE[c.phase] || PURPLE }} />}
          >
            <LinearProgress variant="determinate" value={c.percent} sx={{ height: 6, borderRadius: 3, mb: 1.5, bgcolor: alpha(PURPLE, 0.12), '& .MuiLinearProgress-bar': { bgcolor: PURPLE } }} />
            <Stack spacing={0.5}>
              {c.items.map((item) => {
                const isNext = c.next?.key === item.key;
                return (
                  <Stack
                    key={item.key}
                    direction="row"
                    spacing={1.25}
                    alignItems="center"
                    sx={{ px: 1.25, py: 0.9, borderRadius: 1.5, bgcolor: isNext ? alpha(PURPLE, 0.07) : 'transparent', border: '1px solid', borderColor: isNext ? alpha(PURPLE, 0.35) : 'transparent' }}
                  >
                    {item.done ? <DoneIcon sx={{ color: '#16a34a', fontSize: 20 }} /> : <TodoIcon sx={{ color: item.optional ? '#cbd5e1' : '#94a3b8', fontSize: 20 }} />}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: item.done ? 'text.secondary' : 'text.primary' }}>
                        {item.label}{item.optional ? <Typography component="span" variant="caption" color="text.secondary"> · optional</Typography> : null}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{item.detail}</Typography>
                    </Box>
                    {!item.done ? (
                      <Button size="small" variant={isNext ? 'contained' : 'text'} onClick={() => open(item.tab)} sx={{ ...btn, whiteSpace: 'nowrap', ...(isNext ? { bgcolor: PURPLE } : { color: PURPLE }) }}>
                        {item.tab === 'publish' ? 'Publish' : item.tab === 'details' ? 'Edit' : 'Open'}
                      </Button>
                    ) : null}
                  </Stack>
                );
              })}
            </Stack>
          </Card>

          <Stack spacing={2}>
            <Card title="Next session" subtitle={n ? `Session ${n.index} of ${data.sessionsTotal}` : null}>
              {n ? (
                <Stack spacing={1.25}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, flex: 1 }}>{n.title}</Typography>
                    <Chip size="small" label={n.state === 'live' ? 'Live now' : untilLabel(n.minutesUntil)} sx={{ fontWeight: 800, bgcolor: n.state === 'live' ? '#dcfce7' : n.state === 'today' ? '#fef3c7' : alpha(PURPLE, 0.1), color: n.state === 'live' ? '#166534' : n.state === 'today' ? '#92400e' : PURPLE }} />
                  </Stack>
                  <Typography variant="body2">{fmtDate(n.startsAt)} · {fmtTime(n.startsAt)}–{fmtTime(n.endsAt)}</Typography>
                  <Typography variant="body2" color="text.secondary">{[DELIVERY_MODE_LABELS[n.deliveryMode], n.venue].filter(Boolean).join(' · ')}</Typography>
                  {n.checkInOpen ? <Alert severity="success" sx={{ py: 0 }}>Check-in is open now.</Alert> : null}
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Button size="small" variant="contained" startIcon={<AttendanceIcon />} onClick={() => onOpenTab('attendance')} sx={{ ...btn, bgcolor: PURPLE }}>Take attendance</Button>
                    <Button size="small" variant="outlined" startIcon={<SheetIcon />} onClick={() => window.open(`/api/training/${training.id}/sessions/${n.id}/sign-in-sheet`, '_blank', 'noopener')} sx={{ ...btn, color: PURPLE, borderColor: alpha(PURPLE, 0.5) }}>Sign-in sheet</Button>
                    {n.onlineLink ? <Button size="small" variant="outlined" startIcon={<JoinIcon />} onClick={() => window.open(n.onlineLink, '_blank', 'noopener')} sx={{ ...btn, color: PURPLE, borderColor: alpha(PURPLE, 0.5) }}>Join link</Button> : null}
                  </Stack>
                </Stack>
              ) : (
                <Stack spacing={1} alignItems="flex-start">
                  <Typography variant="body2" color="text.secondary">{data.sessionsTotal ? 'All sessions have taken place.' : 'No sessions scheduled yet.'}</Typography>
                  <Button size="small" onClick={() => onOpenTab('schedule')} sx={{ ...btn, color: PURPLE, px: 0 }}>{data.sessionsTotal ? 'View schedule' : 'Schedule sessions'}</Button>
                </Stack>
              )}
            </Card>

            <Card title="Recent activity" action={<Button size="small" startIcon={<HistoryIcon />} onClick={() => onOpenTab('activity')} sx={{ ...btn, color: PURPLE }}>All</Button>}>
              {data.recentActivity.length ? (
                <Stack spacing={1}>
                  {data.recentActivity.map((a) => (
                    <Stack key={a.id} direction="row" spacing={1.25}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: alpha(PURPLE, 0.6), mt: 0.8, flexShrink: 0 }} />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{a.label}</Typography>
                        <Typography variant="caption" color="text.secondary">{a.actor} · {ago(a.at)}{a.reason ? ` · ${a.reason}` : ''}</Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              ) : <Typography variant="body2" color="text.secondary">Nothing recorded yet.</Typography>}
            </Card>
          </Stack>
        </Box>
      ) : null}

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '3fr 2fr' }, alignItems: 'start' }}>
        <Card title="About this training" action={<Button size="small" startIcon={<EditIcon />} onClick={onEditDetails} sx={{ ...btn, color: PURPLE }}>Edit details</Button>}>
          <Typography variant="body2" sx={{ color: '#334155', whiteSpace: 'pre-line', mb: 2 }}>{training.description || 'No description yet. Staff read this before they enrol.'}</Typography>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' } }}>
            <Fact label="Dates">{fmtDate(training.startDate)} – {fmtDate(training.endDate)}</Fact>
            <Fact label="Delivery">{DELIVERY_MODE_LABELS[training.deliveryMode] || 'In person'}</Fact>
            <Fact label="Venue">{training.venue || training.location || '—'}</Fact>
            {training.onlineLink ? <Fact label="Online link">{training.onlineLink}</Fact> : null}
            <Fact label="Departments">{training.department || '—'}</Fact>
            <Fact label="Audience">{groups.map(formatTargetGroupLabel).join(', ') || '—'}</Fact>
            <Fact label="Catalogue">{training.openToOtherInstitutions ? 'Open to other institutions' : 'Own institution only'}</Fact>
            {training.category ? <Fact label="Category">{training.category}</Fact> : null}
            {training.code ? <Fact label="Code">{training.code}</Fact> : null}
            <Fact label="Mandatory">{training.isMandatory ? 'Yes' : 'No'}</Fact>
          </Box>
        </Card>
        <Stack spacing={2}>
          <TrainingCertificateSettings training={training} onSaved={onChanged} />
          <TrainingEnrolmentSettings training={training} onSaved={onChanged} />
        </Stack>
      </Box>
    </Stack>
  );
}
