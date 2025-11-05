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
import { searchAndFormatPubMed } from '../../../services/pubmedService';

const PubMedImport = ({ onImportSuccess, color = '#326295' }) => {
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
        message: 'Please enter search terms',
        severity: 'warning'
      });
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // Real PubMed API call
      const publications = await searchAndFormatPubMed(searchQuery.trim(), 50);
      
      if (publications && publications.length > 0) {
        setSearchResults(publications);
        setResultsDialogOpen(true);
        setSnackbar({
          open: true,
          message: `Found ${publications.length} publication(s) from PubMed`,
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'No publications found for this search term.',
          severity: 'info'
        });
      }
    } catch (err) {
      console.error('PubMed search failed:', err);
      
      let errorMessage = 'Search failed';
      // More specific error messages
      if (err.message.includes('No publications found')) {
        errorMessage = 'No publications found for this search term. Try different keywords.';
      } else if (err.message.includes('PubMed search failed')) {
        errorMessage = 'PubMed service is temporarily unavailable. Please try again later.';
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

  const handleCloseResults = useCallback(() => {
    setResultsDialogOpen(false);
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewDialogOpen(false);
    setPreviewPublication(null);
  }, []);

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

  const handleCloseSnackbar = useCallback((event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h6" gutterBottom>
        Search PubMed Database
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Search the PubMed database with keywords, author names, or specific terms to find relevant publications.
      </Typography>


      <TextField
        fullWidth
        label="Search Query"
        placeholder="Enter keywords, author names, or terms"
        value={searchQuery}
        onChange={handleQueryChange}
        onKeyPress={handleKeyPress}
        disabled={loading}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: <SearchIcon sx={{ mr: 1, color: '#8b6cbc' }} />
        }}
        helperText="Use specific terms for better results"
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
        {loading ? 'Searching...' : 'Search PubMed'}
      </Button>

      {/* Search Results Dialog */}
      <SearchResultsDialog
        open={resultsDialogOpen}
        onClose={handleCloseResults}
        results={searchResults}
        onPreview={handlePreviewResult}
        loading={loading}
        title="PubMed Search Results"
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

export default React.memo(PubMedImport);
