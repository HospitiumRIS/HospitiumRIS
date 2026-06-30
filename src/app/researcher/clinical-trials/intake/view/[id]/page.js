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
  LinearProgress,
  Stack,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Print as PrintIcon,
  AppRegistration as RegistrationIcon,
  CheckCircle as ApprovedIcon,
  Schedule as PendingIcon,
  Warning as WarningIcon,
  Public as WHOIcon,
  Person as PersonIcon,
  Science as ScienceIcon,
  Description as DocumentIcon,
  Timeline as TimelineIcon,
  Groups as TeamIcon,
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  AttachFile as AttachFileIcon,
  InsertDriveFile as FileIcon,
  LocalHospital as HospitalIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import PageHeader from '../../../../../../components/common/PageHeader';
import { useTranslation } from 'react-i18next';

const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', color: '#9e9e9e', icon: EditIcon },
  PENDING_WHO_ALIGNMENT: { label: 'Pending WHO Alignment', color: '#ff9800', icon: PendingIcon },
  WHO_ALIGNED: { label: 'WHO Aligned', color: '#4caf50', icon: ApprovedIcon },
  SUBMITTED: { label: 'Submitted', color: '#8b6cbc', icon: PendingIcon },
};

const MOCK_TRIALS = {
  1: {
    id: 1,
    trialId: 'CT-2024-001',
    title: 'Phase III Trial of Novel Antimalarial Drug',
    principalInvestigator: 'Dr. Sarah Johnson',
    piOrcid: '0000-0002-1825-0097',
    status: 'WHO_ALIGNED',
    whoRegistryId: 'PACTR202401001',
    studyType: 'Interventional',
    phase: 'Phase III',
    createdAt: '2024-01-15',
    updatedAt: '2024-03-22',
    targetEnrollment: 500,
    currentEnrollment: 127,
    department: 'Infectious Diseases',
    institution: 'Kenyatta National Hospital',
    institutionRor: 'ror.org/03jts2x97',
    sponsor: 'Global Health Research Fund',
    fundingSource: 'NIH / Gates Foundation',
    intervention: 'Novel antimalarial compound XYZ-401 (oral, 400mg daily × 3 days)',
    condition: 'Uncomplicated Plasmodium falciparum malaria in adults',
    primaryOutcome: 'Parasite clearance rate at day 28 post-treatment',
    secondaryOutcomes: [
      'Time to fever resolution',
      'Incidence of adverse events',
      'Recrudescence rate at day 42',
    ],
    registryTarget: 'PACTR (Pan African Clinical Trial Registry)',
    startDate: '2024-06-01',
    endDate: '2026-05-31',
    recruitmentSites: ['Nairobi — KNH Main', 'Kisumu County Hospital', 'Coast General Hospital, Mombasa'],
    ethicsStatus: 'Approved',
    ethicsNumber: 'KNH-ERC-2024/089',
    whoAlignmentScore: 94,
    documents: [
      { name: 'Preliminary Protocol v1.2', type: 'Protocol', uploadedAt: '2024-01-10', size: '2.4 MB' },
      { name: 'WHO Trial Registration Dataset', type: 'Registry Form', uploadedAt: '2024-01-14', size: '890 KB' },
      { name: 'Informed Consent Form (Draft)', type: 'ICF', uploadedAt: '2024-01-18', size: '1.1 MB' },
      { name: 'Investigator Brochure', type: 'IB', uploadedAt: '2024-02-05', size: '5.6 MB' },
    ],
    timeline: [
      { date: '2024-01-15', event: 'Trial concept submitted to Research Office', status: 'completed' },
      { date: '2024-01-20', event: 'Internal Trial ID assigned (CT-2024-001)', status: 'completed' },
      { date: '2024-02-01', event: 'WHO metadata mapping initiated', status: 'completed' },
      { date: '2024-03-22', event: 'WHO alignment verified — PACTR202401001', status: 'completed' },
      { date: '2024-04-15', event: 'Ethics routing triggered', status: 'pending' },
    ],
    team: [
      { name: 'Dr. Sarah Johnson', role: 'Principal Investigator', orcid: '0000-0002-1825-0097' },
      { name: 'Dr. James Mwangi', role: 'Sub-Investigator', orcid: '0000-0003-1234-5678' },
      { name: 'Grace Wanjiku', role: 'Study Coordinator', orcid: null },
      { name: 'Peter Ochieng', role: 'Data Manager', orcid: '0000-0001-9876-5432' },
    ],
  },
  2: {
    id: 2,
    trialId: 'CT-2024-002',
    title: 'Observational Study on HIV Treatment Adherence',
    principalInvestigator: 'Dr. Michael Omondi',
    piOrcid: '0000-0002-5555-1234',
    status: 'PENDING_WHO_ALIGNMENT',
    whoRegistryId: null,
    studyType: 'Observational',
    phase: 'N/A',
    createdAt: '2024-02-20',
    updatedAt: '2024-03-01',
    targetEnrollment: 300,
    currentEnrollment: 0,
    department: 'Internal Medicine',
    institution: 'Kenyatta National Hospital',
    institutionRor: 'ror.org/03jts2x97',
    sponsor: 'Ministry of Health',
    fundingSource: 'Government Grant',
    intervention: 'N/A — Observational cohort study',
    condition: 'HIV/AIDS treatment adherence in adult outpatients',
    primaryOutcome: 'Medication possession ratio at 12 months',
    secondaryOutcomes: ['Viral load suppression', 'Appointment attendance rate'],
    registryTarget: 'PACTR',
    startDate: '2024-08-01',
    endDate: '2026-07-31',
    recruitmentSites: ['Nairobi — KNH Main'],
    ethicsStatus: 'Pending',
    ethicsNumber: null,
    whoAlignmentScore: 62,
    documents: [
      { name: 'Study Protocol Draft', type: 'Protocol', uploadedAt: '2024-02-18', size: '1.8 MB' },
    ],
    timeline: [
      { date: '2024-02-20', event: 'Trial concept submitted', status: 'completed' },
      { date: '2024-02-25', event: 'Internal Trial ID assigned (CT-2024-002)', status: 'completed' },
      { date: '2024-03-01', event: 'WHO metadata mapping in progress', status: 'pending' },
    ],
    team: [
      { name: 'Dr. Michael Omondi', role: 'Principal Investigator', orcid: '0000-0002-5555-1234' },
      { name: 'Anne Njeri', role: 'Study Coordinator', orcid: null },
    ],
  },
  3: {
    id: 3,
    trialId: 'CT-2024-003',
    title: 'Randomized Trial of TB Vaccine Efficacy',
    principalInvestigator: 'Dr. Amina Hassan',
    piOrcid: '0000-0003-7777-8888',
    status: 'DRAFT',
    whoRegistryId: null,
    studyType: 'Interventional',
    phase: 'Phase II',
    createdAt: '2024-03-10',
    updatedAt: '2024-03-10',
    targetEnrollment: 200,
    currentEnrollment: 0,
    department: 'Pulmonology',
    institution: 'Kenyatta National Hospital',
    institutionRor: 'ror.org/03jts2x97',
    sponsor: 'TB Research Alliance',
    fundingSource: 'Wellcome Trust',
    intervention: 'Novel TB vaccine candidate BCG-M72',
    condition: 'Latent tuberculosis infection',
    primaryOutcome: 'Conversion to active TB at 24 months',
    secondaryOutcomes: ['Immunogenicity response', 'Safety profile'],
    registryTarget: 'ClinicalTrials.gov',
    startDate: '2025-01-01',
    endDate: '2027-12-31',
    recruitmentSites: ['Nairobi — KNH Main'],
    ethicsStatus: 'Not submitted',
    ethicsNumber: null,
    whoAlignmentScore: 28,
    documents: [],
    timeline: [
      { date: '2024-03-10', event: 'Draft trial record created', status: 'completed' },
    ],
    team: [
      { name: 'Dr. Amina Hassan', role: 'Principal Investigator', orcid: '0000-0003-7777-8888' },
    ],
  },
};

const DetailField = ({ label, value }) => (
  <Box>
    <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {label}
    </Typography>
    <Typography variant="body1" sx={{ fontWeight: 600, color: '#2D3748', mt: 0.5 }}>
      {value || '—'}
    </Typography>
  </Box>
);

export default function TrialIntakeViewPage() {
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
        // Simulate API fetch — replace with real endpoint when available
        await new Promise((resolve) => setTimeout(resolve, 400));
        const id = parseInt(params.id, 10);
        const data = MOCK_TRIALS[id];
        if (!data) {
          setError('Trial not found');
          setTrial(null);
        } else {
          setTrial(data);
        }
      } catch (err) {
        console.error('Error fetching trial:', err);
        setError('Failed to load trial details.');
      } finally {
        setLoading(false);
      }
    };

    if (params?.id) fetchTrial();
  }, [params?.id]);

  const statusConfig = trial ? STATUS_CONFIG[trial.status] || STATUS_CONFIG.DRAFT : null;
  const StatusIcon = statusConfig?.icon || WarningIcon;
  const enrollmentPct = trial && trial.targetEnrollment > 0
    ? Math.round((trial.currentEnrollment / trial.targetEnrollment) * 100)
    : 0;

  const breadcrumbs = [
    { label: 'Dashboard', path: '/researcher', icon: <HomeIcon sx={{ fontSize: 16 }} /> },
    { label: 'Clinical Trials', path: '/researcher/clinical-trials/intake' },
    { label: 'Trial Intake', path: '/researcher/clinical-trials/intake' },
  ];

  if (loading) {
    return (
      <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
        <PageHeader
          title={t('researcher.trial_intake')}
          description={t('researcher.trial_intake_desc')}
          icon={<RegistrationIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={breadcrumbs}
        />
        <Container maxWidth="xl" sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress sx={{ color: '#8b6cbc' }} />
          <Typography sx={{ mt: 2, color: '#718096' }}>Loading trial details...</Typography>
        </Container>
      </Box>
    );
  }

  if (error || !trial) {
    return (
      <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
        <PageHeader
          title={t('researcher.trial_intake')}
          description={t('researcher.trial_intake_desc')}
          icon={<RegistrationIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={breadcrumbs}
        />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
            {error || 'Trial not found'}
          </Alert>
          <Button
            startIcon={<BackIcon />}
            onClick={() => router.push('/researcher/clinical-trials/intake')}
            sx={{ color: '#8b6cbc' }}
          >
            Back to Trial Intake
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <PageHeader
        title={trial.title}
        description={`${trial.trialId} · ${trial.principalInvestigator}`}
        icon={<RegistrationIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          ...breadcrumbs,
          { label: trial.trialId },
        ]}
        actionButton={
          <Stack direction="row" spacing={1}>
            <Tooltip title="Print">
              <IconButton
                onClick={() => window.print()}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
              >
                <PrintIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<BackIcon />}
              onClick={() => router.push('/researcher/clinical-trials/intake')}
              sx={{ borderColor: 'white', color: 'white', '&:hover': { borderColor: 'rgba(255,255,255,0.8)', bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              All Trials
            </Button>
            {trial.status === 'DRAFT' && (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                sx={{ bgcolor: 'white', color: '#8b6cbc', fontWeight: 700, '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
              >
                Edit Trial
              </Button>
            )}
            {trial.status === 'PENDING_WHO_ALIGNMENT' && (
              <Button
                variant="contained"
                startIcon={<WHOIcon />}
                sx={{ bgcolor: 'white', color: '#8b6cbc', fontWeight: 700, '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
              >
                Align with WHO
              </Button>
            )}
          </Stack>
        }
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Status summary */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.08)' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="body2" sx={{ color: '#718096', fontWeight: 500, mb: 1 }}>
                Registration Status
              </Typography>
              <Chip
                icon={<StatusIcon />}
                label={statusConfig.label}
                sx={{ bgcolor: statusConfig.color, color: 'white', fontWeight: 600, height: 32, '& .MuiChip-icon': { color: 'white' } }}
              />
            </Box>
            <DetailField label={t('researcher.clinical_trial_id')} value={trial.trialId} />
            {trial.whoRegistryId && (
              <DetailField label="WHO Registry ID" value={trial.whoRegistryId} />
            )}
            <Box>
              <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600, textTransform: 'uppercase' }}>
                Registered
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <CalendarIcon sx={{ fontSize: 16, color: '#8b6cbc' }} />
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {format(new Date(trial.createdAt), 'MMM dd, yyyy')}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ minWidth: 160 }}>
              <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600, textTransform: 'uppercase' }}>
                WHO Alignment
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#8b6cbc' }}>
                    {trial.whoAlignmentScore}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={trial.whoAlignmentScore}
                  sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(139,108,188,0.15)', '& .MuiLinearProgress-bar': { bgcolor: '#8b6cbc', borderRadius: 3 } }}
                />
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Stats cards */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          {[
            { label: 'Target Enrollment', value: trial.targetEnrollment.toLocaleString(), sub: 'Planned participants', icon: <PersonIcon sx={{ color: 'white', opacity: 0.9 }} /> },
            { label: 'Current Enrollment', value: trial.currentEnrollment.toLocaleString(), sub: `${enrollmentPct}% of target`, icon: <TeamIcon sx={{ color: 'white', opacity: 0.9 }} /> },
            { label: t('researcher.phase'), value: trial.phase, sub: trial.studyType, icon: <ScienceIcon sx={{ color: 'white', opacity: 0.9 }} /> },
            { label: 'Ethics Status', value: trial.ethicsStatus, sub: trial.ethicsNumber || 'Not yet assigned', icon: <HospitalIcon sx={{ color: 'white', opacity: 0.9 }} /> },
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
            <Tab label="Overview" icon={<ScienceIcon fontSize="small" />} iconPosition="start" />
            <Tab label="WHO Metadata" icon={<WHOIcon fontSize="small" />} iconPosition="start" />
            <Tab label="Documents" icon={<DocumentIcon fontSize="small" />} iconPosition="start" />
            <Tab label="Timeline" icon={<TimelineIcon fontSize="small" />} iconPosition="start" />
            <Tab label="Study Team" icon={<TeamIcon fontSize="small" />} iconPosition="start" />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {/* Overview */}
            {activeTab === 0 && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#8b6cbc', mb: 2 }}>
                    Study Information
                  </Typography>
                  <Stack spacing={2.5}>
                    <DetailField label={t('researcher.principal_investigator')} value={trial.principalInvestigator} />
                    <DetailField label="PI ORCID" value={trial.piOrcid} />
                    <DetailField label="Department" value={trial.department} />
                    <DetailField label="Institution" value={trial.institution} />
                    <DetailField label="Sponsor" value={trial.sponsor} />
                    <DetailField label="Funding Source" value={trial.fundingSource} />
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#8b6cbc', mb: 2 }}>
                    Study Design
                  </Typography>
                  <Stack spacing={2.5}>
                    <DetailField label="Condition / Disease" value={trial.condition} />
                    <DetailField label="Intervention" value={trial.intervention} />
                    <DetailField label="Primary Outcome" value={trial.primaryOutcome} />
                    <Box>
                      <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600, textTransform: 'uppercase' }}>
                        Secondary Outcomes
                      </Typography>
                      <List dense disablePadding sx={{ mt: 0.5 }}>
                        {trial.secondaryOutcomes.map((outcome) => (
                          <ListItem key={outcome} disableGutters sx={{ py: 0.25 }}>
                            <ListItemText primary={outcome} primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      <DetailField label="Start Date" value={format(new Date(trial.startDate), 'MMM dd, yyyy')} />
                      <DetailField label="End Date" value={format(new Date(trial.endDate), 'MMM dd, yyyy')} />
                    </Box>
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#8b6cbc', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationIcon fontSize="small" /> Recruitment Sites
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {trial.recruitmentSites.map((site) => (
                      <Chip key={site} label={site} variant="outlined" sx={{ borderColor: '#8b6cbc', color: '#8b6cbc', fontWeight: 500 }} />
                    ))}
                  </Stack>
                </Grid>
              </Grid>
            )}

            {/* WHO Metadata */}
            {activeTab === 1 && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack spacing={2.5}>
                    <DetailField label="Target Registry" value={trial.registryTarget} />
                    <DetailField label="WHO Registry ID" value={trial.whoRegistryId || 'Pending assignment'} />
                    <DetailField label={t('researcher.study_type')} value={trial.studyType} />
                    <DetailField label={t('researcher.phase')} value={trial.phase} />
                    <DetailField label="Institution ROR" value={trial.institutionRor} />
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: 'rgba(139,108,188,0.04)' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#8b6cbc', mb: 1 }}>
                      WHO Trial Registration Data Set
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Fields mapped to WHO standards for public registry submission.
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={600}>Alignment completeness</Typography>
                        <Typography variant="body2" fontWeight={700} color="#8b6cbc">{trial.whoAlignmentScore}%</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={trial.whoAlignmentScore}
                        sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(139,108,188,0.15)', '& .MuiLinearProgress-bar': { bgcolor: '#8b6cbc', borderRadius: 4 } }}
                      />
                    </Box>
                    {trial.status === 'WHO_ALIGNED' ? (
                      <Chip icon={<ApprovedIcon />} label="Ready for registry submission" color="success" sx={{ fontWeight: 600 }} />
                    ) : (
                      <Chip icon={<PendingIcon />} label="Metadata mapping in progress" color="warning" sx={{ fontWeight: 600 }} />
                    )}
                  </Paper>
                </Grid>
              </Grid>
            )}

            {/* Documents */}
            {activeTab === 2 && (
              <Box>
                {trial.documents.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <DocumentIcon sx={{ fontSize: 48, color: '#cbd5e0', mb: 2 }} />
                    <Typography color="text.secondary">No documents uploaded yet.</Typography>
                    <Button variant="outlined" startIcon={<AttachFileIcon />} sx={{ mt: 2, borderColor: '#8b6cbc', color: '#8b6cbc' }}>
                      Upload Document
                    </Button>
                  </Box>
                ) : (
                  <List disablePadding>
                    {trial.documents.map((doc, index) => (
                      <React.Fragment key={doc.name}>
                        {index > 0 && <Divider />}
                        <ListItem sx={{ px: 0, py: 1.5 }}>
                          <ListItemIcon><FileIcon sx={{ color: '#8b6cbc' }} /></ListItemIcon>
                          <ListItemText
                            primary={doc.name}
                            secondary={`${doc.type} · ${doc.size} · Uploaded ${format(new Date(doc.uploadedAt), 'MMM dd, yyyy')}`}
                            primaryTypographyProps={{ fontWeight: 600 }}
                          />
                          <Button size="small" sx={{ color: '#8b6cbc' }}>Download</Button>
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Box>
            )}

            {/* Timeline */}
            {activeTab === 3 && (
              <List disablePadding>
                {trial.timeline.map((item, index) => (
                  <React.Fragment key={item.date + item.event}>
                    <ListItem alignItems="flex-start" sx={{ px: 0, py: 1.5 }}>
                      <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                        {item.status === 'completed'
                          ? <ApprovedIcon sx={{ color: '#4caf50' }} />
                          : <PendingIcon sx={{ color: '#ff9800' }} />}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.event}
                        secondary={format(new Date(item.date), 'MMMM dd, yyyy')}
                        primaryTypographyProps={{ fontWeight: 600 }}
                      />
                      <Chip
                        label={item.status === 'completed' ? 'Completed' : 'Pending'}
                        size="small"
                        color={item.status === 'completed' ? 'success' : 'warning'}
                        variant="outlined"
                      />
                    </ListItem>
                    {index < trial.timeline.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            )}

            {/* Study Team */}
            {activeTab === 4 && (
              <Grid container spacing={2}>
                {trial.team.map((member) => (
                  <Grid key={member.name} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'rgba(139,108,188,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <PersonIcon sx={{ color: '#8b6cbc' }} />
                        </Box>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 700 }}>{member.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{member.role}</Typography>
                        </Box>
                      </Box>
                      {member.orcid && (
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#8b6cbc' }}>
                          ORCID: {member.orcid}
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
