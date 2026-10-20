'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Drawer,
  IconButton,
  LinearProgress,
  Link,
  Paper,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  AccountCircle as ProfileIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Assignment as ProposalIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  ChevronLeft as ChevronLeftIcon,
  Close as CloseIcon,
  HourglassTop as PendingIcon,
  OpenInNew as OpenInNewIcon,
  WarningAmber as WarningIcon,
  AssignmentTurnedIn as DeliverableIcon,
  CalendarToday as CalendarIcon,
  Edit as EditIcon,
  Flag as MilestoneIcon,
  FolderOpen as FilesIcon,
  History as HistoryIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  PlayCircleOutline as StartIcon,
  Science as ScienceIcon,
  Security as EthicsIcon,
  StopCircle as EndIcon,
  Timeline as TimelineIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import ProposalReviewStatus from '@/components/Proposals/ProposalReviewStatus';
import ProposalDocumentPreviewModal from '@/components/Proposals/ProposalDocumentPreviewModal';

const PURPLE = '#8b6cbc';
const sectionCardSx = {
  p: 2.5,
  borderRadius: 2,
  border: '1px solid',
  borderColor: 'divider',
  background: 'white',
  boxShadow: 'none',
  width: '100%',
};
const htmlSx = {
  color: '#334155',
  lineHeight: 1.7,
  fontSize: '0.95rem',
  '& p': { m: 0, mb: 1.25 },
  '& p:last-child': { mb: 0 },
  '& ul, & ol': { m: 0, pl: 2.5, mb: 1.25 },
  '& li': { mb: 0.5 },
  '& strong': { fontWeight: 700, color: '#1e293b' },
  '& em': { fontStyle: 'italic' },
};

const isProposalEditable = (status) => status === 'DRAFT' || status === 'REVISION_REQUESTED';

const isEmptyHtml = (value) => {
  if (!value) return true;
  return String(value).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').trim() === '';
};

const looksLikeHtml = (value) => typeof value === 'string' && /<\/?[a-z][\s\S]*>/i.test(value);

function HtmlContent({ value, empty = 'Not provided' }) {
  if (isEmptyHtml(value)) {
    return (
      <Typography variant="body2" color="text.secondary">
        {empty}
      </Typography>
    );
  }
  if (!looksLikeHtml(value)) {
    return (
      <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
        {value}
      </Typography>
    );
  }
  return <Box sx={htmlSx} dangerouslySetInnerHTML={{ __html: value }} />;
}

function FieldLabel({ children }) {
  return (
    <Typography
      variant="caption"
      sx={{
        display: 'block',
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'text.secondary',
        mb: 0.75,
      }}
    >
      {children}
    </Typography>
  );
}

function SectionTitle({ children }) {
  return (
    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.05rem', mb: 2 }}>
      {children}
    </Typography>
  );
}

const formatDate = (value) => {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatCurrency = (amount, currency = 'USD') => {
  if (amount === null || amount === undefined || amount === '') return 'Not set';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch {
    return `${currency || 'USD'} ${amount}`;
  }
};

const formatBytes = (size) => {
  const bytes = Number(size);
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const statusChip = (status) => {
  const label = String(status || 'DRAFT').replaceAll('_', ' ');
  const colors = {
    DRAFT: { bg: '#64748b', color: 'white' },
    SUBMITTED: { bg: '#0284c7', color: 'white' },
    UNDER_REVIEW: { bg: PURPLE, color: 'white' },
    APPROVED: { bg: '#16a34a', color: 'white' },
    REJECTED: { bg: '#dc2626', color: 'white' },
    REVISION_REQUESTED: { bg: '#d97706', color: 'white' },
  };
  const tone = colors[status] || { bg: PURPLE, color: 'white' };
  return (
    <Chip
      label={label}
      size="small"
      sx={{ bgcolor: tone.bg, color: tone.color, fontWeight: 700, textTransform: 'capitalize' }}
    />
  );
};

const fileName = (file) => file?.originalName || file?.fileName || file?.name || 'Document';
const fileHref = (file, ethicsId) => {
  if (file?.url) return file.url;
  if (file?.fileId) return `/api/files/${file.fileId}`;
  const storedName = file?.fileName || file?.originalName || file?.name;
  const applicationId = file?.ethicsApplicationId || ethicsId;
  if (applicationId && storedName) {
    return `/api/ethics/applications/${applicationId}/file?name=${encodeURIComponent(storedName)}`;
  }
  return null;
};

const normalizeOrcid = (value) => {
  const match = String(value || '').match(/\d{4}-\d{4}-\d{4}-\d{3}[\dX]/i);
  return match ? match[0].toUpperCase() : null;
};

function OrcidLink({ value }) {
  const orcid = normalizeOrcid(value);
  if (!orcid) {
    return <span>{value || 'Not set'}</span>;
  }
  return (
    <Link
      href={`https://orcid.org/${orcid}`}
      target="_blank"
      rel="noopener noreferrer"
      underline="hover"
      sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: '#2e7d32', fontWeight: 600 }}
    >
      <Box
        component="span"
        sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: '#a6ce39', color: 'white', fontSize: '0.55rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      >
        iD
      </Box>
      {orcid}
      <OpenInNewIcon sx={{ fontSize: 13 }} />
    </Link>
  );
}

function ProfileButton({ userId, orcid, onOpenInternal }) {
  const bare = normalizeOrcid(orcid);
  if (!userId && !bare) {
    return (
      <Tooltip title="No Hospitium account or ORCID iD on record">
        <span>
          <Button size="small" variant="outlined" disabled startIcon={<ProfileIcon />} sx={{ textTransform: 'none', fontWeight: 700 }}>
            View profile
          </Button>
        </span>
      </Tooltip>
    );
  }
  const internal = Boolean(userId);
  return (
    <Tooltip title={internal ? 'Open Hospitium profile' : 'Not registered on Hospitium, opens public ORCID record'}>
      <Button
        size="small"
        variant="outlined"
        startIcon={<ProfileIcon />}
        endIcon={internal ? null : <OpenInNewIcon sx={{ fontSize: 14 }} />}
        onClick={() => {
          if (internal) onOpenInternal(userId);
          else window.open(`https://orcid.org/${bare}`, '_blank', 'noopener,noreferrer');
        }}
        sx={{ textTransform: 'none', fontWeight: 700, color: PURPLE, borderColor: alpha(PURPLE, 0.5), whiteSpace: 'nowrap', '&:hover': { borderColor: PURPLE, bgcolor: alpha(PURPLE, 0.06) } }}
      >
        View profile
      </Button>
    </Tooltip>
  );
}

const COMPLETE_STATUSES = new Set(['completed', 'complete', 'delivered', 'done', 'achieved', 'accepted']);
const IN_PROGRESS_STATUSES = new Set(['in_progress', 'inprogress', 'ongoing', 'started', 'active', 'submitted', 'under_review']);

const taskState = (item) => {
  if (!item || item.kind === 'start' || item.kind === 'end') return null;
  const status = String(item.status || '').toLowerCase().replace(/[\s-]+/g, '_');
  if (COMPLETE_STATUSES.has(status)) {
    return { key: 'completed', label: status === 'delivered' ? 'Delivered' : 'Completed', color: '#15803d', bg: '#dcfce7' };
  }
  if (status === 'cancelled' || status === 'canceled') {
    return { key: 'cancelled', label: 'Cancelled', color: '#b91c1c', bg: '#fee2e2' };
  }
  const due = item.date ? new Date(item.date) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (due && !Number.isNaN(due.getTime()) && due < today) {
    return { key: 'overdue', label: 'Overdue', color: '#b45309', bg: '#fef3c7' };
  }
  if (status === 'blocked') {
    return { key: 'blocked', label: 'Blocked', color: '#b91c1c', bg: '#fee2e2' };
  }
  if (IN_PROGRESS_STATUSES.has(status)) {
    return { key: 'in_progress', label: 'In progress', color: '#0369a1', bg: '#e0f2fe' };
  }
  return { key: 'pending', label: 'Pending', color: '#475569', bg: '#f1f5f9' };
};

const ethicsTone = (status) => {
  const value = String(status || '').toLowerCase();
  const pretty = String(status || '').replaceAll('_', ' ');
  if (!value) return { label: 'Not set', color: '#475569', bg: '#f8fafc', border: '#cbd5e1', icon: <PendingIcon />, message: 'No ethics approval has been recorded for this proposal yet.' };
  if (value.includes('not required') || value.includes('not_required') || value.includes('exempt')) return { label: pretty, color: '#0369a1', bg: '#f0f9ff', border: '#7dd3fc', icon: <CheckCircleIcon />, message: 'Ethics review is not required for this study.' };
  if (value.includes('reject') || value.includes('declin') || value.includes('denied')) return { label: 'Rejected', color: '#b91c1c', bg: '#fef2f2', border: '#fca5a5', icon: <CancelIcon />, message: 'The ethics committee did not approve this study.' };
  if (value.includes('expir') || value.includes('suspend') || value.includes('revision') || value.includes('condition')) return { label: pretty, color: '#b45309', bg: '#fffbeb', border: '#fcd34d', icon: <WarningIcon />, message: 'Ethics approval needs attention before work can continue.' };
  if (value.includes('approv') && !value.includes('not') && !value.includes('pending')) return { label: 'Approved', color: '#15803d', bg: '#f0fdf4', border: '#86efac', icon: <CheckCircleIcon />, message: 'Ethics clearance is in place for this study.' };
  return { label: pretty, color: '#b45309', bg: '#fffbeb', border: '#fcd34d', icon: <PendingIcon />, message: 'Ethics approval is still pending.' };
};

export default function ProposalViewPage() {
  const router = useRouter();
  const params = useParams();
  const [proposal, setProposal] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    if (!params.id) return undefined;
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const [proposalRes, trackingRes] = await Promise.all([
          fetch(`/api/proposals/${params.id}`),
          fetch(`/api/proposals/${params.id}/review-status`),
        ]);
        const proposalData = await proposalRes.json();
        if (!proposalRes.ok || !proposalData.success) {
          throw new Error(proposalData.error || 'Failed to load proposal');
        }
        if (!cancelled) setProposal(proposalData.proposal);

        if (trackingRes.ok) {
          const trackingData = await trackingRes.json();
          if (!cancelled) setTracking(trackingData.tracking || null);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load proposal');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const linkedEthics = proposal?.ethicsLinks?.[0]?.ethicsApplication || null;

  const documents = useMemo(() => {
    if (!proposal) return [];
    const collected = [
      ...(Array.isArray(proposal.documents) ? proposal.documents : []),
      ...(proposal.ethicsDocuments || []).map((file) => ({ ...file, category: file.category || 'Ethics Documents' })),
      ...(proposal.dataManagementPlan || []).map((file) => ({ ...file, category: file.category || 'Data Management Plan' })),
      ...(proposal.budgetDocuments || []).map((file) => ({ ...file, category: file.category || 'Budget Documents' })),
      ...(proposal.otherRelatedFiles || []).map((file) => ({ ...file, category: file.category || 'Supporting Files' })),
      ...(proposal.linkedEthicsDocuments || []).map((file) => ({
        ...file,
        category: file.category || file.type || 'Ethics Documents',
        ethicsApplicationId: file.ethicsApplicationId || linkedEthics?.id,
      })),
    ];
    const seen = new Set();
    return collected.filter((file) => {
      const key = fileHref(file, linkedEthics?.id) || fileName(file);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [proposal, linkedEthics]);

  const ethicsDocuments = useMemo(
    () => documents.filter((file) => {
      const category = `${file.category || ''} ${file.type || ''}`.toLowerCase();
      return category.includes('ethics') || category.includes('certificate') || Boolean(file.ethicsApplicationId);
    }),
    [documents]
  );

  const projectTimeline = useMemo(() => {
    if (!proposal) return [];
    const items = [];
    if (proposal.startDate) {
      items.push({
        kind: 'start',
        id: 'project-start',
        title: 'Project start',
        date: proposal.startDate,
      });
    }
    (proposal.milestones || []).forEach((milestone, index) => {
      items.push({
        kind: 'milestone',
        id: milestone.id || `ms-${index}`,
        title: milestone.title || `Milestone ${index + 1}`,
        date: milestone.targetDate || milestone.dueDate,
        description: milestone.description,
        status: milestone.status,
        progress: milestone.progress,
        notes: milestone.notes,
        completionCriteria: milestone.completionCriteria,
        blockers: milestone.blockers,
        documents: milestone.documents || [],
        linkedIds: milestone.linkedDeliverableIds || [],
        completedAt: milestone.completedAt || milestone.completedDate,
      });
    });
    (proposal.deliverables || []).forEach((deliverable, index) => {
      const linkedIds = [deliverable.milestoneId, ...(deliverable.linkedMilestoneIds || [])].filter(Boolean);
      const linked = (proposal.milestones || []).find((item) => item.id && linkedIds.includes(item.id));
      items.push({
        kind: 'deliverable',
        id: deliverable.id || `dl-${index}`,
        title: deliverable.title || `Deliverable ${index + 1}`,
        date: deliverable.dueDate || deliverable.deadline,
        description: deliverable.description,
        type: deliverable.type,
        milestoneTitle: linked?.title || null,
        status: deliverable.status,
        notes: deliverable.notes,
        completionCriteria: deliverable.completionCriteria,
        documents: deliverable.documents || [],
        linkedIds,
        completedAt: deliverable.completedAt || deliverable.deliveredAt,
      });
    });
    if (proposal.endDate) {
      items.push({
        kind: 'end',
        id: 'project-end',
        title: 'Project end',
        date: proposal.endDate,
      });
    }
    const rank = { start: 0, milestone: 1, deliverable: 2, end: 3 };
    return items.sort((a, b) => {
      const aDate = a.date ? new Date(a.date).getTime() : Number.MAX_SAFE_INTEGER;
      const bDate = b.date ? new Date(b.date).getTime() : Number.MAX_SAFE_INTEGER;
      if (aDate !== bDate) return aDate - bDate;
      return (rank[a.kind] || 0) - (rank[b.kind] || 0);
    });
  }, [proposal]);

  const canEdit = isProposalEditable(proposal?.status);

  const taskItems = projectTimeline.filter((item) => item.kind === 'milestone' || item.kind === 'deliverable');
  const completedCount = taskItems.filter((item) => taskState(item)?.key === 'completed').length;
  const overdueCount = taskItems.filter((item) => taskState(item)?.key === 'overdue').length;
  const selectedIndex = projectTimeline.findIndex((item) => item.id === selectedTaskId);
  const selectedTask = selectedIndex >= 0 ? projectTimeline[selectedIndex] : null;
  const previousTask = selectedIndex > 0
    ? projectTimeline.slice(0, selectedIndex).reverse().find((item) => item.kind === 'milestone' || item.kind === 'deliverable') || null
    : null;
  const nextTask = selectedIndex >= 0 ? projectTimeline[selectedIndex + 1] || null : null;
  const linkedTasks = selectedTask
    ? projectTimeline.filter((item) => (
      item.id !== selectedTask.id
      && (item.kind === 'milestone' || item.kind === 'deliverable')
      && (selectedTask.linkedIds?.includes(item.id) || item.linkedIds?.includes(selectedTask.id))
    ))
    : [];

  const budgetDocuments = documents.filter((file) => String(file.category || '').toLowerCase().includes('budget'));

  const ethicsStatusValue = proposal?.ethicsApprovalStatus || linkedEthics?.status || '';
  const ethicsState = ethicsTone(ethicsStatusValue);
  const ethicsApprovalDate = proposal?.approvalDate || linkedEthics?.approvalDate;

  const openProfile = (userId) => router.push(`/researcher/profile/${userId}`);
  const previewDocument = (file) => setPreviewFile({ ...file, url: fileHref(file, linkedEthics?.id) || file.url });

  const openFile = (file) => {
    const href = fileHref(file, linkedEthics?.id);
    if (href) window.open(href, '_blank', 'noopener,noreferrer');
  };

  const DocumentRow = ({ file, fallbackCategory = '' }) => {
    const href = fileHref(file, linkedEthics?.id);
    return (
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={2}
        sx={{ px: 1.5, py: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1.5, bgcolor: 'white' }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Avatar sx={{ bgcolor: alpha(PURPLE, 0.12), color: PURPLE, width: 36, height: 36 }}>
            <FilesIcon fontSize="small" />
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }} noWrap>
              {fileName(file)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {[file.category || fallbackCategory, formatBytes(file.size)].filter(Boolean).join(' · ')}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ViewIcon />}
            onClick={() => previewDocument(file)}
            disabled={!href}
            sx={{ color: PURPLE, borderColor: alpha(PURPLE, 0.5), textTransform: 'none', fontWeight: 700 }}
          >
            Preview
          </Button>
          <Tooltip title="Open in new tab">
            <span>
              <IconButton size="small" onClick={() => openFile(file)} disabled={!href} sx={{ color: PURPLE }}>
                <OpenInNewIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>
    );
  };

  const TaskSummaryCard = ({ item, label, icon }) => {
    const state = taskState(item);
    const clickable = item.kind === 'milestone' || item.kind === 'deliverable';
    return (
      <Box
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onClick={clickable ? () => setSelectedTaskId(item.id) : undefined}
        onKeyDown={clickable ? (event) => { if (event.key === 'Enter') setSelectedTaskId(item.id); } : undefined}
        sx={{
          p: 1.5,
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'white',
          cursor: clickable ? 'pointer' : 'default',
          ...(clickable ? { '&:hover': { borderColor: PURPLE, bgcolor: alpha(PURPLE, 0.03) } } : {}),
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
          {icon}
          <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: PURPLE }}>
            {label}
          </Typography>
        </Stack>
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>{item.title}</Typography>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
          <Chip
            size="small"
            label={item.kind === 'milestone' ? 'Milestone' : item.kind === 'deliverable' ? 'Deliverable' : 'Project'}
            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: item.kind === 'deliverable' ? '#ccfbf1' : alpha(PURPLE, 0.1), color: item.kind === 'deliverable' ? '#0f766e' : PURPLE }}
          />
          {state ? (
            <Chip size="small" label={state.label} sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: state.bg, color: state.color }} />
          ) : null}
          <Typography variant="caption" color="text.secondary">{formatDate(item.date)}</Typography>
        </Stack>
      </Box>
    );
  };

  const renderTaskDrawer = () => {
    if (!selectedTask) return null;
    const state = taskState(selectedTask);
    const isMilestone = selectedTask.kind === 'milestone';
    const progress = Math.min(100, Number(selectedTask.progress) || 0);
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ p: 2.5, bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Chip
                size="small"
                icon={isMilestone ? <MilestoneIcon /> : <DeliverableIcon />}
                label={isMilestone ? 'Milestone' : 'Deliverable'}
                sx={{ fontWeight: 700, bgcolor: isMilestone ? alpha(PURPLE, 0.1) : '#ccfbf1', color: isMilestone ? PURPLE : '#0f766e', '& .MuiChip-icon': { color: 'inherit', fontSize: 15 } }}
              />
              {state ? (
                <Chip
                  size="small"
                  icon={state.key === 'completed' ? <CheckCircleIcon /> : state.key === 'overdue' ? <WarningIcon /> : undefined}
                  label={state.label}
                  sx={{ fontWeight: 700, bgcolor: state.bg, color: state.color, '& .MuiChip-icon': { color: state.color, fontSize: 15 } }}
                />
              ) : null}
            </Stack>
            <IconButton size="small" onClick={() => setSelectedTaskId(null)} aria-label="Close details">
              <CloseIcon />
            </IconButton>
          </Stack>
          <Typography variant="h6" sx={{ mt: 1.5, fontWeight: 700, color: '#1e293b', fontSize: '1.1rem', lineHeight: 1.35 }}>
            {selectedTask.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Item {taskItems.findIndex((item) => item.id === selectedTask.id) + 1} of {taskItems.length} on the project timeline
          </Typography>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
          <Stack spacing={2.25}>
            <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
              <Box>
                <FieldLabel>{isMilestone ? 'Target date' : 'Due date'}</FieldLabel>
                <Typography variant="body2" sx={{ fontWeight: 700, color: state?.key === 'overdue' ? '#b45309' : '#1e293b' }}>
                  {formatDate(selectedTask.date)}
                </Typography>
              </Box>
              {selectedTask.completedAt ? (
                <Box>
                  <FieldLabel>Completed on</FieldLabel>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#15803d' }}>{formatDate(selectedTask.completedAt)}</Typography>
                </Box>
              ) : null}
              {!isMilestone && selectedTask.type ? (
                <Box>
                  <FieldLabel>Type</FieldLabel>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>{selectedTask.type}</Typography>
                </Box>
              ) : null}
            </Stack>

            {isMilestone && progress > 0 ? (
              <Box>
                <FieldLabel>Progress</FieldLabel>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <LinearProgress variant="determinate" value={progress} sx={{ flex: 1, height: 8, borderRadius: 4, bgcolor: alpha(PURPLE, 0.12), '& .MuiLinearProgress-bar': { bgcolor: PURPLE } }} />
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>{progress}%</Typography>
                </Stack>
              </Box>
            ) : null}

            <Box>
              <FieldLabel>Description</FieldLabel>
              <HtmlContent value={selectedTask.description} empty="No description provided" />
            </Box>

            {!isEmptyHtml(selectedTask.completionCriteria) ? (
              <Box>
                <FieldLabel>Completion criteria</FieldLabel>
                <HtmlContent value={selectedTask.completionCriteria} />
              </Box>
            ) : null}

            {!isEmptyHtml(selectedTask.notes) ? (
              <Box>
                <FieldLabel>Notes</FieldLabel>
                <HtmlContent value={selectedTask.notes} />
              </Box>
            ) : null}

            {!isEmptyHtml(selectedTask.blockers) ? (
              <Alert severity="warning" sx={{ borderRadius: 1.5 }}>
                <strong>Blockers:</strong> {String(selectedTask.blockers).replace(/<[^>]+>/g, ' ')}
              </Alert>
            ) : null}

            {linkedTasks.length ? (
              <Box>
                <FieldLabel>{isMilestone ? 'Linked deliverables' : 'Output of milestone'}</FieldLabel>
                <Stack spacing={1}>
                  {linkedTasks.map((item) => (
                    <TaskSummaryCard
                      key={item.id}
                      item={item}
                      label={item.kind === 'milestone' ? 'Milestone' : 'Deliverable'}
                      icon={item.kind === 'milestone' ? <MilestoneIcon sx={{ fontSize: 15, color: PURPLE }} /> : <DeliverableIcon sx={{ fontSize: 15, color: '#0f766e' }} />}
                    />
                  ))}
                </Stack>
              </Box>
            ) : null}

            {(selectedTask.documents || []).length ? (
              <Box>
                <FieldLabel>Documents</FieldLabel>
                <Stack spacing={1}>
                  {selectedTask.documents.map((file, index) => (
                    <DocumentRow key={file.id || file.fileName || index} file={file} fallbackCategory={isMilestone ? 'Milestone document' : 'Deliverable document'} />
                  ))}
                </Stack>
              </Box>
            ) : null}

            <Divider />

            <Box>
              <FieldLabel>Up next</FieldLabel>
              {nextTask ? (
                <TaskSummaryCard item={nextTask} label="Next task" icon={<ArrowForwardIcon sx={{ fontSize: 15, color: PURPLE }} />} />
              ) : (
                <Typography variant="body2" color="text.secondary">This is the last item on the timeline.</Typography>
              )}
            </Box>
          </Stack>
        </Box>

        <Stack direction="row" justifyContent="space-between" sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            startIcon={<ChevronLeftIcon />}
            disabled={!previousTask}
            onClick={() => previousTask && setSelectedTaskId(previousTask.id)}
            sx={{ textTransform: 'none', fontWeight: 700, color: PURPLE }}
          >
            Previous
          </Button>
          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            disabled={!nextTask || !taskState(nextTask)}
            onClick={() => nextTask && setSelectedTaskId(nextTask.id)}
            sx={{ textTransform: 'none', fontWeight: 700, bgcolor: PURPLE, boxShadow: 'none', '&:hover': { bgcolor: '#7a5cb0', boxShadow: 'none' } }}
          >
            Next task
          </Button>
        </Stack>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: PURPLE }} />
        </Box>
    );
  }

  if (error || !proposal) {
    return (
      <Container maxWidth={false} sx={{ py: 4, maxWidth: '1600px', mx: 'auto' }}>
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error || 'Proposal not found'}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/researcher/projects/proposals/list')} sx={{ color: PURPLE, textTransform: 'none', fontWeight: 700 }}>
          Back to proposals
        </Button>
      </Container>
    );
  }

    return (
    <>
      <PageHeader
        title={proposal.title}
        description={`${proposal.principalInvestigator || 'Principal investigator not set'} · ${proposal.departments?.join(', ') || 'No department listed'}`}
        icon={<ProposalIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/researcher' },
          { label: 'Proposals', path: '/researcher/projects/proposals/list' },
          { label: 'Proposal details' },
        ]}
        actionButton={
          <Stack direction="row" spacing={1.25} alignItems="center">
            {statusChip(proposal.status)}
        <Button
              variant="contained"
          startIcon={<ArrowBackIcon />}
              onClick={() => router.push('/researcher/projects/proposals/list')}
              sx={{ bgcolor: 'white', color: PURPLE, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#f5f5f5' } }}
            >
              Back to list
            </Button>
            <Tooltip title={canEdit ? 'Edit proposal' : 'Submitted proposals cannot be edited'}>
              <span>
            <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  disabled={!canEdit}
                  onClick={() => router.push(`/researcher/projects/proposals/edit/${params.id}`)}
              sx={{
                    borderColor: 'white',
                color: 'white',
                textTransform: 'none',
                    fontWeight: 700,
                    '&.Mui-disabled': { borderColor: 'rgba(255,255,255,0.35)', color: 'rgba(255,255,255,0.55)' },
                  }}
                >
                  Edit
            </Button>
              </span>
            </Tooltip>
          </Stack>
        }
      />

      <Container maxWidth={false} sx={{ py: 3, maxWidth: '1600px', mx: 'auto' }}>
        <Paper elevation={0} sx={{ ...sectionCardSx, mb: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} divider={<Box sx={{ width: { md: '1px' }, height: { xs: '1px', md: 'auto' }, bgcolor: 'divider' }} />} spacing={0}>
            {[
              ['Status', statusChip(proposal.status)],
              ['Timeline', `${formatDate(proposal.startDate)} - ${formatDate(proposal.endDate)}`],
              ['Proposed budget', formatCurrency(proposal.totalBudgetAmount, proposal.budgetCurrency)],
              ['Submitted', formatDate(proposal.updatedAt || proposal.createdAt)],
            ].map(([label, value]) => (
              <Box key={label} sx={{ flex: 1, px: { md: 2.5 }, py: 1.25 }}>
                <FieldLabel>{label}</FieldLabel>
                {typeof value === 'string' ? (
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                    {value}
              </Typography>
                ) : (
                  value
                )}
            </Box>
            ))}
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ ...sectionCardSx, mb: 2, p: 0, overflow: 'hidden' }}>
          <Tabs 
            value={activeTab} 
            onChange={(_, value) => setActiveTab(value)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              px: 1,
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, minHeight: 52, color: '#64748b' },
              '& .Mui-selected': { color: `${PURPLE} !important` },
              '& .MuiTabs-indicator': { backgroundColor: PURPLE, height: 3 },
            }}
          >
            <Tab icon={<PersonIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Overview" />
            <Tab icon={<ScienceIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Research" />
            <Tab icon={<TimelineIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Project management" />
            <Tab icon={<CalendarIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Funding" />
            <Tab icon={<EthicsIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Ethics" />
            <Tab icon={<FilesIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Files" />
            <Tab icon={<HistoryIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Review" />
          </Tabs>
        </Paper>

        {activeTab === 0 && (
          <Stack spacing={2}>
            <Paper sx={sectionCardSx}>
              <SectionTitle>Investigators</SectionTitle>
              <Stack spacing={2}>
              <Box>
                  <FieldLabel>Principal investigator</FieldLabel>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                    {proposal.principalInvestigator || 'Not set'}
                        </Typography>
                  <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
                    {proposal.principalInvestigatorOrcid ? (
                      <Typography variant="caption" component="div">
                        <OrcidLink value={proposal.principalInvestigatorOrcid} />
                      </Typography>
                    ) : null}
                    <ProfileButton
                      userId={proposal.principalInvestigatorUserId}
                      orcid={proposal.principalInvestigatorOrcid}
                      onOpenInternal={openProfile}
                    />
                  </Stack>
                        </Box>
                        <Box>
                  <FieldLabel>Departments</FieldLabel>
                  {(proposal.departments || []).length ? (
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {proposal.departments.map((department) => (
                        <Chip key={department} label={department} size="small" sx={{ bgcolor: alpha(PURPLE, 0.1), color: PURPLE, fontWeight: 700 }} />
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">None listed</Typography>
                  )}
                          </Box>
                        <Box>
                  <FieldLabel>Co-investigators</FieldLabel>
                  {(proposal.coInvestigators || []).length ? (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Institution</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>ORCID</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">Profile</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {proposal.coInvestigators.map((person, index) => (
                          <TableRow key={`${person.orcidId || person.email || index}`}>
                            <TableCell>{person.name || 'Not set'}</TableCell>
                            <TableCell>{person.role || 'Not set'}</TableCell>
                            <TableCell>{person.institution || 'Not set'}</TableCell>
                            <TableCell><OrcidLink value={person.orcidId} /></TableCell>
                            <TableCell align="right">
                              <ProfileButton userId={person.userId} orcid={person.orcidId} onOpenInternal={openProfile} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <Typography variant="body2" color="text.secondary">None added</Typography>
                  )}
                        </Box>
              </Stack>
            </Paper>
          </Stack>
        )}

        {activeTab === 1 && (
          <Stack spacing={2}>
            <Paper sx={sectionCardSx}>
              <SectionTitle>Research areas</SectionTitle>
              {(proposal.researchAreas || []).length ? (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {proposal.researchAreas.map((area) => (
                    <Chip key={area} label={area} size="small" sx={{ bgcolor: alpha(PURPLE, 0.1), color: PURPLE, fontWeight: 700 }} />
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">None listed</Typography>
              )}
            </Paper>
            <Paper sx={sectionCardSx}>
              <SectionTitle>Abstract</SectionTitle>
              <HtmlContent value={proposal.abstract} empty="No abstract provided" />
            </Paper>
            <Paper sx={sectionCardSx}>
              <SectionTitle>Research objectives</SectionTitle>
              <HtmlContent value={proposal.researchObjectives} empty="No objectives provided" />
            </Paper>
            <Paper sx={sectionCardSx}>
              <SectionTitle>Methodology</SectionTitle>
              <HtmlContent value={proposal.methodology} empty="No methodology provided" />
            </Paper>
          </Stack>
        )}

        {activeTab === 2 && (
          <Paper sx={sectionCardSx}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
              <SectionTitle>Project timeline</SectionTitle>
              <Typography variant="caption" sx={{ fontWeight: 700, color: PURPLE }}>
                {[(proposal.milestones || []).length ? `${proposal.milestones.length} milestone${proposal.milestones.length === 1 ? '' : 's'}` : null,
                  (proposal.deliverables || []).length ? `${proposal.deliverables.length} deliverable${proposal.deliverables.length === 1 ? '' : 's'}` : null]
                  .filter(Boolean)
                  .join(' · ') || 'No items'}
                          </Typography>
            </Stack>
            {taskItems.length ? (
              <Box sx={{ mb: 2.5, p: 1.75, borderRadius: 1.5, bgcolor: '#f8fafc', border: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap spacing={1} sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                    {completedCount} of {taskItems.length} tasks complete
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip size="small" icon={<CheckCircleIcon sx={{ fontSize: 15 }} />} label={`${completedCount} completed`} sx={{ fontWeight: 700, bgcolor: '#dcfce7', color: '#15803d', '& .MuiChip-icon': { color: '#15803d' } }} />
                    {overdueCount ? (
                      <Chip size="small" icon={<WarningIcon sx={{ fontSize: 15 }} />} label={`${overdueCount} overdue`} sx={{ fontWeight: 700, bgcolor: '#fef3c7', color: '#b45309', '& .MuiChip-icon': { color: '#b45309' } }} />
                    ) : null}
                  </Stack>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={Math.round((completedCount / taskItems.length) * 100)}
                  sx={{ height: 8, borderRadius: 4, bgcolor: alpha(PURPLE, 0.12), '& .MuiLinearProgress-bar': { bgcolor: '#16a34a', borderRadius: 4 } }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Click any milestone or deliverable to see its details and what comes next.
                </Typography>
              </Box>
            ) : null}
            {projectTimeline.length ? (
                        <Box>
                {projectTimeline.map((item, index) => {
                  const isLast = index === projectTimeline.length - 1;
                  const tone = {
                    start: { color: '#64748b', bg: '#f1f5f9', icon: <StartIcon sx={{ fontSize: 16 }} /> },
                    end: { color: '#64748b', bg: '#f1f5f9', icon: <EndIcon sx={{ fontSize: 16 }} /> },
                    milestone: { color: PURPLE, bg: alpha(PURPLE, 0.1), icon: <MilestoneIcon sx={{ fontSize: 15 }} /> },
                    deliverable: { color: '#0f766e', bg: '#ccfbf1', icon: <DeliverableIcon sx={{ fontSize: 15 }} /> },
                  }[item.kind] || { color: PURPLE, bg: alpha(PURPLE, 0.1), icon: <TimelineIcon sx={{ fontSize: 15 }} /> };
                  const state = taskState(item);
                  const isDone = state?.key === 'completed';
                  const isTask = Boolean(state);
                  const markerColor = isDone ? '#16a34a' : tone.color;
                  return (
                    <Box key={item.id} sx={{ display: 'flex', gap: 2 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0 }}>
                        <Box
                              sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            bgcolor: isDone ? '#16a34a' : tone.bg,
                            color: isDone ? 'white' : tone.color,
                            border: `2px solid ${markerColor}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1,
                          }}
                        >
                          {isDone ? <CheckCircleIcon sx={{ fontSize: 18 }} /> : tone.icon}
                          </Box>
                        {!isLast ? (
                          <Box sx={{ width: 2, flex: 1, minHeight: 28, bgcolor: isDone ? alpha('#16a34a', 0.45) : alpha(PURPLE, 0.18), my: 0.5 }} />
                        ) : null}
                        </Box>
                      <Box
                        role={isTask ? 'button' : undefined}
                        tabIndex={isTask ? 0 : undefined}
                        onClick={isTask ? () => setSelectedTaskId(item.id) : undefined}
                        onKeyDown={isTask ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedTaskId(item.id); } } : undefined}
                        sx={{
                          flex: 1,
                          mb: isLast ? 0 : 2,
                          p: 1.75,
                          borderRadius: 1.5,
                          border: '1px solid',
                          borderColor: selectedTaskId === item.id ? PURPLE : isDone ? alpha('#16a34a', 0.35) : 'divider',
                          bgcolor: item.kind === 'start' || item.kind === 'end' ? '#f8fafc' : isDone ? '#f7fdf9' : 'white',
                          cursor: isTask ? 'pointer' : 'default',
                          transition: 'border-color 120ms, box-shadow 120ms',
                          ...(isTask ? {
                            '&:hover': { borderColor: PURPLE, boxShadow: `0 2px 10px ${alpha(PURPLE, 0.12)}` },
                            '&:focus-visible': { outline: `2px solid ${PURPLE}`, outlineOffset: 2 },
                          } : {}),
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} flexWrap="wrap" useFlexGap>
                        <Box>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDone ? '#475569' : '#1e293b' }}>
                                {item.title}
                          </Typography>
                        <Chip 
                                label={item.kind === 'start' || item.kind === 'end' ? 'Project' : item.kind === 'milestone' ? 'Milestone' : 'Deliverable'}
                          size="small"
                                sx={{ height: 20, fontWeight: 700, fontSize: '0.68rem', bgcolor: tone.bg, color: tone.color }}
                              />
                              {state ? (
                                <Chip
                                  label={state.label}
                                  size="small"
                                  icon={state.key === 'completed' ? <CheckCircleIcon /> : state.key === 'overdue' ? <WarningIcon /> : undefined}
                                  sx={{ height: 20, fontWeight: 700, fontSize: '0.68rem', bgcolor: state.bg, color: state.color, '& .MuiChip-icon': { fontSize: 13, color: state.color, ml: 0.5 } }}
                                />
                              ) : null}
                            </Stack>
                            {item.kind === 'deliverable' ? (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                {[item.type, item.milestoneTitle ? `Output of ${item.milestoneTitle}` : null].filter(Boolean).join(' · ') || 'Deliverable'}
                        </Typography>
                            ) : null}
                      </Box>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Typography variant="caption" sx={{ fontWeight: 700, color: state?.key === 'overdue' ? '#b45309' : tone.color, whiteSpace: 'nowrap' }}>
                              {formatDate(item.date)}
                            </Typography>
                            {isTask ? <ArrowForwardIcon sx={{ fontSize: 14, color: '#94a3b8' }} /> : null}
                          </Stack>
                        </Stack>
                    </Box>
              </Box>
                  );
                })}
                    </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No timeline items yet. Add a project start date, milestones, or deliverables.
                    </Typography>
            )}
          </Paper>
        )}

        {activeTab === 3 && (
          <Paper sx={sectionCardSx}>
            <SectionTitle>Proposed budget</SectionTitle>
            <Stack spacing={2}>
              <Box>
                <FieldLabel>Funding source</FieldLabel>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  {proposal.fundingSource || 'Not set'}
                        </Typography>
                      </Box>
              <Box>
                <FieldLabel>Proposed amount</FieldLabel>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  {formatCurrency(proposal.totalBudgetAmount, proposal.budgetCurrency)}
                      </Typography>
                    </Box>
              <Box>
                <FieldLabel>Currency</FieldLabel>
                <Typography variant="body2" sx={{ color: '#1e293b' }}>
                  {proposal.budgetCurrency || 'USD'}
                        </Typography>
                      </Box>
              {proposal.fundingInstitution ? (
                <Box>
                  <FieldLabel>Funding institution</FieldLabel>
                  <Typography variant="body2" sx={{ color: '#1e293b' }}>{proposal.fundingInstitution}</Typography>
                </Box>
              ) : null}
              <Box>
                <FieldLabel>Budget documents</FieldLabel>
                {budgetDocuments.length ? (
                  <Stack spacing={1}>
                    {budgetDocuments.map((file, index) => (
                      <DocumentRow key={`${file.fileName || file.fileId || file.originalName || index}`} file={file} fallbackCategory="Budget document" />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">No budget documents uploaded.</Typography>
                )}
              </Box>
            </Stack>
          </Paper>
        )}

        {activeTab === 4 && (
          <Paper sx={sectionCardSx}>
            <SectionTitle>Ethics approval</SectionTitle>
                    <Stack spacing={2}>
              <Box
                role="status"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: ethicsState.bg,
                  border: `1px solid ${ethicsState.border}`,
                  borderLeft: `6px solid ${ethicsState.color}`,
                }}
              >
                <Avatar sx={{ bgcolor: ethicsState.color, color: 'white', width: 44, height: 44 }}>
                  {ethicsState.icon}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <FieldLabel>Ethics status</FieldLabel>
                  <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Chip
                      label={ethicsState.label}
                      sx={{ bgcolor: ethicsState.color, color: 'white', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}
                    />
                    {proposal.ethicsApprovalReference ? (
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                        Ref. {proposal.ethicsApprovalReference}
                      </Typography>
                    ) : null}
                  </Stack>
                  <Typography variant="body2" sx={{ mt: 0.75, color: ethicsState.color, fontWeight: 600 }}>
                    {ethicsState.message}
                    {ethicsState.label === 'Approved' && ethicsApprovalDate ? ` Approved on ${formatDate(ethicsApprovalDate)}.` : ''}
                  </Typography>
                </Box>
              </Box>
              {linkedEthics?.status && proposal.ethicsApprovalStatus && ethicsTone(linkedEthics.status).label !== ethicsState.label ? (
                <Alert severity="info" sx={{ borderRadius: 1.5 }}>
                  The linked ethics application currently shows status <strong>{String(linkedEthics.status).replaceAll('_', ' ')}</strong>.
                </Alert>
              ) : null}
              <Box>
                <FieldLabel>Reference</FieldLabel>
                <Typography variant="body2" sx={{ color: '#1e293b' }}>
                  {proposal.ethicsApprovalReference || 'Not set'}
                              </Typography>
                            </Box>
              <Box>
                <FieldLabel>Committee</FieldLabel>
                <Typography variant="body2" sx={{ color: '#1e293b' }}>
                  {proposal.ethicsCommittee || linkedEthics?.committeeName || 'Not set'}
                                </Typography>
                              </Box>
              <Box>
                <FieldLabel>Approval date</FieldLabel>
                <Typography variant="body2" sx={{ color: '#1e293b' }}>
                  {formatDate(proposal.approvalDate || linkedEthics?.approvalDate)}
                              </Typography>
                            </Box>
              {linkedEthics ? (
                <Box>
                  <FieldLabel>Linked record</FieldLabel>
                            <Button
                    onClick={() => router.push(`/researcher/ethics/applications/view/${linkedEthics.id}`)}
                    sx={{ p: 0, minWidth: 0, textTransform: 'none', fontWeight: 700, color: PURPLE, justifyContent: 'flex-start' }}
                  >
                    {linkedEthics.title}
                            </Button>
                          </Box>
              ) : null}
              <Box>
                <FieldLabel>Documents</FieldLabel>
                {ethicsDocuments.length ? (
                  <Stack spacing={1}>
                    {ethicsDocuments.map((file, index) => (
                      <DocumentRow key={`${file.fileName || file.fileId || file.originalName || index}`} file={file} fallbackCategory="Ethics document" />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No ethics documents linked yet.
                          </Typography>
                      )}
              </Box>
            </Stack>
          </Paper>
        )}

        {activeTab === 5 && (
          <Paper sx={sectionCardSx}>
            <SectionTitle>Supporting files</SectionTitle>
            {proposal.publicationRelevance ? (
              <Box sx={{ mb: 2 }}>
                <FieldLabel>Relevance</FieldLabel>
                <Typography variant="body2" sx={{ color: '#334155', whiteSpace: 'pre-wrap' }}>
                  {proposal.publicationRelevance}
                      </Typography>
                    </Box>
            ) : null}
            {documents.length ? (
              <Stack spacing={1}>
                {documents.map((file, index) => (
                  <DocumentRow key={`${file.fileName || file.fileId || file.originalName || index}`} file={file} />
                        ))}
                      </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">No supporting files uploaded</Typography>
            )}
          </Paper>
        )}

        {activeTab === 6 && (
          <Stack spacing={2}>
            <Paper sx={sectionCardSx}>
              <SectionTitle>Review pipeline</SectionTitle>
              {tracking ? (
                <ProposalReviewStatus tracking={tracking} />
              ) : (
                          <Typography variant="body2" color="text.secondary">
                  {proposal.status === 'DRAFT' ? 'This proposal has not been submitted for review.' : 'No review pipeline assigned yet.'}
                          </Typography>
              )}
            </Paper>
            <Paper sx={sectionCardSx}>
              <SectionTitle>Review history</SectionTitle>
              {(proposal.reviewHistory || []).length ? (
                <Stack spacing={1.25}>
                  {proposal.reviewHistory.map((entry, index) => (
                    <Box key={index} sx={{ p: 1.75, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                      <Stack direction="row" justifyContent="space-between" spacing={2}>
                        {statusChip(entry.status)}
                        <Typography variant="caption" color="text.secondary">{formatDate(entry.date)}</Typography>
                      </Stack>
                      {entry.reviewer ? (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          Reviewed by {entry.reviewer}
                          </Typography>
                      ) : null}
                      {entry.comment ? (
                        <Typography variant="body2" sx={{ mt: 1, color: '#334155' }}>
                          {entry.comment}
                              </Typography>
                      ) : null}
                        </Box>
              ))}
            </Stack>
          ) : (
              <Typography variant="body2" color="text.secondary">
                  Review comments will appear here after reviewers take action.
              </Typography>
              )}
            </Paper>
          </Stack>
        )}
      </Container>

      <Drawer
        anchor="right"
        open={Boolean(selectedTask)}
        onClose={() => setSelectedTaskId(null)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, bgcolor: '#f8fafc' } }}
      >
        {renderTaskDrawer()}
      </Drawer>

      <ProposalDocumentPreviewModal
        open={Boolean(previewFile)}
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        title={previewFile ? fileName(previewFile) : 'Document preview'}
      />
    </>
  );
}
