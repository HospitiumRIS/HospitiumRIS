'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Paper,
  Chip,
  Button,
  Stack,
  Divider,
  Alert,
  CircularProgress,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as BudgetIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Assignment as ProjectIcon,
  Timeline as TimelineIcon,
  Description as DescriptionIcon,
  Group as TeamIcon,
  Business as InstitutionIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Flag as MilestoneIcon,
  LocalShipping as DeliverableIcon
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import { useAuth } from '@/components/AuthProvider';

const ProjectDetailPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (params.id) {
      loadProject();
    }
  }, [params.id]);

  const loadProject = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/proposals/${params.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch project details');
      }

      const data = await response.json();
      
      if (data.success && data.proposal) {
        setProject(data.proposal);
      } else {
        throw new Error(data.error || 'Project not found');
      }
    } catch (error) {
      console.error('Error loading project:', error);
      setError(error.message || 'Failed to load project details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/institution/projects');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const colors = {
      'DRAFT': '#9ca3af',
      'SUBMITTED': '#3b82f6',
      'UNDER_REVIEW': '#f59e0b',
      'APPROVED': '#10b981',
      'REJECTED': '#ef4444',
      'REQUIRES_AMENDMENT': '#f97316'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'DRAFT': 'Draft',
      'SUBMITTED': 'Submitted',
      'UNDER_REVIEW': 'Under Review',
      'APPROVED': 'Approved',
      'REJECTED': 'Rejected',
      'REQUIRES_AMENDMENT': 'Requires Amendment'
    };
    return labels[status] || status;
  };

  const calculateDuration = () => {
    if (!project.startDate || !project.endDate) return 'Not specified';
    const start = new Date(project.startDate);
    const end = new Date(project.endDate);
    const months = Math.round((end - start) / (1000 * 60 * 60 * 24 * 30));
    return `${months} months`;
  };

  if (loading) {
    return (
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Project Details"
          description="Loading project information..."
          icon={<ProjectIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Projects', path: '/institution/projects' },
            { label: 'Details' }
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

  if (error || !project) {
    return (
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Project Details"
          description="Error loading project"
          icon={<ProjectIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Projects', path: '/institution/projects' },
            { label: 'Details' }
          ]}
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
        />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 4 }}>
            {error || 'Project not found'}
          </Alert>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            Back to Projects
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title={project.title}
          description={`${(project.departments && project.departments[0]) || 'Research Project'} • ${project.principalInvestigator || 'Principal Investigator'}`}
          icon={<ProjectIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Projects', path: '/institution/projects' },
            { label: project.title }
          ]}
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
          actions={
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.5)',
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Back to Projects
            </Button>
          }
        />
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Key Information Cards */}
        <Box sx={{ 
          display: 'flex', 
          gap: 3, 
          mb: 4,
          flexWrap: 'wrap',
          '& > *': {
            flex: '1 1 calc(25% - 18px)',
            minWidth: '200px'
          }
        }}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <ScheduleIcon sx={{ color: '#8b6cbc', mr: 1, fontSize: 20 }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Status
              </Typography>
            </Box>
            <Chip
              label={getStatusLabel(project.status)}
              sx={{
                bgcolor: getStatusColor(project.status),
                color: 'white',
                fontWeight: 600,
                fontSize: '0.875rem'
              }}
            />
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <BudgetIcon sx={{ color: '#8b6cbc', mr: 1, fontSize: 20 }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Budget
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#2d3748' }}>
              {formatCurrency(project.totalBudgetAmount)}
            </Typography>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <CalendarIcon sx={{ color: '#8b6cbc', mr: 1, fontSize: 20 }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Duration
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
              {calculateDuration()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDate(project.startDate)} - {formatDate(project.endDate)}
            </Typography>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <PersonIcon sx={{ color: '#8b6cbc', mr: 1, fontSize: 20 }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Principal Investigator
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ fontWeight: 600, color: '#2d3748' }}>
              {project.principalInvestigator || 'Not specified'}
            </Typography>
          </Paper>
        </Box>

        {/* Main Content */}
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {/* Left Column */}
          <Box sx={{ flex: '1 1 65%', minWidth: '300px' }}>
            {/* Project Overview */}
            <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <DescriptionIcon sx={{ color: '#8b6cbc', mr: 1.5, fontSize: 24 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#2d3748' }}>
                    Project Overview
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                  {project.abstract || project.description || project.researchObjectives || 'No description available'}
                </Typography>
              </CardContent>
            </Card>

            {/* Research Objectives */}
            {project.researchObjectives && (
              <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ProjectIcon sx={{ color: '#8b6cbc', mr: 1.5, fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#2d3748' }}>
                      Research Objectives
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                    {project.researchObjectives}
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Methodology */}
            {project.methodology && (
              <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TimelineIcon sx={{ color: '#8b6cbc', mr: 1.5, fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#2d3748' }}>
                      Methodology
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                    {project.methodology}
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Milestones */}
            {project.milestones && project.milestones.length > 0 && (
              <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <MilestoneIcon sx={{ color: '#8b6cbc', mr: 1.5, fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#2d3748' }}>
                      Milestones
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <List sx={{ p: 0 }}>
                    {project.milestones.map((milestone, index) => (
                      <ListItem
                        key={index}
                        sx={{
                          border: '1px solid #e5e7eb',
                          borderRadius: 1.5,
                          mb: 1.5,
                          '&:last-child': { mb: 0 },
                          bgcolor: '#fafafa'
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2d3748' }}>
                              {milestone.title || milestone.description || `Milestone ${index + 1}`}
                            </Typography>
                          }
                          secondary={
                            milestone.targetDate && (
                              <Typography variant="caption" color="text.secondary">
                                Target: {formatDate(milestone.targetDate)}
                              </Typography>
                            )
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}
          </Box>

          {/* Right Column */}
          <Box sx={{ flex: '1 1 30%', minWidth: '300px' }}>
            {/* Project Details */}
            <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#2d3748', mb: 2 }}>
                  Project Details
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={2}>
                  {project.departments && project.departments.length > 0 && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                        Department(s)
                      </Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {project.departments.map((dept, idx) => (
                          <Chip key={idx} label={dept} size="small" sx={{ bgcolor: '#f3f4f6' }} />
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {project.researchAreas && project.researchAreas.length > 0 && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                        Research Area(s)
                      </Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {project.researchAreas.map((area, idx) => (
                          <Chip key={idx} label={area} size="small" sx={{ bgcolor: '#e0e7ff', color: '#4338ca' }} />
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {project.fundingSource && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                        Funding Source
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#2d3748' }}>
                        {project.fundingSource}
                      </Typography>
                    </Box>
                  )}

                  {project.fundingInstitution && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                        Funding Institution
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#2d3748' }}>
                        {project.fundingInstitution}
                      </Typography>
                    </Box>
                  )}

                  {project.grantNumber && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                        Grant Number
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#2d3748', fontFamily: 'monospace' }}>
                        {project.grantNumber}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* Team Members */}
            {project.coInvestigators && project.coInvestigators.length > 0 && (
              <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TeamIcon sx={{ color: '#8b6cbc', mr: 1.5, fontSize: 20 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#2d3748' }}>
                      Co-Investigators
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <List sx={{ p: 0 }}>
                    {project.coInvestigators.map((coInvestigator, index) => (
                      <ListItem key={index} sx={{ px: 0, py: 1 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <Avatar sx={{ bgcolor: '#8b6cbc', width: 32, height: 32, fontSize: '0.875rem' }}>
                            {coInvestigator.charAt(0)}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {coInvestigator}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}

            {/* Deliverables */}
            {project.deliverables && project.deliverables.length > 0 && (
              <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <DeliverableIcon sx={{ color: '#8b6cbc', mr: 1.5, fontSize: 20 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#2d3748' }}>
                      Deliverables
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <List sx={{ p: 0 }}>
                    {project.deliverables.map((deliverable, index) => (
                      <ListItem key={index} sx={{ px: 0, py: 1, alignItems: 'flex-start' }}>
                        <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>
                          <CheckCircleIcon sx={{ fontSize: 16, color: '#10b981' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ color: '#2d3748' }}>
                              {deliverable.title || deliverable.description || deliverable}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default ProjectDetailPage;
