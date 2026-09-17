'use client';

import React from 'react';
import { Alert, Button, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const PURPLE = '#8b6cbc';

export default function IntegrityDetailError({ status, message, onBack, onRetry, loginHref = '/login' }) {
  const { t } = useTranslation();

  const copy =
    status === 404
      ? {
          title: t('researcher.integrity_detail_error_not_found_title', 'Submission not found'),
          body: t(
            'researcher.integrity_detail_error_not_found_body',
            'This check may have been removed, or the link is incorrect.'
          ),
        }
      : status === 403
        ? {
            title: t('researcher.integrity_detail_error_forbidden_title', "You don't have access"),
            body: t(
              'researcher.integrity_detail_error_forbidden_body',
              'Institution admin access is required to view this submission.'
            ),
          }
        : status === 401
          ? {
              title: t('researcher.integrity_detail_error_unauthorized_title', 'Session expired'),
              body: t('researcher.integrity_detail_error_unauthorized_body', 'Please sign in again to continue.'),
            }
          : {
              title: t('researcher.integrity_detail_error_server_title', 'Something went wrong'),
              body:
                message ||
                t(
                  'researcher.integrity_detail_error_server_body',
                  'The submission could not be loaded. Please try again.'
                ),
            };

  return (
    <Alert
      severity={status === 404 || status === 403 ? 'warning' : 'error'}
      sx={{ borderRadius: 2 }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
        {copy.title}
      </Typography>
      <Typography variant="body2" sx={{ mb: 1.5 }}>
        {copy.body}
      </Typography>
      <Stack direction="row" spacing={1}>
        {status === 401 ? (
          <Button href={loginHref} size="small" variant="contained" sx={{ bgcolor: PURPLE, textTransform: 'none' }}>
            {t('researcher.integrity_detail_error_sign_in', 'Sign in')}
          </Button>
        ) : (
          <Button onClick={onBack} size="small" variant="contained" sx={{ bgcolor: PURPLE, textTransform: 'none' }}>
            {t('researcher.integrity_detail_error_back', 'Back to submissions')}
          </Button>
        )}
        {onRetry && status >= 500 && (
          <Button onClick={onRetry} size="small" sx={{ textTransform: 'none', color: PURPLE }}>
            {t('researcher.integrity_detail_error_retry', 'Retry')}
          </Button>
        )}
      </Stack>
    </Alert>
  );
}
