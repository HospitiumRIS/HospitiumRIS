'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  TextField,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Chip,
  InputAdornment,
  Alert,
  Stack,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Business as BusinessIcon,
  Delete as DeleteIcon,
  Domain as DomainIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { PasswordFields } from './InstitutionManageDialogs';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
  InstitutionModalSection,
} from './InstitutionModalShell';

const STEPS = [
  { label: 'Institution', icon: BusinessIcon },
  { label: 'Verified domains', icon: DomainIcon },
  { label: 'Admin', icon: PersonIcon },
];

function slugifyPreview(text) {
  return (text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const emptyAdmin = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const CreateInstitutionWizard = ({ open, onClose, onComplete }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [institutionId, setInstitutionId] = useState(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', contactEmail: '' });
  const [domainInput, setDomainInput] = useState('');
  const [domains, setDomains] = useState([]);
  const [admin, setAdmin] = useState(emptyAdmin);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setSubmitting(false);
    setError('');
    setInstitutionId(null);
    setSlugTouched(false);
    setForm({ name: '', slug: '', contactEmail: '' });
    setDomainInput('');
    setDomains([]);
    setAdmin(emptyAdmin);
  }, [open]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'name' && !slugTouched) {
        next.slug = slugifyPreview(value);
      }
      return next;
    });
    setError('');
  };

  const addDomainChip = () => {
    const domain = domainInput
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/.*$/, '');
    if (!domain) return;
    if (domains.includes(domain)) {
      setError('That domain is already in the list');
      return;
    }
    setDomains((prev) => [...prev, domain]);
    setDomainInput('');
    setError('');
  };

  const createInstitution = async () => {
    if (!form.name.trim()) {
      setError('Institution name is required');
      return;
    }
    if (!form.slug.trim()) {
      setError('Slug is required');
      return;
    }
    if (!form.contactEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
      setError('A valid contact email is required');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/global-admin/institutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          slug: form.slug.trim(),
          contactEmail: form.contactEmail.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to create institution');
        return;
      }
      setInstitutionId(data.institution.id);
      setStep(1);
    } catch (err) {
      console.error(err);
      setError('Failed to create institution');
    } finally {
      setSubmitting(false);
    }
  };

  const addDomains = async () => {
    if (!institutionId) return;
    if (domains.length === 0) {
      setError('Add at least one verified domain');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const response = await fetch(`/api/global-admin/institutions/${institutionId}/domains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domains }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to add domains');
        return;
      }
      setStep(2);
    } catch (err) {
      console.error(err);
      setError('Failed to add domains');
    } finally {
      setSubmitting(false);
    }
  };

  const addAdmin = async () => {
    if (!institutionId) return;
    if (!admin.name.trim()) {
      setError('Admin name is required');
      return;
    }
    if (!admin.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(admin.email)) {
      setError('A valid admin email is required');
      return;
    }
    if (!admin.password || admin.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (admin.password !== admin.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const response = await fetch(`/api/global-admin/institutions/${institutionId}/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: admin.name.trim(),
          email: admin.email.trim(),
          password: admin.password,
          confirmPassword: admin.confirmPassword,
          isPrimary: true,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to add admin');
        return;
      }
      onComplete?.();
      onClose?.();
    } catch (err) {
      console.error(err);
      setError('Failed to add admin');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrimary = () => {
    if (step === 0) return createInstitution();
    if (step === 1) return addDomains();
    return addAdmin();
  };

  const primaryLabel = submitting
    ? 'Saving...'
    : step === 0
      ? t('global_admin.create_institution', { defaultValue: 'Create institution' })
      : step === 1
        ? t('global_admin.save_domains', { defaultValue: 'Save domains' })
        : t('global_admin.create_admin', { defaultValue: 'Create admin' });

  const StepIcon = STEPS[step]?.icon || BusinessIcon;

  return (
    <InstitutionModal open={open} onClose={onClose} disableClose={submitting}>
      <InstitutionModalHeader
        icon={StepIcon}
        title={t('global_admin.add_institution')}
        subtitle={`Step ${step + 1} of ${STEPS.length} · ${STEPS[step].label}`}
        onClose={onClose}
        disableClose={submitting}
      />
      <InstitutionModalBody>
        <Box
          sx={{
            px: 1,
            py: 1.5,
            borderRadius: 2,
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stepper
            activeStep={step}
            alternativeLabel
            sx={{
              '& .MuiStepLabel-label': { fontWeight: 500, mt: 0.5 },
              '& .MuiStepIcon-root.Mui-active': { color: 'primary.main' },
              '& .MuiStepIcon-root.Mui-completed': { color: 'success.main' },
            }}
          >
            {STEPS.map(({ label }) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {step === 0 && (
          <InstitutionModalSection title="Institution details">
            <Stack spacing={2.5}>
              <TextField
                fullWidth
                required
                label={t('global_admin.institution_name')}
                name="name"
                value={form.name}
                onChange={handleFormChange}
              />
              <TextField
                fullWidth
                required
                label={t('global_admin.institution_slug', { defaultValue: 'Slug' })}
                name="slug"
                value={form.slug}
                onChange={(event) => {
                  setSlugTouched(true);
                  handleFormChange(event);
                }}
                helperText="Used in URLs. Letters, numbers, and hyphens only."
              />
              <TextField
                fullWidth
                required
                type="email"
                label={t('global_admin.contact_email', { defaultValue: 'Contact email' })}
                name="contactEmail"
                value={form.contactEmail}
                onChange={handleFormChange}
              />
            </Stack>
          </InstitutionModalSection>
        )}

        {step === 1 && (
          <InstitutionModalSection title="Verified domains">
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                Add the email domains this institution owns (e.g. university.edu). Users with matching addresses can be linked automatically.
              </Typography>
              <TextField
                fullWidth
                label={t('global_admin.domain', { defaultValue: 'Domain' })}
                value={domainInput}
                onChange={(event) => setDomainInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addDomainChip();
                  }
                }}
                placeholder="university.edu"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button onClick={addDomainChip} startIcon={<AddIcon />} size="small" variant="outlined">
                        Add
                      </Button>
                    </InputAdornment>
                  ),
                }}
              />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, minHeight: 36 }}>
                {domains.map((domain) => (
                  <Chip
                    key={domain}
                    label={domain}
                    color="primary"
                    variant="outlined"
                    onDelete={() => setDomains((prev) => prev.filter((item) => item !== domain))}
                    deleteIcon={<DeleteIcon />}
                  />
                ))}
              </Box>
              {domains.length === 0 && (
                <Typography variant="caption" color="text.secondary">
                  Add at least one domain to continue.
                </Typography>
              )}
            </Stack>
          </InstitutionModalSection>
        )}

        {step === 2 && (
          <InstitutionModalSection title="Primary system admin">
            <Stack spacing={2.5}>
              <TextField
                fullWidth
                required
                label="Admin name"
                placeholder="Institution System Admin"
                helperText="Display name for the institution system admin account"
                value={admin.name}
                onChange={(event) => setAdmin((prev) => ({ ...prev, name: event.target.value }))}
              />
              <TextField
                fullWidth
                required
                type="email"
                label="Admin email"
                name="admin-email"
                autoComplete="off"
                value={admin.email}
                onChange={(event) => setAdmin((prev) => ({ ...prev, email: event.target.value }))}
              />
              <PasswordFields
                password={admin.password}
                confirmPassword={admin.confirmPassword}
                onPasswordChange={(value) => setAdmin((prev) => ({ ...prev, password: value }))}
                onConfirmChange={(value) => setAdmin((prev) => ({ ...prev, confirmPassword: value }))}
                required
                helperText="Minimum 8 characters"
              />
            </Stack>
          </InstitutionModalSection>
        )}
      </InstitutionModalBody>
      <InstitutionModalFooter>
        <Button onClick={onClose} disabled={submitting} color="inherit">
          {step === 0 ? 'Cancel' : 'Close'}
        </Button>
        <Button onClick={handlePrimary} variant="contained" disabled={submitting} sx={{ minWidth: 150 }}>
          {primaryLabel}
        </Button>
      </InstitutionModalFooter>
    </InstitutionModal>
  );
};

export default CreateInstitutionWizard;
