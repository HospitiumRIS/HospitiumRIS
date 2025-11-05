'use client';

import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  LinearProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Divider,
  Snackbar
} from '@mui/material';
import {
  Search as SearchIcon,
  Public as PublicIcon,
  School as SchoolIcon,
  Science as ScienceIcon,
  LibraryBooks as LibraryIcon
} from '@mui/icons-material';
import SearchResultsDialog from '../SearchResultsDialog';
import PublicationPreviewDialog from '../PublicationPreviewDialog';
import { searchResearch4Life, getResearch4LifePartners } from '../../../services/research4lifeService';

const Research4LifeImport = ({ onImportSuccess, color = '#8b6cbc' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartner, setSelectedPartner] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [previewPublication, setPreviewPublication] = useState(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const partners = getResearch4LifePartners();

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter search terms',
        severity: 'warning'
      });
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // Search Research4Life resources
      const publications = await searchResearch4Life(
        searchQuery.trim(), 
        50, 
        selectedPartner || null
      );
      
      if (publications && publications.length > 0) {
        setSearchResults(publications);
        setResultsDialogOpen(true);
        setSnackbar({
          open: true,
          message: `Found ${publications.length} publication(s) from Research4Life`,
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'No publications found for this search term. Try different keywords or check if your institution has access to Research4Life resources.',
          severity: 'info'
        });
      }
    } catch (err) {
      console.error('Research4Life search failed:', err);
      
      let errorMessage = 'Search failed';
      // More specific error messages
      if (err.message.includes('No publications found')) {
        errorMessage = 'No publications found for this search term. Try different keywords.';
      } else if (err.message.includes('Research4Life search failed')) {
        errorMessage = 'Research4Life service is temporarily unavailable. Please try again later.';
      } else if (err.message.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else {
        errorMessage = `Search failed: ${err.message}`;
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedPartner]);

  const handlePreviewResult = useCallback((result) => {
    setPreviewPublication(result);
    setPreviewDialogOpen(true);
    setResultsDialogOpen(false);
  }, []);

  const handleImportPublication = useCallback(async (publication) => {
    setImporting(true);
    try {
      const response = await fetch('/api/publications/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publication }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import publication');
      }

      const data = await response.json();
      
      // Show success message
      setSnackbar({
        open: true,
        message: `Successfully imported "${publication.title}"`,
        severity: 'success'
      });
      
      // Convert to format expected by ImportResults and notify parent
      onImportSuccess([publication]);
      
      // Close dialogs
      setPreviewDialogOpen(false);
      setResultsDialogOpen(false);
      
    } catch (error) {
      console.error('Import failed:', error);
      setSnackbar({
        open: true,
        message: `Import failed: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setImporting(false);
    }
  }, [onImportSuccess]);

  const handleCloseResults = useCallback(() => {
    setResultsDialogOpen(false);
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewDialogOpen(false);
    setPreviewPublication(null);
  }, []);

  const handleCloseSnackbar = useCallback((event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  const handleQueryChange = useCallback((event) => {
    const value = event.target.value;
    setSearchQuery(value);
    if (error) setError(null);
  }, [error]);

  const handlePartnerChange = useCallback((event) => {
    setSelectedPartner(event.target.value);
  }, []);

  const handleKeyPress = useCallback((event) => {
    if (event.key === 'Enter' && !loading && searchQuery.trim()) {
      handleSearch();
    }
  }, [handleSearch, loading, searchQuery]);

  const getPartnerIcon = (partnerName) => {
    switch (partnerName) {
      case 'PubMed':
        return <ScienceIcon />;
      case 'CrossRef':
        return <PublicIcon />;
      case 'OpenAlex':
        return <LibraryIcon />;
      case 'Directory of Open Access Journals':
        return <SchoolIcon />;
      default:
        return <PublicIcon />;
    }
  };

  return (
    <Box sx={{ maxWidth: 800 }}>
      <Typography variant="h6" gutterBottom sx={{ color: color }}>
        Search Research4Life Resources
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Research4Life provides free or low-cost access to scientific journals and books 
        to institutions in low- and middle-income countries. Search across multiple 
        partner databases to find accessible research publications.
      </Typography>

      {/* Research4Life Info Card */}
      <Card sx={{ mb: 3, bgcolor: '#fff3e0', border: `1px solid ${color}40` }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <img src="/R4L.png" alt="Research4Life" style={{ width: 32, height: 32, marginRight: 12 }} />
            <Typography variant="h6" sx={{ color: color }}>
              Research4Life Partnership
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Access to over 200,000 peer-reviewed journals, books, and databases from 
            leading publishers. Available to institutions in eligible countries.
          </Typography>
        </CardContent>
      </Card>


      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <TextField
            fullWidth
            label="Search Query"
            placeholder="Enter keywords, author names, or terms"
            value={searchQuery}
            onChange={handleQueryChange}
            onKeyPress={handleKeyPress}
            disabled={loading}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: color }} />
            }}
            helperText="Use specific terms for better results"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Partner Database</InputLabel>
            <Select
              value={selectedPartner}
              onChange={handlePartnerChange}
              label="Partner Database"
              disabled={loading}
            >
              <MenuItem value="">
                <em>All Partners</em>
              </MenuItem>
              {Object.entries(partners).map(([key, partner]) => (
                <MenuItem key={key} value={key}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {getPartnerIcon(partner.name)}
                    <Box sx={{ ml: 1 }}>
                      <Typography variant="body2">{partner.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {partner.description}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {loading && <LinearProgress sx={{ mb: 2, '& .MuiLinearProgress-bar': { bgcolor: color } }} />}

      <Button
        variant="contained"
        onClick={handleSearch}
        disabled={loading || !searchQuery.trim()}
        sx={{ 
          bgcolor: color, 
          '&:hover': { 
            bgcolor: '#7559a3' 
          },
          '&:disabled': {
            bgcolor: '#cccccc'
          }
        }}
      >
        {loading ? 'Searching Research4Life...' : 'Search Research4Life'}
      </Button>

      {/* Partner Information */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Available Partner Databases
        </Typography>
        <Grid container spacing={2}>
          {Object.entries(partners).map(([key, partner]) => (
            <Grid key={key} item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  height: '100%',
                  border: selectedPartner === key ? `2px solid ${color}` : '1px solid #e0e0e0',
                  '&:hover': {
                    boxShadow: 2
                  }
                }}
              >
                <CardActionArea onClick={() => setSelectedPartner(key)}>
                  <CardContent sx={{ textAlign: 'center', p: 2 }}>
                    <Box sx={{ color: color, mb: 1 }}>
                      {getPartnerIcon(partner.name)}
                    </Box>
                    <Typography variant="subtitle2" gutterBottom>
                      {partner.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {partner.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Search Results Dialog */}
      <SearchResultsDialog
        open={resultsDialogOpen}
        onClose={handleCloseResults}
        results={searchResults}
        onPreview={handlePreviewResult}
        loading={loading}
        title="Research4Life Search Results"
      />

      {/* Publication Preview Dialog */}
      <PublicationPreviewDialog
        open={previewDialogOpen}
        onClose={handleClosePreview}
        publication={previewPublication}
        onImport={handleImportPublication}
        importing={importing}
      />

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default React.memo(Research4LifeImport);
