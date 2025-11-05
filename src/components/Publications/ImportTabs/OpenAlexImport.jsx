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
import { importFromOpenAlex } from '../../../services/openAlexService';

const OpenAlexImport = ({ onImportSuccess, color = '#2563eb' }) => {
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
      // Real OpenAlex API call
      const result = await importFromOpenAlex(searchQuery.trim(), 50);
      
      if (result.data && result.data.length > 0) {
        setSearchResults(result.data);
        setResultsDialogOpen(true);
        setSnackbar({
          open: true,
          message: `Found ${result.data.length} publication(s) from OpenAlex`,
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'No publications found for this search term. Try different keywords.',
          severity: 'info'
        });
      }
    } catch (err) {
      console.error('OpenAlex search failed:', err);
      
      let errorMessage = 'Search failed';
      // More specific error messages
      if (err.message.includes('Search query is required')) {
        errorMessage = 'Please enter search terms.';
      } else if (err.message.includes('OpenAlex search failed')) {
        errorMessage = 'OpenAlex service is temporarily unavailable. Please try again later.';
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
        Search OpenAlex Database
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Search the OpenAlex comprehensive scholarly knowledge graph with keywords, author names, or research topics to find relevant publications.
      </Typography>


      <TextField
        fullWidth
        label="Search Query"
        placeholder="Enter keywords, author names, or research topics"
        value={searchQuery}
        onChange={handleQueryChange}
        onKeyPress={handleKeyPress}
        disabled={loading}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: <SearchIcon sx={{ mr: 1, color: '#8b6cbc' }} />
        }}
        helperText="Use specific terms for better results - includes open access and citation data"
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
        {loading ? 'Searching...' : 'Search OpenAlex'}
      </Button>

      {/* Search Results Dialog */}
      <SearchResultsDialog
        open={resultsDialogOpen}
        onClose={handleCloseResults}
        results={searchResults}
        onPreview={handlePreviewResult}
        loading={loading}
        title="OpenAlex Search Results"
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

export default React.memo(OpenAlexImport);
