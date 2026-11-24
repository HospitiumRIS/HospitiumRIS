'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Download as DownloadIcon, PlayArrow as RunIcon, SmartToy as SystemIcon } from '@mui/icons-material';

const PURPLE = '#8b6cbc';
const btn = { textTransform: 'none', fontWeight: 700 };

/**
 * Activity tab (#110): the training's audit log with filters, change details and CSV
 * export, plus a button to run the training automation now.
 */
export default function TrainingActivityTab({ trainingId }) {
  const [filters, setFilters] = useState({ action: '', actor: '', from: '', to: '', q: '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [running, setRunning] = useState(false);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) if (v) p.set(k, v);
    return p.toString();
  }, [filters]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/training/${trainingId}/activity?${query}&page=${page}`, { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Could not load activity');
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [trainingId, query, page]);

  useEffect(() => { load(); }, [load]);

  const set = (patch) => { setPage(1); setFilters((f) => ({ ...f, ...patch })); };

  const runNow = async () => {
    setRunning(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch('/api/training/automation', { method: 'POST' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || json.message || 'The automation did not finish');
      setNotice(`Automation ran: ${json.message}. Nothing is ever sent twice.`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Stack spacing={2}>
      <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between">
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Activity</Typography>
            <Typography variant="body2" color="text.secondary">
              Every change to registrations, attendance, completion, certificates, assessments and feedback, with who made it. Automatic changes show as System.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ alignSelf: 'flex-start' }}>
            <Button size="small" variant="outlined" startIcon={<RunIcon />} disabled={running} onClick={runNow} sx={{ borderColor: PURPLE, color: PURPLE, ...btn, whiteSpace: 'nowrap' }}>
              {running ? 'Running…' : 'Run automation now'}
            </Button>
            <Button size="small" startIcon={<DownloadIcon />} component="a" href={`/api/training/${trainingId}/activity?${query}&format=csv`} sx={{ color: PURPLE, ...btn }}>CSV</Button>
          </Stack>
        </Stack>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mt: 1.5 }}>
          <TextField select size="small" label="Action" value={filters.action} onChange={(e) => set({ action: e.target.value })} sx={{ minWidth: 240 }}>
            <MenuItem value="">All actions</MenuItem>
            {(data?.actions || []).map((a) => <MenuItem key={a.action} value={a.action}>{a.label} ({a.count})</MenuItem>)}
          </TextField>
          <TextField select size="small" label="By" value={filters.actor} onChange={(e) => set({ actor: e.target.value })} sx={{ minWidth: 160 }}>
            <MenuItem value="">Anyone</MenuItem>
            <MenuItem value="me">Me</MenuItem>
            <MenuItem value="system">System</MenuItem>
          </TextField>
          <TextField size="small" type="date" label="From" value={filters.from} onChange={(e) => set({ from: e.target.value })} InputLabelProps={{ shrink: true }} />
          <TextField size="small" type="date" label="To" value={filters.to} onChange={(e) => set({ to: e.target.value })} InputLabelProps={{ shrink: true }} />
          <TextField size="small" label="Record id or reason" value={filters.q} onChange={(e) => set({ q: e.target.value })} sx={{ flex: 1 }} />
        </Stack>
        {loading ? <LinearProgress sx={{ mt: 1.5, '& .MuiLinearProgress-bar': { bgcolor: PURPLE } }} /> : null}
      </Paper>

      {error ? <Alert severity="error" onClose={() => setError('')}>{error}</Alert> : null}
      {notice ? <Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert> : null}

      {data ? (
        <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          {data.rows.length ? data.rows.map((r, i) => (
            <Stack key={r.id} direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 0.5, md: 2 }} sx={{ p: 1.5, borderTop: i ? '1px solid' : 'none', borderColor: 'divider' }}>
              <Box sx={{ minWidth: 170 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{new Date(r.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Typography>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  {r.actorId ? null : <SystemIcon sx={{ fontSize: 14, color: 'text.secondary' }} />}
                  <Typography variant="caption" color="text.secondary">{r.actor}</Typography>
                </Stack>
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
                  <Chip size="small" label={r.label} sx={{ fontWeight: 700, bgcolor: alpha(PURPLE, 0.1), color: PURPLE }} />
                  <Typography variant="caption" color="text.secondary">{r.entityType} · {r.entityId}</Typography>
                </Stack>
                {r.changes.length ? (
                  <Stack spacing={0.25} sx={{ mt: 0.5 }}>
                    {r.changes.slice(0, 6).map((c) => (
                      <Typography key={c.field} variant="caption" sx={{ display: 'block', wordBreak: 'break-word' }}>
                        <strong>{c.field}</strong>: {c.from.length > 80 ? `${c.from.slice(0, 80)}…` : c.from} → {c.to.length > 80 ? `${c.to.slice(0, 80)}…` : c.to}
                      </Typography>
                    ))}
                    {r.changes.length > 6 ? <Typography variant="caption" color="text.secondary">and {r.changes.length - 6} more (see CSV)</Typography> : null}
                  </Stack>
                ) : null}
                {r.reason ? <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>Reason: {r.reason}</Typography> : null}
              </Box>
            </Stack>
          )) : (
            <Typography color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>No activity matches.</Typography>
          )}
          {data.total > data.pageSize ? (
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary">{data.total} entries</Typography>
              <Pagination size="small" page={page} count={Math.ceil(data.total / data.pageSize)} onChange={(_, v) => setPage(v)} />
            </Stack>
          ) : null}
        </Paper>
      ) : null}
    </Stack>
  );
}
