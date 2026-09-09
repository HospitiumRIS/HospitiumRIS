'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Edit as EditIcon,
  LockReset as LockResetIcon,
  ManageAccounts as ManageAccountsIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { INSTITUTION_TYPES } from '../../lib/institution-types';

function generatePassword(length = 14) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => chars[byte % chars.length]).join('');
}

function AutofillTrap({ username = '' }) {
  return (
    <Box
      aria-hidden
      sx={{ position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden' }}
    >
      <input type="text" name="username" autoComplete="username" value={username} readOnly tabIndex={-1} />
    </Box>
  );
}

function PasswordFields({ password, confirmPassword, onPasswordChange, onConfirmChange, required, helperText }) {
  const [showPassword, setShowPassword] = useState(false);

  const fillGenerated = () => {
    const next = generatePassword();
    onPasswordChange(next);
    onConfirmChange(next);
    setShowPassword(true);
  };

  return (
    <>
      <TextField
        fullWidth
        required={required}
        type={showPassword ? 'text' : 'password'}
        label="Password"
        name="new-password"
        autoComplete="new-password"
        value={password}
        onChange={(event) => onPasswordChange(event.target.value)}
        helperText={helperText}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((prev) => !prev)}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <TextField
        fullWidth
        required={required}
        type={showPassword ? 'text' : 'password'}
        label="Confirm password"
        name="confirm-new-password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(event) => onConfirmChange(event.target.value)}
      />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="button" size="small" onClick={fillGenerated}>
          Generate password
        </Button>
      </Box>
    </>
  );
}

export function EditInstitutionDialog({ open, institution, onClose, onSaved, onError }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: '',
    slug: '',
    contactEmail: '',
    website: '',
    country: '',
    type: 'UNIVERSITY',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !institution) return;
    setForm({
      name: institution.name || '',
      slug: institution.slug || '',
      contactEmail: institution.contactEmail || '',
      website: institution.website || '',
      country: institution.country || '',
      type: institution.type || 'UNIVERSITY',
    });
    setError('');
    setSaving(false);
  }, [open, institution]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSave = async () => {
    if (!institution) return;
    if (!form.name.trim()) {
      setError('Institution name is required');
      return;
    }
    if (!form.slug.trim()) {
      setError('Slug is required');
      return;
    }
    if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
      setError('Enter a valid contact email');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/global-admin/institutions/${institution.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          slug: form.slug.trim(),
          contactEmail: form.contactEmail.trim(),
          website: form.website.trim(),
          country: form.country.trim(),
          type: form.type,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to save institution');
        return;
      }
      onSaved?.(data.institution, 'Institution details saved');
      onClose?.();
    } catch (err) {
      console.error(err);
      setError('Failed to save institution');
      onError?.('Failed to save institution', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('global_admin.edit_institution', { defaultValue: 'Edit institution' })}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '12px !important' }}>
        {error && (
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        <TextField
          fullWidth
          required
          label={t('global_admin.institution_name')}
          name="name"
          value={form.name}
          onChange={handleChange}
        />
        <TextField
          fullWidth
          required
          label={t('global_admin.institution_slug', { defaultValue: 'Slug' })}
          name="slug"
          value={form.slug}
          onChange={handleChange}
          helperText="Used in URLs. Letters, numbers, and hyphens only."
        />
        <TextField
          fullWidth
          type="email"
          label={t('global_admin.contact_email', { defaultValue: 'Contact email' })}
          name="contactEmail"
          autoComplete="off"
          value={form.contactEmail}
          onChange={handleChange}
        />
        <TextField
          fullWidth
          label={t('global_admin.website', { defaultValue: 'Website' })}
          name="website"
          value={form.website}
          onChange={handleChange}
          placeholder="https://example.edu"
        />
        <FormControl fullWidth>
          <InputLabel>{t('global_admin.institution_type')}</InputLabel>
          <Select
            name="type"
            value={form.type}
            label={t('global_admin.institution_type')}
            onChange={handleChange}
          >
            {INSTITUTION_TYPES.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          fullWidth
          label={t('global_admin.country', { defaultValue: 'Country' })}
          name="country"
          value={form.country}
          onChange={handleChange}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          {t('common.cancel')}
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? t('common.saving') : t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function ReassignAdminDialog({ open, institution, onClose, onSaved }) {
  const { t } = useTranslation();
  const hasAdmin = Boolean(institution?.admin);
  const [form, setForm] = useState({
    givenName: '',
    familyName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm({
      givenName: '',
      familyName: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
    setError('');
    setSaving(false);
  }, [open, institution?.id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSave = async () => {
    if (!institution) return;
    if (!form.givenName.trim() || !form.familyName.trim()) {
      setError('First and last name are required');
      return;
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('A valid admin email is required');
      return;
    }
    if (form.password && form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/global-admin/institutions/${institution.id}/admin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          givenName: form.givenName.trim(),
          familyName: form.familyName.trim(),
          email: form.email.trim(),
          password: form.password || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to reassign admin');
        return;
      }
      onSaved?.(data.admin, data.message || 'Institution admin reassigned');
      onClose?.();
    } catch (err) {
      console.error(err);
      setError('Failed to reassign admin');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {hasAdmin
          ? t('global_admin.reassign_admin', { defaultValue: 'Reassign admin' })
          : t('global_admin.assign_admin', { defaultValue: 'Assign admin' })}
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '12px !important' }}>
        <AutofillTrap />
        {error && (
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {hasAdmin && (
          <Alert severity="info">
            Current admin: {institution.admin.givenName} {institution.admin.familyName} ({institution.admin.email}).
            They will lose institution admin access if you assign someone else.
          </Alert>
        )}
        <TextField
          fullWidth
          required
          label="First name"
          name="givenName"
          autoComplete="off"
          value={form.givenName}
          onChange={handleChange}
        />
        <TextField
          fullWidth
          required
          label="Last name"
          name="familyName"
          autoComplete="off"
          value={form.familyName}
          onChange={handleChange}
        />
        <TextField
          fullWidth
          required
          type="email"
          label="Admin email"
          name="email"
          autoComplete="off"
          value={form.email}
          onChange={handleChange}
        />
        <PasswordFields
          password={form.password}
          confirmPassword={form.confirmPassword}
          onPasswordChange={(value) => setForm((prev) => ({ ...prev, password: value }))}
          onConfirmChange={(value) => setForm((prev) => ({ ...prev, confirmPassword: value }))}
          required={!hasAdmin}
          helperText="Required for a new account. Leave blank to keep an existing user's password."
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          {t('common.cancel')}
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving
            ? t('common.saving')
            : hasAdmin
              ? t('global_admin.reassign_admin', { defaultValue: 'Reassign admin' })
              : t('global_admin.assign_admin', { defaultValue: 'Assign admin' })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function ResetAdminPasswordDialog({ open, institution, onClose, onSaved }) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSaving(false);
  }, [open, institution?.id]);

  const handleSave = async () => {
    if (!institution?.admin) {
      setError('This institution has no admin');
      return;
    }
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/global-admin/institutions/${institution.id}/admin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to reset password');
        return;
      }
      onSaved?.(data.admin, 'Admin password reset');
      onClose?.();
    } catch (err) {
      console.error(err);
      setError('Failed to reset password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <form
        autoComplete="off"
        onSubmit={(event) => {
          event.preventDefault();
          handleSave();
        }}
      >
      <DialogTitle>
        {t('global_admin.reset_admin_password', { defaultValue: 'Reset admin password' })}
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '12px !important' }}>
        <AutofillTrap username={institution?.admin?.email || ''} />
        {error && (
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {institution?.admin && (
          <Typography variant="body2" color="text.secondary">
            Set a new password for {institution.admin.givenName} {institution.admin.familyName} ({institution.admin.email}).
          </Typography>
        )}
        <PasswordFields
          password={password}
          confirmPassword={confirmPassword}
          onPasswordChange={setPassword}
          onConfirmChange={setConfirmPassword}
          required
          helperText="Minimum 8 characters"
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button type="button" onClick={onClose} disabled={saving}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" variant="contained" disabled={saving || !institution?.admin}>
          {saving ? t('common.saving') : t('global_admin.reset_password', { defaultValue: 'Reset password' })}
        </Button>
      </DialogActions>
      </form>
    </Dialog>
  );
}

export function InstitutionActionButtons({ institution, onEdit, onReassign, onReset }) {
  const { t } = useTranslation();

  return (
    <>
      <Tooltip title={t('global_admin.edit_details', { defaultValue: 'Edit details' })}>
        <IconButton
          type="button"
          size="small"
          color="primary"
          onClick={onEdit}
          aria-label="Edit institution details"
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip
        title={
          institution.admin
            ? t('global_admin.reassign_admin', { defaultValue: 'Reassign admin' })
            : t('global_admin.assign_admin', { defaultValue: 'Assign admin' })
        }
      >
        <IconButton
          type="button"
          size="small"
          color="primary"
          onClick={onReassign}
          aria-label="Reassign institution admin"
        >
          <ManageAccountsIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip
        title={
          institution.admin
            ? t('global_admin.reset_admin_password', { defaultValue: 'Reset admin password' })
            : 'No admin assigned'
        }
      >
        <span>
          <IconButton
            type="button"
            size="small"
            color="primary"
            onClick={onReset}
            disabled={!institution.admin}
            aria-label="Reset admin password"
          >
            <LockResetIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </>
  );
}
