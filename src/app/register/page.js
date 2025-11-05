'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Fade,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useThemeMode } from '../../components/ThemeProvider';
import dynamic from 'next/dynamic';

// Dynamic imports for step components with loading fallbacks
const AccountTypeStep = dynamic(() => import('../../components/Registration/AccountTypeStep'), {
  loading: () => <RegistrationStepSkeleton />
});

const OrcidSearchStep = dynamic(() => import('../../components/Registration/OrcidSearchStep'), {
  loading: () => <RegistrationStepSkeleton />
});

const AccountDetailsStep = dynamic(() => import('../../components/Registration/AccountDetailsStep'), {
  loading: () => <RegistrationStepSkeleton />
});

const InstitutionDetailsStep = dynamic(() => import('../../components/Registration/InstitutionDetailsStep'), {
  loading: () => <RegistrationStepSkeleton />
});

const FoundationDetailsStep = dynamic(() => import('../../components/Registration/FoundationDetailsStep'), {
  loading: () => <RegistrationStepSkeleton />
});

const PasswordStep = dynamic(() => import('../../components/Registration/PasswordStep'), {
  loading: () => <RegistrationStepSkeleton />
});

const FoundationAdminStep = dynamic(() => import('../../components/Registration/FoundationAdminStep'), {
  loading: () => <RegistrationStepSkeleton />
});

// Loading skeleton component for registration steps
const RegistrationStepSkeleton = () => (
  <Box sx={{ p: 3, minHeight: 200 }}>
    <Box sx={{ 
      width: '60%', 
      height: 32, 
      bgcolor: 'grey.200', 
      borderRadius: 1, 
      mb: 2, 
      mx: 'auto',
      animation: 'pulse 1.5s ease-in-out infinite'
    }} />
    <Box sx={{ mb: 3 }}>
      <Box sx={{ 
        width: '100%', 
        height: 56, 
        bgcolor: 'grey.100', 
        borderRadius: 1, 
        mb: 2,
        animation: 'pulse 1.5s ease-in-out infinite'
      }} />
      <Box sx={{ 
        width: '100%', 
        height: 56, 
        bgcolor: 'grey.100', 
        borderRadius: 1, 
        mb: 2,
        animation: 'pulse 1.5s ease-in-out infinite'
      }} />
      <Box sx={{ 
        width: '100%', 
        height: 56, 
        bgcolor: 'grey.100', 
        borderRadius: 1,
        animation: 'pulse 1.5s ease-in-out infinite'
      }} />
    </Box>
  </Box>
);

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

const RegisterPage = () => {
  const theme = useTheme();
  const router = useRouter();
  const { isDarkMode, isClient } = useThemeMode();
  
  // Multi-step form state
  const [activeStep, setActiveStep] = useState(0);
  const [accountType, setAccountType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [selectedOrcidProfile, setSelectedOrcidProfile] = useState(null);

  // Form data state
  const [formData, setFormData] = useState({
    // Account type
    accountType: '',
    
    // Personal details
    givenName: '',
    familyName: '',
    email: '',
    confirmEmail: '',
    password: '',
    confirmPassword: '',
    
    // ORCID data
    orcidId: '',
    orcidGivenNames: '',
    orcidFamilyName: '',
    isOrcidRegistration: false, // Flag for ORCID-initiated registration
    
    // Researcher specific
    primaryInstitution: '',
    startMonth: '',
    startYear: '',
    
    // Research Admin specific
    institutionName: '',
    institutionType: '',
    institutionCountry: '',
    institutionWebsite: '',
    
    // Foundation Admin specific
    foundationName: '',
    foundationType: '',
    foundationCountry: '',
    foundationFocusArea: '',
    foundationWebsite: '',
    foundationDescription: '',
  });

  // Handle ORCID registration from callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isOrcidLogin = urlParams.get('orcid') === 'true';
    
    if (isOrcidLogin) {
      console.log('🔗 ORCID registration detected - user will need to complete registration');
      setFormData(prev => ({
        ...prev,
        isOrcidRegistration: true
      }));
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Define steps based on account type
  const getSteps = () => {
    const baseSteps = ['Account Type'];
    
    if (accountType === 'RESEARCHER') {
      return [...baseSteps, 'ORCID Search', 'Account Details', 'Password'];
    } else if (accountType === 'RESEARCH_ADMIN') {
      return [...baseSteps, 'ORCID Search', 'Account Details', 'Institution Details', 'Password'];
    } else if (accountType === 'FOUNDATION_ADMIN') {
      return [...baseSteps, 'Email & Password'];
    }
    
    return baseSteps;
  };

  const steps = getSteps();

  // Generate month options
  const monthOptions = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  // Generate year options (current year back to 1950)
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let year = currentYear; year >= 1950; year--) {
    yearOptions.push({ value: year.toString(), label: year.toString() });
  }

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle account type selection
  const handleAccountTypeChange = (event, newAccountType) => {
    if (newAccountType !== null) {
      setAccountType(newAccountType);
      setFormData(prev => ({ ...prev, accountType: newAccountType }));
    }
  };

  // Handle ORCID profile selection
  const handleOrcidSelect = (profile) => {
    setSelectedOrcidProfile(profile);
    setFormData(prev => ({
      ...prev,
      orcidId: profile['orcid-id'],
      orcidGivenNames: profile['given-names'],
      orcidFamilyName: profile['family-names'],
      givenName: profile['given-names'],
      familyName: profile['family-names'],
      primaryInstitution: profile['institution-name'].length > 0 ? profile['institution-name'][0] : ''
    }));
  };


  // Validation functions
  const validateEmail = (email) => {
    const re = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return re.test(email);
  };

  const validateFoundationEmail = (email) => {
    const re = /^[A-Z0-9._%+-]+@hospitium\.org$/i;
    return re.test(email);
  };

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
      isValid: minLength && hasUpper && hasLower && hasNumber && hasSpecial,
      requirements: {
        minLength,
        hasUpper,
        hasLower,
        hasNumber,
        hasSpecial,
      }
    };
  };

  // Step validation
  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 0: // Account Type
        if (!formData.accountType) {
          newErrors.accountType = 'Please select an account type';
        }
        break;
        
      case 1: 
        if (accountType === 'FOUNDATION_ADMIN') {
          // Email & Password validation for Foundation Admins
          if (!formData.email) {
            newErrors.email = 'Email is required';
          } else if (!validateFoundationEmail(formData.email)) {
            newErrors.email = 'Please enter a valid @hospitium.org email address';
          }
          
          if (!formData.password) {
            newErrors.password = 'Password is required';
          } else {
            const validation = validatePassword(formData.password);
            if (!validation.isValid) {
              newErrors.password = 'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character';
            }
          }
          if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
          } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
          }
        } else {
          // ORCID Search validation for RESEARCHER and RESEARCH_ADMIN
          if (!selectedOrcidProfile) {
            newErrors.orcidSearch = 'Please search for and select your ORCID profile to continue';
          }
        }
        break;
        
      case 2: 
        // Personal/Account Details for RESEARCHER and RESEARCH_ADMIN only
        if (!formData.givenName.trim()) {
          newErrors.givenName = 'Given name is required';
        }
        if (!formData.familyName.trim()) {
          newErrors.familyName = 'Family name is required';
        }
        if (!formData.email) {
          newErrors.email = 'Email is required';
        } else if (!validateEmail(formData.email)) {
          newErrors.email = 'Please enter a valid email address';
        }
        
        // Additional validation for institution and dates
        if (!formData.primaryInstitution.trim()) {
          newErrors.primaryInstitution = 'Primary institution is required';
        }
        if (!formData.startMonth) {
          newErrors.startMonth = 'Start month is required';
        }
        if (!formData.startYear) {
          newErrors.startYear = 'Start year is required';
        }
        break;
        
      case 3: 
        if (accountType === 'RESEARCHER') {
          // Researcher password validation
          if (!formData.password) {
            newErrors.password = 'Password is required';
          } else {
            const validation = validatePassword(formData.password);
            if (!validation.isValid) {
              newErrors.password = 'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character';
            }
          }
          if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
          } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
          }
        } else if (accountType === 'RESEARCH_ADMIN') {
          // Research Admin institution validation
          if (!formData.institutionName.trim()) {
            newErrors.institutionName = 'Institution name is required';
          }
          if (!formData.institutionType) {
            newErrors.institutionType = 'Institution type is required';
          }
          if (!formData.institutionCountry) {
            newErrors.institutionCountry = 'Country is required';
          }
        }
        break;
        
      case 4: // Password (final step for Research Admins only)
        if (accountType === 'RESEARCH_ADMIN') {
          if (!formData.password) {
            newErrors.password = 'Password is required';
          } else {
            const validation = validatePassword(formData.password);
            if (!validation.isValid) {
              newErrors.password = 'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character';
            }
          }
          if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
          } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
          }
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation handlers
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  // Submit handler
  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;
    
    setIsLoading(true);
    setFormError('');
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          // Ensure all necessary fields are included
          accountType: formData.accountType,
          givenName: formData.givenName,
          familyName: formData.familyName,
          email: formData.email,
          confirmEmail: formData.confirmEmail,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          
          // ORCID data
          orcidId: formData.orcidId,
          orcidGivenNames: formData.orcidGivenNames,
          orcidFamilyName: formData.orcidFamilyName,
          
          // Research details
          primaryInstitution: formData.primaryInstitution,
          startMonth: formData.startMonth,
          startYear: formData.startYear,
          
          // Institution details
          institutionName: formData.institutionName,
          institutionType: formData.institutionType,
          institutionCountry: formData.institutionCountry,
          institutionWebsite: formData.institutionWebsite,
          
          // Foundation details
          foundationName: formData.foundationName,
          foundationType: formData.foundationType,
          foundationCountry: formData.foundationCountry,
          foundationWebsite: formData.foundationWebsite,
          foundationFocusArea: formData.foundationFocusArea,
          foundationDescription: formData.foundationDescription,
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('Registration successful:', data);
        
        // Show success message with email verification instructions
        if (data.emailSent) {
          // Registration successful and email sent
          setFormError('');
          // You can either redirect to a success page or show inline message
          router.push('/register/success?email=' + encodeURIComponent(formData.email));
        } else {
          // Registration successful but email failed
          setFormError(data.message + ' Please contact support to resend your activation email.');
        }
      } else {
        // Handle validation errors from server
        if (data.errors) {
          setErrors(data.errors);
          
          // If there are step-specific errors, go back to the relevant step
          const errorKeys = Object.keys(data.errors);
          if (errorKeys.some(key => ['accountType'].includes(key))) {
            setActiveStep(0);
          } else if (accountType === 'FOUNDATION_ADMIN') {
            // Foundation Admin error mapping - only 2 steps
            if (errorKeys.some(key => ['email', 'password', 'confirmPassword'].includes(key))) {
              setActiveStep(1); // Email & Password step for Foundation Admins
            }
          } else {
            // Researcher and Research Admin error mapping
            if (errorKeys.some(key => ['orcidSearch'].includes(key))) {
              setActiveStep(1);
            } else if (errorKeys.some(key => ['givenName', 'familyName', 'email', 'confirmEmail', 'primaryInstitution', 'startMonth', 'startYear'].includes(key))) {
              setActiveStep(2);
            } else if (errorKeys.some(key => ['institutionName', 'institutionType', 'institutionCountry', 'password', 'confirmPassword'].includes(key))) {
              if (accountType === 'RESEARCHER') {
                setActiveStep(3); // Password for Researchers
              } else {
                setActiveStep(3); // Institution details for Research Admins
              }
            } else if (errorKeys.some(key => ['password', 'confirmPassword'].includes(key)) && accountType === 'RESEARCH_ADMIN') {
              setActiveStep(4); // Password for Research Admins
            }
          }
        }
        
        setFormError(data.message || 'Registration failed. Please check your information and try again.');
      }
      
    } catch (error) {
      console.error('Registration error:', error);
      setFormError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step content renderer
  const renderStepContent = (step) => {
    switch (step) {
      case 0: // Account Type Selection
        return (
          <AccountTypeStep 
            accountType={formData.accountType}
            onAccountTypeChange={handleAccountTypeChange}
            errors={errors}
          />
        );

      case 1: 
        if (accountType === 'FOUNDATION_ADMIN') {
          // Foundation Admins use simplified email & password step
          return (
            <FoundationAdminStep 
              formData={formData}
              onInputChange={handleInputChange}
              errors={errors}
            />
          );
        } else {
          // ORCID Search (for RESEARCHER and RESEARCH_ADMIN)
          return (
            <OrcidSearchStep 
              onOrcidSelect={handleOrcidSelect}
              selectedOrcidProfile={selectedOrcidProfile}
              errors={errors}
            />
          );
        }
        
      case 2: 
        // Personal/Account Details for RESEARCHER and RESEARCH_ADMIN only
        return (
          <AccountDetailsStep 
            formData={formData}
            onInputChange={handleInputChange}
            errors={errors}
            accountType={accountType}
            monthOptions={monthOptions}
            yearOptions={yearOptions}
          />
        );

      case 3: 
        if (accountType === 'RESEARCHER') {
          // Researchers go straight to password after account details
          return (
            <PasswordStep 
              formData={formData}
              onInputChange={handleInputChange}
              errors={errors}
            />
          );
        } else if (accountType === 'RESEARCH_ADMIN') {
          // Research Admins show institution details
          return (
            <InstitutionDetailsStep 
              formData={formData}
              onInputChange={handleInputChange}
              errors={errors}
            />
          );
        }
        break;

      case 4: // Password (final step for Research Admins only)
        if (accountType === 'RESEARCH_ADMIN') {
          return (
            <PasswordStep 
              formData={formData}
              onInputChange={handleInputChange}
              errors={errors}
            />
          );
        }
        break;

      default:
        return null;
    }
  };

  // Determine logo source, with fallback for SSR
  const logoSrc = isClient ? (isDarkMode ? "/hospitium-logo-dark.png" : "/hospitium-logo.png") : "/hospitium-logo.png";

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.palette.background.default,
        py: 2,
      }}
    >
      <Container maxWidth="lg">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.mode === 'dark' ? '#404040' : 'rgba(0,0,0,0.1)'}`,
            maxWidth: 1000,
            mx: 'auto',
          }}
        >
          {/* Logo and Title */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <NoSSR
              fallback={
                <Image
                  src="/hospitium-logo.png"
                  alt="Hospitium RIS"
                  width={140}
                  height={32}
                  style={{ marginBottom: '12px' }}
                  priority
                />
              }
            >
              <Image
                src={isDarkMode ? "/hospitium-logo-dark.png" : "/hospitium-logo.png"}
                alt="Hospitium RIS"
                width={140}
                height={32}
                style={{ marginBottom: '12px' }}
                priority
              />
            </NoSSR>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
                mb: 0.5,
                fontSize: { xs: '1.75rem', sm: '2rem' },
              }}
            >
              Create Account
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: '0.875rem' }}
            >
              Join our research community today
            </Typography>
          </Box>

          {/* Stepper */}
          <Box sx={{ mb: 3 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel 
                    sx={{
                      '& .MuiStepLabel-label': {
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      },
                    }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          {/* Error Alert */}
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}

          {/* Form Content */}
          <Card elevation={0} sx={{ mb: 3, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Fade in={true} key={activeStep}>
                <Box sx={{ minHeight: 200 }}>
                  {renderStepContent(activeStep)}
                </Box>
              </Fade>
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 2 }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              startIcon={<ArrowBackIcon />}
              sx={{ visibility: activeStep === 0 ? 'hidden' : 'visible' }}
            >
              Back
            </Button>
            
            <Button
              variant="contained"
              onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
              disabled={isLoading}
              endIcon={
                isLoading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : activeStep === steps.length - 1 ? (
                  <CheckCircleIcon />
                ) : (
                  <ArrowForwardIcon />
                )
              }
            >
              {isLoading ? 'Creating Account...' : activeStep === steps.length - 1 ? 'Create Account' : 'Continue'}
            </Button>
          </Box>

          {/* Sign In Link */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
              Already have an account?{' '}
              <Button
                variant="text"
                onClick={() => router.push('/login')}
                sx={{ textTransform: 'none', p: 0, minWidth: 'auto', fontSize: '0.875rem' }}
              >
                Sign in here
              </Button>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default RegisterPage; 