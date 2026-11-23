'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  IconButton,
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
  CheckCircle as MetIcon,
  Edit as EditIcon,
  FactCheck as RulesIcon,
  Gavel as OverrideIcon,
  RadioButtonUnchecked as NotMetIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
  InstitutionModalSection,
} from '@/components/GlobalAdmin/InstitutionModalShell';

const PURPLE = '#8b6cbc';
const STATUS_CHIP = {
  REGISTERED: { label: 'In progress', bg: '#f1f5f9', color: '#475569' },
  COMPLETED: { label: 'Completed', bg: '#dcfce7', color: '#166534' },
  NOT_COMPLETED: { label: 'Not completed', bg: '#fee2e2', color: '#b91c1c' },
};
const fullName = (u) => [u?.givenName, u?.familyName].filter(Boolean).join(' ') || u?.email || 'Participant';

function rulesSummary(rules) {
  if (!rules?.hasRules) return ['No rules: completion is marked by hand.'];
  const out = [];
  if (rules.minAttendancePercent) out.push(`Attend at least ${rules.minAttendancePercent}% of sessions`);
  if (rules.requireAllModules) out.push('Complete all required modules');
  if (rules.requireAssessmentPass) out.push('Pass the required assessment');
  if (rules.requireFeedback) out.push('Submit the feedback form');
  return out;
}

function Checklist({ evaluation }) {
  if (!evaluation?.hasRules) return <Typography variant="caption" color="text.secondary">Manual</Typography>;
  return (
    <Stack spacing={0.25}>
      {evaluation.checks.map((c) => (
        <Stack key={c.rule} direction="row" spacing={0.75} alignItems="center">
          {c.met ? <MetIcon sx={{ fontSize: 16, color: '#16a34a' }} /> : <NotMetIcon sx={{ fontSize: 16, color: '#94a3b8' }} />}
          <Typography variant="caption" sx={{ color: c.met ? 'text.primary' : 'text.secondary' }}>
            {c.label} <Box component="span" sx={{ color: 'text.secondary' }}>· {c.detail}</Box>
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

/**
 * Completion rules and every participant's progress against them (#96).
 */
export default function TrainingCompletionTab({ trainingId, training, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [rulesOpen, setRulesOpen] = useState(false);
  const [rulesDraft, setRulesDraft] = useState(null);
  const [override, setOverride] = useState(null); // { participant, type, reason }

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/training/${trainingId}/completion`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load completion');
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

  const counts = useMemo(() => {
    const list = data?.participants || [];
    return {
      total: list.length,
      completed: list.filter((p) => p.status === 'COMPLETED').length,
      notCompleted: list.filter((p) => p.status === 'NOT_COMPLETED').length,
      eligible: list.filter((p) => p.status === 'REGISTERED' && p.evaluation?.eligible).length,
    };
  }, [data]);

  const openRules = () => {
    const r = data?.rules || {};
    setRulesDraft({
      useAttendance: Boolean(r.minAttendancePercent),
      minAttendancePercent: r.minAttendancePercent || 80,
      requireAllModules: Boolean(r.requireAllModules),
      completionGraceDays: r.completionGraceDays ?? 7,
    });
    setRulesOpen(true);
  };

  const saveRules = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/training/${trainingId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minAttendancePercent: rulesDraft.useAttendance ? Number(rulesDraft.minAttendancePercent) : null,
          requireAllModules: rulesDraft.requireAllModules,
          completionGraceDays: Number(rulesDraft.completionGraceDays),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to save rules');
      setRulesOpen(false);
      setNotice('Completion rules saved. Everyone has been re-evaluated.');
      await load();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const reevaluate = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/training/${trainingId}/completion`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to re-evaluate');
      setData(json);
      const s = json.summary;
      setNotice(`Re-evaluated ${s.evaluated} participant(s): ${s.completed} newly completed, ${s.notCompleted} not completed, ${s.reopened} reopened.`);
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const saveOverride = async (type, participant, reason) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/training/${trainingId}/registrations/${participant.registrationId}/override`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, reason }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Override failed');
      setOverride(null);
      setNotice(type === 'CLEAR' ? `${fullName(participant.user)} is back on the rules.` : `${fullName(participant.user)} marked ${type === 'COMPLETE' ? 'completed' : 'not completed'}.`);
      await load();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress sx={{ color: PURPLE }} /></Box>;

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error" sx={{ borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert> : null}
      {notice ? <Alert severity="success" sx={{ borderRadius: 2 }} onClose={() => setNotice('')}>{notice}</Alert> : null}

      <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Completion rules</Typography>
            <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2.5 }}>
              {rulesSummary(data?.rules).map((line) => <Typography component="li" variant="body2" key={line}>{line}</Typography>)}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              {data?.rules?.hasRules
                ? `Participants are marked completed once the training ends and they meet the rules. Anyone still short ${data.rules.completionGraceDays} day(s) after the end is marked not completed.`
                : 'Set rules to have participants marked completed automatically when the training ends.'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <Button variant="outlined" startIcon={<EditIcon />} disabled={busy} onClick={openRules} sx={{ borderColor: PURPLE, color: PURPLE, textTransform: 'none', fontWeight: 700 }}>
              Edit rules
            </Button>
            <Button variant="contained" startIcon={<RefreshIcon />} disabled={busy || !data?.rules?.hasRules} onClick={reevaluate} sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700 }}>
              Re-evaluate now
            </Button>
          </Stack>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', rowGap: 1 }}>
          <Chip label={`${counts.total} participants`} />
          <Chip label={`${counts.completed} completed`} sx={{ bgcolor: STATUS_CHIP.COMPLETED.bg, color: STATUS_CHIP.COMPLETED.color, fontWeight: 700 }} />
          {data?.rules?.hasRules && !data?.ended ? <Chip label={`${counts.eligible} on track`} sx={{ bgcolor: alpha(PURPLE, 0.1), color: PURPLE, fontWeight: 700 }} /> : null}
          {counts.notCompleted ? <Chip label={`${counts.notCompleted} not completed`} sx={{ bgcolor: STATUS_CHIP.NOT_COMPLETED.bg, color: STATUS_CHIP.NOT_COMPLETED.color, fontWeight: 700 }} /> : null}
        </Stack>
      </Paper>

      {(data?.participants || []).length ? (
        <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(PURPLE, 0.06) }}>
                  {['Participant', 'Status', 'Checklist', ''].map((h) => <TableCell key={h} sx={{ fontWeight: 800 }}>{h}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.participants.map((p) => {
                  const chip = STATUS_CHIP[p.status] || STATUS_CHIP.REGISTERED;
                  return (
                    <TableRow key={p.registrationId} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{fullName(p.user)}</Typography>
                        <Typography variant="caption" color="text.secondary">{p.user?.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={p.status === 'REGISTERED' && p.evaluation?.eligible ? 'On track' : chip.label} sx={{ bgcolor: chip.bg, color: chip.color, fontWeight: 700 }} />
                        {p.override ? (
                          <Tooltip title={`Override: ${p.override.reason || ''}`}>
                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#92400e', fontWeight: 700 }}>Set by admin</Typography>
                          </Tooltip>
                        ) : null}
                      </TableCell>
                      <TableCell><Checklist evaluation={p.evaluation} /></TableCell>
                      <TableCell align="right">
                        <Tooltip title="Override completion">
                          <span><IconButton size="small" disabled={busy} onClick={() => setOverride({ participant: p, type: p.status === 'COMPLETED' ? 'INCOMPLETE' : 'COMPLETE', reason: '' })}><OverrideIcon fontSize="small" /></IconButton></span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : (
        <Alert severity="info" sx={{ borderRadius: 2 }}>No active participants yet.</Alert>
      )}

      <InstitutionModal open={rulesOpen} onClose={() => setRulesOpen(false)} disableClose={busy} maxWidth="sm">
        <InstitutionModalHeader icon={RulesIcon} title="Completion rules" subtitle={training?.title} onClose={() => setRulesOpen(false)} disableClose={busy} />
        {rulesDraft ? (
          <InstitutionModalBody>
            <InstitutionModalSection title="Participants complete the training when they…">
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <FormControlLabel
                    control={<Switch checked={rulesDraft.useAttendance} onChange={(e) => setRulesDraft((d) => ({ ...d, useAttendance: e.target.checked }))} />}
                    label="Attend at least"
                  />
                  <TextField
                    size="small"
                    type="number"
                    disabled={!rulesDraft.useAttendance}
                    value={rulesDraft.minAttendancePercent}
                    onChange={(e) => setRulesDraft((d) => ({ ...d, minAttendancePercent: e.target.value }))}
                    inputProps={{ min: 1, max: 100 }}
                    sx={{ width: 100 }}
                  />
                  <Typography variant="body2">% of sessions</Typography>
                </Stack>
                <FormControlLabel
                  control={<Switch checked={rulesDraft.requireAllModules} onChange={(e) => setRulesDraft((d) => ({ ...d, requireAllModules: e.target.checked }))} />}
                  label="Complete all required modules"
                />
                <Typography variant="caption" color="text.secondary">
                  Assessment and feedback rules become available when those features are added.
                </Typography>
              </Stack>
            </InstitutionModalSection>
            <InstitutionModalSection title="After the training ends">
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography variant="body2">Mark people who fall short as not completed after</Typography>
                <TextField size="small" type="number" value={rulesDraft.completionGraceDays} onChange={(e) => setRulesDraft((d) => ({ ...d, completionGraceDays: e.target.value }))} inputProps={{ min: 0, max: 90 }} sx={{ width: 90 }} />
                <Typography variant="body2">days</Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">Gives time to correct attendance or finish modules.</Typography>
            </InstitutionModalSection>
          </InstitutionModalBody>
        ) : null}
        <InstitutionModalFooter>
          <Button onClick={() => setRulesOpen(false)} disabled={busy} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={saveRules} disabled={busy} sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700 }}>{busy ? 'Saving…' : 'Save rules'}</Button>
        </InstitutionModalFooter>
      </InstitutionModal>

      <InstitutionModal open={Boolean(override)} onClose={() => setOverride(null)} disableClose={busy} maxWidth="xs">
        <InstitutionModalHeader icon={OverrideIcon} title="Override completion" subtitle={override ? fullName(override.participant.user) : ''} onClose={() => setOverride(null)} disableClose={busy} />
        {override ? (
          <InstitutionModalBody>
            <Typography variant="body2">
              The rules won&apos;t change this person&apos;s status while the override is in place. The reason is kept in the activity log.
            </Typography>
            <TextField select SelectProps={{ native: true }} size="small" label="Set to" value={override.type} onChange={(e) => setOverride((o) => ({ ...o, type: e.target.value }))}>
              <option value="COMPLETE">Completed</option>
              <option value="INCOMPLETE">Not completed</option>
            </TextField>
            <TextField label="Reason" multiline minRows={2} value={override.reason} onChange={(e) => setOverride((o) => ({ ...o, reason: e.target.value }))} inputProps={{ maxLength: 500 }} required />
            {override.participant.override ? (
              <Button onClick={() => saveOverride('CLEAR', override.participant)} disabled={busy} sx={{ alignSelf: 'flex-start', textTransform: 'none' }}>
                Remove the override and use the rules again
              </Button>
            ) : null}
          </InstitutionModalBody>
        ) : null}
        <InstitutionModalFooter>
          <Button onClick={() => setOverride(null)} disabled={busy} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={() => saveOverride(override.type, override.participant, override.reason)} disabled={busy || !override?.reason?.trim()} sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700 }}>
            {busy ? 'Saving…' : 'Save override'}
          </Button>
        </InstitutionModalFooter>
      </InstitutionModal>
    </Stack>
  );
}
