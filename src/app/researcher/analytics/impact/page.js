'use client';

import React, { useState, useEffect, useMemo } from 'react';
import ResearchNetworkWidget from '../../../../components/ResearchNetwork';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Paper,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Tabs,
  Tab,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton
} from '@mui/material';
import {
  TrendingUp as ImpactIcon,
  Assessment as AnalyticsIcon,
  Business as BusinessIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
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

const ResearchImpactPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [impactData, setImpactData] = useState(null);
  const [error, setError] = useState(null);

  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [insightsError, setInsightsError] = useState(null);

  const [impactFilter, setImpactFilter] = useState('All');
  const [sortBy, setSortBy] = useState('citations');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    const fetchImpactData = async () => {
      try {
        const response = await fetch('/api/researcher/analytics/impact');
        if (!response.ok) throw new Error('Failed to fetch impact data');
        const data = await response.json();
        setImpactData(data);
      } catch (err) {
        console.error('Error fetching impact data:', err);
        setError('Could not load your impact analytics. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    const fetchInsights = async () => {
      try {
        const response = await fetch('/api/researcher/analytics/impact/insights');
        if (!response.ok) throw new Error('Failed to fetch AI insights');
        const data = await response.json();
        setInsights(data);
      } catch (err) {
        console.error('Error fetching AI insights:', err);
        setInsightsError('AI insights are temporarily unavailable.');
      } finally {
        setInsightsLoading(false);
      }
    };

    fetchImpactData();
    fetchInsights();
  }, []);

  const getImpactColor = (impact) => {
    switch (impact?.toLowerCase()) {
      case 'high': return 'success';
      case 'medium': return 'warning';
      case 'low': return 'error';
      default: return 'default';
    }
  };

  const filteredSortedPublications = useMemo(() => {
    if (!impactData?.topPublications) return [];
    let pubs = [...impactData.topPublications];
    if (impactFilter !== 'All') {
      pubs = pubs.filter((p) => p.impact === impactFilter);
    }
    pubs.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'title') return a.title.localeCompare(b.title) * dir;
      return ((a[sortBy] || 0) - (b[sortBy] || 0)) * dir;
    });
    return pubs;
  }, [impactData, impactFilter, sortBy, sortDir]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  const handleExport = () => {
    window.print();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={60} sx={{ color: PURPLE }} />
      </Box>
    );
  }

  if (error || !impactData) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'No data available.'}</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh' }}>
      <PageHeader
        title={t('researcher.impact_analytics')}
        description={t('researcher.impact_analytics_desc')}
        icon={<ImpactIcon />}
        breadcrumbs={[
          { label: 'Dashboard', path: '/researcher', icon: <BusinessIcon /> },
          { label: 'Analytics', path: '/researcher/analytics', icon: <AnalyticsIcon /> },
          { label: 'Research Impact', path: '/researcher/analytics/impact', icon: <ImpactIcon /> }
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
        sx={{ mt: '80px' }}
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Overview Cards */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 2.5,
          mb: 4
        }}>
          <StatCard label="Total Citations" value={impactData.overview.totalCitations} />
          <StatCard label="H-Index" value={impactData.overview.hIndex} />
          <StatCard label="Publications" value={impactData.overview.totalPublications} />
          <StatCard label="Research Score" value={impactData.overview.researchScore} />
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

          {!insightsLoading && insightsError && (
            <Alert severity="info">{insightsError}</Alert>
          )}

          {!insightsLoading && insights && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Summary</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {insights.narrativeSummary}
                </Typography>

                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Growth Recommendations
                </Typography>
                <List dense disablePadding>
                  {(insights.growthRecommendations || []).map((rec, i) => (
                    <ListItem key={i} disableGutters sx={{ display: 'list-item', listStyleType: 'disc', ml: 2, py: 0.25 }}>
                      <Typography variant="body2" color="text.secondary">{rec}</Typography>
                    </ListItem>
                  ))}
                </List>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Standout Publication
                </Typography>
                {insights.standoutPublication?.title ? (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{insights.standoutPublication.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{insights.standoutPublication.reason}</Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Not enough publication data yet.
                  </Typography>
                )}

                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Peer Comparison
                </Typography>
                <Typography variant="body2" color="text.secondary">{insights.peerComparison}</Typography>
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
              <Tab label="Citation Analytics" />
              <Tab label="Publication Impact" />
              <Tab label="Collaboration Network" />
              <Tab label="Public Reach & Trajectory" />
            </Tabs>
          </Box>

          <Box sx={{ p: 3 }}>
            {currentTab === 0 && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: PURPLE }}>
                    Citation Analytics &amp; Trends
                  </Typography>
                  <EstimatedChip />
                </Box>

                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: '1 1 65%', minWidth: { xs: '100%', md: '300px' } }}>
                    <Card elevation={1} sx={{ p: 2, mb: 3 }}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Citation Trend (Last 12 Months)
                      </Typography>
                      <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={impactData.citationTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="citationGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={PURPLE} stopOpacity={0.5} />
                              <stop offset="95%" stopColor={PURPLE} stopOpacity={0.05} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                          <RechartsTooltip />
                          <Area type="monotone" dataKey="citations" stroke={PURPLE} fill="url(#citationGradient)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Card>
                  </Box>

                  <Box sx={{ flex: '1 1 30%', minWidth: { xs: '100%', md: '250px' } }}>
                    <Card elevation={1} sx={{ p: 2, height: 'fit-content' }}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Key Citation Metrics
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">H-Index</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', color: PURPLE }}>
                            {impactData.overview.hIndex}
                          </Typography>
                        </Box>
                        <Divider />
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                            i10-Index <EstimatedChip />
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', color: PURPLE }}>
                            {impactData.overview.i10Index}
                          </Typography>
                        </Box>
                        <Divider />
                        <Box>
                          <Typography variant="body2" color="text.secondary">Average Citations per Paper</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', color: PURPLE }}>
                            {impactData.overview.totalPublications > 0
                              ? Math.round(impactData.overview.totalCitations / impactData.overview.totalPublications)
                              : 0}
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  </Box>
                </Box>
              </Box>
            )}

            {currentTab === 1 && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: PURPLE }}>
                    Top Publications by Impact
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Impact Level</InputLabel>
                    <Select
                      label="Impact Level"
                      value={impactFilter}
                      onChange={(e) => setImpactFilter(e.target.value)}
                    >
                      <MenuItem value="All">All</MenuItem>
                      <MenuItem value="High">High</MenuItem>
                      <MenuItem value="Medium">Medium</MenuItem>
                      <MenuItem value="Low">Low</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {impactData.topPublications.length > 0 && (
                  <Card elevation={1} sx={{ p: 2, mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                      Citations by Publication (Top 10)
                    </Typography>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={impactData.topPublications.slice(0, 10)} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="title"
                          tick={{ fontSize: 10 }}
                          interval={0}
                          angle={-30}
                          textAnchor="end"
                          height={60}
                          tickFormatter={(value) => (value.length > 18 ? `${value.slice(0, 18)}…` : value)}
                        />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <RechartsTooltip />
                        <Bar dataKey="citations" fill={PURPLE} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                )}

                <TableContainer component={Paper} elevation={1}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <TableSortLabel active={sortBy === 'title'} direction={sortDir} onClick={() => handleSort('title')}>
                            Publication Title
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="center">
                          <TableSortLabel active={sortBy === 'citations'} direction={sortDir} onClick={() => handleSort('citations')}>
                            Citations
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="center">
                          <TableSortLabel active={sortBy === 'year'} direction={sortDir} onClick={() => handleSort('year')}>
                            Year
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>Journal</TableCell>
                        <TableCell align="center">Impact Level</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredSortedPublications.map((pub) => (
                        <TableRow key={pub.id} hover>
                          <TableCell>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                              {pub.title}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: PURPLE }}>
                              {pub.citations}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">{pub.year || '—'}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>{pub.journal}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={pub.impact} size="small" color={getImpactColor(pub.impact)} />
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredSortedPublications.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                              No publications match this filter.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {currentTab === 2 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: PURPLE }}>
                  Research Collaboration Network
                </Typography>

                <Box sx={{ mb: 4, minHeight: 500 }}>
                  <ResearchNetworkWidget />
                </Box>

                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: '1 1 65%', minWidth: { xs: '100%', md: '300px' } }}>
                    <Card elevation={1} sx={{ p: 2 }}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Top Collaborative Institutions
                      </Typography>
                      <List>
                        {impactData.collaborationNetwork.map((collab, index) => (
                          <ListItem key={index} divider={index < impactData.collaborationNetwork.length - 1}>
                            <ListItemText
                              primary={
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                  {collab.institution}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="body2" color="text.secondary">
                                  {collab.country} • {collab.collaborations} collaborations
                                </Typography>
                              }
                            />
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(100, (collab.collaborations / 12) * 100)}
                                sx={{
                                  width: 60,
                                  height: 6,
                                  borderRadius: 3,
                                  bgcolor: 'rgba(139, 108, 188, 0.1)',
                                  '& .MuiLinearProgress-bar': { bgcolor: PURPLE }
                                }}
                              />
                              <Typography variant="caption" sx={{ fontWeight: 'bold', color: PURPLE }}>
                                {collab.collaborations}
                              </Typography>
                            </Box>
                          </ListItem>
                        ))}
                        {impactData.collaborationNetwork.length === 0 && (
                          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                            No co-authored publications tracked yet.
                          </Typography>
                        )}
                      </List>
                    </Card>
                  </Box>

                  <Box sx={{ flex: '1 1 30%', minWidth: { xs: '100%', md: '250px' } }}>
                    <Card elevation={1} sx={{ p: 2 }}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Collaboration Stats
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h3" sx={{ fontWeight: 'bold', color: PURPLE }}>
                            {impactData.overview.collaborators}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">Total Collaborators</Typography>
                        </Box>
                        <Divider />
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h3" sx={{ fontWeight: 'bold', color: PURPLE }}>
                            {impactData.collaborationNetwork.length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">Partner Institutions</Typography>
                        </Box>
                      </Box>
                    </Card>
                  </Box>
                </Box>
              </Box>
            )}

            {currentTab === 3 && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: PURPLE }}>
                    Public Reach &amp; Altmetrics
                  </Typography>
                  <EstimatedChip />
                </Box>
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' },
                  gap: 2,
                  mb: 4
                }}>
                  <Card elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{impactData.overview.totalViews.toLocaleString()}</Typography>
                    <Typography variant="caption" color="text.secondary">Views</Typography>
                  </Card>
                  <Card elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{impactData.overview.totalDownloads.toLocaleString()}</Typography>
                    <Typography variant="caption" color="text.secondary">Downloads</Typography>
                  </Card>
                  <Card elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{impactData.metrics.altmetricScore}</Typography>
                    <Typography variant="caption" color="text.secondary">Altmetric Score</Typography>
                  </Card>
                  <Card elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{impactData.metrics.socialMediaMentions}</Typography>
                    <Typography variant="caption" color="text.secondary">Social Mentions</Typography>
                  </Card>
                  <Card elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{impactData.metrics.newsArticles}</Typography>
                    <Typography variant="caption" color="text.secondary">News Articles</Typography>
                  </Card>
                </Box>

                <Divider sx={{ my: 4 }} />

                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: PURPLE }}>
                  Research Trajectory
                </Typography>
                {impactData.trajectory.length > 0 ? (
                  <Card elevation={1} sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Publications and citations per year, based on your actual publication record.
                    </Typography>
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={impactData.trajectory}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <RechartsTooltip />
                        <Legend />
                        <Line type="monotone" dataKey="publications" name="Publications" stroke={PURPLE} strokeWidth={2} />
                        <Line type="monotone" dataKey="citations" name="Citations" stroke="#f59e0b" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>
                ) : (
                  <Alert severity="info">
                    Not enough publication history yet to chart a trajectory.
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ResearchImpactPage;
