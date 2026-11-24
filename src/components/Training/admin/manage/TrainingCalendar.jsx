'use client';

import React, { useMemo, useState } from 'react';
import { Box, Button, IconButton, Paper, Stack, Tooltip, Typography, alpha } from '@mui/material';
import { ChevronLeft as PrevIcon, ChevronRight as NextIcon } from '@mui/icons-material';
import { PHASE_CHIP, monthGrid } from '@/lib/training-manage';
import { PURPLE } from './ManageParts';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const localKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const time = (v) => new Date(v).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

/**
 * Month calendar of the sessions of the listed trainings. Trainings without sessions show
 * on their start date. Click an entry to open the training's quick look.
 */
export default function TrainingCalendar({ rows, sessions, onOpen }) {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  });
  const byId = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);
  const byDay = useMemo(() => {
    const m = new Map();
    const add = (key, entry) => m.set(key, [...(m.get(key) || []), entry]);
    const withSessions = new Set();
    for (const s of sessions) {
      const r = byId.get(s.trainingId);
      if (!r) continue;
      withSessions.add(r.id);
      add(localKey(new Date(s.startsAt)), { id: s.id, row: r, label: s.title, at: s.startsAt });
    }
    for (const r of rows) if (!withSessions.has(r.id) && r.startDate) add(localKey(new Date(r.startDate)), { id: `t-${r.id}`, row: r, label: 'Starts', at: r.startDate });
    for (const list of m.values()) list.sort((a, b) => new Date(a.at) - new Date(b.at));
    return m;
  }, [rows, sessions, byId]);
  const weeks = monthGrid(month);
  const today = localKey(new Date());
  const shift = (n) => setMonth((m) => new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + n, 1)));

  return (
    <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
        <IconButton size="small" onClick={() => shift(-1)} aria-label="Previous month"><PrevIcon /></IconButton>
        <IconButton size="small" onClick={() => shift(1)} aria-label="Next month"><NextIcon /></IconButton>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, flex: 1 }}>{month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</Typography>
        <Button size="small" onClick={() => { const n = new Date(); setMonth(new Date(Date.UTC(n.getFullYear(), n.getMonth(), 1))); }} sx={{ textTransform: 'none', fontWeight: 700, color: PURPLE }}>Today</Button>
      </Stack>
      <Box sx={{ overflowX: 'auto' }}>
        <Box sx={{ minWidth: 760 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', bgcolor: alpha(PURPLE, 0.05) }}>
            {DAYS.map((d) => <Typography key={d} variant="caption" sx={{ px: 1, py: 0.75, fontWeight: 800, color: 'text.secondary' }}>{d}</Typography>)}
          </Box>
          {weeks.map((week) => (
            <Box key={week[0].key} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderTop: '1px solid', borderColor: 'divider' }}>
              {week.map((day) => {
                const entries = byDay.get(day.key) || [];
                return (
                  <Box key={day.key} sx={{ minHeight: 104, p: 0.75, borderRight: '1px solid', borderColor: 'divider', bgcolor: day.inMonth ? 'background.paper' : '#f8fafc' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: day.key === today ? 'white' : day.inMonth ? 'text.primary' : 'text.disabled', bgcolor: day.key === today ? PURPLE : 'transparent', borderRadius: 5, px: 0.75 }}>
                      {day.date.getUTCDate()}
                    </Typography>
                    <Stack spacing={0.4} sx={{ mt: 0.5 }}>
                      {entries.slice(0, 3).map((e) => {
                        const c = PHASE_CHIP[e.row.phase] || PHASE_CHIP.draft;
                        return (
                          <Tooltip key={e.id} title={`${e.row.title} · ${e.label} · ${time(e.at)}`}>
                            <Box onClick={() => onOpen(e.row)} sx={{ px: 0.75, py: 0.25, borderRadius: 1, bgcolor: c.bg, color: c.color, borderLeft: `3px solid ${c.color}`, cursor: 'pointer', fontSize: 12, fontWeight: 700, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                              {time(e.at)} {e.row.title}
                            </Box>
                          </Tooltip>
                        );
                      })}
                      {entries.length > 3 ? <Typography variant="caption" color="text.secondary">+{entries.length - 3} more</Typography> : null}
                    </Stack>
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  );
}
