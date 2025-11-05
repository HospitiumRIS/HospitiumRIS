'use client';

import React, { useState, useCallback } from 'react';
import {
  Box, Typography, TextField, Button, LinearProgress, Alert, Snackbar,
  Paper, Grid, List, ListItem, ListItemText, Chip, FormControlLabel, 
  Checkbox, Divider, Card, CardContent
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as FileIcon,
  Visibility as PreviewIcon,
  Download as ImportIcon,
  Clear as ClearIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';

const EndNoteImport = ({ onImportSuccess, color = '#000000' }) => {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [endnoteContent, setEndnoteContent] = useState('');
  const [parsedEntries, setParsedEntries] = useState([]);
  const [selectedEntries, setSelectedEntries] = useState(new Set());
  const [showPreview, setShowPreview] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [error, setError] = useState(null);

  // Parse EndNote RIS format
  const parseEndNoteRIS = useCallback((content) => {
    const entries = [];
    const lines = content.split('\n');
    let currentEntry = {};
    let authors = [];
    
    for (let line of lines) {
      line = line.trim();
      if (line.startsWith('TY  -')) {
        // Start new entry
        if (Object.keys(currentEntry).length > 0) {
          if (authors.length > 0) {
            currentEntry.authors = authors;
          }
          entries.push({ ...currentEntry, id: `endnote_${entries.length}` });
        }
        currentEntry = {};
        authors = [];
        
        // Map EndNote types to our types
        const type = line.substring(5).trim();
        const typeMapping = {
          'JOUR': 'article',
          'BOOK': 'book',
          'CHAP': 'book-chapter',
          'CONF': 'conference',
          'THES': 'thesis',
          'RPRT': 'report',
          'GEN': 'other'
        };
        currentEntry.type = typeMapping[type] || 'article';
        
      } else if (line.startsWith('TI  -')) {
        currentEntry.title = line.substring(5).trim();
      } else if (line.startsWith('AU  -')) {
        authors.push(line.substring(5).trim());
      } else if (line.startsWith('PY  -')) {
        const year = parseInt(line.substring(5).trim());
        if (!isNaN(year)) {
          currentEntry.year = year;
        }
      } else if (line.startsWith('JO  -') || line.startsWith('JF  -')) {
        currentEntry.journal = line.substring(5).trim();
      } else if (line.startsWith('AB  -')) {
        currentEntry.abstract = line.substring(5).trim();
      } else if (line.startsWith('DO  -')) {
        currentEntry.doi = line.substring(5).trim();
      } else if (line.startsWith('UR  -')) {
        currentEntry.url = line.substring(5).trim();
      } else if (line.startsWith('VL  -')) {
        currentEntry.volume = line.substring(5).trim();
      } else if (line.startsWith('IS  -')) {
        currentEntry.number = line.substring(5).trim();
      } else if (line.startsWith('SP  -')) {
        const startPage = line.substring(5).trim();
        currentEntry.pages = currentEntry.pages ? `${startPage}-${currentEntry.pages}` : startPage;
      } else if (line.startsWith('EP  -')) {
        const endPage = line.substring(5).trim();
        currentEntry.pages = currentEntry.pages ? `${currentEntry.pages}-${endPage}` : endPage;
      } else if (line.startsWith('PB  -')) {
        currentEntry.publisher = line.substring(5).trim();
      } else if (line.startsWith('KW  -')) {
        if (!currentEntry.keywords) currentEntry.keywords = [];
        currentEntry.keywords.push(line.substring(5).trim());
      } else if (line.startsWith('SN  -')) {
        const identifier = line.substring(5).trim();
        if (identifier.includes('-')) {
          currentEntry.isbn = identifier; // Likely ISBN
        } else {
          currentEntry.issn = identifier; // Likely ISSN
        }
      }
    }
    
    // Add the last entry
    if (Object.keys(currentEntry).length > 0) {
      if (authors.length > 0) {
        currentEntry.authors = authors;
      }
      entries.push({ ...currentEntry, id: `endnote_${entries.length}` });
    }
    
    return entries;
  }, []);

  // Parse EndNote XML format (simplified)
  const parseEndNoteXML = useCallback((content) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(content, 'text/xml');
      const records = xmlDoc.getElementsByTagName('record');
      const entries = [];

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const entry = {
          id: `endnote_xml_${i}`,
          source: 'EndNote'
        };

        // Extract title
        const titleEl = record.querySelector('title');
        if (titleEl) {
          entry.title = titleEl.textContent.trim();
        }

        // Extract authors
        const authors = [];
        const authorEls = record.querySelectorAll('author');
        authorEls.forEach(authorEl => {
          authors.push(authorEl.textContent.trim());
        });
        if (authors.length > 0) {
          entry.authors = authors;
        }

        // Extract year
        const yearEl = record.querySelector('year');
        if (yearEl) {
          const year = parseInt(yearEl.textContent.trim());
          if (!isNaN(year)) {
            entry.year = year;
          }
        }

        // Extract journal
        const journalEl = record.querySelector('journal') || record.querySelector('secondary-title');
        if (journalEl) {
          entry.journal = journalEl.textContent.trim();
        }

        // Extract abstract
        const abstractEl = record.querySelector('abstract');
        if (abstractEl) {
          entry.abstract = abstractEl.textContent.trim();
        }

        // Extract DOI
        const doiEl = record.querySelector('doi');
        if (doiEl) {
          entry.doi = doiEl.textContent.trim();
        }

        // Extract URL
        const urlEl = record.querySelector('url');
        if (urlEl) {
          entry.url = urlEl.textContent.trim();
        }

        // Extract volume/issue/pages
        const volumeEl = record.querySelector('volume');
        if (volumeEl) {
          entry.volume = volumeEl.textContent.trim();
        }

        const issueEl = record.querySelector('number');
        if (issueEl) {
          entry.number = issueEl.textContent.trim();
        }

        const pagesEl = record.querySelector('pages');
        if (pagesEl) {
          entry.pages = pagesEl.textContent.trim();
        }

        // Set default type
        entry.type = 'article';

        if (entry.title) {
          entries.push(entry);
        }
      }

      return entries;
    } catch (error) {
      console.error('Error parsing EndNote XML:', error);
      throw new Error('Invalid EndNote XML format');
    }
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      console.log('EndNote file upload:', {
        name: file.name,
        type: file.type,
        size: file.size
      });
      const allowedTypes = ['.ris', '.enw', '.xml', '.txt', '.bib', '.ref'];
      const fileName = file.name.toLowerCase();
      const lastDotIndex = fileName.lastIndexOf('.');

      // More robust validation - check file type and extension
      const isValidType = allowedTypes.some(type => fileName.endsWith(type));
      const hasValidMimeType = file.type === '' || // Allow files with no MIME type
                               file.type.includes('text') ||
                               file.type.includes('xml') ||
                               file.type.includes('application');

      if (lastDotIndex === -1) {
        // If no extension, still allow if it's a text file based on MIME type
        if (!hasValidMimeType) {
          setSnackbar({
            open: true,
            message: 'Please upload a valid EndNote file (.ris, .enw, .xml, or .txt)',
            severity: 'error'
          });
          return;
        }
      } else if (!isValidType && !hasValidMimeType) {
        setSnackbar({
          open: true,
          message: 'Please upload a valid EndNote file (.ris, .enw, .xml, or .txt)',
          severity: 'error'
        });
        return;
      }

      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        setEndnoteContent(e.target.result);
        if (error) setError(null);
        setShowPreview(false);
        setParsedEntries([]);
      };
      reader.onerror = () => {
        setSnackbar({
          open: true,
          message: 'Failed to read file. Please try again.',
          severity: 'error'
        });
      };
      reader.readAsText(file);
    }
  }, [error]);

  // Handle content change (manual paste)
  const handleContentChange = useCallback((event) => {
    const content = event.target.value;
    setEndnoteContent(content);
    if (error) setError(null);
    if (showPreview) {
      setShowPreview(false);
      setParsedEntries([]);
    }
  }, [error, showPreview]);

  // Parse EndNote content
  const handlePreview = useCallback(async () => {
    if (!endnoteContent.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter EndNote content or upload a file',
        severity: 'warning'
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let entries = [];
      
      // Determine format and parse accordingly
      if (endnoteContent.trim().startsWith('<?xml') || endnoteContent.includes('<xml>')) {
        entries = parseEndNoteXML(endnoteContent);
      } else {
        // Assume RIS format
        entries = parseEndNoteRIS(endnoteContent);
      }

      if (entries.length === 0) {
        setSnackbar({
          open: true,
          message: 'No valid publications found in the EndNote content',
          severity: 'warning'
        });
        return;
      }

      setParsedEntries(entries);
      setSelectedEntries(new Set(entries.map(entry => entry.id)));
      setShowPreview(true);

      setSnackbar({
        open: true,
        message: `Found ${entries.length} publication(s)`,
        severity: 'success'
      });

    } catch (err) {
      console.error('EndNote parsing error:', err);
      setError(err.message);
      setSnackbar({
        open: true,
        message: `Parsing failed: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [endnoteContent, parseEndNoteRIS, parseEndNoteXML]);

  // Handle import
  const handleImport = useCallback(async () => {
    const selectedPubs = parsedEntries.filter(entry => selectedEntries.has(entry.id));
    
    if (selectedPubs.length === 0) {
      setSnackbar({
        open: true,
        message: 'No publications selected for import.',
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
          method: 'endnote'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import publications');
      }

      const data = await response.json();

      if (data.success) {
        let message = `Successfully imported ${data.imported} of ${data.total} publications!`;

        if (data.warnings && data.warnings.length > 0) {
          message += ` (${data.warnings.length} warnings)`;
        }

        setSnackbar({
          open: true,
          message,
          severity: 'success'
        });

        // Clear form
        setShowPreview(false);
        setParsedEntries([]);
        setEndnoteContent('');
        setFileName('');
      }

    } catch (err) {
      setSnackbar({
        open: true,
        message: `Import failed: ${err.message}`,
        severity: 'error'
      });
      console.error('EndNote import failed:', err);
    } finally {
      setLoading(false);
    }
  }, [parsedEntries, selectedEntries]);

  // Toggle entry selection
  const handleToggleEntry = useCallback((entryId) => {
    setSelectedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  }, []);

  // Toggle all entries
  const handleToggleAll = useCallback(() => {
    if (selectedEntries.size === parsedEntries.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(parsedEntries.map(entry => entry.id)));
    }
  }, [parsedEntries, selectedEntries]);

  // Clear content
  const handleClear = useCallback(() => {
    setEndnoteContent('');
    setFileName('');
    setParsedEntries([]);
    setSelectedEntries(new Set());
    setShowPreview(false);
    setError(null);
  }, []);

  const handleCloseSnackbar = useCallback((event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  return (
    <Box sx={{ maxWidth: 800 }}>
      <Typography variant="h6" gutterBottom sx={{ color: color }}>
        Import from EndNote
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Upload EndNote export files (.ris, .enw, .xml) or paste EndNote formatted content to import your publications.
      </Typography>

      {/* File Upload Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <FileIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            File Upload
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<UploadIcon />}
                fullWidth
                disabled={loading}
                sx={{ 
                  borderColor: color,
                  color: color,
                  '&:hover': {
                    borderColor: color,
                    bgcolor: `${color}10`
                  }
                }}
              >
                Choose EndNote File
                <input
                  type="file"
                  hidden
                  accept=".ris,.enw,.xml,.txt,.bib,.ref,text/*,application/xml"
                  onChange={handleFileUpload}
                />
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              {fileName && (
                <Chip 
                  label={fileName} 
                  onDelete={handleClear}
                  color="primary"
                  sx={{ maxWidth: '100%' }}
                />
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Manual Content Input */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Manual Input
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={8}
            variant="outlined"
            placeholder="Paste your EndNote exported content here (RIS format or XML)..."
            value={endnoteContent}
            onChange={handleContentChange}
            disabled={loading}
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<PreviewIcon />}
              onClick={handlePreview}
              disabled={loading || !endnoteContent.trim()}
              sx={{ 
                bgcolor: color,
                '&:hover': {
                  bgcolor: `${color}DD`
                }
              }}
            >
              {loading ? 'Parsing...' : 'Preview Publications'}
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClear}
              disabled={loading}
            >
              Clear
            </Button>
          </Box>
        </CardContent>
      </Card>

      {loading && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Preview Results */}
      {showPreview && parsedEntries.length > 0 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Found {parsedEntries.length} Publications
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedEntries.size === parsedEntries.length && parsedEntries.length > 0}
                      indeterminate={selectedEntries.size > 0 && selectedEntries.size < parsedEntries.length}
                      onChange={handleToggleAll}
                    />
                  }
                  label="Select All"
                />
                <Button
                  variant="contained"
                  startIcon={<ImportIcon />}
                  onClick={handleImport}
                  disabled={loading || selectedEntries.size === 0}
                  sx={{ 
                    bgcolor: color,
                    '&:hover': {
                      bgcolor: `${color}DD`
                    }
                  }}
                >
                  Import {selectedEntries.size} Selected
                </Button>
              </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <List>
              {parsedEntries.map((entry) => (
                <ListItem key={entry.id} sx={{ px: 0 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedEntries.has(entry.id)}
                        onChange={() => handleToggleEntry(entry.id)}
                      />
                    }
                    label={
                      <ListItemText
                        primary={entry.title || 'Untitled'}
                        secondary={
                          <Box component="span">
                            <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block' }}>
                              <strong>Authors:</strong> {Array.isArray(entry.authors) 
                                ? entry.authors.join(', ') 
                                : entry.authors || 'Unknown'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block' }}>
                              <strong>Journal:</strong> {entry.journal || 'Unknown'} ({entry.year || 'Unknown'})
                            </Typography>
                            {entry.doi && (
                              <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block' }}>
                                <strong>DOI:</strong> {entry.doi}
                              </Typography>
                            )}
                            <Chip 
                              label={entry.type} 
                              size="small" 
                              sx={{ mt: 1 }}
                            />
                          </Box>
                        }
                      />
                    }
                    sx={{ width: '100%', m: 0 }}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

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

export default React.memo(EndNoteImport);
