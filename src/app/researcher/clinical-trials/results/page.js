'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Tooltip,
  Link,
  Paper,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Insights as ResultsIcon,
  Article as PublicationIcon,
  Storage as DatasetIcon,
  AttachMoney as FundingIcon,
  Link as LinkIcon,
  CheckCircle as LinkedIcon,
  OpenInNew as OpenIcon,
  Clear as ClearIcon,
  Science as ScienceIcon,
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import PageHeader from '../../../../components/common/PageHeader';
import { useAuth } from '../../../../components/AuthProvider';

export default function ResultsOutputsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [trials, setTrials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedTrial, setSelectedTrial] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  
  const [stats, setStats] = useState({
    linkedPublications: 0,
    sharedDatasets: 0,
    totalFunding: 0,
    completedTrials: 0
  });

  useEffect(() => {
    fetchTrials();
  }, []);

  const fetchTrials = async () => {
    try {
      setLoading(true);
      const mockTrials = [
        {
          id: 1,
          trialId: 'CT-2024-001',
          title: 'Phase III Trial of Novel Antimalarial Drug',
          status: 'COMPLETED',
          completionDate: new Date('2024-02-28'),
          publications: [
            {
              id: 1,
              title: 'Efficacy and Safety of Novel Antimalarial Drug: Results from Phase III Trial',
              doi: '10.1001/jama.2024.1234',
              journal: 'JAMA',
              publicationDate: new Date('2024-03-15'),
            },
            {
              id: 2,
              title: 'Long-term Follow-up of Antimalarial Trial Participants',
              doi: '10.1016/lancet.2024.5678',
              journal: 'The Lancet',
              publicationDate: new Date('2024-04-20'),
            },
          ],
          datasets: [
            {
              id: 1,
              name: 'Clinical Trial Dataset - Baseline Characteristics',
              repository: 'Dryad',
              doi: '10.5061/dryad.abc123',
              uploadDate: new Date('2024-03-10'),
            },
          ],
          fundingSources: [
            {
              id: 1,
              name: 'National Institutes of Health',
              grantNumber: 'R01-AI123456',
              amount: 2500000,
            },
            {
              id: 2,
              name: 'Bill & Melinda Gates Foundation',
              grantNumber: 'OPP1234567',
              amount: 1800000,
            },
          ],
        },
        {
          id: 2,
          trialId: 'CT-2024-002',
          title: 'Observational Study on HIV Treatment Adherence',
          status: 'ONGOING',
          completionDate: null,
          publications: [],
          datasets: [],
          fundingSources: [
            {
              id: 1,
              name: 'PEPFAR',
              grantNumber: 'PEPFAR-2024-001',
              amount: 500000,
            },
          ],
        },
        {
          id: 3,
          trialId: 'CT-2024-003',
          title: 'Randomized Trial of TB Vaccine Efficacy',
          status: 'COMPLETED',
          completionDate: new Date('2024-01-15'),
          publications: [
            {
              id: 1,
              title: 'TB Vaccine Shows Promise in Phase II Trial',
              doi: '10.1056/nejm.2024.9876',
              journal: 'New England Journal of Medicine',
              publicationDate: new Date('2024-02-28'),
            },
          ],
          datasets: [
            {
              id: 1,
              name: 'TB Vaccine Trial - Immunogenicity Data',
              repository: 'Zenodo',
              doi: '10.5281/zenodo.7654321',
              uploadDate: new Date('2024-02-15'),
            },
          ],
          fundingSources: [
            {
              id: 1,
              name: 'Wellcome Trust',
              grantNumber: 'WT-2023-TB-001',
              amount: 3200000,
            },
          ],
        },
      ];
      setTrials(mockTrials);
      
      // Calculate statistics
      const linkedPublications = mockTrials.reduce((sum, t) => sum + t.publications.length, 0);
      const sharedDatasets = mockTrials.reduce((sum, t) => sum + t.datasets.length, 0);
      const totalFunding = mockTrials.reduce((sum, t) => sum + t.fundingSources.reduce((s, f) => s + f.amount, 0), 0);
      const completedTrials = mockTrials.filter(t => t.status === 'COMPLETED').length;
      
      setStats({ linkedPublications, sharedDatasets, totalFunding, completedTrials });
    } catch (error) {
      console.error('Error fetching trials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, trial) => {
    setMenuAnchor(event.currentTarget);
    setSelectedTrial(trial);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedTrial(null);
  };

  const handleToggleExpand = (trialId) => {
    setExpandedRows(prev => ({
      ...prev,
      [trialId]: !prev[trialId]
    }));
  };

  const filteredTrials = trials.filter((trial) => {
    const matchesSearch = trial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trial.trialId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All Statuses' || trial.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const breadcrumbs = [
    { label: 'Dashboard', href: '/researcher' },
    { label: 'Clinical Trials', href: '/researcher/clinical-trials' },
    { label: 'Results & Dissemination' },
  ];

  return (
    <>
      <Box sx={{ width: '100%', mt: 8, mb: 0 }}>
        <PageHeader
          title="Results & Dissemination"
          description="Link trials to publications (DOI), datasets, and funding sources"
          icon={<ScienceIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={breadcrumbs}
          actionButton={
            <Button
              variant="contained"
              startIcon={<LinkIcon />}
              onClick={() => router.push('/researcher/clinical-trials/results/link')}
              sx={{
                bgcolor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 2,
                px: 3,
                py: 1,
                fontWeight: 600,
                letterSpacing: '0.5px',
                textTransform: 'none',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.25)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
                }
              }}
            >
              Link Output
            </Button>
          }
        />
      </Box>

      <Container maxWidth="xl" sx={{ py: 6, backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 300px)' }}>
        {/* Statistics Cards */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                  Linked Publications
                </Typography>
                <PublicationIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {stats.linkedPublications}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                With DOI references
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                  Shared Datasets
                </Typography>
                <DatasetIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {stats.sharedDatasets}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Open access repositories
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                  Total Funding
                </Typography>
                <FundingIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                ${(stats.totalFunding / 1000000).toFixed(1)}M
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Across all sources
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                  Completed Trials
                </Typography>
                <LinkedIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {stats.completedTrials}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                With linked outputs
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Search Section */}
        <Paper sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 4,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)'
        }}>
          <TextField
            fullWidth
            placeholder="Search trials by ID or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton onClick={() => setSearchQuery('')} size="small">
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                backgroundColor: 'rgba(255,255,255,0.8)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,1)'
                }
              }
            }}
          />
        </Paper>

        {loading ? (
          <Box sx={{ p: 8, textAlign: 'center' }}>
            <ResultsIcon sx={{ fontSize: 64, color: '#ddd', mb: 3 }} />
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#666' }}>
              Loading trial outputs...
            </Typography>
            <Box sx={{ width: 200, mx: 'auto' }}>
              <LinearProgress sx={{ 
                height: 4, 
                borderRadius: 2,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#667eea'
                }
              }} />
            </Box>
          </Box>
        ) : filteredTrials.length === 0 ? (
          <Box sx={{ p: 8, textAlign: 'center' }}>
            <ResultsIcon sx={{ fontSize: 64, color: '#ddd', mb: 3 }} />
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 700, color: '#2c3e50' }}>
              No trials found
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
              {searchQuery ? 'Try adjusting your search criteria' : 'No trials with outputs available'}
            </Typography>
          </Box>
        ) : (
          <Paper sx={{ 
            borderRadius: 4,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.06)',
            overflow: 'hidden'
          }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                    <TableCell sx={{ width: 50 }} />
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Trial ID</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Title</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Publications</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Datasets</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Funding</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Completion Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem', textAlign: 'center' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTrials.map((trial) => (
                    <React.Fragment key={trial.id}>
                      <TableRow hover sx={{ '& > *': { borderBottom: expandedRows[trial.id] ? 'none' : undefined } }}>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleExpand(trial.id)}
                            sx={{ color: '#8b6cbc' }}
                          >
                            {expandedRows[trial.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#8b6cbc' }}>
                            {trial.trialId}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {trial.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={trial.status}
                            size="small"
                            color={trial.status === 'COMPLETED' ? 'success' : 'primary'}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={<PublicationIcon />}
                            label={trial.publications.length}
                            size="small"
                            sx={{ bgcolor: trial.publications.length > 0 ? '#e3f2fd' : '#f5f5f5', color: '#2c3e50' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={<DatasetIcon />}
                            label={trial.datasets.length}
                            size="small"
                            sx={{ bgcolor: trial.datasets.length > 0 ? '#e8f5e9' : '#f5f5f5', color: '#2c3e50' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#4caf50' }}>
                            ${(trial.fundingSources.reduce((sum, f) => sum + f.amount, 0) / 1000000).toFixed(1)}M
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {trial.fundingSources.length} source{trial.fundingSources.length !== 1 ? 's' : ''}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {trial.completionDate ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <CalendarIcon sx={{ fontSize: 16, color: '#8b6cbc' }} />
                              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                                {format(trial.completionDate, 'MMM dd, yyyy')}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">-</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="More Actions">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, trial)}
                              sx={{ color: '#8b6cbc' }}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                      {expandedRows[trial.id] && (
                        <TableRow>
                          <TableCell colSpan={9} sx={{ backgroundColor: '#fafafa', py: 3, px: 3 }}>
                            <Box sx={{ 
                              display: 'flex', 
                              gap: 3,
                              '@media (max-width: 900px)': {
                                flexDirection: 'column'
                              }
                            }}>
                              {/* Publications */}
                              <Box sx={{ 
                                flex: 1, 
                                minWidth: 0,
                                p: 2.5, 
                                backgroundColor: 'white', 
                                borderRadius: 2, 
                                border: '1px solid #e0e0e0',
                                display: 'flex',
                                flexDirection: 'column'
                              }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                  <PublicationIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2c3e50' }}>
                                    Publications ({trial.publications.length})
                                  </Typography>
                                </Box>
                                <Box sx={{ flex: 1, overflow: 'auto' }}>
                                  {trial.publications.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary">
                                      No publications linked
                                    </Typography>
                                  ) : (
                                    trial.publications.map((pub) => (
                                      <Box key={pub.id} sx={{ mb: 2, pb: 2, borderBottom: '1px solid #f0f0f0', '&:last-child': { borderBottom: 'none', mb: 0, pb: 0 } }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                          {pub.title}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                          {pub.journal} • {format(pub.publicationDate, 'MMM yyyy')}
                                        </Typography>
                                        <Chip
                                          label={pub.doi}
                                          size="small"
                                          variant="outlined"
                                          icon={<OpenIcon sx={{ fontSize: 14 }} />}
                                          onClick={() => window.open(`https://doi.org/${pub.doi}`, '_blank')}
                                          sx={{ cursor: 'pointer', fontSize: '0.7rem', height: 24 }}
                                        />
                                      </Box>
                                    ))
                                  )}
                                </Box>
                              </Box>

                              {/* Datasets */}
                              <Box sx={{ 
                                flex: 1, 
                                minWidth: 0,
                                p: 2.5, 
                                backgroundColor: 'white', 
                                borderRadius: 2, 
                                border: '1px solid #e0e0e0',
                                display: 'flex',
                                flexDirection: 'column'
                              }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                  <DatasetIcon sx={{ color: '#2196f3', fontSize: 20 }} />
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2c3e50' }}>
                                    Datasets ({trial.datasets.length})
                                  </Typography>
                                </Box>
                                <Box sx={{ flex: 1, overflow: 'auto' }}>
                                  {trial.datasets.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary">
                                      No datasets shared
                                    </Typography>
                                  ) : (
                                    trial.datasets.map((dataset) => (
                                      <Box key={dataset.id} sx={{ mb: 2, pb: 2, borderBottom: '1px solid #f0f0f0', '&:last-child': { borderBottom: 'none', mb: 0, pb: 0 } }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                          {dataset.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                          {dataset.repository} • {format(dataset.uploadDate, 'MMM yyyy')}
                                        </Typography>
                                        <Chip
                                          label={dataset.doi}
                                          size="small"
                                          variant="outlined"
                                          icon={<OpenIcon sx={{ fontSize: 14 }} />}
                                          onClick={() => window.open(`https://doi.org/${dataset.doi}`, '_blank')}
                                          sx={{ cursor: 'pointer', fontSize: '0.7rem', height: 24 }}
                                        />
                                      </Box>
                                    ))
                                  )}
                                </Box>
                              </Box>

                              {/* Funding Sources */}
                              <Box sx={{ 
                                flex: 1, 
                                minWidth: 0,
                                p: 2.5, 
                                backgroundColor: 'white', 
                                borderRadius: 2, 
                                border: '1px solid #e0e0e0',
                                display: 'flex',
                                flexDirection: 'column'
                              }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                  <FundingIcon sx={{ color: '#4caf50', fontSize: 20 }} />
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2c3e50' }}>
                                    Funding Sources ({trial.fundingSources.length})
                                  </Typography>
                                </Box>
                                <Box sx={{ flex: 1, overflow: 'auto' }}>
                                  {trial.fundingSources.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary">
                                      No funding sources linked
                                    </Typography>
                                  ) : (
                                    trial.fundingSources.map((funding) => (
                                      <Box key={funding.id} sx={{ mb: 2, pb: 2, borderBottom: '1px solid #f0f0f0', '&:last-child': { borderBottom: 'none', mb: 0, pb: 0 } }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                          {funding.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                          Grant: {funding.grantNumber}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 700 }}>
                                          ${(funding.amount / 1000000).toFixed(2)}M
                                        </Typography>
                                      </Box>
                                    ))
                                  )}
                                </Box>
                              </Box>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleMenuClose}>
            <ViewIcon sx={{ mr: 1 }} /> View Details
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <LinkIcon sx={{ mr: 1 }} /> Link Publication
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <DatasetIcon sx={{ mr: 1 }} /> Link Dataset
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <FundingIcon sx={{ mr: 1 }} /> Link Funding Source
          </MenuItem>
        </Menu>
      </Container>
    </>
  );
}
