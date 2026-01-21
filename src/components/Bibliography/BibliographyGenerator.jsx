'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  AutoStories as BibliographyIcon,
  SortByAlpha as SortIcon,
  FormatListNumbered as NumberedIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Description as DescriptionIcon,
  FormatQuote as FormatQuoteIcon
} from '@mui/icons-material';
import { formatCitationAPA, formatCitationMLA, formatCitationChicago } from '@/utils/citationFormatters';

const BibliographyGenerator = ({ 
  open, 
  onClose, 
  onInsert, 
  manuscriptId,
  title = "Bibliography Generator" 
}) => {
  // State
  const [citations, setCitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const [citationStyle, setCitationStyle] = useState('APA');
  const [sortOrder, setSortOrder] = useState('alphabetical');
  const [includeAllSources, setIncludeAllSources] = useState(true);
  const [selectedSources, setSelectedSources] = useState(new Set());

  // Fetch manuscript citations function
  const fetchCitations = async (showSuccessMessage = false) => {
    if (!manuscriptId) {
      setError('Manuscript ID is required. Please ensure you are editing a valid manuscript.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setRefreshSuccess(false);
    
    try {
      const response = await fetch(`/api/manuscripts/${manuscriptId}/citations`);
      const data = await response.json();
      
      if (data.success) {
        setCitations(data.citations || []);
        // Initialize all sources as selected
        setSelectedSources(new Set(data.citations?.map(c => c.id) || []));
        
        if (showSuccessMessage) {
          setRefreshSuccess(true);
          // Clear success message after 3 seconds
          setTimeout(() => setRefreshSuccess(false), 3000);
        }
      } else {
        setError(data.error || 'Failed to fetch citations');
      }
    } catch (err) {
      console.error('Error fetching citations:', err);
      setError('Failed to connect to database. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch citations when dialog opens
  useEffect(() => {
    if (open && manuscriptId) {
      fetchCitations();
    }
  }, [open, manuscriptId]);

  // Refresh citations function
  const handleRefresh = () => {
    fetchCitations(true); // Show success message on manual refresh
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!open) return;
      
      // F5 or Ctrl+R for refresh
      if (event.key === 'F5' || (event.ctrlKey && event.key === 'r')) {
        event.preventDefault();
        handleRefresh();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open]);

  // Process citations based on filters and sorting
  const processedCitations = useMemo(() => {
    if (!citations || citations.length === 0) return [];
    
    let filtered = [...citations];
    
    // Filter by selected sources if not including all
    if (!includeAllSources) {
      filtered = filtered.filter(citation => selectedSources.has(citation.id));
    }
    
    // Sort citations
    filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'alphabetical':
          // Sort by first author's last name, then by title
          const authorA = a.authors && a.authors.length > 0 ? a.authors[0] : '';
          const authorB = b.authors && b.authors.length > 0 ? b.authors[0] : '';
          const lastNameA = authorA.split(' ').pop() || '';
          const lastNameB = authorB.split(' ').pop() || '';
          
          if (lastNameA !== lastNameB) {
            return lastNameA.localeCompare(lastNameB);
          }
          return (a.title || '').localeCompare(b.title || '');
          
        case 'chronological':
          // Sort by year (newest first)
          return (b.year || 0) - (a.year || 0);
          
        case 'reverse-chronological':
          // Sort by year (oldest first)
          return (a.year || 0) - (b.year || 0);
          
        case 'citation-count':
          // Sort by how many times cited in manuscript
          return (b.citationCount || 0) - (a.citationCount || 0);
          
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [citations, sortOrder, includeAllSources, selectedSources]);

  // Generate formatted bibliography
  const formattedBibliography = useMemo(() => {
    if (!processedCitations || processedCitations.length === 0) return '';
    
    const formatter = {
      'APA': formatCitationAPA,
      'MLA': formatCitationMLA,
      'Chicago': formatCitationChicago
    }[citationStyle] || formatCitationAPA;
    
    const formattedEntries = processedCitations.map(citation => {
      return formatter(citation, 'bibliography');
    });
    
    return `References\n\n${formattedEntries.join('\n\n')}`;
  }, [processedCitations, citationStyle]);

  // Toggle source selection
  const toggleSourceSelection = (citationId) => {
    const newSelected = new Set(selectedSources);
    if (newSelected.has(citationId)) {
      newSelected.delete(citationId);
    } else {
      newSelected.add(citationId);
    }
    setSelectedSources(newSelected);
  };

  // Handle insert bibliography
  const handleInsert = () => {
    if (onInsert && formattedBibliography) {
      onInsert(formattedBibliography);
      onClose();
    }
  };

  // Reset state when dialog closes
  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { 
          height: '85vh',
          maxHeight: '900px',
          borderRadius: 3,
          boxShadow: '0 24px 80px rgba(139, 108, 188, 0.15)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogContent sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ 
          background: 'linear-gradient(135deg, #8b6cbc 0%, #9d7ec9 100%)',
          p: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(139, 108, 188, 0.15)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BibliographyIcon sx={{ fontSize: 28, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
                {title}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.875rem' }}>
                Generate formatted bibliography
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              label={citationStyle} 
              size="small"
              sx={{ 
                bgcolor: 'rgba(255, 255, 255, 0.25)',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.75rem'
              }}
            />
            <IconButton 
              onClick={handleClose}
              size="small"
              sx={{ 
                color: 'white',
                bgcolor: 'rgba(255, 255, 255, 0.15)',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Stats Bar */}
        <Box sx={{ 
          px: 3, 
          py: 2, 
          bgcolor: '#f8f9fa',
          borderBottom: '1px solid #e9ecef',
          display: 'flex',
          gap: 3,
          alignItems: 'center'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              bgcolor: '#8b6cbc15',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FormatQuoteIcon sx={{ fontSize: 20, color: '#8b6cbc' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem', color: '#2d3748' }}>
                {citations.length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#718096', fontSize: '0.75rem' }}>
                Total Sources
              </Typography>
            </Box>
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              bgcolor: '#10b98115',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <DescriptionIcon sx={{ fontSize: 20, color: '#10b981' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem', color: '#2d3748' }}>
                {processedCitations.length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#718096', fontSize: '0.75rem' }}>
                Selected
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, overflow: 'hidden', flex: 1, p: 3 }}>
        {/* Settings Panel */}
        <Paper sx={{ 
          width: 320, 
          p: 3, 
          height: 'fit-content',
          borderRadius: 2.5,
          border: '1px solid #e9ecef',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#2d3748', mb: 2, fontSize: '1.125rem' }}>
            Settings
          </Typography>
          
          {/* Citation Style */}
          <FormControl fullWidth margin="normal">
            <InputLabel sx={{ color: '#64748b' }}>Citation Style</InputLabel>
            <Select
              value={citationStyle}
              label="Citation Style"
              onChange={(e) => setCitationStyle(e.target.value)}
              sx={{
                borderRadius: 2,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#e2e8f0'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#8b6cbc'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#8b6cbc'
                }
              }}
            >
              <MenuItem value="APA">APA 7th Edition</MenuItem>
              <MenuItem value="MLA">MLA 9th Edition</MenuItem>
              <MenuItem value="Chicago">Chicago 17th Edition</MenuItem>
            </Select>
          </FormControl>
          
          {/* Sort Order */}
          <FormControl fullWidth margin="normal">
            <InputLabel sx={{ color: '#64748b' }}>Sort Order</InputLabel>
            <Select
              value={sortOrder}
              label="Sort Order"
              onChange={(e) => setSortOrder(e.target.value)}
              sx={{
                borderRadius: 2,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#e2e8f0'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#8b6cbc'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#8b6cbc'
                }
              }}
            >
              <MenuItem value="alphabetical">Alphabetical</MenuItem>
              <MenuItem value="chronological">Chronological (Newest)</MenuItem>
              <MenuItem value="reverse-chronological">Chronological (Oldest)</MenuItem>
              <MenuItem value="citation-count">Citation Count</MenuItem>
            </Select>
          </FormControl>
          
          {/* Include All Sources */}
          <FormControlLabel
            control={
              <Switch
                checked={includeAllSources}
                onChange={(e) => setIncludeAllSources(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#8b6cbc'
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#8b6cbc'
                  }
                }}
              />
            }
            label={<Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#2d3748' }}>Include all sources</Typography>}
            sx={{ mt: 2.5 }}
          />
          
          {/* Cited Sources */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 3, mb: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2d3748', fontSize: '0.875rem' }}>
              Cited Sources ({citations.length})
            </Typography>
            <Tooltip title="Refresh citation list (F5 or Ctrl+R)">
              <IconButton 
                size="small" 
                onClick={handleRefresh}
                disabled={loading}
                sx={{ 
                  color: loading ? '#94a3b8' : '#8b6cbc',
                  '&:hover': { 
                    bgcolor: '#8b6cbc10',
                    color: '#8b6cbc'
                  }
                }}
              >
                <RefreshIcon 
                  fontSize="small" 
                  sx={{ 
                    animation: loading ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' }
                    }
                  }}
                />
              </IconButton>
            </Tooltip>
          </Box>
          
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} sx={{ color: '#8b6cbc' }} />
            </Box>
          )}
          
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 2 }}
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          )}

          {refreshSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Citation list refreshed successfully!
            </Alert>
          )}
          
          {citations.length > 0 && (
            <List dense sx={{ 
              maxHeight: 200, 
              overflow: 'auto',
              bgcolor: '#f8f9fa',
              borderRadius: 2,
              p: 0.5
            }}>
              {citations.map((citation) => (
                <ListItem
                  key={citation.id}
                  component={!includeAllSources ? "button" : "li"}
                  onClick={() => !includeAllSources && toggleSourceSelection(citation.id)}
                  sx={{ 
                    px: 1,
                    py: 0.75,
                    borderRadius: 1.5,
                    mb: 0.5,
                    opacity: includeAllSources || selectedSources.has(citation.id) ? 1 : 0.5,
                    cursor: !includeAllSources ? 'pointer' : 'default',
                    bgcolor: 'white',
                    '&:hover': !includeAllSources ? {
                      bgcolor: '#8b6cbc10'
                    } : {}
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 24 }}>
                    <NumberedIcon 
                      fontSize="small" 
                      sx={{ color:
                        includeAllSources || selectedSources.has(citation.id) 
                          ? '#8b6cbc' 
                          : '#cbd5e0'
                      }} 
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={citation.title}
                    secondary={`${citation.authors?.[0] || 'Unknown'} (${citation.year || 'N/A'})`}
                    primaryTypographyProps={{ 
                      variant: 'body2',
                      sx: { 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontWeight: 600,
                        fontSize: '0.8125rem',
                        color: '#2d3748'
                      }
                    }}
                    secondaryTypographyProps={{ 
                      variant: 'caption',
                      sx: {
                        fontSize: '0.75rem',
                        color: '#64748b'
                      }
                    }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
        
        {/* Preview Panel */}
        <Paper sx={{ 
          flex: 1, 
          p: 3, 
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: 2.5,
          border: '1px solid #e9ecef',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#2d3748', mb: 2, fontSize: '1.125rem' }}>
            Preview
          </Typography>
          
          {formattedBibliography ? (
            <Box 
              sx={{ 
                flex: 1,
                overflow: 'auto',
                bgcolor: '#f8f9fa',
                p: 3,
                borderRadius: 2,
                border: '1px solid #e9ecef',
                fontFamily: 'Georgia, serif',
                fontSize: '0.9375rem',
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
                color: '#2d3748'
              }}
            >
              {formattedBibliography}
            </Box>
          ) : (
            <Box 
              sx={{ 
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 1,
                color: '#94a3b8'
              }}
            >
              <BibliographyIcon sx={{ fontSize: 48, color: '#cbd5e0' }} />
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                No citations available for bibliography
              </Typography>
            </Box>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip 
              label={`${processedCitations.length} sources`}
              size="small"
              sx={{
                bgcolor: '#8b6cbc15',
                color: '#8b6cbc',
                fontWeight: 600,
                fontSize: '0.75rem',
                border: 'none'
              }}
            />
            <Chip 
              label={`${citationStyle} format`}
              size="small"
              sx={{
                bgcolor: '#f1f5f9',
                color: '#64748b',
                fontWeight: 500,
                fontSize: '0.75rem',
                border: 'none'
              }}
            />
            <Chip 
              label={`${sortOrder.replace('-', ' ')} order`}
              size="small"
              sx={{
                bgcolor: '#f1f5f9',
                color: '#64748b',
                fontWeight: 500,
                fontSize: '0.75rem',
                border: 'none'
              }}
            />
            {refreshSuccess && (
              <Chip 
                icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                label="Updated"
                size="small"
                sx={{
                  bgcolor: '#10b98115',
                  color: '#10b981',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  animation: 'fadeIn 0.3s ease-in'
                }}
              />
            )}
          </Box>
        </Paper>
        </Box>

        {/* Footer */}
        <Box sx={{ 
          p: 3, 
          borderTop: '1px solid #e9ecef',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: '#f8f9fa'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
              {loading ? 'Loading...' : `${processedCitations.length} of ${citations.length} sources selected`}
            </Typography>
            {!loading && citations.length > 0 && (
              <Chip
                icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                label="Ready"
                size="small"
                sx={{
                  height: 24,
                  bgcolor: '#10b98115',
                  color: '#10b981',
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button 
              onClick={handleClose}
              variant="outlined"
              sx={{ 
                textTransform: 'none',
                borderColor: '#e2e8f0',
                color: '#64748b',
                fontWeight: 600,
                borderRadius: 2,
                '&:hover': {
                  borderColor: '#8b6cbc',
                  color: '#8b6cbc',
                  bgcolor: '#8b6cbc05'
                }
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained"
              onClick={handleInsert}
              disabled={!formattedBibliography || processedCitations.length === 0}
              startIcon={<BibliographyIcon />}
              sx={{
                textTransform: 'none',
                bgcolor: '#8b6cbc',
                fontWeight: 600,
                borderRadius: 2,
                px: 3,
                boxShadow: '0 2px 8px rgba(139, 108, 188, 0.25)',
                '&:hover': { 
                  bgcolor: '#7a5ba8',
                  boxShadow: '0 4px 12px rgba(139, 108, 188, 0.35)'
                },
                '&:disabled': {
                  bgcolor: '#e2e8f0',
                  color: '#94a3b8'
                }
              }}
            >
              Insert Bibliography
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default BibliographyGenerator;
