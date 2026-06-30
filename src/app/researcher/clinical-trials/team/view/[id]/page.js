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
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Print as PrintIcon,
  SupervisedUserCircle as TeamIcon,
  VerifiedUser as CertifiedIcon,
  Warning as WarningIcon,
  CheckCircle as ApprovedIcon,
  Schedule as PendingIcon,
  Assignment as DelegationIcon,
  School as TrainingIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Science as ScienceIcon,
  Description as DocumentIcon,
  InsertDriveFile as FileIcon,
  AttachFile as AttachFileIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { format, differenceInDays } from 'date-fns';
import PageHeader from '../../../../../../components/common/PageHeader';
import { useTranslation } from 'react-i18next';

const ROLE_CONFIG = {
  PRINCIPAL_INVESTIGATOR: { label: 'Principal Investigator', color: '#8b6cbc' },
  CO_INVESTIGATOR: { label: 'Co-Investigator', color: '#2196f3' },
  STUDY_COORDINATOR: { label: 'Study Coordinator', color: '#ff9800' },
  RESEARCH_NURSE: { label: 'Research Nurse', color: '#4caf50' },
  DATA_MANAGER: { label: 'Data Manager', color: '#00bcd4' },
  REGULATORY_SPECIALIST: { label: 'Regulatory Specialist', color: '#f44336' },
};

const MOCK_MEMBERS = {
  1: {
    id: 1,
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@hospital.org',
    phone: '+254 712 345 678',
    role: 'PRINCIPAL_INVESTIGATOR',
    department: 'Infectious Diseases',
    orcid: '0000-0002-1825-0097',
    trialId: 'CT-2024-001',
    trialTitle: 'Phase III Trial of Novel Antimalarial Drug',
    trialIntakeId: 1,
    site: 'Nairobi — KNH Main',
    status: 'Active',
    gcpCertified: true,
    certificationExpiry: '2025-06-15',
    gcpCertificationDate: '2023-06-15',
    gcpProvider: 'TransCelerate GCP Training Programme',
    gcpCertificateId: 'GCP-2023-SJ-4892',
    delegationLog: true,
    delegationDate: '2024-01-12',
    assignedDate: '2024-01-10',
    delegatedTasks: [
      { task: 'Overall study conduct and oversight', authorized: true, date: '2024-01-12' },
      { task: 'Informed consent — obtain and document', authorized: true, date: '2024-01-12' },
      { task: 'Serious adverse event reporting', authorized: true, date: '2024-01-12' },
      { task: 'Protocol deviation assessment', authorized: true, date: '2024-01-12' },
      { task: 'Source data verification', authorized: false, date: null },
    ],
    trainingHistory: [
      { title: 'ICH GCP E6(R2) Refresher', provider: 'CITI Program', completedAt: '2023-06-15', expiryAt: '2025-06-15' },
      { title: 'Human Subjects Research', provider: 'CITI Program', completedAt: '2022-03-10', expiryAt: '2025-03-10' },
      { title: 'Good Clinical Practice — Africa Region', provider: 'TCC Africa', completedAt: '2021-09-20', expiryAt: '2024-09-20' },
    ],
    documents: [
      { name: 'Delegation of Authority Log — Signed', type: 'Delegation Log', uploadedAt: '2024-01-12', size: '420 KB' },
      { name: 'GCP Certificate — TransCelerate 2023', type: 'GCP Certificate', uploadedAt: '2023-06-16', size: '180 KB' },
      { name: 'Curriculum Vitae — Dr. Sarah Johnson', type: 'CV', uploadedAt: '2024-01-10', size: '310 KB' },
      { name: 'Medical License — Kenya Medical Practitioners Board', type: 'License', uploadedAt: '2024-01-10', size: '95 KB' },
    ],
  },
  2: {
    id: 2,
    name: 'Dr. Michael Omondi',
    email: 'michael.omondi@hospital.org',
    phone: '+254 723 456 789',
    role: 'CO_INVESTIGATOR',
    department: 'Infectious Diseases',
    orcid: '0000-0003-1234-5678',
    trialId: 'CT-2024-001',
    trialTitle: 'Phase III Trial of Novel Antimalarial Drug',
    trialIntakeId: 1,
    site: 'Nairobi — KNH Main',
    status: 'Active',
    gcpCertified: true,
    certificationExpiry: '2024-12-20',
    gcpCertificationDate: '2022-12-20',
    gcpProvider: 'NIH GCP Training',
    gcpCertificateId: 'GCP-2022-MO-3310',
    delegationLog: true,
    delegationDate: '2024-01-18',
    assignedDate: '2024-01-15',
    delegatedTasks: [
      { task: 'Participant screening and enrollment', authorized: true, date: '2024-01-18' },
      { task: 'Informed consent — obtain and document', authorized: true, date: '2024-01-18' },
      { task: 'Study drug administration oversight', authorized: true, date: '2024-01-18' },
    ],
    trainingHistory: [
      { title: 'ICH GCP E6(R2)', provider: 'NIH', completedAt: '2022-12-20', expiryAt: '2024-12-20' },
    ],
    documents: [
      { name: 'Delegation of Authority Log — Signed', type: 'Delegation Log', uploadedAt: '2024-01-18', size: '380 KB' },
      { name: 'GCP Certificate — NIH 2022', type: 'GCP Certificate', uploadedAt: '2022-12-21', size: '165 KB' },
    ],
  },
  3: {
    id: 3,
    name: 'Jane Wanjiru',
    email: 'jane.wanjiru@hospital.org',
    phone: '+254 734 567 890',
    role: 'STUDY_COORDINATOR',
    department: 'Internal Medicine',
    orcid: null,
    trialId: 'CT-2024-002',
    trialTitle: 'Observational Study on HIV Treatment Adherence',
    trialIntakeId: 2,
    site: 'Nairobi — KNH Main',
    status: 'Pending Setup',
    gcpCertified: false,
    certificationExpiry: null,
    gcpCertificationDate: null,
    gcpProvider: null,
    gcpCertificateId: null,
    delegationLog: false,
    delegationDate: null,
    assignedDate: '2024-02-01',
    delegatedTasks: [],
    trainingHistory: [],
    documents: [],
  },
  4: {
    id: 4,
    name: 'Mary Kamau',
    email: 'mary.kamau@hospital.org',
    phone: '+254 745 678 901',
    role: 'RESEARCH_NURSE',
    department: 'Infectious Diseases',
    orcid: '0000-0001-5555-4444',
    trialId: 'CT-2024-001',
    trialTitle: 'Phase III Trial of Novel Antimalarial Drug',
    trialIntakeId: 1,
    site: 'Nairobi — KNH Main',
    status: 'Active',
    gcpCertified: true,
    certificationExpiry: '2025-03-10',
    gcpCertificationDate: '2023-03-10',
    gcpProvider: 'CITI Program',
    gcpCertificateId: 'GCP-2023-MK-7721',
    delegationLog: true,
    delegationDate: '2024-01-25',
    assignedDate: '2024-01-20',
    delegatedTasks: [
      { task: 'Vital signs and sample collection', authorized: true, date: '2024-01-25' },
      { task: 'Adverse event documentation', authorized: true, date: '2024-01-25' },
      { task: 'Study drug dispensing', authorized: true, date: '2024-01-25' },
    ],
    trainingHistory: [
      { title: 'ICH GCP for Clinical Research Staff', provider: 'CITI Program', completedAt: '2023-03-10', expiryAt: '2025-03-10' },
    ],
    documents: [
      { name: 'Delegation of Authority Log — Signed', type: 'Delegation Log', uploadedAt: '2024-01-25', size: '395 KB' },
      { name: 'GCP Certificate — CITI 2023', type: 'GCP Certificate', uploadedAt: '2023-03-11', size: '172 KB' },
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

const getCertStatus = (expiryDate) => {
  if (!expiryDate) return { label: 'Not Certified', color: '#9e9e9e', chipColor: 'default' };
  const days = differenceInDays(new Date(expiryDate), new Date());
  if (days < 0) return { label: 'Expired', color: '#f44336', chipColor: 'error' };
  if (days <= 90) return { label: 'Expiring Soon', color: '#ff9800', chipColor: 'warning' };
  return { label: 'Valid', color: '#4caf50', chipColor: 'success' };
};

export default function TeamMemberViewPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const fetchMember = async () => {
      setLoading(true);
      setError('');
      try {
        await new Promise((resolve) => setTimeout(resolve, 400));
        const id = parseInt(params.id, 10);
        const data = MOCK_MEMBERS[id];
        if (!data) {
          setError('Team member not found');
          setMember(null);
        } else {
          setMember(data);
        }
      } catch (err) {
        console.error('Error fetching team member:', err);
        setError('Failed to load team member details.');
      } finally {
        setLoading(false);
      }
    };

    if (params?.id) fetchMember();
  }, [params?.id]);

  const roleConfig = member ? ROLE_CONFIG[member.role] || { label: member.role, color: '#666' } : null;
  const certStatus = member ? getCertStatus(member.certificationExpiry) : null;

  const breadcrumbs = [
    { label: 'Dashboard', path: '/researcher', icon: <HomeIcon sx={{ fontSize: 16 }} /> },
    { label: 'Clinical Trials', path: '/researcher/clinical-trials/team' },
    { label: t('researcher.trial_team'), path: '/researcher/clinical-trials/team' },
  ];

  if (loading) {
    return (
      <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
        <PageHeader
          title={t('researcher.trial_team')}
          description={t('researcher.trial_team_desc')}
          icon={<TeamIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={breadcrumbs}
        />
        <Container maxWidth="xl" sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress sx={{ color: '#8b6cbc' }} />
          <Typography sx={{ mt: 2, color: '#718096' }}>Loading team member...</Typography>
        </Container>
      </Box>
    );
  }

  if (error || !member) {
    return (
      <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
        <PageHeader
          title={t('researcher.trial_team')}
          description={t('researcher.trial_team_desc')}
          icon={<TeamIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={breadcrumbs}
        />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>{error || 'Team member not found'}</Alert>
          <Button startIcon={<BackIcon />} onClick={() => router.push('/researcher/clinical-trials/team')} sx={{ color: '#8b6cbc' }}>
            Back to Study Team
          </Button>
        </Container>
      </Box>
    );
  }

  const certDaysLeft = member.certificationExpiry
    ? differenceInDays(new Date(member.certificationExpiry), new Date())
    : null;

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <PageHeader
        title={member.name}
        description={`${roleConfig.label} · ${member.trialId}`}
        icon={<TeamIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[...breadcrumbs, { label: member.name }]}
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
              onClick={() => router.push('/researcher/clinical-trials/team')}
              sx={{ borderColor: 'white', color: 'white', '&:hover': { borderColor: 'rgba(255,255,255,0.8)', bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              All Team Members
            </Button>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              sx={{ bgcolor: 'white', color: '#8b6cbc', fontWeight: 700, '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
            >
              Edit Details
            </Button>
          </Stack>
        }
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Profile summary */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.08)' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'flex-start' }}>
            <Avatar sx={{ width: 72, height: 72, bgcolor: roleConfig.color, fontSize: '1.75rem', fontWeight: 700 }}>
              {member.name.split(' ').slice(-1)[0].charAt(0)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                <Chip label={roleConfig.label} sx={{ bgcolor: roleConfig.color, color: 'white', fontWeight: 600 }} />
                <Chip
                  icon={member.gcpCertified ? <CertifiedIcon /> : <WarningIcon />}
                  label={member.gcpCertified ? 'GCP Certified' : 'GCP Required'}
                  color={member.gcpCertified ? 'success' : 'warning'}
                  variant={member.gcpCertified ? 'filled' : 'outlined'}
                  sx={{ fontWeight: 600 }}
                />
                <Chip
                  icon={member.delegationLog ? <ApprovedIcon /> : <PendingIcon />}
                  label={member.delegationLog ? 'Delegation Complete' : 'Delegation Pending'}
                  color={member.delegationLog ? 'success' : 'warning'}
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              </Box>
              <Stack spacing={0.75}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon sx={{ fontSize: 16, color: '#8b6cbc' }} />
                  <Typography variant="body2">{member.email}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon sx={{ fontSize: 16, color: '#8b6cbc' }} />
                  <Typography variant="body2">{member.phone}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon sx={{ fontSize: 16, color: '#8b6cbc' }} />
                  <Typography variant="body2">{member.department}</Typography>
                </Box>
              </Stack>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <DetailField label="Assigned Trial" value={member.trialId} />
              <DetailField label="Study Site" value={member.site} />
              <Box>
                <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600, textTransform: 'uppercase' }}>
                  Assigned Date
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <CalendarIcon sx={{ fontSize: 16, color: '#8b6cbc' }} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {format(new Date(member.assignedDate), 'MMM dd, yyyy')}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Stats cards */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          {[
            {
              label: 'GCP Status',
              value: certStatus.label,
              sub: member.gcpCertified && certDaysLeft !== null ? `${certDaysLeft} days remaining` : 'Certification required',
              icon: <CertifiedIcon sx={{ color: 'white', opacity: 0.9 }} />,
            },
            {
              label: 'Delegation Log',
              value: member.delegationLog ? 'Complete' : 'Pending',
              sub: member.delegationDate ? `Signed ${format(new Date(member.delegationDate), 'MMM dd, yyyy')}` : 'Not yet signed',
              icon: <DelegationIcon sx={{ color: 'white', opacity: 0.9 }} />,
            },
            {
              label: 'Delegated Tasks',
              value: member.delegatedTasks.filter((t) => t.authorized).length,
              sub: `of ${member.delegatedTasks.length} task categories`,
              icon: <DelegationIcon sx={{ color: 'white', opacity: 0.9 }} />,
            },
            {
              label: 'Training Records',
              value: member.trainingHistory.length,
              sub: 'Completed courses',
              icon: <TrainingIcon sx={{ color: 'white', opacity: 0.9 }} />,
            },
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
            <Tab label="Overview" icon={<PersonIcon fontSize="small" />} iconPosition="start" />
            <Tab label="GCP Certification" icon={<CertifiedIcon fontSize="small" />} iconPosition="start" />
            <Tab label="Delegation Log" icon={<DelegationIcon fontSize="small" />} iconPosition="start" />
            <Tab label="Training History" icon={<TrainingIcon fontSize="small" />} iconPosition="start" />
            <Tab label="Documents" icon={<DocumentIcon fontSize="small" />} iconPosition="start" />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {/* Overview */}
            {activeTab === 0 && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#8b6cbc', mb: 2 }}>Personal Information</Typography>
                  <Stack spacing={2.5}>
                    <DetailField label="Full Name" value={member.name} />
                    <DetailField label="Email" value={member.email} />
                    <DetailField label="Phone" value={member.phone} />
                    <DetailField label="Department" value={member.department} />
                    <DetailField label="ORCID" value={member.orcid || 'Not linked'} />
                    <DetailField label="Member Status" value={member.status} />
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#8b6cbc', mb: 2 }}>Trial Assignment</Typography>
                  <Stack spacing={2.5}>
                    <DetailField label="Trial ID" value={member.trialId} />
                    <DetailField label="Trial Title" value={member.trialTitle} />
                    <DetailField label="Study Site" value={member.site} />
                    <DetailField label="Role" value={roleConfig.label} />
                    <DetailField label="Assigned Date" value={format(new Date(member.assignedDate), 'MMMM dd, yyyy')} />
                  </Stack>
                  <Button
                    variant="outlined"
                    startIcon={<ScienceIcon />}
                    onClick={() => router.push(`/researcher/clinical-trials/intake/view/${member.trialIntakeId}`)}
                    sx={{ mt: 3, borderColor: '#8b6cbc', color: '#8b6cbc', textTransform: 'none', fontWeight: 600 }}
                  >
                    View Trial Details
                  </Button>
                </Grid>
              </Grid>
            )}

            {/* GCP Certification */}
            {activeTab === 1 && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack spacing={2.5}>
                    <DetailField label="Certification Status" value={certStatus.label} />
                    <DetailField label="Training Provider" value={member.gcpProvider || '—'} />
                    <DetailField label="Certificate ID" value={member.gcpCertificateId || '—'} />
                    <DetailField label="Certification Date" value={member.gcpCertificationDate ? format(new Date(member.gcpCertificationDate), 'MMM dd, yyyy') : '—'} />
                    <DetailField label="Expiry Date" value={member.certificationExpiry ? format(new Date(member.certificationExpiry), 'MMM dd, yyyy') : '—'} />
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: 'rgba(139,108,188,0.04)' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#8b6cbc', mb: 2 }}>
                      Certification Validity
                    </Typography>
                    {member.gcpCertified && member.certificationExpiry ? (
                      <>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {certDaysLeft > 0 ? `${certDaysLeft} days until expiry` : 'Certificate expired'}
                          </Typography>
                          <Chip label={certStatus.label} color={certStatus.chipColor} size="small" sx={{ fontWeight: 600 }} />
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.max(0, Math.min(100, (certDaysLeft / 730) * 100))}
                          sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(139,108,188,0.15)', '& .MuiLinearProgress-bar': { bgcolor: certStatus.color, borderRadius: 4 } }}
                        />
                        {certDaysLeft <= 90 && certDaysLeft > 0 && (
                          <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                            GCP certification expires within 90 days. Schedule refresher training.
                          </Alert>
                        )}
                      </>
                    ) : (
                      <Alert severity="error" sx={{ borderRadius: 2 }}>
                        GCP certification is required before delegation of authority can be completed.
                      </Alert>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            )}

            {/* Delegation Log */}
            {activeTab === 2 && (
              <Box>
                {member.delegatedTasks.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <DelegationIcon sx={{ fontSize: 48, color: '#cbd5e0', mb: 2 }} />
                    <Typography color="text.secondary">No delegation log entries yet.</Typography>
                    <Button variant="outlined" startIcon={<DelegationIcon />} sx={{ mt: 2, borderColor: '#8b6cbc', color: '#8b6cbc' }}>
                      Create Delegation Log
                    </Button>
                  </Box>
                ) : (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Delegation signed on {member.delegationDate ? format(new Date(member.delegationDate), 'MMMM dd, yyyy') : '—'}
                      </Typography>
                      <Chip
                        icon={member.delegationLog ? <ApprovedIcon /> : <PendingIcon />}
                        label={member.delegationLog ? 'Log Complete' : 'Incomplete'}
                        color={member.delegationLog ? 'success' : 'warning'}
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                    <List disablePadding>
                      {member.delegatedTasks.map((task, index) => (
                        <React.Fragment key={task.task}>
                          {index > 0 && <Divider />}
                          <ListItem sx={{ px: 0, py: 1.5 }}>
                            <ListItemIcon sx={{ minWidth: 40 }}>
                              {task.authorized
                                ? <ApprovedIcon sx={{ color: '#4caf50' }} />
                                : <PendingIcon sx={{ color: '#9e9e9e' }} />}
                            </ListItemIcon>
                            <ListItemText
                              primary={task.task}
                              secondary={task.date ? `Authorized ${format(new Date(task.date), 'MMM dd, yyyy')}` : 'Not authorized'}
                              primaryTypographyProps={{ fontWeight: 600 }}
                            />
                            <Chip
                              label={task.authorized ? 'Authorized' : 'Not Authorized'}
                              size="small"
                              color={task.authorized ? 'success' : 'default'}
                              variant="outlined"
                            />
                          </ListItem>
                        </React.Fragment>
                      ))}
                    </List>
                  </>
                )}
              </Box>
            )}

            {/* Training History */}
            {activeTab === 3 && (
              <Box>
                {member.trainingHistory.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <TrainingIcon sx={{ fontSize: 48, color: '#cbd5e0', mb: 2 }} />
                    <Typography color="text.secondary">No training records found.</Typography>
                  </Box>
                ) : (
                  <List disablePadding>
                    {member.trainingHistory.map((training, index) => {
                      const trainingCert = getCertStatus(training.expiryAt);
                      return (
                        <React.Fragment key={training.title}>
                          {index > 0 && <Divider />}
                          <ListItem sx={{ px: 0, py: 1.5 }}>
                            <ListItemIcon><TrainingIcon sx={{ color: '#8b6cbc' }} /></ListItemIcon>
                            <ListItemText
                              primary={training.title}
                              secondary={`${training.provider} · Completed ${format(new Date(training.completedAt), 'MMM dd, yyyy')} · Expires ${format(new Date(training.expiryAt), 'MMM dd, yyyy')}`}
                              primaryTypographyProps={{ fontWeight: 600 }}
                            />
                            <Chip label={trainingCert.label} size="small" color={trainingCert.chipColor} variant="outlined" />
                          </ListItem>
                        </React.Fragment>
                      );
                    })}
                  </List>
                )}
              </Box>
            )}

            {/* Documents */}
            {activeTab === 4 && (
              <Box>
                {member.documents.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <DocumentIcon sx={{ fontSize: 48, color: '#cbd5e0', mb: 2 }} />
                    <Typography color="text.secondary">No documents uploaded yet.</Typography>
                    <Button variant="outlined" startIcon={<AttachFileIcon />} sx={{ mt: 2, borderColor: '#8b6cbc', color: '#8b6cbc' }}>
                      Upload Document
                    </Button>
                  </Box>
                ) : (
                  <List disablePadding>
                    {member.documents.map((doc, index) => (
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
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
