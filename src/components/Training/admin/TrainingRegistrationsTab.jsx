'use client';

import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  AssignmentInd as AssignIcon,
  Block as RejectIcon,
  CheckCircle as ApproveIcon,
  Download as DownloadIcon,
  KeyboardDoubleArrowUp as PromoteIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
  InstitutionModalSection,
} from '@/components/GlobalAdmin/InstitutionModalShell';
import { allowedAdminStatuses } from '@/lib/training-registration-state';
import { COMPLIANCE_LABELS, complianceState } from '@/lib/training-assignment';
import AssignTrainingDialog from './AssignTrainingDialog';

const STATE_SX = {
  OVERDUE: { bgcolor: '#fee2e2', color: '#b91c1c' },
  DUE_SOON: { bgcolor: '#fef3c7', color: '#92400e' },
  ON_TRACK: { bgcolor: '#e0f2fe', color: '#075985' },
  RETRAINING_DUE: { bgcolor: '#fee2e2', color: '#b91c1c' },
  EXPIRING: { bgcolor: '#fef3c7', color: '#92400e' },
};

const PURPLE = '#8b6cbc';

export const REGISTRATION_STATUS_LABELS = {
  PENDING_APPROVAL: 'Awaiting approval',
  WAITLISTED: 'Waiting list',
  REGISTERED: 'Registered',
  COMPLETED: 'Completed',
  NOT_COMPLETED: 'Not completed',
  REJECTED: 'Not approved',
  CANCELLED: 'Cancelled',
};

const VIEWS = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'PENDING_APPROVAL', label: 'Awaiting approval', match: (r) => r.status === 'PENDING_APPROVAL' },
  { key: 'WAITLISTED', label: 'Waiting list', match: (r) => r.status === 'WAITLISTED' },
  { key: 'enrolled', label: 'Enrolled', match: (r) => ['REGISTERED', 'COMPLETED', 'NOT_COMPLETED'].includes(r.status) },
  { key: 'closed', label: 'Cancelled / not approved', match: (r) => r.status === 'CANCELLED' || r.status === 'REJECTED' },
];

const formatDate = (value) => (value ? new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');

/**
 * Registrations tab (#102): status views with counts, waiting-list order, per-person
 * status menu, and bulk approve / reject / promote / cancel.
 */
export default function TrainingRegistrationsTab({ trainingId, training, registrations, onChanged, onUploadCertificate, onOpenPerson }) {
  const [view, setView] = useState(() => (registrations.some((r) => r.status === 'PENDING_APPROVAL') ? 'PENDING_APPROVAL' : 'all'));
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reasonDialog, setReasonDialog] = useState(null); // { action, ids, title }
  const [reason, setReason] = useState('');
  const [assignOpen, setAssignOpen] = useState(false);

  const waitlistPosition = useMemo(() => {
    const map = new Map();
    registrations
      .filter((r) => r.status === 'WAITLISTED')
      .sort((a, b) => new Date(a.registeredAt) - new Date(b.registeredAt))
      .forEach((r, i) => map.set(r.id, i + 1));
    return map;
  }, [registrations]);

  const counts = useMemo(() => Object.fromEntries(VIEWS.map((v) => [v.key, registrations.filter(v.match).length])), [registrations]);
  const current = VIEWS.find((v) => v.key === view) || VIEWS[0];
  const rows = registrations
    .filter(current.match)
    .sort((a, b) => (view === 'WAITLISTED' ? (waitlistPosition.get(a.id) || 0) - (waitlistPosition.get(b.id) || 0) : 0));
  const selectedRows = registrations.filter((r) => selected.includes(r.id));
  const seatsHeld = registrations.filter((r) => ['PENDING_APPROVAL', 'REGISTERED', 'COMPLETED', 'NOT_COMPLETED'].includes(r.status)).length;

  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const allOnPage = rows.length > 0 && rows.every((r) => selected.includes(r.id));

  const runBulk = async (action, ids, withReason = null) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch(`/api/training/${trainingId}/registrations/bulk`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, registrationIds: ids, reason: withReason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || 'Action failed');
      const failedNote = data.failed?.length ? ` ${data.failed.length} could not be changed: ${[...new Set(data.failed.map((f) => f.error))].join('; ')}` : '';
      setNotice(`${data.changed} updated.${failedNote}`);
      setSelected([]);
      await onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      setReasonDialog(null);
      setReason('');
    }
  };

  const changeOne = async (reg, status) => {
    if (status === 'REJECTED' || status === 'CANCELLED') {
      setReasonDialog({ action: status === 'REJECTED' ? 'reject' : 'cancel', ids: [reg.id], title: status === 'REJECTED' ? 'Decline request' : 'Cancel registration' });
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/training/${trainingId}/registrations/${reg.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update status');
      await onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const can = (action) => selectedRows.length > 0 && selectedRows.every((r) => {
    if (action === 'approve') return r.status === 'PENDING_APPROVAL';
    if (action === 'reject') return r.status === 'PENDING_APPROVAL';
    if (action === 'promote') return r.status === 'WAITLISTED';
    if (action === 'cancel') return allowedAdminStatuses(r.status).includes('CANCELLED');
    return false;
  });

  return (
    <Stack spacing={1.5}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }} justifyContent="space-between">
        <Typography variant="body2" color="text.secondary">
          {seatsHeld}/{training?.maxParticipants ?? 0} places held
          {training?.requiresApproval ? ' · approval required' : ''}
          {training?.waitlistEnabled ? ` · waiting list on (${counts.WAITLISTED})` : ''}
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button size="small" variant="outlined" startIcon={<AssignIcon />} onClick={() => setAssignOpen(true)} sx={{ borderColor: PURPLE, color: PURPLE, textTransform: 'none', fontWeight: 700 }}>
            Assign
          </Button>
          <Button size="small" variant="contained" startIcon={<ApproveIcon />} disabled={busy || !can('approve')} onClick={() => runBulk('approve', selected)} sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700 }}>
            Approve
          </Button>
          <Button size="small" variant="outlined" color="error" startIcon={<RejectIcon />} disabled={busy || !can('reject')} onClick={() => setReasonDialog({ action: 'reject', ids: selected, title: `Decline ${selected.length} request${selected.length === 1 ? '' : 's'}` })} sx={{ textTransform: 'none', fontWeight: 700 }}>
            Decline
          </Button>
          <Button size="small" variant="outlined" startIcon={<PromoteIcon />} disabled={busy || !can('promote')} onClick={() => runBulk('promote', selected)} sx={{ borderColor: PURPLE, color: PURPLE, textTransform: 'none', fontWeight: 700 }}>
            Offer a place
          </Button>
          <Button size="small" color="error" disabled={busy || !can('cancel')} onClick={() => setReasonDialog({ action: 'cancel', ids: selected, title: `Cancel ${selected.length} registration${selected.length === 1 ? '' : 's'}` })} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
        </Stack>
      </Stack>

      {error ? <Alert severity="error" onClose={() => setError('')}>{error}</Alert> : null}
      {notice ? <Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert> : null}

      <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Tabs value={view} onChange={(_, v) => { setView(v); setSelected([]); }} variant="scrollable" sx={{ px: 1, borderBottom: '1px solid', borderColor: 'divider', '& .Mui-selected': { color: `${PURPLE} !important` }, '& .MuiTabs-indicator': { bgcolor: PURPLE } }}>
          {VIEWS.map((v) => <Tab key={v.key} value={v.key} label={`${v.label} (${counts[v.key]})`} sx={{ textTransform: 'none', fontWeight: 700 }} />)}
        </Tabs>
        {busy ? <LinearProgress sx={{ '& .MuiLinearProgress-bar': { bgcolor: PURPLE } }} /> : null}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(PURPLE, 0.06) }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    size="small"
                    checked={allOnPage}
                    indeterminate={!allOnPage && rows.some((r) => selected.includes(r.id))}
                    onChange={() => setSelected(allOnPage ? [] : rows.map((r) => r.id))}
                  />
                </TableCell>
                {['Participant', 'Email', 'Requested', 'Due', 'Progress', 'Attendance', 'Status', 'Certificate'].map((label) => (
                  <TableCell key={label} sx={{ fontWeight: 700 }}>{label}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length ? rows.map((reg) => {
                const done = (reg.moduleProgress || []).filter((item) => item.status === 'COMPLETED').length;
                const total = (reg.moduleProgress || []).length;
                const percent = total ? Math.round((done / total) * 100) : 0;
                const allowed = allowedAdminStatuses(reg.status);
                return (
                  <TableRow key={reg.id} hover selected={selected.includes(reg.id)}>
                    <TableCell padding="checkbox">
                      <Checkbox size="small" checked={selected.includes(reg.id)} onChange={() => toggle(reg.id)} />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      <Box component="span" role={onOpenPerson ? 'button' : undefined} tabIndex={onOpenPerson ? 0 : undefined} onClick={onOpenPerson ? () => onOpenPerson(reg.id) : undefined} onKeyDown={(e) => { if (onOpenPerson && e.key === 'Enter') onOpenPerson(reg.id); }} sx={onOpenPerson ? { cursor: 'pointer', color: '#5b3f8c', '&:hover': { textDecoration: 'underline' } } : undefined}>
                        {reg.user?.givenName} {reg.user?.familyName}
                      </Box>
                      {reg.user?.researchProfile?.department ? (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{reg.user.researchProfile.department}</Typography>
                      ) : null}
                    </TableCell>
                    <TableCell>{reg.user?.email}</TableCell>
                    <TableCell>
                      {formatDate(reg.registeredAt)}
                      {reg.source === 'ASSIGNED' ? <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Assigned</Typography> : null}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const { state } = complianceState(reg);
                        if (!reg.dueDate && !STATE_SX[state]) return '—';
                        return (
                          <Stack spacing={0.4} alignItems="flex-start">
                            {reg.dueDate ? <Typography variant="body2">{formatDate(reg.dueDate)}</Typography> : null}
                            {STATE_SX[state] ? <Chip size="small" label={COMPLIANCE_LABELS[state]} sx={{ fontWeight: 700, height: 20, ...STATE_SX[state] }} /> : null}
                          </Stack>
                        );
                      })()}
                    </TableCell>
                    <TableCell sx={{ minWidth: 120 }}>
                      {total ? (
                        <>
                          <Typography variant="caption">{done}/{total}</Typography>
                          <LinearProgress variant="determinate" value={percent} sx={{ height: 6, borderRadius: 3, bgcolor: alpha(PURPLE, 0.12), '& .MuiLinearProgress-bar': { bgcolor: PURPLE } }} />
                        </>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {reg.attendancePercent === null || reg.attendancePercent === undefined ? '—' : `${reg.attendancePercent}%`}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 190 }}>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <Select size="small" value={reg.status} disabled={busy} onChange={(e) => changeOne(reg, e.target.value)} sx={{ minWidth: 150 }}>
                          {Object.entries(REGISTRATION_STATUS_LABELS).map(([value, label]) => (
                            <MenuItem key={value} value={value} disabled={value !== reg.status && !allowed.includes(value)}>{label}</MenuItem>
                          ))}
                        </Select>
                        {reg.status === 'WAITLISTED' && waitlistPosition.get(reg.id) ? (
                          <Chip size="small" label={`#${waitlistPosition.get(reg.id)}`} sx={{ fontWeight: 700, bgcolor: '#e0f2fe', color: '#075985' }} />
                        ) : null}
                      </Stack>
                      {reg.status === 'REJECTED' && reg.rejectedReason ? (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>{reg.rejectedReason}</Typography>
                      ) : null}
                      {reg.status === 'CANCELLED' && reg.cancelReason ? (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>{reg.cancelReason}</Typography>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {reg.certificate?.certificateUrl ? (
                        <Tooltip title="Download certificate">
                          <IconButton size="small" onClick={() => window.open(reg.certificate.certificateUrl, '_blank', 'noopener')}><DownloadIcon fontSize="small" /></IconButton>
                        </Tooltip>
                      ) : reg.status === 'COMPLETED' ? (
                        <Button size="small" startIcon={<UploadIcon />} onClick={() => onUploadCertificate?.(reg)} sx={{ color: PURPLE, textTransform: 'none', fontWeight: 700 }}>
                          Upload
                        </Button>
                      ) : (
                        <Typography variant="caption" color="text.secondary">Not ready</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={9} sx={{ py: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">Nobody here yet.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <AssignTrainingDialog open={assignOpen} onClose={() => setAssignOpen(false)} training={training} onAssigned={onChanged} />

      <InstitutionModal open={Boolean(reasonDialog)} onClose={() => setReasonDialog(null)} maxWidth="sm" disableClose={busy} variant="modal">
        <InstitutionModalHeader
          icon={RejectIcon}
          title={reasonDialog?.title || ''}
          subtitle="The participant is told by email, with your reason if you give one."
          onClose={() => setReasonDialog(null)}
          disableClose={busy}
          tone="danger"
        />
        <InstitutionModalBody>
          <InstitutionModalSection title="Reason (optional)">
            <TextField
              fullWidth
              multiline
              minRows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonDialog?.action === 'reject' ? 'e.g. This cohort is for clinical staff only' : 'e.g. Rescheduled to the next cohort'}
              inputProps={{ maxLength: 500 }}
            />
          </InstitutionModalSection>
        </InstitutionModalBody>
        <InstitutionModalFooter>
          <Button onClick={() => setReasonDialog(null)} disabled={busy} sx={{ textTransform: 'none' }}>Back</Button>
          <Button variant="contained" color="error" disabled={busy} onClick={() => runBulk(reasonDialog.action, reasonDialog.ids, reason.trim() || null)} sx={{ textTransform: 'none', fontWeight: 700 }}>
            {reasonDialog?.action === 'reject' ? 'Decline' : 'Cancel registration'}
          </Button>
        </InstitutionModalFooter>
      </InstitutionModal>
    </Stack>
  );
}
