'use client';

import React from 'react';
import { Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import EditIcon from '@mui/icons-material/Edit';
import ImageSearchIcon from '@mui/icons-material/ImageSearch';
import FlagIcon from '@mui/icons-material/Flag';
import IntegritySection from './IntegritySection';
import IntegrityStatCards from './IntegrityStatCards';
import { SimilarityLegend } from './IntegrityResultSummary';
import { verdictFor } from './integrityDetailUtils';

export default function IntegrityVerdictSection({ record }) {
  const { t } = useTranslation();
  const inProgress = record.status === 'UPLOADING' || record.status === 'PROCESSING';
  const failed = record.status === 'FAILED';
  const completed = record.status === 'COMPLETED';
  const verdict = completed ? verdictFor(record, t) : null;
  const similarityLevel = record.similarityLevel || {};

  return (
    <IntegritySection
      step={2}
      title={t('researcher.integrity_report_result_title', 'Result')}
      description={
        inProgress
          ? t(
              'researcher.integrity_report_result_pending',
              'Counts and a recommendation appear here when analysis finishes.'
            )
          : failed
            ? t(
                'researcher.integrity_report_result_failed',
                'This check did not finish. Resubmit from section 1 if you want to try again.'
              )
            : t(
                'researcher.integrity_report_result_help',
                'A short recommendation, then the counts behind it. Open the visual report in section 4 to inspect each flag.'
              )
      }
      sx={verdict ? { bgcolor: verdict.bg, borderColor: verdict.border } : undefined}
    >
      {inProgress || failed ? (
        <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.65 }}>
          {failed
            ? t(
                'researcher.integrity_report_result_failed_body',
                'No result is available until a new analysis completes.'
              )
            : t(
                'researcher.integrity_report_result_pending_body',
                'Nothing to review yet. Keep this tab open or come back in a few minutes.'
              )}
        </Typography>
      ) : (
        <Stack spacing={2.25}>
          <Stack direction="row" spacing={1} alignItems="center">
            <FlagIcon sx={{ fontSize: 18, color: verdict.color }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: verdict.color }}>
              {verdict.label}
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ color: '#374151', lineHeight: 1.65 }}>
            {verdict.text}
          </Typography>
          <IntegrityStatCards
            items={[
              {
                icon: <EditIcon />,
                label: t('researcher.integrity_manip_plain_label', 'Possible edits'),
                value: record.manipulationCount ?? 0,
                hint: t('researcher.integrity_manip_hint', 'Regions that may have been altered'),
              },
              {
                icon: <ImageSearchIcon />,
                label: t('researcher.integrity_sim_plain_label', 'Similar images'),
                value: record.similarityCount ?? 0,
                hint: t('researcher.integrity_sim_hint', 'Images that look like they were reused'),
              },
              {
                icon: <FlagIcon />,
                label: t('researcher.integrity_high', 'High confidence'),
                value: similarityLevel.high ?? 0,
                hint: t('researcher.integrity_high_conf_hint', 'Likely the same image'),
              },
              {
                icon: <ImageSearchIcon />,
                label: t('researcher.integrity_medium', 'Medium'),
                value: similarityLevel.medium ?? 0,
                hint: t('researcher.integrity_medium_conf_hint', 'Possible reuse'),
              },
            ]}
          />
          <Stack spacing={0.75}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
              {t('researcher.integrity_legend_title', 'Similarity confidence')}
            </Typography>
            <SimilarityLegend />
          </Stack>
        </Stack>
      )}
    </IntegritySection>
  );
}
