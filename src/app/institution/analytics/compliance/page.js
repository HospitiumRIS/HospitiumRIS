'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  VerifiedUser as ComplianceIcon,
  Refresh as RefreshIcon,
  FileDownload as ExportIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import ComplianceAnalyticsDashboard from '@/components/Analytics/ComplianceAnalyticsDashboard';
import { AnalyticsRangeBar, presetRange, rangeQuery } from '@/components/Analytics/AnalyticsUI';
import { generateComplianceReportPdf } from '@/utils/generateComplianceReportPdf';

export default function ComplianceAnalytics() {
  const [range, setRange] = useState(() => presetRange('12m'));
  const [preset, setPreset] = useState('12m');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const load = async (r = range) => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/institution/analytics/compliance?${rangeQuery(r)}`, { credentials: 'include' });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.error || 'Failed to load compliance analytics');
      setData(json);
    } catch (err) {
      console.error('Error loading compliance analytics:', err);
      setError(err.message || 'Failed to load compliance analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.startDate, range.endDate]);

  const exportPdf = async () => {
    if (!data) return;
    setExporting(true);
    try {
      await generateComplianceReportPdf('summary', 'Compliance summary', data);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Compliance Analytics"
          description="Ethics clearance, data management and funder obligations across your research portfolio"
          icon={<ComplianceIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Analytics', path: '/institution/analytics' },
            { label: 'Compliance' },
          ]}
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
          actionButton={(
            <Stack direction="row" spacing={1}>
              <Tooltip title="Refresh">
                <span>
                  <IconButton onClick={() => load(range)} disabled={loading} sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}>
                    <RefreshIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<ExportIcon />}
                onClick={exportPdf}
                disabled={!data || exporting}
                sx={{ bgcolor: 'white', color: '#6d5499', textTransform: 'none', fontWeight: 700, boxShadow: 'none', '&:hover': { bgcolor: '#f5f5f5', boxShadow: 'none' } }}
              >
                {exporting ? 'Preparing…' : 'Export PDF'}
              </Button>
            </Stack>
          )}
        />
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <AnalyticsRangeBar
          value={range}
          preset={preset}
          institutionName={data?.institution?.name}
          note="Covers proposals active during the period. Expiry and overdue items are as of today."
          onChange={(next, key) => { setPreset(key); setRange(next); }}
        />

        {error ? (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} action={<Button color="inherit" size="small" onClick={() => load(range)}>Retry</Button>}>
            {error}
          </Alert>
        ) : null}

        {loading && !data ? (
          <Stack spacing={2}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.15fr 2fr' }, gap: 2 }}>
              <Skeleton variant="rounded" height={160} />
              <Skeleton variant="rounded" height={160} />
            </Box>
            <Skeleton variant="rounded" height={52} />
            <Skeleton variant="rounded" height={260} />
            <Skeleton variant="rounded" height={320} />
          </Stack>
        ) : data ? (
          <Box sx={{ opacity: loading ? 0.6 : 1, transition: 'opacity 150ms' }}>
            <ComplianceAnalyticsDashboard analyticsData={data} />
          </Box>
        ) : null}
      </Container>
    </>
  );
}
