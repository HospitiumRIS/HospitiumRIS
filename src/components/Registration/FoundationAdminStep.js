'use client';

import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  MailOutline as MailIcon,
} from '@mui/icons-material';
import { StepHeader, SectionLabel, Field, PasswordFields } from './FormKit';

const FoundationAdminStep = ({ formData, onInputChange, errors, accountType }) => {
  const { t } = useTranslation();
  const [domainStatus, setDomainStatus] = useState('idle');
  const [domainMessage, setDomainMessage] = useState('');

  const isFoundationAdmin = accountType === 'FOUNDATION_ADMIN';
  const title = isFoundationAdmin ? t('auth.foundation_admin_title') : t('auth.operations_title');
  const subtitle = isFoundationAdmin ? t('auth.foundation_admin_subtitle') : t('auth.operations_subtitle');

  const verifyDomain = async (email) => {
    if (!isFoundationAdmin) return;
    if (!email || !email.includes('@')) {
      setDomainStatus('idle');
      setDomainMessage('');
      return;
    }
    setDomainStatus('checking');
    setDomainMessage('');
    try {
      const response = await fetch('/api/auth/verify-email-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (data.valid) {
        setDomainStatus('valid');
        setDomainMessage(data.message);
      } else {
        setDomainStatus('invalid');
        setDomainMessage(data.message || t('auth.error_email_verified_domain'));
      }
    } catch (error) {
      setDomainStatus('idle');
      setDomainMessage('');
    }
  };

  const statusAdornment =
    domainStatus === 'checking' ? <CircularProgress size={16} />
    : domainStatus === 'valid' ? <CheckCircleIcon color="success" fontSize="small" />
    : domainStatus === 'invalid' ? <CancelIcon color="error" fontSize="small" />
    : null;

  return (
    <Box>
      <StepHeader title={title} subtitle={subtitle} />

      {isFoundationAdmin && (
        <Alert severity="info" variant="outlined" sx={{ mb: 2.5, borderRadius: 1.5, py: 0.25, fontSize: '0.8125rem' }}>
          {t('auth.foundation_admin_alert')}
        </Alert>
      )}

      <Box sx={{ maxWidth: 520 }}>
        <SectionLabel>{t('auth.section_sign_in_details', 'Sign-in details')}</SectionLabel>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Field label={t('auth.institutional_email')} htmlFor="reg-email" required>
            <TextField
              id="reg-email"
              fullWidth
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email || ''}
              onChange={(e) => {
                if (domainStatus !== 'idle') {
                  setDomainStatus('idle');
                  setDomainMessage('');
                }
                onInputChange(e);
              }}
              onBlur={(e) => verifyDomain(e.target.value)}
              error={!!errors.email || domainStatus === 'invalid'}
              helperText={errors.email || domainMessage || t('auth.institutional_email_helper')}
              placeholder={t('auth.institutional_email_placeholder')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MailIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
                endAdornment: statusAdornment ? <InputAdornment position="end">{statusAdornment}</InputAdornment> : null,
              }}
            />
          </Field>

          <PasswordFields formData={formData} onInputChange={onInputChange} errors={errors} />
        </Box>
      </Box>
    </Box>
  );
};

export default FoundationAdminStep;
