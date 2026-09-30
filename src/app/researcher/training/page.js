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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Close as CloseIcon,
  Description as MaterialsIcon,
  EmojiEvents as CertificateIcon,
  Home as HomeIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
  School as TrainingIcon,
  Search as SearchIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';

const PURPLE = '#8b6cbc';
const dialogLock = { disableScrollLock: true };

const STATUS_TONE = {
  REGISTERED: { bg: alpha(PURPLE, 0.12), color: PURPLE, label: 'Registered' },
  COMPLETED: { bg: '#dcfce7', color: '#166534', label: 'Completed' },
  CANCELLED: { bg: '#fee2e2', color: '#b91c1c', label: 'Cancelled' },
};

const formatDate = (value) => {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatRange = (start, end) => `${formatDate(start)} - ${formatDate(end)}`;

const daysUntil = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / 86400000);
};

const asList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string' && value.trim()) return [value];
  return [];
};

const locationDisplay = (location) => {
  if (!location) return { label: 'Location to be announced', href: null };
  const trimmed = String(location).trim();
  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    if (url.hostname.includes('.')) {
      return { label: url.hostname.replace(/^www\./, ''), href: url.href };
    }
  } catch {
    // not a URL
  }
  return { label: trimmed, href: trimmed.startsWith('http') ? trimmed : null };
};

function StatusChip({ status }) {
  const tone = STATUS_TONE[status] || { bg: '#f1f5f9', color: '#475569', label: String(status || '').replaceAll('_', ' ') };
  return <Chip size="small" label={tone.label} sx={{ bgcolor: tone.bg, color: tone.color, fontWeight: 700, height: 24 }} />;
}

function StatCard({ label, value, caption }) {
  return (
    <Paper sx={{ flex: 1, minWidth: 160, p: 2, borderRadius: 2, bgcolor: PURPLE, color: 'white' }}>
      <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 700 }}>{label}</Typography>
      <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>{value}</Typography>
      {caption ? <Typography variant="caption" sx={{ opacity: 0.75 }}>{caption}</Typography> : null}
    </Paper>
  );
}

function MetaRow({ icon, children }) {
  return (
    <Stack direction="row" spacing={1} alignItems="flex-start">
      <Box sx={{ color: PURPLE, mt: '1px' }}>{icon}</Box>
      <Typography variant="body2" color="text.secondary">{children}</Typography>
    </Stack>
  );
}

function DeadlineLabel({ startDate, endDate }) {
  const untilEnd = daysUntil(endDate);
  const untilStart = daysUntil(startDate);
  if (untilEnd == null) return null;
  if (untilEnd < 0) return <Chip size="small" label="Ended" sx={{ bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 700 }} />;
  if (untilStart > 0) return <Chip size="small" label={`Starts in ${untilStart} day${untilStart === 1 ? '' : 's'}`} sx={{ bgcolor: '#dbeafe', color: '#1d4ed8', fontWeight: 700 }} />;
  return <Chip size="small" label={`${untilEnd} day${untilEnd === 1 ? '' : 's'} left`} sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 700 }} />;
}

export default function TrainingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [myTrainings, setMyTrainings] = useState([]);
  const [availableTrainings, setAvailableTrainings] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [tab, setTab] = useState(0);

  const loadTrainings = async () => {
    try {
      setLoading(true);
      setError('');
      const [myResponse, allResponse] = await Promise.all([
        fetch('/api/training/my'),
        fetch('/api/training'),
      ]);
      const myData = await myResponse.json();
      const allData = await allResponse.json();

      const registrations = myData.success ? (myData.registrations || []) : [];
      setMyTrainings(registrations);

      if (allData.success) {
        const registeredIds = new Set(registrations.map((item) => item.training.id));
        setAvailableTrainings((allData.trainings || []).filter((item) => !registeredIds.has(item.id)));
      }
    } catch (err) {
      setError(err.message || 'Failed to load trainings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrainings();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash === '#available') {
      setTab(1);
      requestAnimationFrame(() => {
        document.getElementById('available')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [loading]);

  const departments = useMemo(() => {
    const values = [...myTrainings.map((item) => item.training.department), ...availableTrainings.map((item) => item.department)];
    return [...new Set(values.filter(Boolean))].sort();
  }, [myTrainings, availableTrainings]);

  const matchesSearch = (training) => {
    const haystack = `${training.title} ${training.description || ''} ${training.department || ''} ${asList(training.targetGroup).join(' ')}`.toLowerCase();
    return !search || haystack.includes(search.toLowerCase());
  };

  const filteredMine = myTrainings.filter((item) => {
    const training = item.training;
    const matchesDept = departmentFilter === 'all' || training.department === departmentFilter;
    return matchesSearch(training) && matchesDept;
  });

  const filteredAvailable = availableTrainings.filter((training) => {
    const matchesDept = departmentFilter === 'all' || training.department === departmentFilter;
    return matchesSearch(training) && matchesDept;
  });

  const stats = {
    mine: myTrainings.length,
    available: availableTrainings.length,
    inProgress: myTrainings.filter((item) => item.status === 'REGISTERED').length,
    completed: myTrainings.filter((item) => item.status === 'COMPLETED' || item.hasCertificate).length,
  };

  const openDetails = async (trainingId) => {
    try {
      const response = await fetch(`/api/training/${trainingId}`);
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to load training');
      setSelectedTraining(data.training);
      setDetailsOpen(true);
    } catch (err) {
      setError(err.message || 'Failed to load training details');
    }
  };

  const handleRegister = async () => {
    if (!selectedTraining) return;
    try {
      setRegistering(true);
      const response = await fetch(`/api/training/${selectedTraining.id}/register`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to register');
      setDetailsOpen(false);
      setSelectedTraining(null);
      setNotice('You are registered. This training now appears under My trainings.');
      setTab(0);
      await loadTrainings();
    } catch (err) {
      setError(err.message || 'Failed to register for training');
    } finally {
      setRegistering(false);
    }
  };

  const renderLocation = (location) => {
    const meta = locationDisplay(location);
    if (meta.href) {
      return (
        <Box
          component="a"
          href={meta.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => event.stopPropagation()}
          sx={{ color: PURPLE, fontWeight: 600, textDecoration: 'none' }}
        >
          {meta.label}
        </Box>
      );
    }
    return meta.label;
  };

  const renderCard = ({ key, training, registration, onOpen }) => {
    const groups = asList(training.targetGroup);
    return (
      <Paper
        key={key}
        elevation={0}
        onClick={onOpen}
        sx={{
          p: 2.25,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 240,
          '&:hover': { borderColor: alpha(PURPLE, 0.45), boxShadow: `0 8px 24px ${alpha(PURPLE, 0.12)}` },
        }}
      >
        <Stack direction="row" justifyContent="space-between" spacing={1} sx={{ mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b' }}>{training.title}</Typography>
          {registration ? <StatusChip status={registration.status} /> : <DeadlineLabel startDate={training.startDate} endDate={training.endDate} />}
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {training.description || 'No description provided.'}
        </Typography>
        <Stack spacing={0.75} sx={{ mb: 1.5 }}>
          <MetaRow icon={<CalendarIcon sx={{ fontSize: 16 }} />}>{formatRange(training.startDate, training.endDate)}</MetaRow>
          <MetaRow icon={<LocationIcon sx={{ fontSize: 16 }} />}>{renderLocation(training.location)}</MetaRow>
          <MetaRow icon={<PeopleIcon sx={{ fontSize: 16 }} />}>
            {[training.department, ...groups].filter(Boolean).join(' · ') || 'Audience not specified'}
          </MetaRow>
        </Stack>
        {registration && registration.totalModules > 0 ? (
          <Box sx={{ mt: 'auto' }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">Progress</Typography>
              <Typography variant="caption" sx={{ color: PURPLE, fontWeight: 700 }}>
                {registration.completedModules}/{registration.totalModules} modules
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={registration.progressPercentage || 0}
              sx={{ height: 6, borderRadius: 3, bgcolor: alpha(PURPLE, 0.12), '& .MuiLinearProgress-bar': { bgcolor: PURPLE } }}
            />
            {registration.hasCertificate ? (
              <Chip icon={<CertificateIcon sx={{ fontSize: 16 }} />} label="Certificate ready" size="small" sx={{ mt: 1.25, bgcolor: '#dcfce7', color: '#166534', fontWeight: 700 }} />
            ) : null}
          </Box>
        ) : (
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 'auto' }}>
            <Chip size="small" label={`${training.moduleCount ?? training.modules?.length ?? 0} modules`} sx={{ bgcolor: alpha(PURPLE, 0.08), color: PURPLE, fontWeight: 700 }} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: (training.remainingSlots ?? 0) > 0 ? '#166534' : '#b91c1c' }}>
              {(training.remainingSlots ?? 0) > 0 ? `${training.remainingSlots} seats left` : 'Full'}
            </Typography>
          </Stack>
        )}
        <Button
          size="small"
          startIcon={registration ? <MaterialsIcon /> : <ScheduleIcon />}
          sx={{ mt: 1.5, color: PURPLE, textTransform: 'none', fontWeight: 700, alignSelf: 'flex-start', px: 0 }}
        >
          {registration ? (registration.hasCertificate ? 'View materials and certificate' : 'View materials') : 'View details and register'}
        </Button>
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
        title="Training"
        description="Browse published sessions, register, and track module progress."
        icon={<TrainingIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/researcher' },
          { label: 'Training' },
        ]}
        actionButton={
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              onClick={() => router.push('/researcher/training/certificates')}
              sx={{ bgcolor: 'white', color: PURPLE, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#f5f5f5' } }}
            >
              Certificates
            </Button>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={loadTrainings}
              sx={{ bgcolor: 'white', color: PURPLE, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#f5f5f5' } }}
            >
              Refresh
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
              <StatCard label="My trainings" value={stats.mine} caption="Sessions you have joined" />
              <StatCard label="Available" value={stats.available} caption="Open for registration" />
              <StatCard label="In progress" value={stats.inProgress} caption="Registered and underway" />
              <StatCard label="Completed" value={stats.completed} caption="Finished or certified" />
            </Stack>

            <Paper sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search by title, department, or audience"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                  sx={fieldSx}
                />
                <TextField
                  select
                  size="small"
                  label="Department"
                  value={departmentFilter}
                  onChange={(event) => setDepartmentFilter(event.target.value)}
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

            <Paper id="available" sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', scrollMarginTop: 96 }}>
              <Tabs
                value={tab}
                onChange={(_, value) => {
                  setTab(value);
                  if (typeof window !== 'undefined') {
                    window.history.replaceState(null, '', value === 1 ? '#available' : '/researcher/training');
                  }
                }}
                sx={{
                  '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, minHeight: 52, color: '#64748b' },
                  '& .Mui-selected': { color: `${PURPLE} !important` },
                  '& .MuiTabs-indicator': { backgroundColor: PURPLE, height: 3 },
                }}
              >
                <Tab icon={<TrainingIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`My trainings (${filteredMine.length})`} />
                <Tab icon={<ScheduleIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Available (${filteredAvailable.length})`} />
              </Tabs>
            </Paper>

            {tab === 0 && (
              filteredMine.length ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }, gap: 2 }}>
                  {filteredMine.map((registration) => renderCard({
                    key: registration.id,
                    training: registration.training,
                    registration,
                    onOpen: () => openDetails(registration.training.id),
                  }))}
                </Box>
              ) : (
                <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 2, border: '1px dashed', borderColor: alpha(PURPLE, 0.3) }}>
                  <TrainingIcon sx={{ fontSize: 42, color: '#cbd5e1', mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>No registered trainings</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Browse available sessions and register to start tracking progress.
                  </Typography>
                  <Button variant="contained" onClick={() => setTab(1)} sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700 }}>
                    View available trainings
                  </Button>
                </Paper>
              )
            )}

            {tab === 1 && (
              filteredAvailable.length ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }, gap: 2 }}>
                  {filteredAvailable.map((training) => renderCard({
                    key: training.id,
                    training,
                    onOpen: () => openDetails(training.id),
                  }))}
                </Box>
              ) : (
                <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 2, border: '1px dashed', borderColor: alpha(PURPLE, 0.3) }}>
                  <ScheduleIcon sx={{ fontSize: 42, color: '#cbd5e1', mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>No available trainings</Typography>
                  <Typography variant="body2" color="text.secondary">Nothing is open for registration right now, or your filters hid the current list.</Typography>
                </Paper>
              )
            )}
          </>
        )}
      </Container>

      <Dialog
        open={detailsOpen}
        onClose={() => !registering && setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
        {...dialogLock}
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        {selectedTraining ? (
          <>
            <DialogTitle sx={{ bgcolor: PURPLE, color: 'white', fontWeight: 800, pr: 1 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  {selectedTraining.title}
                  <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                    {selectedTraining.department || 'Department not set'}
                  </Typography>
                </Box>
                <IconButton size="small" onClick={() => setDetailsOpen(false)} sx={{ color: 'white' }}>
                  <CloseIcon />
                </IconButton>
              </Stack>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <Stack spacing={2.5} sx={{ mt: 1 }}>
                <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.7 }}>
                  {selectedTraining.description || 'No description available.'}
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Paper variant="outlined" sx={{ flex: 1, p: 1.5, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">Schedule</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatRange(selectedTraining.startDate, selectedTraining.endDate)}</Typography>
                  </Paper>
                  <Paper variant="outlined" sx={{ flex: 1, p: 1.5, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">Location</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{renderLocation(selectedTraining.location)}</Typography>
                  </Paper>
                  <Paper variant="outlined" sx={{ flex: 1, p: 1.5, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">Capacity</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {selectedTraining.remainingSlots} of {selectedTraining.maxParticipants} seats left
                    </Typography>
                  </Paper>
                </Stack>
                {asList(selectedTraining.targetGroup).length ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {asList(selectedTraining.targetGroup).map((group) => (
                      <Chip key={group} size="small" label={group} sx={{ bgcolor: alpha(PURPLE, 0.08), color: PURPLE, fontWeight: 700 }} />
                    ))}
                  </Stack>
                ) : null}

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Modules</Typography>
                  {(selectedTraining.modules || []).length ? (
                    <Stack spacing={1}>
                      {selectedTraining.modules.map((module, index) => {
                        const moduleMaterials = (selectedTraining.materials || []).filter((item) => item.moduleId === module.id);
                        return (
                          <Paper key={module.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>Module {index + 1}: {module.title}</Typography>
                            {module.description ? <Typography variant="caption" color="text.secondary">{module.description}</Typography> : null}
                            {moduleMaterials.map((material) => (
                              <Stack key={material.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                                <Typography variant="body2">{material.name}</Typography>
                                {material.fileUrl ? (
                                  <Button size="small" onClick={() => window.open(material.fileUrl, '_blank', 'noopener')} sx={{ color: PURPLE, textTransform: 'none', fontWeight: 700 }}>
                                    Open
                                  </Button>
                                ) : null}
                              </Stack>
                            ))}
                          </Paper>
                        );
                      })}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No modules have been published yet.</Typography>
                  )}
                </Box>

                {(selectedTraining.materials || []).filter((item) => !item.moduleId).length ? (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>General materials</Typography>
                    <Stack spacing={1}>
                      {(selectedTraining.materials || []).filter((item) => !item.moduleId).map((material) => (
                        <Stack key={material.id} direction="row" justifyContent="space-between" sx={{ p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                          <Typography variant="body2">{material.name}</Typography>
                          {material.fileUrl ? (
                            <Button size="small" onClick={() => window.open(material.fileUrl, '_blank', 'noopener')} sx={{ color: PURPLE, textTransform: 'none', fontWeight: 700 }}>
                              Open
                            </Button>
                          ) : null}
                        </Stack>
                      ))}
                    </Stack>
                  </Box>
                ) : null}
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setDetailsOpen(false)} disabled={registering} sx={{ textTransform: 'none' }}>Close</Button>
              {!selectedTraining.isRegistered ? (
                <Button
                  variant="contained"
                  onClick={handleRegister}
                  disabled={registering || selectedTraining.remainingSlots <= 0}
                  sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700 }}
                >
                  {registering ? 'Registering...' : selectedTraining.remainingSlots <= 0 ? 'Session is full' : 'Register'}
                </Button>
              ) : selectedTraining.userRegistration?.certificate?.certificateUrl ? (
                <Button
                  variant="contained"
                  startIcon={<CertificateIcon />}
                  onClick={() => window.open(selectedTraining.userRegistration.certificate.certificateUrl, '_blank', 'noopener')}
                  sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700 }}
                >
                  Download certificate
                </Button>
              ) : null}
            </DialogActions>
          </>
        ) : null}
      </Dialog>

      <Snackbar open={Boolean(notice)} autoHideDuration={4000} onClose={() => setNotice('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setNotice('')} severity="success" sx={{ width: '100%' }}>{notice}</Alert>
      </Snackbar>
    </Box>
  );
}
