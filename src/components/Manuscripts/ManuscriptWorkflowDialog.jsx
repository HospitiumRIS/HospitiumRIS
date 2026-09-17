'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  ErrorOutline as ErrorOutlineIcon,
  OpenInNew as OpenInNewIcon,
  RateReview as RateReviewIcon,
  WarningAmber as WarningAmberIcon
} from '@mui/icons-material';
import StagePipeline from './StagePipeline';
import {
  SUBMISSION_TYPES,
  evaluatePublicationChecklist,
  getStageTranslationKey,
  getWorkflowPhase
} from '../../lib/manuscript-workflow';

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    '&:hover fieldset': { borderColor: '#8b6cbc' },
    '&.Mui-focused fieldset': { borderColor: '#8b6cbc' }
  },
  '& .MuiInputLabel-root.Mui-focused': { color: '#8b6cbc' }
};

const REVIEW_STEP_KEYS = ['step_readiness', 'step_submission', 'step_feedback'];
const PUBLICATION_STEP_KEYS = ['step_finalize', 'step_identifiers', 'step_publish', 'step_archive'];

function ChecklistItem({ item }) {
  const icon = item.passed
    ? <CheckCircleIcon sx={{ color: '#10b981', fontSize: 20 }} />
    : item.severity === 'error'
      ? <ErrorOutlineIcon sx={{ color: '#ef4444', fontSize: 20 }} />
      : <WarningAmberIcon sx={{ color: '#f59e0b', fontSize: 20 }} />;

  return (
    <ListItem disableGutters sx={{ py: 0.5 }}>
      <ListItemIcon sx={{ minWidth: 32 }}>{icon}</ListItemIcon>
      <ListItemText
        primary={item.label}
        secondary={item.passed ? null : item.hint}
        primaryTypographyProps={{ variant: 'body2', fontWeight: item.passed ? 400 : 500 }}
        secondaryTypographyProps={{ variant: 'caption' }}
      />
    </ListItem>
  );
}

/**
 * Guided protocol that walks a manuscript from drafting through peer review,
 * publication, and archiving.
 */
export default function ManuscriptWorkflowDialog({ open, manuscript, onClose, onUpdated }) {
  const router = useRouter();
  const { t } = useTranslation();
  const tw = useCallback((key, fallback) => t(`manuscript_workflow.${key}`, fallback), [t]);

  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [phaseView, setPhaseView] = useState('review');
  const [activeStep, setActiveStep] = useState(0);

  const [submission, setSubmission] = useState({
    type: 'MANUAL',
    targetName: '',
    targetUrl: '',
    referenceId: '',
    notes: ''
  });
  const [revisionNotes, setRevisionNotes] = useState('');
  const [publicationMeta, setPublicationMeta] = useState({
    doi: '',
    journal: '',
    url: '',
    volume: '',
    pages: '',
    authorId: ''
  });
  const [libraryChoice, setLibraryChoice] = useState('library');
  const [archiveNotes, setArchiveNotes] = useState('');

  const status = workflow?.status || manuscript?.status || 'DRAFT';
  const stepKeys = phaseView === 'publication' ? PUBLICATION_STEP_KEYS : REVIEW_STEP_KEYS;

  const loadWorkflow = useCallback(async () => {
    if (!manuscript?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/manuscripts/${manuscript.id}/status`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || tw('error_load', 'Failed to load workflow state'));
      }

      setWorkflow(result.data);

      const savedMeta = result.data.workflowMeta?.publication;
      if (savedMeta) {
        setPublicationMeta((prev) => ({ ...prev, ...savedMeta }));
      }

      return result.data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [manuscript?.id, tw]);

  // Open on the step that matches where the manuscript currently sits
  useEffect(() => {
    if (!open) return;

    setError(null);
    loadWorkflow().then((data) => {
      const currentStatus = data?.status || manuscript?.status || 'DRAFT';
      const phase = getWorkflowPhase(currentStatus);

      if (phase === 'publication') {
        setPhaseView('publication');
        setActiveStep(currentStatus === 'ARCHIVED' ? 3 : 2);
      } else {
        setPhaseView('review');
        setActiveStep(phase === 'review' ? 2 : 0);
      }
    });
  }, [open, loadWorkflow, manuscript?.status]);

  const blockingItems = useMemo(
    () => (workflow?.checklist || []).filter((item) => item.severity === 'error' && !item.passed),
    [workflow]
  );

  const publicationChecklist = useMemo(
    () => evaluatePublicationChecklist(manuscript || {}, publicationMeta),
    [manuscript, publicationMeta]
  );

  const runAction = async (action, payload = {}) => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/manuscripts/${manuscript.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload })
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || tw('error_update', 'Failed to update workflow stage'));
      }

      onUpdated?.(result.data, result.message);
      await loadWorkflow();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const recordSubmission = async () => {
    if (!submission.targetName.trim()) {
      setError(tw('target_required', 'Enter the journal, repository, or preprint server name'));
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/manuscripts/${manuscript.id}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission)
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || tw('error_record', 'Failed to record submission'));
      }
    } catch (err) {
      setError(err.message);
      setSaving(false);
      return;
    }

    setSaving(false);

    const target = submission.targetName.trim();
    const action = status === 'UNDER_REVISION' ? 'resubmit' : 'submit_for_review';
    const advanced = await runAction(action, { notes: `Submitted to ${target}` });

    if (advanced) {
      setSubmission({ type: 'MANUAL', targetName: '', targetUrl: '', referenceId: '', notes: '' });
      setActiveStep(2);
    }
  };

  const launchExternalSubmission = () => {
    router.push(`/researcher/publications/submit?manuscriptId=${manuscript.id}`);
    onClose?.();
  };

  const openPublicationPhase = () => {
    setPhaseView('publication');
    setActiveStep(1);
  };

  const renderReadinessStep = () => (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        {tw('readiness_title', 'Pre-submission readiness')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {tw('readiness_desc', 'Confirm the manuscript is complete before it goes out for external scrutiny.')}
      </Typography>
      <List dense disablePadding>
        {(workflow?.checklist || []).map((item) => (
          <ChecklistItem key={item.id} item={item} />
        ))}
      </List>
      {blockingItems.length > 0 && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {tw('readiness_blocked', 'Resolve the highlighted items before submitting.')}
        </Alert>
      )}
    </Box>
  );

  const renderSubmissionStep = () => (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        {tw('submission_title', 'Choose how the manuscript is submitted')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {tw('submission_desc', 'Submit through HospitiumRIS, or record a submission you made directly with a journal or institutional repository.')}
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
          {tw('submit_via_title', 'Submit via HospitiumRIS')}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          {tw('submit_via_desc', 'Opens the submission workspace with this manuscript prefilled.')}
        </Typography>
        <Button
          variant="outlined"
          endIcon={<OpenInNewIcon />}
          onClick={launchExternalSubmission}
          sx={{ borderColor: '#8b6cbc', color: '#8b6cbc', textTransform: 'none' }}
        >
          {tw('submit_via_action', 'Open submission workspace')}
        </Button>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
          {tw('record_title', 'Record an external submission')}
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 5 }}>
            <FormControl fullWidth size="small">
              <InputLabel>{tw('destination_type', 'Destination type')}</InputLabel>
              <Select
                value={submission.type}
                label={tw('destination_type', 'Destination type')}
                onChange={(e) => setSubmission((prev) => ({ ...prev, type: e.target.value }))}
              >
                {SUBMISSION_TYPES.filter((option) => option.value !== 'EXTERNAL').map((option) => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 7 }}>
            <TextField
              fullWidth size="small" required
              label={tw('target_name', 'Journal / repository name')}
              value={submission.targetName}
              onChange={(e) => setSubmission((prev) => ({ ...prev, targetName: e.target.value }))}
              sx={fieldSx}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth size="small" label={tw('reference_id', 'Submission reference ID')}
              value={submission.referenceId}
              onChange={(e) => setSubmission((prev) => ({ ...prev, referenceId: e.target.value }))}
              sx={fieldSx}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth size="small" label={tw('submission_url', 'Submission URL')}
              value={submission.targetUrl}
              onChange={(e) => setSubmission((prev) => ({ ...prev, targetUrl: e.target.value }))}
              sx={fieldSx}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth size="small" multiline minRows={2} label={tw('notes', 'Notes')}
              value={submission.notes}
              onChange={(e) => setSubmission((prev) => ({ ...prev, notes: e.target.value }))}
              sx={fieldSx}
            />
          </Grid>
        </Grid>
        <Button
          variant="contained"
          onClick={recordSubmission}
          disabled={saving || blockingItems.length > 0}
          sx={{ mt: 2, bgcolor: '#8b6cbc', textTransform: 'none', '&:hover': { bgcolor: '#7b5cac' } }}
        >
          {status === 'UNDER_REVISION'
            ? tw('record_resubmit_action', 'Record resubmission')
            : tw('record_action', 'Record submission and move to In Review')}
        </Button>
      </Paper>
    </Box>
  );

  const renderFeedbackStep = () => (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        {tw('feedback_title', 'Reviewer feedback and revisions')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {tw('feedback_desc', "Log each review round. Use the editor's comments and tracked changes to work through the reviewers' requests, then resubmit or move on to publication.")}
      </Typography>

      {(workflow?.submissions || []).length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>
            {tw('submission_history', 'Submission history')}
          </Typography>
          <List dense disablePadding sx={{ mt: 1 }}>
            {workflow.submissions.map((record) => (
              <ListItem key={record.id} disableGutters sx={{ py: 0.5 }}>
                <ListItemText
                  primary={record.targetName}
                  secondary={`${record.status.replace(/_/g, ' ')} · ${new Date(record.submittedAt).toLocaleDateString()}${record.referenceId ? ` · Ref ${record.referenceId}` : ''}`}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {status === 'DRAFT' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {tw('not_submitted', 'This manuscript has not been submitted yet. Complete the submission step first.')}
        </Alert>
      )}

      <TextField
        fullWidth multiline minRows={3} size="small"
        label={tw('revision_notes', 'Revision notes for this round')}
        value={revisionNotes}
        onChange={(e) => setRevisionNotes(e.target.value)}
        sx={{ ...fieldSx, mb: 2 }}
      />

      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        {status === 'IN_REVIEW' && (
          <Button
            variant="outlined"
            disabled={saving}
            onClick={() => runAction('request_revisions', { notes: revisionNotes })}
            sx={{ borderColor: '#8b5cf6', color: '#8b5cf6', textTransform: 'none' }}
          >
            {tw('request_revisions', 'Reviewers requested revisions')}
          </Button>
        )}
        {status === 'UNDER_REVISION' && (
          <Button
            variant="outlined"
            disabled={saving}
            onClick={() => runAction('resubmit', { notes: revisionNotes })}
            sx={{ borderColor: '#3b82f6', color: '#3b82f6', textTransform: 'none' }}
          >
            {tw('resubmit', 'Resubmit to reviewers')}
          </Button>
        )}
      </Box>

      <Divider sx={{ my: 2.5 }} />

      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
        {tw('accepted_question', 'Accepted for publication?')}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
        {tw('accepted_desc', 'Continue to the publication phase to record identifiers and make the work discoverable.')}
      </Typography>
      <Button
        variant="contained"
        disabled={saving || status === 'DRAFT'}
        onClick={openPublicationPhase}
        sx={{ bgcolor: '#10b981', textTransform: 'none', '&:hover': { bgcolor: '#059669' } }}
      >
        {tw('continue_to_publication', 'Continue to publication')}
      </Button>
    </Box>
  );

  const renderFinalizeStep = () => (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        {tw('finalize_title', 'Finalize the manuscript')}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {tw('finalize_desc', 'Complete typesetting and formatting in the editor, then export a final proof. Once the layout is final, record the persistent identifiers on the next step.')}
      </Typography>
    </Box>
  );

  const renderIdentifiersStep = () => (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        {tw('identifiers_title', 'Persistent identifiers and metadata')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {tw('identifiers_desc', 'A DOI and ORCID metadata make the work citable, discoverable, and correctly attributed.')}
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth size="small" label={tw('doi', 'DOI')}
            value={publicationMeta.doi}
            onChange={(e) => setPublicationMeta((prev) => ({ ...prev, doi: e.target.value }))}
            sx={fieldSx}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth size="small" label={tw('journal', 'Journal / repository')}
            value={publicationMeta.journal}
            onChange={(e) => setPublicationMeta((prev) => ({ ...prev, journal: e.target.value }))}
            sx={fieldSx}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth size="small" label={tw('orcid_author', 'ORCID iD of corresponding author')}
            value={publicationMeta.authorId}
            onChange={(e) => setPublicationMeta((prev) => ({ ...prev, authorId: e.target.value }))}
            sx={fieldSx}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth size="small" label={tw('published_url', 'Published URL')}
            value={publicationMeta.url}
            onChange={(e) => setPublicationMeta((prev) => ({ ...prev, url: e.target.value }))}
            sx={fieldSx}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth size="small" label={tw('volume', 'Volume')}
            value={publicationMeta.volume}
            onChange={(e) => setPublicationMeta((prev) => ({ ...prev, volume: e.target.value }))}
            sx={fieldSx}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth size="small" label={tw('pages', 'Pages')}
            value={publicationMeta.pages}
            onChange={(e) => setPublicationMeta((prev) => ({ ...prev, pages: e.target.value }))}
            sx={fieldSx}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderPublishStep = () => (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        {tw('publish_title', 'Publish and disseminate')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {tw('publish_desc', 'Publishing records the manuscript as complete and makes it discoverable to the wider community.')}
      </Typography>

      <List dense disablePadding sx={{ mb: 2 }}>
        {publicationChecklist.map((item) => (
          <ChecklistItem key={item.id} item={item} />
        ))}
      </List>

      <Divider sx={{ my: 2 }} />

      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
        {tw('where_record', 'Where should the published record live?')}
      </Typography>
      <RadioGroup value={libraryChoice} onChange={(e) => setLibraryChoice(e.target.value)}>
        <FormControlLabel
          value="library"
          control={<Radio sx={{ '&.Mui-checked': { color: '#8b6cbc' } }} />}
          label={
            <Box>
              <Typography variant="body2">{tw('add_to_library', 'Add to my Publications library')}</Typography>
              <Typography variant="caption" color="text.secondary">
                {tw('add_to_library_desc', 'Creates a publication record visible under Publications, linked to this manuscript.')}
              </Typography>
            </Box>
          }
        />
        <FormControlLabel
          value="manuscript"
          control={<Radio sx={{ '&.Mui-checked': { color: '#8b6cbc' } }} />}
          label={
            <Box>
              <Typography variant="body2">{tw('manuscript_only', 'Keep manuscript record only')}</Typography>
              <Typography variant="caption" color="text.secondary">
                {tw('manuscript_only_desc', 'Stores the identifiers on the manuscript without adding a library entry.')}
              </Typography>
            </Box>
          }
        />
      </RadioGroup>

      {status === 'PUBLISHED' || status === 'ARCHIVED' ? (
        <Alert severity="success" sx={{ mt: 2 }}>
          {tw('already_published', 'This manuscript is already published.')}
        </Alert>
      ) : (
        <Button
          variant="contained"
          disabled={saving}
          onClick={async () => {
            const succeeded = await runAction('mark_published', {
              publicationMeta,
              addToLibrary: libraryChoice === 'library'
            });
            if (succeeded) setActiveStep(3);
          }}
          sx={{ mt: 2, bgcolor: '#10b981', textTransform: 'none', '&:hover': { bgcolor: '#059669' } }}
        >
          {tw('mark_published', 'Mark as published')}
        </Button>
      )}
    </Box>
  );

  const renderArchiveStep = () => (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        {tw('archive_title', 'Long-term preservation')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {tw('archive_desc', 'Archiving marks the manuscript read-only and records where the preserved copy lives.')}
      </Typography>

      {workflow?.publicationId && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {tw('linked_publication', 'This manuscript is linked to a publication record in your library.')}
        </Alert>
      )}

      <TextField
        fullWidth size="small" multiline minRows={2}
        label={tw('archive_notes', 'Archive location or preservation notes')}
        value={archiveNotes}
        onChange={(e) => setArchiveNotes(e.target.value)}
        sx={{ ...fieldSx, mb: 2 }}
      />

      <Button
        variant="outlined"
        disabled={saving || status !== 'PUBLISHED'}
        onClick={() => runAction('archive', { notes: archiveNotes })}
        sx={{ borderColor: '#6b7280', color: '#6b7280', textTransform: 'none' }}
      >
        {status === 'ARCHIVED'
          ? tw('already_archived', 'Already archived')
          : tw('archive_action', 'Archive manuscript')}
      </Button>
    </Box>
  );

  const renderStepContent = () => {
    if (phaseView === 'publication') {
      if (activeStep === 0) return renderFinalizeStep();
      if (activeStep === 1) return renderIdentifiersStep();
      if (activeStep === 2) return renderPublishStep();
      return renderArchiveStep();
    }

    if (activeStep === 0) return renderReadinessStep();
    if (activeStep === 1) return renderSubmissionStep();
    return renderFeedbackStep();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{
        bgcolor: '#8b6cbc',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RateReviewIcon />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {tw('title', 'Peer Review & Publication')}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        {manuscript && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2D3748', mb: 1 }}>
              {manuscript.title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Chip
                label={t(getStageTranslationKey(status))}
                size="small"
                sx={{ bgcolor: '#8b6cbc', color: 'white' }}
              />
              <StagePipeline currentStatus={status} />
            </Box>
          </Box>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress sx={{ color: '#8b6cbc' }} />
          </Box>
        ) : (
          <>
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
              {stepKeys.map((key) => (
                <Step key={key}>
                  <StepLabel>{tw(key)}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {renderStepContent()}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={() => {
            if (phaseView === 'publication' && activeStep === 0) {
              setPhaseView('review');
              setActiveStep(2);
              return;
            }
            setActiveStep((prev) => Math.max(0, prev - 1));
          }}
          disabled={saving || (phaseView === 'review' && activeStep === 0)}
          sx={{ textTransform: 'none', color: '#6b7280' }}
        >
          {t('common.back')}
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} sx={{ textTransform: 'none', color: '#6b7280' }}>
          {t('common.close')}
        </Button>
        <Button
          onClick={() => setActiveStep((prev) => Math.min(stepKeys.length - 1, prev + 1))}
          disabled={
            activeStep >= stepKeys.length - 1 ||
            saving ||
            (phaseView === 'review' && activeStep === 0 && blockingItems.length > 0)
          }
          variant="contained"
          sx={{ bgcolor: '#8b6cbc', textTransform: 'none', '&:hover': { bgcolor: '#7b5cac' } }}
        >
          {t('common.next')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
