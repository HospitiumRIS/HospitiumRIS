'use client';

import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  LinearProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Search as SearchIcon
} from '@mui/icons-material';
import SearchResultsDialog from '../SearchResultsDialog';
import PublicationPreviewDialog from '../PublicationPreviewDialog';
import { importFromCrossref } from '../../../services/crossrefService';

const DoiImport = ({ onImportSuccess, color = '#8b6cbc' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [previewPublication, setPreviewPublication] = useState(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter a search term or DOI',
        severity: 'warning'
      });
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // Real Crossref API call
      const result = await importFromCrossref(searchQuery.trim(), 50);
      
      if (result.type === 'single') {
        // Direct DOI lookup - show single result in results dialog
        setSearchResults([result.data]);
        setResultsDialogOpen(true);
        setSnackbar({
          open: true,
          message: 'Found publication from DOI',
          severity: 'success'
        });
      } else if (result.data && result.data.length > 0) {
        // Search results - show multiple results
        setSearchResults(result.data);
        setResultsDialogOpen(true);
        setSnackbar({
          open: true,
          message: `Found ${result.data.length} publication(s) from Crossref`,
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'No publications found. Try different search terms or check the DOI.',
          severity: 'info'
        });
      }
    } catch (err) {
      console.error('Crossref search failed:', err);
      
      let errorMessage = 'Search failed';
      // More specific error messages
      if (err.message.includes('Publication not found')) {
        errorMessage = 'Publication not found for this DOI. Please check the DOI and try again.';
      } else if (err.message.includes('Crossref search failed')) {
        errorMessage = 'Crossref service is temporarily unavailable. Please try again later.';
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
  }, [searchQuery]);

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

  const handleQueryChange = useCallback((event) => {
    const value = event.target.value;
    setSearchQuery(value);
    if (error) setError(null);
  }, [error]);

  const handleKeyPress = useCallback((event) => {
    if (event.key === 'Enter' && !loading && searchQuery.trim()) {
      handleSearch();
    }
  }, [handleSearch, loading, searchQuery]);

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

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h6" gutterBottom>
        Search Crossref Database
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Search the Crossref database with keywords, author names, or enter a specific DOI to find relevant publications.
      </Typography>


      <TextField
        fullWidth
        label="Search Query or DOI"
        placeholder="Enter keywords, author names, or DOI (e.g., 10.1038/nature12373)"
        value={searchQuery}
        onChange={handleQueryChange}
        onKeyPress={handleKeyPress}
        disabled={loading}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: <SearchIcon sx={{ mr: 1, color: '#8b6cbc' }} />
        }}
        helperText="Use specific terms for better results or enter a DOI for exact lookup"
      />

      {loading && <LinearProgress sx={{ mb: 2, '& .MuiLinearProgress-bar': { bgcolor: '#8b6cbc' } }} />}

      <Button
        variant="contained"
        onClick={handleSearch}
        disabled={loading || !searchQuery.trim()}
        sx={{ 
          bgcolor: '#8b6cbc', 
          '&:hover': { 
            bgcolor: '#7559a3' 
          },
          '&:disabled': {
            bgcolor: '#cccccc'
          }
        }}
      >
        {loading ? 'Searching...' : 'Search Crossref'}
      </Button>

      {/* Search Results Dialog */}
      <SearchResultsDialog
        open={resultsDialogOpen}
        onClose={handleCloseResults}
        results={searchResults}
        onPreview={handlePreviewResult}
        loading={loading}
        title="Crossref Search Results"
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

export default React.memo(DoiImport);
