'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Button,
  TextField,
  Box,
  Typography,
  Switch,
  Chip,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Close as CloseIcon,
  MenuBook as BookIcon,
  FormatQuote as QuoteIcon,
  Person as PersonIcon,
  Numbers as NumbersIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';

const PREFIX_SUGGESTIONS = ['see', 'cf.', 'see also', 'in', 'cited in'];
const SUFFIX_SUGGESTIONS = ['emphasis added', 'my translation', 'and elsewhere', 'passim'];

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    fontSize: '0.9rem',
    '&:hover fieldset': { borderColor: '#8b6cbc' },
    '&.Mui-focused fieldset': { borderColor: '#8b6cbc', borderWidth: 2 },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: '#8b6cbc' },
};

export default function EditCitationDialog({ 
  open, 
  onClose, 
  citation, 
  onSave,
  currentStyle = 'APA'
}) {
  const [pageNumbers, setPageNumbers] = useState('');
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [suppressAuthor, setSuppressAuthor] = useState(false);

  useEffect(() => {
    if (open && citation) {
      setPageNumbers(citation.pageNumbers || '');
      setPrefix(citation.prefix || '');
      setSuffix(citation.suffix || '');
      setSuppressAuthor(citation.suppressAuthor || false);
    }
  }, [open, citation]);

  const handleSave = () => {
    onSave({
      pageNumbers: pageNumbers.trim(),
      prefix: prefix.trim(),
      suffix: suffix.trim(),
      suppressAuthor,
    });
    onClose();
  };

  if (!citation) return null;

  // Build formatted preview parts
  const authorDisplay = (() => {
    const authors = Array.isArray(citation.authors) ? citation.authors : [];
    if (!authors.length) return 'Author';
    const first = typeof authors[0] === 'string' ? authors[0].split(',')[0] : 'Author';
    return authors.length > 2 ? `${first} et al.` : first;
  })();

  const generatePreview = () => {
    let inner = '';
    if (prefix) inner += `${prefix} `;
    inner += suppressAuthor ? (citation.year || '2020') : `${authorDisplay}, ${citation.year || '2020'}`;
    if (pageNumbers) {
      if (currentStyle === 'APA') inner += `, p. ${pageNumbers}`;
      else if (currentStyle === 'MLA') inner += ` ${pageNumbers}`;
      else inner += `, ${pageNumbers}`;
    }
    if (suffix) inner += ` ${suffix}`;
    return `(${inner})`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
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
      {/* Header */}
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

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: '10px',
            bgcolor: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <QuoteIcon sx={{ color: '#fff', fontSize: '1.2rem' }} />
          </Box>
          <Box>
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.2 }}>
              Edit Citation
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.75rem' }}>
              {currentStyle} style
            </Typography>
          </Box>
        </Box>

        {/* Source card */}
        <Box sx={{
          bgcolor: 'rgba(255,255,255,0.15)',
          borderRadius: '10px',
          p: 1.5,
          backdropFilter: 'blur(8px)',
        }}>
          <Typography sx={{
            color: '#fff', fontWeight: 600, fontSize: '0.85rem',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {citation.title || 'Untitled Source'}
          </Typography>
          {authorDisplay && (
            <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', mt: 0.5 }}>
              {authorDisplay}{citation.year ? ` · ${citation.year}` : ''}
            </Typography>
          )}
        </Box>
      </Box>

      <DialogContent sx={{ px: 3, pt: 2.5, pb: 0 }}>

        {/* Live Preview */}
        <Box sx={{
          bgcolor: 'rgba(139,108,188,0.05)',
          border: '1.5px solid rgba(139,108,188,0.2)',
          borderRadius: '12px',
          p: 2,
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}>
          <CheckIcon sx={{ color: '#8b6cbc', fontSize: '1.1rem', flexShrink: 0 }} />
          <Box>
            <Typography sx={{ fontSize: '0.7rem', color: '#8b6cbc', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.25 }}>
              Preview
            </Typography>
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: '#2d3748', fontFamily: 'Georgia, serif' }}>
              {generatePreview()}
            </Typography>
          </Box>
        </Box>

        {/* Page Numbers */}
        <Box sx={{ mb: 2.5 }}>
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#4a5568', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Page Number(s)
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="e.g., 42 or 42–45"
            value={pageNumbers}
            onChange={(e) => setPageNumbers(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <NumbersIcon sx={{ fontSize: '1rem', color: '#8b6cbc' }} />
                </InputAdornment>
              ),
            }}
            sx={fieldSx}
          />
          {/* Quick chips */}
          <Box sx={{ display: 'flex', gap: 0.75, mt: 1, flexWrap: 'wrap' }}>
            {['Single page', 'Range (e.g., 42–45)'].map((hint) => (
              <Typography key={hint} sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                {hint}
              </Typography>
            ))}
          </Box>
        </Box>

        {/* Prefix */}
        <Box sx={{ mb: 2.5 }}>
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#4a5568', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Prefix
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="e.g., see, cf."
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <BookIcon sx={{ fontSize: '1rem', color: '#8b6cbc' }} />
                </InputAdornment>
              ),
            }}
            sx={fieldSx}
          />
          <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
            {PREFIX_SUGGESTIONS.map((s) => (
              <Chip
                key={s}
                label={s}
                size="small"
                onClick={() => setPrefix(s)}
                sx={{
                  height: 22, fontSize: '0.7rem', cursor: 'pointer',
                  bgcolor: prefix === s ? 'rgba(139,108,188,0.12)' : '#f8f9fa',
                  color: prefix === s ? '#7c5cb5' : '#64748b',
                  border: prefix === s ? '1px solid rgba(139,108,188,0.3)' : '1px solid #e2e8f0',
                  '&:hover': { bgcolor: 'rgba(139,108,188,0.1)', color: '#7c5cb5' },
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Suffix */}
        <Box sx={{ mb: 2.5 }}>
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#4a5568', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Suffix
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="e.g., emphasis added"
            value={suffix}
            onChange={(e) => setSuffix(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <QuoteIcon sx={{ fontSize: '1rem', color: '#8b6cbc' }} />
                </InputAdornment>
              ),
            }}
            sx={fieldSx}
          />
          <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
            {SUFFIX_SUGGESTIONS.map((s) => (
              <Chip
                key={s}
                label={s}
                size="small"
                onClick={() => setSuffix(s)}
                sx={{
                  height: 22, fontSize: '0.7rem', cursor: 'pointer',
                  bgcolor: suffix === s ? 'rgba(139,108,188,0.12)' : '#f8f9fa',
                  color: suffix === s ? '#7c5cb5' : '#64748b',
                  border: suffix === s ? '1px solid rgba(139,108,188,0.3)' : '1px solid #e2e8f0',
                  '&:hover': { bgcolor: 'rgba(139,108,188,0.1)', color: '#7c5cb5' },
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Suppress Author Toggle */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: suppressAuthor ? 'rgba(139,108,188,0.06)' : '#f8fafc',
          border: suppressAuthor ? '1.5px solid rgba(139,108,188,0.2)' : '1.5px solid #e2e8f0',
          borderRadius: '12px',
          px: 2, py: 1.5,
          mb: 2.5,
          transition: 'all 0.2s ease',
          cursor: 'pointer',
        }}
          onClick={() => setSuppressAuthor(!suppressAuthor)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 32, height: 32,
              borderRadius: '8px',
              bgcolor: suppressAuthor ? 'rgba(139,108,188,0.12)' : '#f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <PersonIcon sx={{ fontSize: '1rem', color: suppressAuthor ? '#8b6cbc' : '#94a3b8' }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: suppressAuthor ? '#7c5cb5' : '#2d3748' }}>
                Suppress Author
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Show only year — e.g., "As Smith argues (2020)"
              </Typography>
            </Box>
          </Box>
          <Switch
            checked={suppressAuthor}
            onChange={(e) => { e.stopPropagation(); setSuppressAuthor(e.target.checked); }}
            size="small"
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': { color: '#8b6cbc' },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#8b6cbc' },
            }}
          />
        </Box>

      </DialogContent>

      {/* Footer */}
      <Box sx={{
        px: 3, py: 2.5,
        display: 'flex',
        gap: 1.5,
        justifyContent: 'flex-end',
        borderTop: '1px solid #f1f5f9',
      }}>
        <Button
          onClick={onClose}
          sx={{
            borderRadius: '10px',
            color: '#64748b',
            border: '1.5px solid #e2e8f0',
            px: 2.5,
            fontWeight: 600,
            fontSize: '0.85rem',
            '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          sx={{
            borderRadius: '10px',
            px: 3,
            fontWeight: 600,
            fontSize: '0.85rem',
            background: 'linear-gradient(135deg, #8b6cbc 0%, #a78bda 100%)',
            boxShadow: '0 4px 12px rgba(139,108,188,0.35)',
            '&:hover': {
              background: 'linear-gradient(135deg, #7a5cac 0%, #9678ca 100%)',
              boxShadow: '0 6px 16px rgba(139,108,188,0.45)',
            },
          }}
        >
          Apply Changes
        </Button>
      </Box>
    </Dialog>
  );
}
