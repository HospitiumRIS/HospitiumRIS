'use client';

import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Chip,
  Alert,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  Badge as BadgeIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';

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

  const fieldStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      backgroundColor: theme.palette.mode === 'dark' 
        ? alpha(theme.palette.background.paper, 0.7)
        : alpha(theme.palette.primary.main, 0.02),
      border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        backgroundColor: theme.palette.mode === 'dark' 
          ? alpha(theme.palette.background.paper, 0.9)
          : alpha(theme.palette.primary.main, 0.04),
        borderColor: alpha(theme.palette.primary.main, 0.3),
        transform: 'translateY(-1px)',
        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
      },
      '&.Mui-focused': {
        backgroundColor: theme.palette.background.paper,
        borderColor: theme.palette.primary.main,
        borderWidth: '2px',
        boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.12)}`,
        transform: 'translateY(-2px)',
      },
      '&.Mui-error': {
        borderColor: theme.palette.error.main,
        '&:hover': {
          borderColor: theme.palette.error.dark,
        },
      },
    },
    '& .MuiInputLabel-root': {
      fontWeight: 500,
      color: theme.palette.text.secondary,
      '&.Mui-focused': {
        color: theme.palette.primary.main,
        fontWeight: 600,
      },
    },
  };

  const orcidFieldStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      backgroundColor: formData.orcidId 
        ? (theme.palette.mode === 'dark' 
          ? alpha(theme.palette.success.main, 0.15)
          : alpha(theme.palette.success.main, 0.08))
        : (theme.palette.mode === 'dark' 
          ? alpha(theme.palette.background.paper, 0.7)
          : alpha(theme.palette.primary.main, 0.02)),
      border: formData.orcidId 
        ? `2px solid ${alpha(theme.palette.success.main, 0.4)}`
        : `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        backgroundColor: formData.orcidId 
          ? (theme.palette.mode === 'dark' 
            ? alpha(theme.palette.success.main, 0.2)
            : alpha(theme.palette.success.main, 0.12))
          : (theme.palette.mode === 'dark' 
            ? alpha(theme.palette.background.paper, 0.9)
            : alpha(theme.palette.primary.main, 0.04)),
        borderColor: formData.orcidId 
          ? alpha(theme.palette.success.main, 0.6)
          : alpha(theme.palette.primary.main, 0.3),
        transform: 'translateY(-1px)',
        boxShadow: formData.orcidId
          ? `0 4px 12px ${alpha(theme.palette.success.main, 0.25)}`
          : `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
      },
      '&.Mui-focused': {
        backgroundColor: theme.palette.background.paper,
        borderColor: formData.orcidId 
          ? theme.palette.success.main
          : theme.palette.primary.main,
        borderWidth: '2px',
        boxShadow: formData.orcidId 
          ? `0 0 0 4px ${alpha(theme.palette.success.main, 0.12)}`
          : `0 0 0 4px ${alpha(theme.palette.primary.main, 0.12)}`,
        transform: 'translateY(-2px)',
      },
    },
    '& .MuiInputBase-input': {
      fontWeight: formData.orcidId ? 600 : 400,
      fontFamily: formData.orcidId ? 'monospace' : 'inherit',
    },
    '& .MuiInputLabel-root': {
      fontWeight: 500,
      color: formData.orcidId 
        ? theme.palette.success.main
        : theme.palette.text.secondary,
      '&.Mui-focused': {
        color: formData.orcidId 
          ? theme.palette.success.main
          : theme.palette.primary.main,
        fontWeight: 600,
      },
    },
  };

  const SectionHeader = ({ icon, title, subtitle }) => (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1.5,
      mb: 2,
      p: 2,
      borderRadius: 2,
      backgroundColor: alpha(theme.palette.primary.main, 0.04),
      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
    }}>
      <Box sx={{ 
        p: 1,
        borderRadius: 1.5,
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        color: theme.palette.primary.main,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="h6" sx={{ 
          fontSize: '1.1rem', 
          fontWeight: 600,
          color: theme.palette.text.primary,
          mb: 0.5,
        }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ 
          fontSize: '0.85rem',
          color: theme.palette.text.secondary,
          fontWeight: 400,
        }}>
          {subtitle}
        </Typography>
      </Box>
    </Box>
  );

  if (accountType === 'RESEARCH_ADMIN') {
    return (
      <Box sx={{ width: '100%', mt: 1 }}>
        <SectionHeader
          icon={<BusinessIcon />}
          title={t('auth.research_admin_account_details_title', 'Institutional Account Details')}
          subtitle={t('auth.research_admin_account_details_subtitle', 'Provide your institutional account name and verified email address.')}
        />

        <Alert severity="info" sx={{ mt: 2 }}>
          {t('auth.research_admin_email_alert', 'Use your institutional email address. Your institution will be detected automatically from your email domain.')}
        </Alert>

        <Grid container spacing={3} sx={{ mt: 2, flexDirection: 'column' }}>
          <Grid size={12}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 2,
            }}>
              <BusinessIcon sx={{
                color: theme.palette.primary.main,
                fontSize: 20,
              }} />
              <Typography variant="subtitle1" sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
              }}>
                {t('auth.institutional_account_information', 'Institutional Account Information')}
              </Typography>
            </Box>
          </Grid>

          <Grid size={12}>
            <TextField
              fullWidth
              label={t('auth.account_name', 'Account Name')}
              name="accountName"
              value={researchAdminAccountName}
              disabled
              error={!!errors.accountName}
              helperText={errors.accountName || t('auth.account_name_helper', 'The display name for this institutional administrator account')}
              size="small"
              sx={fieldStyle}
              InputProps={{
                readOnly: true,
                startAdornment: (
                  <BadgeIcon sx={{
                    color: alpha(theme.palette.text.secondary, 0.6),
                    fontSize: 18,
                    mr: 1,
                  }} />
                ),
              }}
            />
          </Grid>

          <Grid size={12}>
            <TextField
              fullWidth
              label={t('auth.institutional_email')}
              name="email"
              type="email"
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
              size="small"
              placeholder={t('auth.institutional_email_placeholder')}
              sx={fieldStyle}
              InputProps={{
                readOnly: emailLocked,
                startAdornment: (
                  <EmailIcon sx={{
                    color: alpha(theme.palette.text.secondary, 0.6),
                    fontSize: 18,
                    mr: 1,
                  }} />
                ),
                endAdornment: domainStatus === 'checking' ? (
                  <InputAdornment position="end">
                    <CircularProgress size={18} />
                  </InputAdornment>
                ) : domainStatus === 'valid' ? (
                  <InputAdornment position="end">
                    <CheckCircleIcon color="success" fontSize="small" />
                  </InputAdornment>
                ) : domainStatus === 'invalid' ? (
                  <InputAdornment position="end">
                    <CancelIcon color="error" fontSize="small" />
                  </InputAdornment>
                ) : null,
              }}
            />
          </Grid>

          {domainStatus === 'valid' && (formData.primaryInstitution || domainMessage) && (
            <Grid size={12}>
              <Alert severity="success" icon={<BusinessIcon fontSize="inherit" />}>
                {formData.primaryInstitution
                  ? t('auth.institution_detected', {
                      name: formData.primaryInstitution,
                      defaultValue: `Institution: ${formData.primaryInstitution}`,
                    })
                  : domainMessage}
              </Alert>
            </Grid>
          )}
        </Grid>
      </Box>
    );
  }

  if (accountType === 'RESEARCHER') {
    return (
      <Box sx={{ width: '100%', mt: 1 }}>
        <SectionHeader 
          icon={<PersonIcon />}
          title={t('auth.account_details_title')}
          subtitle={t('auth.account_details_subtitle')}
        />
        
        <Grid container spacing={3} sx={{ mt: 2, flexDirection: 'column' }}>
          {/* Personal Information Section */}
          <Grid size={12}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              mb: 2,
            }}>
              <PersonIcon sx={{ 
                color: theme.palette.primary.main, 
                fontSize: 20 
              }} />
              <Typography variant="subtitle1" sx={{ 
                fontWeight: 600,
                color: theme.palette.text.primary,
              }}>
                {t('auth.personal_information')}
              </Typography>
            </Box>
          </Grid>

          {/* Given Name and Family Name - Same Row 50% Each */}
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>

        <Box sx={{ width: '50%' }}>
            <TextField
              fullWidth
              label={t('auth.given_name')}
              name="givenName"
              value={formData.givenName || ''}
              onChange={onInputChange}
              error={!!errors.givenName}
              helperText={errors.givenName}
              size="small"
              sx={fieldStyle}
              InputProps={{
                startAdornment: (
                  <PersonIcon sx={{ 
                    color: alpha(theme.palette.text.secondary, 0.6),
                    fontSize: 18,
                    mr: 1,
                  }} />
                ),
              }}
            />
          </Box>
          <Box sx={{ width: '50%' }}>
            <TextField
              fullWidth
              label={t('auth.family_name')}
              name="familyName"
              value={formData.familyName || ''}
              onChange={onInputChange}
              error={!!errors.familyName}
              helperText={errors.familyName}
              size="small"
              sx={fieldStyle}
              InputProps={{
                startAdornment: (
                  <PersonIcon sx={{ 
                    color: alpha(theme.palette.text.secondary, 0.6),
                    fontSize: 18,
                    mr: 1,
                  }} />
                ),
              }}
            />
          </Box>
        </Box>



          {/* Email - Full Width */}
          <Grid size={12}>
            <TextField
              fullWidth
              label={t('auth.email_address')}
              name="email"
              type="email"
              value={formData.email || ''}
              onChange={onInputChange}
              error={!!errors.email}
              helperText={
                errors.email ||
                (emailLocked ? t('manuscript_invite.register_email_locked', 'This email is set from your collaboration invitation.') : undefined)
              }
              size="small"
              sx={fieldStyle}
              InputProps={{
                readOnly: emailLocked,
                startAdornment: (
                  <EmailIcon sx={{ 
                    color: alpha(theme.palette.text.secondary, 0.6),
                    fontSize: 18,
                    mr: 1,
                  }} />
                ),
              }}
            />
          </Grid>

          {/* ORCID ID - Full Width */}
          <Grid size={12}>
            <Box sx={{ position: 'relative' }}>
              <TextField
                fullWidth
                label={t('auth.orcid_id')}
                name="orcidId"
                value={formData.orcidId || ''}
                onChange={onInputChange}
                size="small"
                InputProps={{
                  readOnly: !!formData.orcidId,
                  startAdornment: (
                    <BadgeIcon sx={{ 
                      color: formData.orcidId 
                        ? theme.palette.success.main
                        : alpha(theme.palette.text.secondary, 0.6),
                      fontSize: 18,
                      mr: 1,
                    }} />
                  ),
                }}
                sx={orcidFieldStyle}
              />
              {formData.orcidId && (
                <Chip
                  label={t('auth.verified')}
                  size="small"
                  color="success"
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: -8,
                    fontSize: '0.7rem',
                    height: 20,
                    fontWeight: 600,
                  }}
                />
              )}
            </Box>
          </Grid>

          <>
              {/* Divider */}
              <Grid size={12}>
                <Divider sx={{ 
                  my: 1,
                  borderColor: alpha(theme.palette.primary.main, 0.1),
                }} />
              </Grid>

              {/* Primary Affiliation Section */}
              <Grid size={12}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  mb: 2,
                }}>
                  <BusinessIcon sx={{ 
                    color: theme.palette.primary.main, 
                    fontSize: 20 
                  }} />
                  <Typography variant="subtitle1" sx={{ 
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                  }}>
                    {t('auth.primary_affiliation')}
                  </Typography>
                </Box>
              </Grid>

              {/* Primary Institution - Full Width */}
              <Box sx={{ width: '100%' }}>
                <TextField
                  fullWidth
                  label={t('auth.primary_institution')}
                  name="primaryInstitution"
                  value={formData.primaryInstitution || ''}
                  onChange={onInputChange}
                  error={!!errors.primaryInstitution}
                  helperText={errors.primaryInstitution}
                  size="small"
                  sx={fieldStyle}
                  InputProps={{
                    startAdornment: (
                      <BusinessIcon sx={{ 
                        color: alpha(theme.palette.text.secondary, 0.6),
                        fontSize: 18,
                        mr: 1,
                      }} />
                    ),
                  }}
                />
              </Box>

              {/* Start Month and Start Year - Same Row 50% Each */}
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
                <Box sx={{ width: '50%' }}>
                  <FormControl 
                    fullWidth 
                    error={!!errors.startMonth} 
                    size="small"
                    sx={fieldStyle}
                  >
                    <InputLabel>{t('auth.start_month')}</InputLabel>
                    <Select
                      name="startMonth"
                      value={formData.startMonth || ''}
                      onChange={onInputChange}
                      label={t('auth.start_month')}
                      MenuProps={{
                        PaperProps: { style: { maxHeight: 200, marginTop: 4 } },
                        disableScrollLock: true,
                      }}
                    >
                      {monthOptions.map((month) => (
                        <MenuItem key={month.value} value={month.value}>
                          {month.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.startMonth && (
                      <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5, display: 'block' }}>
                        {errors.startMonth}
                      </Typography>
                    )}
                  </FormControl>
                </Box>
                <Box sx={{ width: '50%' }}>
                  <FormControl 
                    fullWidth 
                    error={!!errors.startYear} 
                    size="small"
                    sx={fieldStyle}
                  >
                    <InputLabel>{t('auth.start_year')}</InputLabel>
                    <Select
                      name="startYear"
                      value={formData.startYear || ''}
                      onChange={onInputChange}
                      label={t('auth.start_year')}
                      MenuProps={{
                        PaperProps: { style: { maxHeight: 200, marginTop: 4 } },
                        disableScrollLock: true,
                      }}
                    >
                      {yearOptions.map((year) => (
                        <MenuItem key={year.value} value={year.value}>
                          {year.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.startYear && (
                      <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5, display: 'block' }}>
                        {errors.startYear}
                      </Typography>
                    )}
                  </FormControl>
                </Box>
              </Box>
            </>
        </Grid>
      </Box>
    );
  }

  return null;
};

export default AccountDetailsStep; 