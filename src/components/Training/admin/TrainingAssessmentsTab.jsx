'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Add as AddIcon,
  ArrowBack as BackIcon,
  ArrowDownward as DownIcon,
  ArrowUpward as UpIcon,
  ContentCopy as DuplicateIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Grading as GradeIcon,
  Quiz as QuizIcon,
} from '@mui/icons-material';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
  InstitutionModalSection,
} from '@/components/GlobalAdmin/InstitutionModalShell';
import { ASSESSMENT_TYPE_LABELS, ASSESSMENT_TYPES, QUESTION_TYPE_LABELS } from '@/lib/training-assessment';
import AssessmentQuestionDialog from './AssessmentQuestionDialog';

const PURPLE = '#8b6cbc';
const btn = { textTransform: 'none', fontWeight: 700 };

const toLocalInput = (value) => {
  if (!value) return '';
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fmt = (v) => (v ? new Date(v).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');

const SETTINGS_DEFAULT = {
  title: '', description: '', type: 'QUIZ', moduleId: '', passMark: 70, maxAttempts: '', timeLimitMinutes: '',
  shuffleQuestions: false, shuffleOptions: false, showCorrectAnswers: true, isRequiredForCompletion: false,
  availableFrom: '', availableUntil: '',
};
const fromAssessment = (a) => (a ? {
  ...SETTINGS_DEFAULT,
  ...a,
  description: a.description || '',
  moduleId: a.moduleId || '',
  maxAttempts: a.maxAttempts ?? '',
  timeLimitMinutes: a.timeLimitMinutes ?? '',
  availableFrom: toLocalInput(a.availableFrom),
  availableUntil: toLocalInput(a.availableUntil),
} : SETTINGS_DEFAULT);

async function api(url, init) {
  const res = await fetch(url, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...init });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) throw new Error(json.error || 'Something went wrong');
  return json;
}

function SettingsDialog({ open, onClose, assessment, modules, onSave, busy, error }) {
  const [d, setD] = useState(SETTINGS_DEFAULT);
  useEffect(() => { if (open) setD(fromAssessment(assessment)); }, [open, assessment]);
  const set = (p) => setD((x) => ({ ...x, ...p }));
  const save = () => onSave({
    title: d.title,
    description: d.description,
    type: d.type,
    moduleId: d.moduleId || null,
    passMark: Number(d.passMark),
    maxAttempts: d.maxAttempts === '' ? null : Number(d.maxAttempts),
    timeLimitMinutes: d.timeLimitMinutes === '' ? null : Number(d.timeLimitMinutes),
    shuffleQuestions: d.shuffleQuestions,
    shuffleOptions: d.shuffleOptions,
    showCorrectAnswers: d.showCorrectAnswers,
    isRequiredForCompletion: d.isRequiredForCompletion,
    availableFrom: d.availableFrom ? new Date(d.availableFrom).toISOString() : null,
    availableUntil: d.availableUntil ? new Date(d.availableUntil).toISOString() : null,
  });
  return (
    <InstitutionModal open={open} onClose={onClose} disableClose={busy} maxWidth="sm">
      <InstitutionModalHeader icon={QuizIcon} title={assessment?.id ? 'Assessment settings' : 'New assessment'} onClose={onClose} disableClose={busy} />
      <InstitutionModalBody>
        {error ? <Alert severity="error" sx={{ borderRadius: 1.5 }}>{error}</Alert> : null}
        <InstitutionModalSection title="About">
          <Stack spacing={1.5}>
            <TextField size="small" label="Title" value={d.title} onChange={(e) => set({ title: e.target.value })} />
            <TextField size="small" multiline minRows={2} label="Instructions (optional)" value={d.description} onChange={(e) => set({ description: e.target.value })} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField select size="small" label="Type" value={d.type} onChange={(e) => set({ type: e.target.value })} sx={{ flex: 1 }}>
                {ASSESSMENT_TYPES.map((t) => <MenuItem key={t} value={t}>{ASSESSMENT_TYPE_LABELS[t]}</MenuItem>)}
              </TextField>
              <TextField select size="small" label="Module" value={d.moduleId} onChange={(e) => set({ moduleId: e.target.value })} sx={{ flex: 1.3 }} helperText="Modules set to 'Passing its assessment' complete on a pass">
                <MenuItem value="">Not linked to a module</MenuItem>
                {modules.map((m) => <MenuItem key={m.id} value={m.id}>{m.title}</MenuItem>)}
              </TextField>
            </Stack>
          </Stack>
        </InstitutionModalSection>
        <InstitutionModalSection title="Rules">
          <Stack spacing={1.5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField size="small" type="number" label="Pass mark (%)" value={d.passMark} onChange={(e) => set({ passMark: e.target.value })} inputProps={{ min: 0, max: 100 }} sx={{ flex: 1 }} />
              <TextField size="small" type="number" label="Attempts" value={d.maxAttempts} onChange={(e) => set({ maxAttempts: e.target.value })} helperText="Empty = unlimited" inputProps={{ min: 1, max: 50 }} sx={{ flex: 1 }} />
              <TextField size="small" type="number" label="Time limit (min)" value={d.timeLimitMinutes} onChange={(e) => set({ timeLimitMinutes: e.target.value })} helperText="Empty = none" inputProps={{ min: 1, max: 600 }} sx={{ flex: 1 }} />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField size="small" type="datetime-local" label="Opens" value={d.availableFrom} onChange={(e) => set({ availableFrom: e.target.value })} InputLabelProps={{ shrink: true }} helperText="Empty = when published" sx={{ flex: 1 }} />
              <TextField size="small" type="datetime-local" label="Closes" value={d.availableUntil} onChange={(e) => set({ availableUntil: e.target.value })} InputLabelProps={{ shrink: true }} helperText="Empty = no end" sx={{ flex: 1 }} />
            </Stack>
            <FormControlLabel control={<Switch checked={d.isRequiredForCompletion} onChange={(e) => set({ isRequiredForCompletion: e.target.checked })} />} label="Required to complete the training (with 'Pass the required assessment' on in Completion)" />
            <FormControlLabel control={<Switch checked={d.shuffleQuestions} onChange={(e) => set({ shuffleQuestions: e.target.checked })} />} label="Shuffle question order" />
            <FormControlLabel control={<Switch checked={d.shuffleOptions} onChange={(e) => set({ shuffleOptions: e.target.checked })} />} label="Shuffle answer order" />
            <FormControlLabel control={<Switch checked={d.showCorrectAnswers} onChange={(e) => set({ showCorrectAnswers: e.target.checked })} />} label="Show correct answers and explanations after submitting" />
          </Stack>
        </InstitutionModalSection>
      </InstitutionModalBody>
      <InstitutionModalFooter>
        <Button onClick={onClose} disabled={busy} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={busy || !d.title.trim()} sx={{ bgcolor: PURPLE, ...btn }}>{busy ? 'Saving…' : 'Save'}</Button>
      </InstitutionModalFooter>
    </InstitutionModal>
  );
}

function GradeDialog({ open, onClose, attempt, questions, onSave, busy, error }) {
  const [scores, setScores] = useState({});
  const [comments, setComments] = useState({});
  useEffect(() => {
    if (!open || !attempt) return;
    const manual = attempt.feedback?.manualScores || {};
    setScores(Object.fromEntries(questions.filter((q) => q.type === 'SHORT_TEXT').map((q) => [q.id, manual[q.id] ?? attempt.feedback?.perQuestion?.[q.id]?.score ?? ''])));
    setComments(attempt.feedback?.comments || {});
  }, [open, attempt, questions]);
  const textQs = questions.filter((q) => q.type === 'SHORT_TEXT');
  return (
    <InstitutionModal open={open} onClose={onClose} disableClose={busy} maxWidth="md">
      <InstitutionModalHeader icon={GradeIcon} title="Grade short answers" subtitle={attempt ? `${attempt.participant.name} · attempt ${attempt.attemptNumber}` : ''} onClose={onClose} disableClose={busy} />
      <InstitutionModalBody>
        {error ? <Alert severity="error" sx={{ borderRadius: 1.5 }}>{error}</Alert> : null}
        {textQs.map((q) => (
          <InstitutionModalSection key={q.id} title={q.prompt}>
            <Stack spacing={1}>
              <Paper variant="outlined" sx={{ p: 1.25, bgcolor: '#f8fafc', whiteSpace: 'pre-wrap' }}>
                <Typography variant="body2">{attempt?.answers?.[q.id] || <em>No answer</em>}</Typography>
              </Paper>
              {q.correct?.length ? <Typography variant="caption" color="text.secondary">Accepted answers: {q.correct.join(' · ')}</Typography> : null}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField size="small" type="number" label={`Score (out of ${q.points})`} value={scores[q.id] ?? ''} onChange={(e) => setScores((s) => ({ ...s, [q.id]: e.target.value }))} inputProps={{ min: 0, max: q.points, step: 0.5 }} sx={{ width: 170 }} />
                <TextField size="small" fullWidth label="Comment (optional)" value={comments[q.id] || ''} onChange={(e) => setComments((c) => ({ ...c, [q.id]: e.target.value }))} />
              </Stack>
            </Stack>
          </InstitutionModalSection>
        ))}
      </InstitutionModalBody>
      <InstitutionModalFooter>
        <Button onClick={onClose} disabled={busy} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button
          variant="contained"
          disabled={busy || textQs.some((q) => scores[q.id] === '' || scores[q.id] === undefined)}
          onClick={() => onSave({ scores: Object.fromEntries(Object.entries(scores).map(([k, v]) => [k, Number(v)])), comments })}
          sx={{ bgcolor: PURPLE, ...btn }}
        >
          {busy ? 'Saving…' : 'Save grades'}
        </Button>
      </InstitutionModalFooter>
    </InstitutionModal>
  );
}

/**
 * Assessments tab (#105): list, settings, question builder (reorder, duplicate), attempts
 * with manual grading for short text, and item analysis.
 */
export default function TrainingAssessmentsTab({ trainingId, training, modules = [], onChanged }) {
  const [list, setList] = useState(null);
  const [selected, setSelected] = useState(null); // full assessment with questions
  const [view, setView] = useState('questions');
  const [attempts, setAttempts] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dialogError, setDialogError] = useState('');
  const [settings, setSettings] = useState(null); // { assessment|null }
  const [questionDialog, setQuestionDialog] = useState(null); // { question|null }
  const [grading, setGrading] = useState(null);

  const loadList = useCallback(async () => {
    try {
      const json = await api(`/api/training/${trainingId}/assessments`);
      setList(json.assessments);
    } catch (err) {
      setError(err.message);
      setList([]);
    }
  }, [trainingId]);

  const loadSelected = useCallback(async (aid) => {
    const json = await api(`/api/training/${trainingId}/assessments/${aid}`);
    setSelected(json.assessment);
    return json.assessment;
  }, [trainingId]);

  const loadAttempts = useCallback(async (aid) => {
    const json = await api(`/api/training/${trainingId}/assessments/${aid}/attempts`);
    setAttempts(json);
  }, [trainingId]);

  useEffect(() => { loadList(); }, [loadList]);

  const run = async (fn, { dialog = false } = {}) => {
    setBusy(true);
    if (dialog) setDialogError(''); else setError('');
    try {
      await fn();
      return true;
    } catch (err) {
      if (dialog) setDialogError(err.message); else setError(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const open = (a, tab = 'questions') => run(async () => {
    await loadSelected(a.id);
    setView(tab);
    setAttempts(null);
    if (tab !== 'questions') await loadAttempts(a.id);
  });

  const saveSettings = (data) => run(async () => {
    if (settings?.assessment?.id) {
      await api(`/api/training/${trainingId}/assessments/${settings.assessment.id}`, { method: 'PUT', body: JSON.stringify(data) });
      if (selected) await loadSelected(selected.id);
    } else {
      const json = await api(`/api/training/${trainingId}/assessments`, { method: 'POST', body: JSON.stringify(data) });
      await loadSelected(json.assessment.id);
      setView('questions');
    }
    setSettings(null);
    await loadList();
    onChanged?.();
  }, { dialog: true });

  const togglePublish = (a) => run(async () => {
    await api(`/api/training/${trainingId}/assessments/${a.id}`, { method: 'PUT', body: JSON.stringify({ isPublished: !a.isPublished }) });
    await loadList();
    if (selected?.id === a.id) await loadSelected(a.id);
    onChanged?.();
  });

  const remove = (a) => run(async () => {
    await api(`/api/training/${trainingId}/assessments/${a.id}`, { method: 'DELETE' });
    if (selected?.id === a.id) setSelected(null);
    await loadList();
  });

  const saveQuestion = (data) => run(async () => {
    const q = questionDialog?.question;
    if (q?.id) await api(`/api/training/${trainingId}/assessments/${selected.id}/questions/${q.id}`, { method: 'PUT', body: JSON.stringify(data) });
    else await api(`/api/training/${trainingId}/assessments/${selected.id}/questions`, { method: 'POST', body: JSON.stringify(data) });
    setQuestionDialog(null);
    await loadSelected(selected.id);
    await loadList();
  }, { dialog: true });

  const questionAction = (q, action) => run(async () => {
    const base = `/api/training/${trainingId}/assessments/${selected.id}/questions`;
    if (action === 'duplicate') await api(`${base}/${q.id}`, { method: 'POST' });
    if (action === 'delete') await api(`${base}/${q.id}`, { method: 'DELETE' });
    if (action === 'up' || action === 'down') {
      const ids = selected.questions.map((x) => x.id);
      const i = ids.indexOf(q.id);
      const j = action === 'up' ? i - 1 : i + 1;
      if (j < 0 || j >= ids.length) return;
      [ids[i], ids[j]] = [ids[j], ids[i]];
      await api(base, { method: 'PUT', body: JSON.stringify({ ids }) });
    }
    await loadSelected(selected.id);
    await loadList();
  });

  const saveGrade = (data) => run(async () => {
    await api(`/api/training/${trainingId}/assessments/${selected.id}/attempts/${grading.id}/grade`, { method: 'PUT', body: JSON.stringify(data) });
    setGrading(null);
    await loadAttempts(selected.id);
    await loadList();
    onChanged?.();
  }, { dialog: true });

  if (list === null) return <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress sx={{ color: PURPLE }} /></Box>;

  // ---- One assessment ----
  if (selected) {
    const summary = list.find((a) => a.id === selected.id) || selected;
    const totalPoints = selected.questions.reduce((s, q) => s + (Number(q.points) || 0), 0);
    return (
      <Stack spacing={2}>
        {error ? <Alert severity="error" onClose={() => setError('')}>{error}</Alert> : null}
        <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ md: 'center' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton onClick={() => { setSelected(null); loadList(); }}><BackIcon /></IconButton>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{selected.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {ASSESSMENT_TYPE_LABELS[selected.type]} · pass {selected.passMark}% · {selected.maxAttempts ? `${selected.maxAttempts} attempt(s)` : 'unlimited attempts'}
                  {selected.timeLimitMinutes ? ` · ${selected.timeLimitMinutes} min` : ''} · {selected.questions.length} question(s), {totalPoints} point(s)
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Chip size="small" label={selected.isPublished ? 'Published' : 'Draft'} sx={{ fontWeight: 700, ...(selected.isPublished ? { bgcolor: '#dcfce7', color: '#166534' } : {}) }} />
              <Button size="small" startIcon={<EditIcon />} onClick={() => { setDialogError(''); setSettings({ assessment: selected }); }} sx={{ color: PURPLE, ...btn }}>Settings</Button>
              <Button size="small" variant={selected.isPublished ? 'outlined' : 'contained'} disabled={busy} onClick={() => togglePublish(selected)} sx={selected.isPublished ? { borderColor: PURPLE, color: PURPLE, ...btn } : { bgcolor: PURPLE, ...btn }}>
                {selected.isPublished ? 'Unpublish' : 'Publish'}
              </Button>
            </Stack>
          </Stack>
          <Tabs value={view} onChange={async (_, v) => { setView(v); if (v !== 'questions' && !attempts) await run(() => loadAttempts(selected.id)); }} sx={{ mt: 1, '& .Mui-selected': { color: `${PURPLE} !important` }, '& .MuiTabs-indicator': { bgcolor: PURPLE } }}>
            <Tab value="questions" label="Questions" sx={btn} />
            <Tab value="attempts" label={`Attempts${summary.stats?.needsGrading ? ` (${summary.stats.needsGrading} to grade)` : ''}`} sx={btn} />
            <Tab value="analysis" label="Item analysis" sx={btn} />
          </Tabs>
        </Paper>
        {busy ? <LinearProgress sx={{ '& .MuiLinearProgress-bar': { bgcolor: PURPLE } }} /> : null}

        {view === 'questions' ? (
          <Stack spacing={1.25}>
            {summary.stats?.attempts ? <Alert severity="info">{summary.stats.attempts} attempt(s) so far. Edits apply to new attempts and regrading; existing grades stay as they are.</Alert> : null}
            {selected.questions.map((q, i) => (
              <Paper key={q.id} sx={{ p: 1.75, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Typography variant="body2" sx={{ fontWeight: 800, color: PURPLE, minWidth: 28 }}>{i + 1}.</Typography>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: 'pre-wrap' }}>{q.prompt}</Typography>
                    <Typography variant="caption" color="text.secondary">{QUESTION_TYPE_LABELS[q.type]} · {q.points} point(s)</Typography>
                    {q.type === 'SINGLE' || q.type === 'MULTI' || q.type === 'TRUE_FALSE' ? (
                      <Stack direction="row" spacing={0.75} sx={{ mt: 0.75, flexWrap: 'wrap', rowGap: 0.75 }}>
                        {q.options.map((o) => (
                          <Chip key={o.id} size="small" label={o.text} sx={q.correct.includes(o.id) ? { bgcolor: '#dcfce7', color: '#166534', fontWeight: 700 } : {}} />
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                        {q.correct.length ? `Accepted: ${q.correct.join(' · ')}` : 'Graded by hand'}
                      </Typography>
                    )}
                  </Box>
                  <Stack direction="row">
                    <Tooltip title="Move up"><span><IconButton size="small" disabled={busy || i === 0} onClick={() => questionAction(q, 'up')}><UpIcon fontSize="small" /></IconButton></span></Tooltip>
                    <Tooltip title="Move down"><span><IconButton size="small" disabled={busy || i === selected.questions.length - 1} onClick={() => questionAction(q, 'down')}><DownIcon fontSize="small" /></IconButton></span></Tooltip>
                    <Tooltip title="Edit"><span><IconButton size="small" disabled={busy} onClick={() => { setDialogError(''); setQuestionDialog({ question: q }); }}><EditIcon fontSize="small" /></IconButton></span></Tooltip>
                    <Tooltip title="Duplicate"><span><IconButton size="small" disabled={busy} onClick={() => questionAction(q, 'duplicate')}><DuplicateIcon fontSize="small" /></IconButton></span></Tooltip>
                    <Tooltip title="Delete"><span><IconButton size="small" color="error" disabled={busy} onClick={() => questionAction(q, 'delete')}><DeleteIcon fontSize="small" /></IconButton></span></Tooltip>
                  </Stack>
                </Stack>
              </Paper>
            ))}
            {!selected.questions.length ? <Alert severity="info">No questions yet. Add the first one, then publish.</Alert> : null}
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => { setDialogError(''); setQuestionDialog({ question: null }); }} sx={{ alignSelf: 'flex-start', borderColor: PURPLE, color: PURPLE, ...btn }}>
              Add question
            </Button>
          </Stack>
        ) : null}

        {view === 'attempts' && attempts ? (
          <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(PURPLE, 0.06) }}>
                    {['Participant', 'Attempt', 'Started', 'Submitted', 'Score', 'Result', ''].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attempts.attempts.map((a) => (
                    <TableRow key={a.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{a.participant.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{a.participant.email}</Typography>
                      </TableCell>
                      <TableCell>{a.attemptNumber}</TableCell>
                      <TableCell>{fmt(a.startedAt)}</TableCell>
                      <TableCell>{fmt(a.submittedAt)}</TableCell>
                      <TableCell>{a.percent === null ? '—' : `${a.percent}% (${a.score}/${a.maxScore})`}</TableCell>
                      <TableCell>
                        {a.status === 'IN_PROGRESS' ? <Chip size="small" label="In progress" />
                          : a.status === 'NEEDS_GRADING' ? <Chip size="small" label="To grade" sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 700 }} />
                            : a.passed ? <Chip size="small" label="Passed" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 700 }} />
                              : <Chip size="small" label="Not passed" sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 700 }} />}
                      </TableCell>
                      <TableCell>
                        {a.status !== 'IN_PROGRESS' && selected.questions.some((q) => q.type === 'SHORT_TEXT') ? (
                          <Button size="small" startIcon={<GradeIcon />} onClick={() => { setDialogError(''); setGrading(a); }} sx={{ color: PURPLE, ...btn }}>
                            {a.status === 'NEEDS_GRADING' ? 'Grade' : 'Regrade'}
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!attempts.attempts.length ? (
                    <TableRow><TableCell colSpan={7} sx={{ py: 4, textAlign: 'center' }}><Typography color="text.secondary">No attempts yet.</Typography></TableCell></TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        ) : null}

        {view === 'analysis' && attempts ? (
          <Stack spacing={1.25}>
            <Typography variant="body2" color="text.secondary">From submitted attempts. Questions most people miss may need rewording, or more time in the session.</Typography>
            {attempts.analysis.map((item, i) => (
              <Paper key={item.questionId} sx={{ p: 1.75, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{i + 1}. {item.prompt}</Typography>
                    <Typography variant="caption" color="text.secondary">{item.answered} answered</Typography>
                    {item.options.length ? (
                      <Stack spacing={0.5} sx={{ mt: 1 }}>
                        {item.options.map((o) => {
                          const pct = item.answered ? Math.round((o.picked / item.answered) * 100) : 0;
                          return (
                            <Stack key={o.id} direction="row" spacing={1} alignItems="center">
                              <Typography variant="caption" sx={{ width: 220, fontWeight: o.isCorrect ? 700 : 400, color: o.isCorrect ? '#166534' : 'inherit' }} noWrap>{o.text}</Typography>
                              <LinearProgress variant="determinate" value={pct} sx={{ flex: 1, height: 8, borderRadius: 4, bgcolor: alpha(PURPLE, 0.1), '& .MuiLinearProgress-bar': { bgcolor: o.isCorrect ? '#16a34a' : '#94a3b8' } }} />
                              <Typography variant="caption" sx={{ width: 48, textAlign: 'right' }}>{o.picked} ({pct}%)</Typography>
                            </Stack>
                          );
                        })}
                      </Stack>
                    ) : null}
                  </Box>
                  <Box sx={{ minWidth: 120, textAlign: { md: 'right' } }}>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: item.percentCorrect !== null && item.percentCorrect < 50 ? '#b91c1c' : '#1e293b' }}>
                      {item.percentCorrect === null ? '—' : `${item.percentCorrect}%`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">answered correctly</Typography>
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Stack>
        ) : null}

        <SettingsDialog open={Boolean(settings)} onClose={() => setSettings(null)} assessment={settings?.assessment} modules={modules} onSave={saveSettings} busy={busy} error={dialogError} />
        <AssessmentQuestionDialog open={Boolean(questionDialog)} onClose={() => setQuestionDialog(null)} question={questionDialog?.question} onSave={saveQuestion} busy={busy} error={dialogError} />
        <GradeDialog open={Boolean(grading)} onClose={() => setGrading(null)} attempt={grading} questions={selected.questions} onSave={saveGrade} busy={busy} error={dialogError} />
      </Stack>
    );
  }

  // ---- List ----
  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error" onClose={() => setError('')}>{error}</Alert> : null}
      <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Assessments</Typography>
            <Typography variant="body2" color="text.secondary">
              Pre-tests, post-tests and quizzes, graded automatically.
              {training?.requireAssessmentPass ? ' Completion requires passing the ones marked required.' : ' Turn on “Pass the required assessment” in Completion to make passing count.'}
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setDialogError(''); setSettings({ assessment: null }); }} sx={{ bgcolor: PURPLE, ...btn, alignSelf: 'flex-start', whiteSpace: 'nowrap' }}>
            New assessment
          </Button>
        </Stack>
      </Paper>
      {busy ? <LinearProgress sx={{ '& .MuiLinearProgress-bar': { bgcolor: PURPLE } }} /> : null}
      {!list.length ? <Alert severity="info">No assessments yet.</Alert> : null}
      {list.map((a) => (
        <Paper key={a.id} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{a.title}</Typography>
                <Chip size="small" label={ASSESSMENT_TYPE_LABELS[a.type]} sx={{ bgcolor: alpha(PURPLE, 0.1), color: PURPLE, fontWeight: 700 }} />
                <Chip size="small" label={a.isPublished ? 'Published' : 'Draft'} sx={{ fontWeight: 700, ...(a.isPublished ? { bgcolor: '#dcfce7', color: '#166534' } : {}) }} />
                {a.isRequiredForCompletion ? <Chip size="small" label="Required" sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 700 }} /> : null}
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {a.questionCount} question(s) · pass {a.passMark}%{a.module ? ` · module: ${a.module.title}` : ''}
                {' · '}{a.stats.participants} took it, {a.stats.passed} passed{a.stats.needsGrading ? ` · ${a.stats.needsGrading} to grade` : ''}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
              <Button size="small" variant="outlined" onClick={() => open(a, 'questions')} sx={{ borderColor: PURPLE, color: PURPLE, ...btn }}>Questions</Button>
              <Button size="small" onClick={() => open(a, 'attempts')} sx={{ color: PURPLE, ...btn }}>Attempts</Button>
              <Button size="small" disabled={busy} onClick={() => togglePublish(a)} sx={{ color: PURPLE, ...btn }}>{a.isPublished ? 'Unpublish' : 'Publish'}</Button>
              {!a.stats.attempts ? (
                <Tooltip title="Delete"><span><IconButton size="small" color="error" disabled={busy} onClick={() => remove(a)}><DeleteIcon fontSize="small" /></IconButton></span></Tooltip>
              ) : null}
            </Stack>
          </Stack>
        </Paper>
      ))}
      <SettingsDialog open={Boolean(settings)} onClose={() => setSettings(null)} assessment={settings?.assessment} modules={modules} onSave={saveSettings} busy={busy} error={dialogError} />
    </Stack>
  );
}
