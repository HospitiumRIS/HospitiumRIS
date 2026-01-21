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
  ContentCopy as CopyIcon,
  ManageSearch as ManageSearchIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  FormatQuote as FormatQuoteIcon
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
          height: '85vh',
          maxHeight: '900px',
          borderRadius: 3,
          boxShadow: '0 24px 80px rgba(139, 108, 188, 0.15)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogContent sx={{ p: 0, height: '100%' }}>
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box sx={{ 
            background: 'linear-gradient(135deg, #8b6cbc 0%, #9d7ec9 100%)',
            p: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(139, 108, 188, 0.15)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ManageSearchIcon sx={{ fontSize: 28, color: 'white' }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
                  Manage Sources
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.875rem' }}>
                  View and manage manuscript citations
                </Typography>
              </Box>
            </Box>
            <IconButton 
              onClick={onClose}
              size="small"
              sx={{ 
                color: 'white',
                bgcolor: 'rgba(255, 255, 255, 0.15)',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Stats Bar */}
          <Box sx={{ 
            px: 3, 
            py: 2, 
            bgcolor: '#f8f9fa',
            borderBottom: '1px solid #e9ecef',
            display: 'flex',
            gap: 3,
            alignItems: 'center'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                bgcolor: '#8b6cbc15',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FormatQuoteIcon sx={{ fontSize: 20, color: '#8b6cbc' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem', color: '#2d3748' }}>
                  {totalCount}
                </Typography>
                <Typography variant="caption" sx={{ color: '#718096', fontSize: '0.75rem' }}>
                  Total Citations
                </Typography>
              </Box>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                bgcolor: '#10b98115',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrendingUpIcon sx={{ fontSize: 20, color: '#10b981' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem', color: '#2d3748' }}>
                  {filteredAndSortedCitations.reduce((sum, c) => sum + (c.citationCount || 0), 0)}
                </Typography>
                <Typography variant="caption" sx={{ color: '#718096', fontSize: '0.75rem' }}>
                  Total Uses
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Search and Controls */}
          <Box sx={{ p: 3, borderBottom: '1px solid #e9ecef', bgcolor: 'white' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                fullWidth
                size="medium"
                placeholder="Search by title, author, journal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#8b6cbc' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                    bgcolor: '#f8f9fa',
                    border: '2px solid transparent',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: 'white',
                      borderColor: '#e2e8f0'
                    },
                    '&.Mui-focused': {
                      bgcolor: 'white',
                      borderColor: '#8b6cbc',
                      boxShadow: '0 0 0 3px rgba(139, 108, 188, 0.1)'
                    },
                    '& fieldset': {
                      border: 'none'
                    }
                  }
                }}
              />
              
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={(e) => setFilterAnchor(e.currentTarget)}
                sx={{ 
                  minWidth: 110,
                  borderRadius: 2,
                  textTransform: 'none',
                  borderColor: '#e2e8f0',
                  color: '#64748b',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: '#8b6cbc',
                    color: '#8b6cbc',
                    bgcolor: '#8b6cbc05'
                  }
                }}
              >
                Filter
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<SortIcon />}
                onClick={(e) => setSortAnchor(e.currentTarget)}
                sx={{ 
                  minWidth: 110,
                  borderRadius: 2,
                  textTransform: 'none',
                  borderColor: '#e2e8f0',
                  color: '#64748b',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: '#8b6cbc',
                    color: '#8b6cbc',
                    bgcolor: '#8b6cbc05'
                  }
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
              <TableContainer component={Paper} sx={{ 
                borderRadius: 2.5, 
                border: '1px solid #e9ecef',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
              }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                      <TableCell sx={{ fontWeight: 700, color: '#2d3748', fontSize: '0.875rem', py: 2 }}>Publication</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#2d3748', fontSize: '0.875rem', minWidth: 100, py: 2 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#2d3748', fontSize: '0.875rem', minWidth: 100, py: 2 }}>Year</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#2d3748', fontSize: '0.875rem', minWidth: 120, py: 2 }}>Usage</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#2d3748', fontSize: '0.875rem', minWidth: 140, py: 2 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredAndSortedCitations.map((citation) => (
                      <TableRow 
                        key={citation.id}
                        sx={{ 
                          transition: 'all 0.2s',
                          '&:hover': { bgcolor: '#f8f9fa' },
                          '&:last-child td': { border: 0 }
                        }}
                      >
                        <TableCell sx={{ py: 2.5 }}>
                          <Box>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 700,
                                fontSize: '0.9375rem',
                                mb: 0.5,
                                lineHeight: 1.4,
                                color: '#1a202c'
                              }}
                            >
                              {citation.title}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                fontSize: '0.8125rem',
                                color: '#4a5568',
                                display: 'block',
                                mb: 0.25
                              }}
                            >
                              {citation.authors?.join(', ')}
                            </Typography>
                            {citation.journal && (
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  display: 'block',
                                  fontSize: '0.75rem',
                                  color: '#8b6cbc',
                                  fontStyle: 'italic',
                                  mt: 0.25
                                }}
                              >
                                {citation.journal}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 2.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{
                              width: 32,
                              height: 32,
                              borderRadius: 1.5,
                              bgcolor: '#8b6cbc10',
                              color: '#8b6cbc',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {getPublicationIcon(citation.type)}
                            </Box>
                            <Typography variant="caption" sx={{ 
                              textTransform: 'capitalize', 
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: '#4a5568'
                            }}>
                              {citation.type.replace('_', ' ')}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 2.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#2d3748' }}>
                            {citation.year || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 2.5 }}>
                          <Chip 
                            label={`${citation.citationCount} time${citation.citationCount !== 1 ? 's' : ''}`}
                            size="small"
                            sx={{ 
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              height: 26,
                              bgcolor: '#8b6cbc15',
                              color: '#8b6cbc',
                              border: 'none'
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ py: 2.5 }}>
                          <Box sx={{ display: 'flex', gap: 0.75 }}>
                            <Tooltip title="Copy formatted citation">
                              <IconButton 
                                size="small"
                                onClick={() => handleCopyFormattedCitation(citation)}
                                sx={{ 
                                  color: '#64748b',
                                  '&:hover': { 
                                    color: '#8b6cbc',
                                    bgcolor: '#8b6cbc10'
                                  }
                                }}
                              >
                                <CopyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {citation.url && (
                              <Tooltip title="Open publication">
                                <IconButton 
                                  size="small"
                                  onClick={() => window.open(citation.url, '_blank')}
                                  sx={{ 
                                    color: '#64748b',
                                    '&:hover': { 
                                      color: '#10b981',
                                      bgcolor: '#10b98110'
                                    }
                                  }}
                                >
                                  <LaunchIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Remove from manuscript">
                              <IconButton 
                                size="small"
                                onClick={() => handleRemoveCitation(citation.id)}
                                sx={{ 
                                  color: '#64748b',
                                  '&:hover': { 
                                    color: '#ef4444',
                                    bgcolor: '#ef444410'
                                  }
                                }}
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
            borderTop: '1px solid #e9ecef',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: '#f8f9fa'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                {loading ? 'Loading...' : `${filteredAndSortedCitations.length} of ${totalCount} citations displayed`}
              </Typography>
              {!loading && filteredAndSortedCitations.length > 0 && (
                <Chip
                  icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                  label="Synced"
                  size="small"
                  sx={{
                    height: 24,
                    bgcolor: '#10b98115',
                    color: '#10b981',
                    fontWeight: 600,
                    fontSize: '0.75rem'
                  }}
                />
              )}
            </Box>
            <Button 
              onClick={onClose}
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
