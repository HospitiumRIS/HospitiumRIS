'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  QrCodeScanner as ScanIcon,
  Schedule as LateIcon,
} from '@mui/icons-material';

const PURPLE = '#8b6cbc';

const formatWhen = (value) => new Date(value).toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/**
 * Self check-in (#93). Opened by scanning a session's QR code (?s=<sessionId>&t=<token>),
 * or directly to type the 6-digit code shown on screen.
 */
export default function TrainingCheckInPage() {
  const router = useRouter();
  const [state, setState] = useState('idle'); // idle | working | done | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const fromQr = useRef(null);
  const started = useRef(false);

  const submit = useCallback(async (payload) => {
    setState('working');
    setError('');
    try {
      const res = await fetch('/api/training/check-in', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) {
        const here = `${window.location.pathname}${window.location.search}`;
        router.replace(`/login?redirect=${encodeURIComponent(here)}`);
        return;
      }
      if (!res.ok || !json.success) {
        setResult(json);
        setError(json.error || 'Check-in failed');
        setState('error');
        return;
      }
      setResult(json);
      setState('done');
      // Drop the token from the address bar so a refresh doesn't resubmit an old QR.
      window.history.replaceState(null, '', '/researcher/training/check-in');
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
      setState('error');
    }
  }, [router]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const params = new URLSearchParams(window.location.search);
    const s = params.get('s');
    const t = params.get('t');
    if (s && t) {
      fromQr.current = s;
      submit({ sessionId: s, token: t });
    }
  }, [submit]);

  const submitCode = (event) => {
    event.preventDefault();
    const digits = code.replace(/\D/g, '');
    if (digits.length !== 6) {
      setError('Enter the 6-digit code shown on screen');
      setState('error');
      return;
    }
    submit(fromQr.current ? { sessionId: fromQr.current, code: digits } : { code: digits });
  };

  const late = result?.status === 'LATE';

  return (
    <Box sx={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2, py: 6 }}>
      <Paper sx={{ width: '100%', maxWidth: 440, p: { xs: 3, sm: 4 }, borderRadius: 3, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
        {state === 'working' ? (
          <Stack spacing={2} alignItems="center" sx={{ py: 4 }}>
            <CircularProgress sx={{ color: PURPLE }} />
            <Typography>Checking you in…</Typography>
          </Stack>
        ) : state === 'done' ? (
          <Stack spacing={1.5} alignItems="center">
            <Box sx={{ width: 76, height: 76, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: late ? '#fef3c7' : '#dcfce7' }}>
              {late ? <LateIcon sx={{ fontSize: 44, color: '#92400e' }} /> : <SuccessIcon sx={{ fontSize: 44, color: '#166534' }} />}
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              {result.alreadyCheckedIn ? 'Already checked in' : late ? 'Checked in (late)' : "You're checked in"}
            </Typography>
            <Typography sx={{ fontWeight: 700 }}>{result.session?.title}</Typography>
            <Typography variant="body2" color="text.secondary">{result.training?.title}</Typography>
            {result.checkedInAt ? (
              <Typography variant="body2" color="text.secondary">at {formatWhen(result.checkedInAt)}</Typography>
            ) : null}
            <Button variant="contained" onClick={() => router.push('/researcher/training')} sx={{ mt: 2, bgcolor: PURPLE, textTransform: 'none', fontWeight: 700 }}>
              Go to my trainings
            </Button>
          </Stack>
        ) : (
          <Stack spacing={2.5} alignItems="center" component="form" onSubmit={submitCode}>
            <Box sx={{ width: 64, height: 64, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(PURPLE, 0.12), color: PURPLE }}>
              <ScanIcon sx={{ fontSize: 36 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>Session check-in</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Scan the QR code on screen with your phone camera, or enter the 6-digit code below.
              </Typography>
            </Box>
            {state === 'error' && error ? (
              <Alert severity={result?.reason === 'not_open' ? 'info' : 'error'} sx={{ width: '100%', textAlign: 'left', borderRadius: 2 }}>
                {error}
                {result?.session?.title ? <Box component="span" sx={{ display: 'block', mt: 0.5, fontWeight: 700 }}>{result.session.title}</Box> : null}
              </Alert>
            ) : null}
            <TextField
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, '').slice(0, 7))}
              placeholder="000 000"
              autoComplete="one-time-code"
              inputProps={{ inputMode: 'numeric', 'aria-label': 'Check-in code', style: { textAlign: 'center', fontSize: 32, letterSpacing: '0.25em', fontWeight: 800 } }}
              fullWidth
            />
            <Button type="submit" variant="contained" fullWidth size="large" sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700, py: 1.25 }}>
              Check in
            </Button>
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
