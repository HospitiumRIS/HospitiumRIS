'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  IconButton
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

const OrcidSearchModal = ({ 
  open, 
  onClose, 
  onSelect, 
  title = "Search for Researcher",
  subtitle = "Search for researchers using ORCID database"
}) => {
  const [givenNames, setGivenNames] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!givenNames.trim() && !familyName.trim()) {
      setError('Please enter at least a given name or family name');
      return;
    }

    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (givenNames.trim()) {
        params.append('givenNames', givenNames.trim());
      }
      if (familyName.trim()) {
        params.append('familyName', familyName.trim());
      }

      // Call our API endpoint which interfaces with ORCID
      const response = await fetch(`/api/orcid/search?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search ORCID database');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error('Search was not successful');
      }

      setSearchResults(data.researchers || []);
      
      if (data.researchers.length === 0) {
        console.log('No researchers found for the given search terms');
      }

    } catch (err) {
      console.error('ORCID Search Error:', err);
      setError(err.message || 'Failed to search ORCID database. Please try again.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (researcher) => {
    onSelect(researcher);
    handleClose();
  };

  const handleClose = () => {
    setGivenNames('');
    setFamilyName('');
    setSearchResults([]);
    setError('');
    setHasSearched(false);
    setLoading(false);
    onClose();
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1,
        borderBottom: '1px solid #e0e0e0'
      }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748' }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
            {subtitle}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Search Form */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            Search for your ORCID profile using your name
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Given Names"
              placeholder="First and middle names"
              value={givenNames}
              onChange={(e) => setGivenNames(e.target.value)}
              onKeyPress={handleKeyPress}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#8b6cbc',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#8b6cbc',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#8b6cbc',
                },
              }}
            />
            <TextField
              fullWidth
              label="Family Name"
              placeholder="Last name"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              onKeyPress={handleKeyPress}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#8b6cbc',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#8b6cbc',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#8b6cbc',
                },
              }}
            />
          </Box>

          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
            onClick={handleSearch}
            disabled={loading || (!givenNames.trim() && !familyName.trim())}
            sx={{
              backgroundColor: '#8b6cbc',
              '&:hover': {
                backgroundColor: '#7a5aa8',
              },
              '&:disabled': {
                backgroundColor: '#e0e0e0',
              },
              borderRadius: 2,
              px: 3,
              py: 1
            }}
          >
            {loading ? 'Searching ORCID Database...' : 'Search ORCID'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#8b6cbc', mb: 2 }} />
            <Typography variant="body1" sx={{ color: '#666' }}>
              Searching ORCID database...
            </Typography>
            <Typography variant="body2" sx={{ color: '#999', mt: 1 }}>
              This may take a few moments as we fetch detailed profiles
            </Typography>
          </Box>
        )}

        {/* Search Results */}
        {hasSearched && !loading && (
          <Box>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Search Results ({searchResults.length} found)
            </Typography>

            {searchResults.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <PersonIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                <Typography variant="body1" sx={{ color: '#666' }}>
                  No researchers found with the given name.
                </Typography>
                <Typography variant="body2" sx={{ color: '#999', mt: 1 }}>
                  Try adjusting your search terms or check the spelling.
                </Typography>
              </Box>
            ) : (
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {searchResults.map((researcher, index) => (
                  <ListItem key={researcher.orcidId} disablePadding>
                    <ListItemButton
                      onClick={() => handleSelect(researcher)}
                      sx={{
                        borderRadius: 2,
                        mb: 1,
                        border: '1px solid #e0e0e0',
                        '&:hover': {
                          backgroundColor: 'rgba(139, 108, 188, 0.04)',
                          borderColor: '#8b6cbc',
                        }
                      }}
                    >
                      <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                          <PersonIcon sx={{ mr: 1, color: '#8b6cbc', mt: 0.5 }} />
                          <Box sx={{ flex: 1, mr: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                              {researcher.creditName || `${researcher.givenNames} ${researcher.familyName}`.trim()}
                            </Typography>
                            {researcher.givenNames && researcher.familyName && researcher.creditName && 
                             researcher.creditName !== `${researcher.givenNames} ${researcher.familyName}`.trim() && (
                              <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
                                ({researcher.givenNames} {researcher.familyName})
                              </Typography>
                            )}
                          </Box>
                          <Chip
                            label={researcher.orcidId}
                            size="small"
                            sx={{
                              backgroundColor: '#8b6cbc',
                              color: 'white',
                              fontSize: '0.7rem',
                              fontFamily: 'monospace'
                            }}
                          />
                        </Box>
                        
                        {researcher.employmentSummary && researcher.employmentSummary !== 'Researcher' && (
                          <Typography variant="body2" sx={{ color: '#666', mb: 0.5, fontStyle: 'italic' }}>
                            {researcher.employmentSummary}
                          </Typography>
                        )}
                        
                        {researcher.affiliations && researcher.affiliations.length > 0 && (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                            {researcher.affiliations.slice(0, 3).map((affiliation, idx) => (
                              <Chip
                                key={idx}
                                label={affiliation}
                                size="small"
                                variant="outlined"
                                sx={{
                                  fontSize: '0.7rem',
                                  height: 20,
                                  borderColor: '#8b6cbc',
                                  color: '#8b6cbc',
                                  maxWidth: '200px'
                                }}
                              />
                            ))}
                            {researcher.affiliations.length > 3 && (
                              <Chip
                                label={`+${researcher.affiliations.length - 3} more`}
                                size="small"
                                variant="outlined"
                                sx={{
                                  fontSize: '0.7rem',
                                  height: 20,
                                  borderColor: '#ccc',
                                  color: '#666'
                                }}
                              />
                            )}
                          </Box>
                        )}
                      </Box>
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button 
          onClick={handleClose}
          sx={{ 
            color: '#666',
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.04)'
            }
          }}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrcidSearchModal;
