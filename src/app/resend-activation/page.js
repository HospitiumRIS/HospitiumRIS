'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Card,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Link,
  useTheme,
  alpha
} from '@mui/material';
import {
  Email as EmailIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const ResendActivationPage = () => {
  const theme = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success', 'error', 'info'
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage('Please enter your email address');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/auth/resend-activation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message);
        setMessageType('success');
        setEmailSent(true);
      } else {
        setMessage(data.message);
        setMessageType('error');
        
        // If account is already activated, redirect to login
        if (data.redirect === '/login') {
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Resend activation error:', error);
      setMessage('Network error. Please check your connection and try again.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push('/login');
  };

  const handleBackToRegister = () => {
    router.push('/register');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
          : 'linear-gradient(135deg,rgb(255, 255, 255) 0%,rgb(249, 248, 250) 50%,rgb(255, 255, 255) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Card
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 4,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 20px 20px rgba(0,0,0,0.6)'
              : '0 20px 20px rgba(0, 0, 0, 0.2)',
            background: theme.palette.background.paper,
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ mb: 2 }}>
              <Image
                src="/hospitium-logo.png"
                alt="Hospitium RIS"
                width={180}
                height={40}
                style={{ objectFit: 'contain' }}
                priority
              />
            </Box>
            
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
                mb: 1,
              }}
            >
              Resend Activation Email
            </Typography>
            
            <Typography
              variant="body1"
              sx={{
                color: theme.palette.text.secondary,
                lineHeight: 1.6,
              }}
            >
              {emailSent 
                ? "We've sent you a new activation email"
                : "Didn't receive your activation email? We'll send you a new one"
              }
            </Typography>
          </Box>

          {/* Form */}
          {!emailSent && (
            <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#8b6cbc',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#8b6cbc',
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <EmailIcon 
                      sx={{ 
                        color: alpha(theme.palette.text.secondary, 0.6),
                        fontSize: 20,
                        mr: 1,
                      }} 
                    />
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading || !email.trim()}
                sx={{
                  py: 1.5,
                mb: 3,
                fontSize: '1rem',
                fontWeight: 600,
                backgroundColor: '#8b6cbc'
                }}
                startIcon={
                  isLoading ? (
                    <CircularProgress size={20} sx={{ color: 'white' }} />
                  ) : (
                    <SendIcon />
                  )
                }
              >
                {isLoading ? 'Sending...' : 'Send Activation Email'}
              </Button>
            </Box>
          )}

          {/* Success State */}
          {emailSent && (
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <CheckCircleIcon
                sx={{
                  fontSize: 80,
                  color: theme.palette.success.main,
                  mb: 2,
                }}
              />
              <Typography variant="h6" sx={{ mb: 2, color: theme.palette.text.primary }}>
                Email Sent Successfully!
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 3 }}>
                Please check your email inbox and spam folder for the activation link.
              </Typography>
            </Box>
          )}

          {/* Message Display */}
          {message && (
            <Alert 
              severity={messageType} 
              sx={{ 
                mb: 3,
                '& .MuiAlert-message': {
                  lineHeight: 1.6,
                }
              }}
            >
              {message}
            </Alert>
          )}

          {/* Navigation Links */}
          <Box sx={{ textAlign: 'center', space: 2 }}>
            <Box sx={{ mb: 2 }}>
              <Button
                variant="text"
                onClick={handleBackToLogin}
                startIcon={<ArrowBackIcon />}
                sx={{
                  color: '#8b6cbc',
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: alpha('#8b6cbc', 0.1),
                  },
                }}
              >
                Back to Login
              </Button>
            </Box>
            
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Don't have an account?{' '}
              <Link
                component="button"
                variant="body2"
                onClick={handleBackToRegister}
                sx={{
                  color: '#8b6cbc',
                  fontWeight: 600,
                  textDecoration: 'none',
                  cursor: 'pointer',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Register here
              </Link>
            </Typography>
          </Box>

        
        </Card>
      </Container>
    </Box>
  );
};

export default ResendActivationPage;
