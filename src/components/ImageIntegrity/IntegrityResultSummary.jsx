'use client';

import React from 'react';
import { Stack, Chip, Typography, Box, LinearProgress, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';

const LEVELS = [
  {
    key: 'high',
    label: 'High',
    short: 'H',
    color: '#c62828',
    bg: '#ffebee',
    title: 'High confidence',
    hint: 'ImaChek is quite sure these images are the same (likely reuse). Review before submitting.',
  },
  {
    key: 'medium',
    label: 'Medium',
    short: 'M',
    color: '#ef6c00',
    bg: '#fff3e0',
    title: 'Medium confidence',
    hint: 'Possible reuse. Worth a look in the full report; some matches are false positives.',
  },
  {
    key: 'low',
    label: 'Low',
    short: 'L',
    color: '#2e7d32',
    bg: '#e8f5e9',
    title: 'Low confidence',
    hint: 'Weak match. Often a false positive — still open the report if you want to double-check.',
  },
];

export function SimilarityConfidenceChips({ similarityLevel, compact = false, alwaysShow = false }) {
  const high = similarityLevel?.high ?? 0;
  const medium = similarityLevel?.medium ?? 0;
  const low = similarityLevel?.low ?? 0;
  const counts = { high, medium, low };
  if (!alwaysShow && !high && !medium && !low) return null;

  return (
    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
      {LEVELS.map((level) => (
        <Tooltip
          key={level.key}
          title={
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                {level.title}
              </Typography>
              <Typography variant="caption">{level.hint}</Typography>
            </Box>
          }
        >
          <Chip
            size="small"
            label={compact ? `${level.short} ${counts[level.key]}` : `${level.label} ${counts[level.key]}`}
            sx={{
              height: 22,
              fontWeight: 700,
              fontSize: '0.68rem',
              bgcolor: level.bg,
              color: level.color,
              cursor: 'help',
            }}
          />
        </Tooltip>
      ))}
    </Stack>
  );
}

function verdictFor(caseItem, t) {
  const manip = caseItem.manipulationCount ?? 0;
  const sim = caseItem.similarityCount ?? 0;
  const high = caseItem.similarityLevel?.high ?? 0;

  if (manip > 0 || high > 0) {
    return {
      label: t('researcher.integrity_verdict_review', 'Needs review'),
      color: '#b45309',
      bg: '#fff7ed',
    };
  }
  if (sim > 0) {
    return {
      label: t('researcher.integrity_verdict_matches', 'Possible matches'),
      color: '#1d4ed8',
      bg: '#eff6ff',
    };
  }
  return {
    label: t('researcher.integrity_verdict_clear', 'No issues found'),
    color: '#15803d',
    bg: '#f0fdf4',
  };
}

export function SimilarityLegend() {
  return (
    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
      {LEVELS.map((level) => (
        <Tooltip
          key={level.key}
          title={
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                {level.title}
              </Typography>
              <Typography variant="caption">{level.hint}</Typography>
            </Box>
          }
        >
          <Chip
            size="small"
            label={level.label}
            sx={{
              height: 22,
              fontWeight: 700,
              fontSize: '0.68rem',
              bgcolor: level.bg,
              color: level.color,
              cursor: 'help',
            }}
          />
        </Tooltip>
      ))}
    </Stack>
  );
}

export default function IntegrityResultSummary({ caseItem }) {
  const { t } = useTranslation();

  if (caseItem.status === 'COMPLETED') {
    const manip = caseItem.manipulationCount ?? 0;
    const sim = caseItem.similarityCount ?? 0;
    const verdict = verdictFor(caseItem, t);

    return (
      <Stack spacing={0.6} sx={{ minWidth: 180 }}>
        <Chip
          size="small"
          label={verdict.label}
          sx={{
            alignSelf: 'flex-start',
            height: 22,
            fontWeight: 700,
            fontSize: '0.7rem',
            bgcolor: verdict.bg,
            color: verdict.color,
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
          {t('researcher.integrity_manip_plain', '{{count}} possible edits', { count: manip })}
          {' · '}
          {t('researcher.integrity_sim_plain', '{{count}} similar images', { count: sim })}
        </Typography>
        <SimilarityConfidenceChips similarityLevel={caseItem.similarityLevel} />
      </Stack>
    );
  }

  if (caseItem.status === 'PROCESSING' || caseItem.status === 'UPLOADING') {
    return (
      <Box sx={{ minWidth: 140 }}>
        <LinearProgress
          variant="determinate"
          value={caseItem.analysisProgress || 0}
          sx={{
            height: 6,
            borderRadius: 3,
            mb: 0.5,
            bgcolor: 'rgba(139,108,188,0.15)',
            '& .MuiLinearProgress-bar': { bgcolor: '#8b6cbc' },
          }}
        />
        <Typography variant="caption" color="text.secondary">
          {t('researcher.integrity_analyzing', 'Analyzing')} · {caseItem.analysisProgress || 0}%
        </Typography>
      </Box>
    );
  }

  return (
    <Tooltip title={caseItem.errorMessage || t('researcher.integrity_failed', 'Failed')}>
      <Typography
        variant="caption"
        color="error"
        sx={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          maxWidth: 220,
        }}
      >
        {caseItem.errorMessage || t('researcher.integrity_failed', 'Failed')}
      </Typography>
    </Tooltip>
  );
}
