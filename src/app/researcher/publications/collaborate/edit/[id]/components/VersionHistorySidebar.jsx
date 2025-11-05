'use client';

import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Paper,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Skeleton,
  Divider,
  Stack
} from '@mui/material';
import {
  History as HistoryIcon,
  Restore as RestoreIcon,
  Save as SaveIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';

export default function VersionHistorySidebar({ 
  manuscriptId, 
  open, 
  onClose, 
  onVersionRestore,
  currentContent,
  currentTitle
}) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createVersionDialog, setCreateVersionDialog] = useState(false);
  const [viewVersionDialog, setViewVersionDialog] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [newVersionData, setNewVersionData] = useState({
    description: '',
    versionType: 'MANUAL'
  });

  // Fetch versions
  const fetchVersions = useCallback(async () => {
    if (!manuscriptId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/manuscripts/${manuscriptId}/versions`);
      const data = await response.json();
      
      if (data.success) {
        setVersions(data.data);
      } else {
        console.error('Failed to fetch versions:', data.error);
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
    } finally {
      setLoading(false);
    }
  }, [manuscriptId]);

  useEffect(() => {
    if (open) {
      fetchVersions();
    }
  }, [open, fetchVersions]);

  // Create new version
  const handleCreateVersion = async () => {
    if (!manuscriptId) return;

    try {
      const response = await fetch(`/api/manuscripts/${manuscriptId}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: currentTitle,
          content: currentContent,
          description: newVersionData.description,
          versionType: newVersionData.versionType
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setCreateVersionDialog(false);
        setNewVersionData({ description: '', versionType: 'MANUAL' });
        fetchVersions(); // Refresh the list
      } else {
        console.error('Failed to create version:', data.error);
      }
    } catch (error) {
      console.error('Error creating version:', error);
    }
  };

  // View specific version
  const handleViewVersion = async (versionId) => {
    try {
      const response = await fetch(`/api/manuscripts/${manuscriptId}/versions/${versionId}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedVersion(data.data);
        setViewVersionDialog(true);
      } else {
        console.error('Failed to fetch version:', data.error);
      }
    } catch (error) {
      console.error('Error fetching version:', error);
    }
  };

  // Restore to version
  const handleRestoreVersion = async (versionId) => {
    if (!window.confirm('Are you sure you want to restore to this version? Current changes will be saved as a backup.')) {
      return;
    }

    try {
      const response = await fetch(`/api/manuscripts/${manuscriptId}/versions/${versionId}/restore`, {
        method: 'POST'
      });

      const data = await response.json();
      
      if (data.success) {
        // Call the parent callback to update the editor
        if (onVersionRestore) {
          onVersionRestore(data.data);
        }
        fetchVersions(); // Refresh the list
      } else {
        console.error('Failed to restore version:', data.error);
      }
    } catch (error) {
      console.error('Error restoring version:', error);
    }
  };

  const getVersionTypeColor = (type) => {
    switch (type) {
      case 'MANUAL': return 'primary';
      case 'AUTO': return 'default';
      case 'MILESTONE': return 'success';
      default: return 'default';
    }
  };

  const getVersionTypeIcon = (type) => {
    switch (type) {
      case 'MANUAL': return <SaveIcon fontSize="small" />;
      case 'AUTO': return <HistoryIcon fontSize="small" />;
      case 'MILESTONE': return <DescriptionIcon fontSize="small" />;
      default: return <HistoryIcon fontSize="small" />;
    }
  };

  if (!open) return null;

  return (
    <>
      <Paper sx={{ 
        width: 400, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: 0,
        borderLeft: '1px solid #e0e0e0'
      }}>
        {/* Header */}
        <Box sx={{ 
          p: 2, 
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon color="primary" />
            <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
              Version History
            </Typography>
          </Box>
          <Box>
            <Tooltip title="Create New Version">
              <IconButton 
                size="small" 
                onClick={() => setCreateVersionDialog(true)}
                sx={{ mr: 1 }}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Close">
              <IconButton size="small" onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Version List */}
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          {loading ? (
            <Box sx={{ p: 2 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Box key={i} sx={{ mb: 2 }}>
                  <Skeleton height={60} />
                </Box>
              ))}
            </Box>
          ) : versions.length === 0 ? (
            <Box sx={{ 
              p: 4, 
              textAlign: 'center', 
              color: 'text.secondary' 
            }}>
              <HistoryIcon sx={{ fontSize: 48, opacity: 0.3, mb: 2 }} />
              <Typography variant="body1">
                No version history yet
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Create your first version to start tracking changes
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 1 }}>
              {versions.map((version, index) => (
                <ListItem 
                  key={version.id}
                  sx={{ 
                    mb: 1,
                    border: '1px solid #f0f0f0',
                    borderRadius: 2,
                    '&:hover': {
                      bgcolor: 'rgba(139, 108, 188, 0.05)',
                      borderColor: '#8b6cbc'
                    }
                  }}
                >
                  <Box sx={{ width: '100%' }}>
                    {/* Version Header */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      mb: 1 
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          icon={getVersionTypeIcon(version.versionType)}
                          label={`v${version.versionNumber}`}
                          size="small"
                          color={getVersionTypeColor(version.versionType)}
                          variant={index === 0 ? "filled" : "outlined"}
                        />
                        {index === 0 && (
                          <Chip
                            label="Current"
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View Version">
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewVersion(version.id)}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {index !== 0 && (
                          <Tooltip title="Restore to This Version">
                            <IconButton 
                              size="small" 
                              onClick={() => handleRestoreVersion(version.id)}
                            >
                              <RestoreIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>

                    {/* Version Details */}
                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                      {version.title}
                    </Typography>
                    
                    {version.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {version.description}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PersonIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {version.creator.givenName} {version.creator.familyName}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TimeIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(version.createdAt), 'MMM d, yyyy h:mm a')}
                        </Typography>
                      </Box>
                    </Box>

                    {version.wordCount && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {version.wordCount.toLocaleString()} words
                      </Typography>
                    )}
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Paper>

      {/* Create Version Dialog */}
      <Dialog 
        open={createVersionDialog} 
        onClose={() => setCreateVersionDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Version</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Version Type</InputLabel>
              <Select
                value={newVersionData.versionType}
                label="Version Type"
                onChange={(e) => setNewVersionData(prev => ({ ...prev, versionType: e.target.value }))}
              >
                <MenuItem value="MANUAL">Manual Save</MenuItem>
                <MenuItem value="MILESTONE">Milestone</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Description (Optional)"
              multiline
              rows={3}
              value={newVersionData.description}
              onChange={(e) => setNewVersionData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what changed in this version..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateVersionDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateVersion} variant="contained">
            Create Version
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Version Dialog */}
      <Dialog 
        open={viewVersionDialog} 
        onClose={() => setViewVersionDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedVersion && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              Version {selectedVersion.versionNumber}
              <Chip
                icon={getVersionTypeIcon(selectedVersion.versionType)}
                label={selectedVersion.versionType}
                size="small"
                color={getVersionTypeColor(selectedVersion.versionType)}
              />
            </Box>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedVersion && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>Title</Typography>
                <Typography variant="body1">{selectedVersion.title}</Typography>
              </Box>
              
              {selectedVersion.description && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Description</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedVersion.description}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 4 }}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Created By</Typography>
                  <Typography variant="body2">
                    {selectedVersion.creator.givenName} {selectedVersion.creator.familyName}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Created At</Typography>
                  <Typography variant="body2">
                    {format(new Date(selectedVersion.createdAt), 'MMM d, yyyy h:mm a')}
                  </Typography>
                </Box>
                {selectedVersion.wordCount && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Word Count</Typography>
                    <Typography variant="body2">
                      {selectedVersion.wordCount.toLocaleString()} words
                    </Typography>
                  </Box>
                )}
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" gutterBottom>Content Preview</Typography>
                <Paper sx={{ 
                  p: 2, 
                  bgcolor: '#f9f9f9', 
                  maxHeight: 300, 
                  overflow: 'auto',
                  '& *': {
                    fontSize: '0.9rem !important'
                  }
                }}>
                  <div dangerouslySetInnerHTML={{ __html: selectedVersion.content }} />
                </Paper>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewVersionDialog(false)}>Close</Button>
          {selectedVersion && selectedVersion.versionNumber !== 1 && (
            <Button 
              onClick={() => {
                setViewVersionDialog(false);
                handleRestoreVersion(selectedVersion.id);
              }}
              variant="contained"
              startIcon={<RestoreIcon />}
            >
              Restore to This Version
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}



