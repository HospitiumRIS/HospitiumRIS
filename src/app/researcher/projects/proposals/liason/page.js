'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Paper,
  TextField,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  Avatar,
  Badge,
  InputAdornment,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Tooltip,
  Alert,
  Stack,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Fab,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Rating,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Schedule as ScheduleIcon,
  Assignment as GrantIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Add as AddIcon,
  MoreVert as MoreIcon,
  Event as EventIcon,
  ContactMail as ContactMailIcon,
  TrendingUp as TrendingUpIcon,
  Money as MoneyIcon,
  BusinessCenter as BusinessIcon,
  Timeline as TimelineIcon,
  Campaign as CampaignIcon,
  AccountBalance as BankIcon,
  Groups as TeamsIcon,
  Launch as LaunchIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  StarBorder as StarIcon,
  Star as StarFilledIcon,
  Work as ProjectIcon,
  Article as ArticleIcon,
  Person as AuthorIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  Group as GroupIcon,
  Notifications as NotificationIcon,
  CheckCircleOutline as CompleteIcon,
  RadioButtonUnchecked as PendingCallIcon,
  PhoneCallback as CallbackIcon,
  Assignment as AgendaIcon,
  Notes as NotesIcon,
  TrendingUp as SuccessIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  ExpandMore as ExpandMoreIcon,
  Flag as FlagIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Warning as WarningIcon,
  CheckCircleOutline as CheckOutlineIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  AttachFile as AttachFileIcon,
  LocalOffer as TagIcon,
  CalendarToday as CalendarTodayIcon,
  ArrowForward as DirectionsRunIcon,
  Info as LightbulbIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { format, addDays, isAfter, isBefore } from 'date-fns';
import PageHeader from '../../../../../components/common/PageHeader';
import { useAuth } from '../../../../../components/AuthProvider';
import { useRouter } from 'next/navigation';

// Mock data for demonstration
const mockGrantApplications = [
  {
    id: '1',
    proposalTitle: 'AI-Driven Cardiovascular Risk Assessment Platform',
    funderName: 'National Science Foundation',
    funderType: 'Federal',
    contactPerson: 'Dr. Sarah Johnson',
    contactEmail: 'sarah.johnson@nsf.gov',
    contactPhone: '+1-555-123-4567',
    grantAmount: 450000,
    status: 'Under Review',
    applicationDate: new Date('2024-09-15'),
    followUpDate: new Date('2024-11-01'),
    lastContact: new Date('2024-10-15'),
    priority: 'High',
    notes: 'Initial review completed. Waiting for second-round evaluation.',
    emailThreads: [
      {
        id: 'thread-1',
        subject: 'NSF Grant Application - Follow Up',
        lastMessage: 'Thank you for your application. We are currently in the review phase.',
        messageCount: 5,
        lastMessageDate: new Date('2024-10-15'),
        participants: ['sarah.johnson@nsf.gov', 'researcher@university.edu']
      }
    ],
    statusHistory: [
      {
        id: 'hist-1-1',
        previousStatus: null,
        newStatus: 'Pending Submission',
        reason: 'Initial application created and documentation started',
        milestone: 'Application Started',
        changedBy: 'John Researcher',
        changedAt: new Date('2024-08-01'),
        visibility: 'Internal'
      },
      {
        id: 'hist-1-2',
        previousStatus: 'Pending Submission',
        newStatus: 'Under Review',
        reason: 'Application submitted successfully through NSF FastLane portal',
        milestone: 'Application Submitted',
        expectedDate: '2024-12-01T17:00',
        nextSteps: 'Await initial review feedback and prepare for potential reviewer questions',
        changedBy: 'John Researcher',
        changedAt: new Date('2024-09-15'),
        visibility: 'Shared'
      }
    ]
  },
  {
    id: '2',
    proposalTitle: 'Telemedicine Solutions for Rural Healthcare Access',
    funderName: 'Bill & Melinda Gates Foundation',
    funderType: 'Private',
    contactPerson: 'Michael Chen',
    contactEmail: 'michael.chen@gatesfoundation.org',
    contactPhone: '+1-555-987-6543',
    grantAmount: 750000,
    status: 'Approved',
    applicationDate: new Date('2024-08-01'),
    followUpDate: new Date('2024-12-15'),
    lastContact: new Date('2024-10-20'),
    priority: 'High',
    notes: 'Grant approved! Working on contract finalization and milestone setup.',
    emailThreads: [
      {
        id: 'thread-2',
        subject: 'Grant Approval - Next Steps',
        lastMessage: 'Congratulations! Please review the attached contract terms.',
        messageCount: 12,
        lastMessageDate: new Date('2024-10-20'),
        participants: ['michael.chen@gatesfoundation.org', 'researcher@university.edu', 'legal@university.edu']
      }
    ]
  },
  {
    id: '3',
    proposalTitle: 'Machine Learning for Cancer Diagnostics',
    funderName: 'Howard Hughes Medical Institute',
    funderType: 'Private',
    contactPerson: 'Dr. Lisa Park',
    contactEmail: 'lisa.park@hhmi.org',
    contactPhone: '+1-555-456-7890',
    grantAmount: 320000,
    status: 'Rejected',
    applicationDate: new Date('2024-07-10'),
    followUpDate: null,
    lastContact: new Date('2024-09-25'),
    priority: 'Medium',
    notes: 'Application rejected. Feedback received for future improvements.',
    emailThreads: [
      {
        id: 'thread-3',
        subject: 'Grant Application Status Update',
        lastMessage: 'We regret to inform you that your application was not selected.',
        messageCount: 8,
        lastMessageDate: new Date('2024-09-25'),
        participants: ['lisa.park@hhmi.org', 'researcher@university.edu']
      }
    ]
  },
  {
    id: '4',
    proposalTitle: 'Digital Health Platform for Maternal Care',
    funderName: 'World Health Organization',
    funderType: 'International',
    contactPerson: 'Dr. Amara Okafor',
    contactEmail: 'okafor@who.int',
    contactPhone: '+41-22-791-2111',
    grantAmount: 580000,
    status: 'Pending Submission',
    applicationDate: new Date('2024-11-05'),
    followUpDate: new Date('2024-11-20'),
    lastContact: new Date('2024-10-22'),
    priority: 'High',
    notes: 'Final review before submission. Deadline approaching.',
    emailThreads: [
      {
        id: 'thread-4',
        subject: 'WHO Grant Opportunity Discussion',
        lastMessage: 'Looking forward to your submission. Please ensure all documents are included.',
        messageCount: 3,
        lastMessageDate: new Date('2024-10-22'),
        participants: ['okafor@who.int', 'researcher@university.edu']
      }
    ]
  }
];

const statusColors = {
  'Pending Submission': '#ff9800',
  'Under Review': '#2196f3',
  'Approved': '#4caf50',
  'Rejected': '#f44336',
  'Contract Negotiation': '#9c27b0',
  'Active': '#00bcd4'
};

const priorityColors = {
  'High': '#f44336',
  'Medium': '#ff9800',
  'Low': '#4caf50'
};

// Status workflow and milestones
const statusWorkflow = {
  'Pending Submission': {
    next: ['Under Review', 'Cancelled'],
    milestones: ['Application Completed', 'Documentation Gathered', 'Review Ready'],
    suggestedActions: ['Complete application form', 'Gather required documents', 'Internal review']
  },
  'Under Review': {
    next: ['Approved', 'Rejected', 'Revision Requested', 'Additional Info Required'],
    milestones: ['Initial Review', 'Committee Review', 'Final Review'],
    suggestedActions: ['Follow up with reviewer', 'Prepare for questions', 'Submit additional docs if needed']
  },
  'Revision Requested': {
    next: ['Under Review', 'Resubmitted', 'Withdrawn'],
    milestones: ['Revisions Identified', 'Revisions Completed', 'Resubmission Ready'],
    suggestedActions: ['Address reviewer comments', 'Revise application', 'Schedule revision review']
  },
  'Additional Info Required': {
    next: ['Under Review', 'Information Submitted', 'Withdrawn'],
    milestones: ['Info Request Received', 'Info Gathered', 'Info Submitted'],
    suggestedActions: ['Gather required information', 'Contact relevant parties', 'Submit information']
  },
  'Approved': {
    next: ['Contract Negotiation', 'Active', 'Declined'],
    milestones: ['Approval Received', 'Contract Sent', 'Contract Signed', 'Funding Released'],
    suggestedActions: ['Review contract terms', 'Negotiate if needed', 'Set up project structure']
  },
  'Rejected': {
    next: ['Reapplied', 'Appealed', 'Closed'],
    milestones: ['Rejection Received', 'Feedback Analyzed', 'Next Steps Planned'],
    suggestedActions: ['Review feedback', 'Plan reapplication', 'Consider alternative funding']
  },
  'Contract Negotiation': {
    next: ['Active', 'Declined', 'Renegotiation'],
    milestones: ['Contract Review', 'Terms Agreed', 'Contract Signed'],
    suggestedActions: ['Review contract terms', 'Legal review', 'Negotiate terms']
  },
  'Active': {
    next: ['Completed', 'Suspended', 'Terminated'],
    milestones: ['Project Started', 'Milestone 1', 'Milestone 2', 'Final Report'],
    suggestedActions: ['Project kickoff', 'Regular reporting', 'Milestone tracking']
  }
};

const funderTypeIcons = {
  'Federal': <BankIcon />,
  'Private': <BusinessIcon />,
  'International': <CampaignIcon />,
  'Corporate': <BusinessIcon />
};

export default function ProposalLiaisonPage() {
  const { user } = useAuth();
  const theme = useTheme();
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [grantApplications, setGrantApplications] = useState(mockGrantApplications);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [addApplicationDialog, setAddApplicationDialog] = useState(false);
  const [updateStatusDialog, setUpdateStatusDialog] = useState(false);
  const [scheduleCallDialog, setScheduleCallDialog] = useState(false);
  const [emailComposeDialog, setEmailComposeDialog] = useState(false);
  const [viewDetailsDialog, setViewDetailsDialog] = useState(false);
  const [callOutcomeDialog, setCallOutcomeDialog] = useState(false);
  const [viewCallsDialog, setViewCallsDialog] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuApplication, setMenuApplication] = useState(null);
  
  // Form states
  const [newApplication, setNewApplication] = useState({
    proposalTitle: '',
    funderName: '',
    funderType: 'Federal',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    grantAmount: '',
    status: 'Pending Submission',
    priority: 'Medium',
    notes: ''
  });
  
  const [statusUpdate, setStatusUpdate] = useState({
    newStatus: '',
    reason: '',
    milestone: '',
    expectedDate: '',
    nextSteps: '',
    notificationNeeded: false,
    followUpDate: '',
    attachments: [],
    visibility: 'Internal'
  });
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  
  // Call management states
  const [scheduledCalls, setScheduledCalls] = useState([]);
  const [callForm, setCallForm] = useState({
    title: '',
    dateTime: '',
    duration: '30',
    type: 'Follow-up',
    priority: 'Medium',
    agenda: '',
    participants: '',
    location: 'Phone Call',
    reminderBefore: '15',
    notes: ''
  });
  const [callOutcome, setCallOutcome] = useState({
    status: '',
    summary: '',
    nextSteps: '',
    followUpDate: '',
    followUpType: '',
    rating: 5
  });
  

  // Filter and search logic
  const filteredApplications = grantApplications.filter(app => {
    const matchesSearch = app.proposalTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.funderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.contactPerson.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || app.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Stats calculation
  const stats = {
    total: grantApplications.length,
    pending: grantApplications.filter(app => app.status === 'Pending Submission').length,
    underReview: grantApplications.filter(app => app.status === 'Under Review').length,
    approved: grantApplications.filter(app => app.status === 'Approved').length,
    rejected: grantApplications.filter(app => app.status === 'Rejected').length,
    totalFunding: grantApplications
      .filter(app => app.status === 'Approved')
      .reduce((sum, app) => sum + app.grantAmount, 0),
    // Call statistics
    totalCalls: scheduledCalls.length,
    scheduledCalls: scheduledCalls.filter(call => call.status === 'Scheduled').length,
    completedCalls: scheduledCalls.filter(call => call.status === 'Completed').length,
    upcomingCalls: scheduledCalls.filter(call => 
      call.status === 'Scheduled' && 
      isAfter(new Date(call.dateTime), new Date())
    ).length
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleViewEmailThread = (thread) => {
    router.push(`/researcher/projects/proposals/liason/email-thread/${thread.id}`);
  };

  const handleMenuOpen = (event, application) => {
    setMenuAnchor(event.currentTarget);
    setMenuApplication(application);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuApplication(null);
  };

  const handleAddApplication = () => {
    if (selectedApplication) {
      // Update existing application
      const updatedApplications = grantApplications.map(app => 
        app.id === selectedApplication.id 
          ? { 
              ...app,
              ...newApplication,
              grantAmount: parseInt(newApplication.grantAmount),
              lastContact: new Date()
            }
          : app
      );
      setGrantApplications(updatedApplications);
    } else {
      // Add new application
      const newApp = {
        id: Date.now().toString(),
        ...newApplication,
        grantAmount: parseInt(newApplication.grantAmount),
        applicationDate: new Date(),
        followUpDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        lastContact: new Date(),
        emailThreads: []
      };
      setGrantApplications([...grantApplications, newApp]);
    }
    
    setAddApplicationDialog(false);
    setSelectedApplication(null);
    setNewApplication({
      proposalTitle: '',
      funderName: '',
      funderType: 'Federal',
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
      grantAmount: '',
      status: 'Pending Submission',
      priority: 'Medium',
      notes: ''
    });
  };

  const handleUpdateStatus = () => {
    if (!statusUpdate.newStatus || !statusUpdate.reason) {
      alert('Please provide the new status and reason for the change');
      return;
    }

    // Create status history entry
    const statusHistoryEntry = {
      id: Date.now().toString(),
      previousStatus: selectedApplication.status,
      newStatus: statusUpdate.newStatus,
      reason: statusUpdate.reason,
      milestone: statusUpdate.milestone,
      expectedDate: statusUpdate.expectedDate,
      nextSteps: statusUpdate.nextSteps,
      visibility: statusUpdate.visibility,
      changedBy: user?.givenName ? `${user.givenName} ${user.familyName}` : 'User',
      changedAt: new Date()
    };

    // Update application with new status and history
    const updatedApplications = grantApplications.map(app => 
      app.id === selectedApplication.id 
        ? { 
            ...app, 
            status: statusUpdate.newStatus, 
            notes: `${app.notes}\n\n[${format(new Date(), 'MMM dd, yyyy')}] Status changed: ${selectedApplication.status} → ${statusUpdate.newStatus}\nReason: ${statusUpdate.reason}${statusUpdate.milestone ? `\nMilestone: ${statusUpdate.milestone}` : ''}${statusUpdate.nextSteps ? `\nNext Steps: ${statusUpdate.nextSteps}` : ''}`,
            lastContact: new Date(),
            statusHistory: [...(app.statusHistory || []), statusHistoryEntry],
            priority: statusUpdate.newStatus === 'Approved' ? 'High' : 
                     statusUpdate.newStatus === 'Rejected' ? 'Low' : 
                     app.priority
          }
        : app
    );
    
    setGrantApplications(updatedApplications);

    // Schedule follow-up if needed
    if (statusUpdate.followUpDate) {
      const followUpCall = {
        id: Date.now().toString() + '-status-followup',
        applicationId: selectedApplication.id,
        applicationTitle: selectedApplication.proposalTitle,
        contactPerson: selectedApplication.contactPerson,
        contactEmail: selectedApplication.contactEmail,
        contactPhone: selectedApplication.contactPhone,
        funderName: selectedApplication.funderName,
        title: `Status Follow-up: ${statusUpdate.newStatus}`,
        dateTime: statusUpdate.followUpDate,
        duration: '30',
        type: 'Status Update',
        priority: 'Medium',
        agenda: `Follow-up after status change to ${statusUpdate.newStatus}. ${statusUpdate.nextSteps || 'Discuss next steps.'}`,
        participants: selectedApplication.contactPerson,
        location: 'Phone Call',
        reminderBefore: '15',
        notes: `Scheduled after status change from ${selectedApplication.status} to ${statusUpdate.newStatus}`,
        status: 'Scheduled',
        createdAt: new Date(),
        outcome: null
      };
      setScheduledCalls(prev => [...prev, followUpCall]);
    }

    // Reset form and close dialog
    setUpdateStatusDialog(false);
    setStatusUpdate({
      newStatus: '',
      reason: '',
      milestone: '',
      expectedDate: '',
      nextSteps: '',
      notificationNeeded: false,
      followUpDate: '',
      attachments: [],
      visibility: 'Internal'
    });

    alert(`Status updated successfully to "${statusUpdate.newStatus}"!`);
  };

  const handleScheduleCall = () => {
    if (!callForm.dateTime || !callForm.title) {
      alert('Please fill in required fields (Title and Date/Time)');
      return;
    }

    const newCall = {
      id: Date.now().toString(),
      applicationId: selectedApplication.id,
      applicationTitle: selectedApplication.proposalTitle,
      contactPerson: selectedApplication.contactPerson,
      contactEmail: selectedApplication.contactEmail,
      contactPhone: selectedApplication.contactPhone,
      funderName: selectedApplication.funderName,
      ...callForm,
      status: 'Scheduled',
      createdAt: new Date(),
      outcome: null
    };

    // Add to scheduled calls
    setScheduledCalls([...scheduledCalls, newCall]);

    // Update application with call reference
    const updatedApplications = grantApplications.map(app => 
      app.id === selectedApplication.id 
        ? { 
            ...app, 
            notes: `${app.notes}\n\n[${format(new Date(), 'MMM dd, yyyy')}] Scheduled call: ${callForm.title} - ${format(new Date(callForm.dateTime), 'MMM dd, yyyy \'at\' HH:mm')}`,
            lastContact: new Date()
          }
        : app
    );
    setGrantApplications(updatedApplications);

    // Reset form and close dialog
    setScheduleCallDialog(false);
    setCallForm({
      title: '',
      dateTime: '',
      duration: '30',
      type: 'Follow-up',
      priority: 'Medium',
      agenda: '',
      participants: '',
      location: 'Phone Call',
      reminderBefore: '15',
      notes: ''
    });

    alert('Call scheduled successfully!');
  };

  const handleCallOutcome = () => {
    if (!callOutcome.status || !callOutcome.summary) {
      alert('Please provide call status and summary');
      return;
    }

    // Update the call with outcome
    const updatedCalls = scheduledCalls.map(call => 
      call.id === selectedCall.id 
        ? { 
            ...call, 
            status: 'Completed',
            outcome: {
              ...callOutcome,
              completedAt: new Date()
            }
          }
        : call
    );
    setScheduledCalls(updatedCalls);

    // Update application notes with call outcome
    const updatedApplications = grantApplications.map(app => 
      app.id === selectedCall.applicationId 
        ? { 
            ...app, 
            notes: `${app.notes}\n\n[${format(new Date(), 'MMM dd, yyyy')}] Call completed: ${selectedCall.title}\nOutcome: ${callOutcome.status}\nSummary: ${callOutcome.summary}${callOutcome.nextSteps ? `\nNext Steps: ${callOutcome.nextSteps}` : ''}`,
            lastContact: new Date()
          }
        : app
    );
    setGrantApplications(updatedApplications);

    // Schedule follow-up if needed
    if (callOutcome.followUpDate && callOutcome.followUpType) {
      const followUpCall = {
        id: Date.now().toString() + '-followup',
        applicationId: selectedCall.applicationId,
        applicationTitle: selectedCall.applicationTitle,
        contactPerson: selectedCall.contactPerson,
        contactEmail: selectedCall.contactEmail,
        contactPhone: selectedCall.contactPhone,
        funderName: selectedCall.funderName,
        title: `Follow-up: ${callOutcome.followUpType}`,
        dateTime: callOutcome.followUpDate,
        duration: '30',
        type: callOutcome.followUpType,
        priority: 'Medium',
        agenda: `Follow-up from previous call: ${selectedCall.title}`,
        participants: selectedCall.contactPerson,
        location: 'Phone Call',
        reminderBefore: '15',
        notes: `Scheduled as follow-up from call on ${format(new Date(), 'MMM dd, yyyy')}`,
        status: 'Scheduled',
        createdAt: new Date(),
        outcome: null
      };
      setScheduledCalls(prev => [...prev, followUpCall]);
    }

    setCallOutcomeDialog(false);
    setSelectedCall(null);
    setCallOutcome({
      status: '',
      summary: '',
      nextSteps: '',
      followUpDate: '',
      followUpType: '',
      rating: 5
    });

    alert('Call outcome recorded successfully!');
  };

  const handleViewCalls = (application) => {
    setSelectedApplication(application);
    setViewCallsDialog(true);
  };

  const handleSendEmail = () => {
    // In a real app, this would integrate with an email service
    const newThread = {
      id: `thread-${Date.now()}`,
      subject: emailSubject,
      lastMessage: emailBody.substring(0, 100) + '...',
      messageCount: 1,
      lastMessageDate: new Date(),
      participants: [selectedApplication.contactEmail, 'researcher@university.edu']
    };

    const updatedApplications = grantApplications.map(app => 
      app.id === selectedApplication.id 
        ? { 
            ...app, 
            emailThreads: [...app.emailThreads, newThread],
            lastContact: new Date()
          }
        : app
    );
    
    setGrantApplications(updatedApplications);
    setEmailComposeDialog(false);
    setEmailSubject('');
    setEmailBody('');
  };

  const handleDeleteApplication = () => {
    const updatedApplications = grantApplications.filter(app => app.id !== selectedApplication.id);
    setGrantApplications(updatedApplications);
    handleMenuClose();
  };

  const handleMenuAction = (action) => {
    setSelectedApplication(menuApplication);
    handleMenuClose();
    
    switch (action) {
      case 'edit':
        setNewApplication({
          proposalTitle: menuApplication.proposalTitle,
          funderName: menuApplication.funderName,
          funderType: menuApplication.funderType,
          contactPerson: menuApplication.contactPerson,
          contactEmail: menuApplication.contactEmail,
          contactPhone: menuApplication.contactPhone,
          grantAmount: menuApplication.grantAmount.toString(),
          status: menuApplication.status,
          priority: menuApplication.priority,
          notes: menuApplication.notes
        });
        setAddApplicationDialog(true);
        break;
      case 'viewDetails':
        setViewDetailsDialog(true);
        break;
      case 'updateStatus':
        setStatusUpdate(prev => ({ ...prev, newStatus: menuApplication.status }));
        setUpdateStatusDialog(true);
        break;
      case 'sendEmail':
        setEmailSubject(`Follow-up: ${menuApplication.proposalTitle}`);
        setEmailComposeDialog(true);
        break;
      case 'scheduleCall':
        setScheduleCallDialog(true);
        break;
      case 'delete':
        if (window.confirm('Are you sure you want to delete this application?')) {
          handleDeleteApplication();
        }
        break;
      default:
        break;
    }
  };


  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved':
        return <CheckCircleIcon />;
      case 'Rejected':
        return <CancelIcon />;
      case 'Under Review':
        return <PendingIcon />;
      default:
        return <ScheduleIcon />;
    }
  };

  const renderStatsCards = () => (
    <Box sx={{ 
      display: 'flex', 
      gap: 3, 
      mb: 4,
      flexWrap: 'wrap',
      '& > *': { flex: 1, minWidth: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(20% - 12px)' } }
    }}>
      <Card elevation={2}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Typography variant="h4" color="primary" fontWeight="bold">
            {stats.total}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Total Applications
          </Typography>
        </CardContent>
      </Card>
      
      <Card elevation={2}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Typography variant="h4" sx={{ color: statusColors['Under Review'] }} fontWeight="bold">
            {stats.underReview}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Under Review
          </Typography>
        </CardContent>
      </Card>
      
      <Card elevation={2}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Typography variant="h4" sx={{ color: statusColors['Approved'] }} fontWeight="bold">
            {stats.approved}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Approved
          </Typography>
        </CardContent>
      </Card>
      
      <Card elevation={2}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Typography variant="h4" sx={{ color: statusColors['Rejected'] }} fontWeight="bold">
            {stats.rejected}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Rejected
          </Typography>
        </CardContent>
      </Card>
      
      <Card elevation={2}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Typography variant="h4" sx={{ color: theme.palette.success.main }} fontWeight="bold">
            ${(stats.totalFunding / 1000000).toFixed(1)}M
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Total Approved Funding
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );

  const renderApplicationCard = (application) => (
    <Card key={application.id} elevation={2} sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              {application.proposalTitle}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <Chip
                label={application.status}
                color={application.status === 'Approved' ? 'success' : 
                       application.status === 'Rejected' ? 'error' : 
                       application.status === 'Under Review' ? 'primary' : 'warning'}
                size="small"
                icon={getStatusIcon(application.status)}
              />
              <Chip
                label={application.priority}
                size="small"
                sx={{ 
                  bgcolor: priorityColors[application.priority],  
                  color: 'white' 
                }}
              />
            </Stack>
          </Box>
          <IconButton onClick={(e) => handleMenuOpen(e, application)}>
            <MoreIcon />
          </IconButton>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              {funderTypeIcons[application.funderType]}
              <Typography variant="body2" sx={{ ml: 1 }}>
                <strong>{application.funderName}</strong> ({application.funderType})
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <ContactMailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">
                {application.contactPerson}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <MoneyIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">
                ${application.grantAmount.toLocaleString()}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <EventIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">
                Applied: {format(application.applicationDate, 'MMM dd, yyyy')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <ScheduleIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">
                Last Contact: {format(application.lastContact, 'MMM dd, yyyy')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">
                {application.emailThreads.length} Email Thread(s)
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {application.notes && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {application.notes}
          </Alert>
        )}
      </CardContent>
      <CardActions>
        {application.emailThreads.length > 0 && (
          <Button
            startIcon={<EmailIcon />}
            onClick={() => handleViewEmailThread(application.emailThreads[0])}
            size="small"
          >
            View Email Thread
          </Button>
        )}
        <Button 
          startIcon={<PhoneIcon />} 
          size="small"
          onClick={() => {
            setSelectedApplication(application);
            setCallForm({
              ...callForm,
              title: `Follow-up call - ${application.proposalTitle}`,
              participants: application.contactPerson
            });
            setScheduleCallDialog(true);
          }}
        >
          Schedule Call
        </Button>
        <Button 
          startIcon={<CalendarIcon />} 
          size="small"
          onClick={() => handleViewCalls(application)}
        >
          View Calls ({scheduledCalls.filter(call => call.applicationId === application.id).length})
        </Button>
        <Button 
          startIcon={<EditIcon />} 
          size="small"
          onClick={() => {
            setSelectedApplication(application);
            setStatusUpdate(prev => ({ ...prev, newStatus: application.status }));
            setUpdateStatusDialog(true);
          }}
        >
          Update Status
        </Button>
      </CardActions>
    </Card>
  );


  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default, mt: 8 }}>
      <PageHeader
        title="Grant Liaison & CRM"
        description="Track and manage grant applications, funding opportunities, and stakeholder communications"
        icon={<GrantIcon />}
        breadcrumbs={[
          { label: 'Dashboard', path: '/researcher', icon: <BusinessIcon /> },
          { label: 'Projects', path: '/researcher/projects', icon: <BusinessIcon /> },
          { label: 'Proposals', path: '/researcher/projects/proposals', icon: <GrantIcon /> },
        ]}
        actionButton={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddApplicationDialog(true)}
            sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
          >
            Add Grant Application
          </Button>
        }
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Stats Cards */}
        {renderStatsCards()}

        {/* Filters and Search */}
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            alignItems: 'center',
            flexWrap: 'wrap',
            '& > *': { flex: 1, minWidth: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.333% - 8px)' } }
          }}>
            <TextField
              placeholder="Search grants, funders, or contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            
            <FormControl>
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={statusFilter}
                label="Status Filter"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="All">All Status</MenuItem>
                <MenuItem value="Pending Submission">Pending Submission</MenuItem>
                <MenuItem value="Under Review">Under Review</MenuItem>
                <MenuItem value="Approved">Approved</MenuItem>
                <MenuItem value="Rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl>
              <InputLabel>Priority Filter</InputLabel>
              <Select
                value={priorityFilter}
                label="Priority Filter"
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <MenuItem value="All">All Priorities</MenuItem>
                <MenuItem value="High">High Priority</MenuItem>
                <MenuItem value="Medium">Medium Priority</MenuItem>
                <MenuItem value="Low">Low Priority</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* Tabs */}
        <Paper elevation={1} sx={{ mb: 3 }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab label={`All Applications (${filteredApplications.length})`} />
            <Tab label={`Active Follow-ups (${filteredApplications.filter(app => 
              app.status === 'Under Review' || app.status === 'Pending Submission'
            ).length})`} />
            <Tab label={`Won Grants (${filteredApplications.filter(app => 
              app.status === 'Approved'
            ).length})`} />
            <Tab label={`Call Management (${stats.totalCalls})`} />
            <Tab label="Contact Management" />
          </Tabs>
        </Paper>

        {/* Content based on current tab */}
        {currentTab === 0 && (
          <Box>
            {filteredApplications.length === 0 ? (
              <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
                <GrantIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  No grant applications found
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Start tracking your grant applications and funding opportunities
                </Typography>
              </Paper>
            ) : (
              filteredApplications.map(renderApplicationCard)
            )}
          </Box>
        )}

        {currentTab === 1 && (
          <Box>
            {filteredApplications
              .filter(app => app.status === 'Under Review' || app.status === 'Pending Submission')
              .map(renderApplicationCard)}
          </Box>
        )}

        {currentTab === 2 && (
          <Box>
            {filteredApplications
              .filter(app => app.status === 'Approved')
              .map(renderApplicationCard)}
          </Box>
        )}

        {currentTab === 3 && (
          <Box>
            {/* Call Management Content */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={3}>
                <Card elevation={2}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <PhoneIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h4" color="primary" fontWeight="bold">
                      {stats.totalCalls}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Calls
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card elevation={2}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <PendingCallIcon sx={{ fontSize: 32, color: '#ff9800', mb: 1 }} />
                    <Typography variant="h4" sx={{ color: '#ff9800' }} fontWeight="bold">
                      {stats.scheduledCalls}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Scheduled
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card elevation={2}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <CompleteIcon sx={{ fontSize: 32, color: '#4caf50', mb: 1 }} />
                    <Typography variant="h4" sx={{ color: '#4caf50' }} fontWeight="bold">
                      {stats.completedCalls}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Completed
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card elevation={2}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <TimeIcon sx={{ fontSize: 32, color: '#2196f3', mb: 1 }} />
                    <Typography variant="h4" sx={{ color: '#2196f3' }} fontWeight="bold">
                      {stats.upcomingCalls}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Upcoming
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {scheduledCalls.length === 0 ? (
              <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
                <PhoneIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  No calls scheduled yet
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Schedule calls with grant contacts to track your communications
                </Typography>
              </Paper>
            ) : (
              <Stack spacing={2}>
                {scheduledCalls
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map(call => (
                    <Card key={call.id} elevation={2}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box>
                            <Typography variant="h6" gutterBottom>
                              {call.title}
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                              <Chip
                                label={call.status}
                                color={call.status === 'Completed' ? 'success' : 'warning'}
                                size="small"
                                icon={call.status === 'Completed' ? <CompleteIcon /> : <PendingCallIcon />}
                              />
                              <Chip
                                label={call.type}
                                size="small"
                                variant="outlined"
                              />
                              <Chip
                                label={call.priority}
                                size="small"
                                sx={{ 
                                  bgcolor: priorityColors[call.priority],  
                                  color: 'white' 
                                }}
                              />
                            </Stack>
                          </Box>
                        </Box>

                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <CalendarIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                              <Typography variant="body2">
                                {format(new Date(call.dateTime), 'MMM dd, yyyy \'at\' HH:mm')}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <ContactMailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                              <Typography variant="body2">
                                {call.contactPerson} ({call.funderName})
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <TimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                              <Typography variant="body2">
                                Duration: {call.duration} minutes
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                              <Typography variant="body2">
                                {call.location}
                              </Typography>
                            </Box>
                            {call.agenda && (
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <AgendaIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                <Typography variant="body2" noWrap>
                                  {call.agenda.length > 50 ? call.agenda.substring(0, 50) + '...' : call.agenda}
                                </Typography>
                              </Box>
                            )}
                          </Grid>
                        </Grid>

                        {call.outcome && (
                          <Accordion sx={{ mt: 2 }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Typography variant="subtitle2">Call Outcome & Summary</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="subtitle2" color="primary" gutterBottom>
                                    Status: {call.outcome.status}
                                  </Typography>
                                  <Typography variant="body2" paragraph>
                                    <strong>Summary:</strong><br />
                                    {call.outcome.summary}
                                  </Typography>
                                  {call.outcome.nextSteps && (
                                    <Typography variant="body2" paragraph>
                                      <strong>Next Steps:</strong><br />
                                      {call.outcome.nextSteps}
                                    </Typography>
                                  )}
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Typography variant="body2"><strong>Rating:</strong></Typography>
                                    <Rating value={call.outcome.rating} readOnly size="small" />
                                  </Box>
                                  <Typography variant="caption" color="textSecondary">
                                    Completed: {format(call.outcome.completedAt, 'MMM dd, yyyy \'at\' HH:mm')}
                                  </Typography>
                                </Grid>
                              </Grid>
                            </AccordionDetails>
                          </Accordion>
                        )}
                      </CardContent>
                      <CardActions>
                        {call.status === 'Scheduled' && isAfter(new Date(), new Date(call.dateTime)) && (
                          <Button
                            startIcon={<CompleteIcon />}
                            onClick={() => {
                              setSelectedCall(call);
                              setCallOutcomeDialog(true);
                            }}
                            size="small"
                            color="success"
                          >
                            Record Outcome
                          </Button>
                        )}
                        <Button startIcon={<PhoneIcon />} size="small">
                          Call Now
                        </Button>
                        <Button startIcon={<EditIcon />} size="small">
                          Edit
                        </Button>
                      </CardActions>
                    </Card>
                  ))}
              </Stack>
            )}
          </Box>
        )}

        {currentTab === 4 && (
          <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
            <ContactMailIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Contact Management
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Comprehensive contact management coming soon
            </Typography>
          </Paper>
        )}
      </Container>

      {/* Add Application Dialog */}
      <Dialog
        open={addApplicationDialog}
        onClose={() => {
          setAddApplicationDialog(false);
          setSelectedApplication(null);
          setNewApplication({
            proposalTitle: '',
            funderName: '',
            funderType: 'Federal',
            contactPerson: '',
            contactEmail: '',
            contactPhone: '',
            grantAmount: '',
            status: 'Pending Submission',
            priority: 'Medium',
            notes: ''
          });
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#8b6cbc', 
          color: 'white',
          borderRadius: '8px 8px 0 0',
          display: 'flex', 
          alignItems: 'center',
          gap: 2,
          py: 3
        }}>
          <GrantIcon sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {selectedApplication ? 'Edit Grant Application' : 'Add New Grant Application'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              {selectedApplication ? 'Update application details and tracking information' : 'Add a new grant application to track funding opportunities'}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 4 }}>
          <Stack spacing={4}>
            {/* Project Information Section */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <ProjectIcon color="primary" />
                <Typography variant="h6" fontWeight="bold" color="primary">
                  Project Information
                </Typography>
              </Box>
              
              <TextField
                fullWidth
                label="Proposal Title"
                value={newApplication.proposalTitle}
                onChange={(e) => setNewApplication({ ...newApplication, proposalTitle: e.target.value })}
                placeholder="Enter the full title of your research proposal"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ArticleIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                flexWrap: 'wrap',
                '& > *': { flex: 1, minWidth: { xs: '100%', sm: 'calc(50% - 8px)' } }
              }}>
                <TextField
                  label="Grant Amount (USD)"
                  type="number"
                  value={newApplication.grantAmount}
                  onChange={(e) => setNewApplication({ ...newApplication, grantAmount: e.target.value })}
                  placeholder="500000"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MoneyIcon color="action" />
                        $
                      </InputAdornment>
                    ),
                  }}
                />
                
                <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
                  <FormControl sx={{ flex: 1 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={newApplication.status}
                      label="Status"
                      onChange={(e) => setNewApplication({ ...newApplication, status: e.target.value })}
                    >
                      <MenuItem value="Pending Submission">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ScheduleIcon fontSize="small" />
                          Pending Submission
                        </Box>
                      </MenuItem>
                      <MenuItem value="Under Review">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PendingIcon fontSize="small" />
                          Under Review
                        </Box>
                      </MenuItem>
                      <MenuItem value="Approved">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircleIcon fontSize="small" />
                          Approved
                        </Box>
                      </MenuItem>
                      <MenuItem value="Rejected">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CancelIcon fontSize="small" />
                          Rejected
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl sx={{ flex: 1 }}>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={newApplication.priority}
                      label="Priority"
                      onChange={(e) => setNewApplication({ ...newApplication, priority: e.target.value })}
                    >
                      <MenuItem value="High">
                        <Chip label="High" size="small" sx={{ bgcolor: priorityColors.High, color: 'white' }} />
                      </MenuItem>
                      <MenuItem value="Medium">
                        <Chip label="Medium" size="small" sx={{ bgcolor: priorityColors.Medium, color: 'white' }} />
                      </MenuItem>
                      <MenuItem value="Low">
                        <Chip label="Low" size="small" sx={{ bgcolor: priorityColors.Low, color: 'white' }} />
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </Box>

            <Divider />

            {/* Funder Information Section */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <BusinessIcon color="primary" />
                <Typography variant="h6" fontWeight="bold" color="primary">
                  Funder Information
                </Typography>
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                flexWrap: 'wrap',
                mb: 3,
                '& > *': { flex: 1, minWidth: { xs: '100%', sm: 'calc(50% - 8px)' } }
              }}>
                <TextField
                  label="Funder Name"
                  value={newApplication.funderName}
                  onChange={(e) => setNewApplication({ ...newApplication, funderName: e.target.value })}
                  placeholder="National Science Foundation"
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BankIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
                
                <FormControl>
                  <InputLabel>Funder Type</InputLabel>
                  <Select
                    value={newApplication.funderType}
                    label="Funder Type"
                    onChange={(e) => setNewApplication({ ...newApplication, funderType: e.target.value })}
                  >
                    <MenuItem value="Federal">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BankIcon fontSize="small" />
                        Federal Agency
                      </Box>
                    </MenuItem>
                    <MenuItem value="Private">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessIcon fontSize="small" />
                        Private Foundation
                      </Box>
                    </MenuItem>
                    <MenuItem value="International">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CampaignIcon fontSize="small" />
                        International Organization
                      </Box>
                    </MenuItem>
                    <MenuItem value="Corporate">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessIcon fontSize="small" />
                        Corporate Sponsor
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            <Divider />

            {/* Contact Information Section */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <ContactMailIcon color="primary" />
                <Typography variant="h6" fontWeight="bold" color="primary">
                  Contact Information
                </Typography>
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                flexWrap: 'wrap',
                '& > *': { flex: 1, minWidth: { xs: '100%', sm: 'calc(33.333% - 8px)' } }
              }}>
                <TextField
                  label="Contact Person"
                  value={newApplication.contactPerson}
                  onChange={(e) => setNewApplication({ ...newApplication, contactPerson: e.target.value })}
                  placeholder="Dr. Sarah Johnson"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AuthorIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
                
                <TextField
                  label="Contact Email"
                  type="email"
                  value={newApplication.contactEmail}
                  onChange={(e) => setNewApplication({ ...newApplication, contactEmail: e.target.value })}
                  placeholder="sarah.johnson@nsf.gov"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
                
                <TextField
                  label="Contact Phone"
                  value={newApplication.contactPhone}
                  onChange={(e) => setNewApplication({ ...newApplication, contactPhone: e.target.value })}
                  placeholder="+1-555-123-4567"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Box>

            <Divider />

            {/* Additional Notes Section */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <EditIcon color="primary" />
                <Typography variant="h6" fontWeight="bold" color="primary">
                  Additional Notes
                </Typography>
              </Box>
              
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Notes & Comments"
                value={newApplication.notes}
                onChange={(e) => setNewApplication({ ...newApplication, notes: e.target.value })}
                placeholder="Add any relevant notes, deadlines, special requirements, or follow-up reminders..."
                InputProps={{
                  sx: { alignItems: 'flex-start' }
                }}
              />
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ 
          p: 3, 
          bgcolor: 'grey.50', 
          borderTop: '1px solid', 
          borderColor: 'divider',
          gap: 2
        }}>
          <Button 
            onClick={() => setAddApplicationDialog(false)}
            size="large"
            sx={{ minWidth: 100 }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleAddApplication}
            size="large"
            startIcon={selectedApplication ? <EditIcon /> : <AddIcon />}
            sx={{ 
              minWidth: 140,
              bgcolor: '#8b6cbc',
              '&:hover': { bgcolor: '#7b5cac' },
              boxShadow: '0 3px 5px 2px rgba(139, 108, 188, .3)',
            }}
          >
            {selectedApplication ? 'Update Application' : 'Add Application'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog
        open={updateStatusDialog}
        onClose={() => setUpdateStatusDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          elevation: 8,
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: '#8b6cbc',
            color: 'white',
            borderRadius: '8px 8px 0 0',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            pb: 2
          }}
        >
          <TimelineIcon sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Update Application Status
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              {selectedApplication?.proposalTitle}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Current Status Display */}
            <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <FlagIcon color="primary" />
                <Box>
                  <Typography variant="body2" color="text.secondary">Current Status</Typography>
                  <Chip 
                    label={selectedApplication?.status} 
                    size="small" 
                    sx={{ 
                      bgcolor: statusColors[selectedApplication?.status],
                      color: 'white',
                      fontWeight: 500
                    }} 
                  />
                </Box>
              </Stack>
            </Paper>

            {/* New Status Selection */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PlayArrowIcon fontSize="small" />
                New Status *
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={statusUpdate.newStatus}
                  onChange={(e) => setStatusUpdate(prev => ({ ...prev, newStatus: e.target.value }))}
                  displayEmpty
                  sx={{ '& .MuiSelect-select': { display: 'flex', alignItems: 'center', gap: 1 } }}
                >
                  <MenuItem value="" disabled>
                    <em>Select new status</em>
                  </MenuItem>
                  {selectedApplication && statusWorkflow[selectedApplication.status] && 
                    statusWorkflow[selectedApplication.status].next.map(status => (
                      <MenuItem key={status} value={status} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          size="small" 
                          label={status} 
                          sx={{ 
                            bgcolor: statusColors[status], 
                            color: 'white',
                            minWidth: 120
                          }} 
                        />
                      </MenuItem>
                    ))
                  }
                  <Divider />
                  <MenuItem value="Cancelled" sx={{ color: 'error.main' }}>
                    <StopIcon fontSize="small" sx={{ mr: 1 }} />
                    Cancelled
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Status Change Reason */}
            <TextField
              fullWidth
              label="Reason for Status Change *"
              value={statusUpdate.reason}
              onChange={(e) => setStatusUpdate(prev => ({ ...prev, reason: e.target.value }))}
              multiline
              rows={2}
              placeholder="Explain why the status is being changed..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <NotesIcon color="action" />
                  </InputAdornment>
                )
              }}
            />

            {/* Milestone Selection */}
            {statusUpdate.newStatus && statusWorkflow[selectedApplication?.status] && (
              <FormControl fullWidth>
                <InputLabel>Milestone Achieved</InputLabel>
                <Select
                  value={statusUpdate.milestone}
                  label="Milestone Achieved"
                  onChange={(e) => setStatusUpdate(prev => ({ ...prev, milestone: e.target.value }))}
                >
                  <MenuItem value="">
                    <em>No specific milestone</em>
                  </MenuItem>
                  {statusWorkflow[selectedApplication.status].milestones.map(milestone => (
                    <MenuItem key={milestone} value={milestone}>
                      <CheckOutlineIcon sx={{ mr: 1 }} fontSize="small" />
                      {milestone}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Expected Date */}
            <TextField
              fullWidth
              type="datetime-local"
              label="Expected Date/Deadline"
              value={statusUpdate.expectedDate}
              onChange={(e) => setStatusUpdate(prev => ({ ...prev, expectedDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarTodayIcon color="action" />
                  </InputAdornment>
                )
              }}
            />

            {/* Next Steps */}
            <TextField
              fullWidth
              label="Next Steps"
              value={statusUpdate.nextSteps}
              onChange={(e) => setStatusUpdate(prev => ({ ...prev, nextSteps: e.target.value }))}
              multiline
              rows={3}
              placeholder="What are the next actions to be taken?"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <DirectionsRunIcon color="action" />
                  </InputAdornment>
                )
              }}
            />

            {/* Suggested Actions */}
            {statusUpdate.newStatus && statusWorkflow[statusUpdate.newStatus] && (
              <Paper elevation={1} sx={{ p: 2, bgcolor: 'info.50' }}>
                <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LightbulbIcon fontSize="small" color="info" />
                  Suggested Actions for "{statusUpdate.newStatus}"
                </Typography>
                <List dense>
                  {statusWorkflow[statusUpdate.newStatus].suggestedActions.map((action, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemText primary={`• ${action}`} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}

            {/* Status History */}
            {selectedApplication?.statusHistory && selectedApplication.statusHistory.length > 0 && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimelineIcon fontSize="small" />
                    Status History ({selectedApplication.statusHistory.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    {selectedApplication.statusHistory.slice(-3).reverse().map((historyEntry, index) => (
                      <Paper key={historyEntry.id} elevation={1} sx={{ p: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                          <Chip 
                            size="small" 
                            label={historyEntry.newStatus} 
                            sx={{ 
                              bgcolor: statusColors[historyEntry.newStatus],
                              color: 'white',
                              fontWeight: 500
                            }} 
                          />
                          <Typography variant="body2" color="text.secondary">
                            {format(new Date(historyEntry.changedAt), 'MMM dd, yyyy \'at\' HH:mm')}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            by {historyEntry.changedBy}
                          </Typography>
                        </Stack>
                        <Typography variant="body2">
                          {historyEntry.reason}
                        </Typography>
                        {historyEntry.milestone && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Milestone: {historyEntry.milestone}
                          </Typography>
                        )}
                      </Paper>
                    ))}
                    {selectedApplication.statusHistory.length > 3 && (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                        Showing last 3 changes. Total: {selectedApplication.statusHistory.length}
                      </Typography>
                    )}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Follow-up Options */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">Follow-up Options</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    type="datetime-local"
                    label="Schedule Follow-up Call"
                    value={statusUpdate.followUpDate}
                    onChange={(e) => setStatusUpdate(prev => ({ ...prev, followUpDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    helperText="Automatically schedule a follow-up call"
                  />
                  
                  <FormControl fullWidth>
                    <InputLabel>Visibility</InputLabel>
                    <Select
                      value={statusUpdate.visibility}
                      label="Visibility"
                      onChange={(e) => setStatusUpdate(prev => ({ ...prev, visibility: e.target.value }))}
                    >
                      <MenuItem value="Internal">
                        <VisibilityOffIcon sx={{ mr: 1 }} fontSize="small" />
                        Internal Only
                      </MenuItem>
                      <MenuItem value="Shared">
                        <VisibilityIcon sx={{ mr: 1 }} fontSize="small" />
                        Share with Team
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={() => setUpdateStatusDialog(false)}
            sx={{ minWidth: 100 }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleUpdateStatus}
            disabled={!statusUpdate.newStatus || !statusUpdate.reason}
            sx={{ 
              minWidth: 120,
              bgcolor: '#8b6cbc',
              '&:hover': { bgcolor: '#7b5cac' }
            }}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Call Dialog */}
      <Dialog
        open={scheduleCallDialog}
        onClose={() => setScheduleCallDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#8b6cbc', 
          color: 'white',
          borderRadius: '8px 8px 0 0',
          display: 'flex', 
          alignItems: 'center',
          gap: 2,
          py: 3
        }}>
          <PhoneIcon sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Schedule Call
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              {selectedApplication ? `With ${selectedApplication.contactPerson} - ${selectedApplication.funderName}` : 'Plan your follow-up communication'}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 4 }}>
          <Stack spacing={4}>
            {/* Call Details Section */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <CalendarIcon color="primary" />
                <Typography variant="h6" fontWeight="bold" color="primary">
                  Call Details
                </Typography>
              </Box>
              
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Call Title"
                  value={callForm.title}
                  onChange={(e) => setCallForm({ ...callForm, title: e.target.value })}
                  placeholder="Follow-up call regarding grant application"
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <Box sx={{ 
                  display: 'flex', 
                  gap: 2, 
                  flexWrap: 'wrap',
                  '& > *': { flex: 1, minWidth: { xs: '100%', sm: 'calc(50% - 8px)' } }
                }}>
                  <TextField
                    label="Date & Time"
                    type="datetime-local"
                    value={callForm.dateTime}
                    onChange={(e) => setCallForm({ ...callForm, dateTime: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  
                  <FormControl>
                    <InputLabel>Duration</InputLabel>
                    <Select
                      value={callForm.duration}
                      label="Duration"
                      onChange={(e) => setCallForm({ ...callForm, duration: e.target.value })}
                    >
                      <MenuItem value="15">15 minutes</MenuItem>
                      <MenuItem value="30">30 minutes</MenuItem>
                      <MenuItem value="45">45 minutes</MenuItem>
                      <MenuItem value="60">1 hour</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ 
                  display: 'flex', 
                  gap: 2, 
                  flexWrap: 'wrap',
                  '& > *': { flex: 1, minWidth: { xs: '100%', sm: 'calc(33.333% - 8px)' } }
                }}>
                  <FormControl>
                    <InputLabel>Call Type</InputLabel>
                    <Select
                      value={callForm.type}
                      label="Call Type"
                      onChange={(e) => setCallForm({ ...callForm, type: e.target.value })}
                    >
                      <MenuItem value="Follow-up">Follow-up</MenuItem>
                      <MenuItem value="Status Update">Status Update</MenuItem>
                      <MenuItem value="Clarification">Clarification</MenuItem>
                      <MenuItem value="Negotiation">Negotiation</MenuItem>
                      <MenuItem value="Final Review">Final Review</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={callForm.priority}
                      label="Priority"
                      onChange={(e) => setCallForm({ ...callForm, priority: e.target.value })}
                    >
                      <MenuItem value="High">
                        <Chip label="High" size="small" sx={{ bgcolor: priorityColors.High, color: 'white' }} />
                      </MenuItem>
                      <MenuItem value="Medium">
                        <Chip label="Medium" size="small" sx={{ bgcolor: priorityColors.Medium, color: 'white' }} />
                      </MenuItem>
                      <MenuItem value="Low">
                        <Chip label="Low" size="small" sx={{ bgcolor: priorityColors.Low, color: 'white' }} />
                      </MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <InputLabel>Reminder</InputLabel>
                    <Select
                      value={callForm.reminderBefore}
                      label="Reminder"
                      onChange={(e) => setCallForm({ ...callForm, reminderBefore: e.target.value })}
                    >
                      <MenuItem value="5">5 minutes before</MenuItem>
                      <MenuItem value="15">15 minutes before</MenuItem>
                      <MenuItem value="30">30 minutes before</MenuItem>
                      <MenuItem value="60">1 hour before</MenuItem>
                      <MenuItem value="1440">1 day before</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Stack>
            </Box>

            <Divider />

            {/* Contact & Location Section */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <GroupIcon color="primary" />
                <Typography variant="h6" fontWeight="bold" color="primary">
                  Participants & Location
                </Typography>
              </Box>
              
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Participants"
                  value={callForm.participants}
                  onChange={(e) => setCallForm({ ...callForm, participants: e.target.value })}
                  placeholder="Dr. Sarah Johnson, Michael Chen"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <GroupIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="Location/Method"
                  value={callForm.location}
                  onChange={(e) => setCallForm({ ...callForm, location: e.target.value })}
                  placeholder="Phone Call, Zoom, Teams, etc."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Stack>
            </Box>

            <Divider />

            {/* Agenda & Notes Section */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <NotesIcon color="primary" />
                <Typography variant="h6" fontWeight="bold" color="primary">
                  Agenda & Notes
                </Typography>
              </Box>
              
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Call Agenda"
                  value={callForm.agenda}
                  onChange={(e) => setCallForm({ ...callForm, agenda: e.target.value })}
                  placeholder="• Discuss application status&#10;• Clarify budget requirements&#10;• Next steps and timeline"
                />

                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Additional Notes"
                  value={callForm.notes}
                  onChange={(e) => setCallForm({ ...callForm, notes: e.target.value })}
                  placeholder="Any additional context or preparation notes..."
                />
              </Stack>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ 
          p: 3, 
          bgcolor: 'grey.50', 
          borderTop: '1px solid', 
          borderColor: 'divider',
          gap: 2
        }}>
          <Button 
            onClick={() => setScheduleCallDialog(false)}
            size="large"
            sx={{ minWidth: 100 }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleScheduleCall}
            size="large"
            startIcon={<CalendarIcon />}
            sx={{ 
              minWidth: 140,
              bgcolor: '#8b6cbc',
              '&:hover': { bgcolor: '#7b5cac' },
              boxShadow: '0 3px 5px 2px rgba(139, 108, 188, .3)',
            }}
          >
            Schedule Call
          </Button>
        </DialogActions>
      </Dialog>

      {/* Email Compose Dialog */}
      <Dialog
        open={emailComposeDialog}
        onClose={() => setEmailComposeDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Compose Email</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="To"
              value={selectedApplication?.contactEmail || ''}
              disabled
            />
            <TextField
              fullWidth
              label="Subject"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
            />
            <TextField
              fullWidth
              multiline
              rows={8}
              label="Email Body"
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              placeholder="Type your email message here..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailComposeDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSendEmail} startIcon={<EmailIcon />}>
            Send Email
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog
        open={viewDetailsDialog}
        onClose={() => setViewDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Application Details</Typography>
            <Chip
              label={selectedApplication?.status}
              color={selectedApplication?.status === 'Approved' ? 'success' : 
                     selectedApplication?.status === 'Rejected' ? 'error' : 
                     selectedApplication?.status === 'Under Review' ? 'primary' : 'warning'}
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <Stack spacing={2}>
              <Typography variant="h6">{selectedApplication.proposalTitle}</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Funder</Typography>
                  <Typography>{selectedApplication.funderName} ({selectedApplication.funderType})</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Grant Amount</Typography>
                  <Typography>${selectedApplication.grantAmount?.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Contact Person</Typography>
                  <Typography>{selectedApplication.contactPerson}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Priority</Typography>
                  <Chip 
                    label={selectedApplication.priority} 
                    size="small"
                    sx={{ bgcolor: priorityColors[selectedApplication.priority], color: 'white' }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Application Date</Typography>
                  <Typography>{format(selectedApplication.applicationDate, 'MMMM dd, yyyy')}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Last Contact</Typography>
                  <Typography>{format(selectedApplication.lastContact, 'MMMM dd, yyyy')}</Typography>
                </Grid>
                {selectedApplication.notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Notes</Typography>
                    <Typography>{selectedApplication.notes}</Typography>
                  </Grid>
                )}
              </Grid>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDetailsDialog(false)}>Close</Button>
          <Button 
            variant="contained" 
            startIcon={<EditIcon />}
            onClick={() => {
              setViewDetailsDialog(false);
              handleMenuAction('edit');
            }}
          >
            Edit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Call Outcome Dialog */}
      <Dialog
        open={callOutcomeDialog}
        onClose={() => setCallOutcomeDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: 'success.main', 
          color: 'white', 
          display: 'flex', 
          alignItems: 'center',
          gap: 2,
          py: 3
        }}>
          <CompleteIcon sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Record Call Outcome
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              {selectedCall ? `Call: ${selectedCall.title}` : 'Document the results of your call'}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 4 }}>
          <Stack spacing={4}>
            {/* Call Summary */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <NotesIcon color="primary" />
                <Typography variant="h6" fontWeight="bold" color="primary">
                  Call Summary
                </Typography>
              </Box>
              
              <Stack spacing={3}>
                <FormControl fullWidth>
                  <InputLabel>Call Status</InputLabel>
                  <Select
                    value={callOutcome.status}
                    label="Call Status"
                    onChange={(e) => setCallOutcome({ ...callOutcome, status: e.target.value })}
                  >
                    <MenuItem value="Successful">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SuccessIcon fontSize="small" />
                        Successful
                      </Box>
                    </MenuItem>
                    <MenuItem value="Partially Successful">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ThumbUpIcon fontSize="small" />
                        Partially Successful
                      </Box>
                    </MenuItem>
                    <MenuItem value="No Answer">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon fontSize="small" />
                        No Answer
                      </Box>
                    </MenuItem>
                    <MenuItem value="Postponed">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ScheduleIcon fontSize="small" />
                        Postponed
                      </Box>
                    </MenuItem>
                    <MenuItem value="Unsuccessful">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ThumbDownIcon fontSize="small" />
                        Unsuccessful
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Call Summary"
                  value={callOutcome.summary}
                  onChange={(e) => setCallOutcome({ ...callOutcome, summary: e.target.value })}
                  placeholder="Summarize the key points discussed, decisions made, and outcomes..."
                  required
                />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body1">Call Rating:</Typography>
                  <Rating
                    value={callOutcome.rating}
                    onChange={(event, newValue) => {
                      setCallOutcome({ ...callOutcome, rating: newValue });
                    }}
                    size="large"
                  />
                  <Typography variant="body2" color="textSecondary">
                    ({callOutcome.rating}/5)
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Divider />

            {/* Next Steps */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <CallbackIcon color="primary" />
                <Typography variant="h6" fontWeight="bold" color="primary">
                  Next Steps & Follow-up
                </Typography>
              </Box>
              
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Next Steps"
                  value={callOutcome.nextSteps}
                  onChange={(e) => setCallOutcome({ ...callOutcome, nextSteps: e.target.value })}
                  placeholder="What actions need to be taken? Who is responsible? What are the deadlines?"
                />

                <Box sx={{ 
                  display: 'flex', 
                  gap: 2, 
                  flexWrap: 'wrap',
                  '& > *': { flex: 1, minWidth: { xs: '100%', sm: 'calc(50% - 8px)' } }
                }}>
                  <TextField
                    label="Follow-up Date"
                    type="datetime-local"
                    value={callOutcome.followUpDate}
                    onChange={(e) => setCallOutcome({ ...callOutcome, followUpDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    helperText="Schedule next call automatically"
                  />

                  <FormControl>
                    <InputLabel>Follow-up Type</InputLabel>
                    <Select
                      value={callOutcome.followUpType}
                      label="Follow-up Type"
                      onChange={(e) => setCallOutcome({ ...callOutcome, followUpType: e.target.value })}
                    >
                      <MenuItem value="">No follow-up needed</MenuItem>
                      <MenuItem value="Status Update">Status Update</MenuItem>
                      <MenuItem value="Document Review">Document Review</MenuItem>
                      <MenuItem value="Final Decision">Final Decision</MenuItem>
                      <MenuItem value="Contract Discussion">Contract Discussion</MenuItem>
                      <MenuItem value="Clarification">Clarification</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ 
          p: 3, 
          bgcolor: 'grey.50', 
          borderTop: '1px solid', 
          borderColor: 'divider',
          gap: 2
        }}>
          <Button 
            onClick={() => setCallOutcomeDialog(false)}
            size="large"
            sx={{ minWidth: 100 }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCallOutcome}
            size="large"
            startIcon={<CompleteIcon />}
            sx={{ 
              minWidth: 140,
              bgcolor: '#8b6cbc',
              '&:hover': { bgcolor: '#7b5cac' },
              boxShadow: '0 3px 5px 2px rgba(139, 108, 188, .3)',
            }}
          >
            Record Outcome
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Calls Dialog */}
      <Dialog
        open={viewCallsDialog}
        onClose={() => setViewCallsDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#8b6cbc', 
          color: 'white',
          borderRadius: '8px 8px 0 0',
          display: 'flex', 
          alignItems: 'center',
          gap: 2,
          py: 3
        }}>
          <CalendarIcon sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Call History
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              {selectedApplication ? `${selectedApplication.proposalTitle} - ${selectedApplication.funderName}` : 'Application call history'}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {selectedApplication && (
            <Box>
              {scheduledCalls.filter(call => call.applicationId === selectedApplication.id).length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <PhoneIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    No calls scheduled yet
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Schedule your first call to start tracking communications
                  </Typography>
                </Box>
              ) : (
                <List>
                  {scheduledCalls
                    .filter(call => call.applicationId === selectedApplication.id)
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .map((call, index) => (
                      <Box key={call.id}>
                        <ListItem sx={{ px: 4, py: 3 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ 
                              bgcolor: call.status === 'Completed' ? 'success.main' : 'warning.main' 
                            }}>
                              {call.status === 'Completed' ? <CompleteIcon /> : <PendingCallIcon />}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle1" fontWeight="bold">
                                  {call.title}
                                </Typography>
                                <Chip
                                  label={call.status}
                                  size="small"
                                  color={call.status === 'Completed' ? 'success' : 'warning'}
                                />
                              </Box>
                            }
                            secondary={
                              <Stack spacing={1} sx={{ mt: 1 }}>
                                <Typography variant="body2" color="textSecondary">
                                  📅 {format(new Date(call.dateTime), 'MMM dd, yyyy \'at\' HH:mm')} • ⏱️ {call.duration} min • 📍 {call.location}
                                </Typography>
                                {call.agenda && (
                                  <Typography variant="body2" color="textSecondary">
                                    📋 {call.agenda}
                                  </Typography>
                                )}
                                {call.outcome && (
                                  <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
                                    ✅ Outcome: {call.outcome.status} • Rating: {call.outcome.rating}/5
                                  </Typography>
                                )}
                              </Stack>
                            }
                          />
                          <ListItemSecondaryAction>
                            {call.status === 'Scheduled' && isAfter(new Date(), new Date(call.dateTime)) && (
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<CompleteIcon />}
                                onClick={() => {
                                  setSelectedCall(call);
                                  setCallOutcomeDialog(true);
                                  setViewCallsDialog(false);
                                }}
                              >
                                Record Outcome
                              </Button>
                            )}
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < scheduledCalls.filter(call => call.applicationId === selectedApplication.id).length - 1 && (
                          <Divider />
                        )}
                      </Box>
                    ))}
                </List>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ 
          p: 3, 
          bgcolor: 'grey.50', 
          borderTop: '1px solid', 
          borderColor: 'divider',
          gap: 2
        }}>
          <Button 
            onClick={() => setViewCallsDialog(false)}
            size="large"
          >
            Close
          </Button>
          <Button 
            variant="contained" 
            startIcon={<PhoneIcon />}
            onClick={() => {
              setCallForm({
                ...callForm,
                title: `Follow-up call - ${selectedApplication.proposalTitle}`,
                participants: selectedApplication.contactPerson
              });
              setViewCallsDialog(false);
              setScheduleCallDialog(true);
            }}
            size="large"
          >
            Schedule New Call
          </Button>
        </DialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleMenuAction('edit')}>
          <EditIcon sx={{ mr: 1 }} /> Edit Application
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('viewDetails')}>
          <ViewIcon sx={{ mr: 1 }} /> View Details
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('sendEmail')}>
          <EmailIcon sx={{ mr: 1 }} /> Send Email
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('scheduleCall')}>
          <ScheduleIcon sx={{ mr: 1 }} /> Schedule Follow-up
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('updateStatus')}>
          <PendingIcon sx={{ mr: 1 }} /> Update Status
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleMenuAction('delete')} sx={{ color: 'error.main' }}>
          <CancelIcon sx={{ mr: 1 }} /> Delete Application
        </MenuItem>
      </Menu>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setAddApplicationDialog(true)}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}