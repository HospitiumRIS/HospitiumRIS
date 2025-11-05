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
  Divider,
  CircularProgress,
  Tabs,
  Tab,
  Alert
} from '@mui/material';
import {
  TrendingUp as ImpactIcon,
  School as CitationIcon,
  Public as ReachIcon,
  Star as MetricIcon,
  Article as PublicationIcon,
  People as CollaborationIcon,
  Assessment as AnalyticsIcon,
  Timeline as TrendIcon,
  Business as BusinessIcon,
  Visibility as ViewsIcon,
  Download as DownloadIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import { format, subMonths } from 'date-fns';

import PageHeader from '../../../../components/common/PageHeader';
import { useAuth } from '../../../../components/AuthProvider';

const ResearchImpactPage = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [impactData, setImpactData] = useState(null);

  // Mock data - replace with real API calls
  useEffect(() => {
    const fetchImpactData = async () => {
      // Simulate API call
      setTimeout(() => {
        setImpactData({
          overview: {
            totalCitations: 342,
            hIndex: 12,
            i10Index: 8,
            totalPublications: 24,
            totalViews: 15420,
            totalDownloads: 8765,
            collaborators: 45,
            researchScore: 85.7
          },
          citationTrend: [
            { month: 'Jan', citations: 25 },
            { month: 'Feb', citations: 28 },
            { month: 'Mar', citations: 35 },
            { month: 'Apr', citations: 42 },
            { month: 'May', citations: 38 },
            { month: 'Jun', citations: 45 }
          ],
          topPublications: [
            {
              title: 'Machine Learning Applications in Healthcare Data Analysis',
              citations: 87,
              year: 2023,
              journal: 'Nature Digital Medicine',
              impact: 'High'
            },
            {
              title: 'Personalized Treatment Protocols for Chronic Diseases',
              citations: 64,
              year: 2022,
              journal: 'JAMA Network Open',
              impact: 'High'
            },
            {
              title: 'AI-Driven Drug Discovery in Sub-Saharan Africa',
              citations: 52,
              year: 2023,
              journal: 'Science Translational Medicine',
              impact: 'Medium'
            }
          ],
          collaborationNetwork: [
            { institution: 'University of Nairobi', collaborations: 12, country: 'Kenya' },
            { institution: 'Harvard Medical School', collaborations: 8, country: 'USA' },
            { institution: 'Oxford University', collaborations: 6, country: 'UK' },
            { institution: 'University of Cape Town', collaborations: 5, country: 'South Africa' }
          ],
          metrics: {
            altmetricScore: 78,
            socialMediaMentions: 156,
            newsArticles: 23,
            policyDocuments: 4,
            blogPosts: 89
          }
        });
        setLoading(false);
      }, 1000);
    };

    fetchImpactData();
  }, []);

  const getImpactColor = (impact) => {
    switch (impact?.toLowerCase()) {
      case 'high': return 'success';
      case 'medium': return 'warning';
      case 'low': return 'error';
      default: return 'default';
    }
  };

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
        title="Research Impact Analytics"
        description="Track your research influence, citations, collaborations, and scholarly impact metrics"
        icon={<ImpactIcon />}
        breadcrumbs={[
          { label: 'Dashboard', path: '/researcher', icon: <BusinessIcon /> },
          { label: 'Analytics', path: '/researcher/analytics', icon: <AnalyticsIcon /> },
          { label: 'Research Impact', path: '/researcher/analytics/impact', icon: <ImpactIcon /> },
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
        {/* Impact Overview Cards */}
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
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>Total Citations</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                    {impactData.overview.totalCitations}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}>
                  <CitationIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>

          <Card elevation={2} sx={{ bgcolor: '#8b6cbc' }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>H-Index</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                    {impactData.overview.hIndex}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}>
                  <MetricIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>

          <Card elevation={2} sx={{ bgcolor: '#8b6cbc' }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>Publications</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                    {impactData.overview.totalPublications}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}>
                  <PublicationIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>

          <Card elevation={2} sx={{ bgcolor: '#8b6cbc' }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>Research Score</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                    {impactData.overview.researchScore}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}>
                  <TrendIcon />
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
              <Tab label="Citation Analytics" />
              <Tab label="Publication Impact" />
              <Tab label="Collaboration Network" />
              <Tab label="Alternative Metrics" />
            </Tabs>
          </Box>

          <Box sx={{ p: 3 }}>
            {currentTab === 0 && (
              <Box>
                {/* Citation Analytics Tab */}
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#8b6cbc' }}>
                  Citation Analytics & Trends
                </Typography>

                <Grid container spacing={3}>
                  {/* Citation Trend Chart */}
                  <Grid item xs={12} md={8}>
                    <Card elevation={1} sx={{ p: 2, mb: 3 }}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Citation Trend (Last 6 Months)
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'end', gap: 2, height: 200 }}>
                        {impactData.citationTrend.map((item, index) => (
                          <Box key={index} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Box
                              sx={{
                                width: '100%',
                                height: `${(item.citations / 50) * 150}px`,
                                bgcolor: '#8b6cbc',
                                borderRadius: 1,
                                mb: 1,
                                minHeight: 20
                              }}
                            />
                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                              {item.citations}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.month}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Card>
                  </Grid>

                  {/* Key Metrics */}
                  <Grid item xs={12} md={4}>
                    <Card elevation={1} sx={{ p: 2, height: 'fit-content' }}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Key Citation Metrics
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">H-Index</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#8b6cbc' }}>
                            {impactData.overview.hIndex}
                          </Typography>
                        </Box>
                        <Divider />
                        <Box>
                          <Typography variant="body2" color="text.secondary">i10-Index</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#8b6cbc' }}>
                            {impactData.overview.i10Index}
                          </Typography>
                        </Box>
                        <Divider />
                        <Box>
                          <Typography variant="body2" color="text.secondary">Average Citations per Paper</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#8b6cbc' }}>
                            {Math.round(impactData.overview.totalCitations / impactData.overview.totalPublications)}
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}

            {currentTab === 1 && (
              <Box>
                {/* Publication Impact Tab */}
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#8b6cbc' }}>
                  Top Publications by Impact
                </Typography>

                <TableContainer component={Paper} elevation={1}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Publication Title</TableCell>
                        <TableCell align="center">Citations</TableCell>
                        <TableCell align="center">Year</TableCell>
                        <TableCell>Journal</TableCell>
                        <TableCell align="center">Impact Level</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {impactData.topPublications.map((pub, index) => (
                        <TableRow key={index} hover>
                          <TableCell>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                              {pub.title}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#8b6cbc' }}>
                              {pub.citations}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">{pub.year}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                              {pub.journal}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={pub.impact} 
                              size="small"
                              color={getImpactColor(pub.impact)}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Button size="small" startIcon={<ViewsIcon />}>
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {currentTab === 2 && (
              <Box>
                {/* Collaboration Network Tab */}
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#8b6cbc' }}>
                  Research Collaboration Network
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Card elevation={1} sx={{ p: 2 }}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Top Collaborative Institutions
                      </Typography>
                      <List>
                        {impactData.collaborationNetwork.map((collab, index) => (
                          <ListItem key={index}>
                            <Avatar sx={{ bgcolor: '#8b6cbc', mr: 2 }}>
                              <CollaborationIcon />
                            </Avatar>
                            <ListItemText
                              primary={
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                  {collab.institution}
                                </Typography>
                              }
                              secondary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    {collab.country} • {collab.collaborations} collaborations
                                  </Typography>
                                </Box>
                              }
                            />
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={(collab.collaborations / 12) * 100}
                                sx={{
                                  width: 60,
                                  height: 6,
                                  borderRadius: 3,
                                  bgcolor: 'rgba(139, 108, 188, 0.1)',
                                  '& .MuiLinearProgress-bar': { bgcolor: '#8b6cbc' }
                                }}
                              />
                              <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#8b6cbc' }}>
                                {collab.collaborations}
                              </Typography>
                            </Box>
                          </ListItem>
                        ))}
                      </List>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Card elevation={1} sx={{ p: 2 }}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Collaboration Stats
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#8b6cbc' }}>
                            {impactData.overview.collaborators}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Collaborators
                          </Typography>
                        </Box>
                        <Divider />
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#8b6cbc' }}>
                            {impactData.collaborationNetwork.length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Partner Institutions
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
                {/* Alternative Metrics Tab */}
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#8b6cbc' }}>
                  Alternative Impact Metrics
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card elevation={1} sx={{ p: 2 }}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Altmetric Score
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Typography variant="h2" sx={{ fontWeight: 'bold', color: '#8b6cbc' }}>
                          {impactData.metrics.altmetricScore}
                        </Typography>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Overall Altmetric Score
                          </Typography>
                          <Typography variant="caption" color="success.main">
                            Top 5% in your field
                          </Typography>
                        </Box>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={impactData.metrics.altmetricScore}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'rgba(139, 108, 188, 0.1)',
                          '& .MuiLinearProgress-bar': { bgcolor: '#8b6cbc' }
                        }}
                      />
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card elevation={1} sx={{ p: 2 }}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Social & Media Impact
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2">Social Media Mentions</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#8b6cbc' }}>
                            {impactData.metrics.socialMediaMentions}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2">News Articles</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#8b6cbc' }}>
                            {impactData.metrics.newsArticles}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2">Policy Documents</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#8b6cbc' }}>
                            {impactData.metrics.policyDocuments}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2">Blog Posts</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#8b6cbc' }}>
                            {impactData.metrics.blogPosts}
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                </Grid>

                <Alert severity="info" sx={{ mt: 3 }}>
                  <Typography variant="body2">
                    <strong>Alternative metrics (altmetrics)</strong> capture the online attention that research receives 
                    through social media, news outlets, policy documents, and other digital platforms, providing a broader 
                    view of research impact beyond traditional citations.
                  </Typography>
                </Alert>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ResearchImpactPage;
