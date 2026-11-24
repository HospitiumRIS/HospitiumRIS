'use client';

import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  Check as CheckIcon,
  PriorityHigh as OverdueIcon,
  Schedule as SoonIcon,
  MoreVert as MoreIcon,
  TaskAlt as DeliverIcon,
} from '@mui/icons-material';
import StatusPill from '@/components/common/StatusPill';
import { InstitutionModal, InstitutionModalBody, InstitutionModalFooter, InstitutionModalHeader } from '@/components/GlobalAdmin/InstitutionModalShell';
import { dueText, flowSummary } from '@/lib/proposal-progress';

const PURPLE = '#8b6cbc';
const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

const DOT = {
  done: { bg: '#10b981', border: '#10b981', icon: <CheckIcon sx={{ fontSize: 14, color: 'white' }} /> },
  delivered: { bg: '#10b981', border: '#10b981', icon: <CheckIcon sx={{ fontSize: 14, color: 'white' }} /> },
  overdue: { bg: '#ef4444', border: '#ef4444', icon: <OverdueIcon sx={{ fontSize: 13, color: 'white' }} /> },
  due_soon: { bg: '#fff7ed', border: '#f59e0b', icon: <SoonIcon sx={{ fontSize: 13, color: '#d97706' }} /> },
  in_progress: { bg: '#eff6ff', border: '#3b82f6', icon: null },
  upcoming: { bg: 'white', border: '#cbd5e1', icon: null },
  no_date: { bg: 'white', border: '#cbd5e1', icon: null },
  cancelled: { bg: '#f1f5f9', border: '#cbd5e1', icon: null },
};

/**
 * Milestones or deliverables as a vertical flow: what's done, what's overdue and what
 * is due next. Deliverables can be marked delivered (`canMark`).
 */
export default function ProgressFlow({ title, icon, items, kind = 'milestone', canMark = false, onMark, emptyText }) {
  const [filter, setFilter] = useState('open');
  const [menu, setMenu] = useState(null);
  const [dialog, setDialog] = useState(null); // { item, delivered }
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const summary = useMemo(() => flowSummary(items), [items]);
  const isDone = (i) => i.state === 'done' || i.state === 'delivered';
  const shown = filter === 'all' ? items : filter === 'done' ? items.filter(isDone) : items.filter((i) => !isDone(i));

  const confirm = async () => {
    setBusy(true);
    setError('');
    try {
      await onMark(dialog.item, dialog.delivered, note);
      setDialog(null);
    } catch (err) {
      setError(err.message || 'That did not work');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ width: 34, height: 34, borderRadius: 1.5, bgcolor: alpha(PURPLE, 0.1), color: PURPLE, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{icon}</Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>{title}</Typography>
            <Typography variant="caption" color="text.secondary">
              {summary.total ? `${summary.done} of ${summary.total} ${kind === 'deliverable' ? 'delivered' : 'completed'}` : 'None planned'}
              {summary.overdue ? ` · ${summary.overdue} overdue` : ''}
              {summary.dueSoon ? ` · ${summary.dueSoon} due within 30 days` : ''}
            </Typography>
          </Box>
        </Stack>
        {items.length ? (
          <ToggleButtonGroup size="small" exclusive value={filter} onChange={(_, v) => v && setFilter(v)} sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 700, px: 1.5, py: 0.25 }, '& .Mui-selected': { color: `${PURPLE} !important`, bgcolor: `${alpha(PURPLE, 0.1)} !important` } }}>
            <ToggleButton value="open">Open ({summary.total - summary.done})</ToggleButton>
            <ToggleButton value="done">Done ({summary.done})</ToggleButton>
            <ToggleButton value="all">All</ToggleButton>
          </ToggleButtonGroup>
        ) : null}
      </Stack>

      {summary.total ? (
        <Box sx={{ height: 6, borderRadius: 3, bgcolor: '#eef2f7', overflow: 'hidden', mb: 2.5 }}>
          <Box sx={{ width: `${summary.percent}%`, height: '100%', bgcolor: summary.percent === 100 ? '#10b981' : PURPLE, transition: 'width .3s' }} />
        </Box>
      ) : null}

      {!items.length ? <Typography variant="body2" color="text.secondary">{emptyText}</Typography> : null}
      {items.length && !shown.length ? <Typography variant="body2" color="text.secondary">{filter === 'done' ? 'Nothing completed yet.' : 'Everything is done.'}</Typography> : null}

      <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {shown.map((item, idx) => {
          const dot = DOT[item.state] || DOT.upcoming;
          const last = idx === shown.length - 1;
          const done = isDone(item);
          const when = done
            ? `${kind === 'deliverable' ? 'Delivered' : 'Completed'} ${fmt(item.doneAt) || ''}${item.deliveredByName ? ` by ${item.deliveredByName}` : ''}`.trim()
            : item.due ? `Due ${fmt(item.due)}` : 'No due date';
          const rel = dueText(item);
          return (
            <Box component="li" key={item.id} sx={{ display: 'flex', gap: 1.75 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24, flexShrink: 0 }}>
                <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: dot.bg, border: `2px solid ${dot.border}`, display: 'grid', placeItems: 'center', mt: 1.25 }}>{dot.icon}</Box>
                {!last ? <Box sx={{ width: 2, flex: 1, bgcolor: done ? '#a7f3d0' : '#e5e7eb', my: 0.5 }} /> : null}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0, mb: last ? 0 : 1.25, p: 1.5, borderRadius: 2, border: '1px solid', borderColor: item.state === 'overdue' ? '#fecaca' : done ? '#d1fae5' : '#eef2f7', bgcolor: item.state === 'overdue' ? '#fffbfb' : done ? '#f6fefa' : '#fbfcfe' }}>
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', lineHeight: 1.4 }}>{item.title}</Typography>
                    {item.description ? <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>{item.description}</Typography> : null}
                    <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
                      <Typography variant="caption" sx={{ color: done ? '#047857' : item.state === 'overdue' ? '#b91c1c' : '#475569', fontWeight: 600 }}>{when}</Typography>
                      {rel ? <Typography variant="caption" sx={{ color: item.state === 'overdue' ? '#b91c1c' : item.state === 'due_soon' ? '#b45309' : '#64748b' }}>· {rel}</Typography> : null}
                      {item.type ? <Chip size="small" label={item.type} sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#ccfbf1', color: '#0f766e' }} /> : null}
                      {item.milestone ? <Chip size="small" label={`Milestone: ${item.milestone}`} sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, bgcolor: alpha(PURPLE, 0.08), color: PURPLE, maxWidth: 260 }} /> : null}
                      {kind === 'milestone' && !done && item.progress ? <Typography variant="caption" color="text.secondary">· {item.progress}% progress</Typography> : null}
                    </Stack>
                    {item.deliveryNote ? <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>“{item.deliveryNote}”</Typography> : null}
                  </Box>
                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
                    <StatusPill label={item.label} tone={item.tone} />
                    {canMark && kind === 'deliverable' && !done && item.state !== 'cancelled' ? (
                      <Tooltip title="Mark as delivered">
                        <Button size="small" startIcon={<DeliverIcon />} onClick={() => { setNote(''); setError(''); setDialog({ item, delivered: true }); }} sx={{ textTransform: 'none', fontWeight: 700, color: PURPLE, display: { xs: 'none', sm: 'inline-flex' } }}>Delivered</Button>
                      </Tooltip>
                    ) : null}
                    {canMark && kind === 'deliverable' ? (
                      <IconButton size="small" aria-label="More" onClick={(e) => setMenu({ anchor: e.currentTarget, item })}><MoreIcon fontSize="small" /></IconButton>
                    ) : null}
                  </Stack>
                </Stack>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(null)}>
        {menu && !isDone(menu.item) ? <MenuItem onClick={() => { setNote(''); setError(''); setDialog({ item: menu.item, delivered: true }); setMenu(null); }}>Mark as delivered</MenuItem> : null}
        {menu && isDone(menu.item) ? <MenuItem onClick={() => { setError(''); setDialog({ item: menu.item, delivered: false }); setMenu(null); }}>Mark as not delivered</MenuItem> : null}
      </Menu>

      <InstitutionModal open={Boolean(dialog)} onClose={() => setDialog(null)} disableClose={busy} maxWidth="xs">
        <InstitutionModalHeader icon={DeliverIcon} title={dialog?.delivered ? 'Mark as delivered' : 'Mark as not delivered'} subtitle={dialog?.item?.title} onClose={() => setDialog(null)} disableClose={busy} />
        <InstitutionModalBody>
          {error ? <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert> : null}
          {dialog?.delivered ? (
            <TextField size="small" fullWidth multiline minRows={2} label="Note (optional)" placeholder="e.g. Submitted to the funder portal on 24 Nov" value={note} onChange={(e) => setNote(e.target.value)} />
          ) : <Typography variant="body2">The deliverable goes back to pending.</Typography>}
        </InstitutionModalBody>
        <InstitutionModalFooter>
          <Button onClick={() => setDialog(null)} disabled={busy} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={confirm} disabled={busy} sx={{ textTransform: 'none', fontWeight: 700, bgcolor: PURPLE }}>{busy ? 'Saving…' : 'Confirm'}</Button>
        </InstitutionModalFooter>
      </InstitutionModal>
    </Paper>
  );
}
