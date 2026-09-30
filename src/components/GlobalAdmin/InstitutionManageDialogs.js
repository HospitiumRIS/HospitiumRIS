'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  LockReset as LockResetIcon,
  ManageAccounts as ManageAccountsIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { COUNTRIES } from '../../lib/countries';
import { INSTITUTION_TYPES } from '../../lib/institution-types';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
  InstitutionModalSection,
} from './InstitutionModalShell';
import InstitutionAdminEmailField from './InstitutionAdminEmailField';

function formatAdminName(admin) {
  return [admin?.givenName, admin?.familyName].filter(Boolean).join(' ');
}

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

export function PasswordFields({ password, confirmPassword, onPasswordChange, onConfirmChange, required, helperText }) {
  const [showPassword, setShowPassword] = useState(false);

  const fillGenerated = () => {
    const next = generatePassword();
    onPasswordChange(next);
    onConfirmChange(next);
    setShowPassword(true);
  };

  const showMatchStatus = Boolean(confirmPassword);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

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
        error={showMatchStatus && !passwordsMatch}
        helperText={
          showMatchStatus
            ? passwordsMatch
              ? 'Passwords match'
              : 'Passwords do not match'
            : ' '
        }
        FormHelperTextProps={{
          sx: showMatchStatus && passwordsMatch ? { color: 'success.main' } : undefined,
        }}
        InputProps={{
          endAdornment: showMatchStatus ? (
            <InputAdornment position="end">
              {passwordsMatch ? (
                <CheckCircleIcon color="success" fontSize="small" aria-label="Passwords match" />
              ) : (
                <CancelIcon color="error" fontSize="small" aria-label="Passwords do not match" />
              )}
            </InputAdornment>
          ) : undefined,
        }}
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

  const countryOptions = useMemo(() => {
    const current = form.country?.trim();
    if (current && !COUNTRIES.some((country) => country.name === current)) {
      return [{ code: 'LEGACY', name: current }, ...COUNTRIES];
    }
    return COUNTRIES;
  }, [form.country]);

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
    <InstitutionModal open={open} onClose={onClose} disableClose={saving}>
      <InstitutionModalHeader
        icon={EditIcon}
        title={t('global_admin.edit_institution', { defaultValue: 'Edit institution' })}
        subtitle={institution?.name}
        onClose={onClose}
        disableClose={saving}
      />
      <InstitutionModalBody>
        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        )}
        <InstitutionModalSection title="Basic information">
          <Stack spacing={2.5}>
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
          </Stack>
        </InstitutionModalSection>
        <InstitutionModalSection title="Profile">
          <Stack spacing={2.5}>
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
            <FormControl fullWidth>
              <InputLabel>{t('global_admin.country', { defaultValue: 'Country' })}</InputLabel>
              <Select
                name="country"
                value={form.country}
                label={t('global_admin.country', { defaultValue: 'Country' })}
                onChange={handleChange}
                MenuProps={{ PaperProps: { style: { maxHeight: 280 } } }}
              >
                <MenuItem value="">
                  <em>Select country</em>
                </MenuItem>
                {countryOptions.map((country) => (
                  <MenuItem key={country.code} value={country.name}>
                    {country.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </InstitutionModalSection>
      </InstitutionModalBody>
      <InstitutionModalFooter>
        <Button onClick={onClose} disabled={saving} color="inherit">
          {t('common.cancel')}
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ minWidth: 120 }}>
          {saving ? t('common.saving') : t('common.save')}
        </Button>
      </InstitutionModalFooter>
    </InstitutionModal>
  );
}

export function ReassignAdminDialog({ open, institution, onClose, onSaved }) {
  const { t } = useTranslation();
  const admins = institution?.admins || (institution?.admin ? [institution.admin] : []);
  const hasAdmin = admins.length > 0;
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    isPrimary: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      isPrimary: !hasAdmin,
    });
    setError('');
    setSaving(false);
  }, [open, institution?.id, hasAdmin]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError('');
  };

  const handleSetPrimary = async (userId) => {
    if (!institution) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/global-admin/institutions/${institution.id}/admin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set-primary', userId }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to set primary admin');
        return;
      }
      onSaved?.(data.admin, data.message || 'Primary system admin updated');
    } catch (err) {
      console.error(err);
      setError('Failed to set primary admin');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!institution) return;
    if (!form.name.trim()) {
      setError('Admin name is required');
      return;
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('A valid admin email is required');
      return;
    }
    if (!form.password) {
      setError('Password is required');
      return;
    }
    if (form.password.length < 8) {
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          confirmPassword: form.confirmPassword,
          isPrimary: form.isPrimary,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to add system admin');
        return;
      }
      onSaved?.(data.admin, data.message || 'System admin added');
      onClose?.();
    } catch (err) {
      console.error(err);
      setError('Failed to add system admin');
    } finally {
      setSaving(false);
    }
  };

  const modalTitle = hasAdmin
    ? t('global_admin.add_system_admin', { defaultValue: 'Add system admin' })
    : t('global_admin.assign_admin', { defaultValue: 'Assign admin' });

  return (
    <InstitutionModal open={open} onClose={onClose} disableClose={saving}>
      <InstitutionModalHeader
        icon={ManageAccountsIcon}
        title={modalTitle}
        subtitle={institution?.name}
        onClose={onClose}
        disableClose={saving}
      />
      <InstitutionModalBody>
        <AutofillTrap />
        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        )}
        {hasAdmin && (
          <InstitutionModalSection title="Current system admins">
            <Stack spacing={1.25}>
              {admins.map((admin) => (
                <Box
                  key={admin.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: admin.isPrimary ? 'primary.main' : 'divider',
                    boxShadow: admin.isPrimary
                      ? (theme) => `0 0 0 1px ${alpha(theme.palette.primary.main, 0.18)}`
                      : 'none',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                    <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}>
                      {formatAdminName(admin).slice(0, 1).toUpperCase() || '?'}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {formatAdminName(admin)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {admin.email}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                    {admin.isPrimary ? (
                      <Chip label="Primary" size="small" color="primary" variant="filled" />
                    ) : (
                      <Button size="small" variant="outlined" onClick={() => handleSetPrimary(admin.id)} disabled={saving}>
                        Make primary
                      </Button>
                    )}
                  </Box>
                </Box>
              ))}
            </Stack>
          </InstitutionModalSection>
        )}
        <InstitutionModalSection title="New system admin">
          <Stack spacing={2.5}>
            <TextField
              fullWidth
              required
              label="Admin name"
              name="name"
              autoComplete="off"
              placeholder="Institution System Admin"
              helperText="Display name for the institution system admin account"
              value={form.name}
              onChange={handleChange}
            />
            <InstitutionAdminEmailField
              value={form.email}
              onChange={(email) => setForm((prev) => ({ ...prev, email }))}
              institution={institution}
              onErrorClear={() => setError('')}
            />
            <PasswordFields
              password={form.password}
              confirmPassword={form.confirmPassword}
              onPasswordChange={(value) => setForm((prev) => ({ ...prev, password: value }))}
              onConfirmChange={(value) => setForm((prev) => ({ ...prev, confirmPassword: value }))}
              required
              helperText="Minimum 8 characters"
            />
            {hasAdmin && (
              <FormControlLabel
                control={
                  <Checkbox
                    name="isPrimary"
                    checked={form.isPrimary}
                    onChange={handleChange}
                  />
                }
                label="Set as primary system admin"
              />
            )}
          </Stack>
        </InstitutionModalSection>
      </InstitutionModalBody>
      <InstitutionModalFooter>
        <Button onClick={onClose} disabled={saving} color="inherit">
          {t('common.cancel')}
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ minWidth: 140 }}>
          {saving ? t('common.saving') : modalTitle}
        </Button>
      </InstitutionModalFooter>
    </InstitutionModal>
  );
}

export function ResetAdminPasswordDialog({ open, institution, onClose, onSaved }) {
  const { t } = useTranslation();
  const admins = institution?.admins || (institution?.admin ? [institution.admin] : []);
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const defaultAdmin = admins.find((admin) => admin.isPrimary) || admins[0];
    setSelectedAdminId(defaultAdmin?.id || '');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSaving(false);
  }, [open, institution?.id, admins]);

  const selectedAdmin = admins.find((admin) => admin.id === selectedAdminId) || admins[0];

  const handleSave = async () => {
    if (!selectedAdmin) {
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
        body: JSON.stringify({
          action: 'reset-password',
          userId: selectedAdmin.id,
          password,
          confirmPassword,
        }),
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
    <InstitutionModal open={open} onClose={onClose} disableClose={saving}>
      <Box
        component="form"
        autoComplete="off"
        onSubmit={(event) => {
          event.preventDefault();
          handleSave();
        }}
      >
        <InstitutionModalHeader
          icon={LockResetIcon}
          title={t('global_admin.reset_admin_password', { defaultValue: 'Reset admin password' })}
          subtitle={institution?.name}
          onClose={onClose}
          disableClose={saving}
        />
        <InstitutionModalBody>
          <AutofillTrap username={selectedAdmin?.email || ''} />
          {error && (
            <Alert severity="error" onClose={() => setError('')} sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}
          <InstitutionModalSection title="Account">
            <Stack spacing={2.5}>
              {admins.length > 1 && (
                <FormControl fullWidth>
                  <InputLabel>System admin</InputLabel>
                  <Select
                    value={selectedAdminId}
                    label="System admin"
                    onChange={(event) => setSelectedAdminId(event.target.value)}
                  >
                    {admins.map((admin) => (
                      <MenuItem key={admin.id} value={admin.id}>
                        {formatAdminName(admin)} ({admin.email}){admin.isPrimary ? ' - Primary' : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              {selectedAdmin && (
                <Typography variant="body2" color="text.secondary">
                  Set a new password for {formatAdminName(selectedAdmin)} ({selectedAdmin.email}).
                </Typography>
              )}
            </Stack>
          </InstitutionModalSection>
          <InstitutionModalSection title="New password">
            <PasswordFields
              password={password}
              confirmPassword={confirmPassword}
              onPasswordChange={setPassword}
              onConfirmChange={setConfirmPassword}
              required
              helperText="Minimum 8 characters"
            />
          </InstitutionModalSection>
        </InstitutionModalBody>
        <InstitutionModalFooter>
          <Button type="button" onClick={onClose} disabled={saving} color="inherit">
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={saving || !selectedAdmin} sx={{ minWidth: 140 }}>
            {saving ? t('common.saving') : t('global_admin.reset_password', { defaultValue: 'Reset password' })}
          </Button>
        </InstitutionModalFooter>
      </Box>
    </InstitutionModal>
  );
}

export function DeleteInstitutionDialog({ open, institution, onClose, onDeleted }) {
  const { t } = useTranslation();
  const [confirmName, setConfirmName] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setConfirmName('');
    setError('');
    setDeleting(false);
  }, [open, institution?.id]);

  const nameMatches = confirmName.trim() === (institution?.name || '');

  const handleDelete = async () => {
    if (!institution || !nameMatches) return;

    setDeleting(true);
    setError('');
    try {
      const response = await fetch(`/api/global-admin/institutions/${institution.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to delete institution');
        return;
      }
      onDeleted?.(data.deleted, data.message || 'Institution deleted');
      onClose?.();
    } catch (err) {
      console.error(err);
      setError('Failed to delete institution');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <InstitutionModal open={open} onClose={onClose} disableClose={deleting}>
      <InstitutionModalHeader
        icon={DeleteIcon}
        title={t('global_admin.delete_institution', { defaultValue: 'Delete institution' })}
        subtitle="This action cannot be undone"
        tone="danger"
        onClose={onClose}
        disableClose={deleting}
      />
      <InstitutionModalBody>
        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        )}
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          This permanently deletes <strong>{institution?.name}</strong>, its verified domains, and linked institution data.
          System admins will be demoted to researcher accounts and members will be unlinked from this institution.
        </Alert>
        <InstitutionModalSection title="Confirm deletion">
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Type <strong>{institution?.name}</strong> to confirm.
            </Typography>
            <TextField
              fullWidth
              label="Institution name"
              value={confirmName}
              onChange={(event) => {
                setConfirmName(event.target.value);
                setError('');
              }}
              autoComplete="off"
              error={Boolean(confirmName) && !nameMatches}
              helperText={confirmName && !nameMatches ? 'Name does not match' : ' '}
            />
          </Stack>
        </InstitutionModalSection>
      </InstitutionModalBody>
      <InstitutionModalFooter>
        <Button onClick={onClose} disabled={deleting} color="inherit">
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleDelete}
          disabled={deleting || !nameMatches}
          sx={{ minWidth: 120 }}
        >
          {deleting ? t('common.deleting', { defaultValue: 'Deleting...' }) : t('common.delete')}
        </Button>
      </InstitutionModalFooter>
    </InstitutionModal>
  );
}

export function InstitutionActionButtons({ institution, onEdit, onReassign, onReset, onDelete }) {
  const { t } = useTranslation();

  return (
    <>
      <Tooltip title={t('global_admin.edit_details', { defaultValue: 'Edit details' })}>
        <IconButton
          type="button"
          size="small"
          color="primary"
          onClick={(event) => {
            event.stopPropagation();
            onEdit();
          }}
          aria-label="Edit institution details"
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip
        title={
          institution.admin
            ? t('global_admin.add_system_admin', { defaultValue: 'Add system admin' })
            : t('global_admin.assign_admin', { defaultValue: 'Assign admin' })
        }
      >
        <IconButton
          type="button"
          size="small"
          color="primary"
          onClick={(event) => {
            event.stopPropagation();
            onReassign();
          }}
          aria-label="Add institution system admin"
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
            onClick={(event) => {
              event.stopPropagation();
              onReset();
            }}
            disabled={!institution.admin}
            aria-label="Reset admin password"
          >
            <LockResetIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={t('global_admin.delete_institution', { defaultValue: 'Delete institution' })}>
        <IconButton
          type="button"
          size="small"
          color="error"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          aria-label="Delete institution"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </>
  );
}
