'use client';

import React, { useEffect, useState, Suspense } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Alert,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Login as LoginIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useThemeMode } from '../../../components/ThemeProvider';

const RegisterSuccessContent = () => {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDarkMode } = useThemeMode();
  
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const email = searchParams.get('email');
    if (email) {
      setUserEmail(decodeURIComponent(email));
    }
  }, [searchParams]);

  const handleLoginClick = () => {
    router.push('/login');
  };

  const handleResendEmail = () => {
    router.push('/resend-activation');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.palette.background.default,
        py: 3,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.mode === 'dark' ? '#404040' : 'rgba(0,0,0,0.1)'}`,
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          {/* Logo */}
          <Box sx={{ mb: 3 }}>
            <Image
              src={isDarkMode ? "/hospitium-logo-dark.png" : "/hospitium-logo.png"}
              alt="Hospitium RIS"
              width={140}
              height={32}
              priority
            />
          </Box>

          {/* Success Status */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
            <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
              Registration Complete
            </Typography>
          </Box>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Your account has been created successfully
          </Typography>

          {/* Email Status */}
          <Alert 
            severity="info" 
            sx={{ 
              mb: 3, 
              textAlign: 'left',
              '& .MuiAlert-message': { width: '100%' }
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2" fontWeight={600}>
                Activation email sent to:
              </Typography>
              <Chip 
                label={userEmail} 
                size="small" 
                variant="outlined"
                sx={{ alignSelf: 'flex-start', maxWidth: '100%' }}
              />
            </Box>
          </Alert>

          {/* Next Steps - Compact */}
          <Box sx={{ 
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
            borderRadius: 1,
            p: 2,
            mb: 3,
            textAlign: 'left'
          }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Next Steps:
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
              1. Check your email inbox<br />
              2. Click the activation link<br />
              3. Login to your account
            </Typography>
          </Box>

          {/* Compact Actions */}
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', mb: 2 }}>
            <Button
              variant="contained"
              onClick={handleLoginClick}
              startIcon={<LoginIcon />}
              size="small"
            >
              Login
            </Button>
            <Button
              variant="outlined"
              onClick={handleResendEmail}
              startIcon={<RefreshIcon />}
              size="small"
            >
              Resend Email
            </Button>
          </Box>

          {/* Footer Note */}
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
            Activation link expires in 24 hours • Check spam folder if email not received
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

const LoadingFallback = () => {
  const theme = useTheme();
  const { isDarkMode } = useThemeMode();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.palette.background.default,
        py: 3,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.mode === 'dark' ? '#404040' : 'rgba(0,0,0,0.1)'}`,
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          {/* Logo */}
          <Box sx={{ mb: 3 }}>
            <Image
              src={isDarkMode ? "/hospitium-logo-dark.png" : "/hospitium-logo.png"}
              alt="Hospitium RIS"
              width={140}
              height={32}
              priority
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <CircularProgress size={24} />
            <Typography variant="body1" color="text.secondary">
              Loading...
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

const RegisterSuccessPage = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RegisterSuccessContent />
    </Suspense>
  );
};

export default RegisterSuccessPage;
