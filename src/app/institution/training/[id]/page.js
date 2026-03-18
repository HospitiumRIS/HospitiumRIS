'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  Tabs,
  Tab,
  Stack,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import PageHeader from '@/components/common/PageHeader';
import { Home as HomeIcon, School as TrainingIcon } from '@mui/icons-material';

const MODULE_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
const ACCESS_LEVELS = ['PUBLIC', 'REGISTERED_ONLY'];

export default function TrainingDetailPage() {
  const theme = useTheme();
  const router = useRouter();
  const params = useParams();
  const trainingId = params.id;

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(null);
  const [modules, setModules] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Dialog states
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [certificateDialogOpen, setCertificateDialogOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [moduleForm, setModuleForm] = useState({ title: '', description: '', order: 1 });
  const [materialForm, setMaterialForm] = useState({ name: '', moduleId: '', accessLevel: 'PUBLIC', file: null });
  const [certificateFile, setCertificateFile] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (trainingId && mounted) {
      fetchTrainingDetails();
    }
  }, [trainingId, mounted]);

  const fetchTrainingDetails = async () => {
    try {
      setLoading(true);
      const [trainingRes, modulesRes, registrationsRes, materialsRes] = await Promise.all([
        fetch(`/api/training/${trainingId}`).catch(() => null),
        fetch(`/api/training/${trainingId}/modules`).catch(() => null),
        fetch(`/api/training/${trainingId}/registrations`).catch(() => null),
        fetch(`/api/training/${trainingId}/materials`).catch(() => null),
      ]);

      if (!trainingRes) {
        setError('Failed to connect to server. Please refresh the page.');
        return;
      }

      const [trainingData, modulesData, registrationsData, materialsData] = await Promise.all([
        trainingRes.json().catch(() => ({ success: false })),
        modulesRes?.json().catch(() => ({ success: false, modules: [] })) || { success: false, modules: [] },
        registrationsRes?.json().catch(() => ({ success: false, registrations: [] })) || { success: false, registrations: [] },
        materialsRes?.json().catch(() => ({ success: false, materials: [] })) || { success: false, materials: [] },
      ]);

      if (trainingData.success) setTraining(trainingData.training);
      if (modulesData.success) setModules(modulesData.modules);
      if (registrationsData.success) setRegistrations(registrationsData.registrations);
      if (materialsData.success) setMaterials(materialsData.materials);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching training details:', err);
      setError('Failed to load training details. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateModule = async () => {
    try {
      setSubmitting(true);
      const response = await fetch(`/api/training/${trainingId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moduleForm),
      });

      const data = await response.json();
      if (data.success) {
        setModuleDialogOpen(false);
        setModuleForm({ title: '', description: '', order: 1 });
        fetchTrainingDetails();
      } else {
        alert(data.error || 'Failed to create module');
      }
    } catch (err) {
      console.error('Error creating module:', err);
      alert('Failed to create module');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!confirm('Are you sure you want to delete this module?')) return;

    try {
      const response = await fetch(`/api/training/${trainingId}/modules/${moduleId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        fetchTrainingDetails();
      } else {
        alert(data.error || 'Failed to delete module');
      }
    } catch (err) {
      console.error('Error deleting module:', err);
      alert('Failed to delete module');
    }
  };

  const handleUploadMaterial = async () => {
    if (!materialForm.file) {
      alert('Please select a file');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('file', materialForm.file);
      formData.append('name', materialForm.name || materialForm.file.name);
      formData.append('accessLevel', materialForm.accessLevel);
      if (materialForm.moduleId) {
        formData.append('moduleId', materialForm.moduleId);
      }

      const response = await fetch(`/api/training/${trainingId}/materials`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setMaterialDialogOpen(false);
        setMaterialForm({ name: '', moduleId: '', accessLevel: 'PUBLIC', file: null });
        fetchTrainingDetails();
      } else {
        alert(data.error || 'Failed to upload material');
      }
    } catch (err) {
      console.error('Error uploading material:', err);
      alert('Failed to upload material');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRegistrationStatus = async (registrationId, newStatus) => {
    try {
      const response = await fetch(`/api/training/${trainingId}/registrations/${registrationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (data.success) {
        fetchTrainingDetails();
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  };

  const handleUpdateModuleProgress = async (registrationId, moduleId, newStatus) => {
    try {
      const response = await fetch(`/api/training/${trainingId}/registrations/${registrationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleProgress: [{ moduleId, status: newStatus }],
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchTrainingDetails();
      } else {
        alert(data.error || 'Failed to update progress');
      }
    } catch (err) {
      console.error('Error updating progress:', err);
      alert('Failed to update progress');
    }
  };

  const handleUploadCertificate = async () => {
    if (!certificateFile || !selectedRegistration) return;

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('file', certificateFile);

      const response = await fetch(
        `/api/training/${trainingId}/certificates/${selectedRegistration.id}`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      if (data.success) {
        setCertificateDialogOpen(false);
        setSelectedRegistration(null);
        setCertificateFile(null);
        fetchTrainingDetails();
      } else {
        alert(data.error || 'Failed to upload certificate');
      }
    } catch (err) {
      console.error('Error uploading certificate:', err);
      alert('Failed to upload certificate');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!mounted || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!training) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">Training not found</Alert>
      </Container>
    );
  }

  return (
    <>
      <PageHeader
        title={training.title}
        description={`${training.department} • ${Array.isArray(training.targetGroup) ? training.targetGroup.join(', ') : training.targetGroup}`}
        icon={<TrainingIcon sx={{ fontSize: 40 }} />}
        breadcrumbs={[
          { label: 'Home', path: '/institution', icon: <HomeIcon /> },
          { label: 'Training', path: '/institution/training' },
          { label: training.title }
        ]}
        actionButton={
          <Chip 
            label={training.status} 
            sx={{ 
              backgroundColor: 'white',
              color: '#8b6cbc',
              fontWeight: 600
            }} 
          />
        }
      />
      <Container maxWidth="xl" sx={{ py: 4 }}>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label="Details" />
          <Tab label={`Registrations (${registrations.length})`} />
          <Tab label={`Materials (${materials.length})`} />
        </Tabs>
      </Box>

      {/* Details Tab */}
      {activeTab === 0 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Training Information
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ flex: '1 1 45%' }}>
                  <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                  <Typography variant="body2">{training.description || 'N/A'}</Typography>
                </Box>
                <Box sx={{ flex: '1 1 45%' }}>
                  <Typography variant="subtitle2" color="text.secondary">Location</Typography>
                  <Typography variant="body2">{training.location || 'TBD'}</Typography>
                </Box>
                <Box sx={{ flex: '1 1 45%' }}>
                  <Typography variant="subtitle2" color="text.secondary">Duration</Typography>
                  <Typography variant="body2">
                    {formatDate(training.startDate)} - {formatDate(training.endDate)}
                  </Typography>
                </Box>
                <Box sx={{ flex: '1 1 45%' }}>
                  <Typography variant="subtitle2" color="text.secondary">Capacity</Typography>
                  <Typography variant="body2">
                    {training.registrationCount}/{training.maxParticipants} participants
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Modules Section */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Training Modules
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => setModuleDialogOpen(true)}
                  variant="outlined"
                >
                  Add Module
                </Button>
              </Box>

              {modules.length === 0 ? (
                <Alert severity="info">No modules added yet</Alert>
              ) : (
                <Stack spacing={2}>
                  {modules.map((module, index) => (
                    <Paper key={module.id} variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            Module {index + 1}: {module.title}
                          </Typography>
                          {module.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {module.description}
                            </Typography>
                          )}
                        </Box>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteModule(module.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Registrations Tab */}
      {activeTab === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
                <TableCell sx={{ fontWeight: 600 }}>Participant</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Registered</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Progress</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Certificate</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {registrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No registrations yet</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                registrations.map((reg) => {
                  const completedModules = reg.moduleProgress.filter(p => p.status === 'COMPLETED').length;
                  const totalModules = reg.moduleProgress.length;
                  const progressPercent = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

                  return (
                    <TableRow key={reg.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {reg.user.givenName} {reg.user.familyName}
                        </Typography>
                      </TableCell>
                      <TableCell>{reg.user.email}</TableCell>
                      <TableCell>{reg.user.researchProfile?.department || 'N/A'}</TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {formatDate(reg.registeredAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ minWidth: 120 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption">
                              {completedModules}/{totalModules}
                            </Typography>
                            <Typography variant="caption">
                              {Math.round(progressPercent)}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={progressPercent}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Select
                          size="small"
                          value={reg.status}
                          onChange={(e) => handleUpdateRegistrationStatus(reg.id, e.target.value)}
                        >
                          <MenuItem value="REGISTERED">Registered</MenuItem>
                          <MenuItem value="COMPLETED">Completed</MenuItem>
                          <MenuItem value="CANCELLED">Cancelled</MenuItem>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {reg.certificate ? (
                          <Tooltip title="Download Certificate">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => window.open(reg.certificate.certificateUrl, '_blank')}
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : reg.status === 'COMPLETED' ? (
                          <Button
                            size="small"
                            startIcon={<UploadIcon />}
                            onClick={() => {
                              setSelectedRegistration(reg);
                              setCertificateDialogOpen(true);
                            }}
                          >
                            Upload
                          </Button>
                        ) : (
                          <Typography variant="caption" color="text.secondary">N/A</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Materials Tab */}
      {activeTab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              startIcon={<UploadIcon />}
              variant="contained"
              onClick={() => setMaterialDialogOpen(true)}
              sx={{
                backgroundColor: '#8b6cbc',
                '&:hover': { backgroundColor: '#7a5caa' },
              }}
            >
              Upload Material
            </Button>
          </Box>

          {materials.length === 0 ? (
            <Alert severity="info">No materials uploaded yet</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Module</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Access Level</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Uploaded</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {materials.map((material) => (
                    <TableRow key={material.id} hover>
                      <TableCell>{material.name}</TableCell>
                      <TableCell>{material.module?.title || 'General'}</TableCell>
                      <TableCell>
                        <Chip label={material.fileType.toUpperCase()} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={material.accessLevel}
                          size="small"
                          color={material.accessLevel === 'PUBLIC' ? 'success' : 'warning'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {formatDate(material.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => window.open(material.fileUrl, '_blank')}
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Add Module Dialog */}
      <Dialog open={moduleDialogOpen} onClose={() => setModuleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Training Module</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Module Title"
              fullWidth
              required
              value={moduleForm.title}
              onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={moduleForm.description}
              onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
            />
            <TextField
              label="Order"
              type="number"
              fullWidth
              value={moduleForm.order}
              onChange={(e) => setModuleForm({ ...moduleForm, order: parseInt(e.target.value) })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModuleDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateModule}
            disabled={submitting || !moduleForm.title}
            sx={{ backgroundColor: '#8b6cbc', '&:hover': { backgroundColor: '#7a5caa' } }}
          >
            {submitting ? 'Adding...' : 'Add Module'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Material Dialog */}
      <Dialog open={materialDialogOpen} onClose={() => setMaterialDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Training Material</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Material Name"
              fullWidth
              value={materialForm.name}
              onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Module (Optional)</InputLabel>
              <Select
                value={materialForm.moduleId}
                onChange={(e) => setMaterialForm({ ...materialForm, moduleId: e.target.value })}
                label="Module (Optional)"
              >
                <MenuItem value="">General (No specific module)</MenuItem>
                {modules.map((module) => (
                  <MenuItem key={module.id} value={module.id}>
                    {module.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Access Level</InputLabel>
              <Select
                value={materialForm.accessLevel}
                onChange={(e) => setMaterialForm({ ...materialForm, accessLevel: e.target.value })}
                label="Access Level"
              >
                <MenuItem value="PUBLIC">Public (All researchers)</MenuItem>
                <MenuItem value="REGISTERED_ONLY">Registered Only</MenuItem>
              </Select>
            </FormControl>
            <Button variant="outlined" component="label" fullWidth>
              {materialForm.file ? materialForm.file.name : 'Select File'}
              <input
                type="file"
                hidden
                onChange={(e) => setMaterialForm({ ...materialForm, file: e.target.files[0] })}
              />
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMaterialDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUploadMaterial}
            disabled={submitting || !materialForm.file}
            sx={{ backgroundColor: '#8b6cbc', '&:hover': { backgroundColor: '#7a5caa' } }}
          >
            {submitting ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Certificate Dialog */}
      <Dialog open={certificateDialogOpen} onClose={() => setCertificateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Certificate</DialogTitle>
        <DialogContent dividers>
          {selectedRegistration && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Participant: {selectedRegistration.user.givenName} {selectedRegistration.user.familyName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Email: {selectedRegistration.user.email}
              </Typography>
            </Box>
          )}
          <Button variant="outlined" component="label" fullWidth>
            {certificateFile ? certificateFile.name : 'Select Certificate File'}
            <input
              type="file"
              hidden
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setCertificateFile(e.target.files[0])}
            />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCertificateDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUploadCertificate}
            disabled={submitting || !certificateFile}
            sx={{ backgroundColor: '#8b6cbc', '&:hover': { backgroundColor: '#7a5caa' } }}
          >
            {submitting ? 'Uploading...' : 'Upload Certificate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
    </>
  );
}
