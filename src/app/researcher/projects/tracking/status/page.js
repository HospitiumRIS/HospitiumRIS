'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Slider,
  Snackbar,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Assignment as DeliverableIcon,
  AttachFile as AttachFileIcon,
  Cancel as BlockedIcon,
  CheckCircle as CheckIcon,
  Clear as ClearIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteOutlineIcon,
  Description as ReportIcon,
  Edit as EditIcon,
  Flag as MilestoneIcon,
  Group as TeamIcon,
  Home as HomeIcon,
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon,
  Link as LinkIcon,
  PlayArrow as PlayIcon,
  RadioButtonUnchecked as PendingIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  Search as SearchIcon,
  TrackChanges as TrackIcon,
  Timeline as TimelineIcon,
  Visibility as ViewIcon,
  WarningAmber as OverdueIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import PageHeader from '../../../../../components/common/PageHeader';
import TipTapEditor from '../../../../../components/common/TipTapEditor';

const PURPLE = '#8b6cbc';
const dialogLock = { disableScrollLock: true };
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

const htmlSx = {
  color: '#334155',
  lineHeight: 1.65,
  fontSize: '0.9rem',
  '& p': { m: 0, mb: 1 },
  '& p:last-child': { mb: 0 },
  '& ul, & ol': { m: 0, pl: 2.5, mb: 1 },
};

const isEmptyHtml = (value) => !value || String(value).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').trim() === '';
const looksLikeHtml = (value) => typeof value === 'string' && /<\/?[a-z][\s\S]*>/i.test(value);

function HtmlContent({ value, empty = 'Not provided' }) {
  if (isEmptyHtml(value)) {
    return <Typography variant="body2" color="text.secondary">{empty}</Typography>;
  }
  if (!looksLikeHtml(value)) {
    return <Typography variant="body2" sx={{ color: '#334155', whiteSpace: 'pre-wrap' }}>{value}</Typography>;
  }
  return <Box sx={htmlSx} dangerouslySetInnerHTML={{ __html: value }} />;
}

const normalizeItemStatus = (status) => {
  if (!status) return 'Pending';
  const normalized = String(status).trim().toLowerCase().replace(/_/g, ' ');
  return {
    completed: 'Completed',
    pending: 'Pending',
    'in progress': 'In Progress',
    delivered: 'Delivered',
    blocked: 'Blocked',
  }[normalized] || status;
};

const isCompletedStatus = (status) => normalizeItemStatus(status) === 'Completed';
const isPendingStatus = (status) => ['Pending', 'In Progress'].includes(normalizeItemStatus(status));

const formatDisplayDate = (dateValue) => {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return format(date, 'MMM d, yyyy');
};

const toDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'P';

const formatMoney = (amount, currency = 'USD') => {
  if (amount == null || amount === '') return 'Not set';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(amount));
  } catch {
    return `${amount}`;
  }
};

const personName = (person) => person?.name
  || [person?.givenName, person?.familyName].filter(Boolean).join(' ')
  || person?.email
  || 'Co-investigator';

const deriveUrgency = (days) => {
  if (days == null) return 'none';
  if (days < 0) return 'overdue';
  if (days <= 7) return 'soon';
  return 'ontrack';
};

const STATUS_TONE = {
  Active: { bg: '#16a34a', color: '#fff' },
  Planning: { bg: '#0284c7', color: '#fff' },
  Completed: { bg: PURPLE, color: '#fff' },
  'On Hold': { bg: '#d97706', color: '#fff' },
  Review: { bg: '#64748b', color: '#fff' },
};

const ITEM_TONE = {
  Completed: { bg: '#dcfce7', color: '#166534' },
  Delivered: { bg: '#dcfce7', color: '#166534' },
  'In Progress': { bg: alpha(PURPLE, 0.12), color: PURPLE },
  Blocked: { bg: '#fee2e2', color: '#b91c1c' },
  Pending: { bg: '#f1f5f9', color: '#475569' },
};

const URGENCY_TONE = {
  overdue: { label: 'Overdue', bg: '#fee2e2', color: '#b91c1c' },
  soon: { label: 'Due this week', bg: '#ffedd5', color: '#c2410c' },
  ontrack: { label: 'On track', bg: '#dcfce7', color: '#166534' },
  none: { label: 'No deadline', bg: '#f1f5f9', color: '#64748b' },
};

function StatusChip({ status }) {
  const tone = STATUS_TONE[status] || STATUS_TONE.Planning;
  return (
    <Chip
      size="small"
      label={status}
      sx={{ bgcolor: tone.bg, color: tone.color, fontWeight: 700, height: 24 }}
    />
  );
}

function ItemChip({ status }) {
  const label = normalizeItemStatus(status);
  const tone = ITEM_TONE[label] || ITEM_TONE.Pending;
  return <Chip size="small" label={label} sx={{ bgcolor: tone.bg, color: tone.color, fontWeight: 700, height: 22, fontSize: '0.7rem' }} />;
}

function UrgencyChip({ days }) {
  const tone = URGENCY_TONE[deriveUrgency(days)];
  return <Chip size="small" label={tone.label} sx={{ bgcolor: tone.bg, color: tone.color, fontWeight: 700, height: 22 }} />;
}

function StatCard({ label, value, caption, icon }) {
  return (
    <Paper sx={{ flex: 1, minWidth: 180, p: 2, borderRadius: 2, bgcolor: PURPLE, color: 'white', position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 700 }}>{label}</Typography>
        {icon}
      </Stack>
      <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>{value}</Typography>
      <Typography variant="caption" sx={{ opacity: 0.75 }}>{caption}</Typography>
    </Paper>
  );
}

const mapMilestoneFromRaw = (milestone, index) => ({
  id: milestone.id || `ms-${index}`,
  milestoneIndex: index,
  title: milestone.title || milestone.name || `Milestone ${index + 1}`,
  status: normalizeItemStatus(milestone.status),
  dueDate: milestone.dueDate || milestone.targetDate || '',
  completedDate: milestone.completedDate || '',
  description: milestone.description || '',
  progress: Number(milestone.progress) || 0,
  notes: milestone.notes || '',
  completionCriteria: milestone.completionCriteria || '',
  blockers: milestone.blockers || '',
  linkedDeliverableIds: milestone.linkedDeliverableIds || [],
  documents: Array.isArray(milestone.documents) ? milestone.documents : [],
});

const mapDeliverableFromRaw = (deliverable, index) => ({
  id: deliverable.id || `dl-${index}`,
  deliverableIndex: index,
  title: deliverable.title || deliverable.name || `Deliverable ${index + 1}`,
  description: deliverable.description || '',
  status: normalizeItemStatus(deliverable.status),
  dueDate: deliverable.dueDate || deliverable.deadline || '',
  type: deliverable.type || 'Document',
  notes: deliverable.notes || '',
  completionCriteria: deliverable.completionCriteria || '',
  linkedMilestoneIds: deliverable.linkedMilestoneIds || deliverable.milestoneId ? [deliverable.milestoneId].filter(Boolean) : [],
  documents: Array.isArray(deliverable.documents) ? deliverable.documents : [],
});

const transformProposalToProject = (proposal) => {
  const milestones = (proposal.milestones || []).map(mapMilestoneFromRaw);
  const completedMilestones = milestones.filter((item) => isCompletedStatus(item.status)).length;
  const progress = milestones.length ? Math.round((completedMilestones / milestones.length) * 100) : 0;
  const endDate = proposal.endDate || proposal.grantEndDate;
  const end = endDate ? new Date(endDate) : null;
  const daysUntilDeadline = end && !Number.isNaN(end.getTime())
    ? Math.ceil((end.getTime() - Date.now()) / 86400000)
    : null;
  const statusMap = {
    DRAFT: 'Planning',
    SUBMITTED: 'Review',
    UNDER_REVIEW: 'Review',
    APPROVED: 'Active',
    REJECTED: 'On Hold',
    REVISION_REQUESTED: 'Planning',
  };
  const pending = milestones.filter((item) => isPendingStatus(item.status));
  const team = [
    {
      name: proposal.principalInvestigator || 'Principal investigator',
      role: 'Principal Investigator',
      orcid: proposal.principalInvestigatorOrcid || '',
    },
    ...(proposal.coInvestigators || []).map((person) => ({
      name: personName(person),
      role: person.role || 'Co-investigator',
      affiliation: person.affiliation || person.institution || person.department || '',
    })),
  ];
  const statusHistory = (proposal.otherRelatedFiles || []).filter((item) => item?.category === 'status_change');

  return {
    id: proposal.id,
    title: proposal.title,
    description: proposal.abstract || proposal.researchObjectives || '',
    status: statusMap[proposal.status] || 'Planning',
    proposalStatus: proposal.status,
    progress,
    startDate: proposal.startDate || proposal.grantStartDate,
    endDate,
    departments: proposal.departments || [],
    researchAreas: proposal.researchAreas || [],
    team,
    teamCount: team.length,
    completedTasks: completedMilestones,
    totalTasks: milestones.length,
    budget: proposal.totalBudgetAmount ? Number(proposal.totalBudgetAmount) : 0,
    budgetCurrency: proposal.budgetCurrency || 'USD',
    lastUpdate: proposal.updatedAt,
    lead: { name: proposal.principalInvestigator || 'Unknown PI' },
    nextMilestone: pending[0]?.title || (milestones.length ? 'All milestones completed' : 'No milestones defined'),
    daysUntilDeadline,
    milestones,
    deliverables: (proposal.deliverables || []).map(mapDeliverableFromRaw),
    statusHistory,
  };
};

const emptyMilestoneForm = {
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
};

const emptyDeliverableForm = {
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
};

function TimelineRail({ items }) {
  if (!items.length) {
    return <Typography variant="body2" color="text.secondary">No timeline items yet.</Typography>;
  }
  return (
    <Stack spacing={0}>
      {items.map((item, index) => (
        <Box key={item.id} sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28 }}>
            <Box sx={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              bgcolor: alpha(item.color || PURPLE, 0.12),
              color: item.color || PURPLE,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            >
              {item.icon}
            </Box>
            {index < items.length - 1 ? <Box sx={{ width: 2, flex: 1, minHeight: 22, bgcolor: alpha(PURPLE, 0.16), my: 0.5 }} /> : null}
          </Box>
          <Box sx={{ flex: 1, mb: 1.5, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
            <Stack direction="row" justifyContent="space-between" spacing={1} flexWrap="wrap">
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{item.title}</Typography>
              <Typography variant="caption" sx={{ color: PURPLE, fontWeight: 700 }}>{item.date || 'Date not set'}</Typography>
            </Stack>
            {item.meta ? <Box sx={{ mt: 0.5 }}>{item.meta}</Box> : null}
            {item.description ? <Box sx={{ mt: 1 }}><HtmlContent value={item.description} empty="" /></Box> : null}
          </Box>
        </Box>
      ))}
    </Stack>
  );
}

export default function ProjectStatusPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterUrgency, setFilterUrgency] = useState('All');
  const [expandedRows, setExpandedRows] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedProject, setSelectedProject] = useState(null);
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(false);
  const [viewDetailsDialog, setViewDetailsDialog] = useState(false);
  const [detailsTab, setDetailsTab] = useState(0);
  const [statusUpdate, setStatusUpdate] = useState({ newStatus: '', reason: '', notes: '', effectiveDate: '' });
  const [savingStatus, setSavingStatus] = useState(false);
  const [milestoneDialog, setMilestoneDialog] = useState(false);
  const [milestoneDialogMode, setMilestoneDialogMode] = useState('edit');
  const [milestoneEditContext, setMilestoneEditContext] = useState(null);
  const [savingMilestone, setSavingMilestone] = useState(false);
  const [milestoneEditForm, setMilestoneEditForm] = useState(emptyMilestoneForm);
  const [deliverableDialog, setDeliverableDialog] = useState(false);
  const [deliverableDialogMode, setDeliverableDialogMode] = useState('edit');
  const [deliverableEditContext, setDeliverableEditContext] = useState(null);
  const [savingDeliverable, setSavingDeliverable] = useState(false);
  const [deliverableEditForm, setDeliverableEditForm] = useState(emptyDeliverableForm);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/proposals?limit=100');
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to load projects');
      setProjects(
        (data.proposals || [])
          .map(transformProposalToProject)
          .filter((project) => project.status !== 'Review')
      );
    } catch (err) {
      setError(err.message || 'Failed to load projects');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const stats = useMemo(() => ({
    total: projects.length,
    active: projects.filter((item) => item.status === 'Active').length,
    overdue: projects.filter((item) => (item.daysUntilDeadline ?? 1) < 0).length,
    upcoming: projects.filter((item) => item.daysUntilDeadline > 0 && item.daysUntilDeadline <= 7).length,
    avgProgress: projects.length ? Math.round(projects.reduce((sum, item) => sum + (item.progress || 0), 0) / projects.length) : 0,
    totalBudget: projects.reduce((sum, item) => sum + (item.budget || 0), 0),
    teamMembers: projects.reduce((sum, item) => sum + (item.teamCount || 0), 0),
    completedTasks: projects.reduce((sum, item) => sum + (item.completedTasks || 0), 0),
    pendingTasks: projects.reduce((sum, item) => sum + Math.max(0, (item.totalTasks || 0) - (item.completedTasks || 0)), 0),
  }), [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const haystack = `${project.title} ${project.lead.name} ${(project.departments || []).join(' ')}`.toLowerCase();
      const matchesSearch = !search || haystack.includes(search.toLowerCase());
      const matchesStatus = filterStatus === 'All' || project.status === filterStatus;
      const matchesUrgency = filterUrgency === 'All' || deriveUrgency(project.daysUntilDeadline) === filterUrgency;
      return matchesSearch && matchesStatus && matchesUrgency;
    });
  }, [projects, search, filterStatus, filterUrgency]);

  const pagedProjects = filteredProjects.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleToggleRow = (projectId) => {
    setExpandedRows((prev) => ({ ...prev, [projectId]: !prev[projectId] }));
  };

  const closeMilestoneDialog = () => {
    setMilestoneDialog(false);
    setMilestoneEditContext(null);
    setMilestoneEditForm(emptyMilestoneForm);
  };

  const closeDeliverableDialog = () => {
    setDeliverableDialog(false);
    setDeliverableEditContext(null);
    setDeliverableEditForm(emptyDeliverableForm);
  };

  const closeStatusUpdateDialog = () => {
    setStatusUpdateDialog(false);
    setSelectedProject(null);
    setStatusUpdate({ newStatus: '', reason: '', notes: '', effectiveDate: '' });
  };

  const openStatusUpdateDialog = (project) => {
    setSelectedProject(project);
    setStatusUpdate({
      newStatus: project.status,
      reason: '',
      notes: '',
      effectiveDate: new Date().toISOString().split('T')[0],
    });
    setStatusUpdateDialog(true);
  };

  const openMilestoneEditor = (milestone, projectId) => {
    const project = projects.find((item) => item.id === projectId);
    if (!project) return;
    setMilestoneDialogMode('edit');
    setMilestoneEditContext({
      projectId,
      milestoneIndex: milestone.milestoneIndex ?? project.milestones.findIndex((item) => item.id === milestone.id),
      deliverables: project.deliverables || [],
    });
    setMilestoneEditForm({
      ...emptyMilestoneForm,
      title: milestone.title || '',
      status: normalizeItemStatus(milestone.status),
      dueDate: toDateInput(milestone.dueDate),
      completedDate: toDateInput(milestone.completedDate),
      description: milestone.description || '',
      progress: milestone.progress || 0,
      notes: milestone.notes || '',
      completionCriteria: milestone.completionCriteria || '',
      blockers: milestone.blockers || '',
      linkedDeliverableIds: milestone.linkedDeliverableIds || [],
      documents: milestone.documents || [],
    });
    setMilestoneDialog(true);
  };

  const openNewMilestone = (projectId) => {
    const project = projects.find((item) => item.id === projectId);
    if (!project) return;
    setSelectedProject(project);
    setMilestoneDialogMode('create');
    setMilestoneEditContext({ projectId, milestoneIndex: -1, deliverables: project.deliverables || [] });
    setMilestoneEditForm({ ...emptyMilestoneForm, dueDate: toDateInput(project.endDate) });
    setMilestoneDialog(true);
  };

  const openDeliverableEditor = (deliverable, projectId) => {
    const project = projects.find((item) => item.id === projectId);
    if (!project) return;
    setDeliverableDialogMode('edit');
    setDeliverableEditContext({
      projectId,
      deliverableIndex: deliverable.deliverableIndex ?? project.deliverables.findIndex((item) => item.id === deliverable.id),
      milestones: project.milestones || [],
    });
    setDeliverableEditForm({
      ...emptyDeliverableForm,
      title: deliverable.title || '',
      type: deliverable.type || 'Document',
      status: normalizeItemStatus(deliverable.status),
      dueDate: toDateInput(deliverable.dueDate),
      description: deliverable.description || '',
      notes: deliverable.notes || '',
      completionCriteria: deliverable.completionCriteria || '',
      linkedMilestoneIds: deliverable.linkedMilestoneIds || [],
      documents: deliverable.documents || [],
    });
    setDeliverableDialog(true);
  };

  const openNewDeliverable = (projectId) => {
    const project = projects.find((item) => item.id === projectId);
    if (!project) return;
    setSelectedProject(project);
    setDeliverableDialogMode('create');
    setDeliverableEditContext({ projectId, deliverableIndex: -1, milestones: project.milestones || [] });
    setDeliverableEditForm({ ...emptyDeliverableForm, dueDate: toDateInput(project.endDate) });
    setDeliverableDialog(true);
  };

  const applyMilestoneResult = (projectId, remappedMilestones) => {
    const completedCount = remappedMilestones.filter((item) => isCompletedStatus(item.status)).length;
    const pending = remappedMilestones.filter((item) => isPendingStatus(item.status));
    setProjects((prev) => prev.map((project) => (
      project.id === projectId
        ? {
            ...project,
            milestones: remappedMilestones,
            progress: remappedMilestones.length ? Math.round((completedCount / remappedMilestones.length) * 100) : 0,
            completedTasks: completedCount,
            totalTasks: remappedMilestones.length,
            nextMilestone: pending[0]?.title || (remappedMilestones.length ? 'All milestones completed' : 'No milestones defined'),
          }
        : project
    )));
  };

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
      if (!response.ok || !result.success) throw new Error(result.error || 'Failed to update status');
      setProjects((prev) => prev.map((project) => (
        project.id === selectedProject.id
          ? {
              ...project,
              status: statusUpdate.newStatus,
              lastUpdate: new Date().toISOString(),
              statusHistory: [
                ...(project.statusHistory || []),
                {
                  category: 'status_change',
                  fromStatus: selectedProject.status,
                  toStatus: statusUpdate.newStatus,
                  reason: statusUpdate.reason,
                  changedAt: new Date().toISOString(),
                },
              ],
            }
          : project
      )));
      closeStatusUpdateDialog();
      setNotice(`Status updated to ${statusUpdate.newStatus}.`);
    } catch (err) {
      setError(err.message || 'Failed to update project status');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleSaveMilestone = async () => {
    if (!milestoneEditContext || !milestoneEditForm.title.trim()) return;
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

      let response;
      if (milestoneDialogMode === 'create') {
        response = await fetch(`/api/proposals/${milestoneEditContext.projectId}/milestones`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ milestoneData: payload }),
        });
      } else {
        const formData = new FormData();
        formData.append('milestoneIndex', String(milestoneEditContext.milestoneIndex));
        formData.append('milestoneData', JSON.stringify(payload));
        milestoneEditForm.pendingFiles.forEach((file) => formData.append('documents', file));
        response = await fetch(`/api/proposals/${milestoneEditContext.projectId}/milestones`, {
          method: 'PATCH',
          body: formData,
        });
      }

      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Failed to save milestone');
      applyMilestoneResult(milestoneEditContext.projectId, (result.milestones || []).map(mapMilestoneFromRaw));
      closeMilestoneDialog();
      setNotice(milestoneDialogMode === 'create' ? 'Milestone added.' : 'Milestone updated.');
    } catch (err) {
      setError(err.message || 'Failed to save milestone');
    } finally {
      setSavingMilestone(false);
    }
  };

  const handleSaveDeliverable = async () => {
    if (!deliverableEditContext || !deliverableEditForm.title.trim()) return;
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
      deliverableEditForm.pendingFiles.forEach((file) => formData.append('documents', file));
      const isCreate = deliverableDialogMode === 'create';
      if (!isCreate) formData.append('deliverableIndex', String(deliverableEditContext.deliverableIndex));
      const response = await fetch(`/api/proposals/${deliverableEditContext.projectId}/deliverables`, {
        method: isCreate ? 'POST' : 'PATCH',
        body: formData,
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Failed to save deliverable');
      setProjects((prev) => prev.map((project) => (
        project.id === deliverableEditContext.projectId
          ? { ...project, deliverables: (result.deliverables || []).map(mapDeliverableFromRaw) }
          : project
      )));
      closeDeliverableDialog();
      setNotice(isCreate ? 'Deliverable added.' : 'Deliverable updated.');
    } catch (err) {
      setError(err.message || 'Failed to save deliverable');
    } finally {
      setSavingDeliverable(false);
    }
  };

  const renderDocumentUploadSection = (form, setForm, allowUpload = true) => (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.25, display: 'flex', alignItems: 'center', gap: 1 }}>
        <AttachFileIcon sx={{ fontSize: 18, color: PURPLE }} />
        Supporting documents
      </Typography>
      {allowUpload ? (
        <Paper variant="outlined" sx={{ p: 2, mb: 1.5, borderRadius: 2, borderStyle: 'dashed', borderColor: alpha(PURPLE, 0.35), bgcolor: alpha(PURPLE, 0.03), textAlign: 'center' }}>
          <Button
            component="label"
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            sx={{ borderColor: PURPLE, color: PURPLE, textTransform: 'none', fontWeight: 700 }}
          >
            Upload documents
            <input
              hidden
              multiple
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.csv,.txt,.zip"
              onChange={(event) => {
                const files = Array.from(event.target.files || []);
                if (!files.length) return;
                setForm((prev) => ({ ...prev, pendingFiles: [...prev.pendingFiles, ...files] }));
                event.target.value = '';
              }}
            />
          </Button>
        </Paper>
      ) : (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          Save the milestone first, then edit it to attach files.
        </Typography>
      )}
      {[...form.documents, ...form.pendingFiles].length === 0 ? (
        <Typography variant="body2" color="text.secondary">No documents attached yet.</Typography>
      ) : (
        <List dense disablePadding>
          {[
            ...form.documents.map((doc) => ({ ...doc, pending: false })),
            ...form.pendingFiles.map((file, index) => ({
              id: `pending-${index}-${file.name}`,
              originalName: file.name,
              pending: true,
              file,
            })),
          ].map((doc) => (
            <ListItem
              key={doc.id}
              sx={{ px: 1.5, py: 1, mb: 0.75, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}
              secondaryAction={
                <IconButton
                  edge="end"
                  size="small"
                  onClick={() => {
                    if (doc.pending) {
                      setForm((prev) => ({ ...prev, pendingFiles: prev.pendingFiles.filter((file) => file !== doc.file) }));
                    } else {
                      setForm((prev) => ({
                        ...prev,
                        documents: prev.documents.filter((item) => item.id !== doc.id),
                        removedDocumentIds: [...prev.removedDocumentIds, doc.id],
                      }));
                    }
                  }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              }
            >
              <ListItemIcon sx={{ minWidth: 36 }}><AttachFileIcon sx={{ color: PURPLE }} /></ListItemIcon>
              <ListItemText primary={doc.originalName || doc.fileName || 'Document'} secondary={doc.pending ? 'Ready to upload' : 'Uploaded'} />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );

  const getMilestoneIcon = (status) => {
    const normalized = normalizeItemStatus(status);
    if (normalized === 'Completed') return <CheckIcon sx={{ color: '#16a34a', fontSize: 18 }} />;
    if (normalized === 'In Progress') return <PlayIcon sx={{ color: PURPLE, fontSize: 18 }} />;
    if (normalized === 'Blocked') return <BlockedIcon sx={{ color: '#dc2626', fontSize: 18 }} />;
    return <PendingIcon sx={{ color: '#94a3b8', fontSize: 18 }} />;
  };

  const buildProjectTimeline = (project) => {
    const items = [];
    if (project.startDate) {
      items.push({
        id: `${project.id}-start`,
        title: 'Project start',
        date: formatDisplayDate(project.startDate),
        icon: <PlayIcon sx={{ fontSize: 16 }} />,
        color: PURPLE,
      });
    }
    project.milestones.forEach((item) => {
      items.push({
        id: `ms-${item.id}`,
        title: item.title,
        date: formatDisplayDate(item.dueDate),
        description: item.description,
        meta: <ItemChip status={item.status} />,
        icon: <MilestoneIcon sx={{ fontSize: 16 }} />,
        color: normalizeItemStatus(item.status) === 'Blocked' ? '#dc2626' : PURPLE,
        sortDate: item.dueDate,
      });
    });
    project.deliverables.forEach((item) => {
      items.push({
        id: `dl-${item.id}`,
        title: item.title,
        date: formatDisplayDate(item.dueDate),
        description: item.description,
        meta: <Stack direction="row" spacing={0.75}><ItemChip status={item.status} /><Chip size="small" label={item.type} sx={{ height: 22 }} /></Stack>,
        icon: <DeliverableIcon sx={{ fontSize: 16 }} />,
        color: '#0284c7',
        sortDate: item.dueDate,
      });
    });
    if (project.endDate) {
      items.push({
        id: `${project.id}-end`,
        title: 'Project end',
        date: formatDisplayDate(project.endDate),
        meta: <UrgencyChip days={project.daysUntilDeadline} />,
        icon: <CheckIcon sx={{ fontSize: 16 }} />,
        color: (project.daysUntilDeadline ?? 0) < 0 ? '#dc2626' : PURPLE,
      });
    }
    return items;
  };

  const renderTrackingSection = (project, type) => {
    const isMilestone = type === 'milestones';
    const items = isMilestone ? project.milestones : project.deliverables;
    const Icon = isMilestone ? MilestoneIcon : DeliverableIcon;
    return (
      <Paper elevation={0} sx={{ height: '100%', borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.25, bgcolor: alpha(PURPLE, 0.06) }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Icon sx={{ fontSize: 18, color: PURPLE }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{isMilestone ? 'Milestones' : 'Deliverables'}</Typography>
            <Chip label={items.length} size="small" sx={{ height: 20, bgcolor: alpha(PURPLE, 0.12), color: PURPLE, fontWeight: 700 }} />
          </Stack>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => (isMilestone ? openNewMilestone(project.id) : openNewDeliverable(project.id))}
            sx={{ textTransform: 'none', color: PURPLE, fontWeight: 700 }}
          >
            Add
          </Button>
        </Stack>
        {items.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {isMilestone ? 'No milestones defined yet' : 'No deliverables defined yet'}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {items.map((item, index) => (
              <React.Fragment key={item.id}>
                {index > 0 ? <Divider /> : null}
                <ListItem
                  sx={{ py: 1.5, px: 2, alignItems: 'flex-start', '&:hover': { bgcolor: alpha(PURPLE, 0.03) } }}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      size="small"
                      sx={{ color: PURPLE }}
                      onClick={() => (isMilestone ? openMilestoneEditor(item, project.id) : openDeliverableEditor(item, project.id))}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemIcon sx={{ minWidth: 36, mt: 0.25 }}>
                    {isMilestone ? getMilestoneIcon(item.status) : getMilestoneIcon(item.status === 'Delivered' ? 'Completed' : item.status)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ pr: 4 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.title}</Typography>
                        <ItemChip status={item.status} />
                      </Stack>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        {!isMilestone ? <Typography variant="caption" color="text.secondary" display="block">{item.type}</Typography> : null}
                        <Typography variant="caption" color="text.secondary">Due {formatDisplayDate(item.dueDate) || 'Not set'}</Typography>
                        {isMilestone && item.status === 'In Progress' && item.progress > 0 ? (
                          <LinearProgress
                            variant="determinate"
                            value={item.progress}
                            sx={{ mt: 1, maxWidth: 220, height: 4, borderRadius: 2, bgcolor: alpha(PURPLE, 0.12), '& .MuiLinearProgress-bar': { bgcolor: PURPLE } }}
                          />
                        ) : null}
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

  const fieldSx = {
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: PURPLE },
    '& .MuiInputLabel-root.Mui-focused': { color: PURPLE },
  };

  return (
    <Box>
      <PageHeader
        title="Project status tracking"
        description="Monitor progress, update milestones and deliverables, and keep the project record current."
        icon={<TrackIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/researcher' },
          { label: 'Proposals', path: '/researcher/projects/proposals/list' },
          { label: 'Status tracking' },
        ]}
        actionButton={
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={loadProjects}
            sx={{ bgcolor: 'white', color: PURPLE, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#f5f5f5' } }}
          >
            Refresh
          </Button>
        }
      />

      <Container maxWidth={false} sx={{ py: 3, maxWidth: '1600px', mx: 'auto' }}>
        {error ? <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert> : null}

        {loading ? (
          <Box sx={{ py: 10, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress sx={{ color: PURPLE }} />
          </Box>
        ) : (
          <>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2.5 }}>
              <StatCard label="Total projects" value={stats.total} caption="Approved and planning records" icon={<TrackIcon sx={{ fontSize: 18 }} />} />
              <StatCard label="Active" value={stats.active} caption="Currently in progress" icon={<PlayIcon sx={{ fontSize: 18 }} />} />
              <StatCard label="Overdue" value={stats.overdue} caption="Past the project end date" icon={<OverdueIcon sx={{ fontSize: 18 }} />} />
              <StatCard label="Due this week" value={stats.upcoming} caption="Ending in the next 7 days" icon={<ScheduleIcon sx={{ fontSize: 18 }} />} />
            </Stack>

            <Paper sx={{ mb: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Tabs
                value={currentTab}
                onChange={(_, value) => setCurrentTab(value)}
                variant="scrollable"
                sx={{
                  '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, minHeight: 52, color: '#64748b' },
                  '& .Mui-selected': { color: `${PURPLE} !important` },
                  '& .MuiTabs-indicator': { backgroundColor: PURPLE, height: 3 },
                }}
              >
                <Tab icon={<TrackIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="All projects" />
                <Tab icon={<TimelineIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Timeline" />
                <Tab icon={<TeamIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Teams" />
                <Tab icon={<ReportIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Reports" />
              </Tabs>
            </Paper>

            {currentTab === 0 && (
              <Box>
                <Paper sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Search by title, PI, or department"
                      value={search}
                      onChange={(event) => { setSearch(event.target.value); setPage(0); }}
                      InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                      sx={fieldSx}
                    />
                    <TextField select size="small" label="Status" value={filterStatus} onChange={(event) => { setFilterStatus(event.target.value); setPage(0); }} sx={{ minWidth: 170, ...fieldSx }}>
                      <MenuItem value="All">All statuses</MenuItem>
                      <MenuItem value="Active">Active</MenuItem>
                      <MenuItem value="Planning">Planning</MenuItem>
                      <MenuItem value="Completed">Completed</MenuItem>
                      <MenuItem value="On Hold">On hold</MenuItem>
                    </TextField>
                    <TextField select size="small" label="Deadline" value={filterUrgency} onChange={(event) => { setFilterUrgency(event.target.value); setPage(0); }} sx={{ minWidth: 180, ...fieldSx }}>
                      <MenuItem value="All">All deadlines</MenuItem>
                      <MenuItem value="overdue">Overdue</MenuItem>
                      <MenuItem value="soon">Due this week</MenuItem>
                      <MenuItem value="ontrack">On track</MenuItem>
                      <MenuItem value="none">No deadline</MenuItem>
                    </TextField>
                    <Button startIcon={<ClearIcon />} onClick={() => { setSearch(''); setFilterStatus('All'); setFilterUrgency('All'); }} sx={{ color: PURPLE, textTransform: 'none', fontWeight: 700 }}>
                      Clear
                    </Button>
                  </Stack>
                </Paper>

                {pagedProjects.length === 0 ? (
                  <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 2, border: '1px dashed', borderColor: alpha(PURPLE, 0.3) }}>
                    <TrackIcon sx={{ fontSize: 42, color: '#cbd5e1', mb: 1 }} />
                    <Typography variant="h6" color="text.secondary">No projects match these filters</Typography>
                  </Paper>
                ) : (
                  <Stack spacing={1.5}>
                    {pagedProjects.map((project) => {
                      const isExpanded = Boolean(expandedRows[project.id]);
                      return (
                        <Paper key={project.id} elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                          <Box
                            onClick={() => handleToggleRow(project.id)}
                            sx={{ px: 2, py: 2, display: 'flex', gap: 1.5, cursor: 'pointer', bgcolor: isExpanded ? alpha(PURPLE, 0.03) : 'white', '&:hover': { bgcolor: alpha(PURPLE, 0.04) } }}
                          >
                            <IconButton size="small" onClick={(event) => { event.stopPropagation(); handleToggleRow(project.id); }} sx={{ color: PURPLE, mt: 0.25 }}>
                              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{project.title}</Typography>
                                <StatusChip status={project.status} />
                                <UrgencyChip days={project.daysUntilDeadline} />
                              </Stack>
                              <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 0.5, md: 2.5 }} sx={{ color: 'text.secondary' }}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <LinearProgress
                                    variant="determinate"
                                    value={project.progress}
                                    sx={{ width: 80, height: 6, borderRadius: 3, bgcolor: alpha(PURPLE, 0.12), '& .MuiLinearProgress-bar': { bgcolor: PURPLE } }}
                                  />
                                  <Typography variant="caption" sx={{ fontWeight: 700, color: PURPLE }}>{project.progress}%</Typography>
                                </Stack>
                                <Typography variant="caption">Lead: {project.lead.name}</Typography>
                                <Typography variant="caption" noWrap title={project.nextMilestone}>Next: {project.nextMilestone}</Typography>
                                <Typography variant="caption">Due: {formatDisplayDate(project.endDate) || 'Not set'}</Typography>
                              </Stack>
                            </Box>
                            <Stack direction="row" spacing={0.5} onClick={(event) => event.stopPropagation()}>
                              <Tooltip title="View details">
                                <IconButton size="small" sx={{ color: PURPLE }} onClick={() => { setSelectedProject(project); setDetailsTab(0); setViewDetailsDialog(true); }}>
                                  <ViewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Update status">
                                <IconButton size="small" sx={{ color: '#64748b' }} onClick={() => openStatusUpdateDialog(project)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </Box>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ px: 2, pb: 2, bgcolor: '#fafbfd', borderTop: '1px solid', borderColor: 'divider' }}>
                              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ pt: 2 }}>
                                <Box sx={{ flex: 1 }}>{renderTrackingSection(project, 'milestones')}</Box>
                                <Box sx={{ flex: 1 }}>{renderTrackingSection(project, 'deliverables')}</Box>
                              </Stack>
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
                  onPageChange={(_, next) => setPage(next)}
                  onRowsPerPageChange={(event) => { setRowsPerPage(parseInt(event.target.value, 10)); setPage(0); }}
                  sx={{ mt: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
                />
              </Box>
            )}

            {currentTab === 1 && (
              <Stack spacing={2}>
                {projects.length ? projects.map((project) => (
                  <Paper key={project.id} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>{project.title}</Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <StatusChip status={project.status} />
                        <UrgencyChip days={project.daysUntilDeadline} />
                      </Stack>
                    </Stack>
                    <TimelineRail items={buildProjectTimeline(project)} />
                  </Paper>
                )) : (
                  <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}><Typography color="text.secondary">No projects to show on the timeline.</Typography></Paper>
                )}
              </Stack>
            )}

            {currentTab === 2 && (
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <StatCard label="People on projects" value={stats.teamMembers} caption="Investigators across all records" icon={<TeamIcon sx={{ fontSize: 18 }} />} />
                  <StatCard label="Completed milestones" value={stats.completedTasks} caption="Finished across all projects" icon={<CheckIcon sx={{ fontSize: 18 }} />} />
                  <StatCard label="Open milestones" value={stats.pendingTasks} caption="Still pending or in progress" icon={<PendingIcon sx={{ fontSize: 18 }} />} />
                </Stack>
                {projects.map((project) => (
                  <Paper key={project.id} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1} sx={{ mb: 1.5 }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{project.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{(project.departments || []).join(' · ') || 'No department listed'}</Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: PURPLE, fontWeight: 700 }}>{project.progress}% complete</Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={project.progress} sx={{ mb: 2, height: 6, borderRadius: 3, bgcolor: alpha(PURPLE, 0.12), '& .MuiLinearProgress-bar': { bgcolor: PURPLE } }} />
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {project.team.map((member, index) => (
                        <Chip
                          key={`${project.id}-${member.name}-${index}`}
                          avatar={<Avatar sx={{ bgcolor: PURPLE, color: 'white' }}>{initials(member.name)}</Avatar>}
                          label={`${member.name} · ${member.role}`}
                          sx={{ bgcolor: alpha(PURPLE, 0.06) }}
                        />
                      ))}
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}

            {currentTab === 3 && (
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <Paper sx={{ flex: 1, p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Progress</Typography>
                    <LinearProgress variant="determinate" value={stats.avgProgress} sx={{ height: 8, borderRadius: 4, mb: 1, bgcolor: alpha(PURPLE, 0.12), '& .MuiLinearProgress-bar': { bgcolor: PURPLE } }} />
                    <Typography variant="body2" color="text.secondary">{stats.avgProgress}% average milestone completion</Typography>
                  </Paper>
                  <Paper sx={{ flex: 1, p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Budget on record</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: PURPLE }}>{formatMoney(stats.totalBudget)}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                      Combined planned budgets. Spend is tracked separately in project budget.
                    </Typography>
                  </Paper>
                </Stack>
                <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: alpha(PURPLE, 0.06) }}>
                          {['Project', 'Status', 'Progress', 'Budget', 'Team', 'Deadline'].map((label) => (
                            <TableCell key={label} sx={{ fontWeight: 700 }}>{label}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {projects.map((project) => (
                          <TableRow key={project.id} hover>
                            <TableCell sx={{ maxWidth: 320 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{project.title}</Typography>
                            </TableCell>
                            <TableCell><StatusChip status={project.status} /></TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <LinearProgress variant="determinate" value={project.progress} sx={{ width: 80, height: 6, borderRadius: 3, bgcolor: alpha(PURPLE, 0.12), '& .MuiLinearProgress-bar': { bgcolor: PURPLE } }} />
                                <Typography variant="caption">{project.progress}%</Typography>
                              </Stack>
                            </TableCell>
                            <TableCell>{formatMoney(project.budget, project.budgetCurrency)}</TableCell>
                            <TableCell>{project.teamCount}</TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {formatDisplayDate(project.endDate) || 'Not set'}
                              </Typography>
                              <UrgencyChip days={project.daysUntilDeadline} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Stack>
            )}
          </>
        )}
      </Container>

      <Dialog open={statusUpdateDialog} onClose={() => !savingStatus && closeStatusUpdateDialog()} maxWidth="sm" fullWidth {...dialogLock} PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ bgcolor: PURPLE, color: 'white', fontWeight: 800 }}>
          Update project status
          {selectedProject ? <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>{selectedProject.title}</Typography> : null}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedProject ? (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                <Stack direction="row" spacing={3}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Current</Typography>
                    <Box sx={{ mt: 0.5 }}><StatusChip status={selectedProject.status} /></Box>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Progress</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>{selectedProject.progress}%</Typography>
                  </Box>
                </Stack>
              </Paper>
              <FormControl fullWidth size="small">
                <InputLabel>New status</InputLabel>
                <Select value={statusUpdate.newStatus} label="New status" onChange={(event) => setStatusUpdate((prev) => ({ ...prev, newStatus: event.target.value }))}>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Planning">Planning</MenuItem>
                  <MenuItem value="On Hold">On hold</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                </Select>
              </FormControl>
              <TextField fullWidth size="small" type="date" label="Effective date" value={statusUpdate.effectiveDate} onChange={(event) => setStatusUpdate((prev) => ({ ...prev, effectiveDate: event.target.value }))} InputLabelProps={{ shrink: true }} />
              <TextField fullWidth size="small" label="Reason" value={statusUpdate.reason} onChange={(event) => setStatusUpdate((prev) => ({ ...prev, reason: event.target.value }))} />
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>Notes</Typography>
                <TipTapEditor value={statusUpdate.notes} onChange={(value) => setStatusUpdate((prev) => ({ ...prev, notes: value }))} placeholder="Context, approvals, or follow-up actions" minHeight="120px" />
              </Box>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeStatusUpdateDialog} disabled={savingStatus} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateProjectStatus} disabled={!statusUpdate.newStatus || savingStatus} sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700 }}>
            {savingStatus ? 'Saving...' : 'Save status'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={milestoneDialog} onClose={() => !savingMilestone && closeMilestoneDialog()} maxWidth="md" fullWidth {...dialogLock} PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ bgcolor: PURPLE, color: 'white', fontWeight: 800 }}>
          {milestoneDialogMode === 'create' ? 'Add milestone' : 'Update milestone'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={milestoneEditForm.status}
                  label="Status"
                  onChange={(event) => {
                    const status = event.target.value;
                    setMilestoneEditForm((prev) => ({
                      ...prev,
                      status,
                      completedDate: status === 'Completed' && !prev.completedDate ? new Date().toISOString().split('T')[0] : prev.completedDate,
                    }));
                  }}
                >
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Blocked">Blocked</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Due date"
                value={milestoneEditForm.dueDate}
                onChange={(event) => setMilestoneEditForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Completed date"
                value={milestoneEditForm.completedDate}
                onChange={(event) => setMilestoneEditForm((prev) => ({ ...prev, completedDate: event.target.value }))}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: milestoneEditForm.dueDate || undefined }}
              />
            </Stack>
            {(milestoneEditForm.status === 'In Progress' || milestoneEditForm.status === 'Completed') ? (
              <Box>
                <Typography variant="caption" color="text.secondary">Progress: {milestoneEditForm.progress}%</Typography>
                <Slider value={milestoneEditForm.progress} onChange={(_, value) => setMilestoneEditForm((prev) => ({ ...prev, progress: value }))} valueLabelDisplay="auto" sx={{ color: PURPLE }} />
              </Box>
            ) : null}
            <TextField fullWidth size="small" label="Milestone title" value={milestoneEditForm.title} onChange={(event) => setMilestoneEditForm((prev) => ({ ...prev, title: event.target.value }))} />
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>Description</Typography>
              <TipTapEditor value={milestoneEditForm.description} onChange={(value) => setMilestoneEditForm((prev) => ({ ...prev, description: value }))} placeholder="What does this milestone involve?" minHeight="90px" />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>Completion criteria</Typography>
              <TipTapEditor value={milestoneEditForm.completionCriteria} onChange={(value) => setMilestoneEditForm((prev) => ({ ...prev, completionCriteria: value }))} placeholder="How will you know this is complete?" minHeight="90px" />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>Progress notes</Typography>
              <TipTapEditor value={milestoneEditForm.notes} onChange={(value) => setMilestoneEditForm((prev) => ({ ...prev, notes: value }))} placeholder="Updates for the team" minHeight="90px" />
            </Box>
            {milestoneEditForm.status === 'Blocked' ? (
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>Blockers</Typography>
                <TipTapEditor value={milestoneEditForm.blockers} onChange={(value) => setMilestoneEditForm((prev) => ({ ...prev, blockers: value }))} placeholder="What is preventing progress?" minHeight="90px" />
              </Box>
            ) : null}
            <Autocomplete
              multiple
              options={milestoneEditContext?.deliverables || []}
              getOptionLabel={(option) => option.title}
              value={(milestoneEditContext?.deliverables || []).filter((item) => milestoneEditForm.linkedDeliverableIds.includes(item.id))}
              onChange={(_, selected) => setMilestoneEditForm((prev) => ({ ...prev, linkedDeliverableIds: selected.map((item) => item.id) }))}
              renderInput={(params) => (
                <TextField {...params} size="small" label="Linked deliverables" placeholder="Outputs this milestone should advance" InputProps={{ ...params.InputProps, startAdornment: (<><LinkIcon sx={{ mr: 1, color: PURPLE, fontSize: 18 }} />{params.InputProps.startAdornment}</>) }} />
              )}
            />
            {renderDocumentUploadSection(milestoneEditForm, setMilestoneEditForm, milestoneDialogMode === 'edit')}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeMilestoneDialog} disabled={savingMilestone} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveMilestone} disabled={savingMilestone || !milestoneEditForm.title.trim()} sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700 }}>
            {savingMilestone ? 'Saving...' : milestoneDialogMode === 'create' ? 'Add milestone' : 'Save milestone'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deliverableDialog} onClose={() => !savingDeliverable && closeDeliverableDialog()} maxWidth="md" fullWidth {...dialogLock} PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ bgcolor: PURPLE, color: 'white', fontWeight: 800 }}>
          {deliverableDialogMode === 'create' ? 'Add deliverable' : 'Update deliverable'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField fullWidth size="small" label="Title" value={deliverableEditForm.title} onChange={(event) => setDeliverableEditForm((prev) => ({ ...prev, title: event.target.value }))} />
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select value={deliverableEditForm.type} label="Type" onChange={(event) => setDeliverableEditForm((prev) => ({ ...prev, type: event.target.value }))}>
                  {DELIVERABLE_TYPES.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={deliverableEditForm.status} label="Status" onChange={(event) => setDeliverableEditForm((prev) => ({ ...prev, status: event.target.value }))}>
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Delivered">Delivered</MenuItem>
                  <MenuItem value="Blocked">Blocked</MenuItem>
                </Select>
              </FormControl>
              <TextField fullWidth size="small" type="date" label="Due date" value={deliverableEditForm.dueDate} onChange={(event) => setDeliverableEditForm((prev) => ({ ...prev, dueDate: event.target.value }))} InputLabelProps={{ shrink: true }} />
            </Stack>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>Description</Typography>
              <TipTapEditor value={deliverableEditForm.description} onChange={(value) => setDeliverableEditForm((prev) => ({ ...prev, description: value }))} placeholder="Expected output" minHeight="90px" />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>Completion criteria</Typography>
              <TipTapEditor value={deliverableEditForm.completionCriteria} onChange={(value) => setDeliverableEditForm((prev) => ({ ...prev, completionCriteria: value }))} placeholder="Acceptance criteria" minHeight="90px" />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>Notes</Typography>
              <TipTapEditor value={deliverableEditForm.notes} onChange={(value) => setDeliverableEditForm((prev) => ({ ...prev, notes: value }))} placeholder="Progress or handoff notes" minHeight="90px" />
            </Box>
            <Autocomplete
              multiple
              options={deliverableEditContext?.milestones || []}
              getOptionLabel={(option) => option.title}
              value={(deliverableEditContext?.milestones || []).filter((item) => deliverableEditForm.linkedMilestoneIds.includes(item.id))}
              onChange={(_, selected) => setDeliverableEditForm((prev) => ({ ...prev, linkedMilestoneIds: selected.map((item) => item.id) }))}
              renderInput={(params) => <TextField {...params} size="small" label="Linked milestones" />}
            />
            {renderDocumentUploadSection(deliverableEditForm, setDeliverableEditForm)}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDeliverableDialog} disabled={savingDeliverable} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveDeliverable} disabled={savingDeliverable || !deliverableEditForm.title.trim()} sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700 }}>
            {savingDeliverable ? 'Saving...' : deliverableDialogMode === 'create' ? 'Add deliverable' : 'Save deliverable'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={viewDetailsDialog}
        onClose={() => { setViewDetailsDialog(false); setDetailsTab(0); }}
        maxWidth="md"
        fullWidth
        {...dialogLock}
        PaperProps={{ sx: { borderRadius: 2, maxHeight: '90vh' } }}
      >
        <DialogTitle sx={{ bgcolor: PURPLE, color: 'white', fontWeight: 800, pr: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              Project details
              {selectedProject ? <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>{selectedProject.title}</Typography> : null}
            </Box>
            <IconButton size="small" onClick={() => { setViewDetailsDialog(false); setDetailsTab(0); }} sx={{ color: 'white' }}>
              <BlockedIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        {selectedProject ? (
          <>
            <Tabs
              value={detailsTab}
              onChange={(_, value) => setDetailsTab(value)}
              variant="scrollable"
              sx={{
                px: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
                '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, minHeight: 48 },
                '& .Mui-selected': { color: `${PURPLE} !important` },
                '& .MuiTabs-indicator': { backgroundColor: PURPLE },
              }}
            >
              <Tab label="Overview" />
              <Tab label="Timeline" />
              <Tab label="Team" />
              <Tab label="Deliverables" />
              <Tab label="Activity" />
            </Tabs>
            <DialogContent sx={{ bgcolor: '#f8fafc' }}>
              {detailsTab === 0 && (
                <Stack spacing={2}>
                  <Paper sx={{ p: 2, borderRadius: 2 }}>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                      <StatusChip status={selectedProject.status} />
                      <Chip size="small" label={`${selectedProject.progress}% complete`} sx={{ bgcolor: alpha(PURPLE, 0.1), color: PURPLE, fontWeight: 700 }} />
                      <UrgencyChip days={selectedProject.daysUntilDeadline} />
                    </Stack>
                    <HtmlContent value={selectedProject.description} empty="No abstract provided" />
                    <LinearProgress variant="determinate" value={selectedProject.progress} sx={{ mt: 2, height: 8, borderRadius: 4, bgcolor: alpha(PURPLE, 0.12), '& .MuiLinearProgress-bar': { bgcolor: PURPLE } }} />
                  </Paper>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Paper sx={{ flex: 1, p: 2, borderRadius: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.25 }}>Schedule</Typography>
                      <Typography variant="body2">Start: {formatDisplayDate(selectedProject.startDate) || 'Not set'}</Typography>
                      <Typography variant="body2">End: {formatDisplayDate(selectedProject.endDate) || 'Not set'}</Typography>
                      <Typography variant="body2">Budget: {formatMoney(selectedProject.budget, selectedProject.budgetCurrency)}</Typography>
                    </Paper>
                    <Paper sx={{ flex: 1, p: 2, borderRadius: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.25 }}>Milestones</Typography>
                      <Typography variant="body2">{selectedProject.milestones.length} total</Typography>
                      <Typography variant="body2">{selectedProject.milestones.filter((item) => item.status === 'Completed').length} completed</Typography>
                      <Typography variant="body2">{selectedProject.milestones.filter((item) => item.status === 'In Progress').length} in progress</Typography>
                    </Paper>
                  </Stack>
                  <Button
                    variant="outlined"
                    startIcon={<ViewIcon />}
                    onClick={() => router.push(`/researcher/projects/proposals/view/${selectedProject.id}`)}
                    sx={{ borderColor: PURPLE, color: PURPLE, textTransform: 'none', fontWeight: 700, alignSelf: 'flex-start' }}
                  >
                    Open full proposal
                  </Button>
                </Stack>
              )}
              {detailsTab === 1 && <TimelineRail items={buildProjectTimeline(selectedProject)} />}
              {detailsTab === 2 && (
                <Stack spacing={1.25}>
                  {selectedProject.team.map((member, index) => (
                    <Paper key={`${member.name}-${index}`} sx={{ p: 1.5, borderRadius: 2 }}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ bgcolor: PURPLE }}>{initials(member.name)}</Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{member.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {member.role}{member.affiliation ? ` · ${member.affiliation}` : ''}
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              )}
              {detailsTab === 3 && (
                <Stack spacing={1.25}>
                  {selectedProject.deliverables.length ? selectedProject.deliverables.map((item) => (
                    <Paper key={item.id} sx={{ p: 1.75, borderRadius: 2 }}>
                      <Stack direction="row" justifyContent="space-between" spacing={1}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{item.title}</Typography>
                        <ItemChip status={item.status} />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">{item.type} · Due {formatDisplayDate(item.dueDate) || 'Not set'}</Typography>
                      <Box sx={{ mt: 1 }}><HtmlContent value={item.description} empty="" /></Box>
                    </Paper>
                  )) : <Typography color="text.secondary">No deliverables defined.</Typography>}
                </Stack>
              )}
              {detailsTab === 4 && (
                <Stack spacing={1.25}>
                  {(selectedProject.statusHistory || []).length ? [...selectedProject.statusHistory].reverse().map((item, index) => (
                    <Paper key={item.id || index} sx={{ p: 1.75, borderRadius: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Status changed{item.fromStatus ? ` from ${item.fromStatus}` : ''} to {item.toStatus || item.proposalStatus}
                      </Typography>
                      {item.reason ? <Typography variant="body2" sx={{ mt: 0.5 }}>{item.reason}</Typography> : null}
                      <Typography variant="caption" color="text.secondary">
                        {formatDisplayDate(item.changedAt || item.effectiveDate) || 'Date not recorded'}
                      </Typography>
                    </Paper>
                  )) : (
                    <Typography color="text.secondary">No status changes have been recorded yet.</Typography>
                  )}
                </Stack>
              )}
            </DialogContent>
          </>
        ) : null}
      </Dialog>

      <Snackbar open={Boolean(notice)} autoHideDuration={4000} onClose={() => setNotice('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setNotice('')} severity="success" sx={{ width: '100%' }}>{notice}</Alert>
      </Snackbar>
    </Box>
  );
}
