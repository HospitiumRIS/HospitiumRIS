'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  Close as CloseIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Refresh as NewCodeIcon,
} from '@mui/icons-material';

const PURPLE = '#8b6cbc';
const PURPLE_DARK = '#5b3f8c';
const POLL_MS = 4000;

const formatTime = (value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/**
 * Full-screen check-in display for a session (#93): rotating QR code, 6-digit code and
 * a live checked-in counter. Meant for a projector or a tablet at the door. Used by
 * training admins and by facilitators of the session (#104).
 */
export default function PresentCheckIn({ trainingId, sid, closeHref }) {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [qr, setQr] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [fullscreen, setFullscreen] = useState(false);
  const lastUrl = useRef('');

  const apply = useCallback(async (json) => {
    setData(json);
    if (json.url && json.url !== lastUrl.current) {
      lastUrl.current = json.url;
      try {
        setQr(await QRCode.toDataURL(json.url, { margin: 1, width: 640, errorCorrectionLevel: 'M', color: { dark: '#1e1035', light: '#ffffff' } }));
      } catch {
        setQr('');
      }
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/training/${trainingId}/sessions/${sid}/check-in-token`, { credentials: 'include', cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Could not load the check-in screen');
      await apply(json);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [trainingId, sid, apply]);

  useEffect(() => {
    load();
    const poll = setInterval(load, POLL_MS);
    const tick = setInterval(() => setNow(Date.now()), 250);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [load]);

  // Refresh right when the token rotates, so the QR never shows an old token for long.
  useEffect(() => {
    if (!data?.rotatesAt) return undefined;
    const wait = Math.max(200, new Date(data.rotatesAt).getTime() - Date.now() + 150);
    const timer = setTimeout(load, wait);
    return () => clearTimeout(timer);
  }, [data?.rotatesAt, load]);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      // Not supported (e.g. iOS Safari); the overlay is already full-window.
    }
  };

  const regenerate = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/training/${trainingId}/sessions/${sid}/check-in-token`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'regenerate-code' }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Could not issue a new code');
      await apply(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remainingMs = data?.rotatesAt ? Math.max(0, new Date(data.rotatesAt).getTime() - now) : 0;
  const progress = data ? (remainingMs / (data.windowSeconds * 1000)) * 100 : 0;
  const state = data?.checkIn?.state;
  const host = data?.url ? new URL(data.url).host : '';
  const code = data?.code ? `${data.code.slice(0, 3)} ${data.code.slice(3)}` : '';

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1400,
        overflow: 'auto',
        color: 'white',
        background: `radial-gradient(circle at 20% 10%, ${alpha('#ffffff', 0.08)} 0%, transparent 40%), linear-gradient(135deg, ${PURPLE_DARK} 0%, #2b1a4a 100%)`,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: { xs: 2, md: 4 }, pt: 2 }}>
        <Typography variant="overline" sx={{ letterSpacing: '0.2em', opacity: 0.8 }}>HospitiumRIS · Training check-in</Typography>
        <Stack direction="row" spacing={1}>
          <Tooltip title={fullscreen ? 'Exit full screen' : 'Full screen'}>
            <IconButton onClick={toggleFullscreen} sx={{ color: 'white' }}>{fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}</IconButton>
          </Tooltip>
          <Tooltip title="Close">
            <IconButton onClick={() => router.push(closeHref || `/institution/training/${trainingId}`)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {error ? <Alert severity="error" sx={{ mx: { xs: 2, md: 4 }, mt: 1 }}>{error}</Alert> : null}

      {!data ? (
        <Box sx={{ py: 16, display: 'flex', justifyContent: 'center' }}><CircularProgress sx={{ color: 'white' }} /></Box>
      ) : (
        <Box sx={{ px: { xs: 2, md: 4 }, py: { xs: 2, md: 3 }, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.1fr) minmax(0, 1fr)' }, gap: { xs: 3, md: 6 }, alignItems: 'center', maxWidth: 1500, mx: 'auto' }}>
          <Box>
            <Typography variant="h6" sx={{ opacity: 0.85, fontWeight: 600 }}>{data.training.title}</Typography>
            <Typography sx={{ fontSize: { xs: 32, md: 52 }, fontWeight: 800, lineHeight: 1.1, mt: 0.5 }}>{data.session.title}</Typography>
            <Typography variant="h6" sx={{ opacity: 0.85, mt: 1 }}>
              {new Date(data.session.startsAt).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })} · {formatTime(data.session.startsAt)} – {formatTime(data.session.endsAt)}
            </Typography>

            <Box sx={{ mt: { xs: 3, md: 5 }, p: 3, borderRadius: 3, bgcolor: alpha('#ffffff', 0.08), border: `1px solid ${alpha('#ffffff', 0.15)}` }}>
              <Typography variant="overline" sx={{ opacity: 0.8, letterSpacing: '0.15em' }}>Can&apos;t scan? Enter this code</Typography>
              <Typography sx={{ fontSize: { xs: 56, md: 88 }, fontWeight: 800, letterSpacing: '0.12em', fontVariantNumeric: 'tabular-nums', lineHeight: 1.05 }}>{code}</Typography>
              <Typography sx={{ opacity: 0.85, mt: 1 }}>at <strong>{host}/researcher/training/check-in</strong></Typography>
              <Button size="small" startIcon={<NewCodeIcon />} disabled={busy} onClick={regenerate} sx={{ mt: 1.5, color: 'white', textTransform: 'none', opacity: 0.8 }}>
                Issue a new code
              </Button>
            </Box>

            <Stack direction="row" spacing={4} sx={{ mt: 4 }}>
              <Box>
                <Typography sx={{ fontSize: { xs: 44, md: 64 }, fontWeight: 800, lineHeight: 1 }}>{data.counts.checkedIn}</Typography>
                <Typography sx={{ opacity: 0.8 }}>of {data.counts.registered} checked in</Typography>
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="overline" sx={{ opacity: 0.7 }}>Latest</Typography>
                <Stack spacing={0.25}>
                  {data.recent.length ? data.recent.slice(0, 5).map((r, i) => (
                    <Typography key={`${r.name}-${i}`} sx={{ opacity: 1 - i * 0.15, fontWeight: 600 }}>
                      {r.name}{r.status === 'LATE' ? ' · late' : ''}
                    </Typography>
                  )) : <Typography sx={{ opacity: 0.6 }}>Nobody yet</Typography>}
                </Stack>
              </Box>
            </Stack>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ position: 'relative', display: 'inline-block', p: { xs: 1.5, md: 2.5 }, bgcolor: 'white', borderRadius: 4, boxShadow: '0 30px 80px rgba(0,0,0,0.35)', width: '100%', maxWidth: 560 }}>
              {qr ? (
                <Box component="img" src={qr} alt="Check-in QR code" sx={{ width: '100%', display: 'block', opacity: state === 'open' ? 1 : 0.15 }} />
              ) : (
                <Box sx={{ aspectRatio: '1 / 1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress sx={{ color: PURPLE }} /></Box>
              )}
              {state !== 'open' ? (
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
                  <Typography sx={{ color: '#1e1035', fontWeight: 800, fontSize: { xs: 20, md: 28 } }}>
                    {state === 'not_open' ? `Check-in opens at ${formatTime(data.checkIn.opensAt)}`
                      : state === 'closed' ? 'Check-in has closed'
                        : state === 'cancelled' ? 'This session is cancelled' : 'Check-in unavailable'}
                  </Typography>
                </Box>
              ) : null}
            </Box>
            <Box sx={{ maxWidth: 560, mx: 'auto', mt: 2 }}>
              <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 3, bgcolor: alpha('#ffffff', 0.15), '& .MuiLinearProgress-bar': { bgcolor: 'white', transition: 'none' } }} />
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                {state === 'open'
                  ? `Scan with your phone camera · code refreshes in ${Math.ceil(remainingMs / 1000)}s · late after ${formatTime(data.checkIn.lateAt)} · closes ${formatTime(data.checkIn.closesAt)}`
                  : `Check-in window: ${formatTime(data.checkIn.opensAt)} – ${formatTime(data.checkIn.closesAt)}`}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
