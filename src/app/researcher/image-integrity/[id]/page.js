'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ImageSearchIcon from '@mui/icons-material/ImageSearch';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../../../components/common/PageHeader';
import IntegrityDetailError from '../../../../components/ImageIntegrity/IntegrityDetailError';
import IntegrityStatusBanner from '../../../../components/ImageIntegrity/IntegrityStatusBanner';
import IntegrityVerdictSection from '../../../../components/ImageIntegrity/IntegrityVerdictSection';
import IntegrityOverviewSection from '../../../../components/ImageIntegrity/IntegrityOverviewSection';
import IntegrityFindingsSection from '../../../../components/ImageIntegrity/IntegrityFindingsSection';
import IntegrityClassificationSection from '../../../../components/ImageIntegrity/IntegrityClassificationSection';
import IntegrityRelatedCasesSection from '../../../../components/ImageIntegrity/IntegrityRelatedCasesSection';
import { PURPLE } from '../../../../components/ImageIntegrity/integrityDetailUtils';

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
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
  const pollRef = useRef(null);

  const fetchDetail = useCallback(
    async (force = false) => {
      try {
        const res = await fetch(`/api/researcher/image-integrity/${id}${force ? '?refresh=1' : ''}`);
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
    },
    [id]
  );

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

  const handleResubmit = async () => {
    if (!window.confirm(t('researcher.integrity_resubmit_confirm', 'Resubmit this failed check to ImaChek?'))) {
      return;
    }
    setResubmitting(true);
    try {
      const res = await fetch(`/api/researcher/image-integrity/${id}/resubmit`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok && res.status !== 202) {
        setSnackbar({
          open: true,
          message: data.error || t('researcher.integrity_resubmit_failed', 'Resubmission failed.'),
          severity: 'error',
        });
        return;
      }
      if (data.case) setRecord(data.case);
      else fetchDetail();
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: t('researcher.integrity_resubmit_failed', 'Resubmission failed.'),
        severity: 'error',
      });
    } finally {
      setResubmitting(false);
    }
  };

  const header = (title, actions) => (
    <PageHeader
      title={title}
      description={t('researcher.integrity_detail_subtitle', 'Integrity check report - read each numbered section from top to bottom.')}
      icon={<ImageSearchIcon sx={{ fontSize: 32 }} />}
      breadcrumbs={[
        { label: t('researcher.portal_title', 'Researcher Portal'), path: '/researcher' },
        { label: t('researcher.image_integrity', 'Image Integrity'), path: '/researcher/image-integrity' },
      ]}
      actionButton={actions}
    />
  );

  const headerActions = (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
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
      {record?.status === 'FAILED' && (
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
        disabled={!record || record.status !== 'COMPLETED' || reportLoading}
        onClick={handleGenerateReport}
        startIcon={reportLoading ? <CircularProgress size={14} color="inherit" /> : <OpenInNewIcon />}
        sx={{ bgcolor: 'white', color: PURPLE, fontWeight: 700, textTransform: 'none' }}
      >
        {t('researcher.integrity_view_report', 'View Full Report')}
      </Button>
    </Stack>
  );

  if (loading) {
    return (
      <Box>
        {header(t('researcher.image_integrity', 'Image Integrity'))}
        <Container maxWidth={false} sx={{ py: 8, display: 'flex', justifyContent: 'center', maxWidth: 1600 }}>
          <CircularProgress sx={{ color: PURPLE }} />
        </Container>
      </Box>
    );
  }

  if (error || !record) {
    return (
      <Box>
        {header(t('researcher.image_integrity', 'Image Integrity'))}
        <Container maxWidth={false} sx={{ mt: 4, mb: 4, maxWidth: 1600, mx: 'auto' }}>
          <IntegrityDetailError
            status={error?.status || 404}
            message={error?.message}
            onBack={() => router.push('/researcher/image-integrity')}
            onRetry={() => {
              setLoading(true);
              fetchDetail(true);
            }}
          />
        </Container>
      </Box>
    );
  }

  return (
    <Box>
      {header(record.title, headerActions)}

      <Container maxWidth={false} sx={{ mt: 3, mb: 5, maxWidth: 1600, mx: 'auto' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/researcher/image-integrity')}
          sx={{ mb: 2.5, color: PURPLE, textTransform: 'none', fontWeight: 600, px: 0 }}
        >
          {t('researcher.integrity_back_to_list', 'Back to My Submissions')}
        </Button>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.6, maxWidth: 720 }}>
          {t(
            'researcher.integrity_report_intro',
            'This is the report for this file. Section 1 is status. Section 2 is the result. Section 3 is what you submitted. Section 4 is how to inspect flags. Later sections list image types and any related checks.'
          )}
        </Typography>

        <IntegrityStatusBanner record={record} onResubmit={handleResubmit} resubmitting={resubmitting} />
        <IntegrityVerdictSection record={record} />
        <IntegrityOverviewSection
          record={record}
          fileUrl={`/api/researcher/image-integrity/${record.id}/file`}
        />
        <IntegrityFindingsSection
          record={record}
          onViewReport={handleGenerateReport}
          reportLoading={reportLoading}
        />
        <IntegrityClassificationSection record={record} />
        <IntegrityRelatedCasesSection
          relatedCases={relatedCases}
          currentId={record.id}
          onOpen={(relatedId) => router.push(`/researcher/image-integrity/${relatedId}`)}
        />
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
