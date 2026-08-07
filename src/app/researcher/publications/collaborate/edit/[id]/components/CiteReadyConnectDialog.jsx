'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Email as EmailIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { connectCiteReadyWithPassword } from '@/services/citereadyService';

/**
 * Lightweight "Connect CiteReady" dialog surfaced from the editor's Citation
 * Menu. Once connected, the same connection is used by the CiteReady tab on
 * the Import Publications page (/researcher/publications/import).
 */
export default function CiteReadyConnectDialog({ open, onClose, onConnected }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  const handleConnect = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      const result = await connectCiteReadyWithPassword({ email: email.trim(), password, environment: 'testing' });
      setPassword('');
      if (onConnected) onConnected(result);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid rgba(139,108,188,0.15)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }
      }}
    >
      <Box sx={{
        background: 'linear-gradient(135deg, #8b6cbc 0%, #a78bda 100%)',
        px: 3, pt: 3, pb: 2.5,
        position: 'relative',
      }}>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            position: 'absolute', top: 12, right: 12,
            color: 'rgba(255,255,255,0.7)',
            '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.15)' },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: '10px',
            bgcolor: 'rgba(255,255,255,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            <img src="/citeready.png" alt="CiteReady" style={{ width: 24, height: 24, objectFit: 'contain' }} />
          </Box>
          <Box>
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.2 }}>
              Connect CiteReady
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.75rem' }}>
              Read-only access to your CiteReady library
            </Typography>
          </Box>
        </Box>
      </Box>

      <DialogContent sx={{ px: 3, pt: 2.5, pb: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}

        <TextField
          fullWidth
          size="small"
          type="email"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={connecting}
          InputProps={{ startAdornment: <EmailIcon sx={{ mr: 1, fontSize: '1rem', color: '#8b6cbc' }} /> }}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          size="small"
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={connecting}
          onKeyDown={(e) => { if (e.key === 'Enter') handleConnect(); }}
          InputProps={{ startAdornment: <LockIcon sx={{ mr: 1, fontSize: '1rem', color: '#8b6cbc' }} /> }}
          sx={{ mb: 2 }}
        />

        <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', mb: 3 }}>
          Once connected, CiteReady also appears as an import source on the Import Publications page.
        </Typography>

        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button
            onClick={onClose}
            sx={{
              borderRadius: '10px', color: '#64748b', border: '1.5px solid #e2e8f0',
              px: 2.5, fontWeight: 600, fontSize: '0.85rem',
              '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConnect}
            disabled={connecting}
            variant="contained"
            sx={{
              borderRadius: '10px', px: 3, fontWeight: 600, fontSize: '0.85rem',
              background: 'linear-gradient(135deg, #8b6cbc 0%, #a78bda 100%)',
              boxShadow: '0 4px 12px rgba(139,108,188,0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #7a5cac 0%, #9678ca 100%)',
                boxShadow: '0 6px 16px rgba(139,108,188,0.45)',
              },
            }}
          >
            {connecting ? 'Connecting...' : 'Connect'}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
