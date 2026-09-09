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
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  CircularProgress,
  Tabs,
  Tab,
  Alert,
  List,
  ListItem,
  Skeleton
} from '@mui/material';
import {
  Assessment as ProjectsIcon,
  Business as BusinessIcon,
  Insights as AnalyticsIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';

import PageHeader from '../../../../components/common/PageHeader';
import { useAuth } from '../../../../components/AuthProvider';
import { useTranslation } from 'react-i18next';

const PURPLE = '#8b6cbc';
const PURPLE_DARK = '#7b5cac';
const PALETTE = ['#8b6cbc', '#f59e0b', '#10b981', '#ef4444', '#6366f1', '#94a3b8'];

const EstimatedChip = () => (
  <Chip
    label="Estimated"
    size="small"
    variant="outlined"
    sx={{ height: 18, fontSize: '0.65rem', ml: 1, borderColor: 'warning.main', color: 'warning.dark' }}
  />
);

const StatCard = ({ label, value }) => (
  <Card elevation={2} sx={{ bgcolor: PURPLE }}>
    <CardContent sx={{ py: 2 }}>
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>{label}</Typography>
      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>{value}</Typography>
    </CardContent>
  </Card>
);

const Gauge = ({ value, label, size = 116 }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress
        variant="determinate"
        value={100}
        size={size}
        thickness={4}
        sx={{ color: 'rgba(139, 108, 188, 0.12)', position: 'absolute' }}
      />
      <CircularProgress
        variant="determinate"
        value={value === null || value === undefined ? 0 : Math.min(100, Math.max(0, value))}
        size={size}
        thickness={4}
        sx={{ color: PURPLE }}
      />
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          {value === null || value === undefined ? '—' : `${Math.round(value)}%`}
        </Typography>
      </Box>
    </Box>
    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>{label}</Typography>
  </Box>
);

const formatCurrency = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

const formatPercent = (n) => (n === null || n === undefined ? '—' : `${Math.round(n)}%`);

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');

const ProjectsAnalyticsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [insightsError, setInsightsError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/researcher/analytics/progress');
        if (!response.ok) throw new Error('Failed to fetch projects analytics');
        const json = await response.json();
        setData(json);
      } catch (err) {
        console.error('Error fetching projects analytics:', err);
        setError('Could not load your projects analytics. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    const fetchInsights = async () => {
      try {
        const response = await fetch('/api/researcher/analytics/progress/insights');
        if (!response.ok) throw new Error('Failed to fetch AI insights');
        const json = await response.json();
        setInsights(json);
      } catch (err) {
        console.error('Error fetching AI insights:', err);
        setInsightsError('AI insights are temporarily unavailable.');
      } finally {
        setInsightsLoading(false);
      }
    };

    fetchData();
    fetchInsights();
  }, []);

  const handleExport = () => window.print();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={60} sx={{ color: PURPLE }} />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'No data available.'}</Alert>
      </Container>
    );
  }

  const { overview } = data;

  const statusPieData = data.proposalStatusCounts.filter((s) => s.count > 0);
  const milestonePieData = [
    { status: 'Completed', count: data.milestoneBreakdown.completed },
    { status: 'Pending', count: data.milestoneBreakdown.pending },
    { status: 'Overdue', count: data.milestoneBreakdown.overdue }
  ].filter((s) => s.count > 0);
  const budgetComparisonData = [
    { name: 'Proposed', amount: overview.totalProposedBudget },
    { name: 'Requested', amount: overview.totalRequested },
    { name: 'Awarded', amount: overview.totalAwarded }
  ];

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh' }}>
      <PageHeader
        title="Projects Analytics"
        description={t('researcher.analytics_progress_desc', 'Proposal success, milestones, budget and grant performance')}
        icon={<ProjectsIcon />}
        breadcrumbs={[
          { label: 'Dashboard', path: '/researcher', icon: <BusinessIcon /> },
          { label: 'Analytics', path: '/researcher/analytics', icon: <AnalyticsIcon /> },
          { label: 'Projects Analytics', path: '/researcher/analytics/progress', icon: <ProjectsIcon /> }
        ]}
        actionButton={
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            sx={{ bgcolor: PURPLE, color: 'white', '&:hover': { bgcolor: PURPLE_DARK }, fontWeight: 'bold' }}
          >
            Export Report
          </Button>
        }
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {!data.meta?.hasOrcid && overview.totalProposals === 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Add your ORCID iD to your profile to see proposal success metrics here. Grant and budget data below doesn't require ORCID and is already up to date.
          </Alert>
        )}

        {/* Overview Cards */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' },
          gap: 2,
          mb: 4
        }}>
          <StatCard label="Total Proposals" value={overview.totalProposals} />
          <StatCard label="Approval Rate" value={formatPercent(overview.approvalRate)} />
          <StatCard label="Active Proposals" value={overview.activeProposals} />
          <StatCard label="Milestones On Time" value={formatPercent(overview.onTimeRate)} />
          <StatCard label="Funding Awarded" value={formatCurrency(overview.totalAwarded)} />
          <StatCard label="Grant Conversion" value={formatPercent(overview.conversionRate)} />
        </Box>

        {/* AI Insights Panel */}
        <Paper elevation={2} sx={{ mb: 4, p: 3, borderLeft: `4px solid ${PURPLE}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: PURPLE }}>AI Insights</Typography>
          </Box>

          {insightsLoading && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Skeleton variant="text" width="80%" height={28} />
              <Skeleton variant="text" width="60%" height={20} />
              <Skeleton variant="rectangular" width="100%" height={60} />
            </Box>
          )}

          {!insightsLoading && insightsError && <Alert severity="info">{insightsError}</Alert>}

          {!insightsLoading && insights && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Summary</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {insights.narrativeSummary}
                </Typography>

                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Recommendations</Typography>
                <List dense disablePadding>
                  {(insights.recommendations || []).map((rec, i) => (
                    <ListItem key={i} disableGutters sx={{ display: 'list-item', listStyleType: 'disc', ml: 2, py: 0.25 }}>
                      <Typography variant="body2" color="text.secondary">{rec}</Typography>
                    </ListItem>
                  ))}
                </List>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Priority to Watch</Typography>
                {insights.priorityCallout?.title ? (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{insights.priorityCallout.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{insights.priorityCallout.detail}</Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {insights.priorityCallout?.detail || 'Nothing urgent to flag right now.'}
                  </Typography>
                )}

                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Benchmark Comparison</Typography>
                <Typography variant="body2" color="text.secondary">{insights.benchmarkComparison}</Typography>
              </Box>
            </Box>
          )}
        </Paper>

        {/* Main Content Tabs */}
        <Paper elevation={2}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={currentTab}
              onChange={(e, newValue) => setCurrentTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                px: 3,
                '& .MuiTab-root': { minHeight: 48, color: 'text.secondary', '&.Mui-selected': { color: PURPLE } },
                '& .MuiTabs-indicator': { backgroundColor: PURPLE }
              }}
            >
              <Tab label="Proposal Success" />
              <Tab label="Milestones & Timeliness" />
              <Tab label="Budget & Funding" />
              <Tab label="Grant Conversion" />
            </Tabs>
          </Box>

          <Box sx={{ p: 3 }}>
            {currentTab === 0 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: PURPLE }}>
                  Proposal Status Breakdown
                </Typography>

                {statusPieData.length > 0 ? (
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '1 1 40%', minWidth: { xs: '100%', md: '280px' } }}>
                      <Card elevation={1} sx={{ p: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>By Status</Typography>
                        <ResponsiveContainer width="100%" height={260}>
                          <PieChart>
                            <Pie data={statusPieData} dataKey="count" nameKey="status" innerRadius={55} outerRadius={90} paddingAngle={2}>
                              {statusPieData.map((entry, i) => (
                                <Cell key={entry.status} fill={PALETTE[i % PALETTE.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </Card>
                    </Box>

                    <Box sx={{ flex: '1 1 35%', minWidth: { xs: '100%', md: '280px' } }}>
                      <Card elevation={1} sx={{ p: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>By Volume</Typography>
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={data.proposalStatusCounts} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="status" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                            <RechartsTooltip />
                            <Bar dataKey="count" fill={PURPLE} radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Card>
                    </Box>

                    <Box sx={{ flex: '1 1 20%', minWidth: { xs: '100%', md: '220px' } }}>
                      <Card elevation={1} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3 }}>
                        <Gauge value={overview.approvalRate} label="Approval Rate" />
                        <Divider />
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            Avg. Decision Turnaround <EstimatedChip />
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: PURPLE, textAlign: 'center' }}>
                            {overview.avgTurnaroundDays !== null ? `${overview.avgTurnaroundDays} days` : '—'}
                          </Typography>
                        </Box>
                      </Card>
                    </Box>
                  </Box>
                ) : (
                  <Alert severity="info">No proposals found yet for your ORCID iD.</Alert>
                )}
              </Box>
            )}

            {currentTab === 1 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: PURPLE }}>
                  Milestones &amp; Timeliness
                </Typography>

                {milestonePieData.length > 0 ? (
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 3 }}>
                    <Box sx={{ flex: '1 1 45%', minWidth: { xs: '100%', md: '280px' } }}>
                      <Card elevation={1} sx={{ p: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Milestone Status</Typography>
                        <ResponsiveContainer width="100%" height={260}>
                          <PieChart>
                            <Pie data={milestonePieData} dataKey="count" nameKey="status" innerRadius={55} outerRadius={90} paddingAngle={2}>
                              {milestonePieData.map((entry, i) => {
                                const colorMap = { Completed: '#10b981', Pending: '#f59e0b', Overdue: '#ef4444' };
                                return <Cell key={entry.status} fill={colorMap[entry.status] || PALETTE[i % PALETTE.length]} />;
                              })}
                            </Pie>
                            <RechartsTooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </Card>
                    </Box>

                    <Box sx={{ flex: '1 1 20%', minWidth: { xs: '100%', md: '220px' } }}>
                      <Card elevation={1} sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Gauge value={overview.onTimeRate} label="On-Time Completion" />
                      </Card>
                    </Box>
                  </Box>
                ) : (
                  <Alert severity="info" sx={{ mb: 3 }}>No milestones tracked yet across your grant applications.</Alert>
                )}

                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>Upcoming &amp; Overdue Milestones</Typography>
                {data.upcomingMilestones.length > 0 ? (
                  <TableContainer component={Paper} elevation={1}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Milestone</TableCell>
                          <TableCell>Grant</TableCell>
                          <TableCell align="center">Due Date</TableCell>
                          <TableCell align="center">Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.upcomingMilestones.map((m, i) => (
                          <TableRow key={i} hover>
                            <TableCell>{m.title}</TableCell>
                            <TableCell>{m.grantTitle}</TableCell>
                            <TableCell align="center">{formatDate(m.dueDate)}</TableCell>
                            <TableCell align="center">
                              <Chip label={m.status} size="small" color={m.status === 'Overdue' ? 'error' : 'default'} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">No upcoming milestones tracked.</Alert>
                )}
              </Box>
            )}

            {currentTab === 2 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: PURPLE }}>
                  Budget &amp; Funding
                </Typography>

                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 3 }}>
                  <Box sx={{ flex: '1 1 60%', minWidth: { xs: '100%', md: '300px' } }}>
                    <Card elevation={1} sx={{ p: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Proposed vs Requested vs Awarded</Typography>
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={budgetComparisonData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                          <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                          <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                            {budgetComparisonData.map((entry, i) => (
                              <Cell key={entry.name} fill={PALETTE[i % PALETTE.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Card>
                  </Box>

                  <Box sx={{ flex: '1 1 25%', minWidth: { xs: '100%', md: '220px' } }}>
                    <Card elevation={1} sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Gauge value={overview.budgetUtilization} label="Budget Utilization (Awarded / Requested)" />
                    </Card>
                  </Box>
                </Box>

                {data.fundingTrend.length > 0 && (
                  <Card elevation={1} sx={{ p: 2, mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>Funding Awarded by Year</Typography>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={data.fundingTrend}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                        <Bar dataKey="amount" fill={PURPLE} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                )}

                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>Grant Applications</Typography>
                {data.grants.length > 0 ? (
                  <TableContainer component={Paper} elevation={1}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Grant Title</TableCell>
                          <TableCell>Grantor</TableCell>
                          <TableCell align="center">Status</TableCell>
                          <TableCell align="right">Requested</TableCell>
                          <TableCell align="right">Awarded</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.grants.map((g) => (
                          <TableRow key={g.id} hover>
                            <TableCell>{g.title}</TableCell>
                            <TableCell>{g.grantorName}</TableCell>
                            <TableCell align="center">
                              <Chip label={g.status.replace(/_/g, ' ')} size="small" color={g.status === 'AWARDED' ? 'success' : 'default'} />
                            </TableCell>
                            <TableCell align="right">{formatCurrency(g.requestedAmount)}</TableCell>
                            <TableCell align="right">{g.awardedAmount ? formatCurrency(g.awardedAmount) : '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">No grant applications on file yet.</Alert>
                )}
              </Box>
            )}

            {currentTab === 3 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', color: PURPLE }}>
                  Grant Application Pipeline
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Current status of each grant application on file. This reflects a snapshot in time, not full historical movement between stages.
                </Typography>

                {data.pipeline.length > 0 ? (
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '1 1 65%', minWidth: { xs: '100%', md: '300px' } }}>
                      <Card elevation={1} sx={{ p: 2 }}>
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={data.pipeline} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                            <YAxis type="category" dataKey="status" tick={{ fontSize: 12 }} width={140} />
                            <RechartsTooltip />
                            <Bar dataKey="count" fill={PURPLE} radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Card>
                    </Box>

                    <Box sx={{ flex: '1 1 30%', minWidth: { xs: '100%', md: '250px' } }}>
                      <Card elevation={1} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                        <Gauge value={overview.conversionRate} label="Conversion Rate" />
                        <Divider sx={{ width: '100%' }} />
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">Awarded / Total Applications</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: PURPLE }}>
                            {overview.awardedCount} / {overview.totalGrantApplications}
                          </Typography>
                        </Box>
                      </Card>
                    </Box>
                  </Box>
                ) : (
                  <Alert severity="info">No grant applications on file yet.</Alert>
                )}
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ProjectsAnalyticsPage;
