'use client';

import React from 'react';
import { Box, Chip, LinearProgress, Stack, Tooltip, Typography, alpha } from '@mui/material';
import { BURN_LABELS, EXPENSE_STATUS_LABELS } from '@/lib/project-budget';

export const PURPLE = '#8b6cbc';
export const btn = { textTransform: 'none', fontWeight: 700 };

export function money(value, currency = 'USD', compact = false) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency, notation: compact ? 'compact' : 'standard', maximumFractionDigits: compact ? 1 : 2 }).format(Number(value));
  } catch {
    return `${currency} ${Number(value).toLocaleString('en-GB')}`;
  }
}

export const fmtDate = (v) => (v ? new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

const BURN_SX = {
  ON_TRACK: { bgcolor: '#dcfce7', color: '#166534' },
  UNDER: { bgcolor: '#e0f2fe', color: '#075985' },
  OVER: { bgcolor: '#fef3c7', color: '#92400e' },
  OVERSPENT: { bgcolor: '#fee2e2', color: '#b91c1c' },
  NO_DATA: { bgcolor: '#f1f5f9', color: '#475569' },
  NOT_STARTED: { bgcolor: '#f1f5f9', color: '#475569' },
};
const BURN_HELP = {
  ON_TRACK: 'Spending is in line with time elapsed.',
  UNDER: 'Spending is well behind time elapsed: check for delays or unrecorded expenses.',
  OVER: 'Spending is more than 15 points ahead of time elapsed.',
  OVERSPENT: 'Approved spending is more than the budget.',
  NO_DATA: 'No approved expenses recorded yet.',
  NOT_STARTED: 'The project has not started yet.',
};

export function BurnChip({ burn }) {
  return (
    <Tooltip title={BURN_HELP[burn] || ''}>
      <Chip size="small" label={BURN_LABELS[burn] || burn} sx={{ fontWeight: 700, height: 22, ...(BURN_SX[burn] || {}) }} />
    </Tooltip>
  );
}

const STATUS_SX = {
  SUBMITTED: { bgcolor: '#fef3c7', color: '#92400e' },
  APPROVED: { bgcolor: '#dcfce7', color: '#166534' },
  REJECTED: { bgcolor: '#fee2e2', color: '#b91c1c' },
  VOID: { bgcolor: '#f1f5f9', color: '#64748b' },
};

export function ExpenseStatusChip({ status }) {
  return <Chip size="small" label={EXPENSE_STATUS_LABELS[status] || status} sx={{ fontWeight: 700, height: 22, ...(STATUS_SX[status] || {}) }} />;
}

/** % spent as a bar, with a marker at % of time elapsed. */
export function SpendBar({ figures, width = 160 }) {
  const spent = Math.min(100, figures.pctSpent ?? 0);
  const color = figures.burn === 'OVERSPENT' ? '#dc2626' : figures.burn === 'OVER' ? '#d97706' : PURPLE;
  return (
    <Tooltip title={`${figures.pctSpent ?? 0}% of the budget spent${figures.pctTime !== null ? ` · ${figures.pctTime}% of the time elapsed` : ''}`}>
      <Box sx={{ width, position: 'relative' }}>
        <LinearProgress variant="determinate" value={spent} sx={{ height: 8, borderRadius: 4, bgcolor: alpha(PURPLE, 0.12), '& .MuiLinearProgress-bar': { bgcolor: color } }} />
        {figures.pctTime !== null ? <Box sx={{ position: 'absolute', top: -3, left: `calc(${figures.pctTime}% - 1px)`, width: 2, height: 14, bgcolor: '#334155', borderRadius: 1 }} /> : null}
        <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.25 }}>
          <Typography variant="caption" sx={{ fontWeight: 700 }}>{figures.pctSpent ?? 0}% spent</Typography>
          {figures.pctTime !== null ? <Typography variant="caption" color="text.secondary">{figures.pctTime}% time</Typography> : null}
        </Stack>
      </Box>
    </Tooltip>
  );
}
