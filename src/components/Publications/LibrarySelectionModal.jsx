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
    Paper
} from '@mui/material';
import {
    Close as CloseIcon,
    LibraryAdd as LibraryAddIcon,
    Add as AddIcon,
    Check as CheckIcon,
    FolderOpen as FolderOpenIcon,
    Folder as FolderIcon,
    ChevronRight as ChevronRightIcon,
    ExpandMore as ExpandMoreIcon
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
    publicationCount = 1
}) => {
    const [folders, setFolders] = useState([]);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [expandedFolders, setExpandedFolders] = useState({});
    const [showNewFolderInput, setShowNewFolderInput] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [newFolderParent, setNewFolderParent] = useState(null);
    const [loading, setLoading] = useState(false);

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
                    // Auto-expand all folders
                    const expanded = {};
                    data.folders.forEach(f => {
                        expanded[f.id] = true;
                    });
                    setExpandedFolders(expanded);
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
            handleClose();
        }
    };

    const handleClose = () => {
        setSelectedFolder(null);
        setShowNewFolderInput(false);
        setNewFolderName('');
        setNewFolderParent(null);
        onClose();
    };

    const renderFolderTree = (parentId = null, level = 0) => {
        const childFolders = folders.filter(f => f.parent === parentId);
        
        return childFolders.map(folder => {
            const hasChildren = folders.some(f => f.parent === folder.id);
            const isExpanded = expandedFolders[folder.id];
            const isSelected = selectedFolder === folder.id;

            return (
                <Box key={folder.id}>
                    <Box
                        onClick={() => setSelectedFolder(folder.id)}
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
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                flex: 1,
                                fontWeight: isSelected ? 600 : 400,
                                color: isSelected ? '#8b6cbc' : 'inherit'
                            }}
                        >
                            {folder.name}
                        </Typography>
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                setNewFolderParent(folder.id);
                                setShowNewFolderInput(true);
                            }}
                            sx={{ 
                                opacity: 0.5,
                                '&:hover': { opacity: 1 }
                            }}
                        >
                            <AddIcon fontSize="small" />
                        </IconButton>
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
                    Add to Library
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
                        onClick={handleClose}
                        sx={{ color: 'white' }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            
            <DialogContent dividers sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
                {/* Selected publication banner */}
                {publicationTitle && (
                    <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0', flexShrink: 0 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            {multiplePublications ? `Adding ${publicationCount} publications:` : 'Adding publication:'}
                        </Typography>
                        {!multiplePublications && (
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {publicationTitle}
                            </Typography>
                        )}
                    </Box>
                )}
                
                {/* Split panel layout */}
                <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    {/* Left panel - Folder tree */}
                    <Box sx={{ 
                        width: '100%', 
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
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f5f5f5' }}>
                <Button onClick={handleClose}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSelectFolder}
                    disabled={!selectedFolder}
                    sx={{
                        bgcolor: '#8b6cbc',
                        '&:hover': { bgcolor: '#7b5ca7' }
                    }}
                >
                    Add to Folder
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default LibrarySelectionModal;
