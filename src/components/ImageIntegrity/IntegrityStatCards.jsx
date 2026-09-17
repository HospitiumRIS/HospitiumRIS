'use client';

import React from 'react';
import { Box, Paper, Typography, alpha } from '@mui/material';

const PURPLE = '#8b6cbc';

/**
 * Shared KPI cards used across Image Integrity list, usage, and detail.
 * Matches the portal theme: outlined paper, purple icon well, number then label.
 */
export default function IntegrityStatCards({ items = [] }) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
      {items.map((item) => (
        <Paper
          key={item.label}
          elevation={0}
          sx={{
            flex: '1 1 150px',
            minWidth: 0,
            px: 2,
            py: 1.75,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {item.icon && (
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                bgcolor: alpha(PURPLE, 0.1),
                color: PURPLE,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1,
              }}
            >
              {React.cloneElement(item.icon, { sx: { fontSize: 18 } })}
            </Box>
          )}
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: item.color || '#1e293b', lineHeight: 1.15 }}
          >
            {item.value}
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b', display: 'block', mt: 0.25 }}>
            {item.label}
          </Typography>
          {item.hint && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.35, lineHeight: 1.35 }}>
              {item.hint}
            </Typography>
          )}
        </Paper>
      ))}
    </Box>
  );
}
