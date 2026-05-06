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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  LinearProgress,
  TablePagination,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  InventoryRounded as ArchiveIcon,
  ExpandMore as ExpandMoreIcon,
  Description as DocumentIcon,
  Lightbulb as LessonIcon,
  FileCopy as TemplateIcon,
  CheckCircle as CompletedIcon,
  Cancel as TerminatedIcon,
  Folder as FolderIcon,
  Clear as ClearIcon,
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowUp as ArrowUpIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';
import PageHeader from '../../../../components/common/PageHeader';
import { useAuth } from '../../../../components/AuthProvider';

const closureReasons = {
  COMPLETED: { color: '#4caf50', label: 'Completed' },
  TERMINATED_EARLY: { color: '#f44336', label: 'Terminated Early' },
  SUSPENDED: { color: '#ff9800', label: 'Suspended' },
  WITHDRAWN: { color: '#9e9e9e', label: 'Withdrawn' },
};

export default function ArchivePortfolioPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [archivedTrials, setArchivedTrials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedTrial, setSelectedTrial] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [activePieIndex, setActivePieIndex] = useState(null);
  const [activeBarIndex, setActiveBarIndex] = useState(null);
  
  const [stats, setStats] = useState({
    archivedTrials: 0,
    completed: 0,
    reusableTemplates: 0,
    publications: 0
  });

  useEffect(() => {
    fetchArchivedTrials();
  }, []);

  const fetchArchivedTrials = async () => {
    try {
      setLoading(true);
      const mockArchivedTrials = [
        {
          id: 1,
          trialId: 'CT-2023-015',
          title: 'Phase II Trial of Novel HIV Treatment',
          closureReason: 'COMPLETED',
          closureDate: new Date('2023-12-15'),
          duration: '24 months',
          totalEnrolled: 150,
          targetEnrollment: 150,
          principalInvestigator: 'Dr. Sarah Johnson',
          lessonsLearned: [
            'Recruitment was faster than expected in urban sites',
            'Need for more frequent monitoring visits',
            'Patient retention strategies were highly effective',
          ],
          reusableTemplates: [
            { name: 'Informed Consent Form - English', type: 'CONSENT' },
            { name: 'Case Report Form Template', type: 'CRF' },
            { name: 'SAE Reporting Form', type: 'SAFETY' },
          ],
          documents: 12,
          publications: 3,
        },
        {
          id: 2,
          trialId: 'CT-2023-008',
          title: 'Observational Study on Malaria Prevention',
          closureReason: 'COMPLETED',
          closureDate: new Date('2023-09-30'),
          duration: '18 months',
          totalEnrolled: 500,
          targetEnrollment: 500,
          principalInvestigator: 'Dr. Michael Omondi',
          lessonsLearned: [
            'Community engagement was crucial for success',
            'Mobile data collection improved efficiency',
            'Local language materials enhanced participation',
          ],
          reusableTemplates: [
            { name: 'Community Consent Process', type: 'CONSENT' },
            { name: 'Mobile Data Collection Forms', type: 'DATA' },
          ],
          documents: 8,
          publications: 2,
        },
        {
          id: 3,
          trialId: 'CT-2022-042',
          title: 'Phase I Safety Study of TB Vaccine',
          closureReason: 'TERMINATED_EARLY',
          closureDate: new Date('2023-03-20'),
          duration: '8 months',
          totalEnrolled: 25,
          targetEnrollment: 60,
          principalInvestigator: 'Dr. Amina Hassan',
          lessonsLearned: [
            'Early safety signals required immediate action',
            'Need for more robust pre-clinical data',
            'Importance of independent safety monitoring board',
          ],
          reusableTemplates: [
            { name: 'Safety Monitoring Plan', type: 'SAFETY' },
          ],
          documents: 15,
          publications: 1,
        },
      ];
      setArchivedTrials(mockArchivedTrials);
      
      // Calculate statistics
      const archivedTrialsCount = mockArchivedTrials.length;
      const completed = mockArchivedTrials.filter(t => t.closureReason === 'COMPLETED').length;
      const reusableTemplates = mockArchivedTrials.reduce((sum, t) => sum + t.reusableTemplates.length, 0);
      const publications = mockArchivedTrials.reduce((sum, t) => sum + t.publications, 0);
      
      setStats({ archivedTrials: archivedTrialsCount, completed, reusableTemplates, publications });
    } catch (error) {
      console.error('Error fetching archived trials:', error);
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

  const filteredTrials = archivedTrials.filter((trial) => {
    const matchesSearch = trial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trial.trialId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trial.principalInvestigator.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All Statuses' || trial.closureReason === statusFilter;
    return matchesSearch && matchesStatus;
  });
  
  // Paginated trials
  const paginatedTrials = filteredTrials.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  
  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/researcher' },
    { label: 'Clinical Trials', href: '/researcher/clinical-trials' },
    { label: 'Institutional Memory' },
  ];

  return (
    <>
      <Box sx={{ width: '100%', mt: 8, mb: 0 }}>
        <PageHeader
          title="Institutional Memory"
          description="Access closed trials, lessons learned, and reusable templates"
          icon={<FolderIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={breadcrumbs}
          actionButton={
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
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
              Export Archive
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
                  Archived Trials
                </Typography>
                <ArchiveIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {stats.archivedTrials}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Closed trials
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
                  Completed
                </Typography>
                <CompletedIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {stats.completed}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Successfully completed
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
                  Reusable Templates
                </Typography>
                <TemplateIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {stats.reusableTemplates}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Available for reuse
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
                  Publications
                </Typography>
                <DocumentIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {stats.publications}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Published results
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Interactive Charts */}
        {!loading && archivedTrials.length > 0 && (() => {
          const pieData = Object.entries(
            archivedTrials.reduce((acc, t) => {
              acc[t.closureReason] = (acc[t.closureReason] || 0) + 1;
              return acc;
            }, {})
          ).map(([key, value]) => ({ name: closureReasons[key]?.label || key, value, color: closureReasons[key]?.color || '#888' }));

          const barData = archivedTrials.map(t => ({
            name: t.trialId,
            title: t.title,
            enrolled: t.totalEnrolled,
            target: t.targetEnrollment,
            pct: Math.round((t.totalEnrolled / t.targetEnrollment) * 100),
          }));

          const CustomPieTooltip = ({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <Paper sx={{ p: 1.5, borderRadius: 2, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{payload[0].name}</Typography>
                  <Typography variant="body2" sx={{ color: payload[0].payload.color }}>
                    {payload[0].value} trial{payload[0].value !== 1 ? 's' : ''}
                  </Typography>
                </Paper>
              );
            }
            return null;
          };

          const CustomBarTooltip = ({ active, payload, label }) => {
            if (active && payload && payload.length) {
              const bar = barData.find(b => b.name === label);
              return (
                <Paper sx={{ p: 1.5, borderRadius: 2, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', maxWidth: 220 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>{bar?.title}</Typography>
                  <Typography variant="body2">Enrolled: <strong>{payload[0]?.value}</strong></Typography>
                  <Typography variant="body2">Target: <strong>{bar?.target}</strong></Typography>
                  <Typography variant="body2" sx={{ color: '#8b6cbc' }}>Completion: <strong>{bar?.pct}%</strong></Typography>
                </Paper>
              );
            }
            return null;
          };

          return (
            <Box sx={{ display: 'flex', gap: 3, mb: 4, '@media (max-width: 900px)': { flexDirection: 'column' } }}>
              {/* Pie: Closure Reasons */}
              <Paper sx={{
                flex: 1,
                minWidth: 0,
                p: 3,
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#2c3e50', mb: 2 }}>
                  Trial Outcomes
                </Typography>
                <Box sx={{ flex: 1, minHeight: 220 }}>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                        onMouseEnter={(_, index) => setActivePieIndex(index)}
                        onMouseLeave={() => setActivePieIndex(null)}
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={entry.color}
                            opacity={activePieIndex === null || activePieIndex === index ? 1 : 0.45}
                            stroke={activePieIndex === index ? '#fff' : 'none'}
                            strokeWidth={activePieIndex === index ? 2 : 0}
                            style={{ cursor: 'pointer', transition: 'opacity 0.2s, transform 0.2s', transform: activePieIndex === index ? 'scale(1.06)' : 'scale(1)', transformOrigin: 'center' }}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomPieTooltip />} />
                      <Legend
                        formatter={(value, entry) => (
                          <span style={{ color: '#2c3e50', fontSize: '0.8rem', fontWeight: activePieIndex === pieData.findIndex(d => d.name === value) ? 700 : 400 }}>
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>

              {/* Bar: Enrollment Achievement */}
              <Paper sx={{
                flex: 2,
                minWidth: 0,
                p: 3,
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#2c3e50', mb: 2 }}>
                  Enrollment Achievement
                </Typography>
                <Box sx={{ flex: 1, minHeight: 220 }}>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={barData} barGap={4} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#666' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#666' }} />
                      <RechartsTooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(139,108,188,0.06)' }} />
                      <Legend formatter={(value) => <span style={{ fontSize: '0.8rem', color: '#2c3e50' }}>{value === 'enrolled' ? 'Enrolled' : 'Target'}</span>} />
                      <Bar
                        dataKey="target"
                        name="target"
                        fill="#e0d4f7"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="enrolled"
                        name="enrolled"
                        radius={[4, 4, 0, 0]}
                        onMouseEnter={(_, index) => setActiveBarIndex(index)}
                        onMouseLeave={() => setActiveBarIndex(null)}
                      >
                        {barData.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={activeBarIndex === index ? '#6a4fa0' : '#8b6cbc'}
                            style={{ cursor: 'pointer', transition: 'fill 0.15s' }}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Box>
          );
        })()}

        {/* Search and Filters */}
        <Paper sx={{ 
          p: 4, 
          mb: 5, 
          borderRadius: 4,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
        }}>
          <Box sx={{ 
            display: 'flex', 
            gap: 3, 
            alignItems: 'center',
            flexWrap: 'wrap',
            '@media (max-width: 768px)': {
              flexDirection: 'column',
              alignItems: 'stretch'
            }
          }}>
            <Box sx={{ flex: '2 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                placeholder="Search by trial ID, title, or PI..."
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
                    '&:hover': { backgroundColor: 'rgba(255,255,255,1)' }
                  }
                }}
              />
            </Box>

            <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
              <FormControl fullWidth>
                <InputLabel>Closure Reason</InputLabel>
                <Select
                  value={statusFilter}
                  label="Closure Reason"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{
                    borderRadius: 3,
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,1)' }
                  }}
                >
                  <MenuItem value="All Statuses">All Reasons</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                  <MenuItem value="TERMINATED_EARLY">Terminated Early</MenuItem>
                  <MenuItem value="SUSPENDED">Suspended</MenuItem>
                  <MenuItem value="WITHDRAWN">Withdrawn</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ flex: '0 0 auto' }}>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('All Statuses');
                }}
                sx={{ 
                  borderRadius: 3,
                  height: '56px',
                  px: 3,
                  borderColor: '#e0e0e0',
                  color: '#667eea',
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  '&:hover': {
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.08)',
                    color: '#5a67d8',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)'
                  }
                }}
              >
                Clear All
              </Button>
            </Box>
          </Box>
        </Paper>

        {loading ? (
          <Box sx={{ p: 8, textAlign: 'center' }}>
            <ArchiveIcon sx={{ fontSize: 64, color: '#ddd', mb: 3 }} />
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#666' }}>
              Loading archived trials...
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
            <ArchiveIcon sx={{ fontSize: 64, color: '#ddd', mb: 3 }} />
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 700, color: '#2c3e50' }}>
              No archived trials found
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
              {searchQuery ? 'Try adjusting your search criteria' : 'No archived trials available'}
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
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Closure Reason</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Enrollment</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Duration</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Templates</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Closure Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem', textAlign: 'center' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedTrials.map((trial) => (
                    <React.Fragment key={trial.id}>
                      <TableRow hover sx={{ '& > *': { borderBottom: expandedRows[trial.id] ? 'none' : undefined } }}>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleExpand(trial.id)}
                            sx={{ color: '#8b6cbc' }}
                          >
                            {expandedRows[trial.id] ? <ArrowUpIcon /> : <ArrowDownIcon />}
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
                          <Typography variant="caption" color="text.secondary">
                            PI: {trial.principalInvestigator}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={closureReasons[trial.closureReason].label}
                            size="small"
                            sx={{
                              bgcolor: closureReasons[trial.closureReason].color,
                              color: 'white'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {trial.totalEnrolled}/{trial.targetEnrollment}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {((trial.totalEnrolled / trial.targetEnrollment) * 100).toFixed(0)}%
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{trial.duration}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={<TemplateIcon />}
                            label={trial.reusableTemplates.length}
                            size="small"
                            sx={{ bgcolor: trial.reusableTemplates.length > 0 ? '#e3f2fd' : '#f5f5f5', color: '#2c3e50' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarIcon sx={{ fontSize: 16, color: '#8b6cbc' }} />
                            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                              {format(trial.closureDate, 'MMM dd, yyyy')}
                            </Typography>
                          </Box>
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
                              {/* Lessons Learned */}
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
                                  <LessonIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2c3e50' }}>
                                    Lessons Learned ({trial.lessonsLearned.length})
                                  </Typography>
                                </Box>
                                <Box sx={{ flex: 1, overflow: 'auto' }}>
                                  <Box component="ul" sx={{ pl: 2.5, m: 0 }}>
                                    {trial.lessonsLearned.map((lesson, index) => (
                                      <Typography component="li" key={index} variant="body2" sx={{ mb: 1.5, lineHeight: 1.6 }}>
                                        {lesson}
                                      </Typography>
                                    ))}
                                  </Box>
                                </Box>
                              </Box>

                              {/* Reusable Templates */}
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
                                  <TemplateIcon sx={{ color: '#2196f3', fontSize: 20 }} />
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2c3e50' }}>
                                    Reusable Templates ({trial.reusableTemplates.length})
                                  </Typography>
                                </Box>
                                <Box sx={{ flex: 1, overflow: 'auto' }}>
                                  {trial.reusableTemplates.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary">
                                      No templates available
                                    </Typography>
                                  ) : (
                                    trial.reusableTemplates.map((template, index) => (
                                      <Box key={index} sx={{ mb: 2, pb: 2, borderBottom: '1px solid #f0f0f0', '&:last-child': { borderBottom: 'none', mb: 0, pb: 0 } }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                          <DocumentIcon sx={{ fontSize: 16, color: '#8b6cbc' }} />
                                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {template.name}
                                          </Typography>
                                        </Box>
                                        <Chip
                                          label={template.type}
                                          size="small"
                                          variant="outlined"
                                          sx={{ fontSize: '0.7rem', height: 20 }}
                                        />
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
            <TablePagination
              component="div"
              count={filteredTrials.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{
                borderTop: '1px solid rgba(0,0,0,0.06)',
                '.MuiTablePagination-toolbar': {
                  backgroundColor: '#f8f9fa'
                }
              }}
            />
          </Paper>
        )}

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleMenuClose}>
            <ViewIcon sx={{ mr: 1 }} /> View Full Details
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <FolderIcon sx={{ mr: 1 }} /> Access Documents
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <DownloadIcon sx={{ mr: 1 }} /> Export Trial Summary
          </MenuItem>
        </Menu>
      </Container>
    </>
  );
}
