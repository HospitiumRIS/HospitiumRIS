'use client';

import React, { useState } from 'react';
import { Box, Typography, Paper, ToggleButtonGroup, ToggleButton, TextField } from '@mui/material';
import {
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatListBulleted as BulletIcon,
  FormatListNumbered as NumberIcon,
} from '@mui/icons-material';

export default function RichTextEditor({ 
  label, 
  value = '', 
  onChange, 
  placeholder = '',
  helperText = '',
  required = false,
  minRows = 4,
  maxRows = 12
}) {
  const [focused, setFocused] = useState(false);

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#2D3748' }}>
        {label} {required && <span style={{ color: '#e53e3e' }}>*</span>}
      </Typography>
      
      <Paper
        sx={{
          border: focused ? '2px solid #8b6cbc' : '1px solid #e2e8f0',
          borderRadius: 2,
          overflow: 'hidden',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: focused ? '#8b6cbc' : '#cbd5e0',
          }
        }}
      >
        <TextField
          fullWidth
          multiline
          minRows={minRows}
          maxRows={maxRows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': { border: 'none' },
            },
            '& .MuiInputBase-input': {
              fontSize: '0.95rem',
              lineHeight: 1.7,
              color: '#2D3748',
              p: 2,
            },
            '& .MuiInputBase-input::placeholder': {
              color: '#a0aec0',
              opacity: 1,
            }
          }}
        />
      </Paper>
      
      {helperText && (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, ml: 1.5, color: '#718096' }}>
          {helperText}
        </Typography>
      )}
    </Box>
  );
}
