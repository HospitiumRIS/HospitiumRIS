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
    List,
    ListItem,
    ListItemText,
    Divider,
    Chip,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import {
    Close as CloseIcon,
    Download as ImportIcon,
    Visibility as VisibilityIcon,
    Folder as FolderIcon
} from '@mui/icons-material';
import LibrarySelectionModal from './LibrarySelectionModal';

/**
 * MultiPublicationPreviewDialog - Shows a list of selected publications for review before importing
 */
const MultiPublicationPreviewDialog = ({ 
    open, 
    onClose, 
    publications = [],
    onImport,
    onViewDetails,
    importing = false
}) => {
    const [selectedLibrary, setSelectedLibrary] = useState('');
    const [selectedLibraryName, setSelectedLibraryName] = useState('');
    const [libraryModalOpen, setLibraryModalOpen] = useState(false);

    // Reset state when dialog closes
    useEffect(() => {
        if (!open) {
            setSelectedLibrary('');
            setSelectedLibraryName('');
        }
    }, [open]);

    const handleLibrarySelect = (folderId, folderName) => {
        setSelectedLibrary(folderId);
        setSelectedLibraryName(folderName);
    };

    if (!publications || publications.length === 0) return null;

    const handleImport = async () => {
        if (onImport) {
            await onImport(publications, selectedLibrary);
        }
    };

    const formatAuthors = (authors) => {
        if (!authors || authors.length === 0) return 'Unknown Author';
        const authorList = authors.slice(0, 3).join(', ');
        return authors.length > 3 ? `${authorList} et al.` : authorList;
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { minHeight: '60vh', maxHeight: '80vh' }
            }}
        >
            <DialogTitle sx={{ 
                backgroundColor: '#8b6cbc', 
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                pb: 2
            }}>
                <Box>
                    <Typography variant="h6">
                        Preview Selected Publications
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        {publications.length} publication{publications.length !== 1 ? 's' : ''} ready to import
                    </Typography>
                </Box>
                <IconButton
                    onClick={onClose}
                    disabled={importing}
                    sx={{ color: 'white' }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
                <List sx={{ width: '100%' }}>
                    {publications.map((pub, index) => (
                        <React.Fragment key={pub.id || index}>
                            <ListItem
                                sx={{
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    py: 2,
                                    px: 3,
                                    '&:hover': {
                                        backgroundColor: 'rgba(139, 108, 188, 0.05)'
                                    }
                                }}
                            >
                                <Box sx={{ width: '100%', mb: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body1" sx={{ fontWeight: 600, flex: 1, pr: 2 }}>
                                            {index + 1}. {pub.title}
                                        </Typography>
                                        {onViewDetails && (
                                            <IconButton
                                                size="small"
                                                onClick={() => onViewDetails(pub)}
                                                sx={{ 
                                                    color: '#8b6cbc',
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(139, 108, 188, 0.1)'
                                                    }
                                                }}
                                                title="View full details"
                                            >
                                                <VisibilityIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                    </Box>
                                    
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        {formatAuthors(pub.authors)}
                                    </Typography>
                                    
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                                        <Chip 
                                            label={pub.year} 
                                            size="small" 
                                            sx={{ 
                                                backgroundColor: '#8b6cbc20',
                                                color: '#8b6cbc',
                                                fontWeight: 500
                                            }}
                                        />
                                        {pub.journal && (
                                            <Typography variant="caption" color="text.secondary">
                                                {pub.journal}
                                            </Typography>
                                        )}
                                        {pub.source && (
                                            <Chip 
                                                label={pub.source} 
                                                size="small"
                                                sx={{ 
                                                    backgroundColor: '#8b6cbc',
                                                    color: 'white',
                                                    fontWeight: 500
                                                }}
                                            />
                                        )}
                                    </Box>

                                    {pub.abstract && (
                                        <Typography 
                                            variant="caption" 
                                            color="text.secondary"
                                            sx={{ 
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                mt: 1,
                                                lineHeight: 1.4
                                            }}
                                        >
                                            {pub.abstract}
                                        </Typography>
                                    )}
                                </Box>
                            </ListItem>
                            {index < publications.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                </List>

                {/* Library Selection */}
                <Box sx={{ px: 3, pb: 2, pt: 2, backgroundColor: '#fafafa' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FolderIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#8b6cbc' }}>
                                Add to Library (Optional)
                            </Typography>
                        </Box>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<FolderIcon />}
                            onClick={() => setLibraryModalOpen(true)}
                            disabled={importing}
                            sx={{
                                borderColor: '#8b6cbc',
                                color: '#8b6cbc',
                                '&:hover': {
                                    borderColor: '#7b5ca7',
                                    backgroundColor: 'rgba(139, 108, 188, 0.08)'
                                }
                            }}
                        >
                            {selectedLibrary ? 'Change Folder' : 'Select Folder'}
                        </Button>
                    </Box>
                    {selectedLibrary ? (
                        <Box sx={{ 
                            p: 1.5, 
                            bgcolor: 'rgba(139, 108, 188, 0.08)', 
                            borderRadius: 1,
                            border: '1px solid rgba(139, 108, 188, 0.2)'
                        }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                                Selected: {selectedLibraryName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                All {publications.length} publication{publications.length !== 1 ? 's' : ''} will be imported and added to this library folder.
                            </Typography>
                        </Box>
                    ) : (
                        <Typography variant="caption" color="text.secondary">
                            Click "Select Folder" to add these publications to a library folder after import.
                        </Typography>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, backgroundColor: '#f5f5f5' }}>
                <Button 
                    onClick={onClose}
                    disabled={importing}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleImport}
                    disabled={importing}
                    startIcon={importing ? <CircularProgress size={16} /> : <ImportIcon />}
                    sx={{
                        backgroundColor: '#8b6cbc',
                        '&:hover': {
                            backgroundColor: '#7b5ca7'
                        }
                    }}
                >
                    {importing ? 'Importing...' : `Import ${publications.length} Publication${publications.length !== 1 ? 's' : ''}`}
                </Button>
            </DialogActions>

            {/* Library Selection Modal */}
            <LibrarySelectionModal
                open={libraryModalOpen}
                onClose={() => setLibraryModalOpen(false)}
                onSelect={(folderId) => {
                    // Fetch folder name
                    fetch('/api/publications/library')
                        .then(res => res.json())
                        .then(data => {
                            if (data.success && data.folders) {
                                const folder = data.folders.find(f => f.id === folderId);
                                if (folder) {
                                    handleLibrarySelect(folderId, folder.name);
                                }
                            }
                        });
                }}
                publicationTitle={null}
                multiplePublications={true}
                publicationCount={publications.length}
            />
        </Dialog>
    );
};

export default MultiPublicationPreviewDialog;
