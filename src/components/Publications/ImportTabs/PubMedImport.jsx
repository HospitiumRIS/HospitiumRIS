'use client';

import { useTranslation } from 'react-i18next';
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
import MultiPublicationPreviewDialog from '../MultiPublicationPreviewDialog';
import { searchAndFormatPubMed } from '../../../services/pubmedService';

const PubMedImport = ({ onImportSuccess, color = '#8b6cbc' }) => {
  const { t } = useTranslation();
  const [searchFields, setSearchFields] = useState({
    keywords: '',
    author: '',
    year: '',
    journal: '',
    title: '',
    country: '',
    funder: ''
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
    if (searchFields.country.trim()) {
      queryParts.push(`${searchFields.country.trim()}[Affiliation]`);
    }
    if (searchFields.funder.trim()) {
      queryParts.push(`${searchFields.funder.trim()}[Grant Number]`);
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
      
      console.log('PubMedImport - After publication import:', {
        apiResponse: data,
        importedPublicationId,
        receivedLibraryId: libraryId,
        receivedFolderIds: folderIds,
        folderIdsLength: folderIds.length
      });
      
      // Add publication to all selected folders
      const foldersToAdd = folderIds.length > 0 ? folderIds : (libraryId ? [libraryId] : []);
      
      console.log('PubMedImport - Folders to add:', {
        foldersToAdd,
        foldersToAddLength: foldersToAdd.length,
        hasImportedPublicationId: !!importedPublicationId
      });
      
      if (foldersToAdd.length > 0 && importedPublicationId) {
        console.log('PubMedImport - Starting folder addition loop:', {
          folderIds: foldersToAdd,
          importedPublicationId
        });
        
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

            const libraryData = await libraryResponse.json();

            if (!libraryResponse.ok) {
              console.error('Failed to add to folder:', libraryData);
              libraryAddFailCount++;
            } else {
              libraryAddSuccessCount++;
              console.log('Successfully added publication to folder:', folderId);
            }
          } catch (libraryError) {
            console.error('Error adding to folder:', libraryError);
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

  const handleImportMultiple = useCallback(async (publications, libraryId = null, folderAssignments = {}) => {
    setImporting(true);
    try {
      let successCount = 0;
      let failCount = 0;
      const importedByFolder = {};

      for (const publication of publications) {
        if (publication.inLibrary) continue;

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
            const importedId = data.publications?.[0]?.id || data.publication?.id;
            const folderId = folderAssignments[publication.id] || libraryId;
            if (importedId && folderId) {
              if (!importedByFolder[folderId]) importedByFolder[folderId] = [];
              importedByFolder[folderId].push(importedId);
            }
            successCount++;
          } else if (response.status === 409) {
            failCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.error(`Failed to import ${publication.title}:`, error);
          failCount++;
        }
      }

      for (const [folderId, publicationIds] of Object.entries(importedByFolder)) {
        try {
          await fetch('/api/publications/library', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'addPublications',
              folderId,
              publicationIds
            }),
          });
        } catch (libraryError) {
          console.error('Error adding publications to folder:', folderId, libraryError);
        }
      }

      if (successCount > 0) {
        const folderCount = Object.keys(importedByFolder).length;
        setSnackbar({
          open: true,
          message: folderCount > 0
            ? `Imported ${successCount} publication${successCount !== 1 ? 's' : ''} into ${folderCount} folder${folderCount !== 1 ? 's' : ''}${failCount > 0 ? `, ${failCount} skipped` : ''}`
            : `Successfully imported ${successCount} publication${successCount !== 1 ? 's' : ''}${failCount > 0 ? `, ${failCount} failed` : ''}`,
          severity: failCount > 0 ? 'warning' : 'success'
        });
        onImportSuccess(publications.slice(0, successCount));
      } else {
        setSnackbar({
          open: true,
          message: `Failed to import all ${publications.length} publication${publications.length !== 1 ? 's' : ''}`,
          severity: 'error'
        });
      }

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
    <Box sx={{ maxWidth: 800 }}>
      <Typography variant="h6" gutterBottom>
        Search PubMed Database
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Fill in one or more fields to search the PubMed database. All fields will be combined with AND logic.
      </Typography>

      <Box sx={{ mb: 2 }}>
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
      </Box>

      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="Author"
          placeholder="Author name (last name and initials)"
          value={searchFields.author}
          onChange={handleFieldChange('author')}
          onKeyPress={handleKeyPress}
          disabled={loading}
          helperText="Author name (last name and initials)"
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Year"
          placeholder="Publication year or range"
          value={searchFields.year}
          onChange={handleFieldChange('year')}
          onKeyPress={handleKeyPress}
          disabled={loading}
          sx={{ flex: 1 }}
          helperText="Publication year or range"
        />
        <TextField
          label="Journal"
          placeholder="Journal name"
          value={searchFields.journal}
          onChange={handleFieldChange('journal')}
          onKeyPress={handleKeyPress}
          disabled={loading}
          sx={{ flex: 1 }}
          helperText="Journal name"
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="Title"
          placeholder="Words or phrases in the title"
          value={searchFields.title}
          onChange={handleFieldChange('title')}
          onKeyPress={handleKeyPress}
          disabled={loading}
          helperText="Words or phrases in the title"
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Country (Optional)"
          placeholder="Country in author affiliation"
          value={searchFields.country}
          onChange={handleFieldChange('country')}
          onKeyPress={handleKeyPress}
          disabled={loading}
          sx={{ flex: 1 }}
          helperText="Country in author affiliation"
        />
        <TextField
          label="Funder (Optional)"
          placeholder="Funding agency or grant number"
          value={searchFields.funder}
          onChange={handleFieldChange('funder')}
          onKeyPress={handleKeyPress}
          disabled={loading}
          sx={{ flex: 1 }}
          helperText="Funding agency or grant number"
        />
      </Box>

      {loading && <LinearProgress sx={{ mb: 2, '& .MuiLinearProgress-bar': { bgcolor: '#8b6cbc' } }} />}

      <Button
        variant="contained"
        onClick={() => handleSearch(false)}
        disabled={loading || !hasSearchCriteria()}
        startIcon={<SearchIcon />}
        sx={{
          bgcolor: '#8b6cbc',
          '&:hover': { bgcolor: '#7559a3' },
          '&:disabled': { bgcolor: '#cccccc' }
        }}
      >
        {loading ? t('common.loading') : t('common.search')}
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
