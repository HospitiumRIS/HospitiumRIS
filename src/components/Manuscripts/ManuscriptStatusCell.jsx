'use client';

import { Box, Tooltip, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { MANUSCRIPT_STAGES, getStageTranslationKey } from '../../lib/manuscript-workflow';

// The linear part of the lifecycle; ARCHIVED is an end state shown without a bar
const PIPELINE = ['DRAFT', 'IN_REVIEW', 'UNDER_REVISION', 'PUBLISHED'];

const STAGE_HINTS = {
  DRAFT: { key: 'manuscript_workflow.hint_draft', fallback: 'Not yet submitted' },
  IN_REVIEW: { key: 'manuscript_workflow.hint_in_review', fallback: 'With reviewers' },
  UNDER_REVISION: { key: 'manuscript_workflow.hint_under_revision', fallback: 'Changes requested' },
  PUBLISHED: { key: 'manuscript_workflow.hint_published', fallback: 'Complete' },
  ARCHIVED: { key: 'manuscript_workflow.hint_archived', fallback: 'No longer active' },
};

/**
 * Status cell for manuscript tables: a soft status pill, a thin progress bar
 * across the four pipeline stages, and a one-line caption.
 */
export default function ManuscriptStatusCell({ status, type }) {
  const { t } = useTranslation();
  const cfg = MANUSCRIPT_STAGES[status] || MANUSCRIPT_STAGES.DRAFT;
  const stepIndex = PIPELINE.indexOf(status);
  const isArchived = status === 'ARCHIVED';
  const hint = STAGE_HINTS[status] || STAGE_HINTS.DRAFT;
  const label = t(getStageTranslationKey(status), { defaultValue: cfg.label });

  const caption = isArchived || status === 'PUBLISHED'
    ? t(hint.key, { defaultValue: hint.fallback })
    : `${t('manuscript_workflow.step_of', {
        defaultValue: 'Step {{step}} of {{total}}',
        step: stepIndex + 1,
        total: PIPELINE.length,
      })} · ${t(hint.key, { defaultValue: hint.fallback })}`;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, minWidth: 170 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Box
          component="span"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            pl: 1,
            pr: 1.25,
            py: 0.375,
            borderRadius: 999,
            bgcolor: cfg.bg,
            color: cfg.text,
            fontSize: '0.75rem',
            fontWeight: 600,
            lineHeight: 1.4,
            whiteSpace: 'nowrap',
          }}
        >
          <Box component="span" sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: cfg.color, flexShrink: 0 }} />
          {label}
        </Box>
        {type && (
          <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '0.72rem' }}>
            {type}
          </Typography>
        )}
      </Box>

      {!isArchived && (
        <Box sx={{ display: 'flex', gap: '3px', maxWidth: 150 }} aria-hidden="true">
          {PIPELINE.map((stage, i) => (
            <Tooltip key={stage} title={t(getStageTranslationKey(stage), { defaultValue: MANUSCRIPT_STAGES[stage].label })}>
              <Box
                sx={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  bgcolor: i <= stepIndex ? cfg.color : '#e5e7eb',
                }}
              />
            </Tooltip>
          ))}
        </Box>
      )}

      <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.72rem', lineHeight: 1.3 }}>
        {caption}
      </Typography>
    </Box>
  );
}
