'use client';

import { Box } from '@mui/material';

/**
 * Soft status tones shared by list pages: pale fill, dark text, coloured dot.
 * Pick a tone by meaning, not by position in a workflow.
 */
export const STATUS_TONES = {
  neutral: { bg: '#f3f4f6', text: '#374151', dot: '#6b7280' },
  info: { bg: '#dbeafe', text: '#1e40af', dot: '#3b82f6' },
  progress: { bg: '#ede9fe', text: '#5b21b6', dot: '#8b5cf6' },
  warning: { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' },
  success: { bg: '#d1fae5', text: '#065f46', dot: '#10b981' },
  danger: { bg: '#fee2e2', text: '#991b1b', dot: '#ef4444' },
};

/**
 * Turn an enum-like value (UNDER_REVIEW) into a sentence-case label (Under review).
 */
export function humanizeStatus(value) {
  const text = String(value || '').replace(/_/g, ' ').trim().toLowerCase();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
}

export default function StatusPill({ label, tone = 'neutral', dot = true, size = 'small', sx }) {
  const t = STATUS_TONES[tone] || STATUS_TONES.neutral;
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        pl: dot ? 1 : 1.25,
        pr: 1.25,
        py: size === 'small' ? 0.375 : 0.5,
        borderRadius: 999,
        bgcolor: t.bg,
        color: t.text,
        fontSize: size === 'small' ? '0.75rem' : '0.8125rem',
        fontWeight: 600,
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
        width: 'fit-content',
        ...sx,
      }}
    >
      {dot && <Box component="span" sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: t.dot, flexShrink: 0 }} />}
      {label}
    </Box>
  );
}

/**
 * Thin segmented progress bar: `filled` of `total` segments in `tone`.
 */
export function StageBar({ filled = 0, total = 4, tone = 'progress', maxWidth = 150 }) {
  const t = STATUS_TONES[tone] || STATUS_TONES.progress;
  if (!total) return null;
  return (
    <Box sx={{ display: 'flex', gap: '3px', maxWidth }} aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <Box key={i} sx={{ flex: 1, height: 4, borderRadius: 2, bgcolor: i < filled ? t.dot : '#e5e7eb' }} />
      ))}
    </Box>
  );
}
