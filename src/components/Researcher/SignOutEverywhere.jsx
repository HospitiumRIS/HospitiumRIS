'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';
import { DevicesOutlined as DevicesIcon } from '@mui/icons-material';

/**
 * "Signed-in devices" row with a button that ends every other session.
 * Self-contained: loads the count from /api/auth/sessions.
 */
export default function SignOutEverywhere({ heading: Heading }) {
  const [count, setCount] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { severity, text }

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/sessions', { cache: 'no-store' });
      const json = await res.json();
      if (json.success) setCount(json.otherSessions);
    } catch {
      setCount(null);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const signOutOthers = async () => {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch('/api/auth/sessions', { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Could not sign out other devices');
      setResult({
        severity: 'success',
        text: json.ended
          ? `Signed out of ${json.ended} other ${json.ended === 1 ? 'device' : 'devices'}.`
          : 'No other devices were signed in.',
      });
      setCount(0);
    } catch (err) {
      setResult({ severity: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const subtitle =
    count == null
      ? 'Sign out of HospitiumRIS on every other browser and device.'
      : count === 0
        ? 'This is the only device signed in to your account.'
        : `You're also signed in on ${count} other ${count === 1 ? 'device' : 'devices'}. Sign out there if you don't recognise them or left yourself signed in.`;

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        {Heading ? (
          <Heading icon={DevicesIcon} title="Signed-in devices" subtitle={subtitle} />
        ) : (
          <Box>
            <Typography sx={{ fontWeight: 700 }}>Signed-in devices</Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
        )}
        <Box sx={{ flexShrink: 0, mb: { sm: Heading ? 2 : 0 } }}>
          <Button
            variant="outlined"
            onClick={signOutOthers}
            disabled={busy || count === 0}
            sx={{ textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
          >
            {busy ? 'Signing out…' : 'Sign out other devices'}
          </Button>
        </Box>
      </Box>
      {result && (
        <Alert severity={result.severity} sx={{ mt: 1.5 }} onClose={() => setResult(null)}>
          {result.text}
        </Alert>
      )}
    </Box>
  );
}
