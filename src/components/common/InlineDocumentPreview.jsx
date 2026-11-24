'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { Download as DownloadIcon, OpenInNew as OpenIcon } from '@mui/icons-material';

const MIME = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };
const extOf = (name, mime) => {
  const fromName = String(name || '').toLowerCase().split('.').pop();
  if (MIME[fromName]) return fromName;
  if (mime === 'application/pdf') return 'pdf';
  if (String(mime || '').startsWith('image/')) return 'png';
  return '';
};

/**
 * Shows a PDF or image inline (e.g. an ethics certificate). Files are fetched with the
 * user's session and shown from a local object URL, so private storage works.
 */
export default function InlineDocumentPreview({ url, name, mimeType, height = 720 }) {
  const [state, setState] = useState({ loading: true, error: '', src: '', kind: '' });
  useEffect(() => {
    let revoke = '';
    let cancelled = false;
    const ext = extOf(name, mimeType);
    if (!url || !ext) {
      setState({ loading: false, error: url ? 'This file type cannot be previewed here.' : 'No file attached.', src: '', kind: '' });
      return undefined;
    }
    (async () => {
      try {
        const fetchUrl = url.startsWith('/api/files/') ? `${url}${url.includes('?') ? '&' : '?'}stream=1` : url;
        const res = await fetch(fetchUrl, { credentials: 'include' });
        if (!res.ok) throw new Error('The file could not be loaded.');
        const blob = await res.blob();
        const typed = blob.type === MIME[ext] ? blob : new Blob([blob], { type: MIME[ext] });
        revoke = URL.createObjectURL(typed);
        if (!cancelled) setState({ loading: false, error: '', src: revoke, kind: ext === 'pdf' ? 'pdf' : 'image' });
      } catch (err) {
        if (!cancelled) setState({ loading: false, error: err.message, src: '', kind: '' });
      }
    })();
    return () => { cancelled = true; if (revoke) URL.revokeObjectURL(revoke); };
  }, [url, name, mimeType]);

  return (
    <Box>
      <Box sx={{ height, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider', bgcolor: '#f1f5f9', display: 'grid', placeItems: state.kind ? 'stretch' : 'center' }}>
        {state.loading ? <CircularProgress sx={{ color: '#8b6cbc' }} /> : null}
        {state.error ? <Alert severity="info" sx={{ m: 2 }}>{state.error}</Alert> : null}
        {state.kind === 'pdf' ? <Box component="iframe" title={name || 'Document'} src={state.src} sx={{ width: '100%', height: '100%', border: 0 }} /> : null}
        {state.kind === 'image' ? <Box component="img" alt={name || 'Document'} src={state.src} sx={{ width: '100%', height: '100%', objectFit: 'contain', bgcolor: 'white' }} /> : null}
      </Box>
      {url ? (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ flex: 1, minWidth: 0 }} noWrap>{name}</Typography>
          <Button size="small" startIcon={<OpenIcon />} href={state.src || url} target="_blank" rel="noopener" sx={{ textTransform: 'none', fontWeight: 700, color: '#8b6cbc' }}>Open</Button>
          <Button size="small" startIcon={<DownloadIcon />} href={state.src || url} download={name || true} sx={{ textTransform: 'none', fontWeight: 700, color: '#8b6cbc' }}>Download</Button>
        </Stack>
      ) : null}
    </Box>
  );
}
