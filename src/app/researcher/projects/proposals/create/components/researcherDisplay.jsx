'use client';

import React from 'react';
import { Avatar, Chip, alpha } from '@mui/material';
import { Verified as VerifiedIcon } from '@mui/icons-material';

export const PURPLE = '#8b6cbc';
export const PURPLE_DARK = '#7a5aad';
export const GREEN = '#15803d';

export const fieldFocusSx = {
  '& .MuiOutlinedInput-root:hover fieldset': { borderColor: PURPLE },
  '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: PURPLE },
  '& .MuiInputLabel-root.Mui-focused': { color: PURPLE },
};

export const primaryButtonSx = {
  bgcolor: PURPLE,
  textTransform: 'none',
  fontWeight: 700,
  '&:hover': { bgcolor: PURPLE_DARK },
};

export const outlinedButtonSx = {
  textTransform: 'none',
  fontWeight: 700,
  color: PURPLE,
  borderColor: alpha(PURPLE, 0.45),
  '&:hover': { borderColor: PURPLE, bgcolor: alpha(PURPLE, 0.06) },
};

export function displayName(researcher) {
  if (!researcher) return '';
  return researcher.creditName
    || `${researcher.givenNames || researcher.givenName || ''} ${researcher.familyName || ''}`.trim()
    || 'Unnamed researcher';
}

export function orcidKey(orcidId) {
  return (orcidId || '').trim().toUpperCase();
}

export function initials(researcher) {
  const first = (researcher?.givenNames || researcher?.givenName || '').trim()[0] || '';
  const last = (researcher?.familyName || '').trim()[0] || '';
  return (first + last).toUpperCase() || displayName(researcher).slice(0, 1).toUpperCase() || '?';
}

export function canViewProfile(researcher) {
  return Boolean(researcher?.hospitium?.sameInstitution && researcher.hospitium.userId);
}

export function ResearcherAvatar({ researcher, size = 36 }) {
  return (
    <Avatar
      src={researcher?.avatarUrl || undefined}
      alt={displayName(researcher)}
      variant="rounded"
      sx={{
        width: size,
        height: size,
        borderRadius: size > 44 ? 2.5 : 1.5,
        bgcolor: alpha(PURPLE, 0.14),
        color: PURPLE,
        fontWeight: 800,
        fontSize: size * 0.38,
        flexShrink: 0,
      }}
    >
      {initials(researcher)}
    </Avatar>
  );
}

export function HospitiumBadge({ hospitium }) {
  if (!hospitium?.registered) return null;
  if (hospitium.sameInstitution) {
    return (
      <Chip
        size="small"
        icon={<VerifiedIcon sx={{ fontSize: '14px !important', color: `${GREEN} !important` }} />}
        label={hospitium.institution ? `Colleague · ${hospitium.institution}` : 'Colleague on Hospitium'}
        sx={{ height: 22, fontWeight: 700, fontSize: '0.68rem', bgcolor: alpha(GREEN, 0.1), color: GREEN, maxWidth: 260 }}
      />
    );
  }
  return (
    <Chip
      size="small"
      label={hospitium.isCurrentUser ? 'You' : 'On Hospitium'}
      sx={{ height: 22, fontWeight: 700, fontSize: '0.68rem', bgcolor: '#f1f5f9', color: '#475569' }}
    />
  );
}
