'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  School as TrainingIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  CheckCircle as CompletedIcon,
  Schedule as ScheduleIcon,
  Description as MaterialsIcon,
  EmojiEvents as CertificateIcon,
  Close as CloseIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import PageHeader from '@/components/common/PageHeader';
import { Home as HomeIcon } from '@mui/icons-material';

export default function TrainingPage() {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [myTrainings, setMyTrainings] = useState([]);
  const [availableTrainings, setAvailableTrainings] = useState([]);
  const [error, setError] = useState(null);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    try {
      setLoading(true);
      
      // Fetch my trainings
      const myResponse = await fetch('/api/training/my');
      const myData = await myResponse.json();
      
      // Fetch all available trainings
      const allResponse = await fetch('/api/training');
      const allData = await allResponse.json();
      
      if (myData.success) {
        setMyTrainings(myData.registrations || []);
      }
      
      if (allData.success) {
        // Filter out trainings user is already registered for
        const registeredIds = new Set(myData.registrations?.map(r => r.training.id) || []);
        const available = allData.trainings.filter(t => !registeredIds.has(t.id));
        setAvailableTrainings(available);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching trainings:', err);
      setError('Failed to load trainings');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (trainingId) => {
    try {
      const response = await fetch(`/api/training/${trainingId}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedTraining(data.training);
        setDetailsDialogOpen(true);
      }
    } catch (err) {
      console.error('Error fetching training details:', err);
    }
  };

  const handleRegister = async () => {
    if (!selectedTraining) return;
    
    try {
      setRegistering(true);
      const response = await fetch(`/api/training/${selectedTraining.id}/register`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDetailsDialogOpen(false);
        setSelectedTraining(null);
        fetchTrainings(); // Refresh the lists
      } else {
        alert(data.error || 'Failed to register for training');
      }
    } catch (err) {
      console.error('Error registering:', err);
      alert('Failed to register for training');
    } finally {
      setRegistering(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'REGISTERED': return 'primary';
      case 'COMPLETED': return 'success';
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
        title="Training Portal"
        description="Register for trainings and track your progress"
        icon={<TrainingIcon sx={{ fontSize: 40 }} />}
        breadcrumbs={[
          { label: 'Home', path: '/researcher', icon: <HomeIcon /> },
          { label: 'Training' }
        ]}
      />
      <Container maxWidth="xl" sx={{ py: 4 }}>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* My Trainings Section */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrainingIcon sx={{ color: '#8b6cbc' }} />
          My Trainings
        </Typography>

        {myTrainings.length === 0 ? (
          <Alert severity="info">
            You haven't registered for any trainings yet. Browse available trainings below to get started.
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {myTrainings.map((registration) => (
              <Card
                key={registration.id}
                sx={{
                  width: 'calc(33.333% - 16px)',
                  minWidth: '320px',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    boxShadow: theme.shadows[8],
                    transform: 'translateY(-4px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
                      {registration.training.title}
                    </Typography>
                    <Chip
                      label={registration.status}
                      color={getStatusColor(registration.status)}
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {registration.training.description?.substring(0, 100)}
                    {registration.training.description?.length > 100 && '...'}
                  </Typography>

                  <Stack spacing={1} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(registration.training.startDate)} - {formatDate(registration.training.endDate)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {registration.training.location || 'TBD'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PeopleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {registration.training.department} • {registration.training.targetGroup}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Progress */}
                  {registration.totalModules > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Progress
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {registration.completedModules}/{registration.totalModules} modules
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={registration.progressPercentage}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: theme.palette.grey[200],
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: '#8b6cbc',
                          },
                        }}
                      />
                    </Box>
                  )}

                  {registration.hasCertificate && (
                    <Chip
                      icon={<CertificateIcon />}
                      label="Certificate Available"
                      color="success"
                      size="small"
                      sx={{ mt: 2 }}
                    />
                  )}
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    size="small"
                    startIcon={<MaterialsIcon />}
                    onClick={() => handleViewDetails(registration.training.id)}
                  >
                    View Materials
                  </Button>
                  {registration.hasCertificate && (
                    <Button
                      size="small"
                      startIcon={<CertificateIcon />}
                      onClick={() => window.open(registration.certificate.certificateUrl, '_blank')}
                    >
                      Download Certificate
                    </Button>
                  )}
                </CardActions>
              </Card>
            ))}
          </Box>
        )}
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Available Trainings Section */}
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ScheduleIcon sx={{ color: '#8b6cbc' }} />
          Available Trainings
        </Typography>

        {availableTrainings.length === 0 ? (
          <Alert severity="info">
            No trainings available at the moment. Check back later for new opportunities.
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {availableTrainings.map((training) => (
              <Card
                key={training.id}
                sx={{
                  width: 'calc(33.333% - 16px)',
                  minWidth: '320px',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: theme.shadows[8],
                    transform: 'translateY(-4px)',
                  },
                  transition: 'all 0.3s ease',
                }}
                onClick={() => handleViewDetails(training.id)}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    {training.title}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {training.description?.substring(0, 100)}
                    {training.description?.length > 100 && '...'}
                  </Typography>

                  <Stack spacing={1} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(training.startDate)} - {formatDate(training.endDate)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {training.location || 'TBD'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PeopleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {training.department} • {training.targetGroup}
                      </Typography>
                    </Box>
                  </Stack>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Chip
                      label={`${training.moduleCount} modules`}
                      size="small"
                      variant="outlined"
                    />
                    <Typography variant="caption" color={training.remainingSlots > 0 ? 'success.main' : 'error.main'}>
                      {training.remainingSlots > 0 
                        ? `${training.remainingSlots} slots left`
                        : 'Full'}
                    </Typography>
                  </Box>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    size="small"
                    startIcon={<InfoIcon />}
                    fullWidth
                  >
                    View Details & Register
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Box>
        )}
      </Box>

      {/* Training Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedTraining && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box component="span" sx={{ fontWeight: 600 }}>
                {selectedTraining.title}
              </Box>
              <IconButton onClick={() => setDetailsDialogOpen(false)} size="small">
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Stack spacing={3}>
                {/* Basic Info */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body2">
                    {selectedTraining.description || 'No description available'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ flex: '1 1 45%' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Department
                    </Typography>
                    <Typography variant="body2">{selectedTraining.department}</Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 45%' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Target Group
                    </Typography>
                    <Typography variant="body2">{selectedTraining.targetGroup}</Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 45%' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Location
                    </Typography>
                    <Typography variant="body2">{selectedTraining.location || 'TBD'}</Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 45%' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Duration
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(selectedTraining.startDate)} - {formatDate(selectedTraining.endDate)}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 45%' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Capacity
                    </Typography>
                    <Typography variant="body2">
                      {selectedTraining.maxParticipants} participants ({selectedTraining.remainingSlots} slots remaining)
                    </Typography>
                  </Box>
                </Box>

                {/* Modules */}
                {selectedTraining.modules && selectedTraining.modules.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Training Modules
                    </Typography>
                    <Stack spacing={1} sx={{ mt: 1 }}>
                      {selectedTraining.modules.map((module, index) => (
                        <Card key={module.id} variant="outlined" sx={{ p: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            Module {index + 1}: {module.title}
                          </Typography>
                          {module.description && (
                            <Typography variant="caption" color="text.secondary">
                              {module.description}
                            </Typography>
                          )}
                        </Card>
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* Public Materials */}
                {selectedTraining.materials && selectedTraining.materials.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Available Materials
                    </Typography>
                    <Stack spacing={1} sx={{ mt: 1 }}>
                      {selectedTraining.materials
                        .filter(m => m.accessLevel === 'PUBLIC')
                        .map((material) => (
                          <Box
                            key={material.id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              p: 1,
                              border: `1px solid ${theme.palette.divider}`,
                              borderRadius: 1,
                            }}
                          >
                            <Typography variant="body2">{material.name}</Typography>
                            <Button
                              size="small"
                              onClick={() => window.open(material.fileUrl, '_blank')}
                            >
                              Download
                            </Button>
                          </Box>
                        ))}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setDetailsDialogOpen(false)}>
                Cancel
              </Button>
              {!selectedTraining.isRegistered && (
                <Button
                  variant="contained"
                  onClick={handleRegister}
                  disabled={registering || selectedTraining.remainingSlots <= 0}
                  sx={{
                    backgroundColor: '#8b6cbc',
                    '&:hover': { backgroundColor: '#7a5caa' },
                  }}
                >
                  {registering ? 'Registering...' : 'Register for Training'}
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
    </>
  );
}
