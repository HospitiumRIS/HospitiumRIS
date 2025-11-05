'use client';

import React, { useState, useCallback } from 'react';
import {
  Box, Typography, TextField, Button, LinearProgress, Alert, Snackbar,
  Paper, Grid, List, ListItem, ListItemText, Chip, FormControlLabel, 
  Checkbox, Divider, Card, CardContent, Tabs, Tab
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as FileIcon,
  Visibility as PreviewIcon,
  Download as ImportIcon,
  Clear as ClearIcon,
  CheckCircle as CheckIcon,
  DataObject as JsonIcon,
  TableChart as CsvIcon
} from '@mui/icons-material';

const MendeleyImport = ({ onImportSuccess, color = '#9d1620' }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [parsedEntries, setParsedEntries] = useState([]);
  const [selectedEntries, setSelectedEntries] = useState(new Set());
  const [showPreview, setShowPreview] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [error, setError] = useState(null);

  // Parse BibTeX format (same as BibtexImport)
  const parseBibTeX = useCallback((content) => {
    const entries = [];
    const bibEntries = content.match(/@\w+\{[^@]*\}/g);
    
    if (!bibEntries) {
      throw new Error('No valid BibTeX entries found');
    }

    bibEntries.forEach((entry, index) => {
      const typeMatch = entry.match(/@(\w+)\{/);
      const type = typeMatch ? typeMatch[1].toLowerCase() : 'article';
      
      const keyMatch = entry.match(/@\w+\{([^,\s}]+)/);
      const key = keyMatch ? keyMatch[1] : `entry_${index}`;

      const fields = {};
      const fieldRegex = /(\w+)\s*=\s*\{([^}]*)\}/g;
      let match;
      
      while ((match = fieldRegex.exec(entry)) !== null) {
        fields[match[1].toLowerCase()] = match[2].trim();
      }

      // Map BibTeX types to our publication types
      const typeMapping = {
        'article': 'article',
        'inproceedings': 'conference',
        'book': 'book',
        'incollection': 'book-chapter',
        'phdthesis': 'thesis',
        'mastersthesis': 'thesis',
        'techreport': 'report',
        'misc': 'other'
      };

      const publication = {
        id: `mendeley_bib_${index}`,
        title: fields.title || 'Untitled',
        type: typeMapping[type] || 'article',
        authors: fields.author ? fields.author.split(' and ').map(a => a.trim()) : ['Unknown Author'],
        year: fields.year ? parseInt(fields.year) : new Date().getFullYear(),
        journal: fields.journal || fields.booktitle || 'Unknown Journal',
        volume: fields.volume || null,
        number: fields.number || null,
        pages: fields.pages || null,
        publisher: fields.publisher || null,
        abstract: fields.abstract || '',
        doi: fields.doi || null,
        url: fields.url || null,
        isbn: fields.isbn || null,
        issn: fields.issn || null,
        keywords: fields.keywords ? fields.keywords.split(',').map(k => k.trim()) : [],
        source: 'Mendeley'
      };

      entries.push(publication);
    });

    return entries;
  }, []);

  // Parse RIS format (same as EndNote)
  const parseRIS = useCallback((content) => {
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
          entries.push({ ...currentEntry, id: `mendeley_ris_${entries.length}` });
        }
        currentEntry = {};
        authors = [];
        
        // Map RIS types to our types
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
        currentEntry.source = 'Mendeley';
        
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
      }
    }
    
    // Add the last entry
    if (Object.keys(currentEntry).length > 0) {
      if (authors.length > 0) {
        currentEntry.authors = authors;
      }
      entries.push({ ...currentEntry, id: `mendeley_ris_${entries.length}` });
    }
    
    return entries;
  }, []);

  // Parse CSV format
  const parseCSV = useCallback((content) => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const entries = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length !== headers.length) continue;

      const row = {};
      headers.forEach((header, index) => {
        row[header.toLowerCase().replace(/\s+/g, '_')] = values[index];
      });

      // Map common CSV headers to our format
      const publication = {
        id: `mendeley_csv_${i}`,
        title: row.title || row.publication_title || 'Untitled',
        type: 'article',
        authors: row.authors ? row.authors.split(';').map(a => a.trim()) : ['Unknown Author'],
        year: row.year ? parseInt(row.year) : new Date().getFullYear(),
        journal: row.journal || row.publication_outlet || row.source || 'Unknown Journal',
        volume: row.volume || null,
        number: row.issue || row.number || null,
        pages: row.pages || null,
        publisher: row.publisher || null,
        abstract: row.abstract || row.summary || '',
        doi: row.doi || null,
        url: row.url || row.web_address || null,
        isbn: row.isbn || null,
        issn: row.issn || null,
        keywords: row.keywords ? row.keywords.split(';').map(k => k.trim()) : [],
        source: 'Mendeley'
      };

      entries.push(publication);
    }

    return entries;
  }, []);

  // Parse JSON format (Mendeley's export format)
  const parseJSON = useCallback((content) => {
    try {
      const data = JSON.parse(content);
      const entries = [];

      // Handle both single object and array of objects
      const items = Array.isArray(data) ? data : [data];

      items.forEach((item, index) => {
        const publication = {
          id: `mendeley_json_${index}`,
          title: item.title || 'Untitled',
          type: item.type || 'article',
          authors: item.authors || item.author || ['Unknown Author'],
          year: item.year || (item.issued && item.issued['date-parts'] && item.issued['date-parts'][0] && item.issued['date-parts'][0][0]) || new Date().getFullYear(),
          journal: item.journal || item['container-title'] || item.source || 'Unknown Journal',
          volume: item.volume || null,
          number: item.issue || item.number || null,
          pages: item.pages || item.page || null,
          publisher: item.publisher || null,
          abstract: item.abstract || '',
          doi: item.doi || item.DOI || null,
          url: item.url || item.URL || null,
          isbn: item.isbn || item.ISBN || null,
          issn: item.issn || item.ISSN || null,
          keywords: item.keywords || item.tags || [],
          source: 'Mendeley'
        };

        entries.push(publication);
      });

      return entries;
    } catch (error) {
      throw new Error('Invalid JSON format');
    }
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      console.log('Mendeley file upload:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      const allowedTypes = ['.bib', '.ris', '.csv', '.json', '.txt'];
      const fileName = file.name.toLowerCase();
      const lastDotIndex = fileName.lastIndexOf('.');

      // More robust validation
      const isValidType = allowedTypes.some(type => fileName.endsWith(type));
      const hasValidMimeType = file.type === '' || 
                               file.type.includes('text') ||
                               file.type.includes('json') ||
                               file.type.includes('csv') ||
                               file.type.includes('application');

      if (lastDotIndex === -1) {
        if (!hasValidMimeType) {
          setSnackbar({
            open: true,
            message: 'Please upload a valid Mendeley file (.bib, .ris, .csv, .json, or .txt)',
            severity: 'error'
          });
          return;
        }
      } else if (!isValidType && !hasValidMimeType) {
        setSnackbar({
          open: true,
          message: 'Please upload a valid Mendeley file (.bib, .ris, .csv, .json, or .txt)',
          severity: 'error'
        });
        return;
      }

      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        setFileContent(e.target.result);
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


  // Parse content based on format
  const handlePreview = useCallback(async () => {
    if (!fileContent.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter content or upload a file',
        severity: 'warning'
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let entries = [];
      const content = fileContent.trim();

      // Auto-detect format
      if (content.startsWith('@') && content.includes('{')) {
        // BibTeX format
        entries = parseBibTeX(content);
      } else if (content.startsWith('TY  -')) {
        // RIS format
        entries = parseRIS(content);
      } else if (content.startsWith('{') || content.startsWith('[')) {
        // JSON format
        entries = parseJSON(content);
      } else if (content.includes(',') && content.includes('\n')) {
        // CSV format
        entries = parseCSV(content);
      } else {
        throw new Error('Unable to detect file format. Please ensure your file is in BibTeX, RIS, CSV, or JSON format.');
      }

      if (entries.length === 0) {
        setSnackbar({
          open: true,
          message: 'No valid publications found in the content',
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
      console.error('Mendeley parsing error:', err);
      setError(err.message);
      setSnackbar({
        open: true,
        message: `Parsing failed: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [fileContent, parseBibTeX, parseRIS, parseCSV, parseJSON]);

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
          method: 'mendeley'
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
        setFileContent('');
        setFileName('');
      }

    } catch (err) {
      setSnackbar({
        open: true,
        message: `Import failed: ${err.message}`,
        severity: 'error'
      });
      console.error('Mendeley import failed:', err);
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
    setFileContent('');
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
        Import from Mendeley
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Upload Mendeley export files (.bib, .ris, .csv, .json) to import your publications.
      </Typography>

      {/* Format Support Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Supported Formats
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <FileIcon sx={{ mr: 1, color: '#1976d2' }} />
                <Typography variant="body2">BibTeX (.bib)</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <FileIcon sx={{ mr: 1, color: '#d32f2f' }} />
                <Typography variant="body2">RIS (.ris)</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CsvIcon sx={{ mr: 1, color: '#388e3c' }} />
                <Typography variant="body2">CSV (.csv)</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <JsonIcon sx={{ mr: 1, color: '#f57c00' }} />
                <Typography variant="body2">JSON (.json)</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

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
                Choose Mendeley File
                <input
                  type="file"
                  hidden
                  accept=".bib,.ris,.csv,.json,.txt,text/*,application/json"
                  onChange={handleFileUpload}
                />
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {fileName && (
                  <Chip 
                    label={fileName} 
                    onDelete={handleClear}
                    color="primary"
                    sx={{ maxWidth: '180px' }}
                  />
                )}
                {fileContent && !showPreview && (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<PreviewIcon />}
                    onClick={handlePreview}
                    disabled={loading}
                    sx={{ 
                      bgcolor: color,
                      '&:hover': {
                        bgcolor: `${color}DD`
                      }
                    }}
                  >
                    {loading ? 'Parsing...' : 'Parse'}
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
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
                <ListItem key={entry.id} sx={{ px: 0, display: 'block' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
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
                            <>
                              <Typography variant="body2" color="text.secondary" component="span" sx={{ mb: 0.5, display: 'block' }}>
                                <strong>Authors:</strong> {Array.isArray(entry.authors) 
                                  ? entry.authors.join(', ') 
                                  : entry.authors || 'Unknown'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" component="span" sx={{ mb: 0.5, display: 'block' }}>
                                <strong>Journal:</strong> {entry.journal || 'Unknown'} ({entry.year || 'Unknown'})
                              </Typography>
                              {entry.doi && (
                                <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block' }}>
                                  <strong>DOI:</strong> {entry.doi}
                                </Typography>
                              )}
                            </>
                          }
                        />
                      }
                      sx={{ flex: 1, m: 0, alignItems: 'flex-start' }}
                    />
                    <Chip 
                      label={entry.type} 
                      size="small" 
                      sx={{ mt: 0.5, flexShrink: 0 }}
                    />
                  </Box>
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

export default React.memo(MendeleyImport);
