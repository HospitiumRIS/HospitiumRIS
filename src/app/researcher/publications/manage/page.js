'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  TextField,
  Button,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Avatar,
  Badge,
  InputAdornment,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Tooltip,
  Alert,
  Stack,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Checkbox,
  Snackbar
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  GetApp as DownloadIcon,
  Add as AddIcon,
  Sort as SortIcon,
  Public as PublicIcon,
  Lock as PrivateIcon,
  Schedule as DraftIcon,
  CheckCircle as PublishedIcon,
  MoreVert as MoreIcon,
  Article as ArticleIcon,
  School as BookIcon,
  Event as ConferenceIcon,
  Description as ReportIcon,
  Assignment as ThesisIcon,
  Link as LinkIcon,
  DateRange as DateIcon,
  Person as AuthorIcon,
  LocalOffer as TagIcon,
  Assessment as MetricsIcon,
  ViewList as TableViewIcon,
  ViewModule as CardViewIcon,
  LibraryAdd as LibraryAddIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  DriveFileMove as MoveIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import PageHeader from '../../../../components/common/PageHeader';
import { useAuth } from '../../../../components/AuthProvider';

export default function ManagePublications() {
  const { user } = useAuth();
  const [publications, setPublications] = useState([]);
  const [filteredPublications, setFilteredPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [selectedPublication, setSelectedPublication] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [libraryDialogOpen, setLibraryDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState(null);
  const [viewType, setViewType] = useState('table'); // 'table' or 'cards'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Library folder management
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderParent, setNewFolderParent] = useState(null);
  const [libraryLoading, setLibraryLoading] = useState(true);
  
  // Folder management states
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [deleteFolderDialogOpen, setDeleteFolderDialogOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState(null);
  const [moveFolderDialogOpen, setMoveFolderDialogOpen] = useState(false);
  const [folderToMove, setFolderToMove] = useState(null);
  const [moveTargetFolder, setMoveTargetFolder] = useState(null);
  
  // Track publications in folders: { folderId: [publicationId1, publicationId2, ...] }
  const [folderPublications, setFolderPublications] = useState({});
  
  // View mode for library dialog: 'add' or 'browse'
  const [libraryViewMode, setLibraryViewMode] = useState('add');
  
  // Move publication between folders
  const [movePublicationDialogOpen, setMovePublicationDialogOpen] = useState(false);
  const [publicationToMove, setPublicationToMove] = useState(null);
  const [sourceFolderId, setSourceFolderId] = useState(null);
  const [targetFolderForPub, setTargetFolderForPub] = useState(null);
  
  // Snackbar state for notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' // 'success', 'error', 'warning', 'info'
  });

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Fetch library data (folders and publications)
  const fetchLibrary = useCallback(async () => {
    try {
      setLibraryLoading(true);
      const response = await fetch('/api/publications/library');
      const data = await response.json();
      
      if (data.success) {
        setFolders(data.folders || []);
        setFolderPublications(data.folderPublications || {});
      }
    } catch (error) {
      console.error('Error fetching library:', error);
    } finally {
      setLibraryLoading(false);
    }
  }, []);

  // Load library on mount
  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  // Transform database publication to UI format
  const transformPublicationForUI = (dbPublication) => {
    return {
      id: dbPublication.id,
      title: dbPublication.title || 'Unknown Title',
      authors: Array.isArray(dbPublication.authors) && dbPublication.authors.length > 0 
        ? dbPublication.authors 
        : ['Unknown Author'],
      journal: dbPublication.journal || 'Unknown Journal',
      year: dbPublication.year || (dbPublication.publicationDate 
        ? new Date(dbPublication.publicationDate).getFullYear() 
        : 'Unknown Year'),
      type: dbPublication.type || 'article',
      status: dbPublication.status ? dbPublication.status.toLowerCase().replace('_', '-') : 'published',
      doi: dbPublication.doi || null,
      abstract: dbPublication.abstract || '',
      url: dbPublication.url || '',
      volume: dbPublication.volume || '',
      pages: dbPublication.pages || '',
      isbn: dbPublication.isbn || '',
      source: dbPublication.source || 'Unknown',
      // UI-specific fields with defaults
      citations: 0, // Could be added to database later
      downloads: 0, // Could be added to database later
      visibility: 'public', // Could be added to database later
      tags: Array.isArray(dbPublication.keywords) && dbPublication.keywords.length > 0 
        ? dbPublication.keywords 
        : [],
      createdAt: dbPublication.createdAt ? new Date(dbPublication.createdAt) : new Date(),
      updatedAt: dbPublication.updatedAt ? new Date(dbPublication.updatedAt) : new Date(),
      // Additional metadata
      publicationDate: dbPublication.publicationDate ? new Date(dbPublication.publicationDate) : null,
      authorId: dbPublication.authorId || null
    };
  };

  useEffect(() => {
    // Fetch publications from API
    const fetchPublications = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/publications/import', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch publications: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && Array.isArray(data.publications)) {
          // Transform database publications to UI format
          const transformedPublications = data.publications.map(transformPublicationForUI);
          setPublications(transformedPublications);
          setFilteredPublications(transformedPublications);
        } else {
          console.error('Invalid response format:', data);
          setError('Invalid response format from server');
          setPublications([]);
          setFilteredPublications([]);
        }
      } catch (error) {
        console.error('Error fetching publications:', error);
        setError(`Failed to load publications: ${error.message}`);
        setPublications([]);
        setFilteredPublications([]);
      } finally {
      setLoading(false);
      }
    };

    fetchPublications();
  }, []);

  useEffect(() => {
    // Filter and search publications
    let filtered = publications.filter(pub => {
      const matchesSearch = pub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pub.authors.some(author => author.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          pub.journal.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = typeFilter === 'all' || pub.type === typeFilter;

      return matchesSearch && matchesType;
    });

    // Sort publications
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.year) - new Date(a.year);
        case 'date-asc':
          return new Date(a.year) - new Date(b.year);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'citations':
          return b.citations - a.citations;
        default:
          return 0;
      }
    });

    setFilteredPublications(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [publications, searchQuery, typeFilter, sortBy]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'published':
        return <PublishedIcon sx={{ color: '#4caf50' }} />;
      case 'under-review':
        return <DraftIcon sx={{ color: '#ff9800' }} />;
      case 'draft':
        return <DraftIcon sx={{ color: '#757575' }} />;
      default:
        return <ArticleIcon />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return '#4caf50';
      case 'under-review':
        return '#ff9800';
      case 'draft':
        return '#757575';
      default:
        return '#8b6cbc';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'journal':
        return <ArticleIcon />;
      case 'book':
        return <BookIcon />;
      case 'conference':
        return <ConferenceIcon />;
      case 'report':
        return <ReportIcon />;
      case 'thesis':
        return <ThesisIcon />;
      default:
        return <ArticleIcon />;
    }
  };

  const handleViewPublication = (publication) => {
    setSelectedPublication(publication);
    setViewDialogOpen(true);
  };

  const handleDeletePublication = (publication) => {
    setSelectedPublication(publication);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    setPublications(prev => prev.filter(pub => pub.id !== selectedPublication.id));
    setDeleteDialogOpen(false);
    setSelectedPublication(null);
  };

  const handleAddToLibrary = (publication) => {
    setSelectedPublication(publication);
    setLibraryViewMode('add');
    setLibraryDialogOpen(true);
  };

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      try {
        const response = await fetch('/api/publications/library', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'createFolder',
            name: newFolderName.trim(),
            parentId: newFolderParent
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          setFolders(prev => [...prev, data.folder]);
          setFolderPublications(prev => ({
            ...prev,
            [data.folder.id]: []
          }));
          setNewFolderName('');
          setShowNewFolderInput(false);
          
          // Expand parent folder if creating subfolder
          if (newFolderParent) {
            handleToggleFolderExpanded(newFolderParent, true);
          }
          setNewFolderParent(null);
          showSnackbar(`Folder "${data.folder.name}" created`, 'success');
        } else {
          showSnackbar(data.error || 'Failed to create folder', 'error');
        }
      } catch (error) {
        console.error('Error creating folder:', error);
        showSnackbar('Failed to create folder', 'error');
      }
    }
  };

  const toggleFolder = async (folderId) => {
    // Optimistically update UI
    setFolders(folders.map(folder => 
      folder.id === folderId ? { ...folder, expanded: !folder.expanded } : folder
    ));
    
    // Persist to database
    try {
      await fetch('/api/publications/library', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggleExpanded',
          folderId
        })
      });
    } catch (error) {
      console.error('Error toggling folder:', error);
    }
  };

  // Helper to set folder expanded state
  const handleToggleFolderExpanded = async (folderId, expanded) => {
    setFolders(prev => prev.map(folder => 
      folder.id === folderId ? { ...folder, expanded } : folder
    ));
  };

  const handleAddToSelectedFolder = async () => {
    if (selectedFolder && selectedPublication) {
      const folderName = folders.find(f => f.id === selectedFolder)?.name || 'folder';
      
      try {
        const response = await fetch('/api/publications/library', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'addPublication',
            folderId: selectedFolder,
            publicationId: selectedPublication.id
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Update local state
          setFolderPublications(prev => {
            const currentPubs = prev[selectedFolder] || [];
            if (currentPubs.includes(selectedPublication.id)) {
              return prev;
            }
            return {
              ...prev,
              [selectedFolder]: [...currentPubs, selectedPublication.id]
            };
          });
          setLibraryDialogOpen(false);
          setSelectedFolder(null);
          showSnackbar(`Added to "${folderName}" successfully`, 'success');
          setSelectedPublication(null);
        } else {
          showSnackbar(data.error || 'Failed to add publication to folder', 'error');
        }
      } catch (error) {
        console.error('Error adding publication to folder:', error);
        showSnackbar('Failed to add publication to folder', 'error');
      }
    }
  };

  // Remove publication from folder
  const handleRemoveFromFolder = async (folderId, publicationId) => {
    try {
      const response = await fetch('/api/publications/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'removePublication',
          folderId,
          publicationId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setFolderPublications(prev => ({
          ...prev,
          [folderId]: (prev[folderId] || []).filter(id => id !== publicationId)
        }));
        showSnackbar('Removed from folder', 'success');
      } else {
        showSnackbar(data.error || 'Failed to remove publication', 'error');
      }
    } catch (error) {
      console.error('Error removing publication from folder:', error);
      showSnackbar('Failed to remove publication', 'error');
    }
  };

  // Get subfolder count for a folder
  const getSubfolderCount = (folderId) => {
    return folders.filter(f => f.parent === folderId).length;
  };

  // Get total subfolder count (including nested)
  const getTotalSubfolderCount = (folderId) => {
    return getDescendantFolderIds(folderId).length;
  };

  // Get publication count for a folder (direct)
  const getPublicationCount = (folderId) => {
    return (folderPublications[folderId] || []).length;
  };

  // Get total publication count (including subfolders)
  const getTotalPublicationCount = (folderId) => {
    const descendantIds = getDescendantFolderIds(folderId);
    const allFolderIds = [folderId, ...descendantIds];
    return allFolderIds.reduce((total, id) => total + (folderPublications[id] || []).length, 0);
  };

  // Get publications in a folder
  const getPublicationsInFolder = (folderId) => {
    const pubIds = folderPublications[folderId] || [];
    return publications.filter(pub => pubIds.includes(pub.id));
  };

  // Open library dialog in browse mode
  const handleOpenLibraryBrowser = () => {
    setSelectedPublication(null);
    setLibraryViewMode('browse');
    setLibraryDialogOpen(true);
  };

  // Open move publication dialog
  const handleOpenMovePublication = (publication, currentFolderId) => {
    setPublicationToMove(publication);
    setSourceFolderId(currentFolderId);
    setTargetFolderForPub(null);
    setMovePublicationDialogOpen(true);
  };

  // Confirm move publication
  const handleConfirmMovePublication = async () => {
    if (publicationToMove && sourceFolderId && targetFolderForPub) {
      const targetFolderName = folders.find(f => f.id === targetFolderForPub)?.name || 'folder';
      
      try {
        const response = await fetch('/api/publications/library', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'movePublication',
            sourceFolderId,
            targetFolderId: targetFolderForPub,
            publicationId: publicationToMove.id
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Update local state
          setFolderPublications(prev => {
            const updated = { ...prev };
            updated[sourceFolderId] = (updated[sourceFolderId] || []).filter(id => id !== publicationToMove.id);
            const targetPubs = updated[targetFolderForPub] || [];
            if (!targetPubs.includes(publicationToMove.id)) {
              updated[targetFolderForPub] = [...targetPubs, publicationToMove.id];
            }
            return updated;
          });
          
          setMovePublicationDialogOpen(false);
          setPublicationToMove(null);
          setSourceFolderId(null);
          setTargetFolderForPub(null);
          showSnackbar(`Moved to "${targetFolderName}" successfully`, 'success');
        } else {
          showSnackbar(data.error || 'Failed to move publication', 'error');
        }
      } catch (error) {
        console.error('Error moving publication:', error);
        showSnackbar('Failed to move publication', 'error');
      }
    }
  };

  // Copy publication to another folder (keep in both)
  const handleCopyPublication = (publication, currentFolderId, targetFolderId) => {
    if (targetFolderId && targetFolderId !== currentFolderId) {
      setFolderPublications(prev => {
        const targetPubs = prev[targetFolderId] || [];
        if (!targetPubs.includes(publication.id)) {
          return {
            ...prev,
            [targetFolderId]: [...targetPubs, publication.id]
          };
        }
        return prev;
      });
    }
  };

  // Start editing a folder name
  const handleStartEditFolder = (folder, e) => {
    e.stopPropagation();
    setEditingFolderId(folder.id);
    setEditingFolderName(folder.name);
  };

  // Save edited folder name
  const handleSaveEditFolder = async () => {
    if (editingFolderName.trim() && editingFolderId) {
      try {
        const response = await fetch('/api/publications/library', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'rename',
            folderId: editingFolderId,
            name: editingFolderName.trim()
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          setFolders(folders.map(folder =>
            folder.id === editingFolderId
              ? { ...folder, name: editingFolderName.trim() }
              : folder
          ));
          setEditingFolderId(null);
          setEditingFolderName('');
          showSnackbar('Folder renamed', 'success');
        } else {
          showSnackbar(data.error || 'Failed to rename folder', 'error');
        }
      } catch (error) {
        console.error('Error renaming folder:', error);
        showSnackbar('Failed to rename folder', 'error');
      }
    }
  };

  // Cancel editing folder
  const handleCancelEditFolder = () => {
    setEditingFolderId(null);
    setEditingFolderName('');
  };

  // Open delete confirmation dialog
  const handleOpenDeleteFolder = (folder, e) => {
    e.stopPropagation();
    setFolderToDelete(folder);
    setDeleteFolderDialogOpen(true);
  };

  // Get all descendant folder IDs (for cascading delete)
  const getDescendantFolderIds = (folderId) => {
    const descendants = [];
    const findDescendants = (parentId) => {
      folders.forEach(folder => {
        if (folder.parent === parentId) {
          descendants.push(folder.id);
          findDescendants(folder.id);
        }
      });
    };
    findDescendants(folderId);
    return descendants;
  };

  // Confirm delete folder
  const handleConfirmDeleteFolder = async () => {
    if (folderToDelete) {
      const folderName = folderToDelete.name;
      
      try {
        const response = await fetch(`/api/publications/library?folderId=${folderToDelete.id}`, {
          method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
          const descendantIds = getDescendantFolderIds(folderToDelete.id);
          const idsToDelete = [folderToDelete.id, ...descendantIds];
          
          setFolders(folders.filter(folder => !idsToDelete.includes(folder.id)));
          
          // Clean up publications from deleted folders
          setFolderPublications(prev => {
            const updated = { ...prev };
            idsToDelete.forEach(id => delete updated[id]);
            return updated;
          });
          
          // Clear selection if deleted folder was selected
          if (idsToDelete.includes(selectedFolder)) {
            setSelectedFolder(null);
          }
          
          setDeleteFolderDialogOpen(false);
          setFolderToDelete(null);
          showSnackbar(`Folder "${folderName}" deleted`, 'success');
        } else {
          showSnackbar(data.error || 'Failed to delete folder', 'error');
        }
      } catch (error) {
        console.error('Error deleting folder:', error);
        showSnackbar('Failed to delete folder', 'error');
      }
    }
  };

  // Open move folder dialog
  const handleOpenMoveFolder = (folder, e) => {
    e.stopPropagation();
    setFolderToMove(folder);
    setMoveTargetFolder(null);
    setMoveFolderDialogOpen(true);
  };

  // Check if a folder is a descendant of another (to prevent circular references)
  const isDescendantOf = (folderId, potentialAncestorId) => {
    const descendantIds = getDescendantFolderIds(potentialAncestorId);
    return descendantIds.includes(folderId);
  };

  // Get valid move targets (exclude self, descendants, and current parent)
  const getValidMoveTargets = (folder) => {
    const descendantIds = getDescendantFolderIds(folder.id);
    return folders.filter(f => 
      f.id !== folder.id && // Not itself
      !descendantIds.includes(f.id) && // Not a descendant
      f.id !== folder.parent // Not current parent
    );
  };

  // Confirm move folder
  const handleConfirmMoveFolder = async () => {
    if (folderToMove) {
      const folderName = folderToMove.name;
      const targetName = moveTargetFolder 
        ? folders.find(f => f.id === moveTargetFolder)?.name 
        : 'root';
      
      try {
        const response = await fetch('/api/publications/library', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'move',
            folderId: folderToMove.id,
            parentId: moveTargetFolder
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          setFolders(folders.map(folder =>
            folder.id === folderToMove.id
              ? { ...folder, parent: moveTargetFolder }
              : folder
          ));
          setMoveFolderDialogOpen(false);
          setFolderToMove(null);
          setMoveTargetFolder(null);
          showSnackbar(`Folder "${folderName}" moved to ${targetName}`, 'success');
        } else {
          showSnackbar(data.error || 'Failed to move folder', 'error');
        }
      } catch (error) {
        console.error('Error moving folder:', error);
        showSnackbar('Failed to move folder', 'error');
      }
    }
  };

  const renderFolderTree = (parentId = null, level = 0) => {
    return folders
      .filter(folder => folder.parent === parentId)
      .map(folder => {
        const hasChildren = folders.some(f => f.parent === folder.id);
        const isSelected = selectedFolder === folder.id;
        const isEditing = editingFolderId === folder.id;
        
        return (
          <Box key={folder.id}>
            <Box
              onClick={() => !isEditing && setSelectedFolder(folder.id)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                py: 1,
                px: 2,
                pl: 2 + level * 3,
                cursor: isEditing ? 'default' : 'pointer',
                bgcolor: isSelected ? '#8b6cbc15' : 'transparent',
                borderLeft: isSelected ? '3px solid #8b6cbc' : '3px solid transparent',
                '&:hover': {
                  bgcolor: isEditing ? 'transparent' : '#8b6cbc08',
                  '& .folder-actions': {
                    opacity: 1
                  }
                },
                transition: 'all 0.2s ease'
              }}
            >
              {hasChildren && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFolder(folder.id);
                  }}
                  sx={{ mr: 0.5, p: 0.5 }}
                >
                  {folder.expanded ? '▼' : '▶'}
                </IconButton>
              )}
              {!hasChildren && <Box sx={{ width: 28 }} />}
              <Box sx={{ mr: 1, color: '#8b6cbc' }}>📁</Box>
              
              {/* Editable folder name or display name */}
              {isEditing ? (
                <Box sx={{ display: 'flex', gap: 0.5, flex: 1, alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                  <TextField
                    size="small"
                    value={editingFolderName}
                    onChange={(e) => setEditingFolderName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleSaveEditFolder();
                      if (e.key === 'Escape') handleCancelEditFolder();
                    }}
                    autoFocus
                    sx={{ 
                      flex: 1,
                      '& .MuiInputBase-input': { py: 0.5, fontSize: '0.875rem' }
                    }}
                  />
                  <IconButton size="small" onClick={handleSaveEditFolder} sx={{ color: '#4caf50', p: 0.5 }}>
                    <CheckIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={handleCancelEditFolder} sx={{ color: '#f44336', p: 0.5 }}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: isSelected ? 600 : 400 }}>
                    {folder.name}
                  </Typography>
                  {/* Folder stats badges */}
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {getSubfolderCount(folder.id) > 0 && (
                      <Tooltip title={`${getSubfolderCount(folder.id)} subfolder(s)`}>
                        <Chip
                          size="small"
                          label={getSubfolderCount(folder.id)}
                          icon={<FolderIcon sx={{ fontSize: '14px !important' }} />}
                          sx={{ 
                            height: 20, 
                            fontSize: '0.7rem',
                            bgcolor: '#e3f2fd',
                            color: '#1976d2',
                            '& .MuiChip-icon': { color: '#1976d2', ml: 0.5 },
                            '& .MuiChip-label': { px: 0.5 }
                          }}
                        />
                      </Tooltip>
                    )}
                    {getPublicationCount(folder.id) > 0 && (
                      <Tooltip title={`${getPublicationCount(folder.id)} publication(s)`}>
                        <Chip
                          size="small"
                          label={getPublicationCount(folder.id)}
                          icon={<ArticleIcon sx={{ fontSize: '14px !important' }} />}
                          sx={{ 
                            height: 20, 
                            fontSize: '0.7rem',
                            bgcolor: '#f3e5f5',
                            color: '#8b6cbc',
                            '& .MuiChip-icon': { color: '#8b6cbc', ml: 0.5 },
                            '& .MuiChip-label': { px: 0.5 }
                          }}
                        />
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              )}
              
              {/* Folder action buttons */}
              {!isEditing && (
                <Box 
                  className="folder-actions"
                  sx={{ 
                    ml: 'auto', 
                    display: 'flex', 
                    gap: 0.25,
                    opacity: 0,
                    transition: 'opacity 0.2s ease'
                  }}
                >
                  <Tooltip title="Add subfolder">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setNewFolderParent(folder.id);
                        setShowNewFolderInput(true);
                      }}
                      sx={{ p: 0.5, '&:hover': { bgcolor: '#8b6cbc15', color: '#8b6cbc' } }}
                    >
                      <AddIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Rename folder">
                    <IconButton
                      size="small"
                      onClick={(e) => handleStartEditFolder(folder, e)}
                      sx={{ p: 0.5, '&:hover': { bgcolor: '#2196f315', color: '#2196f3' } }}
                    >
                      <EditIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Move folder">
                    <IconButton
                      size="small"
                      onClick={(e) => handleOpenMoveFolder(folder, e)}
                      sx={{ p: 0.5, '&:hover': { bgcolor: '#ff980015', color: '#ff9800' } }}
                    >
                      <MoveIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete folder">
                    <IconButton
                      size="small"
                      onClick={(e) => handleOpenDeleteFolder(folder, e)}
                      sx={{ p: 0.5, '&:hover': { bgcolor: '#f4433615', color: '#f44336' } }}
                    >
                      <DeleteIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>
            {folder.expanded && renderFolderTree(folder.id, level + 1)}
            {showNewFolderInput && newFolderParent === folder.id && (
              <Box sx={{ pl: 2 + (level + 1) * 3, pr: 2, py: 1 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    size="small"
                    placeholder="Folder name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                    autoFocus
                    sx={{ flex: 1 }}
                  />
                  <IconButton size="small" onClick={handleCreateFolder} color="primary">
                    <CheckIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => {
                      setShowNewFolderInput(false);
                      setNewFolderName('');
                      setNewFolderParent(null);
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            )}
          </Box>
        );
      });
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredPublications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPagePublications = filteredPublications.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setSortBy('date-desc');
    setCurrentPage(1);
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );

  const getSourceIcon = (source) => {
    switch (source?.toLowerCase()) {
      case 'pubmed':
        return <img src="/pubmed.svg" alt="PubMed" style={{ width: 20, height: 20 }} />;
      case 'crossref':
        return <img src="/doi.svg" alt="Crossref" style={{ width: 20, height: 20 }} />;
      case 'openalex':
        return <img src="/OpenAlex.png" alt="OpenAlex" style={{ width: 20, height: 20 }} />;
      case 'bibtex':
        return <img src="/bibtex_s.png" alt="BibTeX" style={{ width: 20, height: 20 }} />;
      default:
        return <ArticleIcon sx={{ fontSize: 20 }} />;
    }
  };

  const PublicationsCards = ({ publications }) => (
    <Box>
      {publications.map((publication) => (
        <Card 
          key={publication.id}
          sx={{ 
            mb: 2, 
            '&:hover': { boxShadow: 4 },
            transition: 'box-shadow 0.2s ease'
          }}
        >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
              {getTypeIcon(publication.type)}
                  <Box sx={{ ml: 1, flex: 1 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600, 
                        lineHeight: 1.3,
                        cursor: 'pointer',
                        '&:hover': { color: '#8b6cbc' }
                      }}
                      onClick={() => handleViewPublication(publication)}
                    >
                {publication.title}
                    </Typography>
                    {publication.source && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        {getSourceIcon(publication.source)}
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                          Imported from {publication.source}
              </Typography>
                      </Box>
                    )}
                  </Box>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <AuthorIcon sx={{ fontSize: 16, mr: 0.5 }} />
              {publication.authors.join(', ')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <DateIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  {publication.journal} {publication.year && `(${publication.year})`}
                  {publication.volume && `, Vol. ${publication.volume}`}
                  {publication.pages && `, pp. ${publication.pages}`}
            </Typography>
            {publication.doi && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <LinkIcon sx={{ fontSize: 16, mr: 0.5 }} />
                    DOI: <a href={`https://doi.org/${publication.doi}`} target="_blank" rel="noopener noreferrer" style={{ color: '#8b6cbc' }}>
                      {publication.doi}
                    </a>
                  </Typography>
                )}
                {publication.abstract && (
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    mb: 1, 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {publication.abstract}
              </Typography>
            )}
          </Box>
          
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, ml: 2 }}>
            <Chip 
              label={publication.status.replace('-', ' ')} 
              size="small"
              sx={{ 
                bgcolor: getStatusColor(publication.status),
                color: 'white'
              }}
              icon={getStatusIcon(publication.status)}
            />
            <Box sx={{ 
              display: 'flex', 
              gap: 0.5
            }}>
              <Tooltip title="View" arrow>
                <IconButton
                  size="small"
                  onClick={() => handleViewPublication(publication)}
                  sx={{ 
                    color: '#8b6cbc',
                    '&:hover': { bgcolor: '#8b6cbc10' }
                  }}
                >
                  <ViewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Edit" arrow>
                <IconButton
                  size="small"
                  sx={{ 
                    color: '#666',
                    '&:hover': { bgcolor: '#66666610' }
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Add to Library" arrow>
                <IconButton
                  size="small"
                  onClick={() => handleAddToLibrary(publication)}
                  sx={{ 
                    color: '#4caf50',
                    '&:hover': { bgcolor: '#4caf5010' }
                  }}
                >
                  <LibraryAddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Download" arrow>
                <IconButton
                  size="small"
                  sx={{ 
                    color: '#666',
                    '&:hover': { bgcolor: '#66666610' }
                  }}
                >
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete" arrow>
                <IconButton
                  size="small"
                  onClick={() => handleDeletePublication(publication)}
                  sx={{ 
                    color: '#f44336',
                    '&:hover': { bgcolor: '#f4433610' }
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {publication.tags && publication.tags.length > 0 && publication.tags.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                variant="outlined"
                sx={{ borderColor: '#8b6cbc40', color: '#8b6cbc' }}
              />
            ))}
          </Box>
          
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            {publication.visibility === 'public' ? (
              <PublicIcon sx={{ fontSize: 18, color: '#4caf50' }} />
            ) : (
              <PrivateIcon sx={{ fontSize: 18, color: '#757575' }} />
            )}
            <Typography variant="caption" color="text.secondary">
              Updated {publication.updatedAt.toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
      ))}
    </Box>
  );

  const PublicationsTable = ({ publications }) => (
    <TableContainer sx={{ borderRadius: 1, overflow: 'hidden' }}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: '#8b6cbc' }}>
            <TableCell sx={{ fontWeight: 600, color: 'white', borderBottom: 'none', py: 2 }}>Title</TableCell>
            <TableCell sx={{ fontWeight: 600, color: 'white', borderBottom: 'none', py: 2 }}>Authors</TableCell>
            <TableCell sx={{ fontWeight: 600, color: 'white', borderBottom: 'none', py: 2 }}>Date</TableCell>
            <TableCell sx={{ fontWeight: 600, color: 'white', borderBottom: 'none', py: 2 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 600, color: 'white', borderBottom: 'none', py: 2 }}>Type</TableCell>
            <TableCell sx={{ fontWeight: 600, color: 'white', borderBottom: 'none', py: 2, textAlign: 'center' }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {publications.map((publication, index) => (
            <TableRow 
              key={publication.id}
              sx={{ 
                bgcolor: index % 2 === 0 ? '#fafafa' : 'white',
                '&:hover': { backgroundColor: '#f0f0f0' },
                transition: 'background-color 0.2s ease'
              }}
            >
              {/* Title */}
              <TableCell sx={{ py: 2, maxWidth: 400 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  {getTypeIcon(publication.type)}
                  <Box sx={{ flex: 1 }}>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: 600,
                        lineHeight: 1.3,
                        mb: 0.5,
                        cursor: 'pointer',
                        '&:hover': { color: '#8b6cbc' }
                      }}
                      onClick={() => handleViewPublication(publication)}
                    >
                      {publication.title}
                    </Typography>
                    {publication.journal && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {publication.journal}
                        {publication.volume && ` • Vol. ${publication.volume}`}
                        {publication.pages && ` • pp. ${publication.pages}`}
                      </Typography>
                    )}
                    {publication.doi && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        <LinkIcon sx={{ fontSize: 12, mr: 0.5 }} />
                        {publication.doi.length > 40 ? `${publication.doi.substring(0, 40)}...` : publication.doi}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </TableCell>

              {/* Authors */}
              <TableCell sx={{ py: 2, maxWidth: 200 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    lineHeight: 1.4
                  }}
                >
                  {publication.authors.join(', ')}
                </Typography>
              </TableCell>

              {/* Date */}
              <TableCell sx={{ py: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {publication.publicationDate 
                    ? new Date(publication.publicationDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })
                    : publication.year || 'N/A'
                  }
                </Typography>
              </TableCell>

              {/* Status */}
              <TableCell sx={{ py: 2 }}>
                <Chip 
                  label={publication.status === 'published' ? 'Published' : publication.status.replace('-', ' ')} 
                  size="small"
                  sx={{ 
                    bgcolor: publication.status === 'published' ? '#4caf50' : '#ff9800',
                    color: 'white',
                    fontWeight: 500,
                    textTransform: 'capitalize'
                  }}
                />
              </TableCell>

              {/* Type */}
              <TableCell sx={{ py: 2 }}>
                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                  {publication.type}
                </Typography>
              </TableCell>

              {/* Actions */}
              <TableCell sx={{ py: 2, textAlign: 'center' }}>
                <Box sx={{ 
                  display: 'flex', 
                  gap: 0.5, 
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '40px'
                }}>
                  <Tooltip title="View Details" arrow>
                    <IconButton 
                      size="small" 
                      onClick={() => handleViewPublication(publication)}
                      sx={{ 
                        color: '#8b6cbc',
                        '&:hover': { bgcolor: '#8b6cbc10' }
                      }}
                    >
                      <ViewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Publication" arrow>
                    <IconButton 
                      size="small" 
                      sx={{ 
                        color: '#666',
                        '&:hover': { bgcolor: '#66666610' }
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Add to Library" arrow>
                    <IconButton 
                      size="small"
                      onClick={() => handleAddToLibrary(publication)}
                      sx={{ 
                        color: '#4caf50',
                        '&:hover': { bgcolor: '#4caf5010' }
                      }}
                    >
                      <LibraryAddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download Citation" arrow>
                    <IconButton 
                      size="small"
                      sx={{ 
                        color: '#666',
                        '&:hover': { bgcolor: '#66666610' }
                      }}
                    >
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete" arrow>
                    <IconButton 
                      size="small"
                      onClick={() => handleDeletePublication(publication)}
                      sx={{ 
                        color: '#f44336',
                        '&:hover': { bgcolor: '#f4433610' }
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
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa', mt:8}} >
      <PageHeader
        title="Manage Publications"
        description="Manage and track your research publications"
        icon={<EditIcon />}
        breadcrumbs={[
          { label: 'Dashboard', path: '/researcher' },
          { label: 'Publications', path: '/researcher/publications' },
          { label: 'Manage Publications' }
        ]}
        actionButton={
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<FolderOpenIcon />}
              sx={{ 
                borderColor: 'white',
                color: 'white',
                '&:hover': { 
                  borderColor: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }}
              onClick={handleOpenLibraryBrowser}
            >
              View Library
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ 
                bgcolor: 'white',
                color: '#8b6cbc',
                '&:hover': { 
                  bgcolor: '#f5f5f5',
                  color: '#7559a3'
                }
              }}
              onClick={() => window.location.href = '/researcher/publications/import'}
            >
              Import Publication
            </Button>
          </Box>
        }
      />

      <Container maxWidth="xl" sx={{ py: 4, mt:5 }}>
        {/* Statistics Cards */}
        <Grid container spacing={2.5} sx={{ mb: 4, mt: -6 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ 
              p: 2, 
              borderRadius: 2,
              bgcolor: '#8b6cbc',
              boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)',
              border: 'none',
              position: 'relative',
              overflow: 'hidden',
              height: '100px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                  Total Publications
                </Typography>
                <ArticleIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {publications.length}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', fontSize: '0.7rem' }}>
                <Box component="span" sx={{ mr: 0.5, fontSize: '0.8rem' }}>📚</Box>
                All research outputs
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ 
              p: 2, 
              borderRadius: 2,
              bgcolor: '#8b6cbc',
              boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)',
              border: 'none',
              position: 'relative',
              overflow: 'hidden',
              height: '100px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                  With DOI
              </Typography>
                <LinkIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {publications.filter(pub => pub.doi && pub.doi.length > 0).length}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', fontSize: '0.7rem' }}>
                <Box component="span" sx={{ mr: 0.5, fontSize: '0.8rem' }}>🔗</Box>
                {publications.length > 0 ? Math.round((publications.filter(pub => pub.doi && pub.doi.length > 0).length / publications.length) * 100) : 0}% have DOI
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ 
              p: 2, 
              borderRadius: 2,
              bgcolor: '#8b6cbc',
              boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)',
              border: 'none',
              position: 'relative',
              overflow: 'hidden',
              height: '100px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                  Recent (6M)
              </Typography>
                <DateIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {publications.filter(pub => {
                  const pubDate = new Date(pub.createdAt);
                  const sixMonthsAgo = new Date();
                  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
                  return pubDate >= sixMonthsAgo;
                }).length}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', fontSize: '0.7rem' }}>
                <Box component="span" sx={{ mr: 0.5, fontSize: '0.8rem' }}>⏰</Box>
                Last 6 months
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ 
              p: 2, 
              borderRadius: 2,
              bgcolor: '#8b6cbc',
              boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)',
              border: 'none',
              position: 'relative',
              overflow: 'hidden',
              height: '100px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                  Most Common
              </Typography>
                <MetricsIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem', textTransform: 'capitalize' }}>
                {publications.length > 0 ? (() => {
                  const typeCounts = publications.reduce((acc, pub) => {
                    const type = pub.type || 'article';
                    acc[type] = (acc[type] || 0) + 1;
                    return acc;
                  }, {});
                  const mostCommon = Object.keys(typeCounts).reduce((a, b) => typeCounts[a] > typeCounts[b] ? a : b);
                  return mostCommon === 'article' ? 'Articles' : mostCommon === 'conference' ? 'Conf.' : mostCommon.charAt(0).toUpperCase() + mostCommon.slice(1);
                })() : 'N/A'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', fontSize: '0.7rem' }}>
                <Box component="span" sx={{ mr: 0.5, fontSize: '0.8rem' }}>📊</Box>
                Publication type
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Filter & Search Publications */}
        <Paper sx={{ p: 2.5, mb: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)' }}>
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <FilterIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
              Search & Filter
            </Typography>
          </Box>
          <Grid container spacing={2.5} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                placeholder="Search publications, authors, journals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#8b6cbc' }} />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#8b6cbc',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#8b6cbc',
                    },
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'text.secondary' }}>Publication Type</InputLabel>
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  label="Publication Type"
                  sx={{
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8b6cbc',
                    },
                  }}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="article">Journal Article</MenuItem>
                  <MenuItem value="conference">Conference Paper</MenuItem>
                  <MenuItem value="book">Book/Chapter</MenuItem>
                  <MenuItem value="report">Report</MenuItem>
                  <MenuItem value="thesis">Thesis</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'text.secondary' }}>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="Sort By"
                  sx={{
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8b6cbc',
                    },
                  }}
                >
                  <MenuItem value="date-desc">Newest First</MenuItem>
                  <MenuItem value="date-asc">Oldest First</MenuItem>
                  <MenuItem value="title">Title A-Z</MenuItem>
                  <MenuItem value="citations">Most Citations</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FilterIcon />}
                  onClick={clearFilters}
                  sx={{ 
                    borderColor: '#8b6cbc',
                    color: '#8b6cbc',
                    '&:hover': {
                      bgcolor: '#8b6cbc10',
                      borderColor: '#8b6cbc'
                    }
                  }}
                >
                  Clear Filters
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 4 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Publications List */}
        <Paper sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <Box sx={{ p: 2.5, bgcolor: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <ArticleIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem' }}>
                  Publications
            </Typography>
                <Chip 
                  label={filteredPublications.length}
                  size="small"
                  sx={{ 
                    bgcolor: '#8b6cbc',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: 20
                  }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                Showing {startIndex + 1}-{Math.min(endIndex, filteredPublications.length)} of {filteredPublications.length} publications
              </Typography>
            </Box>

            {loading ? (
              <Box sx={{ py: 4 }}>
                <LinearProgress sx={{ color: '#8b6cbc' }} />
                <Typography sx={{ textAlign: 'center', mt: 2 }}>
                  Loading publications...
                </Typography>
              </Box>
            ) : filteredPublications.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <ArticleIcon sx={{ fontSize: 80, color: '#e0e0e0', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No publications found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {searchQuery || typeFilter !== 'all'
                    ? 'Try adjusting your search filters'
                    : 'Start by importing publications from PubMed, Crossref, OpenAlex, or other sources'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  sx={{ bgcolor: '#8b6cbc', '&:hover': { bgcolor: '#7559a3' } }}
                    onClick={() => window.location.href = '/researcher/publications/submit'}
                  >
                    Import Publications
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    sx={{ borderColor: '#8b6cbc', color: '#8b6cbc', '&:hover': { bgcolor: '#8b6cbc10' } }}
                    onClick={() => window.location.href = '/researcher/publications/add-manual'}
                  >
                    Add Manually
                </Button>
              </Box>
              </Box>
            ) : viewType === 'table' ? (
              <>
                <PublicationsTable publications={currentPagePublications} />
                {/* Pagination */}
                {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, pt: 2, borderTop: '1px solid #eee' }}>
                  <Typography variant="body2" color="text.secondary">
                      Rows per page: {itemsPerPage}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        {startIndex + 1}-{Math.min(endIndex, filteredPublications.length)} of {filteredPublications.length}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton 
                          size="small" 
                          disabled={currentPage === 1}
                          onClick={() => handlePageChange(currentPage - 1)}
                          sx={{ color: currentPage === 1 ? '#ccc' : '#8b6cbc' }}
                        >
                        <Box sx={{ transform: 'rotate(180deg)' }}>▶</Box>
                      </IconButton>
                        <Typography variant="body2" sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          px: 1,
                          minWidth: 60,
                          justifyContent: 'center'
                        }}>
                          Page {currentPage} of {totalPages}
                        </Typography>
                        <IconButton 
                          size="small" 
                          disabled={currentPage === totalPages}
                          onClick={() => handlePageChange(currentPage + 1)}
                          sx={{ color: currentPage === totalPages ? '#ccc' : '#8b6cbc' }}
                        >
                        ▶
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
                )}
              </>
            ) : (
              <>
                <PublicationsCards publications={currentPagePublications} />
                {/* Pagination for Cards View */}
                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 4, pt: 3, borderTop: '1px solid #eee' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <IconButton 
                        size="small" 
                        disabled={currentPage === 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                        sx={{ 
                          color: currentPage === 1 ? '#ccc' : '#8b6cbc',
                          border: '1px solid',
                          borderColor: currentPage === 1 ? '#ccc' : '#8b6cbc'
                        }}
                      >
                        <Box sx={{ transform: 'rotate(180deg)' }}>▶</Box>
                      </IconButton>
                      <Typography variant="body2" sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        px: 2,
                        color: 'text.secondary'
                      }}>
                        Page {currentPage} of {totalPages} • {filteredPublications.length} total publications
                      </Typography>
                      <IconButton 
                        size="small" 
                        disabled={currentPage === totalPages}
                        onClick={() => handlePageChange(currentPage + 1)}
                        sx={{ 
                          color: currentPage === totalPages ? '#ccc' : '#8b6cbc',
                          border: '1px solid',
                          borderColor: currentPage === totalPages ? '#ccc' : '#8b6cbc'
                        }}
                      >
                        ▶
                      </IconButton>
                    </Box>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Paper>

        {/* Add to Library Dialog */}
        <Dialog
          open={libraryDialogOpen}
          onClose={() => {
            setLibraryDialogOpen(false);
            setSelectedFolder(null);
            setShowNewFolderInput(false);
            setNewFolderName('');
            setNewFolderParent(null);
            setLibraryViewMode('add');
          }}
          maxWidth="lg"
          fullWidth
          scroll="paper"
          disableScrollLock={true}
          sx={{
            '& .MuiDialog-paper': {
              margin: 2,
              height: '80vh',
              maxHeight: 700,
            }
          }}
        >
          <DialogTitle sx={{ bgcolor: '#8b6cbc', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LibraryAddIcon sx={{ mr: 1 }} />
              {libraryViewMode === 'add' ? 'Add to Library' : 'Library Browser'}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title="Create new folder at root">
                <IconButton
                  size="small"
                  onClick={() => {
                    setNewFolderParent(null);
                    setShowNewFolderInput(true);
                  }}
                  sx={{ color: 'white' }}
                >
                  <AddIcon />
                </IconButton>
              </Tooltip>
              <IconButton
                size="small"
                onClick={() => {
                  setLibraryDialogOpen(false);
                  setSelectedFolder(null);
                  setShowNewFolderInput(false);
                  setNewFolderName('');
                  setNewFolderParent(null);
                  setLibraryViewMode('add');
                }}
                sx={{ color: 'white' }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
            {/* Selected publication banner (only in add mode) */}
            {libraryViewMode === 'add' && selectedPublication && (
              <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0', flexShrink: 0 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Adding publication:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedPublication.title}
                </Typography>
              </Box>
            )}
            
            {/* Split panel layout */}
            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* Left panel - Folder tree */}
              <Box sx={{ 
                width: '40%', 
                borderRight: '1px solid #e0e0e0', 
                display: 'flex', 
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                <Box sx={{ p: 1.5, bgcolor: '#fafafa', borderBottom: '1px solid #e0e0e0', flexShrink: 0 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#333' }}>
                    Folders
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {folders.length} folder(s)
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
                  {renderFolderTree()}
                  
                  {showNewFolderInput && newFolderParent === null && (
                    <Box sx={{ px: 2, py: 1 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <TextField
                          size="small"
                          placeholder="New folder name"
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                          autoFocus
                          sx={{ flex: 1 }}
                        />
                        <IconButton size="small" onClick={handleCreateFolder} sx={{ color: '#4caf50' }}>
                          <CheckIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => {
                            setShowNewFolderInput(false);
                            setNewFolderName('');
                          }}
                          sx={{ color: '#f44336' }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
              
              {/* Right panel - Folder contents */}
              <Box sx={{ 
                width: '60%', 
                display: 'flex', 
                flexDirection: 'column',
                overflow: 'hidden',
                bgcolor: '#fafafa'
              }}>
                <Box sx={{ p: 1.5, bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0', flexShrink: 0 }}>
                  {selectedFolder ? (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FolderOpenIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#333' }}>
                          {folders.find(f => f.id === selectedFolder)?.name}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {getPublicationCount(selectedFolder)} publication(s) • {getSubfolderCount(selectedFolder)} subfolder(s)
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#333' }}>
                        Folder Contents
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Select a folder to view its contents
                      </Typography>
                    </>
                  )}
                </Box>
                
                <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                  {selectedFolder ? (
                    getPublicationsInFolder(selectedFolder).length > 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {getPublicationsInFolder(selectedFolder).map(pub => (
                          <Paper
                            key={pub.id}
                            sx={{
                              p: 2,
                              bgcolor: 'white',
                              borderRadius: 1,
                              border: '1px solid #e0e0e0',
                              '&:hover': {
                                borderColor: '#8b6cbc',
                                boxShadow: '0 2px 8px rgba(139, 108, 188, 0.1)'
                              }
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Box sx={{ flex: 1, pr: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, lineHeight: 1.3 }}>
                                  {pub.title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  {pub.authors.slice(0, 3).join(', ')}{pub.authors.length > 3 ? ' et al.' : ''}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {pub.journal} {pub.year && `(${pub.year})`}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Tooltip title="Move to another folder">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenMovePublication(pub, selectedFolder)}
                                    sx={{ 
                                      color: '#ff9800',
                                      '&:hover': { bgcolor: '#ff980010' }
                                    }}
                                  >
                                    <MoveIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Remove from folder">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleRemoveFromFolder(selectedFolder, pub.id)}
                                    sx={{ 
                                      color: '#f44336',
                                      '&:hover': { bgcolor: '#f4433610' }
                                    }}
                                  >
                                    <CloseIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Box>
                          </Paper>
                        ))}
                      </Box>
                    ) : (
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        height: '100%',
                        color: 'text.secondary'
                      }}>
                        <ArticleIcon sx={{ fontSize: 48, color: '#e0e0e0', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          No publications in this folder
                        </Typography>
                        {libraryViewMode === 'add' && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                            Click "Add to Folder" to add the selected publication
                          </Typography>
                        )}
                      </Box>
                    )
                  ) : (
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      height: '100%',
                      color: 'text.secondary'
                    }}>
                      <FolderOpenIcon sx={{ fontSize: 48, color: '#e0e0e0', mb: 1 }} />
                      <Typography variant="body2">
                        Select a folder from the left panel
                      </Typography>
                      <Typography variant="caption" sx={{ mt: 0.5 }}>
                        to view its contents
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <Box>
                {selectedFolder && (
                  <Typography variant="body2" color="text.secondary">
                    Selected: <strong>{folders.find(f => f.id === selectedFolder)?.name}</strong>
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  onClick={() => {
                    setLibraryDialogOpen(false);
                    setSelectedFolder(null);
                    setShowNewFolderInput(false);
                    setNewFolderName('');
                    setNewFolderParent(null);
                    setLibraryViewMode('add');
                  }}
                >
                  {libraryViewMode === 'add' ? 'Cancel' : 'Close'}
                </Button>
                {libraryViewMode === 'add' && (
                  <Button 
                    variant="contained" 
                    onClick={handleAddToSelectedFolder}
                    disabled={!selectedFolder}
                    sx={{ 
                      bgcolor: '#8b6cbc', 
                      '&:hover': { bgcolor: '#7559a3' },
                      '&:disabled': { bgcolor: '#ccc' }
                    }}
                  >
                    Add to Folder
                  </Button>
                )}
              </Box>
            </Box>
          </DialogActions>
        </Dialog>

        {/* Delete Folder Confirmation Dialog */}
        <Dialog
          open={deleteFolderDialogOpen}
          onClose={() => {
            setDeleteFolderDialogOpen(false);
            setFolderToDelete(null);
          }}
          maxWidth="xs"
          fullWidth
          disableScrollLock={true}
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#f44336' }}>
            <DeleteIcon />
            Delete Folder
          </DialogTitle>
          <DialogContent>
            {folderToDelete && (
              <Box>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Are you sure you want to delete the folder <strong>"{folderToDelete.name}"</strong>?
                </Typography>
                {getDescendantFolderIds(folderToDelete.id).length > 0 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    This folder contains {getDescendantFolderIds(folderToDelete.id).length} subfolder(s). 
                    All subfolders will also be deleted.
                  </Alert>
                )}
                <Typography variant="body2" color="text.secondary">
                  This action cannot be undone.
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={() => {
                setDeleteFolderDialogOpen(false);
                setFolderToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              color="error"
              onClick={handleConfirmDeleteFolder}
              startIcon={<DeleteIcon />}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Move Folder Dialog */}
        <Dialog
          open={moveFolderDialogOpen}
          onClose={() => {
            setMoveFolderDialogOpen(false);
            setFolderToMove(null);
            setMoveTargetFolder(null);
          }}
          maxWidth="sm"
          fullWidth
          disableScrollLock={true}
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#ff9800', color: 'white' }}>
            <MoveIcon />
            Move Folder
          </DialogTitle>
          <DialogContent dividers sx={{ p: 0 }}>
            {folderToMove && (
              <Box>
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Moving folder:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                    📁 {folderToMove.name}
                  </Typography>
                </Box>
                
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                    Select destination folder:
                  </Typography>
                  
                  {/* Root option */}
                  <Box
                    onClick={() => setMoveTargetFolder(null)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      py: 1.5,
                      px: 2,
                      cursor: 'pointer',
                      bgcolor: moveTargetFolder === null ? '#ff980015' : 'transparent',
                      borderLeft: moveTargetFolder === null ? '3px solid #ff9800' : '3px solid transparent',
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': {
                        bgcolor: '#ff980008'
                      }
                    }}
                  >
                    <Box sx={{ mr: 1.5 }}>🏠</Box>
                    <Typography variant="body2" sx={{ fontWeight: moveTargetFolder === null ? 600 : 400 }}>
                      Root Level (No Parent)
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  {/* Available folders */}
                  <Box sx={{ maxHeight: 250, overflow: 'auto' }}>
                    {getValidMoveTargets(folderToMove).length > 0 ? (
                      getValidMoveTargets(folderToMove).map(folder => {
                        const isSelected = moveTargetFolder === folder.id;
                        // Calculate indent level
                        let indent = 0;
                        let currentFolder = folder;
                        while (currentFolder.parent !== null) {
                          indent++;
                          currentFolder = folders.find(f => f.id === currentFolder.parent);
                          if (!currentFolder) break;
                        }
                        
                        return (
                          <Box
                            key={folder.id}
                            onClick={() => setMoveTargetFolder(folder.id)}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              py: 1,
                              px: 2,
                              pl: 2 + indent * 2,
                              cursor: 'pointer',
                              bgcolor: isSelected ? '#ff980015' : 'transparent',
                              borderLeft: isSelected ? '3px solid #ff9800' : '3px solid transparent',
                              '&:hover': {
                                bgcolor: '#ff980008'
                              }
                            }}
                          >
                            <Box sx={{ mr: 1, color: '#8b6cbc' }}>📁</Box>
                            <Typography variant="body2" sx={{ fontWeight: isSelected ? 600 : 400 }}>
                              {folder.name}
                            </Typography>
                          </Box>
                        );
                      })
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                        No valid destinations available. 
                        <br />
                        <Typography variant="caption">
                          Cannot move to self, descendants, or current parent.
                        </Typography>
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={() => {
                setMoveFolderDialogOpen(false);
                setFolderToMove(null);
                setMoveTargetFolder(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleConfirmMoveFolder}
              disabled={folderToMove && moveTargetFolder === folderToMove.parent}
              startIcon={<MoveIcon />}
              sx={{ 
                bgcolor: '#ff9800', 
                '&:hover': { bgcolor: '#f57c00' },
                '&:disabled': { bgcolor: '#ccc' }
              }}
            >
              Move Here
            </Button>
          </DialogActions>
        </Dialog>

        {/* Move Publication Dialog */}
        <Dialog
          open={movePublicationDialogOpen}
          onClose={() => {
            setMovePublicationDialogOpen(false);
            setPublicationToMove(null);
            setSourceFolderId(null);
            setTargetFolderForPub(null);
          }}
          maxWidth="sm"
          fullWidth
          disableScrollLock={true}
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#ff9800', color: 'white' }}>
            <MoveIcon />
            Move Publication
          </DialogTitle>
          <DialogContent dividers sx={{ p: 0 }}>
            {publicationToMove && (
              <Box>
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Moving publication:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {publicationToMove.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    From: <strong>{folders.find(f => f.id === sourceFolderId)?.name}</strong>
                  </Typography>
                </Box>
                
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                    Select destination folder:
                  </Typography>
                  
                  {/* Available folders (excluding source folder) */}
                  <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {folders
                      .filter(f => f.id !== sourceFolderId)
                      .map(folder => {
                        const isSelected = targetFolderForPub === folder.id;
                        // Calculate indent level
                        let indent = 0;
                        let currentFolder = folder;
                        while (currentFolder.parent !== null) {
                          indent++;
                          currentFolder = folders.find(f => f.id === currentFolder.parent);
                          if (!currentFolder) break;
                        }
                        
                        // Check if publication already exists in this folder
                        const alreadyInFolder = (folderPublications[folder.id] || []).includes(publicationToMove.id);
                        
                        return (
                          <Box
                            key={folder.id}
                            onClick={() => !alreadyInFolder && setTargetFolderForPub(folder.id)}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              py: 1,
                              px: 2,
                              pl: 2 + indent * 2,
                              cursor: alreadyInFolder ? 'not-allowed' : 'pointer',
                              bgcolor: isSelected ? '#ff980015' : 'transparent',
                              borderLeft: isSelected ? '3px solid #ff9800' : '3px solid transparent',
                              opacity: alreadyInFolder ? 0.5 : 1,
                              '&:hover': {
                                bgcolor: alreadyInFolder ? 'transparent' : '#ff980008'
                              }
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box sx={{ mr: 1, color: '#8b6cbc' }}>📁</Box>
                              <Typography variant="body2" sx={{ fontWeight: isSelected ? 600 : 400 }}>
                                {folder.name}
                              </Typography>
                            </Box>
                            {alreadyInFolder && (
                              <Chip 
                                label="Already here" 
                                size="small" 
                                sx={{ 
                                  height: 20, 
                                  fontSize: '0.65rem',
                                  bgcolor: '#e0e0e0',
                                  color: '#666'
                                }} 
                              />
                            )}
                            {getPublicationCount(folder.id) > 0 && !alreadyInFolder && (
                              <Typography variant="caption" color="text.secondary">
                                {getPublicationCount(folder.id)} items
                              </Typography>
                            )}
                          </Box>
                        );
                      })}
                  </Box>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={() => {
                setMovePublicationDialogOpen(false);
                setPublicationToMove(null);
                setSourceFolderId(null);
                setTargetFolderForPub(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleConfirmMovePublication}
              disabled={!targetFolderForPub}
              startIcon={<MoveIcon />}
              sx={{ 
                bgcolor: '#ff9800', 
                '&:hover': { bgcolor: '#f57c00' },
                '&:disabled': { bgcolor: '#ccc' }
              }}
            >
              Move Here
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Publication Dialog */}
        <Dialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          maxWidth="md"
          fullWidth
          scroll="paper"
          disableScrollLock={true}
          sx={{
            '& .MuiDialog-paper': {
              margin: 2,
            }
          }}
        >
          <DialogTitle sx={{ bgcolor: '#8b6cbc', color: 'white', display: 'flex', alignItems: 'center' }}>
            <ViewIcon sx={{ mr: 1 }} />
            Publication Details
          </DialogTitle>
          <DialogContent dividers>
            {selectedPublication && (
              <Box>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                  {selectedPublication.title}
                </Typography>
                
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid size={3}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Authors</Typography>
                  </Grid>
                  <Grid size={9}>
                    <Typography variant="body2">{selectedPublication.authors.join(', ')}</Typography>
                  </Grid>
                  
                  <Grid size={3}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Publication</Typography>
                  </Grid>
                  <Grid size={9}>
                    <Typography variant="body2">
                      {selectedPublication.journal}
                      {selectedPublication.year && ` (${selectedPublication.year})`}
                      {selectedPublication.volume && `, Vol. ${selectedPublication.volume}`}
                      {selectedPublication.pages && `, pp. ${selectedPublication.pages}`}
                </Typography>
                  </Grid>
                  
                  <Grid size={3}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Type</Typography>
                  </Grid>
                  <Grid size={9}>
                    <Typography variant="body2">{selectedPublication.type}</Typography>
                  </Grid>
                  
                  <Grid size={3}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Status</Typography>
                  </Grid>
                  <Grid size={9}>
                    <Chip 
                      label={selectedPublication.status.replace('-', ' ')} 
                      size="small"
                      sx={{ bgcolor: getStatusColor(selectedPublication.status), color: 'white' }}
                    />
                  </Grid>
                  
                  {selectedPublication.source && (
                    <>
                      <Grid size={3}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Source</Typography>
                      </Grid>
                      <Grid size={9}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getSourceIcon(selectedPublication.source)}
                          <Typography variant="body2" sx={{ ml: 0.5 }}>
                            Imported from {selectedPublication.source}
                </Typography>
                        </Box>
                      </Grid>
                    </>
                  )}
                  
                  {selectedPublication.doi && (
                    <>
                      <Grid size={3}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>DOI</Typography>
                      </Grid>
                      <Grid size={9}>
                        <Typography variant="body2">
                          <a 
                            href={`https://doi.org/${selectedPublication.doi}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: '#8b6cbc' }}
                          >
                            {selectedPublication.doi}
                          </a>
                </Typography>
                      </Grid>
                    </>
                  )}
                  
                  {selectedPublication.url && (
                    <>
                      <Grid size={3}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>URL</Typography>
                      </Grid>
                      <Grid size={9}>
                        <Typography variant="body2">
                          <a 
                            href={selectedPublication.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: '#8b6cbc' }}
                          >
                            View Publication
                          </a>
                </Typography>
                      </Grid>
                    </>
                  )}
                  
                  {selectedPublication.isbn && (
                    <>
                      <Grid size={3}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>ISBN</Typography>
                      </Grid>
                      <Grid size={9}>
                        <Typography variant="body2">{selectedPublication.isbn}</Typography>
                      </Grid>
                    </>
                  )}
                </Grid>

                {selectedPublication.abstract && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Abstract</Typography>
                    <Typography variant="body2" sx={{ 
                      textAlign: 'justify',
                      bgcolor: '#f5f5f5',
                      p: 2,
                      borderRadius: 1,
                      lineHeight: 1.6
                    }}>
                      {selectedPublication.abstract}
                  </Typography>
                  </Box>
                )}
                
                {selectedPublication.tags && selectedPublication.tags.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Keywords</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {selectedPublication.tags.map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          variant="outlined"
                          sx={{ borderColor: '#8b6cbc40', color: '#8b6cbc' }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'text.secondary' }}>
                  <Typography variant="body2">
                    Created: {selectedPublication.createdAt.toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2">
                    Updated: {selectedPublication.updatedAt.toLocaleDateString()}
                </Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
            <Button variant="contained" sx={{ bgcolor: '#8b6cbc', '&:hover': { bgcolor: '#7559a3' } }}>
              Edit Publication
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          scroll="paper"
          disableScrollLock={true}
          sx={{
            '& .MuiDialog-paper': {
              margin: 2,
            }
          }}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{selectedPublication?.title}"? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmDelete} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity} 
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}
