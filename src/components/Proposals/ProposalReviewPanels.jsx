'use client';

/**
 * Right-hand side panels used by the institution proposal review page:
 *  - InviteReviewersPanel: email chips with validation, optional message
 *  - RecordDecisionPanel: decision cards, required comments, conditional
 *    revision/rejection field and a summary before saving
 *
 * Follows HospitiumRIS modal conventions: clicking outside never closes the
 * panel (Escape, ✕ and Cancel do), and it cannot close while a request runs.
 */

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Drawer,
  IconButton,
  Stack,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import {
  Cancel as RejectIcon,
  CheckCircle as ApproveIcon,
  Close as CloseIcon,
  EditNote as RevisionIcon,
  Gavel as DecisionIcon,
  MarkEmailRead as InvitedIcon,
  PersonAdd as InviteIcon,
  RadioButtonChecked as SelectedIcon,
  RadioButtonUnchecked as UnselectedIcon,
  Send as SendIcon,
} from '@mui/icons-material';

const PURPLE = '#8b6cbc';
const PURPLE_DARK = '#7a5cb0';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MESSAGE_LIMIT = 1000;
const MIN_COMMENT_LENGTH = 20;

function PanelShell({ open, onClose, busy, icon, title, subtitle, children, footer, width = 520 }) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={(event, reason) => {
        if (reason === 'backdropClick' || busy) return;
        onClose?.(event, reason);
      }}
      PaperProps={{ sx: { width: { xs: '100%', sm: width }, bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column' } }}
    >
      <Box sx={{ p: 2.5, bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Box sx={{ width: 40, height: 40, borderRadius: 1.5, bgcolor: alpha(PURPLE, 0.12), color: PURPLE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {icon}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.1rem' }}>{title}</Typography>
            {subtitle ? <Typography variant="body2" color="text.secondary">{subtitle}</Typography> : null}
          </Box>
          <IconButton size="small" onClick={onClose} disabled={busy} aria-label="Close panel">
            <CloseIcon />
          </IconButton>
        </Stack>
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>{children}</Box>
      <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid', borderColor: 'divider' }}>
        {footer}
      </Stack>
    </Drawer>
  );
}

function Label({ children, required }) {
  return (
    <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.secondary', mb: 0.75 }}>
      {children}{required ? <Box component="span" sx={{ color: '#dc2626' }}> *</Box> : null}
    </Typography>
  );
}

const splitEmails = (value) => String(value || '').split(/[,;\s]+/).map((item) => item.trim().toLowerCase()).filter(Boolean);

export function InviteReviewersPanel({ open, onClose, proposalId, proposalTitle, existingReviewers = [], onInvited }) {
  const [emails, setEmails] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setEmails([]);
      setInputValue('');
      setMessage('');
      setError('');
    }
  }, [open]);

  const existing = new Set(existingReviewers.map((email) => String(email).toLowerCase()));
  const invalid = emails.filter((email) => !EMAIL_RE.test(email));
  const duplicates = emails.filter((email) => existing.has(email));
  const sendable = emails.filter((email) => EMAIL_RE.test(email) && !existing.has(email));

  const addFromText = (text) => {
    const parts = splitEmails(text);
    if (!parts.length) return;
    setEmails((prev) => Array.from(new Set([...prev, ...parts])));
    setInputValue('');
  };

  const send = async () => {
    const pending = inputValue.trim() ? splitEmails(inputValue) : [];
    const finalList = Array.from(new Set([...sendable, ...pending.filter((email) => EMAIL_RE.test(email) && !existing.has(email))]));
    if (!finalList.length) {
      setError('Add at least one valid email address that has not already been invited.');
      return;
    }
    setSending(true);
    setError('');
    try {
      const response = await fetch(`/api/proposals/${proposalId}/reviewers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: finalList, message: message.trim() }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to invite reviewers');
      onInvited?.(data.assignedReviewers || [], finalList);
      onClose?.();
    } catch (err) {
      setError(err.message || 'Failed to invite reviewers');
    } finally {
      setSending(false);
    }
  };

  return (
    <PanelShell
      open={open}
      onClose={onClose}
      busy={sending}
      icon={<InviteIcon />}
      title="Invite reviewers"
      subtitle="Each reviewer gets an email with a secure link to this proposal. The researcher is told that reviewers have been assigned."
      footer={(
        <>
          <Button onClick={onClose} disabled={sending} sx={{ textTransform: 'none', fontWeight: 700, color: '#475569' }}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={sending ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <SendIcon />}
            disabled={sending || (!sendable.length && !inputValue.trim())}
            onClick={send}
            sx={{ textTransform: 'none', fontWeight: 700, bgcolor: PURPLE, boxShadow: 'none', '&:hover': { bgcolor: PURPLE_DARK, boxShadow: 'none' } }}
          >
            {sending ? 'Sending...' : sendable.length ? `Send ${sendable.length} invitation${sendable.length === 1 ? '' : 's'}` : 'Send invitations'}
          </Button>
        </>
      )}
    >
      <Stack spacing={2.5}>
        {error ? <Alert severity="error" sx={{ borderRadius: 1.5 }} onClose={() => setError('')}>{error}</Alert> : null}

        {proposalTitle ? (
          <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'white', border: '1px solid', borderColor: 'divider' }}>
            <Label>Proposal</Label>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>{proposalTitle}</Typography>
          </Box>
        ) : null}

        <Box>
          <Label required>Reviewer emails</Label>
          <Autocomplete
            multiple
            freeSolo
            options={[]}
            value={emails}
            inputValue={inputValue}
            onInputChange={(_, value, reason) => {
              if (reason === 'reset') return;
              if (/[,;\s]$/.test(value)) addFromText(value);
              else setInputValue(value);
            }}
            onChange={(_, value) => setEmails(Array.from(new Set(value.flatMap(splitEmails))))}
            renderTags={(value, getTagProps) => value.map((email, index) => {
              const { key, ...tagProps } = getTagProps({ index });
              const bad = !EMAIL_RE.test(email);
              const dup = existing.has(email);
              return (
                <Chip
                  key={key}
                  {...tagProps}
                  size="small"
                  label={email}
                  sx={{
                    fontWeight: 600,
                    bgcolor: bad ? '#fee2e2' : dup ? '#fef3c7' : alpha(PURPLE, 0.1),
                    color: bad ? '#b91c1c' : dup ? '#b45309' : PURPLE,
                  }}
                />
              );
            })}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                placeholder={emails.length ? 'Add another' : 'reviewer@university.edu'}
                onBlur={() => addFromText(inputValue)}
                onPaste={(event) => {
                  const text = event.clipboardData.getData('text');
                  if (/[,;\s]/.test(text.trim())) {
                    event.preventDefault();
                    addFromText(text);
                  }
                }}
                sx={{ bgcolor: 'white' }}
              />
            )}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
            Press Enter or comma after each address. You can paste a list.
          </Typography>
          {invalid.length ? (
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#b91c1c', fontWeight: 600 }}>
              {invalid.length} address{invalid.length === 1 ? ' is' : 'es are'} not valid and will be skipped.
            </Typography>
          ) : null}
          {duplicates.length ? (
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#b45309', fontWeight: 600 }}>
              Already invited: {duplicates.join(', ')}
            </Typography>
          ) : null}
        </Box>

        <Box>
          <Label>Personal message</Label>
          <TextField
            fullWidth
            multiline
            minRows={4}
            size="small"
            placeholder="e.g. We would value your review of the methodology and budget. Please respond within 10 working days."
            value={message}
            onChange={(event) => setMessage(event.target.value.slice(0, MESSAGE_LIMIT))}
            sx={{ bgcolor: 'white' }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, textAlign: 'right' }}>
            {message.length}/{MESSAGE_LIMIT}
          </Typography>
        </Box>

        <Box>
          <Label>Already invited ({existingReviewers.length})</Label>
          {existingReviewers.length ? (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {existingReviewers.map((email) => (
                <Chip key={email} size="small" icon={<InvitedIcon />} label={email} sx={{ fontWeight: 600, bgcolor: 'white', border: '1px solid', borderColor: 'divider', '& .MuiChip-icon': { color: PURPLE } }} />
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">No reviewers invited yet.</Typography>
          )}
        </Box>
      </Stack>
    </PanelShell>
  );
}

export const DECISIONS = [
  {
    value: 'approved',
    label: 'Approve',
    description: 'The proposal meets institutional requirements and can proceed.',
    color: '#15803d',
    bg: '#f0fdf4',
    icon: <ApproveIcon />,
  },
  {
    value: 'requires_revision',
    label: 'Request revision',
    description: 'Return to the researcher with specific changes to make and resubmit.',
    color: '#b45309',
    bg: '#fffbeb',
    icon: <RevisionIcon />,
    extraLabel: 'Revision requirements',
    extraPlaceholder: 'List each change the researcher must make, e.g.\n1. Justify the sample size for site B\n2. Add the DPIA reference to the data management plan',
  },
  {
    value: 'rejected',
    label: 'Reject',
    description: 'The proposal cannot proceed in its current form.',
    color: '#b91c1c',
    bg: '#fef2f2',
    icon: <RejectIcon />,
    extraLabel: 'Reason for rejection',
    extraPlaceholder: 'Explain clearly why the proposal cannot proceed.',
  },
];

export function RecordDecisionPanel({ open, onClose, proposalId, proposalTitle, reviewerName, onSaved }) {
  const [decision, setDecision] = useState('');
  const [comments, setComments] = useState('');
  const [extra, setExtra] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setDecision('');
      setComments('');
      setExtra('');
      setError('');
      setTouched(false);
    }
  }, [open]);

  const selected = DECISIONS.find((item) => item.value === decision) || null;
  const commentsOk = comments.trim().length >= MIN_COMMENT_LENGTH;
  const extraOk = !selected?.extraLabel || extra.trim().length > 0;
  const valid = Boolean(selected) && commentsOk && extraOk;

  const save = async () => {
    setTouched(true);
    if (!valid) return;
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch(`/api/proposals/${proposalId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          overallComments: comments.trim(),
          rejectionReason: decision === 'rejected' ? extra.trim() : '',
          revisionRequirements: decision === 'requires_revision' ? extra.trim() : '',
          recommendation: comments.trim(),
          reviewer: reviewerName || 'Research administrator',
          reviewDate: new Date().toISOString(),
          sectionReviews: {},
          complianceScore: {},
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || data.details || 'Failed to save decision');
      onSaved?.(decision);
      onClose?.();
    } catch (err) {
      setError(err.message || 'Failed to save decision');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PanelShell
      open={open}
      onClose={onClose}
      busy={submitting}
      icon={<DecisionIcon />}
      title="Record a decision"
      subtitle="The researcher is notified in the app and by email as soon as you save."
      footer={(
        <>
          <Button onClick={onClose} disabled={submitting} sx={{ textTransform: 'none', fontWeight: 700, color: '#475569' }}>Cancel</Button>
          <Button
            variant="contained"
            disabled={submitting || (touched && !valid)}
            onClick={save}
            startIcon={submitting ? <CircularProgress size={16} sx={{ color: 'white' }} /> : selected?.icon || <DecisionIcon />}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              boxShadow: 'none',
              bgcolor: selected?.color || PURPLE,
              '&:hover': { bgcolor: selected?.color || PURPLE_DARK, filter: 'brightness(0.92)', boxShadow: 'none' },
            }}
          >
            {submitting ? 'Saving...' : selected ? `${selected.label} and notify researcher` : 'Save decision'}
          </Button>
        </>
      )}
    >
      <Stack spacing={2.5}>
        {error ? <Alert severity="error" sx={{ borderRadius: 1.5 }} onClose={() => setError('')}>{error}</Alert> : null}

        {proposalTitle ? (
          <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'white', border: '1px solid', borderColor: 'divider' }}>
            <Label>Proposal</Label>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>{proposalTitle}</Typography>
          </Box>
        ) : null}

        <Box>
          <Label required>Decision</Label>
          <Stack spacing={1} role="radiogroup" aria-label="Decision">
            {DECISIONS.map((option) => {
              const active = option.value === decision;
              return (
                <Box
                  key={option.value}
                  role="radio"
                  aria-checked={active}
                  tabIndex={0}
                  onClick={() => setDecision(option.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setDecision(option.value); } }}
                  sx={{
                    display: 'flex',
                    gap: 1.5,
                    alignItems: 'flex-start',
                    p: 1.5,
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    bgcolor: active ? option.bg : 'white',
                    border: '1.5px solid',
                    borderColor: active ? option.color : 'divider',
                    transition: 'border-color 120ms, background-color 120ms',
                    '&:hover': { borderColor: option.color },
                    '&:focus-visible': { outline: `2px solid ${option.color}`, outlineOffset: 2 },
                  }}
                >
                  <Box sx={{ color: option.color, display: 'flex', mt: 0.25 }}>{option.icon}</Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: active ? option.color : '#1e293b' }}>{option.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{option.description}</Typography>
                  </Box>
                  <Box sx={{ color: active ? option.color : '#cbd5e1', display: 'flex' }}>
                    {active ? <SelectedIcon fontSize="small" /> : <UnselectedIcon fontSize="small" />}
                  </Box>
                </Box>
              );
            })}
          </Stack>
          {touched && !selected ? (
            <Typography variant="caption" sx={{ display: 'block', mt: 0.75, color: '#b91c1c', fontWeight: 600 }}>Choose a decision.</Typography>
          ) : null}
        </Box>

        <Box>
          <Label required>Comments to the researcher</Label>
          <TextField
            fullWidth
            multiline
            minRows={5}
            size="small"
            placeholder="Summarise your assessment: strengths, concerns and anything the researcher should know."
            value={comments}
            onChange={(event) => setComments(event.target.value)}
            error={touched && !commentsOk}
            sx={{ bgcolor: 'white' }}
          />
          <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
            <Typography variant="caption" sx={{ color: touched && !commentsOk ? '#b91c1c' : 'text.secondary', fontWeight: touched && !commentsOk ? 600 : 400 }}>
              At least {MIN_COMMENT_LENGTH} characters.
            </Typography>
            <Typography variant="caption" color="text.secondary">{comments.trim().length}</Typography>
          </Stack>
        </Box>

        {selected?.extraLabel ? (
          <Box>
            <Label required>{selected.extraLabel}</Label>
            <TextField
              fullWidth
              multiline
              minRows={4}
              size="small"
              placeholder={selected.extraPlaceholder}
              value={extra}
              onChange={(event) => setExtra(event.target.value)}
              error={touched && !extraOk}
              helperText={touched && !extraOk ? `${selected.extraLabel} is required.` : ' '}
              sx={{ bgcolor: 'white' }}
            />
          </Box>
        ) : null}

        {selected ? (
          <Alert
            severity={selected.value === 'approved' ? 'success' : selected.value === 'rejected' ? 'error' : 'warning'}
            sx={{ borderRadius: 1.5 }}
          >
            Saving will mark this proposal as <strong>{selected.value === 'approved' ? 'Approved' : selected.value === 'rejected' ? 'Rejected' : 'Revision requested'}</strong>
            {selected.value === 'requires_revision' ? ' and reopen it for editing by the researcher' : ''}. The decision is recorded as {reviewerName || 'Research administrator'}.
          </Alert>
        ) : null}
      </Stack>
    </PanelShell>
  );
}
