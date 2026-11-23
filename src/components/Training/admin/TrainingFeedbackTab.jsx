'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Edit as EditIcon, Send as SendIcon } from '@mui/icons-material';
import FeedbackFormEditor from '@/components/Training/FeedbackFormEditor';
import FeedbackResults from '@/components/Training/FeedbackResults';

const PURPLE = '#8b6cbc';
const btn = { textTransform: 'none', fontWeight: 700 };

async function api(url, init) {
  const res = await fetch(url, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...init });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) throw new Error(json.error || 'Something went wrong');
  return json;
}

/**
 * Feedback tab (#106): which form applies (this training's own or the institution
 * default), editing either, asking participants, and the results.
 */
export default function TrainingFeedbackTab({ trainingId, training, onChanged }) {
  const [info, setInfo] = useState(null);
  const [editor, setEditor] = useState(null); // 'training' | 'institution'
  const [institutionForm, setInstitutionForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dialogError, setDialogError] = useState('');
  const [notice, setNotice] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    try {
      setInfo(await api(`/api/training/${trainingId}/feedback/form`));
    } catch (err) {
      setError(err.message);
    }
  }, [trainingId]);

  useEffect(() => { load(); }, [load]);

  const openInstitution = async () => {
    setDialogError('');
    try {
      const json = await api('/api/training/feedback-form');
      setInstitutionForm(json);
      setEditor('institution');
    } catch (err) {
      setError(err.message);
    }
  };

  const save = async (data) => {
    setBusy(true);
    setDialogError('');
    try {
      if (editor === 'institution') await api('/api/training/feedback-form', { method: 'PUT', body: JSON.stringify(data) });
      else await api(`/api/training/${trainingId}/feedback/form`, { method: 'PUT', body: JSON.stringify(data) });
      setEditor(null);
      await load();
      setRefreshKey((k) => k + 1);
      onChanged?.();
    } catch (err) {
      setDialogError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const useDefault = async () => {
    setBusy(true);
    setError('');
    try {
      await api(`/api/training/${trainingId}/feedback/form`, { method: 'DELETE' });
      await load();
      setRefreshKey((k) => k + 1);
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const ask = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const json = await api(`/api/training/${trainingId}/feedback/results`, { method: 'POST' });
      setNotice(json.sent ? `${json.sent} participant(s) asked for feedback.` : 'Everyone who can answer has already been asked or has answered.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const ended = training?.endDate && new Date(training.endDate) <= new Date();

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error" onClose={() => setError('')}>{error}</Alert> : null}
      {notice ? <Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert> : null}
      <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between">
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Feedback form</Typography>
            {info ? (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5, flexWrap: 'wrap', rowGap: 0.5 }}>
                {info.form ? (
                  <>
                    <Typography variant="body2">{info.form.title} · {info.form.questions.length} question(s)</Typography>
                    <Chip size="small" label={info.source === 'TRAINING' ? 'This training’s own form' : 'Institution default'} sx={{ bgcolor: alpha(PURPLE, 0.1), color: PURPLE, fontWeight: 700 }} />
                    {info.form.anonymousToFacilitators ? <Chip size="small" label="Anonymous to facilitators" /> : null}
                  </>
                ) : <Typography variant="body2" color="text.secondary">No form yet. Create one for this training, or an institution default for every training.</Typography>}
              </Stack>
            ) : null}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Participants can answer once the training ends{training?.minAttendancePercent ? ` or once they reach ${training.minAttendancePercent}% attendance` : ''}.
              {training?.requireFeedback ? ' Completion requires it.' : ' Turn on “Submit the feedback form” in Completion to require it.'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1, alignSelf: 'flex-start' }}>
            <Button size="small" variant="outlined" startIcon={<EditIcon />} disabled={!info || busy} onClick={() => { setDialogError(''); setEditor('training'); }} sx={{ borderColor: PURPLE, color: PURPLE, ...btn }}>
              {info?.source === 'TRAINING' ? 'Edit this training’s form' : 'Customise for this training'}
            </Button>
            {info?.source === 'TRAINING' && info?.hasInstitutionDefault ? (
              <Button size="small" disabled={busy} onClick={useDefault} sx={{ color: PURPLE, ...btn }}>Use institution default</Button>
            ) : null}
            <Button size="small" disabled={busy} onClick={openInstitution} sx={{ color: PURPLE, ...btn }}>Institution default…</Button>
            <Button size="small" variant="contained" startIcon={<SendIcon />} disabled={busy || !info?.form || !ended} onClick={ask} sx={{ bgcolor: PURPLE, ...btn }}>
              Ask participants
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <FeedbackResults trainingId={trainingId} refreshKey={refreshKey} />

      <FeedbackFormEditor
        open={editor === 'training'}
        onClose={() => setEditor(null)}
        onSave={save}
        form={info?.form}
        template={info?.template}
        title={info?.source === 'TRAINING' ? 'Edit this training’s form' : 'Customise the form for this training'}
        subtitle={training?.title}
        busy={busy}
        error={dialogError}
      />
      <FeedbackFormEditor
        open={editor === 'institution'}
        onClose={() => setEditor(null)}
        onSave={save}
        form={institutionForm?.form}
        template={institutionForm?.template}
        title="Institution default feedback form"
        subtitle="Used by every training that doesn't have its own form"
        busy={busy}
        error={dialogError}
      />
    </Stack>
  );
}
