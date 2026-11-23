'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControlLabel,
  Paper,
  Radio,
  RadioGroup,
  Rating,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { ArrowBack as BackIcon, CheckCircle as DoneIcon, RateReview as FeedbackIcon } from '@mui/icons-material';
import { LIKERT_LABELS } from '@/lib/training-feedback';

const PURPLE = '#8b6cbc';

function Question({ q, value, onChange, readOnly }) {
  if (q.type === 'RATING') {
    return <Rating size="large" value={value ?? null} readOnly={readOnly} onChange={(_, v) => onChange(v)} />;
  }
  if (q.type === 'LIKERT') {
    return (
      <ToggleButtonGroup exclusive size="small" value={value ?? null} disabled={readOnly} onChange={(_, v) => v !== null && onChange(v)} sx={{ flexWrap: 'wrap' }}>
        {LIKERT_LABELS.map((label, i) => (
          <ToggleButton key={label} value={i + 1} sx={{ textTransform: 'none', '&.Mui-selected': { bgcolor: PURPLE, color: 'white', '&:hover': { bgcolor: PURPLE } } }}>{label}</ToggleButton>
        ))}
      </ToggleButtonGroup>
    );
  }
  if (q.type === 'NPS') {
    return (
      <Box>
        <ToggleButtonGroup exclusive size="small" value={value ?? null} disabled={readOnly} onChange={(_, v) => v !== null && onChange(v)} sx={{ flexWrap: 'wrap' }}>
          {Array.from({ length: 11 }, (_, n) => (
            <ToggleButton key={n} value={n} sx={{ minWidth: 40, '&.Mui-selected': { bgcolor: PURPLE, color: 'white', '&:hover': { bgcolor: PURPLE } } }}>{n}</ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Stack direction="row" justifyContent="space-between" sx={{ maxWidth: 480, mt: 0.5 }}>
          <Typography variant="caption" color="text.secondary">Not at all likely</Typography>
          <Typography variant="caption" color="text.secondary">Extremely likely</Typography>
        </Stack>
      </Box>
    );
  }
  if (q.type === 'CHOICE') {
    return (
      <RadioGroup value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        {q.options.map((o) => <FormControlLabel key={o} value={o} disabled={readOnly} control={<Radio sx={{ '&.Mui-checked': { color: PURPLE } }} />} label={o} />)}
      </RadioGroup>
    );
  }
  return <TextField fullWidth multiline minRows={3} value={value ?? ''} disabled={readOnly} onChange={(e) => onChange(e.target.value)} inputProps={{ maxLength: 4000 }} />;
}

/** Give feedback on a training (#106), once, after it ends or attendance is met. */
export default function TrainingFeedbackPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const [missing, setMissing] = useState([]);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/training/${id}/feedback`, { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Could not load the feedback form');
      setData(json);
      if (json.response) setAnswers(json.response.answers || {});
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    setBusy(true);
    setError('');
    setMissing([]);
    try {
      const res = await fetch(`/api/training/${id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setMissing(json.missing || []);
        throw new Error(json.error || 'Could not send your feedback');
      }
      setSent(true);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const readOnly = Boolean(data?.response);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: 3 }}>
      <Container maxWidth="md">
        <Stack spacing={2}>
          <Button startIcon={<BackIcon />} onClick={() => router.push(`/researcher/training?training=${id}`)} sx={{ alignSelf: 'flex-start', color: PURPLE, textTransform: 'none', fontWeight: 700 }}>
            Back to training
          </Button>
          {!data && !error ? <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress sx={{ color: PURPLE }} /></Box> : null}
          {data ? (
            <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <FeedbackIcon sx={{ color: PURPLE }} />
                <Typography variant="h5" sx={{ fontWeight: 800 }}>{data.form?.title || 'Feedback'}</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">{data.training.title}</Typography>
              {data.form?.intro ? <Typography variant="body2" sx={{ mt: 1.5, whiteSpace: 'pre-wrap' }}>{data.form.intro}</Typography> : null}
              {data.form?.anonymousToFacilitators ? (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>Facilitators see your answers without your name. The training team can see who answered.</Typography>
              ) : null}
            </Paper>
          ) : null}
          {error ? <Alert severity="error" onClose={() => setError('')}>{error}</Alert> : null}
          {data && readOnly ? (
            <Alert severity="success" icon={<DoneIcon />}>
              {sent ? 'Thank you! Your feedback has been sent.' : `You sent your feedback on ${new Date(data.response.submittedAt).toLocaleDateString('en-GB')}.`} Here is what you said.
            </Alert>
          ) : null}
          {data && !data.form ? <Alert severity="info">This training has no feedback form.</Alert> : null}
          {data && data.form && !data.unlocked && !readOnly ? <Alert severity="info">{data.reason}</Alert> : null}

          {data?.form && (data.unlocked || readOnly) ? (
            <>
              {data.form.questions.map((q, i) => (
                <Paper key={q.id} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: missing.includes(q.label) ? '#fca5a5' : 'divider' }}>
                  <Typography sx={{ fontWeight: 700, mb: 1 }}>
                    {i + 1}. {q.label}{q.required ? <Typography component="span" sx={{ color: '#b91c1c' }}> *</Typography> : null}
                  </Typography>
                  <Question q={q} value={answers[q.id]} readOnly={readOnly} onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} />
                </Paper>
              ))}
              {!readOnly ? (
                <Button variant="contained" disabled={busy} onClick={submit} sx={{ alignSelf: 'flex-end', bgcolor: PURPLE, textTransform: 'none', fontWeight: 700 }}>
                  {busy ? 'Sending…' : 'Send feedback'}
                </Button>
              ) : null}
            </>
          ) : null}
        </Stack>
      </Container>
    </Box>
  );
}
