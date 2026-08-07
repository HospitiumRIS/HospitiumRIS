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

const TRIAL_OPTIONS = [
  { value: 'CT-2024-001', label: 'CT-2024-001 — Phase III Trial of Novel Antimalarial Drug' },
  { value: 'CT-2024-002', label: 'CT-2024-002 — Observational Study on HIV Treatment Adherence' },
  { value: 'CT-2024-003', label: 'CT-2024-003 — Randomized Trial of TB Vaccine Efficacy' },
];

const initialForm = {
  trialId: '',
  site: '',
  entryDate: new Date().toISOString().slice(0, 10),
  screened: '',
  enrolled: '',
  screenFailures: '',
  consentWithdrawn: '',
  notes: '',
};

export default function RecordEnrollmentPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const breadcrumbs = [
    { label: 'Dashboard', path: '/researcher', icon: <HomeIcon sx={{ fontSize: 16 }} /> },
    { label: 'Clinical Trials', path: '/researcher/clinical-trials' },
    { label: 'Trial Progress & Recruitment', path: '/researcher/clinical-trials/recruitment' },
  ];

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.trialId) newErrors.trialId = 'Trial is required';
    if (!form.entryDate) newErrors.entryDate = 'Date is required';
    if (form.screened === '' || Number(form.screened) < 0) newErrors.screened = 'Enter a valid count';
    if (form.enrolled === '' || Number(form.enrolled) < 0) newErrors.enrolled = 'Enter a valid count';
    if (form.enrolled !== '' && form.screened !== '' && Number(form.enrolled) > Number(form.screened)) {
      newErrors.enrolled = 'Enrolled cannot exceed screened';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      // TODO: wire up to a real recruitment/enrollment API once one exists.
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSuccess(true);
      setTimeout(() => {
        router.push('/researcher/clinical-trials/recruitment');
      }, 800);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <PageHeader
        title="Record Enrollment"
        description={t('researcher.recruitment_desc')}
        icon={<PersonAddIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[...breadcrumbs, { label: 'Record Enrollment' }]}
        actionButton={
          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={() => router.push('/researcher/clinical-trials/recruitment')}
            sx={{ borderColor: 'white', color: 'white', '&:hover': { borderColor: 'rgba(255,255,255,0.8)', bgcolor: 'rgba(255,255,255,0.1)' } }}
          >
            Back to Recruitment
          </Button>
        }
      />

      <Container maxWidth="md" sx={{ py: 5 }}>
        {success && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
            Enrollment recorded. Returning to Trial Progress & Recruitment…
          </Alert>
        )}

        <Paper
          component="form"
          onSubmit={handleSubmit}
          sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)' }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#8b6cbc', mb: 3 }}>
            Trial & Site
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth error={Boolean(errors.trialId)} required>
                <InputLabel>Trial</InputLabel>
                <Select value={form.trialId} label="Trial" onChange={handleChange('trialId')}>
                  {TRIAL_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Site"
                value={form.site}
                onChange={handleChange('site')}
                placeholder="e.g. Nairobi — KNH Main"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="Entry Date"
                value={form.entryDate}
                onChange={handleChange('entryDate')}
                error={Boolean(errors.entryDate)}
                helperText={errors.entryDate}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#8b6cbc', mb: 3 }}>
            Enrollment Counts
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Participants Screened"
                value={form.screened}
                onChange={handleChange('screened')}
                error={Boolean(errors.screened)}
                helperText={errors.screened}
                inputProps={{ min: 0 }}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Participants Enrolled"
                value={form.enrolled}
                onChange={handleChange('enrolled')}
                error={Boolean(errors.enrolled)}
                helperText={errors.enrolled}
                inputProps={{ min: 0 }}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Screen Failures"
                value={form.screenFailures}
                onChange={handleChange('screenFailures')}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Consent Withdrawn"
                value={form.consentWithdrawn}
                onChange={handleChange('consentWithdrawn')}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Notes"
                value={form.notes}
                onChange={handleChange('notes')}
                placeholder="Optional context — screen failure reasons, site updates, etc."
              />
            </Grid>
          </Grid>

          <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 4 }}>
            <Button
              variant="outlined"
              onClick={() => router.push('/researcher/clinical-trials/recruitment')}
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
              {submitting ? 'Saving…' : 'Record Enrollment'}
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
