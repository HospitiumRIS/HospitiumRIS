'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Button,
  Stack,
  Container,
  Typography,
  Chip,
  Avatar,
  Paper,
  IconButton,
  Tooltip,
  LinearProgress,
  Divider,
  AvatarGroup,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  alpha,
} from '@mui/material';
import {
  Article as ArticleIcon,
  Work as ProjectIcon,
  Groups as CollaborationIcon,
  Hub as NetworkIcon,
  TrendingUp as TrendingUpIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  Folder as FolderIcon,
  ShowChart as ShowChartIcon,
  Download as DownloadIcon,
  OpenInNew as OpenInNewIcon,
  Refresh as RefreshIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/AuthProvider';
import PageHeader from '../../components/common/PageHeader';
import ResearchNetworkWidget from '../../components/ResearchNetwork';
import {
  LineChart, Line, BarChart as RechartsBarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Area, AreaChart,
} from 'recharts';

const PURPLE = '#8b6cbc';
const WIDGET_SPAN = { analytics: 2, 'project-health': 1, network: 3 };
const DEFAULT_ORDER = ['analytics', 'project-health', 'network'];

const axisTick = { fontSize: 11, fill: '#64748b' };
const tooltipStyle = { borderRadius: 8, fontSize: 13, border: `1px solid ${alpha(PURPLE, 0.15)}` };

const WHeader = ({ icon, title, subtitle, action, widgetId, onDragStart }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <DragIcon
        draggable
        onDragStart={(e) => onDragStart?.(e, widgetId)}
        sx={{ fontSize: 18, color: 'text.disabled', cursor: 'grab', flexShrink: 0 }}
      />
      <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: alpha(PURPLE, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {React.cloneElement(icon, { sx: { fontSize: 18, color: PURPLE } })}
      </Box>
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{title}</Typography>
        {subtitle && <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>{subtitle}</Typography>}
      </Box>
    </Box>
    {action}
  </Box>
);

const widgetPaperSx = { borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 3, height: '100%' };

const ResearcherDashboard = () => {
  const { t } = useTranslation();
  const router = useRouter();
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
  const [widgetOrder, setWidgetOrder] = useState(DEFAULT_ORDER);
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem('researcher-widget-order');
      if (s) {
        const p = JSON.parse(s);
        if (Array.isArray(p) && DEFAULT_ORDER.every((id) => p.includes(id))) setWidgetOrder(p);
      }
    } catch {}
  }, []);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setDataLoading(true);
      setError(null);

      const [statsRes, projectHealthRes] = await Promise.all([
        fetch('/api/researcher/stats', { credentials: 'include' }),
        fetch('/api/researcher/project-health', { credentials: 'include' }),
      ]);

      const statsData = statsRes.ok ? await statsRes.json() : null;
      const projectHealthData = projectHealthRes.ok
        ? await projectHealthRes.json()
        : { projects: [], summary: { total: 0, onTrack: 0, needsAttention: 0, atRisk: 0, avgProgress: 0 } };

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
      })).map((item) => ({
        ...item,
        publicationsAndManuscripts: (item.publications || 0) + (item.manuscripts || 0),
        projects: item.proposals || 0,
      }));

      setDashboardData({ stats, recentPublications, allProjects, analyticsData });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
    } catch (err) {
      console.error('Error refreshing project health:', err);
    } finally {
      setProjectHealthLoading(false);
    }
  };

  const handleDragStart = useCallback((e, id) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }, []);
  const handleDragOver = useCallback((e, id) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== draggedId) setDragOverId(id);
  }, [draggedId]);
  const handleDrop = useCallback((e, targetId) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) { setDraggedId(null); setDragOverId(null); return; }
    const next = [...widgetOrder];
    const fi = next.indexOf(draggedId);
    const ti = next.indexOf(targetId);
    next.splice(fi, 1);
    next.splice(ti, 0, draggedId);
    setWidgetOrder(next);
    try { localStorage.setItem('researcher-widget-order', JSON.stringify(next)); } catch {}
    setDraggedId(null);
    setDragOverId(null);
  }, [draggedId, widgetOrder]);
  const handleDragEnd = useCallback(() => { setDraggedId(null); setDragOverId(null); }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'on-track': return '#22c55e';
      case 'needs-attention': return '#f59e0b';
      case 'at-risk': return '#ef4444';
      default: return PURPLE;
    }
  };

  const analytics = dashboardData?.analyticsData || [];
  const totalOutput = analytics.reduce((sum, d) => sum + (d.publicationsAndManuscripts || 0) + (d.projects || 0), 0);
  const peakPoint = analytics.reduce((max, d) =>
    ((d.publicationsAndManuscripts || 0) + (d.projects || 0)) > ((max.publicationsAndManuscripts || 0) + (max.projects || 0)) ? d : max
  , analytics[0] || { month: '—', publicationsAndManuscripts: 0, projects: 0 });

  const trialChartData = useMemo(() =>
    analytics.map((d, i) => ({
      ...d,
      enrollment: Math.floor(((i * 17) % 30) + 10 + i * 3),
      completed: Math.floor(((i * 11) % 5) + i),
      active: Math.floor(((i * 13) % 8) + 2),
    })),
  [analytics]);

  const impactChartData = useMemo(() =>
    analytics.map((d, i) => ({
      ...d,
      citations: Math.floor(((i * 19) % 20) + i * 5),
      hIndex: Math.floor(((i * 7) % 5) + i),
    })),
  [analytics]);

  const chartChrome = () => [
    <CartesianGrid key="grid" strokeDasharray="3 3" stroke={alpha(PURPLE, 0.1)} />,
    <XAxis key="x" dataKey="month" tick={axisTick} tickLine={false} axisLine={false} />,
    <YAxis key="y" tick={axisTick} tickLine={false} axisLine={false} />,
    <RechartsTooltip key="tip" contentStyle={tooltipStyle} />,
  ];

  const renderOverviewChart = () => {
    if (chartType === 'bar') {
      return (
        <RechartsBarChart data={analytics} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
          {chartChrome()}
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} iconType="circle" />
          <Bar dataKey="publications" fill={PURPLE} radius={[8, 8, 0, 0]} maxBarSize={60} />
          <Bar dataKey="projects" fill="#FF6B6B" radius={[8, 8, 0, 0]} maxBarSize={60} />
        </RechartsBarChart>
      );
    }
    if (chartType === 'line') {
      return (
        <LineChart data={analytics} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
          {chartChrome()}
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} iconType="circle" />
          <Line type="monotone" dataKey="publicationsAndManuscripts" name="Publications/Manuscripts" stroke={PURPLE} strokeWidth={2.5} dot={{ r: 3, fill: PURPLE }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="projects" name="Projects" stroke="#FF6B6B" strokeWidth={2.5} dot={{ r: 3, fill: '#FF6B6B' }} activeDot={{ r: 5 }} />
        </LineChart>
      );
    }
    return (
      <AreaChart data={analytics} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="colorPublications" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={PURPLE} stopOpacity={0.25} />
            <stop offset="95%" stopColor={PURPLE} stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        {chartChrome()}
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} iconType="circle" />
        <Area type="monotone" dataKey="publications" stroke={PURPLE} strokeWidth={2.5} fillOpacity={1} fill="url(#colorPublications)" dot={{ r: 3, fill: PURPLE }} activeDot={{ r: 5 }} />
        <Area type="monotone" dataKey="projects" stroke="#FF6B6B" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProjects)" dot={{ r: 3, fill: '#FF6B6B' }} activeDot={{ r: 5 }} />
      </AreaChart>
    );
  };

  const kpis = dashboardData ? [
    { labelKey: 'total_publications', value: dashboardData.stats.totalPublications, icon: <ArticleIcon sx={{ fontSize: 15 }} />, color: PURPLE, path: '/researcher/publications/manage' },
    { labelKey: 'active_projects', value: dashboardData.stats.ongoingProjects, icon: <ProjectIcon sx={{ fontSize: 15 }} />, color: '#3b82f6', path: '/researcher/projects/tracking/status' },
    { labelKey: 'collaborators', value: dashboardData.stats.collaborations, icon: <CollaborationIcon sx={{ fontSize: 15 }} />, color: '#0891b2', path: '/researcher' },
    { labelKey: 'citations', value: dashboardData.stats.citations.toLocaleString(), icon: <TrendingUpIcon sx={{ fontSize: 15 }} />, color: '#22c55e', path: '/researcher/analytics/impact' },
  ] : [];

  const WIDGETS = dashboardData ? {
    analytics: (
      <Paper elevation={0} sx={widgetPaperSx}>
        <WHeader
          widgetId="analytics"
          onDragStart={handleDragStart}
          icon={<BarChartIcon />}
          title={t('researcher.research_analytics')}
          subtitle={t('researcher.analytics_subtitle')}
          action={
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              {['3m', '6m', '1y', 'all'].map((range) => (
                <Chip
                  key={range}
                  label={range === 'all' ? 'All' : range.toUpperCase()}
                  size="small"
                  onClick={() => setTimeRange(range)}
                  sx={{
                    height: 24,
                    fontSize: '0.7rem',
                    fontWeight: timeRange === range ? 600 : 400,
                    bgcolor: timeRange === range ? PURPLE : alpha(PURPLE, 0.1),
                    color: timeRange === range ? 'white' : PURPLE,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: timeRange === range ? '#7a5cb0' : alpha(PURPLE, 0.2) },
                  }}
                />
              ))}
              <Stack direction="row" spacing={0.25}>
                {[
                  { type: 'area', icon: <ShowChartIcon sx={{ fontSize: 16 }} />, title: 'Area Chart' },
                  { type: 'bar', icon: <BarChartIcon sx={{ fontSize: 16 }} />, title: 'Bar Chart' },
                  { type: 'line', icon: <TimelineIcon sx={{ fontSize: 16 }} />, title: 'Line Chart' },
                ].map(({ type, icon, title }) => (
                  <Tooltip key={type} title={title}>
                    <IconButton
                      size="small"
                      onClick={() => setChartType(type)}
                      sx={{ bgcolor: chartType === type ? alpha(PURPLE, 0.1) : 'transparent', color: chartType === type ? PURPLE : '#64748b' }}
                    >
                      {icon}
                    </IconButton>
                  </Tooltip>
                ))}
              </Stack>
              <Tooltip title="Download Report">
                <IconButton size="small" sx={{ color: '#64748b' }}>
                  <DownloadIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Stack>
          }
        />

        <Tabs
          value={analyticsTab}
          onChange={(e, newValue) => setAnalyticsTab(newValue)}
          sx={{
            mb: 2,
            minHeight: 36,
            '& .MuiTab-root': {
              minHeight: 36,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
              color: '#64748b',
              '&.Mui-selected': { color: PURPLE },
            },
            '& .MuiTabs-indicator': { backgroundColor: PURPLE, height: 2.5, borderRadius: '2px 2px 0 0' },
          }}
        >
          <Tab label={t('researcher.overview')} />
          <Tab label={t('researcher.publications')} />
          <Tab label={t('researcher.projects')} />
          <Tab label={t('researcher.clinical_trials')} />
          <Tab label={t('researcher.impact')} />
        </Tabs>

        <Box sx={{ display: 'flex', gap: 0, mb: 2.5, px: 2, py: 1.25, bgcolor: alpha(PURPLE, 0.04), borderRadius: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Box sx={{ flex: 1, minWidth: 100, px: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>{t('researcher.total_output')}</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: PURPLE, lineHeight: 1.2 }}>{totalOutput}</Typography>
            <Typography variant="caption" sx={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.68rem' }}>
              <TrendingUpIcon sx={{ fontSize: 12 }} />
              {t('researcher.vs_last_period')}
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 0.5 }} />
          <Box sx={{ flex: 1, minWidth: 100, px: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>{t('researcher.avg_per_month')}</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#ef4444', lineHeight: 1.2 }}>{(totalOutput / 6).toFixed(1)}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>{t('researcher.last_6_months')}</Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 0.5 }} />
          <Box sx={{ flex: 1, minWidth: 100, px: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>{t('researcher.peak_month')}</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#3b82f6', lineHeight: 1.2 }}>
              {analytics.reduce((max, d) => Math.max(max, (d.publicationsAndManuscripts || 0) + (d.projects || 0)), 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>{peakPoint.month}</Typography>
          </Box>
        </Box>

        <ResponsiveContainer width="100%" height={260}>
          {analyticsTab === 0 && renderOverviewChart()}
          {analyticsTab === 1 && (
            <AreaChart data={analytics} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorPubsOnly" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PURPLE} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={PURPLE} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              {chartChrome()}
              <Area type="monotone" dataKey="publications" stroke={PURPLE} strokeWidth={2.5} fillOpacity={1} fill="url(#colorPubsOnly)" dot={{ r: 3, fill: PURPLE }} activeDot={{ r: 5 }} />
            </AreaChart>
          )}
          {analyticsTab === 2 && (
            <AreaChart data={analytics} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorManuscripts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="colorProposals" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              {chartChrome()}
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} iconType="circle" />
              <Area type="monotone" dataKey="manuscripts" stroke="#FF6B6B" strokeWidth={2.5} fillOpacity={1} fill="url(#colorManuscripts)" name="Manuscripts" />
              <Area type="monotone" dataKey="proposals" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProposals)" name="Proposals" />
            </AreaChart>
          )}
          {analyticsTab === 3 && (
            <AreaChart data={trialChartData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorEnrollment" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PURPLE} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={PURPLE} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              {chartChrome()}
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} iconType="circle" />
              <Area type="monotone" dataKey="enrollment" stroke={PURPLE} strokeWidth={2.5} fillOpacity={1} fill="url(#colorEnrollment)" name="Enrollment" />
              <Area type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCompleted)" name="Completed Trials" />
              <Area type="monotone" dataKey="active" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorActive)" name="Active Trials" />
            </AreaChart>
          )}
          {analyticsTab === 4 && (
            <LineChart data={impactChartData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
              {chartChrome()}
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} iconType="circle" />
              <Line type="monotone" dataKey="citations" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, fill: '#3b82f6' }} />
              <Line type="monotone" dataKey="hIndex" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 3, fill: '#22c55e' }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </Paper>
    ),

    'project-health': (
      <Paper elevation={0} sx={widgetPaperSx}>
        <WHeader
          widgetId="project-health"
          onDragStart={handleDragStart}
          icon={<FolderIcon />}
          title={t('researcher.project_health')}
          subtitle={t('researcher.active_projects_count', { count: projectHealthSummary.total })}
          action={
            <Tooltip title={t('common.refresh')}>
              <IconButton size="small" onClick={handleRefreshProjectHealth} disabled={projectHealthLoading}>
                <RefreshIcon sx={{ fontSize: 18, color: PURPLE }} />
              </IconButton>
            </Tooltip>
          }
        />

        <Box sx={{ display: 'flex', gap: 0, mb: 2, px: 1.5, py: 1.25, bgcolor: alpha(PURPLE, 0.04), borderRadius: 2 }}>
          {[
            { value: projectHealthSummary.onTrack, label: t('researcher.on_track'), color: '#22c55e' },
            { value: projectHealthSummary.needsAttention, label: t('researcher.needs_attention'), color: '#f59e0b' },
            { value: projectHealthSummary.atRisk, label: t('researcher.at_risk'), color: '#ef4444' },
          ].map((item, i) => (
            <React.Fragment key={item.label}>
              {i > 0 && <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 0.25 }} />}
              <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: item.color, fontSize: '1.15rem', lineHeight: 1.2 }}>{item.value}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>{item.label}</Typography>
              </Box>
            </React.Fragment>
          ))}
        </Box>

        {projectHealthLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} sx={{ color: PURPLE }} />
          </Box>
        ) : projectHealth.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <FolderIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.disabled">{t('researcher.no_active_projects')}</Typography>
          </Box>
        ) : (
          <Box sx={{ bgcolor: alpha(PURPLE, 0.04), borderRadius: 2, p: 1.5 }}>
            <Stack spacing={1.25} sx={{ maxHeight: 420, overflow: 'auto' }}>
              {projectHealth.map((project) => {
                const statusColor = getStatusColor(project.status);
                return (
                  <Box
                    key={project.id}
                    onClick={() => { if (project.link) router.push(project.link); }}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                      cursor: project.link ? 'pointer' : 'default',
                      borderLeft: `3px solid ${statusColor}`,
                      transition: 'box-shadow 0.2s, transform 0.15s',
                      '&:hover': { boxShadow: '0 4px 12px rgba(139,108,188,0.15)', transform: project.link ? 'translateY(-1px)' : 'none' },
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 0.75 }}>
                      <Box sx={{ flex: 1, mr: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3, mb: 0.4 }}>
                          {project.name.length > 45 ? `${project.name.substring(0, 45)}...` : project.name}
                        </Typography>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                          <Chip
                            label={project.status.replace('-', ' ')}
                            size="small"
                            sx={{ fontSize: '0.63rem', height: 17, bgcolor: alpha(statusColor, 0.1), color: statusColor, fontWeight: 600, textTransform: 'capitalize' }}
                          />
                          <Chip
                            label={project.type}
                            size="small"
                            sx={{ fontSize: '0.63rem', height: 17, bgcolor: alpha(project.color || PURPLE, 0.1), color: project.color || PURPLE, textTransform: 'capitalize' }}
                          />
                        </Stack>
                      </Box>
                      {project.link && (
                        <Tooltip title={t('common.open')}>
                          <IconButton size="small" sx={{ opacity: 0.5 }}>
                            <OpenInNewIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>

                    {project.daysSinceUpdate > 7 && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', display: 'block', mb: 0.75 }}>
                        {t('researcher.updated_days_ago', { days: project.daysSinceUpdate })}
                      </Typography>
                    )}

                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={project.progress}
                        sx={{
                          flex: 1,
                          height: 6,
                          borderRadius: 3,
                          bgcolor: alpha(statusColor, 0.12),
                          '& .MuiLinearProgress-bar': { bgcolor: statusColor, borderRadius: 3 },
                        }}
                      />
                      <Typography variant="caption" sx={{ fontWeight: 600, minWidth: 36, textAlign: 'right', fontSize: '0.72rem', color: statusColor }}>
                        {project.progress}%
                      </Typography>
                    </Stack>

                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 22, height: 22, fontSize: '0.62rem', border: '2px solid white' } }}>
                          {project.team.map((member, idx) => (
                            <Tooltip key={idx} title={`${member.name} (${member.role})`}>
                              <Avatar sx={{ bgcolor: project.color || PURPLE }}>{member.initials}</Avatar>
                            </Tooltip>
                          ))}
                        </AvatarGroup>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                          {project.teamSize} {project.teamSize !== 1 ? t('common.members', { defaultValue: 'members' }) : t('common.member', { defaultValue: 'member' })}
                        </Typography>
                      </Stack>
                      {project.metadata && (
                        <Typography variant="caption" sx={{ fontSize: '0.68rem', fontWeight: 600, color: PURPLE }}>
                          {project.metadata}
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        )}
      </Paper>
    ),

    network: (
      <Paper elevation={0} sx={{ ...widgetPaperSx, overflow: 'hidden' }}>
        <WHeader
          widgetId="network"
          onDragStart={handleDragStart}
          icon={<NetworkIcon />}
          title={t('researcher.collaboration_network')}
          subtitle={t('researcher.network_subtitle')}
        />
        <Box sx={{ width: '100%', minHeight: 700 }}>
          <ResearchNetworkWidget />
        </Box>
      </Paper>
    ),
  } : {};

  return (
    <Box>
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title={`${greeting}, ${getUserDisplayName()}`}
          description={
            <>
              <span style={{ fontSize: '0.9rem', opacity: 0.85 }}>{t('researcher.dashboard_subtitle')}</span>
              <br />
              <span style={{ opacity: 0.72, fontSize: '0.82rem' }}>{currentDate}</span>
            </>
          }
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
        />
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {dataLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh', flexDirection: 'column', gap: 2 }}>
            <CircularProgress size={48} sx={{ color: PURPLE }} />
            <Typography color="text.secondary">{t('common.loading')}</Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" action={<Button size="small" onClick={loadData}>{t('common.retry')}</Button>}>{error}</Alert>
        ) : dashboardData && (
          <>
            <Paper elevation={0} sx={{ borderRadius: 2, mb: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
              <Box sx={{ px: 3, py: 1.5, background: `linear-gradient(135deg, ${alpha(PURPLE, 0.06)} 0%, ${alpha(PURPLE, 0.03)} 100%)`, display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap', rowGap: 0.5 }}>
                {kpis.map((item, i) => (
                  <React.Fragment key={item.labelKey}>
                    {i > 0 && <Divider orientation="vertical" flexItem sx={{ mx: 2, my: 0.5 }} />}
                    <Stack
                      direction="row"
                      spacing={0.75}
                      alignItems="center"
                      onClick={() => router.push(item.path)}
                      sx={{ cursor: 'pointer', px: 1, py: 0.25, borderRadius: 1, '&:hover': { bgcolor: alpha(item.color, 0.08) }, transition: 'background 0.15s' }}
                    >
                      <Box sx={{ color: item.color, display: 'flex', opacity: 0.9 }}>{item.icon}</Box>
                      <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>{t(`researcher.${item.labelKey}`)}:</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.8rem' }}>{item.value}</Typography>
                    </Stack>
                  </React.Fragment>
                ))}
              </Box>
            </Paper>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, opacity: 0.45 }}>
              <DragIcon sx={{ fontSize: 14 }} />
              <Typography variant="caption" sx={{ fontSize: '0.72rem' }}>{t('researcher.drag_hint')}</Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
              {widgetOrder.map((id) => {
                const span = WIDGET_SPAN[id] || 1;
                return (
                  <Box
                    key={id}
                    onDragOver={(e) => handleDragOver(e, id)}
                    onDrop={(e) => handleDrop(e, id)}
                    onDragEnd={handleDragEnd}
                    sx={{
                      gridColumn: { xs: 'span 1', md: `span ${span}` },
                      opacity: draggedId === id ? 0.35 : 1,
                      outline: dragOverId === id ? `2px dashed ${PURPLE}` : '2px solid transparent',
                      borderRadius: 3,
                      transition: 'opacity 0.2s, outline 0.12s',
                    }}
                  >
                    {WIDGETS[id]}
                  </Box>
                );
              })}
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
};

export default ResearcherDashboard;
