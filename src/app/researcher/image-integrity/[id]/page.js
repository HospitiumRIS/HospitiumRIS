'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Container,
  Paper,
  Typography,
  Chip,
  Button,
  CircularProgress,
  LinearProgress,
  Alert,
  Stack,
  Tabs,
  Tab,
  Link as MuiLink,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  ImageSearch as ImageIntegrityIcon,
  PictureAsPdf as PdfIcon,
  FolderZip as ZipIcon,
  InsertDriveFile as FileIcon,
  BrokenImage as BrokenImageIcon,
} from '@mui/icons-material';
import PageHeader from '../../../../components/common/PageHeader';
import { useTranslation } from 'react-i18next';
import { SimilarityLegend } from '../../../../components/ImageIntegrity/IntegrityResultSummary';

const STATUS_CONFIG = {
  UPLOADING: { label: 'Uploading', color: '#2196f3', bgColor: '#e3f2fd' },
  PROCESSING: { label: 'Analyzing', color: '#ff9800', bgColor: '#fff3e0' },
  COMPLETED: { label: 'Completed', color: '#4caf50', bgColor: '#e8f5e9' },
  FAILED: { label: 'Failed', color: '#f44336', bgColor: '#ffebee' },
};

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg'];
const PURPLE = '#8b6cbc';

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileTypeIcon({ extension, sx }) {
  if (extension === 'pdf') return <PdfIcon sx={sx} />;
  if (extension === 'zip') return <ZipIcon sx={sx} />;
  return <FileIcon sx={sx} />;
}

function Field({ label, children }) {
  const content = children == null || children === '' ? '—' : children;
  const isText = typeof content === 'string' || typeof content === 'number';
  return (
    <Box>
      <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600, display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      {isText ? (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#2D3748', wordBreak: 'break-word' }}>
          {content}
        </Typography>
      ) : (
        content
      )}
    </Box>
  );
}

function Metric({ label, value, hint }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 1, minWidth: 140 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 700, color: '#2D3748', lineHeight: 1.2, my: 0.5 }}>
        {value}
      </Typography>
      {hint && (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      )}
    </Paper>
  );
}

function PreviewBlock({ record, t }) {
  const [broken, setBroken] = useState(false);
  const extension = (record.fileFormat || '').toLowerCase();
  const isImage = IMAGE_EXTENSIONS.includes(extension);
  const previewUrl = `/api/researcher/image-integrity/${record.id}/file`;

  return (
    <Box
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'grey.50',
        minHeight: 220,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        p: 2,
      }}
    >
      {isImage && !broken ? (
        <Box
          component="img"
          src={previewUrl}
          alt={record.fileName}
          onError={() => setBroken(true)}
          sx={{ maxWidth: '100%', maxHeight: 280, objectFit: 'contain' }}
        />
      ) : (
        <Stack alignItems="center" spacing={1}>
          {broken ? (
            <BrokenImageIcon sx={{ fontSize: 36, color: '#a0aec0' }} />
          ) : (
            <FileTypeIcon extension={extension} sx={{ fontSize: 36, color: PURPLE }} />
          )}
          <Typography variant="body2" color="text.secondary">
            {record.fileName}
          </Typography>
          {!isImage && (
            <Button
              size="small"
              href={`${previewUrl}?download=1`}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: PURPLE, textTransform: 'none', fontWeight: 600 }}
            >
              {t('common.download', 'Download')}
            </Button>
          )}
        </Stack>
      )}
    </Box>
  );
}

function verdictFor(record, t) {
  const manip = record.manipulationCount ?? 0;
  const sim = record.similarityCount ?? 0;
  const high = record.similarityLevel?.high ?? 0;
  if (manip > 0 || high > 0) {
    return {
      label: t('researcher.integrity_verdict_review', 'Needs review'),
      text: t(
        'researcher.integrity_review_needed',
        'Open the full report and inspect each flagged region before you submit this work.'
      ),
      color: '#b45309',
      bg: '#fff7ed',
      border: '#fdba74',
    };
  }
  if (sim > 0) {
    return {
      label: t('researcher.integrity_verdict_matches', 'Possible matches'),
      text: t(
        'researcher.integrity_possible_matches_help',
        'ImaChek found similar images at lower confidence. These are often false positives — check the report if you want to be sure.'
      ),
      color: '#1d4ed8',
      bg: '#eff6ff',
      border: '#93c5fd',
    };
  }
  return {
    label: t('researcher.integrity_verdict_clear', 'No issues found'),
    text: t('researcher.integrity_no_issues', 'No high-confidence issues were detected.'),
    color: '#15803d',
    bg: '#f0fdf4',
    border: '#86efac',
  };
}

export default function ResearcherImageIntegrityDetailPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [record, setRecord] = useState(null);
  const [relatedCases, setRelatedCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const pollRef = useRef(null);

  const fetchDetail = useCallback(async (force = false) => {
    try {
      const res = await fetch(`/api/researcher/image-integrity/${id}${force ? '?refresh=1' : ''}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to load submission.');
        return;
      }
      setRecord(data.case);
      setRelatedCases(data.relatedCases || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load submission.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchDetail();
  }, [id, fetchDetail]);

  useEffect(() => {
    if (record && (record.status === 'UPLOADING' || record.status === 'PROCESSING')) {
      pollRef.current = setInterval(fetchDetail, 8000);
    }
    return () => clearInterval(pollRef.current);
  }, [record, fetchDetail]);

  const handleGenerateReport = async () => {
    setReportLoading(true);
    try {
      const res = await fetch(`/api/researcher/image-integrity/${id}/report`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to generate report.');
        return;
      }
      setRecord(data.case);
      if (data.case?.reportUrl) {
        window.open(data.case.reportUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to generate report.');
    } finally {
      setReportLoading(false);
    }
  };

  const handleResubmit = async () => {
    if (!window.confirm(t('researcher.integrity_resubmit_confirm', 'Resubmit this failed check to ImaChek?'))) {
      return;
    }
    setResubmitting(true);
    try {
      const res = await fetch(`/api/researcher/image-integrity/${id}/resubmit`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok && res.status !== 202) {
        alert(data.error || t('researcher.integrity_resubmit_failed', 'Resubmission failed.'));
        return;
      }
      if (data.case) setRecord(data.case);
      else fetchDetail();
    } catch (err) {
      console.error(err);
      alert(t('researcher.integrity_resubmit_failed', 'Resubmission failed.'));
    } finally {
      setResubmitting(false);
    }
  };

  const header = (title) => (
    <PageHeader
      title={title}
      description={t('researcher.integrity_detail_subtitle', 'What ImaChek found in this file')}
      icon={<ImageIntegrityIcon sx={{ fontSize: 32 }} />}
      breadcrumbs={[
        { label: t('researcher.portal_title', 'Researcher Portal'), path: '/researcher' },
        { label: t('researcher.image_integrity', 'Image Integrity'), path: '/researcher/image-integrity' },
        ...(record?.title ? [{ label: record.title }] : []),
      ]}
    />
  );

  if (loading) {
    return (
      <Box>
        {header(t('researcher.image_integrity', 'Image Integrity'))}
        <Container maxWidth="lg" sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress sx={{ color: PURPLE }} />
        </Container>
      </Box>
    );
  }

  if (error || !record) {
    return (
      <Box>
        {header(t('researcher.image_integrity', 'Image Integrity'))}
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error">{error || 'Submission not found.'}</Alert>
          <Button onClick={() => router.push('/researcher/image-integrity')} sx={{ mt: 2, color: PURPLE, textTransform: 'none' }}>
            {t('researcher.integrity_back_to_list', 'Back to My Submissions')}
          </Button>
        </Container>
      </Box>
    );
  }

  const statusConfig = STATUS_CONFIG[record.status] || STATUS_CONFIG.UPLOADING;
  const classification = record.classification || {};
  const similarityLevel = record.similarityLevel || {};
  const authors = Array.isArray(record.authors) ? record.authors.filter(Boolean) : [];
  const reportStillValid =
    record.reportUrl && record.reportExpiresAt && new Date(record.reportExpiresAt) > new Date();
  const verdict = verdictFor(record, t);
  const otherRelated = relatedCases.filter((related) => related.id !== record.id);

  return (
    <Box>
      <PageHeader
        title={record.title}
        description={t('researcher.integrity_detail_subtitle', 'What ImaChek found in this file')}
        icon={<ImageIntegrityIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: t('researcher.portal_title', 'Researcher Portal'), path: '/researcher' },
          { label: t('researcher.image_integrity', 'Image Integrity'), path: '/researcher/image-integrity' },
          { label: record.title },
        ]}
        actionButton={
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              onClick={() => fetchDetail(true)}
              sx={{
                bgcolor: 'rgba(255,255,255,0.18)',
                color: 'white',
                fontWeight: 700,
                textTransform: 'none',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' },
              }}
            >
              {t('common.refresh', 'Refresh')}
            </Button>
            {record.status === 'FAILED' && (
              <Button
                variant="contained"
                disabled={resubmitting}
                onClick={handleResubmit}
                sx={{ bgcolor: 'white', color: PURPLE, fontWeight: 700, textTransform: 'none' }}
              >
                {resubmitting ? <CircularProgress size={16} /> : t('researcher.integrity_resubmit', 'Resubmit')}
              </Button>
            )}
            <Button
              variant="contained"
              disabled={record.status !== 'COMPLETED' || reportLoading}
              onClick={handleGenerateReport}
              sx={{ bgcolor: 'white', color: PURPLE, fontWeight: 700, textTransform: 'none' }}
            >
              {reportLoading ? (
                <CircularProgress size={16} />
              ) : (
                t('researcher.integrity_view_report', 'View Full Report')
              )}
            </Button>
          </Stack>
        }
      />

      <Container maxWidth="lg" sx={{ mt: 3, mb: 5 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => router.push('/researcher/image-integrity')}
          sx={{ mb: 2, color: PURPLE, textTransform: 'none', fontWeight: 600, px: 0 }}
        >
          {t('researcher.integrity_back_to_list', 'Back to My Submissions')}
        </Button>

        <Paper sx={{ p: 2.5, mb: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'auto 1.4fr 1.4fr 1fr 1fr' },
              gap: 2.5,
              alignItems: 'start',
            }}
          >
            <Field label={t('researcher.integrity_col_status', 'Status')}>
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
            </Field>
            <Field label={t('researcher.integrity_col_file', 'File')}>
              {record.fileName}
              {record.fileSizeBytes ? ` · ${formatBytes(record.fileSizeBytes)}` : ''}
            </Field>
            <Field label={t('researcher.integrity_field_submitted_by', 'Submitted by')}>
              {record.contributor || '—'}
            </Field>
            <Field label={t('researcher.integrity_col_submitted', 'Submitted')}>
              {formatDateTime(record.createdAt)}
            </Field>
            <Field label={t('researcher.integrity_col_results_at', 'Results')}>
              {record.status === 'COMPLETED'
                ? formatDateTime(record.analysisCompletedAt || record.updatedAt)
                : '—'}
            </Field>
          </Box>

          {(record.status === 'UPLOADING' || record.status === 'PROCESSING') && (
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
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
                {t('researcher.integrity_analyzing', 'Analyzing')} · {record.analysisProgress || 0}%
              </Typography>
            </Box>
          )}

          {record.status === 'FAILED' && (
            <Alert
              severity="error"
              sx={{ mt: 2.5 }}
              action={
                <Button color="inherit" size="small" onClick={handleResubmit} disabled={resubmitting}>
                  {t('researcher.integrity_resubmit', 'Resubmit')}
                </Button>
              }
            >
              {record.errorMessage || t('researcher.integrity_failed', 'Analysis failed.')}
            </Alert>
          )}

          {record.reportUrl && (
            <Alert severity={reportStillValid ? 'info' : 'warning'} sx={{ mt: 2.5 }}>
              {reportStillValid
                ? t(
                    'researcher.integrity_report_ttl',
                    'The visual report link lasts 5 minutes. Generate it again if you need another look.'
                  )
                : t(
                    'researcher.integrity_report_expired',
                    'The previous report link has expired. Click “View Full Report” to open a new one.'
                  )}
            </Alert>
          )}
        </Paper>

        {record.status === 'COMPLETED' && (
          <Stack spacing={1.5} sx={{ mb: 2.5 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: verdict.bg,
                borderColor: verdict.border,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: verdict.color }}>
                {verdict.label}
              </Typography>
              <Typography variant="body2" sx={{ color: '#374151', mt: 0.5, lineHeight: 1.6 }}>
                {verdict.text}
              </Typography>
            </Paper>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Metric
                label={t('researcher.integrity_manip_plain_label', 'Possible edits')}
                value={record.manipulationCount ?? 0}
                hint={t('researcher.integrity_manip_hint', 'Regions that may have been altered')}
              />
              <Metric
                label={t('researcher.integrity_sim_plain_label', 'Similar images')}
                value={record.similarityCount ?? 0}
                hint={t('researcher.integrity_sim_hint', 'Images that look like they were reused')}
              />
            </Stack>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>
                {t('researcher.integrity_legend_title', 'Similarity confidence')}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 1.25 }}>
                {[
                  { label: t('researcher.integrity_high', 'High'), value: similarityLevel.high ?? 0, hint: 'Likely the same image' },
                  { label: t('researcher.integrity_medium', 'Medium'), value: similarityLevel.medium ?? 0, hint: 'Possible reuse' },
                  { label: t('researcher.integrity_low', 'Low'), value: similarityLevel.low ?? 0, hint: 'Weak match, often a false positive' },
                ].map((item) => (
                  <Box key={item.label} sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {item.label}: {item.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.hint}
                    </Typography>
                  </Box>
                ))}
              </Stack>
              <SimilarityLegend />
            </Paper>
          </Stack>
        )}

        <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{
              borderBottom: '1px solid',
              borderColor: 'divider',
              minHeight: 48,
              '& .MuiTab-root': {
                minHeight: 48,
                textTransform: 'none',
                fontWeight: 600,
                color: '#718096',
                '&.Mui-selected': { color: PURPLE },
              },
              '& .MuiTabs-indicator': { backgroundColor: PURPLE, height: 2 },
            }}
          >
            <Tab label={t('common.overview', 'Overview')} />
            <Tab label={t('researcher.integrity_findings', 'Findings')} disabled={record.status !== 'COMPLETED'} />
            <Tab
              label={t('researcher.integrity_classification', 'Classification')}
              disabled={record.status !== 'COMPLETED'}
            />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {activeTab === 0 && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  gap: 3,
                }}
              >
                <Box sx={{ flex: { md: '0 0 38%' }, minWidth: 0 }}>
                  <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600, display: 'block', mb: 1 }}>
                    {t('researcher.integrity_col_preview', 'Preview')}
                  </Typography>
                  <PreviewBlock record={record} t={t} />
                </Box>
                <Stack spacing={2} sx={{ flex: 1, minWidth: 0 }}>
                  <Field label={t('researcher.integrity_field_title', 'Title')}>{record.title}</Field>
                  {record.doi && <Field label={t('researcher.integrity_field_doi', 'DOI')}>{record.doi}</Field>}
                  <Field label={t('researcher.integrity_field_authors', 'Authors')}>
                    {authors.length ? authors.join(', ') : '—'}
                  </Field>
                  <Field label={t('researcher.integrity_compare_short', 'Compared to global repository')}>
                    {record.comparedGlobalRepository
                      ? t('common.enabled', 'Yes')
                      : t('common.disabled', 'No')}
                  </Field>
                  {(record.pageAmount || record.croppedAmount) && (
                    <Field label={t('researcher.integrity_processing_stats', 'Extracted from file')}>
                      {t('researcher.integrity_pages', 'Pages')}: {record.pageAmount ?? '—'}
                      {' · '}
                      {t('researcher.integrity_cropped', 'Cropped regions')}: {record.croppedAmount ?? '—'}
                    </Field>
                  )}
                  {otherRelated.length > 0 && (
                    <Box>
                      <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600, display: 'block', mb: 0.5 }}>
                        {t('researcher.integrity_compared_cases', 'Also compared with')}
                      </Typography>
                      <Stack spacing={0.5}>
                        {otherRelated.map((related) => (
                          <MuiLink
                            key={related.id}
                            component="button"
                            type="button"
                            underline="hover"
                            onClick={() => router.push(`/researcher/image-integrity/${related.id}`)}
                            sx={{ textAlign: 'left', color: PURPLE, fontWeight: 600, fontSize: '0.875rem' }}
                          >
                            {related.title}
                          </MuiLink>
                        ))}
                      </Stack>
                    </Box>
                  )}
                  {record.description && (
                    <Box>
                      <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600, display: 'block', mb: 0.5 }}>
                        {t('researcher.integrity_field_description', 'Description')}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#2D3748', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                        {record.description}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Box>
            )}

            {activeTab === 1 && record.status === 'COMPLETED' && (
              <Stack spacing={2}>
                <Typography variant="body1" sx={{ color: '#2D3748', lineHeight: 1.7 }}>
                  {verdict.text}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {t(
                    'researcher.integrity_disclaimer',
                    'ImaChek prefers to over-flag rather than miss a problem. Treat every finding as something to inspect in the visual report, not as a final judgement.'
                  )}
                </Typography>
                <Box>
                  <Button
                    variant="contained"
                    disabled={reportLoading}
                    onClick={handleGenerateReport}
                    sx={{
                      bgcolor: PURPLE,
                      fontWeight: 700,
                      textTransform: 'none',
                      '&:hover': { bgcolor: '#7b5cac' },
                    }}
                  >
                    {t('researcher.integrity_view_report', 'View Full Report')}
                  </Button>
                </Box>
              </Stack>
            )}

            {activeTab === 2 && record.status === 'COMPLETED' && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t(
                    'researcher.integrity_classification_help',
                    'How ImaChek grouped the images it extracted from this file.'
                  )}
                </Typography>
                {Object.keys(classification).length === 0 ? (
                  <Typography color="text.secondary">
                    {t('researcher.integrity_no_classification', 'No classification data available.')}
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {Object.entries(classification).map(([key, value]) => (
                      <Box
                        key={key}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          py: 1.25,
                          px: 2,
                          borderRadius: 1.5,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Typography sx={{ textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</Typography>
                        <Typography sx={{ fontWeight: 700 }}>{value}</Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
