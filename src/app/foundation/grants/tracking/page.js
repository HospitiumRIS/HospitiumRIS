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
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Event as EventIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Pending as PendingIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  NotificationImportant as NotificationIcon,
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
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';

const GrantTracking = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applications, setApplications] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Dialog states
  const [newCommunicationDialog, setNewCommunicationDialog] = useState(false);
  const [viewApplicationDialog, setViewApplicationDialog] = useState(false);
  const [updateStatusDialog, setUpdateStatusDialog] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  // Form states
  const [communicationForm, setCommunicationForm] = useState({
    applicationId: '',
    type: '',
    subject: '',
    message: '',
    followUpDate: '',
    priority: 'medium',
    attachments: []
  });

  const [statusForm, setStatusForm] = useState({
    applicationId: '',
    status: '',
    notes: '',
    nextAction: '',
    actionDate: ''
  });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Simulate API calls
      const [applicationsRes, communicationsRes, tasksRes] = await Promise.all([
        fetch(`/api/foundation/grant-applications?search=${searchTerm}&status=${filterStatus}&priority=${filterPriority}`),
        fetch('/api/foundation/grant-communications'),
        fetch('/api/foundation/grant-tasks')
      ]);

      // Mock data for demonstration
      setApplications([
        {
          id: 1,
          title: 'AI-Driven Healthcare Innovation Research',
          grantor: 'NIH - National Institute of Health',
          submissionDate: '2024-01-15',
          amount: 2500000,
          status: 'under_review',
          priority: 'high',
          contactPerson: 'Dr. Jennifer Martinez',
          contactEmail: 'j.martinez@nih.gov',
          contactPhone: '+1 (301) 496-4000',
          lastContact: '2024-01-20',
          nextFollowUp: '2024-02-01',
          progress: 65,
          stage: 'Technical Review',
          estimatedDecision: '2024-03-15',
          principalInvestigator: 'Dr. Sarah Johnson',
          department: 'Research & Innovation',
          notes: 'Positive feedback received from initial review. Waiting for technical committee evaluation.',
          timeline: [
            { stage: 'Application Submitted', date: '2024-01-15', status: 'completed' },
            { stage: 'Initial Review', date: '2024-01-22', status: 'completed' },
            { stage: 'Technical Review', date: '2024-01-30', status: 'in_progress' },
            { stage: 'Final Decision', date: '2024-03-15', status: 'pending' }
          ]
        },
        {
          id: 2,
          title: 'Community Health Outreach Program',
          grantor: 'CDC Foundation',
          submissionDate: '2024-01-10',
          amount: 750000,
          status: 'pending_documents',
          priority: 'medium',
          contactPerson: 'Ms. Rebecca Thompson',
          contactEmail: 'r.thompson@cdcfoundation.org',
          contactPhone: '+1 (404) 653-0790',
          lastContact: '2024-01-18',
          nextFollowUp: '2024-01-25',
          progress: 80,
          stage: 'Documentation Review',
          estimatedDecision: '2024-02-28',
          principalInvestigator: 'Dr. Michael Chen',
          department: 'Community Health',
          notes: 'Additional budget documentation requested. Currently preparing revised financial statements.',
          timeline: [
            { stage: 'Application Submitted', date: '2024-01-10', status: 'completed' },
            { stage: 'Initial Review', date: '2024-01-17', status: 'completed' },
            { stage: 'Documentation Review', date: '2024-01-20', status: 'in_progress' },
            { stage: 'Final Decision', date: '2024-02-28', status: 'pending' }
          ]
        },
        {
          id: 3,
          title: 'Medical Education Technology Platform',
          grantor: 'Gates Foundation',
          submissionDate: '2023-12-20',
          amount: 1200000,
          status: 'awarded',
          priority: 'high',
          contactPerson: 'Dr. Amanda Foster',
          contactEmail: 'a.foster@gatesfoundation.org',
          contactPhone: '+1 (206) 709-3100',
          lastContact: '2024-01-22',
          nextFollowUp: '2024-02-15',
          progress: 100,
          stage: 'Award Processing',
          estimatedDecision: 'Awarded',
          principalInvestigator: 'Dr. Emily Rodriguez',
          department: 'Medical Education',
          notes: 'Grant awarded! Currently processing award documentation and setting up project timeline.',
          timeline: [
            { stage: 'Application Submitted', date: '2023-12-20', status: 'completed' },
            { stage: 'Initial Review', date: '2024-01-05', status: 'completed' },
            { stage: 'Technical Review', date: '2024-01-15', status: 'completed' },
            { stage: 'Final Decision', date: '2024-01-20', status: 'completed' }
          ]
        },
        {
          id: 4,
          title: 'Pediatric Care Enhancement Initiative',
          grantor: 'Robert Wood Johnson Foundation',
          submissionDate: '2024-01-12',
          amount: 980000,
          status: 'rejected',
          priority: 'medium',
          contactPerson: 'Mr. David Wilson',
          contactEmail: 'd.wilson@rwjf.org',
          contactPhone: '+1 (609) 627-6000',
          lastContact: '2024-01-19',
          nextFollowUp: null,
          progress: 100,
          stage: 'Decision Received',
          estimatedDecision: 'Rejected',
          principalInvestigator: 'Dr. Lisa Wang',
          department: 'Pediatrics',
          notes: 'Application rejected due to budget constraints. Feedback received for future submissions.',
          timeline: [
            { stage: 'Application Submitted', date: '2024-01-12', status: 'completed' },
            { stage: 'Initial Review', date: '2024-01-18', status: 'completed' },
            { stage: 'Final Decision', date: '2024-01-19', status: 'completed' }
          ]
        }
      ]);

      setCommunications([
        {
          id: 1,
          applicationId: 1,
          applicationTitle: 'AI-Driven Healthcare Innovation Research',
          type: 'Email',
          subject: 'Follow-up on Technical Review Status',
          date: '2024-01-20',
          from: 'hospitium@foundation.org',
          to: 'j.martinez@nih.gov',
          status: 'sent',
          priority: 'medium',
          summary: 'Requested update on technical review progress and timeline.'
        },
        {
          id: 2,
          applicationId: 2,
          applicationTitle: 'Community Health Outreach Program',
          type: 'Phone Call',
          subject: 'Budget Documentation Requirements',
          date: '2024-01-18',
          from: 'Dr. Michael Chen',
          to: 'Ms. Rebecca Thompson',
          status: 'completed',
          priority: 'high',
          summary: 'Discussed additional budget documentation needed for application review.'
        },
        {
          id: 3,
          applicationId: 3,
          applicationTitle: 'Medical Education Technology Platform',
          type: 'Email',
          subject: 'Award Notification and Next Steps',
          date: '2024-01-22',
          from: 'a.foster@gatesfoundation.org',
          to: 'hospitium@foundation.org',
          status: 'received',
          priority: 'high',
          summary: 'Official award notification with instructions for next steps and documentation.'
        }
      ]);

      setUpcomingTasks([
        {
          id: 1,
          applicationId: 1,
          title: 'Follow up on Technical Review',
          dueDate: '2024-02-01',
          priority: 'high',
          type: 'follow_up',
          assignedTo: 'Dr. Sarah Johnson'
        },
        {
          id: 2,
          applicationId: 2,
          title: 'Submit Revised Budget Documentation',
          dueDate: '2024-01-25',
          priority: 'high',
          type: 'document_submission',
          assignedTo: 'Dr. Michael Chen'
        },
        {
          id: 3,
          applicationId: 3,
          title: 'Complete Award Documentation',
          dueDate: '2024-02-15',
          priority: 'medium',
          type: 'documentation',
          assignedTo: 'Dr. Emily Rodriguez'
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
      case 'submitted': return 'info';
      case 'under_review': return 'warning';
      case 'pending_documents': return 'warning';
      case 'awarded': return 'success';
      case 'rejected': return 'error';
      case 'withdrawn': return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStageIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon fontSize="small" />;
      case 'in_progress': return <PendingIcon fontSize="small" />;
      case 'pending': return <ScheduleIcon fontSize="small" />;
      default: return <InfoIcon fontSize="small" />;
    }
  };

  const handleNewCommunication = () => {
    setCommunicationForm({
      applicationId: '',
      type: '',
      subject: '',
      message: '',
      followUpDate: '',
      priority: 'medium',
      attachments: []
    });
    setNewCommunicationDialog(true);
  };

  const handleSaveCommunication = async () => {
    try {
      setSaving(true);
      
      if (!communicationForm.applicationId || !communicationForm.subject || !communicationForm.message) {
        showSnackbar('Please fill in all required fields', 'error');
        return;
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showSnackbar('Communication logged successfully!', 'success');
      setNewCommunicationDialog(false);
      loadData();
    } catch (error) {
      showSnackbar('Error logging communication', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleViewApplication = (application) => {
    setSelectedApplication(application);
    setViewApplicationDialog(true);
  };

  const handleUpdateStatus = (application) => {
    setSelectedApplication(application);
    setStatusForm({
      applicationId: application.id,
      status: application.status,
      notes: '',
      nextAction: '',
      actionDate: ''
    });
    setUpdateStatusDialog(true);
  };

  const handleSaveStatus = async () => {
    try {
      setSaving(true);
      
      if (!statusForm.status) {
        showSnackbar('Please select a status', 'error');
        return;
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showSnackbar('Status updated successfully!', 'success');
      setUpdateStatusDialog(false);
      loadData();
    } catch (error) {
      showSnackbar('Error updating status', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  // Calculate statistics
  const totalApplications = applications.length;
  const activeApplications = applications.filter(app => 
    ['submitted', 'under_review', 'pending_documents'].includes(app.status)
  ).length;
  const awardedApplications = applications.filter(app => app.status === 'awarded').length;
  const totalValue = applications.reduce((sum, app) => sum + app.amount, 0);
  const pendingTasks = upcomingTasks.filter(task => new Date(task.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length;

  if (loading) {
    return (
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Grant Tracking & Liaison"
          description="Monitor grant applications and maintain ongoing communication with funding organizations"
          icon={<AssignmentIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Foundation', path: '/foundation' },
            { label: 'Grants', path: '/foundation/grants' },
            { label: 'Tracking' }
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
          title="Grant Tracking & Liaison"
          description="Monitor grant applications and maintain ongoing communication with funding organizations"
          icon={<AssignmentIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Foundation', path: '/foundation' },
            { label: 'Grants', path: '/foundation/grants' },
            { label: 'Tracking' }
          ]}
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
          actionButton={
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleNewCommunication}
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
                Log Communication
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadData}
                sx={{
                  borderColor: 'rgba(255,255,255,0.5)',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                Refresh
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
            flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(20% - 19.2px)' } 
          }
        }}>
          <Card sx={{ 
            borderRadius: 3, 
            height: 140,
            background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5cac 100%)',
            color: 'white',
            boxShadow: '0 3px 12px rgba(139, 108, 188, 0.15)',
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: '0 6px 20px rgba(139, 108, 188, 0.3)'
            },
            transition: 'all 0.3s ease'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <AssignmentIcon sx={{ fontSize: 28, color: 'rgba(255,255,255,0.9)', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="white" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
                {totalApplications}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontSize: '1rem', color: 'rgba(255,255,255,0.9)' }}>
                Total Applications
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ 
            borderRadius: 3, 
            height: 140,
            background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5cac 100%)',
            color: 'white',
            boxShadow: '0 3px 12px rgba(139, 108, 188, 0.15)',
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: '0 6px 20px rgba(139, 108, 188, 0.3)'
            },
            transition: 'all 0.3s ease'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <PendingIcon sx={{ fontSize: 28, color: 'rgba(255,255,255,0.9)', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="white" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
                {activeApplications}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontSize: '1rem', color: 'rgba(255,255,255,0.9)' }}>
                Active Reviews
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ 
            borderRadius: 3, 
            height: 140,
            background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5cac 100%)',
            color: 'white',
            boxShadow: '0 3px 12px rgba(139, 108, 188, 0.15)',
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: '0 6px 20px rgba(139, 108, 188, 0.3)'
            },
            transition: 'all 0.3s ease'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <CheckCircleIcon sx={{ fontSize: 28, color: 'rgba(255,255,255,0.9)', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="white" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
                {awardedApplications}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontSize: '1rem', color: 'rgba(255,255,255,0.9)' }}>
                Awards Won
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ 
            borderRadius: 3, 
            height: 140,
            background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5cac 100%)',
            color: 'white',
            boxShadow: '0 3px 12px rgba(139, 108, 188, 0.15)',
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: '0 6px 20px rgba(139, 108, 188, 0.3)'
            },
            transition: 'all 0.3s ease'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <TrendingUpIcon sx={{ fontSize: 28, color: 'rgba(255,255,255,0.9)', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="white" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
                {formatCurrency(totalValue)}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontSize: '1rem', color: 'rgba(255,255,255,0.9)' }}>
                Total Value
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ 
            borderRadius: 3, 
            height: 140,
            background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5cac 100%)',
            color: 'white',
            boxShadow: '0 3px 12px rgba(139, 108, 188, 0.15)',
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: '0 6px 20px rgba(139, 108, 188, 0.3)'
            },
            transition: 'all 0.3s ease'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <NotificationIcon sx={{ fontSize: 28, color: 'rgba(255,255,255,0.9)', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="white" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
                {pendingTasks}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontSize: '1rem', color: 'rgba(255,255,255,0.9)' }}>
                Urgent Tasks
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Search and Filters */}
        <Paper sx={{ borderRadius: 3, p: 4, mb: 5 }}>
          <Box sx={{ 
            display: 'flex', 
            gap: 4, 
            flexWrap: 'wrap',
            alignItems: 'center',
            '& > *': { 
              flex: { xs: '1 1 100%', md: '1 1 calc(50% - 16px)' } 
            },
            '& > *:first-of-type': { 
              flex: { xs: '1 1 100%', md: '1 1 calc(50% - 16px)' } 
            },
            '& > *:nth-of-type(2)': { 
              flex: { xs: '1 1 100%', md: '1 1 calc(25% - 16px)' } 
            },
            '& > *:nth-of-type(3)': { 
              flex: { xs: '1 1 100%', md: '1 1 calc(25% - 16px)' } 
            }
          }}>
            <TextField
              placeholder="Search applications by title, grantor, or PI..."
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
            
            <FormControl size="medium">
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Filter by Status"
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="submitted">Submitted</MenuItem>
                <MenuItem value="under_review">Under Review</MenuItem>
                <MenuItem value="pending_documents">Pending Documents</MenuItem>
                <MenuItem value="awarded">Awarded</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl size="medium">
              <InputLabel>Filter by Priority</InputLabel>
              <Select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                label="Filter by Priority"
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">All Priorities</MenuItem>
                <MenuItem value="high">High Priority</MenuItem>
                <MenuItem value="medium">Medium Priority</MenuItem>
                <MenuItem value="low">Low Priority</MenuItem>
              </Select>
            </FormControl>
          </Box>
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
            <Tab label="Applications Overview" icon={<AssignmentIcon />} />
            <Tab label="Communications Log" icon={<EmailIcon />} />
            <Tab label="Upcoming Tasks" icon={<ScheduleIcon />} />
            <Tab label="Timeline View" icon={<TimelineIcon />} />
          </Tabs>

          {/* Tab Content */}
          <Box sx={{ p: 4 }}>
            {selectedTab === 0 && (
              <Box sx={{ 
                display: 'flex', 
                gap: 4, 
                flexDirection: 'column'
              }}>
                {applications.map((application) => (
                    <Card sx={{ 
                      borderRadius: 3, 
                      boxShadow: 2,
                      border: `2px solid ${alpha('#8b6cbc', 0.1)}`,
                      '&:hover': {
                        boxShadow: 4,
                        transform: 'translateY(-2px)',
                        transition: 'all 0.3s ease'
                      }
                    }}>
                      <CardContent sx={{ p: 4 }}>
                        <Grid container spacing={3}>
                          {/* Left Column - Application Details */}
                          <Grid item xs={12} md={8}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, fontSize: '1.25rem' }}>
                                  {application.title}
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                                  {application.grantor}
                                </Typography>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                                  <Chip 
                                    label={application.status.replace('_', ' ')} 
                                    color={getStatusColor(application.status)}
                                    size="small"
                                  />
                                  <Chip 
                                    label={application.priority} 
                                    color={getPriorityColor(application.priority)}
                                    size="small"
                                    variant="outlined"
                                  />
                                  <Chip 
                                    label={application.stage} 
                                    size="small"
                                    sx={{
                                      backgroundColor: alpha('#8b6cbc', 0.1),
                                      color: '#8b6cbc'
                                    }}
                                  />
                                </Stack>
                              </Box>
                              <Stack direction="row" spacing={1}>
                                <Tooltip title="View Details">
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleViewApplication(application)}
                                    sx={{ color: '#8b6cbc' }}
                                  >
                                    <ViewIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Update Status">
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleUpdateStatus(application)}
                                    sx={{ color: '#ff9800' }}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Log Communication">
                                  <IconButton size="small" sx={{ color: '#2196f3' }}>
                                    <EmailIcon />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </Stack>

                            <Grid container spacing={3} sx={{ mb: 3 }}>
                              <Grid item xs={6} md={3}>
                                <Typography variant="caption" color="text.secondary">
                                  Amount
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                                  {formatCurrency(application.amount)}
                                </Typography>
                              </Grid>
                              <Grid item xs={6} md={3}>
                                <Typography variant="caption" color="text.secondary">
                                  Submitted
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {formatDate(application.submissionDate)}
                                </Typography>
                              </Grid>
                              <Grid item xs={6} md={3}>
                                <Typography variant="caption" color="text.secondary">
                                  Last Contact
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {formatDate(application.lastContact)}
                                </Typography>
                              </Grid>
                              <Grid item xs={6} md={3}>
                                <Typography variant="caption" color="text.secondary">
                                  Next Follow-up
                                </Typography>
                                <Typography variant="body2" sx={{ 
                                  fontWeight: 600,
                                  color: application.nextFollowUp && new Date(application.nextFollowUp) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
                                    ? 'error.main' : 'text.primary'
                                }}>
                                  {formatDate(application.nextFollowUp)}
                                </Typography>
                              </Grid>
                            </Grid>

                            <Box sx={{ mb: 3 }}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Review Progress
                                </Typography>
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                  {application.progress}%
                                </Typography>
                              </Stack>
                              <LinearProgress 
                                variant="determinate" 
                                value={application.progress} 
                                sx={{ 
                                  height: 8, 
                                  borderRadius: 4,
                                  backgroundColor: alpha('#8b6cbc', 0.1),
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: '#8b6cbc',
                                    borderRadius: 4
                                  }
                                }} 
                              />
                            </Box>

                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              {application.notes}
                            </Typography>
                          </Grid>

                          {/* Right Column - Contact & Timeline */}
                          <Grid item xs={12} md={4}>
                            <Box sx={{ 
                              p: 3, 
                              backgroundColor: alpha('#8b6cbc', 0.05),
                              borderRadius: 2,
                              border: `1px solid ${alpha('#8b6cbc', 0.1)}`,
                              mb: 3
                            }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                                Contact Information
                              </Typography>
                              <Stack spacing={1}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <PersonIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                  <Typography variant="body2">{application.contactPerson}</Typography>
                                </Stack>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <EmailIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                  <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                                    {application.contactEmail}
                                  </Typography>
                                </Stack>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <PhoneIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                  <Typography variant="body2">{application.contactPhone}</Typography>
                                </Stack>
                              </Stack>
                            </Box>

                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                                Application Timeline
                              </Typography>
                              <Stepper orientation="vertical" sx={{ '& .MuiStepConnector-line': { minHeight: 20 } }}>
                                {application.timeline.map((step, index) => (
                                  <Step key={index} active={step.status === 'in_progress'} completed={step.status === 'completed'}>
                                    <StepLabel 
                                      icon={getStageIcon(step.status)}
                                      sx={{
                                        '& .MuiStepLabel-label': {
                                          fontSize: '0.9rem',
                                          fontWeight: step.status === 'in_progress' ? 600 : 400
                                        }
                                      }}
                                    >
                                      <Box>
                                        <Typography variant="body2" sx={{ 
                                          fontWeight: step.status === 'in_progress' ? 600 : 400,
                                          color: step.status === 'in_progress' ? '#8b6cbc' : 'text.primary'
                                        }}>
                                          {step.stage}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {formatDate(step.date)}
                                        </Typography>
                                      </Box>
                                    </StepLabel>
                                  </Step>
                                ))}
                              </Stepper>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                ))}
              </Box>
            )}

            {selectedTab === 1 && (
              <Box>
                <Alert severity="info" sx={{ mb: 4, borderRadius: 2 }}>
                  <Typography variant="body2">
                    Track all communications with grant organizations. Log emails, phone calls, and meetings to maintain comprehensive records.
                  </Typography>
                </Alert>
                <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: alpha('#8b6cbc', 0.05) }}>
                        <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Application</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Subject</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Contact</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {communications.map((comm) => (
                        <TableRow key={comm.id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {formatDate(comm.date)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {comm.applicationTitle}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={comm.type} 
                              size="small"
                              sx={{
                                backgroundColor: alpha('#8b6cbc', 0.1),
                                color: '#8b6cbc',
                                fontWeight: 500
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{comm.subject}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                              {comm.to}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={comm.status}
                              color={comm.status === 'sent' ? 'success' : comm.status === 'received' ? 'info' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <Tooltip title="View Details">
                                <IconButton size="small" sx={{ color: '#8b6cbc' }}>
                                  <ViewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Reply">
                                <IconButton size="small" sx={{ color: '#2196f3' }}>
                                  <CommentIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {selectedTab === 2 && (
              <Box>
                <Alert severity="warning" sx={{ mb: 4, borderRadius: 2 }}>
                  <Typography variant="body2">
                    <strong>{pendingTasks} urgent tasks</strong> require attention within the next 7 days. Stay on top of deadlines to maintain good relationships with funding organizations.
                  </Typography>
                </Alert>
                <Box sx={{ 
                  display: 'flex', 
                  gap: 4, 
                  flexWrap: 'wrap',
                  '& > *': { 
                    flex: { xs: '1 1 100%', md: '1 1 calc(50% - 16px)', lg: '1 1 calc(33.333% - 21.333px)' } 
                  }
                }}>
                  {upcomingTasks.map((task) => (
                      <Card key={task.id} sx={{ 
                        borderRadius: 3, 
                        boxShadow: 2,
                        border: `2px solid ${alpha(getPriorityColor(task.priority) === 'error' ? '#f44336' : getPriorityColor(task.priority) === 'warning' ? '#ff9800' : '#4caf50', 0.2)}`,
                        '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
                        transition: 'all 0.3s ease'
                      }}>
                        <CardContent sx={{ p: 3 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                              {task.title}
                            </Typography>
                            <Chip
                              label={task.priority}
                              color={getPriorityColor(task.priority)}
                              size="small"
                            />
                          </Stack>
                          
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Application: {applications.find(app => app.id === task.applicationId)?.title}
                          </Typography>

                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                            <CalendarIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                            <Typography variant="body2" sx={{ 
                              fontWeight: 600,
                              color: new Date(task.dueDate) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) ? 'error.main' : 'text.primary'
                            }}>
                              Due: {formatDate(task.dueDate)}
                            </Typography>
                          </Stack>

                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                            <PersonIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                            <Typography variant="body2">
                              Assigned to: {task.assignedTo}
                            </Typography>
                          </Stack>

                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<CheckCircleIcon />}
                              sx={{
                                borderColor: '#4caf50',
                                color: '#4caf50',
                                '&:hover': {
                                  borderColor: '#388e3c',
                                  backgroundColor: alpha('#4caf50', 0.08)
                                }
                              }}
                            >
                              Mark Complete
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                  ))}
                </Box>
              </Box>
            )}

            {selectedTab === 3 && (
              <Box>
                <Alert severity="info" sx={{ mb: 4, borderRadius: 2 }}>
                  <Typography variant="body2">
                    Comprehensive timeline view showing the progression of all grant applications through various stages.
                  </Typography>
                </Alert>
                
                <Box sx={{ 
                  display: 'flex', 
                  gap: 4, 
                  flexDirection: 'column'
                }}>
                  {applications.map((application) => (
                      <Card key={application.id} sx={{ 
                        borderRadius: 3, 
                        boxShadow: 2,
                        border: `1px solid ${alpha('#8b6cbc', 0.2)}`,
                        mb: 3
                      }}>
                        <CardContent sx={{ p: 4 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, fontSize: '1.25rem' }}>
                            {application.title}
                          </Typography>
                          
                          <Stepper alternativeLabel sx={{ '& .MuiStepConnector-line': { minHeight: 3 } }}>
                            {application.timeline.map((step, index) => (
                              <Step key={index} active={step.status === 'in_progress'} completed={step.status === 'completed'}>
                                <StepLabel 
                                  icon={getStageIcon(step.status)}
                                  sx={{
                                    '& .MuiStepLabel-label': {
                                      fontSize: '0.9rem',
                                      fontWeight: step.status === 'in_progress' ? 600 : 400,
                                      color: step.status === 'in_progress' ? '#8b6cbc' : 'text.primary'
                                    }
                                  }}
                                >
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="body2" sx={{ 
                                      fontWeight: step.status === 'in_progress' ? 600 : 400,
                                      color: step.status === 'in_progress' ? '#8b6cbc' : 'text.primary'
                                    }}>
                                      {step.stage}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {formatDate(step.date)}
                                    </Typography>
                                  </Box>
                                </StepLabel>
                              </Step>
                            ))}
                          </Stepper>
                        </CardContent>
                      </Card>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>

      {/* New Communication Dialog */}
      <Dialog 
        open={newCommunicationDialog} 
        onClose={() => setNewCommunicationDialog(false)}
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
            <EmailIcon sx={{ fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Log New Communication
            </Typography>
          </Stack>
        </DialogTitle>
        
        <DialogContent sx={{ p: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Application *</InputLabel>
                <Select
                  value={communicationForm.applicationId}
                  onChange={(e) => setCommunicationForm(prev => ({ ...prev, applicationId: e.target.value }))}
                  label="Application *"
                  sx={{ borderRadius: 2 }}
                >
                  {applications.map((app) => (
                    <MenuItem key={app.id} value={app.id}>
                      {app.title} - {app.grantor}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Communication Type *</InputLabel>
                <Select
                  value={communicationForm.type}
                  onChange={(e) => setCommunicationForm(prev => ({ ...prev, type: e.target.value }))}
                  label="Communication Type *"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="Email">Email</MenuItem>
                  <MenuItem value="Phone Call">Phone Call</MenuItem>
                  <MenuItem value="Video Conference">Video Conference</MenuItem>
                  <MenuItem value="In-Person Meeting">In-Person Meeting</MenuItem>
                  <MenuItem value="Letter">Letter</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={communicationForm.priority}
                  onChange={(e) => setCommunicationForm(prev => ({ ...prev, priority: e.target.value }))}
                  label="Priority"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Subject *"
                value={communicationForm.subject}
                onChange={(e) => setCommunicationForm(prev => ({ ...prev, subject: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={5}
                label="Message/Notes *"
                value={communicationForm.message}
                onChange={(e) => setCommunicationForm(prev => ({ ...prev, message: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Follow-up Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={communicationForm.followUpDate}
                onChange={(e) => setCommunicationForm(prev => ({ ...prev, followUpDate: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={() => setNewCommunicationDialog(false)}
            variant="outlined"
            disabled={saving}
            sx={{ borderRadius: 2, borderColor: '#8b6cbc', color: '#8b6cbc' }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveCommunication}
            disabled={saving || !communicationForm.applicationId || !communicationForm.subject || !communicationForm.message}
            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
            sx={{ 
              backgroundColor: '#8b6cbc',
              borderRadius: 2,
              '&:hover': { backgroundColor: '#7b5cac' }
            }}
          >
            {saving ? 'Logging...' : 'Log Communication'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Application Dialog */}
      <Dialog 
        open={viewApplicationDialog} 
        onClose={() => setViewApplicationDialog(false)}
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
            <ViewIcon sx={{ fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Application Details
            </Typography>
          </Stack>
          <IconButton onClick={() => setViewApplicationDialog(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 4 }}>
          {selectedApplication && (
            <Grid container spacing={4}>
              <Grid item xs={12}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                  {selectedApplication.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  {selectedApplication.grantor}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Principal Investigator
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                  {selectedApplication.principalInvestigator}
                </Typography>
                
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Department
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                  {selectedApplication.department}
                </Typography>
                
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Funding Amount
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main', mb: 2 }}>
                  {formatCurrency(selectedApplication.amount)}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Current Status
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <Chip 
                    label={selectedApplication.status.replace('_', ' ')} 
                    color={getStatusColor(selectedApplication.status)}
                  />
                  <Chip 
                    label={selectedApplication.priority} 
                    color={getPriorityColor(selectedApplication.priority)}
                    variant="outlined"
                  />
                </Stack>
                
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Current Stage
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                  {selectedApplication.stage}
                </Typography>
                
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Estimated Decision
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                  {selectedApplication.estimatedDecision}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                  Contact Information
                </Typography>
                <Box sx={{ 
                  p: 3, 
                  backgroundColor: alpha('#8b6cbc', 0.05),
                  borderRadius: 2,
                  border: `1px solid ${alpha('#8b6cbc', 0.1)}`,
                  mb: 3
                }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <PersonIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        <Typography variant="body2">{selectedApplication.contactPerson}</Typography>
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <EmailIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        <Typography variant="body2">{selectedApplication.contactEmail}</Typography>
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <PhoneIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        <Typography variant="body2">{selectedApplication.contactPhone}</Typography>
                      </Stack>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                  Application Timeline
                </Typography>
                <Stepper alternativeLabel>
                  {selectedApplication.timeline.map((step, index) => (
                    <Step key={index} active={step.status === 'in_progress'} completed={step.status === 'completed'}>
                      <StepLabel 
                        icon={getStageIcon(step.status)}
                        sx={{
                          '& .MuiStepLabel-label': {
                            fontSize: '0.9rem',
                            fontWeight: step.status === 'in_progress' ? 600 : 400,
                            color: step.status === 'in_progress' ? '#8b6cbc' : 'text.primary'
                          }
                        }}
                      >
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" sx={{ 
                            fontWeight: step.status === 'in_progress' ? 600 : 400,
                            color: step.status === 'in_progress' ? '#8b6cbc' : 'text.primary'
                          }}>
                            {step.stage}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(step.date)}
                          </Typography>
                        </Box>
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Grid>
              
              {selectedApplication.notes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Notes
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    p: 2, 
                    backgroundColor: alpha('#8b6cbc', 0.05),
                    borderRadius: 2,
                    border: `1px solid ${alpha('#8b6cbc', 0.1)}`
                  }}>
                    {selectedApplication.notes}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog 
        open={updateStatusDialog} 
        onClose={() => setUpdateStatusDialog(false)}
        maxWidth="sm"
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
            <EditIcon sx={{ fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Update Application Status
            </Typography>
          </Stack>
        </DialogTitle>
        
        <DialogContent sx={{ p: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status *</InputLabel>
                <Select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm(prev => ({ ...prev, status: e.target.value }))}
                  label="Status *"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="submitted">Submitted</MenuItem>
                  <MenuItem value="under_review">Under Review</MenuItem>
                  <MenuItem value="pending_documents">Pending Documents</MenuItem>
                  <MenuItem value="awarded">Awarded</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                  <MenuItem value="withdrawn">Withdrawn</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Update Notes"
                value={statusForm.notes}
                onChange={(e) => setStatusForm(prev => ({ ...prev, notes: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Next Action Required"
                value={statusForm.nextAction}
                onChange={(e) => setStatusForm(prev => ({ ...prev, nextAction: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Action Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={statusForm.actionDate}
                onChange={(e) => setStatusForm(prev => ({ ...prev, actionDate: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={() => setUpdateStatusDialog(false)}
            variant="outlined"
            disabled={saving}
            sx={{ borderRadius: 2, borderColor: '#8b6cbc', color: '#8b6cbc' }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveStatus}
            disabled={saving || !statusForm.status}
            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
            sx={{ 
              backgroundColor: '#8b6cbc',
              borderRadius: 2,
              '&:hover': { backgroundColor: '#7b5cac' }
            }}
          >
            {saving ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogActions>
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

export default GrantTracking;
