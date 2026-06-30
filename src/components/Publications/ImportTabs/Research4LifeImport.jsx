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
  const { t } = useTranslation();
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
        message: t('import_tabs.enter_search_terms'),
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
        500, 
        selectedPartner || null
      );
      
      if (publications && publications.length > 0) {
        setSearchResults(publications);
        setResultsDialogOpen(true);
      } else {
        setSnackbar({
          open: true,
          message: t('import_tabs.no_publications_search'),
          severity: 'info'
        });
      }
    } catch (err) {
      console.error('Research4Life search failed:', err);
      
      let errorMessage = t('import_tabs.search_failed');
      if (err.message.includes('No publications found')) {
        errorMessage = t('import_tabs.no_publications_keywords');
      } else if (err.message.includes('Research4Life search failed')) {
        errorMessage = t('import_tabs.r4l_unavailable');
      } else if (err.message.includes('Failed to fetch')) {
        errorMessage = t('errors.network_error');
      } else {
        errorMessage = t('import_tabs.import_failed', { message: err.message });
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedPartner, t]);

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
          message: errorData.message || t('import_tabs.duplicate_publication'),
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
        throw new Error(errorData.error || t('import_tabs.failed_import_publication'));
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
            message: t('import_tabs.imported_folder_fail', { count: libraryAddFailCount }),
            severity: 'warning'
          });
        } else if (libraryAddFailCount > 0) {
          setSnackbar({
            open: true,
            message: t('import_tabs.imported_partial_folders', { title: publication.title, success: libraryAddSuccessCount, fail: libraryAddFailCount }),
            severity: 'warning'
          });
        } else {
          setSnackbar({
            open: true,
            message: t('import_tabs.imported_all_folders', { title: publication.title, count: libraryAddSuccessCount }),
            severity: 'success'
          });
        }
      } else {
        // Show success message without library
        setSnackbar({
          open: true,
          message: t('import_tabs.imported_success', { title: publication.title }),
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
        message: t('import_tabs.import_failed', { message: error.message }),
        severity: 'error'
      });
    } finally {
      setImporting(false);
    }
  }, [onImportSuccess, t]);

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
        {t('import_tabs.research4life_search_title')}
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t('import_tabs.research4life_search_desc')}
      </Typography>

      {/* Research4Life Info Card */}
      <Card sx={{ mb: 3, bgcolor: '#fff3e0', border: `1px solid ${color}40` }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <img src="/R4L.png" alt="Research4Life" style={{ width: 32, height: 32, marginRight: 12 }} />
            <Typography variant="h6" sx={{ color: color }}>
              {t('import_tabs.research4life_partnership')}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {t('import_tabs.research4life_partnership_desc')}
          </Typography>
        </CardContent>
      </Card>


      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <TextField
            fullWidth
            label={t('import_tabs.search_query')}
            placeholder={t('import_tabs.search_placeholder')}
            value={searchQuery}
            onChange={handleQueryChange}
            onKeyPress={handleKeyPress}
            disabled={loading}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: color }} />
            }}
            helperText={t('import_tabs.search_helper')}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>{t('import_tabs.partner_database')}</InputLabel>
            <Select
              value={selectedPartner}
              onChange={handlePartnerChange}
              label={t('import_tabs.partner_database')}
              disabled={loading}
            >
              <MenuItem value="">
                <em>{t('import_tabs.all_partners')}</em>
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
        {loading ? t('import_tabs.searching_r4l') : t('import_tabs.search_r4l')}
      </Button>

      {/* Partner Information */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          {t('import_tabs.available_partners')}
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
        title={t('import_tabs.search_results_title')}
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
