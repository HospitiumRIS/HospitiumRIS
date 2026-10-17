'use client';

import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  LinearProgress,
  TextField,
  Typography,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as UncheckedIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
} from '../GlobalAdmin/InstitutionModalShell';

const PURPLE = '#8b6cbc';
const PURPLE_DARK = '#7a5caa';

// Mirrors validatePassword() in src/lib/auth.js
const RULES = [
  { key: 'minLength', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { key: 'hasUpper', label: 'An uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { key: 'hasLower', label: 'A lowercase letter', test: (p) => /[a-z]/.test(p) },
  { key: 'hasNumber', label: 'A number', test: (p) => /\d/.test(p) },
  { key: 'hasSpecial', label: 'A symbol (e.g. ! @ # $ %)', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

const STRENGTH = [
  { label: 'Too weak', color: '#dc2626' },
  { label: 'Weak', color: '#ea580c' },
  { label: 'Fair', color: '#ca8a04' },
  { label: 'Good', color: '#65a30d' },
  { label: 'Strong', color: '#15803d' },
];

function PasswordField({ label, value, onChange, autoComplete, error, helperText, disabled }) {
  const [show, setShow] = useState(false);
  return (
    <TextField
      label={label}
      type={show ? 'text' : 'password'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoComplete={autoComplete}
      error={error}
      helperText={helperText}
      disabled={disabled}
      fullWidth
      size="small"
      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton size="small" onClick={() => setShow((v) => !v)} edge="end" aria-label={show ? 'Hide password' : 'Show password'}>
              {show ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
}

/**
 * "Change password" button + modal.
 * Posts to /api/researcher/account/password; the server emails a confirmation.
 */
export default function ChangePasswordButton({ onChanged }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const passed = RULES.filter((r) => r.test(next)).length;
  const allPassed = passed === RULES.length;
  const strength = next ? STRENGTH[Math.max(0, passed - 1)] : null;
  const mismatch = confirm.length > 0 && confirm !== next;
  const canSubmit = current && allPassed && confirm === next && !saving;

  const openModal = () => {
    setCurrent('');
    setNext('');
    setConfirm('');
    setError('');
    setOpen(true);
  };

  const close = () => {
    if (!saving) setOpen(false);
  };

  const submit = async (e) => {
    e?.preventDefault?.();
    if (!canSubmit) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/researcher/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword: current, newPassword: next, confirmPassword: confirm }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setError(data.message || 'Failed to change password');
        return;
      }
      setOpen(false);
      onChanged?.();
    } catch (err) {
      console.error(err);
      setError('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<LockIcon />}
        onClick={openModal}
        sx={{ borderColor: PURPLE, color: PURPLE_DARK, textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap', '&:hover': { borderColor: PURPLE_DARK, bgcolor: 'rgba(139,108,188,0.06)' } }}
      >
        Change password
      </Button>

      <InstitutionModal open={open} onClose={close} disableClose={saving} maxWidth="sm">
        <InstitutionModalHeader
          icon={LockIcon}
          title="Change password"
          subtitle="You'll get an email confirming the change"
          onClose={close}
          disableClose={saving}
        />
        <Box component="form" onSubmit={submit} noValidate>
          <InstitutionModalBody>
            {error && (
              <Alert severity="error" sx={{ borderRadius: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <PasswordField label="Current password" value={current} onChange={setCurrent} autoComplete="current-password" disabled={saving} />
              <PasswordField label="New password" value={next} onChange={setNext} autoComplete="new-password" disabled={saving} />
              {strength && (
                <Box sx={{ mt: -1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={(passed / RULES.length) * 100}
                    sx={{ height: 5, borderRadius: 3, bgcolor: '#e5e7eb', '& .MuiLinearProgress-bar': { bgcolor: strength.color } }}
                  />
                  <Typography variant="caption" sx={{ color: strength.color, fontWeight: 600 }}>
                    {strength.label}
                  </Typography>
                </Box>
              )}
              <PasswordField
                label="Confirm new password"
                value={confirm}
                onChange={setConfirm}
                autoComplete="new-password"
                error={mismatch}
                helperText={mismatch ? "Passwords don't match" : undefined}
                disabled={saving}
              />
            </Box>
            <Box sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2, p: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, columnGap: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.75, gridColumn: '1 / -1' }}>
                Your new password must include
              </Typography>
              {RULES.map((r) => {
                const ok = r.test(next);
                return (
                  <Box key={r.key} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.35 }}>
                    {ok ? <CheckIcon sx={{ fontSize: 17, color: '#15803d' }} /> : <UncheckedIcon sx={{ fontSize: 17, color: '#cbd5e1' }} />}
                    <Typography variant="body2" sx={{ fontSize: '0.813rem', color: ok ? '#15803d' : '#64748b' }}>
                      {r.label}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </InstitutionModalBody>
          <InstitutionModalFooter>
            <Button onClick={close} disabled={saving} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!canSubmit}
              sx={{ bgcolor: PURPLE, '&:hover': { bgcolor: PURPLE_DARK }, fontWeight: 600 }}
            >
              {saving ? 'Updating…' : 'Update password'}
            </Button>
          </InstitutionModalFooter>
        </Box>
      </InstitutionModal>
    </>
  );
}
