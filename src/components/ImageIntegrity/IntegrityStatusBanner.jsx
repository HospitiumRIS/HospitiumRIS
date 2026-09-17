'use client';

import React from 'react';
import { Alert, Box, Button, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ScienceIcon from '@mui/icons-material/Science';
import IntegritySection from './IntegritySection';
import IntegrityDetailField from './IntegrityDetailField';
import { formatBytes, formatDateTime, PURPLE, reportIsValid, statusConfigFor } from './integrityDetailUtils';

export default function IntegrityStatusBanner({ record, onResubmit, resubmitting }) {
  const { t } = useTranslation();
  const statusConfig = statusConfigFor(t, record.status);
  const reportStillValid = reportIsValid(record);
  const inProgress = record.status === 'UPLOADING' || record.status === 'PROCESSING';

  return (
    <IntegritySection
      step={1}
      title={t('researcher.integrity_report_status_title', 'Check status')}
      description={t(
        'researcher.integrity_report_status_help',
        'Whether this analysis is still running, finished, or failed.'
      )}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'auto 1.4fr 1.3fr 1fr 1fr' },
          gap: 2.5,
          alignItems: 'start',
        }}
      >
        <IntegrityDetailField label={t('researcher.integrity_col_status', 'Status')}>
          <Chip
            size="small"
            label={statusConfig.label}
            sx={{
              bgcolor: statusConfig.bgColor,
              color: statusConfig.color,
              fontWeight: 700,
              height: 24,
            }}
          />
        </IntegrityDetailField>
        <IntegrityDetailField label={t('researcher.integrity_col_file', 'File')}>
          {record.fileName}
          {record.fileSizeBytes ? ` - ${formatBytes(record.fileSizeBytes)}` : ''}
        </IntegrityDetailField>
        <IntegrityDetailField label={t('researcher.integrity_field_submitted_by', 'Submitted by')}>
          {record.contributor || '-'}
        </IntegrityDetailField>
        <IntegrityDetailField label={t('researcher.integrity_col_submitted', 'Submitted')}>
          {formatDateTime(record.createdAt)}
        </IntegrityDetailField>
        <IntegrityDetailField label={t('researcher.integrity_col_results_at', 'Results ready')}>
          {record.status === 'COMPLETED' ? formatDateTime(record.analysisCompletedAt || record.updatedAt) : t('researcher.integrity_report_pending', 'Pending')}
        </IntegrityDetailField>
      </Box>

      {(record.labUnit?.name || record.collection?.name) && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
          {record.labUnit?.name ? (
            <Chip
              size="small"
              icon={<ScienceIcon sx={{ fontSize: '16px !important' }} />}
              label={`${t('researcher.integrity_lab_units_label', 'Labs / Units')}: ${record.labUnit.name}`}
              sx={{
                fontWeight: 600,
                bgcolor: 'rgba(139, 108, 188, 0.1)',
                color: '#6f4fa0',
                '& .MuiChip-icon': { color: PURPLE },
              }}
            />
          ) : null}
          {record.collection?.name ? (
            <Chip
              size="small"
              label={`${t('researcher.integrity_collection_name', 'Collection')}: ${record.collection.name}`}
              sx={{
                fontWeight: 600,
                bgcolor: record.collection.color ? `${record.collection.color}22` : 'rgba(139, 108, 188, 0.1)',
                color: record.collection.color || '#6f4fa0',
              }}
            />
          ) : null}
        </Stack>
      )}

      {inProgress && (
        <Box sx={{ mt: 2.5 }}>
          <LinearProgress
            variant="determinate"
            value={record.analysisProgress || 0}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: 'rgba(139,108,188,0.12)',
              '& .MuiLinearProgress-bar': { bgcolor: PURPLE, borderRadius: 4 },
            }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {t(
              'researcher.integrity_report_analyzing_help',
              'ImaChek is still checking this file. This page updates on its own. You can refresh if you want the latest progress.'
            )}{' '}
            {record.analysisProgress || 0}%
          </Typography>
        </Box>
      )}

      {record.status === 'FAILED' && (
        <Alert
          severity="error"
          sx={{ mt: 2.5, borderRadius: 2 }}
          action={
            onResubmit ? (
              <Button color="inherit" size="small" onClick={onResubmit} disabled={resubmitting}>
                {t('researcher.integrity_resubmit', 'Resubmit')}
              </Button>
            ) : null
          }
        >
          {record.errorMessage || t('researcher.integrity_failed', 'Analysis failed.')}
        </Alert>
      )}

      {record.reportUrl && (
        <Alert severity={reportStillValid ? 'info' : 'warning'} sx={{ mt: 2.5, borderRadius: 2 }}>
          {reportStillValid
            ? t(
                'researcher.integrity_report_ttl',
                'The visual report link lasts 5 minutes. Generate it again if you need another look.'
              )
            : t(
                'researcher.integrity_report_expired',
                'The previous report link has expired. Click View Full Report to open a new one.'
              )}
        </Alert>
      )}
    </IntegritySection>
  );
}
