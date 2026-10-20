'use client';

/**
 * Shared building blocks for the institution analytics pages
 * (funding, compliance): reporting-period bar, KPI tiles, section cards,
 * status pills and empty states. Neutral surfaces with a single purple accent.
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import { InfoOutlined as InfoIcon, TrendingDown as DownIcon, TrendingUp as UpIcon } from '@mui/icons-material';

export const PURPLE = '#8b6cbc';
export const PURPLE_DARK = '#6d5499';
export const INK = '#1f2937';
export const MUTED = '#64748b';
export const TONES = {
  good: { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  warn: { color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  bad: { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
  info: { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  neutral: { color: '#475569', bg: '#f8fafc', border: '#e2e8f0' },
  brand: { color: PURPLE_DARK, bg: alpha(PURPLE, 0.06), border: alpha(PURPLE, 0.25) },
};

export const chartTooltip = {
  contentStyle: { borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', fontSize: 12 },
};

export const toInputDate = (date) => {
  const d = new Date(date);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export const RANGE_PRESETS = [
  { key: '90d', label: '90 days', days: 90 },
  { key: '12m', label: '12 months', months: 12 },
  { key: 'ytd', label: 'This year', ytd: true },
  { key: '3y', label: '3 years', months: 36 },
  { key: 'all', label: 'All time', all: true },
];

export const presetRange = (key) => {
  const preset = RANGE_PRESETS.find((p) => p.key === key) || RANGE_PRESETS[1];
  const end = new Date();
  const start = new Date(end);
  if (preset.days) start.setDate(start.getDate() - preset.days + 1);
  else if (preset.months) { start.setMonth(start.getMonth() - preset.months); start.setDate(start.getDate() + 1); }
  else if (preset.ytd) start.setMonth(0, 1);
  else if (preset.all) start.setFullYear(2000, 0, 1);
  return { startDate: toInputDate(start), endDate: toInputDate(end) };
};

export const rangeQuery = (range) => `startDate=${encodeURIComponent(range.startDate)}&endDate=${encodeURIComponent(range.endDate)}`;

export const fmtDate = (value) => (value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
export const fmtPct = (value) => (value === null || value === undefined ? '—' : `${value}%`);

export function formatMoney(amount, currency = 'USD', compact = true) {
  const value = Number(amount) || 0;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      notation: compact && Math.abs(value) >= 100000 ? 'compact' : 'standard',
      maximumFractionDigits: compact && Math.abs(value) >= 100000 ? 1 : 0,
    }).format(value);
  } catch {
    return `${currency || ''} ${value.toLocaleString()}`.trim();
  }
}

/** Reporting period selector: presets + custom dates. */
export function AnalyticsRangeBar({ value, preset, onChange, institutionName, note }) {
  const [draft, setDraft] = useState(value);
  const [lastValue, setLastValue] = useState(value);
  if (lastValue.startDate !== value.startDate || lastValue.endDate !== value.endDate) {
    setLastValue(value);
    setDraft(value);
  }
  const invalid = !draft.startDate || !draft.endDate || draft.startDate > draft.endDate;
  const unchanged = draft.startDate === value.startDate && draft.endDate === value.endDate;

  return (
    <Paper
      elevation={0}
      sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between', bgcolor: 'white' }}
    >
      <Box sx={{ minWidth: 220 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: INK }}>
          Reporting period{institutionName ? ` · ${institutionName}` : ''}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {note || 'Compared with the previous period of the same length.'}
        </Typography>
      </Box>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
        <Stack direction="row" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden' }}>
          {RANGE_PRESETS.map((p, i) => (
            <Button
              key={p.key}
              size="small"
              onClick={() => onChange(presetRange(p.key), p.key)}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 0,
                px: 1.5,
                color: preset === p.key ? 'white' : MUTED,
                bgcolor: preset === p.key ? PURPLE : 'transparent',
                borderLeft: i ? '1px solid' : 'none',
                borderColor: 'divider',
                '&:hover': { bgcolor: preset === p.key ? PURPLE_DARK : alpha(PURPLE, 0.06) },
              }}
            >
              {p.label}
            </Button>
          ))}
        </Stack>
        <TextField
          type="date"
          size="small"
          label="From"
          value={draft.startDate}
          onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))}
          InputLabelProps={{ shrink: true }}
          inputProps={{ max: draft.endDate }}
          sx={{ width: 155 }}
        />
        <TextField
          type="date"
          size="small"
          label="To"
          value={draft.endDate}
          onChange={(e) => setDraft((d) => ({ ...d, endDate: e.target.value }))}
          InputLabelProps={{ shrink: true }}
          inputProps={{ min: draft.startDate, max: toInputDate(new Date()) }}
          sx={{ width: 155 }}
        />
        <Button
          variant="contained"
          disabled={invalid || unchanged}
          onClick={() => onChange({ ...draft }, 'custom')}
          sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700, boxShadow: 'none', '&:hover': { bgcolor: PURPLE_DARK, boxShadow: 'none' } }}
        >
          Apply
        </Button>
      </Stack>
    </Paper>
  );
}

/** Neutral KPI tile with optional delta vs previous period. */
export function KpiTile({ label, value, sub, icon, delta, deltaInverted = false, tone = 'brand', hint, loading }) {
  const t = TONES[tone] || TONES.brand;
  const showDelta = delta !== null && delta !== undefined;
  const positive = deltaInverted ? delta <= 0 : delta >= 0;
  return (
    <Paper elevation={0} sx={{ p: 2.25, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'white', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, bgcolor: t.color }} />
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Typography variant="caption" sx={{ fontWeight: 700, color: MUTED, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.68rem' }}>
            {label}
          </Typography>
          {hint ? (
            <Tooltip title={hint} arrow>
              <InfoIcon sx={{ fontSize: 14, color: '#94a3b8', cursor: 'help' }} />
            </Tooltip>
          ) : null}
        </Stack>
        {icon ? <Box sx={{ color: t.color, display: 'flex', '& svg': { fontSize: 20 } }}>{icon}</Box> : null}
      </Stack>
      {loading ? <Skeleton width="60%" height={40} /> : (
        <Typography sx={{ fontWeight: 800, color: INK, fontSize: '1.65rem', lineHeight: 1.25, mt: 0.75 }}>{value}</Typography>
      )}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5, minHeight: 20 }}>
        {showDelta && !loading ? (
          <Stack direction="row" spacing={0.25} alignItems="center" sx={{ color: positive ? '#15803d' : '#b45309' }}>
            {delta >= 0 ? <UpIcon sx={{ fontSize: 15 }} /> : <DownIcon sx={{ fontSize: 15 }} />}
            <Typography variant="caption" sx={{ fontWeight: 700 }}>{`${delta > 0 ? '+' : ''}${delta}%`}</Typography>
          </Stack>
        ) : null}
        {sub ? <Typography variant="caption" color="text.secondary" noWrap>{sub}</Typography> : null}
      </Stack>
    </Paper>
  );
}

export function SectionCard({ id, title, subtitle, action, children, icon, dense = false }) {
  return (
    <Paper id={id} elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'white', overflow: 'hidden', scrollMarginTop: 96 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} flexWrap="wrap" useFlexGap sx={{ px: 2.5, pt: 2.25, pb: dense ? 1.5 : 2 }}>
        <Stack direction="row" spacing={1.25} alignItems="flex-start">
          {icon ? <Box sx={{ color: PURPLE, display: 'flex', mt: 0.25, '& svg': { fontSize: 20 } }}>{icon}</Box> : null}
          <Box>
            <Typography sx={{ fontWeight: 700, color: INK, fontSize: '1rem' }}>{title}</Typography>
            {subtitle ? <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, maxWidth: 680 }}>{subtitle}</Typography> : null}
          </Box>
        </Stack>
        {action}
      </Stack>
      <Box sx={{ px: 2.5, pb: 2.5 }}>{children}</Box>
    </Paper>
  );
}

export function StatusPill({ label, tone = 'neutral', icon }) {
  const t = TONES[tone] || TONES.neutral;
  return (
    <Chip
      size="small"
      icon={icon}
      label={label}
      sx={{ height: 22, fontWeight: 700, fontSize: '0.7rem', bgcolor: t.bg, color: t.color, border: `1px solid ${t.border}`, '& .MuiChip-icon': { color: t.color, fontSize: 14 } }}
    />
  );
}

export function MetricBar({ label, value, caption, target, tone }) {
  const v = value === null || value === undefined ? 0 : value;
  const autoTone = tone || (value === null || value === undefined ? 'neutral' : v >= (target || 80) ? 'good' : v >= (target ? target - 20 : 60) ? 'warn' : 'bad');
  const t = TONES[autoTone];
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: INK }}>{label}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 800, color: t.color }}>{fmtPct(value)}</Typography>
      </Stack>
      <Box sx={{ position: 'relative' }}>
        <LinearProgress variant="determinate" value={Math.min(100, v)} sx={{ height: 8, borderRadius: 4, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: t.color, borderRadius: 4 } }} />
        {target ? <Box sx={{ position: 'absolute', top: -3, bottom: -3, left: `${target}%`, width: 2, bgcolor: '#334155', borderRadius: 1 }} /> : null}
      </Box>
      {caption ? <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>{caption}</Typography> : null}
    </Box>
  );
}

export function EmptyState({ children = 'No activity recorded in this period.', height = 160 }) {
  return (
    <Box sx={{ minHeight: height, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2, bgcolor: '#fafafa', px: 3 }}>
      <Typography variant="body2" color="text.secondary">{children}</Typography>
    </Box>
  );
}

export function SectionNav({ sections, active, onSelect }) {
  return (
    <Paper
      elevation={0}
      sx={{ position: 'sticky', top: 72, zIndex: 5, mb: 3, p: 0.75, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: alpha('#ffffff', 0.96), backdropFilter: 'blur(6px)', display: 'flex', gap: 0.5, overflowX: 'auto' }}
    >
      {sections.map((s) => (
        <Button
          key={s.id}
          size="small"
          onClick={() => onSelect(s.id)}
          startIcon={s.icon}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            borderRadius: 1.5,
            px: 1.5,
            color: active === s.id ? PURPLE_DARK : MUTED,
            bgcolor: active === s.id ? alpha(PURPLE, 0.1) : 'transparent',
            '&:hover': { bgcolor: alpha(PURPLE, 0.06) },
            '& .MuiButton-startIcon svg': { fontSize: 18 },
          }}
        >
          {s.label}
          {s.count ? (
            <Box component="span" sx={{ ml: 0.75, px: 0.75, borderRadius: 1, fontSize: '0.68rem', fontWeight: 800, bgcolor: s.countTone === 'bad' ? '#fee2e2' : '#f1f5f9', color: s.countTone === 'bad' ? '#b91c1c' : MUTED }}>
              {s.count}
            </Box>
          ) : null}
        </Button>
      ))}
    </Paper>
  );
}
