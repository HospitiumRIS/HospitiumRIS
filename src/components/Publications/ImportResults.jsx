'use client';

import React, { useState, useCallback } from 'react';
import {
  Paper,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Check as CheckIcon,
  Visibility as ViewIcon,
  SelectAll as SelectAllIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const ImportResults = ({ results, onRemove, onConfirmImport }) => {
  const [selectedIds, setSelectedIds] = useState(new Set(results.map(r => r.id)));
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedPublication, setSelectedPublication] = useState(null);
  const [importing, setImporting] = useState(false);

  const handleToggleSelection = useCallback((id) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === results.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(results.map(r => r.id)));
    }
  }, [selectedIds.size, results]);

  const handleViewPublication = useCallback((publication) => {
    setSelectedPublication(publication);
    setViewDialogOpen(true);
  }, []);

  const handleConfirmImport = useCallback(async () => {
    const selectedPublications = results.filter(pub => selectedIds.has(pub.id));
    
    if (selectedPublications.length === 0) {
      return;
    }

    setImporting(true);
    try {
      await onConfirmImport(selectedPublications);
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setImporting(false);
    }
  }, [results, selectedIds, onConfirmImport]);

  const getSourceColor = (source) => {
    switch (source.toLowerCase()) {
      case 'orcid':
        return '#A6CE39';
      case 'pubmed':
        return '#326295';
      case 'doi':
        return '#FF6B35';
      case 'bibtex':
        return '#2E86AB';
      default:
        return '#8b6cbc';
    }
  };

  if (results.length === 0) {
    return null;
  }

  return (
    <>
      <Paper sx={{ p: 4, mt: 4, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Import Results ({results.length} publications found)
          </Typography>
          
          <Button
            variant="outlined"
            startIcon={<SelectAllIcon />}
            onClick={handleSelectAll}
            size="small"
            sx={{ 
              borderColor: '#8b6cbc', 
              color: '#8b6cbc',
              '&:hover': {
                borderColor: '#7559a3',
                bgcolor: 'rgba(139, 108, 188, 0.04)'
              }
            }}
          >
            {selectedIds.size === results.length ? 'Deselect All' : 'Select All'}
          </Button>
        </Box>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          Review the imported publications below. Select the ones you want to add to your profile.
          Currently {selectedIds.size} of {results.length} publications selected.
        </Alert>

        <List>
          {results.map((publication) => {
            const isSelected = selectedIds.has(publication.id);
            
            return (
              <ListItem
                key={publication.id}
                sx={{
                  border: isSelected ? '2px solid #8b6cbc' : '1px solid #e0e0e0',
                  borderRadius: 2,
                  mb: 2,
                  bgcolor: isSelected ? 'rgba(139, 108, 188, 0.05)' : 'background.paper',
                  transition: 'all 0.2s ease'
                }}
              >
                <Box sx={{ mr: 2 }}>
                  <Checkbox
                    checked={isSelected}
                    onChange={() => handleToggleSelection(publication.id)}
                    sx={{
                      color: '#8b6cbc',
                      '&.Mui-checked': {
                        color: '#8b6cbc'
                      }
                    }}
                  />
                </Box>

                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ fontWeight: 600, flex: 1 }}
                      >
                        {publication.title}
                      </Typography>
                      <Chip 
                        label={publication.source} 
                        size="small" 
                        sx={{ 
                          bgcolor: getSourceColor(publication.source),
                          color: 'white',
                          fontWeight: 500
                        }}
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" color="text.secondary" component="span" sx={{ mb: 0.5, display: 'block' }}>
                        <strong>Authors:</strong> {Array.isArray(publication.authors) 
                          ? publication.authors.join(', ') 
                          : publication.authors}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" component="span" sx={{ mb: 0.5, display: 'block' }}>
                        <strong>Journal:</strong> {publication.journal} ({publication.year})
                      </Typography>
                      {publication.doi && (
                        <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block' }}>
                          <strong>DOI:</strong> {publication.doi}
                        </Typography>
                      )}
                      {publication.pmid && (
                        <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block' }}>
                          <strong>PMID:</strong> {publication.pmid}
                        </Typography>
                      )}
                    </>
                  }
                />

                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton 
                      onClick={() => handleViewPublication(publication)}
                      size="small"
                      sx={{ color: '#8b6cbc' }}
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton 
                      onClick={() => onRemove(publication.id)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            );
          })}
        </List>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<CheckIcon />}
            onClick={handleConfirmImport}
            disabled={selectedIds.size === 0 || importing}
            sx={{ 
              bgcolor: '#8b6cbc', 
              '&:hover': { bgcolor: '#7559a3' },
              px: 4,
              '&:disabled': {
                bgcolor: '#cccccc'
              }
            }}
          >
            {importing 
              ? 'Adding Publications...' 
              : `Add Selected Publications (${selectedIds.size})`
            }
          </Button>
        </Box>
      </Paper>

      {/* Publication Detail Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          bgcolor: '#8b6cbc10'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Publication Details
          </Typography>
          <IconButton 
            onClick={() => setViewDialogOpen(false)}
            size="small"
            sx={{ color: '#8b6cbc' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ mt: 2 }}>
          {selectedPublication && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                {selectedPublication.title}
              </Typography>
              
              <Typography variant="body1" paragraph>
                <strong>Authors:</strong> {Array.isArray(selectedPublication.authors) 
                  ? selectedPublication.authors.join(', ') 
                  : selectedPublication.authors}
              </Typography>
              
              <Typography variant="body1" paragraph>
                <strong>Journal:</strong> {selectedPublication.journal}
              </Typography>
              
              <Typography variant="body1" paragraph>
                <strong>Year:</strong> {selectedPublication.year}
              </Typography>
              
              <Typography variant="body1" paragraph>
                <strong>Source:</strong> 
                <Chip 
                  label={selectedPublication.source} 
                  size="small" 
                  sx={{ 
                    ml: 1,
                    bgcolor: getSourceColor(selectedPublication.source),
                    color: 'white'
                  }}
                />
              </Typography>
              
              {selectedPublication.doi && (
                <Typography variant="body1" paragraph>
                  <strong>DOI:</strong> 
                  <a 
                    href={`https://doi.org/${selectedPublication.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ marginLeft: '8px', color: '#8b6cbc' }}
                  >
                    {selectedPublication.doi}
                  </a>
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setViewDialogOpen(false)}
            sx={{ color: 'text.secondary' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default React.memo(ImportResults);
