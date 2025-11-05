'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Alert,
  Snackbar,
  Grid,
  Divider,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  Chip
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Key as KeyIcon,
  Person as PersonIcon,
  Visibility,
  VisibilityOff,
  Save as SaveIcon,
  NetworkCheck as TestIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  OpenInNew as OpenIcon
} from '@mui/icons-material';
import PageHeader from '../common/PageHeader';
import { authenticateAndFetchCollections } from '../../services/zoteroService';
import { getZoteroSettings, saveZoteroSettings as saveSettings, clearZoteroSettings } from '../../utils/zoteroSettings';

const ResearcherSettings = () => {
  const [zoteroSettings, setZoteroSettings] = useState({
    userID: '',
    apiKey: '',
    isConfigured: false,
    lastTested: null
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Load settings from database on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const savedSettings = await getZoteroSettings();
        setZoteroSettings(savedSettings);
      } catch (error) {
        console.error('Error loading settings:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load settings',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const saveZoteroSettingsLocal = useCallback(async (settings) => {
    try {
      const savedSettings = await saveSettings(settings);
      setZoteroSettings(savedSettings);
      return savedSettings;
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }, []);

  const handleZoteroChange = useCallback((field, value) => {
    setZoteroSettings(prev => ({
      ...prev,
      [field]: value,
      isConfigured: field === 'userID' || field === 'apiKey' 
        ? (field === 'userID' ? !!value && !!prev.apiKey : !!prev.userID && !!value)
        : prev.isConfigured
    }));
  }, []);

  const handleTestConnection = useCallback(async () => {
    if (!zoteroSettings.userID.trim() || !zoteroSettings.apiKey.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter both User ID and API Key',
        severity: 'warning'
      });
      return;
    }

    setLoading(true);
    setTestResult(null);

    try {
      const collections = await authenticateAndFetchCollections(
        zoteroSettings.userID, 
        zoteroSettings.apiKey
      );
      
      const realCollectionsCount = collections.length - 1; // Subtract "All Items"
      
      setTestResult({
        success: true,
        message: `✅ Connection successful! Found ${realCollectionsCount} collections in your library.`,
        collectionsCount: realCollectionsCount
      });

      setSnackbar({
        open: true,
        message: `Successfully connected to Zotero library`,
        severity: 'success'
      });

    } catch (error) {
      console.error('Zotero test failed:', error);
      setTestResult({
        success: false,
        message: `❌ Connection failed: ${error.message}`,
        error: error.message
      });

      setSnackbar({
        open: true,
        message: `Connection failed: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [zoteroSettings.userID, zoteroSettings.apiKey]);

  const handleSaveZoteroSettings = useCallback(async () => {
    if (!zoteroSettings.userID.trim() || !zoteroSettings.apiKey.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter both User ID and API Key',
        severity: 'warning'
      });
      return;
    }

    // Test connection before saving
    setLoading(true);
    try {
      await authenticateAndFetchCollections(zoteroSettings.userID, zoteroSettings.apiKey);
      
      // Save settings if test passes
      await saveZoteroSettingsLocal({
        ...zoteroSettings,
        isConfigured: true
      });

      setSnackbar({
        open: true,
        message: 'Zotero settings saved successfully!',
        severity: 'success'
      });

    } catch (error) {
      setSnackbar({
        open: true,
        message: `Cannot save invalid settings: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [zoteroSettings, saveZoteroSettingsLocal]);

  const handleClearSettings = useCallback(async () => {
    setLoading(true);
    try {
      await clearZoteroSettings();
      setZoteroSettings({
        userID: '',
        apiKey: '',
        isConfigured: false,
        lastTested: null
      });
      setTestResult(null);
      
      setSnackbar({
        open: true,
        message: 'Zotero settings cleared',
        severity: 'info'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to clear settings: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCloseSnackbar = useCallback((event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  return (
    <Box sx={{ width: '100%', mt: 8, mb: 4 }}>
      <PageHeader
        title="Researcher Settings"
        description="Configure your research tools and integrations"
        icon={<SettingsIcon />}
        breadcrumbs={[
          { label: 'Dashboard', href: '/researcher' },
          { label: 'Settings' }
        ]}
      />

      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Zotero Integration Settings */}
          <Grid item xs={12} lg={8}>
            <Card sx={{ height: 'fit-content' }}>
              <CardHeader
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <img src="/zotero.svg" alt="Zotero" style={{ width: 32, height: 32 }} />
                    <Typography variant="h6">Zotero Integration</Typography>
                    {zoteroSettings.isConfigured && (
                      <Chip 
                        label="Configured" 
                        color="success" 
                        size="small"
                        icon={<CheckIcon />}
                      />
                    )}
                  </Box>
                }
                subheader="Connect your Zotero library for seamless publication import"
              />
              <CardContent>
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

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="User ID"
                      placeholder="Enter your Zotero User ID"
                      value={zoteroSettings.userID}
                      onChange={(e) => handleZoteroChange('userID', e.target.value)}
                      disabled={loading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon color="primary" />
                          </InputAdornment>
                        )
                      }}
                      helperText="Numeric ID from your Zotero account"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type={showApiKey ? 'text' : 'password'}
                      label="API Key"
                      placeholder="Enter your Zotero API Key"
                      value={zoteroSettings.apiKey}
                      onChange={(e) => handleZoteroChange('apiKey', e.target.value)}
                      disabled={loading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <KeyIcon color="primary" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowApiKey(!showApiKey)}
                              edge="end"
                            >
                              {showApiKey ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                      helperText="Private API key with library access"
                    />
                  </Grid>
                </Grid>

                {testResult && (
                  <Alert 
                    severity={testResult.success ? 'success' : 'error'} 
                    sx={{ mt: 3 }}
                  >
                    {testResult.message}
                  </Alert>
                )}

                {zoteroSettings.lastTested && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                    Last tested: {new Date(zoteroSettings.lastTested).toLocaleString()}
                  </Typography>
                )}

                <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                  <Button
                    variant="outlined"
                    startIcon={<TestIcon />}
                    onClick={handleTestConnection}
                    disabled={loading || !zoteroSettings.userID.trim() || !zoteroSettings.apiKey.trim()}
                  >
                    {loading ? 'Testing...' : 'Test Connection'}
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveZoteroSettings}
                    disabled={loading || !zoteroSettings.userID.trim() || !zoteroSettings.apiKey.trim()}
                    sx={{ 
                      bgcolor: '#db2c3a', 
                      '&:hover': { bgcolor: '#c42a36' }
                    }}
                  >
                    Save Settings
                  </Button>
                  {zoteroSettings.isConfigured && (
                    <Button
                      variant="text"
                      color="error"
                      onClick={handleClearSettings}
                      disabled={loading}
                    >
                      Clear Settings
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Settings Status */}
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Integration Status
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {zoteroSettings.isConfigured ? (
                  <CheckIcon color="success" sx={{ mr: 1 }} />
                ) : (
                  <ErrorIcon color="error" sx={{ mr: 1 }} />
                )}
                <Typography variant="body2">
                  Zotero: {zoteroSettings.isConfigured ? 'Connected' : 'Not configured'}
                </Typography>
              </Box>

              {zoteroSettings.isConfigured && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    ✅ You can now import publications from your Zotero library!
                  </Typography>
                  <Button
                    size="small"
                    href="/researcher/publications/import"
                    sx={{ mt: 1 }}
                  >
                    Go to Import
                  </Button>
                </Alert>
              )}
            </Paper>

            {/* Help Section */}
            <Paper sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Need Help?
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Typography variant="body2" sx={{ mb: 2 }}>
                Having trouble setting up Zotero?
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Link 
                  href="https://www.zotero.org/support/dev/web_api/v3/start" 
                  target="_blank" 
                  rel="noopener"
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                >
                  API Documentation <OpenIcon sx={{ fontSize: '0.8rem' }} />
                </Link>
                <Link 
                  href="https://www.zotero.org/settings/keys" 
                  target="_blank" 
                  rel="noopener"
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                >
                  Create API Key <OpenIcon sx={{ fontSize: '0.8rem' }} />
                </Link>
                <Link 
                  href="https://forums.zotero.org/" 
                  target="_blank" 
                  rel="noopener"
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                >
                  Zotero Support <OpenIcon sx={{ fontSize: '0.8rem' }} />
                </Link>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>

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

export default ResearcherSettings;
