import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';

const OrcidSearchStep = ({ onOrcidSelect, onSkipOrcid, selectedOrcidProfile, errors }) => {
  const theme = useTheme();
  const [orcidSearchData, setOrcidSearchData] = useState({
    givenNames: '',
    familyName: '',
  });
  const [orcidLoading, setOrcidLoading] = useState(false);
  const [orcidResults, setOrcidResults] = useState([]);
  const [orcidError, setOrcidError] = useState(null);
  const [hasSearchedOrcid, setHasSearchedOrcid] = useState(false);

  // Handle ORCID search input changes
  const handleOrcidInputChange = (e) => {
    const { name, value } = e.target;
    setOrcidSearchData(prev => ({
      ...prev,
      [name]: value
    }));
    setHasSearchedOrcid(false);
    setOrcidError(null);
  };

  // Handle ORCID search
  const handleOrcidSearch = async () => {
    setOrcidLoading(true);
    setOrcidError(null);
    setHasSearchedOrcid(true);
    
    try {
      const baseUrl = 'https://pub.orcid.org/v3.0/expanded-search';
      const query = `given-names:${orcidSearchData.givenNames}+AND+family-name:${orcidSearchData.familyName}`;
      
      const response = await fetch(`${baseUrl}?q=${query}`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ORCID data: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || typeof data['num-found'] === 'undefined') {
        setOrcidError('Received invalid data format from ORCID API');
        return;
      }

      if (data['num-found'] === 0 || !data['expanded-result'] || !data['expanded-result'].length) {
        setOrcidResults([]);
        setOrcidError('No matching ORCID profiles found. Please try different search terms.');
        return;
      }

      const processedResults = data['expanded-result']
        .filter(result => result['orcid-id'] && result['given-names'] && result['family-names'])
        .map(result => ({
          'orcid-id': result['orcid-id'],
          'given-names': result['given-names'],
          'family-names': result['family-names'],
          'institution-name': Array.isArray(result['institution-name']) ? result['institution-name'] : []
        }))
        .slice(0, 5);

      setOrcidResults(processedResults);

      if (processedResults.length === 1) {
        handleOrcidProfileSelect(processedResults[0]);
      }

      if (processedResults.length === 0) {
        setOrcidError('No valid ORCID profiles found. Please try different search terms.');
      }
    } catch (err) {
      console.error('ORCID search error:', err);
      setOrcidError('Failed to search ORCID. Please try again later.');
    } finally {
      setOrcidLoading(false);
    }
  };

  // Handle ORCID profile selection
  const handleOrcidProfileSelect = (profile) => {
    onOrcidSelect(profile);
  };


  // Clear ORCID search results
  const handleClearOrcidResults = () => {
    setOrcidResults([]);
    setOrcidSearchData({
      givenNames: '',
      familyName: ''
    });
    setHasSearchedOrcid(false);
    setOrcidError(null);
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, textAlign: 'center' }}>
        Find Your ORCID Profile
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
        Search for your ORCID profile using your name
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          label="Given Names"
          name="givenNames"
          value={orcidSearchData.givenNames}
          onChange={handleOrcidInputChange}
          fullWidth
          size="small"
        />
        <TextField
          label="Family Name"
          name="familyName"
          value={orcidSearchData.familyName}
          onChange={handleOrcidInputChange}
          fullWidth
          size="small"
        />
      </Box>

      <Box sx={{ display: 'flex', mb: 3 }}>
        <Button
          variant="contained"
          onClick={handleOrcidSearch}
          disabled={orcidLoading || !orcidSearchData.givenNames || !orcidSearchData.familyName}
          startIcon={orcidLoading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
          fullWidth
          sx={{
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
          }}
        >
          Search ORCID
        </Button>
      </Box>


      {selectedOrcidProfile && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Selected: {selectedOrcidProfile['given-names']} {selectedOrcidProfile['family-names']} 
          (ORCID: {selectedOrcidProfile['orcid-id']})
        </Alert>
      )}

      {orcidError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setOrcidError(null)}>
          {orcidError}
        </Alert>
      )}

      {orcidResults.length > 0 && (
        <Paper 
          variant="outlined" 
          sx={{ 
            position: 'relative',
            pt: 1.5,
            maxHeight: '300px',
            overflow: 'auto',
            mb: 2
          }}
        >
          <IconButton
            onClick={handleClearOrcidResults}
            aria-label="clear search results"
            size="small"
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: theme.palette.error.main,
              '&:hover': {
                backgroundColor: alpha(theme.palette.error.main, 0.1),
              },
              zIndex: 1
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
          <List dense>
            {orcidResults.map((result) => (
              <ListItem
                key={result['orcid-id']}
                divider
                component="div"
                onClick={() => handleOrcidProfileSelect(result)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <ListItemText
                  primary={`${result['given-names']} ${result['family-names']}`}
                  secondary={
                    <Box component="span">
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                        display="block"
                      >
                        ORCID: {result['orcid-id']}
                      </Typography>
                      {result['institution-name'].length > 0 && (
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                          display="block"
                          sx={{ mt: 0.25 }}
                        >
                          Affiliations: {result['institution-name'].join(', ')}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {orcidResults.length === 0 && hasSearchedOrcid && !orcidLoading && orcidSearchData.givenNames && orcidSearchData.familyName && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No ORCID profiles found matching your search. Please try different names or continue with manual registration.
        </Alert>
      )}

      <Box 
        sx={{ 
          pt: 2, 
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Don't have an ORCID?
        </Typography>
        <Button
          variant="outlined"
          href="https://orcid.org/register"
          target="_blank"
          rel="noopener noreferrer"
          size="small"
          sx={{
            borderColor: '#A6CE39',
            color: '#A6CE39',
            '&:hover': {
              borderColor: '#96bc34',
              backgroundColor: alpha('#A6CE39', 0.1),
            },
          }}
        >
          Register for ORCID
        </Button>
      </Box>

      {errors?.orcidSearch && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errors.orcidSearch}
        </Alert>
      )}
    </Box>
  );
};

export default OrcidSearchStep; 