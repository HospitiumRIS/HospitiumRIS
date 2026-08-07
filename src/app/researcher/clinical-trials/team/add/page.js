'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Home as HomeIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import PageHeader from '../../../../../components/common/PageHeader';
import { useTranslation } from 'react-i18next';

const ROLE_OPTIONS = [
  { value: 'PRINCIPAL_INVESTIGATOR', label: 'Principal Investigator' },
  { value: 'CO_INVESTIGATOR', label: 'Co-Investigator' },
  { value: 'STUDY_COORDINATOR', label: 'Study Coordinator' },
  { value: 'RESEARCH_NURSE', label: 'Research Nurse' },
  { value: 'DATA_MANAGER', label: 'Data Manager' },
  { value: 'REGULATORY_SPECIALIST', label: 'Regulatory Specialist' },
];

const TRIAL_OPTIONS = [
  { value: 'CT-2024-001', label: 'CT-2024-001 — Phase III Trial of Novel Antimalarial Drug' },
  { value: 'CT-2024-002', label: 'CT-2024-002 — Observational Study on HIV Treatment Adherence' },
];

const initialForm = {
  name: '',
  email: '',
  phone: '',
  department: '',
  orcid: '',
  role: '',
  trialId: '',
  site: '',
  gcpCertified: false,
};

export default function AddTeamMemberPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const breadcrumbs = [
    { label: 'Dashboard', path: '/researcher', icon: <HomeIcon sx={{ fontSize: 16 }} /> },
    { label: 'Clinical Trials', path: '/researcher/clinical-trials' },
    { label: 'Study Team & Site Setup', path: '/researcher/clinical-trials/team' },
  ];

  const handleChange = (field) => (event) => {
    const value = field === 'gcpCertified' ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = 'Enter a valid email address';
    if (!form.role) newErrors.role = 'Role is required';
    if (!form.trialId) newErrors.trialId = 'Assigned trial is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      // TODO: wire up to a real team-members API once one exists.
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSuccess(true);
      setTimeout(() => {
        router.push('/researcher/clinical-trials/team');
      }, 800);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <PageHeader
        title="Add Team Member"
        description={t('researcher.team_desc')}
        icon={<PersonAddIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[...breadcrumbs, { label: 'Add Team Member' }]}
        actionButton={
          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={() => router.push('/researcher/clinical-trials/team')}
            sx={{ borderColor: 'white', color: 'white', '&:hover': { borderColor: 'rgba(255,255,255,0.8)', bgcolor: 'rgba(255,255,255,0.1)' } }}
          >
            Back to Study Team
          </Button>
        }
      />

      <Container maxWidth="md" sx={{ py: 5 }}>
        {success && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
            Team member added. Returning to Study Team & Site Setup…
          </Alert>
        )}

        <Paper
          component="form"
          onSubmit={handleSubmit}
          sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)' }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#8b6cbc', mb: 3 }}>
            Personal Information
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Full Name"
                value={form.name}
                onChange={handleChange('name')}
                error={Boolean(errors.name)}
                helperText={errors.name}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                error={Boolean(errors.email)}
                helperText={errors.email}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Phone"
                value={form.phone}
                onChange={handleChange('phone')}
                placeholder="+254 7XX XXX XXX"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Department"
                value={form.department}
                onChange={handleChange('department')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="ORCID"
                value={form.orcid}
                onChange={handleChange('orcid')}
                placeholder="0000-0000-0000-0000"
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#8b6cbc', mb: 3 }}>
            Trial Assignment
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth error={Boolean(errors.role)} required>
                <InputLabel>Role</InputLabel>
                <Select value={form.role} label="Role" onChange={handleChange('role')}>
                  {ROLE_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth error={Boolean(errors.trialId)} required>
                <InputLabel>Assigned Trial</InputLabel>
                <Select value={form.trialId} label="Assigned Trial" onChange={handleChange('trialId')}>
                  {TRIAL_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Study Site"
                value={form.site}
                onChange={handleChange('site')}
                placeholder="e.g. Nairobi — KNH Main"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={<Switch checked={form.gcpCertified} onChange={handleChange('gcpCertified')} />}
                label="GCP Certified"
              />
            </Grid>
          </Grid>

          <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 4 }}>
            <Button
              variant="outlined"
              onClick={() => router.push('/researcher/clinical-trials/team')}
              sx={{ borderColor: '#8b6cbc', color: '#8b6cbc', textTransform: 'none', fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={submitting}
              sx={{ bgcolor: '#8b6cbc', textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#7a5aa8' } }}
            >
              {submitting ? 'Saving…' : 'Add Team Member'}
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
