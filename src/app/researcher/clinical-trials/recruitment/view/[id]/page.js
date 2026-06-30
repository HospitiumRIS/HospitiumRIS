'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Print as PrintIcon,
  PeopleAlt as RecruitmentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as EnrolledIcon,
  Cancel as ScreenFailIcon,
  Assessment as AssessmentIcon,
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  PersonAdd as PersonAddIcon,
  Science as ScienceIcon,
  Timeline as TimelineIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import PageHeader from '../../../../../../components/common/PageHeader';
import { useTranslation } from 'react-i18next';

const STATUS_CONFIG = {
  ON_TRACK: { label: 'On Track', color: '#4caf50', icon: EnrolledIcon },
  BEHIND: { label: 'Behind Schedule', color: '#ff9800', icon: TrendingDownIcon },
  AHEAD: { label: 'Ahead of Schedule', color: '#2196f3', icon: TrendingUpIcon },
};

const MOCK_TRIALS = {
  1: {
    id: 1,
    trialId: 'CT-2024-001',
    trialIntakeId: 1,
    title: 'Phase III Trial of Novel Antimalarial Drug',
    principalInvestigator: 'Dr. Sarah Johnson',
    phase: 'Phase III',
    targetEnrollment: 500,
    currentEnrollment: 342,
    screeningFailures: 58,
    screenedTotal: 400,
    enrollmentRate: 68.4,
    sitesActive: 5,
    sitesTotal: 5,
    avgEnrollmentPerMonth: 28.5,
    status: 'ON_TRACK',
    expectedCompletion: '2024-12-31',
    recruitmentStart: '2024-03-01',
    consentWithdrawn: 12,
    pendingScreening: 18,
    screenFailureRate: 14.5,
    sites: [
      { name: 'Nairobi — KNH Main', enrolled: 98, target: 120, screened: 115, failures: 17, rate: 81.7, status: 'ON_TRACK', coordinator: 'Grace Wanjiku' },
      { name: 'Kisumu County Hospital', enrolled: 76, target: 100, screened: 92, failures: 16, rate: 76.0, status: 'ON_TRACK', coordinator: 'Peter Ochieng' },
      { name: 'Coast General Hospital, Mombasa', enrolled: 68, target: 100, screened: 85, failures: 17, rate: 68.0, status: 'BEHIND', coordinator: 'Fatima Hassan' },
      { name: 'Eldoret Teaching Hospital', enrolled: 54, target: 90, screened: 62, failures: 8, rate: 60.0, status: 'BEHIND', coordinator: 'John Mutai' },
      { name: 'Nakuru Provincial Hospital', enrolled: 46, target: 90, screened: 46, failures: 0, rate: 51.1, status: 'BEHIND', coordinator: 'Lucy Chebet' },
    ],
    monthlyEnrollment: [
      { month: 'Mar 2024', screened: 45, enrolled: 38, failures: 7 },
      { month: 'Apr 2024', screened: 52, enrolled: 44, failures: 8 },
      { month: 'May 2024', screened: 61, enrolled: 52, failures: 9 },
      { month: 'Jun 2024', screened: 58, enrolled: 49, failures: 9 },
      { month: 'Jul 2024', screened: 55, enrolled: 47, failures: 8 },
      { month: 'Aug 2024', screened: 48, enrolled: 41, failures: 7 },
      { month: 'Sep 2024', screened: 42, enrolled: 36, failures: 6 },
      { month: 'Oct 2024', screened: 39, enrolled: 35, failures: 4 },
    ],
    milestones: [
      { name: 'First participant enrolled', target: '2024-03-15', actual: '2024-03-12', status: 'completed' },
      { name: '25% enrollment reached', target: '2024-05-01', actual: '2024-04-28', status: 'completed' },
      { name: '50% enrollment reached', target: '2024-08-01', actual: '2024-07-22', status: 'completed' },
      { name: '75% enrollment reached', target: '2024-11-01', actual: null, status: 'pending' },
      { name: 'Full enrollment (500)', target: '2024-12-31', actual: null, status: 'pending' },
    ],
    screeningReasons: [
      { reason: 'Did not meet inclusion criteria', count: 28 },
      { reason: 'Declined participation', count: 14 },
      { reason: 'Medical exclusion', count: 10 },
      { reason: 'Lost to follow-up before enrollment', count: 6 },
    ],
  },
  2: {
    id: 2,
    trialId: 'CT-2024-002',
    trialIntakeId: 2,
    title: 'Observational Study on HIV Treatment Adherence',
    principalInvestigator: 'Dr. Michael Omondi',
    phase: 'Observational',
    targetEnrollment: 300,
    currentEnrollment: 145,
    screeningFailures: 22,
    screenedTotal: 167,
    enrollmentRate: 48.3,
    sitesActive: 3,
    sitesTotal: 4,
    avgEnrollmentPerMonth: 18.1,
    status: 'BEHIND',
    expectedCompletion: '2024-11-30',
    recruitmentStart: '2024-04-01',
    consentWithdrawn: 8,
    pendingScreening: 24,
    screenFailureRate: 13.2,
    sites: [
      { name: 'Nairobi — KNH Main', enrolled: 72, target: 100, screened: 84, failures: 12, rate: 72.0, status: 'BEHIND', coordinator: 'Anne Njeri' },
      { name: 'Kisumu County Hospital', enrolled: 45, target: 100, screened: 52, failures: 7, rate: 45.0, status: 'BEHIND', coordinator: 'James Otieno' },
      { name: 'Mombasa HIV Clinic', enrolled: 28, target: 100, screened: 31, failures: 3, rate: 28.0, status: 'BEHIND', coordinator: 'Aisha Mohamed' },
    ],
    monthlyEnrollment: [
      { month: 'Apr 2024', screened: 22, enrolled: 18, failures: 4 },
      { month: 'May 2024', screened: 28, enrolled: 22, failures: 6 },
      { month: 'Jun 2024', screened: 31, enrolled: 24, failures: 7 },
      { month: 'Jul 2024', screened: 29, enrolled: 21, failures: 8 },
      { month: 'Aug 2024', screened: 27, enrolled: 20, failures: 7 },
      { month: 'Sep 2024', screened: 30, enrolled: 22, failures: 8 },
    ],
    milestones: [
      { name: 'First participant enrolled', target: '2024-04-10', actual: '2024-04-15', status: 'completed' },
      { name: '25% enrollment reached', target: '2024-06-01', actual: '2024-06-18', status: 'completed' },
      { name: '50% enrollment reached', target: '2024-09-01', actual: null, status: 'pending' },
      { name: 'Full enrollment (300)', target: '2024-11-30', actual: null, status: 'pending' },
    ],
    screeningReasons: [
      { reason: 'Did not meet inclusion criteria', count: 10 },
      { reason: 'Declined participation', count: 8 },
      { reason: 'Unable to attend follow-up visits', count: 4 },
    ],
  },
  3: {
    id: 3,
    trialId: 'CT-2024-003',
    trialIntakeId: 3,
    title: 'Randomized Trial of TB Vaccine Efficacy',
    principalInvestigator: 'Dr. Amina Hassan',
    phase: 'Phase II',
    targetEnrollment: 200,
    currentEnrollment: 178,
    screeningFailures: 15,
    screenedTotal: 193,
    enrollmentRate: 89.0,
    sitesActive: 2,
    sitesTotal: 2,
    avgEnrollmentPerMonth: 35.6,
    status: 'AHEAD',
    expectedCompletion: '2024-09-30',
    recruitmentStart: '2024-02-01',
    consentWithdrawn: 5,
    pendingScreening: 8,
    screenFailureRate: 7.8,
    sites: [
      { name: 'Nairobi — KNH Main', enrolled: 102, target: 100, screened: 110, failures: 8, rate: 102.0, status: 'AHEAD', coordinator: 'David Kimani' },
      { name: 'Eldoret Teaching Hospital', enrolled: 76, target: 100, screened: 83, failures: 7, rate: 76.0, status: 'ON_TRACK', coordinator: 'Mary Wambui' },
    ],
    monthlyEnrollment: [
      { month: 'Feb 2024', screened: 30, enrolled: 28, failures: 2 },
      { month: 'Mar 2024', screened: 35, enrolled: 32, failures: 3 },
      { month: 'Apr 2024', screened: 38, enrolled: 35, failures: 3 },
      { month: 'May 2024', screened: 32, enrolled: 30, failures: 2 },
      { month: 'Jun 2024', screened: 28, enrolled: 26, failures: 2 },
      { month: 'Jul 2024', screened: 30, enrolled: 27, failures: 3 },
    ],
    milestones: [
      { name: 'First participant enrolled', target: '2024-02-10', actual: '2024-02-08', status: 'completed' },
      { name: '50% enrollment reached', target: '2024-05-01', actual: '2024-04-20', status: 'completed' },
      { name: 'Full enrollment (200)', target: '2024-09-30', actual: null, status: 'pending' },
    ],
    screeningReasons: [
      { reason: 'Medical exclusion', count: 8 },
      { reason: 'Declined participation', count: 5 },
      { reason: 'Positive TB test', count: 2 },
    ],
  },
};

const DetailField = ({ label, value }) => (
  <Box>
    <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {label}
    </Typography>
    <Typography variant="body1" sx={{ fontWeight: 600, color: '#2D3748', mt: 0.5 }}>
      {value ?? '—'}
    </Typography>
  </Box>
);

export default function RecruitmentViewPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const [trial, setTrial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const fetchTrial = async () => {
      setLoading(true);
      setError('');
      try {
        await new Promise((resolve) => setTimeout(resolve, 400));
        const id = parseInt(params.id, 10);
        const data = MOCK_TRIALS[id];
        if (!data) {
          setError('Trial recruitment record not found');
          setTrial(null);
        } else {
          setTrial(data);
        }
      } catch (err) {
        console.error('Error fetching recruitment trial:', err);
        setError('Failed to load recruitment details.');
      } finally {
        setLoading(false);
      }
    };

    if (params?.id) fetchTrial();
  }, [params?.id]);

  const statusConfig = trial ? STATUS_CONFIG[trial.status] || STATUS_CONFIG.ON_TRACK : null;
  const StatusIcon = statusConfig?.icon || EnrolledIcon;
  const remaining = trial ? trial.targetEnrollment - trial.currentEnrollment : 0;

  const breadcrumbs = [
    { label: 'Dashboard', path: '/researcher', icon: <HomeIcon sx={{ fontSize: 16 }} /> },
    { label: 'Clinical Trials', path: '/researcher/clinical-trials/recruitment' },
    { label: t('researcher.trial_recruitment'), path: '/researcher/clinical-trials/recruitment' },
  ];

  if (loading) {
    return (
      <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
        <PageHeader
          title={t('researcher.trial_recruitment')}
          description={t('researcher.trial_recruitment_desc')}
          icon={<RecruitmentIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={breadcrumbs}
        />
        <Container maxWidth="xl" sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress sx={{ color: '#8b6cbc' }} />
          <Typography sx={{ mt: 2, color: '#718096' }}>Loading recruitment data...</Typography>
        </Container>
      </Box>
    );
  }

  if (error || !trial) {
    return (
      <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
        <PageHeader
          title={t('researcher.trial_recruitment')}
          description={t('researcher.trial_recruitment_desc')}
          icon={<RecruitmentIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={breadcrumbs}
        />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>{error || 'Record not found'}</Alert>
          <Button startIcon={<BackIcon />} onClick={() => router.push('/researcher/clinical-trials/recruitment')} sx={{ color: '#8b6cbc' }}>
            Back to Recruitment
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <PageHeader
        title={trial.title}
        description={`${trial.trialId} · ${trial.enrollmentRate.toFixed(1)}% enrolled`}
        icon={<RecruitmentIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[...breadcrumbs, { label: trial.trialId }]}
        actionButton={
          <Stack direction="row" spacing={1}>
            <Tooltip title="Print">
              <IconButton onClick={() => window.print()} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
                <PrintIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<BackIcon />}
              onClick={() => router.push('/researcher/clinical-trials/recruitment')}
              sx={{ borderColor: 'white', color: 'white', '&:hover': { borderColor: 'rgba(255,255,255,0.8)', bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              All Trials
            </Button>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              sx={{ bgcolor: 'white', color: '#8b6cbc', fontWeight: 700, '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
            >
              Update Enrollment
            </Button>
          </Stack>
        }
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Status summary */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.08)' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ color: '#718096', fontWeight: 500, mb: 1 }}>Recruitment Status</Typography>
              <Chip
                icon={<StatusIcon />}
                label={statusConfig.label}
                sx={{ bgcolor: statusConfig.color, color: 'white', fontWeight: 600, height: 32, '& .MuiChip-icon': { color: 'white' } }}
              />
            </Box>
            <DetailField label="Trial ID" value={trial.trialId} />
            <DetailField label={t('researcher.principal_investigator')} value={trial.principalInvestigator} />
            <DetailField label={t('researcher.phase')} value={trial.phase} />
            <Box>
              <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600, textTransform: 'uppercase' }}>
                Expected Completion
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <CalendarIcon sx={{ fontSize: 16, color: '#8b6cbc' }} />
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {format(new Date(trial.expectedCompletion), 'MMM dd, yyyy')}
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" fontWeight={600}>
                {trial.currentEnrollment} / {trial.targetEnrollment} enrolled
              </Typography>
              <Typography variant="body2" fontWeight={700} sx={{ color: statusConfig.color }}>
                {trial.enrollmentRate.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(trial.enrollmentRate, 100)}
              sx={{ height: 10, borderRadius: 5, bgcolor: 'rgba(0,0,0,0.08)', '& .MuiLinearProgress-bar': { bgcolor: statusConfig.color, borderRadius: 5 } }}
            />
          </Box>
        </Paper>

        {/* Stats cards */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          {[
            { label: 'Enrolled', value: trial.currentEnrollment.toLocaleString(), sub: `${remaining} remaining to target`, icon: <EnrolledIcon sx={{ color: 'white', opacity: 0.9 }} /> },
            { label: 'Screened', value: trial.screenedTotal.toLocaleString(), sub: `${trial.pendingScreening} pending screening`, icon: <PersonAddIcon sx={{ color: 'white', opacity: 0.9 }} /> },
            { label: 'Screen Failures', value: trial.screeningFailures.toLocaleString(), sub: `${trial.screenFailureRate}% failure rate`, icon: <ScreenFailIcon sx={{ color: 'white', opacity: 0.9 }} /> },
            { label: 'Avg / Month', value: trial.avgEnrollmentPerMonth.toFixed(1), sub: `${trial.sitesActive}/${trial.sitesTotal} sites active`, icon: <AssessmentIcon sx={{ color: 'white', opacity: 0.9 }} /> },
          ].map((card) => (
            <Grid key={card.label} size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#8b6cbc', boxShadow: '0 2px 8px rgba(139,108,188,0.2)', height: 100, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>{card.label}</Typography>
                  {card.icon}
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'white' }}>{card.value}</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>{card.sub}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Tabs */}
        <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.08)' }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: '1px solid rgba(0,0,0,0.12)',
              bgcolor: 'rgba(139,108,188,0.02)',
              '& .MuiTab-root': { minHeight: 56, fontWeight: 600, textTransform: 'none', '&.Mui-selected': { color: '#8b6cbc' } },
              '& .MuiTabs-indicator': { bgcolor: '#8b6cbc', height: 3 },
            }}
          >
            <Tab label="Overview" icon={<RecruitmentIcon fontSize="small" />} iconPosition="start" />
            <Tab label="Site Performance" icon={<LocationIcon fontSize="small" />} iconPosition="start" />
            <Tab label="Screening Funnel" icon={<ScreenFailIcon fontSize="small" />} iconPosition="start" />
            <Tab label="Monthly Trends" icon={<TimelineIcon fontSize="small" />} iconPosition="start" />
            <Tab label="Milestones" icon={<AssessmentIcon fontSize="small" />} iconPosition="start" />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {/* Overview */}
            {activeTab === 0 && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#8b6cbc', mb: 2 }}>Enrollment Summary</Typography>
                  <Stack spacing={2.5}>
                    <DetailField label="Target Enrollment" value={trial.targetEnrollment.toLocaleString()} />
                    <DetailField label="Current Enrollment" value={trial.currentEnrollment.toLocaleString()} />
                    <DetailField label="Remaining" value={remaining.toLocaleString()} />
                    <DetailField label="Consent Withdrawn" value={trial.consentWithdrawn.toLocaleString()} />
                    <DetailField label="Recruitment Start" value={format(new Date(trial.recruitmentStart), 'MMMM dd, yyyy')} />
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#8b6cbc', mb: 2 }}>Screening Summary</Typography>
                  <Stack spacing={2.5}>
                    <DetailField label="Total Screened" value={trial.screenedTotal.toLocaleString()} />
                    <DetailField label="Screen Failures" value={trial.screeningFailures.toLocaleString()} />
                    <DetailField label="Screen Failure Rate" value={`${trial.screenFailureRate}%`} />
                    <DetailField label="Pending Screening" value={trial.pendingScreening.toLocaleString()} />
                    <DetailField label="Active Sites" value={`${trial.sitesActive} of ${trial.sitesTotal}`} />
                  </Stack>
                  <Button
                    variant="outlined"
                    startIcon={<ScienceIcon />}
                    onClick={() => router.push(`/researcher/clinical-trials/intake/view/${trial.trialIntakeId}`)}
                    sx={{ mt: 3, borderColor: '#8b6cbc', color: '#8b6cbc', textTransform: 'none', fontWeight: 600 }}
                  >
                    View Trial Details
                  </Button>
                </Grid>
              </Grid>
            )}

            {/* Site Performance */}
            {activeTab === 1 && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'rgba(139,108,188,0.04)' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Site</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Coordinator</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Enrolled</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Target</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Progress</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Screen Failures</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {trial.sites.map((site) => {
                      const siteStatus = STATUS_CONFIG[site.status] || STATUS_CONFIG.ON_TRACK;
                      return (
                        <TableRow key={site.name} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{site.name}</TableCell>
                          <TableCell>{site.coordinator}</TableCell>
                          <TableCell align="center">{site.enrolled}</TableCell>
                          <TableCell align="center">{site.target}</TableCell>
                          <TableCell align="center" sx={{ minWidth: 120 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(site.rate, 100)}
                                sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: 'rgba(0,0,0,0.08)', '& .MuiLinearProgress-bar': { bgcolor: siteStatus.color, borderRadius: 3 } }}
                              />
                              <Typography variant="caption" fontWeight={700}>{site.rate.toFixed(0)}%</Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={site.failures} size="small" color="error" variant="outlined" />
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={siteStatus.label} size="small" sx={{ bgcolor: siteStatus.color, color: 'white', fontWeight: 600 }} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Screening Funnel */}
            {activeTab === 2 && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 5 }}>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#8b6cbc', mb: 2 }}>Recruitment Funnel</Typography>
                    {[
                      { label: 'Screened', value: trial.screenedTotal, color: '#8b6cbc' },
                      { label: 'Screen Failures', value: trial.screeningFailures, color: '#f44336' },
                      { label: 'Enrolled', value: trial.currentEnrollment, color: '#4caf50' },
                      { label: 'Consent Withdrawn', value: trial.consentWithdrawn, color: '#ff9800' },
                    ].map((step) => (
                      <Box key={step.label} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" fontWeight={600}>{step.label}</Typography>
                          <Typography variant="body2" fontWeight={700}>{step.value}</Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={trial.screenedTotal > 0 ? (step.value / trial.screenedTotal) * 100 : 0}
                          sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(0,0,0,0.07)', '& .MuiLinearProgress-bar': { bgcolor: step.color, borderRadius: 4 } }}
                        />
                      </Box>
                    ))}
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 7 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#8b6cbc', mb: 2 }}>Screen Failure Reasons</Typography>
                  <List disablePadding>
                    {trial.screeningReasons.map((item, index) => (
                      <React.Fragment key={item.reason}>
                        {index > 0 && <Divider />}
                        <ListItem sx={{ px: 0, py: 1.5 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <WarningIcon sx={{ color: '#ff9800' }} />
                          </ListItemIcon>
                          <ListItemText primary={item.reason} primaryTypographyProps={{ fontWeight: 600 }} />
                          <Chip label={item.count} size="small" color="error" variant="outlined" />
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                </Grid>
              </Grid>
            )}

            {/* Monthly Trends */}
            {activeTab === 3 && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'rgba(139,108,188,0.04)' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Month</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Screened</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Enrolled</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Failures</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Conversion Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {trial.monthlyEnrollment.map((row) => (
                      <TableRow key={row.month} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{row.month}</TableCell>
                        <TableCell align="center">{row.screened}</TableCell>
                        <TableCell align="center">
                          <Chip label={row.enrolled} size="small" color="success" variant="outlined" />
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={row.failures} size="small" color="error" variant="outlined" />
                        </TableCell>
                        <TableCell align="center">
                          {row.screened > 0 ? `${((row.enrolled / row.screened) * 100).toFixed(1)}%` : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Milestones */}
            {activeTab === 4 && (
              <List disablePadding>
                {trial.milestones.map((milestone, index) => (
                  <React.Fragment key={milestone.name}>
                    {index > 0 && <Divider />}
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {milestone.status === 'completed'
                          ? <EnrolledIcon sx={{ color: '#4caf50' }} />
                          : <TimelineIcon sx={{ color: '#ff9800' }} />}
                      </ListItemIcon>
                      <ListItemText
                        primary={milestone.name}
                        secondary={`Target: ${format(new Date(milestone.target), 'MMM dd, yyyy')}${milestone.actual ? ` · Achieved: ${format(new Date(milestone.actual), 'MMM dd, yyyy')}` : ''}`}
                        primaryTypographyProps={{ fontWeight: 600 }}
                      />
                      <Chip
                        label={milestone.status === 'completed' ? 'Completed' : 'Pending'}
                        size="small"
                        color={milestone.status === 'completed' ? 'success' : 'warning'}
                        variant="outlined"
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
