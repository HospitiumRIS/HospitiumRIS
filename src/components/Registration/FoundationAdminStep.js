'use client';

import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  InputAdornment,
  Alert,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';

const FoundationAdminStep = ({ formData, onInputChange, errors, accountType }) => {
  const { t, i18n } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isFoundationAdmin = accountType === 'FOUNDATION_ADMIN';
  const title = isFoundationAdmin ? t('auth.foundation_admin_title') : t('auth.operations_title');
  const subtitle = isFoundationAdmin 
    ? t('auth.foundation_admin_subtitle')
    : t('auth.operations_subtitle');

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, textAlign: 'center' }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
        {subtitle}
      </Typography>

      {isFoundationAdmin && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {t('auth.foundation_admin_alert')}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Email Field */}
        <TextField
          fullWidth
          label={t('auth.institutional_email')}
          name="email"
          type="email"
          value={formData.email || ''}
          onChange={onInputChange}
          error={!!errors.email}
          helperText={errors.email || t('auth.institutional_email_helper')}
          size="small"
          placeholder={t('auth.institutional_email_placeholder')}
        />

        {/* Password Fields */}
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
          <Box sx={{ width: '100%' }}>
            <TextField
              fullWidth
              label={t('common.reg_password')}
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password || ''}
              onChange={onInputChange}
              error={!!errors.password}
              helperText={errors.password}
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <Box sx={{ width: '100%' }}>
            <TextField
              fullWidth
              label={t('common.reg_confirm_password')}
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword || ''}
              onChange={onInputChange}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      size="small"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default FoundationAdminStep;
