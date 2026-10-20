'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Stack,
  Chip,
  alpha,
  LinearProgress,
  Avatar,
  Divider,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  People as ResearchersIcon,
  Description as ManuscriptIcon,
  Assignment as ProposalIcon,
  MenuBook as PublicationIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  FileDownload as ExportIcon,
  ShowChart as LineChartIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  School as InstitutionIcon,
  CheckCircle as ApprovedIcon,
  Schedule as PendingIcon,
  RateReview as ReviewIcon,
  Cancel as RejectedIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  FormatQuote as CitationIcon,
  Group as CollaborationIcon,
  AttachMoney as FundingIcon,
  EmojiEvents as AchievementIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import InstitutionReportsDashboard from '@/components/Analytics/InstitutionReportsDashboard';

const toInputDate = (date) => {
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const RANGE_PRESETS = [
  { key: '30d', label: 'Last 30 days', days: 30 },
  { key: '90d', label: 'Last 90 days', days: 90 },
  { key: '12m', label: 'Last 12 months', months: 12 },
  { key: 'ytd', label: 'This year', ytd: true },
  { key: 'all', label: 'All time', all: true },
];

const presetRange = (preset) => {
  const end = new Date();
  const start = new Date(end);
  if (preset.days) start.setDate(start.getDate() - preset.days + 1);
  else if (preset.months) { start.setMonth(start.getMonth() - preset.months); start.setDate(start.getDate() + 1); }
  else if (preset.ytd) { start.setMonth(0, 1); }
  else if (preset.all) { start.setFullYear(2000, 0, 1); }
  return { startDate: toInputDate(start), endDate: toInputDate(end) };
};

const InstitutionAnalytics = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [error, setError] = useState(null);
  const [researcherSearchTerm, setResearcherSearchTerm] = useState('');
  const [rangePreset, setRangePreset] = useState('12m');
  const [range, setRange] = useState(() => presetRange(RANGE_PRESETS[2]));
  const [draftRange, setDraftRange] = useState(() => presetRange(RANGE_PRESETS[2]));
  const [reportsData, setReportsData] = useState(null);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState('');

  useEffect(() => {
    loadAnalyticsData(range);
    loadReportsData(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.startDate, range.endDate]);

  const rangeQuery = (r) => `startDate=${encodeURIComponent(r.startDate)}&endDate=${encodeURIComponent(r.endDate)}`;

  const loadAnalyticsData = async (r = range) => {
    try {
      if (!analyticsData) setLoading(true);
      setError(null);

      const response = await fetch(`/api/institution/analytics?${rangeQuery(r)}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      setError('Failed to load institutional analytics data');
    } finally {
      setLoading(false);
    }
  };

  const loadReportsData = async (r = range) => {
    try {
      setReportsLoading(true);
      setReportsError('');
      const response = await fetch(`/api/institution/analytics/reports?${rangeQuery(r)}`, { credentials: 'include' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Failed to load reports');
      setReportsData(data);
    } catch (err) {
      console.error('Error loading institution reports:', err);
      setReportsError(err.message || 'Failed to load reports');
    } finally {
      setReportsLoading(false);
    }
  };

  const applyPreset = (preset) => {
    const next = presetRange(preset);
    setRangePreset(preset.key);
    setDraftRange(next);
    setRange(next);
  };

  const applyCustomRange = () => {
    if (!draftRange.startDate || !draftRange.endDate || draftRange.startDate > draftRange.endDate) return;
    setRangePreset('custom');
    setRange({ ...draftRange });
  };

  const handleRefresh = () => {
    loadAnalyticsData(range);
    loadReportsData(range);
  };

  const handleExport = () => {
    console.log('Export analytics data');
  };

  const filteredResearchers = useMemo(() => {
    if (!analyticsData?.topResearchers) return [];

    let researchers = [...analyticsData.topResearchers];

    if (researcherSearchTerm.trim()) {
      const searchLower = researcherSearchTerm.toLowerCase();
      researchers = researchers.filter(r =>
        r.name?.toLowerCase().includes(searchLower) ||
        r.department?.toLowerCase().includes(searchLower) ||
        r.email?.toLowerCase().includes(searchLower)
      );
    }

    return researchers;
  }, [analyticsData?.topResearchers, researcherSearchTerm]);

  if (loading) {
    return (
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Institution Analytics"
          description="Comprehensive analytics and insights for institutional research"
          icon={<AnalyticsIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Analytics' }
          ]}
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
        />
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
        <PageHeader
          title="Institution Analytics"
          description="Comprehensive analytics and insights for institutional research"
          icon={<AnalyticsIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Analytics' }
          ]}
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
        />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
            <Button
              variant="outlined"
              onClick={handleRefresh}
              sx={{ ml: 2 }}
            >
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
        <PageHeader
          title="Institution Analytics"
          description="Comprehensive analytics and insights for institutional research"
          icon={<AnalyticsIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Analytics' }
          ]}
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
          actionButton={
            <Stack direction="row" spacing={2}>
              <Tooltip title={t('common.refresh')}>
                <IconButton
                  onClick={handleRefresh}
                  sx={{
                    color: 'white',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={t('common.export')}>
                <IconButton
                  onClick={handleExport}
                  sx={{
                    color: 'white',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  <ExportIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          }
        />
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Reporting period */}
        <Paper
          elevation={0}
          sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2d3748' }}>
              Reporting period{analyticsData?.institution?.name ? ` · ${analyticsData.institution.name}` : ''}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Applies to the cards and every report below. Reports compare against the previous period of the same length.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
            {RANGE_PRESETS.map((preset) => (
              <Chip
                key={preset.key}
                label={preset.label}
                onClick={() => applyPreset(preset)}
                sx={{
                  fontWeight: 600,
                  bgcolor: rangePreset === preset.key ? '#8b6cbc' : alpha('#8b6cbc', 0.08),
                  color: rangePreset === preset.key ? 'white' : '#8b6cbc',
                  '&:hover': { bgcolor: rangePreset === preset.key ? '#7b5ca7' : alpha('#8b6cbc', 0.15) },
                }}
              />
            ))}
            <TextField
              type="date"
              size="small"
              label="From"
              value={draftRange.startDate}
              onChange={(event) => setDraftRange((prev) => ({ ...prev, startDate: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: draftRange.endDate }}
              sx={{ width: 160 }}
            />
            <TextField
              type="date"
              size="small"
              label="To"
              value={draftRange.endDate}
              onChange={(event) => setDraftRange((prev) => ({ ...prev, endDate: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: draftRange.startDate, max: toInputDate(new Date()) }}
              sx={{ width: 160 }}
            />
            <Button
              variant="contained"
              onClick={applyCustomRange}
              disabled={!draftRange.startDate || !draftRange.endDate || draftRange.startDate > draftRange.endDate || (draftRange.startDate === range.startDate && draftRange.endDate === range.endDate)}
              sx={{ bgcolor: '#8b6cbc', textTransform: 'none', fontWeight: 700, boxShadow: 'none', '&:hover': { bgcolor: '#7b5ca7', boxShadow: 'none' } }}
            >
              Apply
            </Button>
          </Stack>
        </Paper>

        {/* Key Performance Indicators */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{
            display: 'flex',
            gap: 2.5,
            flexWrap: 'wrap',
            '& > *': {
              flex: '1 1 calc(16.666% - 21px)',
              minWidth: '200px'
            }
          }}>
            <Paper sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: '#8b6cbc',
              boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)',
              border: 'none',
              position: 'relative',
              overflow: 'hidden',
              height: '100px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                  Total Researchers
                </Typography>
                <ResearchersIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {analyticsData.overview.totalResearchers}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Active researchers
              </Typography>
            </Paper>

            <Paper sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: '#8b6cbc',
              boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)',
              border: 'none',
              position: 'relative',
              overflow: 'hidden',
              height: '100px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                  Total Manuscripts
                </Typography>
                <ManuscriptIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {analyticsData.overview.totalManuscripts}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Collaborative works
              </Typography>
            </Paper>

            <Paper sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: '#8b6cbc',
              boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)',
              border: 'none',
              position: 'relative',
              overflow: 'hidden',
              height: '100px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                  Total Proposals
                </Typography>
                <ProposalIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {analyticsData.overview.totalProposals}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Research proposals
              </Typography>
            </Paper>

            <Paper sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: '#8b6cbc',
              boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)',
              border: 'none',
              position: 'relative',
              overflow: 'hidden',
              height: '100px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                  Total Publications
                </Typography>
                <PublicationIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {analyticsData.overview.totalPublications}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Published research
              </Typography>
            </Paper>

            <Paper sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: '#8b6cbc',
              boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)',
              border: 'none',
              position: 'relative',
              overflow: 'hidden',
              height: '100px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                  Awaiting Review
                </Typography>
                <ReviewIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {analyticsData.overview.submittedProposals + analyticsData.overview.underReviewProposals}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Pending review
              </Typography>
            </Paper>

            <Paper sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: '#8b6cbc',
              boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)',
              border: 'none',
              position: 'relative',
              overflow: 'hidden',
              height: '100px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                  Success Rate
                </Typography>
                <TrendingUpIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {analyticsData.overview.proposalSuccessRate}%
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Approval rate
              </Typography>
            </Paper>
          </Box>
        </Box>

        {/* Charts Section */}
        <Box sx={{
          display: 'flex',
          gap: 4,
          mb: 4,
          flexWrap: 'wrap',
          '& > *:first-of-type': {
            flex: {
              xs: '1 1 100%',
              lg: '1 1 calc(60% - 16px)'
            }
          },
          '& > *:last-of-type': {
            flex: {
              xs: '1 1 100%',
              lg: '1 1 calc(40% - 16px)'
            }
          }
        }}>
          {/* Research Output Trends */}
          <Card sx={{
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid rgba(139, 108, 188, 0.1)'
          }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <LineChartIcon sx={{ color: '#8b6cbc' }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Research Output Trends
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Monthly research output including manuscripts and proposals
              </Typography>

              <Box sx={{
                height: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: alpha('#8b6cbc', 0.05),
                borderRadius: 2
              }}>
                <Stack spacing={1} sx={{ width: '100%', px: 3 }}>
                  {analyticsData.monthlyTrends.map((trend, index) => (
                    <Stack key={trend.month} direction="row" alignItems="center" spacing={2}>
                      <Typography variant="body2" sx={{ minWidth: 80, fontWeight: 500 }}>
                        {trend.month}
                      </Typography>
                      <Box sx={{ flex: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min((trend.total / Math.max(...analyticsData.monthlyTrends.map(t => t.total), 1)) * 100, 100)}
                          sx={{
                            height: 12,
                            borderRadius: 6,
                            backgroundColor: alpha('#8b6cbc', 0.1),
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: '#8b6cbc',
                              borderRadius: 6
                            }
                          }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ minWidth: 40, fontWeight: 600, color: '#8b6cbc' }}>
                        {trend.total}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </CardContent>
          </Card>

          {/* Proposal Status Distribution */}
          <Card sx={{
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid rgba(139, 108, 188, 0.1)'
          }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <PieChartIcon sx={{ color: '#8b6cbc' }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Proposal Status
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Current distribution of proposal review status
              </Typography>

              <Box sx={{
                height: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: alpha('#8b6cbc', 0.05),
                borderRadius: 2
              }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ fontWeight: 600, color: '#8b6cbc', mb: 1 }}>
                    {analyticsData.overview.totalProposals}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Total Proposals
                  </Typography>
                  <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#4caf50' }} />
                      <Typography variant="body2">{t('common.approved')}: {analyticsData.overview.approvedProposals}</Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ff9800' }} />
                      <Typography variant="body2">Submitted: {analyticsData.overview.submittedProposals}</Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#2196f3' }} />
                      <Typography variant="body2">Under Review: {analyticsData.overview.underReviewProposals}</Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#f44336' }} />
                      <Typography variant="body2">{t('common.rejected')}: {analyticsData.overview.rejectedProposals}</Typography>
                    </Stack>
                  </Stack>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Dashboards & Reports */}
        <InstitutionReportsDashboard data={reportsData} loading={reportsLoading} error={reportsError} />

        {/* Research Impact Metrics */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              mb: 3,
              color: '#2d3748',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <AchievementIcon sx={{ color: '#8b6cbc' }} />
            Research Impact & Collaboration
          </Typography>

          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 2
          }}>
            <Card sx={{
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #f3f4f6'
            }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#3b82f6', mb: 0.5, lineHeight: 1 }}>
                      {analyticsData.impactMetrics?.totalCitations || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mt: 0.5 }}>
                      Total Citations
                    </Typography>
                  </Box>
                  <CitationIcon sx={{ fontSize: 28, color: '#3b82f6', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>

            <Card sx={{
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #f3f4f6'
            }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#10b981', mb: 0.5, lineHeight: 1 }}>
                      {analyticsData.impactMetrics?.averageHIndex || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mt: 0.5 }}>
                      Average H-Index
                    </Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 28, color: '#10b981', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>

            <Card sx={{
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #f3f4f6'
            }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#f59e0b', mb: 0.5, lineHeight: 1 }}>
                      {analyticsData.impactMetrics?.activeCollaborations || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mt: 0.5 }}>
                      Collaborations
                    </Typography>
                  </Box>
                  <CollaborationIcon sx={{ fontSize: 28, color: '#f59e0b', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>

            <Card sx={{
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #f3f4f6'
            }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#059669', mb: 0.5, lineHeight: 1 }}>
                      ${(analyticsData.impactMetrics?.totalFunding || 0) / 1000}K
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mt: 0.5 }}>
                      Total Funding
                    </Typography>
                  </Box>
                  <FundingIcon sx={{ fontSize: 28, color: '#059669', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Top Researchers */}
        <Card sx={{
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid rgba(139, 108, 188, 0.1)'
        }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{
                p: 3,
                pb: 2,
                background: `linear-gradient(135deg, ${alpha('#8b6cbc', 0.03)} 0%, ${alpha('#a084d1', 0.05)} 100%)`,
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#2d3748' }}>
                      Top Researchers
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Most productive researchers by total output
                    </Typography>
                  </Box>
                  <TextField
                    size="small"
                    placeholder="Search researchers..."
                    value={researcherSearchTerm}
                    onChange={(e) => setResearcherSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      width: { xs: '100%', sm: 240 },
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'white',
                        fontSize: '0.875rem',
                        '&:hover fieldset': { borderColor: '#8b6cbc' },
                        '&.Mui-focused fieldset': { borderColor: '#8b6cbc' }
                      }
                    }}
                  />
                </Stack>
              </Box>

              <TableContainer sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, backgroundColor: '#fafafa', borderBottom: '2px solid', borderColor: 'divider', py: 1.5 }}>
                        Researcher
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, backgroundColor: '#fafafa', borderBottom: '2px solid', borderColor: 'divider', py: 1.5 }}>
                        Manuscripts
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, backgroundColor: '#fafafa', borderBottom: '2px solid', borderColor: 'divider', py: 1.5 }}>
                        Publications
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, backgroundColor: '#fafafa', borderBottom: '2px solid', borderColor: 'divider', py: 1.5 }}>
                        {t('common.total')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredResearchers.slice(0, 10).map((researcher, index) => (
                      <TableRow
                        key={researcher.id}
                        hover
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: alpha('#8b6cbc', 0.05) }
                        }}
                        onClick={() => router.push(`/institution/researcher/${researcher.id}`)}
                      >
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Avatar sx={{
                              width: 32,
                              height: 32,
                              bgcolor: '#8b6cbc',
                              fontSize: '0.875rem',
                              fontWeight: 600
                            }}>
                              {researcher.name.split(' ').map(n => n[0]).join('')}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {researcher.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {researcher.department}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {researcher.manuscriptCount}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {researcher.publicationCount}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={researcher.totalOutput}
                            size="small"
                            sx={{
                              bgcolor: alpha('#8b6cbc', 0.1),
                              color: '#8b6cbc',
                              fontWeight: 600
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
      </Container>
    </>
  );
};

export default InstitutionAnalytics;
