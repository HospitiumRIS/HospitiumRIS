'use client';

/**
 * Shared building blocks for the registration steps so every step
 * uses the same heading, label, input and password styles.
 */
import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

/* ---------- Input styling (applied once at the panel level) ---------- */
export const formFieldsSx = (theme) => {
  const dark = theme.palette.mode === 'dark';
  const border = dark ? alpha('#fff', 0.16) : '#d0d5dd';
  const borderHover = dark ? alpha('#fff', 0.32) : '#98a2b3';
  return {
    '& .MuiOutlinedInput-root': {
      borderRadius: 1.25,
      backgroundColor: dark ? alpha('#fff', 0.02) : '#fff',
      transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
      '& fieldset': { borderColor: border },
      '&:hover fieldset': { borderColor: borderHover },
      '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main, borderWidth: 1 },
      '&.Mui-focused': { boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.18)}` },
      '&.Mui-error fieldset': { borderColor: theme.palette.error.main },
      '&.Mui-error.Mui-focused': { boxShadow: `0 0 0 3px ${alpha(theme.palette.error.main, 0.15)}` },
      '&.Mui-disabled': { backgroundColor: dark ? alpha('#fff', 0.04) : '#f9fafb' },
    },
    '& .MuiOutlinedInput-input': { py: '9px', fontSize: '0.875rem' },
    '& .MuiInputAdornment-root .MuiSvgIcon-root': { fontSize: 18 },
    '& .MuiOutlinedInput-input::placeholder': { color: theme.palette.text.secondary, opacity: 0.7 },
    '& .MuiFormHelperText-root': { mx: 0, mt: 0.5, fontSize: '0.75rem', lineHeight: 1.4 },
  };
};

/* ---------- Step heading ---------- */
export const StepHeader = ({ title, subtitle, action }) => (
  <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
    <Box>
      <Typography
        component="h2"
        sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.3, mb: 0.5 }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', maxWidth: 560 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
    {action}
  </Box>
);

/* ---------- Section label inside a step ---------- */
export const SectionLabel = ({ children, sx }) => (
  <Typography
    sx={{
      fontSize: '0.6875rem',
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'text.secondary',
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      mb: 1.5,
      '&::after': { content: '""', flex: 1, height: '1px', bgcolor: 'divider' },
      ...sx,
    }}
  >
    {children}
  </Typography>
);

/* ---------- Label-above field wrapper ---------- */
export const Field = ({ label, htmlFor, required, aside, children }) => (
  <Box sx={{ minWidth: 0 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.5 }}>
      <Typography component="label" htmlFor={htmlFor} sx={{ fontSize: '0.8125rem', fontWeight: 500, color: 'text.primary' }}>
        {label}
        {required && <Box component="span" sx={{ color: 'error.main', ml: 0.25 }}>*</Box>}
      </Typography>
      {aside}
    </Box>
    {children}
  </Box>
);

/* ---------- Responsive 2-column row ---------- */
export const FieldRow = ({ children, sx }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, columnGap: 2, rowGap: 2, ...sx }}>
    {children}
  </Box>
);

/* ---------- Password rules (kept in sync with page validation) ---------- */
export const passwordRules = (password = '') => ({
  minLength: password.length >= 8,
  hasUpper: /[A-Z]/.test(password),
  hasLower: /[a-z]/.test(password),
  hasNumber: /\d/.test(password),
  hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
});

const PasswordStrength = ({ password }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const rules = passwordRules(password);
  const met = Object.values(rules).filter(Boolean).length;

  const levels = [
    { label: t('auth.pw_strength_weak', 'Weak'), color: theme.palette.error.main },
    { label: t('auth.pw_strength_fair', 'Fair'), color: theme.palette.warning.main },
    { label: t('auth.pw_strength_good', 'Good'), color: theme.palette.info.main },
    { label: t('auth.pw_strength_strong', 'Strong'), color: theme.palette.success.main },
  ];
  const level = met <= 2 ? 0 : met === 3 ? 1 : met === 4 ? 2 : 3;
  const filled = password ? level + 1 : 0;

  const items = [
    ['minLength', t('auth.pw_rule_length', 'At least 8 characters')],
    ['hasUpper', t('auth.pw_rule_upper', 'One uppercase letter')],
    ['hasLower', t('auth.pw_rule_lower', 'One lowercase letter')],
    ['hasNumber', t('auth.pw_rule_number', 'One number')],
    ['hasSpecial', t('auth.pw_rule_special', 'One special character')],
  ];

  return (
    <Box sx={{ mt: 1.25 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.75, flex: 1 }}>
          {[0, 1, 2, 3].map((i) => (
            <Box
              key={i}
              sx={{
                height: 4,
                borderRadius: 2,
                bgcolor: i < filled ? levels[level].color : 'divider',
                transition: 'background-color 0.2s',
              }}
            />
          ))}
        </Box>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, minWidth: 48, textAlign: 'right', color: password ? levels[level].color : 'text.disabled' }}>
          {password ? levels[level].label : ''}
        </Typography>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, rowGap: 0.5, columnGap: 2 }}>
        {items.map(([key, text]) => (
          <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {rules[key] ? (
              <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main' }} />
            ) : (
              <UncheckedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
            )}
            <Typography sx={{ fontSize: '0.75rem', color: rules[key] ? 'text.primary' : 'text.secondary' }}>
              {text}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

/* ---------- Password + confirm with strength meter ---------- */
export const PasswordFields = ({ formData, onInputChange, errors = {} }) => {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const password = formData.password || '';
  const confirm = formData.confirmPassword || '';
  const match = password && confirm && password === confirm;
  const mismatch = password && confirm && password !== confirm;

  const toggle = (visible, setVisible) => (
    <InputAdornment position="end">
      <IconButton
        onClick={() => setVisible(!visible)}
        edge="end"
        size="small"
        aria-label={visible ? t('auth.hide_password', 'Hide password') : t('auth.show_password', 'Show password')}
      >
        {visible ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
      </IconButton>
    </InputAdornment>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Field label={t('common.reg_password')} htmlFor="reg-password" required>
        <TextField
          id="reg-password"
          fullWidth
          name="password"
          type={show ? 'text' : 'password'}
          autoComplete="new-password"
          value={password}
          onChange={onInputChange}
          error={!!errors.password}
          helperText={errors.password}
          placeholder={t('auth.password_placeholder', 'Create a strong password')}
          InputProps={{ endAdornment: toggle(show, setShow) }}
        />
        <PasswordStrength password={password} />
      </Field>

      <Field label={t('common.reg_confirm_password')} htmlFor="reg-confirm-password" required>
        <TextField
          id="reg-confirm-password"
          fullWidth
          name="confirmPassword"
          type={showConfirm ? 'text' : 'password'}
          autoComplete="new-password"
          value={confirm}
          onChange={onInputChange}
          error={!!errors.confirmPassword || !!mismatch}
          helperText={
            errors.confirmPassword ||
            (mismatch ? t('auth.error_passwords_mismatch') : match ? t('auth.passwords_match', 'Passwords match') : ' ')
          }
          FormHelperTextProps={{ sx: match && !errors.confirmPassword ? { color: 'success.main' } : undefined }}
          placeholder={t('auth.confirm_password_placeholder', 'Re-enter your password')}
          InputProps={{
            endAdornment: (
              <>
                {match && <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main', mr: 1 }} />}
                {mismatch && <CancelIcon sx={{ fontSize: 18, color: 'error.main', mr: 1 }} />}
                {toggle(showConfirm, setShowConfirm)}
              </>
            ),
          }}
        />
      </Field>
    </Box>
  );
};
