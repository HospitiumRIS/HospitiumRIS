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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Shield as EthicsIcon,
  Person as PersonIcon,
  Science as ScienceIcon,
  Groups as GroupsIcon,
  Security as SecurityIcon,
  Assessment as RiskIcon,
  Description as DocIcon,
  CheckCircle as ApprovedIcon,
  Schedule as PendingIcon,
  Cancel as RejectedIcon,
  Warning as WarningIcon,
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
  Assignment as AssignmentIcon,
  AttachFile as AttachFileIcon,
  InsertDriveFile as FileIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import PageHeader from '../../../../../../components/common/PageHeader';
import { useAuth } from '../../../../../../components/AuthProvider';

const statusColors = {
  DRAFT: '#9e9e9e',
  SUBMITTED: '#2196f3',
  UNDER_REVIEW: '#ff9800',
  APPROVED: '#4caf50',
  CONDITIONAL_APPROVAL: '#8bc34a',
  REJECTED: '#f44336',
  REVISION_REQUESTED: '#ff5722',
  WITHDRAWN: '#607d8b',
  EXPIRED: '#795548',
};

const statusIcons = {
  DRAFT: <EditIcon />,
  SUBMITTED: <PendingIcon />,
  UNDER_REVIEW: <WarningIcon />,
  APPROVED: <ApprovedIcon />,
  CONDITIONAL_APPROVAL: <ApprovedIcon />,
  REJECTED: <RejectedIcon />,
  REVISION_REQUESTED: <WarningIcon />,
  WITHDRAWN: <RejectedIcon />,
  EXPIRED: <WarningIcon />,
};

const riskLevelColors = {
  MINIMAL: '#4caf50',
  LOW: '#8bc34a',
  MODERATE: '#ff9800',
  HIGH: '#f44336',
};

export default function ViewEthicsApplicationPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (params.id) {
      fetchApplication();
    }
  }, [params.id]);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ethics/applications/${params.id}`);
      const data = await response.json();
      
      if (data.success) {
        setApplication(data.application);
      } else {
        setError(data.error || 'Failed to fetch application');
      }
    } catch (error) {
      console.error('Error fetching ethics application:', error);
      setError('An error occurred while fetching the application');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/researcher/ethics/applications/edit/${params.id}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box>
        <PageHeader
          title="Ethics Application"
          description="View ethics application details"
          icon={<EthicsIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/researcher' },
            { label: 'Ethics', path: '/researcher/ethics' },
            { label: 'Applications', path: '/researcher/ethics/applications' },
          ]}
        />
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center',
            py: 8,
            bgcolor: 'white',
            borderRadius: 2,
            border: '1px solid rgba(0, 0, 0, 0.12)'
          }}>
            <CircularProgress sx={{ color: '#8b6cbc' }} />
            <Typography sx={{ mt: 2, color: '#718096' }}>Loading application...</Typography>
          </Box>
        </Container>
      </Box>
    );
  }

  if (error || !application) {
    return (
      <Box>
        <PageHeader
          title="Ethics Application"
          description="View ethics application details"
          icon={<EthicsIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/researcher' },
            { label: 'Ethics', path: '/researcher/ethics' },
            { label: 'Applications', path: '/researcher/ethics/applications' },
          ]}
        />
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error || 'Application not found'}
          </Alert>
          <Button
            startIcon={<BackIcon />}
            onClick={() => router.push('/researcher/ethics/applications')}
            sx={{ mt: 2, color: '#8b6cbc' }}
          >
            Back to Applications
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={application.title}
        description="Ethics Application Details"
        icon={<EthicsIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/researcher' },
          { label: 'Ethics', path: '/researcher/ethics' },
          { label: 'Applications', path: '/researcher/ethics/applications' },
        ]}
        actionButton={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Print Application">
              <IconButton
                onClick={handlePrint}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' },
                }}
              >
                <PrintIcon />
              </IconButton>
            </Tooltip>
            {application.status === 'DRAFT' && (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEdit}
                sx={{ 
                  bgcolor: 'white',
                  color: '#8b6cbc',
                  boxShadow: '0 4px 12px rgba(255, 255, 255, 0.3)',
                  '&:hover': { 
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    boxShadow: '0 6px 16px rgba(255, 255, 255, 0.4)',
                  }
                }}
              >
                Edit Application
              </Button>
            )}
          </Box>
        }
      />

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => router.push('/researcher/ethics/applications')}
          sx={{ 
            mb: 3, 
            color: '#8b6cbc',
            '&:hover': { bgcolor: 'rgba(139, 108, 188, 0.04)' }
          }}
        >
          Back to Applications
        </Button>

        {/* Status and Reference Information */}
        <Paper sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(0, 0, 0, 0.08)'
        }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2" sx={{ color: '#718096', fontWeight: 500 }}>
                Application Status
              </Typography>
              <Chip
                icon={statusIcons[application.status]}
                label={application.status.replace(/_/g, ' ')}
                sx={{
                  bgcolor: statusColors[application.status],
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  height: 32,
                  px: 1,
                }}
              />
            </Box>

            {application.referenceNumber && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" sx={{ color: '#718096', fontWeight: 500 }}>
                  Reference Number
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 600, color: '#2D3748' }}>
                  {application.referenceNumber}
                </Typography>
              </Box>
            )}

            {application.submittedDate && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" sx={{ color: '#718096', fontWeight: 500 }}>
                  Submitted Date
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarIcon sx={{ fontSize: 18, color: '#8b6cbc' }} />
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#2D3748' }}>
                    {format(new Date(application.submittedDate), 'MMM dd, yyyy')}
                  </Typography>
                </Box>
              </Box>
            )}

            {application.approvalDate && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" sx={{ color: '#718096', fontWeight: 500 }}>
                  Approval Date
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarIcon sx={{ fontSize: 18, color: '#4caf50' }} />
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#2D3748' }}>
                    {format(new Date(application.approvalDate), 'MMM dd, yyyy')}
                  </Typography>
                </Box>
              </Box>
            )}

            {application.expiryDate && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" sx={{ color: '#718096', fontWeight: 500 }}>
                  Expiry Date
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarIcon sx={{ fontSize: 18, color: '#f44336' }} />
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#2D3748' }}>
                    {format(new Date(application.expiryDate), 'MMM dd, yyyy')}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Paper>

        {/* Tabs Navigation */}
        <Paper sx={{ 
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          overflow: 'hidden'
        }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
              bgcolor: 'rgba(139, 108, 188, 0.02)',
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                color: '#718096',
                '&.Mui-selected': {
                  color: '#8b6cbc',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#8b6cbc',
                height: 3,
              },
            }}
          >
            <Tab icon={<AssignmentIcon />} iconPosition="start" label="Overview" />
            <Tab icon={<PersonIcon />} iconPosition="start" label="Investigator" />
            <Tab icon={<GroupsIcon />} iconPosition="start" label="Participants" />
            <Tab icon={<RiskIcon />} iconPosition="start" label="Risk Assessment" />
            <Tab icon={<DocIcon />} iconPosition="start" label="Consent" />
            <Tab icon={<SecurityIcon />} iconPosition="start" label="Data Protection" />
            <Tab icon={<AttachFileIcon />} iconPosition="start" label="Documents" />
            <Tab icon={<AssessmentIcon />} iconPosition="start" label="Reviews" />
          </Tabs>

          {/* Tab Content */}
          <Box sx={{ p: 3 }}>
            {/* Tab 0: Project Overview */}
            {activeTab === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{ 
                    bgcolor: 'rgba(139, 108, 188, 0.1)', 
                    p: 1.5, 
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <AssignmentIcon sx={{ color: '#8b6cbc', fontSize: 28 }} />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#2D3748' }}>
                    Project Overview
                  </Typography>
                </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#718096', fontWeight: 600, mb: 1 }}>
                  Research Type
                </Typography>
                <Chip 
                  label={application.researchType} 
                  sx={{ 
                    bgcolor: 'rgba(139, 108, 188, 0.1)', 
                    color: '#8b6cbc',
                    fontWeight: 600
                  }} 
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ color: '#718096', fontWeight: 600, mb: 1 }}>
                  Research Summary
                </Typography>
                <Typography variant="body1" sx={{ color: '#2D3748', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {application.researchSummary}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ color: '#718096', fontWeight: 600, mb: 1 }}>
                  Research Objectives
                </Typography>
                <Typography variant="body1" sx={{ color: '#2D3748', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {application.researchObjectives}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ color: '#718096', fontWeight: 600, mb: 1 }}>
                  Methodology
                </Typography>
                <Typography variant="body1" sx={{ color: '#2D3748', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {application.methodology}
                </Typography>
              </Box>

              {application.studyDuration && (
                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#718096', fontWeight: 600, mb: 1 }}>
                      Study Duration
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#2D3748', fontWeight: 600 }}>
                      {application.studyDuration}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
              </Box>
            )}

            {/* Tab 1: Principal Investigator */}
            {activeTab === 1 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{ 
                    bgcolor: 'rgba(139, 108, 188, 0.1)', 
                    p: 1.5, 
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <PersonIcon sx={{ color: '#8b6cbc', fontSize: 28 }} />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#2D3748' }}>
                    Principal Investigator
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  <Box sx={{ flex: '1 1 300px' }}>
                    <Typography variant="subtitle2" sx={{ color: '#718096', fontWeight: 600, mb: 1 }}>
                      Name
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#2D3748', fontWeight: 600 }}>
                      {application.principalInvestigator}
                    </Typography>
                  </Box>

                  <Box sx={{ flex: '1 1 300px' }}>
                    <Typography variant="subtitle2" sx={{ color: '#718096', fontWeight: 600, mb: 1 }}>
                      Department
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#2D3748' }}>
                      {application.department}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Tab 2: Participants */}
            {activeTab === 2 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{ 
                    bgcolor: 'rgba(139, 108, 188, 0.1)', 
                    p: 1.5, 
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <GroupsIcon sx={{ color: '#8b6cbc', fontSize: 28 }} />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#2D3748' }}>
                    Participants
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  <Box sx={{ flex: '1 1 300px' }}>
                    <Typography variant="subtitle2" sx={{ color: '#718096', fontWeight: 600, mb: 1 }}>
                      Participant Population
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#2D3748', lineHeight: 1.7 }}>
                      {application.participantPopulation}
                    </Typography>
                  </Box>

                  {application.participantCount && (
                    <Box sx={{ flex: '1 1 200px' }}>
                      <Typography variant="subtitle2" sx={{ color: '#718096', fontWeight: 600, mb: 1 }}>
                        Sample Size
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#8b6cbc', fontWeight: 700 }}>
                        {application.participantCount}
                      </Typography>
                    </Box>
                  )}

                  {application.ageRange && (
                    <Box sx={{ flex: '1 1 200px' }}>
                      <Typography variant="subtitle2" sx={{ color: '#718096', fontWeight: 600, mb: 1 }}>
                        Age Range
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#2D3748', fontWeight: 600 }}>
                        {application.ageRange}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {application.inclusionCriteria && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#718096', fontWeight: 600, mb: 1 }}>
                      Inclusion Criteria
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#2D3748', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                      {application.inclusionCriteria}
                    </Typography>
                  </Box>
                )}

                {application.exclusionCriteria && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#718096', fontWeight: 600, mb: 1 }}>
                      Exclusion Criteria
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#2D3748', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                      {application.exclusionCriteria}
                    </Typography>
                  </Box>
                )}

                {application.recruitmentMethod && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#718096', fontWeight: 600, mb: 1 }}>
                      Recruitment Method
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#2D3748', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                      {application.recruitmentMethod}
                    </Typography>
                  </Box>
                )}

                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#718096', fontWeight: 600, mb: 1 }}>
                    Vulnerable Populations
                  </Typography>
                  <Chip 
                    label={application.vulnerablePopulations ? 'Yes' : 'No'} 
                    sx={{ 
                      bgcolor: application.vulnerablePopulations ? 'rgba(255, 152, 0, 0.1)' : 'rgba(76, 175, 80, 0.1)',
                      color: application.vulnerablePopulations ? '#ff9800' : '#4caf50',
                      fontWeight: 600
                    }} 
                  />
                </Box>

                {application.vulnerablePopulations && application.vulnerablePopulationDesc && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#718096', fontWeight: 600, mb: 1 }}>
                      Vulnerable Population Description
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#2D3748', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                      {application.vulnerablePopulationDesc}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Tab 3: Risk Assessment */}
            {activeTab === 3 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{ 
                    bgcolor: 'rgba(139, 108, 188, 0.1)', 
                    p: 1.5, 
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <RiskIcon sx={{ color: '#8b6cbc', fontSize: 28 }} />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#2D3748' }}>
                    Risk Assessment
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#718096', fontWeight: 600, mb: 1 }}>
                    Risk Level
                  </Typography>
                  <Chip 
                    label={application.riskLevel} 
                    sx={{ 
                      bgcolor: riskLevelColors[application.riskLevel],
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }} 
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#718096', fontWeight: 600, mb: 1 }}>
                    Potential Risks
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#2D3748', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {application.potentialRisks}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#718096', fontWeight: 600, mb: 1 }}>
                    Risk Mitigation Strategies
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#2D3748', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {application.riskMitigation}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#718096', fontWeight: 600, mb: 1 }}>
                    Potential Benefits
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#2D3748', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {application.potentialBenefits}
                  </Typography>
                </Box>

                {application.riskBenefitRatio && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#718096', fontWeight: 600, mb: 1 }}>
                      Risk-Benefit Analysis
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#2D3748', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                      {application.riskBenefitRatio}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Tab 4: Consent Process */}
            {activeTab === 4 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{ 
                    bgcolor: 'rgba(139, 108, 188, 0.1)', 
                    p: 1.5, 
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <DocIcon sx={{ color: '#8b6cbc', fontSize: 28 }} />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#2D3748' }}>
                    Consent Process
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#718096', fontWeight: 600, mb: 1 }}>
                    Consent Process Description
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#2D3748', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {application.consentProcess}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#718096', fontWeight: 600, mb: 1 }}>
                      Consent Form Attached
                    </Typography>
                    <Chip 
                      label={application.consentFormAttached ? 'Yes' : 'No'} 
                      sx={{ 
                        bgcolor: application.consentFormAttached ? 'rgba(76, 175, 80, 0.1)' : 'rgba(158, 158, 158, 0.1)',
                        color: application.consentFormAttached ? '#4caf50' : '#9e9e9e',
                        fontWeight: 600
                      }} 
                    />
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#718096', fontWeight: 600, mb: 1 }}>
                      Information Sheet Attached
                    </Typography>
                    <Chip 
                      label={application.informationSheetAttached ? 'Yes' : 'No'} 
                      sx={{ 
                        bgcolor: application.informationSheetAttached ? 'rgba(76, 175, 80, 0.1)' : 'rgba(158, 158, 158, 0.1)',
                        color: application.informationSheetAttached ? '#4caf50' : '#9e9e9e',
                        fontWeight: 600
                      }} 
                    />
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#718096', fontWeight: 600, mb: 1 }}>
                      Consent Waiver Requested
                    </Typography>
                    <Chip 
                      label={application.consentWaiverRequested ? 'Yes' : 'No'} 
                      sx={{ 
                        bgcolor: application.consentWaiverRequested ? 'rgba(255, 152, 0, 0.1)' : 'rgba(76, 175, 80, 0.1)',
                        color: application.consentWaiverRequested ? '#ff9800' : '#4caf50',
                        fontWeight: 600
                      }} 
                    />
                  </Box>
                </Box>

                {application.consentWaiverRequested && application.consentWaiverJustification && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#718096', fontWeight: 600, mb: 1 }}>
                      Consent Waiver Justification
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#2D3748', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                      {application.consentWaiverJustification}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Tab 5: Data Protection */}
            {activeTab === 5 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{ 
                    bgcolor: 'rgba(139, 108, 188, 0.1)', 
                    p: 1.5, 
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <SecurityIcon sx={{ color: '#8b6cbc', fontSize: 28 }} />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#2D3748' }}>
                    Data Protection & Privacy
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#718096', fontWeight: 600, mb: 1 }}>
                    Data Collection Methods
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#2D3748', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {application.dataCollectionMethods}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#718096', fontWeight: 600, mb: 1 }}>
                    Data Storage Methods
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#2D3748', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {application.dataStorageMethods}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#718096', fontWeight: 600, mb: 1 }}>
                    Data Security Measures
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#2D3748', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {application.dataSecurityMeasures}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {application.dataRetentionPeriod && (
                    <Box sx={{ flex: '1 1 250px' }}>
                      <Typography variant="subtitle2" sx={{ color: '#718096', fontWeight: 600, mb: 1 }}>
                        Data Retention Period
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#2D3748', fontWeight: 600 }}>
                        {application.dataRetentionPeriod}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ flex: '1 1 250px' }}>
                    <Typography variant="subtitle2" sx={{ color: '#718096', fontWeight: 600, mb: 1 }}>
                      Data Anonymization
                    </Typography>
                    <Chip 
                      label={application.dataAnonymization ? 'Yes' : 'No'} 
                      sx={{ 
                        bgcolor: application.dataAnonymization ? 'rgba(76, 175, 80, 0.1)' : 'rgba(158, 158, 158, 0.1)',
                        color: application.dataAnonymization ? '#4caf50' : '#9e9e9e',
                        fontWeight: 600
                      }} 
                    />
                  </Box>
                </Box>

                {application.dataSharingPlans && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#718096', fontWeight: 600, mb: 1 }}>
                      Data Sharing Plans
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#2D3748', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                      {application.dataSharingPlans}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Tab 6: Documents */}
            {activeTab === 6 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{ 
                    bgcolor: 'rgba(139, 108, 188, 0.1)', 
                    p: 1.5, 
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <AttachFileIcon sx={{ color: '#8b6cbc', fontSize: 28 }} />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#2D3748' }}>
                    Uploaded Documents
                  </Typography>
                </Box>

                {application.documents && application.documents.length > 0 ? (
                  <List sx={{ bgcolor: 'rgba(139, 108, 188, 0.02)', borderRadius: 2, p: 2 }}>
                    {application.documents.map((doc, index) => (
                      <ListItem
                        key={index}
                        sx={{
                          mb: 1,
                          bgcolor: 'white',
                          borderRadius: 1,
                          border: '1px solid rgba(0, 0, 0, 0.08)',
                          '&:hover': {
                            bgcolor: 'rgba(139, 108, 188, 0.04)',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
                          },
                        }}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            onClick={() => window.open(doc.url || doc.path, '_blank')}
                            sx={{ color: '#8b6cbc' }}
                          >
                            <DownloadIcon />
                          </IconButton>
                        }
                      >
                        <ListItemIcon>
                          <FileIcon sx={{ color: '#8b6cbc' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#2D3748' }}>
                              {doc.name || doc.filename || `Document ${index + 1}`}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                              {doc.type && (
                                <Chip 
                                  label={doc.type} 
                                  size="small"
                                  sx={{ 
                                    height: 20,
                                    fontSize: '0.7rem',
                                    bgcolor: 'rgba(139, 108, 188, 0.1)',
                                    color: '#8b6cbc'
                                  }}
                                />
                              )}
                              {doc.size && (
                                <Typography variant="caption" sx={{ color: '#718096' }}>
                                  {(doc.size / 1024).toFixed(2)} KB
                                </Typography>
                              )}
                              {doc.uploadedAt && (
                                <Typography variant="caption" sx={{ color: '#718096' }}>
                                  Uploaded: {format(new Date(doc.uploadedAt), 'MMM dd, yyyy')}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Paper sx={{ 
                    p: 4, 
                    textAlign: 'center',
                    bgcolor: 'rgba(139, 108, 188, 0.02)',
                    border: '2px dashed rgba(139, 108, 188, 0.3)',
                    borderRadius: 2
                  }}>
                    <FileIcon sx={{ fontSize: 48, color: '#8b6cbc', opacity: 0.5, mb: 2 }} />
                    <Typography variant="body1" sx={{ color: '#718096' }}>
                      No documents uploaded yet
                    </Typography>
                  </Paper>
                )}

                {/* Approval Conditions (if applicable) */}
                {application.status === 'CONDITIONAL_APPROVAL' && application.approvalConditions && (
                  <Paper sx={{ 
                    p: 3, 
                    borderRadius: 2,
                    border: '2px solid #ff9800',
                    bgcolor: 'rgba(255, 152, 0, 0.02)',
                    mt: 2
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <WarningIcon sx={{ color: '#ff9800', fontSize: 28 }} />
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#2D3748' }}>
                        Approval Conditions
                      </Typography>
                    </Box>
                    
                    <Typography variant="body1" sx={{ color: '#2D3748', lineHeight: 1.7, whiteSpace: 'pre-wrap', mb: 2 }}>
                      {application.approvalConditions}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: '#718096', fontWeight: 600 }}>
                        Conditions Met:
                      </Typography>
                      <Chip 
                        label={application.conditionsMet ? 'Yes' : 'No'} 
                        sx={{ 
                          bgcolor: application.conditionsMet ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 152, 0, 0.1)',
                          color: application.conditionsMet ? '#4caf50' : '#ff9800',
                          fontWeight: 600
                        }} 
                      />
                    </Box>
                  </Paper>
                )}
              </Box>
            )}

            {/* Tab 7: Reviews */}
            {activeTab === 7 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{ 
                    bgcolor: 'rgba(139, 108, 188, 0.1)', 
                    p: 1.5, 
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <AssessmentIcon sx={{ color: '#8b6cbc', fontSize: 28 }} />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#2D3748' }}>
                    Ethics Reviews
                  </Typography>
                </Box>

                {application.reviews && application.reviews.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {application.reviews.map((review, index) => (
                      <Paper 
                        key={review.id}
                        sx={{ 
                          p: 3, 
                          bgcolor: 'rgba(139, 108, 188, 0.02)',
                          borderRadius: 2,
                          border: '1px solid rgba(139, 108, 188, 0.1)'
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2D3748' }}>
                              {review.reviewerName}
                            </Typography>
                            {review.reviewerRole && (
                              <Typography variant="caption" sx={{ color: '#718096' }}>
                                {review.reviewerRole}
                              </Typography>
                            )}
                          </Box>
                          <Chip 
                            label={review.decision.replace(/_/g, ' ')} 
                            size="small"
                            sx={{ 
                              bgcolor: statusColors[review.decision] || '#9e9e9e',
                              color: 'white',
                              fontWeight: 600
                            }} 
                          />
                        </Box>
                        <Typography variant="body2" sx={{ color: '#2D3748', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                          {review.overallComments}
                        </Typography>
                        {review.recommendations && (
                          <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(139, 108, 188, 0.05)', borderRadius: 1 }}>
                            <Typography variant="subtitle2" sx={{ color: '#718096', fontWeight: 600, mb: 1 }}>
                              Recommendations
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#2D3748', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                              {review.recommendations}
                            </Typography>
                          </Box>
                        )}
                      </Paper>
                    ))}
                  </Box>
                ) : (
                  <Paper sx={{ 
                    p: 4, 
                    textAlign: 'center',
                    bgcolor: 'rgba(139, 108, 188, 0.02)',
                    border: '2px dashed rgba(139, 108, 188, 0.3)',
                    borderRadius: 2
                  }}>
                    <AssessmentIcon sx={{ fontSize: 48, color: '#8b6cbc', opacity: 0.5, mb: 2 }} />
                    <Typography variant="body1" sx={{ color: '#718096' }}>
                      No reviews available yet
                    </Typography>
                  </Paper>
                )}

                {/* Linked Proposals */}
                {application.linkedProposals && application.linkedProposals.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#2D3748', mb: 2 }}>
                      Linked Proposals
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {application.linkedProposals.map((link) => (
                        <Paper 
                          key={link.id}
                          sx={{ 
                            p: 2, 
                            bgcolor: 'rgba(139, 108, 188, 0.02)',
                            borderRadius: 1,
                            border: '1px solid rgba(139, 108, 188, 0.1)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 2
                          }}
                        >
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2D3748' }}>
                              {link.proposal.title}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#718096' }}>
                              PI: {link.proposal.principalInvestigator}
                            </Typography>
                          </Box>
                          <Chip 
                            label={link.proposal.status} 
                            size="small"
                            sx={{ 
                              bgcolor: 'rgba(139, 108, 188, 0.1)',
                              color: '#8b6cbc',
                              fontWeight: 600
                            }} 
                          />
                        </Paper>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
} 
