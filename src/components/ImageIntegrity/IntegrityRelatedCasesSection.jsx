'use client';

import React from 'react';
import { Link as MuiLink, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import IntegritySection from './IntegritySection';
import { PURPLE } from './integrityDetailUtils';

export default function IntegrityRelatedCasesSection({ relatedCases = [], currentId, onOpen }) {
  const { t } = useTranslation();
  const others = relatedCases.filter((related) => related.id !== currentId);
  if (others.length === 0) return null;

  return (
    <IntegritySection
      step={6}
      title={t('researcher.integrity_compared_cases', 'Also compared with')}
      description={t(
        'researcher.integrity_report_compared_help',
        'Other submissions included in the same cross-check.'
      )}
    >
      <Stack spacing={0.75}>
        {others.map((related) => (
          <MuiLink
            key={related.id}
            component="button"
            type="button"
            underline="hover"
            onClick={() => onOpen(related.id)}
            sx={{ textAlign: 'left', color: PURPLE, fontWeight: 600, fontSize: '0.875rem' }}
          >
            {related.title}
          </MuiLink>
        ))}
      </Stack>
    </IntegritySection>
  );
}
