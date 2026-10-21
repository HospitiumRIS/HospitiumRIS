'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  LinearProgress,
  List,
  ListItem,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
  alpha,
} from '@mui/material';
import {
  Assessment as ProjectsIcon,
  Flag as MilestoneIcon,
  Home as HomeIcon,
  Insights as AnalyticsIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import PageHeader from '../../../../components/common/PageHeader';

const PURPLE = '#8b6cbc';
const PALETTE = ['#8b6cbc', '#0284c7', '#16a34a', '#d97706', '#dc2626', '#64748b'];

const PROPOSAL_TONE = {
  DRAFT: { bg: '#64748b', color: '#fff' },
  SUBMITTED: { bg: '#0284c7', color: '#fff' },
  UNDER_REVIEW: { bg: PURPLE, color: '#fff' },
  REVISION_REQUESTED: { bg: '#d97706', color: '#fff' },
  APPROVED: { bg: '#16a34a', color: '#fff' },
  REJECTED: { bg: '#dc2626', color: '#fff' },
};

const EXECUTION_TONE = {
  Active: { bg: '#16a34a', color: '#fff' },
  Planning: { bg: '#0284c7', color: '#fff' },
  Review: { bg: PURPLE, color: '#fff' },
  Completed: { bg: '#0f766e', color: '#fff' },
  'On Hold': { bg: '#d97706', color: '#fff' },
};

const GRANT_TONE = {
  NOT_APPLIED: { bg: '#f1f5f9', color: '#475569' },
  APPLIED: { bg: '#dbeafe', color: '#1d4ed8' },
  AWARDED: { bg: '#dcfce7', color: '#166534' },
  REJECTED: { bg: '#fee2e2', color: '#b91c1c' },
  CANCELLED: { bg: '#ffedd5', color: '#c2410c' },
};

function StatusChip({ value, map }) {
  const tone = map[value] || { bg: '#f1f5f9', color: '#475569' };
  return (
    <Chip
      size="small"
      label={String(value || '').replaceAll('_', ' ')}
      sx={{ bgcolor: tone.bg, color: tone.color, fontWeight: 700, height: 24, textTransform: 'capitalize' }}
    />
  );
}

function StatCard({ label, value, caption }) {
  return (
    <Paper sx={{ flex: 1, minWidth: 160, p: 2, borderRadius: 2, bgcolor: PURPLE, color: 'white' }}>
      <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 700 }}>{label}</Typography>
      <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>{value}</Typography>
      {caption ? <Typography variant="caption" sx={{ opacity: 0.75 }}>{caption}</Typography> : null}
    </Paper>
  );
}

function Gauge({ value, label }) {
  const shown = value == null ? 0 : Math.min(100, Math.max(0, value));
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress variant="determinate" value={100} size={112} thickness={4} sx={{ color: alpha(PURPLE, 0.12), position: 'absolute' }} />
        <CircularProgress variant="determinate" value={shown} size={112} thickness={4} sx={{ color: PURPLE }} />
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>{value == null ? '-' : `${Math.round(value)}%`}</Typography>
        </Box>
      </Box>
      <Typography variant="body2" color="text.secondary" textAlign="center">{label}</Typography>
    </Box>
  );
}

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value || 0);

const formatPercent = (value) => (value == null ? '-' : `${Math.round(value)}%`);

const formatDate = (value) => {
  if (!value) return 'Not set';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not set' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const chartCard = { p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' };

export default function ProjectsAnalyticsPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/researcher/analytics/progress');
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to load progress analytics');
      setData(json);
    } catch (err) {
      setError(err.message || 'Could not load progress analytics.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const fetchInsights = async () => {
      try {
        const response = await fetch('/api/researcher/analytics/progress/insights');
        if (!response.ok) throw new Error('Failed to fetch insights');
        setInsights(await response.json());
      } catch {
        setInsights(null);
      } finally {
        setInsightsLoading(false);
      }
    };
    fetchInsights();
  }, []);

  const overview = data?.overview || {};
  const statusPieData = (data?.proposalStatusCounts || []).filter((item) => item.count > 0);
  const executionPieData = (data?.executionStatusCounts || []).filter((item) => item.count > 0);
  const milestonePieData = [
    { status: 'Completed', count: data?.milestoneBreakdown?.completed || 0 },
    { status: 'In progress', count: data?.milestoneBreakdown?.inProgress || 0 },
    { status: 'Pending', count: data?.milestoneBreakdown?.pending || 0 },
    { status: 'Overdue', count: data?.milestoneBreakdown?.overdue || 0 },
    { status: 'Blocked', count: data?.milestoneBreakdown?.blocked || 0 },
  ].filter((item) => item.count > 0);
  const budgetComparisonData = [
    { name: 'Proposed', amount: overview.totalProposedBudget || 0 },
    { name: 'Requested', amount: overview.totalRequested || 0 },
    { name: 'Awarded', amount: overview.totalAwarded || 0 },
  ];
  const grantPipeline = (data?.grantTrackingCounts || []).filter((item) => item.count > 0);

  return (
    <Box>
      <PageHeader
        title="Project progress"
        description="Live proposal review, milestone completion, and grant tracking for your current work."
        icon={<ProjectsIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/researcher' },
          { label: 'Analytics', path: '/researcher/analytics/impact' },
          { label: 'Progress' },
        ]}
        actionButton={
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={load}
            sx={{ bgcolor: 'white', color: PURPLE, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#f5f5f5' } }}
          >
            Refresh
          </Button>
        }
      />

      <Container maxWidth={false} sx={{ py: 3, maxWidth: '1600px', mx: 'auto' }}>
        {error ? <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert> : null}

        {loading ? (
          <Box sx={{ py: 10, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress sx={{ color: PURPLE }} />
          </Box>
        ) : !data ? (
          <Alert severity="info">No progress data is available yet.</Alert>
        ) : (
          <>
            {!data.meta?.hasOrcid && overview.totalProposals === 0 ? (
              <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                Add your ORCID iD to your profile so proposals can be matched to your account.
              </Alert>
            ) : null}

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2.5 }} useFlexGap flexWrap="wrap">
              <StatCard label="Proposals" value={overview.totalProposals} caption="All records linked to you" />
              <StatCard label="In review" value={overview.inReview} caption="Submitted or under review" />
              <StatCard label="Active projects" value={overview.activeProjects} caption="Approved and in delivery" />
              <StatCard label="Milestone progress" value={formatPercent(overview.avgProgress)} caption={`${overview.completedMilestones || 0} of ${overview.totalMilestones || 0} complete`} />
              <StatCard label="Overdue items" value={overview.overdueMilestones || 0} caption="Milestones past due" />
              <StatCard label="Funding awarded" value={formatCurrency(overview.totalAwarded)} caption={`${formatPercent(overview.conversionRate)} conversion`} />
            </Stack>

            <Paper sx={{ mb: 2.5, p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <AnalyticsIcon sx={{ color: PURPLE }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Insights</Typography>
              </Stack>
              {insightsLoading ? (
                <Stack spacing={1}>
                  <Skeleton height={28} />
                  <Skeleton height={20} />
                  <Skeleton height={60} />
                </Stack>
              ) : insights ? (
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75 }}>Summary</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{insights.narrativeSummary}</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75 }}>Recommendations</Typography>
                    <List dense disablePadding>
                      {(insights.recommendations || []).map((item) => (
                        <ListItem key={item} disableGutters sx={{ display: 'list-item', listStyleType: 'disc', ml: 2.5, py: 0.25 }}>
                          <Typography variant="body2" color="text.secondary">{item}</Typography>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75 }}>Priority</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{insights.priorityCallout?.title || 'Nothing urgent'}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      {insights.priorityCallout?.detail || 'No upcoming milestones need attention.'}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75 }}>Context</Typography>
                    <Typography variant="body2" color="text.secondary">{insights.benchmarkComparison}</Typography>
                  </Box>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">Insights are unavailable right now. Metrics below still reflect current status.</Typography>
              )}
            </Paper>

            <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 2 }}>
              <Tabs
                value={currentTab}
                onChange={(_, value) => setCurrentTab(value)}
                variant="scrollable"
                sx={{
                  '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, minHeight: 52, color: '#64748b' },
                  '& .Mui-selected': { color: `${PURPLE} !important` },
                  '& .MuiTabs-indicator': { backgroundColor: PURPLE, height: 3 },
                }}
              >
                <Tab icon={<ProjectsIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Current status" />
                <Tab icon={<MilestoneIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Milestones" />
                <Tab icon={<TimelineIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Funding" />
                <Tab icon={<AnalyticsIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Grant pipeline" />
              </Tabs>
            </Paper>

            {currentTab === 0 && (
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
                  <Paper sx={{ ...chartCard, flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Review status</Typography>
                    {statusPieData.length ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie data={statusPieData} dataKey="count" nameKey="status" innerRadius={55} outerRadius={90} paddingAngle={2}>
                            {statusPieData.map((entry, index) => (
                              <Cell key={entry.status} fill={PALETTE[index % PALETTE.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <Alert severity="info">No proposals linked to your account yet.</Alert>
                    )}
                  </Paper>
                  <Paper sx={{ ...chartCard, flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Project execution</Typography>
                    {executionPieData.length ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={executionPieData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                          <YAxis allowDecimals={false} />
                          <RechartsTooltip />
                          <Bar dataKey="count" fill={PURPLE} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <Alert severity="info">No execution status recorded yet.</Alert>
                    )}
                  </Paper>
                  <Paper sx={{ ...chartCard, width: { xs: '100%', lg: 240 }, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2 }}>
                    <Gauge value={overview.approvalRate} label="Approval rate" />
                    <Typography variant="caption" color="text.secondary" textAlign="center">
                      Average decision time: {overview.avgTurnaroundDays != null ? `${overview.avgTurnaroundDays} days` : 'Not enough decisions'}
                    </Typography>
                  </Paper>
                </Stack>

                <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                  <Box sx={{ px: 2, py: 1.5, bgcolor: alpha(PURPLE, 0.06) }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Proposals and current status</Typography>
                  </Box>
                  {(data.proposals || []).length ? (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            {['Proposal', 'Review', 'Project', 'Progress', 'Next milestone', 'Grant', ''].map((label) => (
                              <TableCell key={label} sx={{ fontWeight: 700 }}>{label}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {data.proposals.map((proposal) => (
                            <TableRow key={proposal.id} hover>
                              <TableCell sx={{ maxWidth: 280 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{proposal.title}</Typography>
                                {proposal.reviewStage ? (
                                  <Typography variant="caption" color="text.secondary">Stage: {proposal.reviewStage}</Typography>
                                ) : null}
                              </TableCell>
                              <TableCell><StatusChip value={proposal.status} map={PROPOSAL_TONE} /></TableCell>
                              <TableCell><StatusChip value={proposal.executionStatus} map={EXECUTION_TONE} /></TableCell>
                              <TableCell>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <LinearProgress
                                    variant="determinate"
                                    value={proposal.progress}
                                    sx={{ width: 72, height: 6, borderRadius: 3, bgcolor: alpha(PURPLE, 0.12), '& .MuiLinearProgress-bar': { bgcolor: PURPLE } }}
                                  />
                                  <Typography variant="caption">{proposal.progress}%</Typography>
                                </Stack>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{proposal.nextMilestone}</Typography>
                                <Typography variant="caption" color="text.secondary">{formatDate(proposal.nextDue)}</Typography>
                              </TableCell>
                              <TableCell><StatusChip value={proposal.grantTrackingStatus} map={GRANT_TONE} /></TableCell>
                              <TableCell>
                                <Button size="small" onClick={() => router.push(`/researcher/projects/proposals/view/${proposal.id}`)} sx={{ color: PURPLE, textTransform: 'none', fontWeight: 700 }}>
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box sx={{ p: 3 }}><Alert severity="info">No proposals to show.</Alert></Box>
                  )}
                </Paper>
              </Stack>
            )}

            {currentTab === 1 && (
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <Paper sx={{ ...chartCard, flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Milestone status</Typography>
                    {milestonePieData.length ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie data={milestonePieData} dataKey="count" nameKey="status" innerRadius={55} outerRadius={90} paddingAngle={2}>
                            {milestonePieData.map((entry) => {
                              const colors = { Completed: '#16a34a', 'In progress': PURPLE, Pending: '#f59e0b', Overdue: '#dc2626', Blocked: '#64748b' };
                              return <Cell key={entry.status} fill={colors[entry.status] || PURPLE} />;
                            })}
                          </Pie>
                          <RechartsTooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <Alert severity="info">No milestones recorded on your proposals yet.</Alert>
                    )}
                  </Paper>
                  <Paper sx={{ ...chartCard, width: { xs: '100%', md: 260 }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Gauge value={overview.onTimeRate} label="On-time completion" />
                  </Paper>
                  <Paper sx={{ ...chartCard, flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Deliverables</Typography>
                    <Typography variant="body2">{data.deliverableBreakdown?.completed || 0} of {data.deliverableBreakdown?.total || 0} delivered</Typography>
                    <Typography variant="body2" color="text.secondary">{data.deliverableBreakdown?.overdue || 0} overdue</Typography>
                    <Typography variant="body2" color="text.secondary">{data.deliverableBreakdown?.inProgress || 0} in progress</Typography>
                    <Button
                      sx={{ mt: 2, color: PURPLE, textTransform: 'none', fontWeight: 700 }}
                      onClick={() => router.push('/researcher/projects/tracking/status')}
                    >
                      Open status tracking
                    </Button>
                  </Paper>
                </Stack>

                <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                  <Box sx={{ px: 2, py: 1.5, bgcolor: alpha(PURPLE, 0.06) }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Upcoming and overdue work</Typography>
                  </Box>
                  {(data.upcomingMilestones || []).length ? (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Proposal</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Due</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {data.upcomingMilestones.map((item, index) => (
                            <TableRow key={`${item.title}-${index}`} hover>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.title}</Typography>
                                <Typography variant="caption" color="text.secondary">{item.kind === 'deliverable' ? 'Deliverable' : 'Milestone'}</Typography>
                              </TableCell>
                              <TableCell>{item.grantTitle}</TableCell>
                              <TableCell>{formatDate(item.dueDate)}</TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  label={item.status}
                                  sx={{
                                    fontWeight: 700,
                                    bgcolor: item.status === 'Overdue' ? '#fee2e2' : alpha(PURPLE, 0.12),
                                    color: item.status === 'Overdue' ? '#b91c1c' : PURPLE,
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box sx={{ p: 3 }}><Alert severity="info">No upcoming milestones or deliverables.</Alert></Box>
                  )}
                </Paper>
              </Stack>
            )}

            {currentTab === 2 && (
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <Paper sx={{ ...chartCard, flex: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Proposed, requested, and awarded</Typography>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={budgetComparisonData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                        <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                        <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                          {budgetComparisonData.map((entry, index) => (
                            <Cell key={entry.name} fill={PALETTE[index % PALETTE.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>
                  <Paper sx={{ ...chartCard, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Gauge value={overview.budgetUtilization} label="Awarded / requested" />
                  </Paper>
                </Stack>

                {(data.fundingTrend || []).length ? (
                  <Paper sx={chartCard}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Awarded by year</Typography>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={data.fundingTrend}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="year" />
                        <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                        <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                        <Bar dataKey="amount" fill={PURPLE} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>
                ) : null}

                <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                  <Box sx={{ px: 2, py: 1.5, bgcolor: alpha(PURPLE, 0.06) }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Grant records</Typography>
                  </Box>
                  {(data.grants || []).length ? (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Source</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="right">Requested</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="right">Awarded</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {data.grants.map((grant) => (
                            <TableRow key={grant.id} hover>
                              <TableCell>{grant.title}</TableCell>
                              <TableCell>{grant.source === 'proposal' ? 'Grant tracker' : grant.grantorName || 'Application'}</TableCell>
                              <TableCell><StatusChip value={grant.status} map={{ ...GRANT_TONE, AWARDED: GRANT_TONE.AWARDED }} /></TableCell>
                              <TableCell align="right">{grant.requestedAmount ? formatCurrency(grant.requestedAmount) : '-'}</TableCell>
                              <TableCell align="right">{grant.awardedAmount ? formatCurrency(grant.awardedAmount) : '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box sx={{ p: 3 }}><Alert severity="info">No grant applications or tracker updates yet.</Alert></Box>
                  )}
                </Paper>
              </Stack>
            )}

            {currentTab === 3 && (
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Paper sx={{ ...chartCard, flex: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Grant tracker pipeline</Typography>
                  {grantPipeline.length ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={grantPipeline} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis type="category" dataKey="status" width={110} tick={{ fontSize: 12 }} />
                        <RechartsTooltip />
                        <Bar dataKey="count" fill={PURPLE} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Alert severity="info">No grant tracker statuses yet. Update them on the grant tracker page after approval.</Alert>
                  )}
                </Paper>
                <Paper sx={{ ...chartCard, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                  <Gauge value={overview.conversionRate} label="Awarded / applications" />
                  <Typography variant="body2" color="text.secondary">
                    {overview.awardedCount || 0} awarded of {overview.totalGrantApplications || 0} applications
                  </Typography>
                  <Button
                    onClick={() => router.push('/researcher/projects/proposals/grant-tracker')}
                    sx={{ color: PURPLE, textTransform: 'none', fontWeight: 700 }}
                  >
                    Open grant tracker
                  </Button>
                </Paper>
              </Stack>
            )}
          </>
        )}
      </Container>
    </Box>
  );
}
