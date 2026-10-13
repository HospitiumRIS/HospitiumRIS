'use client';

import { useTranslation } from 'react-i18next';
import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  Radio,
  RadioGroup,
  FormControlLabel,
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  AccountBalance as FoundationIcon,
  Settings as OperationsIcon,
} from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';
import { StepHeader } from './FormKit';

const AccountTypeStep = ({ accountType, onAccountTypeChange, errors, onNext }) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();

  const accountTypeOptions = React.useMemo(() => [
    {
      value: 'RESEARCHER',
      label: t('common.researcher'),
      description: t('auth.account_type_researcher_desc'),
      icon: <PersonIcon sx={{ fontSize: 24 }} />,
    },
    {
      value: 'RESEARCH_ADMIN',
      label: t('auth.account_type_research_admin'),
      description: t('auth.account_type_research_admin_desc'),
      icon: <BusinessIcon sx={{ fontSize: 24 }} />,
    },
    {
      value: 'FOUNDATION_ADMIN',
      label: t('common.foundation_admin'),
      description: t('auth.account_type_foundation_admin_desc'),
      icon: <FoundationIcon sx={{ fontSize: 24 }} />,
    },
    {
      value: 'OPERATIONS',
      label: t('auth.account_type_operations'),
      description: t('auth.account_type_operations_desc'),
      icon: <OperationsIcon sx={{ fontSize: 24 }} />,
    },
  ], [t, i18n.language]);

  const handleAccountTypeSelect = (value) => {
    onAccountTypeChange(null, value);
  };

  

  return (
    <Box>
      <StepHeader title={t('auth.account_type_title')} subtitle={t('auth.account_type_subtitle')} />

      <RadioGroup value={accountType} onChange={(e) => handleAccountTypeSelect(e.target.value)}>
        <Grid container spacing={1.25}>
          {accountTypeOptions.map((option) => {
            const selected = accountType === option.value;
            return (
              <Grid size={{ xs: 12 }} key={option.value}>
                <Card
                  elevation={0}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selected}
                  onClick={() => handleAccountTypeSelect(option.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleAccountTypeSelect(option.value);
                    }
                  }}
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    position: 'relative',
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: selected ? theme.palette.primary.main : theme.palette.divider,
                    bgcolor: selected ? alpha(theme.palette.primary.main, 0.06) : 'background.paper',
                    transition: 'border-color 0.15s, box-shadow 0.15s, background-color 0.15s',
                    boxShadow: selected ? `0 0 0 3px ${alpha(theme.palette.primary.main, 0.12)}` : 'none',
                    '&:hover': { borderColor: selected ? theme.palette.primary.main : theme.palette.text.disabled },
                    '&:focus-visible': {
                      outline: 'none',
                      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.25)}`,
                    },
                  }}
                >
                  <CardContent sx={{ p: 1.75, '&:last-child': { pb: 1.75 }, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 1.5,
                        flexShrink: 0,
                        display: 'grid',
                        placeItems: 'center',
                        color: selected ? '#fff' : theme.palette.primary.main,
                        bgcolor: selected ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.1),
                        transition: 'background-color 0.15s, color 0.15s',
                        '& .MuiSvgIcon-root': { fontSize: 20 },
                      }}
                    >
                      {option.icon}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.35 }}>
                        {option.label}
                      </Typography>
                      <Typography color="text.secondary" sx={{ fontSize: '0.78rem', lineHeight: 1.4 }}>
                        {option.description}
                      </Typography>
                    </Box>
                    <Radio
                      value={option.value}
                      checked={selected}
                      size="small"
                      tabIndex={-1}
                      sx={{ p: 0.5, flexShrink: 0 }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </RadioGroup>

      {errors?.accountType && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errors.accountType}
        </Alert>
      )}
    </Box>
  );
};

export default AccountTypeStep;