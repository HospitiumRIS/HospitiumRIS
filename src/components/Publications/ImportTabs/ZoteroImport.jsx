'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  LinearProgress,
  Alert,
  Snackbar,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Grid,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Link
} from '@mui/material';
import {
  Key as KeyIcon,
  Person as PersonIcon,
  Folder as FolderIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  OpenInNew as OpenIcon
} from '@mui/icons-material';
import { authenticateAndFetchCollections, fetchZoteroItems, transformZoteroItems } from '../../../services/zoteroService';
import { getZoteroSettings, isZoteroConfigured, getZoteroCredentials } from '../../../utils/zoteroSettings';

const ZoteroImport = ({ onImportSuccess, color = '#db2c3a' }) => {
  const [apiKey, setApiKey] = useState('');
  const [userID, setUserID] = useState('');
  const [loading, setLoading] = useState(false);
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [publications, setPublications] = useState([]);
  const [selectedPublications, setSelectedPublications] = useState(new Set());
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [authenticated, setAuthenticated] = useState(false);
  const [settingsConfigured, setSettingsConfigured] = useState(false);

  // Check for saved settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const configured = await isZoteroConfigured();
        setSettingsConfigured(configured);
        
        if (configured) {
          const credentials = await getZoteroCredentials();
          if (credentials) {
            setUserID(credentials.userID);
            setApiKey(credentials.apiKey);
            setAuthenticated(true);
            
            // Auto-authenticate with saved credentials
            handleAuthenticate(credentials.userID, credentials.apiKey);
          }
        }
      } catch (error) {
        console.error('Error loading Zotero settings:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load Zotero settings',
          severity: 'error'
        });
      }
    };

    loadSettings();
  }, []);

  const handleAuthenticate = useCallback(async (customUserID = null, customApiKey = null) => {
    const effectiveUserID = customUserID || userID;
    const effectiveApiKey = customApiKey || apiKey;
    
    if (!effectiveApiKey.trim() || !effectiveUserID.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter both API Key and User ID',
        severity: 'warning'
      });
      return;
    }

    setLoading(true);
    
    try {
      const allCollections = await authenticateAndFetchCollections(effectiveUserID, effectiveApiKey);
      const realCollectionsCount = allCollections.length - 1; // Subtract "All Items"

      setCollections(allCollections);
      setAuthenticated(true);
      
      // Only show success message if not auto-authenticating
      if (!customUserID && !customApiKey) {
        setSnackbar({
          open: true,
          message: `Successfully connected to Zotero library (${realCollectionsCount} collections found)`,
          severity: 'success'
        });
      }

    } catch (error) {
      console.error('Zotero authentication failed:', error);
      setAuthenticated(false);
      setSnackbar({
        open: true,
        message: error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [apiKey, userID]);

  const handleFetchPublications = useCallback(async (collectionKey = '') => {
    if (!authenticated) return;

    setLoading(true);
    
    try {
      const items = await fetchZoteroItems(userID, apiKey, collectionKey, 50);
      const transformedPubs = transformZoteroItems(items);

      setPublications(transformedPubs);
      setSelectedPublications(new Set(transformedPubs.map(p => p.id)));
      
      const collectionName = collections.find(c => c.key === collectionKey)?.name || 'All Items';
      setSnackbar({
        open: true,
        message: `Found ${transformedPubs.length} publication(s) in "${collectionName}"`,
        severity: 'success'
      });

    } catch (error) {
      console.error('Failed to fetch publications:', error);
      setSnackbar({
        open: true,
        message: error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [authenticated, userID, apiKey, collections]);

  const handleImportSelected = useCallback(async () => {
    const selectedPubs = publications.filter(pub => selectedPublications.has(pub.id));
    
    if (selectedPubs.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please select at least one publication to import',
        severity: 'warning'
      });
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/publications/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          publications: selectedPubs,
          method: 'zotero'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import publications');
      }

      const data = await response.json();
      
      setSnackbar({
        open: true,
        message: `Successfully imported ${data.imported} of ${data.total} publications from Zotero!`,
        severity: 'success'
      });

      // Clear selections after successful import
      setSelectedPublications(new Set());
      setPublications([]);
      
    } catch (error) {
      console.error('Import failed:', error);
      setSnackbar({
        open: true,
        message: `Import failed: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [publications, selectedPublications]);

  const handleCollectionChange = useCallback((event) => {
    const collectionKey = event.target.value;
    setSelectedCollection(collectionKey);
    if (authenticated) {
      handleFetchPublications(collectionKey);
    }
  }, [authenticated, handleFetchPublications]);

  const handleTogglePublication = useCallback((pubId) => {
    setSelectedPublications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pubId)) {
        newSet.delete(pubId);
      } else {
        newSet.add(pubId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedPublications.size === publications.length) {
      setSelectedPublications(new Set());
    } else {
      setSelectedPublications(new Set(publications.map(p => p.id)));
    }
  }, [selectedPublications.size, publications]);

  const handleCloseSnackbar = useCallback((event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);


  return (
    <Box sx={{ maxWidth: 800 }}>
      <Typography variant="h6" gutterBottom sx={{ color: color }}>
        Import from Zotero Library
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Connect to your Zotero library using your API credentials to import your research publications.
      </Typography>

      {!authenticated ? (
        <Paper sx={{ p: 3, mb: 3 }}>
          {!settingsConfigured ? (
            // Not configured - encourage settings page
            <Box>
              <Typography variant="h6" gutterBottom>
                Zotero Integration Setup Required
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2" gutterBottom>
                  To import from your Zotero library, you need to configure your API credentials first.
                </Typography>
                <Typography variant="body2">
                  This is a one-time setup that will save your credentials securely for future use.
                </Typography>
              </Alert>

              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Button
                  variant="contained"
                  href="/researcher/settings"
                  sx={{ 
                    bgcolor: color, 
                    '&:hover': { 
                      bgcolor: color === '#db2c3a' ? '#c42a36' : `${color}CC` 
                    }
                  }}
                >
                  Go to Settings
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setSettingsConfigured(true)}
                  sx={{ 
                    borderColor: color, 
                    color: color,
                    '&:hover': {
                      borderColor: color,
                      bgcolor: `${color}10`
                    }
                  }}
                >
                  Configure Here Instead
                </Button>
              </Box>

              <Typography variant="caption" color="text.secondary">
                Configuring in Settings allows you to reuse credentials across sessions
              </Typography>
            </Box>
          ) : (
            // Manual configuration mode
            <Box>
              <Typography variant="h6" gutterBottom>
                Zotero API Authentication
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  To connect to your Zotero library, you'll need:
                </Typography>
                <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                  1. Your Zotero User ID (found in your{' '}
                  <Link href="https://www.zotero.org/settings/keys" target="_blank" rel="noopener">
                    account settings <OpenIcon sx={{ fontSize: '0.8rem' }} />
                  </Link>
                  )<br />
                  2. A private API key with library access permissions
                </Typography>
              </Alert>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="User ID"
                    placeholder="Enter your Zotero User ID"
                    value={userID}
                    onChange={(e) => setUserID(e.target.value)}
                    disabled={loading}
                    InputProps={{
                      startAdornment: <PersonIcon sx={{ mr: 1, color: color }} />
                    }}
                    helperText="Numeric ID from your Zotero account"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="password"
                    label="API Key"
                    placeholder="Enter your Zotero API Key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    disabled={loading}
                    InputProps={{
                      startAdornment: <KeyIcon sx={{ mr: 1, color: color }} />
                    }}
                    helperText="Private API key with library access"
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                  variant="contained"
                  onClick={() => handleAuthenticate()}
                  disabled={loading || !apiKey.trim() || !userID.trim()}
                  sx={{ 
                    bgcolor: color, 
                    '&:hover': { 
                      bgcolor: color === '#db2c3a' ? '#c42a36' : `${color}CC` 
                    },
                    '&:disabled': {
                      bgcolor: '#cccccc'
                    }
                  }}
                >
                  {loading ? 'Connecting...' : 'Connect to Zotero'}
                </Button>
                <Button
                  variant="text"
                  href="/researcher/settings"
                  sx={{ color: color }}
                >
                  Save to Settings Instead
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      ) : (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: color }}>
                ✅ Connected to Zotero Library
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Collection</InputLabel>
                <Select
                  value={selectedCollection}
                  label="Select Collection"
                  onChange={handleCollectionChange}
                  disabled={loading}
                >
                  {collections.map((collection) => (
                    <MenuItem key={collection.key} value={collection.key}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <FolderIcon sx={{ mr: 1, color: color }} />
                        <Typography sx={{ flexGrow: 1 }}>
                          {collection.name}
                        </Typography>
                        <Chip 
                          size="small" 
                          label={`${collection.numItems} items`}
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
          </Card>

          {publications.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Publications ({publications.length} found)
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    size="small"
                    onClick={handleSelectAll}
                    sx={{ color: color }}
                  >
                    {selectedPublications.size === publications.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleImportSelected}
                    disabled={selectedPublications.size === 0 || loading}
                    startIcon={<DownloadIcon />}
                    sx={{ 
                      bgcolor: color, 
                      '&:hover': { 
                        bgcolor: color === '#db2c3a' ? '#c42a36' : `${color}CC` 
                      }
                    }}
                  >
                    Import Selected ({selectedPublications.size})
                  </Button>
                </Box>
              </Box>

              <List>
                {publications.map((publication) => {
                  const isSelected = selectedPublications.has(publication.id);
                  return (
                    <ListItem
                      key={publication.id}
                      sx={{
                        border: isSelected ? `2px solid ${color}` : '1px solid #e0e0e0',
                        borderRadius: 2,
                        mb: 1,
                        bgcolor: isSelected ? `${color}10` : 'background.paper',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleTogglePublication(publication.id)}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {publication.title}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Authors:</strong> {publication.authors.join(', ') || 'Unknown'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Journal:</strong> {publication.journal} ({publication.year})
                            </Typography>
                            {publication.doi && (
                              <Typography variant="body2" color="text.secondary">
                                <strong>DOI:</strong> {publication.doi}
                              </Typography>
                            )}
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Chip 
                          label={publication.type} 
                          size="small" 
                          sx={{ 
                            bgcolor: isSelected ? color : `${color}40`, 
                            color: isSelected ? 'white' : color
                          }} 
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  );
                })}
              </List>
            </Paper>
          )}
        </Box>
      )}

      {loading && <LinearProgress sx={{ mt: 2, color }} />}

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

export default React.memo(ZoteroImport);
