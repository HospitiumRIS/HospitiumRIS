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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
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

const TARGET_GROUPS = [
  'NURSES',
  'DOCTORS',
  'RESEARCHERS',
  'LAB_TECHNICIANS',
  'ADMINISTRATORS',
  'ALL_STAFF',
];

const TRAINING_STATUSES = [
  'DRAFT',
  'PUBLISHED',
  'COMPLETED',
  'CANCELLED',
];

export default function InstitutionTrainingPage() {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [trainings, setTrainings] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [error, setError] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    departments: [],
    targetGroups: [],
    location: '',
    startDate: '',
    endDate: '',
    maxParticipants: 30,
    status: 'PUBLISHED',
  });

  const [departmentInput, setDepartmentInput] = useState('');

  useEffect(() => {
    fetchTrainings();
    loadDrafts();
  }, []);

  // Auto-save draft when form data changes
  useEffect(() => {
    if (createDialogOpen && (formData.title || formData.description || formData.departments.length > 0)) {
      const timer = setTimeout(() => {
        saveDraft();
      }, 2000); // Auto-save after 2 seconds of inactivity
      return () => clearTimeout(timer);
    }
  }, [formData, createDialogOpen]);

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

  const saveDraft = async () => {
    try {
      setAutoSaving(true);
      const draftId = currentDraftId || `draft_${Date.now()}`;
      const draft = {
        id: draftId,
        ...formData,
        savedAt: new Date().toISOString(),
      };

      const savedDrafts = localStorage.getItem('trainingDrafts');
      let draftsArray = savedDrafts ? JSON.parse(savedDrafts) : [];
      
      const existingIndex = draftsArray.findIndex(d => d.id === draftId);
      if (existingIndex >= 0) {
        draftsArray[existingIndex] = draft;
      } else {
        draftsArray.push(draft);
      }

      localStorage.setItem('trainingDrafts', JSON.stringify(draftsArray));
      setDrafts(draftsArray);
      setCurrentDraftId(draftId);
    } catch (err) {
      console.error('Error saving draft:', err);
    } finally {
      setAutoSaving(false);
    }
  };

  const loadDraft = (draft) => {
    setFormData({
      title: draft.title,
      description: draft.description,
      departments: draft.departments,
      targetGroups: draft.targetGroups,
      location: draft.location,
      startDate: draft.startDate,
      endDate: draft.endDate,
      maxParticipants: draft.maxParticipants,
      status: draft.status,
    });
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
      const response = await fetch('/api/training?includeAll=true');
      const data = await response.json();

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
    setFormData({
      title: '',
      description: '',
      departments: [],
      targetGroups: [],
      location: '',
      startDate: '',
      endDate: '',
      maxParticipants: 30,
      status: 'PUBLISHED',
    });
    setDepartmentInput('');
    setCurrentDraftId(null);
    setCreateDialogOpen(true);
  };

  const handleEditOpen = (training) => {
    setSelectedTraining(training);
    setFormData({
      title: training.title,
      description: training.description || '',
      departments: Array.isArray(training.departments) ? training.departments : [training.department].filter(Boolean),
      targetGroups: Array.isArray(training.targetGroups) ? training.targetGroups : [training.targetGroup].filter(Boolean),
      location: training.location || '',
      startDate: new Date(training.startDate).toISOString().split('T')[0],
      endDate: new Date(training.endDate).toISOString().split('T')[0],
      maxParticipants: training.maxParticipants,
      status: training.status,
    });
    setDepartmentInput('');
    setEditDialogOpen(true);
  };

  const handleDeleteOpen = (training) => {
    setSelectedTraining(training);
    setDeleteDialogOpen(true);
  };

  const handleCreate = async () => {
    try {
      setSubmitting(true);
      // Transform data for API
      const apiData = {
        ...formData,
        department: formData.departments.join(', '),
        targetGroup: formData.targetGroups, // Send as array
      };
      delete apiData.departments;
      delete apiData.targetGroups;

      const response = await fetch('/api/training', {
        method: 'POST',
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

  const handleUpdate = async () => {
    try {
      setSubmitting(true);
      // Transform data for API
      const apiData = {
        ...formData,
        department: formData.departments.join(', '),
        targetGroup: formData.targetGroups, // Send as array
      };
      delete apiData.departments;
      delete apiData.targetGroups;

      const response = await fetch(`/api/training/${selectedTraining.id}`, {
        method: 'PUT',
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <PageHeader
        title="Training Management"
        description="Create and manage institutional trainings"
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
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trainings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No trainings found. Create your first training to get started.
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
                    <Chip label={training.targetGroup} size="small" variant="outlined" />
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
                      <Tooltip title="View Details">
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

      {/* Create/Edit Dialog */}
      <Dialog
        open={createDialogOpen || editDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          setEditDialogOpen(false);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box component="span">
            {createDialogOpen ? 'Create New Training' : 'Edit Training'}
          </Box>
          {autoSaving && (
            <Chip label="Auto-saving..." size="small" color="info" />
          )}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Training Title"
              fullWidth
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            {/* Departments Multi-Input */}
            <Box>
              <TextField
                label="Add Department"
                fullWidth
                value={departmentInput}
                onChange={(e) => setDepartmentInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && departmentInput.trim()) {
                    e.preventDefault();
                    if (!formData.departments.includes(departmentInput.trim())) {
                      setFormData({ ...formData, departments: [...formData.departments, departmentInput.trim()] });
                    }
                    setDepartmentInput('');
                  }
                }}
                placeholder="Type department name and press Enter"
                helperText="Press Enter to add multiple departments"
              />
              {formData.departments.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {formData.departments.map((dept, index) => (
                    <Chip
                      key={index}
                      label={dept}
                      onDelete={() => {
                        setFormData({
                          ...formData,
                          departments: formData.departments.filter((_, i) => i !== index)
                        });
                      }}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              )}
            </Box>
            {/* Target Groups Multi-Select */}
            <TextField
              label="Target Groups"
              fullWidth
              required
              select
              value={formData.targetGroups}
              onChange={(e) => setFormData({ ...formData, targetGroups: e.target.value })}
              SelectProps={{
                multiple: true,
                renderValue: (selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={String(value).replace(/_/g, ' ')} size="small" />
                    ))}
                  </Box>
                ),
              }}
              helperText="Select one or more target groups"
            >
              {TARGET_GROUPS.map((group) => (
                <MenuItem key={group} value={group}>
                  {group.replace(/_/g, ' ')}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Location"
              fullWidth
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Start Date"
                type="date"
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
              <TextField
                label="End Date"
                type="date"
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Max Participants"
                type="number"
                fullWidth
                required
                value={formData.maxParticipants}
                onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value ? parseInt(e.target.value) : '' })}
              />
              <TextField
                label="Status"
                fullWidth
                required
                select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                {TRAINING_STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, flexDirection: 'column', alignItems: 'stretch', gap: 1 }}>
          {/* Debug Info */}
          <Box sx={{ fontSize: '0.75rem', color: 'text.secondary', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="caption" display="block">Validation Status:</Typography>
            <Typography variant="caption" display="block">
              Title: {formData.title?.trim() ? '✓' : '✗'} | 
              Departments: {formData.departments.length > 0 ? `✓ (${formData.departments.length})` : '✗'} | 
              Target Groups: {formData.targetGroups.length > 0 ? `✓ (${formData.targetGroups.length})` : '✗'} | 
              Start: {formData.startDate ? '✓' : '✗'} | 
              End: {formData.endDate ? '✓' : '✗'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button
              onClick={() => {
                setCreateDialogOpen(false);
                setEditDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                console.log('Form Data:', formData);
                console.log('Validation:', {
                  title: formData.title,
                  departments: formData.departments,
                  targetGroups: formData.targetGroups,
                  startDate: formData.startDate,
                  endDate: formData.endDate
                });
                if (createDialogOpen) handleCreate();
                else handleUpdate();
              }}
              disabled={
                submitting || 
                !formData.title?.trim() || 
                formData.departments.length === 0 || 
                formData.targetGroups.length === 0 ||
                !formData.startDate ||
                !formData.endDate
              }
              sx={{
                backgroundColor: '#8b6cbc',
                '&:hover': { backgroundColor: '#7a5caa' },
              }}
            >
              {submitting ? 'Saving...' : createDialogOpen ? 'Create' : 'Update'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Training</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedTraining?.title}"?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone. All associated modules, materials, and progress data will be deleted.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={submitting}
          >
            {submitting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
    </>
  );
}
