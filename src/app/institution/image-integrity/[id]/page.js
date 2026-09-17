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
  Link as MuiLink,
  Snackbar,
  alpha,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  ImageSearch as ImageIntegrityIcon,
  PictureAsPdf as PdfIcon,
  FolderZip as ZipIcon,
  InsertDriveFile as FileIcon,
  BrokenImage as BrokenImageIcon,
  Edit as EditIcon,
  ImageSearch as SimilarIcon,
  Flag as FlagIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import PageHeader from '../../../../components/common/PageHeader';
import { useTranslation } from 'react-i18next';
import { SimilarityLegend } from '../../../../components/ImageIntegrity/IntegrityResultSummary';
import IntegrityStatCards from '../../../../components/ImageIntegrity/IntegrityStatCards';
import IntegrityDetailError from '../../../../components/ImageIntegrity/IntegrityDetailError';

function statusConfigFor(t, status) {
  const configs = {
    UPLOADING: {
      label: t('researcher.integrity_status_uploading', 'Uploading'),
      color: '#2196f3',
      bgColor: '#e3f2fd',
    },
    PROCESSING: {
      label: t('researcher.integrity_analyzing', 'Analyzing'),
      color: '#ff9800',
      bgColor: '#fff3e0',
    },
    COMPLETED: {
      label: t('researcher.integrity_status_completed', 'Completed'),
      color: '#4caf50',
      bgColor: '#e8f5e9',
    },
    FAILED: {
      label: t('researcher.integrity_status_failed', 'Failed'),
      color: '#f44336',
      bgColor: '#ffebee',
    },
  };
  return configs[status] || configs.UPLOADING;
}

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

function personName(person) {
  if (!person) return '';
  return `${person.givenName || ''} ${person.familyName || ''}`.trim();
}

function Field({ label, children }) {
  const content = children == null || children === '' ? '—' : children;
  const isText = typeof content === 'string' || typeof content === 'number';
  return (
    <Box>
      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      {isText ? (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', wordBreak: 'break-word' }}>
          {content}
        </Typography>
      ) : (
        content
      )}
    </Box>
  );
}

function PreviewBlock({ record, t }) {
  const [broken, setBroken] = useState(false);
  const extension = (record.fileFormat || '').toLowerCase();
  const isImage = IMAGE_EXTENSIONS.includes(extension);
  const previewUrl = `/api/institution/image-integrity/${record.id}/file`;

  return (
    <Box
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: alpha(PURPLE, 0.04),
        minHeight: 240,
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
          sx={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain' }}
        />
      ) : (
        <Stack alignItems="center" spacing={1}>
          {broken ? (
            <BrokenImageIcon sx={{ fontSize: 36, color: '#94a3b8' }} />
          ) : (
            <FileTypeIcon extension={extension} sx={{ fontSize: 36, color: PURPLE }} />
          )}
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
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
        'institution_nav.integrity_review_needed',
        'Open the full report and inspect each flagged region with the submitting researcher.'
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
        'Similar images were found at lower confidence. These are often false positives — check the report if you want to be sure.'
      ),
      color: PURPLE,
      bg: alpha(PURPLE, 0.08),
      border: alpha(PURPLE, 0.28),
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

export default function InstitutionImageIntegrityDetailPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [record, setRecord] = useState(null);
  const [relatedCases, setRelatedCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
  const pollRef = useRef(null);

  const fetchDetail = useCallback(async (force = false) => {
    try {
      const res = await fetch(`/api/institution/image-integrity/${id}${force ? '?refresh=1' : ''}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError({ status: res.status, message: data.error || 'Failed to load submission.' });
        return;
      }
      setError(null);
      setRecord(data.case);
      setRelatedCases(data.relatedCases || []);
    } catch (err) {
      console.error(err);
      setError({ status: 500, message: 'Failed to load submission.' });
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
      const res = await fetch(`/api/institution/image-integrity/${id}/report`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSnackbar({ open: true, message: data.error || 'Failed to generate report.', severity: 'error' });
        return;
      }
      setRecord(data.case);
      if (data.case?.reportUrl) {
        window.open(data.case.reportUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: 'Failed to generate report.', severity: 'error' });
    } finally {
      setReportLoading(false);
    }
  };

  const header = (title) => (
    <PageHeader
      title={title}
      description={t(
        'institution_nav.integrity_detail_subtitle',
        'Review what this integrity check found in the researcher’s submission'
      )}
      icon={<ImageIntegrityIcon sx={{ fontSize: 32 }} />}
      breadcrumbs={[
        { label: t('institution.portal_title', 'Institution Portal'), path: '/institution' },
        { label: t('institution.image_integrity', 'Image Integrity'), path: '/institution/image-integrity' },
      ]}
    />
  );

  if (loading) {
    return (
      <Box>
        {header(t('institution.image_integrity', 'Image Integrity'))}
        <Container maxWidth="lg" sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress sx={{ color: PURPLE }} />
        </Container>
      </Box>
    );
  }

  if (error || !record) {
    return (
      <Box>
        {header(t('institution.image_integrity', 'Image Integrity'))}
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <IntegrityDetailError
            status={error?.status || 404}
            message={error?.message}
            onBack={() => router.push('/institution/image-integrity')}
            onRetry={() => {
              setLoading(true);
              fetchDetail(true);
            }}
          />
        </Container>
      </Box>
    );
  }

  const statusConfig = statusConfigFor(t, record.status);
  const classification = record.classification || {};
  const similarityLevel = record.similarityLevel || {};
  const authors = Array.isArray(record.authors) ? record.authors.filter(Boolean) : [];
  const reportStillValid =
    record.reportUrl && record.reportExpiresAt && new Date(record.reportExpiresAt) > new Date();
  const verdict = verdictFor(record, t);
  const otherRelated = relatedCases.filter((related) => related.id !== record.id);
  const submitterName = personName(record.submittedBy) || record.contributor || '—';

  return (
    <Box>
      <PageHeader
        title={record.title}
        description={t(
          'institution_nav.integrity_detail_subtitle',
          'Review what this integrity check found in the researcher’s submission'
        )}
        icon={<ImageIntegrityIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: t('institution.portal_title', 'Institution Portal'), path: '/institution' },
          { label: t('institution.image_integrity', 'Image Integrity'), path: '/institution/image-integrity' },
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
            <Button
              variant="contained"
              disabled={record.status !== 'COMPLETED' || reportLoading}
              onClick={handleGenerateReport}
              startIcon={reportLoading ? <CircularProgress size={14} color="inherit" /> : <OpenInNewIcon />}
              sx={{ bgcolor: 'white', color: PURPLE, fontWeight: 700, textTransform: 'none' }}
            >
              {t('researcher.integrity_view_report', 'View Full Report')}
            </Button>
          </Stack>
        }
      />

      <Container maxWidth="lg" sx={{ mt: 3, mb: 5 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => router.push('/institution/image-integrity')}
          sx={{ mb: 2.5, color: PURPLE, textTransform: 'none', fontWeight: 600, px: 0 }}
        >
          {t('institution_nav.integrity_back_to_list', 'Back to Submission Reports')}
        </Button>

        <Paper elevation={0} sx={{ p: 2.5, mb: 2.5, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'auto 1.3fr 1.5fr 1fr 1fr' },
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
            <Field label={t('institution_nav.integrity_submitted_by', 'Submitted by')}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                {submitterName}
              </Typography>
              {record.submittedBy?.email && (
                <Typography variant="caption" color="text.secondary">
                  {record.submittedBy.email}
                </Typography>
              )}
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
                  bgcolor: alpha(PURPLE, 0.12),
                  '& .MuiLinearProgress-bar': { bgcolor: PURPLE, borderRadius: 4 },
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
                {t('researcher.integrity_analyzing', 'Analyzing')} · {record.analysisProgress || 0}%
              </Typography>
            </Box>
          )}

          {record.status === 'FAILED' && (
            <Alert severity="error" sx={{ mt: 2.5, borderRadius: 2 }}>
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
                    'The previous report link has expired. Click “View Full Report” to open a new one.'
                  )}
            </Alert>
          )}
        </Paper>

        {record.status === 'COMPLETED' && (
          <Stack spacing={2.5} sx={{ mb: 2.5 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2.25,
                borderRadius: 2.5,
                bgcolor: verdict.bg,
                border: '1px solid',
                borderColor: verdict.border,
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                <FlagIcon sx={{ fontSize: 18, color: verdict.color }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: verdict.color }}>
                  {verdict.label}
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: '#374151', lineHeight: 1.65 }}>
                {verdict.text}
              </Typography>
            </Paper>

            <IntegrityStatCards
              items={[
                {
                  icon: <EditIcon />,
                  label: t('researcher.integrity_manip_plain_label', 'Possible edits'),
                  value: record.manipulationCount ?? 0,
                  hint: t('researcher.integrity_manip_hint', 'Regions that may have been altered'),
                },
                {
                  icon: <SimilarIcon />,
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
                  icon: <SimilarIcon />,
                  label: t('researcher.integrity_medium', 'Medium'),
                  value: similarityLevel.medium ?? 0,
                  hint: t('researcher.integrity_medium_conf_hint', 'Possible reuse'),
                },
              ]}
            />

            <Paper elevation={0} sx={{ p: 2.25, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', display: 'block', mb: 1 }}>
                {t('researcher.integrity_legend_title', 'Similarity confidence')}
              </Typography>
              <SimilarityLegend />
            </Paper>
          </Stack>
        )}

        <Paper elevation={0} sx={{ p: 2.5, mb: 2.5, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            {t('common.overview', 'Overview')}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            <Box sx={{ flex: { md: '0 0 40%' }, minWidth: 0 }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block', mb: 1 }}>
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
                {record.comparedGlobalRepository ? t('common.enabled', 'Yes') : t('common.disabled', 'No')}
              </Field>
              {(record.pageAmount || record.croppedAmount) && (
                <Field label={t('researcher.integrity_processing_stats', 'Extracted from file')}>
                  {t('researcher.integrity_pages', 'Pages')}: {record.pageAmount ?? '—'}
                  {' · '}
                  {t('researcher.integrity_cropped', 'Cropped regions')}: {record.croppedAmount ?? '—'}
                </Field>
              )}
              {record.description && (
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block', mb: 0.5 }}>
                    {t('researcher.integrity_field_description', 'Description')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#1e293b', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {record.description}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        </Paper>

        {record.status === 'COMPLETED' && (
          <Paper elevation={0} sx={{ p: 2.5, mb: 2.5, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              {t('researcher.integrity_findings', 'Findings')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 2 }}>
              {t(
                'researcher.integrity_disclaimer',
                'This check prefers to over-flag rather than miss a problem. Treat every finding as something to inspect in the visual report, not as a final judgement.'
              )}
            </Typography>
            <Button
              variant="contained"
              disabled={reportLoading}
              onClick={handleGenerateReport}
              startIcon={reportLoading ? <CircularProgress size={14} color="inherit" /> : <OpenInNewIcon />}
              sx={{ bgcolor: PURPLE, fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: '#7b5cac' } }}
            >
              {t('researcher.integrity_view_report', 'View Full Report')}
            </Button>
          </Paper>
        )}

        {record.status === 'COMPLETED' && Object.keys(classification).length > 0 && (
          <Paper elevation={0} sx={{ p: 2.5, mb: 2.5, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.75 }}>
              {t('researcher.integrity_classification', 'Classification')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t(
                'researcher.integrity_classification_help',
                'How images extracted from this file were grouped.'
              )}
            </Typography>
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
                    bgcolor: alpha(PURPLE, 0.03),
                  }}
                >
                  <Typography sx={{ textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</Typography>
                  <Typography sx={{ fontWeight: 700 }}>{value}</Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        )}

        {otherRelated.length > 0 && (
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              {t('researcher.integrity_compared_cases', 'Also compared with')}
            </Typography>
            <Stack spacing={0.75}>
              {otherRelated.map((related) => {
                const relatedName = personName(related.submittedBy);
                return (
                  <MuiLink
                    key={related.id}
                    component="button"
                    type="button"
                    underline="hover"
                    onClick={() => router.push(`/institution/image-integrity/${related.id}`)}
                    sx={{ textAlign: 'left', color: PURPLE, fontWeight: 600, fontSize: '0.875rem' }}
                  >
                    {related.title}
                    {relatedName ? ` · ${relatedName}` : ''}
                  </MuiLink>
                );
              })}
            </Stack>
          </Paper>
        )}
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
