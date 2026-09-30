'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as BackIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Home as HomeIcon,
  School as TrainingIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import { formatTargetGroupLabel } from '@/lib/training-admin';

const PURPLE = '#8b6cbc';
const dialogLock = { disableScrollLock: true };

const STATUS_TONE = {
  PUBLISHED: { bg: '#dcfce7', color: '#166534' },
  DRAFT: { bg: '#f1f5f9', color: '#475569' },
  COMPLETED: { bg: alpha(PURPLE, 0.12), color: PURPLE },
  CANCELLED: { bg: '#fee2e2', color: '#b91c1c' },
};

const formatDate = (value) => {
  if (!value) return 'Not set';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not set' : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const asGroups = (value) => (Array.isArray(value) ? value : [value]).filter(Boolean);

export default function TrainingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const trainingId = params.id;

  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(null);
  const [modules, setModules] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [activeTab, setActiveTab] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [moduleDraft, setModuleDraft] = useState({ title: '', description: '' });
  const [materialDraft, setMaterialDraft] = useState({ name: '', moduleId: '', accessLevel: 'PUBLIC', file: null });
  const [certificateDialogOpen, setCertificateDialogOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [certificateFile, setCertificateFile] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const [trainingRes, modulesRes, registrationsRes, materialsRes] = await Promise.all([
        fetch(`/api/training/${trainingId}`, { credentials: 'include' }),
        fetch(`/api/training/${trainingId}/modules`, { credentials: 'include' }),
        fetch(`/api/training/${trainingId}/registrations`, { credentials: 'include' }),
        fetch(`/api/training/${trainingId}/materials`, { credentials: 'include' }),
      ]);
      const [trainingData, modulesData, registrationsData, materialsData] = await Promise.all([
        trainingRes.json(),
        modulesRes.json(),
        registrationsRes.json(),
        materialsRes.json(),
      ]);
      if (!trainingRes.ok || !trainingData.success) throw new Error(trainingData.error || 'Training not found');
      setTraining(trainingData.training);
      setModules(modulesData.modules || []);
      setRegistrations(registrationsData.registrations || []);
      setMaterials(materialsData.materials || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load training details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (trainingId) load();
  }, [trainingId]);

  const addModule = async () => {
    if (!moduleDraft.title.trim()) return;
    setSubmitting(true);
    try {
      const response = await fetch(`/api/training/${trainingId}/modules`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: moduleDraft.title.trim(), description: moduleDraft.description.trim(), order: modules.length + 1 }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to add module');
      setModuleDraft({ title: '', description: '' });
      setNotice('Module added.');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteModule = async (moduleId) => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/training/${trainingId}/modules/${moduleId}`, { method: 'DELETE', credentials: 'include' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to delete module');
      setNotice('Module removed.');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const uploadMaterial = async (moduleId = materialDraft.moduleId) => {
    if (!materialDraft.file) {
      setError('Choose a file to upload.');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', materialDraft.file);
      formData.append('name', materialDraft.name.trim() || materialDraft.file.name);
      formData.append('accessLevel', materialDraft.accessLevel);
      if (moduleId) formData.append('moduleId', moduleId);
      const response = await fetch(`/api/training/${trainingId}/materials`, { method: 'POST', credentials: 'include', body: formData });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to upload material');
      setMaterialDraft({ name: '', moduleId: '', accessLevel: 'PUBLIC', file: null });
      setNotice('Material uploaded.');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRegistrationStatus = async (registrationId, newStatus) => {
    try {
      const response = await fetch(`/api/training/${trainingId}/registrations/${registrationId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to update status');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUploadCertificate = async () => {
    if (!certificateFile || !selectedRegistration) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', certificateFile);
      const response = await fetch(`/api/training/${trainingId}/certificates/${selectedRegistration.id}`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to upload certificate');
      setCertificateDialogOpen(false);
      setSelectedRegistration(null);
      setCertificateFile(null);
      setNotice('Certificate uploaded.');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const materialsFor = (moduleId) => materials.filter((item) => (moduleId ? item.moduleId === moduleId : !item.moduleId));
  const statusTone = STATUS_TONE[training?.status] || STATUS_TONE.DRAFT;

  if (loading) {
    return (
      <Box sx={{ py: 10, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: PURPLE }} />
      </Box>
    );
  }

  if (!training) {
    return (
      <Container maxWidth={false} sx={{ py: 4, maxWidth: '1600px' }}>
        <Alert severity="error">{error || 'Training not found'}</Alert>
      </Container>
    );
  }

  return (
    <Box>
      <PageHeader
        title={training.title}
        description={`${training.department || 'No department'} · ${asGroups(training.targetGroup).map(formatTargetGroupLabel).join(', ') || 'No audience'}`}
        icon={<TrainingIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/institution' },
          { label: 'Training', path: '/institution/training' },
          { label: 'Session' },
        ]}
        actionButton={
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip size="small" label={training.status} sx={{ bgcolor: 'white', color: PURPLE, fontWeight: 700 }} />
            <Button
              variant="contained"
              startIcon={<BackIcon />}
              onClick={() => router.push('/institution/training')}
              sx={{ bgcolor: 'white', color: PURPLE, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#f5f5f5' } }}
            >
              Back to list
            </Button>
          </Stack>
        }
      />

      <Container maxWidth={false} sx={{ py: 3, maxWidth: '1600px', mx: 'auto' }}>
        {error ? <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert> : null}

        <Paper sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value)}
            sx={{
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, minHeight: 52, color: '#64748b' },
              '& .Mui-selected': { color: `${PURPLE} !important` },
              '& .MuiTabs-indicator': { backgroundColor: PURPLE, height: 3 },
            }}
          >
            <Tab label="Overview" />
            <Tab label={`Curriculum (${modules.length})`} />
            <Tab label={`Registrations (${registrations.length})`} />
          </Tabs>
        </Paper>

        {activeTab === 0 && (
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Paper sx={{ flex: 1, p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>Session details</Typography>
              <Typography variant="body2" sx={{ mb: 2, color: '#334155' }}>{training.description || 'No description provided.'}</Typography>
              <Typography variant="body2"><strong>Schedule:</strong> {formatDate(training.startDate)} - {formatDate(training.endDate)}</Typography>
              <Typography variant="body2"><strong>Location:</strong> {training.location || 'Not set'}</Typography>
              <Typography variant="body2"><strong>Capacity:</strong> {training.registrationCount || 0}/{training.maxParticipants} seats</Typography>
            </Paper>
            <Paper sx={{ width: { xs: '100%', md: 280 }, p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Chip size="small" label={training.status} sx={{ bgcolor: statusTone.bg, color: statusTone.color, fontWeight: 700, mb: 1.5 }} />
              <Typography variant="body2">{modules.length} modules</Typography>
              <Typography variant="body2">{materials.length} materials</Typography>
              <Typography variant="body2">{registrations.length} registrations</Typography>
              <Button onClick={() => setActiveTab(1)} sx={{ mt: 2, color: PURPLE, textTransform: 'none', fontWeight: 700 }}>
                Manage curriculum
              </Button>
            </Paper>
          </Stack>
        )}

        {activeTab === 1 && (
          <Stack spacing={2}>
            <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.25 }}>Add a module</Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                <TextField size="small" fullWidth label="Module title" value={moduleDraft.title} onChange={(e) => setModuleDraft((prev) => ({ ...prev, title: e.target.value }))} />
                <TextField size="small" fullWidth label="Description" value={moduleDraft.description} onChange={(e) => setModuleDraft((prev) => ({ ...prev, description: e.target.value }))} />
                <Button variant="contained" startIcon={<AddIcon />} disabled={submitting || !moduleDraft.title.trim()} onClick={addModule} sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  Add module
                </Button>
              </Stack>
            </Paper>

            <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.25 }}>Upload material</Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 1 }}>
                <TextField size="small" fullWidth label="Name" value={materialDraft.name} onChange={(e) => setMaterialDraft((prev) => ({ ...prev, name: e.target.value }))} />
                <TextField select size="small" fullWidth label="Attach to" value={materialDraft.moduleId} onChange={(e) => setMaterialDraft((prev) => ({ ...prev, moduleId: e.target.value }))}>
                  <MenuItem value="">General materials</MenuItem>
                  {modules.map((module) => <MenuItem key={module.id} value={module.id}>{module.title}</MenuItem>)}
                </TextField>
                <TextField select size="small" fullWidth label="Access" value={materialDraft.accessLevel} onChange={(e) => setMaterialDraft((prev) => ({ ...prev, accessLevel: e.target.value }))}>
                  <MenuItem value="PUBLIC">Open</MenuItem>
                  <MenuItem value="REGISTERED_ONLY">Registered only</MenuItem>
                </TextField>
              </Stack>
              <Stack direction="row" spacing={1}>
                <Button component="label" variant="outlined" startIcon={<UploadIcon />} sx={{ borderColor: PURPLE, color: PURPLE, textTransform: 'none', fontWeight: 700 }}>
                  {materialDraft.file ? materialDraft.file.name : 'Choose file'}
                  <input hidden type="file" onChange={(e) => setMaterialDraft((prev) => ({ ...prev, file: e.target.files?.[0] || null }))} />
                </Button>
                <Button variant="contained" disabled={submitting || !materialDraft.file} onClick={() => uploadMaterial()} sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700 }}>
                  Upload
                </Button>
              </Stack>
            </Paper>

            {modules.length ? modules.map((module, index) => (
              <Paper key={module.id} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Module {index + 1}: {module.title}</Typography>
                    {module.description ? <Typography variant="body2" color="text.secondary">{module.description}</Typography> : null}
                  </Box>
                  <IconButton size="small" color="error" onClick={() => deleteModule(module.id)}><DeleteIcon fontSize="small" /></IconButton>
                </Stack>
                <Stack spacing={1} sx={{ mt: 1.5 }}>
                  {materialsFor(module.id).length ? materialsFor(module.id).map((material) => (
                    <Stack key={material.id} direction="row" justifyContent="space-between" sx={{ p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{material.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{material.accessLevel === 'PUBLIC' ? 'Open' : 'Registered only'}</Typography>
                      </Box>
                      {material.fileUrl ? (
                        <Button size="small" onClick={() => window.open(material.fileUrl, '_blank', 'noopener')} sx={{ color: PURPLE, textTransform: 'none', fontWeight: 700 }}>Open</Button>
                      ) : null}
                    </Stack>
                  )) : <Typography variant="body2" color="text.secondary">No files on this module yet.</Typography>}
                </Stack>
              </Paper>
            )) : (
              <Alert severity="info" sx={{ borderRadius: 2 }}>No modules yet. Add the first one above.</Alert>
            )}

            <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>General materials</Typography>
              {materialsFor(null).length ? materialsFor(null).map((material) => (
                <Stack key={material.id} direction="row" justifyContent="space-between" sx={{ p: 1.25, mb: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{material.name}</Typography>
                  {material.fileUrl ? (
                    <Button size="small" onClick={() => window.open(material.fileUrl, '_blank', 'noopener')} sx={{ color: PURPLE, textTransform: 'none', fontWeight: 700 }}>Open</Button>
                  ) : null}
                </Stack>
              )) : <Typography variant="body2" color="text.secondary">No general files yet.</Typography>}
            </Paper>
          </Stack>
        )}

        {activeTab === 2 && (
          <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(PURPLE, 0.06) }}>
                    {['Participant', 'Email', 'Registered', 'Progress', 'Status', 'Certificate'].map((label) => (
                      <TableCell key={label} sx={{ fontWeight: 700 }}>{label}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {registrations.length ? registrations.map((reg) => {
                    const completed = (reg.moduleProgress || []).filter((item) => item.status === 'COMPLETED').length;
                    const total = (reg.moduleProgress || []).length;
                    const percent = total ? Math.round((completed / total) * 100) : 0;
                    return (
                      <TableRow key={reg.id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>{reg.user?.givenName} {reg.user?.familyName}</TableCell>
                        <TableCell>{reg.user?.email}</TableCell>
                        <TableCell>{formatDate(reg.registeredAt)}</TableCell>
                        <TableCell sx={{ minWidth: 140 }}>
                          <Typography variant="caption">{completed}/{total}</Typography>
                          <LinearProgress variant="determinate" value={percent} sx={{ height: 6, borderRadius: 3, bgcolor: alpha(PURPLE, 0.12), '& .MuiLinearProgress-bar': { bgcolor: PURPLE } }} />
                        </TableCell>
                        <TableCell>
                          <Select size="small" value={reg.status} onChange={(e) => handleUpdateRegistrationStatus(reg.id, e.target.value)}>
                            <MenuItem value="REGISTERED">Registered</MenuItem>
                            <MenuItem value="COMPLETED">Completed</MenuItem>
                            <MenuItem value="CANCELLED">Cancelled</MenuItem>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {reg.certificate ? (
                            <Tooltip title="Download certificate">
                              <IconButton size="small" onClick={() => window.open(reg.certificate.certificateUrl, '_blank', 'noopener')}><DownloadIcon fontSize="small" /></IconButton>
                            </Tooltip>
                          ) : reg.status === 'COMPLETED' ? (
                            <Button size="small" startIcon={<UploadIcon />} onClick={() => { setSelectedRegistration(reg); setCertificateDialogOpen(true); }} sx={{ color: PURPLE, textTransform: 'none', fontWeight: 700 }}>
                              Upload
                            </Button>
                          ) : (
                            <Typography variant="caption" color="text.secondary">Not ready</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  }) : (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ py: 4, textAlign: 'center' }}>
                        <Typography color="text.secondary">No registrations yet.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Container>

      <Dialog open={certificateDialogOpen} onClose={() => !submitting && setCertificateDialogOpen(false)} maxWidth="sm" fullWidth {...dialogLock}>
        <DialogTitle sx={{ fontWeight: 800 }}>Upload certificate</DialogTitle>
        <DialogContent>
          {selectedRegistration ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {selectedRegistration.user?.givenName} {selectedRegistration.user?.familyName} · {selectedRegistration.user?.email}
            </Typography>
          ) : null}
          <Button component="label" variant="outlined" fullWidth sx={{ borderColor: PURPLE, color: PURPLE, textTransform: 'none', fontWeight: 700 }}>
            {certificateFile ? certificateFile.name : 'Select certificate file'}
            <input hidden type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setCertificateFile(e.target.files?.[0] || null)} />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCertificateDialogOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" disabled={submitting || !certificateFile} onClick={handleUploadCertificate} sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700 }}>
            {submitting ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(notice)} autoHideDuration={4000} onClose={() => setNotice('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setNotice('')} severity="success" sx={{ width: '100%' }}>{notice}</Alert>
      </Snackbar>
    </Box>
  );
}
