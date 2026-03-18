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
import { useTheme } from '@mui/material/styles';

const AccountTypeStep = ({ accountType, onAccountTypeChange, errors, onNext }) => {
  const theme = useTheme();

  const handleAccountTypeSelect = (value) => {
    onAccountTypeChange(null, value);
  };

  const accountTypeOptions = [
    {
      value: 'RESEARCHER',
      label: 'Researcher',
      description: 'Individual researcher or academic',
      icon: <PersonIcon sx={{ fontSize: 24 }} />,
    },
    {
      value: 'RESEARCH_ADMIN',
      label: 'Research Administrator',
      description: 'Manage institutional research activities',
      icon: <BusinessIcon sx={{ fontSize: 24 }} />,
    },
    {
      value: 'FOUNDATION_ADMIN',
      label: 'Foundation Administrator',
      description: 'Manage foundation research programs',
      icon: <FoundationIcon sx={{ fontSize: 24 }} />,
    },
    {
      value: 'OPERATIONS',
      label: 'Operations',
      description: 'Manage operational and administrative tasks',
      icon: <OperationsIcon sx={{ fontSize: 24 }} />,
    },
  ];

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, textAlign: 'center', fontSize: '1.1rem' }}>
        Choose Your Account Type
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center', fontSize: '0.8rem' }}>
        Select the type of account that best describes your role
      </Typography>
      
      <RadioGroup value={accountType} onChange={(e) => handleAccountTypeSelect(e.target.value)}>
        <Grid container spacing={1.5}>
          {accountTypeOptions.map((option) => (
            <Grid size={{ xs: 12 }} key={option.value}>
              <Card
                sx={{
                  cursor: 'pointer',
                  border: accountType === option.value ? 2 : 1,
                  borderColor: accountType === option.value 
                    ? theme.palette.primary.main 
                    : theme.palette.divider,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[4],
                  },
                }}
                onClick={() => handleAccountTypeSelect(option.value)}
              >
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, px: 2 }}>
                  <Radio
                    value={option.value}
                    checked={accountType === option.value}
                    sx={{ p: 0 }}
                  />
                  <Box sx={{ color: theme.palette.primary.main, flexShrink: 0 }}>
                    {option.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.25, fontSize: '0.95rem' }}>
                      {option.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                      {option.description}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
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