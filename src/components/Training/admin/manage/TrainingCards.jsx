'use client';

import React from 'react';
import { Box, Checkbox, Chip, Paper, Stack, Typography, alpha } from '@mui/material';
import { Event as EventIcon, Place as PlaceIcon } from '@mui/icons-material';
import { DELIVERY_MODE_LABELS } from '@/lib/training-sessions';
import { AlertBadge, FillBar, PURPLE, PhaseChip, RowMenu, SetupProgress, dateRange } from './ManageParts';

const when = (v) => new Date(v).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Cohort cards: the same rows as the table, easier to scan on small screens. */
export default function TrainingCards({ rows, selected, onToggle, onOpen, onAction }) {
  if (!rows.length) return null;
  return (
    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' } }}>
      {rows.map((r) => (
        <Paper
          key={r.id}
          onClick={() => onOpen(r)}
          sx={{
            p: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: selected.includes(r.id) ? PURPLE : 'divider',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            transition: 'box-shadow 0.15s, transform 0.15s',
            '&:hover': { boxShadow: `0 8px 20px ${alpha(PURPLE, 0.15)}`, transform: 'translateY(-2px)' },
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Checkbox size="small" checked={selected.includes(r.id)} onClick={(e) => e.stopPropagation()} onChange={() => onToggle(r.id)} sx={{ p: 0.25, '&.Mui-checked': { color: PURPLE } }} />
            <PhaseChip phase={r.phase} />
            {r.isMandatory ? <Chip size="small" label="Mandatory" sx={{ height: 22, fontWeight: 700, bgcolor: alpha(PURPLE, 0.1), color: PURPLE }} /> : null}
            <Box sx={{ flex: 1 }} />
            <RowMenu row={r} onAction={onAction} />
          </Stack>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.3 }}>{r.title}</Typography>
            <Typography variant="caption" color="text.secondary">{[r.code, r.category, r.department].filter(Boolean).join(' · ')}</Typography>
          </Box>
          <Stack spacing={0.4}>
            <Stack direction="row" spacing={0.75} alignItems="center"><EventIcon sx={{ fontSize: 16, color: 'text.secondary' }} /><Typography variant="body2">{dateRange(r.startDate, r.endDate)} · {r.sessionsCount} session{r.sessionsCount === 1 ? '' : 's'}</Typography></Stack>
            <Stack direction="row" spacing={0.75} alignItems="center"><PlaceIcon sx={{ fontSize: 16, color: 'text.secondary' }} /><Typography variant="body2" noWrap>{[DELIVERY_MODE_LABELS[r.deliveryMode], r.venue].filter(Boolean).join(' · ') || '—'}</Typography></Stack>
          </Stack>
          <FillBar row={r} />
          {r.nextSession ? (
            <Typography variant="caption" sx={{ color: r.nextSession.state === 'live' ? '#166534' : 'text.secondary', fontWeight: r.nextSession.state === 'live' ? 800 : 400 }}>
              {r.nextSession.state === 'live' ? 'Live now: ' : 'Next: '}{r.nextSession.title} · {when(r.nextSession.startsAt)}
            </Typography>
          ) : null}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 'auto' }}>
            <SetupProgress row={r} />
            <Box sx={{ flex: 1 }} />
            <AlertBadge row={r} />
          </Stack>
        </Paper>
      ))}
    </Box>
  );
}
