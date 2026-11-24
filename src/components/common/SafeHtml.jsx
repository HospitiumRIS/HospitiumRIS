'use client';

import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { htmlToText, looksLikeHtml, sanitizeHtml } from '@/lib/safe-html';

const htmlSx = {
  color: '#334155',
  lineHeight: 1.75,
  fontSize: '0.92rem',
  '& p': { m: 0, mb: 1.25 },
  '& p:last-child': { mb: 0 },
  '& ul, & ol': { m: 0, pl: 2.5, mb: 1.25 },
  '& li': { mb: 0.5 },
  '& strong, & b': { fontWeight: 700, color: '#1e293b' },
  '& h1, & h2, & h3, & h4': { fontSize: '0.98rem', fontWeight: 700, color: '#1e293b', m: 0, mb: 0.75 },
  '& a': { color: '#8b6cbc' },
};

/**
 * Renders stored rich text safely (allowlisted tags, no attributes). Plain text keeps
 * its line breaks. `collapsedHeight` clamps long text with a "Show more" toggle.
 */
export default function SafeHtml({ value, empty = 'Not provided', collapsedHeight = null }) {
  const [open, setOpen] = useState(false);
  const text = htmlToText(value);
  if (!text) return empty ? <Typography variant="body2" color="text.secondary">{empty}</Typography> : null;
  const long = collapsedHeight && text.length > 600;
  const clamp = long && !open ? { maxHeight: collapsedHeight, overflow: 'hidden', maskImage: 'linear-gradient(180deg, #000 70%, transparent)' } : {};
  return (
    <Box>
      {looksLikeHtml(value)
        ? <Box sx={{ ...htmlSx, ...clamp }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }} />
        : <Typography variant="body2" sx={{ ...htmlSx, whiteSpace: 'pre-wrap', ...clamp }}>{text}</Typography>}
      {long ? (
        <Button size="small" onClick={() => setOpen((o) => !o)} sx={{ mt: 0.5, px: 0, textTransform: 'none', fontWeight: 700, color: '#8b6cbc' }}>
          {open ? 'Show less' : 'Show more'}
        </Button>
      ) : null}
    </Box>
  );
}
