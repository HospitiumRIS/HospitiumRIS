'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Download as DownloadIcon, Star as StarIcon, VisibilityOff as AnonIcon } from '@mui/icons-material';
import { LIKERT_LABELS } from '@/lib/training-feedback';

const PURPLE = '#8b6cbc';

function Bars({ distribution, total }) {
  return (
    <Stack spacing={0.5}>
      {distribution.map((d) => {
        const pct = total ? Math.round((d.count / total) * 100) : 0;
        return (
          <Stack key={d.label} direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" sx={{ width: 130, flexShrink: 0 }} noWrap>{d.label}</Typography>
            <LinearProgress variant="determinate" value={pct} sx={{ flex: 1, height: 10, borderRadius: 5, bgcolor: alpha(PURPLE, 0.1), '& .MuiLinearProgress-bar': { bgcolor: PURPLE } }} />
            <Typography variant="caption" sx={{ width: 64, textAlign: 'right' }}>{d.count} ({pct}%)</Typography>
          </Stack>
        );
      })}
    </Stack>
  );
}

function headline(q) {
  if (q.type === 'NPS') return q.nps === null || q.nps === undefined ? '—' : `${q.nps > 0 ? '+' : ''}${q.nps}`;
  if (q.type === 'RATING') return q.average === null ? '—' : `${q.average} / 5`;
  if (q.type === 'LIKERT') return q.average === null ? '—' : `${q.average} / 5`;
  return null;
}

const display = (q, v) => {
  if (v === undefined || v === null || v === '') return '—';
  if (q.type === 'LIKERT') return LIKERT_LABELS[v - 1] || v;
  return String(v);
};

/**
 * Feedback results (#106) for admins and facilitators. The server decides what the
 * viewer may see: facilitators of an anonymous form get no names, ids or times.
 */
export default function FeedbackResults({ trainingId, refreshKey = 0 }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/training/${trainingId}/feedback/results`, { credentials: 'include', cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Could not load feedback');
      setData(json);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [trainingId]);

  useEffect(() => { load(); }, [load, refreshKey]);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress sx={{ color: PURPLE }} /></Box>;
  if (!data.form) return <Alert severity="info">No feedback form applies to this training yet.</Alert>;

  const { summary, form } = data;
  const rate = data.participants ? Math.round((summary.responses / data.participants) * 100) : 0;

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{summary.responses} of {data.participants} participants answered ({rate}%)</Typography>
          {data.role === 'facilitator' && data.anonymous ? (
            <Chip size="small" icon={<AnonIcon sx={{ fontSize: 16 }} />} label="Anonymous: you see answers, not who gave them" sx={{ mt: 0.5 }} />
          ) : null}
        </Box>
        <Button
          size="small"
          variant="outlined"
          startIcon={<DownloadIcon />}
          disabled={!summary.responses}
          component="a"
          href={`/api/training/${trainingId}/feedback/results?format=csv`}
          sx={{ borderColor: PURPLE, color: PURPLE, textTransform: 'none', fontWeight: 700 }}
        >
          Export CSV
        </Button>
      </Stack>

      {summary.questions.map((q) => (
        <Paper key={q.id} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ mb: q.type === 'TEXT' ? 1 : 1.25 }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{q.label}</Typography>
              <Typography variant="caption" color="text.secondary">{q.answered} answer(s){q.type === 'NPS' ? ' · NPS = % 9–10 minus % 0–6' : ''}</Typography>
            </Box>
            {headline(q) ? (
              <Stack direction="row" spacing={0.5} alignItems="center">
                {q.type === 'RATING' ? <StarIcon sx={{ color: '#f59e0b' }} /> : null}
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{headline(q)}</Typography>
              </Stack>
            ) : null}
          </Stack>
          {q.type === 'TEXT' ? (
            q.texts.length ? (
              <Stack spacing={0.75}>
                {q.texts.map((t, i) => (
                  <Paper key={i} variant="outlined" sx={{ p: 1, bgcolor: '#f8fafc' }}><Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{t}</Typography></Paper>
                ))}
              </Stack>
            ) : <Typography variant="body2" color="text.secondary">No comments.</Typography>
          ) : <Bars distribution={q.distribution} total={q.answered} />}
        </Paper>
      ))}

      {data.showNames && data.responses.length ? (
        <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, p: 2, pb: 1 }}>Responses</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(PURPLE, 0.06) }}>
                  <TableCell sx={{ fontWeight: 700 }}>Participant</TableCell>
                  {form.questions.filter((q) => q.type !== 'TEXT').map((q) => <TableCell key={q.id} sx={{ fontWeight: 700, minWidth: 110 }}>{q.label}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.responses.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{r.respondent?.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString('en-GB') : ''}</Typography>
                    </TableCell>
                    {form.questions.filter((q) => q.type !== 'TEXT').map((q) => <TableCell key={q.id}>{display(q, r.answers?.[q.id])}</TableCell>)}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : null}
    </Stack>
  );
}
