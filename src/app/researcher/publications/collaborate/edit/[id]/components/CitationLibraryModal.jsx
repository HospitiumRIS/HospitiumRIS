'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Chip,
  InputAdornment,
  Divider,
  Stack,
  Card,
  CardContent,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Add as AddIcon,
  Sync as SyncIcon,
  Edit as EditIcon,
  Book as BookIcon,
  Article as ArticleIcon,
  School as ConferenceIcon,
  MenuBook as ChapterIcon
} from '@mui/icons-material';

const CitationLibraryModal = ({ 
  open, 
  onClose, 
  onCiteInsert, 
  citationStyle = 'APA' 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [sortAnchor, setSortAnchor] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('title');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Database state
  const [citations, setCitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch citations from database
  useEffect(() => {
    const fetchCitations = async () => {
      if (!open) return; // Only fetch when modal is open
      
      setLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams({
          search: searchTerm,
          type: selectedFilter,
          limit: '100', // Fetch up to 100 citations
          offset: '0'
        });
        
        const response = await fetch(`/api/citations?${params}`);
        const data = await response.json();
        
        if (data.success) {
          setCitations(data.citations || []);
          setTotalCount(data.pagination?.total || 0);
        } else {
          setError(data.error || 'Failed to fetch citations');
        }
      } catch (err) {
        console.error('Error fetching citations:', err);
        setError('Failed to connect to database. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCitations();
  }, [open, searchTerm, selectedFilter]); // Refetch when search or filter changes

  // Filter and sort citations (now works with real database data)
  const filteredAndSortedCitations = useMemo(() => {
    if (!citations || citations.length === 0) return [];
    
    let filtered = [...citations];

    // Client-side sorting (since we get pre-filtered data from API)
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title || '';
          bValue = b.title || '';
          break;
        case 'year':
          aValue = a.year || 0;
          bValue = b.year || 0;
          break;
        case 'author':
          aValue = a.authors?.[0] || '';
          bValue = b.authors?.[0] || '';
          break;
        case 'dateAdded':
          aValue = new Date(a.dateAdded || 0);
          bValue = new Date(b.dateAdded || 0);
          break;
        default:
          aValue = a.title || '';
          bValue = b.title || '';
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [citations, sortBy, sortOrder]);

  const getPublicationIcon = (type) => {
    switch (type) {
      case 'journal': return <ArticleIcon fontSize="small" />;
      case 'book': return <BookIcon fontSize="small" />;
      case 'conference': return <ConferenceIcon fontSize="small" />;
      case 'book_chapter': return <ChapterIcon fontSize="small" />;
      default: return <ArticleIcon fontSize="small" />;
    }
  };

  const getSourceColor = (source) => {
    switch (source) {
      case 'zotero': return '#cc2a36';
      case 'imported': return '#1976d2';
      case 'manual': return '#388e3c';
      default: return '#666';
    }
  };

  const formatCitation = (citation) => {
    switch (citationStyle) {
      case 'APA':
        if (citation.type === 'journal') {
          return `(${citation.authors?.[0]?.split(',')[0]} et al., ${citation.year})`;
        } else if (citation.type === 'book') {
          return `(${citation.authors?.[0]?.split(',')[0]} ${citation.authors?.length > 1 ? '& ' + citation.authors[1]?.split(',')[0] : ''}, ${citation.year})`;
        }
        break;
      case 'MLA':
        return `(${citation.authors?.[0]?.split(',')[0]} ${citation.year})`;
      case 'Chicago':
        return `(${citation.authors?.[0]?.split(',')[0]} ${citation.year})`;
      default:
        return `(${citation.authors?.[0]?.split(',')[0]} et al., ${citation.year})`;
    }
  };

  const handleCite = (citation) => {
    if (onCiteInsert) {
      onCiteInsert(citation);
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: '80vh',
          borderRadius: 3,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
        }
      }}
    >
      <DialogContent sx={{ p: 0, height: '100%' }}>
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box sx={{ 
            p: 3, 
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#333' }}>
                Citation Library
              </Typography>
              <Chip 
                icon={<BookIcon fontSize="small" />}
                label="Click sync icon to connect to Zotero"
                size="small"
                variant="outlined"
                sx={{ 
                  fontSize: '0.75rem',
                  color: '#666',
                  borderColor: '#ddd'
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton 
                size="small" 
                sx={{ 
                  color: '#666',
                  '&:hover': { bgcolor: '#f5f5f5' }
                }}
              >
                <SyncIcon />
              </IconButton>
              <IconButton 
                onClick={onClose}
                size="small"
                sx={{ 
                  color: '#666',
                  '&:hover': { bgcolor: '#f5f5f5' }
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Search and Controls */}
          <Box sx={{ p: 3, borderBottom: '1px solid #f0f0f0' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                fullWidth
                size="small"
                placeholder="Search citations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#999' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#f8f9fa'
                  }
                }}
              />
              
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={(e) => setFilterAnchor(e.currentTarget)}
                sx={{ 
                  minWidth: 120,
                  borderRadius: 2,
                  textTransform: 'none',
                  borderColor: '#ddd',
                  color: '#666'
                }}
              >
                Filter
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<SortIcon />}
                onClick={(e) => setSortAnchor(e.currentTarget)}
                sx={{ 
                  minWidth: 120,
                  borderRadius: 2,
                  textTransform: 'none',
                  borderColor: '#ddd',
                  color: '#666'
                }}
              >
                Sort
              </Button>
              
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                sx={{ 
                  minWidth: 140,
                  borderRadius: 2,
                  textTransform: 'none',
                  bgcolor: '#8b6cbc',
                  '&:hover': { bgcolor: '#7a5ba8' }
                }}
              >
                Add Citation
              </Button>
            </Stack>
          </Box>

          {/* Citations List */}
          <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
            {/* Error State */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Loading State */}
            {loading && (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                minHeight: 200 
              }}>
                <Box sx={{ textAlign: 'center' }}>
                  <CircularProgress sx={{ color: '#8b6cbc', mb: 2 }} />
                  <Typography variant="body2" color="textSecondary">
                    Loading citations from database...
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Empty State */}
            {!loading && !error && filteredAndSortedCitations.length === 0 && (
              <Box sx={{ 
                textAlign: 'center', 
                py: 8,
                color: '#666'
              }}>
                <BookIcon sx={{ fontSize: 48, color: '#ddd', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  No citations found
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {searchTerm || selectedFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Your citation library is empty. Import some publications to get started.'
                  }
                </Typography>
              </Box>
            )}

            {/* Citations List */}
            {!loading && !error && filteredAndSortedCitations.length > 0 && (
              <Stack spacing={2}>
                {filteredAndSortedCitations.map((citation, index) => (
                <Card 
                  key={citation.id || index}
                  sx={{ 
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    border: '1px solid #f0f0f0',
                    '&:hover': {
                      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                      borderColor: '#8b6cbc30'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      {/* Publication Icon */}
                      <Box sx={{ 
                        p: 1, 
                        borderRadius: 1, 
                        bgcolor: '#f8f9fa',
                        color: '#666',
                        mt: 0.5
                      }}>
                        {getPublicationIcon(citation.type)}
                      </Box>

                      {/* Citation Content */}
                      <Box sx={{ flexGrow: 1 }}>
                        {/* Title */}
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 600,
                            fontSize: '1.1rem',
                            color: '#333',
                            mb: 0.5,
                            lineHeight: 1.3
                          }}
                        >
                          {citation.title}
                        </Typography>

                        {/* Authors and Year */}
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#666',
                            mb: 0.5,
                            fontSize: '0.9rem'
                          }}
                        >
                          {citation.authors?.join(', ')} ({citation.year})
                        </Typography>

                        {/* Publication Details */}
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#888',
                            mb: 1.5,
                            fontSize: '0.85rem'
                          }}
                        >
                          {citation.type === 'journal' && citation.journal && 
                            `${citation.journal}. Journal of Medical Technology, 45(3), 123-145.`
                          }
                          {citation.type === 'book' && 
                            `${citation.publisher}. Academic Press.`
                          }
                          {citation.type === 'conference' && 
                            `${citation.conference}. Academic Press.`
                          }
                          {citation.type === 'book_chapter' && 
                            `${citation.book}. ${citation.publisher}.`
                          }
                        </Typography>

                        {/* Tags */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                          <Chip
                            label={citation.source}
                            size="small"
                            sx={{
                              fontSize: '0.7rem',
                              height: 20,
                              bgcolor: getSourceColor(citation.source),
                              color: 'white',
                              fontWeight: 500
                            }}
                          />
                          {citation.tags?.map((tag) => (
                            <Chip
                              key={tag}
                              label={tag}
                              size="small"
                              variant="outlined"
                              sx={{
                                fontSize: '0.7rem',
                                height: 20,
                                borderColor: '#ddd',
                                color: '#666'
                              }}
                            />
                          ))}
                        </Box>
                      </Box>

                      {/* Action Buttons */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleCite(citation)}
                          sx={{
                            bgcolor: '#8b6cbc',
                            '&:hover': { bgcolor: '#7a5ba8' },
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 2
                          }}
                        >
                          Cite
                        </Button>
                        <IconButton 
                          size="small"
                          sx={{ 
                            color: '#999',
                            '&:hover': { color: '#666', bgcolor: '#f5f5f5' }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
              </Stack>
            )}
          </Box>

          {/* Footer */}
          <Box sx={{ 
            p: 3, 
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: '#fafafa'
          }}>
            <Typography variant="body2" color="textSecondary">
              {loading ? 'Loading...' : `${totalCount} citations in database • ${filteredAndSortedCitations.length} shown`}
            </Typography>
            <Button 
              onClick={onClose}
              sx={{ 
                textTransform: 'none',
                color: '#666'
              }}
            >
              Close
            </Button>
          </Box>
        </Box>

        {/* Filter Menu */}
        <Menu
          anchorEl={filterAnchor}
          open={Boolean(filterAnchor)}
          onClose={() => setFilterAnchor(null)}
        >
          <MenuItem onClick={() => { setSelectedFilter('all'); setFilterAnchor(null); }}>
            <ListItemText>All Types</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { setSelectedFilter('journal'); setFilterAnchor(null); }}>
            <ListItemIcon><ArticleIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Journal Articles</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { setSelectedFilter('book'); setFilterAnchor(null); }}>
            <ListItemIcon><BookIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Books</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { setSelectedFilter('conference'); setFilterAnchor(null); }}>
            <ListItemIcon><ConferenceIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Conference Papers</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { setSelectedFilter('book_chapter'); setFilterAnchor(null); }}>
            <ListItemIcon><ChapterIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Book Chapters</ListItemText>
          </MenuItem>
        </Menu>

        {/* Sort Menu */}
        <Menu
          anchorEl={sortAnchor}
          open={Boolean(sortAnchor)}
          onClose={() => setSortAnchor(null)}
        >
          <MenuItem onClick={() => { setSortBy('title'); setSortOrder('asc'); setSortAnchor(null); }}>
            <ListItemText>Title (A-Z)</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { setSortBy('title'); setSortOrder('desc'); setSortAnchor(null); }}>
            <ListItemText>Title (Z-A)</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { setSortBy('year'); setSortOrder('desc'); setSortAnchor(null); }}>
            <ListItemText>Year (Newest)</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { setSortBy('year'); setSortOrder('asc'); setSortAnchor(null); }}>
            <ListItemText>Year (Oldest)</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { setSortBy('author'); setSortOrder('asc'); setSortAnchor(null); }}>
            <ListItemText>Author (A-Z)</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { setSortBy('dateAdded'); setSortOrder('desc'); setSortAnchor(null); }}>
            <ListItemText>Recently Added</ListItemText>
          </MenuItem>
        </Menu>
      </DialogContent>
    </Dialog>
  );
};

export default CitationLibraryModal;
