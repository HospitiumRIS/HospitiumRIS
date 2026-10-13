'use client';

import { useTranslation } from 'react-i18next';
import React from 'react';
import { Box } from '@mui/material';
import { StepHeader, PasswordFields } from './FormKit';

const PasswordStep = ({ formData, onInputChange, errors }) => {
  const { t } = useTranslation();

  return (
    <Box>
      <StepHeader
        title={t('common.reg_create_password')}
        subtitle={t('auth.password_step_subtitle', 'Choose a password you don’t use anywhere else. You’ll use it with your email to sign in.')}
      />
      <Box sx={{ maxWidth: 520 }}>
        <PasswordFields formData={formData} onInputChange={onInputChange} errors={errors} />
      </Box>
    </Box>
  );
};

export default PasswordStep;
