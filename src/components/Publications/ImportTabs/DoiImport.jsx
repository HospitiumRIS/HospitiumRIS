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
  const [keywords, setKeywords] = useState('');
  const [author, setAuthor] = useState('');
  const [year, setYear] = useState('');
  const [journal, setJournal] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [previewPublication, setPreviewPublication] = useState(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleSearch = useCallback(async () => {
    // Check if at least one field is filled
    if (!keywords.trim() && !author.trim() && !year.trim() && !journal.trim() && !title.trim() && !searchQuery.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter at least one search term',
        severity: 'warning'
      });
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // Build search query from fields
      let query = searchQuery.trim();
      
      // If specific fields are filled, build a structured query
      if (!query && (keywords || author || year || journal || title)) {
        const parts = [];
        if (keywords) parts.push(keywords);
        if (author) parts.push(author);
        if (title) parts.push(title);
        if (journal) parts.push(journal);
        if (year) parts.push(year);
        query = parts.join(' ');
      }
      
      // Real Crossref API call
      const result = await importFromCrossref(query, 500);
      
      if (result.type === 'single') {
        // Direct DOI lookup - show single result in results dialog
        setSearchResults([result.data]);
        setResultsDialogOpen(true);
      } else if (result.data && result.data.length > 0) {
        // Search results - show multiple results
        setSearchResults(result.data);
        setResultsDialogOpen(true);
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
  }, [searchQuery, keywords, author, year, journal, title]);

  const handlePreviewResult = useCallback((result) => {
    setPreviewPublication(result);
    setPreviewDialogOpen(true);
    setResultsDialogOpen(false);
  }, []);

  const handleImportPublication = useCallback(async (publication, libraryId = null, folderIds = []) => {
    setImporting(true);
    try {
      const response = await fetch('/api/publications/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publication }),
      });

      // Check for duplicate publication (409 Conflict)
      if (response.status === 409) {
        const errorData = await response.json();
        setSnackbar({
          open: true,
          message: `${errorData.message || 'This publication already exists in your library'}`,
          severity: 'info'
        });
        
        // Close dialogs and don't proceed with import
        setPreviewDialogOpen(false);
        setResultsDialogOpen(false);
        setImporting(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import publication');
      }

      const data = await response.json();
      // API returns publications array, get the first one's ID
      const importedPublicationId = data.publications?.[0]?.id;
      
      // Add publication to all selected folders
      const foldersToAdd = folderIds.length > 0 ? folderIds : (libraryId ? [libraryId] : []);
      
      if (foldersToAdd.length > 0 && importedPublicationId) {
        let libraryAddSuccessCount = 0;
        let libraryAddFailCount = 0;
        
        for (const folderId of foldersToAdd) {
          try {
            const libraryResponse = await fetch('/api/publications/library', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                action: 'addPublication',
                folderId: folderId,
                publicationId: importedPublicationId
              }),
            });

            if (!libraryResponse.ok) {
              libraryAddFailCount++;
            } else {
              libraryAddSuccessCount++;
            }
          } catch (libraryError) {
            libraryAddFailCount++;
          }
        }
        
        // Show appropriate message based on results
        if (libraryAddFailCount > 0 && libraryAddSuccessCount === 0) {
          setSnackbar({
            open: true,
            message: `Publication imported but failed to add to ${libraryAddFailCount} folder(s)`,
            severity: 'warning'
          });
        } else if (libraryAddFailCount > 0) {
          setSnackbar({
            open: true,
            message: `Successfully imported "${publication.title}" and added to ${libraryAddSuccessCount} folder(s), ${libraryAddFailCount} failed`,
            severity: 'warning'
          });
        } else {
          setSnackbar({
            open: true,
            message: `Successfully imported "${publication.title}" and added to ${libraryAddSuccessCount} folder(s)`,
            severity: 'success'
          });
        }
      } else {
        // Show success message without library
        setSnackbar({
          open: true,
          message: `Successfully imported "${publication.title}"`,
          severity: 'success'
        });
      }
      
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

  const handleKeyPress = useCallback((event) => {
    if (event.key === 'Enter' && !loading) {
      handleSearch();
    }
  }, [handleSearch, loading]);

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
    <Box sx={{ maxWidth: 800 }}>
      <Typography variant="h6" gutterBottom>
        Search Crossref Database
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Fill in one or more fields to search the Crossref database. All fields will be combined with AND logic.
      </Typography>

      {/* Keywords Field */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="Keywords"
          placeholder="e.g., diabetes, treatment, intervention"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: '#8b6cbc' }} />
          }}
          helperText="General keywords or terms to search for"
        />
      </Box>

      {/* Author Field */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="Author"
          placeholder="Author name (last name and initials)"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
          helperText="Author name (last name and initials)"
        />
      </Box>

      {/* Year and Journal Fields */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Year"
          placeholder="Publication year or range"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
          sx={{ flex: 1 }}
          helperText="Publication year or range"
        />
        <TextField
          label="Journal"
          placeholder="Journal name"
          value={journal}
          onChange={(e) => setJournal(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
          sx={{ flex: 1 }}
          helperText="Journal name"
        />
      </Box>

      {/* Title Field */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="Title"
          placeholder="Words or phrases in the title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
          helperText="Words or phrases in the title"
        />
      </Box>

      {/* DOI Field */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="DOI (Direct Lookup)"
          placeholder="e.g., 10.1038/nature12373"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
          helperText="Enter a specific DOI for exact lookup (overrides other fields)"
        />
      </Box>

      {loading && <LinearProgress sx={{ mb: 2, '& .MuiLinearProgress-bar': { bgcolor: '#8b6cbc' } }} />}

      <Button
        variant="contained"
        onClick={handleSearch}
        disabled={loading}
        startIcon={<SearchIcon />}
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
