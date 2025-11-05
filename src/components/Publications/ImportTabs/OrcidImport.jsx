'use client';

import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  AccountCircle as OrcidIcon
} from '@mui/icons-material';

const OrcidImport = ({ onImportSuccess, color = '#A6CE39' }) => {
  const [orcidId, setOrcidId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validateOrcidId = (id) => {
    const orcidPattern = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;
    return orcidPattern.test(id);
  };

  const handleImport = useCallback(async () => {
    if (!orcidId.trim()) {
      setError('Please enter an ORCID ID');
      return;
    }

    if (!validateOrcidId(orcidId.trim())) {
      setError('Please enter a valid ORCID ID (format: 0000-0000-0000-0000)');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful response
      const mockResults = [
        {
          id: Date.now() + 1,
          title: "Research advances in computational biology",
          authors: ["Jane Smith", "John Doe"],
          journal: "Nature Biotechnology",
          year: 2023,
          doi: "10.1038/nbt.4567",
          source: 'ORCID'
        },
        {
          id: Date.now() + 2,
          title: "Machine learning applications in healthcare",
          authors: ["Jane Smith", "Alice Johnson"],
          journal: "Science",
          year: 2023,
          doi: "10.1126/science.abc123",
          source: 'ORCID'
        }
      ];

      onImportSuccess(mockResults);
    } catch (err) {
      setError('Failed to import from ORCID. Please check your ORCID ID and try again.');
      console.error('ORCID import failed:', err);
    } finally {
      setLoading(false);
    }
  }, [orcidId, onImportSuccess]);

  const handleOrcidIdChange = useCallback((event) => {
    const value = event.target.value;
    setOrcidId(value);
    if (error) setError(null);
  }, [error]);

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h6" gutterBottom>
        Import from ORCID Profile
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter your ORCID identifier to automatically import your publications.
        Your ORCID ID can be found at <a href="https://orcid.org" target="_blank" rel="noopener noreferrer">orcid.org</a>.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        label="ORCID ID"
        placeholder="0000-0000-0000-0000"
        value={orcidId}
        onChange={handleOrcidIdChange}
        disabled={loading}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: <OrcidIcon sx={{ mr: 1, color }} />
        }}
        helperText="Format: 0000-0000-0000-0000"
      />

      {loading && <LinearProgress sx={{ mb: 2, color }} />}

      <Button
        variant="contained"
        onClick={handleImport}
        disabled={loading || !orcidId.trim()}
        sx={{ 
          bgcolor: color, 
          '&:hover': { 
            bgcolor: color === '#A6CE39' ? '#8BC34A' : `${color}CC` 
          },
          '&:disabled': {
            bgcolor: '#cccccc'
          }
        }}
      >
        {loading ? 'Importing...' : 'Import from ORCID'}
      </Button>
    </Box>
  );
};

export default React.memo(OrcidImport);
