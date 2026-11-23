'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Container, Paper, Stack, TextField, Typography, alpha } from '@mui/material';
import { VerifiedUser as VerifyIcon } from '@mui/icons-material';
import { extractVerificationCode } from '@/lib/certificate-verify';

const PURPLE = '#8b6cbc';

/** /verify/certificate: type or paste a certificate's verification code or link (#101). */
export default function VerifyCertificateEntryPage() {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const submit = (event) => {
    event.preventDefault();
    const code = extractVerificationCode(value);
    if (!code) {
      setError('That does not look like a verification code. Copy it from the certificate, or scan its QR code.');
      return;
    }
    router.push(`/verify/certificate/${encodeURIComponent(code)}`);
  };

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
      <Paper component="form" onSubmit={submit} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Stack spacing={2.5} alignItems="center" textAlign="center">
          <Box sx={{ width: 64, height: 64, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(PURPLE, 0.12), color: PURPLE }}>
            <VerifyIcon sx={{ fontSize: 36 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>Verify a training certificate</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Scan the QR code on the certificate, or paste the verification link or code printed under “Verify”.
            </Typography>
          </Box>
          {error ? <Alert severity="error" sx={{ width: '100%', textAlign: 'left' }}>{error}</Alert> : null}
          <TextField
            fullWidth
            label="Verification link or code"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(''); }}
            autoFocus
          />
          <Button type="submit" variant="contained" fullWidth size="large" sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700 }}>
            Verify
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
