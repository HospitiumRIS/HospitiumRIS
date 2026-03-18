'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  Badge,
  InputAdornment as MuiInputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Pending as PendingIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  Comment as CommentIcon,
  Send as SendIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Business as BusinessIcon,
  Description as DescriptionIcon,
  HourglassEmpty as HourglassIcon,
  Cancel as CancelIcon,
  TaskAlt as TaskAltIcon,
  RateReview as ReviewIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircleOutline as ApprovedIcon,
  DoNotDisturb as RejectedIcon,
  AutorenewRounded as RevisionIcon,
  FileDownload as DownloadIcon,
  Inbox as InboxIcon,
  AccountTree as StagesIcon,
  BarChart as BarChartIcon,
  NoteAdd as NoteAddIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';

// ─── Constants ──────────────────────────────────────────────────────────────

const PURPOSE_OPTIONS = [
  'Research',
  'Equipment',
  'Travel',
  'Training & Development',
  'Operations',
  'Infrastructure',
  'Community Outreach',
  'Other',
];

const STAGE_LABELS = {
  intake: 'Intake',
  initial_review: 'Initial Review',
  committee_review: 'Committee Review',
  final_decision: 'Final Decision',
};

const STAGE_ORDER = ['intake', 'initial_review', 'committee_review', 'final_decision'];

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'default', icon: <DescriptionIcon sx={{ fontSize: 14 }} /> },
  submitted: { label: 'Submitted', color: 'info', icon: <InboxIcon sx={{ fontSize: 14 }} /> },
  under_review: { label: 'Under Review', color: 'warning', icon: <HourglassIcon sx={{ fontSize: 14 }} /> },
  approved: { label: 'Approved', color: 'success', icon: <CheckCircleIcon sx={{ fontSize: 14 }} /> },
  rejected: { label: 'Rejected', color: 'error', icon: <CancelIcon sx={{ fontSize: 14 }} /> },
  revision_requested: { label: 'Revision Requested', color: 'warning', icon: <RevisionIcon sx={{ fontSize: 14 }} /> },
};

const EMPTY_FORM = {
  applicantName: '',
  applicantEmail: '',
  applicantTitle: '',
  department: '',
  title: '',
  purpose: '',
  description: '',
  requestedAmount: '',
  projectStartDate: '',
  projectEndDate: '',
};

const EMPTY_REVIEW = {
  reviewerName: '',
  reviewerEmail: '',
  decision: '',
  comments: '',
  approvedAmount: '',
  decisionNotes: '',
  revisionNotes: '',
  reportingRequired: false,
  reportDueDate: '',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');

const stageIdx = (s) => STAGE_ORDER.indexOf(s);

// ─── Main Component ──────────────────────────────────────────────────────────

const InternalGrantRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTab, setSelectedTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Dialogs
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Selected / form state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [reviewData, setReviewData] = useState(EMPTY_REVIEW);
  const [formErrors, setFormErrors] = useState({});
  const [reviewErrors, setReviewErrors] = useState({});

  // ── Data fetch ──
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search: searchTerm, status: filterStatus });
      const res = await fetch(`/api/foundation/internal-grants?${params}`);
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests);
        setStats(data.stats || {});
      }
    } catch (err) {
      showSnackbar('Failed to load grant requests', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterStatus]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const showSnackbar = (message, severity = 'success') =>
    setSnackbar({ open: true, message, severity });

  // ── Form helpers ──
  const handleFormChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    setFormErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleReviewChange = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setReviewData(prev => ({ ...prev, [field]: val }));
    setReviewErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.applicantName.trim()) errs.applicantName = 'Required';
    if (!formData.applicantEmail.trim()) errs.applicantEmail = 'Required';
    if (!formData.department.trim()) errs.department = 'Required';
    if (!formData.title.trim()) errs.title = 'Required';
    if (!formData.purpose) errs.purpose = 'Required';
    if (!formData.description.trim()) errs.description = 'Required';
    if (!formData.requestedAmount || parseFloat(formData.requestedAmount) <= 0) errs.requestedAmount = 'Must be > 0';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateReview = () => {
    const errs = {};
    if (!reviewData.reviewerName.trim()) errs.reviewerName = 'Required';
    if (!reviewData.decision) errs.decision = 'Required';
    if (!reviewData.comments.trim()) errs.comments = 'Required';
    if (reviewData.decision === 'approved' && (!reviewData.approvedAmount || parseFloat(reviewData.approvedAmount) <= 0))
      errs.approvedAmount = 'Required for approval';
    setReviewErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── CRUD actions ──
  const openIntake = (req = null) => {
    if (req) {
      setFormData({
        applicantName: req.applicantName || '',
        applicantEmail: req.applicantEmail || '',
        applicantTitle: req.applicantTitle || '',
        department: req.department || '',
        title: req.title || '',
        purpose: req.purpose || '',
        description: req.description || '',
        requestedAmount: req.requestedAmount?.toString() || '',
        projectStartDate: req.projectStartDate ? req.projectStartDate.split('T')[0] : '',
        projectEndDate: req.projectEndDate ? req.projectEndDate.split('T')[0] : '',
      });
      setEditMode(true);
      setSelectedRequest(req);
    } else {
      setFormData(EMPTY_FORM);
      setEditMode(false);
      setSelectedRequest(null);
    }
    setFormErrors({});
    setIntakeOpen(true);
  };

  const handleSaveRequest = async (submit = false) => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload = { ...formData, submit };
      let res;
      if (editMode && selectedRequest) {
        res = await fetch('/api/foundation/internal-grants', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: selectedRequest.id, action: 'edit', ...payload }),
        });
      } else {
        res = await fetch('/api/foundation/internal-grants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      const data = await res.json();
      if (data.success) {
        showSnackbar(data.message);
        setIntakeOpen(false);
        fetchRequests();
      } else {
        showSnackbar(data.error || 'Save failed', 'error');
      }
    } catch {
      showSnackbar('Network error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (req) => {
    // Refresh the single record to get latest reviews
    try {
      const res = await fetch(`/api/foundation/internal-grants?id=${req.id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedRequest(data.request);
      } else {
        setSelectedRequest(req);
      }
    } catch {
      setSelectedRequest(req);
    }
    setDetailOpen(true);
  };

  const openReview = (req) => {
    setSelectedRequest(req);
    setReviewData({ ...EMPTY_REVIEW, reviewerName: '' });
    setReviewErrors({});
    setReviewOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!validateReview()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/foundation/internal-grants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRequest.id,
          action: 'review',
          stage: selectedRequest.stage,
          ...reviewData,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showSnackbar('Review recorded successfully');
        setReviewOpen(false);
        setDetailOpen(false);
        fetchRequests();
      } else {
        showSnackbar(data.error || 'Review failed', 'error');
      }
    } catch {
      showSnackbar('Network error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkReport = async (req) => {
    try {
      const res = await fetch('/api/foundation/internal-grants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: req.id, action: 'report' }),
      });
      const data = await res.json();
      if (data.success) {
        showSnackbar('Report marked as submitted');
        fetchRequests();
      } else {
        showSnackbar(data.error, 'error');
      }
    } catch {
      showSnackbar('Network error', 'error');
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/foundation/internal-grants?id=${selectedRequest.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showSnackbar('Request deleted');
        setDeleteOpen(false);
        setDetailOpen(false);
        fetchRequests();
      } else {
        showSnackbar(data.error, 'error');
      }
    } catch {
      showSnackbar('Network error', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Filtered data ──
  const filteredRequests = requests.filter(r => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q ||
      r.title?.toLowerCase().includes(q) ||
      r.applicantName?.toLowerCase().includes(q) ||
      r.department?.toLowerCase().includes(q) ||
      r.purpose?.toLowerCase().includes(q);
    return matchSearch;
  });

  const tabRequests = selectedTab === 0
    ? filteredRequests
    : selectedTab === 1
      ? filteredRequests.filter(r => ['submitted', 'under_review'].includes(r.status))
      : selectedTab === 2
        ? filteredRequests.filter(r => r.status === 'approved')
        : filteredRequests.filter(r => ['rejected', 'revision_requested'].includes(r.status));

  // ── Review decision options based on current stage ──
  const getDecisionOptions = (req) => {
    if (!req) return [];
    const isLast = req.stage === 'final_decision' || req.stage === 'committee_review';
    const opts = [];
    if (req.stage !== 'final_decision') opts.push({ value: 'forward', label: 'Forward to Next Stage' });
    opts.push({ value: 'approved', label: 'Approve' });
    opts.push({ value: 'rejected', label: 'Reject' });
    opts.push({ value: 'revision_requested', label: 'Request Revision' });
    return opts;
  };

  // ─── Stats Cards ────────────────────────────────────────────────────────────
  const statCards = [
    { label: 'Total Requests', value: stats.total || 0, icon: <AssignmentIcon />, color: '#8b6cbc' },
    { label: 'Under Review', value: (stats.submitted || 0) + (stats.under_review || 0), icon: <HourglassIcon />, color: '#8b6cbc' },
    { label: 'Approved', value: stats.approved || 0, icon: <CheckCircleIcon />, color: '#8b6cbc' },
    { label: 'Total Approved Funding', value: fmt(stats.totalApprovedAmount), icon: <MoneyIcon />, color: '#8b6cbc', isAmount: true },
  ];

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Page Header */}
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Internal Grant Requests"
          description="Manage internal funding requests — intake, review stages, approval workflow, and reporting"
          icon={<NoteAddIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Foundation', path: '/foundation' },
            { label: 'Grants', path: '/foundation/grants' },
            { label: 'Internal Requests' },
          ]}
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
          actionButton={
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={<ReviewIcon />}
                onClick={() => window.location.href = '/foundation/grants/internal-requests/review'}
                sx={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', '&:hover': { background: 'rgba(255,255,255,0.25)' } }}
              >
                Review System
              </Button>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={fetchRequests}
                sx={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', '&:hover': { background: 'rgba(255,255,255,0.25)' } }}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => window.location.href = '/foundation/grants/internal-requests/create'}
                sx={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.4)', fontWeight: 600, '&:hover': { background: 'rgba(255,255,255,0.3)' } }}
              >
                New Request
              </Button>
            </Stack>
          }
        />
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Stats Cards */}
        <Box sx={{ display: 'flex', gap: 2.5, mb: 4, flexWrap: 'wrap' }}>
          {statCards.map((card, i) => (
            <Paper 
              key={i}
              elevation={0} 
              sx={{ 
                flex: '1 1 200px',
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
                justifyContent: 'space-between',
                transition: 'all 0.2s',
                '&:hover': { 
                  boxShadow: '0 4px 12px rgba(139, 108, 188, 0.3)',
                  transform: 'translateY(-2px)' 
                }
              }}
            >
              <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                  {card.label}
                </Typography>
                <Box sx={{ color: 'white', opacity: 0.9, fontSize: 18 }}>
                  {card.icon}
                </Box>
              </Box>
              <Typography variant={card.isAmount ? 'h6' : 'h4'} sx={{ fontWeight: 700, color: 'white', fontSize: card.isAmount ? '1.25rem' : '1.75rem' }}>
                {card.value}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                {card.isAmount ? 'Total funding approved' : `${card.label.toLowerCase()}`}
              </Typography>
            </Paper>
          ))}
        </Box>

        {/* Filters & Tabs */}
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
          <Box sx={{ px: 3, pt: 2, pb: 0 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <TextField
                size="small"
                placeholder="Search requests…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} /></InputAdornment> }}
                sx={{ flex: 1, minWidth: 220 }}
              />
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Filter by Status</InputLabel>
                <Select value={filterStatus} label="Filter by Status" onChange={(e) => setFilterStatus(e.target.value)}>
                  <MenuItem value="all">All Statuses</MenuItem>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <MenuItem key={k} value={k}>{v.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <Tabs
              value={selectedTab}
              onChange={(_, v) => setSelectedTab(v)}
              sx={{ '& .MuiTab-root': { fontWeight: 600 }, '& .MuiTabs-indicator': { backgroundColor: '#8b6cbc' } }}
            >
              <Tab label={`All (${filteredRequests.length})`} />
              <Tab label={`In Progress (${filteredRequests.filter(r => ['submitted', 'under_review'].includes(r.status)).length})`} />
              <Tab label={`Approved (${filteredRequests.filter(r => r.status === 'approved').length})`} />
              <Tab label={`Decided (${filteredRequests.filter(r => ['rejected', 'revision_requested'].includes(r.status)).length})`} />
            </Tabs>
          </Box>
        </Paper>

        {/* Requests Table */}
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress sx={{ color: '#8b6cbc' }} /></Box>
          ) : tabRequests.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: alpha('#8b6cbc', 0.1), color: '#8b6cbc', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                <AssignmentIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography variant="h6" color="text.secondary" gutterBottom>No requests found</Typography>
              <Typography variant="body2" color="text.secondary">Submit a new internal grant request to get started.</Typography>
              <Button startIcon={<AddIcon />} variant="contained" onClick={() => window.location.href = '/foundation/grants/internal-requests/create'} sx={{ mt: 3, bgcolor: '#8b6cbc', '&:hover': { bgcolor: '#7b5cac' } }}>
                New Request
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha('#8b6cbc', 0.04) }}>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Request</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Applicant</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Stage</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Submitted</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tabRequests.map((req) => {
                    const statusCfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.draft;
                    return (
                      <TableRow
                        key={req.id}
                        hover
                        sx={{ cursor: 'pointer', '&:hover': { bgcolor: alpha('#8b6cbc', 0.03) } }}
                        onClick={() => openDetail(req)}
                      >
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight={600} sx={{ mb: 0.3 }}>{req.title}</Typography>
                            <Typography variant="caption" color="text.secondary">{req.purpose} · {req.department}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ width: 30, height: 30, bgcolor: alpha('#8b6cbc', 0.15), color: '#8b6cbc', fontSize: 12 }}>
                              {req.applicantName?.[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>{req.applicantName}</Typography>
                              <Typography variant="caption" color="text.secondary">{req.applicantTitle || req.applicantEmail}</Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{fmt(req.requestedAmount)}</Typography>
                            {req.approvedAmount && (
                              <Typography variant="caption" color="success.main">Approved: {fmt(req.approvedAmount)}</Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LinearProgress
                              variant="determinate"
                              value={((stageIdx(req.stage) + 1) / STAGE_ORDER.length) * 100}
                              sx={{ width: 60, height: 5, borderRadius: 3, bgcolor: alpha('#8b6cbc', 0.15), '& .MuiLinearProgress-bar': { bgcolor: '#8b6cbc' } }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                              {STAGE_LABELS[req.stage]}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={statusCfg.label}
                            color={statusCfg.color}
                            icon={statusCfg.icon}
                            sx={{ fontWeight: 600, '& .MuiChip-icon': { ml: 0.5 } }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {req.submittedAt ? fmtDate(req.submittedAt) : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip title="View Details">
                              <IconButton size="small" onClick={() => openDetail(req)} sx={{ color: '#8b6cbc' }}>
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {['draft', 'revision_requested'].includes(req.status) && (
                              <Tooltip title="Edit">
                                <IconButton size="small" onClick={() => openIntake(req)} sx={{ color: 'text.secondary' }}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {['submitted', 'under_review'].includes(req.status) && (
                              <Tooltip title="Review">
                                <IconButton size="small" onClick={() => window.location.href = `/foundation/grants/internal-requests/review/${req.id}/submit`} sx={{ color: '#f57c00' }}>
                                  <ReviewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {req.status === 'approved' && req.reportingRequired && !req.reportSubmitted && (
                              <Tooltip title="Mark Report Submitted">
                                <IconButton size="small" onClick={() => handleMarkReport(req)} sx={{ color: 'success.main' }}>
                                  <TaskAltIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {req.status === 'draft' && (
                              <Tooltip title="Delete">
                                <IconButton size="small" onClick={() => { setSelectedRequest(req); setDeleteOpen(true); }} sx={{ color: 'error.main' }}>
                                  <DeleteIcon fontSize="small" />
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
          )}
        </Paper>
      </Container>

      {/* ── Intake / Edit Dialog ────────────────────────────────────────────── */}
      <Dialog open={intakeOpen} onClose={() => setIntakeOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: alpha('#8b6cbc', 0.12), color: '#8b6cbc', width: 40, height: 40 }}>
              <NoteAddIcon />
            </Avatar>
            <Typography variant="h6" fontWeight={700}>{editMode ? 'Edit Request' : 'New Internal Grant Request'}</Typography>
          </Stack>
          <IconButton onClick={() => setIntakeOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="subtitle2" color="#8b6cbc" fontWeight={700} sx={{ mb: 2, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>
            Applicant Information
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Full Name *" value={formData.applicantName} onChange={handleFormChange('applicantName')} error={!!formErrors.applicantName} helperText={formErrors.applicantName} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Email Address *" type="email" value={formData.applicantEmail} onChange={handleFormChange('applicantEmail')} error={!!formErrors.applicantEmail} helperText={formErrors.applicantEmail} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Job Title" value={formData.applicantTitle} onChange={handleFormChange('applicantTitle')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Department *" value={formData.department} onChange={handleFormChange('department')} error={!!formErrors.department} helperText={formErrors.department} />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 3 }} />
          <Typography variant="subtitle2" color="#8b6cbc" fontWeight={700} sx={{ mb: 2, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>
            Request Details
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Project / Request Title *" value={formData.title} onChange={handleFormChange('title')} error={!!formErrors.title} helperText={formErrors.title} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" error={!!formErrors.purpose}>
                <InputLabel>Purpose / Category *</InputLabel>
                <Select value={formData.purpose} label="Purpose / Category *" onChange={handleFormChange('purpose')}>
                  {PURPOSE_OPTIONS.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>
                {formErrors.purpose && <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>{formErrors.purpose}</Typography>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small" label="Requested Amount (USD) *" type="number"
                value={formData.requestedAmount} onChange={handleFormChange('requestedAmount')}
                error={!!formErrors.requestedAmount} helperText={formErrors.requestedAmount}
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={4} size="small" label="Description & Justification *" value={formData.description} onChange={handleFormChange('description')} error={!!formErrors.description} helperText={formErrors.description} placeholder="Describe the purpose of this funding request, expected outcomes, and justification…" />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 3 }} />
          <Typography variant="subtitle2" color="#8b6cbc" fontWeight={700} sx={{ mb: 2, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>
            Project Timeline (Optional)
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Start Date" type="date" value={formData.projectStartDate} onChange={handleFormChange('projectStartDate')} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="End Date" type="date" value={formData.projectEndDate} onChange={handleFormChange('projectEndDate')} InputLabelProps={{ shrink: true }} />
            </Grid>
          </Grid>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setIntakeOpen(false)} color="inherit">Cancel</Button>
          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={() => handleSaveRequest(false)}
            disabled={saving}
            sx={{ borderColor: '#8b6cbc', color: '#8b6cbc' }}
          >
            Save as Draft
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
            onClick={() => handleSaveRequest(true)}
            disabled={saving}
            sx={{ bgcolor: '#8b6cbc', '&:hover': { bgcolor: '#7b5cac' } }}
          >
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Detail Dialog ───────────────────────────────────────────────────── */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        {selectedRequest && (
          <>
            <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar sx={{ bgcolor: alpha('#8b6cbc', 0.12), color: '#8b6cbc', width: 40, height: 40 }}>
                  <AssignmentIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>{selectedRequest.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{selectedRequest.department} · {selectedRequest.purpose}</Typography>
                </Box>
              </Stack>
              <IconButton onClick={() => setDetailOpen(false)}><CloseIcon /></IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ pt: 3 }}>
              {/* Status & Amount Row */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                <Paper variant="outlined" sx={{ flex: 1, p: 2, borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>STATUS</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      size="small"
                      label={STATUS_CONFIG[selectedRequest.status]?.label}
                      color={STATUS_CONFIG[selectedRequest.status]?.color}
                      sx={{ fontWeight: 700 }}
                    />
                  </Box>
                </Paper>
                <Paper variant="outlined" sx={{ flex: 1, p: 2, borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>CURRENT STAGE</Typography>
                  <Typography variant="body2" fontWeight={700} sx={{ mt: 0.5 }}>{STAGE_LABELS[selectedRequest.stage]}</Typography>
                </Paper>
                <Paper variant="outlined" sx={{ flex: 1, p: 2, borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>REQUESTED</Typography>
                  <Typography variant="body2" fontWeight={700} color="#8b6cbc" sx={{ mt: 0.5 }}>{fmt(selectedRequest.requestedAmount)}</Typography>
                </Paper>
                {selectedRequest.approvedAmount && (
                  <Paper variant="outlined" sx={{ flex: 1, p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>APPROVED</Typography>
                    <Typography variant="body2" fontWeight={700} color="success.main" sx={{ mt: 0.5 }}>{fmt(selectedRequest.approvedAmount)}</Typography>
                  </Paper>
                )}
              </Stack>

              {/* Applicant */}
              <Typography variant="subtitle2" fontWeight={700} color="#8b6cbc" sx={{ mb: 1.5, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>Applicant</Typography>
              <Stack direction="row" spacing={3} sx={{ mb: 3, flexWrap: 'wrap' }}>
                <Box><Typography variant="caption" color="text.secondary">Name</Typography><Typography variant="body2" fontWeight={600}>{selectedRequest.applicantName}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Email</Typography><Typography variant="body2">{selectedRequest.applicantEmail}</Typography></Box>
                {selectedRequest.applicantTitle && <Box><Typography variant="caption" color="text.secondary">Title</Typography><Typography variant="body2">{selectedRequest.applicantTitle}</Typography></Box>}
                <Box><Typography variant="caption" color="text.secondary">Department</Typography><Typography variant="body2">{selectedRequest.department}</Typography></Box>
              </Stack>

              {/* Description */}
              <Typography variant="subtitle2" fontWeight={700} color="#8b6cbc" sx={{ mb: 1.5, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>Description</Typography>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 3, bgcolor: alpha('#8b6cbc', 0.02) }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{selectedRequest.description}</Typography>
              </Paper>

              {/* Timeline */}
              {(selectedRequest.projectStartDate || selectedRequest.projectEndDate) && (
                <>
                  <Typography variant="subtitle2" fontWeight={700} color="#8b6cbc" sx={{ mb: 1.5, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>Project Dates</Typography>
                  <Stack direction="row" spacing={4} sx={{ mb: 3 }}>
                    {selectedRequest.projectStartDate && <Box><Typography variant="caption" color="text.secondary">Start</Typography><Typography variant="body2" fontWeight={600}>{fmtDate(selectedRequest.projectStartDate)}</Typography></Box>}
                    {selectedRequest.projectEndDate && <Box><Typography variant="caption" color="text.secondary">End</Typography><Typography variant="body2" fontWeight={600}>{fmtDate(selectedRequest.projectEndDate)}</Typography></Box>}
                  </Stack>
                </>
              )}

              {/* Review Progress Stepper */}
              <Typography variant="subtitle2" fontWeight={700} color="#8b6cbc" sx={{ mb: 2, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>Review Lifecycle</Typography>
              <Stepper activeStep={stageIdx(selectedRequest.stage)} orientation="vertical" sx={{ mb: 3, '& .MuiStepLabel-label': { fontWeight: 600 } }}>
                {STAGE_ORDER.map((stage, idx) => {
                  const stageReviews = (selectedRequest.reviews || []).filter(r => r.stage === stage);
                  const isActive = stageIdx(selectedRequest.stage) >= idx;
                  return (
                    <Step key={stage} completed={stageIdx(selectedRequest.stage) > idx}>
                      <StepLabel
                        StepIconProps={{
                          sx: {
                            color: isActive ? '#8b6cbc !important' : undefined,
                            '&.Mui-completed': { color: '#8b6cbc !important' }
                          }
                        }}
                      >
                        {STAGE_LABELS[stage]}
                      </StepLabel>
                      <StepContent>
                        {stageReviews.length === 0 ? (
                          <Typography variant="caption" color="text.secondary">No reviews yet at this stage.</Typography>
                        ) : stageReviews.map((rev, ri) => (
                          <Box key={ri} sx={{ mb: 1.5, p: 1.5, bgcolor: alpha('#8b6cbc', 0.04), borderRadius: 2, border: '1px solid', borderColor: alpha('#8b6cbc', 0.12) }}>
                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                              <Typography variant="caption" fontWeight={700}>{rev.reviewerName}</Typography>
                              <Stack direction="row" spacing={1}>
                                <Chip size="small" label={rev.decision} color={rev.decision === 'approved' ? 'success' : rev.decision === 'rejected' ? 'error' : rev.decision === 'forward' ? 'info' : 'warning'} sx={{ height: 18, fontSize: '0.65rem' }} />
                                <Typography variant="caption" color="text.secondary">{fmtDate(rev.reviewDate)}</Typography>
                              </Stack>
                            </Stack>
                            <Typography variant="caption" color="text.secondary">{rev.comments}</Typography>
                          </Box>
                        ))}
                      </StepContent>
                    </Step>
                  );
                })}
              </Stepper>

              {/* Decision details if finalized */}
              {['approved', 'rejected', 'revision_requested'].includes(selectedRequest.status) && (
                <>
                  <Typography variant="subtitle2" fontWeight={700} color="#8b6cbc" sx={{ mb: 1.5, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>Decision</Typography>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 3, borderColor: selectedRequest.status === 'approved' ? 'success.light' : selectedRequest.status === 'rejected' ? 'error.light' : 'warning.light' }}>
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Avatar sx={{ bgcolor: selectedRequest.status === 'approved' ? alpha('#2e7d32', 0.1) : selectedRequest.status === 'rejected' ? alpha('#c62828', 0.1) : alpha('#f57c00', 0.1), color: selectedRequest.status === 'approved' ? 'success.main' : selectedRequest.status === 'rejected' ? 'error.main' : 'warning.main', width: 36, height: 36 }}>
                        {selectedRequest.status === 'approved' ? <CheckCircleIcon /> : selectedRequest.status === 'rejected' ? <CancelIcon /> : <RevisionIcon />}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>{STATUS_CONFIG[selectedRequest.status]?.label}</Typography>
                        {selectedRequest.decisionDate && <Typography variant="caption" color="text.secondary">{fmtDate(selectedRequest.decisionDate)}</Typography>}
                        {selectedRequest.decisionNotes && <Typography variant="body2" sx={{ mt: 1 }}>{selectedRequest.decisionNotes}</Typography>}
                        {selectedRequest.revisionNotes && <Typography variant="body2" sx={{ mt: 1 }}><strong>Revision required:</strong> {selectedRequest.revisionNotes}</Typography>}
                      </Box>
                    </Stack>
                  </Paper>
                </>
              )}

              {/* Reporting */}
              {selectedRequest.status === 'approved' && selectedRequest.reportingRequired && (
                <>
                  <Typography variant="subtitle2" fontWeight={700} color="#8b6cbc" sx={{ mb: 1.5, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>Reporting</Typography>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body2" fontWeight={600}>Report Due: {selectedRequest.reportDueDate ? fmtDate(selectedRequest.reportDueDate) : '—'}</Typography>
                        <Typography variant="caption" color={selectedRequest.reportSubmitted ? 'success.main' : 'warning.main'}>
                          {selectedRequest.reportSubmitted ? `Submitted ${fmtDate(selectedRequest.reportSubmittedAt)}` : 'Pending submission'}
                        </Typography>
                      </Box>
                      {!selectedRequest.reportSubmitted && (
                        <Button size="small" variant="outlined" color="success" startIcon={<TaskAltIcon />} onClick={() => handleMarkReport(selectedRequest)}>
                          Mark Submitted
                        </Button>
                      )}
                    </Stack>
                  </Paper>
                </>
              )}
            </DialogContent>
            <Divider />
            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
              <Button onClick={() => setDetailOpen(false)} color="inherit">Close</Button>
              {['draft', 'revision_requested'].includes(selectedRequest.status) && (
                <Button startIcon={<EditIcon />} variant="outlined" onClick={() => { setDetailOpen(false); openIntake(selectedRequest); }} sx={{ borderColor: '#8b6cbc', color: '#8b6cbc' }}>
                  Edit
                </Button>
              )}
              {['submitted', 'under_review'].includes(selectedRequest.status) && (
                <Button
                  startIcon={<ReviewIcon />}
                  variant="contained"
                  onClick={() => { setDetailOpen(false); openReview(selectedRequest); }}
                  sx={{ bgcolor: '#8b6cbc', '&:hover': { bgcolor: '#7b5cac' } }}
                >
                  Record Review
                </Button>
              )}
              {selectedRequest.status === 'draft' && (
                <Button
                  startIcon={<DeleteIcon />}
                  variant="outlined"
                  color="error"
                  onClick={() => { setDetailOpen(false); setDeleteOpen(true); }}
                >
                  Delete
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── Review Dialog ───────────────────────────────────────────────────── */}
      <Dialog open={reviewOpen} onClose={() => setReviewOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        {selectedRequest && (
          <>
            <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar sx={{ bgcolor: alpha('#f57c00', 0.12), color: '#f57c00', width: 40, height: 40 }}>
                  <ReviewIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>Record Review</Typography>
                  <Typography variant="caption" color="text.secondary">Stage: {STAGE_LABELS[selectedRequest.stage]}</Typography>
                </Box>
              </Stack>
              <IconButton onClick={() => setReviewOpen(false)}><CloseIcon /></IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ pt: 3 }}>
              <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                Reviewing: <strong>{selectedRequest.title}</strong> — {fmt(selectedRequest.requestedAmount)} by {selectedRequest.applicantName}
              </Alert>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Reviewer Name *" value={reviewData.reviewerName} onChange={handleReviewChange('reviewerName')} error={!!reviewErrors.reviewerName} helperText={reviewErrors.reviewerName} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Reviewer Email" value={reviewData.reviewerEmail} onChange={handleReviewChange('reviewerEmail')} />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small" error={!!reviewErrors.decision}>
                    <InputLabel>Decision *</InputLabel>
                    <Select value={reviewData.decision} label="Decision *" onChange={handleReviewChange('decision')}>
                      {getDecisionOptions(selectedRequest).map(opt => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                      ))}
                    </Select>
                    {reviewErrors.decision && <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>{reviewErrors.decision}</Typography>}
                  </FormControl>
                </Grid>
                {reviewData.decision === 'approved' && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth size="small" label="Approved Amount *" type="number"
                        value={reviewData.approvedAmount} onChange={handleReviewChange('approvedAmount')}
                        error={!!reviewErrors.approvedAmount} helperText={reviewErrors.approvedAmount}
                        InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth size="small" label="Report Due Date" type="date" value={reviewData.reportDueDate} onChange={handleReviewChange('reportDueDate')} InputLabelProps={{ shrink: true }} />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl size="small">
                        <Stack direction="row" spacing={1} alignItems="center">
                          <input type="checkbox" id="reportingRequired" checked={reviewData.reportingRequired} onChange={handleReviewChange('reportingRequired')} />
                          <label htmlFor="reportingRequired" style={{ fontSize: 14, cursor: 'pointer' }}>Reporting required for this grant</label>
                        </Stack>
                      </FormControl>
                    </Grid>
                  </>
                )}
                {reviewData.decision === 'revision_requested' && (
                  <Grid item xs={12}>
                    <TextField fullWidth multiline rows={2} size="small" label="Revision Requirements" value={reviewData.revisionNotes} onChange={handleReviewChange('revisionNotes')} placeholder="Describe what changes are required…" />
                  </Grid>
                )}
                <Grid item xs={12}>
                  <TextField fullWidth multiline rows={3} size="small" label="Review Comments *" value={reviewData.comments} onChange={handleReviewChange('comments')} error={!!reviewErrors.comments} helperText={reviewErrors.comments} placeholder="Provide detailed review comments…" />
                </Grid>
                {['approved', 'rejected'].includes(reviewData.decision) && (
                  <Grid item xs={12}>
                    <TextField fullWidth multiline rows={2} size="small" label="Decision Notes (optional)" value={reviewData.decisionNotes} onChange={handleReviewChange('decisionNotes')} placeholder="Additional notes for the decision record…" />
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <Divider />
            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
              <Button onClick={() => setReviewOpen(false)} color="inherit">Cancel</Button>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                onClick={handleSubmitReview}
                disabled={saving}
                sx={{ bgcolor: '#8b6cbc', '&:hover': { bgcolor: '#7b5cac' } }}
              >
                Submit Review
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── Delete Confirm ──────────────────────────────────────────────────── */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle>Delete Request?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This will permanently delete <strong>{selectedRequest?.title}</strong>. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDeleteOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ────────────────────────────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default InternalGrantRequestsPage;
