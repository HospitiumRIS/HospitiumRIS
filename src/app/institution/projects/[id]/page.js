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
  ListItemIcon,
  Tooltip,
  Grid,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as BudgetIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as PendingCircleIcon,
  Schedule as ScheduleIcon,
  Assignment as ProjectIcon,
  Timeline as TimelineIcon,
  Description as DescriptionIcon,
  Group as TeamIcon,
  Flag as MilestoneIcon,
  LocalShipping as DeliverableIcon,
  Science as ResearchIcon,
  AccountBalance as FundingIcon,
  VerifiedUser as EthicsIcon,
  Send as SubmittedIcon,
  RateReview as ReviewIcon,
  Verified as ApprovedIcon,
  PlayCircle as ActiveIcon,
  FlagCircle as CompletedFlagIcon,
  ErrorOutline as AtRiskIcon,
  TrendingUp as ProgressIcon,
  Gavel as GrantIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import { useAuth } from '@/components/AuthProvider';

// --- Stage Pipeline (reused from projects list) ---
const STAGES = [
  { key: 'SUBMITTED',    label: 'Submitted',    icon: SubmittedIcon,     color: '#64748b' },
  { key: 'UNDER_REVIEW', label: 'Under Review',  icon: ReviewIcon,        color: '#f59e0b' },
  { key: 'APPROVED',     label: 'Approved',      icon: ApprovedIcon,      color: '#3b82f6' },
  { key: 'ACTIVE',       label: 'Active',        icon: ActiveIcon,        color: '#8b6cbc' },
  { key: 'COMPLETED',    label: 'Completed',     icon: CompletedFlagIcon, color: '#10b981' },
];

function getStageIndex(status) {
  if (status === 'COMPLETED') return 4;
  if (status === 'APPROVED') {
    // Will be overridden by caller when checking project vs proposal
    return 3; // active
  }
  if (status === 'UNDER_REVIEW') return 1;
  if (status === 'SUBMITTED') return 0;
  return 0;
}

function StagePipelineFull({ proposalStatus, projectStatus }) {
  // Map combined statuses to stage index
  let currentIndex = 0;
  if (projectStatus === 'COMPLETED') currentIndex = 4;
  else if (projectStatus === 'ONGOING' || projectStatus === 'DELAYED' || projectStatus === 'AT_RISK') currentIndex = 3;
  else if (proposalStatus === 'APPROVED') currentIndex = 2;
  else if (proposalStatus === 'UNDER_REVIEW') currentIndex = 1;

  const isDelayed = projectStatus === 'DELAYED' || projectStatus === 'AT_RISK';

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      {STAGES.map((stage, idx) => {
        const isCompleted = idx < currentIndex;
        const isCurrent = idx === currentIndex;
        const StageIcon = stage.icon;
        const stageColor = isCurrent && isDelayed ? '#ef4444'
          : isCompleted || isCurrent ? stage.color : '#d1d5db';

        return (
          <React.Fragment key={stage.key}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                bgcolor: isCompleted || isCurrent ? stageColor : '#f9fafb',
                border: `3px solid ${stageColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isCurrent ? `0 0 0 5px ${stageColor}22` : 'none',
                transition: 'all 0.2s',
              }}>
                <StageIcon sx={{ fontSize: 20, color: isCompleted || isCurrent ? 'white' : '#d1d5db' }} />
              </Box>
              <Typography sx={{
                fontSize: '0.72rem',
                fontWeight: isCurrent ? 800 : 500,
                color: isCompleted || isCurrent ? stageColor : '#9ca3af',
                whiteSpace: 'nowrap',
              }}>
                {isCurrent && isDelayed
                  ? (projectStatus === 'AT_RISK' ? 'At Risk' : 'Delayed')
                  : stage.label}
              </Typography>
            </Box>
            {idx < STAGES.length - 1 && (
              <Box sx={{
                flex: 1,
                height: 3,
                mx: 1,
                mb: 2.2,
                bgcolor: idx < currentIndex ? STAGES[Math.min(idx + 1, currentIndex)].color : '#e5e7eb',
                borderRadius: 2,
                transition: 'all 0.3s',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </Box>
  );
}

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

  // Compute derived values
  const milestones = project.milestones || [];
  const deliverables = project.deliverables || [];
  const completedMilestones = milestones.filter(m => m.completed).length;
  const milestoneProgress = milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : 0;

  // Determine project status for the stage pipeline
  const proposalStatus = project.status; // raw proposal status from API
  let projectStatus = 'PENDING_APPROVAL';
  if (proposalStatus === 'APPROVED') {
    const now = new Date();
    const endDate = project.endDate ? new Date(project.endDate) : null;
    if (endDate && now > endDate) projectStatus = 'COMPLETED';
    else projectStatus = 'ONGOING';
  }

  // Timeline progress
  const timelineProgress = (() => {
    if (!project.startDate || !project.endDate) return null;
    const start = new Date(project.startDate);
    const end = new Date(project.endDate);
    const now = new Date();
    const pct = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
    return Math.round(pct);
  })();

  const hasGrants = project.fundingSource || project.fundingInstitution || project.grantNumber || project.grantStartDate || project.grantEndDate || project.totalBudgetAmount;
  const hasEthics = project.ethicsApprovalStatus || project.ethicsApprovalReference || project.ethicsCommittee || project.consentProcedures || project.dataSecurityMeasures;

  return (
    <>
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title={project.title}
          description={`${(project.departments && project.departments[0]) || 'Research Project'} · PI: ${project.principalInvestigator || 'Unknown'}`}
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
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              Back to Projects
            </Button>
          }
        />
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>

        {/* ── Lifecycle Stage Banner ── */}
        <Paper sx={{ p: 3, mb: 4, borderRadius: 3, boxShadow: '0 2px 12px rgba(139,108,188,0.1)', border: '1px solid rgba(139,108,188,0.15)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#2d3748' }}>
              Project Lifecycle
            </Typography>
            <Chip
              label={getStatusLabel(project.status)}
              sx={{ bgcolor: getStatusColor(project.status), color: 'white', fontWeight: 700, fontSize: '0.75rem' }}
            />
          </Box>
          <StagePipelineFull proposalStatus={proposalStatus} projectStatus={projectStatus} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5 }}>
            <Typography variant="caption" sx={{ color: '#9ca3af' }}>
              Submitted: {formatDate(project.createdAt)}
            </Typography>
            {project.endDate && (
              <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                Expected completion: {formatDate(project.endDate)}
              </Typography>
            )}
          </Box>
        </Paper>

        {/* ── Key Stat Cards ── */}
        <Box sx={{ display: 'flex', gap: 2.5, mb: 4, flexWrap: 'wrap', '& > *': { flex: '1 1 calc(25% - 20px)', minWidth: 180 } }}>
          {/* Budget */}
          <Paper sx={{ p: 2.5, borderRadius: 2.5, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', borderTop: '3px solid #10b981' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <BudgetIcon sx={{ color: '#10b981', fontSize: 18 }} />
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Total Budget
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#059669' }}>
              {formatCurrency(project.totalBudgetAmount)}
            </Typography>
            {project.fundingSource && (
              <Typography variant="caption" sx={{ color: '#9ca3af' }}>via {project.fundingSource}</Typography>
            )}
          </Paper>

          {/* PI */}
          <Paper sx={{ p: 2.5, borderRadius: 2.5, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', borderTop: '3px solid #8b6cbc' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <PersonIcon sx={{ color: '#8b6cbc', fontSize: 18 }} />
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Principal Investigator
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: '#8b6cbc', fontSize: '0.875rem', fontWeight: 700 }}>
                {project.principalInvestigator?.charAt(0) || 'P'}
              </Avatar>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#2d3748' }}>
                {project.principalInvestigator || 'Not specified'}
              </Typography>
            </Box>
            {project.coInvestigators?.length > 0 && (
              <Typography variant="caption" sx={{ color: '#9ca3af', mt: 0.5, display: 'block' }}>
                + {project.coInvestigators.length} co-investigator{project.coInvestigators.length > 1 ? 's' : ''}
              </Typography>
            )}
          </Paper>

          {/* Timeline */}
          <Paper sx={{ p: 2.5, borderRadius: 2.5, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', borderTop: '3px solid #3b82f6' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CalendarIcon sx={{ color: '#3b82f6', fontSize: 18 }} />
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Timeline
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#2d3748', mb: 0.25 }}>
              {calculateDuration()}
            </Typography>
            <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block', mb: timelineProgress !== null ? 1 : 0 }}>
              {formatDate(project.startDate)} → {formatDate(project.endDate)}
            </Typography>
            {timelineProgress !== null && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>Time elapsed</Typography>
                  <Typography variant="caption" sx={{ color: '#3b82f6', fontWeight: 700 }}>{timelineProgress}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={timelineProgress}
                  sx={{ height: 5, borderRadius: 3, bgcolor: '#e5e7eb', mt: 0.5, '& .MuiLinearProgress-bar': { bgcolor: '#3b82f6', borderRadius: 3 } }}
                />
              </>
            )}
          </Paper>

          {/* Milestone Progress */}
          <Paper sx={{ p: 2.5, borderRadius: 2.5, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', borderTop: '3px solid #f59e0b' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ProgressIcon sx={{ color: '#f59e0b', fontSize: 18 }} />
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Milestones
              </Typography>
            </Box>
            {milestones.length > 0 ? (
              <>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#d97706', mb: 0.25 }}>
                  {milestoneProgress}%
                </Typography>
                <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block', mb: 1 }}>
                  {completedMilestones} of {milestones.length} completed
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={milestoneProgress}
                  sx={{ height: 5, borderRadius: 3, bgcolor: '#e5e7eb', '& .MuiLinearProgress-bar': { bgcolor: milestoneProgress === 100 ? '#10b981' : '#f59e0b', borderRadius: 3 } }}
                />
              </>
            ) : (
              <Typography variant="body2" sx={{ color: '#9ca3af', fontStyle: 'italic' }}>No milestones defined</Typography>
            )}
          </Paper>
        </Box>

        {/* ── Main Content Grid ── */}
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* ── LEFT COLUMN ── */}
          <Box sx={{ flex: '1 1 62%', minWidth: 300 }}>

            {/* Abstract / Overview */}
            {(project.abstract || project.researchObjectives) && (
              <Card sx={{ mb: 3, borderRadius: 2.5, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <DescriptionIcon sx={{ color: '#8b6cbc', fontSize: 22 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#2d3748' }}>Abstract</Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>
                    {project.abstract || project.researchObjectives}
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Research Objectives */}
            {project.researchObjectives && project.abstract && (
              <Card sx={{ mb: 3, borderRadius: 2.5, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <ResearchIcon sx={{ color: '#8b6cbc', fontSize: 22 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#2d3748' }}>Research Objectives</Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>
                    {project.researchObjectives}
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Methodology */}
            {project.methodology && (
              <Card sx={{ mb: 3, borderRadius: 2.5, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <TimelineIcon sx={{ color: '#8b6cbc', fontSize: 22 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#2d3748' }}>Methodology</Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>
                    {project.methodology}
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Milestone Timeline */}
            {milestones.length > 0 && (
              <Card sx={{ mb: 3, borderRadius: 2.5, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <MilestoneIcon sx={{ color: '#8b6cbc', fontSize: 22 }} />
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#2d3748' }}>Milestone Timeline</Typography>
                    </Box>
                    <Chip
                      label={`${completedMilestones}/${milestones.length} done`}
                      size="small"
                      sx={{ bgcolor: milestoneProgress === 100 ? '#d1fae5' : '#fef3c7', color: milestoneProgress === 100 ? '#065f46' : '#92400e', fontWeight: 700 }}
                    />
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                  <Box sx={{ position: 'relative' }}>
                    {milestones.map((milestone, index) => {
                      const isDone = milestone.completed;
                      const isLast = index === milestones.length - 1;
                      const dotColor = isDone ? '#10b981' : '#d1d5db';
                      return (
                        <Box key={index} sx={{ display: 'flex', gap: 2, mb: isLast ? 0 : 3, position: 'relative' }}>
                          {/* Timeline dot & line */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28, flexShrink: 0 }}>
                            <Box sx={{
                              width: 28, height: 28, borderRadius: '50%',
                              bgcolor: isDone ? '#10b981' : 'white',
                              border: `2.5px solid ${dotColor}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              zIndex: 1,
                              boxShadow: isDone ? '0 0 0 3px #d1fae5' : 'none',
                            }}>
                              {isDone
                                ? <CheckCircleIcon sx={{ fontSize: 16, color: 'white' }} />
                                : <PendingCircleIcon sx={{ fontSize: 14, color: '#d1d5db' }} />}
                            </Box>
                            {!isLast && (
                              <Box sx={{ width: 2, flex: 1, minHeight: 24, bgcolor: isDone ? '#10b981' : '#e5e7eb', mt: 0.5 }} />
                            )}
                          </Box>
                          {/* Content */}
                          <Box sx={{
                            flex: 1,
                            p: 2,
                            borderRadius: 2,
                            bgcolor: isDone ? '#f0fdf4' : '#f9fafb',
                            border: `1px solid ${isDone ? '#bbf7d0' : '#e5e7eb'}`,
                            mb: isLast ? 0 : 0.5,
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2d3748', lineHeight: 1.4 }}>
                                {milestone.title || milestone.description || `Milestone ${index + 1}`}
                              </Typography>
                              <Chip
                                label={isDone ? 'Completed' : 'Pending'}
                                size="small"
                                sx={{ bgcolor: isDone ? '#dcfce7' : '#f3f4f6', color: isDone ? '#15803d' : '#6b7280', fontWeight: 700, fontSize: '0.65rem', height: 20, flexShrink: 0 }}
                              />
                            </Box>
                            {milestone.description && milestone.title && (
                              <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mt: 0.5 }}>
                                {milestone.description}
                              </Typography>
                            )}
                            <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                              {milestone.targetDate && (
                                <Typography variant="caption" sx={{ color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <CalendarIcon sx={{ fontSize: 12 }} />
                                  Target: {formatDate(milestone.targetDate)}
                                </Typography>
                              )}
                              {milestone.completedDate && (
                                <Typography variant="caption" sx={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <CheckCircleIcon sx={{ fontSize: 12 }} />
                                  Completed: {formatDate(milestone.completedDate)}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Ethics & Compliance */}
            {hasEthics && (
              <Card sx={{ mb: 3, borderRadius: 2.5, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <EthicsIcon sx={{ color: '#8b6cbc', fontSize: 22 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#2d3748' }}>Ethics & Compliance</Typography>
                    {project.ethicsApprovalStatus && (
                      <Chip
                        label={project.ethicsApprovalStatus}
                        size="small"
                        sx={{ bgcolor: project.ethicsApprovalStatus === 'APPROVED' ? '#d1fae5' : '#fef3c7', color: project.ethicsApprovalStatus === 'APPROVED' ? '#065f46' : '#92400e', fontWeight: 700, ml: 'auto' }}
                      />
                    )}
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    {project.ethicsCommittee && (
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4 }}>Ethics Committee</Typography>
                        <Typography variant="body2" sx={{ color: '#2d3748', mt: 0.25 }}>{project.ethicsCommittee}</Typography>
                      </Box>
                    )}
                    {project.ethicsApprovalReference && (
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4 }}>Approval Reference</Typography>
                        <Typography variant="body2" sx={{ color: '#2d3748', fontFamily: 'monospace', mt: 0.25 }}>{project.ethicsApprovalReference}</Typography>
                      </Box>
                    )}
                    {project.approvalDate && (
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4 }}>Approval Date</Typography>
                        <Typography variant="body2" sx={{ color: '#2d3748', mt: 0.25 }}>{formatDate(project.approvalDate)}</Typography>
                      </Box>
                    )}
                    {project.consentProcedures && (
                      <Box sx={{ gridColumn: '1 / -1' }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4 }}>Consent Procedures</Typography>
                        <Typography variant="body2" sx={{ color: '#2d3748', mt: 0.25 }}>{project.consentProcedures}</Typography>
                      </Box>
                    )}
                    {project.dataSecurityMeasures && (
                      <Box sx={{ gridColumn: '1 / -1' }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4 }}>Data Security Measures</Typography>
                        <Typography variant="body2" sx={{ color: '#2d3748', mt: 0.25 }}>{project.dataSecurityMeasures}</Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>

          {/* ── RIGHT COLUMN ── */}
          <Box sx={{ flex: '1 1 32%', minWidth: 280 }}>

            {/* Grant & Funding */}
            {hasGrants && (
              <Card sx={{ mb: 3, borderRadius: 2.5, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <GrantIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#2d3748' }}>Grant & Funding</Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Stack spacing={1.75}>
                    {project.fundingSource && (
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4 }}>Funding Source</Typography>
                        <Typography variant="body2" sx={{ color: '#2d3748', mt: 0.25 }}>{project.fundingSource}</Typography>
                      </Box>
                    )}
                    {project.fundingInstitution && (
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4 }}>Funding Institution</Typography>
                        <Typography variant="body2" sx={{ color: '#2d3748', mt: 0.25 }}>{project.fundingInstitution}</Typography>
                      </Box>
                    )}
                    {project.grantNumber && (
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4 }}>Grant Number</Typography>
                        <Typography variant="body2" sx={{ color: '#2d3748', fontFamily: 'monospace', mt: 0.25, bgcolor: '#f9fafb', px: 1.5, py: 0.5, borderRadius: 1, display: 'inline-block' }}>{project.grantNumber}</Typography>
                      </Box>
                    )}
                    {project.totalBudgetAmount && (
                      <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4 }}>Total Budget</Typography>
                        <Typography variant="h6" sx={{ color: '#059669', fontWeight: 800, mt: 0.25 }}>{formatCurrency(project.totalBudgetAmount)}</Typography>
                      </Box>
                    )}
                    {(project.grantStartDate || project.grantEndDate) && (
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4 }}>Grant Period</Typography>
                        <Typography variant="body2" sx={{ color: '#2d3748', mt: 0.25 }}>
                          {formatDate(project.grantStartDate)} → {formatDate(project.grantEndDate)}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* Project Details */}
            <Card sx={{ mb: 3, borderRadius: 2.5, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#2d3748', mb: 2 }}>Project Details</Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={2}>
                  {project.departments?.length > 0 && (
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4, display: 'block', mb: 0.75 }}>Department(s)</Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {project.departments.map((dept, idx) => (
                          <Chip key={idx} label={dept} size="small" sx={{ bgcolor: 'rgba(139,108,188,0.08)', color: '#8b6cbc', fontWeight: 600, fontSize: '0.72rem' }} />
                        ))}
                      </Stack>
                    </Box>
                  )}
                  {project.researchAreas?.length > 0 && (
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4, display: 'block', mb: 0.75 }}>Research Areas</Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {project.researchAreas.map((area, idx) => (
                          <Chip key={idx} label={area} size="small" sx={{ bgcolor: '#e0e7ff', color: '#4338ca', fontWeight: 600, fontSize: '0.72rem' }} />
                        ))}
                      </Stack>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4, display: 'block', mb: 0.5 }}>Start Date</Typography>
                      <Typography variant="body2" sx={{ color: '#2d3748', fontWeight: 600 }}>{formatDate(project.startDate)}</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4, display: 'block', mb: 0.5 }}>End Date</Typography>
                      <Typography variant="body2" sx={{ color: '#2d3748', fontWeight: 600 }}>{formatDate(project.endDate)}</Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4, display: 'block', mb: 0.5 }}>Submitted</Typography>
                    <Typography variant="body2" sx={{ color: '#2d3748' }}>{formatDate(project.createdAt)}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Team */}
            <Card sx={{ mb: 3, borderRadius: 2.5, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <TeamIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#2d3748' }}>Research Team</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                {/* PI row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'rgba(139,108,188,0.06)', border: '1px solid rgba(139,108,188,0.15)' }}>
                  <Avatar sx={{ width: 36, height: 36, bgcolor: '#8b6cbc', fontWeight: 700 }}>
                    {project.principalInvestigator?.charAt(0) || 'P'}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#2d3748' }}>{project.principalInvestigator || 'N/A'}</Typography>
                    <Chip label="Principal Investigator" size="small" sx={{ bgcolor: '#8b6cbc', color: 'white', fontWeight: 600, fontSize: '0.6rem', height: 16, mt: 0.25 }} />
                  </Box>
                </Box>
                {/* Co-investigators */}
                {project.coInvestigators?.length > 0 && (
                  <Stack spacing={1}>
                    {project.coInvestigators.map((ci, idx) => {
                      const name = typeof ci === 'string' ? ci : (ci.name || ci.fullName || 'Unknown');
                      const role = typeof ci === 'object' ? (ci.role || ci.affiliation || '') : '';
                      return (
                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, borderRadius: 1.5, bgcolor: '#f9fafb', border: '1px solid #f3f4f6' }}>
                          <Avatar sx={{ width: 30, height: 30, bgcolor: '#e0e7ff', color: '#4338ca', fontSize: '0.75rem', fontWeight: 700 }}>
                            {name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#2d3748', fontSize: '0.8rem' }}>{name}</Typography>
                            {role && <Typography variant="caption" sx={{ color: '#9ca3af' }}>{role}</Typography>}
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </CardContent>
            </Card>

            {/* Deliverables */}
            {deliverables.length > 0 && (
              <Card sx={{ borderRadius: 2.5, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <DeliverableIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#2d3748' }}>Deliverables</Typography>
                    <Chip label={deliverables.length} size="small" sx={{ bgcolor: 'rgba(139,108,188,0.1)', color: '#8b6cbc', fontWeight: 700, ml: 'auto' }} />
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Stack spacing={1}>
                    {deliverables.map((d, idx) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, p: 1.25, borderRadius: 1.5, bgcolor: '#f9fafb', border: '1px solid #f3f4f6' }}>
                        <CheckCircleIcon sx={{ fontSize: 16, color: '#10b981', mt: 0.2, flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ color: '#374151', lineHeight: 1.5 }}>
                          {d.title || d.description || String(d)}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
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
