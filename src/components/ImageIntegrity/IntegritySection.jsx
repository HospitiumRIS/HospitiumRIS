'use client';

import React from 'react';
import { Box, Paper, Stack, Typography, alpha } from '@mui/material';

const PURPLE = '#8b6cbc';

export default function IntegritySection({ step, title, description, action, children, sx }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.5 },
        mb: 2.5,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        ...sx,
      }}
    >
      {(step || title || action) && (
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="flex-start"
          justifyContent="space-between"
          sx={{ mb: children ? 2 : 0 }}
        >
          <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0 }}>
            {step ? (
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  bgcolor: alpha(PURPLE, 0.12),
                  color: PURPLE,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 13,
                  flexShrink: 0,
                  mt: 0.1,
                }}
              >
                {step}
              </Box>
            ) : null}
            <Box sx={{ minWidth: 0 }}>
              {title ? (
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b', lineHeight: 1.3 }}>
                  {title}
                </Typography>
              ) : null}
              {description ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4, lineHeight: 1.6 }}>
                  {description}
                </Typography>
              ) : null}
            </Box>
          </Stack>
          {action}
        </Stack>
      )}
      {children}
    </Paper>
  );
}
