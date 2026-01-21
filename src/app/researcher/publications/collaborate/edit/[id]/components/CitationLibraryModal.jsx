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
                <LibraryBooksIcon sx={{ fontSize: 28, color: 'white' }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
                  Citation Library
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.875rem' }}>
                  Manage and cite your research sources
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton 
                size="small" 
                sx={{ 
                  color: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' }
                }}
              >
                <SyncIcon />
              </IconButton>
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
                <ArticleIcon sx={{ fontSize: 20, color: '#8b6cbc' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem', color: '#2d3748' }}>
                  {totalCount}
                </Typography>
                <Typography variant="caption" sx={{ color: '#718096', fontSize: '0.75rem' }}>
                  Total Sources
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
                <FolderIcon sx={{ fontSize: 20, color: '#10b981' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem', color: '#2d3748' }}>
                  {folders.length}
                </Typography>
                <Typography variant="caption" sx={{ color: '#718096', fontSize: '0.75rem' }}>
                  Collections
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* View Mode Toggle */}
          <Box sx={{ px: 3, pt: 2.5, pb: 2, borderBottom: '1px solid #e9ecef' }}>
            <Stack direction="row" spacing={1.5}>
              <Button
                variant={viewMode === 'all' ? 'contained' : 'outlined'}
                startIcon={<ViewListIcon />}
                onClick={() => {
                  setViewMode('all');
                  setSelectedFolder(null);
                }}
                sx={{
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 2.5,
                  py: 1,
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  ...(viewMode === 'all' ? {
                    bgcolor: '#8b6cbc',
                    boxShadow: '0 2px 8px rgba(139, 108, 188, 0.25)',
                    '&:hover': { bgcolor: '#7a5ba8', boxShadow: '0 4px 12px rgba(139, 108, 188, 0.3)' }
                  } : {
                    borderColor: '#e2e8f0',
                    color: '#64748b',
                    bgcolor: 'white',
                    '&:hover': { borderColor: '#8b6cbc', color: '#8b6cbc', bgcolor: '#8b6cbc05' }
                  })
                }}
              >
                All Citations
              </Button>
              <Button
                variant={viewMode === 'folders' ? 'contained' : 'outlined'}
                startIcon={<AccountTreeIcon />}
                onClick={() => setViewMode('folders')}
                sx={{
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 2.5,
                  py: 1,
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  ...(viewMode === 'folders' ? {
                    bgcolor: '#8b6cbc',
                    boxShadow: '0 2px 8px rgba(139, 108, 188, 0.25)',
                    '&:hover': { bgcolor: '#7a5ba8', boxShadow: '0 4px 12px rgba(139, 108, 188, 0.3)' }
                  } : {
                    borderColor: '#e2e8f0',
                    color: '#64748b',
                    bgcolor: 'white',
                    '&:hover': { borderColor: '#8b6cbc', color: '#8b6cbc', bgcolor: '#8b6cbc05' }
                  })
                }}
              >
                My Collections ({folders.length})
              </Button>
            </Stack>
          </Box>

          {/* Search and Controls */}
          <Box sx={{ p: 3, borderBottom: '1px solid #e9ecef', bgcolor: 'white' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                fullWidth
                size="medium"
                placeholder="Search by title, author, keyword..."
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
              
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                sx={{ 
                  minWidth: 140,
                  borderRadius: 2,
                  textTransform: 'none',
                  bgcolor: '#8b6cbc',
                  fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(139, 108, 188, 0.25)',
                  '&:hover': { 
                    bgcolor: '#7a5ba8',
                    boxShadow: '0 4px 12px rgba(139, 108, 188, 0.35)'
                  }
                }}
              >
                Add Source
              </Button>
            </Stack>
          </Box>

          {/* Main Content Area */}
          <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex' }}>
            {/* Folder Sidebar (only in folder view) */}
            {viewMode === 'folders' && (
              <Box sx={{ 
                width: '280px', 
                borderRight: '1px solid #e0e0e0',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: '#fafafa'
              }}>
                <Box sx={{ p: 2.5, borderBottom: '1px solid #e9ecef' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2d3748', fontSize: '0.875rem', mb: 0.5 }}>
                    My Collections
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#718096', fontSize: '0.75rem' }}>
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
              <Stack spacing={2}>
                {filteredAndSortedCitations.map((citation, index) => (
                <Card 
                  key={citation.id || index}
                  sx={{ 
                    borderRadius: 2.5,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    border: '1px solid #e9ecef',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(139, 108, 188, 0.15)',
                      borderColor: '#8b6cbc',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      {/* Publication Icon */}
                      <Box sx={{ 
                        width: 44,
                        height: 44,
                        borderRadius: 2, 
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
                            fontWeight: 700,
                            fontSize: '1.05rem',
                            color: '#1a202c',
                            mb: 0.75,
                            lineHeight: 1.4,
                            letterSpacing: '-0.01em'
                          }}
                        >
                          {citation.title}
                        </Typography>

                        {/* Authors and Year */}
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#4a5568',
                            mb: 0.75,
                            fontSize: '0.875rem',
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
                            mb: 1.5,
                            fontSize: '0.8125rem',
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
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 0 }}>
                          <Chip
                            label={citation.source}
                            size="small"
                            sx={{
                              fontSize: '0.6875rem',
                              height: 22,
                              bgcolor: getSourceColor(citation.source),
                              color: 'white',
                              fontWeight: 600,
                              borderRadius: 1.5
                            }}
                          />
                          {citation.tags?.slice(0, 3).map((tag) => (
                            <Chip
                              key={tag}
                              label={tag}
                              size="small"
                              sx={{
                                fontSize: '0.6875rem',
                                height: 22,
                                bgcolor: '#f1f5f9',
                                color: '#64748b',
                                fontWeight: 500,
                                borderRadius: 1.5,
                                border: 'none'
                              }}
                            />
                          ))}
                          {citation.tags?.length > 3 && (
                            <Chip
                              label={`+${citation.tags.length - 3}`}
                              size="small"
                              sx={{
                                fontSize: '0.6875rem',
                                height: 22,
                                bgcolor: '#e2e8f0',
                                color: '#64748b',
                                fontWeight: 600,
                                borderRadius: 1.5
                              }}
                            />
                          )}
                        </Box>
                      </Box>

                      {/* Action Buttons */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                        <Button
                          variant="contained"
                          size="medium"
                          onClick={() => handleCite(citation)}
                          sx={{
                            bgcolor: '#8b6cbc',
                            '&:hover': { bgcolor: '#7a5ba8' },
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 3,
                            py: 1,
                            borderRadius: 2,
                            boxShadow: '0 2px 8px rgba(139, 108, 188, 0.25)',
                            '&:hover': {
                              bgcolor: '#7a5ba8',
                              boxShadow: '0 4px 12px rgba(139, 108, 188, 0.35)'
                            }
                          }}
                        >
                          Insert Citation
                        </Button>
                        <IconButton 
                          size="small"
                          sx={{ 
                            color: '#94a3b8',
                            '&:hover': { color: '#8b6cbc', bgcolor: '#8b6cbc10' }
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
                {loading ? 'Loading...' : viewMode === 'folders' && selectedFolder
                  ? `${filteredAndSortedCitations.length} citation(s) in ${folders.find(f => f.id === selectedFolder)?.name || 'folder'}`
                  : `${totalCount} total sources • ${filteredAndSortedCitations.length} displayed`
                }
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
