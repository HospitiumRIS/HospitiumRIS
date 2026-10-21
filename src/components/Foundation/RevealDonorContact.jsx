'use client';

/**
 * Shows a donor's masked contact details with an admin-only "Show" control.
 * Revealing calls POST /api/foundation/donors/reveal (audited server-side);
 * details are kept in component state only and hidden again on "Hide".
 */

import React, { useState } from 'react';
import {
  Box,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Visibility as ShowIcon,
  VisibilityOff as HideIcon,
} from '@mui/icons-material';

export function useDonorReveal() {
  const [revealed, setRevealed] = useState({});
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState('');

  const reveal = async (donationId) => {
    if (!donationId) return null;
    if (revealed[donationId]) return revealed[donationId];
    setLoadingId(donationId);
    setError('');
    try {
      const response = await fetch('/api/foundation/donors/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ donationId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.error || 'Could not load donor details');
      setRevealed((prev) => ({ ...prev, [donationId]: data.donor }));
      return data.donor;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoadingId(null);
    }
  };

  const hide = (donationId) => setRevealed((prev) => {
    const next = { ...prev };
    delete next[donationId];
    return next;
  });

  return { revealed, reveal, hide, loadingId, error, clearError: () => setError('') };
}

const copy = (text) => {
  try { navigator.clipboard?.writeText(text); } catch { /* clipboard unavailable */ }
};

/**
 * Inline contact block. Pass the masked record and the reveal hook state.
 * Props: donationId, email, phone, revealed (object|null), loading, onReveal, onHide, dense
 */
export default function RevealDonorContact({ donationId, email, phone, revealed, loading, onReveal, onHide, showName = false, name, dense = true, emptyLabel = '—' }) {
  const shownEmail = revealed ? revealed.donorEmail : email;
  const shownPhone = revealed ? revealed.donorPhone : phone;
  const shownName = revealed ? revealed.donorName : name;
  const fontSize = dense ? '0.74rem' : '0.85rem';

  if (!email && !phone && !showName) {
    return <Typography variant="caption" color="text.disabled">{emptyLabel}</Typography>;
  }

  return (
    <Stack direction="row" spacing={0.75} alignItems="flex-start">
      <Stack spacing={0.4} sx={{ minWidth: 0 }}>
        {showName && shownName ? (
          <Typography variant="body2" sx={{ fontWeight: 700, fontSize }}>{shownName}</Typography>
        ) : null}
        {shownEmail ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, minWidth: 0 }}>
            <EmailIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize, fontFamily: revealed ? 'inherit' : 'ui-monospace, SFMono-Regular, Menlo, monospace', letterSpacing: revealed ? 0 : '0.02em' }} noWrap>
              {shownEmail}
            </Typography>
            {revealed ? (
              <Tooltip title="Copy email"><IconButton size="small" onClick={(e) => { e.stopPropagation(); copy(shownEmail); }} sx={{ p: 0.25 }}><CopyIcon sx={{ fontSize: 12 }} /></IconButton></Tooltip>
            ) : null}
          </Box>
        ) : null}
        {shownPhone ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <PhoneIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize, fontFamily: revealed ? 'inherit' : 'ui-monospace, SFMono-Regular, Menlo, monospace', letterSpacing: revealed ? 0 : '0.02em' }} noWrap>
              {shownPhone}
            </Typography>
            {revealed ? (
              <Tooltip title="Copy phone"><IconButton size="small" onClick={(e) => { e.stopPropagation(); copy(shownPhone); }} sx={{ p: 0.25 }}><CopyIcon sx={{ fontSize: 12 }} /></IconButton></Tooltip>
            ) : null}
          </Box>
        ) : null}
      </Stack>
      {donationId ? (
        <Tooltip title={revealed ? 'Hide details' : 'Show full details (this view is logged)'}>
          <span>
            <IconButton
              size="small"
              disabled={loading}
              onClick={(e) => { e.stopPropagation(); if (revealed) onHide?.(donationId); else onReveal?.(donationId); }}
              sx={{ p: 0.4, color: revealed ? '#8b6cbc' : 'text.disabled', '&:hover': { color: '#8b6cbc' } }}
              aria-label={revealed ? 'Hide donor details' : 'Show donor details'}
            >
              {loading ? <CircularProgress size={12} /> : revealed ? <HideIcon sx={{ fontSize: 15 }} /> : <ShowIcon sx={{ fontSize: 15 }} />}
            </IconButton>
          </span>
        </Tooltip>
      ) : null}
    </Stack>
  );
}
