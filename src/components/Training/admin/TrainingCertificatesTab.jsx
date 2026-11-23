'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
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
  alpha,
} from '@mui/material';
import {
  Block as RevokeIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  EmojiEvents as CertificateIcon,
  Refresh as ReissueIcon,
  Send as ResendIcon,
  DriveFolderUpload as BulkIcon,
} from '@mui/icons-material';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
} from '@/components/GlobalAdmin/InstitutionModalShell';
import { CERTIFICATE_MODE_LABELS } from '@/lib/certificate-template';
import BulkCertificateUploadDialog from './BulkCertificateUploadDialog';

const PURPLE = '#8b6cbc';
const fullName = (u) => [u?.givenName, u?.familyName].filter(Boolean).join(' ') || u?.email || 'Participant';
const fmt = (d) => (d ? new Date(d).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const STATE_CHIP = {
  VALID: { label: 'Valid', bg: '#dcfce7', color: '#166534' },
  EXPIRED: { label: 'Expired', bg: '#fef3c7', color: '#92400e' },
  REVOKED: { label: 'Revoked', bg: '#fee2e2', color: '#b91c1c' },
};

/**
 * Certificates of one training (#99): issue to completed participants (selected or
 * all), and download, resend, reissue or revoke issued ones.
 */
export default function TrainingCertificatesTab({ trainingId, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [view, setView] = useState(0);
  const [selected, setSelected] = useState(new Set());
  const [revoking, setRevoking] = useState(null); // { reg, reason }
  const [bulkOpen, setBulkOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/training/${trainingId}/certificates`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load certificates');
      setData(json);
      setSelected(new Set());
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

  const generate = async (body) => {
    setBusy(true);
    setError('');
    try {
      let issued = 0;
      let failed = [];
      let remaining = 0;
      let payload = body;
      // Large groups are issued in batches of 200.
      do {
        const res = await fetch(`/api/training/${trainingId}/certificates/generate`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) throw new Error(json.error || 'Could not issue certificates');
        issued += json.issued;
        failed = failed.concat(json.failed || []);
        remaining = json.remaining;
        payload = { all: true };
        // Stop if a batch made no progress (e.g. the same people keep failing).
        if (!json.issued) break;
      } while (remaining > 0 && body.all);
      setNotice(`${issued} certificate${issued === 1 ? '' : 's'} issued and sent.${failed.length ? ` ${failed.length} failed: ${failed[0].error}` : ''}`);
      await load();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const act = async (certId, action, body = {}, message) => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/training/certificates/${certId}/${action}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Action failed');
      setNotice(message);
      setRevoking(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setNotice('Verification link copied.');
    } catch {
      setError('Could not copy the link');
    }
  };

  if (loading) return <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress sx={{ color: PURPLE }} /></Box>;

  const ready = data?.ready || [];
  const issued = data?.issued || [];
  const revoked = data?.revoked || [];
  const toggle = (id) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error" sx={{ borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert> : null}
      {notice ? <Alert severity="success" sx={{ borderRadius: 2 }} onClose={() => setNotice('')}>{notice}</Alert> : null}

      <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ md: 'center' }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Certificates</Typography>
            <Typography variant="body2" color="text.secondary">
              {CERTIFICATE_MODE_LABELS[data?.mode] || ''}. {data?.notYet ? `${data.notYet} participant(s) haven't completed yet.` : ''}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            <Button size="small" variant="outlined" startIcon={<BulkIcon />} onClick={() => setBulkOpen(true)} sx={{ borderColor: PURPLE, color: PURPLE, textTransform: 'none', fontWeight: 700 }}>
              Upload certificates
            </Button>
            <Chip label={`${ready.length} ready`} sx={{ bgcolor: alpha(PURPLE, 0.1), color: PURPLE, fontWeight: 700 }} />
            <Chip label={`${issued.length} issued`} sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 700 }} />
            {revoked.length ? <Chip label={`${revoked.length} revoked`} sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 700 }} /> : null}
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Tabs value={view} onChange={(_, v) => setView(v)} sx={{ px: 2, borderBottom: '1px solid', borderColor: 'divider', '& .Mui-selected': { color: `${PURPLE} !important` }, '& .MuiTabs-indicator': { bgcolor: PURPLE } }}>
          <Tab label={`Ready to issue (${ready.length})`} sx={{ textTransform: 'none', fontWeight: 700 }} />
          <Tab label={`Issued (${issued.length})`} sx={{ textTransform: 'none', fontWeight: 700 }} />
          <Tab label={`Revoked (${revoked.length})`} sx={{ textTransform: 'none', fontWeight: 700 }} />
        </Tabs>

        {view === 0 ? (
          ready.length ? (
            <>
              <Stack direction="row" spacing={1} sx={{ p: 2 }}>
                <Button variant="contained" startIcon={<CertificateIcon />} disabled={busy || !selected.size} onClick={() => generate({ registrationIds: [...selected] })} sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700 }}>
                  Issue selected ({selected.size})
                </Button>
                <Button variant="outlined" disabled={busy} onClick={() => generate({ all: true })} sx={{ borderColor: PURPLE, color: PURPLE, textTransform: 'none', fontWeight: 700 }}>
                  {busy ? 'Issuing…' : `Issue all ${ready.length}`}
                </Button>
              </Stack>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selected.size === ready.length}
                          indeterminate={selected.size > 0 && selected.size < ready.length}
                          onChange={(e) => setSelected(e.target.checked ? new Set(ready.map((r) => r.id)) : new Set())}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Participant</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Completed</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ready.map((r) => (
                      <TableRow key={r.id} hover onClick={() => toggle(r.id)} sx={{ cursor: 'pointer' }}>
                        <TableCell padding="checkbox"><Checkbox checked={selected.has(r.id)} /></TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{fullName(r.user)}</Typography>
                          <Typography variant="caption" color="text.secondary">{r.user?.email}</Typography>
                        </TableCell>
                        <TableCell>{fmt(r.completedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : (
            <Alert severity="info" sx={{ m: 2, borderRadius: 2 }}>
              Nobody is waiting for a certificate. Participants appear here once they are marked completed (see the Completion tab).
            </Alert>
          )
        ) : null}

        {view === 1 || view === 2 ? (
          (view === 1 ? issued : revoked).length ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {['Participant', 'Number', view === 1 ? 'Issued' : 'Revoked', 'Status', ''].map((h) => <TableCell key={h} sx={{ fontWeight: 800 }}>{h}</TableCell>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(view === 1 ? issued : revoked).map((r) => {
                    const c = r.certificate;
                    const chip = STATE_CHIP[c.state] || STATE_CHIP.VALID;
                    return (
                      <TableRow key={r.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{fullName(r.user)}</Typography>
                          <Typography variant="caption" color="text.secondary">{r.user?.email}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{c.certificateNumber || '—'}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {c.source === 'UPLOADED' ? 'Uploaded' : 'Generated'}{c.version > 1 ? ` · version ${c.version}` : ''}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {view === 1 ? fmt(c.issuedAt) : fmt(c.revokedAt)}
                          {view === 1 && c.expiresAt ? <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Expires {fmt(c.expiresAt)}</Typography> : null}
                          {view === 2 && c.revokedReason ? <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{c.revokedReason}</Typography> : null}
                        </TableCell>
                        <TableCell><Chip size="small" label={chip.label} sx={{ bgcolor: chip.bg, color: chip.color, fontWeight: 700 }} /></TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                          <Tooltip title="Download"><IconButton size="small" onClick={() => window.open(c.certificateUrl, '_blank', 'noopener')}><DownloadIcon fontSize="small" /></IconButton></Tooltip>
                          {c.verifyUrl ? <Tooltip title="Copy verification link"><IconButton size="small" onClick={() => copy(c.verifyUrl)}><CopyIcon fontSize="small" /></IconButton></Tooltip> : null}
                          {view === 1 ? (
                            <>
                              <Tooltip title="Email it again"><span><IconButton size="small" disabled={busy} onClick={() => act(c.id, 'resend', {}, `Certificate re-sent to ${fullName(r.user)}.`)}><ResendIcon fontSize="small" /></IconButton></span></Tooltip>
                              <Tooltip title="Regenerate with the current template and details (same number)"><span><IconButton size="small" disabled={busy} onClick={() => act(c.id, 'reissue', {}, `Certificate reissued for ${fullName(r.user)}.`)}><ReissueIcon fontSize="small" /></IconButton></span></Tooltip>
                              <Tooltip title="Revoke"><span><IconButton size="small" color="error" disabled={busy} onClick={() => setRevoking({ reg: r, reason: '' })}><RevokeIcon fontSize="small" /></IconButton></span></Tooltip>
                            </>
                          ) : (
                            <Button size="small" disabled={busy} startIcon={<ReissueIcon />} onClick={() => act(c.id, 'reissue', { reason: 'Reinstated' }, `Certificate reinstated for ${fullName(r.user)}.`)} sx={{ textTransform: 'none', color: PURPLE }}>
                              Reissue
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info" sx={{ m: 2, borderRadius: 2 }}>{view === 1 ? 'No certificates issued yet.' : 'No revoked certificates.'}</Alert>
          )
        ) : null}
      </Paper>

      <BulkCertificateUploadDialog
        open={bulkOpen}
        trainingId={trainingId}
        participants={[...ready, ...issued, ...revoked].map((r) => ({ registrationId: r.id, status: r.status, user: r.user }))}
        onClose={() => setBulkOpen(false)}
        onDone={async (summary) => {
          setNotice(`${summary.uploaded} certificate${summary.uploaded === 1 ? '' : 's'} uploaded.`);
          await load();
          onChanged?.();
        }}
      />

      <InstitutionModal open={Boolean(revoking)} onClose={() => setRevoking(null)} disableClose={busy} maxWidth="xs">
        <InstitutionModalHeader icon={RevokeIcon} tone="danger" title="Revoke certificate" subtitle="The certificate will show as revoked when verified" onClose={() => setRevoking(null)} disableClose={busy} />
        {revoking ? (
          <InstitutionModalBody>
            <Alert severity="warning" sx={{ borderRadius: 1.5 }}>
              {revoking.reg.certificate.certificateNumber} issued to {fullName(revoking.reg.user)} will no longer be valid. The participant is told by email. You can reissue it later.
            </Alert>
            <TextField label="Reason" multiline minRows={2} value={revoking.reason} onChange={(e) => setRevoking((v) => ({ ...v, reason: e.target.value }))} inputProps={{ maxLength: 500 }} required />
          </InstitutionModalBody>
        ) : null}
        <InstitutionModalFooter>
          <Button onClick={() => setRevoking(null)} disabled={busy} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" color="error" disabled={busy || !revoking?.reason?.trim()} onClick={() => act(revoking.reg.certificate.id, 'revoke', { reason: revoking.reason }, 'Certificate revoked.')} sx={{ textTransform: 'none', fontWeight: 700 }}>
            {busy ? 'Revoking…' : 'Revoke certificate'}
          </Button>
        </InstitutionModalFooter>
      </InstitutionModal>
    </Stack>
  );
}
