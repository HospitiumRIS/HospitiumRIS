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
  ListItemAvatar,
  Divider,
  CircularProgress,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  TablePagination,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Article as PublicationIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Star as StarIcon,
  School as CitationIcon,
  Assessment as AnalyticsIcon,
  Business as BusinessIcon,
  FilterList as FilterIcon,
  CalendarToday as DateIcon,
  Language as JournalIcon,
  People as CollaborationIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { format, parseISO, isValid } from 'date-fns';

import PageHeader from '../../../../components/common/PageHeader';
import { useAuth } from '../../../../components/AuthProvider';

const PublicationsReportPage = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [publicationsData, setPublicationsData] = useState(null);
  const [filterYear, setFilterYear] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Mock data - replace with real API calls
  useEffect(() => {
    const fetchPublicationsData = async () => {
      // Simulate API call
      setTimeout(() => {
        setPublicationsData({
          overview: {
            totalPublications: 24,
            totalCitations: 342,
            averageCitationsPerPaper: 14.3,
            hIndex: 12,
            recentPublications: 8,
            underReview: 3,
            totalViews: 15420,
            totalDownloads: 8765
          },
          yearlyTrend: [
            { year: 2020, publications: 3, citations: 45 },
            { year: 2021, publications: 6, citations: 89 },
            { year: 2022, publications: 8, citations: 124 },
            { year: 2023, publications: 7, citations: 84 }
          ],
          publications: [
            {
              id: 1,
              title: 'Machine Learning Applications in Healthcare Data Analysis',
              authors: 'Smith, J., Johnson, A., Williams, B.',
              journal: 'Nature Digital Medicine',
              year: 2023,
              type: 'Journal Article',
              citations: 87,
              views: 2340,
              downloads: 1876,
              status: 'Published',
              doi: '10.1038/s41591-023-02455-z',
              impactFactor: 12.4,
              quartile: 'Q1'
            },
            {
              id: 2,
              title: 'Personalized Treatment Protocols for Chronic Diseases',
              authors: 'Smith, J., Davis, C., Brown, D.',
              journal: 'JAMA Network Open',
              year: 2023,
              type: 'Journal Article',
              citations: 64,
              views: 1890,
              downloads: 1456,
              status: 'Published',
              doi: '10.1001/jamanetworkopen.2023.12345',
              impactFactor: 8.9,
              quartile: 'Q1'
            },
            {
              id: 3,
              title: 'AI-Driven Drug Discovery in Sub-Saharan Africa',
              authors: 'Smith, J., Thompson, E., Wilson, F.',
              journal: 'Science Translational Medicine',
              year: 2022,
              type: 'Journal Article',
              citations: 52,
              views: 1567,
              downloads: 1234,
              status: 'Published',
              doi: '10.1126/scitranslmed.abcd1234',
              impactFactor: 17.2,
              quartile: 'Q1'
            },
            {
              id: 4,
              title: 'Telemedicine Implementation in Rural Healthcare Systems',
              authors: 'Smith, J., Anderson, G.',
              journal: 'The Lancet Digital Health',
              year: 2022,
              type: 'Journal Article',
              citations: 41,
              views: 1234,
              downloads: 987,
              status: 'Published',
              doi: '10.1016/S2589-7500(22)00123-4',
              impactFactor: 15.8,
              quartile: 'Q1'
            },
            {
              id: 5,
              title: 'Blockchain Applications in Medical Record Management',
              authors: 'Smith, J., Taylor, H., Clark, I.',
              journal: 'IEEE Transactions on Biomedical Engineering',
              year: 2023,
              type: 'Conference Paper',
              citations: 23,
              views: 890,
              downloads: 654,
              status: 'Under Review',
              impactFactor: 4.6,
              quartile: 'Q2'
            }
          ],
          topJournals: [
            { journal: 'Nature Digital Medicine', publications: 4, avgCitations: 67.5, impactFactor: 12.4 },
            { journal: 'JAMA Network Open', publications: 3, avgCitations: 52.3, impactFactor: 8.9 },
            { journal: 'Science Translational Medicine', publications: 2, avgCitations: 48.5, impactFactor: 17.2 }
          ],
          collaborators: [
            { name: 'Dr. Alice Johnson', publications: 8, institution: 'Harvard Medical School' },
            { name: 'Dr. Bob Williams', publications: 6, institution: 'University of Oxford' },
            { name: 'Dr. Carol Davis', publications: 5, institution: 'Stanford University' }
          ]
        });
        setLoading(false);
      }, 1000);
    };

    fetchPublicationsData();
  }, []);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'published': return 'success';
      case 'under review': return 'warning';
      case 'rejected': return 'error';
      case 'draft': return 'default';
      default: return 'default';
    }
  };

  const getQuartileColor = (quartile) => {
    switch (quartile) {
      case 'Q1': return 'success';
      case 'Q2': return 'primary';
      case 'Q3': return 'warning';
      case 'Q4': return 'error';
      default: return 'default';
    }
  };

  const filteredPublications = publicationsData?.publications.filter(pub => {
    const matchesYear = filterYear === 'All' || pub.year.toString() === filterYear;
    const matchesType = filterType === 'All' || pub.type === filterType;
    const matchesSearch = searchTerm === '' || 
      pub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pub.journal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pub.authors.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesYear && matchesType && matchesSearch;
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
        title="Publications Report"
        description="Comprehensive analytics and performance metrics for your research publications"
        icon={<PublicationIcon />}
        breadcrumbs={[
          { label: 'Dashboard', path: '/researcher', icon: <BusinessIcon /> },
          { label: 'Analytics', path: '/researcher/analytics', icon: <AnalyticsIcon /> },
          { label: 'Publications', path: '/researcher/analytics/publications', icon: <PublicationIcon /> },
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
        {/* Publications Overview Cards */}
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
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>Total Publications</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                    {publicationsData.overview.totalPublications}
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
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>Total Citations</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                    {publicationsData.overview.totalCitations}
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
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>Total Views</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                    {publicationsData.overview.totalViews.toLocaleString()}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}>
                  <ViewIcon />
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
                    {publicationsData.overview.hIndex}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}>
                  <StarIcon />
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
              <Tab label="All Publications" />
              <Tab label="Performance Analytics" />
              <Tab label="Journal Analysis" />
              <Tab label="Collaboration Network" />
            </Tabs>
          </Box>

          <Box sx={{ p: 3 }}>
            {currentTab === 0 && (
              <Box>
                {/* All Publications Tab */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#8b6cbc' }}>
                    Publications Library
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
                    <TextField
                      size="small"
                      placeholder="Search publications..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      sx={{ minWidth: 250 }}
                    />
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>Year</InputLabel>
                      <Select
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                        label="Year"
                      >
                        <MenuItem value="All">All Years</MenuItem>
                        <MenuItem value="2023">2023</MenuItem>
                        <MenuItem value="2022">2022</MenuItem>
                        <MenuItem value="2021">2021</MenuItem>
                        <MenuItem value="2020">2020</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel>Type</InputLabel>
                      <Select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        label="Type"
                      >
                        <MenuItem value="All">All Types</MenuItem>
                        <MenuItem value="Journal Article">Journal Article</MenuItem>
                        <MenuItem value="Conference Paper">Conference Paper</MenuItem>
                        <MenuItem value="Book Chapter">Book Chapter</MenuItem>
                        <MenuItem value="Review">Review</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Paper>

                {/* Publications Table */}
                <TableContainer component={Paper} elevation={1}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Publication</TableCell>
                        <TableCell align="center">Year</TableCell>
                        <TableCell align="center">Citations</TableCell>
                        <TableCell align="center">Views</TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell align="center">Quartile</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredPublications
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((pub) => (
                          <TableRow key={pub.id} hover>
                            <TableCell>
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                  {pub.title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  {pub.journal} • {pub.authors}
                                </Typography>
                                {pub.impactFactor && (
                                  <Typography variant="caption" color="primary.main">
                                    IF: {pub.impactFactor}
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell align="center">{pub.year}</TableCell>
                            <TableCell align="center">
                              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#8b6cbc' }}>
                                {pub.citations}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {pub.views?.toLocaleString() || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip 
                                label={pub.status} 
                                size="small"
                                color={getStatusColor(pub.status)}
                              />
                            </TableCell>
                            <TableCell align="center">
                              {pub.quartile && (
                                <Chip 
                                  label={pub.quartile} 
                                  size="small"
                                  color={getQuartileColor(pub.quartile)}
                                  variant="outlined"
                                />
                              )}
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Tooltip title="View Details">
                                  <IconButton size="small">
                                    <ViewIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Edit">
                                  <IconButton size="small">
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={filteredPublications.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => {
                      setRowsPerPage(parseInt(e.target.value, 10));
                      setPage(0);
                    }}
                  />
                </TableContainer>
              </Box>
            )}

            {currentTab === 1 && (
              <Box>
                {/* Performance Analytics Tab */}
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#8b6cbc' }}>
                  Publication Performance Analytics
                </Typography>

                <Grid container spacing={3}>
                  {/* Yearly Publications Trend */}
                  <Grid item xs={12} md={8}>
                    <Card elevation={1} sx={{ p: 2, mb: 3 }}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Publications & Citations by Year
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'end', gap: 2, height: 200 }}>
                        {publicationsData.yearlyTrend.map((item, index) => (
                          <Box key={index} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Box
                              sx={{
                                width: '60%',
                                height: `${(item.publications / 8) * 150}px`,
                                bgcolor: '#8b6cbc',
                                borderRadius: 1,
                                mb: 0.5,
                                minHeight: 20
                              }}
                            />
                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                              {item.publications}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.year}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Card>
                  </Grid>

                  {/* Key Performance Metrics */}
                  <Grid item xs={12} md={4}>
                    <Card elevation={1} sx={{ p: 2, height: 'fit-content' }}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Key Performance Metrics
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Avg Citations per Paper</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#8b6cbc' }}>
                            {publicationsData.overview.averageCitationsPerPaper}
                          </Typography>
                        </Box>
                        <Divider />
                        <Box>
                          <Typography variant="body2" color="text.secondary">Publications This Year</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#8b6cbc' }}>
                            {publicationsData.overview.recentPublications}
                          </Typography>
                        </Box>
                        <Divider />
                        <Box>
                          <Typography variant="body2" color="text.secondary">Under Review</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#8b6cbc' }}>
                            {publicationsData.overview.underReview}
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}

            {currentTab === 2 && (
              <Box>
                {/* Journal Analysis Tab */}
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#8b6cbc' }}>
                  Journal Publication Analysis
                </Typography>

                <TableContainer component={Paper} elevation={1}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Journal</TableCell>
                        <TableCell align="center">Publications</TableCell>
                        <TableCell align="center">Avg Citations</TableCell>
                        <TableCell align="center">Impact Factor</TableCell>
                        <TableCell align="center">Performance</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {publicationsData.topJournals.map((journal, index) => (
                        <TableRow key={index} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ bgcolor: '#8b6cbc', width: 32, height: 32 }}>
                                <JournalIcon fontSize="small" />
                              </Avatar>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {journal.journal}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#8b6cbc' }}>
                              {journal.publications}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              {journal.avgCitations}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              {journal.impactFactor}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <LinearProgress
                              variant="determinate"
                              value={Math.min((journal.avgCitations / 70) * 100, 100)}
                              sx={{
                                width: 60,
                                height: 6,
                                borderRadius: 3,
                                bgcolor: 'rgba(139, 108, 188, 0.1)',
                                '& .MuiLinearProgress-bar': { bgcolor: '#8b6cbc' }
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {currentTab === 3 && (
              <Box>
                {/* Collaboration Network Tab */}
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#8b6cbc' }}>
                  Publication Collaborators
                </Typography>

                <Card elevation={1} sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Top Co-Authors
                  </Typography>
                  <List>
                    {publicationsData.collaborators.map((collaborator, index) => (
                      <ListItem key={index}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#8b6cbc' }}>
                            <CollaborationIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              {collaborator.name}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Typography variant="body2" color="text.secondary">
                                {collaborator.institution} • {collaborator.publications} publications
                              </Typography>
                            </Box>
                          }
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={(collaborator.publications / 8) * 100}
                            sx={{
                              width: 60,
                              height: 6,
                              borderRadius: 3,
                              bgcolor: 'rgba(139, 108, 188, 0.1)',
                              '& .MuiLinearProgress-bar': { bgcolor: '#8b6cbc' }
                            }}
                          />
                          <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#8b6cbc' }}>
                            {collaborator.publications}
                          </Typography>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </Card>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default PublicationsReportPage;
