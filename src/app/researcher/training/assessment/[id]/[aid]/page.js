'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  FormControlLabel,
  LinearProgress,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  CheckCircle as RightIcon,
  Cancel as WrongIcon,
  HourglassTop as PendingIcon,
  Quiz as QuizIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import { ASSESSMENT_TYPE_LABELS } from '@/lib/training-assessment';

const PURPLE = '#8b6cbc';
const AUTOSAVE_MS = 1500;

const fmtDate = (v) => (v ? new Date(v).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '');
const clock = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h ? `${h}:` : ''}${String(m).padStart(h ? 2 : 1, '0')}:${String(sec).padStart(2, '0')}`;
};

async function api(url, init) {
  const res = await fetch(url, { credentials: 'include', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, ...init });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    const err = new Error(json.error || 'Something went wrong');
    err.expired = json.expired;
    throw err;
  }
  return json;
}

function answerText(q, answer) {
  if (answer === null || answer === undefined) return 'No answer';
  if (q.type === 'SHORT_TEXT') return answer;
  const ids = Array.isArray(answer) ? answer : [answer];
  return ids.map((id) => q.options.find((o) => o.id === id)?.text || id).join(', ');
}

function Result({ result, passMark, onBack }) {
  const pending = result.status === 'NEEDS_GRADING';
  return (
    <Stack spacing={2}>
      <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: pending ? '#fcd34d' : result.passed ? '#86efac' : '#fca5a5', bgcolor: pending ? '#fffbeb' : result.passed ? '#f0fdf4' : '#fef2f2', textAlign: 'center' }}>
        <Typography variant="h3" sx={{ fontWeight: 800 }}>{result.percent}%</Typography>
        <Typography sx={{ fontWeight: 700 }}>
          {pending ? 'Some answers are waiting to be graded' : result.passed ? 'Passed' : `Not passed (pass mark ${passMark}%)`}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {result.score} of {result.maxScore} points · attempt {result.attemptNumber} · submitted {fmtDate(result.submittedAt)}
        </Typography>
        {pending ? <Typography variant="body2" sx={{ mt: 1 }}>You will be notified when your result is final.</Typography> : null}
      </Paper>
      {result.questions.map((q, i) => (
        <Paper key={q.id} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={1.5}>
            {q.result === 'correct' ? <RightIcon sx={{ color: '#16a34a' }} /> : q.result === 'incorrect' ? <WrongIcon sx={{ color: '#dc2626' }} /> : <PendingIcon sx={{ color: '#d97706' }} />}
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: 'pre-wrap' }}>{i + 1}. {q.prompt}</Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>Your answer: {answerText(q, q.answer)}</Typography>
              {q.correct ? (
                <Typography variant="body2" sx={{ mt: 0.5, color: '#166534' }}>
                  Correct answer: {q.type === 'SHORT_TEXT' ? (q.correct.length ? q.correct.join(' / ') : 'graded by the trainer') : answerText(q, q.correct)}
                </Typography>
              ) : null}
              {q.explanation ? <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>{q.explanation}</Typography> : null}
            </Box>
            <Typography variant="caption" sx={{ whiteSpace: 'nowrap' }}>{q.score ?? '—'} / {q.points}</Typography>
          </Stack>
        </Paper>
      ))}
      <Button startIcon={<BackIcon />} onClick={onBack} sx={{ alignSelf: 'flex-start', color: PURPLE, textTransform: 'none', fontWeight: 700 }}>Back</Button>
    </Stack>
  );
}

/**
 * Take an assessment (#105): intro with rules and past attempts, the attempt with a timer
 * and autosave, then the result.
 */
export default function TakeAssessmentPage() {
  const { id: trainingId, aid } = useParams();
  const router = useRouter();
  const [summary, setSummary] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saveState, setSaveState] = useState('');
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const dirty = useRef(false);
  const submitted = useRef(false);

  const base = `/api/training/${trainingId}/assessments/${aid}`;

  const loadSummary = useCallback(async () => {
    try {
      const json = await api(`/api/training/${trainingId}/assessments/mine`);
      const mine = json.assessments.find((a) => a.id === aid);
      if (!mine) throw new Error('This assessment is not available');
      setSummary(mine);
    } catch (err) {
      setError(err.message);
    }
  }, [trainingId, aid]);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  const begin = async () => {
    setBusy(true);
    setError('');
    try {
      const json = await api(`${base}/attempts`, { method: 'POST' });
      submitted.current = false;
      setAttempt(json.attempt);
      setAnswers(json.attempt.answers || {});
      setResult(null);
      setConfirmSubmit(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const viewResult = async (attemptId) => {
    setBusy(true);
    setError('');
    try {
      const json = await api(`${base}/attempts/${attemptId}`);
      if (json.result) setResult(json.result);
      else { setAttempt(json.attempt); setAnswers(json.attempt.answers || {}); }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const save = useCallback(async () => {
    if (!attempt || !dirty.current || submitted.current) return;
    dirty.current = false;
    setSaveState('Saving…');
    try {
      await api(`${base}/attempts/${attempt.id}`, { method: 'PUT', body: JSON.stringify({ answers }) });
      setSaveState('Saved');
    } catch (err) {
      setSaveState('');
      if (err.expired) {
        submitted.current = true;
        await viewResult(attempt.id);
        setAttempt(null);
      } else {
        dirty.current = true;
        setError(err.message);
      }
    }
    // viewResult is stable enough for this purpose
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, answers, base]);

  // Autosave shortly after each change.
  useEffect(() => {
    if (!attempt || !dirty.current) return undefined;
    const t = setTimeout(save, AUTOSAVE_MS);
    return () => clearTimeout(t);
  }, [answers, attempt, save]);

  const submit = useCallback(async () => {
    if (!attempt || submitted.current) return;
    submitted.current = true;
    setBusy(true);
    setError('');
    try {
      const json = await api(`${base}/attempts/${attempt.id}/submit`, { method: 'POST', body: JSON.stringify({ answers }) });
      setResult(json.result);
      setAttempt(null);
      loadSummary();
    } catch (err) {
      submitted.current = false;
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }, [attempt, answers, base, loadSummary]);

  // Timer; submit automatically when time runs out.
  const deadline = attempt?.deadlineAt ? new Date(attempt.deadlineAt).getTime() : null;
  useEffect(() => {
    if (!deadline) return undefined;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [deadline]);
  useEffect(() => {
    if (deadline && now >= deadline && attempt && !submitted.current) submit();
  }, [now, deadline, attempt, submit]);

  // Warn before leaving with unsaved answers.
  useEffect(() => {
    if (!attempt) return undefined;
    const handler = (e) => { if (dirty.current) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [attempt]);

  const setAnswer = (qid, value) => {
    dirty.current = true;
    setSaveState('');
    setAnswers((a) => ({ ...a, [qid]: value }));
  };

  const answeredCount = attempt ? attempt.questions.filter((q) => {
    const v = answers[q.id];
    return Array.isArray(v) ? v.length > 0 : typeof v === 'string' && v.trim() !== '';
  }).length : 0;
  const remaining = deadline ? deadline - now : null;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: 3 }}>
      <Container maxWidth="md">
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button startIcon={<BackIcon />} onClick={() => router.push(`/researcher/training/${trainingId}`)} disabled={Boolean(attempt)} sx={{ color: PURPLE, textTransform: 'none', fontWeight: 700 }}>
              Back to training
            </Button>
          </Stack>
          {error ? <Alert severity="error" onClose={() => setError('')}>{error}</Alert> : null}
          {!summary && !error ? <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress sx={{ color: PURPLE }} /></Box> : null}

          {summary && !attempt && !result ? (
            <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <QuizIcon sx={{ color: PURPLE }} />
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>{summary.title}</Typography>
                  <Chip size="small" label={ASSESSMENT_TYPE_LABELS[summary.type]} sx={{ bgcolor: alpha(PURPLE, 0.1), color: PURPLE, fontWeight: 700 }} />
                </Stack>
                {summary.description ? <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{summary.description}</Typography> : null}
                <Typography variant="body2">
                  {summary.questionCount} question(s) · pass mark {summary.passMark}%
                  {summary.timeLimitMinutes ? ` · ${summary.timeLimitMinutes} minute time limit` : ' · no time limit'}
                  {summary.attemptsLeft === null ? ' · unlimited attempts' : ` · ${summary.attemptsLeft} attempt(s) left`}
                </Typography>
                {summary.availableUntil ? <Typography variant="body2" color="text.secondary">Closes {fmtDate(summary.availableUntil)}</Typography> : null}
                {summary.timeLimitMinutes ? <Alert severity="info">The timer starts when you begin and keeps running if you leave the page. Answers save as you go; when time is up, what you've answered is submitted.</Alert> : null}
                {summary.passed ? <Alert severity="success">You have passed this assessment.</Alert> : null}
                {summary.awaitingGrading ? <Alert severity="warning">An attempt is waiting to be graded.</Alert> : null}
                <Stack direction="row" spacing={1}>
                  {summary.canStart ? (
                    <Button variant="contained" disabled={busy} onClick={begin} sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700 }}>
                      {summary.openAttemptId ? 'Resume attempt' : summary.attemptsUsed ? 'Try again' : 'Start'}
                    </Button>
                  ) : <Alert severity="info" sx={{ py: 0 }}>{summary.blockedReason}</Alert>}
                </Stack>
                {summary.attempts.filter((t) => t.status !== 'IN_PROGRESS').length ? (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1 }}>Your attempts</Typography>
                    {summary.attempts.filter((t) => t.status !== 'IN_PROGRESS').map((t) => (
                      <Stack key={t.id} direction="row" spacing={1} alignItems="center" sx={{ py: 0.5 }}>
                        <Typography variant="body2" sx={{ flex: 1 }}>Attempt {t.attemptNumber} · {fmtDate(t.submittedAt)}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{t.percent}%</Typography>
                        {t.status === 'NEEDS_GRADING' ? <Chip size="small" label="Being graded" />
                          : <Chip size="small" label={t.passed ? 'Passed' : 'Not passed'} sx={t.passed ? { bgcolor: '#dcfce7', color: '#166534', fontWeight: 700 } : { bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 700 }} />}
                        <Button size="small" onClick={() => viewResult(t.id)} sx={{ color: PURPLE, textTransform: 'none', fontWeight: 700 }}>View</Button>
                      </Stack>
                    ))}
                  </Box>
                ) : null}
              </Stack>
            </Paper>
          ) : null}

          {attempt ? (
            <>
              <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', position: 'sticky', top: 8, zIndex: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 800 }}>{attempt.assessment.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Attempt {attempt.attemptNumber} · {answeredCount}/{attempt.questions.length} answered{saveState ? ` · ${saveState}` : ''}
                    </Typography>
                  </Box>
                  {remaining !== null ? (
                    <Chip icon={<TimerIcon />} label={clock(remaining)} sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', ...(remaining < 60000 ? { bgcolor: '#fee2e2', color: '#b91c1c' } : { bgcolor: alpha(PURPLE, 0.1), color: PURPLE }) }} />
                  ) : null}
                </Stack>
                <LinearProgress variant="determinate" value={(answeredCount / Math.max(1, attempt.questions.length)) * 100} sx={{ mt: 1, height: 6, borderRadius: 3, bgcolor: alpha(PURPLE, 0.12), '& .MuiLinearProgress-bar': { bgcolor: PURPLE } }} />
              </Paper>

              {attempt.questions.map((q, i) => (
                <Paper key={q.id} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Stack direction="row" justifyContent="space-between" spacing={1}>
                    <Typography sx={{ fontWeight: 700, whiteSpace: 'pre-wrap' }}>{i + 1}. {q.prompt}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>{q.points} pt</Typography>
                  </Stack>
                  {q.type === 'MULTI' ? <Typography variant="caption" color="text.secondary">Choose all that apply</Typography> : null}
                  <Box sx={{ mt: 1 }}>
                    {q.type === 'SINGLE' || q.type === 'TRUE_FALSE' ? (
                      <RadioGroup value={answers[q.id] || ''} onChange={(e) => setAnswer(q.id, e.target.value)}>
                        {q.options.map((o) => <FormControlLabel key={o.id} value={o.id} control={<Radio sx={{ '&.Mui-checked': { color: PURPLE } }} />} label={o.text} />)}
                      </RadioGroup>
                    ) : null}
                    {q.type === 'MULTI' ? (
                      <Stack>
                        {q.options.map((o) => {
                          const picked = Array.isArray(answers[q.id]) ? answers[q.id] : [];
                          return (
                            <FormControlLabel
                              key={o.id}
                              control={<Checkbox checked={picked.includes(o.id)} onChange={() => setAnswer(q.id, picked.includes(o.id) ? picked.filter((x) => x !== o.id) : [...picked, o.id])} sx={{ '&.Mui-checked': { color: PURPLE } }} />}
                              label={o.text}
                            />
                          );
                        })}
                      </Stack>
                    ) : null}
                    {q.type === 'SHORT_TEXT' ? (
                      <TextField fullWidth multiline minRows={2} value={answers[q.id] || ''} onChange={(e) => setAnswer(q.id, e.target.value)} inputProps={{ maxLength: 2000 }} />
                    ) : null}
                  </Box>
                </Paper>
              ))}

              <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                {answeredCount < attempt.questions.length ? <Typography variant="body2" color="text.secondary">{attempt.questions.length - answeredCount} unanswered</Typography> : null}
                <Button
                  variant="contained"
                  disabled={busy}
                  onClick={() => (confirmSubmit ? submit() : setConfirmSubmit(true))}
                  sx={{ bgcolor: confirmSubmit ? '#166534' : PURPLE, textTransform: 'none', fontWeight: 700 }}
                >
                  {busy ? 'Submitting…' : confirmSubmit ? 'Tap again to submit' : 'Submit answers'}
                </Button>
              </Stack>
            </>
          ) : null}

          {result ? <Result result={result} passMark={summary?.passMark} onBack={() => { setResult(null); loadSummary(); }} /> : null}
        </Stack>
      </Container>
    </Box>
  );
}
