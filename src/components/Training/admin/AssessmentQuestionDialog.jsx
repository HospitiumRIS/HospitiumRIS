'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  IconButton,
  MenuItem,
  Radio,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Close as RemoveIcon, Quiz as QuizIcon } from '@mui/icons-material';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
  InstitutionModalSection,
} from '@/components/GlobalAdmin/InstitutionModalShell';
import { QUESTION_TYPE_LABELS, QUESTION_TYPES } from '@/lib/training-assessment';

const PURPLE = '#8b6cbc';
let seq = 0;
const newOption = (text = '') => ({ id: `o${Date.now().toString(36)}${(seq += 1)}`, text });

const fromQuestion = (q) => ({
  type: q?.type || 'SINGLE',
  prompt: q?.prompt || '',
  points: q?.points ?? 1,
  explanation: q?.explanation || '',
  options: q?.options?.length && (q.type === 'SINGLE' || q.type === 'MULTI') ? q.options : [newOption(), newOption()],
  correct: Array.isArray(q?.correct) ? q.correct : [],
  accepted: q?.type === 'SHORT_TEXT' ? (q.correct || []).join('\n') : '',
});

/** Add or edit one question (#105). */
export default function AssessmentQuestionDialog({ open, onClose, onSave, question, busy, error }) {
  const [draft, setDraft] = useState(() => fromQuestion(question));
  useEffect(() => { if (open) setDraft(fromQuestion(question)); }, [open, question]);

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const setOption = (id, text) => set({ options: draft.options.map((o) => (o.id === id ? { ...o, text } : o)) });
  const toggleCorrect = (id) => {
    if (draft.type === 'SINGLE') set({ correct: [id] });
    else set({ correct: draft.correct.includes(id) ? draft.correct.filter((x) => x !== id) : [...draft.correct, id] });
  };

  const submit = () => {
    const base = { type: draft.type, prompt: draft.prompt, points: Number(draft.points), explanation: draft.explanation };
    if (draft.type === 'SHORT_TEXT') onSave({ ...base, correct: draft.accepted.split('\n').map((s) => s.trim()).filter(Boolean) });
    else if (draft.type === 'TRUE_FALSE') onSave({ ...base, correct: draft.correct.filter((c) => c === 'true' || c === 'false').slice(0, 1) });
    else onSave({ ...base, options: draft.options, correct: draft.correct });
  };

  return (
    <InstitutionModal open={open} onClose={onClose} disableClose={busy} maxWidth="md">
      <InstitutionModalHeader icon={QuizIcon} title={question?.id ? 'Edit question' : 'Add question'} onClose={onClose} disableClose={busy} />
      <InstitutionModalBody>
        {error ? <Alert severity="error" sx={{ borderRadius: 1.5 }}>{error}</Alert> : null}
        <InstitutionModalSection title="Question">
          <Stack spacing={1.5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField select size="small" label="Type" value={draft.type} onChange={(e) => set({ type: e.target.value, correct: [] })} sx={{ flex: 1 }}>
                {QUESTION_TYPES.map((t) => <MenuItem key={t} value={t}>{QUESTION_TYPE_LABELS[t]}</MenuItem>)}
              </TextField>
              <TextField size="small" type="number" label="Points" value={draft.points} onChange={(e) => set({ points: e.target.value })} inputProps={{ min: 0.5, step: 0.5 }} sx={{ width: 120 }} />
            </Stack>
            <TextField multiline minRows={2} label="Question" value={draft.prompt} onChange={(e) => set({ prompt: e.target.value })} />
          </Stack>
        </InstitutionModalSection>

        {draft.type === 'SINGLE' || draft.type === 'MULTI' ? (
          <InstitutionModalSection title={draft.type === 'SINGLE' ? 'Answers: tick the correct one' : 'Answers: tick every correct one (all must be chosen to score)'}>
            <Stack spacing={1}>
              {draft.options.map((o, i) => (
                <Stack key={o.id} direction="row" spacing={1} alignItems="center">
                  {draft.type === 'SINGLE'
                    ? <Radio checked={draft.correct.includes(o.id)} onChange={() => toggleCorrect(o.id)} sx={{ '&.Mui-checked': { color: PURPLE } }} />
                    : <Checkbox checked={draft.correct.includes(o.id)} onChange={() => toggleCorrect(o.id)} sx={{ '&.Mui-checked': { color: PURPLE } }} />}
                  <TextField size="small" fullWidth placeholder={`Answer ${i + 1}`} value={o.text} onChange={(e) => setOption(o.id, e.target.value)} />
                  <Tooltip title="Remove">
                    <span>
                      <IconButton size="small" disabled={draft.options.length <= 2} onClick={() => set({ options: draft.options.filter((x) => x.id !== o.id), correct: draft.correct.filter((x) => x !== o.id) })}>
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              ))}
              <Button size="small" startIcon={<AddIcon />} disabled={draft.options.length >= 12} onClick={() => set({ options: [...draft.options, newOption()] })} sx={{ alignSelf: 'flex-start', color: PURPLE, textTransform: 'none', fontWeight: 700 }}>
                Add answer
              </Button>
            </Stack>
          </InstitutionModalSection>
        ) : null}

        {draft.type === 'TRUE_FALSE' ? (
          <InstitutionModalSection title="Correct answer">
            <ToggleButtonGroup exclusive size="small" value={draft.correct[0] || null} onChange={(_, v) => v && set({ correct: [v] })}>
              <ToggleButton value="true" sx={{ textTransform: 'none', px: 3 }}>True</ToggleButton>
              <ToggleButton value="false" sx={{ textTransform: 'none', px: 3 }}>False</ToggleButton>
            </ToggleButtonGroup>
          </InstitutionModalSection>
        ) : null}

        {draft.type === 'SHORT_TEXT' ? (
          <InstitutionModalSection title="Accepted answers (optional)">
            <TextField
              multiline
              minRows={2}
              fullWidth
              placeholder={'One per line, e.g.\nhand hygiene\nhand washing'}
              value={draft.accepted}
              onChange={(e) => set({ accepted: e.target.value })}
              helperText="Matching answers score automatically (case and spacing ignored). Anything else waits for you to grade it."
            />
          </InstitutionModalSection>
        ) : null}

        <InstitutionModalSection title="Explanation (optional)">
          <TextField multiline minRows={2} fullWidth value={draft.explanation} onChange={(e) => set({ explanation: e.target.value })} helperText="Shown with the correct answer after submitting, if the assessment shows answers." />
        </InstitutionModalSection>
        <Typography variant="caption" color="text.secondary">Participants never see correct answers or explanations before they submit.</Typography>
      </InstitutionModalBody>
      <InstitutionModalFooter>
        <Button onClick={onClose} disabled={busy} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={busy || !draft.prompt.trim()} sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700 }}>{busy ? 'Saving…' : 'Save question'}</Button>
      </InstitutionModalFooter>
    </InstitutionModal>
  );
}
