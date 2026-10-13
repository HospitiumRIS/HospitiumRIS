'use client';

import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid,
  FormControl,
  FormHelperText,
  Select,
  MenuItem,
  Chip,
  Alert,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import {
  MailOutline as EmailIcon,
  ApartmentOutlined as BusinessIcon,
  BadgeOutlined as BadgeIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';
import { StepHeader, SectionLabel, Field, FieldRow } from './FormKit';

const RESEARCH_ADMIN_ACCOUNT_NAME = 'Research Administrator';

const AccountDetailsStep = ({ 
  formData, 
  onInputChange, 
  onInstitutionMatched,
  errors, 
  accountType,
  monthOptions = [],
  yearOptions = [],
  emailLocked = false
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isResearchAdmin = accountType === 'RESEARCH_ADMIN';
  const researchAdminAccountName = t('auth.account_name_placeholder', RESEARCH_ADMIN_ACCOUNT_NAME);
  const [domainStatus, setDomainStatus] = useState('idle');
  const [domainMessage, setDomainMessage] = useState('');

  const verifyEmailDomain = async (email) => {
    if (!isResearchAdmin) return;
    if (!email || !email.includes('@')) {
      setDomainStatus('idle');
      setDomainMessage('');
      onInstitutionMatched?.(null);
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
        onInstitutionMatched?.({
          institutionId: data.institutionId,
          institutionName: data.institutionName,
        });
      } else {
        setDomainStatus('invalid');
        setDomainMessage(data.message || t('auth.error_email_verified_domain'));
        onInstitutionMatched?.(null);
      }
    } catch (error) {
      setDomainStatus('idle');
      setDomainMessage('');
      onInstitutionMatched?.(null);
    }
  };

  const iconStart = (Icon) => (
    <InputAdornment position="start">
      <Icon fontSize="small" sx={{ color: 'text.disabled' }} />
    </InputAdornment>
  );

  const monoSx = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.8125rem' };

  const selectPlaceholder = (text) => (
    <Box component="span" sx={{ color: 'text.secondary', opacity: 0.7 }}>{text}</Box>
  );

  if (accountType === 'RESEARCH_ADMIN') {
    const statusAdornment =
      domainStatus === 'checking' ? <CircularProgress size={16} />
      : domainStatus === 'valid' ? <CheckCircleIcon color="success" fontSize="small" />
      : domainStatus === 'invalid' ? <CancelIcon color="error" fontSize="small" />
      : null;

    return (
      <Box>
        <StepHeader
          title={t('auth.research_admin_account_details_title', 'Institutional Account Details')}
          subtitle={t('auth.research_admin_account_details_subtitle', 'Provide your institutional account name and verified email address.')}
        />

        <Alert severity="info" variant="outlined" sx={{ mb: 2.5, borderRadius: 1.5, py: 0.25, fontSize: '0.8125rem' }}>
          {t('auth.research_admin_email_alert', 'Use your institutional email address. Your institution will be detected automatically from your email domain.')}
        </Alert>

        <Box sx={{ maxWidth: 560 }}>
          <SectionLabel>{t('auth.institutional_account_information', 'Institutional Account Information')}</SectionLabel>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Field label={t('auth.account_name', 'Account Name')} htmlFor="reg-account-name">
              <TextField
                id="reg-account-name"
                fullWidth
                name="accountName"
                value={researchAdminAccountName}
                disabled
                error={!!errors.accountName}
                helperText={errors.accountName || t('auth.account_name_helper', 'The display name for this institutional administrator account')}
                InputProps={{ readOnly: true, startAdornment: iconStart(BadgeIcon) }}
              />
            </Field>

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
                    onInstitutionMatched?.(null);
                  }
                  onInputChange(e);
                }}
                onBlur={(e) => verifyEmailDomain(e.target.value)}
                error={(!!errors.email && domainStatus !== 'valid') || domainStatus === 'invalid'}
                helperText={
                  (domainStatus === 'valid' && domainMessage) ||
                  (domainStatus !== 'valid' && errors.email) ||
                  domainMessage ||
                  t('auth.institutional_email_helper')
                }
                placeholder={t('auth.institutional_email_placeholder')}
                InputProps={{
                  readOnly: emailLocked,
                  startAdornment: iconStart(EmailIcon),
                  endAdornment: statusAdornment ? <InputAdornment position="end">{statusAdornment}</InputAdornment> : null,
                }}
              />
            </Field>

            {domainStatus === 'valid' && (formData.primaryInstitution || domainMessage) && (
              <Box
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5, p: 2, borderRadius: 1.5,
                  border: '1px solid', borderColor: 'success.main',
                  bgcolor: alpha(theme.palette.success.main, 0.06),
                }}
              >
                <BusinessIcon sx={{ color: 'success.main' }} />
                <Box>
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {t('auth.institution_detected_label', 'Institution detected')}
                  </Typography>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                    {formData.primaryInstitution || domainMessage}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    );
  }

  if (accountType === 'RESEARCHER') {
    return (
      <Box>
        <StepHeader title={t('auth.account_details_title')} subtitle={t('auth.account_details_subtitle')} />

        {formData.orcidId && (
          <Box
            sx={{
              display: 'flex', alignItems: 'center', gap: 1.5, p: 1.25, px: 1.75, mb: 3, borderRadius: 1.5,
              border: `1px solid ${alpha('#A6CE39', 0.5)}`,
              bgcolor: alpha('#A6CE39', 0.07),
            }}
          >
            <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#A6CE39', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
              iD
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 600 }}>
                {t('auth.orcid_linked', 'ORCID iD linked')}
              </Typography>
              <Typography sx={{ ...monoSx, fontWeight: 600, color: 'text.primary' }}>{formData.orcidId}</Typography>
            </Box>
            <Chip
              icon={<CheckCircleIcon />}
              label={t('auth.verified')}
              size="small"
              color="success"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          </Box>
        )}

        <SectionLabel>{t('auth.personal_information')}</SectionLabel>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
          <FieldRow>
            <Field label={t('auth.given_name')} htmlFor="reg-given" required>
              <TextField
                id="reg-given"
                fullWidth
                name="givenName"
                autoComplete="given-name"
                value={formData.givenName || ''}
                onChange={onInputChange}
                error={!!errors.givenName}
                helperText={errors.givenName}
              />
            </Field>
            <Field label={t('auth.family_name')} htmlFor="reg-family" required>
              <TextField
                id="reg-family"
                fullWidth
                name="familyName"
                autoComplete="family-name"
                value={formData.familyName || ''}
                onChange={onInputChange}
                error={!!errors.familyName}
                helperText={errors.familyName}
              />
            </Field>
          </FieldRow>

          <Field label={t('auth.email_address')} htmlFor="reg-email" required>
            <TextField
              id="reg-email"
              fullWidth
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email || ''}
              onChange={onInputChange}
              error={!!errors.email}
              placeholder={t('auth.email_placeholder', 'name@institution.org')}
              helperText={
                errors.email ||
                (emailLocked
                  ? t('manuscript_invite.register_email_locked', 'This email is set from your collaboration invitation.')
                  : t('auth.email_helper', 'We’ll send an activation link to this address.'))
              }
              InputProps={{ readOnly: emailLocked, startAdornment: iconStart(EmailIcon) }}
            />
          </Field>

          {!formData.orcidId && (
            <Field label={t('auth.orcid_id')} htmlFor="reg-orcid">
              <TextField
                id="reg-orcid"
                fullWidth
                name="orcidId"
                value={formData.orcidId || ''}
                onChange={onInputChange}
                placeholder="0000-0000-0000-0000"
                InputProps={{ startAdornment: iconStart(BadgeIcon), sx: monoSx }}
              />
            </Field>
          )}
        </Box>

        <SectionLabel>{t('auth.primary_affiliation')}</SectionLabel>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Field label={t('auth.primary_institution')} htmlFor="reg-institution" required>
            <TextField
              id="reg-institution"
              fullWidth
              name="primaryInstitution"
              autoComplete="organization"
              value={formData.primaryInstitution || ''}
              onChange={onInputChange}
              error={!!errors.primaryInstitution}
              helperText={errors.primaryInstitution}
              placeholder={t('auth.institution_placeholder', 'e.g. University of Nairobi')}
              InputProps={{ startAdornment: iconStart(BusinessIcon) }}
            />
          </Field>

          <FieldRow>
            <Field label={t('auth.start_month')} htmlFor="reg-start-month" required>
              <FormControl fullWidth error={!!errors.startMonth}>
                <Select
                  id="reg-start-month"
                  name="startMonth"
                  value={formData.startMonth || ''}
                  onChange={onInputChange}
                  displayEmpty
                  renderValue={(v) => (v ? monthOptions.find((m) => m.value === v)?.label : selectPlaceholder(t('auth.select_month', 'Select month')))}
                  MenuProps={{ PaperProps: { style: { maxHeight: 280 } }, disableScrollLock: true }}
                >
                  {monthOptions.map((month) => (
                    <MenuItem key={month.value} value={month.value}>{month.label}</MenuItem>
                  ))}
                </Select>
                {errors.startMonth && <FormHelperText sx={{ mx: 0 }}>{errors.startMonth}</FormHelperText>}
              </FormControl>
            </Field>
            <Field label={t('auth.start_year')} htmlFor="reg-start-year" required>
              <FormControl fullWidth error={!!errors.startYear}>
                <Select
                  id="reg-start-year"
                  name="startYear"
                  value={formData.startYear || ''}
                  onChange={onInputChange}
                  displayEmpty
                  renderValue={(v) => (v ? v : selectPlaceholder(t('auth.select_year', 'Select year')))}
                  MenuProps={{ PaperProps: { style: { maxHeight: 280 } }, disableScrollLock: true }}
                >
                  {yearOptions.map((year) => (
                    <MenuItem key={year.value} value={year.value}>{year.label}</MenuItem>
                  ))}
                </Select>
                {errors.startYear && <FormHelperText sx={{ mx: 0 }}>{errors.startYear}</FormHelperText>}
              </FormControl>
            </Field>
          </FieldRow>
        </Box>
      </Box>
    );
  }

  return null;
};

export default AccountDetailsStep; 