'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
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
  Stepper,
  Step,
  StepLabel,
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

  const getStatusHex = (status) => {
    switch (status?.toLowerCase()) {
      case 'submitted': return '#2196f3';
      case 'under_review': return '#ff9800';
      case 'pending_documents': return '#f59e0b';
      case 'awarded': return '#059669';
      case 'rejected': return '#f44336';
      case 'withdrawn': return '#9e9e9e';
      default: return '#9e9e9e';
    }
  };

  const getPriorityHex = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#9e9e9e';
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

  const filteredApplications = applications.filter(app => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !searchTerm ||
      app.title.toLowerCase().includes(q) ||
      app.grantor.toLowerCase().includes(q) ||
      app.principalInvestigator.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || app.status === filterStatus;
    const matchPriority = filterPriority === 'all' || app.priority === filterPriority;
    return matchSearch && matchStatus && matchPriority;
  });

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
        {/* Stats + Filter Panel */}
        <Paper sx={{
          borderRadius: 3, mb: 3, overflow: 'hidden',
          boxShadow: `0 4px 24px ${alpha('#8b6cbc', 0.08)}`,
          border: `1px solid ${alpha('#8b6cbc', 0.1)}`
        }}>
          {/* Compact summary bar */}
          <Box sx={{
            px: 3, py: 1.5,
            background: `linear-gradient(135deg, ${alpha('#8b6cbc', 0.06)} 0%, ${alpha('#8b6cbc', 0.03)} 100%)`,
            borderBottom: '1px solid', borderColor: 'divider',
            display: 'flex', alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5
          }}>
            {[
              { label: 'Total',          value: totalApplications,  color: '#8b6cbc' },
              { label: 'Active',         value: activeApplications, color: '#ff9800', key: 'active' },
              { label: 'Under Review',   value: applications.filter(a => a.status === 'under_review').length,       color: '#2196f3', key: 'under_review' },
              { label: 'Pending Docs',   value: applications.filter(a => a.status === 'pending_documents').length,  color: '#f59e0b', key: 'pending_documents' },
              { label: 'Awarded',        value: awardedApplications, color: '#059669', key: 'awarded' },
              { label: 'Rejected',       value: applications.filter(a => a.status === 'rejected').length, color: '#f44336', key: 'rejected' },
              { label: 'Total Value',    value: formatCurrency(totalValue), color: '#0369a1' },
              { label: 'Urgent Tasks',   value: pendingTasks,        color: '#dc2626' },
            ].map((item, i) => (
              <React.Fragment key={i}>
                {i > 0 && <Divider orientation="vertical" flexItem sx={{ mx: 2, my: 0.5 }} />}
                <Stack
                  direction="row" spacing={0.75} alignItems="center"
                  onClick={item.key ? () => setFilterStatus(filterStatus === item.key ? 'all' : item.key) : undefined}
                  sx={item.key ? {
                    cursor: 'pointer', px: 1, py: 0.3, borderRadius: 1,
                    bgcolor: filterStatus === item.key ? alpha(item.color, 0.1) : 'transparent',
                    outline: filterStatus === item.key ? `1.5px solid ${alpha(item.color, 0.35)}` : 'none',
                    transition: 'all 0.15s',
                    '&:hover': { bgcolor: alpha(item.color, 0.07) }
                  } : { px: 1, py: 0.3 }}
                >
                  <Typography variant="caption" sx={{ fontSize: '0.76rem', color: 'text.secondary', fontWeight: 500 }}>
                    {item.label}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.85rem', fontWeight: 800, color: item.color }}>
                    {item.value}
                  </Typography>
                </Stack>
              </React.Fragment>
            ))}
          </Box>

          {/* Filter row */}
          <Box sx={{ px: 3, py: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search by title, grantor, or PI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1, minWidth: 220 }}
            />
            <FormControl size="small" sx={{ minWidth: 170 }}>
              <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} displayEmpty>
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="submitted">Submitted</MenuItem>
                <MenuItem value="under_review">Under Review</MenuItem>
                <MenuItem value="pending_documents">Pending Documents</MenuItem>
                <MenuItem value="awarded">Awarded</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} displayEmpty>
                <MenuItem value="all">All Priorities</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
            {(searchTerm || filterStatus !== 'all' || filterPriority !== 'all') && (
              <Button size="small" variant="text"
                onClick={() => { setSearchTerm(''); setFilterStatus('all'); setFilterPriority('all'); }}
                sx={{ color: '#8b6cbc', whiteSpace: 'nowrap', px: 1 }}>
                Clear
              </Button>
            )}
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', px: 3, pb: 1.5, display: 'block' }}>
            Showing <strong>{filteredApplications.length}</strong> of <strong>{applications.length}</strong> applications
            {(searchTerm || filterStatus !== 'all' || filterPriority !== 'all') && ' · filtered view'}
          </Typography>
        </Paper>

        {/* Main Content Tabs */}
        <Paper sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            sx={{
              bgcolor: alpha('#8b6cbc', 0.04),
              px: 2,
              borderBottom: '1px solid', borderColor: 'divider',
              minHeight: 46,
              '& .MuiTab-root': {
                fontWeight: 600,
                fontSize: '0.88rem',
                minHeight: 46,
                '&.Mui-selected': { color: '#8b6cbc' }
              },
              '& .MuiTabs-indicator': { backgroundColor: '#8b6cbc', height: 2.5 }
            }}
          >
            <Tab label="Applications" icon={<AssignmentIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
            <Tab label="Communications" icon={<EmailIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
            <Tab label="Upcoming Tasks" icon={<ScheduleIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
            <Tab label="Timeline" icon={<TimelineIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
          </Tabs>

          {/* Tab Content */}
          <Box sx={{ p: 3 }}>
            {selectedTab === 0 && (
              <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#8b6cbc' }}>
                        <TableCell sx={{ color: 'white', fontWeight: 600, width: 4, p: 0 }} />
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Application</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600, minWidth: 110 }}>Amount</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600, minWidth: 150 }}>Status</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600, minWidth: 170 }}>Progress</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600, minWidth: 118 }}>Next Follow-up</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600, minWidth: 130 }}>PI</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600, width: 100 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredApplications.map((application) => {
                        const statusHex = getStatusHex(application.status);
                        const isUrgent = application.nextFollowUp &&
                          new Date(application.nextFollowUp) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                        return (
                          <TableRow key={application.id} hover sx={{ borderLeft: `4px solid ${statusHex}` }}>
                            <TableCell sx={{ p: 0, width: 0 }} />
                            <TableCell sx={{ py: 1.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', lineHeight: 1.3 }}>
                                {application.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                <BusinessIcon sx={{ fontSize: 11 }} /> {application.grantor}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#059669', fontSize: '0.85rem' }}>
                                {formatCurrency(application.amount)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.73rem' }}>
                                {application.stage}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Stack spacing={0.5}>
                                <Chip label={application.status.replace(/_/g, ' ')} size="small" sx={{
                                  height: 20, fontSize: '0.73rem', fontWeight: 700,
                                  bgcolor: alpha(statusHex, 0.12), color: statusHex,
                                  textTransform: 'capitalize', '& .MuiChip-label': { px: 0.75 }
                                }} />
                                <Chip label={application.priority} size="small" variant="outlined" sx={{
                                  height: 18, fontSize: '0.68rem',
                                  borderColor: alpha(getPriorityHex(application.priority), 0.5),
                                  color: getPriorityHex(application.priority),
                                  textTransform: 'capitalize', '& .MuiChip-label': { px: 0.6 }
                                }} />
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ minWidth: 130 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.74rem' }}>
                                    {application.estimatedDecision !== 'Awarded' && application.estimatedDecision !== 'Rejected'
                                      ? `Decision: ${formatDate(application.estimatedDecision)}`
                                      : application.estimatedDecision}
                                  </Typography>
                                  <Typography variant="caption" sx={{ fontSize: '0.74rem', fontWeight: 700, color: statusHex }}>
                                    {application.progress}%
                                  </Typography>
                                </Box>
                                <LinearProgress value={application.progress} variant="determinate" sx={{
                                  height: 5, borderRadius: 3,
                                  bgcolor: alpha('#8b6cbc', 0.1),
                                  '& .MuiLinearProgress-bar': { bgcolor: statusHex, borderRadius: 3 }
                                }} />
                              </Box>
                            </TableCell>
                            <TableCell>
                              {application.nextFollowUp ? (
                                <Typography variant="caption" sx={{
                                  fontWeight: 600, fontSize: '0.81rem',
                                  color: isUrgent ? '#dc2626' : 'text.primary',
                                  display: 'flex', alignItems: 'center', gap: 0.4
                                }}>
                                  {isUrgent && <WarningIcon sx={{ fontSize: 12 }} />}
                                  {formatDate(application.nextFollowUp)}
                                </Typography>
                              ) : (
                                <Typography variant="caption" color="text.disabled">—</Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                <Avatar sx={{ width: 22, height: 22, fontSize: '0.6rem', bgcolor: '#8b6cbc' }}>
                                  {application.principalInvestigator?.charAt(0)}
                                </Avatar>
                                <Typography variant="caption" sx={{ fontSize: '0.78rem', color: '#475569' }}>
                                  {application.principalInvestigator?.split(' ').slice(-1)[0]}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={0.25}>
                                <Tooltip title="View Details">
                                  <IconButton size="small" onClick={() => handleViewApplication(application)} sx={{ color: '#8b6cbc', p: 0.5 }}>
                                    <ViewIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Update Status">
                                  <IconButton size="small" onClick={() => handleUpdateStatus(application)} sx={{ color: '#ff9800', p: 0.5 }}>
                                    <EditIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Log Communication">
                                  <IconButton size="small" onClick={handleNewCommunication} sx={{ color: '#2196f3', p: 0.5 }}>
                                    <EmailIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                {filteredApplications.length === 0 && (
                  <Box sx={{ py: 6, textAlign: 'center' }}>
                    <AssignmentIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">No applications match the current filters</Typography>
                  </Box>
                )}
              </Paper>
            )}


            {selectedTab === 1 && (
              <Box>
                <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#8b6cbc' }}>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Date</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Application</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Type</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Subject</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Contact</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {communications.map((comm) => (
                        <TableRow key={comm.id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.84rem' }}>
                              {formatDate(comm.date)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.84rem' }}>
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
                            <Typography variant="body2" sx={{ fontSize: '0.84rem' }}>{comm.subject}</Typography>
                            {comm.summary && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.74rem', mt: 0.25 }}>{comm.summary}</Typography>}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontSize: '0.84rem' }}>
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
                {pendingTasks > 0 && (
                  <Alert severity="warning" sx={{ mb: 2, borderRadius: 2, py: 0.5 }}>
                    <Typography variant="body2">
                      <strong>{pendingTasks} task{pendingTasks !== 1 ? 's' : ''}</strong> due within the next 7 days
                    </Typography>
                  </Alert>
                )}
                <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap', '& > *': { flex: { xs: '1 1 100%', md: '1 1 calc(50% - 10px)', lg: '1 1 calc(33.333% - 13.4px)' } } }}>
                  {upcomingTasks.map((task) => {
                    const pHex = getPriorityHex(task.priority);
                    const overdue = new Date(task.dueDate) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
                    return (
                      <Card key={task.id} sx={{
                        borderRadius: 2.5,
                        borderLeft: `4px solid ${pHex}`,
                        boxShadow: `0 2px 10px ${alpha(pHex, 0.12)}`,
                        '&:hover': { boxShadow: `0 4px 18px ${alpha(pHex, 0.22)}`, transform: 'translateY(-1px)' },
                        transition: 'all 0.2s'
                      }}>
                        <CardContent sx={{ p: 2.5, pb: '14px !important' }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', lineHeight: 1.35, flex: 1, mr: 1 }}>
                              {task.title}
                            </Typography>
                            <Chip label={task.priority} size="small" sx={{
                              height: 20, fontSize: '0.68rem', fontWeight: 700, flexShrink: 0,
                              bgcolor: alpha(pHex, 0.12), color: pHex, textTransform: 'capitalize',
                              '& .MuiChip-label': { px: 0.75 }
                            }} />
                          </Box>

                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontSize: '0.78rem' }}>
                            {applications.find(app => app.id === task.applicationId)?.title}
                          </Typography>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                              <CalendarIcon sx={{ fontSize: 13, color: overdue ? '#dc2626' : 'text.secondary' }} />
                              <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.78rem', color: overdue ? '#dc2626' : 'text.primary' }}>
                                Due {formatDate(task.dueDate)}
                              </Typography>
                            </Box>
                            <Divider orientation="vertical" flexItem />
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                              <PersonIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.78rem' }}>
                                {task.assignedTo}
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button size="small" variant="outlined"
                              startIcon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                              sx={{ borderColor: '#4caf50', color: '#4caf50', fontSize: '0.78rem', py: 0.3,
                                '&:hover': { borderColor: '#388e3c', bgcolor: alpha('#4caf50', 0.06) } }}
                            >
                              Mark Complete
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              </Box>
            )}

            {selectedTab === 3 && (
              <Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {applications.map((application) => {
                    const statusHex = getStatusHex(application.status);
                    return (
                      <Card key={application.id} sx={{
                        borderRadius: 2.5, boxShadow: 1,
                        borderLeft: `4px solid ${statusHex}`,
                        border: `1px solid ${alpha(statusHex, 0.2)}`,
                        borderLeftWidth: 4,
                      }}>
                        <CardContent sx={{ p: 2.5, pb: '12px !important' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Chip label={application.status.replace(/_/g, ' ')} size="small" sx={{
                              height: 20, fontSize: '0.73rem', fontWeight: 700,
                              bgcolor: alpha(statusHex, 0.12), color: statusHex,
                              textTransform: 'capitalize', '& .MuiChip-label': { px: 0.75 }
                            }} />
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                              {application.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto', flexShrink: 0 }}>
                              {application.grantor}
                            </Typography>
                          </Box>

                          <Stepper alternativeLabel sx={{ '& .MuiStepConnector-line': { minHeight: 2 } }}>
                            {application.timeline.map((step, index) => (
                              <Step key={index} active={step.status === 'in_progress'} completed={step.status === 'completed'}>
                                <StepLabel
                                  icon={getStageIcon(step.status)}
                                  sx={{ '& .MuiStepLabel-label': { fontSize: '0.81rem', fontWeight: step.status === 'in_progress' ? 700 : 400 } }}
                                >
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="caption" sx={{ fontWeight: step.status === 'in_progress' ? 700 : 400, color: step.status === 'in_progress' ? '#8b6cbc' : 'text.primary', fontSize: '0.78rem' }}>
                                      {step.stage}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                                      {formatDate(step.date)}
                                    </Typography>
                                  </Box>
                                </StepLabel>
                              </Step>
                            ))}
                          </Stepper>
                        </CardContent>
                      </Card>
                    );
                  })}
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
        disableScrollLock
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
        
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Application *</InputLabel>
              <Select
                value={communicationForm.applicationId}
                onChange={(e) => setCommunicationForm(prev => ({ ...prev, applicationId: e.target.value }))}
                label="Application *"
              >
                {applications.map((app) => (
                  <MenuItem key={app.id} value={app.id}>
                    {app.title} — {app.grantor}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', '& > *': { flex: '1 1 180px' } }}>
              <FormControl fullWidth>
                <InputLabel>Communication Type *</InputLabel>
                <Select
                  value={communicationForm.type}
                  onChange={(e) => setCommunicationForm(prev => ({ ...prev, type: e.target.value }))}
                  label="Communication Type *"
                >
                  <MenuItem value="Email">Email</MenuItem>
                  <MenuItem value="Phone Call">Phone Call</MenuItem>
                  <MenuItem value="Video Conference">Video Conference</MenuItem>
                  <MenuItem value="In-Person Meeting">In-Person Meeting</MenuItem>
                  <MenuItem value="Letter">Letter</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={communicationForm.priority}
                  onChange={(e) => setCommunicationForm(prev => ({ ...prev, priority: e.target.value }))}
                  label="Priority"
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <TextField
              fullWidth
              label="Subject *"
              value={communicationForm.subject}
              onChange={(e) => setCommunicationForm(prev => ({ ...prev, subject: e.target.value }))}
            />
            <TextField
              fullWidth multiline rows={4}
              label="Message / Notes *"
              value={communicationForm.message}
              onChange={(e) => setCommunicationForm(prev => ({ ...prev, message: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Follow-up Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={communicationForm.followUpDate}
              onChange={(e) => setCommunicationForm(prev => ({ ...prev, followUpDate: e.target.value }))}
            />
          </Stack>
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
        disableScrollLock
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
        
        <DialogContent sx={{ p: 3 }}>
          {selectedApplication && (
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>{selectedApplication.title}</Typography>
                <Typography variant="body2" color="text.secondary">{selectedApplication.grantor}</Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', '& > *': { flex: '1 1 220px' } }}>
                <Stack spacing={1.5}>
                  {[{ label: 'Principal Investigator', value: selectedApplication.principalInvestigator },
                    { label: 'Department', value: selectedApplication.department },
                    { label: 'Funding Amount', value: formatCurrency(selectedApplication.amount), green: true }]
                    .map(({ label, value, green }) => (
                      <Box key={label}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: green ? '#059669' : 'text.primary' }}>{value}</Typography>
                      </Box>
                    ))}
                </Stack>
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</Typography>
                    <Stack direction="row" spacing={0.75} sx={{ mt: 0.5 }}>
                      <Chip label={selectedApplication.status.replace(/_/g, ' ')} size="small" sx={{ height: 20, fontSize: '0.73rem', fontWeight: 700, bgcolor: alpha(getStatusHex(selectedApplication.status), 0.12), color: getStatusHex(selectedApplication.status), textTransform: 'capitalize' }} />
                      <Chip label={selectedApplication.priority} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.73rem', borderColor: alpha(getPriorityHex(selectedApplication.priority), 0.5), color: getPriorityHex(selectedApplication.priority), textTransform: 'capitalize' }} />
                    </Stack>
                  </Box>
                  {[{ label: 'Current Stage', value: selectedApplication.stage },
                    { label: 'Estimated Decision', value: selectedApplication.estimatedDecision }]
                    .map(({ label, value }) => (
                      <Box key={label}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{value}</Typography>
                      </Box>
                    ))}
                </Stack>
              </Box>

              <Box sx={{ p: 2, bgcolor: alpha('#8b6cbc', 0.04), borderRadius: 2, border: `1px solid ${alpha('#8b6cbc', 0.1)}` }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 1 }}>Contact Information</Typography>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  {[{ icon: <PersonIcon sx={{ fontSize: 14 }} />, value: selectedApplication.contactPerson },
                    { icon: <EmailIcon sx={{ fontSize: 14 }} />, value: selectedApplication.contactEmail },
                    { icon: <PhoneIcon sx={{ fontSize: 14 }} />, value: selectedApplication.contactPhone }]
                    .map(({ icon, value }, i) => (
                      <Stack key={i} direction="row" alignItems="center" spacing={0.6}>
                        <Box sx={{ color: 'text.secondary' }}>{icon}</Box>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{value}</Typography>
                      </Stack>
                    ))}
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 1.5 }}>Application Timeline</Typography>
                <Stepper alternativeLabel>
                  {selectedApplication.timeline.map((step, index) => (
                    <Step key={index} active={step.status === 'in_progress'} completed={step.status === 'completed'}>
                      <StepLabel
                        icon={getStageIcon(step.status)}
                        sx={{ '& .MuiStepLabel-label': { fontSize: '0.81rem', fontWeight: step.status === 'in_progress' ? 700 : 400 } }}
                      >
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" sx={{ fontWeight: step.status === 'in_progress' ? 700 : 400, color: step.status === 'in_progress' ? '#8b6cbc' : 'text.primary', fontSize: '0.78rem' }}>{step.stage}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>{formatDate(step.date)}</Typography>
                        </Box>
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Box>

              {selectedApplication.notes && (
                <Box sx={{ p: 2, bgcolor: alpha('#8b6cbc', 0.04), borderRadius: 2, border: `1px solid ${alpha('#8b6cbc', 0.1)}` }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 0.75 }}>Notes</Typography>
                  <Typography variant="body2">{selectedApplication.notes}</Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog
        open={updateStatusDialog}
        onClose={() => setUpdateStatusDialog(false)}
        maxWidth="sm"
        fullWidth
        disableScrollLock
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
        
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Status *</InputLabel>
              <Select
                value={statusForm.status}
                onChange={(e) => setStatusForm(prev => ({ ...prev, status: e.target.value }))}
                label="Status *"
              >
                <MenuItem value="submitted">Submitted</MenuItem>
                <MenuItem value="under_review">Under Review</MenuItem>
                <MenuItem value="pending_documents">Pending Documents</MenuItem>
                <MenuItem value="awarded">Awarded</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
                <MenuItem value="withdrawn">Withdrawn</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth multiline rows={3}
              label="Update Notes"
              value={statusForm.notes}
              onChange={(e) => setStatusForm(prev => ({ ...prev, notes: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Next Action Required"
              value={statusForm.nextAction}
              onChange={(e) => setStatusForm(prev => ({ ...prev, nextAction: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Action Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={statusForm.actionDate}
              onChange={(e) => setStatusForm(prev => ({ ...prev, actionDate: e.target.value }))}
            />
          </Stack>
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
