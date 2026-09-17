'use client';

import React from 'react';
import { Button, CircularProgress, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import IntegritySection from './IntegritySection';
import { PURPLE, verdictFor } from './integrityDetailUtils';

export default function IntegrityFindingsSection({ record, onViewReport, reportLoading }) {
  const { t } = useTranslation();
  const completed = record.status === 'COMPLETED';
  const verdict = completed ? verdictFor(record, t) : null;

  return (
    <IntegritySection
      step={4}
      title={t('researcher.integrity_report_findings_title', 'How to review findings')}
      description={t(
        'researcher.integrity_disclaimer',
        'This check may flag extra matches so that real issues are not missed. Treat each flag as something to inspect, not as a final judgement.'
      )}
    >
      <Typography variant="body2" sx={{ color: '#1e293b', lineHeight: 1.7, mb: 2 }}>
        {completed
          ? verdict.text
          : t(
              'researcher.integrity_report_findings_pending',
              'When analysis finishes, use View Full Report to see the marked regions on the images.'
            )}
      </Typography>
      <Button
        variant="contained"
        disabled={!completed || reportLoading}
        onClick={onViewReport}
        startIcon={reportLoading ? <CircularProgress size={14} color="inherit" /> : <OpenInNewIcon />}
        sx={{ bgcolor: PURPLE, fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: '#7b5cac' } }}
      >
        {t('researcher.integrity_view_report', 'View Full Report')}
      </Button>
    </IntegritySection>
  );
}
