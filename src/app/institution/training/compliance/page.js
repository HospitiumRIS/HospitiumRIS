'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Download as DownloadIcon,
  Home as HomeIcon,
  NotificationsActive as RemindIcon,
  VerifiedUser as ComplianceIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import { COMPLIANCE_LABELS } from '@/lib/training-assignment';

const PURPLE = '#8b6cbc';

const STATE_SX = {
  OVERDUE: { bgcolor: '#fee2e2', color: '#b91c1c' },
  RETRAINING_DUE: { bgcolor: '#fee2e2', color: '#b91c1c' },
  DUE_SOON: { bgcolor: '#fef3c7', color: '#92400e' },
  EXPIRING: { bgcolor: '#fef3c7', color: '#92400e' },
  ON_TRACK: { bgcolor: '#e0f2fe', color: '#075985' },
  IN_PROGRESS: { bgcolor: alpha(PURPLE, 0.1), color: PURPLE },
  COMPLETED: { bgcolor: '#dcfce7', color: '#166534' },
  WITHDRAWN: { bgcolor: '#f1f5f9', color: '#64748b' },
};
const ATTENTION_ORDER = ['OVERDUE', 'RETRAINING_DUE', 'DUE_SOON', 'EXPIRING', 'ON_TRACK', 'IN_PROGRESS', 'COMPLETED', 'WITHDRAWN'];

const fmt = (value) => (value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

function Stat({ label, value, hint, tone }) {
  return (
    <Paper sx={{ flex: 1, p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>{label}</Typography>
      <Typography variant="h4" sx={{ fontWeight: 800, color: tone || '#1e293b' }}>{value}</Typography>
      {hint ? <Typography variant="caption" color="text.secondary">{hint}</Typography> : null}
    </Paper>
  );
}

function toCsv(rows) {
  const head = ['Name', 'Email', 'Department', 'Training', 'Source', 'Due', 'Completed', 'Certificate expires', 'State'];
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = rows.map((p) => [
    p.name, p.email, p.department, p.trainingTitle, p.source, fmt(p.dueDate), fmt(p.completedAt), fmt(p.certificateExpiresAt), COMPLIANCE_LABELS[p.state],
  ].map(esc).join(','));
  return [head.map(esc).join(','), ...lines].join('\n');
}

/**
 * Training compliance (#103): mandatory and assigned trainings, assigned vs completed
 * vs overdue, and certificates that have expired (re-training due).
 */
export default function TrainingCompliancePage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [sending, setSending] = useState(false);
  const [trainingFilter, setTrainingFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('attention');
  const [deptFilter, setDeptFilter] = useState('all');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/training/compliance', { credentials: 'include' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Could not load compliance');
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sendReminders = async () => {
    setSending(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch('/api/training/compliance', { method: 'POST', credentials: 'include' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Could not send reminders');
      setNotice(json.sent ? `${json.sent} reminder(s) sent.` : 'Everyone due a reminder has already had it.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const departments = useMemo(() => [...new Set((data?.people || []).map((p) => p.department).filter(Boolean))].sort(), [data]);

  const people = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.people || [])
      .filter((p) => trainingFilter === 'all' || p.trainingId === trainingFilter)
      .filter((p) => deptFilter === 'all' || p.department === deptFilter)
      .filter((p) => {
        if (stateFilter === 'all') return true;
        if (stateFilter === 'attention') return ['OVERDUE', 'RETRAINING_DUE', 'DUE_SOON', 'EXPIRING'].includes(p.state);
        return p.state === stateFilter;
      })
      .filter((p) => !q || `${p.name} ${p.email}`.toLowerCase().includes(q))
      .sort((a, b) => ATTENTION_ORDER.indexOf(a.state) - ATTENTION_ORDER.indexOf(b.state) || (a.daysLeft ?? 0) - (b.daysLeft ?? 0));
  }, [data, trainingFilter, deptFilter, stateFilter, search]);

  const exportCsv = () => {
    const blob = new Blob([toCsv(people)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `training-compliance-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totals = data?.totals;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <PageHeader
        title="Training compliance"
        description="Who has been assigned mandatory training, who has completed it, who is overdue, and whose certificate has expired."
        icon={<ComplianceIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/institution' },
          { label: 'Training', path: '/institution/training' },
        ]}
        actionButton={(
          <Stack direction="row" spacing={1}>
            <Button variant="contained" startIcon={<RemindIcon />} onClick={sendReminders} disabled={sending} sx={{ bgcolor: 'white', color: PURPLE, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#f5f5f5' } }}>
              {sending ? 'Sending…' : 'Send due reminders'}
            </Button>
            <Button variant="contained" startIcon={<BackIcon />} onClick={() => router.push('/institution/training')} sx={{ bgcolor: 'white', color: PURPLE, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#f5f5f5' } }}>
              Back to trainings
            </Button>
          </Stack>
        )}
      />
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Stack spacing={2}>
          {error ? <Alert severity="error" onClose={() => setError('')}>{error}</Alert> : null}
          {notice ? <Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert> : null}
          {loading && !data ? <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress sx={{ color: PURPLE }} /></Box> : null}

          {totals ? (
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Stat label="Assigned or certified" value={totals.assigned} hint="People counted across trainings" />
              <Stat label="Compliant" value={totals.percentCompliant === null ? '—' : `${totals.percentCompliant}%`} hint={`${totals.completed} completed with a valid certificate`} tone="#166534" />
              <Stat label="Overdue" value={totals.overdue} hint={`${totals.dueSoon} more due within 7 days`} tone={totals.overdue ? '#b91c1c' : undefined} />
              <Stat label="Re-training due" value={totals.retrainingDue} hint={`${totals.counts?.EXPIRING || 0} certificates expire within 30 days`} tone={totals.retrainingDue ? '#b91c1c' : undefined} />
            </Stack>
          ) : null}

          {data ? (
            <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, px: 2, pt: 2 }}>By training</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(PURPLE, 0.06) }}>
                      {['Training', 'Dates', 'Assigned', 'Completed', 'Overdue', 'Due soon', 'Re-training', 'Compliance'].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.trainings.length ? data.trainings.map((t) => (
                      <TableRow key={t.id} hover selected={trainingFilter === t.id} onClick={() => setTrainingFilter(trainingFilter === t.id ? 'all' : t.id)} sx={{ cursor: 'pointer' }}>
                        <TableCell sx={{ fontWeight: 700 }}>
                          {t.title}
                          {t.isMandatory ? <Chip size="small" label="Mandatory" sx={{ ml: 1, height: 20, fontWeight: 700, bgcolor: alpha(PURPLE, 0.12), color: PURPLE }} /> : null}
                        </TableCell>
                        <TableCell>{fmt(t.startDate)}</TableCell>
                        <TableCell>{t.assigned}</TableCell>
                        <TableCell>{t.completed}</TableCell>
                        <TableCell sx={{ color: t.overdue ? '#b91c1c' : undefined, fontWeight: t.overdue ? 700 : 400 }}>{t.overdue}</TableCell>
                        <TableCell>{t.dueSoon}</TableCell>
                        <TableCell sx={{ color: t.retrainingDue ? '#b91c1c' : undefined }}>{t.retrainingDue}</TableCell>
                        <TableCell sx={{ minWidth: 140 }}>
                          {t.percentCompliant === null ? '—' : (
                            <Stack spacing={0.4}>
                              <Typography variant="caption" sx={{ fontWeight: 700 }}>{t.percentCompliant}%</Typography>
                              <LinearProgress variant="determinate" value={t.percentCompliant} sx={{ height: 6, borderRadius: 3, bgcolor: alpha(PURPLE, 0.12), '& .MuiLinearProgress-bar': { bgcolor: PURPLE } }} />
                            </Stack>
                          )}
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={8} sx={{ py: 4, textAlign: 'center' }}>
                          <Typography color="text.secondary">
                            Nothing to track yet. Mark a training as mandatory, assign it from its Registrations tab, or give its certificates a validity period.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          ) : null}

          {data ? (
            <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ p: 2 }} alignItems={{ md: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, flex: 1 }}>People</Typography>
                <TextField size="small" placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
                <TextField select size="small" label="Training" value={trainingFilter} onChange={(e) => setTrainingFilter(e.target.value)} sx={{ minWidth: 200 }}>
                  <MenuItem value="all">All trainings</MenuItem>
                  {data.trainings.map((t) => <MenuItem key={t.id} value={t.id}>{t.title}</MenuItem>)}
                </TextField>
                <TextField select size="small" label="Department" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} sx={{ minWidth: 160 }}>
                  <MenuItem value="all">All departments</MenuItem>
                  {departments.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </TextField>
                <TextField select size="small" label="Show" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} sx={{ minWidth: 180 }}>
                  <MenuItem value="attention">Needs attention</MenuItem>
                  <MenuItem value="all">Everyone</MenuItem>
                  {ATTENTION_ORDER.map((s) => <MenuItem key={s} value={s}>{COMPLIANCE_LABELS[s]}</MenuItem>)}
                </TextField>
                <Button size="small" startIcon={<DownloadIcon />} onClick={exportCsv} disabled={!people.length} sx={{ color: PURPLE, textTransform: 'none', fontWeight: 700 }}>CSV</Button>
              </Stack>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(PURPLE, 0.06) }}>
                      {['Person', 'Department', 'Training', 'Due', 'Completed', 'Certificate expires', 'State'].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {people.length ? people.slice(0, 500).map((p) => (
                      <TableRow key={p.registrationId} hover onClick={() => router.push(`/institution/training/${p.trainingId}`)} sx={{ cursor: 'pointer' }}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{p.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{p.email}</Typography>
                        </TableCell>
                        <TableCell>{p.department || '—'}</TableCell>
                        <TableCell>{p.trainingTitle}{p.source === 'ASSIGNED' ? <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Assigned</Typography> : null}</TableCell>
                        <TableCell>{fmt(p.dueDate)}</TableCell>
                        <TableCell>{fmt(p.completedAt)}</TableCell>
                        <TableCell>{fmt(p.certificateExpiresAt)}</TableCell>
                        <TableCell>
                          <Chip size="small" label={COMPLIANCE_LABELS[p.state]} sx={{ fontWeight: 700, ...STATE_SX[p.state] }} />
                          {p.state === 'OVERDUE' && p.daysLeft !== null ? <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{Math.max(1, -p.daysLeft)} day(s) late</Typography> : null}
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={7} sx={{ py: 4, textAlign: 'center' }}>
                          <Typography color="text.secondary">{stateFilter === 'attention' ? 'Nobody needs attention right now.' : 'No one matches these filters.'}</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              {people.length > 500 ? <Typography variant="caption" color="text.secondary" sx={{ p: 2, display: 'block' }}>Showing 500 of {people.length}. Narrow the filters or download the CSV for everyone.</Typography> : null}
            </Paper>
          ) : null}
        </Stack>
      </Container>
    </Box>
  );
}
