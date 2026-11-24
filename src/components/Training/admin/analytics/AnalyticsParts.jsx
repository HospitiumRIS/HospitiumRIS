'use client';

import React from 'react';
import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip as MuiTooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  ArrowDownward as DownIcon,
  ArrowUpward as UpIcon,
  ErrorOutline as HighIcon,
  InfoOutlined as LowIcon,
  Remove as FlatIcon,
  WarningAmber as MediumIcon,
} from '@mui/icons-material';
import { Line, LineChart, ResponsiveContainer } from 'recharts';

export const PURPLE = '#8b6cbc';
export const TEAL = '#0f766e';
export const AMBER = '#d97706';
export const btn = { textTransform: 'none', fontWeight: 700 };
export const show = (v, suffix = '') => (v === null || v === undefined ? '—' : `${v}${suffix}`);

export function monthLabel(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-GB', { month: 'short', year: '2-digit', timeZone: 'UTC' });
}

/** Change against the previous period, readable on the purple card. */
function Delta({ c }) {
  if (!c || c.change === null) {
    return <Typography variant="caption" sx={{ opacity: 0.75 }}>No earlier data to compare</Typography>;
  }
  const Icon = c.direction === 'up' ? UpIcon : c.direction === 'down' ? DownIcon : FlatIcon;
  const tone = c.good === null ? 'rgba(255,255,255,0.22)' : c.good ? 'rgba(134,239,172,0.35)' : 'rgba(254,202,202,0.4)';
  return (
    <MuiTooltip title={`Previous period: ${show(c.previous, c.unit === 'pt' ? '%' : '')}`}>
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, px: 0.75, py: 0.1, borderRadius: 1, bgcolor: tone, fontSize: 12, fontWeight: 800 }}>
          <Icon sx={{ fontSize: 13 }} />
          {`${c.change > 0 ? '+' : ''}${c.change}${c.unit === 'pt' ? ' pt' : '%'}`}
        </Box>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>vs previous</Typography>
      </Stack>
    </MuiTooltip>
  );
}

/** A purple KPI card with change and sparkline; clicking opens the trainings behind it. */
export function KpiCard({ label, value, hint, comparison, series, onClick }) {
  const points = (series || []).map((v, i) => ({ i, v }));
  const hasLine = points.filter((p) => p.v !== null && p.v !== undefined).length >= 2;
  return (
    <Paper
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => { if (onClick && e.key === 'Enter') onClick(); }}
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: PURPLE,
        color: 'white',
        minWidth: 0,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.12s, box-shadow 0.12s',
        '&:hover, &:focus-visible': onClick ? { transform: 'translateY(-2px)', boxShadow: `0 8px 20px ${alpha(PURPLE, 0.35)}`, outline: 'none' } : {},
      }}
    >
      <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 700 }}>{label}</Typography>
      <Stack direction="row" alignItems="flex-end" justifyContent="space-between" spacing={1}>
        <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.15 }}>{value}</Typography>
        {hasLine ? (
          <Box sx={{ width: 72, height: 30, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points}>
                <Line type="monotone" dataKey="v" stroke="rgba(255,255,255,0.9)" strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        ) : null}
      </Stack>
      {hint ? <Typography variant="caption" sx={{ display: 'block', opacity: 0.8, mb: 0.5 }}>{hint}</Typography> : null}
      {comparison !== undefined ? <Delta c={comparison} /> : null}
    </Paper>
  );
}

export function Card({ title, subtitle, action, children, sx }) {
  return (
    <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', minWidth: 0, ...sx }}>
      <Stack direction="row" alignItems="flex-start" spacing={1} sx={{ mb: 1.5 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{title}</Typography>
          {subtitle ? <Typography variant="caption" color="text.secondary">{subtitle}</Typography> : null}
        </Box>
        {action}
      </Stack>
      {children}
    </Paper>
  );
}

export function Stat({ value, label, tone }) {
  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 800, color: tone }}>{value}</Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Box>
  );
}

const SEVERITY = {
  high: { icon: HighIcon, color: '#b91c1c', bg: '#fef2f2', label: 'Urgent' },
  medium: { icon: MediumIcon, color: '#b45309', bg: '#fffbeb', label: 'Soon' },
  low: { icon: LowIcon, color: '#475569', bg: '#f8fafc', label: 'When you can' },
};

/** Needs-attention list: each item explains itself and links to the fix. */
export function AttentionList({ items, onOpen, limit = null }) {
  if (!items.length) {
    return <Typography variant="body2" sx={{ color: '#166534', py: 1 }}>Nothing needs attention in this period.</Typography>;
  }
  return (
    <Stack spacing={1}>
      {(limit ? items.slice(0, limit) : items).map((a) => {
        const s = SEVERITY[a.severity] || SEVERITY.low;
        const Icon = s.icon;
        return (
          <Stack key={`${a.kind}-${a.trainingId}`} direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems={{ sm: 'center' }} sx={{ p: 1.25, borderRadius: 1.5, bgcolor: s.bg, borderLeft: `4px solid ${s.color}` }}>
            <Icon sx={{ color: s.color, display: { xs: 'none', sm: 'block' } }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{a.title}</Typography>
              <Typography variant="caption" color="text.secondary">{a.detail}</Typography>
            </Box>
            <Chip size="small" label={s.label} sx={{ bgcolor: 'white', color: s.color, fontWeight: 700, display: { xs: 'none', md: 'flex' } }} />
            <Button size="small" variant="outlined" onClick={() => onOpen(a.href)} sx={{ ...btn, color: s.color, borderColor: s.color, whiteSpace: 'nowrap', bgcolor: 'white' }}>
              {a.action}
            </Button>
          </Stack>
        );
      })}
      {limit && items.length > limit ? <Typography variant="caption" color="text.secondary">and {items.length - limit} more in Operations</Typography> : null}
    </Stack>
  );
}

/** A compact table; rows can be clicked (drill-down). */
export function SimpleTable({ columns, rows, onRowClick, rowKey = 'key', empty = 'No data', maxHeight }) {
  return (
    <TableContainer sx={maxHeight ? { maxHeight } : undefined}>
      <Table size="small" stickyHeader={Boolean(maxHeight)}>
        <TableHead>
          <TableRow>
            {columns.map((c) => <TableCell key={c.key} align={c.align} sx={{ fontWeight: 700, bgcolor: '#f7f4fb', whiteSpace: 'nowrap' }}>{c.label}</TableCell>)}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r[rowKey]} hover={Boolean(onRowClick)} onClick={onRowClick ? () => onRowClick(r) : undefined} sx={onRowClick ? { cursor: 'pointer' } : undefined}>
              {columns.map((c) => <TableCell key={c.key} align={c.align} sx={c.sx}>{c.render ? c.render(r) : r[c.key]}</TableCell>)}
            </TableRow>
          ))}
          {!rows.length ? <TableRow><TableCell colSpan={columns.length} sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>{empty}</TableCell></TableRow> : null}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
