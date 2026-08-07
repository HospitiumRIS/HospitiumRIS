'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  CircularProgress,
  LinearProgress,
  Alert,
  Divider,
  Stack,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  OpenInNew as OpenInNewIcon,
  ImageSearch as ImageIntegrityIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import PageHeader from '../../../../components/common/PageHeader';
import { useTranslation } from 'react-i18next';

const STATUS_CONFIG = {
  UPLOADING: { label: 'Uploading', color: '#2196f3', bgColor: '#e3f2fd' },
  PROCESSING: { label: 'Processing', color: '#ff9800', bgColor: '#fff3e0' },
  COMPLETED: { label: 'Analysis Completed', color: '#4caf50', bgColor: '#e8f5e9' },
  FAILED: { label: 'Failed', color: '#f44336', bgColor: '#ffebee' },
};

function StatCard({ label, value, color }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, textAlign: 'center', borderRadius: 2 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, color: color || 'text.primary' }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Paper>
  );
}

export default function InstitutionImageIntegrityDetailPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchDetail = useCallback(async () => {
    try {
      const res = await fetch(`/api/institution/image-integrity/${id}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to load submission.');
        return;
      }
      setRecord(data.case);
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

  const handleViewReport = async () => {
    setReportLoading(true);
    try {
      const res = await fetch(`/api/institution/image-integrity/${id}/report`, { method: 'POST' });
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10, mt: '80px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !record) {
    return (
      <Container sx={{ mt: '100px', py: 4 }}>
        <Alert severity="error">{error || 'Submission not found.'}</Alert>
        <Button sx={{ mt: 2 }} startIcon={<ArrowBackIcon />} onClick={() => router.push('/institution/image-integrity')}>
          {t('common.back', 'Back')}
        </Button>
      </Container>
    );
  }

  const statusConfig = STATUS_CONFIG[record.status] || STATUS_CONFIG.UPLOADING;
  const classification = record.classification || {};
  const similarityLevel = record.similarityLevel || {};

  return (
    <Box>
      <PageHeader
        title={record.title}
        description={t('institution_nav.integrity_reports_desc', 'Read-only oversight of an ImaChek image integrity submission')}
        icon={<ImageIntegrityIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: t('institution.portal_title', 'Institution Portal'), path: '/institution' },
          { label: t('institution.image_integrity', 'Image Integrity'), path: '/institution/image-integrity' },
        ]}
      />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/institution/image-integrity')} sx={{ mb: 2 }}>
          {t('institution_nav.integrity_back_to_list', 'Back to Submission Reports')}
        </Button>

        <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Chip label={statusConfig.label} sx={{ bgcolor: statusConfig.bgColor, color: statusConfig.color, fontWeight: 600 }} />
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                <PersonIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {record.submittedBy ? `${record.submittedBy.givenName} ${record.submittedBy.familyName}` : t('common.unknown', 'Unknown')}
                  {record.submittedBy?.email ? ` · ${record.submittedBy.email}` : ''}
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {record.fileName} {record.fileFormat ? `(.${record.fileFormat})` : ''} · {t('researcher.integrity_col_submitted', 'Submitted')}: {new Date(record.createdAt).toLocaleString()}
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<OpenInNewIcon />}
              disabled={record.status !== 'COMPLETED' || reportLoading}
              onClick={handleViewReport}
            >
              {reportLoading ? <CircularProgress size={20} /> : t('researcher.integrity_view_report', 'View Full Report')}
            </Button>
          </Stack>

          {(record.status === 'UPLOADING' || record.status === 'PROCESSING') && (
            <Box sx={{ mt: 3 }}>
              <LinearProgress variant="determinate" value={record.analysisProgress || 0} sx={{ height: 8, borderRadius: 4 }} />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {t('researcher.integrity_analyzing', 'Analyzing')}… {record.analysisProgress || 0}%
              </Typography>
            </Box>
          )}

          {record.status === 'FAILED' && (
            <Alert severity="error" sx={{ mt: 3 }}>
              {record.errorMessage || t('researcher.integrity_failed', 'Analysis failed.')}
            </Alert>
          )}
        </Paper>

        {record.status === 'COMPLETED' && (
          <>
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <StatCard label={t('researcher.integrity_manip_count', 'Manipulation')} value={record.manipulationCount ?? 0} color="#f44336" />
              </Grid>
              <Grid item xs={6} sm={3}>
                <StatCard label={t('researcher.integrity_similarity_count', 'Similarity')} value={record.similarityCount ?? 0} color="#ff9800" />
              </Grid>
              <Grid item xs={6} sm={3}>
                <StatCard label={t('researcher.integrity_high', 'High Similarity')} value={similarityLevel.high ?? 0} color="#d32f2f" />
              </Grid>
              <Grid item xs={6} sm={3}>
                <StatCard label={t('researcher.integrity_medium', 'Medium Similarity')} value={similarityLevel.medium ?? 0} color="#f57c00" />
              </Grid>
            </Grid>

            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                {t('researcher.integrity_classification', 'Image Classification')}
              </Typography>
              {Object.keys(classification).length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {t('researcher.integrity_no_classification', 'No classification data available.')}
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {Object.entries(classification).map(([key, value]) => (
                    <React.Fragment key={key}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                          {key.replace(/_/g, ' ')}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {value}
                        </Typography>
                      </Stack>
                      <Divider />
                    </React.Fragment>
                  ))}
                </Stack>
              )}
            </Paper>
          </>
        )}
      </Container>
    </Box>
  );
}
