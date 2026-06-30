'use client';

import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';

const PasswordStep = ({ formData, onInputChange, errors }) => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const password = formData.password || '';
  const confirmPassword = formData.confirmPassword || '';
  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const passwordsDontMatch = password && confirmPassword && password !== confirmPassword;

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600}}>
        {t('common.reg_create_password')}
      </Typography>
      
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
            error={!!errors.confirmPassword || passwordsDontMatch}
            helperText={errors.confirmPassword}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: passwordsMatch ? '#4caf50' : passwordsDontMatch ? '#f44336' : undefined,
                  borderWidth: (passwordsMatch || passwordsDontMatch) ? '2px' : '1px',
                },
                '&:hover fieldset': {
                  borderColor: passwordsMatch ? '#4caf50' : passwordsDontMatch ? '#f44336' : undefined,
                },
                '&.Mui-focused fieldset': {
                  borderColor: passwordsMatch ? '#4caf50' : passwordsDontMatch ? '#f44336' : undefined,
                },
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {passwordsMatch && (
                    <CheckCircle sx={{ color: '#4caf50', mr: 1 }} />
                  )}
                  {passwordsDontMatch && (
                    <Cancel sx={{ color: '#f44336', mr: 1 }} />
                  )}
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
  );
};

export default PasswordStep;