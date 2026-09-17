'use client';

import React from 'react';
import { Box, Chip, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ScienceIcon from '@mui/icons-material/Science';
import IntegritySection from './IntegritySection';
import IntegrityDetailField from './IntegrityDetailField';
import IntegrityFilePreview from './IntegrityFilePreview';
import { authorList, PURPLE, tagList } from './integrityDetailUtils';

export default function IntegrityOverviewSection({ record, fileUrl }) {
  const { t } = useTranslation();
  const authors = authorList(record);
  const tags = tagList(record);

  return (
    <IntegritySection
      step={3}
      title={t('researcher.integrity_report_submission_title', 'What you submitted')}
      description={t(
        'researcher.integrity_report_submission_help',
        'The file and details recorded for this check.'
      )}
    >
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        <Box sx={{ flex: { md: '0 0 38%' }, minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block', mb: 1 }}>
            {t('researcher.integrity_col_preview', 'Preview')}
          </Typography>
          <IntegrityFilePreview
            record={record}
            fileUrl={fileUrl}
            downloadLabel={t('common.download', 'Download')}
          />
        </Box>

        <Stack spacing={2.25} sx={{ flex: 1, minWidth: 0 }}>
          <IntegrityDetailField label={t('researcher.integrity_field_title', 'Title')}>
            {record.title}
          </IntegrityDetailField>
          {record.doi ? (
            <IntegrityDetailField label={t('researcher.integrity_field_doi', 'DOI')}>
              {record.doi}
            </IntegrityDetailField>
          ) : null}
          <IntegrityDetailField label={t('researcher.integrity_field_authors', 'Authors')}>
            {authors.length ? authors.join(', ') : '-'}
          </IntegrityDetailField>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
            }}
          >
            <IntegrityDetailField label={t('researcher.integrity_lab_units_label', 'Labs / Units')}>
              {record.labUnit?.name ? (
                <Chip
                  size="small"
                  icon={<ScienceIcon sx={{ fontSize: '16px !important' }} />}
                  label={record.labUnit.name}
                  sx={{
                    fontWeight: 600,
                    bgcolor: 'rgba(139, 108, 188, 0.1)',
                    color: '#6f4fa0',
                    '& .MuiChip-icon': { color: PURPLE },
                  }}
                />
              ) : (
                '-'
              )}
            </IntegrityDetailField>
            <IntegrityDetailField label={t('researcher.integrity_collection_name', 'Collection')}>
              {record.collection?.name ? (
                <Chip
                  size="small"
                  label={record.collection.name}
                  sx={{
                    fontWeight: 600,
                    bgcolor: record.collection.color ? `${record.collection.color}22` : 'rgba(139, 108, 188, 0.1)',
                    color: record.collection.color || '#6f4fa0',
                  }}
                />
              ) : (
                '-'
              )}
            </IntegrityDetailField>
          </Box>
          <IntegrityDetailField label={t('researcher.integrity_compare_short', 'Compared to global repository')}>
            {record.comparedGlobalRepository ? t('common.enabled', 'Yes') : t('common.disabled', 'No')}
          </IntegrityDetailField>
          {(record.pageAmount || record.croppedAmount) ? (
            <IntegrityDetailField label={t('researcher.integrity_processing_stats', 'Extracted from file')}>
              {t('researcher.integrity_pages', 'Pages')}: {record.pageAmount ?? '-'}
              {' - '}
              {t('researcher.integrity_cropped', 'Cropped regions')}: {record.croppedAmount ?? '-'}
            </IntegrityDetailField>
          ) : null}
          {record.description ? (
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block', mb: 0.5 }}>
                {t('researcher.integrity_field_description', 'Description')}
              </Typography>
              <Typography variant="body2" sx={{ color: '#1e293b', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {record.description}
              </Typography>
            </Box>
          ) : null}
          {record.notes ? (
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block', mb: 0.5 }}>
                {t('researcher.integrity_field_notes', 'Notes')}
              </Typography>
              <Typography variant="body2" sx={{ color: '#1e293b', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {record.notes}
              </Typography>
            </Box>
          ) : null}
          {tags.length > 0 ? (
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block', mb: 0.75 }}>
                {t('researcher.integrity_field_tags', 'Tags')}
              </Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                {tags.map((tag) => (
                  <Chip key={tag} size="small" label={tag} sx={{ fontWeight: 600 }} />
                ))}
              </Stack>
            </Box>
          ) : null}
        </Stack>
      </Box>
    </IntegritySection>
  );
}
