'use client';

import React from 'react';
import { Box, Stack, Typography, alpha } from '@mui/material';
import { useTranslation } from 'react-i18next';
import IntegritySection from './IntegritySection';
import { PURPLE } from './integrityDetailUtils';

export default function IntegrityClassificationSection({ record }) {
  const { t } = useTranslation();
  const classification = record.classification || {};
  const entries = Object.entries(classification);
  const completed = record.status === 'COMPLETED';

  return (
    <IntegritySection
      step={5}
      title={t('researcher.integrity_report_types_title', 'Image types detected')}
      description={t(
        'researcher.integrity_classification_help',
        'How extracted images were grouped (for example microscopy, blot/gel, or chart).'
      )}
    >
      {!completed || entries.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {completed
            ? t('researcher.integrity_no_classification', 'No image-type grouping was returned for this file.')
            : t(
                'researcher.integrity_report_types_pending',
                'Image types will be listed here when analysis finishes.'
              )}
        </Typography>
      ) : (
        <Stack spacing={1}>
          {entries.map(([key, value]) => (
            <Box
              key={key}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 1.25,
                px: 2,
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: alpha(PURPLE, 0.03),
              }}
            >
              <Typography sx={{ textTransform: 'capitalize' }}>{String(key).replace(/_/g, ' ')}</Typography>
              <Typography sx={{ fontWeight: 700 }}>{value}</Typography>
            </Box>
          ))}
        </Stack>
      )}
    </IntegritySection>
  );
}
