'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  People as PeopleIcon,
  School as TrainingIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import PageHeader from '@/components/common/PageHeader';
import { Home as HomeIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/components/AuthProvider';
import TrainingFormDialog from '@/components/Training/TrainingFormDialog';
import { formatTargetGroupLabel, TRAINING_ADMIN_TYPES } from '@/lib/training-admin';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
} from '@/components/GlobalAdmin/InstitutionModalShell';
import { Delete as DeleteIconModal } from '@mui/icons-material';

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

export default function InstitutionTrainingPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [trainings, setTrainings] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [error, setError] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState(null);

  const [formSeed, setFormSeed] = useState(null);

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
      if (savedDrafts) {
        setDrafts(JSON.parse(savedDrafts));
      }
    } catch (err) {
      console.error('Error loading drafts:', err);
    }
  };

  const loadDraft = (draft) => {
    setFormSeed(draft);
    setCurrentDraftId(draft.id);
    setCreateDialogOpen(true);
  };

  const deleteDraft = (draftId) => {
    try {
      const savedDrafts = localStorage.getItem('trainingDrafts');
      if (savedDrafts) {
        let draftsArray = JSON.parse(savedDrafts);
        draftsArray = draftsArray.filter(d => d.id !== draftId);
        localStorage.setItem('trainingDrafts', JSON.stringify(draftsArray));
        setDrafts(draftsArray);
      }
    } catch (err) {
      console.error('Error deleting draft:', err);
    }
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
      setError(null);
      const response = await fetch('/api/training?includeAll=true', { credentials: 'include' });
      const data = await response.json();

      if (response.status === 401) {
        router.replace('/login');
        return;
      }

      if (data.success) {
        setTrainings(data.trainings || []);
      } else {
        setError(data.error || 'Failed to load trainings');
      }
    } catch (err) {
      console.error('Error fetching trainings:', err);
      setError('Failed to load trainings');
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

  const handleCreate = async (apiData) => {
    try {
      setSubmitting(true);
      const response = await fetch('/api/training', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      });

      const data = await response.json();

      if (data.success) {
        // Delete draft after successful creation
        if (currentDraftId) {
          deleteDraft(currentDraftId);
        }
        setCreateDialogOpen(false);
        setCurrentDraftId(null);
        fetchTrainings();
        
        // Send notifications to users only if published
        if (data.training.status === 'PUBLISHED') {
          await sendTrainingNotifications(data.training);
        }
      } else {
        alert(data.error || 'Failed to create training');
      }
    } catch (err) {
      console.error('Error creating training:', err);
      alert('Failed to create training');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (apiData) => {
    try {
      setSubmitting(true);
      const response = await fetch(`/api/training/${selectedTraining.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      });

      const data = await response.json();

      if (data.success) {
        setEditDialogOpen(false);
        setSelectedTraining(null);
        fetchTrainings();
      } else {
        alert(data.error || 'Failed to update training');
      }
    } catch (err) {
      console.error('Error updating training:', err);
      alert('Failed to update training');
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

      if (data.success) {
        setDeleteDialogOpen(false);
        setSelectedTraining(null);
        fetchTrainings();
      } else {
        alert(data.error || 'Failed to delete training');
      }
    } catch (err) {
      console.error('Error deleting training:', err);
      alert('Failed to delete training');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PUBLISHED': return 'success';
      case 'DRAFT': return 'default';
      case 'COMPLETED': return 'info';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (authLoading || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#8b6cbc' }} />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
        title={t('institution_nav.manage_trainings')}
        description={t('institution_nav.manage_trainings_desc')}
        icon={<TrainingIcon sx={{ fontSize: 40 }} />}
        breadcrumbs={[
          { label: 'Home', path: '/institution', icon: <HomeIcon /> },
          { label: 'Training' }
        ]}
        actionButton={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateOpen}
            sx={{
              backgroundColor: 'white',
              color: '#8b6cbc',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' },
            }}
          >
            New Training
          </Button>
        }
      />
      </Box>
      <Container maxWidth="xl" sx={{ py: 4 }}>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Drafts Section */}
      {drafts.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#8b6cbc' }}>
            Saved Drafts ({drafts.length})
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {drafts.map((draft) => (
              <Card key={draft.id} sx={{ minWidth: 300, maxWidth: 400 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {draft.title || 'Untitled Draft'}
                    </Typography>
                    <Chip label="Draft" size="small" color="warning" />
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    Saved: {new Date(draft.savedAt).toLocaleString()}
                    </Typography>
                  {draft.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {draft.description.substring(0, 100)}{draft.description.length > 100 ? '...' : ''}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => loadDraft(draft)}
                      sx={{ color: '#8b6cbc', borderColor: '#8b6cbc' }}
                    >
                      Continue Editing
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => deleteDraft(draft.id)}
                    >
                      Delete
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {/* Trainings Table */}
      <TableContainer component={Paper} sx={{ boxShadow: theme.shadows[2] }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
              <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Target Group</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Dates</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Capacity</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('common.status')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trainings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {t('common.no_data')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              trainings.map((training) => (
                <TableRow key={training.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {training.title}
                    </Typography>
                  </TableCell>
                  <TableCell>{training.department}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(Array.isArray(training.targetGroup) ? training.targetGroup : [training.targetGroup])
                        .filter(Boolean)
                        .map((group) => (
                          <Chip
                            key={group}
                            label={formatTargetGroupLabel(group)}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" display="block">
                      {formatDate(training.startDate)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      to {formatDate(training.endDate)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {training.registrationCount}/{training.maxParticipants}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={training.status}
                      color={getStatusColor(training.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title={t('common.details')}>
                        <IconButton
                          size="small"
                          onClick={() => router.push(`/institution/training/${training.id}`)}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleEditOpen(training)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteOpen(training)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TrainingFormDialog
        open={createDialogOpen}
        mode="create"
        initialTraining={normalizeTrainingSeed(formSeed)}
        submitting={submitting}
        onClose={() => {
          setCreateDialogOpen(false);
          setFormSeed(null);
        }}
        onSubmit={handleCreate}
      />

      <TrainingFormDialog
        open={editDialogOpen}
        mode="edit"
        initialTraining={selectedTraining}
        submitting={submitting}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedTraining(null);
        }}
        onSubmit={handleUpdate}
      />

      <InstitutionModal
        open={deleteDialogOpen}
        onClose={() => !submitting && setDeleteDialogOpen(false)}
        disableClose={submitting}
      >
        <InstitutionModalHeader
          icon={DeleteIconModal}
          title="Delete training"
          subtitle="This action cannot be undone"
          tone="danger"
          onClose={() => setDeleteDialogOpen(false)}
          disableClose={submitting}
          dense
        />
        <InstitutionModalBody dense>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete <strong>{selectedTraining?.title}</strong>?
          </Typography>
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            All associated modules, materials, and progress data will be permanently deleted.
          </Alert>
        </InstitutionModalBody>
        <InstitutionModalFooter>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={submitting} color="inherit" size="small">
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={submitting} size="small">
            {submitting ? 'Deleting...' : 'Delete training'}
          </Button>
        </InstitutionModalFooter>
      </InstitutionModal>
    </Container>
    </>
  );
}
