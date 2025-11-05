'use client';

import React, { useState, useEffect, Suspense } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Alert,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Login as LoginIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useThemeMode } from '../../components/ThemeProvider';

// Loading component for Suspense fallback
const ActivatePageLoading = () => {
  const theme = useTheme();
  const { isDarkMode } = useThemeMode();
  
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        py: 3,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            backgroundColor: '#ffffff',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Image
              src={isDarkMode ? "/hospitium-logo-dark.png" : "/hospitium-logo.png"}
              alt="Hospitium RIS"
              width={140}
              height={32}
              priority
            />
          </Box>
          <CircularProgress 
            size={32} 
            sx={{ color: theme.palette.primary.main, mb: 2 }} 
          />
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            Loading...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please wait while we prepare your activation page...
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

const ActivatePageContent = () => {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDarkMode } = useThemeMode();
  
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const activateAccount = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setError('Invalid activation link.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/activate?token=${token}`);
        const data = await response.json();

        if (data.success) {
          setSuccess(true);
        } else {
          setError(data.message || 'Activation failed. Please try again.');
        }
      } catch (error) {
        setError('Network error. Please try again.');
      }

      setLoading(false);
    };

    activateAccount();
  }, [searchParams]);

  const handleLoginClick = () => {
    router.push('/login');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        py: 3,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            backgroundColor: '#ffffff',
            border: '1px solid rgba(0,0,0,0.1)',
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

          {/* Loading State */}
          {loading && (
            <Box>
              <CircularProgress 
                size={32} 
                sx={{ color: theme.palette.primary.main, mb: 2 }} 
              />
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                Activating Account
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please wait while we verify your account...
              </Typography>
            </Box>
          )}

          {/* Success State */}
          {success && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
                <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: 28 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
                  Account Activated
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ mb: 3, color: theme.palette.text.secondary }}>
                Your account is now active and ready to use
              </Typography>
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  Welcome to Hospitium RIS! You can now access all features.
                </Typography>
              </Alert>
              <Button
                variant="contained"
                onClick={handleLoginClick}
                startIcon={<LoginIcon />}
                sx={{ px: 3, py: 1 }}
              >
                Continue to Login
              </Button>
            </Box>
          )}

          {/* Error State */}
          {error && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
                <ErrorIcon sx={{ color: theme.palette.error.main, fontSize: 28 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.error.main }}>
                  Activation Failed
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ mb: 3, color: theme.palette.text.secondary }}>
                We couldn't activate your account
              </Typography>
              <Alert severity="error" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  {error}
                </Typography>
              </Alert>
              <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  onClick={() => router.push('/resend-activation')}
                  startIcon={<RefreshIcon />}
                  size="small"
                >
                  Get New Link
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => router.push('/login')}
                  startIcon={<LoginIcon />}
                  size="small"
                >
                  Try Login
                </Button>
              </Box>
            </Box>
          )}

          {/* Footer */}
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', mt: 3, display: 'block' }}>
            Hospitium RIS - Research Information System
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

// Main component with Suspense boundary
const ActivatePage = () => {
  return (
    <Suspense fallback={<ActivatePageLoading />}>
      <ActivatePageContent />
    </Suspense>
  );
};

export default ActivatePage;
