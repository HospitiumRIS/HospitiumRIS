'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Stack,
  Container,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  Paper,
  IconButton,
  Tooltip,
  LinearProgress,
  Divider,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  AvatarGroup,
  Tabs,
  Tab,
  ToggleButtonGroup,
  ToggleButton,
  ButtonGroup,
} from '@mui/material';
import {
  Add as AddIcon,
  Assignment as ProposalIcon,
  Article as ArticleIcon,
  Work as ProjectIcon,
  Groups as CollaborationIcon,
  Hub as NetworkIcon,
  TrendingUp as TrendingUpIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CalendarToday as CalendarTodayIcon,
  Person as PersonIcon,
  Folder as FolderIcon,
  AccessTime as AccessTimeIcon,
  MoreVert as MoreVertIcon,
  ShowChart as ShowChartIcon,
  PieChart as PieChartIcon,
  Download as DownloadIcon,
  Fullscreen as FullscreenIcon,
  Edit as EditIcon,
  Assignment as AssignmentIcon,
  Close as CloseIcon,
  DoneAll as DoneAllIcon,
  Delete as DeleteIcon,
  OpenInNew as OpenInNewIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../components/AuthProvider';
import PageHeader from '../../components/common/PageHeader';
import KenyaNetworkVisualization from '../../components/KenyaNetworkVisualization';
import ResearchNetworkWidget from '../../components/ResearchNetwork';
import { LineChart, Line, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

const ResearcherDashboard = () => {
  const theme = useTheme();
  const { user, isLoading } = useAuth();
  const [currentDate, setCurrentDate] = useState('');
  const [greeting, setGreeting] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsTab, setAnalyticsTab] = useState(0);
  const [chartType, setChartType] = useState('area');
  const [timeRange, setTimeRange] = useState('6m');
  const [activities, setActivities] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksSummary, setTasksSummary] = useState({ high: 0, medium: 0, low: 0 });
  const [deadlines, setDeadlines] = useState([]);
  const [deadlinesLoading, setDeadlinesLoading] = useState(true);
  const [deadlinesSummary, setDeadlinesSummary] = useState({ total: 0, urgent: 0, upcoming: 0, future: 0 });
  const [projectHealth, setProjectHealth] = useState([]);
  const [projectHealthLoading, setProjectHealthLoading] = useState(true);
  const [projectHealthSummary, setProjectHealthSummary] = useState({ total: 0, onTrack: 0, needsAttention: 0, atRisk: 0, avgProgress: 0 });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        setDataLoading(true);
        setError(null);
        
        const [statsRes, proposalsRes, activitiesRes, notificationsRes, tasksRes, deadlinesRes, projectHealthRes] = await Promise.all([
          fetch('/api/researcher/stats', { credentials: 'include' }),
          fetch('/api/proposals', { credentials: 'include' }),
          fetch('/api/researcher/activities?limit=10', { credentials: 'include' }),
          fetch('/api/notifications?limit=10', { credentials: 'include' }),
          fetch('/api/researcher/tasks', { credentials: 'include' }),
          fetch('/api/researcher/deadlines', { credentials: 'include' }),
          fetch('/api/researcher/project-health', { credentials: 'include' })
        ]);

        const statsData = statsRes.ok ? await statsRes.json() : null;
        const proposalsData = proposalsRes.ok ? await proposalsRes.json() : { proposals: [] };
        const activitiesData = activitiesRes.ok ? await activitiesRes.json() : { activities: [] };
        const notificationsData = notificationsRes.ok ? await notificationsRes.json() : { data: { notifications: [], unreadCount: 0 } };
        const tasksData = tasksRes.ok ? await tasksRes.json() : { tasks: [], summary: { high: 0, medium: 0, low: 0 } };
        const deadlinesData = deadlinesRes.ok ? await deadlinesRes.json() : { deadlines: [], summary: { total: 0, urgent: 0, upcoming: 0, future: 0 } };
        const projectHealthData = projectHealthRes.ok ? await projectHealthRes.json() : { projects: [], summary: { total: 0, onTrack: 0, needsAttention: 0, atRisk: 0, avgProgress: 0 } };

        setActivities(activitiesData.activities || []);
        setNotifications(notificationsData.data?.notifications || []);
        setUnreadCount(notificationsData.data?.unreadCount || 0);
        setTasks(tasksData.tasks || []);
        setTasksSummary(tasksData.summary || { high: 0, medium: 0, low: 0 });
        setDeadlines(deadlinesData.deadlines || []);
        setDeadlinesSummary(deadlinesData.summary || { total: 0, urgent: 0, upcoming: 0, future: 0 });
        setProjectHealth(projectHealthData.projects || []);
        setProjectHealthSummary(projectHealthData.summary || { total: 0, onTrack: 0, needsAttention: 0, atRisk: 0, avgProgress: 0 });
        setActivitiesLoading(false);
        setNotificationsLoading(false);
        setTasksLoading(false);
        setDeadlinesLoading(false);
        setProjectHealthLoading(false);

        const stats = {
          totalPublications: statsData?.stats?.publications?.total || 0,
          ongoingProjects: statsData?.stats?.projects?.ongoing || 0,
          collaborations: statsData?.stats?.collaborations?.total || 0,
          citations: statsData?.stats?.citations?.total || 0,
        };

        const recentPublications = (statsData?.recentPublications || []).slice(0, 5);
        const allProjects = (statsData?.recentProjects?.manuscripts || []).concat(statsData?.recentProjects?.proposals || []);

        const analyticsData = statsData?.monthlyTimeline || Array.from({ length: 6 }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - (5 - i));
          return {
            month: date.toLocaleDateString('en-US', { month: 'short' }),
            publications: 0,
            manuscripts: 0,
            proposals: 0,
            projects: 0,
          };
        });





        setDashboardData({
          stats,
          recentPublications,
          allProjects,
          analyticsData,
        });
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setDataLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const hour = now.getHours();
      const greetingText = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
      setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
      setGreeting(greetingText);
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getUserDisplayName = () => {
    if (isLoading || !user) return 'User';
    return user.firstName || user.fullName?.split(' ')[0] || user.name?.split(' ')[0] || user.email?.split('@')[0] || 'User';
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return '#EF5350';
      case 'medium': return '#FFA726';
      case 'low': return '#66BB6A';
      default: return '#8b6cbc';
    }
  };

  const getActivityIcon = (type) => {
    switch(type) {
      case 'publication': return <ArticleIcon sx={{ fontSize: 20 }} />;
      case 'manuscript': return <EditIcon sx={{ fontSize: 20 }} />;
      case 'collaboration': return <CollaborationIcon sx={{ fontSize: 20 }} />;
      case 'proposal': return <AssignmentIcon sx={{ fontSize: 20 }} />;
      case 'article': return <ArticleIcon sx={{ fontSize: 20 }} />;
      case 'group': return <CollaborationIcon sx={{ fontSize: 20 }} />;
      case 'check': return <CheckCircleIcon sx={{ fontSize: 20 }} />;
      case 'rate': return <ScheduleIcon sx={{ fontSize: 20 }} />;
      default: return <InfoIcon sx={{ fontSize: 20 }} />;
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'COLLABORATION_INVITE':
      case 'COLLABORATION_ACCEPTED':
        return <CollaborationIcon sx={{ color: '#42A5F5' }} />;
      case 'MANUSCRIPT_UPDATED':
      case 'MANUSCRIPT_SHARED':
        return <EditIcon sx={{ color: '#8b6cbc' }} />;
      case 'success': return <CheckCircleIcon sx={{ color: '#66BB6A' }} />;
      case 'warning': return <WarningIcon sx={{ color: '#FFA726' }} />;
      case 'error': return <ErrorIcon sx={{ color: '#EF5350' }} />;
      default: return <InfoIcon sx={{ color: '#42A5F5' }} />;
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notificationIds: [notificationId] })
      });
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ markAllAsRead: true })
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      const deletedNotif = notifications.find(n => n.id === notificationId);
      if (deletedNotif && !deletedNotif.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleRefreshActivities = async () => {
    try {
      setActivitiesLoading(true);
      const res = await fetch('/api/researcher/activities?limit=10', { credentials: 'include' });
      const data = await res.json();
      setActivities(data.activities || []);
    } catch (error) {
      console.error('Error refreshing activities:', error);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const handleCompleteTask = (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setTasksSummary(prev => {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        return {
          ...prev,
          [task.priority]: Math.max(0, prev[task.priority] - 1)
        };
      }
      return prev;
    });
  };

  const handleRefreshTasks = async () => {
    try {
      setTasksLoading(true);
      const res = await fetch('/api/researcher/tasks', { credentials: 'include' });
      const data = await res.json();
      setTasks(data.tasks || []);
      setTasksSummary(data.summary || { high: 0, medium: 0, low: 0 });
    } catch (error) {
      console.error('Error refreshing tasks:', error);
    } finally {
      setTasksLoading(false);
    }
  };

  const handleRefreshDeadlines = async () => {
    try {
      setDeadlinesLoading(true);
      const res = await fetch('/api/researcher/deadlines', { credentials: 'include' });
      const data = await res.json();
      setDeadlines(data.deadlines || []);
      setDeadlinesSummary(data.summary || { total: 0, urgent: 0, upcoming: 0, future: 0 });
    } catch (error) {
      console.error('Error refreshing deadlines:', error);
    } finally {
      setDeadlinesLoading(false);
    }
  };

  const handleRefreshProjectHealth = async () => {
    try {
      setProjectHealthLoading(true);
      const res = await fetch('/api/researcher/project-health', { credentials: 'include' });
      const data = await res.json();
      setProjectHealth(data.projects || []);
      setProjectHealthSummary(data.summary || { total: 0, onTrack: 0, needsAttention: 0, atRisk: 0, avgProgress: 0 });
    } catch (error) {
      console.error('Error refreshing project health:', error);
    } finally {
      setProjectHealthLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'on-track': return '#66BB6A';
      case 'needs-attention': return '#FFA726';
      case 'at-risk': return '#EF5350';
      default: return '#8b6cbc';
    }
  };

  const actionButtons = (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
      <Button variant="contained" startIcon={<AddIcon />} sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
        New Publication
      </Button>
      <Button variant="contained" startIcon={<ProposalIcon />} sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
        New Project
      </Button>
    </Stack>
  );

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f7fa', mt: 8 }}>
      <PageHeader
        title={`${greeting}, ${getUserDisplayName()}`}
        description={<>Your research dashboard overview<br /><span style={{ fontSize: '0.875rem', opacity: 0.8 }}>{currentDate}</span></>}
        actionButton={actionButtons}
        gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 100%)"
      />
      
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {dataLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">Loading dashboard...</Typography>
          </Box>
        ) : error ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <Typography variant="h6" color="error">{error}</Typography>
          </Box>
        ) : dashboardData && (
          <>
            {/* Stats Cards */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, mb: 4 }}>
              <Box sx={{ flex: '1 1 calc(25% - 15px)', minWidth: '200px' }}>
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
                    <ArticleIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                    {dashboardData.stats.totalPublications}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                    All research outputs
                  </Typography>
                </Paper>
              </Box>
              <Box sx={{ flex: '1 1 calc(25% - 15px)', minWidth: '200px' }}>
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
                      Active Projects
                    </Typography>
                    <ProjectIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                    {dashboardData.stats.ongoingProjects}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                    Ongoing research work
                  </Typography>
                </Paper>
              </Box>
              <Box sx={{ flex: '1 1 calc(25% - 15px)', minWidth: '200px' }}>
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
                      Collaborators
                    </Typography>
                    <CollaborationIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                    {dashboardData.stats.collaborations}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                    Active team members
                  </Typography>
                </Paper>
              </Box>
              <Box sx={{ flex: '1 1 calc(25% - 15px)', minWidth: '200px' }}>
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
                      Citations
                    </Typography>
                    <TrendingUpIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                    {dashboardData.stats.citations}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                    Total citation count
                  </Typography>
                </Paper>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {/* Enhanced Research Analytics */}
              <Box sx={{ flex: '1 1 calc(66.666% - 12px)', minWidth: '300px' }}>
                <Card sx={{ 
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
                  }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    {/* Header with Controls */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ 
                          bgcolor: 'rgba(139, 108, 188, 0.1)', 
                          borderRadius: 1.5, 
                          p: 1, 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <BarChartIcon sx={{ color: '#8b6cbc', fontSize: 24 }} />
                        </Box>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                            Research Analytics
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Track your research output over time
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        {/* Time Range Selector */}
                        <ToggleButtonGroup
                          value={timeRange}
                          exclusive
                          onChange={(e, newValue) => newValue && setTimeRange(newValue)}
                          size="small"
                          sx={{
                            '& .MuiToggleButton-root': {
                              px: 1.5,
                              py: 0.5,
                              fontSize: '0.75rem',
                              textTransform: 'none',
                              border: '1px solid rgba(139, 108, 188, 0.2)',
                              '&.Mui-selected': {
                                bgcolor: '#8b6cbc',
                                color: 'white',
                                '&:hover': {
                                  bgcolor: '#7a5cac'
                                }
                              }
                            }
                          }}
                        >
                          <ToggleButton value="3m">3M</ToggleButton>
                          <ToggleButton value="6m">6M</ToggleButton>
                          <ToggleButton value="1y">1Y</ToggleButton>
                          <ToggleButton value="all">All</ToggleButton>
                        </ToggleButtonGroup>

                        {/* Chart Type Selector */}
                        <ButtonGroup size="small" variant="outlined">
                          <Tooltip title="Area Chart">
                            <IconButton 
                              size="small" 
                              onClick={() => setChartType('area')}
                              sx={{ 
                                bgcolor: chartType === 'area' ? 'rgba(139, 108, 188, 0.1)' : 'transparent',
                                borderColor: 'rgba(139, 108, 188, 0.2)',
                                '&:hover': { bgcolor: 'rgba(139, 108, 188, 0.05)' }
                              }}
                            >
                              <ShowChartIcon sx={{ fontSize: 18, color: chartType === 'area' ? '#8b6cbc' : '#666' }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Bar Chart">
                            <IconButton 
                              size="small" 
                              onClick={() => setChartType('bar')}
                              sx={{ 
                                bgcolor: chartType === 'bar' ? 'rgba(139, 108, 188, 0.1)' : 'transparent',
                                borderColor: 'rgba(139, 108, 188, 0.2)',
                                '&:hover': { bgcolor: 'rgba(139, 108, 188, 0.05)' }
                              }}
                            >
                              <BarChartIcon sx={{ fontSize: 18, color: chartType === 'bar' ? '#8b6cbc' : '#666' }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Line Chart">
                            <IconButton 
                              size="small" 
                              onClick={() => setChartType('line')}
                              sx={{ 
                                bgcolor: chartType === 'line' ? 'rgba(139, 108, 188, 0.1)' : 'transparent',
                                borderColor: 'rgba(139, 108, 188, 0.2)',
                                '&:hover': { bgcolor: 'rgba(139, 108, 188, 0.05)' }
                              }}
                            >
                              <TimelineIcon sx={{ fontSize: 18, color: chartType === 'line' ? '#8b6cbc' : '#666' }} />
                            </IconButton>
                          </Tooltip>
                        </ButtonGroup>

                        <Tooltip title="Download Report">
                          <IconButton size="small" sx={{ borderColor: 'rgba(139, 108, 188, 0.2)' }}>
                            <DownloadIcon sx={{ fontSize: 18, color: '#666' }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    {/* Tabs for different metrics */}
                    <Tabs 
                      value={analyticsTab} 
                      onChange={(e, newValue) => setAnalyticsTab(newValue)}
                      sx={{
                        mb: 2,
                        minHeight: 40,
                        '& .MuiTab-root': {
                          minHeight: 40,
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          color: '#666',
                          '&.Mui-selected': {
                            color: '#8b6cbc'
                          }
                        },
                        '& .MuiTabs-indicator': {
                          backgroundColor: '#8b6cbc',
                          height: 3,
                          borderRadius: '3px 3px 0 0'
                        }
                      }}
                    >
                      <Tab label="Overview" />
                      <Tab label="Publications" />
                      <Tab label="Projects" />
                      <Tab label="Impact" />
                    </Tabs>

                    {/* Summary Stats Row */}
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 2, 
                      mb: 3, 
                      p: 2, 
                      bgcolor: 'rgba(139, 108, 188, 0.05)', 
                      borderRadius: 2,
                      flexWrap: 'wrap'
                    }}>
                      <Box sx={{ flex: 1, minWidth: 100 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Total Output
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#8b6cbc' }}>
                          {dashboardData.analyticsData.reduce((sum, d) => sum + d.publications + d.projects, 0)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#66BB6A', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TrendingUpIcon sx={{ fontSize: 12 }} />
                          +12% vs last period
                        </Typography>
                      </Box>
                      <Divider orientation="vertical" flexItem />
                      <Box sx={{ flex: 1, minWidth: 100 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Avg per Month
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#FF6B6B' }}>
                          {(dashboardData.analyticsData.reduce((sum, d) => sum + d.publications + d.projects, 0) / 6).toFixed(1)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Last 6 months
                        </Typography>
                      </Box>
                      <Divider orientation="vertical" flexItem />
                      <Box sx={{ flex: 1, minWidth: 100 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Peak Month
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#42A5F5' }}>
                          {dashboardData.analyticsData.reduce((max, d) => 
                            Math.max(max, d.publications + d.projects), 0
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {dashboardData.analyticsData.reduce((max, d) => 
                            (d.publications + d.projects) > (max.publications + max.projects) ? d : max
                          ).month}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Chart Area */}
                    <ResponsiveContainer width="100%" height={320}>
                      {analyticsTab === 0 && (
                        chartType === 'area' ? (
                          <AreaChart data={dashboardData.analyticsData}>
                            <defs>
                              <linearGradient id="colorPublications" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b6cbc" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#8b6cbc" stopOpacity={0.1}/>
                              </linearGradient>
                              <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                            <XAxis 
                              dataKey="month" 
                              stroke="#999" 
                              tick={{ fontSize: 12 }}
                              axisLine={{ stroke: '#e0e0e0' }}
                            />
                            <YAxis 
                              stroke="#999" 
                              tick={{ fontSize: 12 }}
                              axisLine={{ stroke: '#e0e0e0' }}
                            />
                            <RechartsTooltip 
                              contentStyle={{ 
                                borderRadius: 8, 
                                border: 'none', 
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                fontSize: 12
                              }}
                              cursor={{ fill: 'rgba(139, 108, 188, 0.05)' }}
                            />
                            <Legend 
                              wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
                              iconType="circle"
                            />
                            <Area 
                              type="monotone" 
                              dataKey="publications" 
                              stroke="#8b6cbc" 
                              strokeWidth={2}
                              fillOpacity={1} 
                              fill="url(#colorPublications)"
                              activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="projects" 
                              stroke="#FF6B6B" 
                              strokeWidth={2}
                              fillOpacity={1} 
                              fill="url(#colorProjects)"
                              activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                            />
                          </AreaChart>
                        ) : chartType === 'bar' ? (
                          <RechartsBarChart data={dashboardData.analyticsData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                            <XAxis 
                              dataKey="month" 
                              stroke="#999" 
                              tick={{ fontSize: 12 }}
                              axisLine={{ stroke: '#e0e0e0' }}
                            />
                            <YAxis 
                              stroke="#999" 
                              tick={{ fontSize: 12 }}
                              axisLine={{ stroke: '#e0e0e0' }}
                            />
                            <RechartsTooltip 
                              contentStyle={{ 
                                borderRadius: 8, 
                                border: 'none', 
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                fontSize: 12
                              }}
                              cursor={{ fill: 'rgba(139, 108, 188, 0.05)' }}
                            />
                            <Legend 
                              wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
                              iconType="circle"
                            />
                            <Bar 
                              dataKey="publications" 
                              fill="#8b6cbc" 
                              radius={[8, 8, 0, 0]}
                              maxBarSize={60}
                            />
                            <Bar 
                              dataKey="projects" 
                              fill="#FF6B6B" 
                              radius={[8, 8, 0, 0]}
                              maxBarSize={60}
                            />
                          </RechartsBarChart>
                        ) : (
                          <LineChart data={dashboardData.analyticsData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                            <XAxis 
                              dataKey="month" 
                              stroke="#999" 
                              tick={{ fontSize: 12 }}
                              axisLine={{ stroke: '#e0e0e0' }}
                            />
                            <YAxis 
                              stroke="#999" 
                              tick={{ fontSize: 12 }}
                              axisLine={{ stroke: '#e0e0e0' }}
                            />
                            <RechartsTooltip 
                              contentStyle={{ 
                                borderRadius: 8, 
                                border: 'none', 
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                fontSize: 12
                              }}
                              cursor={{ stroke: '#8b6cbc', strokeWidth: 1, strokeDasharray: '5 5' }}
                            />
                            <Legend 
                              wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
                              iconType="circle"
                            />
                            <Line 
                              type="monotone" 
                              dataKey="publications" 
                              stroke="#8b6cbc" 
                              strokeWidth={3}
                              dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                              activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="projects" 
                              stroke="#FF6B6B" 
                              strokeWidth={3}
                              dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                              activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                            />
                          </LineChart>
                        )
                      )}
                      {analyticsTab === 1 && (
                        <AreaChart data={dashboardData.analyticsData}>
                          <defs>
                            <linearGradient id="colorPubsOnly" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b6cbc" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#8b6cbc" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                          <XAxis dataKey="month" stroke="#999" tick={{ fontSize: 12 }} />
                          <YAxis stroke="#999" tick={{ fontSize: 12 }} />
                          <RechartsTooltip 
                            contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="publications" 
                            stroke="#8b6cbc" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorPubsOnly)"
                            activeDot={{ r: 6 }}
                          />
                        </AreaChart>
                      )}
                      {analyticsTab === 2 && (
                        <AreaChart data={dashboardData.analyticsData}>
                          <defs>
                            <linearGradient id="colorManuscripts" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0.1}/>
                            </linearGradient>
                            <linearGradient id="colorProposals" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#42A5F5" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#42A5F5" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                          <XAxis dataKey="month" stroke="#999" tick={{ fontSize: 12 }} />
                          <YAxis stroke="#999" tick={{ fontSize: 12 }} />
                          <RechartsTooltip 
                            contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          />
                          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} iconType="circle" />
                          <Area 
                            type="monotone" 
                            dataKey="manuscripts" 
                            stroke="#FF6B6B" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorManuscripts)"
                            activeDot={{ r: 6 }}
                            name="Manuscripts"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="proposals" 
                            stroke="#42A5F5" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorProposals)"
                            activeDot={{ r: 6 }}
                            name="Proposals"
                          />
                        </AreaChart>
                      )}
                      {analyticsTab === 3 && (
                        <LineChart data={dashboardData.analyticsData.map((d, i) => ({
                          ...d,
                          citations: Math.floor(Math.random() * 20) + i * 5,
                          hIndex: Math.floor(Math.random() * 5) + i
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                          <XAxis dataKey="month" stroke="#999" tick={{ fontSize: 12 }} />
                          <YAxis stroke="#999" tick={{ fontSize: 12 }} />
                          <RechartsTooltip 
                            contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          />
                          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                          <Line 
                            type="monotone" 
                            dataKey="citations" 
                            stroke="#42A5F5" 
                            strokeWidth={3}
                            dot={{ r: 4 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="hIndex" 
                            stroke="#66BB6A" 
                            strokeWidth={3}
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Box>

              {/* Enhanced Notifications */}
              <Box sx={{ flex: '1 1 calc(33.333% - 12px)', minWidth: '300px' }}>
                <Card sx={{ 
                  height: '100%',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
                  }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ 
                          bgcolor: 'rgba(139, 108, 188, 0.1)', 
                          borderRadius: 1.5, 
                          p: 1, 
                          display: 'flex',
                          position: 'relative'
                        }}>
                          <Badge badgeContent={unreadCount} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem' } }}>
                            <NotificationsIcon sx={{ color: '#8b6cbc', fontSize: 24 }} />
                          </Badge>
                        </Box>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                            Notifications
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {unreadCount} unread
                          </Typography>
                        </Box>
                      </Box>
                      {unreadCount > 0 && (
                        <Tooltip title="Mark all as read">
                          <IconButton size="small" onClick={handleMarkAllAsRead}>
                            <DoneAllIcon sx={{ fontSize: 18, color: '#8b6cbc' }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                    
                    {notificationsLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">Loading...</Typography>
                      </Box>
                    ) : notifications.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <NotificationsIcon sx={{ fontSize: 48, color: '#e0e0e0', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          No notifications yet
                        </Typography>
                      </Box>
                    ) : (
                      <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                        {notifications.map((notification) => (
                          <ListItem 
                            key={notification.id} 
                            sx={{ 
                              px: 0, 
                              py: 1.5,
                              bgcolor: !notification.isRead ? 'rgba(139, 108, 188, 0.05)' : 'transparent', 
                              borderRadius: 1, 
                              mb: 1,
                              border: !notification.isRead ? '1px solid rgba(139, 108, 188, 0.1)' : '1px solid transparent',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: 'rgba(139, 108, 188, 0.08)',
                                transform: 'translateX(4px)'
                              }
                            }}
                            secondaryAction={
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                {!notification.isRead && (
                                  <Tooltip title="Mark as read">
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleMarkAsRead(notification.id)}
                                      sx={{ '&:hover': { bgcolor: 'rgba(102, 187, 106, 0.1)' } }}
                                    >
                                      <CheckCircleIcon sx={{ fontSize: 16, color: '#66BB6A' }} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                <Tooltip title="Delete">
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleDeleteNotification(notification.id)}
                                    sx={{ '&:hover': { bgcolor: 'rgba(239, 83, 80, 0.1)' } }}
                                  >
                                    <DeleteIcon sx={{ fontSize: 16, color: '#EF5350' }} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            }
                          >
                            <ListItemAvatar>
                              <Avatar sx={{ 
                                bgcolor: !notification.isRead ? 'rgba(139, 108, 188, 0.15)' : 'rgba(139, 108, 188, 0.05)',
                                width: 40,
                                height: 40
                              }}>
                                {getNotificationIcon(notification.type)}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText 
                              primary={notification.title || notification.message}
                              secondary={
                                <Box component="span">
                                  {notification.message && notification.title && (
                                    <Typography variant="caption" component="span" display="block" sx={{ mb: 0.5 }}>
                                      {notification.message}
                                    </Typography>
                                  )}
                                  <Typography variant="caption" component="span" color="text.secondary">
                                    {new Date(notification.createdAt).toLocaleString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric', 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </Typography>
                                </Box>
                              }
                              primaryTypographyProps={{ 
                                variant: 'body2', 
                                fontWeight: !notification.isRead ? 600 : 400,
                                sx: { pr: 6 }
                              }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </CardContent>
                </Card>
              </Box>

              {/* Enhanced Recent Activities */}
              <Box sx={{ flex: '1 1 calc(33.333% - 12px)', minWidth: '300px' }}>
                <Card sx={{ 
                  height: '100%',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
                  }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ 
                          bgcolor: 'rgba(139, 108, 188, 0.1)', 
                          borderRadius: 1.5, 
                          p: 1, 
                          display: 'flex'
                        }}>
                          <TimelineIcon sx={{ color: '#8b6cbc', fontSize: 24 }} />
                        </Box>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                            Recent Activities
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Your latest actions
                          </Typography>
                        </Box>
                      </Box>
                      <Tooltip title="Refresh">
                        <IconButton size="small" onClick={handleRefreshActivities} disabled={activitiesLoading}>
                          <RefreshIcon sx={{ fontSize: 18, color: '#8b6cbc' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    
                    {activitiesLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">Loading...</Typography>
                      </Box>
                    ) : activities.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <TimelineIcon sx={{ fontSize: 48, color: '#e0e0e0', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          No recent activities
                        </Typography>
                      </Box>
                    ) : (
                      <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                        {activities.map((activity) => (
                          <ListItem 
                            key={activity.id} 
                            sx={{ 
                              px: 0, 
                              py: 1.5,
                              borderRadius: 1,
                              transition: 'all 0.2s ease',
                              cursor: activity.link ? 'pointer' : 'default',
                              '&:hover': {
                                bgcolor: 'rgba(139, 108, 188, 0.05)',
                                transform: activity.link ? 'translateX(4px)' : 'none'
                              }
                            }}
                            onClick={() => { if (activity.link) window.location.href = activity.link; }}
                            secondaryAction={
                              activity.link && (
                                <Tooltip title="Open">
                                  <IconButton size="small" sx={{ opacity: 0.6 }}>
                                    <OpenInNewIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                              )
                            }
                          >
                            <ListItemAvatar>
                              <Avatar sx={{ 
                                bgcolor: activity.color ? `${activity.color}15` : 'rgba(139, 108, 188, 0.1)', 
                                color: activity.color || '#8b6cbc',
                                width: 40,
                                height: 40
                              }}>
                                {getActivityIcon(activity.icon || activity.type)}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={activity.title}
                              secondary={
                                <Box component="span">
                                  {activity.description && (
                                    <Typography variant="caption" component="span" display="block" sx={{ mb: 0.5 }}>
                                      {activity.description}
                                    </Typography>
                                  )}
                                  <Typography variant="caption" component="span" color="text.secondary">
                                    {activity.timeAgo}
                                  </Typography>
                                </Box>
                              }
                              primaryTypographyProps={{ 
                                variant: 'body2', 
                                fontWeight: 500,
                                sx: { pr: 4 }
                              }}
                              secondaryTypographyProps={{ component: 'div' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </CardContent>
                </Card>
              </Box>

              {/* Enhanced Pending Tasks */}
              <Box sx={{ flex: '1 1 calc(33.333% - 12px)', minWidth: '300px' }}>
                <Card sx={{ 
                  height: '100%',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
                  }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ 
                          bgcolor: 'rgba(139, 108, 188, 0.1)', 
                          borderRadius: 1.5, 
                          p: 1, 
                          display: 'flex'
                        }}>
                          <ScheduleIcon sx={{ color: '#8b6cbc', fontSize: 24 }} />
                        </Box>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                            Pending Tasks
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {tasks.length} task{tasks.length !== 1 ? 's' : ''} pending
                          </Typography>
                        </Box>
                      </Box>
                      <Tooltip title="Refresh">
                        <IconButton size="small" onClick={handleRefreshTasks} disabled={tasksLoading}>
                          <RefreshIcon sx={{ fontSize: 18, color: '#8b6cbc' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    {/* Priority Summary */}
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 1, 
                      mb: 2, 
                      p: 1.5, 
                      bgcolor: 'rgba(139, 108, 188, 0.05)', 
                      borderRadius: 1.5 
                    }}>
                      <Box sx={{ flex: 1, textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#EF5350', fontSize: '1.25rem' }}>
                          {tasksSummary.high}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          High
                        </Typography>
                      </Box>
                      <Divider orientation="vertical" flexItem />
                      <Box sx={{ flex: 1, textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#FFA726', fontSize: '1.25rem' }}>
                          {tasksSummary.medium}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          Medium
                        </Typography>
                      </Box>
                      <Divider orientation="vertical" flexItem />
                      <Box sx={{ flex: 1, textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#66BB6A', fontSize: '1.25rem' }}>
                          {tasksSummary.low}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          Low
                        </Typography>
                      </Box>
                    </Box>
                    
                    {tasksLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">Loading...</Typography>
                      </Box>
                    ) : tasks.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <CheckCircleIcon sx={{ fontSize: 48, color: '#66BB6A', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          All caught up! No pending tasks
                        </Typography>
                      </Box>
                    ) : (
                      <Stack spacing={2} sx={{ maxHeight: 400, overflow: 'auto' }}>
                        {tasks.map((task) => {
                          const isOverdue = task.daysUntilDue < 0;
                          const isUrgent = task.daysUntilDue >= 0 && task.daysUntilDue <= 2;
                          
                          return (
                            <Paper 
                              key={task.id} 
                              sx={{ 
                                p: 2, 
                                border: `1px solid ${isOverdue ? '#EF5350' : isUrgent ? '#FFA726' : '#e0e0e0'}`,
                                borderLeft: `4px solid ${getPriorityColor(task.priority)}`,
                                borderRadius: 1.5,
                                transition: 'all 0.2s ease',
                                cursor: task.link ? 'pointer' : 'default',
                                '&:hover': {
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                  transform: task.link ? 'translateY(-2px)' : 'none'
                                }
                              }}
                              onClick={() => { if (task.link) window.location.href = task.link; }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                                <Box sx={{ flex: 1, pr: 2 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    {task.title}
                                  </Typography>
                                  {task.description && (
                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                                      {task.description}
                                    </Typography>
                                  )}
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                    <Chip 
                                      label={task.priority} 
                                      size="small" 
                                      sx={{ 
                                        bgcolor: `${getPriorityColor(task.priority)}15`, 
                                        color: getPriorityColor(task.priority),
                                        fontWeight: 600,
                                        fontSize: '0.65rem',
                                        height: 20
                                      }} 
                                    />
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <CalendarTodayIcon sx={{ fontSize: 11 }} />
                                      {isOverdue ? (
                                        <span style={{ color: '#EF5350', fontWeight: 600 }}>
                                          Overdue by {Math.abs(task.daysUntilDue)} day{Math.abs(task.daysUntilDue) !== 1 ? 's' : ''}
                                        </span>
                                      ) : isUrgent ? (
                                        <span style={{ color: '#FFA726', fontWeight: 600 }}>
                                          Due in {task.daysUntilDue} day{task.daysUntilDue !== 1 ? 's' : ''}
                                        </span>
                                      ) : (
                                        `Due in ${task.daysUntilDue} day${task.daysUntilDue !== 1 ? 's' : ''}`
                                      )}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <Tooltip title="Mark as complete">
                                    <IconButton 
                                      size="small" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCompleteTask(task.id);
                                      }}
                                      sx={{ 
                                        '&:hover': { 
                                          bgcolor: 'rgba(102, 187, 106, 0.1)',
                                          transform: 'scale(1.1)'
                                        } 
                                      }}
                                    >
                                      <CheckCircleIcon sx={{ fontSize: 18, color: '#66BB6A' }} />
                                    </IconButton>
                                  </Tooltip>
                                  {task.link && (
                                    <Tooltip title="Open">
                                      <IconButton size="small" sx={{ opacity: 0.6 }}>
                                        <OpenInNewIcon sx={{ fontSize: 16 }} />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </Box>
                              </Box>
                            </Paper>
                          );
                        })}
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </Box>

              {/* Enhanced Upcoming Deadlines */}
              <Box sx={{ flex: '1 1 calc(33.333% - 12px)', minWidth: '300px' }}>
                <Card sx={{ 
                  height: '100%',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
                  }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ 
                          bgcolor: 'rgba(139, 108, 188, 0.1)', 
                          borderRadius: 1.5, 
                          p: 1, 
                          display: 'flex'
                        }}>
                          <CalendarTodayIcon sx={{ color: '#8b6cbc', fontSize: 24 }} />
                        </Box>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                            Upcoming Deadlines
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {deadlinesSummary.urgent} urgent, {deadlinesSummary.upcoming} upcoming
                          </Typography>
                        </Box>
                      </Box>
                      <Tooltip title="Refresh">
                        <IconButton size="small" onClick={handleRefreshDeadlines} disabled={deadlinesLoading}>
                          <RefreshIcon sx={{ fontSize: 18, color: '#8b6cbc' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    
                    {deadlinesLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">Loading...</Typography>
                      </Box>
                    ) : deadlines.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <CalendarTodayIcon sx={{ fontSize: 48, color: '#e0e0e0', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          No upcoming deadlines
                        </Typography>
                      </Box>
                    ) : (
                      <Stack spacing={2} sx={{ maxHeight: 400, overflow: 'auto' }}>
                        {deadlines.map((deadline) => {
                          const isUrgent = deadline.daysUntil <= 7;
                          const isOverdue = deadline.daysUntil < 0;
                          
                          return (
                            <Paper 
                              key={deadline.id} 
                              sx={{ 
                                p: 2, 
                                border: `1px solid ${isOverdue ? '#EF5350' : isUrgent ? '#FFA726' : '#e0e0e0'}`,
                                borderLeft: `4px solid ${isOverdue ? '#EF5350' : isUrgent ? '#FFA726' : '#8b6cbc'}`,
                                borderRadius: 1.5,
                                transition: 'all 0.2s ease',
                                cursor: deadline.link ? 'pointer' : 'default',
                                '&:hover': {
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                  transform: deadline.link ? 'translateY(-2px)' : 'none'
                                }
                              }}
                              onClick={() => { if (deadline.link) window.location.href = deadline.link; }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, flex: 1, pr: 1 }}>
                                  {deadline.title}
                                </Typography>
                                {deadline.link && (
                                  <Tooltip title="Open">
                                    <IconButton size="small" sx={{ opacity: 0.6, mt: -0.5 }}>
                                      <OpenInNewIcon sx={{ fontSize: 14 }} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                              {deadline.description && (
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                                  {deadline.description}
                                </Typography>
                              )}
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <CalendarTodayIcon sx={{ fontSize: 11 }} />
                                    {new Date(deadline.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </Typography>
                                  <Typography variant="caption" sx={{ 
                                    fontWeight: 600,
                                    color: isOverdue ? '#EF5350' : isUrgent ? '#FFA726' : 'text.secondary'
                                  }}>
                                    {isOverdue ? (
                                      `Overdue by ${Math.abs(deadline.daysUntil)} day${Math.abs(deadline.daysUntil) !== 1 ? 's' : ''}`
                                    ) : (
                                      `${deadline.daysUntil} day${deadline.daysUntil !== 1 ? 's' : ''} left`
                                    )}
                                  </Typography>
                                </Box>
                                <Chip 
                                  label={deadline.type} 
                                  size="small" 
                                  sx={{ 
                                    fontSize: '0.65rem',
                                    height: 20,
                                    bgcolor: `${deadline.color}15`,
                                    color: deadline.color,
                                    fontWeight: 600
                                  }} 
                                />
                              </Box>
                            </Paper>
                          );
                        })}
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </Box>

              {/* Enhanced Project Health */}
              <Box sx={{ flex: '1 1 calc(50% - 12px)', minWidth: '300px' }}>
                <Card sx={{ 
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
                  }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ 
                          bgcolor: 'rgba(139, 108, 188, 0.1)', 
                          borderRadius: 1.5, 
                          p: 1, 
                          display: 'flex'
                        }}>
                          <FolderIcon sx={{ color: '#8b6cbc', fontSize: 24 }} />
                        </Box>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                            Project Health
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {projectHealthSummary.total} active projects
                          </Typography>
                        </Box>
                      </Box>
                      <Tooltip title="Refresh">
                        <IconButton size="small" onClick={handleRefreshProjectHealth} disabled={projectHealthLoading}>
                          <RefreshIcon sx={{ fontSize: 18, color: '#8b6cbc' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    {/* Status Summary */}
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 1, 
                      mb: 3, 
                      p: 1.5, 
                      bgcolor: 'rgba(139, 108, 188, 0.05)', 
                      borderRadius: 1.5 
                    }}>
                      <Box sx={{ flex: 1, textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#66BB6A', fontSize: '1.25rem' }}>
                          {projectHealthSummary.onTrack}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          On Track
                        </Typography>
                      </Box>
                      <Divider orientation="vertical" flexItem />
                      <Box sx={{ flex: 1, textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#FFA726', fontSize: '1.25rem' }}>
                          {projectHealthSummary.needsAttention}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          Needs Attention
                        </Typography>
                      </Box>
                      <Divider orientation="vertical" flexItem />
                      <Box sx={{ flex: 1, textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#EF5350', fontSize: '1.25rem' }}>
                          {projectHealthSummary.atRisk}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          At Risk
                        </Typography>
                      </Box>
                    </Box>
                    
                    {projectHealthLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">Loading...</Typography>
                      </Box>
                    ) : projectHealth.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <FolderIcon sx={{ fontSize: 48, color: '#e0e0e0', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          No active projects
                        </Typography>
                      </Box>
                    ) : (
                      <Stack spacing={2.5} sx={{ maxHeight: 450, overflow: 'auto' }}>
                        {projectHealth.map((project) => (
                          <Paper 
                            key={project.id}
                            sx={{ 
                              p: 2, 
                              border: `1px solid ${getStatusColor(project.status)}30`,
                              borderLeft: `4px solid ${getStatusColor(project.status)}`,
                              borderRadius: 1.5,
                              transition: 'all 0.2s ease',
                              cursor: project.link ? 'pointer' : 'default',
                              '&:hover': {
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                transform: project.link ? 'translateY(-2px)' : 'none'
                              }
                            }}
                            onClick={() => { if (project.link) window.location.href = project.link; }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1.5 }}>
                              <Box sx={{ flex: 1, pr: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                  {project.name.length > 45 ? `${project.name.substring(0, 45)}...` : project.name}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                  <Chip 
                                    label={project.status.replace('-', ' ')} 
                                    size="small" 
                                    sx={{ 
                                      bgcolor: `${getStatusColor(project.status)}15`,
                                      color: getStatusColor(project.status),
                                      fontWeight: 600,
                                      fontSize: '0.65rem',
                                      height: 20,
                                      textTransform: 'capitalize'
                                    }} 
                                  />
                                  <Chip 
                                    label={project.type} 
                                    size="small" 
                                    sx={{ 
                                      bgcolor: `${project.color}15`,
                                      color: project.color,
                                      fontSize: '0.65rem',
                                      height: 20,
                                      textTransform: 'capitalize'
                                    }} 
                                  />
                                  {project.daysSinceUpdate > 7 && (
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                      Updated {project.daysSinceUpdate} days ago
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                              {project.link && (
                                <Tooltip title="Open">
                                  <IconButton size="small" sx={{ opacity: 0.6 }}>
                                    <OpenInNewIcon sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={project.progress} 
                                sx={{ 
                                  flex: 1, 
                                  height: 8, 
                                  borderRadius: 4,
                                  bgcolor: '#e0e0e0',
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: getStatusColor(project.status),
                                    borderRadius: 4
                                  }
                                }} 
                              />
                              <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 45, color: getStatusColor(project.status) }}>
                                {project.progress}%
                              </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <AvatarGroup max={5} sx={{ '& .MuiAvatar-root': { width: 26, height: 26, fontSize: '0.7rem', border: '2px solid white' } }}>
                                {project.team.map((member, idx) => (
                                  <Tooltip key={idx} title={`${member.name} (${member.role})`}>
                                    <Avatar sx={{ bgcolor: project.color }}>
                                      {member.initials}
                                    </Avatar>
                                  </Tooltip>
                                ))}
                              </AvatarGroup>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                {project.teamSize} member{project.teamSize !== 1 ? 's' : ''}
                              </Typography>
                            </Box>
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </Box>

              {/* Research Collaboration Network - Original */}
              <Box sx={{ flex: '1 1 100%' }}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <NetworkIcon sx={{ color: '#8b6cbc' }} />
                      Research Collaboration Network (Original)
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Interactive visualization of your research connections and collaborations
                    </Typography>
                    <Box sx={{ width: '100%', overflow: 'hidden', position: 'relative' }}>
                      <KenyaNetworkVisualization />
                    </Box>
                  </CardContent>
                </Card>
              </Box>

              {/* Research Collaboration Network - New Widget */}
              <Box sx={{ flex: '1 1 100%', mt: 3 }}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <NetworkIcon sx={{ color: '#6366f1' }} />
                      Research Collaboration Network (New - Testing)
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Enhanced interactive network with anti-clamping collision detection
                    </Typography>
                    <Box sx={{ width: '100%', minHeight: 700 }}>
                      <ResearchNetworkWidget />
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
};

export default ResearcherDashboard;
