'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Avatar,
  Chip,
  LinearProgress,
  Stack,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  alpha,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Star as StarIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  FileDownload as ExportIcon,
  Verified as VerifiedIcon,
  Article as ArticleIcon,
  Description as ManuscriptIcon,
  FormatQuote as CitationIcon,
  Science as ScienceIcon,
  EmojiEvents as TrophyIcon,
  Timeline as TimelineIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';

const PerformanceReview = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [researchers, setResearchers] = useState([]);
  const [filteredResearchers, setFilteredResearchers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('totalOutput');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchResearchers();
  }, []);

  useEffect(() => {
    filterAndSortResearchers();
  }, [searchTerm, sortBy, researchers]);

  const fetchResearchers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/institution/researchers');
      
      if (!response.ok) {
        throw new Error('Failed to fetch researchers');
      }

      const data = await response.json();
      setResearchers(data.researchers || []);
      setFilteredResearchers(data.researchers || []);
    } catch (err) {
      console.error('Error fetching researchers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortResearchers = () => {
    let filtered = [...researchers];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(researcher => {
        const fullName = `${researcher.givenName || ''} ${researcher.familyName || ''}`.toLowerCase();
        const department = (researcher.researchProfile?.department || '').toLowerCase();
        return fullName.includes(term) || department.includes(term);
      });
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'totalOutput':
          return (b.stats.totalManuscripts + b.stats.totalPublications) - 
                 (a.stats.totalManuscripts + a.stats.totalPublications);
        case 'manuscripts':
          return b.stats.totalManuscripts - a.stats.totalManuscripts;
        case 'publications':
          return b.stats.totalPublications - a.stats.totalPublications;
        case 'citations':
          return b.stats.totalCitations - a.stats.totalCitations;
        case 'hIndex':
          return b.stats.hIndex - a.stats.hIndex;
        case 'name':
          return `${a.givenName} ${a.familyName}`.localeCompare(`${b.givenName} ${b.familyName}`);
        default:
          return 0;
      }
    });

    setFilteredResearchers(filtered);
  };

  const getInitials = (researcher) => {
    const first = researcher.givenName?.[0] || '';
    const last = researcher.familyName?.[0] || '';
    return `${first}${last}`.toUpperCase() || 'U';
  };

  const getFullName = (researcher) => {
    const title = researcher.researchProfile?.academicTitle;
    const name = `${researcher.givenName || ''} ${researcher.familyName || ''}`.trim();
    return title ? `${title} ${name}` : name;
  };

  const getPerformanceRating = (researcher) => {
    const totalOutput = researcher.stats.totalManuscripts + researcher.stats.totalPublications;
    const citations = researcher.stats.totalCitations;
    const hIndex = researcher.stats.hIndex;

    const score = (totalOutput * 2) + (citations * 0.5) + (hIndex * 5);

    if (score >= 50) return { label: 'Excellent', color: '#059669', icon: <TrophyIcon /> };
    if (score >= 30) return { label: 'Very Good', color: '#2563eb', icon: <StarIcon /> };
    if (score >= 15) return { label: 'Good', color: '#d97706', icon: <CheckCircleIcon /> };
    if (score >= 5) return { label: 'Satisfactory', color: '#6b7280', icon: <InfoIcon /> };
    return { label: 'Needs Improvement', color: '#dc2626', icon: <WarningIcon /> };
  };

  const getProductivityLevel = (totalOutput) => {
    if (totalOutput >= 20) return 100;
    if (totalOutput >= 15) return 80;
    if (totalOutput >= 10) return 60;
    if (totalOutput >= 5) return 40;
    return 20;
  };

  const calculateOverallStats = () => {
    const total = researchers.length;
    const totalManuscripts = researchers.reduce((sum, r) => sum + r.stats.totalManuscripts, 0);
    const totalPublications = researchers.reduce((sum, r) => sum + r.stats.totalPublications, 0);
    const totalCitations = researchers.reduce((sum, r) => sum + r.stats.totalCitations, 0);
    const avgHIndex = total > 0 ? researchers.reduce((sum, r) => sum + r.stats.hIndex, 0) / total : 0;

    return {
      total,
      totalManuscripts,
      totalPublications,
      totalCitations,
      avgHIndex: avgHIndex.toFixed(1),
      avgOutputPerResearcher: total > 0 ? ((totalManuscripts + totalPublications) / total).toFixed(1) : 0
    };
  };

  const stats = calculateOverallStats();

  if (loading) {
    return (
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Performance Review"
          description="Review researcher performance"
          icon={<AssessmentIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Researcher Management', path: '/institution' },
            { label: 'Performance Review' }
          ]}
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
        />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <CircularProgress size={60} sx={{ color: '#8b6cbc' }} />
          </Box>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Performance Review"
          description="Review researcher performance"
          icon={<AssessmentIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Researcher Management', path: '/institution' },
            { label: 'Performance Review' }
          ]}
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
        />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="error" gutterBottom>
              Error Loading Performance Data
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {error}
            </Typography>
            <Button
              variant="contained"
              onClick={fetchResearchers}
              sx={{
                bgcolor: '#8b6cbc',
                '&:hover': { bgcolor: '#7a5caa' }
              }}
            >
              Retry
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
      <PageHeader
        title="Performance Review"
        description="Review researcher performance"
        icon={<AssessmentIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Institution', path: '/institution' },
          { label: 'Researcher Management', path: '/institution' },
          { label: 'Performance Review' }
        ]}
        gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Overall Statistics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Total Researchers
                  </Typography>
                  <AssessmentIcon sx={{ color: alpha('#8b6cbc', 0.3) }} />
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#8b6cbc' }}>
                  {stats.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Avg Output/Researcher
                  </Typography>
                  <TimelineIcon sx={{ color: alpha('#2563eb', 0.3) }} />
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#2563eb' }}>
                  {stats.avgOutputPerResearcher}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Total Citations
                  </Typography>
                  <CitationIcon sx={{ color: alpha('#059669', 0.3) }} />
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#059669' }}>
                  {stats.totalCitations}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Average H-Index
                  </Typography>
                  <ScienceIcon sx={{ color: alpha('#d97706', 0.3) }} />
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#d97706' }}>
                  {stats.avgHIndex}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters and Search */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                placeholder="Search by researcher name or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#9ca3af' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="totalOutput">Total Output</MenuItem>
                  <MenuItem value="manuscripts">Manuscripts</MenuItem>
                  <MenuItem value="publications">Publications</MenuItem>
                  <MenuItem value="citations">Citations</MenuItem>
                  <MenuItem value="hIndex">H-Index</MenuItem>
                  <MenuItem value="name">Name</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Period</InputLabel>
                <Select
                  value={filterPeriod}
                  label="Period"
                  onChange={(e) => setFilterPeriod(e.target.value)}
                >
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="year">This Year</MenuItem>
                  <MenuItem value="quarter">This Quarter</MenuItem>
                  <MenuItem value="month">This Month</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ExportIcon />}
                sx={{
                  borderColor: '#e5e7eb',
                  color: '#6b7280',
                  height: 56,
                  '&:hover': {
                    borderColor: '#8b6cbc',
                    backgroundColor: alpha('#8b6cbc', 0.05)
                  }
                }}
              >
                Export
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Performance Cards */}
        {filteredResearchers.length === 0 ? (
          <Paper sx={{ p: 8, textAlign: 'center' }}>
            <AssessmentIcon sx={{ fontSize: 64, color: '#e5e7eb', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#6b7280', mb: 1 }}>
              {searchTerm ? 'No researchers found' : 'No researchers to review'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm 
                ? 'Try adjusting your search criteria'
                : 'Researchers will appear here once they register'
              }
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {filteredResearchers.map((researcher) => {
              const rating = getPerformanceRating(researcher);
              const totalOutput = researcher.stats.totalManuscripts + researcher.stats.totalPublications;
              const productivity = getProductivityLevel(totalOutput);

              return (
                <Grid item xs={12} md={6} lg={4} key={researcher.id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: 4,
                        transform: 'translateY(-4px)'
                      }
                    }}
                    onClick={() => router.push(`/institution/researcher/${researcher.id}`)}
                  >
                    <CardContent>
                      {/* Header */}
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
                        <Avatar
                          sx={{
                            width: 56,
                            height: 56,
                            bgcolor: '#8b6cbc',
                            fontSize: '1.25rem',
                            fontWeight: 600
                          }}
                        >
                          {getInitials(researcher)}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography 
                              variant="subtitle1" 
                              sx={{ 
                                fontWeight: 600, 
                                color: '#1a1a2e',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {getFullName(researcher)}
                            </Typography>
                            {researcher.orcidId && (
                              <Tooltip title="ORCID Verified">
                                <VerifiedIcon sx={{ fontSize: 16, color: '#a6ce39' }} />
                              </Tooltip>
                            )}
                          </Box>
                          <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
                            {researcher.researchProfile?.department || researcher.primaryInstitution || 'No department'}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Performance Rating */}
                      <Box sx={{ mb: 3 }}>
                        <Chip
                          icon={rating.icon}
                          label={rating.label}
                          sx={{
                            bgcolor: alpha(rating.color, 0.1),
                            color: rating.color,
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            '& .MuiChip-icon': {
                              color: rating.color
                            }
                          }}
                        />
                      </Box>

                      {/* Metrics */}
                      <Stack spacing={2}>
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500 }}>
                              Research Output
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#374151', fontWeight: 600 }}>
                              {totalOutput} items
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={productivity} 
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: '#f3f4f6',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: rating.color,
                                borderRadius: 3
                              }
                            }}
                          />
                        </Box>

                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: '#f9fafb', borderRadius: 1 }}>
                              <ManuscriptIcon sx={{ fontSize: 20, color: '#2d8659', mb: 0.5 }} />
                              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
                                {researcher.stats.totalManuscripts}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                Manuscripts
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: '#f9fafb', borderRadius: 1 }}>
                              <ArticleIcon sx={{ fontSize: 20, color: '#d97706', mb: 0.5 }} />
                              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
                                {researcher.stats.totalPublications}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                Publications
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: '#f9fafb', borderRadius: 1 }}>
                              <CitationIcon sx={{ fontSize: 20, color: '#2563eb', mb: 0.5 }} />
                              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
                                {researcher.stats.totalCitations}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                Citations
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: '#f9fafb', borderRadius: 1 }}>
                              <ScienceIcon sx={{ fontSize: 20, color: '#7c3aed', mb: 0.5 }} />
                              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
                                {researcher.stats.hIndex}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                H-Index
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Results Count */}
        {filteredResearchers.length > 0 && (
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredResearchers.length} of {researchers.length} researchers
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default PerformanceReview;
