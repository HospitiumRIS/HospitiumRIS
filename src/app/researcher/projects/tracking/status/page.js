'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  Chip,
  LinearProgress,
  Avatar,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Collapse,
  CircularProgress,
  Divider,
  Autocomplete,
  Slider,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Dashboard as DashboardIcon,
  TrackChanges as TrackIcon,
  Timeline as TimelineIcon,
  Group as TeamIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Description as ReportIcon,
  Business as BusinessIcon,
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon,
  PlayArrow as PlayIcon,
  RadioButtonUnchecked as PendingIcon,
  Cancel as BlockedIcon,
  Flag as MilestoneIcon,
  Task as TaskIcon,
  Clear as ClearIcon,
  CloudUpload as CloudUploadIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteOutlineIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

import PageHeader from '../../../../../components/common/PageHeader';
import TipTapEditor from '../../../../../components/common/TipTapEditor';
import { useAuth } from '../../../../../components/AuthProvider';
import { useTranslation } from 'react-i18next';

const DELIVERABLE_TYPES = [
  'Document',
  'Report',
  'Software',
  'Publication',
  'Database',
  'Product',
  'Policy Document',
  'Documentation',
  'Other',
];

const dialogScrollLockProps = { disableScrollLock: true };

const normalizeItemStatus = (status) => {
  if (!status) return 'Pending';
  const normalized = String(status).trim().toLowerCase().replace(/_/g, ' ');
  const statusMap = {
    completed: 'Completed',
    pending: 'Pending',
    'in progress': 'In Progress',
    delivered: 'Delivered',
    blocked: 'Blocked',
  };
  return statusMap[normalized] || status;
};

const isCompletedStatus = (status) => normalizeItemStatus(status) === 'Completed';
const isPendingStatus = (status) => {
  const normalized = normalizeItemStatus(status);
  return normalized === 'Pending' || normalized === 'In Progress';
};

const formatDisplayDate = (dateValue) => {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return format(date, 'MMM d, yyyy');
};

const mapMilestoneFromRaw = (milestone, index) => ({
  id: index + 1,
  milestoneIndex: index,
  title: milestone.title || milestone.name || `Milestone ${index + 1}`,
  status: normalizeItemStatus(milestone.status),
  dueDate: milestone.dueDate || milestone.targetDate || '',
  completedDate: milestone.completedDate || '',
  description: milestone.description || '',
  progress: milestone.progress || 0,
  notes: milestone.notes || '',
  completionCriteria: milestone.completionCriteria || '',
  blockers: milestone.blockers || '',
  linkedDeliverableIds: milestone.linkedDeliverableIds || [],
  documents: Array.isArray(milestone.documents) ? milestone.documents : [],
});

const mapDeliverableFromRaw = (deliverable, index) => ({
  id: index + 1,
  deliverableIndex: index,
  title: deliverable.title || deliverable.name || `Deliverable ${index + 1}`,
  description: deliverable.description || '',
  status: normalizeItemStatus(deliverable.status),
  dueDate: deliverable.dueDate || deliverable.deadline || '',
  type: deliverable.type || 'Document',
  notes: deliverable.notes || '',
  completionCriteria: deliverable.completionCriteria || '',
  linkedMilestoneIds: deliverable.linkedMilestoneIds || [],
  documents: Array.isArray(deliverable.documents) ? deliverable.documents : [],
});

// Function to transform proposal data to project format
const transformProposalToProject = (proposal) => {
  // Calculate progress based on milestone completion
  const milestones = proposal.milestones || [];
  const completedMilestones = milestones.filter(m => isCompletedStatus(m.status)).length;
  const progress = milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : 0;

  // Calculate days until deadline
  const endDateString = proposal.endDate || proposal.grantEndDate;
  const endDate = endDateString ? new Date(endDateString) : null;
  const today = new Date();
  const daysUntilDeadline = endDate && !isNaN(endDate.getTime()) 
    ? Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)) 
    : null;

  // Determine project status based on proposal status
  const statusMap = {
    'DRAFT': 'Planning',
    'SUBMITTED': 'Review',
    'UNDER_REVIEW': 'Review', 
    'APPROVED': 'Active',
    'REJECTED': 'On Hold',
    'REVISION_REQUESTED': 'Planning'
  };

  // Get next milestone
  const pendingMilestones = milestones.filter(m => isPendingStatus(m.status));
  const nextMilestone = pendingMilestones.length > 0
    ? (pendingMilestones[0]?.title || pendingMilestones[0]?.name || 'Untitled milestone')
    : (milestones.length > 0 ? 'All milestones completed' : 'No milestones defined');

  return {
    id: proposal.id,
    title: proposal.title,
    status: statusMap[proposal.status] || 'Planning',
    progress: progress,
    priority: 'High', // Default priority - could be enhanced based on proposal data
    startDate: proposal.startDate || proposal.grantStartDate,
    endDate: proposal.endDate || proposal.grantEndDate,
    team: (proposal.coInvestigators?.length || 0) + 1, // PI + co-investigators
    completedTasks: completedMilestones,
    totalTasks: milestones.length,
    budget: proposal.totalBudgetAmount ? parseFloat(proposal.totalBudgetAmount) : 0,
    budgetUsed: proposal.totalBudgetAmount ? parseFloat(proposal.totalBudgetAmount) * 0.6 : 0, // Estimated 60% usage
    lastUpdate: proposal.updatedAt,
    lead: { 
      name: proposal.principalInvestigator || 'Unknown PI', 
      avatar: null 
    },
    nextMilestone: nextMilestone,
    daysUntilDeadline: daysUntilDeadline || 0,
    milestones: milestones.map(mapMilestoneFromRaw),
    deliverables: (proposal.deliverables || []).map(mapDeliverableFromRaw)
  };
};

const ProjectStatusPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(false);
  const [viewDetailsDialog, setViewDetailsDialog] = useState(false);
  const [detailsTab, setDetailsTab] = useState(0);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [expandedRows, setExpandedRows] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Milestone management states
  const [milestoneDialog, setMilestoneDialog] = useState(false);
  const [newMilestoneDialog, setNewMilestoneDialog] = useState(false);
  const [milestoneEditContext, setMilestoneEditContext] = useState(null);
  const [savingMilestone, setSavingMilestone] = useState(false);
  const [milestoneEditForm, setMilestoneEditForm] = useState({
    title: '',
    status: 'Pending',
    dueDate: '',
    completedDate: '',
    description: '',
    progress: 0,
    notes: '',
    completionCriteria: '',
    blockers: '',
    linkedDeliverableIds: [],
    documents: [],
    pendingFiles: [],
    removedDocumentIds: [],
  });
  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    status: 'Pending',
    dueDate: '',
    description: '',
    progress: 0
  });

  const [deliverableDialog, setDeliverableDialog] = useState(false);
  const [deliverableDialogMode, setDeliverableDialogMode] = useState('edit');
  const [deliverableEditContext, setDeliverableEditContext] = useState(null);
  const [savingDeliverable, setSavingDeliverable] = useState(false);
  const [deliverableEditForm, setDeliverableEditForm] = useState({
    title: '',
    type: 'Document',
    status: 'Pending',
    dueDate: '',
    description: '',
    notes: '',
    completionCriteria: '',
    linkedMilestoneIds: [],
    documents: [],
    pendingFiles: [],
    removedDocumentIds: [],
  });
  
  // Status update states
  const [statusUpdate, setStatusUpdate] = useState({
    newStatus: '',
    reason: '',
    notes: '',
    effectiveDate: '',
  });
  const [savingStatus, setSavingStatus] = useState(false);

  // Fetch proposals from database
  useEffect(() => {
    setMounted(true);
    const fetchProposals = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/proposals');
        const data = await response.json();
        
        if (data.success && data.proposals) {
          // Transform proposals to project format
          const transformedProjects = data.proposals
            .map(transformProposalToProject)
            .filter(project => project.status !== 'Review');
          setProjects(transformedProjects);
        } else {
          console.error('Failed to fetch proposals:', data.error);
          setProjects([]); // Set empty array as fallback
        }
      } catch (error) {
        console.error('Error fetching proposals:', error);
        setProjects([]); // Set empty array as fallback
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
  }, []);

  // Calculate overview statistics
  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'Active').length,
    overdue: projects.filter(p => p.daysUntilDeadline < 0).length,
    upcoming: projects.filter(p => p.daysUntilDeadline <= 7 && p.daysUntilDeadline > 0).length,
    avgProgress: projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length) : 0,
    totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
    budgetUsed: projects.reduce((sum, p) => sum + (p.budgetUsed || 0), 0),
    teamMembers: projects.reduce((sum, p) => sum + (p.team || 0), 0),
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Active': 'success',
      'Planning': 'info',
      'Review': 'warning',
      'Completed': 'default',
      'On Hold': 'error',
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Critical': 'error',
      'High': 'warning',
      'Medium': 'info',
      'Low': 'default',
    };
    return colors[priority] || 'default';
  };


  const renderOverviewCards = () => (
    <Grid container spacing={2.5} sx={{ mb: 4 }}>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
              Total Projects
            </Typography>
            <DashboardIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
            {stats.totalProjects}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
            All tracked projects
          </Typography>
        </Paper>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
              Active Projects
            </Typography>
            <TrackIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
            {stats.activeProjects}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
            Currently in progress
          </Typography>
        </Paper>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
              Due This Week
            </Typography>
            <ScheduleIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
            {stats.upcoming}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
            Upcoming deadlines
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );

  // Milestone management functions
  const handleToggleRow = (projectId) => {
    setExpandedRows(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  const resetMilestoneEditForm = () => {
    setMilestoneEditForm({
      title: '',
      status: 'Pending',
      dueDate: '',
      completedDate: '',
      description: '',
      progress: 0,
      notes: '',
      completionCriteria: '',
      blockers: '',
      linkedDeliverableIds: [],
      documents: [],
      pendingFiles: [],
      removedDocumentIds: [],
    });
    setMilestoneEditContext(null);
  };

  const closeMilestoneDialog = () => {
    setMilestoneDialog(false);
    resetMilestoneEditForm();
  };

  const handleUpdateMilestone = (milestone, projectId) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const formatDateInput = (value) => {
      if (!value) return '';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    };

    setMilestoneEditContext({
      projectId,
      milestoneIndex: milestone.milestoneIndex ?? project.milestones.findIndex((m) => m.id === milestone.id),
      deliverables: project.deliverables || [],
    });
    setMilestoneEditForm({
      title: milestone.title || '',
      status: normalizeItemStatus(milestone.status),
      dueDate: formatDateInput(milestone.dueDate),
      completedDate: formatDateInput(milestone.completedDate),
      description: milestone.description || '',
      progress: milestone.progress || 0,
      notes: milestone.notes || '',
      completionCriteria: milestone.completionCriteria || '',
      blockers: milestone.blockers || '',
      linkedDeliverableIds: milestone.linkedDeliverableIds || [],
      documents: milestone.documents || [],
      pendingFiles: [],
      removedDocumentIds: [],
    });
    setMilestoneDialog(true);
  };

  const handleAddNewMilestone = (projectId) => {
    setSelectedProject(projects.find(p => p.id === projectId));
    setMilestoneForm({
      title: '',
      status: 'Pending',
      dueDate: '',
      description: '',
      progress: 0
    });
    setNewMilestoneDialog(true);
  };

  const openStatusUpdateDialog = (project) => {
    setSelectedProject(project);
    setStatusUpdate({
      newStatus: '',
      reason: '',
      notes: '',
      effectiveDate: new Date().toISOString().split('T')[0],
    });
    setStatusUpdateDialog(true);
  };

  const closeStatusUpdateDialog = () => {
    setStatusUpdateDialog(false);
    setSelectedProject(null);
    setStatusUpdate({ newStatus: '', reason: '', notes: '', effectiveDate: '' });
  };

  // Status update functions
  const handleUpdateProjectStatus = async () => {
    if (!selectedProject || !statusUpdate.newStatus) return;

    try {
      setSavingStatus(true);

      const response = await fetch(`/api/proposals/${selectedProject.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentStatus: selectedProject.status,
          newStatus: statusUpdate.newStatus,
          reason: statusUpdate.reason,
          notes: statusUpdate.notes,
          effectiveDate: statusUpdate.effectiveDate,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update status');
      }

      setProjects((prev) => prev.map((project) => (
        project.id === selectedProject.id
          ? {
              ...project,
              status: statusUpdate.newStatus,
              lastUpdate: new Date().toISOString(),
            }
          : project
      )));

      closeStatusUpdateDialog();
      alert(`Project status updated to "${statusUpdate.newStatus}" successfully!`);
    } catch (error) {
      console.error('Error updating project status:', error);
      alert(error.message || 'Failed to update project status. Please try again.');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleSaveMilestone = async () => {
    if (!milestoneEditContext || milestoneEditContext.milestoneIndex < 0) return;

    try {
      setSavingMilestone(true);

      const payload = {
        title: milestoneEditForm.title,
        status: milestoneEditForm.status,
        dueDate: milestoneEditForm.dueDate || null,
        completedDate: milestoneEditForm.completedDate || null,
        description: milestoneEditForm.description,
        progress: milestoneEditForm.progress,
        notes: milestoneEditForm.notes,
        completionCriteria: milestoneEditForm.completionCriteria,
        blockers: milestoneEditForm.blockers,
        linkedDeliverableIds: milestoneEditForm.linkedDeliverableIds,
        documents: milestoneEditForm.documents,
        removedDocumentIds: milestoneEditForm.removedDocumentIds,
      };

      const formData = new FormData();
      formData.append('milestoneIndex', String(milestoneEditContext.milestoneIndex));
      formData.append('milestoneData', JSON.stringify(payload));
      milestoneEditForm.pendingFiles.forEach((file) => {
        formData.append('documents', file);
      });

      const response = await fetch(
        `/api/proposals/${milestoneEditContext.projectId}/milestones`,
        { method: 'PATCH', body: formData }
      );

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update milestone');
      }

      const remappedMilestones = (result.milestones || []).map(mapMilestoneFromRaw);
      const completedCount = remappedMilestones.filter((m) => isCompletedStatus(m.status)).length;
      const pendingMilestones = remappedMilestones.filter((m) => isPendingStatus(m.status));

      setProjects((prev) => prev.map((project) => (
        project.id === milestoneEditContext.projectId
          ? {
              ...project,
              milestones: remappedMilestones,
              progress: remappedMilestones.length > 0
                ? Math.round((completedCount / remappedMilestones.length) * 100)
                : 0,
              completedTasks: completedCount,
              nextMilestone: pendingMilestones.length > 0
                ? pendingMilestones[0].title
                : (remappedMilestones.length > 0 ? 'All milestones completed' : 'No milestones defined'),
            }
          : project
      )));

      closeMilestoneDialog();
      alert('Milestone updated successfully!');
    } catch (error) {
      console.error('Error saving milestone:', error);
      alert(error.message || 'Failed to update milestone. Please try again.');
    } finally {
      setSavingMilestone(false);
    }
  };

  const handleAddMilestone = async () => {
    if (!selectedProject || !milestoneForm.title) return;

    try {
      const response = await fetch(`/api/proposals/${selectedProject.id}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestoneData: milestoneForm }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to add milestone');
      }

      const remappedMilestones = (result.milestones || []).map(mapMilestoneFromRaw);
      setProjects((prev) => prev.map((project) => (
        project.id === selectedProject.id
          ? { ...project, milestones: remappedMilestones, totalTasks: remappedMilestones.length }
          : project
      )));

      setNewMilestoneDialog(false);
      setMilestoneForm({
        title: '',
        status: 'Pending',
        dueDate: '',
        description: '',
        progress: 0,
      });
      alert('Milestone added successfully!');
    } catch (error) {
      console.error('Error adding milestone:', error);
      alert(error.message || 'Failed to add milestone');
    }
  };

  const resetDeliverableEditForm = () => {
    setDeliverableEditForm({
      title: '',
      type: 'Document',
      status: 'Pending',
      dueDate: '',
      description: '',
      notes: '',
      completionCriteria: '',
      linkedMilestoneIds: [],
      documents: [],
      pendingFiles: [],
      removedDocumentIds: [],
    });
    setDeliverableEditContext(null);
  };

  const closeDeliverableDialog = () => {
    setDeliverableDialog(false);
    resetDeliverableEditForm();
  };

  const handleUpdateDeliverable = (deliverable, projectId) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const formatDateInput = (value) => {
      if (!value) return '';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    };

    setDeliverableDialogMode('edit');
    setDeliverableEditContext({
      projectId,
      deliverableIndex: deliverable.deliverableIndex ?? project.deliverables.findIndex((d) => d.id === deliverable.id),
      milestones: project.milestones || [],
    });
    setDeliverableEditForm({
      title: deliverable.title || '',
      type: deliverable.type || 'Document',
      status: normalizeItemStatus(deliverable.status),
      dueDate: formatDateInput(deliverable.dueDate),
      description: deliverable.description || '',
      notes: deliverable.notes || '',
      completionCriteria: deliverable.completionCriteria || '',
      linkedMilestoneIds: deliverable.linkedMilestoneIds || [],
      documents: deliverable.documents || [],
      pendingFiles: [],
      removedDocumentIds: [],
    });
    setDeliverableDialog(true);
  };

  const handleAddNewDeliverable = (projectId) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    setSelectedProject(project);
    setDeliverableDialogMode('create');
    setDeliverableEditContext({
      projectId,
      deliverableIndex: -1,
      milestones: project.milestones || [],
    });
    setDeliverableEditForm({
      title: '',
      type: 'Document',
      status: 'Pending',
      dueDate: '',
      description: '',
      notes: '',
      completionCriteria: '',
      linkedMilestoneIds: [],
      documents: [],
      pendingFiles: [],
      removedDocumentIds: [],
    });
    setDeliverableDialog(true);
  };

  const handleSaveDeliverable = async () => {
    if (!deliverableEditContext || !deliverableEditForm.title) return;

    try {
      setSavingDeliverable(true);

      const payload = {
        title: deliverableEditForm.title,
        type: deliverableEditForm.type,
        status: deliverableEditForm.status,
        dueDate: deliverableEditForm.dueDate || null,
        description: deliverableEditForm.description,
        notes: deliverableEditForm.notes,
        completionCriteria: deliverableEditForm.completionCriteria,
        linkedMilestoneIds: deliverableEditForm.linkedMilestoneIds,
        documents: deliverableEditForm.documents,
        removedDocumentIds: deliverableEditForm.removedDocumentIds,
      };

      const formData = new FormData();
      formData.append('deliverableData', JSON.stringify(payload));
      deliverableEditForm.pendingFiles.forEach((file) => {
        formData.append('documents', file);
      });

      const isCreate = deliverableDialogMode === 'create';
      if (!isCreate) {
        formData.append('deliverableIndex', String(deliverableEditContext.deliverableIndex));
      }

      const response = await fetch(
        `/api/proposals/${deliverableEditContext.projectId}/deliverables`,
        { method: isCreate ? 'POST' : 'PATCH', body: formData }
      );

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save deliverable');
      }

      const remappedDeliverables = (result.deliverables || []).map(mapDeliverableFromRaw);
      setProjects((prev) => prev.map((project) => (
        project.id === deliverableEditContext.projectId
          ? { ...project, deliverables: remappedDeliverables }
          : project
      )));

      closeDeliverableDialog();
      alert(isCreate ? 'Deliverable created successfully!' : 'Deliverable updated successfully!');
    } catch (error) {
      console.error('Error saving deliverable:', error);
      alert(error.message || 'Failed to save deliverable');
    } finally {
      setSavingDeliverable(false);
    }
  };

  const renderDocumentUploadSection = (form, setForm) => (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#2D3748', display: 'flex', alignItems: 'center', gap: 1 }}>
        <AttachFileIcon sx={{ fontSize: 18, color: '#8b6cbc' }} />
        Supporting Documents
      </Typography>
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 2,
          borderStyle: 'dashed',
          borderColor: alpha('#8b6cbc', 0.35),
          bgcolor: alpha('#8b6cbc', 0.03),
          textAlign: 'center',
        }}
      >
        <Button
          component="label"
          variant="outlined"
          startIcon={<CloudUploadIcon />}
          sx={{ borderColor: '#8b6cbc', color: '#8b6cbc', textTransform: 'none' }}
        >
          Upload documents
          <input
            hidden
            multiple
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.csv,.txt,.zip"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (files.length === 0) return;
              setForm((prev) => ({ ...prev, pendingFiles: [...prev.pendingFiles, ...files] }));
              e.target.value = '';
            }}
          />
        </Button>
      </Paper>
      {[...form.documents, ...form.pendingFiles].length === 0 ? (
        <Typography variant="body2" color="text.secondary">No documents attached yet.</Typography>
      ) : (
        <List dense disablePadding>
          {[
            ...form.documents.map((doc) => ({ ...doc, pending: false })),
            ...form.pendingFiles.map((file, index) => ({
              id: `pending-${index}-${file.name}`,
              originalName: file.name,
              size: file.size,
              pending: true,
              file,
            })),
          ].map((doc) => (
            <ListItem
              key={doc.id}
              sx={{ px: 1.5, py: 1, mb: 0.75, borderRadius: 1.5, border: '1px solid rgba(0,0,0,0.08)' }}
              secondaryAction={
                <IconButton
                  edge="end"
                  size="small"
                  onClick={() => {
                    if (doc.pending) {
                      setForm((prev) => ({
                        ...prev,
                        pendingFiles: prev.pendingFiles.filter((f) => f !== doc.file),
                      }));
                    } else {
                      setForm((prev) => ({
                        ...prev,
                        documents: prev.documents.filter((d) => d.id !== doc.id),
                        removedDocumentIds: [...prev.removedDocumentIds, doc.id],
                      }));
                    }
                  }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              }
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <AttachFileIcon sx={{ color: '#8b6cbc' }} />
              </ListItemIcon>
              <ListItemText
                primary={doc.originalName}
                secondary={doc.pending ? 'Ready to upload' : 'Uploaded'}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );

  const getMilestoneIcon = (status) => {
    switch (status) {
      case 'Completed': return <CheckIcon color="success" />;
      case 'In Progress': return <PlayIcon color="primary" />;
      case 'Blocked': return <BlockedIcon color="error" />;
      case 'Pending': return <PendingIcon color="action" />;
      default: return <PendingIcon color="action" />;
    }
  };

  const getDeliverableIcon = (status) => {
    switch (status) {
      case 'Delivered': return <CheckIcon color="success" />;
      case 'In Progress': return <PlayIcon color="primary" />;
      case 'Pending': return <PendingIcon color="action" />;
      default: return <PendingIcon color="action" />;
    }
  };

  const getItemStatusColor = (status) => {
    const normalized = normalizeItemStatus(status);
    if (normalized === 'Completed' || normalized === 'Delivered') return 'success';
    if (normalized === 'In Progress') return 'primary';
    if (normalized === 'Blocked') return 'error';
    return 'default';
  };

  const renderTrackingSection = (project, type) => {
    const isMilestone = type === 'milestones';
    const items = isMilestone ? project.milestones : project.deliverables;
    const Icon = isMilestone ? MilestoneIcon : TaskIcon;
    const label = isMilestone ? 'Milestones' : 'Deliverables';
    const emptyLabel = isMilestone ? 'No milestones defined yet' : 'No deliverables defined yet';

    return (
      <Paper
        elevation={0}
        sx={{
          height: '100%',
          borderRadius: 2,
          border: '1px solid rgba(139, 108, 188, 0.12)',
          bgcolor: 'white',
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: alpha('#8b6cbc', 0.06),
            borderBottom: '1px solid rgba(139, 108, 188, 0.1)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Icon sx={{ fontSize: 18, color: '#8b6cbc' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2D3748' }}>
              {label}
            </Typography>
            <Chip label={items.length} size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: alpha('#8b6cbc', 0.12), color: '#6b4fa8' }} />
          </Box>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => (
              isMilestone
                ? handleAddNewMilestone(project.id)
                : handleAddNewDeliverable(project.id)
            )}
            sx={{ textTransform: 'none', color: '#8b6cbc', fontWeight: 600 }}
          >
            Add
          </Button>
        </Box>

        {items.length === 0 ? (
          <Box sx={{ py: 4, px: 2, textAlign: 'center' }}>
            <Icon sx={{ fontSize: 32, color: '#cbd5e0', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">{emptyLabel}</Typography>
          </Box>
        ) : (
          <List disablePadding>
            {items.map((item, index) => (
              <React.Fragment key={item.id}>
                {index > 0 && <Divider />}
                <ListItem
                  sx={{
                    py: 1.5,
                    px: 2,
                    alignItems: 'flex-start',
                    '&:hover': { bgcolor: alpha('#8b6cbc', 0.03) }
                  }}
                  secondaryAction={
                    isMilestone ? (
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleUpdateMilestone(item, project.id)}
                        sx={{ color: '#8b6cbc' }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    ) : (
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleUpdateDeliverable(item, project.id)}
                        sx={{ color: '#8b6cbc' }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )
                  }
                >
                  <ListItemIcon sx={{ minWidth: 36, mt: 0.25 }}>
                    {isMilestone ? getMilestoneIcon(item.status) : getDeliverableIcon(item.status)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', pr: 4 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#2D3748' }}>
                          {item.title}
                        </Typography>
                        <Chip
                          label={normalizeItemStatus(item.status)}
                          size="small"
                          color={getItemStatusColor(item.status)}
                          sx={{ height: 22, fontSize: '0.7rem' }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        {!isMilestone && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {item.type}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          Due {formatDisplayDate(item.dueDate) || 'Not set'}
                        </Typography>
                        {isMilestone && item.status === 'In Progress' && item.progress > 0 && (
                          <Box sx={{ mt: 1, maxWidth: 220 }}>
                            <LinearProgress
                              variant="determinate"
                              value={item.progress}
                              sx={{
                                height: 4,
                                borderRadius: 2,
                                bgcolor: alpha('#8b6cbc', 0.12),
                                '& .MuiLinearProgress-bar': { bgcolor: '#8b6cbc', borderRadius: 2 }
                              }}
                            />
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    );
  };

  const renderProjectsList = () => {
    const filteredProjects = projects.filter(project => {
      const statusMatch = filterStatus === 'All' || project.status === filterStatus;
      const priorityMatch = filterPriority === 'All' || project.priority === filterPriority;
      return statusMatch && priorityMatch;
    });

    const paginatedProjects = filteredProjects.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );

    const filterFieldSx = {
      borderRadius: 2,
      bgcolor: 'white',
      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(139, 108, 188, 0.2)' },
      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#8b6cbc' },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#8b6cbc' }
    };

    return (
      <Box>
        <Paper
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 2,
            border: '1px solid rgba(139, 108, 188, 0.12)',
            boxShadow: '0 2px 8px rgba(139, 108, 188, 0.06)'
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 160, flex: 1 }}>
              <InputLabel>Status</InputLabel>
              <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)} sx={filterFieldSx}>
                <MenuItem value="All">All Status</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Planning">Planning</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="On Hold">On Hold</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160, flex: 1 }}>
              <InputLabel>Priority</InputLabel>
              <Select value={filterPriority} label="Priority" onChange={(e) => setFilterPriority(e.target.value)} sx={filterFieldSx}>
                <MenuItem value="All">All Priorities</MenuItem>
                <MenuItem value="Critical">Critical</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="Low">Low</MenuItem>
              </Select>
            </FormControl>
            <Button
              size="small"
              startIcon={<ClearIcon />}
              onClick={() => { setFilterStatus('All'); setFilterPriority('All'); }}
              sx={{ color: '#8b6cbc', textTransform: 'none', fontWeight: 600, alignSelf: { xs: 'flex-start', sm: 'center' } }}
            >
              Clear filters
            </Button>
          </Stack>
        </Paper>

        {paginatedProjects.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 2, border: '1px dashed rgba(139, 108, 188, 0.25)' }}>
            <TrackIcon sx={{ fontSize: 48, color: '#cbd5e0', mb: 1.5 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>No projects match your filters</Typography>
            <Typography variant="body2" color="text.secondary">Try adjusting the status or priority filters above.</Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {paginatedProjects.map((project) => {
              const isExpanded = expandedRows[project.id];
              const dueDateLabel = formatDisplayDate(project.endDate);
              const isDueSoon = project.daysUntilDeadline <= 7 && project.daysUntilDeadline > 0;

              return (
                <Paper
                  key={project.id}
                  elevation={0}
                  sx={{
                    borderRadius: 2,
                    border: '1px solid rgba(139, 108, 188, 0.12)',
                    overflow: 'hidden',
                    boxShadow: isExpanded ? '0 4px 16px rgba(139, 108, 188, 0.1)' : '0 1px 4px rgba(0,0,0,0.04)',
                    transition: 'box-shadow 0.2s ease'
                  }}
                >
                  <Box
                    onClick={() => handleToggleRow(project.id)}
                    sx={{
                      px: 2,
                      py: 2,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1.5,
                      cursor: 'pointer',
                      bgcolor: isExpanded ? alpha('#8b6cbc', 0.03) : 'white',
                      '&:hover': { bgcolor: alpha('#8b6cbc', 0.04) }
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={(e) => { e.stopPropagation(); handleToggleRow(project.id); }}
                      sx={{ color: '#8b6cbc', mt: 0.25 }}
                    >
                      {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2D3748', lineHeight: 1.3 }}>
                          {project.title}
                        </Typography>
                        <Chip label={project.status} size="small" color={getStatusColor(project.status)} />
                        <Chip label={project.priority} size="small" variant="outlined" color={getPriorityColor(project.priority)} />
                      </Box>

                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 0.75, md: 3 }} sx={{ color: 'text.secondary' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
                          <LinearProgress
                            variant="determinate"
                            value={project.progress}
                            sx={{
                              width: 72,
                              height: 6,
                              borderRadius: 3,
                              bgcolor: alpha('#8b6cbc', 0.12),
                              '& .MuiLinearProgress-bar': { bgcolor: '#8b6cbc', borderRadius: 3 }
                            }}
                          />
                          <Typography variant="caption" sx={{ fontWeight: 600, color: '#6b4fa8' }}>{project.progress}%</Typography>
                        </Box>
                        <Typography variant="caption">Lead: {project.lead.name}</Typography>
                        <Typography variant="caption" sx={{ maxWidth: 280 }} noWrap title={project.nextMilestone}>
                          Next: {project.nextMilestone}
                        </Typography>
                        <Typography variant="caption" color={isDueSoon ? 'error.main' : 'text.secondary'} sx={{ fontWeight: isDueSoon ? 600 : 400 }}>
                          Due: {dueDateLabel || 'Not set'}
                          {isDueSoon && ` (${project.daysUntilDeadline}d)`}
                        </Typography>
                      </Stack>
                    </Box>

                    <Stack direction="row" spacing={0.5} onClick={(e) => e.stopPropagation()} sx={{ flexShrink: 0 }}>
                      <Tooltip title="View details">
                        <IconButton size="small" onClick={() => { setSelectedProject(project); setViewDetailsDialog(true); }} sx={{ color: '#8b6cbc' }}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Update status">
                        <IconButton size="small" onClick={() => openStatusUpdateDialog(project)} sx={{ color: '#64748b' }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>

                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <Box sx={{ px: 2, pb: 2, pt: 0, bgcolor: '#fafbfd', borderTop: '1px solid rgba(139, 108, 188, 0.08)' }}>
                      <Grid container spacing={2} sx={{ pt: 2 }}>
                        <Grid size={{ xs: 12, md: 6 }}>{renderTrackingSection(project, 'milestones')}</Grid>
                        <Grid size={{ xs: 12, md: 6 }}>{renderTrackingSection(project, 'deliverables')}</Grid>
                      </Grid>
                    </Box>
                  </Collapse>
                </Paper>
              );
            })}
          </Stack>
        )}

        <TablePagination
          component={Paper}
          elevation={0}
          count={filteredProjects.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          sx={{
            mt: 2,
            borderRadius: 2,
            border: '1px solid rgba(139, 108, 188, 0.12)'
          }}
        />
      </Box>
    );
  };


  return (
    <Box>
      <PageHeader
        title={t("researcher.status_tracking")}
        description={t("researcher.status_tracking_desc")}
        icon={<TrackIcon />}
        breadcrumbs={[
          { label: 'Dashboard', path: '/researcher', icon: <BusinessIcon /> },
          { label: 'Projects', path: '/researcher/projects', icon: <BusinessIcon /> },
          { label: 'Tracking', path: '/researcher/projects/tracking', icon: <TrackIcon /> },
        ]}
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {(!mounted || loading) ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <CircularProgress size={60} sx={{ color: '#8b6cbc' }} />
          </Box>
        ) : (
          <>
            {/* Overview Statistics */}
            {renderOverviewCards()}

            {/* Main Content Tabs */}
            <Paper elevation={1} sx={{ mb: 4 }}>
              <Tabs 
                value={currentTab} 
                onChange={handleTabChange}
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab label="All Projects" icon={<DashboardIcon />} iconPosition="start" />
                <Tab label="Timeline View" icon={<TimelineIcon />} iconPosition="start" />
                <Tab label="Team Activity" icon={<TeamIcon />} iconPosition="start" />
                <Tab label="Reports" icon={<ReportIcon />} iconPosition="start" />
              </Tabs>
            </Paper>

            {/* Tab Content */}
            {currentTab === 0 && renderProjectsList()}

        {currentTab === 1 && (
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Project Timeline
            </Typography>
            
            {projects.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {projects.map((project) => (
                  <Paper key={project.id} elevation={2} sx={{ p: 4, borderLeft: '4px solid #8b6cbc' }}>
                    <Typography variant="h6" sx={{ mb: 3, color: '#8b6cbc', fontWeight: 'bold' }}>
                      {project.title}
                    </Typography>
                    
                    {/* Project Timeline */}
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      position: 'relative', 
                      pl: 4,
                      gap: 3
                    }}>
                      {/* Timeline Line */}
                      <Box sx={{ 
                        position: 'absolute', 
                        left: '8px', 
                        top: '8px', 
                        bottom: '8px', 
                        width: '2px', 
                        bgcolor: '#8b6cbc',
                        opacity: 0.3
                      }} />
                      
                      {/* Start Date */}
                      <Box sx={{ 
                        position: 'relative', 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: 2 
                      }}>
                        <Box sx={{ 
                          position: 'absolute', 
                          left: '-12px', 
                          top: '2px', 
                          width: '16px', 
                          height: '16px', 
                          borderRadius: '50%', 
                          bgcolor: '#8b6cbc',
                          border: '2px solid white',
                          boxShadow: 2
                        }} />
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            Project Start
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {project.startDate && new Date(project.startDate) && !isNaN(new Date(project.startDate).getTime())
                              ? format(new Date(project.startDate), 'MMM dd, yyyy')
                              : 'Start date not set'
                            }
                          </Typography>
                        </Box>
                      </Box>

                      {/* Milestones */}
                      {project.milestones.map((milestone, index) => (
                        <Box key={milestone.id} sx={{ 
                          position: 'relative', 
                          display: 'flex', 
                          alignItems: 'flex-start', 
                          gap: 2 
                        }}>
                          <Box sx={{ 
                            position: 'absolute', 
                            left: '-12px', 
                            top: '2px', 
                            width: '16px', 
                            height: '16px', 
                            borderRadius: '50%', 
                            bgcolor: milestone.status === 'Completed' ? '#4caf50' : 
                                     milestone.status === 'In Progress' ? '#2196f3' : '#f44336',
                            border: '2px solid white',
                            boxShadow: 2
                          }} />
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {milestone.title}
                              </Typography>
                              <Chip 
                                label={milestone.status} 
                                size="small" 
                                color={
                                  milestone.status === 'Completed' ? 'success' : 
                                  milestone.status === 'In Progress' ? 'primary' : 'default'
                                }
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {milestone.dueDate && new Date(milestone.dueDate) && !isNaN(new Date(milestone.dueDate).getTime())
                                ? format(new Date(milestone.dueDate), 'MMM dd, yyyy')
                                : 'No due date'
                              }
                            </Typography>
                            {milestone.status === 'In Progress' && milestone.progress && (
                              <Box sx={{ mt: 1, maxWidth: 400 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={milestone.progress} 
                                    sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                                  />
                                  <Typography variant="caption" color="text.secondary" sx={{ minWidth: 50 }}>
                                    {milestone.progress}%
                                  </Typography>
                                </Box>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      ))}

                      {/* End Date */}
                      <Box sx={{ 
                        position: 'relative', 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: 2 
                      }}>
                        <Box sx={{ 
                          position: 'absolute', 
                          left: '-12px', 
                          top: '2px', 
                          width: '16px', 
                          height: '16px', 
                          borderRadius: '50%', 
                          bgcolor: project.daysUntilDeadline < 0 ? '#f44336' : '#8b6cbc',
                          border: '2px solid white',
                          boxShadow: 2
                        }} />
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            Project End
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              {project.endDate && new Date(project.endDate) && !isNaN(new Date(project.endDate).getTime())
                                ? format(new Date(project.endDate), 'MMM dd, yyyy')
                                : 'End date not set'
                              }
                            </Typography>
                            {project.daysUntilDeadline < 0 && (
                              <Chip 
                                label={`${Math.abs(project.daysUntilDeadline)} days overdue`} 
                                color="error" 
                                size="small"
                              />
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No projects to display in timeline view.
              </Typography>
            )}
          </Paper>
        )}

            {currentTab === 2 && (
              <Paper elevation={1} sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Team Activity Dashboard
                </Typography>
                
                {projects.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {/* Team Overview Cards */}
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 3, 
                      flexWrap: 'wrap',
                      '& > *': { flex: 1, minWidth: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 12px)' } }
                    }}>
                      <Card sx={{ bgcolor: '#8b6cbc', color: 'white', flex: 1 }}>
                        <CardContent>
                          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                            {stats.teamMembers}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Total Team Members
                          </Typography>
                        </CardContent>
                      </Card>
                      
                      <Card sx={{ bgcolor: '#4caf50', color: 'white', flex: 1 }}>
                        <CardContent>
                          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                            {projects.reduce((sum, p) => sum + (p.completedTasks || 0), 0)}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Completed Tasks
                          </Typography>
                        </CardContent>
                      </Card>
                      
                      <Card sx={{ bgcolor: '#ff9800', color: 'white', flex: 1 }}>
                        <CardContent>
                          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                            {projects.reduce((sum, p) => sum + (p.totalTasks || 0) - (p.completedTasks || 0), 0)}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Pending Tasks
                          </Typography>
                        </CardContent>
                      </Card>
                    </Box>

                    {/* Project Team Breakdown & Activity Feed */}
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 4, 
                      flexWrap: 'wrap',
                      '& > *': { minWidth: { xs: '100%', lg: 'calc(66.666% - 16px)' } }
                    }}>
                      {/* Project Team Breakdown */}
                      <Paper elevation={2} sx={{ p: 3, flex: 2, minWidth: { xs: '100%', lg: 'calc(66.666% - 16px)' } }}>
                        <Typography variant="h6" sx={{ mb: 3 }}>
                          Project Teams
                        </Typography>
                        <List>
                          {projects.map((project) => (
                            <ListItem key={project.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, mb: 2 }}>
                              <ListItemIcon>
                                <Avatar sx={{ bgcolor: '#8b6cbc' }}>
                                  {project.lead.name.split(' ').map(n => n[0]).join('')}
                                </Avatar>
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                    {project.title}
                                  </Typography>
                                }
                                secondary={
                                  <Box>
                                    <Typography variant="body2" color="text.secondary">
                                      Lead: {project.lead.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      Team Size: {project.team} members • Progress: {project.progress}%
                                    </Typography>
                                    <Box sx={{ mt: 1 }}>
                                      <LinearProgress 
                                        variant="determinate" 
                                        value={project.progress} 
                                        sx={{ height: 6, borderRadius: 3 }}
                                      />
                                    </Box>
                                  </Box>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Paper>

                      {/* Activity Feed */}
                      <Paper elevation={2} sx={{ p: 3, flex: 1, minWidth: { xs: '100%', lg: 'calc(33.333% - 16px)' } }}>
                        <Typography variant="h6" sx={{ mb: 3 }}>
                          Recent Activity
                        </Typography>
                        <List dense>
                          {projects.slice(0, 5).map((project) => (
                            <ListItem key={project.id}>
                              <ListItemAvatar>
                                <Avatar sx={{ bgcolor: getStatusColor(project.status) === 'success' ? '#4caf50' : '#8b6cbc', width: 32, height: 32 }}>
                                  <CheckIcon />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={
                                  <Typography variant="body2">
                                    {project.title}
                                  </Typography>
                                }
                                secondary={
                                  <Typography variant="caption" color="text.secondary">
                                    Status: {project.status} • {project.lead.name}
                                  </Typography>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No team activity data available.
                  </Typography>
                )}
              </Paper>
            )}

        {currentTab === 3 && (
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Project Reports & Analytics
            </Typography>
            
            {projects.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* Top Row - Performance Metrics & Budget Analysis */}
                <Box sx={{ 
                  display: 'flex', 
                  gap: 4, 
                  flexWrap: 'wrap',
                  '& > *': { flex: 1, minWidth: { xs: '100%', md: 'calc(50% - 16px)' } }
                }}>
                  {/* Performance Metrics */}
                  <Paper elevation={2} sx={{ p: 3, flex: 1 }}>
                    <Typography variant="h6" sx={{ mb: 3, color: '#8b6cbc' }}>
                      Performance Metrics
                    </Typography>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Overall Progress
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={stats.avgProgress} 
                        sx={{ height: 10, borderRadius: 5, mb: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {stats.avgProgress}% Average across all projects
                      </Typography>
                    </Box>

                    <Box sx={{ 
                      display: 'flex', 
                      gap: 2, 
                      '& > *': { flex: 1 }
                    }}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.dark' }}>
                          {projects.filter(p => p.status === 'Active').length}
                        </Typography>
                        <Typography variant="body2" color="success.dark">
                          Active Projects
                        </Typography>
                      </Box>
                      
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 2 }}>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.dark' }}>
                          {stats.upcoming}
                        </Typography>
                        <Typography variant="body2" color="warning.dark">
                          Due Soon
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>

                  {/* Budget Analysis */}
                  <Paper elevation={2} sx={{ p: 3, flex: 1 }}>
                    <Typography variant="h6" sx={{ mb: 3, color: '#8b6cbc' }}>
                      Budget Analysis
                    </Typography>
                    
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">
                          Budget Utilization
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {stats.totalBudget > 0 ? Math.round((stats.budgetUsed / stats.totalBudget) * 100) : 0}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={stats.totalBudget > 0 ? (stats.budgetUsed / stats.totalBudget) * 100 : 0}
                        sx={{ height: 10, borderRadius: 5, mb: 2 }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Total Budget:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          ${stats.totalBudget.toLocaleString()}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Used:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          ${stats.budgetUsed.toLocaleString()}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Remaining:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                          ${(stats.totalBudget - stats.budgetUsed).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Box>

                {/* Full Width - Detailed Project Report */}
                <Paper elevation={2} sx={{ p: 3, width: '100%' }}>
                  <Typography variant="h6" sx={{ mb: 3, color: '#8b6cbc' }}>
                    Detailed Project Status
                  </Typography>
                  
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                          <TableCell><Typography variant="subtitle2" fontWeight="bold">Project</Typography></TableCell>
                          <TableCell><Typography variant="subtitle2" fontWeight="bold">Status</Typography></TableCell>
                          <TableCell><Typography variant="subtitle2" fontWeight="bold">Progress</Typography></TableCell>
                          <TableCell><Typography variant="subtitle2" fontWeight="bold">Budget Used</Typography></TableCell>
                          <TableCell><Typography variant="subtitle2" fontWeight="bold">Team</Typography></TableCell>
                          <TableCell><Typography variant="subtitle2" fontWeight="bold">Days to Deadline</Typography></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {projects.map((project) => (
                          <TableRow key={project.id} hover>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {project.title}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={project.status} 
                                color={getStatusColor(project.status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 100 }}>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={project.progress} 
                                  sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                                />
                                <Typography variant="body2" sx={{ minWidth: 35 }}>
                                  {project.progress}%
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {project.budget > 0 ? Math.round((project.budgetUsed / project.budget) * 100) : 0}%
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {project.team} members
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography 
                                variant="body2"
                                color={project.daysUntilDeadline <= 7 && project.daysUntilDeadline > 0 ? 'error.main' : 'text.primary'}
                              >
                                {project.daysUntilDeadline > 0 
                                  ? `${project.daysUntilDeadline} days`
                                  : project.daysUntilDeadline < 0 
                                  ? `${Math.abs(project.daysUntilDeadline)} days overdue`
                                  : 'No deadline'
                                }
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No project data available for reports.
              </Typography>
            )}
          </Paper>
        )}
          </>
        )}
      </Container>

      {/* Status Update Dialog */}
      <Dialog
        open={statusUpdateDialog}
        onClose={closeStatusUpdateDialog}
        maxWidth="md"
        fullWidth
        {...dialogScrollLockProps}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #8b6cbc 0%, #7a5cac 100%)',
            color: 'white',
            pb: 2,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Update Project Status</Typography>
          {selectedProject && (
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }} noWrap title={selectedProject.title}>
              {selectedProject.title}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedProject && (
            <Stack spacing={3}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: alpha('#8b6cbc', 0.03) }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary">Current Status</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip label={selectedProject.status} color={getStatusColor(selectedProject.status)} size="small" />
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary">Progress</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>{selectedProject.progress}%</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary">Due Date</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                      {formatDisplayDate(selectedProject.endDate) || 'Not set'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>New Status</InputLabel>
                    <Select
                      value={statusUpdate.newStatus}
                      label="New Status"
                      onChange={(e) => setStatusUpdate((prev) => ({ ...prev, newStatus: e.target.value }))}
                    >
                      <MenuItem value="Active">Active</MenuItem>
                      <MenuItem value="Planning">Planning</MenuItem>
                      <MenuItem value="On Hold">On Hold</MenuItem>
                      <MenuItem value="Completed">Completed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Effective Date"
                    value={statusUpdate.effectiveDate}
                    onChange={(e) => setStatusUpdate((prev) => ({ ...prev, effectiveDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                size="small"
                label="Reason for Status Change"
                value={statusUpdate.reason}
                onChange={(e) => setStatusUpdate((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="Brief reason for this status transition..."
              />

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#2D3748' }}>
                  Additional Notes
                </Typography>
                <TipTapEditor
                  value={statusUpdate.notes}
                  onChange={(value) => setStatusUpdate((prev) => ({ ...prev, notes: value }))}
                  placeholder="Document context, approvals, risks, or follow-up actions..."
                  minHeight="140px"
                />
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
          <Button onClick={closeStatusUpdateDialog} disabled={savingStatus}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUpdateProjectStatus}
            disabled={!statusUpdate.newStatus || savingStatus || statusUpdate.newStatus === selectedProject?.status}
            sx={{ bgcolor: '#8b6cbc', '&:hover': { bgcolor: '#7a5cac' } }}
          >
            {savingStatus ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Milestone Dialog */}
      <Dialog
        open={milestoneDialog}
        onClose={closeMilestoneDialog}
        maxWidth="md"
        fullWidth
        {...dialogScrollLockProps}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #8b6cbc 0%, #7a5cac 100%)',
            color: 'white',
            pb: 2,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Update Milestone</Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            {milestoneEditForm.title || 'Milestone details'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#2D3748' }}>
                Status & Timeline
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={milestoneEditForm.status}
                      label="Status"
                      onChange={(e) => {
                        const status = e.target.value;
                        setMilestoneEditForm((prev) => ({
                          ...prev,
                          status,
                          completedDate: status === 'Completed' && !prev.completedDate
                            ? new Date().toISOString().split('T')[0]
                            : prev.completedDate,
                        }));
                      }}
                    >
                      <MenuItem value="Pending">Pending</MenuItem>
                      <MenuItem value="In Progress">In Progress</MenuItem>
                      <MenuItem value="Completed">Completed</MenuItem>
                      <MenuItem value="Blocked">Blocked</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Due Date"
                    value={milestoneEditForm.dueDate}
                    onChange={(e) => setMilestoneEditForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Completed Date"
                    value={milestoneEditForm.completedDate}
                    onChange={(e) => setMilestoneEditForm((prev) => ({ ...prev, completedDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                {(milestoneEditForm.status === 'In Progress' || milestoneEditForm.status === 'Completed') && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                      Progress: {milestoneEditForm.progress}%
                    </Typography>
                    <Slider
                      value={milestoneEditForm.progress}
                      onChange={(_, value) => setMilestoneEditForm((prev) => ({ ...prev, progress: value }))}
                      valueLabelDisplay="auto"
                      min={0}
                      max={100}
                      sx={{ color: '#8b6cbc' }}
                    />
                  </Grid>
                )}
              </Grid>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#2D3748' }}>
                Details
              </Typography>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Milestone Title"
                  value={milestoneEditForm.title}
                  onChange={(e) => setMilestoneEditForm((prev) => ({ ...prev, title: e.target.value }))}
                />
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>Description</Typography>
                  <TipTapEditor
                    value={milestoneEditForm.description}
                    onChange={(value) => setMilestoneEditForm((prev) => ({ ...prev, description: value }))}
                    placeholder="What does this milestone involve?"
                    minHeight="100px"
                  />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>Completion Criteria</Typography>
                  <TipTapEditor
                    value={milestoneEditForm.completionCriteria}
                    onChange={(value) => setMilestoneEditForm((prev) => ({ ...prev, completionCriteria: value }))}
                    placeholder="How will you know this milestone is complete?"
                    minHeight="100px"
                  />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>Progress Notes</Typography>
                  <TipTapEditor
                    value={milestoneEditForm.notes}
                    onChange={(value) => setMilestoneEditForm((prev) => ({ ...prev, notes: value }))}
                    placeholder="Updates, observations, or context for the team..."
                    minHeight="100px"
                  />
                </Box>
                {milestoneEditForm.status === 'Blocked' && (
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>Blockers / Issues</Typography>
                    <TipTapEditor
                      value={milestoneEditForm.blockers}
                      onChange={(value) => setMilestoneEditForm((prev) => ({ ...prev, blockers: value }))}
                      placeholder="Describe what is preventing progress..."
                      minHeight="100px"
                    />
                  </Box>
                )}
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#2D3748', display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinkIcon sx={{ fontSize: 18, color: '#8b6cbc' }} />
                Linked Deliverables
              </Typography>
              <Autocomplete
                multiple
                options={milestoneEditContext?.deliverables || []}
                getOptionLabel={(option) => option.title}
                value={(milestoneEditContext?.deliverables || []).filter((d) =>
                  milestoneEditForm.linkedDeliverableIds.includes(d.id)
                )}
                onChange={(_, selected) => {
                  setMilestoneEditForm((prev) => ({
                    ...prev,
                    linkedDeliverableIds: selected.map((d) => d.id),
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder="Select deliverables this milestone contributes to..."
                    helperText="Link outputs that should be completed or advanced by this milestone"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option.id}
                      label={option.title}
                      size="small"
                      sx={{ bgcolor: alpha('#8b6cbc', 0.12), color: '#6b4fa8' }}
                    />
                  ))
                }
              />
            </Box>

            <Divider />

            {renderDocumentUploadSection(milestoneEditForm, setMilestoneEditForm)}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
          <Button onClick={closeMilestoneDialog} disabled={savingMilestone}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveMilestone}
            disabled={savingMilestone || !milestoneEditForm.title}
            sx={{ bgcolor: '#8b6cbc', '&:hover': { bgcolor: '#7a5cac' } }}
          >
            {savingMilestone ? 'Saving...' : 'Save Milestone'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deliverable Dialog */}
      <Dialog
        open={deliverableDialog}
        onClose={closeDeliverableDialog}
        maxWidth="md"
        fullWidth
        {...dialogScrollLockProps}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #8b6cbc 0%, #7a5cac 100%)',
            color: 'white',
            pb: 2,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {deliverableDialogMode === 'create' ? 'Add Deliverable' : 'Update Deliverable'}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            {deliverableEditForm.title || 'Deliverable details'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Deliverable Title"
                  value={deliverableEditForm.title}
                  onChange={(e) => setDeliverableEditForm((prev) => ({ ...prev, title: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={deliverableEditForm.type}
                    label="Type"
                    onChange={(e) => setDeliverableEditForm((prev) => ({ ...prev, type: e.target.value }))}
                  >
                    {DELIVERABLE_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={deliverableEditForm.status}
                    label="Status"
                    onChange={(e) => setDeliverableEditForm((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="In Progress">In Progress</MenuItem>
                    <MenuItem value="Delivered">Delivered</MenuItem>
                    <MenuItem value="Blocked">Blocked</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Due Date"
                  value={deliverableEditForm.dueDate}
                  onChange={(e) => setDeliverableEditForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>Description</Typography>
              <TipTapEditor
                value={deliverableEditForm.description}
                onChange={(value) => setDeliverableEditForm((prev) => ({ ...prev, description: value }))}
                placeholder="Describe this deliverable and expected output..."
                minHeight="100px"
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>Completion Criteria</Typography>
              <TipTapEditor
                value={deliverableEditForm.completionCriteria}
                onChange={(value) => setDeliverableEditForm((prev) => ({ ...prev, completionCriteria: value }))}
                placeholder="Define acceptance criteria for this deliverable..."
                minHeight="100px"
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>Notes</Typography>
              <TipTapEditor
                value={deliverableEditForm.notes}
                onChange={(value) => setDeliverableEditForm((prev) => ({ ...prev, notes: value }))}
                placeholder="Progress updates, review comments, or handoff notes..."
                minHeight="100px"
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#2D3748', display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinkIcon sx={{ fontSize: 18, color: '#8b6cbc' }} />
                Linked Milestones
              </Typography>
              <Autocomplete
                multiple
                options={deliverableEditContext?.milestones || []}
                getOptionLabel={(option) => option.title}
                value={(deliverableEditContext?.milestones || []).filter((m) =>
                  deliverableEditForm.linkedMilestoneIds.includes(m.id)
                )}
                onChange={(_, selected) => {
                  setDeliverableEditForm((prev) => ({
                    ...prev,
                    linkedMilestoneIds: selected.map((m) => m.id),
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder="Select milestones that produce or validate this deliverable..."
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option.id}
                      label={option.title}
                      size="small"
                      sx={{ bgcolor: alpha('#8b6cbc', 0.12), color: '#6b4fa8' }}
                    />
                  ))
                }
              />
            </Box>

            <Divider />
            {renderDocumentUploadSection(deliverableEditForm, setDeliverableEditForm)}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
          <Button onClick={closeDeliverableDialog} disabled={savingDeliverable}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveDeliverable}
            disabled={savingDeliverable || !deliverableEditForm.title}
            sx={{ bgcolor: '#8b6cbc', '&:hover': { bgcolor: '#7a5cac' } }}
          >
            {savingDeliverable ? 'Saving...' : deliverableDialogMode === 'create' ? 'Create Deliverable' : 'Save Deliverable'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add New Milestone Dialog */}
      <Dialog
        open={newMilestoneDialog}
        onClose={() => setNewMilestoneDialog(false)}
        maxWidth="sm"
        fullWidth
        {...dialogScrollLockProps}
      >
        <DialogTitle>Add New Milestone</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Milestone Title"
              value={milestoneForm.title}
              onChange={(e) => setMilestoneForm(prev => ({ ...prev, title: e.target.value }))}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              type="date"
              label="Due Date"
              value={milestoneForm.dueDate}
              onChange={(e) => setMilestoneForm(prev => ({ ...prev, dueDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={milestoneForm.status}
                label="Status"
                onChange={(e) => setMilestoneForm(prev => ({ ...prev, status: e.target.value }))}
              >
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Blocked">Blocked</MenuItem>
              </Select>
            </FormControl>

            <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>Description</Typography>
            <TipTapEditor
              value={milestoneForm.description}
              onChange={(value) => setMilestoneForm(prev => ({ ...prev, description: value }))}
              placeholder="Describe this milestone..."
              minHeight="100px"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewMilestoneDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleAddMilestone}
            sx={{ bgcolor: '#8b6cbc', '&:hover': { bgcolor: '#7a5cac' } }}
          >
            Add Milestone
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog 
        open={viewDetailsDialog} 
        onClose={() => {
          setViewDetailsDialog(false);
          setDetailsTab(0);
        }}
        maxWidth="lg"
        fullWidth
        {...dialogScrollLockProps}
        sx={{ '& .MuiDialog-paper': { height: '90vh' } }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #8b6cbc 0%, #7a5cac 100%)', 
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          py: 1.5,
          px: 2.5
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)', 
              borderRadius: 1.5, 
              p: 0.75, 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ViewIcon sx={{ fontSize: 20 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
              Project Details
            </Typography>
          </Box>
          <IconButton 
            onClick={() => {
              setViewDetailsDialog(false);
              setDetailsTab(0);
            }}
            sx={{ 
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.1)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.2)'
              }
            }}
            size="small"
          >
            <BlockedIcon />
          </IconButton>
        </DialogTitle>
        
        {selectedProject && (
          <>
            <Box sx={{ 
              borderBottom: 1, 
              borderColor: 'divider', 
              bgcolor: '#fafbfd',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <Tabs 
                value={detailsTab} 
                onChange={(e, newValue) => setDetailsTab(newValue)}
                sx={{ 
                  px: 2.5,
                  '& .MuiTab-root': { 
                    minHeight: 48,
                    color: 'text.secondary',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    textTransform: 'none',
                    '&.Mui-selected': { 
                      color: '#8b6cbc',
                      fontWeight: 700
                    },
                    '&:hover': {
                      color: '#8b6cbc',
                      bgcolor: 'rgba(139, 108, 188, 0.04)'
                    }
                  },
                  '& .MuiTabs-indicator': { 
                    backgroundColor: '#8b6cbc',
                    height: 2,
                    borderRadius: '2px 2px 0 0'
                  }
                }}
              >
                <Tab label="Overview" />
                <Tab label="Timeline" />
                <Tab label="Team" />
                <Tab label="Deliverables" />
                <Tab label="Activity" />
              </Tabs>
            </Box>
            
            <DialogContent sx={{ p: 0, flex: 1, overflow: 'hidden', bgcolor: '#f8f9fa' }}>
              {detailsTab === 0 && (
                <Box sx={{ p: 2.5, height: '100%', overflow: 'auto' }}>
                  {/* Overview Tab */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Project Header */}
                    <Paper elevation={0} sx={{ 
                      p: 2.5, 
                      borderRadius: 2,
                      border: '1px solid rgba(0,0,0,0.08)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                      background: 'linear-gradient(135deg, #ffffff 0%, #fafbfd 100%)'
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#2c3e50' }}>
                            {selectedProject.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                            {selectedProject.description || 'No description available'}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip 
                              label={selectedProject.status} 
                              color={getStatusColor(selectedProject.status)}
                              size="small"
                              sx={{ 
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                height: 26,
                                borderRadius: 1.5
                              }}
                            />
                            <Chip 
                              label={selectedProject.priority || 'Medium'} 
                              color={selectedProject.priority === 'High' ? 'error' : selectedProject.priority === 'Low' ? 'default' : 'warning'}
                              variant="outlined"
                              size="small"
                              sx={{ 
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                height: 26,
                                borderRadius: 1.5
                              }}
                            />
                            <Chip 
                              label={`${selectedProject.progress || 0}% Complete`}
                              size="small"
                              sx={{
                                bgcolor: 'rgba(139, 108, 188, 0.1)',
                                color: '#8b6cbc',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                height: 26,
                                borderRadius: 1.5
                              }}
                            />
                          </Box>
                        </Box>
                        <Avatar 
                          sx={{ 
                            width: 72, 
                            height: 72, 
                            background: 'linear-gradient(135deg, #8b6cbc 0%, #7a5cac 100%)',
                            fontSize: '1.8rem',
                            fontWeight: 700,
                            boxShadow: '0 4px 16px rgba(139, 108, 188, 0.3)'
                          }}
                        >
                          {selectedProject.title?.charAt(0) || 'P'}
                        </Avatar>
                      </Box>
                      
                      {/* Progress Bar */}
                      <Box sx={{ 
                        mt: 2, 
                        p: 2, 
                        bgcolor: 'rgba(139, 108, 188, 0.04)',
                        borderRadius: 1.5,
                        border: '1px solid rgba(139, 108, 188, 0.1)'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.9rem' }}>
                            Overall Progress
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: '#8b6cbc' }}>
                            {selectedProject.progress || 0}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={selectedProject.progress || 0}
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            bgcolor: 'rgba(139, 108, 188, 0.15)',
                            '& .MuiLinearProgress-bar': {
                              background: 'linear-gradient(90deg, #8b6cbc 0%, #9d7ecc 100%)',
                              borderRadius: 6
                            }
                          }}
                        />
                      </Box>
                    </Paper>

                    {/* Key Information Grid */}
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 2, 
                      flexWrap: 'wrap',
                      '& > *': { flex: 1, minWidth: { xs: '100%', md: 'calc(50% - 12px)' } }
                    }}>
                      {/* Timeline Information */}
                      <Paper elevation={0} sx={{ 
                        p: 2, 
                        borderRadius: 2,
                        border: '1px solid rgba(0,0,0,0.08)',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                          transform: 'translateY(-2px)'
                        }
                      }}>
                        <Typography variant="subtitle2" sx={{ 
                          fontWeight: 700, 
                          mb: 2, 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1,
                          color: '#2c3e50',
                          fontSize: '0.9rem'
                        }}>
                          <Box sx={{
                            bgcolor: 'rgba(139, 108, 188, 0.1)',
                            borderRadius: 1.5,
                            p: 0.75,
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                            <ScheduleIcon sx={{ color: '#8b6cbc', fontSize: 18 }} />
                          </Box>
                          Timeline
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.5 }}>Start Date</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.25, color: '#2c3e50' }}>
                              {selectedProject.startDate && new Date(selectedProject.startDate) && !isNaN(new Date(selectedProject.startDate).getTime())
                                ? format(new Date(selectedProject.startDate), 'MMM dd, yyyy')
                                : 'Not set'
                              }
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.5 }}>End Date</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.25, color: '#2c3e50' }}>
                              {selectedProject.endDate && new Date(selectedProject.endDate) && !isNaN(new Date(selectedProject.endDate).getTime())
                                ? format(new Date(selectedProject.endDate), 'MMM dd, yyyy')
                                : 'Not set'
                              }
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.5 }}>Days Until Deadline</Typography>
                            <Typography variant="body2" sx={{ 
                              fontWeight: 700,
                              mt: 0.25,
                              color: (selectedProject.daysUntilDeadline && selectedProject.daysUntilDeadline < 30) ? 'error.main' : '#2c3e50'
                            }}>
                              {selectedProject.daysUntilDeadline || 'N/A'} days
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>

                      {/* Team Information */}
                      <Paper elevation={0} sx={{ 
                        p: 2, 
                        borderRadius: 2,
                        border: '1px solid rgba(0,0,0,0.08)',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                          transform: 'translateY(-2px)'
                        }
                      }}>
                        <Typography variant="subtitle2" sx={{ 
                          fontWeight: 700, 
                          mb: 2, 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1,
                          color: '#2c3e50',
                          fontSize: '0.9rem'
                        }}>
                          <Box sx={{
                            bgcolor: 'rgba(139, 108, 188, 0.1)',
                            borderRadius: 1.5,
                            p: 0.75,
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                            <TeamIcon sx={{ color: '#8b6cbc', fontSize: 18 }} />
                          </Box>
                          Team
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.5 }}>Project Lead</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.25, color: '#2c3e50' }}>
                              {typeof selectedProject.lead === 'string' 
                                ? selectedProject.lead || 'Not assigned'
                                : selectedProject.lead?.name || 'Not assigned'
                              }
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.5 }}>Team Size</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.25, color: '#2c3e50' }}>
                              {selectedProject.team || 0} members
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.5 }}>Department</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.25, color: '#2c3e50' }}>
                              {selectedProject.department || 'Not specified'}
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    </Box>

                    {/* Milestones Summary */}
                    <Paper elevation={0} sx={{ 
                      p: 2, 
                      borderRadius: 2,
                      border: '1px solid rgba(0,0,0,0.08)',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
                    }}>
                      <Typography variant="subtitle2" sx={{ 
                        fontWeight: 700, 
                        mb: 2, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        color: '#2c3e50',
                        fontSize: '0.9rem'
                      }}>
                        <Box sx={{
                          bgcolor: 'rgba(139, 108, 188, 0.1)',
                          borderRadius: 1.5,
                          p: 0.75,
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <MilestoneIcon sx={{ color: '#8b6cbc', fontSize: 18 }} />
                        </Box>
                        Milestones Summary
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        gap: 3, 
                        flexWrap: 'wrap',
                        '& > *': { flex: 1, minWidth: { xs: '100%', sm: 'calc(25% - 12px)' } }
                      }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#8b6cbc' }}>
                            {selectedProject.milestones?.length || 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">Total</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            {selectedProject.milestones?.filter(m => m.status === 'Completed').length || 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">Completed</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            {selectedProject.milestones?.filter(m => m.status === 'In Progress').length || 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">In Progress</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                            {selectedProject.milestones?.filter(m => m.status === 'Pending').length || 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">Pending</Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Box>
                </Box>
              )}

              {detailsTab === 1 && (
                <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
                  {/* Timeline Tab */}
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimelineIcon sx={{ color: '#8b6cbc' }} />
                    Project Timeline
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Project Start */}
                    <Paper elevation={1} sx={{ p: 2, borderRadius: 2, borderLeft: '4px solid #8b6cbc' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: '#8b6cbc', width: 32, height: 32 }}>
                          <PlayIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            Project Start
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {selectedProject.startDate && new Date(selectedProject.startDate) && !isNaN(new Date(selectedProject.startDate).getTime())
                              ? format(new Date(selectedProject.startDate), 'MMM dd, yyyy')
                              : 'Not set'
                            }
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>

                    {/* Milestones */}
                    {selectedProject.milestones?.map((milestone, index) => (
                      <Paper 
                        key={milestone.id} 
                        elevation={1} 
                        sx={{ 
                          p: 2, 
                          borderRadius: 2,
                          borderLeft: `4px solid ${
                            milestone.status === 'Completed' ? 'green' :
                            milestone.status === 'In Progress' ? 'blue' : 'grey'
                          }`
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          {getMilestoneIcon(milestone.status)}
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {milestone.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Due: {milestone.dueDate && new Date(milestone.dueDate) && !isNaN(new Date(milestone.dueDate).getTime())
                                ? format(new Date(milestone.dueDate), 'MMM dd, yyyy')
                                : 'No due date'
                              }
                            </Typography>
                            {milestone.status === 'In Progress' && milestone.progress && (
                              <Box sx={{ mt: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={milestone.progress}
                                  sx={{ 
                                    height: 4, 
                                    borderRadius: 2,
                                    bgcolor: 'rgba(139, 108, 188, 0.1)',
                                    '& .MuiLinearProgress-bar': {
                                      bgcolor: '#8b6cbc'
                                    }
                                  }}
                                />
                              </Box>
                            )}
                          </Box>
                          <Chip 
                            label={milestone.status} 
                            size="small"
                            color={
                              milestone.status === 'Completed' ? 'success' : 
                              milestone.status === 'In Progress' ? 'primary' : 'default'
                            }
                          />
                        </Box>
                      </Paper>
                    )) || (
                      <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                        <MilestoneIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                        <Typography>No milestones defined</Typography>
                      </Box>
                    )}

                    {/* Project End */}
                    <Paper elevation={1} sx={{ p: 2, borderRadius: 2, borderLeft: '4px solid #8b6cbc' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: '#8b6cbc', width: 32, height: 32 }}>
                          <CheckIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            Project End
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {selectedProject.endDate && new Date(selectedProject.endDate) && !isNaN(new Date(selectedProject.endDate).getTime())
                              ? format(new Date(selectedProject.endDate), 'MMM dd, yyyy')
                              : 'Not set'
                            }
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Box>
                </Box>
              )}

              {detailsTab === 2 && (
                <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
                  {/* Team Tab */}
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TeamIcon sx={{ color: '#8b6cbc' }} />
                    Team Members
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Project Lead */}
                    <Paper elevation={1} sx={{ p: 2.5, borderRadius: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: '#8b6cbc' }}>
                        Project Lead
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: '#8b6cbc', width: 48, height: 48 }}>
                          {typeof selectedProject.lead === 'string' 
                            ? selectedProject.lead?.split(' ').map(n => n[0]).join('') || 'PL'
                            : selectedProject.lead?.name?.split(' ').map(n => n[0]).join('') || 'PL'
                          }
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {typeof selectedProject.lead === 'string' 
                              ? selectedProject.lead || 'Not assigned'
                              : selectedProject.lead?.name || 'Not assigned'
                            }
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Principal Investigator
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>

                    {/* Team Stats */}
                    <Paper elevation={1} sx={{ p: 2.5, borderRadius: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: '#8b6cbc' }}>
                        Team Overview
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        gap: 3, 
                        flexWrap: 'wrap',
                        '& > *': { flex: 1, minWidth: { xs: '100%', sm: 'calc(50% - 12px)' } }
                      }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#8b6cbc' }}>
                            {selectedProject.team || 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">Total Members</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            {Math.floor((selectedProject.team || 0) * 0.8)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">Active Members</Typography>
                        </Box>
                      </Box>
                    </Paper>

                    {/* Team Members List (Mock) */}
                    <Paper elevation={1} sx={{ p: 2.5, borderRadius: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: '#8b6cbc' }}>
                        Team Members
                      </Typography>
                      <List>
                        {Array.from({ length: Math.min(selectedProject.team || 1, 5) }, (_, index) => (
                          <ListItem key={index}>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: index === 0 ? '#8b6cbc' : 'grey.400' }}>
                                {index === 0 
                                  ? (typeof selectedProject.lead === 'string' 
                                      ? selectedProject.lead?.charAt(0) || 'M' 
                                      : selectedProject.lead?.name?.charAt(0) || 'M')
                                  : `M${index + 1}`
                                }
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={index === 0 ? (typeof selectedProject.lead === 'string' ? selectedProject.lead : selectedProject.lead?.name || 'Project Lead') : `Team Member ${index + 1}`}
                              secondary={index === 0 ? 'Principal Investigator' : `Co-Investigator`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  </Box>
                </Box>
              )}

              {detailsTab === 3 && (
                <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
                  {/* Deliverables Tab */}
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TaskIcon sx={{ color: '#8b6cbc' }} />
                    Project Deliverables
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {selectedProject.deliverables?.map((deliverable) => (
                      <Paper 
                        key={deliverable.id} 
                        elevation={1} 
                        sx={{ 
                          p: 2.5, 
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          '&:hover': { 
                            boxShadow: 2,
                            borderColor: '#8b6cbc' 
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                          <Box sx={{ mt: 0.5 }}>
                            {getDeliverableIcon(deliverable.status)}
                          </Box>
                          
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                {deliverable.title}
                              </Typography>
                              <Chip 
                                label={deliverable.status} 
                                size="small"
                                color={
                                  deliverable.status === 'Delivered' ? 'success' : 
                                  deliverable.status === 'In Progress' ? 'primary' : 'default'
                                }
                              />
                            </Box>
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Type:</strong> {deliverable.type}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Due Date:</strong> {deliverable.dueDate && new Date(deliverable.dueDate) && !isNaN(new Date(deliverable.dueDate).getTime())
                                  ? format(new Date(deliverable.dueDate), 'MMM dd, yyyy')
                                  : 'No due date set'
                                }
                              </Typography>
                            </Box>
                            
                            {deliverable.description && (
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                {deliverable.description}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Paper>
                    )) || (
                      <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                        <TaskIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                        <Typography>No deliverables defined</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              )}

              {detailsTab === 4 && (
                <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
                  {/* Activity Tab */}
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ReportIcon sx={{ color: '#8b6cbc' }} />
                    Recent Activity
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Mock Activity Timeline */}
                    {[
                      { 
                        action: 'Project status updated to Active',
                        date: new Date(Date.now() - 86400000 * 2),
                        user: typeof selectedProject.lead === 'string' ? selectedProject.lead || 'System' : selectedProject.lead?.name || 'System',
                        type: 'status'
                      },
                      {
                        action: 'New milestone added: Data Collection Phase',
                        date: new Date(Date.now() - 86400000 * 5),
                        user: typeof selectedProject.lead === 'string' ? selectedProject.lead || 'System' : selectedProject.lead?.name || 'System',
                        type: 'milestone'
                      },
                      {
                        action: 'Team member assigned to project',
                        date: new Date(Date.now() - 86400000 * 7),
                        user: 'Admin',
                        type: 'team'
                      },
                      {
                        action: 'Project created',
                        date: selectedProject.startDate ? new Date(selectedProject.startDate) : new Date(Date.now() - 86400000 * 30),
                        user: typeof selectedProject.lead === 'string' ? selectedProject.lead || 'System' : selectedProject.lead?.name || 'System',
                        type: 'creation'
                      }
                    ].map((activity, index) => (
                      <Paper key={index} elevation={1} sx={{ p: 2.5, borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: activity.type === 'status' ? '#8b6cbc' : 
                                      activity.type === 'milestone' ? 'primary.main' :
                                      activity.type === 'team' ? 'success.main' : 'grey.500',
                              width: 32, 
                              height: 32 
                            }}
                          >
                            {activity.type === 'status' ? <EditIcon /> :
                             activity.type === 'milestone' ? <MilestoneIcon /> :
                             activity.type === 'team' ? <TeamIcon /> : <AddIcon />}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {activity.action}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {format(activity.date, 'MMM dd, yyyy • h:mm a')} • by {activity.user}
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                </Box>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default ProjectStatusPage;