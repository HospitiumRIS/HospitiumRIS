'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  Divider,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Alert,
  Stack,
  Tooltip,
  FormHelperText,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Google as GoogleIcon,
  AccountCircle as OrcidIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useThemeMode } from '../../components/ThemeProvider';
import { useAuth } from '../../components/AuthProvider';

// Client-side activity logging helper
const logClientActivity = (action, data = {}) => {
  if (typeof window !== 'undefined') {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      page: 'login',
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...data
    };
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Client Activity Log:', logEntry);
    }
    
    // Could send to analytics service or store locally
    // For now, just console log for development
  }
};

// NoSSR wrapper component to prevent hydration mismatch
const NoSSR = ({ children, fallback = null }) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return fallback;
  }

  return children;
};

  const LoginPage = () => {
  const theme = useTheme();
  const router = useRouter();
  const { isDarkMode, isClient } = useThemeMode();
  const { login: authLogin } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  // Log page visit on component mount and restore remember me preference
  useEffect(() => {
    logClientActivity('login_page_visited');
    
    // Restore remember me preference from localStorage
    const savedRememberMe = localStorage.getItem('hospitium_remember_me');
    if (savedRememberMe === 'true') {
      setFormData(prev => ({ ...prev, rememberMe: true }));
      logClientActivity('remember_me_preference_restored');
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    const newValue = name === 'rememberMe' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Persist remember me preference
    if (name === 'rememberMe') {
      localStorage.setItem('hospitium_remember_me', checked.toString());
      logClientActivity('remember_me_preference_changed', { checked });
    }
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (generalError) {
      setGeneralError('');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    const isValid = Object.keys(newErrors).length === 0;
    
    // Log validation results
    if (!isValid) {
      logClientActivity('form_validation_failed', {
        errors: Object.keys(newErrors),
        hasEmail: !!formData.email,
        hasPassword: !!formData.password
      });
    } else {
      logClientActivity('form_validation_passed');
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setGeneralError('');
    setErrors({});
    
    // Log login attempt start
    logClientActivity('login_attempt_started', {
      email: formData.email.toLowerCase(),
      rememberMe: formData.rememberMe
    });
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.toLowerCase(),
          password: formData.password,
          rememberMe: formData.rememberMe,
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('Login successful:', data);
        
        // Log successful login
        logClientActivity('login_successful', {
          email: formData.email.toLowerCase(),
          accountType: data.user.accountType,
          dashboardRoute: data.dashboardRoute
        });
        
        // Update auth context with user data
        await authLogin({
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          givenName: data.user.givenName,
          familyName: data.user.familyName,
          orcidId: data.user.orcidId,
          orcidGivenNames: data.user.orcidGivenNames,
          orcidFamilyName: data.user.orcidFamilyName,
          primaryInstitution: data.user.primaryInstitution,
          accountType: data.user.accountType,
          role: data.user.role,
          emailVerified: data.user.emailVerified,
          status: data.user.status,
          createdAt: data.user.createdAt,
        });
        
        // Redirect to role-specific dashboard
        router.push(data.dashboardRoute);
      } else {
        // Log login failure
        logClientActivity('login_failed', {
          email: formData.email.toLowerCase(),
          reason: data.needsActivation ? 'account_not_activated' : 
                  data.field ? `field_error_${data.field}` : 'general_error',
          message: data.message
        });
        
        // Handle different error scenarios
        if (data.needsActivation) {
          setGeneralError(data.message);
          // Optional: Auto-redirect to resend activation after a delay
          setTimeout(() => {
            if (data.redirectTo) {
              router.push(data.redirectTo);
            }
          }, 3000);
        } else if (data.field) {
          // Field-specific error
          setErrors({ [data.field]: data.message });
        } else {
          // General error
          setGeneralError(data.message);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Log network/unexpected error
      logClientActivity('login_error', {
        email: formData.email.toLowerCase(),
        error: error.message,
        type: 'network_error'
      });
      
      setGeneralError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    // Log social login attempt
    logClientActivity('social_login_initiated', { provider });
    
    if (provider === 'ORCID') {
      handleOrcidLogin();
    } else {
      console.log(`Login with ${provider}`);
      // Implement other social login logic
    }
  };

  const handleOrcidLogin = () => {
    try {
      console.log('🚀 Initiating ORCID login...');
      
      // Log ORCID login attempt start with more details
      logClientActivity('orcid_login_started', {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        rememberMe: formData.rememberMe
      });

      // Clear any existing errors
      setGeneralError('');
      setErrors({});
      setIsLoading(true); // Show loading state during ORCID flow

      // Store remember me preference for ORCID callback
      if (formData.rememberMe) {
        document.cookie = `orcid_remember_me=true; path=/; max-age=600; secure=${process.env.NODE_ENV === 'production'}; samesite=strict`;
      }

      // Check for required environment variables
      const clientId = process.env.NEXT_PUBLIC_ORCID_CLIENT_ID;
      const redirectUri = process.env.NEXT_PUBLIC_ORCID_REDIRECT_URI;
      const scope = process.env.NEXT_PUBLIC_ORCID_SCOPE || '/authenticate';
      const orcidUrl = process.env.NEXT_PUBLIC_ORCID_SANDBOX_URL || 'https://sandbox.orcid.org/oauth/authorize';

      console.log('🔧 ORCID Config Check:', {
        hasClientId: !!clientId,
        hasRedirectUri: !!redirectUri,
        scope,
        orcidUrl
      });

      if (!clientId || !redirectUri) {
        logClientActivity('orcid_login_error', { 
          reason: 'missing_config',
          hasClientId: !!clientId,
          hasRedirectUri: !!redirectUri,
          scope,
          orcidUrl
        });
        setGeneralError('ORCID login is not properly configured. Please contact support.');
        setIsLoading(false);
        return;
      }

      // Generate state parameter for CSRF protection
      const state = btoa(JSON.stringify({
        timestamp: Date.now(),
        random: Math.random().toString(36).substring(7),
        source: 'hospitium_login'
      }));

      // Build ORCID authorization URL
      const authUrl = `${orcidUrl}?`
        + `client_id=${encodeURIComponent(clientId)}`
        + `&response_type=code`
        + `&scope=${encodeURIComponent(scope)}`
        + `&redirect_uri=${encodeURIComponent(redirectUri)}`
        + `&state=${encodeURIComponent(state)}`;

      console.log('🔗 ORCID Auth URL:', authUrl);

      // Store state in cookie for verification
      document.cookie = `orcid_state=${state}; path=/; max-age=600; secure=${process.env.NODE_ENV === 'production'}; samesite=strict`;
      
      // Log successful ORCID redirect with comprehensive data
      logClientActivity('orcid_redirect_initiated', {
        orcidUrl: orcidUrl,
        scope: scope,
        redirectUri: redirectUri,
        state: state.substring(0, 20) + '...', // Partial state for logging
        authUrlLength: authUrl.length
      });
      
      // Show user feedback before redirect
      console.log('🔄 Redirecting to ORCID for authentication...');
      
      // Redirect to ORCID
      window.location.href = authUrl;

    } catch (error) {
      console.error('❌ ORCID login error:', error);
      
      // Log detailed ORCID error
      logClientActivity('orcid_login_error', {
        reason: 'redirect_failed',
        error: error.message,
        stack: error.stack?.substring(0, 200),
        timestamp: new Date().toISOString()
      });
      
      setGeneralError('Failed to initiate ORCID login. Please try again.');
      setIsLoading(false);
    }
  };

  // Handle ORCID login errors from URL parameters and success callbacks
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const success = urlParams.get('login');
    const orcid = urlParams.get('orcid');
    
    if (error) {
      const errorMessage = decodeURIComponent(error);
      
      // Log detailed ORCID error from callback
      logClientActivity('orcid_callback_error', {
        error: errorMessage,
        source: 'url_parameter',
        wasOrcidFlow: !!orcid
      });
      
      setGeneralError(errorMessage);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (success === 'success') {
      // This would be handled by redirect, but just in case
      console.log('✅ Login successful via ORCID');
      
      // Log ORCID success callback
      logClientActivity('orcid_callback_success', {
        source: 'url_parameter'
      });
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (orcid === 'true') {
      // User came back from ORCID but was redirected to register
      logClientActivity('orcid_registration_required', {
        reason: 'user_not_found',
        action: 'redirect_to_register'
      });
      
      setGeneralError('ORCID account found, but you need to complete registration first.');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.palette.background.default,
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.mode === 'dark' ? '#404040' : 'rgba(0,0,0,0.1)'}`,
          }}
        >
          {/* Logo and Title */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <NoSSR
              fallback={
                <Image
                  src="/hospitium-logo.png"
                  alt="Hospitium RIS"
                  width={160}
                  height={36}
                  style={{ marginBottom: '16px' }}
                  priority
                />
              }
            >
              <Image
                src={isDarkMode ? "/hospitium-logo-dark.png" : "/hospitium-logo.png"}
                alt="Hospitium RIS"
                width={160}
                height={36}
                style={{ marginBottom: '16px' }}
                priority
              />
            </NoSSR>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
                mb: 1,
              }}
            >
              Welcome Back
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Sign in to your account to continue
            </Typography>
          </Box>

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit}>
            {/* General Error Alert */}
            {generalError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {generalError}
              </Alert>
            )}
            
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              error={!!errors.email}
              helperText={errors.email}
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange}
              error={!!errors.password}
              helperText={errors.password}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            {/* Remember Me and Forgot Password */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                mb: 3,
              }}
            >
              <Box>
                <Tooltip 
                  title="Keep me signed in for 30 days instead of just this session" 
                  arrow
                  placement="top"
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="rememberMe"
                        checked={formData.rememberMe}
                        onChange={handleInputChange}
                        color="primary"
                      />
                    }
                    label="Remember me"
                  />
                </Tooltip>
                <FormHelperText sx={{ ml: 4, mt: 0 }}>
                  {formData.rememberMe 
                    ? "You'll stay signed in for 30 days" 
                    : "Sign out when browser closes"
                  }
                </FormHelperText>
              </Box>
              <Link
                href="/forgot-password"
                variant="body2"
                sx={{
                  color: theme.palette.primary.main,
                  textDecoration: 'none',
                  mt: 1,
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Forgot password?
              </Link>
            </Box>

            {/* Login Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{
                py: 1.5,
                mb: 3,
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>

            {/* Divider */}
            <Divider sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Or continue with
              </Typography>
            </Divider>

            {/* Social Login Buttons */}
            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<GoogleIcon />}
                onClick={() => handleSocialLogin('Google')}
                sx={{ py: 1.5 }}
              >
                Google
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<OrcidIcon />}
                onClick={() => handleSocialLogin('ORCID')}
                disabled={isLoading}
                sx={{ 
                  py: 1.5,
                  '& .MuiButton-startIcon': {
                    color: '#A6CE39', // ORCID brand color
                  },
                }}
              >
                {isLoading ? 'Connecting to ORCID...' : 'ORCID'}
              </Button>
            </Stack>

            {/* Sign Up Link */}
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Link
                  href="/register"
                  sx={{
                    color: theme.palette.primary.main,
                    textDecoration: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Sign up here
                </Link>
              </Typography>
            </Box>

            {/* Resend Activation Link */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Need to activate your account?{' '}
                <Link
                  href="/resend-activation"
                  sx={{
                    color: theme.palette.primary.main,
                    textDecoration: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Resend activation email
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage; 