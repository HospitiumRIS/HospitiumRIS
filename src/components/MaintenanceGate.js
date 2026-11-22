'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Box, Typography, Button } from '@mui/material';
import { BuildCircleOutlined as MaintenanceIcon } from '@mui/icons-material';
import { useAuth } from './AuthProvider';
import usePublicSettings from '../hooks/usePublicSettings';

// Pages that stay reachable during maintenance so global admins can sign in.
const ALWAYS_OPEN = ['/login', '/global-admin/login'];

/**
 * Shows a full-page maintenance notice to everyone except global admins while
 * System Settings > Maintenance mode is on. The server enforces the same rule
 * (non-admin sessions and sign-ins are refused), so this is the friendly face
 * of it rather than the only guard.
 */
export default function MaintenanceGate({ children }) {
  const pathname = usePathname() || '';
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { settings, loaded } = usePublicSettings({ refreshKey: pathname });

  const blocked =
    loaded &&
    !isLoading &&
    settings.maintenanceMode &&
    user?.accountType !== 'GLOBAL_ADMIN' &&
    !ALWAYS_OPEN.includes(pathname);

  if (!blocked) return children;

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 3,
        bgcolor: 'background.default',
      }}
    >
      <Box sx={{ maxWidth: 480, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'action.hover',
            color: 'primary.main',
          }}
        >
          <MaintenanceIcon sx={{ fontSize: 36 }} />
        </Box>
        <Typography component="h1" sx={{ fontSize: '1.5rem', fontWeight: 700 }}>
          {settings.siteName || 'HospitiumRIS'} is under maintenance
        </Typography>
        <Typography color="text.secondary">
          {settings.maintenanceMessage || 'We are making some improvements. Please check back shortly.'}
        </Typography>
        <Button
          variant="text"
          size="small"
          onClick={() => router.push('/login')}
          sx={{ textTransform: 'none', mt: 1 }}
        >
          Administrator sign-in
        </Button>
      </Box>
    </Box>
  );
}
