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
  Refresh as RefreshIcon
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
    if (!manuscriptId) return;
    
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
        sx: { height: '80vh', display: 'flex', flexDirection: 'column' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <BibliographyIcon />
        {title}
        <Chip 
          label={citationStyle} 
          variant="filled" 
          color="primary" 
          size="small"
          sx={{ ml: 'auto' }}
        />
      </DialogTitle>
      
      <DialogContent sx={{ display: 'flex', gap: 2, overflow: 'hidden' }}>
        {/* Settings Panel */}
        <Paper sx={{ width: 300, p: 2, height: 'fit-content' }}>
          <Typography variant="h6" gutterBottom>
            Settings
          </Typography>
          
          {/* Citation Style */}
          <FormControl fullWidth margin="normal">
            <InputLabel>Citation Style</InputLabel>
            <Select
              value={citationStyle}
              label="Citation Style"
              onChange={(e) => setCitationStyle(e.target.value)}
            >
              <MenuItem value="APA">APA 7th Edition</MenuItem>
              <MenuItem value="MLA">MLA 9th Edition</MenuItem>
              <MenuItem value="Chicago">Chicago 17th Edition</MenuItem>
            </Select>
          </FormControl>
          
          {/* Sort Order */}
          <FormControl fullWidth margin="normal">
            <InputLabel>Sort Order</InputLabel>
            <Select
              value={sortOrder}
              label="Sort Order"
              onChange={(e) => setSortOrder(e.target.value)}
              startAdornment={<SortIcon sx={{ mr: 1, color: 'action.active' }} />}
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
              />
            }
            label="Include all sources"
            sx={{ mt: 2 }}
          />
          
          {/* Cited Sources */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2, mb: 1 }}>
            <Typography variant="subtitle2">
              Cited Sources ({citations.length})
            </Typography>
            <Tooltip title="Refresh citation list (F5 or Ctrl+R)">
              <IconButton 
                size="small" 
                onClick={handleRefresh}
                disabled={loading}
                sx={{ 
                  color: loading ? 'action.disabled' : 'primary.main',
                  '&:hover': { 
                    bgcolor: 'primary.main', 
                    color: 'white',
                    '& .MuiSvgIcon-root': {
                      transform: loading ? 'rotate(360deg)' : 'rotate(0deg)',
                      transition: 'transform 0.6s ease-in-out'
                    }
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
              <CircularProgress size={24} />
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
            <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
              {citations.map((citation) => (
                <ListItem
                  key={citation.id}
                  button={!includeAllSources}
                  onClick={() => !includeAllSources && toggleSourceSelection(citation.id)}
                  sx={{ 
                    px: 1,
                    opacity: includeAllSources || selectedSources.has(citation.id) ? 1 : 0.5 
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 20 }}>
                    <NumberedIcon 
                      fontSize="small" 
                      color={
                        includeAllSources || selectedSources.has(citation.id) 
                          ? 'primary' 
                          : 'disabled'
                      } 
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
                        whiteSpace: 'nowrap'
                      }
                    }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
        
        {/* Preview Panel */}
        <Paper sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" gutterBottom>
            Preview
          </Typography>
          
          {formattedBibliography ? (
            <Box 
              sx={{ 
                flex: 1,
                overflow: 'auto',
                bgcolor: 'grey.50',
                p: 2,
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap'
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
                color: 'text.secondary'
              }}
            >
              No citations available for bibliography
            </Box>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip 
              label={`${processedCitations.length} sources`}
              variant="outlined"
              size="small"
            />
            <Chip 
              label={`${citationStyle} format`}
              variant="outlined"
              size="small"
            />
            <Chip 
              label={`${sortOrder.replace('-', ' ')} order`}
              variant="outlined"
              size="small"
            />
            {refreshSuccess && (
              <Chip 
                label="✓ Updated"
                variant="filled"
                size="small"
                color="success"
                sx={{ animation: 'fadeIn 0.3s ease-in' }}
              />
            )}
          </Box>
        </Paper>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button 
          variant="contained"
          onClick={handleInsert}
          disabled={!formattedBibliography || processedCitations.length === 0}
          startIcon={<BibliographyIcon />}
        >
          Insert Bibliography
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BibliographyGenerator;
