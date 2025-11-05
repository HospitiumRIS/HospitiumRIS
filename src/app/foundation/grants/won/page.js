'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  IconButton,
  Chip,
  Tooltip,
  Stack,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  CircularProgress,
  Snackbar,
  LinearProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  EmojiEvents as TrophyIcon,
  AttachMoney as MoneyIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  Comment as CommentIcon,
  AttachFile as AttachFileIcon,
  Send as SendIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Flag as FlagIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  FileDownload as DownloadIcon,
  Upload as UploadIcon,
  Folder as FolderIcon,
  ExpandMore as ExpandMoreIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';

const GrantAwardsWon = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [awards, setAwards] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [reports, setReports] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [expandedAwards, setExpandedAwards] = useState({});

  // Dialog states
  const [newMilestoneDialog, setNewMilestoneDialog] = useState(false);
  const [viewAwardDialog, setViewAwardDialog] = useState(false);
  const [reportDialog, setReportDialog] = useState(false);
  const [selectedAward, setSelectedAward] = useState(null);

  // Form states
  const [milestoneForm, setMilestoneForm] = useState({
    awardId: '',
    title: '',
    description: '',
    dueDate: '',
    status: 'pending',
    deliverables: '',
    budget: ''
  });

  const [reportForm, setReportForm] = useState({
    awardId: '',
    type: '',
    period: '',
    status: '',
    submissionDate: '',
    notes: ''
  });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Simulate API calls
      const [awardsRes, milestonesRes, reportsRes] = await Promise.all([
        fetch(`/api/foundation/grant-awards?search=${searchTerm}&status=${filterStatus}&year=${filterYear}`),
        fetch('/api/foundation/grant-milestones'),
        fetch('/api/foundation/grant-reports')
      ]);

      // Mock data for demonstration
      setAwards([
        {
          id: 1,
          title: 'AI-Driven Healthcare Innovation Research',
          grantor: 'NIH - National Institute of Health',
          awardDate: '2024-01-20',
          startDate: '2024-02-01',
          endDate: '2026-01-31',
          totalAmount: 2500000,
          disbursedAmount: 625000,
          remainingAmount: 1875000,
          status: 'active',
          projectStatus: 'on_track',
          principalInvestigator: 'Dr. Sarah Johnson',
          coPrincipalInvestigator: 'Dr. Michael Chen',
          department: 'Research & Innovation',
          grantNumber: 'NIH-2024-AI-001',
          projectPeriod: '24 months',
          nextMilestone: 'Q1 Progress Report',
          nextMilestoneDate: '2024-03-31',
          completionPercentage: 25,
          description: 'Comprehensive research program focused on developing AI-powered diagnostic tools for early disease detection and treatment optimization in healthcare settings.',
          objectives: [
            'Develop machine learning algorithms for medical imaging analysis',
            'Create predictive models for patient outcomes',
            'Implement AI-driven decision support systems',
            'Conduct clinical validation studies'
          ],
          keyPersonnel: [
            { name: 'Dr. Sarah Johnson', role: 'Principal Investigator', effort: '50%' },
            { name: 'Dr. Michael Chen', role: 'Co-Principal Investigator', effort: '25%' },
            { name: 'Dr. Emily Rodriguez', role: 'Research Coordinator', effort: '100%' },
            { name: 'Dr. James Wilson', role: 'Data Scientist', effort: '75%' }
          ],
          budgetBreakdown: [
            { category: 'Personnel', allocated: 1500000, spent: 375000, remaining: 1125000 },
            { category: 'Equipment', allocated: 500000, spent: 125000, remaining: 375000 },
            { category: 'Supplies', allocated: 300000, spent: 75000, remaining: 225000 },
            { category: 'Travel', allocated: 100000, spent: 25000, remaining: 75000 },
            { category: 'Other', allocated: 100000, spent: 25000, remaining: 75000 }
          ]
        },
        {
          id: 2,
          title: 'Medical Education Technology Platform',
          grantor: 'Gates Foundation',
          awardDate: '2024-01-22',
          startDate: '2024-02-15',
          endDate: '2025-08-14',
          totalAmount: 1200000,
          disbursedAmount: 400000,
          remainingAmount: 800000,
          status: 'active',
          projectStatus: 'on_track',
          principalInvestigator: 'Dr. Emily Rodriguez',
          coPrincipalInvestigator: 'Dr. Lisa Wang',
          department: 'Medical Education',
          grantNumber: 'GATES-2024-EDTECH-002',
          projectPeriod: '18 months',
          nextMilestone: 'Platform Beta Release',
          nextMilestoneDate: '2024-04-15',
          completionPercentage: 33,
          description: 'Development of innovative medical education platform using VR and AI technologies to enhance learning outcomes for medical students and healthcare professionals.',
          objectives: [
            'Design immersive VR medical training modules',
            'Integrate AI-powered assessment tools',
            'Create adaptive learning pathways',
            'Conduct user experience testing and optimization'
          ],
          keyPersonnel: [
            { name: 'Dr. Emily Rodriguez', role: 'Principal Investigator', effort: '40%' },
            { name: 'Dr. Lisa Wang', role: 'Co-Principal Investigator', effort: '30%' },
            { name: 'Dr. James Wilson', role: 'Technical Lead', effort: '80%' },
            { name: 'Ms. Jennifer Martinez', role: 'UX Designer', effort: '100%' }
          ],
          budgetBreakdown: [
            { category: 'Personnel', allocated: 720000, spent: 240000, remaining: 480000 },
            { category: 'Technology', allocated: 300000, spent: 100000, remaining: 200000 },
            { category: 'Equipment', allocated: 120000, spent: 40000, remaining: 80000 },
            { category: 'Testing', allocated: 60000, spent: 20000, remaining: 40000 }
          ]
        },
        {
          id: 3,
          title: 'Community Health Outreach Initiative',
          grantor: 'Robert Wood Johnson Foundation',
          awardDate: '2023-09-15',
          startDate: '2023-10-01',
          endDate: '2024-09-30',
          totalAmount: 850000,
          disbursedAmount: 680000,
          remainingAmount: 170000,
          status: 'active',
          projectStatus: 'at_risk',
          principalInvestigator: 'Dr. Michael Chen',
          coPrincipalInvestigator: 'Dr. Amanda Foster',
          department: 'Community Health',
          grantNumber: 'RWJF-2023-OUTREACH-003',
          projectPeriod: '12 months',
          nextMilestone: 'Final Report Submission',
          nextMilestoneDate: '2024-09-15',
          completionPercentage: 80,
          description: 'Comprehensive community health program targeting underserved populations with focus on preventive care, health education, and access to healthcare services.',
          objectives: [
            'Establish mobile health clinics in underserved areas',
            'Develop community health education programs',
            'Train community health workers',
            'Create sustainable healthcare access pathways'
          ],
          keyPersonnel: [
            { name: 'Dr. Michael Chen', role: 'Principal Investigator', effort: '30%' },
            { name: 'Dr. Amanda Foster', role: 'Co-Principal Investigator', effort: '25%' },
            { name: 'Ms. Rebecca Thompson', role: 'Program Manager', effort: '100%' },
            { name: 'Mr. David Wilson', role: 'Community Coordinator', effort: '100%' }
          ],
          budgetBreakdown: [
            { category: 'Personnel', allocated: 425000, spent: 340000, remaining: 85000 },
            { category: 'Equipment', allocated: 255000, spent: 204000, remaining: 51000 },
            { category: 'Outreach', allocated: 127500, spent: 102000, remaining: 25500 },
            { category: 'Training', allocated: 42500, spent: 34000, remaining: 8500 }
          ]
        },
        {
          id: 4,
          title: 'Pediatric Care Enhancement Program',
          grantor: 'Children\'s Health Foundation',
          awardDate: '2023-06-10',
          startDate: '2023-07-01',
          endDate: '2024-06-30',
          totalAmount: 650000,
          disbursedAmount: 650000,
          remainingAmount: 0,
          status: 'completed',
          projectStatus: 'completed',
          principalInvestigator: 'Dr. Lisa Wang',
          coPrincipalInvestigator: 'Dr. Jennifer Martinez',
          department: 'Pediatrics',
          grantNumber: 'CHF-2023-PEDS-004',
          projectPeriod: '12 months',
          nextMilestone: 'Project Completed',
          nextMilestoneDate: '2024-06-30',
          completionPercentage: 100,
          description: 'Enhancement of pediatric care services through advanced diagnostic equipment, staff training, and family support programs.',
          objectives: [
            'Upgrade pediatric diagnostic equipment',
            'Implement family-centered care protocols',
            'Train staff in specialized pediatric care',
            'Develop child-friendly treatment environments'
          ],
          keyPersonnel: [
            { name: 'Dr. Lisa Wang', role: 'Principal Investigator', effort: '40%' },
            { name: 'Dr. Jennifer Martinez', role: 'Co-Principal Investigator', effort: '30%' },
            { name: 'Ms. Sarah Thompson', role: 'Clinical Coordinator', effort: '100%' },
            { name: 'Mr. Robert Davis', role: 'Equipment Specialist', effort: '50%' }
          ],
          budgetBreakdown: [
            { category: 'Equipment', allocated: 390000, spent: 390000, remaining: 0 },
            { category: 'Personnel', allocated: 195000, spent: 195000, remaining: 0 },
            { category: 'Training', allocated: 39000, spent: 39000, remaining: 0 },
            { category: 'Supplies', allocated: 26000, spent: 26000, remaining: 0 }
          ]
        }
      ]);

      setMilestones([
        {
          id: 1,
          awardId: 1,
          title: 'Q1 Progress Report',
          description: 'Quarterly progress report detailing research activities and preliminary findings',
          dueDate: '2024-03-31',
          status: 'pending',
          deliverables: 'Progress report, financial summary, research data',
          budget: 625000
        },
        {
          id: 2,
          awardId: 1,
          title: 'Algorithm Development Phase 1',
          description: 'Complete development of initial machine learning algorithms',
          dueDate: '2024-05-15',
          status: 'in_progress',
          deliverables: 'Algorithm documentation, test results, code repository',
          budget: 300000
        },
        {
          id: 3,
          awardId: 2,
          title: 'Platform Beta Release',
          description: 'Release beta version of the medical education platform',
          dueDate: '2024-04-15',
          status: 'pending',
          deliverables: 'Beta platform, user documentation, testing protocols',
          budget: 400000
        }
      ]);

      setReports([
        {
          id: 1,
          awardId: 1,
          type: 'Progress Report',
          period: 'Q4 2023',
          status: 'submitted',
          submissionDate: '2024-01-15',
          notes: 'Report submitted on time with all required documentation'
        },
        {
          id: 2,
          awardId: 2,
          type: 'Financial Report',
          period: 'Q4 2023',
          status: 'approved',
          submissionDate: '2024-01-20',
          notes: 'Financial report approved with no issues'
        },
        {
          id: 3,
          awardId: 3,
          type: 'Progress Report',
          period: 'Q1 2024',
          status: 'overdue',
          submissionDate: null,
          notes: 'Report is overdue - follow up required'
        }
      ]);

    } catch (error) {
      console.error('Error loading data:', error);
      showSnackbar('Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'completed': return 'info';
      case 'on_hold': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getProjectStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'on_track': return 'success';
      case 'at_risk': return 'warning';
      case 'delayed': return 'error';
      case 'completed': return 'info';
      default: return 'default';
    }
  };

  const handleNewMilestone = () => {
    setMilestoneForm({
      awardId: '',
      title: '',
      description: '',
      dueDate: '',
      status: 'pending',
      deliverables: '',
      budget: ''
    });
    setNewMilestoneDialog(true);
  };

  const handleSaveMilestone = async () => {
    try {
      setSaving(true);
      
      if (!milestoneForm.awardId || !milestoneForm.title || !milestoneForm.dueDate) {
        showSnackbar('Please fill in all required fields', 'error');
        return;
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showSnackbar('Milestone created successfully!', 'success');
      setNewMilestoneDialog(false);
      loadData();
    } catch (error) {
      showSnackbar('Error creating milestone', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleViewAward = (award) => {
    setSelectedAward(award);
    setViewAwardDialog(true);
  };

  const handleAwardAccordion = (awardId) => {
    setExpandedAwards(prev => ({
      ...prev,
      [awardId]: !prev[awardId]
    }));
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  // Calculate statistics
  const totalAwards = awards.length;
  const activeAwards = awards.filter(award => award.status === 'active').length;
  const completedAwards = awards.filter(award => award.status === 'completed').length;
  const totalValue = awards.reduce((sum, award) => sum + award.totalAmount, 0);
  const totalDisbursed = awards.reduce((sum, award) => sum + award.disbursedAmount, 0);
  const overdueReports = reports.filter(report => report.status === 'overdue').length;

  if (loading) {
    return (
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Grant Awards Won"
          description="Manage and track awarded grants, milestones, and reporting requirements"
          icon={<TrophyIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Foundation', path: '/foundation' },
            { label: 'Grants', path: '/foundation/grants' },
            { label: 'Awards Won' }
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

  return (
    <>
      {/* Full-width Page Header */}
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Grant Awards Won"
          description="Manage and track awarded grants, milestones, and reporting requirements"
          icon={<TrophyIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Foundation', path: '/foundation' },
            { label: 'Grants', path: '/foundation/grants' },
            { label: 'Awards Won' }
          ]}
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
          actionButton={
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleNewMilestone}
                sx={{
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  '&:hover': {
                    background: 'rgba(255,255,255,0.25)',
                  },
                }}
              >
                Add Milestone
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                sx={{
                  borderColor: 'rgba(255,255,255,0.5)',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                Export Report
              </Button>
            </Stack>
          }
        />
      </Box>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Key Metrics Cards */}
        <Box sx={{ 
          display: 'flex', 
          gap: 3, 
          mb: 5, 
          flexWrap: 'wrap',
          '& > *': {
            flex: {
              xs: '1 1 100%',
              sm: '1 1 calc(50% - 12px)',
              md: '1 1 calc(20% - 19.2px)'
            }
          }
        }}>
          <Card sx={{ 
            borderRadius: 3, 
            boxShadow: 2, 
            height: 120,
            background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5cac 100%)',
            color: 'white',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: '0 8px 25px rgba(139, 108, 188, 0.3)'
            }
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <TrophyIcon sx={{ fontSize: 28, color: 'rgba(255,255,255,0.9)', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, color: 'white' }}>
                {totalAwards}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontSize: '1rem', color: 'rgba(255,255,255,0.9)' }}>
                Total Awards
              </Typography>
            </CardContent>
          </Card>
          
          <Card sx={{ 
            borderRadius: 3, 
            boxShadow: 2, 
            height: 120,
            background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5cac 100%)',
            color: 'white',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: '0 8px 25px rgba(139, 108, 188, 0.3)'
            }
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <PlayArrowIcon sx={{ fontSize: 28, color: 'rgba(255,255,255,0.9)', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, color: 'white' }}>
                {activeAwards}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontSize: '1rem', color: 'rgba(255,255,255,0.9)' }}>
                Active Projects
              </Typography>
            </CardContent>
          </Card>
          
          <Card sx={{ 
            borderRadius: 3, 
            boxShadow: 2, 
            height: 120,
            background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5cac 100%)',
            color: 'white',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: '0 8px 25px rgba(139, 108, 188, 0.3)'
            }
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <CheckCircleIcon sx={{ fontSize: 28, color: 'rgba(255,255,255,0.9)', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, color: 'white' }}>
                {completedAwards}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontSize: '1rem', color: 'rgba(255,255,255,0.9)' }}>
                Completed
              </Typography>
            </CardContent>
          </Card>
          
          <Card sx={{ 
            borderRadius: 3, 
            boxShadow: 2, 
            height: 120,
            background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5cac 100%)',
            color: 'white',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: '0 8px 25px rgba(139, 108, 188, 0.3)'
            }
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <MoneyIcon sx={{ fontSize: 28, color: 'rgba(255,255,255,0.9)', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.2rem', md: '1.5rem' }, color: 'white' }}>
                {formatCurrency(totalValue)}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontSize: '1rem', color: 'rgba(255,255,255,0.9)' }}>
                Total Award Value
              </Typography>
            </CardContent>
          </Card>
          
          <Card sx={{ 
            borderRadius: 3, 
            boxShadow: 2, 
            height: 120,
            background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5cac 100%)',
            color: 'white',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: '0 8px 25px rgba(139, 108, 188, 0.3)'
            }
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <AccountBalanceIcon sx={{ fontSize: 28, color: 'rgba(255,255,255,0.9)', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.2rem', md: '1.5rem' }, color: 'white' }}>
                {formatCurrency(totalDisbursed)}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontSize: '1rem', color: 'rgba(255,255,255,0.9)' }}>
                Funds Received
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Search and Filters */}
        <Paper sx={{ borderRadius: 3, p: 3, mb: 3 }}>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} alignItems="stretch">
            <Box sx={{ flex: 2 }}>
              <TextField
                fullWidth
                placeholder="Search grants, grantors, or investigators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <FormControl fullWidth size="medium">
                <InputLabel>Status Filter</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="Status Filter"
                  sx={{
                    borderRadius: 2,
                  }}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="on_hold">On Hold</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: 1, minWidth: 150 }}>
              <FormControl fullWidth size="medium">
                <InputLabel>Year Filter</InputLabel>
                <Select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  label="Year Filter"
                  sx={{
                    borderRadius: 2,
                  }}
                >
                  <MenuItem value="all">All Years</MenuItem>
                  <MenuItem value="2024">2024</MenuItem>
                  <MenuItem value="2023">2023</MenuItem>
                  <MenuItem value="2022">2022</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Table View">
                <IconButton 
                  sx={{ 
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    backgroundColor: '#f8f9fa',
                    '&:hover': { backgroundColor: '#e9ecef' }
                  }}
                >
                  <ViewIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Chart View">
                <IconButton 
                  sx={{ 
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    backgroundColor: 'white',
                    '&:hover': { backgroundColor: '#f8f9fa' }
                  }}
                >
                  <AssessmentIcon />
                </IconButton>
              </Tooltip>
            </Box>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1.5,
                borderColor: '#8b6cbc',
                color: '#8b6cbc',
                minWidth: 120,
                '&:hover': {
                  borderColor: '#7a5ba8',
                  backgroundColor: 'rgba(139, 108, 188, 0.08)',
                }
              }}
            >
              Export
            </Button>
          </Stack>
        </Paper>

        {/* Main Content Tabs */}
        <Paper sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            sx={{
              backgroundColor: alpha('#8b6cbc', 0.05),
              p: 4,
              '& .MuiTab-root': {
                fontWeight: 600,
                fontSize: '1rem',
                '&.Mui-selected': {
                  color: '#8b6cbc'
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#8b6cbc',
                height: 3
              }
            }}
          >
            <Tab label="Active Awards" icon={<TrophyIcon />} />
            <Tab label="Project Management" icon={<AssignmentIcon />} />
            <Tab label="Financial Tracking" icon={<MoneyIcon />} />
            <Tab label="Reports & Compliance" icon={<FolderIcon />} />
          </Tabs>

          {/* Tab Content */}
          <Box sx={{ p: 4 }}>
            {selectedTab === 0 && (
              <Box>
                {awards.map((award, index) => (
                  <Accordion
                    key={award.id}
                    expanded={expandedAwards[award.id] || false}
                    onChange={() => handleAwardAccordion(award.id)}
                    sx={{
                      mb: 2,
                      borderRadius: 3,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      border: `2px solid ${alpha('#8b6cbc', 0.2)}`,
                      '&:before': { display: 'none' },
                      overflow: 'hidden',
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon sx={{ fontSize: 28, color: '#8b6cbc' }} />}
                      sx={{ 
                        backgroundColor: alpha('#8b6cbc', 0.08),
                        minHeight: 80,
                        px: 3,
                        py: 2,
                        '&:hover': { 
                          backgroundColor: alpha('#8b6cbc', 0.15),
                          transform: 'translateY(-1px)',
                          boxShadow: '0 6px 16px rgba(0,0,0,0.15)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <Grid container alignItems="center" spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar sx={{ 
                              bgcolor: '#8b6cbc',
                              width: 56,
                              height: 56,
                              fontSize: '1.2rem',
                              boxShadow: '0 3px 8px rgba(0,0,0,0.2)',
                              border: '3px solid white'
                            }}>
                              <TrophyIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="h6" sx={{ 
                                fontWeight: 700, 
                                color: '#1a1a1a',
                                mb: 0.5,
                                letterSpacing: '-0.5px'
                              }}>
                                {award.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ 
                                fontSize: '0.95rem',
                                opacity: 0.8,
                                mb: 1
                              }}>
                                {award.grantor}
                              </Typography>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Chip 
                                  label={award.status}
                                  color={getStatusColor(award.status)}
                                  size="small"
                                />
                                <Chip 
                                  label={award.projectStatus.replace('_', ' ')}
                                  color={getProjectStatusColor(award.projectStatus)}
                                  size="small"
                                  variant="outlined"
                                />
                              </Stack>
                            </Box>
                          </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Total Award
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                                {formatCurrency(award.totalAmount)}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Progress
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={award.completionPercentage} 
                                  sx={{ 
                                    flex: 1,
                                    height: 8, 
                                    borderRadius: 4,
                                    backgroundColor: alpha('#8b6cbc', 0.1),
                                    '& .MuiLinearProgress-bar': {
                                      backgroundColor: '#8b6cbc',
                                      borderRadius: 4
                                    }
                                  }} 
                                />
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                  {award.completionPercentage}%
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </Grid>
                      </Grid>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0 }}>
                      <Box sx={{ p: 4, backgroundColor: '#fafafa' }}>
                        <Grid container spacing={4}>
                          {/* Left Column - Project Details */}
                          <Grid item xs={12} md={8}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                              Project Overview
                            </Typography>
                            
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                              {award.description}
                            </Typography>

                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                              Project Objectives
                            </Typography>
                            <List dense sx={{ mb: 3 }}>
                              {award.objectives.map((objective, idx) => (
                                <ListItem key={idx} sx={{ py: 0.5 }}>
                                  <ListItemIcon sx={{ minWidth: 32 }}>
                                    <CheckCircleIcon fontSize="small" sx={{ color: '#8b6cbc' }} />
                                  </ListItemIcon>
                                  <ListItemText 
                                    primary={objective} 
                                    sx={{ '& .MuiListItemText-primary': { fontSize: '0.9rem' } }}
                                  />
                                </ListItem>
                              ))}
                            </List>

                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                              Key Personnel
                            </Typography>
                            <TableContainer component={Paper} sx={{ borderRadius: 2, mb: 3 }}>
                              <Table size="small">
                                <TableHead>
                                  <TableRow sx={{ backgroundColor: alpha('#8b6cbc', 0.05) }}>
                                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Effort</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {award.keyPersonnel.map((person, idx) => (
                                    <TableRow key={idx} hover>
                                      <TableCell>{person.name}</TableCell>
                                      <TableCell>{person.role}</TableCell>
                                      <TableCell>{person.effort}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>

                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                              Budget Breakdown
                            </Typography>
                            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                              <Table size="small">
                                <TableHead>
                                  <TableRow sx={{ backgroundColor: alpha('#8b6cbc', 0.05) }}>
                                    <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Allocated</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Spent</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Remaining</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>% Used</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {award.budgetBreakdown.map((budget, idx) => {
                                    const percentUsed = ((budget.spent / budget.allocated) * 100).toFixed(1);
                                    return (
                                      <TableRow key={idx} hover>
                                        <TableCell sx={{ fontWeight: 600 }}>{budget.category}</TableCell>
                                        <TableCell>{formatCurrency(budget.allocated)}</TableCell>
                                        <TableCell sx={{ color: 'error.main' }}>{formatCurrency(budget.spent)}</TableCell>
                                        <TableCell sx={{ color: 'success.main' }}>{formatCurrency(budget.remaining)}</TableCell>
                                        <TableCell>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <LinearProgress 
                                              variant="determinate" 
                                              value={parseFloat(percentUsed)} 
                                              sx={{ 
                                                flex: 1,
                                                height: 6, 
                                                borderRadius: 3,
                                                backgroundColor: alpha('#8b6cbc', 0.1),
                                                '& .MuiLinearProgress-bar': {
                                                  backgroundColor: parseFloat(percentUsed) > 80 ? '#f44336' : '#8b6cbc',
                                                  borderRadius: 3
                                                }
                                              }} 
                                            />
                                            <Typography variant="caption" sx={{ fontWeight: 600, minWidth: 40 }}>
                                              {percentUsed}%
                                            </Typography>
                                          </Box>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Grid>

                          {/* Right Column - Award Details */}
                          <Grid item xs={12} md={4}>
                            <Box sx={{ 
                              p: 3, 
                              backgroundColor: alpha('#8b6cbc', 0.05),
                              borderRadius: 2,
                              border: `1px solid ${alpha('#8b6cbc', 0.1)}`,
                              mb: 3
                            }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                                Award Information
                              </Typography>
                              <Stack spacing={2}>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Grant Number
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                                    {award.grantNumber}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Award Date
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {formatDate(award.awardDate)}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Project Period
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {formatDate(award.startDate)} - {formatDate(award.endDate)}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Principal Investigator
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {award.principalInvestigator}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Department
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {award.department}
                                  </Typography>
                                </Box>
                              </Stack>
                            </Box>

                            <Box sx={{ 
                              p: 3, 
                              backgroundColor: alpha('#4caf50', 0.05),
                              borderRadius: 2,
                              border: `1px solid ${alpha('#4caf50', 0.1)}`,
                              mb: 3
                            }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                                Financial Summary
                              </Typography>
                              <Stack spacing={2}>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Total Award
                                  </Typography>
                                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                                    {formatCurrency(award.totalAmount)}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Funds Received
                                  </Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 600, color: 'info.main' }}>
                                    {formatCurrency(award.disbursedAmount)}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Remaining Balance
                                  </Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 600, color: 'warning.main' }}>
                                    {formatCurrency(award.remainingAmount)}
                                  </Typography>
                                </Box>
                              </Stack>
                            </Box>

                            <Box sx={{ 
                              p: 3, 
                              backgroundColor: alpha('#2196f3', 0.05),
                              borderRadius: 2,
                              border: `1px solid ${alpha('#2196f3', 0.1)}`
                            }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                                Next Milestone
                              </Typography>
                              <Stack spacing={1}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {award.nextMilestone}
                                </Typography>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <CalendarIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                  <Typography variant="body2" sx={{ 
                                    color: new Date(award.nextMilestoneDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
                                      ? 'error.main' : 'text.primary'
                                  }}>
                                    Due: {formatDate(award.nextMilestoneDate)}
                                  </Typography>
                                </Stack>
                              </Stack>
                            </Box>
                          </Grid>
                        </Grid>

                        <Divider sx={{ my: 3 }} />

                        <Stack direction="row" spacing={2} justifyContent="flex-end">
                          <Button
                            variant="outlined"
                            startIcon={<ViewIcon />}
                            onClick={() => handleViewAward(award)}
                            sx={{
                              borderColor: '#8b6cbc',
                              color: '#8b6cbc',
                              '&:hover': {
                                borderColor: '#7b5cac',
                                backgroundColor: alpha('#8b6cbc', 0.08)
                              }
                            }}
                          >
                            View Details
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<EditIcon />}
                            sx={{
                              borderColor: '#8b6cbc',
                              color: '#8b6cbc',
                              '&:hover': {
                                borderColor: '#7b5cac',
                                backgroundColor: alpha('#8b6cbc', 0.08)
                              }
                            }}
                          >
                            Update Status
                          </Button>
                          <Button
                            variant="contained"
                            startIcon={<DownloadIcon />}
                            sx={{
                              backgroundColor: '#8b6cbc',
                              '&:hover': { backgroundColor: '#7b5cac' }
                            }}
                          >
                            Generate Report
                          </Button>
                        </Stack>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            )}

            {selectedTab === 1 && (
              <Box>
                <Alert severity="info" sx={{ mb: 4, borderRadius: 2 }}>
                  <Typography variant="body2">
                    Track project milestones, deliverables, and timeline management for all active awards.
                  </Typography>
                </Alert>
                <Box sx={{ 
                  display: 'flex', 
                  gap: 4, 
                  flexWrap: 'wrap',
                  '& > *': {
                    flex: {
                      xs: '1 1 100%',
                      md: '1 1 calc(50% - 16px)',
                      lg: '1 1 calc(33.333% - 21.33px)'
                    }
                  }
                }}>
                  {milestones.map((milestone) => {
                    const award = awards.find(a => a.id === milestone.awardId);
                    return (
                      <Box key={milestone.id}>
                        <Card sx={{ 
                          borderRadius: 3, 
                          boxShadow: 2,
                          border: `2px solid ${alpha('#8b6cbc', 0.2)}`,
                          '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
                          transition: 'all 0.3s ease'
                        }}>
                          <CardContent sx={{ p: 3 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                                {milestone.title}
                              </Typography>
                              <Chip
                                label={milestone.status}
                                color={milestone.status === 'completed' ? 'success' : milestone.status === 'in_progress' ? 'warning' : 'default'}
                                size="small"
                              />
                            </Stack>
                            
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              Award: {award?.title}
                            </Typography>

                            <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.5 }}>
                              {milestone.description}
                            </Typography>

                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                              <CalendarIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                              <Typography variant="body2" sx={{ 
                                fontWeight: 600,
                                color: new Date(milestone.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'error.main' : 'text.primary'
                              }}>
                                Due: {formatDate(milestone.dueDate)}
                              </Typography>
                            </Stack>

                            {milestone.budget && (
                              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                                <MoneyIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                                  Budget: {formatCurrency(milestone.budget)}
                                </Typography>
                              </Stack>
                            )}

                            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                              Deliverables
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 3, fontSize: '0.85rem' }}>
                              {milestone.deliverables}
                            </Typography>

                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<EditIcon />}
                                sx={{
                                  borderColor: '#8b6cbc',
                                  color: '#8b6cbc',
                                  '&:hover': {
                                    borderColor: '#7b5cac',
                                    backgroundColor: alpha('#8b6cbc', 0.08)
                                  }
                                }}
                              >
                                Update
                              </Button>
                              {milestone.status !== 'completed' && (
                                <Button
                                  variant="contained"
                                  size="small"
                                  startIcon={<CheckCircleIcon />}
                                  sx={{
                                    backgroundColor: '#8b6cbc',
                                    '&:hover': { backgroundColor: '#7b5cac' }
                                  }}
                                >
                                  Complete
                                </Button>
                              )}
                            </Stack>
                          </CardContent>
                        </Card>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            )}

            {selectedTab === 2 && (
              <Box>
                <Alert severity="info" sx={{ mb: 4, borderRadius: 2 }}>
                  <Typography variant="body2">
                    Monitor financial performance, budget utilization, and funding disbursements across all awarded grants.
                  </Typography>
                </Alert>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 4, 
                    flexWrap: 'wrap',
                    '& > *': {
                      flex: {
                        xs: '1 1 100%',
                        md: '1 1 calc(50% - 16px)'
                      }
                    }
                  }}>
                    <Card sx={{ borderRadius: 3, boxShadow: 2, p: 4, height: 400, border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="h6" sx={{ mb: 4, fontSize: '1.25rem' }}>
                        Budget Utilization Overview
                      </Typography>
                      <Box sx={{ 
                        height: 300, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        backgroundColor: alpha('#8b6cbc', 0.05),
                        borderRadius: 2
                      }}>
                        <AssessmentIcon sx={{ fontSize: 120, color: alpha('#8b6cbc', 0.3) }} />
                      </Box>
                    </Card>

                    <Card sx={{ borderRadius: 3, boxShadow: 2, p: 4, height: 400, border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="h6" sx={{ mb: 4, fontSize: '1.25rem' }}>
                        Funding Timeline
                      </Typography>
                      <Box sx={{ 
                        height: 300, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        backgroundColor: alpha('#8b6cbc', 0.05),
                        borderRadius: 2
                      }}>
                        <TimelineIcon sx={{ fontSize: 120, color: alpha('#8b6cbc', 0.3) }} />
                      </Box>
                    </Card>
                  </Box>

                  <Box>
                    <Card sx={{ borderRadius: 3, boxShadow: 2, p: 4, border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="h6" sx={{ mb: 4, fontSize: '1.25rem' }}>
                        Financial Summary by Award
                      </Typography>
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow sx={{ backgroundColor: alpha('#8b6cbc', 0.05) }}>
                              <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Award Title</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Total Amount</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Received</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Remaining</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Utilization</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {awards.map((award) => {
                              const utilization = ((award.disbursedAmount / award.totalAmount) * 100).toFixed(1);
                              return (
                                <TableRow key={award.id} hover>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                      {award.title}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {award.grantor}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                      {formatCurrency(award.totalAmount)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'info.main' }}>
                                      {formatCurrency(award.disbursedAmount)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.main' }}>
                                      {formatCurrency(award.remainingAmount)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <LinearProgress 
                                        variant="determinate" 
                                        value={parseFloat(utilization)} 
                                        sx={{ 
                                          flex: 1,
                                          height: 8, 
                                          borderRadius: 4,
                                          backgroundColor: alpha('#8b6cbc', 0.1),
                                          '& .MuiLinearProgress-bar': {
                                            backgroundColor: '#8b6cbc',
                                            borderRadius: 4
                                          }
                                        }} 
                                      />
                                      <Typography variant="caption" sx={{ fontWeight: 600, minWidth: 40 }}>
                                        {utilization}%
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label={award.status}
                                      color={getStatusColor(award.status)}
                                      size="small"
                                    />
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Card>
                  </Box>
                </Box>
              </Box>
            )}

            {selectedTab === 3 && (
              <Box>
                <Alert severity={overdueReports > 0 ? 'warning' : 'info'} sx={{ mb: 4, borderRadius: 2 }}>
                  <Typography variant="body2">
                    {overdueReports > 0 
                      ? `${overdueReports} reports are overdue. Please submit them as soon as possible to maintain compliance.`
                      : 'All reports are up to date. Monitor upcoming deadlines to maintain compliance requirements.'
                    }
                  </Typography>
                </Alert>
                
                <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: alpha('#8b6cbc', 0.05) }}>
                        <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Award</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Report Type</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Period</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Submission Date</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reports.map((report) => {
                        const award = awards.find(a => a.id === report.awardId);
                        return (
                          <TableRow key={report.id} hover>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {award?.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {award?.grantNumber}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={report.type} 
                                size="small"
                                sx={{
                                  backgroundColor: alpha('#8b6cbc', 0.1),
                                  color: '#8b6cbc',
                                  fontWeight: 500
                                }}
                              />
                            </TableCell>
                            <TableCell>{report.period}</TableCell>
                            <TableCell>
                              <Chip
                                label={report.status}
                                color={
                                  report.status === 'approved' ? 'success' : 
                                  report.status === 'submitted' ? 'info' : 
                                  report.status === 'overdue' ? 'error' : 'warning'
                                }
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {report.submissionDate ? formatDate(report.submissionDate) : 'Not submitted'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={1}>
                                <Tooltip title="View Report">
                                  <IconButton size="small" sx={{ color: '#8b6cbc' }}>
                                    <ViewIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Download">
                                  <IconButton size="small" sx={{ color: '#2196f3' }}>
                                    <DownloadIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                {report.status === 'overdue' && (
                                  <Tooltip title="Submit Report">
                                    <IconButton size="small" sx={{ color: '#4caf50' }}>
                                      <UploadIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>

      {/* New Milestone Dialog */}
      <Dialog 
        open={newMilestoneDialog} 
        onClose={() => setNewMilestoneDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 100%)',
          color: 'white',
          py: 3
        }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <FlagIcon sx={{ fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Add New Milestone
            </Typography>
          </Stack>
        </DialogTitle>
        
        <DialogContent sx={{ p: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Award *</InputLabel>
                <Select
                  value={milestoneForm.awardId}
                  onChange={(e) => setMilestoneForm(prev => ({ ...prev, awardId: e.target.value }))}
                  label="Award *"
                  sx={{ borderRadius: 2 }}
                >
                  {awards.filter(award => award.status === 'active').map((award) => (
                    <MenuItem key={award.id} value={award.id}>
                      {award.title} - {award.grantor}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Milestone Title *"
                value={milestoneForm.title}
                onChange={(e) => setMilestoneForm(prev => ({ ...prev, title: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={milestoneForm.description}
                onChange={(e) => setMilestoneForm(prev => ({ ...prev, description: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Due Date *"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={milestoneForm.dueDate}
                onChange={(e) => setMilestoneForm(prev => ({ ...prev, dueDate: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={milestoneForm.status}
                  onChange={(e) => setMilestoneForm(prev => ({ ...prev, status: e.target.value }))}
                  label="Status"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Deliverables"
                value={milestoneForm.deliverables}
                onChange={(e) => setMilestoneForm(prev => ({ ...prev, deliverables: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Associated Budget"
                type="number"
                value={milestoneForm.budget}
                onChange={(e) => setMilestoneForm(prev => ({ ...prev, budget: e.target.value }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={() => setNewMilestoneDialog(false)}
            variant="outlined"
            disabled={saving}
            sx={{ borderRadius: 2, borderColor: '#8b6cbc', color: '#8b6cbc' }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveMilestone}
            disabled={saving || !milestoneForm.awardId || !milestoneForm.title || !milestoneForm.dueDate}
            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
            sx={{ 
              backgroundColor: '#8b6cbc',
              borderRadius: 2,
              '&:hover': { backgroundColor: '#7b5cac' }
            }}
          >
            {saving ? 'Creating...' : 'Create Milestone'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Award Dialog */}
      <Dialog 
        open={viewAwardDialog} 
        onClose={() => setViewAwardDialog(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 100%)',
          color: 'white',
          py: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <TrophyIcon sx={{ fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Award Details
            </Typography>
          </Stack>
          <IconButton onClick={() => setViewAwardDialog(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 4 }}>
          {selectedAward && (
            <Grid container spacing={4}>
              <Grid item xs={12}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                  {selectedAward.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  {selectedAward.grantor}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Grant Number
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 2, fontFamily: 'monospace' }}>
                  {selectedAward.grantNumber}
                </Typography>
                
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Principal Investigator
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                  {selectedAward.principalInvestigator}
                </Typography>
                
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Department
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                  {selectedAward.department}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Award Amount
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main', mb: 2 }}>
                  {formatCurrency(selectedAward.totalAmount)}
                </Typography>
                
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Project Period
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                  {formatDate(selectedAward.startDate)} - {formatDate(selectedAward.endDate)}
                </Typography>
                
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Current Status
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <Chip 
                    label={selectedAward.status} 
                    color={getStatusColor(selectedAward.status)}
                  />
                  <Chip 
                    label={selectedAward.projectStatus.replace('_', ' ')} 
                    color={getProjectStatusColor(selectedAward.projectStatus)}
                    variant="outlined"
                  />
                </Stack>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Project Description
                </Typography>
                <Typography variant="body2" sx={{ 
                  p: 2, 
                  backgroundColor: alpha('#8b6cbc', 0.05),
                  borderRadius: 2,
                  border: `1px solid ${alpha('#8b6cbc', 0.1)}`,
                  lineHeight: 1.6
                }}>
                  {selectedAward.description}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default GrantAwardsWon;
