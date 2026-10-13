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
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Google as GoogleIcon,
  MailOutline as MailIcon,
  LockOutlined as LockIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import Image from 'next/image';
import { useThemeMode } from '@/components/ThemeProvider';
import { useAuth } from '@/components/AuthProvider';
import { useTranslation } from 'react-i18next';
import { StepHeader, Field } from '@/components/Registration/FormKit';

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
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [postLoginRedirect, setPostLoginRedirect] = useState('');

  // Log page visit on component mount and restore remember me preference
  useEffect(() => {
    logClientActivity('login_page_visited');
    
    // Restore remember me preference from localStorage
    const savedRememberMe = localStorage.getItem('hospitium_remember_me');
    if (savedRememberMe === 'true') {
      setFormData(prev => ({ ...prev, rememberMe: true }));
      logClientActivity('remember_me_preference_restored');
    }

    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
    const emailFromInvite = urlParams.get('email');
    if (redirect && redirect.startsWith('/') && !redirect.startsWith('//') && !redirect.includes('://')) {
      setPostLoginRedirect(redirect);
    }
    if (emailFromInvite) {
      setFormData(prev => ({ ...prev, email: emailFromInvite }));
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
      newErrors.email = t('errors.required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('errors.invalid_email');
    }

    if (!formData.password) {
      newErrors.password = t('errors.required');
    } else if (formData.password.length < 6) {
      newErrors.password = t('errors.password_short');
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
        
        // Redirect to role-specific dashboard, or a safe invite destination
        router.push(postLoginRedirect || data.dashboardRoute);
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
      
      setGeneralError(t('errors.network_error'));
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

  const socialBtnSx = {
    height: 44,
    borderRadius: 1.25,
    fontWeight: 500,
    fontSize: '0.875rem',
    color: 'text.primary',
    borderColor: 'divider',
    bgcolor: 'background.paper',
    '&:hover': { borderColor: 'text.disabled', bgcolor: 'background.paper' },
  };

  return (
    <NoSSR fallback={null}>
      <Box sx={{ maxWidth: 440, mx: 'auto' }}>
        <StepHeader title={t('auth.login_title')} subtitle={t('auth.login_subtitle')} />

        <Box component="form" onSubmit={handleSubmit} noValidate>
          {generalError && (
            <Alert severity="error" variant="outlined" sx={{ mb: 2.5, borderRadius: 1.5 }} onClose={() => setGeneralError('')}>
              {generalError}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Field label={t('auth.email')} htmlFor="login-email">
              <TextField
                id="login-email"
                fullWidth
                name="email"
                type="email"
                autoComplete="email"
                autoFocus
                value={formData.email}
                onChange={handleInputChange}
                error={!!errors.email}
                helperText={errors.email}
                placeholder={t('auth.email_placeholder', 'name@institution.org')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MailIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Field>

            <Field label={t('auth.password')} htmlFor="login-password">
              <TextField
                id="login-password"
                fullWidth
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={formData.password}
                onChange={handleInputChange}
                error={!!errors.password}
                helperText={errors.password}
                placeholder="••••••••"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                        aria-label={showPassword ? t('auth.hide_password', 'Hide password') : t('auth.show_password', 'Show password')}
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Field>
          </Box>

          {/* Remember me */}
          <Tooltip title={t('auth.remember_tooltip')} arrow placement="top-start">
            <FormControlLabel
              sx={{ mt: 1.5, mb: 2.5, ml: -0.75, '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
              control={
                <Checkbox
                  name="rememberMe"
                  size="small"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  color="primary"
                />
              }
              label={
                <Box component="span">
                  {t('auth.remember_me')}
                  <Box component="span" sx={{ color: 'text.secondary', fontSize: '0.78rem', ml: 0.75 }}>
                    · {formData.rememberMe ? t('auth.stay_30_days') : t('auth.sign_out_on_close')}
                  </Box>
                </Box>
              }
            />
          </Tooltip>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disableElevation
            disabled={isLoading}
            endIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <ArrowForwardIcon />}
            sx={{
              height: 44, borderRadius: 1.25, fontWeight: 600, fontSize: '0.9375rem',
              boxShadow: `0 6px 16px -6px ${theme.palette.primary.main}`,
              '&:hover': { boxShadow: `0 8px 20px -6px ${theme.palette.primary.main}` },
            }}
          >
            {isLoading ? t('common.loading') : t('auth.login_btn')}
          </Button>

          <Divider sx={{ my: 3, color: 'text.secondary', fontSize: '0.8125rem', '&::before, &::after': { borderColor: 'divider' } }}>
            {t('auth.or_continue')}
          </Divider>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => handleSocialLogin('ORCID')}
              disabled={isLoading}
              startIcon={
                <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: '#A6CE39', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 8.5, fontWeight: 700 }}>
                  iD
                </Box>
              }
              sx={socialBtnSx}
            >
              {t('auth.orcid')}
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => handleSocialLogin('Google')}
              startIcon={<GoogleIcon sx={{ color: '#4285F4' }} />}
              sx={socialBtnSx}
            >
              {t('auth.google')}
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 3.5, fontSize: '0.875rem' }}>
            {t('auth.no_account')}{' '}
            <Link component={NextLink} href="/register" underline="hover" sx={{ fontWeight: 600 }}>
              {t('auth.sign_up')}
            </Link>
          </Typography>
        </Box>
      </Box>
    </NoSSR>
  );
};


export default LoginPage; 