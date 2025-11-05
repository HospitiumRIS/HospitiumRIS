import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  AccountBalance as FoundationIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const AccountTypeStep = ({ accountType, onAccountTypeChange, errors }) => {
  const theme = useTheme();

  const accountTypeOptions = [
    {
      value: 'RESEARCHER',
      label: 'Researcher',
      description: 'Individual researcher or academic',
      icon: <PersonIcon sx={{ fontSize: 32 }} />,
    },
    {
      value: 'RESEARCH_ADMIN',
      label: 'Research Administrator',
      description: 'Manage institutional research activities',
      icon: <BusinessIcon sx={{ fontSize: 32 }} />,
    },
    {
      value: 'FOUNDATION_ADMIN',
      label: 'Foundation Administrator',
      description: 'Manage foundation research programs',
      icon: <FoundationIcon sx={{ fontSize: 32 }} />,
    },
  ];

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, textAlign: 'center' }}>
        Choose Your Account Type
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
        Select the type of account that best describes your role
      </Typography>
      
      <Grid container spacing={2}>
        {accountTypeOptions.map((option) => (
          <Grid size={{ xs: 12, md: 4 }} key={option.value}>
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
              onClick={() => onAccountTypeChange(null, option.value)}
            >
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Box sx={{ color: theme.palette.primary.main, mb: 1 }}>
                  {option.icon}
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {option.label}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                  {option.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {errors?.accountType && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errors.accountType}
        </Alert>
      )}
    </Box>
  );
};

export default AccountTypeStep; 