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
  VerifiedUser as ComplianceIcon,
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
const RISK_COLOR = { MINIMAL: '#10b981', LOW: '#6366f1', MODERATE: '#f59e0b', HIGH: '#ef4444' };

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
      <CircularProgress variant="determinate" value={100} size={size} thickness={4} sx={{ color: 'rgba(139, 108, 188, 0.12)', position: 'absolute' }} />
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

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
const formatPercent = (n) => (n === null || n === undefined ? '—' : `${Math.round(n)}%`);
const daysUntil = (d) => (d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null);

const ComplianceAnalyticsPage = () => {
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
        const response = await fetch('/api/researcher/analytics/compliance');
        if (!response.ok) throw new Error('Failed to fetch compliance analytics');
        const json = await response.json();
        setData(json);
      } catch (err) {
        console.error('Error fetching compliance analytics:', err);
        setError('Could not load your compliance analytics. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    const fetchInsights = async () => {
      try {
        const response = await fetch('/api/researcher/analytics/compliance/insights');
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

  const { overview, ethics, dataProtection, imageIntegrity, training } = data;

  const ethicsPieData = ethics.statusCounts.filter((s) => s.count > 0);
  const imagePieData = imageIntegrity.statusCounts.filter((s) => s.count > 0);
  const trainingPieData = training.statusCounts.filter((s) => s.count > 0);
  const consentBarData = [
    { name: 'Anonymized', count: dataProtection.anonymizationCount },
    { name: 'Consent Waiver', count: dataProtection.consentWaiverCount },
    { name: 'Vulnerable Population', count: dataProtection.vulnerablePopulationCount }
  ];

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh' }}>
      <PageHeader
        title="Compliance Analytics"
        description="Ethics approvals, data protection, image integrity and training compliance"
        icon={<ComplianceIcon />}
        breadcrumbs={[
          { label: 'Dashboard', path: '/researcher', icon: <BusinessIcon /> },
          { label: 'Analytics', path: '/researcher/analytics', icon: <AnalyticsIcon /> },
          { label: 'Compliance Analytics', path: '/researcher/analytics/compliance', icon: <ComplianceIcon /> }
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
        {/* Overview Cards */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' },
          gap: 2,
          mb: 4
        }}>
          <StatCard label="Active Ethics Approvals" value={overview.activeEthicsApprovals} />
          <StatCard label="Expiring Within 90 Days" value={overview.expiringSoon} />
          <StatCard label="Image Integrity Clean Rate" value={formatPercent(overview.imageIntegrityCleanRate)} />
          <StatCard label="Flagged Image Cases" value={overview.flaggedImageCases} />
          <StatCard label="Training Completion" value={formatPercent(overview.trainingCompletionRate)} />
          <StatCard label="Certificates Held" value={overview.certificatesHeld} />
        </Box>

        {(overview.expiringSoon > 0 || overview.expiredApprovals > 0 || overview.overdueTrainings > 0) && (
          <Alert severity="warning" sx={{ mb: 4 }}>
            {[
              overview.expiredApprovals > 0 ? `${overview.expiredApprovals} ethics approval(s) expired` : null,
              overview.expiringSoon > 0 ? `${overview.expiringSoon} expiring within 90 days` : null,
              overview.overdueTrainings > 0 ? `${overview.overdueTrainings} training(s) overdue` : null
            ].filter(Boolean).join(' • ')}
          </Alert>
        )}

        {/* AI Insights Panel */}
        <Paper elevation={2} sx={{ mb: 4, p: 3, borderLeft: `4px solid ${PURPLE}` }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: PURPLE, mb: 2 }}>AI Insights</Typography>

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
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{insights.narrativeSummary}</Typography>

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
              <Tab label="Ethics & IRB Approvals" />
              <Tab label="Data Protection & Consent" />
              <Tab label="Image Integrity" />
              <Tab label="Training Certification" />
            </Tabs>
          </Box>

          <Box sx={{ p: 3 }}>
            {currentTab === 0 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: PURPLE }}>
                  Ethics &amp; IRB Approval Status
                </Typography>

                {ethicsPieData.length > 0 ? (
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 3 }}>
                    <Box sx={{ flex: '1 1 40%', minWidth: { xs: '100%', md: '280px' } }}>
                      <Card elevation={1} sx={{ p: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>By Status</Typography>
                        <ResponsiveContainer width="100%" height={260}>
                          <PieChart>
                            <Pie data={ethicsPieData} dataKey="count" nameKey="status" innerRadius={55} outerRadius={90} paddingAngle={2}>
                              {ethicsPieData.map((entry, i) => (
                                <Cell key={entry.status} fill={PALETTE[i % PALETTE.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </Card>
                    </Box>

                    {ethics.riskLevelCounts.length > 0 && (
                      <Box sx={{ flex: '1 1 35%', minWidth: { xs: '100%', md: '280px' } }}>
                        <Card elevation={1} sx={{ p: 2 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>By Risk Level</Typography>
                          <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={ethics.riskLevelCounts}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="level" tick={{ fontSize: 12 }} />
                              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                              <RechartsTooltip />
                              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                {ethics.riskLevelCounts.map((entry) => (
                                  <Cell key={entry.level} fill={RISK_COLOR[entry.level] || PURPLE} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </Card>
                      </Box>
                    )}

                    <Box sx={{ flex: '1 1 20%', minWidth: { xs: '100%', md: '220px' } }}>
                      <Card elevation={1} sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>Avg. Approval Turnaround</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', color: PURPLE, textAlign: 'center' }}>
                            {overview.avgEthicsTurnaroundDays !== null ? `${overview.avgEthicsTurnaroundDays} days` : '—'}
                          </Typography>
                        </Box>
                      </Card>
                    </Box>
                  </Box>
                ) : (
                  <Alert severity="info" sx={{ mb: 3 }}>No ethics applications on file yet.</Alert>
                )}

                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>Expiring Approvals (Next 90 Days)</Typography>
                {ethics.expiringApprovals.length > 0 ? (
                  <TableContainer component={Paper} elevation={1}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Application</TableCell>
                          <TableCell align="center">Expiry Date</TableCell>
                          <TableCell align="center">Days Remaining</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {ethics.expiringApprovals.map((e) => (
                          <TableRow key={e.id} hover>
                            <TableCell>{e.title}</TableCell>
                            <TableCell align="center">{formatDate(e.expiryDate)}</TableCell>
                            <TableCell align="center">
                              <Chip label={`${daysUntil(e.expiryDate)} days`} size="small" color="warning" />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="success">No approvals expiring in the next 90 days.</Alert>
                )}
              </Box>
            )}

            {currentTab === 1 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: PURPLE }}>
                  Data Protection &amp; Consent
                </Typography>

                {dataProtection.totalApplications > 0 ? (
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '1 1 60%', minWidth: { xs: '100%', md: '300px' } }}>
                      <Card elevation={1} sx={{ p: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                          Consent &amp; Data Handling Flags (across {dataProtection.totalApplications} application{dataProtection.totalApplications === 1 ? '' : 's'})
                        </Typography>
                        <ResponsiveContainer width="100%" height={240}>
                          <BarChart data={consentBarData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                            <RechartsTooltip />
                            <Bar dataKey="count" fill={PURPLE} radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Card>
                    </Box>

                    <Box sx={{ flex: '1 1 25%', minWidth: { xs: '100%', md: '220px' } }}>
                      <Card elevation={1} sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Gauge value={dataProtection.anonymizationRate} label="Data Anonymization Rate" />
                      </Card>
                    </Box>
                  </Box>
                ) : (
                  <Alert severity="info">No ethics applications on file yet to derive data protection metrics from.</Alert>
                )}
              </Box>
            )}

            {currentTab === 2 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: PURPLE }}>
                  Image Integrity Checks
                </Typography>

                {imagePieData.length > 0 ? (
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 3 }}>
                    <Box sx={{ flex: '1 1 45%', minWidth: { xs: '100%', md: '280px' } }}>
                      <Card elevation={1} sx={{ p: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Case Status</Typography>
                        <ResponsiveContainer width="100%" height={260}>
                          <PieChart>
                            <Pie data={imagePieData} dataKey="count" nameKey="status" innerRadius={55} outerRadius={90} paddingAngle={2}>
                              {imagePieData.map((entry, i) => (
                                <Cell key={entry.status} fill={PALETTE[i % PALETTE.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </Card>
                    </Box>

                    <Box sx={{ flex: '1 1 20%', minWidth: { xs: '100%', md: '220px' } }}>
                      <Card elevation={1} sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Gauge value={imageIntegrity.cleanRate} label="Clean Rate (of completed checks)" />
                      </Card>
                    </Box>
                  </Box>
                ) : (
                  <Alert severity="info" sx={{ mb: 3 }}>No image integrity checks submitted yet.</Alert>
                )}

                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>Flagged Cases</Typography>
                {imageIntegrity.flaggedCases.length > 0 ? (
                  <TableContainer component={Paper} elevation={1}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Case</TableCell>
                          <TableCell align="center">Manipulation Flags</TableCell>
                          <TableCell align="center">Similarity Flags</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {imageIntegrity.flaggedCases.map((c) => (
                          <TableRow key={c.id} hover>
                            <TableCell>{c.title}</TableCell>
                            <TableCell align="center">
                              {c.manipulationCount > 0 ? <Chip label={c.manipulationCount} size="small" color="error" /> : '—'}
                            </TableCell>
                            <TableCell align="center">
                              {c.similarityCount > 0 ? <Chip label={c.similarityCount} size="small" color="warning" /> : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="success">No flagged cases among completed checks.</Alert>
                )}
              </Box>
            )}

            {currentTab === 3 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: PURPLE }}>
                  Training Certification
                </Typography>

                {trainingPieData.length > 0 ? (
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 3 }}>
                    <Box sx={{ flex: '1 1 45%', minWidth: { xs: '100%', md: '280px' } }}>
                      <Card elevation={1} sx={{ p: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Registration Status</Typography>
                        <ResponsiveContainer width="100%" height={260}>
                          <PieChart>
                            <Pie data={trainingPieData} dataKey="count" nameKey="status" innerRadius={55} outerRadius={90} paddingAngle={2}>
                              {trainingPieData.map((entry, i) => {
                                const colorMap = { Completed: '#10b981', Registered: '#6366f1', Cancelled: '#94a3b8' };
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
                        <Gauge value={training.completionRate} label="Completion Rate" />
                      </Card>
                    </Box>
                  </Box>
                ) : (
                  <Alert severity="info" sx={{ mb: 3 }}>No training registrations on file yet.</Alert>
                )}

                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: '1 1 48%', minWidth: { xs: '100%', md: '280px' } }}>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>Overdue Trainings</Typography>
                    {training.overdueTrainings.length > 0 ? (
                      <TableContainer component={Paper} elevation={1}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Training</TableCell>
                              <TableCell align="center">Ended</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {training.overdueTrainings.map((tr, i) => (
                              <TableRow key={i} hover>
                                <TableCell>{tr.title}</TableCell>
                                <TableCell align="center">
                                  <Chip label={formatDate(tr.endDate)} size="small" color="error" />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Alert severity="success">No overdue trainings.</Alert>
                    )}
                  </Box>

                  <Box sx={{ flex: '1 1 48%', minWidth: { xs: '100%', md: '280px' } }}>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>Upcoming Trainings</Typography>
                    {training.upcomingTrainings.length > 0 ? (
                      <TableContainer component={Paper} elevation={1}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Training</TableCell>
                              <TableCell align="center">Starts</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {training.upcomingTrainings.map((tr, i) => (
                              <TableRow key={i} hover>
                                <TableCell>{tr.title}</TableCell>
                                <TableCell align="center">{formatDate(tr.startDate)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Alert severity="info">No upcoming trainings scheduled.</Alert>
                    )}
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ComplianceAnalyticsPage;
