'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Chip,
  InputAdornment,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

const STEPS = ['Institution', 'Verified domains', 'Admin'];

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
  givenName: '',
  familyName: '',
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
    if (!admin.givenName.trim() || !admin.familyName.trim()) {
      setError('Admin first and last name are required');
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
          givenName: admin.givenName.trim(),
          familyName: admin.familyName.trim(),
          email: admin.email.trim(),
          password: admin.password,
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

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {t('global_admin.add_institution')}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stepper activeStep={step} alternativeLabel sx={{ mt: 1, mb: 3 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {step === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
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
          </Box>
        )}

        {step === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                    <Button onClick={addDomainChip} startIcon={<AddIcon />} size="small">
                      Add
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {domains.map((domain) => (
                <Chip
                  key={domain}
                  label={domain}
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
          </Box>
        )}

        {step === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              fullWidth
              required
              label="First name"
              value={admin.givenName}
              onChange={(event) => setAdmin((prev) => ({ ...prev, givenName: event.target.value }))}
            />
            <TextField
              fullWidth
              required
              label="Last name"
              value={admin.familyName}
              onChange={(event) => setAdmin((prev) => ({ ...prev, familyName: event.target.value }))}
            />
            <TextField
              fullWidth
              required
              type="email"
              label="Admin email"
              value={admin.email}
              onChange={(event) => setAdmin((prev) => ({ ...prev, email: event.target.value }))}
            />
            <TextField
              fullWidth
              required
              type="password"
              label="Password"
              value={admin.password}
              onChange={(event) => setAdmin((prev) => ({ ...prev, password: event.target.value }))}
              helperText="Minimum 8 characters"
            />
            <TextField
              fullWidth
              required
              type="password"
              label="Confirm password"
              value={admin.confirmPassword}
              onChange={(event) => setAdmin((prev) => ({ ...prev, confirmPassword: event.target.value }))}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={submitting}>
          {step === 0 ? 'Cancel' : 'Close'}
        </Button>
        <Button onClick={handlePrimary} variant="contained" disabled={submitting}>
          {primaryLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateInstitutionWizard;
