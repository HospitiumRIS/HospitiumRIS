'use client';

import { useTranslation } from 'react-i18next';
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
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Divider
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Folder as FolderIcon,
  Download as DownloadIcon,
  LinkOff as LinkOffIcon
} from '@mui/icons-material';
import {
  getCiteReadyStatus,
  connectCiteReadyWithPassword,
  disconnectCiteReady,
  fetchCiteReadyFolders,
  fetchCiteReadyItems,
  flattenCiteReadyFolders
} from '../../../services/citereadyService';

const CiteReadyImport = ({ onImportSuccess, color = '#8b6cbc' }) => {
  const { t } = useTranslation();

  const [checkingStatus, setCheckingStatus] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState(null);
  const [oauthAvailable, setOauthAvailable] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [connecting, setConnecting] = useState(false);

  const [folders, setFolders] = useState([{ folderID: 1, folderName: 'All Items', depth: 0 }]);
  const [selectedFolder, setSelectedFolder] = useState(1);
  const [publications, setPublications] = useState([]);
  const [selectedPublications, setSelectedPublications] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Check connection status on mount
  useEffect(() => {
    const checkStatus = async () => {
      setCheckingStatus(true);
      try {
        const status = await getCiteReadyStatus();
        setAuthenticated(Boolean(status.isConfigured));
        setConnectedEmail(status.email || null);
        setOauthAvailable(Boolean(status.oauthAvailable));
      } catch (err) {
        console.error('Error checking CiteReady status:', err);
      } finally {
        setCheckingStatus(false);
      }
    };
    checkStatus();
  }, []);

  // Load folders once connected
  useEffect(() => {
    if (!authenticated) return;
    (async () => {
      try {
        const record = await fetchCiteReadyFolders();
        setFolders(flattenCiteReadyFolders(record));
      } catch (err) {
        console.error('Error fetching CiteReady folders:', err);
        if (err.code === 'CITEREADY_UNAUTHORIZED') {
          setAuthenticated(false);
        }
      }
    })();
  }, [authenticated]);

  const handleConnect = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      setSnackbar({ open: true, message: 'Please enter both email and password', severity: 'warning' });
      return;
    }

    setConnecting(true);
    try {
      const result = await connectCiteReadyWithPassword({ email: email.trim(), password, environment: 'testing' });
      setAuthenticated(true);
      setConnectedEmail(result.email);
      setPassword('');
      setSnackbar({ open: true, message: 'Connected to CiteReady', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally {
      setConnecting(false);
    }
  }, [email, password]);

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnectCiteReady();
      setAuthenticated(false);
      setConnectedEmail(null);
      setPublications([]);
      setSelectedPublications(new Set());
      setSnackbar({ open: true, message: 'Disconnected from CiteReady', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    }
  }, []);

  const handleFetchPublications = useCallback(async (folderID = 1) => {
    setLoading(true);
    try {
      const { publications: items } = await fetchCiteReadyItems({ folderID, pageSize: 100 });
      setPublications(items);
      setSelectedPublications(new Set(items.map((p) => p.id)));

      const folderName = folders.find((f) => f.folderID === folderID)?.folderName || 'All Items';
      setSnackbar({ open: true, message: `Found ${items.length} publication(s) in "${folderName}"`, severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
      if (err.code === 'CITEREADY_UNAUTHORIZED') {
        setAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  }, [folders]);

  const handleFolderChange = useCallback((event) => {
    const folderID = Number(event.target.value);
    setSelectedFolder(folderID);
    handleFetchPublications(folderID);
  }, [handleFetchPublications]);

  const handleTogglePublication = useCallback((pubId) => {
    setSelectedPublications((prev) => {
      const next = new Set(prev);
      if (next.has(pubId)) next.delete(pubId);
      else next.add(pubId);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedPublications.size === publications.length) {
      setSelectedPublications(new Set());
    } else {
      setSelectedPublications(new Set(publications.map((p) => p.id)));
    }
  }, [selectedPublications.size, publications]);

  const handleImportSelected = useCallback(async () => {
    const selected = publications.filter((p) => selectedPublications.has(p.id));

    if (selected.length === 0) {
      setSnackbar({ open: true, message: 'Please select at least one publication to import', severity: 'warning' });
      return;
    }

    setImporting(true);
    try {
      const response = await fetch('/api/publications/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publications: selected, method: 'citeready' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import publications');
      }

      const data = await response.json();

      setSnackbar({
        open: true,
        message: `Successfully imported ${data.imported} of ${data.total} publications from CiteReady!`,
        severity: 'success'
      });

      setSelectedPublications(new Set());
      setPublications([]);
    } catch (err) {
      setSnackbar({ open: true, message: `Import failed: ${err.message}`, severity: 'error' });
    } finally {
      setImporting(false);
    }
  }, [publications, selectedPublications]);

  const handleCloseSnackbar = useCallback((event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  if (checkingStatus) {
    return (
      <Box sx={{ maxWidth: 800, py: 4 }}>
        <LinearProgress sx={{ color }} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800 }}>
      <Typography variant="h6" gutterBottom sx={{ color }}>
        {t('common.import')} from CiteReady
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Connect your CiteReady account to import publications and folders from your CiteReady library.
      </Typography>

      {!authenticated ? (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Sign in with your CiteReady account email and password. This uses CiteReady&apos;s read-only API and
              only reads your items and folders &mdash; nothing is written back to CiteReady.
            </Typography>
          </Alert>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={connecting}
                InputProps={{ startAdornment: <EmailIcon sx={{ mr: 1, color }} /> }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="password"
                label="Password"
                placeholder="Your CiteReady password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={connecting}
                InputProps={{ startAdornment: <LockIcon sx={{ mr: 1, color }} /> }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleConnect(); }}
              />
            </Grid>
          </Grid>

          <Button
            variant="contained"
            onClick={handleConnect}
            disabled={connecting || !email.trim() || !password.trim()}
            sx={{ bgcolor: color, '&:hover': { bgcolor: `${color}CC` } }}
          >
            {connecting ? 'Connecting...' : 'Connect to CiteReady'}
          </Button>

          {!oauthAvailable && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              OAuth sign-in will be available once CiteReady issues production credentials for this app. Password
              login works today and is the flow CiteReady documents as the fallback for apps without a callback URL.
            </Typography>
          )}
        </Paper>
      ) : (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color }}>
                  Connected to CiteReady{connectedEmail ? ` (${connectedEmail})` : ''}
                </Typography>
                <Button size="small" startIcon={<LinkOffIcon />} onClick={handleDisconnect} sx={{ color: '#666' }}>
                  Disconnect
                </Button>
              </Box>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Folder</InputLabel>
                <Select value={selectedFolder} label="Select Folder" onChange={handleFolderChange} disabled={loading}>
                  {folders.map((folder) => (
                    <MenuItem key={folder.folderID} value={folder.folderID}>
                      <Box sx={{ display: 'flex', alignItems: 'center', pl: folder.depth * 2 }}>
                        <FolderIcon sx={{ mr: 1, color, fontSize: '1.1rem' }} />
                        <Typography>{folder.folderName}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
          </Card>

          {loading && <LinearProgress sx={{ mb: 2, color }} />}

          {publications.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Publications ({publications.length} found)</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button size="small" onClick={handleSelectAll} sx={{ color }}>
                    {selectedPublications.size === publications.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleImportSelected}
                    disabled={selectedPublications.size === 0 || importing}
                    startIcon={<DownloadIcon />}
                    sx={{ bgcolor: color, '&:hover': { bgcolor: `${color}CC` } }}
                  >
                    {importing ? 'Importing...' : `Import Selected (${selectedPublications.size})`}
                  </Button>
                </Box>
              </Box>

              <Divider sx={{ mb: 2 }} />

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
                        primary={<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{publication.title}</Typography>}
                        secondary={
                          <>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Authors:</strong> {publication.authors.join(', ') || 'Unknown'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Journal:</strong> {publication.journal || 'N/A'} ({publication.year || 'n.d.'})
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
                          sx={{ bgcolor: isSelected ? color : `${color}40`, color: isSelected ? 'white' : color }}
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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default React.memo(CiteReadyImport);
