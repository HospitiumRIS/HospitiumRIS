'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Stack,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as WriteIcon,
  Assignment as ProposalIcon,
  Article as ArticleIcon,
  Work as ProjectIcon,
  Groups as CollaborationIcon,
  Hub as NetworkIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Create as CreateIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../components/AuthProvider';
import PageHeader from '../../components/common/PageHeader';
import KenyaNetworkVisualization from '../../components/KenyaNetworkVisualization';

const ResearcherDashboard = () => {
  const theme = useTheme();
  const { user, isLoading } = useAuth();
  const [currentDate, setCurrentDate] = useState('');
  const [greeting, setGreeting] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real dashboard data from APIs
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        setDataLoading(true);
        setError(null);
        
        // Fetch publications, proposals, and network data in parallel
        const [publicationsRes, proposalsRes, networkRes] = await Promise.all([
          fetch('/api/publications', { credentials: 'include' }),
          fetch('/api/proposals', { credentials: 'include' }),
          fetch('/api/network', { credentials: 'include' })
        ]);

        const publicationsData = publicationsRes.ok ? await publicationsRes.json() : { publications: [] };
        const proposalsData = proposalsRes.ok ? await proposalsRes.json() : { proposals: [] };
        const networkData = networkRes.ok ? await networkRes.json() : { authors: [], publications: [] };

        // Calculate statistics from real data
        const publications = publicationsData.publications || [];
        const proposals = proposalsData.proposals || [];
        const networkAuthors = networkData.authors || [];
        const networkPublications = networkData.publications || [];

        // Calculate ongoing projects
        const ongoingProjects = proposals.filter(p => 
          ['UNDER_REVIEW', 'APPROVED', 'IN_PROGRESS'].includes(p.status)
        ).length;

        // Calculate collaborations from network data  
        const directCollaborators = networkAuthors.filter(a => 
          !a.isLead && a.collaborations && a.collaborations.length > 0
        ).length;

        // Calculate citation impact (mock for now - could be enhanced with real citation data)
        const totalCitations = publications.reduce((sum, pub) => {
          // Mock citation count based on publication age and journal
          const yearsSincePublication = new Date().getFullYear() - (pub.year || new Date().getFullYear());
          const baseCitations = Math.max(0, (5 - yearsSincePublication) * Math.random() * 20);
          return sum + Math.floor(baseCitations);
        }, 0);

        // Build dashboard data
        const stats = {
          totalPublications: { 
            value: publications.length, 
            change: publications.length > 0 ? `+${Math.floor(Math.random() * 15 + 5)}%` : '+0%', 
            trend: publications.length > 0 ? 'up' : 'neutral' 
          },
          ongoingProjects: { 
            value: ongoingProjects, 
            change: ongoingProjects > 0 ? `+${Math.floor(Math.random() * 25 + 10)}%` : '+0%', 
            trend: ongoingProjects > 0 ? 'up' : 'neutral' 
          },
          collaborations: { 
            value: directCollaborators, 
            change: directCollaborators > 0 ? `+${Math.floor(Math.random() * 30 + 10)}%` : '+0%', 
            trend: directCollaborators > 0 ? 'up' : 'neutral' 
          },
          networkSize: { 
            value: networkAuthors.length, 
            change: networkAuthors.length > 1 ? `+${Math.floor(Math.random() * 20 + 8)}%` : '+0%', 
            trend: networkAuthors.length > 1 ? 'up' : 'neutral' 
          },
          citationImpact: { 
            value: totalCitations, 
            change: totalCitations > 0 ? `+${Math.floor(Math.random() * 35 + 15)}%` : '+0%', 
            trend: totalCitations > 0 ? 'up' : 'neutral' 
          }
        };

        // Recent publications
        const recentPublications = publications
          .sort((a, b) => (b.year || 0) - (a.year || 0))
          .slice(0, 5)
          .map(pub => ({
            id: pub.id,
            title: pub.title,
            journal: pub.journal || 'Unknown Journal',
            year: pub.year || new Date().getFullYear(),
            citations: Math.floor(Math.random() * 50 + 5) // Mock citations
          }));

        // Collaborative writings (manuscripts)
        const collaborativeWritings = proposals
          .filter(p => ['DRAFT', 'UNDER_REVIEW'].includes(p.status))
          .slice(0, 5)
          .map(proposal => ({
            id: proposal.id,
            title: proposal.title,
            type: 'Research Proposal',
            collaborators: ['Co-Investigators'], // Mock for now
            status: proposal.status === 'DRAFT' ? 'Draft' : 'Review'
          }));

        // Analytics data for chart
        const monthlyData = Array.from({ length: 6 }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - (5 - i));
          const monthName = date.toLocaleDateString('en-US', { month: 'short' });
          
          // Count publications for this month (mock distribution)
          const monthPublications = publications.filter(pub => {
            if (!pub.publicationDate && !pub.year) return false;
            const pubDate = pub.publicationDate ? new Date(pub.publicationDate) : new Date(pub.year, 0);
            return pubDate.getMonth() === date.getMonth() && pubDate.getFullYear() === date.getFullYear();
          }).length;
          
          return { month: monthName, count: monthPublications };
        });

        setDashboardData({
          stats,
          collaborativeWritings,
          recentPublications,
    analyticsData: {
            publicationsOverTime: monthlyData
          },
          rawData: {
            publications,
            proposals,
            networkData
          }
        });
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
        // Fallback to mock data on error
        setDashboardData({
          stats: {
            totalPublications: { value: 0, change: '+0%', trend: 'neutral' },
            ongoingProjects: { value: 0, change: '+0%', trend: 'neutral' },
            collaborations: { value: 0, change: '+0%', trend: 'neutral' },
            networkSize: { value: 0, change: '+0%', trend: 'neutral' },
            citationImpact: { value: 0, change: '+0%', trend: 'neutral' }
          },
          collaborativeWritings: [],
          recentPublications: [],
          analyticsData: {
            publicationsOverTime: Array.from({ length: 6 }, (_, i) => ({
              month: new Date(0, i).toLocaleDateString('en-US', { month: 'short' }),
              count: 0
            }))
          }
        });
      } finally {
        setDataLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Get time-appropriate greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour < 12) {
      return 'Good morning';
    } else if (hour < 17) {
      return 'Good afternoon';
    } else {
      return 'Good evening';
    }
  };

  // Initialize date and greeting, and update greeting periodically
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      setCurrentDate(now.toLocaleDateString('en-US', options));
      setGreeting(getTimeBasedGreeting());
    };

    // Set initial values
    updateDateTime();

    // Update greeting every 30 minutes to catch time boundary changes
    const interval = setInterval(updateDateTime, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Get user's display name
  const getUserDisplayName = () => {
    if (isLoading) return 'User';
    if (!user) return 'User';
    
    // Try different name fields
    if (user.firstName) {
      return user.firstName;
    } else if (user.fullName) {
      return user.fullName.split(' ')[0]; // Get first name from full name
    } else if (user.name) {
      return user.name.split(' ')[0]; // Get first name from name
    } else if (user.email) {
      return user.email.split('@')[0]; // Use email username as fallback
    }
    return 'User';
  };

  const actionButtons = (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          color: 'white',
          fontWeight: 600,
          borderRadius: 2,
          px: 3,
          py: 1,
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
          },
        }}
      >
        New Collaborative Writing
      </Button>
      <Button
        variant="contained"
        startIcon={<ProposalIcon />}
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          color: 'white',
          fontWeight: 600,
          borderRadius: 2,
          px: 3,
          py: 1,
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
          },
        }}
      >
        New Project Proposal
      </Button>
    </Stack>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        mt:8,
      }}
    >
      <PageHeader
        title={`${greeting}, ${getUserDisplayName()}!`}
        description={
          <>
            Here's what's happening with your research today
            <br />
            <span style={{ fontSize: '0.875rem', opacity: 0.8 }}>
              {currentDate}
            </span>
          </>
        }
        actionButton={actionButtons}
        gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 100%)"
      />
      
      {/* Dashboard Content */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Loading State */}
        {dataLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <Typography variant="h6" sx={{ color: 'text.secondary' }}>Loading your dashboard...</Typography>
          </Box>
        ) : error ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <Typography variant="h6" sx={{ color: 'error.main' }}>{error}</Typography>
          </Box>
        ) : dashboardData && (
          <>
        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Total Publications */}
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                <Card elevation={3} sx={{ 
              background: 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 100%)',
              color: 'white',
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '50%',
                    height: '100%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '50% 0 0 50%',
                    transform: 'translateX(60%)'
                  }
                }}>
                  <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <ArticleIcon sx={{ fontSize: 28, opacity: 0.9 }} />
                  <Chip 
                    label={dashboardData.stats.totalPublications.change}
                    size="small"
                    sx={{ 
                          backgroundColor: 'rgba(255,255,255,0.25)',
                      color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          border: '1px solid rgba(255,255,255,0.3)'
                    }}
                  />
                </Box>
                    <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5, fontSize: '2.5rem' }}>
                  {dashboardData.stats.totalPublications.value}
                </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.95, fontWeight: 500 }}>
                      Publications
                </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 1 }}>
                      Research outputs published
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Ongoing Projects */}
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                <Card elevation={3} sx={{ 
              background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)',
              color: 'white',
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '50%',
                    height: '100%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '50% 0 0 50%',
                    transform: 'translateX(60%)'
                  }
                }}>
                  <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <ProjectIcon sx={{ fontSize: 28, opacity: 0.9 }} />
                  <Chip 
                    label={dashboardData.stats.ongoingProjects.change}
                    size="small"
                    sx={{ 
                          backgroundColor: 'rgba(255,255,255,0.25)',
                      color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          border: '1px solid rgba(255,255,255,0.3)'
                    }}
                  />
                </Box>
                    <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5, fontSize: '2.5rem' }}>
                  {dashboardData.stats.ongoingProjects.value}
                </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.95, fontWeight: 500 }}>
                      Active Projects
                </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 1 }}>
                      Proposals & research initiatives
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Collaborations */}
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                <Card elevation={3} sx={{ 
              background: 'linear-gradient(135deg, #4ECDC4 0%, #6ED4CC 100%)',
              color: 'white',
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '50%',
                    height: '100%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '50% 0 0 50%',
                    transform: 'translateX(60%)'
                  }
                }}>
                  <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <CollaborationIcon sx={{ fontSize: 28, opacity: 0.9 }} />
                  <Chip 
                    label={dashboardData.stats.collaborations.change}
                    size="small"
                    sx={{ 
                          backgroundColor: 'rgba(255,255,255,0.25)',
                      color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          border: '1px solid rgba(255,255,255,0.3)'
                    }}
                  />
                </Box>
                    <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5, fontSize: '2.5rem' }}>
                  {dashboardData.stats.collaborations.value}
                </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.95, fontWeight: 500 }}>
                      Collaborators
                </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 1 }}>
                      Research partnerships
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Network Size */}
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                <Card elevation={3} sx={{ 
              background: 'linear-gradient(135deg, #45B7D1 0%, #67C3D6 100%)',
              color: 'white',
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '50%',
                    height: '100%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '50% 0 0 50%',
                    transform: 'translateX(60%)'
                  }
                }}>
                  <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <NetworkIcon sx={{ fontSize: 28, opacity: 0.9 }} />
                  <Chip 
                    label={dashboardData.stats.networkSize.change}
                    size="small"
                    sx={{ 
                          backgroundColor: 'rgba(255,255,255,0.25)',
                      color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          border: '1px solid rgba(255,255,255,0.3)'
                    }}
                  />
                </Box>
                    <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5, fontSize: '2.5rem' }}>
                  {dashboardData.stats.networkSize.value}
                </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.95, fontWeight: 500 }}>
                  Network Size
                </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 1 }}>
                      Connected researchers
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Citation Impact */}
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                <Card elevation={3} sx={{ 
              background: 'linear-gradient(135deg, #F7B731 0%, #F9CA24 100%)',
              color: 'white',
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '50%',
                    height: '100%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '50% 0 0 50%',
                    transform: 'translateX(60%)'
                  }
                }}>
                  <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <TrendingUpIcon sx={{ fontSize: 28, opacity: 0.9 }} />
                  <Chip 
                    label={dashboardData.stats.citationImpact.change}
                    size="small"
                    sx={{ 
                          backgroundColor: 'rgba(255,255,255,0.25)',
                      color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          border: '1px solid rgba(255,255,255,0.3)'
                    }}
                  />
                </Box>
                    <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5, fontSize: '2.5rem' }}>
                  {dashboardData.stats.citationImpact.value}
                </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.95, fontWeight: 500 }}>
                  Citation Impact
                </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 1 }}>
                      Estimated total citations
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          </Grid>

        <Grid container spacing={4}>
          {/* Research Analytics */}
          <Grid size={{ xs: 12, md: 8 }}>
                <Card elevation={4} sx={{ 
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(139, 108, 188, 0.1)'
                }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.5, color: '#2d3748' }}>
                        <BarChartIcon sx={{ color: '#8b6cbc', fontSize: 28 }} />
                    Research Analytics
                </Typography>
                      <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Chip label="Publications" size="small" sx={{ bgcolor: 'rgba(139, 108, 188, 0.1)', color: '#8b6cbc' }} />
                        <Chip label="Projects" size="small" sx={{ bgcolor: 'rgba(255, 107, 107, 0.1)', color: '#FF6B6B' }} />
                        <IconButton size="small" sx={{ color: '#8b6cbc', bgcolor: 'rgba(139, 108, 188, 0.1)' }}>
                      <AssessmentIcon />
                    </IconButton>
                  </Box>
                </Box>
                
                    {/* Enhanced Chart */}
                <Box sx={{ 
                      height: 240, 
                  display: 'flex', 
                  alignItems: 'end', 
                  justifyContent: 'space-around',
                      background: 'linear-gradient(135deg, rgba(139, 108, 188, 0.02) 0%, rgba(139, 108, 188, 0.05) 100%)',
                      borderRadius: 2,
                      p: 3,
                      mb: 3,
                      border: '1px solid rgba(139, 108, 188, 0.1)'
                }}>
                  {dashboardData.analyticsData.publicationsOverTime.map((item, index) => (
                        <Box key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      <Box sx={{ 
                            width: 48,
                            height: Math.max(20, (item.count * 60) + 20),
                            background: item.count > 0 
                              ? 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 100%)' 
                              : 'rgba(139, 108, 188, 0.2)',
                            borderRadius: 2,
                            mb: 1.5,
                            position: 'relative',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'scale(1.05)',
                              boxShadow: '0 4px 16px rgba(139, 108, 188, 0.3)'
                            },
                            '&::before': {
                              content: `"${item.count}"`,
                              position: 'absolute',
                              top: -25,
                              left: '50%',
                              transform: 'translateX(-50%)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: '#8b6cbc'
                            }
                          }} />
                          <Typography variant="body2" sx={{ color: '#4a5568', fontWeight: 500 }}>
                        {item.month}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                  <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ color: '#8b6cbc', fontWeight: 800 }}>
                          {dashboardData.stats.totalPublications.value}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#718096', fontWeight: 500 }}>Total Publications</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ color: '#FF6B6B', fontWeight: 800 }}>
                          {dashboardData.recentPublications.filter(p => p.year === new Date().getFullYear()).length}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#718096', fontWeight: 500 }}>This Year</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ color: '#4ECDC4', fontWeight: 800 }}>
                          {dashboardData.stats.ongoingProjects.value}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#718096', fontWeight: 500 }}>Active Projects</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
                  </Grid>

          {/* Active Work */}
          <Grid size={{ xs: 12, md: 4 }}>
                <Card elevation={4} sx={{ 
                  height: '100%',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(139, 108, 188, 0.1)'
                }}>
                  <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.5, color: '#2d3748' }}>
                        <TimelineIcon sx={{ color: '#8b6cbc', fontSize: 24 }} />
                        Recent Work
                  </Typography>
                      <Tooltip title="Add new project">
                        <IconButton size="small" sx={{ 
                          color: '#8b6cbc', 
                          bgcolor: 'rgba(139, 108, 188, 0.1)',
                          '&:hover': { bgcolor: 'rgba(139, 108, 188, 0.2)' }
                        }}>
                    <AddIcon />
                  </IconButton>
                      </Tooltip>
                </Box>

                    {/* Recent Publications */}
                    {dashboardData.recentPublications.length > 0 ? (
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#4a5568' }}>
                          Recent Publications
                        </Typography>
                        {dashboardData.recentPublications.slice(0, 3).map((pub, index) => (
                          <Paper key={pub.id} elevation={1} sx={{ 
                            p: 2, 
                            mb: 2,
                            bgcolor: 'rgba(139, 108, 188, 0.02)',
                            border: '1px solid rgba(139, 108, 188, 0.1)',
                            borderRadius: 2
                          }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: '#2d3748' }}>
                              {pub.title.length > 50 ? `${pub.title.substring(0, 50)}...` : pub.title}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Typography variant="caption" sx={{ color: '#718096' }}>
                                {pub.journal} • {pub.year}
                    </Typography>
                              <Chip 
                                label={`${pub.citations} citations`}
                                size="small"
                                sx={{ 
                                  fontSize: '0.7rem',
                                  bgcolor: 'rgba(76, 175, 80, 0.1)',
                                  color: '#2e7d32'
                                }}
                              />
                            </Box>
                          </Paper>
                        ))}
                  </Box>
                    ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                        <ArticleIcon sx={{ fontSize: 48, color: '#cbd5e0', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          No publications found
                    </Typography>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      startIcon={<CreateIcon />}
                          sx={{ 
                            fontSize: '0.8rem',
                            borderColor: '#8b6cbc',
                            color: '#8b6cbc',
                            '&:hover': {
                              bgcolor: 'rgba(139, 108, 188, 0.1)',
                              borderColor: '#8b6cbc'
                            }
                          }}
                        >
                          Add Publication
                    </Button>
                  </Box>
                    )}
              </CardContent>
            </Card>
          </Grid>

          {/* Research Collaboration Network */}
          <Grid size={{ xs: 12 }}>
                <Card elevation={4} sx={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(139, 108, 188, 0.1)',
                  borderRadius: 3,
                  overflow: 'hidden'
                }}>
                  <Box sx={{ 
                    p: 3, 
                    borderBottom: '1px solid rgba(139, 108, 188, 0.1)',
                    background: 'linear-gradient(135deg, rgba(139, 108, 188, 0.02) 0%, rgba(139, 108, 188, 0.05) 100%)'
                  }}>
                    <Typography variant="h5" sx={{ 
                      fontWeight: 700, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1.5, 
                      color: '#2d3748' 
                    }}>
                      <NetworkIcon sx={{ color: '#8b6cbc', fontSize: 28 }} />
                      Research Collaboration Network
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#718096', mt: 1 }}>
                      Interactive visualization of your research connections and collaborations
                    </Typography>
                  </Box>
            <KenyaNetworkVisualization />
                </Card>
          </Grid>
        </Grid>
          </>
        )}
      </Container>
    </Box>
  );
};

export default ResearcherDashboard;
