'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import { Download as DownloadIcon, Home as HomeIcon, ReceiptLong as TranscriptIcon } from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import { TRANSCRIPT_STATUS_LABELS } from '@/lib/training-transcript';

const PURPLE = '#8b6cbc';
const btn = { textTransform: 'none', fontWeight: 700 };
const fmt = (v) => (v ? new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const STATUS_SX = {
  COMPLETED: { bgcolor: '#dcfce7', color: '#166534' },
  NOT_COMPLETED: { bgcolor: '#fee2e2', color: '#b91c1c' },
  REGISTERED: { bgcolor: alpha(PURPLE, 0.12), color: PURPLE },
};

function Stat({ label, value }) {
  return (
    <Paper sx={{ flex: 1, p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>{label}</Typography>
      <Typography variant="h5" sx={{ fontWeight: 800 }}>{value}</Typography>
    </Paper>
  );
}

/** Training transcript (#108): every training, hours, CPD and certificates; PDF export. */
export default function TrainingTranscriptPage() {
  const router = useRouter();
  const [year, setYear] = useState('all');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/training/my/transcript${year === 'all' ? '' : `?year=${year}`}`, { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Could not load your transcript');
      setData(json);
    } catch (err) {
      setError(err.message);
    }
  }, [year]);

  useEffect(() => { load(); }, [load]);

  const pdfHref = `/api/training/my/transcript?format=pdf${year === 'all' ? '' : `&year=${year}`}`;

  return (
    <Box>
      <PageHeader
        title="Training transcript"
        description="Every training you took part in, with hours, CPD and certificate numbers."
        icon={<TranscriptIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/researcher' },
          { label: 'Training', path: '/researcher/training' },
          { label: 'Transcript' },
        ]}
        actionButton={(
          <Button variant="contained" startIcon={<DownloadIcon />} component="a" href={pdfHref} disabled={!data?.rows?.length} sx={{ bgcolor: 'white', color: PURPLE, ...btn, '&:hover': { bgcolor: '#f5f5f5' } }}>
            Download PDF
          </Button>
        )}
      />
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Stack spacing={2}>
          {error ? <Alert severity="error" onClose={() => setError('')}>{error}</Alert> : null}
          {!data && !error ? <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress sx={{ color: PURPLE }} /></Box> : null}
          {data ? (
            <>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
                <TextField select size="small" label="Year" value={year} onChange={(e) => setYear(e.target.value)} sx={{ minWidth: 160 }}>
                  <MenuItem value="all">All years</MenuItem>
                  {data.years.map((y) => <MenuItem key={y} value={String(y)}>{y}</MenuItem>)}
                </TextField>
                <Typography variant="caption" color="text.secondary">
                  Hours are the sessions you attended (present or late). CPD counts once a training is completed.
                </Typography>
              </Stack>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Stat label="Trainings" value={data.totals.trainings} />
                <Stat label="Completed" value={data.totals.completed} />
                <Stat label="Contact hours" value={data.totals.contactHours} />
                <Stat label="CPD hours" value={data.totals.cpdHours} />
                <Stat label="CPD points" value={data.totals.cpdPoints} />
              </Stack>

              <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: alpha(PURPLE, 0.06) }}>
                        {['Training', 'Dates', 'Status', 'Hours', 'CPD', 'Certificate'].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.rows.map((r) => (
                        <TableRow key={r.registrationId} hover onClick={() => router.push(`/researcher/training/${r.trainingId}`)} sx={{ cursor: 'pointer' }}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{r.title}</Typography>
                            {r.code ? <Typography variant="caption" color="text.secondary">{r.code}</Typography> : null}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmt(r.startDate)} – {fmt(r.endDate)}</TableCell>
                          <TableCell>
                            <Chip size="small" label={TRANSCRIPT_STATUS_LABELS[r.status]} sx={{ fontWeight: 700, ...STATUS_SX[r.status] }} />
                            {r.status === 'COMPLETED' && r.completedAt ? <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{fmt(r.completedAt)}</Typography> : null}
                          </TableCell>
                          <TableCell>{r.contactHours}</TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            {[r.cpdHours ? `${r.cpdHours} h` : null, r.cpdPoints ? `${r.cpdPoints} pts` : null].filter(Boolean).join(' · ') || '—'}
                            {r.accreditationBody ? <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{r.accreditationBody}</Typography> : null}
                          </TableCell>
                          <TableCell>
                            {r.certificateNumber || '—'}
                            {r.certificateExpiresAt ? <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>valid until {fmt(r.certificateExpiresAt)}</Typography> : null}
                          </TableCell>
                        </TableRow>
                      ))}
                      {!data.rows.length ? (
                        <TableRow><TableCell colSpan={6} sx={{ py: 4, textAlign: 'center' }}><Typography color="text.secondary">No trainings {year === 'all' ? 'yet' : `in ${year}`}.</Typography></TableCell></TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              {data.cpd.length ? (
                <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>CPD by year and accreditation body</Typography>
                  <Stack spacing={0.75}>
                    {data.cpd.map((c) => (
                      <Stack key={`${c.year}-${c.body}`} direction="row" justifyContent="space-between" spacing={2}>
                        <Typography variant="body2">{c.year} · {c.body}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {c.hours} h{c.points ? ` · ${c.points} pts` : ''} <Typography component="span" variant="caption" color="text.secondary">({c.trainings})</Typography>
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Paper>
              ) : null}
            </>
          ) : null}
        </Stack>
      </Container>
    </Box>
  );
}
