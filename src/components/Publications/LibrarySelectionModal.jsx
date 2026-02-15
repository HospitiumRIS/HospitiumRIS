'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Button,
    Box,
    IconButton,
    TextField,
    Tooltip,
    Paper,
    Divider,
    List,
    ListItem,
    ListItemText,
    Chip
} from '@mui/material';
import {
    Close as CloseIcon,
    LibraryAdd as LibraryAddIcon,
    Add as AddIcon,
    Check as CheckIcon,
    FolderOpen as FolderOpenIcon,
    Folder as FolderIcon,
    ChevronRight as ChevronRightIcon,
    ExpandMore as ExpandMoreIcon,
    Delete as DeleteIcon,
    DriveFileMove as MoveIcon
} from '@mui/icons-material';

/**
 * LibrarySelectionModal - Reusable modal for selecting library folders
 */
const LibrarySelectionModal = ({ 
    open, 
    onClose, 
    onSelect,
    publicationTitle = null,
    multiplePublications = false,
    publicationCount = 1,
    localFolderAssociations = {}
}) => {
    const [folders, setFolders] = useState([]);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [selectedFolderData, setSelectedFolderData] = useState(null);
    const [folderPublications, setFolderPublications] = useState([]);
    const [expandedFolders, setExpandedFolders] = useState({});
    const [showNewFolderInput, setShowNewFolderInput] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [newFolderParent, setNewFolderParent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingContents, setLoadingContents] = useState(false);
    const [moveDialogOpen, setMoveDialogOpen] = useState(false);
    const [publicationToMove, setPublicationToMove] = useState(null);
    const [targetFolder, setTargetFolder] = useState(null);

    useEffect(() => {
        if (open) {
            fetchFolders();
        }
    }, [open]);

    const fetchFolders = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/publications/library');
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.folders) {
                    setFolders(data.folders);
                    // Start with all folders collapsed
                    setExpandedFolders({});
                }
            }
        } catch (error) {
            console.error('Error fetching folders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;

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

            if (response.ok) {
                await fetchFolders();
                setShowNewFolderInput(false);
                setNewFolderName('');
                setNewFolderParent(null);
            }
        } catch (error) {
            console.error('Error creating folder:', error);
        }
    };

    const toggleFolder = (folderId) => {
        setExpandedFolders(prev => ({
            ...prev,
            [folderId]: !prev[folderId]
        }));
    };

    const handleSelectFolder = () => {
        if (selectedFolder && onSelect) {
            onSelect(selectedFolder);
            // Close modal after adding to folder
            onClose();
        }
    };

    const fetchFolderContents = async (folderId) => {
        setLoadingContents(true);
        try {
            const response = await fetch('/api/publications/library');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Get publication IDs for this folder
                    const publicationIds = data.folderPublications?.[folderId] || [];
                    
                    // Fetch full publication details if there are any
                    let dbPublications = [];
                    if (publicationIds.length > 0) {
                        // Fetch publications from the main publications API
                        const pubsResponse = await fetch('/api/publications');
                        if (pubsResponse.ok) {
                            const pubsData = await pubsResponse.json();
                            if (pubsData.success && pubsData.publications) {
                                // Filter to only publications in this folder
                                dbPublications = pubsData.publications.filter(pub => 
                                    publicationIds.includes(pub.id)
                                );
                            }
                        }
                    }
                    
                    // Merge with local folder associations
                    const localPubs = localFolderAssociations[folderId] || [];
                    
                    // Combine both, avoiding duplicates
                    const allPublications = [...dbPublications];
                    localPubs.forEach(localPub => {
                        if (!allPublications.some(pub => pub.id === localPub.id)) {
                            allPublications.push(localPub);
                        }
                    });
                    
                    setFolderPublications(allPublications);
                } else {
                    // If no DB data, just show local associations
                    const localPubs = localFolderAssociations[folderId] || [];
                    setFolderPublications(localPubs);
                }
            }
        } catch (error) {
            console.error('Error fetching folder contents:', error);
            // Fall back to local associations on error
            const localPubs = localFolderAssociations[folderId] || [];
            setFolderPublications(localPubs);
        } finally {
            setLoadingContents(false);
        }
    };

    const handleFolderClick = (folder) => {
        setSelectedFolder(folder.id);
        setSelectedFolderData(folder);
        fetchFolderContents(folder.id);
    };

    const handleClose = () => {
        setSelectedFolder(null);
        setShowNewFolderInput(false);
        setNewFolderName('');
        setNewFolderParent(null);
        setMoveDialogOpen(false);
        setPublicationToMove(null);
        setTargetFolder(null);
        onClose();
    };

    const handleRemovePublication = async (publication) => {
        if (!selectedFolder) return;

        try {
            // Check if publication exists in database
            const isInDatabase = !localFolderAssociations[selectedFolder]?.some(pub => pub.id === publication.id);

            if (isInDatabase) {
                // Remove from database
                const response = await fetch('/api/publications/library', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'removePublication',
                        folderId: selectedFolder,
                        publicationId: publication.id
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to remove publication from folder');
                }
            }

            // Refresh folder contents
            await fetchFolderContents(selectedFolder);
            await fetchFolders();
        } catch (error) {
            console.error('Error removing publication:', error);
        }
    };

    const handleOpenMoveDialog = (publication) => {
        setPublicationToMove(publication);
        setTargetFolder(null);
        setMoveDialogOpen(true);
    };

    const handleMovePublication = async () => {
        if (!selectedFolder || !targetFolder || !publicationToMove) return;

        try {
            // Check if publication is only in local state (not yet in database)
            const isLocalOnly = localFolderAssociations[selectedFolder]?.some(pub => pub.id === publicationToMove.id);

            if (!isLocalOnly) {
                // Publication is in database, move it via API
                const response = await fetch('/api/publications/library', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'movePublication',
                        sourceFolderId: selectedFolder,
                        targetFolderId: targetFolder,
                        publicationId: publicationToMove.id
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to move publication');
                }
            } else {
                // Publication is only in local state, update local associations
                // Remove from source folder
                const updatedSourcePubs = localFolderAssociations[selectedFolder].filter(
                    pub => pub.id !== publicationToMove.id
                );
                // Add to target folder
                const targetPubs = localFolderAssociations[targetFolder] || [];
                
                // Update parent component's local associations if callback provided
                // For now, just log that this is a local-only move
                console.log('Moving local publication from', selectedFolder, 'to', targetFolder);
            }

            // Refresh folder contents and close dialog
            await fetchFolderContents(selectedFolder);
            await fetchFolders();
            setMoveDialogOpen(false);
            setPublicationToMove(null);
            setTargetFolder(null);
        } catch (error) {
            console.error('Error moving publication:', error);
            alert(`Failed to move publication: ${error.message}`);
        }
    };

    const renderFolderTree = (parentId = null, level = 0) => {
        const childFolders = folders.filter(f => f.parent === parentId);
        
        return childFolders.map(folder => {
            const hasChildren = folders.some(f => f.parent === folder.id);
            const isExpanded = expandedFolders[folder.id];
            const isSelected = selectedFolder === folder.id;
            
            // Count subfolders and publications
            const subfolderCount = folders.filter(f => f.parent === folder.id).length;
            const dbPublicationCount = folder.publications ? folder.publications.length : 0;
            const localPublicationCount = localFolderAssociations[folder.id] ? localFolderAssociations[folder.id].length : 0;
            const publicationCount = dbPublicationCount + localPublicationCount;

            return (
                <Box key={folder.id}>
                    <Box
                        onClick={() => handleFolderClick(folder)}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            py: 0.75,
                            px: 2,
                            pl: 2 + level * 2,
                            cursor: 'pointer',
                            bgcolor: isSelected ? '#8b6cbc15' : 'transparent',
                            borderLeft: isSelected ? '3px solid #8b6cbc' : '3px solid transparent',
                            '&:hover': {
                                bgcolor: isSelected ? '#8b6cbc20' : '#f5f5f5'
                            }
                        }}
                    >
                        {hasChildren ? (
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFolder(folder.id);
                                }}
                                sx={{ mr: 0.5, p: 0.5 }}
                            >
                                {isExpanded ? 
                                    <ExpandMoreIcon fontSize="small" /> : 
                                    <ChevronRightIcon fontSize="small" />
                                }
                            </IconButton>
                        ) : (
                            <Box sx={{ width: 28 }} />
                        )}
                        <FolderIcon sx={{ fontSize: 18, color: isSelected ? '#8b6cbc' : '#666', mr: 1 }} />
                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography 
                                variant="body2" 
                                sx={{ 
                                    fontWeight: isSelected ? 600 : 400,
                                    color: isSelected ? '#8b6cbc' : 'inherit'
                                }}
                            >
                                {folder.name}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                {publicationCount > 0 && (
                                    <Chip 
                                        label={publicationCount}
                                        size="small"
                                        sx={{ 
                                            height: 18,
                                            fontSize: '0.7rem',
                                            bgcolor: isSelected ? '#8b6cbc' : '#e3f2fd',
                                            color: isSelected ? 'white' : '#1976d2',
                                            fontWeight: 600,
                                            '& .MuiChip-label': { px: 0.75 }
                                        }}
                                    />
                                )}
                                {subfolderCount > 0 && (
                                    <Chip 
                                        label={subfolderCount}
                                        size="small"
                                        icon={<FolderIcon sx={{ fontSize: 12, color: 'inherit !important' }} />}
                                        sx={{ 
                                            height: 18,
                                            fontSize: '0.7rem',
                                            bgcolor: isSelected ? 'rgba(139, 108, 188, 0.7)' : '#f5f5f5',
                                            color: isSelected ? 'white' : '#666',
                                            fontWeight: 600,
                                            '& .MuiChip-label': { px: 0.5 },
                                            '& .MuiChip-icon': { ml: 0.5 }
                                        }}
                                    />
                                )}
                            </Box>
                        </Box>
                        <Box 
                            className="folder-actions"
                            sx={{ 
                                display: 'flex', 
                                gap: 0.5, 
                                alignItems: 'center',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                '.MuiBox-root:hover &, &.selected': {
                                    opacity: 1
                                }
                            }}
                            className={isSelected ? 'selected' : ''}
                        >
                            <Tooltip title="Add subfolder">
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setNewFolderParent(folder.id);
                                        setShowNewFolderInput(true);
                                    }}
                                    sx={{ 
                                        color: '#8b6cbc',
                                        '&:hover': { bgcolor: 'rgba(139, 108, 188, 0.1)' },
                                        p: 0.5
                                    }}
                                >
                                    <AddIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Move folder">
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // TODO: Implement folder move functionality
                                    }}
                                    sx={{ 
                                        color: '#ff9800',
                                        '&:hover': { bgcolor: 'rgba(255, 152, 0, 0.1)' },
                                        p: 0.5
                                    }}
                                >
                                    <MoveIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete folder">
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // TODO: Implement delete functionality
                                    }}
                                    sx={{ 
                                        color: '#f44336',
                                        '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.1)' },
                                        p: 0.5
                                    }}
                                >
                                    <DeleteIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>
                    
                    {showNewFolderInput && newFolderParent === folder.id && (
                        <Box sx={{ px: 2, pl: 2 + (level + 1) * 2, py: 1 }}>
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
                                        setNewFolderParent(null);
                                    }}
                                    sx={{ color: '#f44336' }}
                                >
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </Box>
                    )}
                    
                    {hasChildren && isExpanded && renderFolderTree(folder.id, level + 1)}
                </Box>
            );
        });
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            scroll="paper"
            sx={{
                '& .MuiDialog-paper': {
                    height: '70vh',
                    maxHeight: 600,
                }
            }}
        >
            <DialogTitle sx={{ bgcolor: '#8b6cbc', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LibraryAddIcon sx={{ mr: 1 }} />
                    {publicationTitle ? 'Add to My Library' : 'Library Browser'}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Tooltip title="Create new folder">
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
                        onClick={handleClose}
                        sx={{ color: 'white' }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            
            <DialogContent dividers sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
                {/* Publication banner when adding */}
                {publicationTitle && (
                    <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderBottom: '1px solid #e0e0e0', flexShrink: 0 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            Adding publication:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {publicationTitle}
                        </Typography>
                    </Box>
                )}
                
                {/* Split panel layout */}
                <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', height: '100%' }}>
                    {/* Left panel - Folder tree */}
                    <Box sx={{ 
                        width: '40%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        overflow: 'hidden',
                        borderRight: '1px solid #e0e0e0'
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
                            {loading ? (
                                <Box sx={{ p: 3, textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Loading folders...
                                    </Typography>
                                </Box>
                            ) : folders.length === 0 ? (
                                <Box sx={{ p: 3, textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        No folders yet. Create one to get started.
                                    </Typography>
                                </Box>
                            ) : (
                                renderFolderTree()
                            )}
                            
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
                        <Box sx={{ p: 1.5, bgcolor: '#fafafa', borderBottom: '1px solid #e0e0e0', flexShrink: 0 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#333' }}>
                                Folder Contents
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {selectedFolderData ? `Select a folder to view its contents` : 'Select a folder to view its contents'}
                            </Typography>
                        </Box>
                        <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {!selectedFolder ? (
                                <Box sx={{ textAlign: 'center', p: 4 }}>
                                    <FolderOpenIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                        Select a folder from the left panel
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        to view its contents
                                    </Typography>
                                </Box>
                            ) : loadingContents ? (
                                <Box sx={{ textAlign: 'center', p: 4 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Loading contents...
                                    </Typography>
                                </Box>
                            ) : folderPublications.length === 0 ? (
                                <Box sx={{ textAlign: 'center', p: 4 }}>
                                    <FolderOpenIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                        No publications in this folder
                                    </Typography>
                                    {publicationTitle && (
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                            Click "Add to Folder" to add the selected publication
                                        </Typography>
                                    )}
                                </Box>
                            ) : (
                                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {folderPublications.map((pub) => (
                                        <Paper
                                            key={pub.id}
                                            elevation={0}
                                            sx={{
                                                p: 2,
                                                border: '1px solid #e0e0e0',
                                                borderRadius: 1,
                                                transition: 'all 0.2s',
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
                                                        {(() => {
                                                            const authors = Array.isArray(pub.authors) 
                                                                ? pub.authors 
                                                                : (pub.authors ? [pub.authors] : []);
                                                            return authors.length > 0 
                                                                ? authors.slice(0, 3).join(', ') + (authors.length > 3 ? ' et al.' : '')
                                                                : 'Unknown authors';
                                                        })()}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {pub.journal || 'Unknown journal'} {pub.year && `(${pub.year})`}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    <Tooltip title="Move to another folder">
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenMoveDialog(pub);
                                                            }}
                                                            sx={{ 
                                                                color: '#ff9800',
                                                                '&:hover': { bgcolor: 'rgba(255, 152, 0, 0.1)' }
                                                            }}
                                                        >
                                                            <MoveIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Remove from folder">
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRemovePublication(pub);
                                                            }}
                                                            sx={{ 
                                                                color: '#f44336',
                                                                '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.1)' }
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
                            )}
                        </Box>
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f5f5f5', justifyContent: 'flex-end' }}>
                {publicationTitle ? (
                    <>
                        <Button 
                            onClick={handleClose}
                            sx={{ color: '#8b6cbc' }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSelectFolder}
                            disabled={!selectedFolder}
                            sx={{
                                bgcolor: '#8b6cbc',
                                '&:hover': { bgcolor: '#7b5ca7' },
                                '&.Mui-disabled': {
                                    bgcolor: 'rgba(139, 108, 188, 0.3)',
                                    color: 'rgba(255, 255, 255, 0.5)'
                                }
                            }}
                        >
                            Add to My Library
                        </Button>
                    </>
                ) : (
                    <Button 
                        onClick={handleClose}
                        variant="contained"
                        sx={{ 
                            bgcolor: '#8b6cbc',
                            '&:hover': { bgcolor: '#7b5ca7' }
                        }}
                    >
                        Close
                    </Button>
                )}
            </DialogActions>

            {/* Move Publication Dialog */}
            <Dialog
                open={moveDialogOpen}
                onClose={() => setMoveDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ bgcolor: '#8b6cbc', color: 'white' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MoveIcon />
                        <Typography variant="h6">Move Publication</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    {publicationToMove && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                Moving publication:
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {publicationToMove.title}
                            </Typography>
                        </Box>
                    )}
                    
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                        Select target folder:
                    </Typography>
                    
                    <Box sx={{ 
                        border: '1px solid #e0e0e0', 
                        borderRadius: 1, 
                        maxHeight: 300, 
                        overflow: 'auto',
                        bgcolor: '#fafafa'
                    }}>
                        {folders.filter(f => f.id !== selectedFolder).map(folder => (
                            <Box
                                key={folder.id}
                                onClick={() => setTargetFolder(folder.id)}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    py: 1.5,
                                    px: 2,
                                    cursor: 'pointer',
                                    bgcolor: targetFolder === folder.id ? '#8b6cbc15' : 'transparent',
                                    borderLeft: targetFolder === folder.id ? '3px solid #8b6cbc' : '3px solid transparent',
                                    '&:hover': {
                                        bgcolor: targetFolder === folder.id ? '#8b6cbc20' : '#f5f5f5'
                                    }
                                }}
                            >
                                <FolderIcon sx={{ fontSize: 18, color: targetFolder === folder.id ? '#8b6cbc' : '#666', mr: 1 }} />
                                <Typography 
                                    variant="body2" 
                                    sx={{ 
                                        fontWeight: targetFolder === folder.id ? 600 : 400,
                                        color: targetFolder === folder.id ? '#8b6cbc' : 'inherit'
                                    }}
                                >
                                    {folder.name}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setMoveDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleMovePublication}
                        disabled={!targetFolder}
                        sx={{
                            bgcolor: '#8b6cbc',
                            '&:hover': { bgcolor: '#7b5ca7' },
                            '&.Mui-disabled': {
                                bgcolor: 'rgba(139, 108, 188, 0.3)',
                                color: 'rgba(255, 255, 255, 0.5)'
                            }
                        }}
                    >
                        Move
                    </Button>
                </DialogActions>
            </Dialog>
        </Dialog>
    );
};

export default LibrarySelectionModal;
