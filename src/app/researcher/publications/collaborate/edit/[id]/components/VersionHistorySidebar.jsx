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
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  CompareArrows as DiffIcon,
  AddCircle as AddedIcon,
  RemoveCircle as RemovedIcon,
  SwapHoriz as SwapIcon
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
  const [diffDialogOpen, setDiffDialogOpen] = useState(false);
  const [diffVersion, setDiffVersion] = useState(null);
  const [diffMode, setDiffMode] = useState('unified'); // 'unified' | 'sidebyside'

  // Strip HTML tags to get plain text
  const stripHtml = (html) => {
    if (!html) return '';
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/h[1-6]>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  // Word-level diff algorithm (LCS based)
  const computeWordDiff = (oldText, newText) => {
    const oldWords = oldText.split(/\s+/).filter(Boolean);
    const newWords = newText.split(/\s+/).filter(Boolean);

    // Limit for performance on large docs
    if (oldWords.length + newWords.length > 4000) {
      return [{ type: 'info', text: 'Document too large for word-level diff. Showing paragraph comparison.' }];
    }

    const m = oldWords.length;
    const n = newWords.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (oldWords[i - 1] === newWords[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    const result = [];
    let i = m, j = n;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
        result.unshift({ type: 'equal', text: oldWords[i - 1] });
        i--; j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        result.unshift({ type: 'insert', text: newWords[j - 1] });
        j--;
      } else {
        result.unshift({ type: 'delete', text: oldWords[i - 1] });
        i--;
      }
    }
    return result;
  };

  const handleOpenDiff = async (versionId) => {
    try {
      const response = await fetch(`/api/manuscripts/${manuscriptId}/versions/${versionId}`);
      const data = await response.json();
      if (data.success) {
        setDiffVersion(data.data);
        setDiffDialogOpen(true);
      }
    } catch (error) {
      console.error('Error fetching version for diff:', error);
    }
  };

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
        width: 420, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: 0,
        borderLeft: '1px solid #e9ecef',
        boxShadow: '-4px 0 12px rgba(0, 0, 0, 0.05)'
      }}>
        {/* Header */}
        <Box sx={{ 
          background: 'linear-gradient(135deg, #8b6cbc 0%, #9d7ec9 100%)',
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(139, 108, 188, 0.15)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TimelineIcon sx={{ fontSize: 24, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontSize: '1.125rem', fontWeight: 700, color: 'white' }}>
                Version History
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.75rem' }}>
                Track manuscript changes
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Create New Version">
              <IconButton 
                size="small" 
                onClick={() => setCreateVersionDialog(true)}
                sx={{ 
                  color: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' }
                }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Close">
              <IconButton 
                size="small" 
                onClick={onClose}
                sx={{ 
                  color: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' }
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Stats Bar */}
        {!loading && versions.length > 0 && (
          <Box sx={{ 
            px: 2.5, 
            py: 2, 
            bgcolor: '#f8f9fa',
            borderBottom: '1px solid #e9ecef',
            display: 'flex',
            gap: 2,
            alignItems: 'center'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                bgcolor: '#8b6cbc15',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <HistoryIcon sx={{ fontSize: 18, color: '#8b6cbc' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.125rem', color: '#2d3748' }}>
                  {versions.length}
                </Typography>
                <Typography variant="caption" sx={{ color: '#718096', fontSize: '0.7rem' }}>
                  Total Versions
                </Typography>
              </Box>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                bgcolor: '#10b98115',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrendingUpIcon sx={{ fontSize: 18, color: '#10b981' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.125rem', color: '#2d3748' }}>
                  v{versions[0]?.versionNumber || 0}
                </Typography>
                <Typography variant="caption" sx={{ color: '#718096', fontSize: '0.7rem' }}>
                  Current
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* Version List */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', bgcolor: '#fafbfc' }}>
          {loading ? (
            <Box sx={{ p: 2 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Box key={i} sx={{ mb: 2 }}>
                  <Skeleton height={80} sx={{ borderRadius: 2 }} />
                </Box>
              ))}
            </Box>
          ) : versions.length === 0 ? (
            <Box sx={{ 
              p: 4, 
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1.5,
              mt: 4
            }}>
              <Box sx={{
                width: 80,
                height: 80,
                borderRadius: 3,
                bgcolor: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TimelineIcon sx={{ fontSize: 40, color: '#cbd5e0' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                No version history yet
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 280 }}>
                Create your first version to start tracking changes and milestones
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateVersionDialog(true)}
                sx={{
                  mt: 2,
                  textTransform: 'none',
                  bgcolor: '#8b6cbc',
                  fontWeight: 600,
                  borderRadius: 2,
                  '&:hover': { bgcolor: '#7a5ba8' }
                }}
              >
                Create First Version
              </Button>
            </Box>
          ) : (
            <List sx={{ p: 2 }}>
              {versions.map((version, index) => (
                <ListItem 
                  key={version.id}
                  sx={{ 
                    mb: 2,
                    p: 2,
                    border: '1px solid #e9ecef',
                    borderRadius: 2.5,
                    bgcolor: 'white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(139, 108, 188, 0.15)',
                      borderColor: '#8b6cbc',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Box sx={{ width: '100%' }}>
                    {/* Version Header */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      mb: 1.5 
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          icon={getVersionTypeIcon(version.versionType)}
                          label={`v${version.versionNumber}`}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            height: 26,
                            ...(index === 0 ? {
                              bgcolor: '#8b6cbc',
                              color: 'white',
                              '& .MuiChip-icon': { color: 'white' }
                            } : {
                              bgcolor: '#f1f5f9',
                              color: '#64748b',
                              border: 'none'
                            })
                          }}
                        />
                        {index === 0 && (
                          <Chip
                            icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                            label="Current"
                            size="small"
                            sx={{
                              height: 26,
                              bgcolor: '#10b98115',
                              color: '#10b981',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              border: 'none'
                            }}
                          />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Compare with current">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDiff(version.id)}
                            sx={{ color: '#64748b', '&:hover': { color: '#8b6cbc', bgcolor: '#8b6cbc10' } }}
                          >
                            <DiffIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View version content">
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewVersion(version.id)}
                            sx={{ 
                              color: '#64748b',
                              '&:hover': { color: '#8b6cbc', bgcolor: '#8b6cbc10' }
                            }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {index !== 0 && (
                          <Tooltip title="Restore to This Version">
                            <IconButton 
                              size="small" 
                              onClick={() => handleRestoreVersion(version.id)}
                              sx={{
                                color: '#64748b',
                                '&:hover': {
                                  color: '#10b981',
                                  bgcolor: '#10b98110'
                                }
                              }}
                            >
                              <RestoreIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>

                    {/* Version Details */}
                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.75, color: '#1a202c', fontSize: '0.9375rem' }}>
                      {version.title}
                    </Typography>
                    
                    {version.description && (
                      <Typography variant="body2" sx={{ mb: 1.5, color: '#64748b', fontSize: '0.8125rem', lineHeight: 1.5 }}>
                        {version.description}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <PersonIcon sx={{ fontSize: 16, color: '#8b6cbc' }} />
                        <Typography variant="caption" sx={{ color: '#4a5568', fontSize: '0.75rem', fontWeight: 500 }}>
                          {version.creator.givenName} {version.creator.familyName}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <TimeIcon sx={{ fontSize: 16, color: '#8b6cbc' }} />
                        <Typography variant="caption" sx={{ color: '#4a5568', fontSize: '0.75rem' }}>
                          {format(new Date(version.createdAt), 'MMM d, yyyy h:mm a')}
                        </Typography>
                      </Box>
                      {version.wordCount && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <DescriptionIcon sx={{ fontSize: 16, color: '#8b6cbc' }} />
                          <Typography variant="caption" sx={{ color: '#4a5568', fontSize: '0.75rem' }}>
                            {version.wordCount.toLocaleString()} words
                          </Typography>
                        </Box>
                      )}
                    </Box>
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
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 24px 80px rgba(139, 108, 188, 0.15)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #8b6cbc 0%, #9d7ec9 100%)',
          color: 'white',
          fontWeight: 700
        }}>
          Create New Version
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: '#64748b' }}>Version Type</InputLabel>
              <Select
                value={newVersionData.versionType}
                label="Version Type"
                onChange={(e) => setNewVersionData(prev => ({ ...prev, versionType: e.target.value }))}
                sx={{
                  borderRadius: 2,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e2e8f0'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#8b6cbc'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#8b6cbc'
                  }
                }}
              >
                <MenuItem value="MANUAL">Manual Save</MenuItem>
                <MenuItem value="MILESTONE">Milestone</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Description (Optional)"
              multiline
              rows={4}
              value={newVersionData.description}
              onChange={(e) => setNewVersionData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what changed in this version..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: '#e2e8f0'
                  },
                  '&:hover fieldset': {
                    borderColor: '#8b6cbc'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#8b6cbc'
                  }
                }
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f8f9fa' }}>
          <Button 
            onClick={() => setCreateVersionDialog(false)}
            variant="outlined"
            sx={{
              textTransform: 'none',
              borderColor: '#e2e8f0',
              color: '#64748b',
              fontWeight: 600,
              borderRadius: 2,
              '&:hover': {
                borderColor: '#8b6cbc',
                color: '#8b6cbc',
                bgcolor: '#8b6cbc05'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateVersion} 
            variant="contained"
            startIcon={<SaveIcon />}
            sx={{
              textTransform: 'none',
              bgcolor: '#8b6cbc',
              fontWeight: 600,
              borderRadius: 2,
              px: 3,
              boxShadow: '0 2px 8px rgba(139, 108, 188, 0.25)',
              '&:hover': {
                bgcolor: '#7a5ba8',
                boxShadow: '0 4px 12px rgba(139, 108, 188, 0.35)'
              }
            }}
          >
            Create Version
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diff Dialog */}
      <Dialog
        open={diffDialogOpen}
        onClose={() => { setDiffDialogOpen(false); setDiffVersion(null); }}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, maxHeight: '90vh', boxShadow: '0 24px 80px rgba(139,108,188,0.15)' } }}
      >
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #8b6cbc 0%, #9d7ec9 100%)', color: 'white', py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <DiffIcon />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                  Comparing: Version {diffVersion?.versionNumber} vs Current
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                  {diffVersion && format(new Date(diffVersion.createdAt), 'MMM d, yyyy h:mm a')}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.75 }}>
              <Chip
                label="Unified"
                size="small"
                onClick={() => setDiffMode('unified')}
                sx={{
                  cursor: 'pointer',
                  bgcolor: diffMode === 'unified' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                  color: 'white', fontWeight: 600, fontSize: '0.72rem',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }
                }}
              />
              <Chip
                label="Side by Side"
                size="small"
                onClick={() => setDiffMode('sidebyside')}
                sx={{
                  cursor: 'pointer',
                  bgcolor: diffMode === 'sidebyside' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                  color: 'white', fontWeight: 600, fontSize: '0.72rem',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }
                }}
              />
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {diffVersion && (() => {
            const oldText = stripHtml(diffVersion.content);
            const newText = stripHtml(currentContent);

            if (diffMode === 'sidebyside') {
              return (
                <Box sx={{ display: 'flex', height: '100%' }}>
                  {/* Old version */}
                  <Box sx={{ flex: 1, borderRight: '2px solid #e9ecef', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ px: 2, py: 1.5, bgcolor: '#fff5f5', borderBottom: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <RemovedIcon sx={{ fontSize: '1rem', color: '#ef4444' }} />
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#991b1b' }}>
                        Version {diffVersion.versionNumber} (older)
                      </Typography>
                    </Box>
                    <Box sx={{ p: 2.5, overflow: 'auto', flexGrow: 1, maxHeight: '60vh', fontFamily: 'Georgia, serif', fontSize: '0.9rem', lineHeight: 1.8, color: '#2d3748', whiteSpace: 'pre-wrap' }}>
                      {oldText}
                    </Box>
                  </Box>
                  {/* Current version */}
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ px: 2, py: 1.5, bgcolor: '#f0fdf4', borderBottom: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AddedIcon sx={{ fontSize: '1rem', color: '#10b981' }} />
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#065f46' }}>
                        Current Version
                      </Typography>
                    </Box>
                    <Box sx={{ p: 2.5, overflow: 'auto', flexGrow: 1, maxHeight: '60vh', fontFamily: 'Georgia, serif', fontSize: '0.9rem', lineHeight: 1.8, color: '#2d3748', whiteSpace: 'pre-wrap' }}>
                      {newText}
                    </Box>
                  </Box>
                </Box>
              );
            }

            // Unified diff
            const diffResult = computeWordDiff(oldText, newText);
            const addedCount = diffResult.filter(d => d.type === 'insert').length;
            const removedCount = diffResult.filter(d => d.type === 'delete').length;

            return (
              <Box>
                {/* Stats bar */}
                <Box sx={{ px: 3, py: 1.5, bgcolor: '#f8f9fa', borderBottom: '1px solid #e9ecef', display: 'flex', gap: 3, alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: '#10b981' }} />
                    <Typography sx={{ fontSize: '0.8rem', color: '#065f46', fontWeight: 600 }}>
                      +{addedCount} word{addedCount !== 1 ? 's' : ''} added
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: '#ef4444' }} />
                    <Typography sx={{ fontSize: '0.8rem', color: '#991b1b', fontWeight: 600 }}>
                      -{removedCount} word{removedCount !== 1 ? 's' : ''} removed
                    </Typography>
                  </Box>
                </Box>

                {/* Diff output */}
                <Box sx={{
                  p: 3,
                  maxHeight: '60vh',
                  overflow: 'auto',
                  fontFamily: 'Georgia, serif',
                  fontSize: '0.95rem',
                  lineHeight: 2,
                  color: '#2d3748',
                }}>
                  {diffResult.map((token, idx) => {
                    if (token.type === 'equal') {
                      return <span key={idx}>{token.text} </span>;
                    } else if (token.type === 'insert') {
                      return (
                        <span key={idx} style={{
                          backgroundColor: '#d1fae5',
                          color: '#065f46',
                          borderRadius: 3,
                          padding: '1px 3px',
                          marginRight: 3,
                          fontWeight: 500,
                          border: '1px solid #a7f3d0'
                        }}>{token.text}</span>
                      );
                    } else if (token.type === 'delete') {
                      return (
                        <span key={idx} style={{
                          backgroundColor: '#fee2e2',
                          color: '#991b1b',
                          borderRadius: 3,
                          padding: '1px 3px',
                          marginRight: 3,
                          textDecoration: 'line-through',
                          fontWeight: 500,
                          border: '1px solid #fecaca'
                        }}>{token.text}</span>
                      );
                    } else {
                      return <Box key={idx} sx={{ p: 1.5, bgcolor: '#f8f9fa', borderRadius: 1, mb: 1, fontSize: '0.8rem', color: '#64748b' }}>{token.text}</Box>;
                    }
                  })}
                </Box>
              </Box>
            );
          })()}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f8f9fa', borderTop: '1px solid #e9ecef' }}>
          <Button
            onClick={() => { setDiffDialogOpen(false); setDiffVersion(null); }}
            variant="outlined"
            sx={{ textTransform: 'none', borderColor: '#e2e8f0', color: '#64748b', fontWeight: 600, borderRadius: 2 }}
          >
            Close
          </Button>
          {diffVersion && (
            <Button
              onClick={() => {
                setDiffDialogOpen(false);
                handleRestoreVersion(diffVersion.id);
              }}
              variant="contained"
              startIcon={<RestoreIcon />}
              sx={{
                textTransform: 'none', bgcolor: '#10b981', fontWeight: 600, borderRadius: 2, px: 3,
                boxShadow: '0 2px 8px rgba(16,185,129,0.25)',
                '&:hover': { bgcolor: '#059669' }
              }}
            >
              Restore This Version
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* View Version Dialog */}
      <Dialog 
        open={viewVersionDialog} 
        onClose={() => setViewVersionDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 24px 80px rgba(139, 108, 188, 0.15)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #8b6cbc 0%, #9d7ec9 100%)',
          color: 'white'
        }}>
          {selectedVersion && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Version {selectedVersion.versionNumber}
              </Typography>
              <Chip
                icon={getVersionTypeIcon(selectedVersion.versionType)}
                label={selectedVersion.versionType}
                size="small"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.25)',
                  color: 'white',
                  fontWeight: 600,
                  '& .MuiChip-icon': { color: 'white' }
                }}
              />
            </Box>
          )}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedVersion && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2d3748', mb: 1 }}>Title</Typography>
                <Typography variant="body1" sx={{ color: '#4a5568' }}>{selectedVersion.title}</Typography>
              </Box>
              
              {selectedVersion.description && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2d3748', mb: 1 }}>Description</Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    {selectedVersion.description}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2d3748', mb: 0.5 }}>Created By</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <PersonIcon sx={{ fontSize: 16, color: '#8b6cbc' }} />
                    <Typography variant="body2" sx={{ color: '#4a5568' }}>
                      {selectedVersion.creator.givenName} {selectedVersion.creator.familyName}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2d3748', mb: 0.5 }}>Created At</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <TimeIcon sx={{ fontSize: 16, color: '#8b6cbc' }} />
                    <Typography variant="body2" sx={{ color: '#4a5568' }}>
                      {format(new Date(selectedVersion.createdAt), 'MMM d, yyyy h:mm a')}
                    </Typography>
                  </Box>
                </Box>
                {selectedVersion.wordCount && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2d3748', mb: 0.5 }}>Word Count</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <DescriptionIcon sx={{ fontSize: 16, color: '#8b6cbc' }} />
                      <Typography variant="body2" sx={{ color: '#4a5568' }}>
                        {selectedVersion.wordCount.toLocaleString()} words
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2d3748', mb: 1.5 }}>Content Preview</Typography>
                <Paper sx={{ 
                  p: 3, 
                  bgcolor: '#f8f9fa',
                  border: '1px solid #e9ecef',
                  borderRadius: 2,
                  maxHeight: 400, 
                  overflow: 'auto',
                  '& *': {
                    fontSize: '0.9rem !important',
                    color: '#2d3748 !important'
                  }
                }}>
                  <div dangerouslySetInnerHTML={{ __html: selectedVersion.content }} />
                </Paper>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f8f9fa' }}>
          <Button 
            onClick={() => setViewVersionDialog(false)}
            variant="outlined"
            sx={{
              textTransform: 'none',
              borderColor: '#e2e8f0',
              color: '#64748b',
              fontWeight: 600,
              borderRadius: 2,
              '&:hover': {
                borderColor: '#8b6cbc',
                color: '#8b6cbc',
                bgcolor: '#8b6cbc05'
              }
            }}
          >
            Close
          </Button>
          {selectedVersion && selectedVersion.versionNumber !== 1 && (
            <Button 
              onClick={() => {
                setViewVersionDialog(false);
                handleRestoreVersion(selectedVersion.id);
              }}
              variant="contained"
              startIcon={<RestoreIcon />}
              sx={{
                textTransform: 'none',
                bgcolor: '#10b981',
                fontWeight: 600,
                borderRadius: 2,
                px: 3,
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                '&:hover': {
                  bgcolor: '#059669',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
                }
              }}
            >
              Restore to This Version
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}



