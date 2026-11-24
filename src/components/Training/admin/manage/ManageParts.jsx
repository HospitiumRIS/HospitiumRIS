'use client';

import React, { useState } from 'react';
import { Box, Chip, IconButton, LinearProgress, ListItemIcon, ListItemText, Menu, MenuItem, Stack, Tooltip, Typography, Divider, alpha } from '@mui/material';
import {
  Block as CancelIcon,
  ContentCopy as DuplicateIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MoreVert as MoreIcon,
  OpenInNew as OpenIcon,
  Publish as PublishIcon,
  Visibility as QuickIcon,
} from '@mui/icons-material';
import { PHASE_CHIP } from '@/lib/training-manage';

export const PURPLE = '#8b6cbc';

export function PhaseChip({ phase, size = 'small' }) {
  const c = PHASE_CHIP[phase] || PHASE_CHIP.draft;
  return <Chip size={size} label={c.label} sx={{ bgcolor: c.bg, color: c.color, fontWeight: 800, height: 22 }} />;
}

export function dateRange(start, end) {
  if (!start) return 'Dates not set';
  const a = new Date(start);
  const b = new Date(end || start);
  const f = (d, opts) => d.toLocaleDateString('en-GB', opts);
  if (a.toDateString() === b.toDateString()) return f(a, { day: 'numeric', month: 'short', year: 'numeric' });
  if (a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()) return `${a.getDate()}–${f(b, { day: 'numeric', month: 'short', year: 'numeric' })}`;
  if (a.getFullYear() === b.getFullYear()) return `${f(a, { day: 'numeric', month: 'short' })} – ${f(b, { day: 'numeric', month: 'short', year: 'numeric' })}`;
  return `${f(a, { day: 'numeric', month: 'short', year: 'numeric' })} – ${f(b, { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

/** Places taken as a bar, with waiting list and approvals underneath. */
export function FillBar({ row }) {
  const pct = row.capacity ? Math.min(100, Math.round((row.seated / row.capacity) * 100)) : 0;
  const color = pct >= 100 ? '#dc2626' : pct >= 80 ? '#d97706' : PURPLE;
  return (
    <Box sx={{ minWidth: 120 }}>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.seated}/{row.capacity}</Typography>
      <LinearProgress variant="determinate" value={pct} sx={{ height: 5, borderRadius: 3, my: 0.4, bgcolor: alpha(PURPLE, 0.12), '& .MuiLinearProgress-bar': { bgcolor: color } }} />
      {row.waitlisted || row.pending ? (
        <Typography variant="caption" color="text.secondary">{[row.waitlisted ? `${row.waitlisted} waiting` : null, row.pending ? `${row.pending} to approve` : null].filter(Boolean).join(' · ')}</Typography>
      ) : null}
    </Box>
  );
}

/** Amber "to act on" count with the breakdown in a tooltip. */
export function AlertBadge({ row }) {
  if (!row.alertTotal) return null;
  const a = row.alerts;
  const parts = [
    a.pending ? `${a.pending} to approve` : null,
    a.unmarked ? `${a.unmarked} session(s) without attendance` : null,
    a.needsGrading ? `${a.needsGrading} to grade` : null,
    a.undecided ? `${a.undecided} completion undecided` : null,
    a.certificatesDue ? `${a.certificatesDue} certificate(s) to issue` : null,
  ].filter(Boolean);
  return (
    <Tooltip title={parts.join(' · ')}>
      <Box component="span" sx={{ px: 0.9, py: 0.1, borderRadius: 5, fontSize: 12, fontWeight: 800, bgcolor: '#fef3c7', color: '#92400e', whiteSpace: 'nowrap' }}>{row.alertTotal} to act on</Box>
    </Tooltip>
  );
}

/** Setup progress for drafts and upcoming trainings. */
export function SetupProgress({ row }) {
  if (row.phase === 'cancelled' || row.phase === 'ended' || row.setup.percent === 100) return null;
  return (
    <Tooltip title={row.setup.next ? `Next: ${row.setup.next.label}` : ''}>
      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.5 }}>
        <LinearProgress variant="determinate" value={row.setup.percent} sx={{ width: 60, height: 4, borderRadius: 2, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: '#16a34a' } }} />
        <Typography variant="caption" color="text.secondary">Setup {row.setup.done}/{row.setup.total}</Typography>
      </Stack>
    </Tooltip>
  );
}

/** Row actions. onAction(action, row): open | quick | edit | duplicate | publish | cancel | delete */
export function RowMenu({ row, onAction }) {
  const [anchor, setAnchor] = useState(null);
  const item = (key, Icon, label, show = true, danger = false) => (show ? (
    <MenuItem key={key} onClick={(e) => { e.stopPropagation(); setAnchor(null); onAction(key, row); }} sx={danger ? { color: '#b91c1c' } : undefined}>
      <ListItemIcon sx={danger ? { color: '#b91c1c' } : undefined}><Icon fontSize="small" /></ListItemIcon>
      <ListItemText>{label}</ListItemText>
    </MenuItem>
  ) : null);
  const live = row.phase === 'upcoming' || row.phase === 'running';
  return (
    <>
      <IconButton size="small" aria-label={`Actions for ${row.title}`} onClick={(e) => { e.stopPropagation(); setAnchor(e.currentTarget); }}><MoreIcon fontSize="small" /></IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} onClick={(e) => e.stopPropagation()}>
        {item('open', OpenIcon, 'Open workspace')}
        {item('quick', QuickIcon, 'Quick look')}
        {item('edit', EditIcon, 'Edit details')}
        {item('duplicate', DuplicateIcon, 'Duplicate as new cohort')}
        {row.phase === 'draft' || live ? <Divider /> : null}
        {item('publish', PublishIcon, 'Publish', row.phase === 'draft')}
        {item('cancel', CancelIcon, 'Cancel training', live, true)}
        {item('delete', DeleteIcon, 'Delete draft', row.phase === 'draft', true)}
      </Menu>
    </>
  );
}
