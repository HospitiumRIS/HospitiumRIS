'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowDownward as DownIcon,
  ArrowUpward as UpIcon,
  Delete as DeleteIcon,
  RateReview as FeedbackIcon,
} from '@mui/icons-material';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
  InstitutionModalSection,
} from '@/components/GlobalAdmin/InstitutionModalShell';
import { DEFAULT_FEEDBACK_QUESTIONS, FEEDBACK_QUESTION_LABELS, FEEDBACK_QUESTION_TYPES } from '@/lib/training-feedback';

const PURPLE = '#8b6cbc';
let seq = 0;
const newId = () => `q${Date.now().toString(36)}${(seq += 1)}`;

const fromForm = (form, template) => {
  const src = form || template || {};
  return {
    title: src.title || 'Training feedback',
    intro: src.intro || '',
    anonymousToFacilitators: src.anonymousToFacilitators !== false,
    questions: (src.questions?.length ? src.questions : DEFAULT_FEEDBACK_QUESTIONS).map((q) => ({ ...q, optionsText: (q.options || []).join('\n') })),
  };
};

/** Edit a feedback form (#106): the institution default or a training's own form. */
export default function FeedbackFormEditor({ open, onClose, onSave, form, template, title, subtitle, busy, error }) {
  const [d, setD] = useState(() => fromForm(form, template));
  useEffect(() => { if (open) setD(fromForm(form, template)); }, [open, form, template]);

  const setQ = (i, patch) => setD((x) => ({ ...x, questions: x.questions.map((q, j) => (j === i ? { ...q, ...patch } : q)) }));
  const move = (i, dir) => setD((x) => {
    const qs = [...x.questions];
    const j = i + dir;
    if (j < 0 || j >= qs.length) return x;
    [qs[i], qs[j]] = [qs[j], qs[i]];
    return { ...x, questions: qs };
  });

  const save = () => onSave({
    title: d.title,
    intro: d.intro,
    anonymousToFacilitators: d.anonymousToFacilitators,
    questions: d.questions.map(({ optionsText, ...q }) => ({
      ...q,
      ...(q.type === 'CHOICE' ? { options: optionsText.split('\n').map((s) => s.trim()).filter(Boolean) } : { options: undefined }),
    })),
  });

  return (
    <InstitutionModal open={open} onClose={onClose} disableClose={busy} maxWidth="md">
      <InstitutionModalHeader icon={FeedbackIcon} title={title || 'Feedback form'} subtitle={subtitle} onClose={onClose} disableClose={busy} />
      <InstitutionModalBody>
        {error ? <Alert severity="error" sx={{ borderRadius: 1.5 }}>{error}</Alert> : null}
        <InstitutionModalSection title="Form">
          <Stack spacing={1.5}>
            <TextField size="small" label="Title" value={d.title} onChange={(e) => setD((x) => ({ ...x, title: e.target.value }))} />
            <TextField size="small" multiline minRows={2} label="Introduction (optional)" value={d.intro} onChange={(e) => setD((x) => ({ ...x, intro: e.target.value }))} />
            <FormControlLabel
              control={<Switch checked={d.anonymousToFacilitators} onChange={(e) => setD((x) => ({ ...x, anonymousToFacilitators: e.target.checked }))} />}
              label="Anonymous to facilitators (they see answers, never who gave them; training admins still can)"
            />
          </Stack>
        </InstitutionModalSection>
        <InstitutionModalSection title={`Questions (${d.questions.length})`}>
          <Stack spacing={1.25}>
            {d.questions.map((q, i) => (
              <Paper key={q.id} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
                <Stack spacing={1}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: PURPLE, minWidth: 24 }}>{i + 1}.</Typography>
                    <TextField size="small" fullWidth label="Question" value={q.label} onChange={(e) => setQ(i, { label: e.target.value })} />
                    <TextField select size="small" label="Type" value={q.type} onChange={(e) => setQ(i, { type: e.target.value })} sx={{ minWidth: 220 }}>
                      {FEEDBACK_QUESTION_TYPES.map((t) => <MenuItem key={t} value={t}>{FEEDBACK_QUESTION_LABELS[t]}</MenuItem>)}
                    </TextField>
                  </Stack>
                  {q.type === 'CHOICE' ? (
                    <TextField size="small" multiline minRows={2} label="Choices, one per line" value={q.optionsText} onChange={(e) => setQ(i, { optionsText: e.target.value })} />
                  ) : null}
                  <Stack direction="row" alignItems="center">
                    <FormControlLabel control={<Switch size="small" checked={Boolean(q.required)} onChange={(e) => setQ(i, { required: e.target.checked })} />} label="Required" />
                    <Box sx={{ flex: 1 }} />
                    <Tooltip title="Move up"><span><IconButton size="small" disabled={i === 0} onClick={() => move(i, -1)}><UpIcon fontSize="small" /></IconButton></span></Tooltip>
                    <Tooltip title="Move down"><span><IconButton size="small" disabled={i === d.questions.length - 1} onClick={() => move(i, 1)}><DownIcon fontSize="small" /></IconButton></span></Tooltip>
                    <Tooltip title="Remove"><span><IconButton size="small" color="error" disabled={d.questions.length <= 1} onClick={() => setD((x) => ({ ...x, questions: x.questions.filter((_, j) => j !== i) }))}><DeleteIcon fontSize="small" /></IconButton></span></Tooltip>
                  </Stack>
                </Stack>
              </Paper>
            ))}
            <Stack direction="row" spacing={1}>
              <Button size="small" startIcon={<AddIcon />} onClick={() => setD((x) => ({ ...x, questions: [...x.questions, { id: newId(), type: 'RATING', label: '', required: false, optionsText: '' }] }))} sx={{ color: PURPLE, textTransform: 'none', fontWeight: 700 }}>
                Add question
              </Button>
              <Button size="small" onClick={() => setD((x) => ({ ...x, questions: DEFAULT_FEEDBACK_QUESTIONS.map((q) => ({ ...q, optionsText: '' })) }))} sx={{ textTransform: 'none' }}>
                Use suggested questions
              </Button>
            </Stack>
          </Stack>
        </InstitutionModalSection>
      </InstitutionModalBody>
      <InstitutionModalFooter>
        <Button onClick={onClose} disabled={busy} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={busy} sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700 }}>{busy ? 'Saving…' : 'Save form'}</Button>
      </InstitutionModalFooter>
    </InstitutionModal>
  );
}
