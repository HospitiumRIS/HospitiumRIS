'use client';

import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Close as CloseIcon, Search as SearchIcon } from '@mui/icons-material';

const PURPLE = '#8b6cbc';

function matchesQuery(app, query) {
  if (!query) return true;
  const haystack = [
    app.title,
    app.referenceNumber,
    app.committeeName,
    app.status,
    app.source === 'EXTERNAL_CERTIFICATE' ? 'certificate' : 'application',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

export default function EthicsLinkModal({
  open,
  onClose,
  onSelect,
  applications = [],
  loading = false,
}) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(
    () => applications.filter((app) => matchesQuery(app, query.trim().toLowerCase())),
    [applications, query]
  );

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableScrollLock
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden', maxHeight: '86vh' } }}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 1.75,
          px: 2.5,
        }}
      >
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'white' }}>
            Link ethics record
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.88)' }}>
            Search by title, reference, committee, or certificate.
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={handleClose}
          sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.16)', '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' } }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ px: 3, pt: '24px !important', pb: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search ethics applications or certificates"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: PURPLE }} />
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root:hover fieldset': { borderColor: PURPLE },
            '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: PURPLE },
          }}
        />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress sx={{ color: PURPLE }} />
          </Box>
        ) : filtered.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
            {applications.length === 0
              ? 'No submitted or approved ethics records were found.'
              : 'No records match this search.'}
          </Typography>
        ) : (
          <Stack spacing={1.25}>
            {filtered.map((app) => {
              const isCertificate = app.source === 'EXTERNAL_CERTIFICATE';
              return (
                <Box
                  key={app.id}
                  onClick={() => onSelect(app)}
                  sx={{
                    p: 1.75,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    cursor: 'pointer',
                    '&:hover': { borderColor: PURPLE, bgcolor: 'rgba(139, 108, 188, 0.04)' },
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                      {app.title || 'Untitled ethics record'}
                    </Typography>
                    <Stack direction="row" spacing={0.75}>
                      <Chip
                        size="small"
                        label={isCertificate ? 'Certificate' : 'Application'}
                        sx={{ height: 22, fontWeight: 700, bgcolor: 'rgba(139, 108, 188, 0.1)', color: PURPLE }}
                      />
                      <Chip
                        size="small"
                        label={app.status || 'Unknown'}
                        sx={{
                          height: 22,
                          fontWeight: 700,
                          bgcolor: app.status === 'APPROVED' ? '#10b981' : PURPLE,
                          color: 'white',
                        }}
                      />
                    </Stack>
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                    {[
                      app.referenceNumber ? `Ref ${app.referenceNumber}` : null,
                      app.committeeName,
                      app.approvalDate ? `Approved ${new Date(app.approvalDate).toLocaleDateString()}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'No extra details recorded'}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, bgcolor: '#faf8fc' }}>
        <Button onClick={handleClose} sx={{ textTransform: 'none', fontWeight: 700, color: PURPLE }}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
