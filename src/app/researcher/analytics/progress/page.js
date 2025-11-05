'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Paper,
  Grid,
  Avatar,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Timeline as ProgressIcon,
  Assignment as ProjectIcon,
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
  Warning as DelayedIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AnalyticsIcon,
  Business as BusinessIcon,
  Flag as MilestoneIcon,
  Task as TaskIcon,
  People as TeamIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as BudgetIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { format, differenceInDays, isAfter, isBefore } from 'date-fns';

import PageHeader from '../../../../components/common/PageHeader';
import { useAuth } from '../../../../components/AuthProvider';

const ProjectProgressPage = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');

  // Mock data - replace with real API calls
  useEffect(() => {
    const fetchProgressData = async () => {
      // Simulate API call
      setTimeout(() => {
        setProgressData({
          overview: {
            totalProjects: 12,
            completedProjects: 4,
            ongoingProjects: 6,
            delayedProjects: 2,
            totalMilestones: 48,
            completedMilestones: 32,
            overallProgress: 67,
            budgetUtilization: 72
          },
          projects: [
            {
              id: 1,
              title: 'AI-Driven Healthcare Analytics Platform',
              status: 'Active',
              priority: 'High',
              progress: 75,
              startDate: '2023-01-15',
              endDate: '2024-06-30',
              budget: 250000,
              budgetUsed: 180000,
              teamSize: 8,
              lead: 'Dr. Sarah Johnson',
              milestones: [
                { id: 1, title: 'Research Phase Complete', status: 'Completed', dueDate: '2023-03-15', completedDate: '2023-03-10' },
                { id: 2, title: 'Prototype Development', status: 'Completed', dueDate: '2023-06-30', completedDate: '2023-06-25' },
                { id: 3, title: 'Clinical Testing Phase', status: 'In Progress', dueDate: '2023-12-15', progress: 60 },
                { id: 4, title: 'Final Implementation', status: 'Pending', dueDate: '2024-05-30' }
              ],
              risks: ['Regulatory approval delays', 'Staff availability'],
              nextMilestone: 'Clinical Testing Phase',
              daysToDeadline: 45
            },
            {
              id: 2,
              title: 'Personalized Medicine Database',
              status: 'Active',
              priority: 'Medium',
              progress: 85,
              startDate: '2022-09-01',
              endDate: '2023-12-31',
              budget: 180000,
              budgetUsed: 165000,
              teamSize: 5,
              lead: 'Dr. Michael Chen',
              milestones: [
                { id: 1, title: 'Data Collection', status: 'Completed', dueDate: '2022-12-01', completedDate: '2022-11-28' },
                { id: 2, title: 'Database Design', status: 'Completed', dueDate: '2023-03-15', completedDate: '2023-03-12' },
                { id: 3, title: 'System Integration', status: 'Completed', dueDate: '2023-08-30', completedDate: '2023-08-25' },
                { id: 4, title: 'User Testing & Deployment', status: 'In Progress', dueDate: '2023-12-15', progress: 70 }
              ],
              risks: [],
              nextMilestone: 'User Testing & Deployment',
              daysToDeadline: 30
            },
            {
              id: 3,
              title: 'Remote Patient Monitoring System',
              status: 'Delayed',
              priority: 'High',
              progress: 45,
              startDate: '2023-03-01',
              endDate: '2024-02-29',
              budget: 320000,
              budgetUsed: 198000,
              teamSize: 10,
              lead: 'Dr. Emily Rodriguez',
              milestones: [
                { id: 1, title: 'Requirements Analysis', status: 'Completed', dueDate: '2023-04-15', completedDate: '2023-04-20' },
                { id: 2, title: 'Hardware Procurement', status: 'Delayed', dueDate: '2023-07-30', progress: 80 },
                { id: 3, title: 'Software Development', status: 'In Progress', dueDate: '2023-11-30', progress: 30 },
                { id: 4, title: 'Pilot Testing', status: 'Pending', dueDate: '2024-01-31' }
              ],
              risks: ['Supply chain delays', 'Technical integration challenges', 'Budget overrun'],
              nextMilestone: 'Software Development',
              daysToDeadline: -15
            }
          ],
          timeline: [
            { date: '2023-01', completed: 2, started: 1 },
            { date: '2023-02', completed: 1, started: 2 },
            { date: '2023-03', completed: 3, started: 1 },
            { date: '2023-04', completed: 2, started: 0 },
            { date: '2023-05', completed: 4, started: 1 },
            { date: '2023-06', completed: 3, started: 2 }
          ]
        });
        setLoading(false);
      }, 1000);
    };

    fetchProgressData();
  }, []);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': case 'completed': return 'success';
      case 'delayed': return 'error';
      case 'on hold': return 'warning';
      case 'planning': return 'info';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getMilestoneIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return <CompletedIcon color="success" />;
      case 'in progress': return <PendingIcon color="primary" />;
      case 'delayed': return <DelayedIcon color="error" />;
      default: return <PendingIcon color="action" />;
    }
  };

  const filteredProjects = progressData?.projects.filter(project => {
    const matchesStatus = filterStatus === 'All' || project.status === filterStatus;
    const matchesPriority = filterPriority === 'All' || project.priority === filterPriority;
    return matchesStatus && matchesPriority;
  }) || [];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={60} sx={{ color: '#8b6cbc' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh' }}>
      <PageHeader
        title="Project Progress Analytics"
        description="Monitor project milestones, track progress, and analyze performance across all research initiatives"
        icon={<ProgressIcon />}
        breadcrumbs={[
          { label: 'Dashboard', path: '/researcher', icon: <BusinessIcon /> },
          { label: 'Analytics', path: '/researcher/analytics', icon: <AnalyticsIcon /> },
          { label: 'Project Progress', path: '/researcher/analytics/progress', icon: <ProgressIcon /> },
        ]}
        actionButton={
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            sx={{ 
              bgcolor: '#8b6cbc', 
              color: 'white',
              '&:hover': { bgcolor: '#7b5cac' },
              fontWeight: 'bold'
            }}
          >
            Export Report
          </Button>
        }
        sx={{ mt: '80px' }}
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Progress Overview Cards */}
        <Box sx={{ 
          display: 'flex', 
          gap: 3, 
          mb: 4,
          flexWrap: 'wrap',
          '& > *': { flex: 1, minWidth: { xs: '100%', sm: 'calc(50% - 12px)', lg: 'calc(25% - 12px)' } }
        }}>
          <Card elevation={2} sx={{ bgcolor: '#8b6cbc' }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>Total Projects</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                    {progressData.overview.totalProjects}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}>
                  <ProjectIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>

          <Card elevation={2} sx={{ bgcolor: '#8b6cbc' }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>Completed</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                    {progressData.overview.completedProjects}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}>
                  <CompletedIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>

          <Card elevation={2} sx={{ bgcolor: '#8b6cbc' }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>Overall Progress</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                    {progressData.overview.overallProgress}%
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}>
                  <TrendingUpIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>

          <Card elevation={2} sx={{ bgcolor: '#8b6cbc' }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>Budget Utilization</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                    {progressData.overview.budgetUtilization}%
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}>
                  <BudgetIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Main Content Tabs */}
        <Paper elevation={2}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={currentTab} 
              onChange={(e, newValue) => setCurrentTab(newValue)}
              sx={{ 
                px: 3,
                '& .MuiTab-root': { 
                  minHeight: 48,
                  color: 'text.secondary',
                  '&.Mui-selected': { color: '#8b6cbc' }
                },
                '& .MuiTabs-indicator': { backgroundColor: '#8b6cbc' }
              }}
            >
              <Tab label="Project Overview" />
              <Tab label="Milestone Tracking" />
              <Tab label="Performance Analytics" />
              <Tab label="Risk Management" />
            </Tabs>
          </Box>

          <Box sx={{ p: 3 }}>
            {currentTab === 0 && (
              <Box>
                {/* Project Overview Tab */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#8b6cbc' }}>
                    Active Projects Portfolio
                  </Typography>
                </Box>

                {/* Filters */}
                <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    alignItems: 'center', 
                    flexWrap: 'wrap',
                    '& > *': { flex: '0 0 auto' }
                  }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        label="Status"
                      >
                        <MenuItem value="All">All Status</MenuItem>
                        <MenuItem value="Active">Active</MenuItem>
                        <MenuItem value="Delayed">Delayed</MenuItem>
                        <MenuItem value="Completed">Completed</MenuItem>
                        <MenuItem value="On Hold">On Hold</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>Priority</InputLabel>
                      <Select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        label="Priority"
                      >
                        <MenuItem value="All">All Priority</MenuItem>
                        <MenuItem value="High">High</MenuItem>
                        <MenuItem value="Medium">Medium</MenuItem>
                        <MenuItem value="Low">Low</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Paper>

                {/* Projects Table */}
                <TableContainer component={Paper} elevation={1}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Project</TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell align="center">Priority</TableCell>
                        <TableCell align="center">Progress</TableCell>
                        <TableCell align="center">Budget</TableCell>
                        <TableCell align="center">Team</TableCell>
                        <TableCell align="center">Deadline</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredProjects.map((project) => (
                        <TableRow key={project.id} hover>
                          <TableCell>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                {project.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Lead: {project.lead}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={project.status} 
                              size="small"
                              color={getStatusColor(project.status)}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={project.priority} 
                              size="small"
                              color={getPriorityColor(project.priority)}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={project.progress}
                                sx={{
                                  width: 60,
                                  height: 6,
                                  borderRadius: 3,
                                  bgcolor: 'rgba(139, 108, 188, 0.1)',
                                  '& .MuiLinearProgress-bar': { bgcolor: '#8b6cbc' }
                                }}
                              />
                              <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#8b6cbc' }}>
                                {project.progress}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                ${(project.budgetUsed / 1000).toFixed(0)}K / ${(project.budget / 1000).toFixed(0)}K
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {Math.round((project.budgetUsed / project.budget) * 100)}% used
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {project.teamSize}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box>
                              <Typography variant="body2" sx={{ 
                                fontWeight: 'bold',
                                color: project.daysToDeadline < 0 ? 'error.main' : 
                                       project.daysToDeadline < 30 ? 'warning.main' : 'text.primary'
                              }}>
                                {project.daysToDeadline < 0 ? 
                                  `${Math.abs(project.daysToDeadline)} days overdue` :
                                  `${project.daysToDeadline} days left`
                                }
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {format(new Date(project.endDate), 'MMM dd, yyyy')}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="View Details">
                              <IconButton size="small">
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {currentTab === 1 && (
              <Box>
                {/* Milestone Tracking Tab */}
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#8b6cbc' }}>
                  Project Milestones & Timeline
                </Typography>

                {filteredProjects.map((project) => (
                  <Card key={project.id} elevation={1} sx={{ mb: 3, p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {project.title}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip 
                          label={project.status} 
                          size="small"
                          color={getStatusColor(project.status)}
                        />
                        <Chip 
                          label={`${project.progress}% Complete`}
                          size="small"
                          variant="outlined"
                          sx={{ color: '#8b6cbc', borderColor: '#8b6cbc' }}
                        />
                      </Box>
                    </Box>

                    <Stepper orientation="vertical">
                      {project.milestones.map((milestone, index) => (
                        <Step key={milestone.id} active={true}>
                          <StepLabel
                            StepIconComponent={() => getMilestoneIcon(milestone.status)}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {milestone.title}
                              </Typography>
                              <Chip 
                                label={milestone.status} 
                                size="small"
                                color={
                                  milestone.status === 'Completed' ? 'success' : 
                                  milestone.status === 'In Progress' ? 'primary' : 
                                  milestone.status === 'Delayed' ? 'error' : 'default'
                                }
                              />
                            </Box>
                          </StepLabel>
                          <StepContent>
                            <Box sx={{ ml: 4, pb: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                Due: {format(new Date(milestone.dueDate), 'MMM dd, yyyy')}
                                {milestone.completedDate && (
                                  <span> • Completed: {format(new Date(milestone.completedDate), 'MMM dd, yyyy')}</span>
                                )}
                              </Typography>
                              {milestone.progress && milestone.status === 'In Progress' && (
                                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={milestone.progress}
                                    sx={{
                                      width: 100,
                                      height: 6,
                                      borderRadius: 3,
                                      bgcolor: 'rgba(139, 108, 188, 0.1)',
                                      '& .MuiLinearProgress-bar': { bgcolor: '#8b6cbc' }
                                    }}
                                  />
                                  <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#8b6cbc' }}>
                                    {milestone.progress}%
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </StepContent>
                        </Step>
                      ))}
                    </Stepper>
                  </Card>
                ))}
              </Box>
            )}

            {currentTab === 2 && (
              <Box>
                {/* Performance Analytics Tab */}
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#8b6cbc' }}>
                  Project Performance Analytics
                </Typography>

                <Grid container spacing={3}>
                  {/* Project Completion Timeline */}
                  <Grid item xs={12} md={8}>
                    <Card elevation={1} sx={{ p: 2, mb: 3 }}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Project Activity Timeline
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'end', gap: 2, height: 200 }}>
                        {progressData.timeline.map((item, index) => (
                          <Box key={index} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Box
                              sx={{
                                width: '100%',
                                height: `${(item.completed / 5) * 120}px`,
                                bgcolor: '#8b6cbc',
                                borderRadius: 1,
                                mb: 1,
                                minHeight: 20
                              }}
                            />
                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                              {item.completed}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.date}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Card>
                  </Grid>

                  {/* Key Performance Indicators */}
                  <Grid item xs={12} md={4}>
                    <Card elevation={1} sx={{ p: 2, height: 'fit-content' }}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Performance KPIs
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">On-Time Completion Rate</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#8b6cbc' }}>
                            87%
                          </Typography>
                        </Box>
                        <Divider />
                        <Box>
                          <Typography variant="body2" color="text.secondary">Avg Project Duration</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#8b6cbc' }}>
                            14 months
                          </Typography>
                        </Box>
                        <Divider />
                        <Box>
                          <Typography variant="body2" color="text.secondary">Budget Efficiency</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#8b6cbc' }}>
                            92%
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}

            {currentTab === 3 && (
              <Box>
                {/* Risk Management Tab */}
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#8b6cbc' }}>
                  Project Risk Assessment
                </Typography>

                {filteredProjects.map((project) => (
                  <Card key={project.id} elevation={1} sx={{ mb: 3, p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {project.title}
                      </Typography>
                      <Chip 
                        label={project.status} 
                        color={getStatusColor(project.status)}
                        size="small"
                      />
                    </Box>

                    {project.risks.length > 0 ? (
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: 'error.main' }}>
                          Identified Risks:
                        </Typography>
                        <List dense>
                          {project.risks.map((risk, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <DelayedIcon color="error" />
                              </ListItemIcon>
                              <ListItemText
                                primary={risk}
                                secondary="Requires immediate attention"
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    ) : (
                      <Alert severity="success">
                        No active risks identified for this project.
                      </Alert>
                    )}

                    <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Next Milestone: <strong>{project.nextMilestone}</strong>
                      </Typography>
                      <Typography variant="body2" color={
                        project.daysToDeadline < 0 ? 'error.main' : 
                        project.daysToDeadline < 30 ? 'warning.main' : 'success.main'
                      }>
                        {project.daysToDeadline < 0 ? 
                          `${Math.abs(project.daysToDeadline)} days overdue` :
                          `${project.daysToDeadline} days remaining`
                        }
                      </Typography>
                    </Box>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ProjectProgressPage;
