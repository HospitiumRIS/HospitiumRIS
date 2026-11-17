'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Box, Button, CircularProgress, Paper, Typography } from '@mui/material';
import {
  Check as CheckIcon,
  PersonAddAlt1 as CreateAccountIcon,
  ErrorOutline as ErrorIcon,
  ArrowBack as BackIcon,
  LockClock as InactiveIcon,
} from '@mui/icons-material';
import Image from 'next/image';

const PURPLE = '#8b6cbc';
const ORCID_GREEN = '#A6CE39';

const STEPS = [
  'Verifying with ORCID',
  'Finding your Hospitium account',
  'Opening your dashboard',
];

// ORCID iD mark: green circle with "iD"
function OrcidMark({ size = 26 }) {
  return (
    <Box
      aria-label="ORCID"
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        bgcolor: ORCID_GREEN,
        color: 'white',
        fontWeight: 700,
        fontSize: size * 0.42,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        letterSpacing: '-0.02em',
        flexShrink: 0,
      }}
    >
      iD
    </Box>
  );
}

function Shell({ children }) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, bgcolor: '#f7f5fb' }}>
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 380,
          px: 3,
          py: 2.5,
          borderRadius: 3,
          border: '1px solid rgba(139, 108, 188, 0.18)',
          boxShadow: '0 8px 28px rgba(139, 108, 188, 0.12)',
          bgcolor: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2 }}>
          <OrcidMark />
          <Box component="span" sx={{ color: '#c4b5dd', fontSize: '0.8rem' }} aria-hidden="true">⇄</Box>
          <Image src="/hospitium-logo.png" alt="Hospitium RIS" width={112} height={25} priority />
        </Box>
        {children}
      </Paper>
    </Box>
  );
}

function StepRow({ label, state }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, py: 0.6 }}>
      <Box sx={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {state === 'done' && (
          <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckIcon sx={{ fontSize: 12, color: 'white' }} />
          </Box>
        )}
        {state === 'active' && <CircularProgress size={15} thickness={5} sx={{ color: PURPLE }} />}
        {state === 'pending' && <Box sx={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid #d1d5db' }} />}
      </Box>
      <Typography
        sx={{
          fontSize: '0.8rem',
          fontWeight: state === 'active' ? 600 : 400,
          color: state === 'pending' ? '#9ca3af' : '#374151',
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function ResultPanel({ icon, iconColor, title, body, children }) {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
        <Box sx={{ color: iconColor, display: 'flex', '& svg': { fontSize: 20 } }}>{icon}</Box>
        <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: '#1f2937' }}>{title}</Typography>
      </Box>
      <Typography sx={{ fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.55, mb: 2 }}>{body}</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>{children}</Box>
    </Box>
  );
}

const primaryBtnSx = {
  bgcolor: PURPLE,
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '0.8rem',
  borderRadius: 2,
  py: 0.9,
  boxShadow: 'none',
  '&:hover': { bgcolor: '#7a5caa', boxShadow: 'none' },
};

const textBtnSx = { textTransform: 'none', fontSize: '0.78rem', color: '#6b7280', fontWeight: 500 };

function OrcidCallbackContent() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0); // index of the active step
  const [orcid, setOrcid] = useState(null);
  const [result, setResult] = useState(null); // { kind, message }
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const run = async () => {
      const oauthError = searchParams.get('error');
      if (oauthError) {
        setResult({
          kind: 'error',
          message: oauthError === 'access_denied'
            ? 'You cancelled the ORCID authorization.'
            : `ORCID returned an error: ${oauthError}.`,
        });
        return;
      }
      const code = searchParams.get('code');
      if (!code) {
        setResult({ kind: 'error', message: 'No authorization code was received from ORCID.' });
        return;
      }

      try {
        // 1. Exchange the code; the server keeps a signed proof of the verified iD
        const tokenRes = await fetch('/api/auth/orcid/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, redirect_uri: `${window.location.origin}/auth/orcid/callback` }),
        });
        const token = await tokenRes.json().catch(() => ({}));
        if (!tokenRes.ok || !token.orcid) {
          throw new Error(token.error || 'ORCID could not verify your sign-in.');
        }
        setOrcid({ id: token.orcid, givenNames: token.givenNames, familyName: token.familyName });
        setStep(1);

        // 2. Look up the Hospitium account linked to the verified iD and sign in
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orcidLogin: true }),
        });
        const login = await loginRes.json().catch(() => ({}));

        if (loginRes.ok && login.success) {
          setStep(2);
          setTimeout(() => {
            window.location.href = login.dashboardRoute || '/dashboard';
          }, 400);
          return;
        }

        if (login.code === 'no_account') {
          setResult({ kind: 'no_account' });
        } else if (login.code === 'not_activated') {
          setResult({ kind: 'not_activated', message: login.message });
        } else if (login.code === 'inactive') {
          setResult({ kind: 'inactive', message: login.message });
        } else {
          throw new Error(login.message || 'Sign-in failed.');
        }
      } catch (err) {
        console.error('ORCID sign-in error:', err);
        setResult({ kind: 'error', message: err.message || 'Sign-in failed.' });
      }
    };

    run();
  }, [searchParams]);

  const goToLogin = () => { window.location.href = '/login'; };
  const name = [orcid?.givenNames, orcid?.familyName].filter(Boolean).join(' ');

  if (result?.kind === 'no_account') {
    return (
      <Shell>
        <ResultPanel
          icon={<CreateAccountIcon />}
          iconColor={PURPLE}
          title="Create your Hospitium account"
          body={
            <>
              {name ? <><strong>{name}</strong>, there&apos;s</> : 'There’s'} no Hospitium account linked to ORCID iD{' '}
              <Box component="span" sx={{ fontFamily: 'monospace', color: '#374151' }}>{orcid?.id}</Box> yet.
              Create a researcher account to continue. Your ORCID iD and name are already filled in.
            </>
          }
        >
          <Button
            variant="contained"
            fullWidth
            startIcon={<CreateAccountIcon sx={{ fontSize: '18px !important' }} />}
            onClick={() => { window.location.href = '/register?orcid=true'; }}
            sx={primaryBtnSx}
          >
            Create researcher account
          </Button>
          <Button fullWidth startIcon={<BackIcon sx={{ fontSize: '16px !important' }} />} onClick={goToLogin} sx={textBtnSx}>
            Back to sign in
          </Button>
        </ResultPanel>
      </Shell>
    );
  }

  if (result) {
    const inactive = result.kind === 'not_activated' || result.kind === 'inactive';
    return (
      <Shell>
        <ResultPanel
          icon={inactive ? <InactiveIcon /> : <ErrorIcon />}
          iconColor={inactive ? '#d97706' : '#dc2626'}
          title={inactive ? 'Account not active' : 'Couldn’t sign you in'}
          body={result.message}
        >
          {result.kind === 'not_activated' && (
            <Button variant="contained" fullWidth onClick={() => { window.location.href = '/resend-activation'; }} sx={primaryBtnSx}>
              Resend activation email
            </Button>
          )}
          {result.kind === 'error' && (
            <Button variant="contained" fullWidth onClick={goToLogin} sx={primaryBtnSx}>
              Try again
            </Button>
          )}
          <Button fullWidth startIcon={<BackIcon sx={{ fontSize: '16px !important' }} />} onClick={goToLogin} sx={textBtnSx}>
            Back to sign in
          </Button>
        </ResultPanel>
      </Shell>
    );
  }

  return (
    <Shell>
      <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: '#1f2937', mb: 1 }}>
        Signing you in with ORCID
      </Typography>
      <Box sx={{ mb: 1.5 }}>
        {STEPS.map((label, i) => (
          <StepRow key={label} label={label} state={i < step ? 'done' : i === step ? 'active' : 'pending'} />
        ))}
      </Box>
      <Typography sx={{ fontSize: '0.72rem', color: '#9ca3af' }}>
        {orcid?.id ? (
          <>ORCID iD <Box component="span" sx={{ fontFamily: 'monospace', color: '#6b7280' }}>{orcid.id}</Box></>
        ) : (
          'This usually takes a few seconds.'
        )}
      </Typography>
    </Shell>
  );
}

function LoadingFallback() {
  return (
    <Shell>
      <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: '#1f2937', mb: 1 }}>
        Signing you in with ORCID
      </Typography>
      <StepRow label={STEPS[0]} state="active" />
    </Shell>
  );
}

export default function OrcidCallback() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OrcidCallbackContent />
    </Suspense>
  );
}
