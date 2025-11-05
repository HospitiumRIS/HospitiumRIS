'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Box, 
  Container, 
  Typography, 
  CircularProgress, 
  Paper, 
  LinearProgress,
  Alert
} from '@mui/material';
import Image from 'next/image';

function OrcidCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [processingStage, setProcessingStage] = useState('Initializing...');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [hasProcessed, setHasProcessed] = useState(false);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent multiple executions
      if (isProcessingRef.current || hasProcessed) {
        return;
      }

      // Only process if we have the required code parameter
      const code = searchParams.get('code');
      if (!code) {
        setError('No authorization code received from ORCID');
        return;
      }

      isProcessingRef.current = true;
      setHasProcessed(true);

      try {
        setProcessingStage('Processing ORCID authorization...');
        setProgress(10);

        const error = searchParams.get('error');
        const state = searchParams.get('state');

        // Handle ORCID error responses
        if (error) {
          throw new Error(`ORCID authorization failed: ${error}`);
        }

        setProcessingStage('Exchanging authorization code...');
        setProgress(30);

        // Exchange code for token and handle authentication
        const response = await fetch('/api/auth/orcid/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            redirect_uri: `${window.location.origin}/auth/orcid/callback`
          }),
        });

        const tokenData = await response.json();

        if (!response.ok) {
          throw new Error(tokenData.error || 'Failed to exchange authorization code');
        }

        setProcessingStage('Validating ORCID credentials...');
        setProgress(50);

        // Validate token data
        if (!tokenData.orcid || !tokenData.access_token) {
          throw new Error('Invalid token response from ORCID');
        }

        setProcessingStage('Checking user account...');
        setProgress(70);

        // Check if user exists with this ORCID ID directly
        const userCheckResponse = await fetch('/api/auth/me', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'check_orcid_user',
            orcidId: tokenData.orcid,
            orcidData: tokenData
          }),
        });

        if (userCheckResponse.ok) {
          const userData = await userCheckResponse.json();
          
          if (userData.userExists) {
            setProcessingStage('Logging in existing user...');
            setProgress(90);
            
            // User exists - proceed to login
            const loginResponse = await fetch('/api/auth/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orcidLogin: true,
                orcidId: tokenData.orcid,
                orcidData: tokenData
              }),
            });

            if (loginResponse.ok) {
              const loginData = await loginResponse.json();
              
              setProcessingStage('Redirecting to dashboard...');
              setProgress(100);
              
              // Redirect to user's dashboard
              setTimeout(() => {
                window.location.href = loginData.dashboardRoute || '/dashboard';
              }, 500);
              
              return;
            } else {
              throw new Error('Failed to login with ORCID');
            }
          } else {
            // User doesn't exist - redirect to registration
            setProcessingStage('Redirecting to registration...');
            setProgress(90);
            
            // Store ORCID data for registration
            sessionStorage.setItem('orcid_registration_data', JSON.stringify({
              orcidId: tokenData.orcid,
              givenNames: tokenData.name?.split(' ')[0] || '',
              familyName: tokenData.name?.split(' ').slice(1).join(' ') || '',
              accessToken: tokenData.access_token,
              scope: tokenData.scope
            }));
            
            setProgress(100);
            
            setTimeout(() => {
              window.location.href = '/register?orcid=true';
            }, 500);
            
            return;
          }
        }

        // If we get here, something went wrong
        throw new Error('Failed to check user account status');

      } catch (err) {
        console.error('ORCID authentication error:', err);
        setError(err.message || 'Authentication failed');
        
        setProcessingStage('Authentication failed');
        setProgress(0);

        // Redirect to login with error after delay
        setTimeout(() => {
          const errorParam = encodeURIComponent(err.message || 'Authentication failed');
          router.push(`/login?error=${errorParam}`);
        }, 3000);
        
      } finally {
        isProcessingRef.current = false;
      }
    };

    // Only process once and ensure we have search params
    if (searchParams && !hasProcessed) {
      handleCallback();
    }
  }, [searchParams, router, hasProcessed]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={8}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Logo */}
          <Box sx={{ mb: 2 }}>
            <Image
              src="/hospitium-logo.png"
              alt="Hospitium RIS"
              width={160}
              height={36}
              priority
            />
          </Box>

          {/* Loading or Error State */}
          {!error ? (
            <>
              <CircularProgress 
                size={50} 
                sx={{ 
                  color: '#8b6cbc',
                  '& .MuiCircularProgress-circle': {
                    strokeLinecap: 'round',
                  }
                }}
              />
              <Typography 
                variant="h4" 
                component="h1" 
                fontWeight="bold" 
                color="text.primary"
                sx={{ textAlign: 'center' }}
              >
                Processing ORCID Login
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{ textAlign: 'center', maxWidth: 400 }}
              >
                {processingStage}
              </Typography>
              <Box sx={{ width: '100%', mt: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={progress}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'rgba(139, 108, 188, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      backgroundColor: '#8b6cbc',
                    }
                  }}
                />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    display: 'block', 
                    textAlign: 'center', 
                    mt: 1,
                    color: 'text.secondary'
                  }}
                >
                  {progress}% Complete
                </Typography>
              </Box>
            </>
          ) : (
            <>
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Authentication Failed
                </Typography>
                <Typography variant="body2">
                  {error}
                </Typography>
              </Alert>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ textAlign: 'center' }}
              >
                Redirecting to login page...
              </Typography>
            </>
          )}

          <Typography variant="caption" color="text.disabled" sx={{ textAlign: 'center' }}>
            {!error ? 
              'Please wait while we securely complete your ORCID authentication...' :
              'You will be redirected to the login page shortly.'
            }
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}

function LoadingFallback() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={8}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Logo */}
          <Box sx={{ mb: 2 }}>
            <Image
              src="/hospitium-logo.png"
              alt="Hospitium RIS"
              width={160}
              height={36}
              priority
            />
          </Box>

          <CircularProgress 
            size={50} 
            sx={{ 
              color: '#8b6cbc',
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              }
            }}
          />
          <Typography 
            variant="h4" 
            component="h1" 
            fontWeight="bold" 
            color="text.primary"
            sx={{ textAlign: 'center' }}
          >
            Loading ORCID Callback
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ textAlign: 'center', maxWidth: 400 }}
          >
            Please wait while we initialize your ORCID authentication...
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}

export default function OrcidCallback() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OrcidCallbackContent />
    </Suspense>
  );
}
