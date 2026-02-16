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
  MenuBook as ChapterIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  ChevronRight as ChevronRightIcon,
  ExpandMore as ExpandMoreIcon,
  ViewList as ViewListIcon,
  AccountTree as AccountTreeIcon,
  LibraryBooks as LibraryBooksIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon
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
  
  // View mode: 'all' or 'folders'
  const [viewMode, setViewMode] = useState('all');
  
  // Folder state
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [folderPublications, setFolderPublications] = useState({});
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  
  // Database state
  const [citations, setCitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch library folders
  useEffect(() => {
    const fetchLibrary = async () => {
      if (!open) return;
      
      try {
        const response = await fetch('/api/publications/library');
        const data = await response.json();
        
        if (data.success) {
          setFolders(data.folders || []);
          setFolderPublications(data.folderPublications || {});
          console.log('Loaded folders:', data.folders);
          console.log('Folder publications mapping:', data.folderPublications);
        }
      } catch (err) {
        console.error('Error fetching library:', err);
      }
    };

    fetchLibrary();
  }, [open]);

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

  // Get publications in selected folder
  const getPublicationsInFolder = (folderId) => {
    const pubIds = folderPublications[folderId] || [];
    return citations.filter(cit => pubIds.includes(cit.id));
  };

  // Toggle folder expansion
  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  // Filter and sort citations (now works with real database data)
  const filteredAndSortedCitations = useMemo(() => {
    if (!citations || citations.length === 0) return [];
    
    let filtered = [...citations];
    
    // Filter by folder if in folder view mode
    if (viewMode === 'folders' && selectedFolder) {
      const pubIds = folderPublications[selectedFolder] || [];
      console.log('Selected folder:', selectedFolder);
      console.log('Publication IDs in this folder:', pubIds);
      console.log('Total citations available:', citations.length);
      filtered = filtered.filter(cit => pubIds.includes(cit.id));
      console.log('Filtered citations count:', filtered.length);
    }

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
  }, [citations, sortBy, sortOrder, viewMode, selectedFolder, folderPublications]);

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

  // Render folder tree recursively
  const renderFolderTree = (folder, level = 0) => {
    const hasChildren = folders.some(f => f.parent === folder.id);
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolder === folder.id;
    const pubCount = (folderPublications[folder.id] || []).length;

    return (
      <Box key={folder.id}>
        <Box
          onClick={() => setSelectedFolder(folder.id)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            py: 1,
            px: 1.5,
            pl: 1.5 + level * 2,
            cursor: 'pointer',
            bgcolor: isSelected ? '#8b6cbc15' : 'transparent',
            borderLeft: isSelected ? '3px solid #8b6cbc' : '3px solid transparent',
            borderRadius: 1,
            mb: 0.5,
            '&:hover': {
              bgcolor: isSelected ? '#8b6cbc15' : '#8b6cbc08'
            }
          }}
        >
          {hasChildren && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}
              sx={{ p: 0, mr: 0.5 }}
            >
              {isExpanded ? (
                <ExpandMoreIcon fontSize="small" />
              ) : (
                <ChevronRightIcon fontSize="small" />
              )}
            </IconButton>
          )}
          {!hasChildren && <Box sx={{ width: 24, mr: 0.5 }} />}
          {isSelected ? (
            <FolderOpenIcon sx={{ fontSize: 18, color: '#8b6cbc', mr: 1 }} />
          ) : (
            <FolderIcon sx={{ fontSize: 18, color: '#8b6cbc', mr: 1 }} />
          )}
          <Typography 
            variant="body2" 
            sx={{ 
              flex: 1,
              fontWeight: isSelected ? 600 : 400,
              fontSize: '0.875rem'
            }}
          >
            {folder.name}
          </Typography>
          <Chip
            label={pubCount}
            size="small"
            sx={{
              height: 18,
              fontSize: '0.7rem',
              bgcolor: isSelected ? '#8b6cbc' : '#e0e0e0',
              color: isSelected ? 'white' : '#666'
            }}
          />
        </Box>
        {hasChildren && isExpanded && (
          <Box>
            {folders
              .filter(f => f.parent === folder.id)
              .map(childFolder => renderFolderTree(childFolder, level + 1))}
          </Box>
        )}
      </Box>
    );
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
          maxHeight: '800px',
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(139, 108, 188, 0.12)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogContent sx={{ p: 0, height: '100%' }}>
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box sx={{ 
            background: 'linear-gradient(135deg, #8b6cbc 0%, #9d7ec9 100%)',
            px: 2.5,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <LibraryBooksIcon sx={{ fontSize: 24, color: 'white' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'white', fontSize: '1.1rem' }}>
                Citation Library
              </Typography>
            </Box>
            <IconButton 
              onClick={onClose}
              size="small"
              sx={{ 
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* View Mode Toggle */}
          <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid #e9ecef', bgcolor: 'white' }}>
            <Stack direction="row" spacing={1}>
              <Button
                variant={viewMode === 'all' ? 'contained' : 'outlined'}
                size="small"
                startIcon={<ViewListIcon fontSize="small" />}
                onClick={() => {
                  setViewMode('all');
                  setSelectedFolder(null);
                }}
                sx={{
                  textTransform: 'none',
                  borderRadius: 1.5,
                  px: 2,
                  py: 0.5,
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  ...(viewMode === 'all' ? {
                    bgcolor: '#8b6cbc',
                    '&:hover': { bgcolor: '#7a5ba8' }
                  } : {
                    borderColor: '#d1d5db',
                    color: '#64748b',
                    '&:hover': { borderColor: '#8b6cbc', color: '#8b6cbc', bgcolor: '#8b6cbc05' }
                  })
                }}
              >
                All Citations
              </Button>
              <Button
                variant={viewMode === 'folders' ? 'contained' : 'outlined'}
                size="small"
                startIcon={<AccountTreeIcon fontSize="small" />}
                onClick={() => setViewMode('folders')}
                sx={{
                  textTransform: 'none',
                  borderRadius: 1.5,
                  px: 2,
                  py: 0.5,
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  ...(viewMode === 'folders' ? {
                    bgcolor: '#8b6cbc',
                    '&:hover': { bgcolor: '#7a5ba8' }
                  } : {
                    borderColor: '#d1d5db',
                    color: '#64748b',
                    '&:hover': { borderColor: '#8b6cbc', color: '#8b6cbc', bgcolor: '#8b6cbc05' }
                  })
                }}
              >
                My Library ({folders.length})
              </Button>
            </Stack>
          </Box>

          {/* Search and Controls */}
          <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid #e9ecef', bgcolor: 'white' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <TextField
                fullWidth
                size="small"
                placeholder="Search by title, author, keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#f8f9fa',
                    fontSize: '0.875rem',
                    '&:hover': {
                      bgcolor: 'white'
                    },
                    '&.Mui-focused': {
                      bgcolor: 'white',
                      '& fieldset': {
                        borderColor: '#8b6cbc'
                      }
                    },
                    '& fieldset': {
                      borderColor: '#e2e8f0'
                    }
                  }
                }}
              />
              
              <Button
                variant="outlined"
                size="small"
                startIcon={<FilterIcon fontSize="small" />}
                onClick={(e) => setFilterAnchor(e.currentTarget)}
                sx={{ 
                  minWidth: 90,
                  borderRadius: 1.5,
                  textTransform: 'none',
                  borderColor: '#d1d5db',
                  color: '#64748b',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
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
                size="small"
                startIcon={<SortIcon fontSize="small" />}
                onClick={(e) => setSortAnchor(e.currentTarget)}
                sx={{ 
                  minWidth: 90,
                  borderRadius: 1.5,
                  textTransform: 'none',
                  borderColor: '#d1d5db',
                  color: '#64748b',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
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

          {/* Main Content Area */}
          <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex' }}>
            {/* Folder Sidebar (only in folder view) */}
            {viewMode === 'folders' && (
              <Box sx={{ 
                width: '260px', 
                borderRight: '1px solid #e0e0e0',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: '#fafafa'
              }}>
                <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #e9ecef' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2d3748', fontSize: '0.8125rem', mb: 0.25 }}>
                    My Library
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#718096', fontSize: '0.7rem' }}>
                    {folders.length} collection{folders.length !== 1 ? 's' : ''}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
                  {folders.length === 0 ? (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                      <FolderIcon sx={{ fontSize: 40, color: '#ddd', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        No folders yet
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Create folders in Manage Publications
                      </Typography>
                    </Box>
                  ) : (
                    <Box>
                      {folders
                        .filter(f => f.parent === null)
                        .map(folder => renderFolderTree(folder))}
                    </Box>
                  )}
                </Box>
              </Box>
            )}

            {/* Citations List */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
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
                  {viewMode === 'folders' && selectedFolder 
                    ? 'No citations in this folder'
                    : 'No citations found'
                  }
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {viewMode === 'folders' && !selectedFolder
                    ? 'Select a folder from the left to view its citations'
                    : searchTerm || selectedFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria'
                      : 'Your citation library is empty. Import some publications to get started.'
                  }
                </Typography>
              </Box>
            )}

            {/* Citations List */}
            {!loading && !error && filteredAndSortedCitations.length > 0 && (
              <Stack spacing={1.5}>
                {filteredAndSortedCitations.map((citation, index) => (
                <Card 
                  key={citation.id || index}
                  sx={{ 
                    borderRadius: 2,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    border: '1px solid #e9ecef',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(139, 108, 188, 0.12)',
                      borderColor: '#8b6cbc'
                    }
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      {/* Publication Icon */}
                      <Box sx={{ 
                        width: 36,
                        height: 36,
                        borderRadius: 1.5, 
                        bgcolor: '#8b6cbc10',
                        color: '#8b6cbc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
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
                            fontSize: '0.95rem',
                            color: '#1a202c',
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
                            color: '#4a5568',
                            mb: 0.5,
                            fontSize: '0.8125rem',
                            fontWeight: 500
                          }}
                        >
                          {citation.authors?.join(', ')} ({citation.year})
                        </Typography>

                        {/* Publication Details */}
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#718096',
                            mb: 1,
                            fontSize: '0.75rem',
                            fontStyle: 'italic'
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
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0 }}>
                          <Chip
                            label={citation.source}
                            size="small"
                            sx={{
                              fontSize: '0.65rem',
                              height: 20,
                              bgcolor: getSourceColor(citation.source),
                              color: 'white',
                              fontWeight: 600,
                              borderRadius: 1
                            }}
                          />
                          {citation.tags?.slice(0, 2).map((tag) => (
                            <Chip
                              key={tag}
                              label={tag}
                              size="small"
                              sx={{
                                fontSize: '0.65rem',
                                height: 20,
                                bgcolor: '#f1f5f9',
                                color: '#64748b',
                                fontWeight: 500,
                                borderRadius: 1,
                                border: 'none'
                              }}
                            />
                          ))}
                          {citation.tags?.length > 2 && (
                            <Chip
                              label={`+${citation.tags.length - 2}`}
                              size="small"
                              sx={{
                                fontSize: '0.65rem',
                                height: 20,
                                bgcolor: '#e2e8f0',
                                color: '#64748b',
                                fontWeight: 600,
                                borderRadius: 1
                              }}
                            />
                          )}
                        </Box>
                      </Box>

                      {/* Action Buttons */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleCite(citation)}
                          sx={{
                            bgcolor: '#8b6cbc',
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 2,
                            py: 0.75,
                            borderRadius: 1.5,
                            fontSize: '0.8125rem',
                            boxShadow: 'none',
                            '&:hover': {
                              bgcolor: '#7a5ba8',
                              boxShadow: '0 2px 8px rgba(139, 108, 188, 0.25)'
                            }
                          }}
                        >
                          Insert
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
              </Stack>
            )}
            </Box>
          </Box>

          {/* Footer */}
          <Box sx={{ 
            px: 2.5, 
            py: 1.5, 
            borderTop: '1px solid #e9ecef',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: '#fafafa'
          }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.75rem' }}>
              {loading ? 'Loading...' : viewMode === 'folders' && selectedFolder
                ? `${filteredAndSortedCitations.length} citation(s) in ${folders.find(f => f.id === selectedFolder)?.name || 'folder'}`
                : `${filteredAndSortedCitations.length} of ${totalCount} sources`
              }
            </Typography>
            <Button 
              onClick={onClose}
              variant="text"
              size="small"
              sx={{ 
                textTransform: 'none',
                color: '#64748b',
                fontWeight: 600,
                fontSize: '0.8125rem',
                '&:hover': {
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
