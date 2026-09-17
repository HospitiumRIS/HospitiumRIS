'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';

export default function IntegrityDetailField({ label, children }) {
  const content = children == null || children === '' ? '-' : children;
  const isText = typeof content === 'string' || typeof content === 'number';

  return (
    <Box>
      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      {isText ? (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', wordBreak: 'break-word' }}>
          {content}
        </Typography>
      ) : (
        content
      )}
    </Box>
  );
}
