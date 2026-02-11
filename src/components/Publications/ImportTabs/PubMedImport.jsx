'use client';

import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  LinearProgress,
  Alert,
  Snackbar,
  Chip,
  Stack,
  Paper,
  IconButton,
  Tooltip,
  Collapse
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import SearchResultsDialog from '../SearchResultsDialog';
import PublicationPreviewDialog from '../PublicationPreviewDialog';
import MultiPublicationPreviewDialog from '../MultiPublicationPreviewDialog';
import { searchAndFormatPubMed } from '../../../services/pubmedService';

const PubMedImport = ({ onImportSuccess, color = '#326295' }) => {
  const [searchFields, setSearchFields] = useState({
    keywords: '',
    author: '',
    year: '',
    journal: '',
    title: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [previewPublication, setPreviewPublication] = useState(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [multiPreviewPublications, setMultiPreviewPublications] = useState([]);
  const [multiPreviewDialogOpen, setMultiPreviewDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [totalCount, setTotalCount] = useState(0);
  const [currentQuery, setCurrentQuery] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [batchSize] = useState(100);

  const buildSearchQuery = useCallback(() => {
    const queryParts = [];
    
    if (searchFields.keywords.trim()) {
      queryParts.push(searchFields.keywords.trim());
    }
    if (searchFields.author.trim()) {
      queryParts.push(`${searchFields.author.trim()}[Author]`);
    }
    if (searchFields.year.trim()) {
      queryParts.push(`${searchFields.year.trim()}[Publication Date]`);
    }
    if (searchFields.journal.trim()) {
      queryParts.push(`${searchFields.journal.trim()}[Journal]`);
    }
    if (searchFields.title.trim()) {
      queryParts.push(`${searchFields.title.trim()}[Title]`);
    }
    
    return queryParts.join(' AND ');
  }, [searchFields]);

  const handleSearch = useCallback(async (isLoadMore = false) => {
    const queryToValidate = isLoadMore ? currentQuery : buildSearchQuery();
    
    if (!queryToValidate) {
      setSnackbar({
        open: true,
        message: 'Please enter at least one search field',
        severity: 'warning'
      });
      return;
    }
    
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
      setSearchResults([]);
      setTotalCount(0);
      setCurrentQuery(buildSearchQuery());
    }

    try {
      // Use functional update to get current length
      let startIndex = 0;
      if (isLoadMore) {
        setSearchResults(prev => {
          startIndex = prev.length;
          return prev;
        });
      }
      
      const queryToUse = queryToValidate;
      
      // Real PubMed API call with pagination
      const { publications, totalCount: total } = await searchAndFormatPubMed(queryToUse, batchSize, startIndex);
      
      if (publications && publications.length > 0) {
        let loadedCount = publications.length;
        let allResults = publications;
        
        if (isLoadMore) {
          setSearchResults(prev => {
            loadedCount = prev.length + publications.length;
            allResults = [...prev, ...publications];
            return allResults;
          });
        } else {
          setSearchResults(publications);
          setResultsDialogOpen(true);
          allResults = publications;
        }
        setTotalCount(total);
        
        setSnackbar({
          open: true,
          message: `Loaded ${loadedCount} of ${total} publication(s) from PubMed`,
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
      if (isLoadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [searchFields, currentQuery, batchSize, buildSearchQuery]);

  const handlePreviewResult = useCallback((result) => {
    setPreviewPublication(result);
    setPreviewDialogOpen(true);
  }, []);

  const handleImportPublication = useCallback(async (publication, libraryId = null) => {
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
      const importedPublicationId = data.publication?.id;
      
      // If library is selected, add publication to library
      if (libraryId && importedPublicationId) {
        console.log('Adding publication to library:', {
          libraryId,
          importedPublicationId,
          action: 'addPublication'
        });
        
        try {
          const libraryResponse = await fetch('/api/publications/library', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'addPublication',
              folderId: libraryId,
              publicationId: importedPublicationId
            }),
          });

          const libraryData = await libraryResponse.json();
          console.log('Library response:', libraryData);

          if (!libraryResponse.ok) {
            console.error('Failed to add to library:', libraryData);
            throw new Error(libraryData.error || 'Failed to add to library');
          }
          
          console.log('Successfully added publication to library');
        } catch (libraryError) {
          console.error('Error adding to library:', libraryError);
          // Show warning but don't fail the import
          setSnackbar({
            open: true,
            message: `Publication imported but failed to add to library: ${libraryError.message}`,
            severity: 'warning'
          });
        }
      }
      
      // Show success message
      setSnackbar({
        open: true,
        message: libraryId 
          ? `Successfully imported "${publication.title}" and added to library`
          : `Successfully imported "${publication.title}"`,
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

  const handleImportMultiple = useCallback(async (publications, libraryId = null) => {
    setImporting(true);
    try {
      let successCount = 0;
      let failCount = 0;
      const importedPublicationIds = [];

      // Import publications one by one
      for (const publication of publications) {
        try {
          const response = await fetch('/api/publications/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ publication }),
          });

          if (response.ok) {
            const data = await response.json();
            const importedId = data.publication?.id;
            if (importedId) {
              importedPublicationIds.push(importedId);
            }
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.error(`Failed to import ${publication.title}:`, error);
          failCount++;
        }
      }

      // If library is selected, add all imported publications to library
      if (libraryId && importedPublicationIds.length > 0) {
        console.log('Adding multiple publications to library:', {
          libraryId,
          publicationCount: importedPublicationIds.length,
          publicationIds: importedPublicationIds
        });
        
        let libraryAddSuccessCount = 0;
        let libraryAddFailCount = 0;
        
        for (const publicationId of importedPublicationIds) {
          try {
            const libraryResponse = await fetch('/api/publications/library', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                action: 'addPublication',
                folderId: libraryId,
                publicationId
              }),
            });

            const libraryData = await libraryResponse.json();
            
            if (!libraryResponse.ok) {
              console.error('Failed to add publication to library:', publicationId, libraryData);
              libraryAddFailCount++;
            } else {
              libraryAddSuccessCount++;
            }
          } catch (libraryError) {
            console.error('Error adding to library:', libraryError);
            libraryAddFailCount++;
          }
        }
        
        console.log('Library addition complete:', {
          success: libraryAddSuccessCount,
          failed: libraryAddFailCount
        });
        
        if (libraryAddFailCount > 0) {
          setSnackbar({
            open: true,
            message: `${successCount} publications imported, but ${libraryAddFailCount} failed to add to library`,
            severity: 'warning'
          });
        }
      }

      // Show summary message
      if (successCount > 0) {
        setSnackbar({
          open: true,
          message: libraryId
            ? `Successfully imported ${successCount} publication${successCount !== 1 ? 's' : ''} and added to library${failCount > 0 ? `, ${failCount} failed` : ''}`
            : `Successfully imported ${successCount} publication${successCount !== 1 ? 's' : ''}${failCount > 0 ? `, ${failCount} failed` : ''}`,
          severity: failCount > 0 ? 'warning' : 'success'
        });
        
        // Notify parent of successful imports
        onImportSuccess(publications.slice(0, successCount));
      } else {
        setSnackbar({
          open: true,
          message: `Failed to import all ${publications.length} publication${publications.length !== 1 ? 's' : ''}`,
          severity: 'error'
        });
      }

      // Close dialogs
      setResultsDialogOpen(false);
      setMultiPreviewDialogOpen(false);
      
    } catch (error) {
      console.error('Bulk import failed:', error);
      setSnackbar({
        open: true,
        message: `Bulk import failed: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setImporting(false);
    }
  }, [onImportSuccess]);

  const handleCloseResults = useCallback(() => {
    setResultsDialogOpen(false);
  }, []);

  const handleLoadMore = useCallback(() => {
    handleSearch(true);
  }, [handleSearch]);

  const hasMoreResults = searchResults.length < totalCount;

  const handleClosePreview = useCallback(() => {
    setPreviewDialogOpen(false);
    setPreviewPublication(null);
  }, []);

  const handlePreviewMultiple = useCallback((publications) => {
    setMultiPreviewPublications(publications);
    setMultiPreviewDialogOpen(true);
  }, []);

  const handleCloseMultiPreview = useCallback(() => {
    setMultiPreviewDialogOpen(false);
    setMultiPreviewPublications([]);
  }, []);

  const handleViewDetailsFromMulti = useCallback((publication) => {
    setPreviewPublication(publication);
    setPreviewDialogOpen(true);
    setMultiPreviewDialogOpen(false);
  }, []);

  const handleFieldChange = (field) => (event) => {
    setSearchFields(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    if (error) setError(null);
  };

  const handleKeyPress = useCallback((event) => {
    if (event.key === 'Enter' && !loading) {
      const query = buildSearchQuery();
      if (query) {
        handleSearch();
      }
    }
  }, [handleSearch, loading, searchFields]);

  const handleCloseSnackbar = useCallback((event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  const hasSearchCriteria = () => {
    return Object.values(searchFields).some(value => value.trim() !== '');
  };

  return (
    <Box sx={{ maxWidth: 700 }}>
      <Typography variant="h6" gutterBottom>
        Search PubMed Database
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Fill in one or more fields to search the PubMed database. All fields will be combined with AND logic.
      </Typography>

      {/* Search Fields */}
      <Stack spacing={2} sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Keywords"
          placeholder="e.g., diabetes, treatment, intervention"
          value={searchFields.keywords}
          onChange={handleFieldChange('keywords')}
          onKeyPress={handleKeyPress}
          disabled={loading}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: '#8b6cbc' }} />
          }}
          helperText="General keywords or terms to search for"
        />

        <TextField
          fullWidth
          label="Author"
          placeholder="e.g., Smith J, Johnson AB"
          value={searchFields.author}
          onChange={handleFieldChange('author')}
          onKeyPress={handleKeyPress}
          disabled={loading}
          helperText="Author name (last name and initials)"
        />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            label="Year"
            placeholder="e.g., 2023 or 2020:2023"
            value={searchFields.year}
            onChange={handleFieldChange('year')}
            onKeyPress={handleKeyPress}
            disabled={loading}
            helperText="Publication year or range"
          />

          <TextField
            fullWidth
            label="Journal"
            placeholder="e.g., Nature, Science"
            value={searchFields.journal}
            onChange={handleFieldChange('journal')}
            onKeyPress={handleKeyPress}
            disabled={loading}
            helperText="Journal name"
          />
        </Box>

        <TextField
          fullWidth
          label="Title"
          placeholder="e.g., clinical trial, systematic review"
          value={searchFields.title}
          onChange={handleFieldChange('title')}
          onKeyPress={handleKeyPress}
          disabled={loading}
          helperText="Words or phrases in the title"
        />
      </Stack>


      {loading && <LinearProgress sx={{ mb: 2, '& .MuiLinearProgress-bar': { bgcolor: '#8b6cbc' } }} />}

      <Button
        variant="contained"
        onClick={() => handleSearch(false)}
        disabled={loading || !hasSearchCriteria()}
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
        {loading ? 'Searching...' : 'Search PubMed'}
      </Button>

      {/* Search Results Dialog */}
      <SearchResultsDialog
        open={resultsDialogOpen}
        onClose={handleCloseResults}
        results={searchResults}
        onPreview={handlePreviewResult}
        onImport={handleImportMultiple}
        onPreviewMultiple={handlePreviewMultiple}
        loading={loading}
        title={`PubMed Search Results (${searchResults.length}${totalCount > 0 ? ` of ${totalCount}` : ''} found)`}
        hasMore={hasMoreResults}
        onLoadMore={handleLoadMore}
        loadingMore={loadingMore}
      />

      {/* Publication Preview Dialog */}
      <PublicationPreviewDialog
        open={previewDialogOpen}
        onClose={handleClosePreview}
        publication={previewPublication}
        onImport={handleImportPublication}
        importing={importing}
      />

      {/* Multi-Publication Preview Dialog */}
      <MultiPublicationPreviewDialog
        open={multiPreviewDialogOpen}
        onClose={handleCloseMultiPreview}
        publications={multiPreviewPublications}
        onImport={handleImportMultiple}
        onViewDetails={handleViewDetailsFromMulti}
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
