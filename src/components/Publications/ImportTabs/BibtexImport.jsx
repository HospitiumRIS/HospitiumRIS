'use client';

import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  LinearProgress,
  Alert,
  Paper,
  Divider,
  Card,
  CardContent,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  FileUpload as FileUploadIcon,
  Book as BibtexIcon,
  Preview as PreviewIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const BibtexImport = ({ onImportSuccess, color = '#8b6cbc' }) => {
  const [bibtexContent, setBibtexContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [parsedEntries, setParsedEntries] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [fileName, setFileName] = useState('');

  const sampleBibtex = `@article{smith2023ai,
  title={Artificial Intelligence in Healthcare: A Comprehensive Review},
  author={Smith, John and Johnson, Mary and Williams, David},
  journal={Journal of Medical AI},
  year={2023},
  volume={15},
  number={3},
  pages={245--267},
  doi={10.1016/j.jmai.2023.03.015},
  abstract={This paper provides a comprehensive review of artificial intelligence applications in healthcare, covering machine learning, deep learning, and natural language processing techniques.},
  keywords={artificial intelligence, healthcare, machine learning, deep learning}
}

@inproceedings{brown2023quantum,
  title={Quantum Computing Applications in Drug Discovery},
  author={Brown, Alice and Davis, Robert},
  booktitle={Proceedings of the International Conference on Quantum Computing},
  year={2023},
  pages={412--425},
  publisher={IEEE},
  doi={10.1109/ICQC.2023.123456},
  abstract={We present novel applications of quantum computing algorithms for accelerating drug discovery processes.},
  keywords={quantum computing, drug discovery, pharmaceutical research}
}

@book{wilson2022datascience,
  title={Data Science for Beginners: A Practical Guide},
  author={Wilson, Sarah},
  publisher={Tech Publications},
  year={2022},
  isbn={978-0123456789},
  pages={450},
  abstract={A comprehensive introduction to data science concepts, tools, and methodologies for beginners.},
  keywords={data science, statistics, programming, analytics}
}`;

  const parseBibtex = (content) => {
    const entries = [];
    const errors = [];
    
    try {
      // Enhanced BibTeX parser that handles more entry types and fields
      const entryRegex = /@(\w+)\s*\{\s*([^,\s]+)\s*,\s*([\s\S]*?)\n\}/g;
      let match;

      while ((match = entryRegex.exec(content)) !== null) {
        const [, type, key, fields] = match;
        const parsedFields = {};
        
        // Parse fields with better regex that handles nested braces
        const fieldRegex = /(\w+)\s*=\s*(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|"[^"]*"|[^,\n}]+)/g;
        let fieldMatch;

        while ((fieldMatch = fieldRegex.exec(fields)) !== null) {
          const [, fieldName, fieldValue] = fieldMatch;
          // Clean up field value (remove braces and quotes)
          const cleanValue = fieldValue.replace(/^[{"']|["'}]$/g, '').trim();
          parsedFields[fieldName.toLowerCase()] = cleanValue;
        }

        // Map BibTeX entry type to our publication type
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

        // Create publication object with comprehensive field mapping
        const publication = {
          id: `${key}_${Date.now()}_${entries.length}`,
          title: parsedFields.title || 'Untitled',
          type: typeMapping[type.toLowerCase()] || 'other',
          authors: parsedFields.author ? 
            parsedFields.author.split(/\s+and\s+/i).map(author => author.trim()) : 
            ['Unknown Author'],
          journal: parsedFields.journal || parsedFields.booktitle || 'Unknown Journal',
          year: parsedFields.year ? parseInt(parsedFields.year) : new Date().getFullYear(),
          doi: parsedFields.doi || null,
          url: parsedFields.url || null,
          abstract: parsedFields.abstract || '',
          keywords: parsedFields.keywords ? 
            parsedFields.keywords.split(/[,;]/).map(k => k.trim()) : [],
          volume: parsedFields.volume || null,
          number: parsedFields.number || null,
          pages: parsedFields.pages || null,
          publisher: parsedFields.publisher || null,
          isbn: parsedFields.isbn || null,
          issn: parsedFields.issn || null,
          source: 'BibTeX',
          bibtexKey: key,
          bibtexType: type,
          // Additional fields
          editor: parsedFields.editor || null,
          series: parsedFields.series || null,
          address: parsedFields.address || null,
          month: parsedFields.month || null,
          note: parsedFields.note || null
        };

        // Validate required fields
        if (!publication.title || publication.title === 'Untitled') {
          errors.push(`Entry "${key}": Missing or invalid title`);
        }

        entries.push(publication);
      }

      if (entries.length === 0) {
        errors.push('No valid BibTeX entries found. Please check your format.');
      }

    } catch (err) {
      errors.push(`Parsing error: ${err.message}`);
    }

    return { entries, errors };
  };

  const handlePreview = useCallback(async () => {
    if (!bibtexContent.trim()) {
      setError('Please enter BibTeX content or upload a file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { entries, errors } = parseBibtex(bibtexContent);
      
      if (errors.length > 0) {
        setError(errors.join('; '));
      }
      
      if (entries.length === 0) {
        setError('No valid BibTeX entries found. Please check your format.');
        return;
      }

      setParsedEntries(entries);
      setShowPreview(true);
    } catch (err) {
      setError('Failed to parse BibTeX content. Please check the format and try again.');
      console.error('BibTeX parsing failed:', err);
    } finally {
      setLoading(false);
    }
  }, [bibtexContent]);

  const handleImport = useCallback(async () => {
    if (parsedEntries.length === 0) {
      setError('No entries to import. Please parse the BibTeX content first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('BibTeX: Sending publications to import:', parsedEntries);
      
      // Call the parent import function
      onImportSuccess(parsedEntries);
      
      // Clear the local state after successful import trigger
      setShowPreview(false);
      setParsedEntries([]);
      setBibtexContent('');
      setFileName('');
      
    } catch (err) {
      setError('Failed to import publications. Please try again.');
      console.error('BibTeX import failed:', err);
    } finally {
      setLoading(false);
    }
  }, [parsedEntries, onImportSuccess]);

  const handleContentChange = useCallback((event) => {
    const value = event.target.value;
    setBibtexContent(value);
    if (error) setError(null);
  }, [error]);

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type with improved logic
      const allowedTypes = ['.bib', '.bibtex', '.txt'];
      const fileName = file.name.toLowerCase();
      const lastDotIndex = fileName.lastIndexOf('.');
      
      // Check if file has an extension
      if (lastDotIndex === -1) {
        setError('Please upload a valid BibTeX file (.bib, .bibtex, or .txt)');
        return;
      }
      
      const fileExtension = fileName.substring(lastDotIndex);
      
      if (!allowedTypes.includes(fileExtension)) {
        setError('Please upload a valid BibTeX file (.bib, .bibtex, or .txt)');
        return;
      }

      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        setBibtexContent(e.target.result);
        if (error) setError(null);
        setShowPreview(false);
        setParsedEntries([]);
      };
      reader.onerror = () => {
        setError('Failed to read file. Please try again.');
      };
      reader.readAsText(file);
    }
  }, [error]);

  const handleUseSample = useCallback(() => {
    setBibtexContent(sampleBibtex);
    setFileName('');
    if (error) setError(null);
    setShowPreview(false);
    setParsedEntries([]);
  }, [error, sampleBibtex]);

  const handleClear = useCallback(() => {
    setBibtexContent('');
    setFileName('');
    setError(null);
    setShowPreview(false);
    setParsedEntries([]);
  }, []);

  return (
    <Box sx={{ maxWidth: 800 }}>
      <Typography variant="h6" gutterBottom sx={{ color: color }}>
        Import BibTeX File
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Upload a BibTeX file or paste BibTeX content directly. Preview the parsed entries 
        before importing them to your publication library.
      </Typography>

      {/* File Info */}
      {fileName && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BibtexIcon sx={{ mr: 1 }} />
            <Typography variant="body2">
              Loaded file: <strong>{fileName}</strong>
            </Typography>
          </Box>
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* File Upload Section */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: '#f8f9fa', border: '2px dashed #ddd' }}>
        <Box sx={{ textAlign: 'center' }}>
          <input
            type="file"
            accept=".bib,.bibtex,.txt"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            id="bibtex-upload"
            disabled={loading}
          />
          <label htmlFor="bibtex-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<FileUploadIcon />}
              disabled={loading}
              sx={{ 
                borderColor: color, 
                color,
                '&:hover': {
                  borderColor: color === '#8b6cbc' ? '#7559a3' : `${color}CC`,
                  bgcolor: `${color}10`
                }
              }}
            >
              Upload BibTeX File
            </Button>
          </label>
          <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
            Supported formats: .bib, .bibtex, .txt
          </Typography>
        </Box>
      </Paper>

      <Divider sx={{ mb: 3 }}>
        <Typography variant="caption" color="text.secondary">
          OR PASTE CONTENT BELOW
        </Typography>
      </Divider>

      {/* BibTeX Content Input */}
      <TextField
        fullWidth
        multiline
        rows={12}
        label="BibTeX Content"
        placeholder={sampleBibtex}
        value={bibtexContent}
        onChange={handleContentChange}
        disabled={loading}
        sx={{ 
          mb: 2,
          '& .MuiInputBase-input': {
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            fontSize: '0.875rem'
          }
        }}
        helperText="Paste your BibTeX entries here"
      />

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          onClick={handlePreview}
          disabled={loading || !bibtexContent.trim()}
          startIcon={<PreviewIcon />}
          sx={{ 
            bgcolor: color, 
            '&:hover': { 
              bgcolor: color === '#8b6cbc' ? '#7559a3' : `${color}CC` 
            },
            '&:disabled': {
              bgcolor: '#cccccc'
            }
          }}
        >
          {loading ? 'Parsing...' : 'Preview Entries'}
        </Button>

        {showPreview && parsedEntries.length > 0 && (
          <Button
            variant="contained"
            onClick={handleImport}
            disabled={loading}
            startIcon={<CheckIcon />}
            sx={{ 
              bgcolor: '#4caf50', 
              '&:hover': { 
                bgcolor: '#45a049' 
              },
              '&:disabled': {
                bgcolor: '#cccccc'
              }
            }}
          >
            {loading ? 'Importing...' : `Import ${parsedEntries.length} Entries`}
          </Button>
        )}

        <Button
          variant="outlined"
          onClick={handleUseSample}
          disabled={loading}
          sx={{ 
            borderColor: `${color}80`, 
            color: `${color}80`,
            '&:hover': {
              borderColor: color,
              color,
              bgcolor: `${color}05`
            }
          }}
        >
          Use Sample
        </Button>

        <Button
          variant="outlined"
          onClick={handleClear}
          disabled={loading}
          sx={{ 
            borderColor: '#f44336', 
            color: '#f44336',
            '&:hover': {
              borderColor: '#d32f2f',
              color: '#d32f2f',
              bgcolor: '#ffebee'
            }
          }}
        >
          Clear
        </Button>
      </Box>

      {loading && <LinearProgress sx={{ mt: 2, color }} />}

      {/* Preview Section */}
      {showPreview && parsedEntries.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ color: color }}>
            Preview Parsed Entries ({parsedEntries.length})
          </Typography>
          
          <Grid container spacing={2}>
            {parsedEntries.map((entry, index) => (
              <Grid key={entry.id} item xs={12}>
                <Card sx={{ 
                  border: `1px solid ${color}40`,
                  '&:hover': {
                    boxShadow: `0 4px 12px ${color}20`
                  }
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" sx={{ color: color, flex: 1 }}>
                        {entry.title}
                      </Typography>
                      <Chip 
                        label={entry.type} 
                        size="small" 
                        sx={{ 
                          bgcolor: `${color}20`, 
                          color: color,
                          ml: 2
                        }} 
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Authors:</strong> {entry.authors.join(', ')}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Journal:</strong> {entry.journal}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                      {entry.year && (
                        <Chip label={`Year: ${entry.year}`} size="small" variant="outlined" />
                      )}
                      {entry.doi && (
                        <Chip label={`DOI: ${entry.doi}`} size="small" variant="outlined" />
                      )}
                      {entry.volume && (
                        <Chip label={`Vol: ${entry.volume}`} size="small" variant="outlined" />
                      )}
                      {entry.pages && (
                        <Chip label={`Pages: ${entry.pages}`} size="small" variant="outlined" />
                      )}
                    </Box>
                    
                    {entry.keywords && entry.keywords.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          <strong>Keywords:</strong> {entry.keywords.join(', ')}
                        </Typography>
                      </Box>
                    )}
                    
                    {entry.abstract && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          <strong>Abstract:</strong> {entry.abstract.substring(0, 200)}
                          {entry.abstract.length > 200 && '...'}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default React.memo(BibtexImport);
