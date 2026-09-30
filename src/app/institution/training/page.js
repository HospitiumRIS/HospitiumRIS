'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Home as HomeIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
  School as TrainingIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import { useAuth } from '@/components/AuthProvider';
import TrainingFormDialog from '@/components/Training/TrainingFormDialog';
import { formatTargetGroupLabel, TRAINING_ADMIN_TYPES } from '@/lib/training-admin';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
} from '@/components/GlobalAdmin/InstitutionModalShell';

const PURPLE = '#8b6cbc';

const STATUS_TONE = {
  PUBLISHED: { bg: '#dcfce7', color: '#166534', label: 'Published' },
  DRAFT: { bg: '#f1f5f9', color: '#475569', label: 'Draft' },
  COMPLETED: { bg: alpha(PURPLE, 0.12), color: PURPLE, label: 'Completed' },
  CANCELLED: { bg: '#fee2e2', color: '#b91c1c', label: 'Cancelled' },
};

function normalizeTrainingSeed(seed) {
  if (!seed) return null;
  if (seed.departments || seed.targetGroups) {
    return {
      ...seed,
      department: (seed.departments || []).join(', '),
      targetGroup: seed.targetGroups || seed.targetGroup || [],
    };
  }
  return seed;
}

function StatusChip({ status }) {
  const tone = STATUS_TONE[status] || { bg: '#f1f5f9', color: '#475569', label: String(status || '').replaceAll('_', ' ') };
  return <Chip size="small" label={tone.label} sx={{ bgcolor: tone.bg, color: tone.color, fontWeight: 700, height: 24 }} />;
}

function StatCard({ label, value, caption }) {
  return (
    <Paper sx={{ flex: 1, minWidth: 150, p: 2, borderRadius: 2, bgcolor: PURPLE, color: 'white' }}>
      <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 700 }}>{label}</Typography>
      <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>{value}</Typography>
      {caption ? <Typography variant="caption" sx={{ opacity: 0.75 }}>{caption}</Typography> : null}
    </Paper>
  );
}

const formatDate = (value) => {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const asGroups = (value) => (Array.isArray(value) ? value : [value]).filter(Boolean);

export default function InstitutionTrainingPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [trainings, setTrainings] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState(null);
  const [formSeed, setFormSeed] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (!TRAINING_ADMIN_TYPES.includes(user?.accountType)) {
      router.replace('/institution');
      return;
    }
    fetchTrainings();
    loadDrafts();
  }, [authLoading, isAuthenticated, user, router]);

  const loadDrafts = () => {
    try {
      const savedDrafts = localStorage.getItem('trainingDrafts');
      if (savedDrafts) setDrafts(JSON.parse(savedDrafts));
    } catch (err) {
      console.error('Error loading drafts:', err);
    }
  };

  const deleteDraft = (draftId) => {
    try {
      const savedDrafts = localStorage.getItem('trainingDrafts');
      if (!savedDrafts) return;
      const next = JSON.parse(savedDrafts).filter((item) => item.id !== draftId);
      localStorage.setItem('trainingDrafts', JSON.stringify(next));
      setDrafts(next);
    } catch (err) {
      console.error('Error deleting draft:', err);
    }
  };

  const loadDraft = (draft) => {
    setFormSeed(draft);
    setCurrentDraftId(draft.id);
    setCreateDialogOpen(true);
  };

  const sendTrainingNotifications = async (training) => {
    try {
      await fetch('/api/notifications/training-created', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainingId: training.id }),
      });
    } catch (err) {
      console.error('Error sending notifications:', err);
    }
  };

  const fetchTrainings = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/training?includeAll=true', { credentials: 'include' });
      const data = await response.json();
      if (response.status === 401) {
        router.replace('/login');
        return;
      }
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to load trainings');
      setTrainings(data.trainings || []);
    } catch (err) {
      setError(err.message || 'Failed to load trainings');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOpen = () => {
    setFormSeed(null);
    setCurrentDraftId(null);
    setCreateDialogOpen(true);
  };

  const handleEditOpen = (training) => {
    setSelectedTraining(training);
    setFormSeed(training);
    setEditDialogOpen(true);
  };

  const handleDeleteOpen = (training) => {
    setSelectedTraining(training);
    setDeleteDialogOpen(true);
  };

  const persistTraining = async (apiData, { trainingId } = {}) => {
    try {
      setSubmitting(true);
      const response = await fetch(trainingId ? `/api/training/${trainingId}` : '/api/training', {
        method: trainingId ? 'PUT' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to save training details' };
      }
      if (!trainingId && currentDraftId) {
        deleteDraft(currentDraftId);
        setCurrentDraftId(null);
      }
      return { success: true, training: data.training };
    } catch (err) {
      return { success: false, error: err.message || 'Failed to save training details' };
    } finally {
      setSubmitting(false);
    }
  };

  const handleWizardFinished = async (training, { publish } = {}) => {
    try {
      setSubmitting(true);
      let next = training;
      if (publish && training?.id) {
        const response = await fetch(`/api/training/${training.id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'PUBLISHED' }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'Failed to publish training');
        next = data.training || training;
        await sendTrainingNotifications(next);
      }
      setCreateDialogOpen(false);
      setEditDialogOpen(false);
      setSelectedTraining(null);
      setFormSeed(null);
      setNotice(publish ? 'Training published. Eligible staff have been notified.' : 'Training saved as draft.');
      await fetchTrainings();
      if (next?.id) router.push(`/institution/training/${next.id}`);
    } catch (err) {
      setError(err.message || 'Failed to finish training setup');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSubmitting(true);
      const response = await fetch(`/api/training/${selectedTraining.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to delete training');
      setDeleteDialogOpen(false);
      setSelectedTraining(null);
      setNotice('Training deleted.');
      await fetchTrainings();
    } catch (err) {
      setError(err.message || 'Failed to delete training');
    } finally {
      setSubmitting(false);
    }
  };

  const departments = useMemo(
    () => [...new Set(trainings.map((item) => item.department).filter(Boolean))].sort(),
    [trainings]
  );

  const filtered = useMemo(() => {
    return trainings.filter((training) => {
      const haystack = `${training.title} ${training.description || ''} ${training.department || ''} ${asGroups(training.targetGroup).join(' ')}`.toLowerCase();
      const matchesSearch = !search || haystack.includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || training.status === statusFilter;
      const matchesDepartment = departmentFilter === 'all' || training.department === departmentFilter;
      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [trainings, search, statusFilter, departmentFilter]);

  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const stats = {
    total: trainings.length,
    published: trainings.filter((item) => item.status === 'PUBLISHED').length,
    draft: trainings.filter((item) => item.status === 'DRAFT').length,
    registrations: trainings.reduce((sum, item) => sum + (item.registrationCount || 0), 0),
  };

  const fieldSx = {
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: PURPLE },
    '& .MuiInputLabel-root.Mui-focused': { color: PURPLE },
  };

  if (authLoading) {
    return (
      <Box sx={{ py: 10, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: PURPLE }} />
      </Box>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <Box>
      <PageHeader
        title="Manage trainings"
        description="Create sessions, publish them to staff, and track registration."
        icon={<TrainingIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/institution' },
          { label: 'Training' },
        ]}
        actionButton={
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={fetchTrainings}
              sx={{ bgcolor: 'white', color: PURPLE, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#f5f5f5' } }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateOpen}
              sx={{ bgcolor: 'white', color: PURPLE, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#f5f5f5' } }}
            >
              New training
            </Button>
          </Stack>
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
              <StatCard label="Total sessions" value={stats.total} caption="All trainings on record" />
              <StatCard label="Published" value={stats.published} caption="Visible to staff" />
              <StatCard label="Drafts" value={stats.draft + drafts.length} caption="Unpublished or local drafts" />
              <StatCard label="Registrations" value={stats.registrations} caption="Active and completed seats" />
            </Stack>

            {drafts.length ? (
              <Paper sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5 }}>Unfinished local drafts</Typography>
                <Stack spacing={1.25}>
                  {drafts.map((draft) => (
                    <Stack
                      key={draft.id}
                      direction={{ xs: 'column', md: 'row' }}
                      justifyContent="space-between"
                      alignItems={{ md: 'center' }}
                      spacing={1}
                      sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{draft.title || 'Untitled draft'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Saved {draft.savedAt ? new Date(draft.savedAt).toLocaleString() : 'recently'}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <Button size="small" onClick={() => loadDraft(draft)} sx={{ color: PURPLE, textTransform: 'none', fontWeight: 700 }}>
                          Continue
                        </Button>
                        <Button size="small" color="error" onClick={() => deleteDraft(draft.id)} sx={{ textTransform: 'none' }}>
                          Discard
                        </Button>
                      </Stack>
                    </Stack>
                  ))}
                </Stack>
              </Paper>
            ) : null}

            <Paper sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search by title, department, or audience"
                  value={search}
                  onChange={(event) => { setSearch(event.target.value); setPage(0); }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                  sx={fieldSx}
                />
                <TextField
                  select
                  size="small"
                  label="Status"
                  value={statusFilter}
                  onChange={(event) => { setStatusFilter(event.target.value); setPage(0); }}
                  SelectProps={{ native: true }}
                  sx={{ minWidth: 170, ...fieldSx }}
                >
                  <option value="all">All statuses</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </TextField>
                <TextField
                  select
                  size="small"
                  label="Department"
                  value={departmentFilter}
                  onChange={(event) => { setDepartmentFilter(event.target.value); setPage(0); }}
                  SelectProps={{ native: true }}
                  sx={{ minWidth: 220, ...fieldSx }}
                >
                  <option value="all">All departments</option>
                  {departments.map((department) => (
                    <option key={department} value={department}>{department}</option>
                  ))}
                </TextField>
              </Stack>
            </Paper>

            <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(PURPLE, 0.06) }}>
                      {['Training', 'Audience', 'Schedule', 'Capacity', 'Status', 'Actions'].map((label) => (
                        <TableCell key={label} sx={{ fontWeight: 700 }} align={label === 'Actions' ? 'right' : 'left'}>{label}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paged.length ? paged.map((training) => {
                      const filled = training.registrationCount || 0;
                      const capacity = training.maxParticipants || 0;
                      const percent = capacity ? Math.min(100, Math.round((filled / capacity) * 100)) : 0;
                      return (
                        <TableRow key={training.id} hover>
                          <TableCell sx={{ maxWidth: 320 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{training.title}</Typography>
                            <Typography variant="caption" color="text.secondary">{training.department || 'No department'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                              {asGroups(training.targetGroup).map((group) => (
                                <Chip key={group} size="small" label={formatTargetGroupLabel(group)} sx={{ bgcolor: alpha(PURPLE, 0.08), color: PURPLE, fontWeight: 700 }} />
                              ))}
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{formatDate(training.startDate)}</Typography>
                            <Typography variant="caption" color="text.secondary">to {formatDate(training.endDate)}</Typography>
                          </TableCell>
                          <TableCell sx={{ minWidth: 140 }}>
                            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }}>
                              <PeopleIcon sx={{ fontSize: 16, color: PURPLE }} />
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{filled}/{capacity || '-'}</Typography>
                            </Stack>
                            <LinearProgress
                              variant="determinate"
                              value={percent}
                              sx={{ height: 6, borderRadius: 3, bgcolor: alpha(PURPLE, 0.12), '& .MuiLinearProgress-bar': { bgcolor: PURPLE } }}
                            />
                          </TableCell>
                          <TableCell><StatusChip status={training.status} /></TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              <Tooltip title="Open details">
                                <IconButton size="small" sx={{ color: PURPLE }} onClick={() => router.push(`/institution/training/${training.id}`)}>
                                  <ViewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit">
                                <IconButton size="small" sx={{ color: PURPLE }} onClick={() => handleEditOpen(training)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton size="small" color="error" onClick={() => handleDeleteOpen(training)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    }) : (
                      <TableRow>
                        <TableCell colSpan={6} sx={{ py: 6, textAlign: 'center' }}>
                          <TrainingIcon sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            {trainings.length ? 'No trainings match these filters.' : 'No trainings yet. Create the first session for your staff.'}
                          </Typography>
                          {!trainings.length ? (
                            <Button onClick={handleCreateOpen} sx={{ mt: 1.5, color: PURPLE, textTransform: 'none', fontWeight: 700 }}>
                              New training
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={filtered.length}
                page={page}
                onPageChange={(_, next) => setPage(next)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(event) => { setRowsPerPage(parseInt(event.target.value, 10)); setPage(0); }}
              />
            </Paper>
          </>
        )}
      </Container>

      <TrainingFormDialog
        open={createDialogOpen}
        mode="create"
        initialTraining={normalizeTrainingSeed(formSeed)}
        submitting={submitting}
        onClose={() => { setCreateDialogOpen(false); setFormSeed(null); }}
        onSaveDetails={persistTraining}
        onFinished={handleWizardFinished}
      />
      <TrainingFormDialog
        open={editDialogOpen}
        mode="edit"
        initialTraining={normalizeTrainingSeed(selectedTraining)}
        submitting={submitting}
        onClose={() => { setEditDialogOpen(false); setSelectedTraining(null); }}
        onSaveDetails={persistTraining}
        onFinished={handleWizardFinished}
      />

      <InstitutionModal open={deleteDialogOpen} onClose={() => !submitting && setDeleteDialogOpen(false)} disableClose={submitting}>
        <InstitutionModalHeader
          icon={DeleteIcon}
          title="Delete training"
          subtitle="This cannot be undone"
          tone="danger"
          onClose={() => setDeleteDialogOpen(false)}
          disableClose={submitting}
          dense
        />
        <InstitutionModalBody dense>
          <Typography variant="body2" color="text.secondary">
            Delete <strong>{selectedTraining?.title}</strong>? Modules, materials, and progress for this session will be removed.
          </Typography>
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            Registered staff will lose access to this training.
          </Alert>
        </InstitutionModalBody>
        <InstitutionModalFooter>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={submitting} color="inherit" size="small">Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={submitting} size="small">
            {submitting ? 'Deleting...' : 'Delete training'}
          </Button>
        </InstitutionModalFooter>
      </InstitutionModal>

      <Snackbar open={Boolean(notice)} autoHideDuration={4000} onClose={() => setNotice('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setNotice('')} severity="success" sx={{ width: '100%' }}>{notice}</Alert>
      </Snackbar>
    </Box>
  );
}
