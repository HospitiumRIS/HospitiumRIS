'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Container,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Stack,
  Button,
} from '@mui/material';
import {
  VerifiedUser as ComplianceIcon,
  Refresh as RefreshIcon,
  FileDownload as ExportIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import ComplianceAnalyticsDashboard from '@/components/Analytics/ComplianceAnalyticsDashboard';
import { generateComplianceReportPdf } from '@/utils/generateComplianceReportPdf';

const ComplianceAnalytics = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/institution/analytics/compliance');
      if (!response.ok) {
        throw new Error('Failed to fetch compliance analytics');
      }

      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error loading compliance analytics:', err);
      setError('Failed to load compliance analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportAll = async () => {
    if (!analyticsData) return;
    setExporting(true);
    try {
      await generateComplianceReportPdf('risk-regulatory', 'Compliance Analytics Summary', analyticsData);
    } finally {
      setExporting(false);
    }
  };

  const pageHeader = (
    <PageHeader
      title="Compliance Analytics"
      description="Ethics approvals, data management, and regulatory compliance tracking"
      icon={<ComplianceIcon sx={{ fontSize: 32 }} />}
      breadcrumbs={[
        { label: 'Institution', path: '/institution' },
        { label: 'Analytics', path: '/institution/analytics' },
        { label: 'Compliance' },
      ]}
      gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
      actionButton={
        !loading && !error ? (
          <Stack direction="row" spacing={2}>
            <Tooltip title={t('common.refresh')}>
              <IconButton onClick={loadComplianceData} sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download summary PDF">
              <span>
                <IconButton
                  onClick={handleExportAll}
                  disabled={exporting}
                  sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                >
                  <ExportIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        ) : undefined
      }
    />
  );

  if (loading) {
    return (
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        {pageHeader}
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <CircularProgress size={60} sx={{ color: '#8b6cbc' }} />
          </Box>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        {pageHeader}
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
            <Button variant="outlined" onClick={loadComplianceData} sx={{ ml: 2 }}>
              {t('common.retry')}
            </Button>
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        {pageHeader}
      </Box>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <ComplianceAnalyticsDashboard analyticsData={analyticsData} />
      </Container>
    </>
  );
};

export default ComplianceAnalytics;
