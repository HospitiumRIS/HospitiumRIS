'use client';

import React, { useState, useEffect } from 'react';
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
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Book as BookIcon,
  Article as ArticleIcon,
  School as ConferenceIcon,
  MenuBook as ChapterIcon,
  Launch as LaunchIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';

const ManageSourcesModal = ({ 
  open, 
  onClose, 
  manuscriptId,
  citationStyle = 'APA' 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [sortAnchor, setSortAnchor] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dateAdded');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Database state
  const [citations, setCitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch manuscript citations
  useEffect(() => {
    const fetchManuscriptCitations = async () => {
      if (!open || !manuscriptId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/manuscripts/${manuscriptId}/citations`);
        const data = await response.json();
        
        if (data.success) {
          setCitations(data.citations || []);
          setTotalCount(data.totalCount || 0);
        } else {
          setError(data.error || 'Failed to fetch manuscript citations');
        }
      } catch (err) {
        console.error('Error fetching manuscript citations:', err);
        setError('Failed to connect to database. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchManuscriptCitations();
  }, [open, manuscriptId]);

  // Filter and sort citations
  const filteredAndSortedCitations = React.useMemo(() => {
    if (!citations || citations.length === 0) return [];
    
    let filtered = [...citations];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(citation => 
        citation.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        citation.authors?.some(author => author.toLowerCase().includes(searchTerm.toLowerCase())) ||
        citation.journal?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        citation.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply type filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(citation => citation.type === selectedFilter);
    }

    // Apply sorting
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
        case 'citationCount':
          aValue = a.citationCount || 0;
          bValue = b.citationCount || 0;
          break;
        default:
          aValue = a.dateAdded || '';
          bValue = b.dateAdded || '';
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [citations, searchTerm, selectedFilter, sortBy, sortOrder]);

  const getPublicationIcon = (type) => {
    switch (type) {
      case 'journal': return <ArticleIcon fontSize="small" />;
      case 'book': return <BookIcon fontSize="small" />;
      case 'conference': return <ConferenceIcon fontSize="small" />;
      case 'book_chapter': return <ChapterIcon fontSize="small" />;
      default: return <ArticleIcon fontSize="small" />;
    }
  };

  const formatCitation = (citation) => {
    switch (citationStyle) {
      case 'APA':
        if (citation.type === 'journal') {
          const authorText = citation.authors?.length > 0 
            ? citation.authors.length === 1 
              ? citation.authors[0]
              : `${citation.authors[0]} et al.`
            : 'Unknown Author';
          return `${authorText} (${citation.year}). ${citation.title}. ${citation.journal}.`;
        }
        break;
      case 'MLA':
        if (citation.authors?.length > 0) {
          return `${citation.authors[0]}. "${citation.title}." ${citation.journal}, ${citation.year}.`;
        }
        break;
      case 'Chicago':
        if (citation.authors?.length > 0) {
          return `${citation.authors[0]}. "${citation.title}." ${citation.journal} (${citation.year}).`;
        }
        break;
      default:
        return citation.title;
    }
  };

  const handleRemoveCitation = async (citationId) => {
    try {
      const response = await fetch(
        `/api/manuscripts/${manuscriptId}/citations?publicationId=${citationId}`, 
        { method: 'DELETE' }
      );
      
      const result = await response.json();
      if (result.success) {
        setCitations(prev => prev.filter(c => c.id !== citationId));
        setTotalCount(prev => prev - 1);
      } else {
        setError(result.error || 'Failed to remove citation');
      }
    } catch (err) {
      console.error('Error removing citation:', err);
      setError('Failed to remove citation');
    }
  };

  const handleCopyFormattedCitation = (citation) => {
    const formatted = formatCitation(citation);
    navigator.clipboard.writeText(formatted);
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
                Manage Sources
              </Typography>
              <Chip 
                icon={<BookIcon fontSize="small" />}
                label={`${totalCount} citations in this manuscript`}
                size="small"
                variant="outlined"
                sx={{ 
                  fontSize: '0.75rem',
                  color: '#666',
                  borderColor: '#ddd'
                }}
              />
            </Box>
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

          {/* Search and Controls */}
          <Box sx={{ p: 3, borderBottom: '1px solid #f0f0f0' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                fullWidth
                size="small"
                placeholder="Search manuscript citations..."
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
            </Stack>
          </Box>

          {/* Citations Table */}
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
                    Loading manuscript citations...
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
                  No citations in this manuscript
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {searchTerm || selectedFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Start citing publications in your manuscript to build your citation library.'
                  }
                </Typography>
              </Box>
            )}

            {/* Citations Table */}
            {!loading && !error && filteredAndSortedCitations.length > 0 && (
              <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid #f0f0f0' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#fafafa' }}>
                      <TableCell sx={{ fontWeight: 600, color: '#333' }}>Publication</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#333', minWidth: 100 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#333', minWidth: 100 }}>Year</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#333', minWidth: 100 }}>Citations</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#333', minWidth: 120 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredAndSortedCitations.map((citation) => (
                      <TableRow 
                        key={citation.id}
                        sx={{ 
                          '&:hover': { bgcolor: '#f9f9f9' },
                          '&:last-child td': { border: 0 }
                        }}
                      >
                        <TableCell>
                          <Box>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                mb: 0.5,
                                lineHeight: 1.3
                              }}
                            >
                              {citation.title}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              color="textSecondary"
                              sx={{ fontSize: '0.8rem' }}
                            >
                              {citation.authors?.join(', ')}
                            </Typography>
                            {citation.journal && (
                              <Typography 
                                variant="caption" 
                                color="primary"
                                sx={{ 
                                  display: 'block',
                                  fontSize: '0.75rem',
                                  mt: 0.25
                                }}
                              >
                                {citation.journal}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getPublicationIcon(citation.type)}
                            <Typography variant="caption" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                              {citation.type}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {citation.year || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`${citation.citationCount} time${citation.citationCount !== 1 ? 's' : ''}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Copy formatted citation">
                              <IconButton 
                                size="small"
                                onClick={() => handleCopyFormattedCitation(citation)}
                                sx={{ color: '#666' }}
                              >
                                <CopyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {citation.url && (
                              <Tooltip title="Open publication">
                                <IconButton 
                                  size="small"
                                  onClick={() => window.open(citation.url, '_blank')}
                                  sx={{ color: '#666' }}
                                >
                                  <LaunchIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Remove from manuscript">
                              <IconButton 
                                size="small"
                                onClick={() => handleRemoveCitation(citation.id)}
                                sx={{ color: '#d32f2f' }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
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
              {loading ? 'Loading...' : `${filteredAndSortedCitations.length} of ${totalCount} citations shown`}
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
        </Menu>

        {/* Sort Menu */}
        <Menu
          anchorEl={sortAnchor}
          open={Boolean(sortAnchor)}
          onClose={() => setSortAnchor(null)}
        >
          <MenuItem onClick={() => { setSortBy('dateAdded'); setSortOrder('desc'); setSortAnchor(null); }}>
            <ListItemText>Recently Added</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { setSortBy('citationCount'); setSortOrder('desc'); setSortAnchor(null); }}>
            <ListItemText>Most Cited</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { setSortBy('title'); setSortOrder('asc'); setSortAnchor(null); }}>
            <ListItemText>Title (A-Z)</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { setSortBy('year'); setSortOrder('desc'); setSortAnchor(null); }}>
            <ListItemText>Year (Newest)</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { setSortBy('author'); setSortOrder('asc'); setSortAnchor(null); }}>
            <ListItemText>Author (A-Z)</ListItemText>
          </MenuItem>
        </Menu>
      </DialogContent>
    </Dialog>
  );
};

export default ManageSourcesModal;
