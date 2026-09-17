'use client';

import { useTranslation } from 'react-i18next';
import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Button,
    Box,
    IconButton,
    Divider,
    Chip,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Stack
} from '@mui/material';
import {
    Close as CloseIcon,
    Download as ImportIcon,
    Visibility as VisibilityIcon,
    Folder as FolderIcon
} from '@mui/icons-material';
import LibrarySelectionModal from './LibrarySelectionModal';

const PURPLE = '#8b6cbc';

function folderLabel(folder, folders) {
    if (!folder) return '';
    const parent = folders.find((item) => item.id === folder.parent);
    return parent ? `${parent.name} / ${folder.name}` : folder.name;
}

/**
 * MultiPublicationPreviewDialog - Review selected publications and assign library folders
 */
const MultiPublicationPreviewDialog = ({
    open,
    onClose,
    publications = [],
    onImport,
    onViewDetails,
    importing = false
}) => {
    const { t } = useTranslation();
    const [folders, setFolders] = useState([]);
    const [defaultFolder, setDefaultFolder] = useState('');
    const [folderByPub, setFolderByPub] = useState({});
    const [libraryModalOpen, setLibraryModalOpen] = useState(false);
    const [folderTargetPubId, setFolderTargetPubId] = useState(null);

    useEffect(() => {
        if (!open) {
            setDefaultFolder('');
            setFolderByPub({});
            setFolderTargetPubId(null);
            return;
        }

        const loadFolders = async () => {
            try {
                const res = await fetch('/api/publications/library');
                const data = await res.json();
                if (data.success && data.folders) {
                    setFolders(data.folders);
                }
            } catch (error) {
                console.error('Error fetching folders:', error);
            }
        };

        loadFolders();
    }, [open]);

    const importable = useMemo(
        () => (publications || []).filter((pub) => !pub.inLibrary),
        [publications]
    );

    const alreadyInLibrary = (publications || []).length - importable.length;

    const resolvedFolder = (pubId) => folderByPub[pubId] || defaultFolder || '';

    const allHaveFolders = importable.length > 0 && importable.every((pub) => Boolean(resolvedFolder(pub.id)));

    const applyDefaultToAll = () => {
        if (!defaultFolder) return;
        const next = {};
        importable.forEach((pub) => {
            next[pub.id] = defaultFolder;
        });
        setFolderByPub(next);
    };

    const handleFolderChange = (pubId, folderId) => {
        setFolderByPub((prev) => ({ ...prev, [pubId]: folderId }));
    };

    const openFolderPicker = (pubId = null) => {
        setFolderTargetPubId(pubId);
        setLibraryModalOpen(true);
    };

    const handleLibrarySelect = (folderId) => {
        if (folderTargetPubId) {
            handleFolderChange(folderTargetPubId, folderId);
        } else {
            setDefaultFolder(folderId);
        }
        setFolderTargetPubId(null);
    };

    if (!publications || publications.length === 0) return null;

    const handleImport = async () => {
        if (!onImport) return;
        const assignments = {};
        importable.forEach((pub) => {
            assignments[pub.id] = resolvedFolder(pub.id);
        });
        await onImport(importable, defaultFolder || null, assignments);
    };

    const formatAuthors = (authors) => {
        if (!authors || authors.length === 0) return t('common.unknown_author');
        const authorList = authors.slice(0, 3).join(', ');
        return authors.length > 3 ? `${authorList} ${t('common.et_al')}` : authorList;
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { minHeight: '60vh', maxHeight: '85vh', borderRadius: 3, overflow: 'hidden' }
            }}
        >
            <DialogTitle sx={{
                background: 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 1.75,
                px: 2.5
            }}>
                <Box>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                        Review & import
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                        {importable.length} to import{alreadyInLibrary > 0 ? ` · ${alreadyInLibrary} already in library` : ''}
                    </Typography>
                </Box>
                <IconButton
                    onClick={onClose}
                    disabled={importing}
                    sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.16)', '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' } }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
                <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #eee', bgcolor: '#fafafa' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#1e293b' }}>
                        Library folders
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                        Choose a default folder, then override any paper that should go somewhere else.
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                        <FormControl size="small" sx={{ minWidth: 220, flex: 1 }}>
                            <InputLabel>Default folder</InputLabel>
                            <Select
                                value={defaultFolder}
                                label="Default folder"
                                onChange={(e) => setDefaultFolder(e.target.value)}
                                disabled={importing}
                            >
                                <MenuItem value="">Select a folder</MenuItem>
                                {folders.map((folder) => (
                                    <MenuItem key={folder.id} value={folder.id}>
                                        {folderLabel(folder, folders)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={applyDefaultToAll}
                            disabled={!defaultFolder || importing}
                            sx={{ borderColor: PURPLE, color: PURPLE, whiteSpace: 'nowrap' }}
                        >
                            Apply to all
                        </Button>
                        <Button
                            variant="text"
                            size="small"
                            startIcon={<FolderIcon />}
                            onClick={() => openFolderPicker(null)}
                            disabled={importing}
                            sx={{ color: PURPLE, whiteSpace: 'nowrap' }}
                        >
                            New folder
                        </Button>
                    </Stack>
                </Box>

                {importable.length === 0 && (
                    <Box sx={{ px: 3, py: 3 }}>
                        <Alert severity="info">All selected publications are already in your library.</Alert>
                    </Box>
                )}

                {publications.map((pub, index) => (
                    <React.Fragment key={pub.id || index}>
                        <Box sx={{ px: 3, py: 2, '&:hover': { bgcolor: 'rgba(139, 108, 188, 0.04)' } }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, flex: 1, color: '#1e293b' }}>
                                    {index + 1}. {pub.title}
                                </Typography>
                                {onViewDetails && (
                                    <IconButton
                                        size="small"
                                        onClick={() => onViewDetails(pub)}
                                        sx={{ color: PURPLE }}
                                        title={t('import_tabs.view_full_details')}
                                    >
                                        <VisibilityIcon fontSize="small" />
                                    </IconButton>
                                )}
                            </Box>

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {formatAuthors(pub.authors)}
                            </Typography>

                            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 1.25 }}>
                                {pub.year && (
                                    <Chip label={pub.year} size="small" sx={{ bgcolor: 'rgba(139, 108, 188, 0.12)', color: PURPLE }} />
                                )}
                                {pub.journal && (
                                    <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                                        {pub.journal}
                                    </Typography>
                                )}
                                {pub.inLibrary && (
                                    <Chip label="Already in library" size="small" sx={{ bgcolor: 'rgba(46, 125, 50, 0.12)', color: '#2e7d32', fontWeight: 600 }} />
                                )}
                                {pub.qualityScore != null && (
                                    <Chip label={`Quality ${pub.qualityScore}`} size="small" variant="outlined" sx={{ borderColor: 'rgba(139, 108, 188, 0.35)', color: PURPLE }} />
                                )}
                            </Stack>

                            {!pub.inLibrary && (
                                <FormControl size="small" fullWidth>
                                    <InputLabel>Save to folder</InputLabel>
                                    <Select
                                        value={resolvedFolder(pub.id)}
                                        label="Save to folder"
                                        onChange={(e) => handleFolderChange(pub.id, e.target.value)}
                                        disabled={importing}
                                    >
                                        <MenuItem value="">Select a folder</MenuItem>
                                        {folders.map((folder) => (
                                            <MenuItem key={folder.id} value={folder.id}>
                                                {folderLabel(folder, folders)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        </Box>
                        {index < publications.length - 1 && <Divider />}
                    </React.Fragment>
                ))}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f8f7fb', borderTop: '1px solid #eee' }}>
                <Button onClick={onClose} disabled={importing}>
                    {t('common.cancel')}
                </Button>
                <Button
                    variant="contained"
                    onClick={handleImport}
                    disabled={importing || importable.length === 0 || !allHaveFolders}
                    startIcon={importing ? <CircularProgress size={16} color="inherit" /> : <ImportIcon />}
                    sx={{ bgcolor: PURPLE, '&:hover': { bgcolor: '#7b5ca7' } }}
                >
                    {importing
                        ? t('import_tabs.importing')
                        : `Import ${importable.length} publication${importable.length === 1 ? '' : 's'}`}
                </Button>
            </DialogActions>

            <LibrarySelectionModal
                open={libraryModalOpen}
                onClose={() => setLibraryModalOpen(false)}
                onSelect={(folderId) => {
                    handleLibrarySelect(folderId);
                    fetch('/api/publications/library')
                        .then((res) => res.json())
                        .then((data) => {
                            if (data.success && data.folders) {
                                setFolders(data.folders);
                            }
                        });
                }}
                publicationTitle={null}
                multiplePublications={true}
                publicationCount={importable.length}
            />
        </Dialog>
    );
};

export default MultiPublicationPreviewDialog;
