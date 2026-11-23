'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Button, CircularProgress, Container, Divider, Paper, Stack, Typography } from '@mui/material';
import {
  Cancel as RevokedIcon,
  CheckCircle as ValidIcon,
  HelpOutline as NotFoundIcon,
  HourglassBottom as ExpiredIcon,
} from '@mui/icons-material';

const PURPLE = '#8b6cbc';
const STATES = {
  VALID: { label: 'Valid certificate', color: '#166534', bg: '#dcfce7', Icon: ValidIcon, text: 'This certificate was issued by the institution below and is valid.' },
  EXPIRED: { label: 'Expired certificate', color: '#92400e', bg: '#fef3c7', Icon: ExpiredIcon, text: 'This certificate was genuinely issued, but its validity period has ended.' },
  REVOKED: { label: 'Revoked certificate', color: '#b91c1c', bg: '#fee2e2', Icon: RevokedIcon, text: 'This certificate was issued but has since been revoked. It is no longer valid.' },
};

const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : null);

function Row({ label, value }) {
  if (!value) return null;
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.25, sm: 2 }} sx={{ py: 1 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 170 }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>{value}</Typography>
    </Stack>
  );
}

/** /verify/certificate/[code]: public result of a certificate check (#101). */
export default function VerifyCertificatePage() {
  const { code } = useParams();
  const router = useRouter();
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    let alive = true;
    fetch(`/api/public/certificates/verify/${encodeURIComponent(code)}`, { cache: 'no-store' })
      .then(async (res) => ({ status: res.status, json: await res.json().catch(() => ({})) }))
      .then(({ status, json }) => { if (alive) setState({ loading: false, status, ...json }); })
      .catch(() => { if (alive) setState({ loading: false, status: 500, error: 'Verification is unavailable right now' }); });
    return () => { alive = false; };
  }, [code]);

  if (state.loading) {
    return <Box sx={{ py: 14, display: 'flex', justifyContent: 'center' }}><CircularProgress sx={{ color: PURPLE }} /></Box>;
  }

  const c = state.certificate;
  const look = c ? STATES[c.state] || STATES.VALID : null;

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 5, md: 9 } }}>
      <Paper sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        {c ? (
          <>
            <Box sx={{ p: 3, bgcolor: look.bg, color: look.color, display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <look.Icon sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{look.label}</Typography>
                <Typography variant="body2">{look.text}</Typography>
              </Box>
            </Box>
            <Box sx={{ p: 3 }}>
              <Typography variant="overline" color="text.secondary">Awarded to</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{c.participantName}</Typography>
              <Divider sx={{ my: 2 }} />
              <Row label="Training" value={c.trainingTitle} />
              <Row label="Issued by" value={c.institutionName} />
              <Row label="Certificate number" value={c.certificateNumber} />
              <Row label="Completed" value={c.completionDate} />
              <Row label="Issued on" value={fmt(c.issuedAt)} />
              <Row label={c.state === 'EXPIRED' ? 'Expired on' : 'Valid until'} value={fmt(c.expiresAt)} />
              <Row label="Revoked on" value={fmt(c.revokedAt)} />
              <Row label="CPD" value={[c.cpdHours ? `${c.cpdHours} hours` : null, c.cpdPoints ? `${c.cpdPoints} points` : null].filter(Boolean).join(', ')} />
              <Row label="Accredited by" value={c.accreditationBody ? `${c.accreditationBody}${c.accreditationNumber ? ` (${c.accreditationNumber})` : ''}` : null} />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                Check that the name and certificate number match the document you were given. Verified by HospitiumRIS.
              </Typography>
            </Box>
          </>
        ) : (
          <Stack spacing={2} alignItems="center" textAlign="center" sx={{ p: 5 }}>
            <NotFoundIcon sx={{ fontSize: 52, color: 'text.disabled' }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>{state.status === 429 ? 'Please wait a moment' : 'Certificate not found'}</Typography>
            <Typography variant="body2" color="text.secondary">{state.error || 'No certificate matches this code.'}</Typography>
            <Button variant="outlined" onClick={() => router.push('/verify/certificate')} sx={{ borderColor: PURPLE, color: PURPLE, textTransform: 'none', fontWeight: 700 }}>
              Enter a code
            </Button>
          </Stack>
        )}
      </Paper>
    </Container>
  );
}
