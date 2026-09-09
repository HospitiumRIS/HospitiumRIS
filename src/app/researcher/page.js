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
  Info as InfoIcon,
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
  OpenInNew as OpenInNewIcon,
  Refresh as RefreshIcon,
  Science as TrialIcon,
  PeopleAlt as EnrollmentIcon,
  HealthAndSafety as SafetyIcon,
  Gavel as EthicsIcon,
  Description as ProtocolIcon,
  CloudSync as RegistryIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../components/AuthProvider';
import PageHeader from '../../components/common/PageHeader';
import KenyaNetworkVisualization from '../../components/KenyaNetworkVisualization';
import ResearchNetworkWidget from '../../components/ResearchNetwork';
import { LineChart, Line, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

const ResearcherDashboard = () => {
  const { t } = useTranslation();
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
  const [projectHealth, setProjectHealth] = useState([]);
  const [projectHealthLoading, setProjectHealthLoading] = useState(true);
  const [projectHealthSummary, setProjectHealthSummary] = useState({ total: 0, onTrack: 0, needsAttention: 0, atRisk: 0, avgProgress: 0 });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        setDataLoading(true);
        setError(null);
        
        const [statsRes, proposalsRes, projectHealthRes] = await Promise.all([
          fetch('/api/researcher/stats', { credentials: 'include' }),
          fetch('/api/proposals', { credentials: 'include' }),
          fetch('/api/researcher/project-health', { credentials: 'include' })
        ]);

        const statsData = statsRes.ok ? await statsRes.json() : null;
        const proposalsData = proposalsRes.ok ? await proposalsRes.json() : { proposals: [] };
        const projectHealthData = projectHealthRes.ok ? await projectHealthRes.json() : { projects: [], summary: { total: 0, onTrack: 0, needsAttention: 0, atRisk: 0, avgProgress: 0 } };

        setProjectHealth(projectHealthData.projects || []);
        setProjectHealthSummary(projectHealthData.summary || { total: 0, onTrack: 0, needsAttention: 0, atRisk: 0, avgProgress: 0 });
        setProjectHealthLoading(false);

        const stats = {
          totalPublications: statsData?.stats?.publications?.total || 0,
          ongoingProjects: statsData?.stats?.projects?.ongoing || 0,
          collaborations: statsData?.stats?.collaborations?.total || 0,
          citations: statsData?.stats?.citations?.total || 0,
        };

        const recentPublications = (statsData?.recentPublications || []).slice(0, 5);
        const allProjects = (statsData?.recentProjects?.manuscripts || []).concat(statsData?.recentProjects?.proposals || []);

        const analyticsData = (statsData?.monthlyTimeline || Array.from({ length: 6 }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - (5 - i));
          return {
            month: date.toLocaleDateString('en-US', { month: 'short' }),
            publications: 0,
            manuscripts: 0,
            proposals: 0,
            projects: 0,
          };
        })).map(item => ({
          ...item,
          publicationsAndManuscripts: (item.publications || 0) + (item.manuscripts || 0),
          projects: item.proposals || 0
        }));





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
        {t('researcher.new_publication')}
      </Button>
      <Button variant="contained" startIcon={<ProposalIcon />} sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
        {t('researcher.new_project')}
      </Button>
    </Stack>
  );

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f7fa' }}>
      <PageHeader
        title={`${greeting}, ${getUserDisplayName()}`}
        description={<>{t('researcher.dashboard_subtitle')}<br /><span style={{ fontSize: '0.875rem', opacity: 0.8 }}>{currentDate}</span></>}
       
        gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 100%)"
      />
      
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {dataLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">{t('common.loading')}</Typography>
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
                      {t('researcher.total_publications')}
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
                      {t('researcher.active_projects')}
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
                      {t('researcher.collaborators')}
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
                      {t('researcher.citations')}
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
                            {t('researcher.research_analytics')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t('researcher.analytics_subtitle')}
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
                      <Tab label={t('researcher.overview')} />
                      <Tab label={t('researcher.publications')} />
                      <Tab label={t('researcher.projects')} />
                      <Tab label={t('researcher.clinical_trials')} />
                      <Tab label={t('researcher.impact')} />
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
                          {t('researcher.total_output')}
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#8b6cbc' }}>
                          {dashboardData.analyticsData.reduce((sum, d) => sum + (d.publicationsAndManuscripts || 0) + (d.projects || 0), 0)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#66BB6A', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TrendingUpIcon sx={{ fontSize: 12 }} />
                          +12% vs last period
                        </Typography>
                      </Box>
                      <Divider orientation="vertical" flexItem />
                      <Box sx={{ flex: 1, minWidth: 100 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          {t('researcher.avg_per_month')}
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#FF6B6B' }}>
                          {(dashboardData.analyticsData.reduce((sum, d) => sum + (d.publicationsAndManuscripts || 0) + (d.projects || 0), 0) / 6).toFixed(1)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Last 6 months
                        </Typography>
                      </Box>
                      <Divider orientation="vertical" flexItem />
                      <Box sx={{ flex: 1, minWidth: 100 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          {t('researcher.peak_month')}
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#42A5F5' }}>
                          {dashboardData.analyticsData.reduce((max, d) => 
                            Math.max(max, (d.publicationsAndManuscripts || 0) + (d.projects || 0)), 0
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {dashboardData.analyticsData.reduce((max, d) => 
                            ((d.publicationsAndManuscripts || 0) + (d.projects || 0)) > ((max.publicationsAndManuscripts || 0) + (max.projects || 0)) ? d : max
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
                              dataKey="publicationsAndManuscripts" 
                              name="Publications/Manuscripts"
                              stroke="#8b6cbc" 
                              strokeWidth={3}
                              dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                              activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="projects" 
                              name="Projects"
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
                        <AreaChart data={dashboardData.analyticsData.map((d, i) => ({
                          ...d,
                          enrollment: Math.floor(Math.random() * 30) + 10 + i * 3,
                          completed: Math.floor(Math.random() * 5) + i,
                          active: Math.floor(Math.random() * 8) + 2
                        }))}>
                          <defs>
                            <linearGradient id="colorEnrollment" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b6cbc" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#8b6cbc" stopOpacity={0.1}/>
                            </linearGradient>
                            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#66BB6A" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#66BB6A" stopOpacity={0.1}/>
                            </linearGradient>
                            <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#FFA726" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#FFA726" stopOpacity={0.1}/>
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
                            dataKey="enrollment" 
                            stroke="#8b6cbc" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorEnrollment)"
                            activeDot={{ r: 6 }}
                            name="Enrollment"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="completed" 
                            stroke="#66BB6A" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorCompleted)"
                            activeDot={{ r: 6 }}
                            name="Completed Trials"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="active" 
                            stroke="#FFA726" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorActive)"
                            activeDot={{ r: 6 }}
                            name="Active Trials"
                          />
                        </AreaChart>
                      )}
                      {analyticsTab === 4 && (
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

              {/* Enhanced Project Health */}
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
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
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
                              {project.metadata && (
                                <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#8b6cbc' }}>
                                  {project.metadata}
                                </Typography>
                              )}
                            </Box>
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </Box>

              {/* Research Collaboration Network - New Widget */}
              <Box sx={{ flex: '1 1 100%', mt: 3 }}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <NetworkIcon sx={{ color: '#6366f1' }} />
                      Research Collaboration Network
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
